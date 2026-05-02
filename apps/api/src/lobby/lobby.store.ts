import { randomUUID } from "node:crypto";
import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { BuyInDto, PlayerDto, RoomDto, RoomSettingsDto, SeatOfferDto, WalletPreflightResponse } from "@cryptopoker/contracts";
import { ESCROW_NETWORK, ESCROW_STABLECOIN } from "../escrow/escrow.types.js";
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
  private readonly processedEscrowEvents = new Set<string>();
  private readonly processedEscrowTransactions = new Set<string>();
  private readonly pendingEscrowDeposits = new Map<string, {
    fundingReference: string;
    txHash: string;
    blockNumber: number;
    reverted: boolean;
  }>();
  private lastEscrowProcessedBlockNumber = 0;

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
    const hostBuyIn: BuyInDto = {
      id: randomUUID(),
      roomId: "",
      playerId: host.id,
      amount: normalized.buyInMin,
      status: normalized.mode === "blockchain-backed" ? "in-play" : "host-verified",
      network: ESCROW_NETWORK,
      stablecoin: ESCROW_STABLECOIN,
      fundingAddress: createFundingAddress(),
      fundingReference: randomUUID(),
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      fundedAt: new Date().toISOString(),
      refundedAt: null,
    };
    const room: RoomRecord = {
      id: randomUUID(),
      hostPlayerId: host.id,
      tableId: randomUUID(),
      inviteCode,
      settings: normalized,
      hasStarted: false,
      joinedPlayerIds: new Set([host.id]),
      players: [{ playerId: host.id, displayName: host.displayName, role: "host" }],
      buyIns: [hostBuyIn],
      seats: Array.from({ length: normalized.seatCount }, (_, index) => ({
        seatNumber: index + 1,
        playerId: null,
        tableStack: null,
      })),
      waitlist: [],
      seatOffers: [],
    };
    hostBuyIn.roomId = room.id;

    this.rooms.set(room.id, room);
    this.roomIdByInviteCode.set(inviteCode, room.id);
    this.activeRoomIdByPlayerId.set(host.id, room.id);
    this.roomIdByBuyInId.set(hostBuyIn.id, room.id);

    const seatResult = tableSeating.claimSeat(host, room, 1);
    return this.commit(commandResult(seatResult.value, [
      { type: "player.updated", playerId: host.id },
      ...seatResult.events,
    ]));
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

  startFirstHand(actor: PlayerDto, roomId: string): RoomDto {
    const room = this.requireJoinedRoom(actor, roomId);
    this.assertHost(actor, room);
    if (room.hasStarted) {
      throw new BadRequestException({ code: "HAND_ALREADY_STARTED", message: "The first Hand has already started." });
    }
    if (room.seats.filter((seat) => seat.playerId !== null).length < 2) {
      throw new BadRequestException({ code: "INSUFFICIENT_SEATED_PLAYERS", message: "At least two seated Players are required to start the first Hand." });
    }

    room.hasStarted = true;
    const dto = toRoomDto(room);
    return this.commit(commandResult(dto, [{ type: "room.updated", room: dto }]));
  }

  requestBuyIn(player: PlayerDto, roomId: string, amount: number): BuyInDto {
    const room = this.requireJoinedRoom(player, roomId);
    if (amount < room.settings.buyInMin || amount > room.settings.buyInMax) {
      throw new BadRequestException({ code: "BUY_IN_OUT_OF_RANGE", message: "Buy-In amount must be within the Room's allowed range." });
    }
    if (room.settings.mode === "blockchain-backed" && !player.walletAddress) {
      throw new BadRequestException({ code: "WALLET_REQUIRED", message: "Link or provision a wallet before requesting escrow funding." });
    }
    if (room.buyIns.some((existing) => existing.playerId === player.id && (existing.status === "funding-pending" || existing.status === "pending"))) {
      throw new BadRequestException({ code: "BUY_IN_PENDING", message: "A funding-pending Buy-In already exists for this Player in this Room." });
    }

    const now = Date.now();
    const buyIn: BuyInDto = {
      id: randomUUID(),
      roomId,
      playerId: player.id,
      amount,
      status: room.settings.mode === "blockchain-backed" ? "funding-pending" : "pending",
      network: ESCROW_NETWORK,
      stablecoin: ESCROW_STABLECOIN,
      fundingAddress: createFundingAddress(),
      fundingReference: randomUUID(),
      expiresAt: new Date(now + 15 * 60_000).toISOString(),
      fundedAt: null,
      refundedAt: null,
    };
    room.buyIns.push(buyIn);
    this.roomIdByBuyInId.set(buyIn.id, room.id);
    if (room.settings.mode === "host-verified") {
      buyIn.status = "host-verified";
      const buyInPlayer = this.roomPlayerDto(room, buyIn.playerId);
      const seatNumber = lowestOpenSeatWithoutPendingOffer(room);
      const seatingResult = seatNumber !== undefined
        ? tableSeating.claimSeat(buyInPlayer, room, seatNumber)
        : tableSeating.joinWaitlist(buyInPlayer, room);
      return this.commit(commandResult({ ...buyIn }, seatingResult.events));
    }
    return this.commit(commandResult({ ...buyIn }, [{ type: "room.updated", room: toRoomDto(room) }]));
  }

  walletPreflight(
    player: PlayerDto,
    roomId: string,
    connectedNetwork: "base" | "other" | null,
    connectedStablecoin: "USDC" | "other" | null,
  ): WalletPreflightResponse["preflight"] {
    const room = this.requireJoinedRoom(player, roomId);
    const mode = room.settings.mode ?? "host-verified";
    if (mode === "host-verified") {
      return {
        roomMode: mode,
        connectedWalletAddress: player.walletAddress ?? null,
        boundWalletAddress: player.walletAddress ?? null,
        requiredNetwork: null,
        requiredStablecoin: null,
        connectedNetwork,
        connectedStablecoin,
        status: "ready",
        fundingAllowed: true,
        noRake: true,
      };
    }

    if (!player.walletAddress) {
      return {
        roomMode: mode,
        connectedWalletAddress: null,
        boundWalletAddress: null,
        requiredNetwork: "base",
        requiredStablecoin: "USDC",
        connectedNetwork,
        connectedStablecoin,
        status: "wallet-required",
        fundingAllowed: false,
        noRake: room.settings.blockchain?.noRake ?? true,
      };
    }
    if (connectedNetwork !== "base") {
      return {
        roomMode: mode,
        connectedWalletAddress: player.walletAddress,
        boundWalletAddress: player.walletAddress,
        requiredNetwork: "base",
        requiredStablecoin: "USDC",
        connectedNetwork,
        connectedStablecoin,
        status: "wrong-chain",
        fundingAllowed: false,
        noRake: room.settings.blockchain?.noRake ?? true,
      };
    }
    if (connectedStablecoin !== "USDC") {
      return {
        roomMode: mode,
        connectedWalletAddress: player.walletAddress,
        boundWalletAddress: player.walletAddress,
        requiredNetwork: "base",
        requiredStablecoin: "USDC",
        connectedNetwork,
        connectedStablecoin,
        status: "unsupported-token",
        fundingAllowed: false,
        noRake: room.settings.blockchain?.noRake ?? true,
      };
    }

    return {
      roomMode: mode,
      connectedWalletAddress: player.walletAddress,
      boundWalletAddress: player.walletAddress,
      requiredNetwork: "base",
      requiredStablecoin: "USDC",
      connectedNetwork,
      connectedStablecoin,
      status: "ready",
      fundingAllowed: true,
      noRake: room.settings.blockchain?.noRake ?? true,
    };
  }

  confirmEscrowDeposit(
    eventId: string,
    fundingReference: string,
    txHash: string,
    blockNumber: number,
    currentBlockNumber: number,
    reverted = false,
  ): BuyInDto {
    const confirmations = currentBlockNumber - blockNumber + 1;
    if (confirmations < 2) {
      this.pendingEscrowDeposits.set(eventId, { fundingReference, txHash, blockNumber, reverted });
      const { buyIn } = this.requireBuyInByFundingReference(fundingReference);
      return { ...buyIn };
    }
    if (this.processedEscrowEvents.has(eventId) || this.processedEscrowTransactions.has(txHash)) {
      const { buyIn } = this.requireBuyInByFundingReference(fundingReference);
      return { ...buyIn };
    }
    const { room, buyIn } = this.requireBuyInByFundingReference(fundingReference);
    if (buyIn.status !== "funding-pending") {
      throw new BadRequestException({ code: "BUY_IN_STATUS_INVALID", message: "Only funding-pending Buy-Ins can be confirmed." });
    }
    if (Date.now() > Date.parse(buyIn.expiresAt)) {
      buyIn.status = "expired";
      throw new BadRequestException({ code: "FUNDING_INTENT_EXPIRED", message: "Funding intent has expired for this Buy-In." });
    }
    buyIn.status = reverted ? "funding-failed" : "escrow-funded";
    buyIn.fundedAt = new Date().toISOString();
    this.processedEscrowEvents.add(eventId);
    this.processedEscrowTransactions.add(txHash);
    this.pendingEscrowDeposits.delete(eventId);
    this.lastEscrowProcessedBlockNumber = Math.max(this.lastEscrowProcessedBlockNumber, blockNumber);
    return this.commit(commandResult({ ...buyIn }, [{ type: "room.updated", room: toRoomDto(room) }]));
  }

  replayEscrowDeposits(currentBlockNumber: number): BuyInDto[] {
    const confirmed: BuyInDto[] = [];
    for (const [eventId, pending] of this.pendingEscrowDeposits.entries()) {
      const confirmations = currentBlockNumber - pending.blockNumber + 1;
      if (confirmations < 2) continue;
      confirmed.push(
        this.confirmEscrowDeposit(
          eventId,
          pending.fundingReference,
          pending.txHash,
          pending.blockNumber,
          currentBlockNumber,
          pending.reverted,
        ),
      );
    }
    return confirmed;
  }

  lastEscrowProcessedBlock(): number {
    return this.lastEscrowProcessedBlockNumber;
  }

  markBuyInExpired(buyInId: string): BuyInDto {
    const { room, buyIn } = this.requireBuyIn(buyInId);
    if (buyIn.status !== "funding-pending") {
      throw new BadRequestException({ code: "BUY_IN_STATUS_INVALID", message: "Only a funding-pending Buy-In can expire." });
    }
    buyIn.status = "expired";
    return this.commit(commandResult({ ...buyIn }, [{ type: "room.updated", room: toRoomDto(room) }]));
  }

  requestPrePlayRefund(actor: PlayerDto, buyInId: string): BuyInDto {
    const { room, buyIn } = this.requireBuyIn(buyInId);
    if (actor.id !== buyIn.playerId && actor.id !== room.hostPlayerId) {
      throw new ForbiddenException({ code: "BUY_IN_REFUND_FORBIDDEN", message: "Only the Player or Room Host can request this refund." });
    }
    if (room.hasStarted) {
      throw new BadRequestException({ code: "LIVE_PLAY_REFUND_FORBIDDEN", message: "Pre-play refunds are only available before live play starts." });
    }
    if (buyIn.status !== "funding-pending" && buyIn.status !== "escrow-funded" && buyIn.status !== "expired") {
      throw new BadRequestException({ code: "BUY_IN_STATUS_INVALID", message: "Buy-In cannot enter refund flow from its current state." });
    }
    buyIn.status = "refund-pending";
    removePlayerFromSeatAndWaitlist(room, buyIn.playerId);
    return this.commit(commandResult({ ...buyIn }, [{ type: "room.updated", room: toRoomDto(room) }]));
  }

  confirmEscrowRefund(eventId: string, buyInId: string, txHash: string): BuyInDto {
    if (this.processedEscrowEvents.has(eventId) || this.processedEscrowTransactions.has(txHash)) {
      const { buyIn } = this.requireBuyIn(buyInId);
      return { ...buyIn };
    }

    const { room, buyIn } = this.requireBuyIn(buyInId);
    if (buyIn.status !== "refund-pending") {
      throw new BadRequestException({ code: "BUY_IN_STATUS_INVALID", message: "Only refund-pending Buy-Ins can be refunded." });
    }
    buyIn.status = "refunded";
    buyIn.refundedAt = new Date().toISOString();
    this.processedEscrowEvents.add(eventId);
    this.processedEscrowTransactions.add(txHash);
    return this.commit(commandResult({ ...buyIn }, [{ type: "room.updated", room: toRoomDto(room) }]));
  }

  leaveSeat(player: PlayerDto, roomId: string): RoomDto {
    const room = this.requireJoinedRoom(player, roomId);
    return this.commit(tableSeating.leaveSeat(player, room));
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

  private requireBuyInByFundingReference(fundingReference: string): { room: RoomRecord; buyIn: BuyInDto } {
    for (const room of this.rooms.values()) {
      const buyIn = room.buyIns.find((candidate) => candidate.fundingReference === fundingReference);
      if (buyIn) return { room, buyIn };
    }
    throw new NotFoundException({ code: "BUY_IN_NOT_FOUND", message: "Buy-In funding reference was not found." });
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

  private roomPlayerDto(room: RoomRecord, playerId: string): PlayerDto {
    const member = room.players.find((entry) => entry.playerId === playerId);
    if (!member) {
      throw new NotFoundException({ code: "PLAYER_NOT_IN_ROOM", message: "Player is not a member of this Room." });
    }
    return { id: member.playerId, displayName: member.displayName };
  }
}

function lowestOpenSeatWithoutPendingOffer(room: RoomRecord): number | undefined {
  for (const seat of room.seats) {
    if (seat.playerId !== null) continue;
    const hasPendingOffer = room.seatOffers.some(
      (offer) => offer.seatNumber === seat.seatNumber && offer.status === "pending",
    );
    if (!hasPendingOffer) return seat.seatNumber;
  }
  return undefined;
}

function createFundingAddress(): string {
  const alphabet = "0123456789abcdef";
  let value = "0x";
  for (let i = 0; i < 40; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}

function removePlayerFromSeatAndWaitlist(room: RoomRecord, playerId: string): void {
  for (const seat of room.seats) {
    if (seat.playerId === playerId) {
      seat.playerId = null;
      seat.tableStack = null;
    }
  }
  room.waitlist = room.waitlist.filter((entry) => entry.playerId !== playerId).map((entry, index) => ({ ...entry, position: index + 1 }));
}
