import { randomUUID } from "node:crypto";
import {
  handActionAppliedEventSchema,
  handStreetChangedEventSchema,
  handTimeoutAppliedEventSchema,
  schemaVersion,
  settlementTxConfirmedEventSchema,
  settlementTxSubmittedEventSchema,
  tableActionRequestSchema,
  tableActionResponseSchema,
  tablePhaseChangedEventSchema,
  tableResyncRequestSchema,
  tableResyncResponseSchema,
  tableSeatSchema,
  tableSnapshotResponseSchema,
  tableStreamEventSchema,
  type TableActionRequest,
  type TableActionResponse,
  type TablePhase,
  type TablePlayerAction,
  type TableResyncRequest,
  type TableResyncResponse,
  type TableSeat,
  type TableStreet,
  type TableSnapshotResponse,
  type TableStreamEvent
} from "@cryptopoker/api-schema";
import {
  createEscrowSettlementExecutor,
  type SettlementExecutor
} from "./settlement.js";
import {
  createNoopObservability,
  runWithSpan,
  type ServiceObservability
} from "./observability.js";

type TableSeatRecord = {
  walletAddress: string;
  joinedAt: string;
};

type TableRecord = {
  tableId: string;
  createdAt: string;
  updatedAt: string;
  snapshotVersion: number;
  handId: string | null;
  phase: TablePhase;
  street: TableStreet;
  pot: number;
  currentActor: TableSeat | null;
  legalActions: TablePlayerAction[];
  turnDeadlineMs: number | null;
  settlementTxHash: string | null;
  players: Record<TableSeat, TableSeatRecord | null>;
  sequence: number;
  events: TableStreamEvent[];
  actionResponseByKey: Map<string, TableActionResponse>;
  resyncCacheByScope: Map<
    string,
    {
      snapshotVersion: number;
      lastEventId: string | null;
      response: TableResyncResponse;
    }
  >;
};

type JoinTableInput = {
  tableId: string;
  walletAddress: string;
  seat?: TableSeat;
};

type LeaveTableInput = {
  tableId: string;
  walletAddress: string;
};

type ReadEventsInput = {
  tableId: string;
  afterEventId?: string | null;
};

type ApplyActionInput = TableActionRequest;

export type JoinTableResult =
  | { ok: true; seat: TableSeat; rejoined: boolean; snapshot: TableSnapshotResponse }
  | { ok: false; reason: "table_not_found" | "table_full" | "seat_taken" };

export type LeaveTableResult =
  | { ok: true; seat: TableSeat; snapshot: TableSnapshotResponse }
  | { ok: false; reason: "table_not_found" | "player_not_seated" };

export type ResyncResult =
  | { ok: true; response: TableResyncResponse }
  | { ok: false; reason: "table_not_found" };

export type ApplyActionResult =
  | { ok: true; response: TableActionResponse }
  | { ok: false; reason: "table_not_found" | "player_not_seated" | "not_player_turn" | "invalid_hand" };

export type ReconcileSettlementResult =
  | { ok: true; updated: boolean; alreadyConfirmed: boolean; snapshot: TableSnapshotResponse }
  | { ok: false; reason: "table_not_found" | "invalid_hand" | "tx_hash_mismatch" };

export type TableLifecycleServiceOptions = {
  now?: () => Date;
  resyncCacheTtlSeconds?: number;
  settlementExecutor?: SettlementExecutor;
  observability?: ServiceObservability;
};

const DEFAULT_RESYNC_CACHE_TTL_SECONDS = 30;
const DEFAULT_STACK = 1000;
const ACTIONS_ON_TURN: TablePlayerAction[] = ["check", "call", "bet", "raise", "fold", "all_in"];
const STREETS: TableStreet[] = ["preflop", "flop", "turn", "river", "showdown", "complete"];

export const createTableLifecycleService = (options: TableLifecycleServiceOptions = {}) => {
  const now = options.now ?? (() => new Date());
  const resyncCacheTtlSeconds = options.resyncCacheTtlSeconds ?? DEFAULT_RESYNC_CACHE_TTL_SECONDS;
  const observability = options.observability ?? createNoopObservability();
  const settlementExecutor =
    options.settlementExecutor ?? createEscrowSettlementExecutor({ now, observability });

  const tableById = new Map<string, TableRecord>();

  const createEventBase = (table: TableRecord) => ({
    version: schemaVersion,
    eventId: randomUUID(),
    tableId: table.tableId,
    handId: table.handId,
    sequence: table.sequence++,
    emittedAt: now().toISOString()
  });

  const activeSeatCount = (table: TableRecord) =>
    Object.values(table.players).filter((entry) => entry !== null).length;

  const nextCursor = (table: TableRecord) => `${table.tableId}:${table.sequence}`;

  const legalActionsBySeat = (table: TableRecord) => ({
    hero: table.currentActor === "hero" ? [...table.legalActions] : [],
    villain: table.currentActor === "villain" ? [...table.legalActions] : []
  });

  const toSnapshotResponse = (table: TableRecord): TableSnapshotResponse => {
    const hero = table.players.hero;
    const villain = table.players.villain;
    const snapshot = {
      tableId: table.tableId,
      handId: table.handId,
      phase: table.phase,
      street: table.street,
      pot: table.pot,
      currentActor: table.currentActor,
      legalActionsBySeat: legalActionsBySeat(table),
      legalActions: table.legalActions,
      turnDeadlineMs: table.turnDeadlineMs,
      settlementTxHash: table.settlementTxHash,
      players: [
        {
          seat: "hero" as const,
          stack: hero ? DEFAULT_STACK : 0,
          contributed: 0,
          stateLabel: hero ? "Seated" : "Open seat"
        },
        {
          seat: "villain" as const,
          stack: villain ? DEFAULT_STACK : 0,
          contributed: 0,
          stateLabel: villain ? "Seated" : "Open seat"
        }
      ],
      lastEventId: table.events.at(-1)?.eventId ?? null,
      snapshotVersion: table.snapshotVersion,
      generatedAt: now().toISOString()
    };
    return tableSnapshotResponseSchema.parse({
      snapshot,
      streamCursor: nextCursor(table)
    });
  };

  const bumpSnapshot = (table: TableRecord) => {
    table.snapshotVersion += 1;
    table.updatedAt = now().toISOString();
    table.resyncCacheByScope.clear();
  };

  const appendEvent = (table: TableRecord, event: TableStreamEvent) => {
    table.events.push(tableStreamEventSchema.parse(event));
  };

  const emitPhaseChanged = (
    table: TableRecord,
    previousPhase: TablePhase | null,
    reason: "table_created" | "hand_started" | "player_left" | "hand_resolved" | "settlement_confirmed"
  ) => {
    appendEvent(
      table,
      tablePhaseChangedEventSchema.parse({
        ...createEventBase(table),
        eventType: "table.phase_changed",
        phase: table.phase,
        previousPhase,
        reason
      })
    );
  };

  const emitStreetChanged = (
    table: TableRecord,
    previousStreet: TableStreet | null,
    reason: "hand_started" | "betting_round_complete" | "runout_complete"
  ) => {
    appendEvent(
      table,
      handStreetChangedEventSchema.parse({
        ...createEventBase(table),
        eventType: "hand.street_changed",
        street: table.street,
        previousStreet,
        reason,
        nextActor: table.currentActor,
        legalActionsBySeat: legalActionsBySeat(table),
        legalActions: table.legalActions
      })
    );
  };

  const ensureTable = (tableId: string) => tableById.get(tableId) ?? null;

  const findSeatByWallet = (table: TableRecord, walletAddress: string): TableSeat | null => {
    if (table.players.hero?.walletAddress === walletAddress) {
      return "hero";
    }
    if (table.players.villain?.walletAddress === walletAddress) {
      return "villain";
    }
    return null;
  };

  const createTable = (tableId = randomUUID()) => {
    return runWithSpan(observability, "table.create", { tableId }, () => {
      const createdAt = now().toISOString();
      const table: TableRecord = {
        tableId,
        createdAt,
        updatedAt: createdAt,
        snapshotVersion: 0,
        handId: null,
        phase: "waiting",
        street: "preflop",
        pot: 0,
        currentActor: null,
        legalActions: [],
        turnDeadlineMs: null,
        settlementTxHash: null,
        players: { hero: null, villain: null },
        sequence: 0,
        events: [],
        actionResponseByKey: new Map(),
        resyncCacheByScope: new Map()
      };
      tableById.set(table.tableId, table);
      emitPhaseChanged(table, null, "table_created");
      bumpSnapshot(table);
      return toSnapshotResponse(table);
    });
  };

  const joinTable = (input: JoinTableInput): JoinTableResult => {
    return runWithSpan(observability, "table.join", { tableId: input.tableId }, () => {
      const validatedSeat = input.seat ? tableSeatSchema.parse(input.seat) : null;
      const table = ensureTable(input.tableId);
      if (!table) {
        return { ok: false, reason: "table_not_found" };
      }

      const existingSeat = findSeatByWallet(table, input.walletAddress);
      if (existingSeat) {
        return { ok: true, seat: existingSeat, rejoined: true, snapshot: toSnapshotResponse(table) };
      }

      let assignedSeat: TableSeat | null = null;
      if (validatedSeat) {
        if (table.players[validatedSeat]) {
          return { ok: false, reason: "seat_taken" };
        }
        assignedSeat = validatedSeat;
      } else if (!table.players.hero) {
        assignedSeat = "hero";
      } else if (!table.players.villain) {
        assignedSeat = "villain";
      }

      if (!assignedSeat) {
        return { ok: false, reason: "table_full" };
      }

      table.players[assignedSeat] = {
        walletAddress: input.walletAddress,
        joinedAt: now().toISOString()
      };

      const playersAfterJoin = activeSeatCount(table);
      if (playersAfterJoin === 2 && table.phase === "waiting") {
        const previousPhase = table.phase;
        table.phase = "in_hand";
        table.handId = randomUUID();
        table.street = "preflop";
        table.currentActor = "hero";
        table.legalActions = [...ACTIONS_ON_TURN];
        table.turnDeadlineMs = now().getTime() + 15_000;
        emitPhaseChanged(table, previousPhase, "hand_started");
        emitStreetChanged(table, null, "hand_started");
      }
      bumpSnapshot(table);

      return {
        ok: true,
        seat: assignedSeat,
        rejoined: false,
        snapshot: toSnapshotResponse(table)
      };
    });
  };

  const leaveTable = (input: LeaveTableInput): LeaveTableResult => {
    return runWithSpan(observability, "table.leave", { tableId: input.tableId }, () => {
      const table = ensureTable(input.tableId);
      if (!table) {
        return { ok: false, reason: "table_not_found" };
      }
      const seat = findSeatByWallet(table, input.walletAddress);
      if (!seat) {
        return { ok: false, reason: "player_not_seated" };
      }

      table.players[seat] = null;
      if (table.phase === "in_hand") {
        const previousPhase = table.phase;
        table.phase = "paused";
        table.currentActor = null;
        table.legalActions = [];
        table.turnDeadlineMs = null;
        emitPhaseChanged(table, previousPhase, "player_left");
      }
      bumpSnapshot(table);
      return { ok: true, seat, snapshot: toSnapshotResponse(table) };
    });
  };

  const resync = (payload: unknown): ResyncResult => {
    return runWithSpan(observability, "table.resync", undefined, () => {
      const req = tableResyncRequestSchema.parse(payload) as TableResyncRequest;
      const table = ensureTable(req.tableId);
      if (!table) {
        return { ok: false, reason: "table_not_found" };
      }

      const scopeKey = `${req.tableId}:${req.clientSessionId}:${req.handId ?? "none"}`;
      const cached = table.resyncCacheByScope.get(scopeKey);
      if (cached && cached.snapshotVersion === table.snapshotVersion && cached.lastEventId === req.lastEventId) {
        return {
          ok: true,
          response: tableResyncResponseSchema.parse({
            ...cached.response,
            idempotency: {
              ...cached.response.idempotency,
              replayed: true
            }
          })
        };
      }

      const response = tableResyncResponseSchema.parse({
        snapshot: toSnapshotResponse(table).snapshot,
        streamCursor: nextCursor(table),
        idempotency: {
          scopeKey,
          replayed: false,
          expiresAt: new Date(now().getTime() + resyncCacheTtlSeconds * 1000).toISOString()
        }
      });

      table.resyncCacheByScope.set(scopeKey, {
        snapshotVersion: table.snapshotVersion,
        lastEventId: req.lastEventId,
        response
      });

      return { ok: true, response };
    });
  };

  const applyAction = (payload: unknown): ApplyActionResult => {
    return runWithSpan(observability, "table.apply_action", undefined, () => {
      const req = tableActionRequestSchema.parse(payload) as ApplyActionInput;
      const table = ensureTable(req.tableId);
      if (!table) {
        return { ok: false, reason: "table_not_found" };
      }
      if (!table.handId || table.handId !== req.handId) {
        return { ok: false, reason: "invalid_hand" };
      }
      const actorSeat = table.players[req.actor];
      if (!actorSeat) {
        return { ok: false, reason: "player_not_seated" };
      }
      if (table.currentActor !== req.actor) {
        return { ok: false, reason: "not_player_turn" };
      }

      const scopeKey = `${req.tableId}:${req.handId}:${req.actor}:${req.idempotencyKey}`;
      const cached = table.actionResponseByKey.get(scopeKey);
      if (cached) {
        return { ok: true, response: cached };
      }

      const nextActor = req.actor === "hero" ? "villain" : "hero";
      table.currentActor = nextActor;
      table.legalActions = [...ACTIONS_ON_TURN];
      table.turnDeadlineMs = now().getTime() + 15_000;
      if (req.source === "timeout_auto_action") {
        observability.observeHandTimeout({
          tableId: req.tableId,
          handId: req.handId,
          actor: req.actor
        });
        appendEvent(
          table,
          handTimeoutAppliedEventSchema.parse({
            ...createEventBase(table),
            eventType: "hand.timeout_applied",
            timedOutActor: req.actor,
            timeoutMs: 15_000,
            autoAction: {
              actor: req.actor,
              action: req.action,
              amount: req.amount ?? 0
            },
            potAfter: table.pot,
            nextActor: table.currentActor,
            legalActionsBySeat: legalActionsBySeat(table),
            legalActions: table.legalActions
          })
        );
      }
      appendEvent(
        table,
        handActionAppliedEventSchema.parse({
          ...createEventBase(table),
          eventType: "hand.action_applied",
          actor: req.actor,
          action: req.action,
          amount: req.amount ?? 0,
          source: req.source,
          potAfter: table.pot,
          nextActor: table.currentActor,
          legalActionsBySeat: legalActionsBySeat(table),
          legalActions: table.legalActions
        })
      );

      if (req.action === "fold") {
        const winnerSeat = req.actor === "hero" ? "villain" : "hero";
        const winnerWalletAddress = table.players[winnerSeat]?.walletAddress;
        const loserWalletAddress = table.players[req.actor]?.walletAddress;
        if (!winnerWalletAddress || !loserWalletAddress) {
          return { ok: false, reason: "player_not_seated" };
        }

        const submission = settlementExecutor.executeSettlement({
          tableId: table.tableId,
          handId: req.handId,
          winnerSeat,
          winnerWalletAddress,
          loserWalletAddress,
          amount: table.pot,
          idempotencyKey: `${table.tableId}:${req.handId}`
        });
        const txHash = submission.txHash;
        const previousPhase = table.phase;
        table.phase = "settling";
        table.currentActor = null;
        table.legalActions = [];
        table.turnDeadlineMs = null;
        table.settlementTxHash = txHash;
        emitPhaseChanged(table, previousPhase, "hand_resolved");
        appendEvent(
          table,
          settlementTxSubmittedEventSchema.parse({
            ...createEventBase(table),
            eventType: "settlement.tx_submitted",
            txHash
          })
        );
      } else if (table.currentActor === "hero") {
        const previousStreet = table.street;
        const currentStreetIndex = STREETS.indexOf(table.street);
        const nextStreet = STREETS[Math.min(currentStreetIndex + 1, STREETS.length - 1)];
        table.street = nextStreet;
        emitStreetChanged(
          table,
          previousStreet,
          nextStreet === "complete" ? "runout_complete" : "betting_round_complete"
        );
      }

      bumpSnapshot(table);
      const actionEventId =
        [...table.events]
          .reverse()
          .find((event) => event.eventType === "hand.action_applied")?.eventId ?? null;
      const response = tableActionResponseSchema.parse({
        accepted: true,
        actionEventId,
        streamCursor: nextCursor(table)
      });
      table.actionResponseByKey.set(scopeKey, response);
      return { ok: true, response };
    });
  };

  const reconcileSettlementConfirmation = (payload: {
    tableId: string;
    handId: string;
    txHash: string;
    blockNumber: number;
  }): ReconcileSettlementResult => {
    return runWithSpan(observability, "table.reconcile_settlement_confirmation", undefined, () => {
      const table = ensureTable(payload.tableId);
      if (!table) {
        return { ok: false, reason: "table_not_found" };
      }
      if (!table.handId || table.handId !== payload.handId) {
        return { ok: false, reason: "invalid_hand" };
      }
      if (table.settlementTxHash !== payload.txHash) {
        return { ok: false, reason: "tx_hash_mismatch" };
      }

      const wasCompleted = table.phase === "completed";
      settlementExecutor.markConfirmed(payload.txHash, payload.blockNumber, now().toISOString());
      if (wasCompleted) {
        return { ok: true, updated: false, alreadyConfirmed: true, snapshot: toSnapshotResponse(table) };
      }

      appendEvent(
        table,
        settlementTxConfirmedEventSchema.parse({
          ...createEventBase(table),
          eventType: "settlement.tx_confirmed",
          txHash: payload.txHash,
          blockNumber: payload.blockNumber
        })
      );
      const previousPhase = table.phase;
      table.phase = "completed";
      table.currentActor = null;
      table.legalActions = [];
      table.turnDeadlineMs = null;
      emitPhaseChanged(table, previousPhase, "settlement_confirmed");
      bumpSnapshot(table);
      return { ok: true, updated: true, alreadyConfirmed: false, snapshot: toSnapshotResponse(table) };
    });
  };

  const readEvents = (input: ReadEventsInput) => {
    return runWithSpan(observability, "table.read_events", { tableId: input.tableId }, () => {
      const table = ensureTable(input.tableId);
      if (!table) {
        return { ok: false as const, reason: "table_not_found" as const };
      }
      if (!input.afterEventId) {
        return {
          ok: true as const,
          events: table.events,
          streamCursor: nextCursor(table)
        };
      }
      const index = table.events.findIndex((event) => event.eventId === input.afterEventId);
      const events = index >= 0 ? table.events.slice(index + 1) : table.events;
      return {
        ok: true as const,
        events,
        streamCursor: nextCursor(table)
      };
    });
  };

  return {
    createTable,
    joinTable,
    leaveTable,
    resync,
    applyAction,
    reconcileSettlementConfirmation,
    readEvents
  };
};
