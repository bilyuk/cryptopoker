import { createHash } from "node:crypto";
import { settlementTxHashSchema, type TableSeat } from "@cryptopoker/api-schema";
import {
  createNoopObservability,
  runWithSpan,
  type ServiceObservability
} from "./observability.js";

export type EscrowSettlementSubmission = {
  tableId: string;
  handId: string;
  winnerWalletAddress: string;
  loserWalletAddress: string;
  amount: number;
  idempotencyKey: string;
};

export type EscrowChainGateway = {
  submitSettlement: (submission: EscrowSettlementSubmission) => { txHash: string };
};

export type SettlementExecutionInput = EscrowSettlementSubmission & {
  winnerSeat: TableSeat;
};

export type SettlementExecutionResult = {
  txHash: string;
  replayed: boolean;
  settlement: SettlementRecord;
};

export type SettlementRecord = {
  tableId: string;
  handId: string;
  winnerSeat: TableSeat;
  winnerWalletAddress: string;
  loserWalletAddress: string;
  amount: number;
  idempotencyKey: string;
  txHash: string;
  submittedAt: string;
  confirmedAt: string | null;
  confirmedBlockNumber: number | null;
};

export type SettlementConfirmedChainEvent = {
  eventType: "escrow.settlement_confirmed";
  txHash: string;
  blockNumber: number;
  emittedAt: string;
};

export type SettlementReconciliationResult =
  | {
      matched: true;
      settlement: SettlementRecord;
      alreadyConfirmed: boolean;
    }
  | {
      matched: false;
    };

export type SettlementExecutor = {
  executeSettlement: (input: SettlementExecutionInput) => SettlementExecutionResult;
  getSettlementByTxHash: (txHash: string) => SettlementRecord | null;
  getSettlementByHandId: (handId: string) => SettlementRecord | null;
  markConfirmed: (txHash: string, blockNumber: number, confirmedAt?: string) => SettlementRecord | null;
};

export type EscrowSettlementExecutorOptions = {
  now?: () => Date;
  chainGateway?: EscrowChainGateway;
  observability?: ServiceObservability;
};

export const createDeterministicEscrowChainGateway = (): EscrowChainGateway => ({
  submitSettlement: (submission) => {
    const hashInput = `${submission.tableId}:${submission.handId}:${submission.idempotencyKey}`;
    const digest = createHash("sha256").update(hashInput).digest("hex");
    const txHash = settlementTxHashSchema.parse(`0x${digest}`);
    return { txHash };
  }
});

export const createEscrowSettlementExecutor = (
  options: EscrowSettlementExecutorOptions = {}
): SettlementExecutor => {
  const now = options.now ?? (() => new Date());
  const chainGateway = options.chainGateway ?? createDeterministicEscrowChainGateway();
  const observability = options.observability ?? createNoopObservability();
  const settlementsByIdempotencyKey = new Map<string, SettlementRecord>();
  const settlementsByTxHash = new Map<string, SettlementRecord>();
  const settlementsByHandId = new Map<string, SettlementRecord>();

  const executeSettlement = (input: SettlementExecutionInput): SettlementExecutionResult => {
    return runWithSpan(observability, "settlement.execute", { tableId: input.tableId, handId: input.handId }, () => {
      const existing = settlementsByIdempotencyKey.get(input.idempotencyKey);
      if (existing) {
        return {
          txHash: existing.txHash,
          replayed: true,
          settlement: existing
        };
      }

      const submittedAt = now().toISOString();
      const { txHash } = chainGateway.submitSettlement({
        tableId: input.tableId,
        handId: input.handId,
        winnerWalletAddress: input.winnerWalletAddress,
        loserWalletAddress: input.loserWalletAddress,
        amount: input.amount,
        idempotencyKey: input.idempotencyKey
      });
      const settlement: SettlementRecord = {
        tableId: input.tableId,
        handId: input.handId,
        winnerSeat: input.winnerSeat,
        winnerWalletAddress: input.winnerWalletAddress,
        loserWalletAddress: input.loserWalletAddress,
        amount: input.amount,
        idempotencyKey: input.idempotencyKey,
        txHash: settlementTxHashSchema.parse(txHash),
        submittedAt,
        confirmedAt: null,
        confirmedBlockNumber: null
      };
      settlementsByIdempotencyKey.set(input.idempotencyKey, settlement);
      settlementsByTxHash.set(settlement.txHash, settlement);
      settlementsByHandId.set(settlement.handId, settlement);
      observability.observeSettlementSubmitted({
        txHash: settlement.txHash,
        tableId: settlement.tableId,
        handId: settlement.handId,
        timestampMs: Date.parse(submittedAt)
      });

      return {
        txHash: settlement.txHash,
        replayed: false,
        settlement
      };
    });
  };

  const getSettlementByTxHash = (txHash: string): SettlementRecord | null =>
    settlementsByTxHash.get(settlementTxHashSchema.parse(txHash)) ?? null;

  const getSettlementByHandId = (handId: string): SettlementRecord | null =>
    settlementsByHandId.get(handId) ?? null;

  const markConfirmed = (txHash: string, blockNumber: number, confirmedAt?: string): SettlementRecord | null => {
    return runWithSpan(observability, "settlement.mark_confirmed", { txHash, blockNumber }, () => {
      const settlement = getSettlementByTxHash(txHash);
      if (!settlement) {
        return null;
      }
      if (!settlement.confirmedAt) {
        settlement.confirmedAt = confirmedAt ?? now().toISOString();
        settlement.confirmedBlockNumber = blockNumber;
        observability.observeSettlementConfirmed({
          txHash: settlement.txHash,
          tableId: settlement.tableId,
          handId: settlement.handId,
          timestampMs: Date.parse(settlement.confirmedAt)
        });
      }
      return settlement;
    });
  };

  return {
    executeSettlement,
    getSettlementByTxHash,
    getSettlementByHandId,
    markConfirmed
  };
};

export type SettlementReconciliationWorker = {
  reconcileConfirmedEvent: (event: SettlementConfirmedChainEvent) => SettlementReconciliationResult;
};

export const createSettlementReconciliationWorker = (
  executor: SettlementExecutor
): SettlementReconciliationWorker => ({
  reconcileConfirmedEvent: (event) => {
    const normalizedTxHash = settlementTxHashSchema.parse(event.txHash);
    const existing = executor.getSettlementByTxHash(normalizedTxHash);
    if (!existing) {
      return { matched: false };
    }
    const alreadyConfirmed = Boolean(existing.confirmedAt);
    const settlement = executor.markConfirmed(normalizedTxHash, event.blockNumber, event.emittedAt);
    if (!settlement) {
      return { matched: false };
    }
    return { matched: true, settlement, alreadyConfirmed };
  }
});
