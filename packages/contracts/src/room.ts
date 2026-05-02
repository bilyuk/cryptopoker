import type { PlayerDto } from "./player.js";

export type RoomSettingsDto = {
  name: string;
  smallBlind: number;
  bigBlind: number;
  buyInMin: number;
  buyInMax: number;
  seatCount: number;
  actionTimerSeconds: number;
  mode?: "host-verified" | "blockchain-backed";
  blockchain?: {
    network: "base";
    stablecoin: "USDC";
    maxTotalBuyIn: number;
    antiRatholing: boolean;
    noRake: boolean;
  } | null;
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
  status:
    | "pending"
    | "host-verified"
    | "rejected"
    | "funding-pending"
    | "escrow-funded"
    | "funding-failed"
    | "in-play"
    | "refund-pending"
    | "refunded"
    | "expired";
  network: "base";
  stablecoin: "USDC";
  fundingAddress: string;
  fundingReference: string;
  expiresAt: string;
  fundedAt: string | null;
  refundedAt: string | null;
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

export type WalletPreflightResponse = {
  preflight: {
    roomMode: "host-verified" | "blockchain-backed";
    connectedWalletAddress: string | null;
    boundWalletAddress: string | null;
    requiredNetwork: "base" | null;
    requiredStablecoin: "USDC" | null;
    connectedNetwork: "base" | "other" | null;
    connectedStablecoin: "USDC" | "other" | null;
    status: "ready" | "wallet-required" | "wrong-chain" | "unsupported-token";
    fundingAllowed: boolean;
    noRake: boolean;
  };
};

export type EscrowDepositEventRequest = {
  eventId: string;
  fundingReference: string;
  txHash: string;
  blockNumber: number;
  currentBlockNumber: number;
  reverted?: boolean;
};

export type EscrowRefundEventRequest = {
  eventId: string;
  buyInId: string;
  txHash: string;
  blockNumber: number;
};

export type RoomCommandRequest = {
  roomId: string;
};
