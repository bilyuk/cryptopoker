import {
  tableActionRequestSchema,
  tableActionResponseSchema,
  tablePlayerActionSchema,
  tableResyncRequestSchema,
  tableResyncResponseSchema,
  tableSnapshotResponseSchema,
  tableStreamEventSchema,
  type TableActionRequest,
  type TableActionResponse,
  type TablePhase,
  type TablePlayerAction,
  type TableResyncRequest,
  type TableResyncResponse,
  type TableSeat,
  type TableSnapshotResponse,
  type TableStreamEvent
} from "@cryptopoker/api-schema";

export type TableEventsResponse = {
  events: TableStreamEvent[];
  streamCursor: string;
};

export type TableSessionApiClient = {
  getSnapshot: (input: { tableId: string }) => Promise<TableSnapshotResponse>;
  resync: (input: TableResyncRequest) => Promise<TableResyncResponse>;
  readEvents: (input: { tableId: string; afterEventId?: string | null }) => Promise<TableEventsResponse>;
  submitAction: (input: TableActionRequest) => Promise<TableActionResponse>;
};

export type TableSessionClientState = {
  tableId: string;
  seat: TableSeat;
  handId: string | null;
  phase: TablePhase;
  currentActor: TableSeat | null;
  legalActions: TablePlayerAction[];
  settlementTxHash: string | null;
  lastEventId: string | null;
  streamCursor: string | null;
  eventCount: number;
  pendingAction: boolean;
  timeoutDetected: boolean;
  completed: boolean;
};

export type CreateTableSessionClientInput = {
  api: TableSessionApiClient;
  tableId: string;
  seat: TableSeat;
  clientSessionId: string;
};

export const createTableSessionClient = ({ api, tableId, seat, clientSessionId }: CreateTableSessionClientInput) => {
  let snapshot: TableSnapshotResponse["snapshot"] | null = null;
  let streamCursor: string | null = null;
  let lastEventId: string | null = null;
  let pendingAction = false;
  let timeoutDetected = false;
  const eventLog: TableStreamEvent[] = [];
  let actionCounter = 0;

  const setSnapshot = (payload: TableSnapshotResponse) => {
    const parsed = tableSnapshotResponseSchema.parse(payload);
    snapshot = parsed.snapshot;
    streamCursor = parsed.streamCursor;
    lastEventId = parsed.snapshot.lastEventId;
  };

  const applyEvent = (eventPayload: TableStreamEvent) => {
    const event = tableStreamEventSchema.parse(eventPayload);
    eventLog.push(event);
    lastEventId = event.eventId;

    if (!snapshot) {
      return;
    }

    if (event.eventType === "table.phase_changed") {
      snapshot.phase = event.phase;
      snapshot.currentActor = event.phase === "settling" || event.phase === "completed" ? null : snapshot.currentActor;
      if (event.phase === "completed") {
        snapshot.legalActions = [];
        snapshot.legalActionsBySeat = { hero: [], villain: [] };
      }
    }

    if (event.eventType === "hand.street_changed") {
      snapshot.street = event.street;
      snapshot.currentActor = event.nextActor;
      snapshot.legalActions = event.legalActions;
      snapshot.legalActionsBySeat = event.legalActionsBySeat;
    }

    if (event.eventType === "hand.action_applied") {
      snapshot.currentActor = event.nextActor;
      snapshot.pot = event.potAfter;
      snapshot.legalActions = event.legalActions;
      snapshot.legalActionsBySeat = event.legalActionsBySeat;
      if (event.actor === seat) {
        pendingAction = false;
      }
    }

    if (event.eventType === "hand.timeout_applied") {
      snapshot.currentActor = event.nextActor;
      snapshot.pot = event.potAfter;
      snapshot.legalActions = event.legalActions;
      snapshot.legalActionsBySeat = event.legalActionsBySeat;
      if (event.timedOutActor === seat) {
        timeoutDetected = true;
        pendingAction = false;
      }
    }

    if (event.eventType === "settlement.tx_submitted") {
      snapshot.settlementTxHash = event.txHash;
    }

    if (event.eventType === "settlement.tx_confirmed") {
      snapshot.phase = "completed";
      snapshot.currentActor = null;
      snapshot.legalActions = [];
      snapshot.legalActionsBySeat = { hero: [], villain: [] };
      snapshot.settlementTxHash = event.txHash;
    }

    snapshot.lastEventId = event.eventId;
    snapshot.snapshotVersion += 1;
    snapshot.generatedAt = event.emittedAt;
  };

  const pullEvents = async () => {
    const response = await api.readEvents({ tableId, afterEventId: lastEventId });
    const parsed = {
      events: response.events.map((event) => tableStreamEventSchema.parse(event)),
      streamCursor: response.streamCursor
    };
    parsed.events
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .forEach((event) => applyEvent(event));
    streamCursor = parsed.streamCursor;
    return parsed.events;
  };

  const bootstrap = async () => {
    const response = await api.getSnapshot({ tableId });
    setSnapshot(response);
    return getState();
  };

  const resync = async () => {
    const req = tableResyncRequestSchema.parse({
      tableId,
      clientSessionId,
      handId: snapshot?.handId ?? null,
      lastEventId
    });
    const response = tableResyncResponseSchema.parse(await api.resync(req));
    setSnapshot({ snapshot: response.snapshot, streamCursor: response.streamCursor });
    return response;
  };

  const submitAction = async (actionInput: {
    action: TablePlayerAction;
    amount?: number;
    source?: "player_input" | "timeout_auto_action";
    idempotencyKey?: string;
  }) => {
    if (!snapshot || !snapshot.handId) {
      throw new Error("Cannot submit action without active hand");
    }

    const isMyTurn = snapshot.currentActor === seat;
    const legal = snapshot.legalActionsBySeat[seat] ?? [];
    if (!isMyTurn || !legal.includes(actionInput.action)) {
      throw new Error("Action is not legal for current seat state");
    }

    actionCounter += 1;
    pendingAction = true;

    const request = tableActionRequestSchema.parse({
      tableId,
      handId: snapshot.handId,
      actor: seat,
      action: tablePlayerActionSchema.parse(actionInput.action),
      source: actionInput.source ?? "player_input",
      amount: actionInput.amount,
      idempotencyKey: actionInput.idempotencyKey ?? `${clientSessionId}:${actionCounter}:${Date.now()}`
    });

    const response = tableActionResponseSchema.parse(await api.submitAction(request));
    return response;
  };

  const getState = (): TableSessionClientState => ({
    tableId,
    seat,
    handId: snapshot?.handId ?? null,
    phase: snapshot?.phase ?? "waiting",
    currentActor: snapshot?.currentActor ?? null,
    legalActions: snapshot?.legalActionsBySeat[seat] ?? [],
    settlementTxHash: snapshot?.settlementTxHash ?? null,
    lastEventId,
    streamCursor,
    eventCount: eventLog.length,
    pendingAction,
    timeoutDetected,
    completed: snapshot?.phase === "completed"
  });

  return {
    bootstrap,
    pullEvents,
    resync,
    submitAction,
    getState
  };
};
