export const SESSION_COOKIE_NAME = "cryptopoker_session" as const;

export type PlayerDto = {
  id: string;
  displayName: string;
  walletAddress?: string | null;
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

export type LinkWalletRequest = {
  walletAddress?: string;
};
