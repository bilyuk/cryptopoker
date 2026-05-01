export type AppScreen = "welcome" | "lobby" | "waiting" | "table" | "create" | "invite" | "join";

export type Room = {
  id: string;
  inviteCode?: string;
  hostPlayerId: string;
  hostName: string;
  name: string;
  variant: string;
  blinds: string;
  buyIn: string;
  buyInMinValue: number;
  seats: string;
  timer: string;
  status: "Seats open" | "Full";
  occupiedSeats: number;
  seatCount: number;
  seatLabels: RoomSeatLabel[];
  players: RoomPlayerSummary[];
  pendingBuyIns: RoomBuyInSummary[];
  openSeatNumbers: number[];
  currentPlayerWaitlistPosition?: number;
  currentPlayerSeatOffer?: RoomSeatOfferSummary;
  featured?: boolean;
  full?: boolean;
  private?: boolean;
};

export type RoomSeatLabel = {
  label: string;
  stack: string | null;
};

export type RoomPlayerSummary = {
  playerId: string;
  displayName: string;
  role: "host" | "player";
  seated: boolean;
  stack: string | null;
  buyInStatus: "none" | "pending" | "host-verified" | "rejected";
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
