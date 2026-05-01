import type { RoomDto } from "./room.js";

export const REALTIME_EVENTS = {
  roomUpdated: "room.updated",
  seatOfferCreated: "seatOffer.created",
  seatOfferUpdated: "seatOffer.updated",
  playerUpdated: "player.updated",
} as const;

export type RoomUpdatedPayload = {
  roomId: string;
  room: RoomDto;
};

export type SeatOfferEventPayload = {
  roomId: string;
  playerId: string;
  seatOfferId: string;
};

export type PlayerUpdatedPayload = {
  playerId: string;
};
