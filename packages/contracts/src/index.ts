export const API_HEALTH_PATH = "/health" as const;

export type ApiHealthStatus = "ok";

export type ApiHealthResponse = {
  status: ApiHealthStatus;
};

export function createHealthResponse(status: ApiHealthStatus): ApiHealthResponse {
  return { status };
}

export const SESSION_COOKIE_NAME = "cryptopoker_session" as const;

export const PLAYERS_PATH = "/players" as const;
export const CURRENT_PLAYER_PATH = "/players/current" as const;
export const CURRENT_PLAYER_DISPLAY_NAME_PATH = "/players/current/display-name" as const;

export type PlayerDto = {
  id: string;
  displayName: string;
};

export type CurrentPlayerResponse = {
  player: PlayerDto;
};

export type CreateGuestSessionRequest = {
  displayName: string;
};

export type UpdateDisplayNameRequest = {
  displayName: string;
};

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
  playerId: string;
  displayName: string;
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

export const REALTIME_EVENTS = {
  roomUpdated: "room.updated",
  buyInUpdated: "buyIn.updated",
  seatUpdated: "seat.updated",
  waitlistUpdated: "waitlist.updated",
  seatOfferCreated: "seatOffer.created",
  seatOfferUpdated: "seatOffer.updated",
  playerUpdated: "player.updated",
} as const;
