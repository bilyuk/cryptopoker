export const SESSION_COOKIE_NAME = "cryptopoker_session" as const;

export const PLAYERS_PATH = "/players" as const;
export const CURRENT_PLAYER_PATH = "/players/current" as const;
export const CURRENT_PLAYER_SESSION_PATH = "/players/current/session" as const;
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
