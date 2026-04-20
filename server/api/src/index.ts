import {
  authNonceRequestSchema,
  authNonceResponseSchema,
  fairnessCommitRequestSchema,
  fairnessCommitResponseSchema,
  fairnessProofRequestSchema,
  fairnessProofResponseSchema,
  fairnessRevealRequestSchema,
  fairnessRevealResponseSchema,
  schemaVersion,
  tableActionRequestSchema,
  tableActionResponseSchema,
  tableResyncRequestSchema,
  tableResyncResponseSchema,
  tableSnapshotResponseSchema,
  tableStateEventSchema,
  tableStreamEventSchema,
  type AuthAuditLog,
  type AuthNonceRequest,
  type AuthNonceResponse,
  type FairnessCommitRequest,
  type FairnessCommitResponse,
  type FairnessProofRequest,
  type FairnessProofResponse,
  type FairnessRevealRequest,
  type FairnessRevealResponse,
  type TableActionRequest,
  type TableActionResponse,
  type TableResyncRequest,
  type TableResyncResponse,
  type TableSnapshotResponse,
  type TableStreamEvent
} from "@cryptopoker/api-schema";
export {
  computeFairnessCommitment,
  createFairnessService,
  type FairnessCommitResult,
  type FairnessProofResult,
  type FairnessRevealResult,
  type FairnessServiceOptions
} from "./fairness.js";
export {
  createTableLifecycleService,
  type ApplyActionResult,
  type JoinTableResult,
  type LeaveTableResult,
  type ReconcileSettlementResult,
  type ResyncResult,
  type TableLifecycleServiceOptions
} from "./table-lifecycle.js";
export {
  createDeterministicEscrowChainGateway,
  createEscrowSettlementExecutor,
  createSettlementReconciliationWorker,
  type EscrowChainGateway,
  type EscrowSettlementSubmission,
  type SettlementConfirmedChainEvent,
  type SettlementExecutionInput,
  type SettlementExecutionResult,
  type SettlementExecutor,
  type SettlementRecord,
  type SettlementReconciliationResult,
  type SettlementReconciliationWorker
} from "./settlement.js";
export {
  createInMemoryObservability,
  createNoopObservability,
  runWithSpan,
  runWithSpanAsync,
  type HandTimeoutObservedInput,
  type ObservabilityAlert,
  type ObservabilityAlertId,
  type ObservabilityCounterPoint,
  type ObservabilityHistogramPoint,
  type ObservabilitySnapshot,
  type ObservabilitySpan,
  type ObservabilitySpanRecord,
  type ObservabilityThresholds,
  type ServiceObservability,
  type SettlementObservedInput,
  type SpanAttributes,
  type SpanEndInput,
  type SpanStatus
} from "./observability.js";
export {
  createWalletAuthSessionService,
  type SessionIssuance,
  type SessionVerification,
  type WalletAuthSessionServiceOptions,
  type WalletSignatureVerifier
} from "./auth-session.js";

export const parseAuthNonceRequest = (payload: unknown): AuthNonceRequest =>
  authNonceRequestSchema.parse(payload);

export const buildAuthNonceResponse = (nonce: string, ttlSeconds = 300): AuthNonceResponse => {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  return authNonceResponseSchema.parse({ nonce, expiresAt });
};

export const parseFairnessCommitRequest = (payload: unknown): FairnessCommitRequest =>
  fairnessCommitRequestSchema.parse(payload);

export const parseFairnessCommitResponse = (payload: unknown): FairnessCommitResponse =>
  fairnessCommitResponseSchema.parse(payload);

export const parseFairnessRevealRequest = (payload: unknown): FairnessRevealRequest =>
  fairnessRevealRequestSchema.parse(payload);

export const parseFairnessRevealResponse = (payload: unknown): FairnessRevealResponse =>
  fairnessRevealResponseSchema.parse(payload);

export const parseFairnessProofRequest = (payload: unknown): FairnessProofRequest =>
  fairnessProofRequestSchema.parse(payload);

export const parseFairnessProofResponse = (payload: unknown): FairnessProofResponse =>
  fairnessProofResponseSchema.parse(payload);

export const createTableStateEvent = (tableId: string) =>
  tableStateEventSchema.parse({
    version: schemaVersion,
    eventType: "table.state.updated",
    tableId,
    handId: null,
    status: "waiting",
    updatedAt: new Date().toISOString()
  });

export const parseTableSnapshotResponse = (payload: unknown): TableSnapshotResponse =>
  tableSnapshotResponseSchema.parse(payload);

export const parseTableResyncRequest = (payload: unknown): TableResyncRequest =>
  tableResyncRequestSchema.parse(payload);

export const parseTableResyncResponse = (payload: unknown): TableResyncResponse =>
  tableResyncResponseSchema.parse(payload);

export const parseTableActionRequest = (payload: unknown): TableActionRequest =>
  tableActionRequestSchema.parse(payload);

export const parseTableActionResponse = (payload: unknown): TableActionResponse =>
  tableActionResponseSchema.parse(payload);

export const parseTableStreamEvent = (payload: unknown): TableStreamEvent =>
  tableStreamEventSchema.parse(payload);

export type AuthAuditLogger = (entry: AuthAuditLog) => void;

export {
  createMvpWebsocketApp,
  startMvpWebsocketServer,
  type MvpWebsocketPlayer,
  type MvpWebsocketRoomSnapshot
} from "./websocket-mvp.js";
