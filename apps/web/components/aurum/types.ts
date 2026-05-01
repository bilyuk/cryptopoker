export type AppScreen = "welcome" | "lobby" | "waiting" | "table" | "create" | "invite" | "join";

export type Room = {
  id: string;
  inviteCode?: string;
  name: string;
  variant: string;
  blinds: string;
  buyIn: string;
  seats: string;
  timer: string;
  status: "Seats open" | "Full";
  occupiedSeats: number;
  seatCount: number;
  seatLabels: RoomSeatLabel[];
  featured?: boolean;
  full?: boolean;
  private?: boolean;
};

export type RoomSeatLabel = {
  label: string;
  stack: string | null;
};

export type CreateRoomValues = {
  name: string;
  blinds: string;
  buyInMin: string;
  buyInMax: string;
  seats: string;
  timer: string;
};
