import { randomUUID } from "node:crypto";
import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { BuyInDto, PlayerDto, RoomDto, RoomSettingsDto, SeatOfferDto } from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { commandResult, type CommandResult } from "./command-events.js";
import { RealtimeService } from "./realtime.service.js";
import { createInviteCode, normalizeRoomSettings, type RoomRecord, toRoomDto } from "./room-record.js";
import * as tableSeating from "./table-seating.js";

@Injectable()
export class LobbyStore {
  private readonly rooms = new Map<string, RoomRecord>();
  private readonly roomIdByInviteCode = new Map<string, string>();
  private readonly activeRoomIdByPlayerId = new Map<string, string>();
  private readonly roomIdByBuyInId = new Map<string, string>();
  private readonly roomIdBySeatOfferId = new Map<string, string>();

  constructor(
    @Inject(RealtimeService) private readonly realtime: RealtimeService,
    @Inject(SessionStore) sessions: SessionStore,
  ) {
    sessions.onPlayerForgotten((playerId) => this.activeRoomIdByPlayerId.delete(playerId));
  }

  createRoom(host: PlayerDto, settings: RoomSettingsDto): RoomDto {
    this.assertNoActiveRoom(host.id);
    const normalized = normalizeRoomSettings(settings);
    const inviteCode = createInviteCode();
    const room: RoomRecord = {
      id: randomUUID(),
      hostPlayerId: host.id,
      tableId: randomUUID(),
      inviteCode,
      settings: normalized,
      hasStarted: false,
      joinedPlayerIds: new Set([host.id]),
      players: [{ playerId: host.id, displayName: host.displayName, role: "host" }],
      buyIns: [],
      seats: Array.from({ length: normalized.seatCount }, (_, index) => ({
        seatNumber: index + 1,
        playerId: null,
        tableStack: null,
      })),
      waitlist: [],
      seatOffers: [],
    };

    this.rooms.set(room.id, room);
    this.roomIdByInviteCode.set(inviteCode, room.id);
    this.activeRoomIdByPlayerId.set(host.id, room.id);
    return this.commit(commandResult(toRoomDto(room), [{ type: "player.updated", playerId: host.id }]));
  }

  playerCanAccessRoom(playerId: string, roomId: string): boolean {
    return this.rooms.get(roomId)?.joinedPlayerIds.has(playerId) ?? false;
  }

  currentRoom(player: PlayerDto): RoomDto {
    const roomId = this.activeRoomIdByPlayerId.get(player.id);
    if (!roomId) throw new NotFoundException({ code: "ROOM_NOT_FOUND", message: "The Player is not participating in an active Room." });
    return this.getRoom(roomId);
  }

  getRoom(roomId: string): RoomDto {
    const room = this.rooms.get(roomId);
    if (!room) throw new NotFoundException({ code: "ROOM_NOT_FOUND", message: "Room was not found." });
    return toRoomDto(room);
  }

  previewInvite(inviteCode: string): RoomDto {
    const roomId = this.roomIdByInviteCode.get(inviteCode);
    if (!roomId) throw new NotFoundException({ code: "INVITE_LINK_NOT_FOUND", message: "Invite Link is invalid or expired." });
    return this.getRoom(roomId);
  }

  joinInvite(player: PlayerDto, inviteCode: string): RoomDto {
    this.assertNoActiveRoom(player.id);
    const roomId = this.roomIdByInviteCode.get(inviteCode);
    if (!roomId) throw new NotFoundException({ code: "INVITE_LINK_NOT_FOUND", message: "Invite Link is invalid or expired." });

    const room = this.requireRoom(roomId);
    room.joinedPlayerIds.add(player.id);
    room.players.push({ playerId: player.id, displayName: player.displayName, role: "player" });
    this.activeRoomIdByPlayerId.set(player.id, room.id);
    const dto = toRoomDto(room);
    return this.commit(commandResult(dto, [
      { type: "player.updated", playerId: player.id },
      { type: "room.updated", room: dto },
    ]));
  }

  updateSettings(actor: PlayerDto, roomId: string, patch: Partial<RoomSettingsDto>): RoomDto {
    const room = this.requireRoom(roomId);
    this.assertHost(actor, room);

    if (room.hasStarted && Object.keys(patch).some((key) => key !== "name")) {
      throw new BadRequestException({ code: "ROOM_SETTINGS_LOCKED", message: "Only the Room name can change after the first Hand starts." });
    }

    const next = normalizeRoomSettings({ ...room.settings, ...patch });
    room.settings = next;
    if (room.seats.length !== next.seatCount) {
      room.seats = Array.from({ length: next.seatCount }, (_, index) => room.seats[index] ?? {
        seatNumber: index + 1,
        playerId: null,
        tableStack: null,
      });
    }
    const dto = toRoomDto(room);
    return this.commit(commandResult(dto, [{ type: "room.updated", room: dto }]));
  }

  rotateInvite(actor: PlayerDto, roomId: string): RoomDto {
    const room = this.requireRoom(roomId);
    this.assertHost(actor, room);

    this.roomIdByInviteCode.delete(room.inviteCode);
    room.inviteCode = createInviteCode();
    this.roomIdByInviteCode.set(room.inviteCode, room.id);
    const dto = toRoomDto(room);
    return this.commit(commandResult(dto, [{ type: "room.updated", room: dto }]));
  }

  requestBuyIn(player: PlayerDto, roomId: string, amount: number): BuyInDto {
    const room = this.requireJoinedRoom(player, roomId);
    if (amount < room.settings.buyInMin || amount > room.settings.buyInMax) {
      throw new BadRequestException({ code: "BUY_IN_OUT_OF_RANGE", message: "Buy-In amount must be within the Room's allowed range." });
    }

    const buyIn: BuyInDto = {
      id: randomUUID(),
      roomId,
      playerId: player.id,
      amount,
      status: "pending",
    };
    room.buyIns.push(buyIn);
    this.roomIdByBuyInId.set(buyIn.id, room.id);
    return this.commit(commandResult({ ...buyIn }, [{ type: "room.updated", room: toRoomDto(room) }]));
  }

  approveBuyIn(actor: PlayerDto, buyInId: string): BuyInDto {
    const { room, buyIn } = this.requireBuyIn(buyInId);
    this.assertHost(actor, room);
    buyIn.status = "host-verified";
    return this.commit(commandResult({ ...buyIn }, [{ type: "room.updated", room: toRoomDto(room) }]));
  }

  rejectBuyIn(actor: PlayerDto, buyInId: string): BuyInDto {
    const { room, buyIn } = this.requireBuyIn(buyInId);
    this.assertHost(actor, room);
    buyIn.status = "rejected";
    return this.commit(commandResult({ ...buyIn }, [{ type: "room.updated", room: toRoomDto(room) }]));
  }

  claimSeat(player: PlayerDto, roomId: string, seatNumber: number): RoomDto {
    const room = this.requireJoinedRoom(player, roomId);
    return this.commit(tableSeating.claimSeat(player, room, seatNumber));
  }

  leaveSeat(player: PlayerDto, roomId: string): RoomDto {
    const room = this.requireJoinedRoom(player, roomId);
    return this.commit(tableSeating.leaveSeat(player, room));
  }

  joinWaitlist(player: PlayerDto, roomId: string): RoomDto {
    const room = this.requireJoinedRoom(player, roomId);
    return this.commit(tableSeating.joinWaitlist(player, room));
  }

  leaveWaitlist(player: PlayerDto, roomId: string): RoomDto {
    const room = this.requireJoinedRoom(player, roomId);
    return this.commit(tableSeating.leaveWaitlist(player, room));
  }

  acceptSeatOffer(player: PlayerDto, seatOfferId: string): RoomDto {
    const { room, offer } = this.requireSeatOffer(seatOfferId);
    return this.commit(tableSeating.acceptSeatOffer(player, room, offer));
  }

  declineSeatOffer(player: PlayerDto, seatOfferId: string): SeatOfferDto {
    const { room, offer } = this.requireSeatOffer(seatOfferId);
    return this.commit(tableSeating.declineSeatOffer(player, room, offer));
  }

  expireSeatOffer(seatOfferId: string): SeatOfferDto {
    const { room, offer } = this.requireSeatOffer(seatOfferId);
    return this.commit(tableSeating.expireSeatOffer(room, offer));
  }

  private requireJoinedRoom(player: PlayerDto, roomId: string): RoomRecord {
    const room = this.requireRoom(roomId);
    if (!room.joinedPlayerIds.has(player.id)) {
      throw new ForbiddenException({ code: "ROOM_ACCESS_REQUIRED", message: "Join the Room before using this command." });
    }
    return room;
  }

  private requireBuyIn(buyInId: string): { room: RoomRecord; buyIn: BuyInDto } {
    const roomId = this.roomIdByBuyInId.get(buyInId);
    const room = roomId ? this.rooms.get(roomId) : undefined;
    const buyIn = room?.buyIns.find((candidate) => candidate.id === buyInId);
    if (!room || !buyIn) {
      throw new NotFoundException({ code: "BUY_IN_NOT_FOUND", message: "Buy-In was not found." });
    }
    return { room, buyIn };
  }

  private requireSeatOffer(seatOfferId: string): { room: RoomRecord; offer: SeatOfferDto } {
    const roomId = this.roomIdBySeatOfferId.get(seatOfferId);
    const room = roomId ? this.rooms.get(roomId) : undefined;
    const offer = room?.seatOffers.find((candidate) => candidate.id === seatOfferId);
    if (!room || !offer) {
      throw new NotFoundException({ code: "SEAT_OFFER_NOT_FOUND", message: "Seat Offer was not found." });
    }
    return { room, offer };
  }

  private requireRoom(roomId: string): RoomRecord {
    const room = this.rooms.get(roomId);
    if (!room) throw new NotFoundException({ code: "ROOM_NOT_FOUND", message: "Room was not found." });
    return room;
  }

  private assertNoActiveRoom(playerId: string): void {
    if (this.activeRoomIdByPlayerId.has(playerId)) {
      throw new BadRequestException({ code: "ONE_ACTIVE_ROOM", message: "A Player may participate in at most one active Room." });
    }
  }

  private assertHost(actor: PlayerDto, room: RoomRecord): void {
    if (room.hostPlayerId !== actor.id) {
      throw new ForbiddenException({ code: "ROOM_HOST_REQUIRED", message: "Only the Room Host can perform this command." });
    }
  }

  private commit<T>(result: CommandResult<T>): T {
    for (const event of result.events) {
      if (event.type === "seatOffer.created") {
        this.roomIdBySeatOfferId.set(event.seatOfferId, event.roomId);
      }
      this.realtime.emit(event);
    }
    return result.value;
  }
}
