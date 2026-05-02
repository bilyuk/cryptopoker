export type EscrowFundingState =
  | "funding-pending"
  | "escrow-funded"
  | "in-play"
  | "payout-pending"
  | "paid-out"
  | "refund-pending"
  | "refunded";

export type EscrowReconciliationState = "pending" | "confirmed" | "failed" | "replayed";

export type EscrowFundingIntentDto = {
  id: string;
  roomId: string;
  playerId: string;
  amount: number;
  currency: "USDC";
  network: "base";
  state: EscrowFundingState;
  destinationAddress: string;
  createdAt: string;
  updatedAt: string;
};

export type EscrowPayoutDto = {
  id: string;
  roomId: string;
  playerId: string;
  amount: number;
  currency: "USDC";
  network: "base";
  state: Extract<EscrowFundingState, "payout-pending" | "paid-out">;
  payoutAddress: string;
  initiatedAt: string;
  settledAt: string | null;
};

export type EscrowRefundDto = {
  id: string;
  roomId: string;
  playerId: string;
  amount: number;
  currency: "USDC";
  network: "base";
  state: Extract<EscrowFundingState, "refund-pending" | "refunded">;
  refundAddress: string;
  initiatedAt: string;
  settledAt: string | null;
};

export type EscrowReconciliationRecordDto = {
  id: string;
  roomId: string;
  playerId: string;
  chainTxHash: string;
  chainBlockNumber: number;
  eventName: "DepositConfirmed" | "PayoutExecuted" | "RefundExecuted";
  state: EscrowReconciliationState;
  observedAt: string;
};
