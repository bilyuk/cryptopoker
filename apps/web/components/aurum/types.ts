import type { BuyInDto } from "@cryptopoker/contracts";

export type AppScreen = "welcome" | "lobby" | "waiting" | "table" | "create" | "invite" | "join";

export type RoomPlayerBuyInStatus = BuyInDto["status"] | "none";

export type Room = {
  id: string;
  inviteCode?: string;
  hostPlayerId: string;
  hasStarted: boolean;
  hostName: string;
  name: string;
  variant: string;
  blinds: string;
  buyIn: string;
  buyInRange: { min: number; max: number };
  seats: string;
  timer: string;
  status: "Seats open" | "Full";
  occupiedSeats: number;
  seatCount: number;
  seatRoster: RoomSeatRosterEntry[];
  waitlistRoster: RoomWaitlistEntry[];
  players: RoomPlayerSummary[];
  pendingBuyIns: RoomBuyInSummary[];
  openSeatNumbers: number[];
  currentPlayerWaitlistPosition?: number;
  currentPlayerSeatOffer?: RoomSeatOfferSummary;
  featured?: boolean;
  full?: boolean;
  private?: boolean;
};

export type RoomSeatRosterEntry = {
  seatNumber: number;
  playerId: string | null;
  displayName: string | null;
  isHost: boolean;
  stack: string | null;
};

export type RoomWaitlistEntry = {
  position: number;
  playerId: string;
  displayName: string;
};

export type RoomPlayerSummary = {
  playerId: string;
  displayName: string;
  role: "host" | "player";
  seated: boolean;
  stack: string | null;
  buyInStatus: RoomPlayerBuyInStatus;
  buyInId?: string;
};

export type RoomBuyInSummary = {
  id: string;
  playerId: string;
  displayName: string;
  amount: string;
};

export type RoomSeatOfferSummary = {
  id: string;
  seatNumber: number;
};

export type CreateRoomValues = {
  name: string;
  blinds: string;
  buyInMin: string;
  buyInMax: string;
  seats: string;
  timer: string;
};
