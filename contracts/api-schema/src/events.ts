import { z } from "zod";
import {
  tableActionSourceSchema,
  settlementTxHashSchema,
  tableLegalActionsBySeatSchema,
  tablePhaseSchema,
  tablePlayerActionSchema,
  tableSeatSchema,
  tableStreetSchema
} from "./http.js";

export const schemaVersion = "0.2.0" as const;

export const tableStatusSchema = z.enum(["waiting", "active", "settling", "closed"]);
export type TableStatus = z.infer<typeof tableStatusSchema>;

export const tableStateEventSchema = z.object({
  version: z.literal(schemaVersion),
  eventType: z.literal("table.state.updated"),
  tableId: z.string().uuid(),
  handId: z.string().uuid().nullable(),
  status: tableStatusSchema,
  updatedAt: z.string().datetime()
});

export type TableStateEvent = z.infer<typeof tableStateEventSchema>;

const tableStreamEventBaseSchema = z.object({
  version: z.literal(schemaVersion),
  eventId: z.string().uuid(),
  tableId: z.string().uuid(),
  handId: z.string().uuid().nullable(),
  sequence: z.number().int().nonnegative(),
  emittedAt: z.string().datetime()
});

export const tablePhaseTransitionReasonSchema = z.enum([
  "table_created",
  "hand_started",
  "player_left",
  "hand_resolved",
  "settlement_confirmed"
]);
export type TablePhaseTransitionReason = z.infer<typeof tablePhaseTransitionReasonSchema>;

export const tablePhaseChangedEventSchema = tableStreamEventBaseSchema.extend({
  eventType: z.literal("table.phase_changed"),
  phase: tablePhaseSchema,
  previousPhase: tablePhaseSchema.nullable(),
  reason: tablePhaseTransitionReasonSchema
});
export type TablePhaseChangedEvent = z.infer<typeof tablePhaseChangedEventSchema>;

export const handStreetTransitionReasonSchema = z.enum(["hand_started", "betting_round_complete", "runout_complete"]);
export type HandStreetTransitionReason = z.infer<typeof handStreetTransitionReasonSchema>;

export const handStreetChangedEventSchema = tableStreamEventBaseSchema.extend({
  eventType: z.literal("hand.street_changed"),
  street: tableStreetSchema,
  previousStreet: tableStreetSchema.nullable(),
  reason: handStreetTransitionReasonSchema,
  nextActor: tableSeatSchema.nullable(),
  legalActionsBySeat: tableLegalActionsBySeatSchema,
  legalActions: z.array(tablePlayerActionSchema)
});
export type HandStreetChangedEvent = z.infer<typeof handStreetChangedEventSchema>;

export const handActionAppliedEventSchema = tableStreamEventBaseSchema.extend({
  eventType: z.literal("hand.action_applied"),
  actor: tableSeatSchema,
  action: tablePlayerActionSchema,
  amount: z.number().int().nonnegative(),
  source: tableActionSourceSchema,
  potAfter: z.number().int().nonnegative(),
  nextActor: tableSeatSchema.nullable(),
  legalActionsBySeat: tableLegalActionsBySeatSchema,
  legalActions: z.array(tablePlayerActionSchema)
});
export type HandActionAppliedEvent = z.infer<typeof handActionAppliedEventSchema>;

export const handTimeoutAppliedEventSchema = tableStreamEventBaseSchema.extend({
  eventType: z.literal("hand.timeout_applied"),
  timedOutActor: tableSeatSchema,
  timeoutMs: z.number().int().positive(),
  autoAction: z.object({
    actor: tableSeatSchema,
    action: tablePlayerActionSchema,
    amount: z.number().int().nonnegative()
  }),
  potAfter: z.number().int().nonnegative(),
  nextActor: tableSeatSchema.nullable(),
  legalActionsBySeat: tableLegalActionsBySeatSchema,
  legalActions: z.array(tablePlayerActionSchema)
});
export type HandTimeoutAppliedEvent = z.infer<typeof handTimeoutAppliedEventSchema>;

export const settlementTxSubmittedEventSchema = tableStreamEventBaseSchema.extend({
  eventType: z.literal("settlement.tx_submitted"),
  txHash: settlementTxHashSchema
});
export type SettlementTxSubmittedEvent = z.infer<typeof settlementTxSubmittedEventSchema>;

export const settlementTxConfirmedEventSchema = tableStreamEventBaseSchema.extend({
  eventType: z.literal("settlement.tx_confirmed"),
  txHash: settlementTxHashSchema,
  blockNumber: z.number().int().positive()
});
export type SettlementTxConfirmedEvent = z.infer<typeof settlementTxConfirmedEventSchema>;

export const tableStreamEventSchema = z.discriminatedUnion("eventType", [
  tablePhaseChangedEventSchema,
  handStreetChangedEventSchema,
  handActionAppliedEventSchema,
  handTimeoutAppliedEventSchema,
  settlementTxSubmittedEventSchema,
  settlementTxConfirmedEventSchema
]);
export type TableStreamEvent = z.infer<typeof tableStreamEventSchema>;
