import type { PlayerDto } from "./player.js";

export const ROOMS_PATH = "/rooms" as const;
export const CURRENT_ROOM_PATH = "/rooms/current" as const;

export const BUY_INS_PATH = "/buy-ins" as const;
export const SEATS_CLAIM_PATH = "/seats/claim" as const;
export const SEATS_LEAVE_PATH = "/seats/leave" as const;
export const WAITLIST_JOIN_PATH = "/waitlist/join" as const;
export const WAITLIST_LEAVE_PATH = "/waitlist/leave" as const;

export function buyInApprovePath(buyInId: string): string {
  return `${BUY_INS_PATH}/${buyInId}/approve`;
}
export function buyInRejectPath(buyInId: string): string {
  return `${BUY_INS_PATH}/${buyInId}/reject`;
}

export function seatOfferAcceptPath(seatOfferId: string): string {
  return `/seat-offers/${seatOfferId}/accept`;
}
export function seatOfferDeclinePath(seatOfferId: string): string {
  return `/seat-offers/${seatOfferId}/decline`;
}
export function seatOfferExpirePath(seatOfferId: string): string {
  return `/seat-offers/${seatOfferId}/expire`;
}

export function inviteLinkPath(inviteCode: string): string {
  return `/invite-links/${inviteCode}`;
}
export function inviteLinkJoinPath(inviteCode: string): string {
  return `/invite-links/${inviteCode}/join`;
}

export function roomSettingsPath(roomId: string): string {
  return `${ROOMS_PATH}/${roomId}/settings`;
}
export function rotateInvitePath(roomId: string): string {
  return `${ROOMS_PATH}/${roomId}/rotate-invite`;
}

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
