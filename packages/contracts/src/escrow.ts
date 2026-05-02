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

export type EscrowLedgerEntryType = "funding" | "allocation" | "settlement" | "payout" | "refund" | "reconciliation";
export type EscrowLedgerReferenceType = "funding-intent" | "deposit" | "hand" | "payout" | "refund" | "replay";

export type EscrowPlayerLedgerBalanceDto = {
  roomId: string;
  playerId: string;
  startingBalance: number;
  inPlayAllocation: number;
  settlementDelta: number;
  withdrawableBalance: number;
};

export type EscrowLedgerEntryDto = {
  id: string;
  roomId: string;
  playerId: string;
  entryType: EscrowLedgerEntryType;
  referenceType: EscrowLedgerReferenceType;
  referenceId: string;
  amountDelta: number;
  roomLiabilityAfter: number;
  status: "pending" | "confirmed" | "failed";
  chainTxHash: string | null;
  chainBlockNumber: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type EscrowSettlementPlayerDelta = {
  playerId: string;
  delta: number;
};

export type RecordHandSettlementRequest = {
  roomId: string;
  handId: string;
  deltas: EscrowSettlementPlayerDelta[];
};

export type QueueEscrowTransferRequest = {
  roomId: string;
  playerId: string;
  amount: number;
  idempotencyKey: string;
  payoutAddress?: string;
  refundAddress?: string;
};

export type EscrowTransferQueueRecordDto = {
  id: string;
  roomId: string;
  playerId: string;
  amount: number;
  transferType: "payout" | "refund";
  state: "queued" | "processing" | "paid" | "failed";
  idempotencyKey: string;
  referenceId: string;
  destinationAddress: string;
  failureReason: string | null;
  queuedAt: string;
  settledAt: string | null;
};

export type FinalizeEscrowTransferRequest = {
  transferId: string;
  eventId: string;
  txHash: string;
  blockNumber: number;
};

export type FailEscrowTransferRequest = {
  transferId: string;
  reason: string;
};

export type RoomCloseoutReconciliationRequest = {
  roomId: string;
  onchainBalanceByPlayer: Record<string, number>;
};

export type RoomCloseoutReconciliationResultDto = {
  roomId: string;
  reconciled: boolean;
  mismatches: Array<{
    playerId: string;
    offchainWithdrawable: number;
    onchainBalance: number;
    delta: number;
  }>;
};

export type EscrowDelegationDomainDto = {
  name: "CryptopokerEscrow";
  version: "1";
  chainId: number;
  verifyingContract: string;
};

export type RegisterRoomSettlementDelegationRequest = {
  roomId: string;
  hostWalletAddress: string;
  delegateWalletAddress: string;
  contractAddress: string;
  chainId: number;
  signerWalletAddress: string;
  signatureDomain: EscrowDelegationDomainDto;
  issuedAt?: string;
  ttlHours?: number;
};

export type RevokeRoomSettlementDelegationRequest = {
  roomId: string;
  hostWalletAddress: string;
  signerWalletAddress: string;
  revokedAt?: string;
  reason?: string;
};

export type RoomSettlementDelegationRecordDto = {
  roomId: string;
  hostWalletAddress: string;
  delegateWalletAddress: string;
  contractAddress: string;
  chainId: number;
  signerWalletAddress: string;
  signatureDomain: EscrowDelegationDomainDto;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
};

export type ValidateEscrowPayoutAuthorizationRequest = {
  roomId: string;
  playerWalletAddress: string;
  amount: number;
  nonce: string;
  contractAddress: string;
  chainId: number;
  signerWalletAddress: string;
};
