export type AppScreen = "welcome" | "lobby" | "waiting" | "table" | "create" | "invite";

export type Room = {
  id: string;
  name: string;
  variant: string;
  blinds: string;
  buyIn: string;
  seats: string;
  timer: string;
  status: "Seats open" | "Full";
  featured?: boolean;
  full?: boolean;
  private?: boolean;
};

export type CreateRoomValues = {
  name: string;
  blinds: string;
  buyInMin: string;
  buyInMax: string;
  seats: string;
  timer: string;
};
