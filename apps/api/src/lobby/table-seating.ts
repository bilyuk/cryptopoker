import { randomUUID } from "node:crypto";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { PlayerDto, RoomDto, SeatOfferDto, WaitlistEntryDto } from "@cryptopoker/contracts";
import { commandResult, type CommandResult, type LobbyCommandEvent } from "./command-events.js";
import type { RoomRecord } from "./room-record.js";
import { toRoomDto } from "./room-record.js";

export function claimSeat(player: PlayerDto, room: RoomRecord, seatNumber: number): CommandResult<RoomDto> {
  assertVerifiedBuyIn(room, player.id);
  if (room.seats.some((seat) => seat.playerId === player.id)) {
    throw new BadRequestException({ code: "PLAYER_ALREADY_SEATED", message: "A Player cannot occupy more than one Seat in the Room." });
  }
  const pendingOffer = room.seatOffers.find((offer) => offer.seatNumber === seatNumber && offer.status === "pending");
  if (pendingOffer) {
    throw new BadRequestException({ code: "SEAT_OFFER_ACCEPTANCE_REQUIRED", message: "Accept or decline the pending Seat Offer before claiming this Seat." });
  }

  const seat = room.seats.find((candidate) => candidate.seatNumber === seatNumber);
  if (!seat) throw new BadRequestException({ code: "SEAT_NOT_FOUND", message: "Seat does not exist in this Room." });
  if (seat.playerId) throw new BadRequestException({ code: "SEAT_OCCUPIED", message: "Seat is already occupied." });

  seat.playerId = player.id;
  seat.tableStack = verifiedStack(room, player.id);
  removeFromWaitlist(room, player.id);
  const dto = toRoomDto(room);
  return commandResult(dto, [{ type: "room.updated", room: dto }]);
}

export function leaveSeat(player: PlayerDto, room: RoomRecord): CommandResult<RoomDto> {
  const seat = room.seats.find((candidate) => candidate.playerId === player.id);
  if (!seat) throw new BadRequestException({ code: "PLAYER_NOT_SEATED", message: "The Player does not occupy a Seat in this Room." });

  seat.playerId = null;
  seat.tableStack = null;
  const offerEvents = offerNextSeat(room, seat.seatNumber);
  const dto = toRoomDto(room);
  return commandResult(dto, [...offerEvents, { type: "room.updated", room: dto }]);
}

export function joinWaitlist(player: PlayerDto, room: RoomRecord): CommandResult<RoomDto> {
  assertVerifiedBuyIn(room, player.id);
  if (room.seats.some((seat) => seat.playerId === player.id)) {
    throw new BadRequestException({ code: "PLAYER_ALREADY_SEATED", message: "A seated Player cannot join the Waitlist." });
  }
  const claimableSeatExists = room.seats.some(
    (seat) =>
      !seat.playerId &&
      !room.seatOffers.some((offer) => offer.seatNumber === seat.seatNumber && offer.status === "pending"),
  );
  if (claimableSeatExists) {
    throw new BadRequestException({ code: "SEAT_AVAILABLE", message: "A Player can claim an open Seat instead of joining the Waitlist." });
  }
  if (!room.waitlist.some((entry) => entry.playerId === player.id)) {
    room.waitlist.push({ playerId: player.id, position: room.waitlist.length + 1 });
  }
  const dto = toRoomDto(room);
  return commandResult(dto, [{ type: "room.updated", room: dto }]);
}

export function leaveWaitlist(player: PlayerDto, room: RoomRecord): CommandResult<RoomDto> {
  removeFromWaitlist(room, player.id);
  const dto = toRoomDto(room);
  return commandResult(dto, [{ type: "room.updated", room: dto }]);
}

export function acceptSeatOffer(player: PlayerDto, room: RoomRecord, offer: SeatOfferDto): CommandResult<RoomDto> {
  if (offer.playerId !== player.id) throw new ForbiddenException({ code: "SEAT_OFFER_NOT_FOR_PLAYER", message: "Seat Offer belongs to another Player." });
  if (offer.status !== "pending") throw new BadRequestException({ code: "SEAT_OFFER_NOT_PENDING", message: "Seat Offer is no longer pending." });
  assertVerifiedBuyIn(room, player.id);

  const seat = room.seats.find((candidate) => candidate.seatNumber === offer.seatNumber);
  if (!seat || seat.playerId) throw new BadRequestException({ code: "SEAT_OFFER_STALE", message: "Seat Offer can no longer be accepted." });

  offer.status = "accepted";
  seat.playerId = player.id;
  seat.tableStack = verifiedStack(room, player.id);
  removeFromWaitlist(room, player.id);
  const dto = toRoomDto(room);
  return commandResult(dto, [
    { type: "seatOffer.updated", roomId: room.id, playerId: player.id, seatOfferId: offer.id },
    { type: "room.updated", room: dto },
  ]);
}

export function declineSeatOffer(player: PlayerDto, room: RoomRecord, offer: SeatOfferDto): CommandResult<SeatOfferDto> {
  if (offer.playerId !== player.id) throw new ForbiddenException({ code: "SEAT_OFFER_NOT_FOR_PLAYER", message: "Seat Offer belongs to another Player." });
  offer.status = "declined";
  removeFromWaitlist(room, offer.playerId);
  const offerEvents = offerNextSeat(room, offer.seatNumber);
  const dto = toRoomDto(room);
  return commandResult({ ...offer }, [
    { type: "seatOffer.updated", roomId: room.id, playerId: offer.playerId, seatOfferId: offer.id },
    ...offerEvents,
    { type: "room.updated", room: dto },
  ]);
}

export function expireSeatOffer(room: RoomRecord, offer: SeatOfferDto): CommandResult<SeatOfferDto> {
  offer.status = "expired";
  removeFromWaitlist(room, offer.playerId);
  const offerEvents = offerNextSeat(room, offer.seatNumber);
  const dto = toRoomDto(room);
  return commandResult({ ...offer }, [
    { type: "seatOffer.updated", roomId: room.id, playerId: offer.playerId, seatOfferId: offer.id },
    ...offerEvents,
    { type: "room.updated", room: dto },
  ]);
}

function assertVerifiedBuyIn(room: RoomRecord, playerId: string): void {
  if (!room.buyIns.some((buyIn) => buyIn.playerId === playerId && (buyIn.status === "host-verified" || buyIn.status === "escrow-locked" || buyIn.status === "in-play"))) {
    throw new BadRequestException({ code: "ESCROW_FUNDED_BUY_IN_REQUIRED", message: "An escrow-funded Buy-In is required first." });
  }
}

function verifiedStack(room: RoomRecord, playerId: string): number {
  return room.buyIns
    .filter((buyIn) => buyIn.playerId === playerId && (buyIn.status === "host-verified" || buyIn.status === "escrow-locked" || buyIn.status === "in-play"))
    .reduce((total, buyIn) => total + buyIn.amount, 0);
}

function offerNextSeat(room: RoomRecord, seatNumber: number): LobbyCommandEvent[] {
  const next = room.waitlist.find((entry) => {
    return !room.seatOffers.some((offer) => offer.playerId === entry.playerId && offer.status === "pending");
  });
  if (!next) return [];

  const offer = {
    id: randomUUID(),
    roomId: room.id,
    playerId: next.playerId,
    seatNumber,
    status: "pending",
  } satisfies SeatOfferDto;
  room.seatOffers.push(offer);
  return [{ type: "seatOffer.created", roomId: room.id, playerId: next.playerId, seatOfferId: offer.id }];
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
