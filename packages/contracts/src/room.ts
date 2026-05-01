import type { PlayerDto } from "./player.js";

export const ROOMS_PATH = "/rooms" as const;
export const CURRENT_ROOM_PATH = "/rooms/current" as const;

export type RoomSettingsDto = {
  name: string;
  smallBlind: number;
  bigBlind: number;
  buyInMin: number;
  buyInMax: number;
  seatCount: number;
  actionTimerSeconds: number;
};

export type SeatDto = {
  seatNumber: number;
  playerId: string | null;
  tableStack: number | null;
};

export type BuyInDto = {
  id: string;
  roomId: string;
  playerId: string;
  amount: number;
  status: "pending" | "host-verified" | "rejected";
};

export type WaitlistEntryDto = {
  playerId: string;
  position: number;
};

export type SeatOfferDto = {
  id: string;
  roomId: string;
  playerId: string;
  seatNumber: number;
  status: "pending" | "accepted" | "declined" | "expired";
};

export type RoomPlayerDto = {
  playerId: PlayerDto["id"];
  displayName: PlayerDto["displayName"];
  role: "host" | "player";
};

export type RoomDto = {
  id: string;
  hostPlayerId: string;
  tableId: string;
  inviteCode: string;
  settings: RoomSettingsDto;
  hasStarted: boolean;
  players: RoomPlayerDto[];
  buyIns: BuyInDto[];
  seats: SeatDto[];
  waitlist: WaitlistEntryDto[];
  seatOffers: SeatOfferDto[];
};

export type RoomResponse = {
  room: RoomDto;
};

export type CreateRoomRequest = RoomSettingsDto;
export type UpdateRoomSettingsRequest = Partial<RoomSettingsDto>;

export type BuyInResponse = {
  buyIn: BuyInDto;
};

export type SeatOfferResponse = {
  seatOffer: SeatOfferDto;
};

export type RequestBuyInRequest = {
  roomId: string;
  amount: number;
};

export type RoomCommandRequest = {
  roomId: string;
};

export type ClaimSeatRequest = {
  roomId: string;
  seatNumber: number;
};
