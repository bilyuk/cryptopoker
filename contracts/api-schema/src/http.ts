import { z } from "zod";

export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "walletAddress must be a 20-byte hex string");

export const authNonceRequestSchema = z.object({
  walletAddress: walletAddressSchema
});

export type AuthNonceRequest = z.infer<typeof authNonceRequestSchema>;

export const authNonceResponseSchema = z.object({
  nonce: z.string(),
  expiresAt: z.string().datetime()
});

export type AuthNonceResponse = z.infer<typeof authNonceResponseSchema>;

export const sessionIssueRequestSchema = z.object({
  walletAddress: walletAddressSchema,
  signature: z.string(),
  nonce: z.string()
});

export type SessionIssueRequest = z.infer<typeof sessionIssueRequestSchema>;

export const sessionIssueResponseSchema = z.object({
  accessToken: z.string(),
  sessionId: z.string().uuid(),
  expiresAt: z.string().datetime()
});

export type SessionIssueResponse = z.infer<typeof sessionIssueResponseSchema>;

export const authFailureReasonSchema = z.enum([
  "nonce_not_found",
  "nonce_expired",
  "nonce_reused",
  "signature_invalid",
  "session_missing",
  "session_expired",
  "session_revoked",
  "token_invalid"
]);

export type AuthFailureReason = z.infer<typeof authFailureReasonSchema>;

export const authAuditLogSchema = z.object({
  walletAddress: walletAddressSchema,
  sessionId: z.string().uuid().nullable(),
  success: z.boolean(),
  reason: authFailureReasonSchema.or(z.literal("ok")).or(z.literal("suspicious_reconnect")),
  occurredAt: z.string().datetime()
});

export type AuthAuditLog = z.infer<typeof authAuditLogSchema>;

export const tableSeatSchema = z.enum(["hero", "villain"]);
export type TableSeat = z.infer<typeof tableSeatSchema>;

export const tablePlayerActionSchema = z.enum(["check", "call", "bet", "raise", "fold", "all_in"]);
export type TablePlayerAction = z.infer<typeof tablePlayerActionSchema>;

export const tableActionSourceSchema = z.enum(["player_input", "timeout_auto_action"]);
export type TableActionSource = z.infer<typeof tableActionSourceSchema>;

export const tableLegalActionsBySeatSchema = z.object({
  hero: z.array(tablePlayerActionSchema),
  villain: z.array(tablePlayerActionSchema)
});
export type TableLegalActionsBySeat = z.infer<typeof tableLegalActionsBySeatSchema>;

export const tablePhaseSchema = z.enum([
  "waiting",
  "in_hand",
  "showdown",
  "settling",
  "completed",
  "paused"
]);
export type TablePhase = z.infer<typeof tablePhaseSchema>;

export const tableStreetSchema = z.enum(["preflop", "flop", "turn", "river", "showdown", "complete"]);
export type TableStreet = z.infer<typeof tableStreetSchema>;

export const tablePlayerSnapshotSchema = z.object({
  seat: tableSeatSchema,
  stack: z.number().int().nonnegative(),
  contributed: z.number().int().nonnegative(),
  stateLabel: z.string()
});
export type TablePlayerSnapshot = z.infer<typeof tablePlayerSnapshotSchema>;

export const settlementTxHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "settlement tx hash must be a 32-byte hex string");

export const fairnessCommitmentHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, "fairness commitment must be a 32-byte hex string");
export type FairnessCommitmentHash = z.infer<typeof fairnessCommitmentHashSchema>;

export const fairnessCommitRequestSchema = z.object({
  tableId: z.string().uuid(),
  handId: z.string().uuid(),
  commitment: fairnessCommitmentHashSchema
});
export type FairnessCommitRequest = z.infer<typeof fairnessCommitRequestSchema>;

export const fairnessCommitResponseSchema = z.object({
  tableId: z.string().uuid(),
  handId: z.string().uuid(),
  commitment: fairnessCommitmentHashSchema,
  committedAt: z.string().datetime()
});
export type FairnessCommitResponse = z.infer<typeof fairnessCommitResponseSchema>;

export const fairnessRevealRequestSchema = z.object({
  tableId: z.string().uuid(),
  handId: z.string().uuid(),
  reveal: z.string().min(1),
  revealSalt: z.string().min(1).max(256).optional()
});
export type FairnessRevealRequest = z.infer<typeof fairnessRevealRequestSchema>;

export const fairnessRevealResponseSchema = z.object({
  tableId: z.string().uuid(),
  handId: z.string().uuid(),
  reveal: z.string(),
  revealSalt: z.string().nullable(),
  revealedAt: z.string().datetime()
});
export type FairnessRevealResponse = z.infer<typeof fairnessRevealResponseSchema>;

export const fairnessProofRequestSchema = z.object({
  tableId: z.string().uuid(),
  handId: z.string().uuid()
});
export type FairnessProofRequest = z.infer<typeof fairnessProofRequestSchema>;

export const fairnessProofResponseSchema = z.object({
  tableId: z.string().uuid(),
  handId: z.string().uuid(),
  commitment: z.object({
    value: fairnessCommitmentHashSchema,
    committedAt: z.string().datetime()
  }),
  reveal: z.object({
    value: z.string(),
    revealSalt: z.string().nullable(),
    revealedAt: z.string().datetime()
  }),
  proof: z.object({
    algorithm: z.literal("sha256"),
    computedCommitment: fairnessCommitmentHashSchema,
    matchesCommitment: z.boolean(),
    transcriptHash: fairnessCommitmentHashSchema
  }),
  finalizedAt: z.string().datetime()
});
export type FairnessProofResponse = z.infer<typeof fairnessProofResponseSchema>;

export const tableSnapshotSchema = z.object({
  tableId: z.string().uuid(),
  handId: z.string().uuid().nullable(),
  phase: tablePhaseSchema,
  street: tableStreetSchema,
  pot: z.number().int().nonnegative(),
  currentActor: tableSeatSchema.nullable(),
  legalActionsBySeat: tableLegalActionsBySeatSchema,
  legalActions: z.array(tablePlayerActionSchema),
  turnDeadlineMs: z.number().int().nullable(),
  settlementTxHash: settlementTxHashSchema.nullable(),
  players: z.array(tablePlayerSnapshotSchema).length(2),
  lastEventId: z.string().uuid().nullable(),
  snapshotVersion: z.number().int().nonnegative(),
  generatedAt: z.string().datetime()
});
export type TableSnapshot = z.infer<typeof tableSnapshotSchema>;

export const tableSnapshotResponseSchema = z.object({
  snapshot: tableSnapshotSchema,
  streamCursor: z.string().min(1)
});
export type TableSnapshotResponse = z.infer<typeof tableSnapshotResponseSchema>;

export const tableResyncRequestSchema = z.object({
  tableId: z.string().uuid(),
  clientSessionId: z.string().uuid(),
  handId: z.string().uuid().nullable(),
  lastEventId: z.string().uuid().nullable()
});
export type TableResyncRequest = z.infer<typeof tableResyncRequestSchema>;

export const tableResyncIdempotencySchema = z.object({
  scopeKey: z.string().min(1),
  replayed: z.boolean(),
  expiresAt: z.string().datetime()
});
export type TableResyncIdempotency = z.infer<typeof tableResyncIdempotencySchema>;

export const tableResyncResponseSchema = z.object({
  snapshot: tableSnapshotSchema,
  streamCursor: z.string().min(1),
  idempotency: tableResyncIdempotencySchema
});
export type TableResyncResponse = z.infer<typeof tableResyncResponseSchema>;

export const tableActionRequestSchema = z.object({
  tableId: z.string().uuid(),
  handId: z.string().uuid(),
  actor: tableSeatSchema,
  action: tablePlayerActionSchema,
  source: tableActionSourceSchema.default("player_input"),
  amount: z.number().int().nonnegative().optional(),
  idempotencyKey: z.string().min(8).max(128)
});
export type TableActionRequest = z.infer<typeof tableActionRequestSchema>;

export const tableActionResponseSchema = z.object({
  accepted: z.boolean(),
  actionEventId: z.string().uuid().nullable(),
  streamCursor: z.string().min(1)
});
export type TableActionResponse = z.infer<typeof tableActionResponseSchema>;
