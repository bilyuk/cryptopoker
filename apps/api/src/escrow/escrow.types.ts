export const ESCROW_NETWORK = "base" as const;
export const ESCROW_STABLECOIN = "USDC" as const;

export type EscrowNetwork = typeof ESCROW_NETWORK;
export type EscrowStablecoin = typeof ESCROW_STABLECOIN;

export type EscrowSignerApproach = "kms-operator-signer";
export type EscrowKeyManagementApproach = "managed-kms-with-rotation";
export type EscrowEventIndexingApproach = "checkpointed-indexer-with-idempotent-replay";

export type EscrowFoundationPlan = {
  network: EscrowNetwork;
  stablecoin: EscrowStablecoin;
  signerApproach: EscrowSignerApproach;
  keyManagementApproach: EscrowKeyManagementApproach;
  eventIndexingApproach: EscrowEventIndexingApproach;
};

export const ESCROW_FOUNDATION_PLAN: EscrowFoundationPlan = {
  network: ESCROW_NETWORK,
  stablecoin: ESCROW_STABLECOIN,
  signerApproach: "kms-operator-signer",
  keyManagementApproach: "managed-kms-with-rotation",
  eventIndexingApproach: "checkpointed-indexer-with-idempotent-replay",
};
