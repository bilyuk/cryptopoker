export type LobbyCommandEvent =
  | { type: "player.updated"; playerId: string }
  | { type: "room.updated"; roomId: string }
  | { type: "buyIn.updated"; roomId: string; buyInId: string }
  | { type: "seat.updated"; roomId: string }
  | { type: "waitlist.updated"; roomId: string }
  | { type: "seatOffer.created"; roomId: string; playerId: string; seatOfferId: string }
  | { type: "seatOffer.updated"; roomId: string; playerId: string; seatOfferId: string };

export type CommandResult<T> = {
  value: T;
  events: LobbyCommandEvent[];
};

export function commandResult<T>(value: T, events: LobbyCommandEvent[] = []): CommandResult<T> {
  return { value, events };
}
