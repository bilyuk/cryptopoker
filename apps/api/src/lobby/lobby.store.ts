import { randomBytes, randomUUID } from "node:crypto";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { BuyInDto, PlayerDto, RoomDto, RoomSettingsDto, SeatOfferDto, WaitlistEntryDto } from "@cryptopoker/contracts";
import { SessionStore } from "../sessions/session.store.js";
import { RealtimeService } from "./realtime.service.js";

type RoomRecord = RoomDto & {
  joinedPlayerIds: Set<string>;
};

@Injectable()
export class LobbyStore {
  private readonly rooms = new Map<string, RoomRecord>();
  private readonly roomIdByInviteCode = new Map<string, string>();
  private readonly activeRoomIdByPlayerId = new Map<string, string>();

  constructor(
    private readonly sessions: SessionStore,
    private readonly realtime: RealtimeService,
  ) {}

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
    this.realtime.emitPlayerUpdated(host.id);
    return toRoomDto(room);
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
    this.realtime.emitPlayerUpdated(player.id);
    this.realtime.emitRoomUpdated(room.id);
    return toRoomDto(room);
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
    this.realtime.emitRoomUpdated(room.id);
    return toRoomDto(room);
  }

  rotateInvite(actor: PlayerDto, roomId: string): RoomDto {
    const room = this.requireRoom(roomId);
    this.assertHost(actor, room);

    this.roomIdByInviteCode.delete(room.inviteCode);
    room.inviteCode = createInviteCode();
    this.roomIdByInviteCode.set(room.inviteCode, room.id);
    this.realtime.emitRoomUpdated(room.id);
    return toRoomDto(room);
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
    this.realtime.emitBuyInUpdated(room.id, buyIn.id);
    return { ...buyIn };
  }

  approveBuyIn(actor: PlayerDto, buyInId: string): BuyInDto {
    const { room, buyIn } = this.requireBuyIn(buyInId);
    this.assertHost(actor, room);
    buyIn.status = "host-verified";
    this.realtime.emitBuyInUpdated(room.id, buyIn.id);
    return { ...buyIn };
  }

  rejectBuyIn(actor: PlayerDto, buyInId: string): BuyInDto {
    const { room, buyIn } = this.requireBuyIn(buyInId);
    this.assertHost(actor, room);
    buyIn.status = "rejected";
    this.realtime.emitBuyInUpdated(room.id, buyIn.id);
    return { ...buyIn };
  }

  claimSeat(player: PlayerDto, roomId: string, seatNumber: number): RoomDto {
    const room = this.requireJoinedRoom(player, roomId);
    this.assertVerifiedBuyIn(room, player.id);
    if (room.seats.some((seat) => seat.playerId === player.id)) {
      throw new BadRequestException({ code: "PLAYER_ALREADY_SEATED", message: "A Player cannot occupy more than one Seat in the Room." });
    }

    const seat = room.seats.find((candidate) => candidate.seatNumber === seatNumber);
    if (!seat) throw new BadRequestException({ code: "SEAT_NOT_FOUND", message: "Seat does not exist in this Room." });
    if (seat.playerId) throw new BadRequestException({ code: "SEAT_OCCUPIED", message: "Seat is already occupied." });

    seat.playerId = player.id;
    seat.tableStack = this.verifiedStack(room, player.id);
    room.waitlist = room.waitlist.filter((entry) => entry.playerId !== player.id);
    this.realtime.emitSeatUpdated(room.id);
    return toRoomDto(room);
  }

  leaveSeat(player: PlayerDto, roomId: string): RoomDto {
    const room = this.requireJoinedRoom(player, roomId);
    const seat = room.seats.find((candidate) => candidate.playerId === player.id);
    if (!seat) throw new BadRequestException({ code: "PLAYER_NOT_SEATED", message: "The Player does not occupy a Seat in this Room." });

    seat.playerId = null;
    seat.tableStack = null;
    this.offerNextSeat(room, seat.seatNumber);
    this.realtime.emitSeatUpdated(room.id);
    return toRoomDto(room);
  }

  joinWaitlist(player: PlayerDto, roomId: string): RoomDto {
    const room = this.requireJoinedRoom(player, roomId);
    this.assertVerifiedBuyIn(room, player.id);
    if (room.seats.some((seat) => seat.playerId === player.id)) {
      throw new BadRequestException({ code: "PLAYER_ALREADY_SEATED", message: "A seated Player cannot join the Waitlist." });
    }
    if (room.seats.some((seat) => !seat.playerId)) {
      throw new BadRequestException({ code: "SEAT_AVAILABLE", message: "A Player can claim an open Seat instead of joining the Waitlist." });
    }
    if (!room.waitlist.some((entry) => entry.playerId === player.id)) {
      room.waitlist.push({ playerId: player.id, position: room.waitlist.length + 1 });
    }
    this.realtime.emitWaitlistUpdated(room.id);
    return toRoomDto(room);
  }

  leaveWaitlist(player: PlayerDto, roomId: string): RoomDto {
    const room = this.requireJoinedRoom(player, roomId);
    room.waitlist = room.waitlist.filter((entry) => entry.playerId !== player.id);
    resequenceWaitlist(room.waitlist);
    this.realtime.emitWaitlistUpdated(room.id);
    return toRoomDto(room);
  }

  acceptSeatOffer(player: PlayerDto, seatOfferId: string): RoomDto {
    const { room, offer } = this.requireSeatOffer(seatOfferId);
    if (offer.playerId !== player.id) throw new ForbiddenException({ code: "SEAT_OFFER_NOT_FOR_PLAYER", message: "Seat Offer belongs to another Player." });
    if (offer.status !== "pending") throw new BadRequestException({ code: "SEAT_OFFER_NOT_PENDING", message: "Seat Offer is no longer pending." });
    this.assertVerifiedBuyIn(room, player.id);

    const seat = room.seats.find((candidate) => candidate.seatNumber === offer.seatNumber);
    if (!seat || seat.playerId) throw new BadRequestException({ code: "SEAT_OFFER_STALE", message: "Seat Offer can no longer be accepted." });

    offer.status = "accepted";
    seat.playerId = player.id;
    seat.tableStack = this.verifiedStack(room, player.id);
    room.waitlist = room.waitlist.filter((entry) => entry.playerId !== player.id);
    resequenceWaitlist(room.waitlist);
    this.realtime.emitSeatOfferUpdated(room.id, player.id, offer.id);
    this.realtime.emitSeatUpdated(room.id);
    return toRoomDto(room);
  }

  declineSeatOffer(player: PlayerDto, seatOfferId: string): SeatOfferDto {
    const { room, offer } = this.requireSeatOffer(seatOfferId);
    if (offer.playerId !== player.id) throw new ForbiddenException({ code: "SEAT_OFFER_NOT_FOR_PLAYER", message: "Seat Offer belongs to another Player." });
    offer.status = "declined";
    removeFromWaitlist(room, offer.playerId);
    this.offerNextSeat(room, offer.seatNumber);
    this.realtime.emitSeatOfferUpdated(room.id, offer.playerId, offer.id);
    return { ...offer };
  }

  expireSeatOffer(seatOfferId: string): SeatOfferDto {
    const { room, offer } = this.requireSeatOffer(seatOfferId);
    offer.status = "expired";
    removeFromWaitlist(room, offer.playerId);
    this.offerNextSeat(room, offer.seatNumber);
    this.realtime.emitSeatOfferUpdated(room.id, offer.playerId, offer.id);
    return { ...offer };
  }

  private requireJoinedRoom(player: PlayerDto, roomId: string): RoomRecord {
    const room = this.requireRoom(roomId);
    if (!room.joinedPlayerIds.has(player.id)) {
      throw new ForbiddenException({ code: "ROOM_ACCESS_REQUIRED", message: "Join the Room before using this command." });
    }
    return room;
  }

  private requireBuyIn(buyInId: string): { room: RoomRecord; buyIn: BuyInDto } {
    for (const room of this.rooms.values()) {
      const buyIn = room.buyIns.find((candidate) => candidate.id === buyInId);
      if (buyIn) return { room, buyIn };
    }
    throw new NotFoundException({ code: "BUY_IN_NOT_FOUND", message: "Buy-In was not found." });
  }

  private requireSeatOffer(seatOfferId: string): { room: RoomRecord; offer: SeatOfferDto } {
    for (const room of this.rooms.values()) {
      const offer = room.seatOffers.find((candidate) => candidate.id === seatOfferId);
      if (offer) return { room, offer };
    }
    throw new NotFoundException({ code: "SEAT_OFFER_NOT_FOUND", message: "Seat Offer was not found." });
  }

  private assertVerifiedBuyIn(room: RoomRecord, playerId: string): void {
    if (!room.buyIns.some((buyIn) => buyIn.playerId === playerId && buyIn.status === "host-verified")) {
      throw new BadRequestException({ code: "HOST_VERIFIED_BUY_IN_REQUIRED", message: "A Host-Verified Buy-In is required first." });
    }
  }

  private verifiedStack(room: RoomRecord, playerId: string): number {
    return room.buyIns
      .filter((buyIn) => buyIn.playerId === playerId && buyIn.status === "host-verified")
      .reduce((total, buyIn) => total + buyIn.amount, 0);
  }

  private offerNextSeat(room: RoomRecord, seatNumber: number): void {
    const next = room.waitlist.find((entry) => {
      return !room.seatOffers.some((offer) => offer.playerId === entry.playerId && offer.status === "pending");
    });
    if (!next) return;

    const offer = {
      id: randomUUID(),
      roomId: room.id,
      playerId: next.playerId,
      seatNumber,
      status: "pending",
    } satisfies SeatOfferDto;
    room.seatOffers.push(offer);
    this.realtime.emitSeatOfferCreated(room.id, next.playerId, offer.id);
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
}

function normalizeRoomSettings(settings: RoomSettingsDto): RoomSettingsDto {
  if (!settings.name?.trim()) throw new BadRequestException({ code: "ROOM_NAME_REQUIRED", message: "Room name is required." });
  if (settings.smallBlind <= 0 || settings.bigBlind <= settings.smallBlind) {
    throw new BadRequestException({ code: "INVALID_BLINDS", message: "Big blind must be larger than the small blind." });
  }
  if (settings.buyInMin <= 0 || settings.buyInMax < settings.buyInMin) {
    throw new BadRequestException({ code: "INVALID_BUY_IN_RANGE", message: "Buy-In range is invalid." });
  }
  if (settings.seatCount < 2 || settings.seatCount > 10) {
    throw new BadRequestException({ code: "INVALID_SEAT_COUNT", message: "Seat count must be between 2 and 10." });
  }
  if (settings.actionTimerSeconds < 10) {
    throw new BadRequestException({ code: "INVALID_ACTION_TIMER", message: "Action timer must be at least 10 seconds." });
  }

  return {
    ...settings,
    name: settings.name.trim(),
  };
}

function createInviteCode(): string {
  return randomBytes(24).toString("base64url");
}

function toRoomDto(room: RoomRecord): RoomDto {
  return {
    id: room.id,
    hostPlayerId: room.hostPlayerId,
    tableId: room.tableId,
    inviteCode: room.inviteCode,
    settings: { ...room.settings },
    hasStarted: room.hasStarted,
    players: room.players.map((player) => ({ ...player })),
    buyIns: room.buyIns.map((buyIn) => ({ ...buyIn })),
    seats: room.seats.map((seat) => ({ ...seat })),
    waitlist: room.waitlist.map((entry) => ({ ...entry })),
    seatOffers: room.seatOffers.map((offer) => ({ ...offer })),
  };
}

function resequenceWaitlist(waitlist: WaitlistEntryDto[]): void {
  waitlist.forEach((entry, index) => {
    entry.position = index + 1;
  });
}

function removeFromWaitlist(room: RoomRecord, playerId: string): void {
  room.waitlist = room.waitlist.filter((entry) => entry.playerId !== playerId);
  resequenceWaitlist(room.waitlist);
}
