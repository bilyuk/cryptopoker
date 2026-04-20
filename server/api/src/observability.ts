import { randomUUID } from "node:crypto";

type PrimitiveAttribute = string | number | boolean | null | undefined;

export type SpanAttributes = Record<string, PrimitiveAttribute>;

export type SpanStatus = "ok" | "error";

export type ObservabilitySpanRecord = {
  traceId: string;
  spanId: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  durationMs: number | null;
  status: SpanStatus | null;
  error: string | null;
  attributes: SpanAttributes;
};

export type ObservabilityCounterPoint = {
  name: string;
  value: number;
  attributes: SpanAttributes;
};

export type ObservabilityHistogramPoint = {
  name: string;
  value: number;
  recordedAt: string;
  attributes: SpanAttributes;
};

export type ObservabilityAlertId = "auth_failure_spike" | "hand_timeout_saturation" | "settlement_lag";

export type ObservabilityAlert = {
  id: ObservabilityAlertId;
  status: "ok" | "firing";
  severity: "warning" | "critical";
  message: string;
  value: number;
  threshold: number;
  updatedAt: string;
  runbookSlug: "auth-errors" | "hand-timeouts" | "settlement-lag";
};

export type ObservabilityThresholds = {
  windowMs: number;
  authFailureCount: number;
  handTimeoutCount: number;
  settlementLagMs: number;
};

export type SpanEndInput = {
  status?: SpanStatus;
  error?: string;
  attributes?: SpanAttributes;
};

export type ObservabilitySpan = {
  traceId: string;
  spanId: string;
  setAttribute: (name: string, value: PrimitiveAttribute) => void;
  end: (input?: SpanEndInput) => void;
};

export type ObservabilitySnapshot = {
  spans: ObservabilitySpanRecord[];
  counters: ObservabilityCounterPoint[];
  histograms: ObservabilityHistogramPoint[];
  alerts: ObservabilityAlert[];
};

export type SettlementObservedInput = {
  txHash: string;
  tableId: string;
  handId: string;
  timestampMs?: number;
};

export type HandTimeoutObservedInput = {
  tableId: string;
  handId: string;
  actor: "hero" | "villain";
};

export type ServiceObservability = {
  startSpan: (name: string, attributes?: SpanAttributes) => ObservabilitySpan;
  incrementCounter: (name: string, value?: number, attributes?: SpanAttributes) => void;
  recordHistogram: (name: string, value: number, attributes?: SpanAttributes) => void;
  observeAuthResult: (ok: boolean, reason: string) => void;
  observeHandTimeout: (input: HandTimeoutObservedInput) => void;
  observeSettlementSubmitted: (input: SettlementObservedInput) => void;
  observeSettlementConfirmed: (input: SettlementObservedInput) => void;
  evaluateAlerts: (referenceTime?: Date) => ObservabilityAlert[];
  snapshot: () => ObservabilitySnapshot;
};

const defaultThresholds: ObservabilityThresholds = {
  windowMs: 5 * 60 * 1000,
  authFailureCount: 5,
  handTimeoutCount: 3,
  settlementLagMs: 45_000
};

const serializeAttributes = (attributes: SpanAttributes): string => {
  const normalized = Object.entries(attributes)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`);
  return normalized.join("|");
};

const nowMs = () => Date.now();

type WindowedEvent = { atMs: number };

const createNoopSpan = (): ObservabilitySpan => ({
  traceId: "noop",
  spanId: "noop",
  setAttribute: () => undefined,
  end: () => undefined
});

const noopSnapshot: ObservabilitySnapshot = {
  spans: [],
  counters: [],
  histograms: [],
  alerts: []
};

export const createNoopObservability = (): ServiceObservability => ({
  startSpan: () => createNoopSpan(),
  incrementCounter: () => undefined,
  recordHistogram: () => undefined,
  observeAuthResult: () => undefined,
  observeHandTimeout: () => undefined,
  observeSettlementSubmitted: () => undefined,
  observeSettlementConfirmed: () => undefined,
  evaluateAlerts: () => [],
  snapshot: () => noopSnapshot
});

export const createInMemoryObservability = (
  thresholds: Partial<ObservabilityThresholds> = {}
): ServiceObservability => {
  const appliedThresholds: ObservabilityThresholds = { ...defaultThresholds, ...thresholds };
  const spanRecords: ObservabilitySpanRecord[] = [];
  const counterBySeries = new Map<string, ObservabilityCounterPoint>();
  const histogramPoints: ObservabilityHistogramPoint[] = [];
  const authFailures: WindowedEvent[] = [];
  const handTimeouts: WindowedEvent[] = [];
  const pendingSettlements = new Map<string, { submittedAtMs: number; tableId: string; handId: string }>();

  const pruneWindowedEvents = (referenceMs: number) => {
    const minMs = referenceMs - appliedThresholds.windowMs;
    while (authFailures.length > 0 && authFailures[0].atMs < minMs) {
      authFailures.shift();
    }
    while (handTimeouts.length > 0 && handTimeouts[0].atMs < minMs) {
      handTimeouts.shift();
    }
  };

  const incrementCounter = (name: string, value = 1, attributes: SpanAttributes = {}) => {
    const key = `${name}|${serializeAttributes(attributes)}`;
    const existing = counterBySeries.get(key);
    if (existing) {
      existing.value += value;
      return;
    }
    counterBySeries.set(key, {
      name,
      value,
      attributes: { ...attributes }
    });
  };

  const recordHistogram = (name: string, value: number, attributes: SpanAttributes = {}) => {
    histogramPoints.push({
      name,
      value,
      recordedAt: new Date().toISOString(),
      attributes: { ...attributes }
    });
  };

  const startSpan = (name: string, attributes: SpanAttributes = {}): ObservabilitySpan => {
    const startedAtMs = nowMs();
    const record: ObservabilitySpanRecord = {
      traceId: randomUUID(),
      spanId: randomUUID(),
      name,
      startedAt: new Date(startedAtMs).toISOString(),
      endedAt: null,
      durationMs: null,
      status: null,
      error: null,
      attributes: { ...attributes }
    };
    spanRecords.push(record);
    return {
      traceId: record.traceId,
      spanId: record.spanId,
      setAttribute: (key, value) => {
        record.attributes[key] = value;
      },
      end: (input: SpanEndInput = {}) => {
        if (record.endedAt) {
          return;
        }
        const endedAtMs = nowMs();
        record.endedAt = new Date(endedAtMs).toISOString();
        record.durationMs = endedAtMs - startedAtMs;
        record.status = input.status ?? "ok";
        record.error = input.error ?? null;
        if (input.attributes) {
          Object.assign(record.attributes, input.attributes);
        }
      }
    };
  };

  const observeAuthResult = (ok: boolean, reason: string) => {
    const currentMs = nowMs();
    incrementCounter("auth_attempt_total", 1, { ok, reason });
    if (!ok) {
      authFailures.push({ atMs: currentMs });
    }
    pruneWindowedEvents(currentMs);
  };

  const observeHandTimeout = (input: HandTimeoutObservedInput) => {
    const currentMs = nowMs();
    incrementCounter("hand_timeout_total", 1, {
      tableId: input.tableId,
      handId: input.handId,
      actor: input.actor
    });
    handTimeouts.push({ atMs: currentMs });
    pruneWindowedEvents(currentMs);
  };

  const observeSettlementSubmitted = (input: SettlementObservedInput) => {
    const submittedAtMs = input.timestampMs ?? nowMs();
    incrementCounter("settlement_submitted_total", 1, {
      tableId: input.tableId,
      handId: input.handId
    });
    pendingSettlements.set(input.txHash, {
      submittedAtMs,
      tableId: input.tableId,
      handId: input.handId
    });
  };

  const observeSettlementConfirmed = (input: SettlementObservedInput) => {
    const confirmedAtMs = input.timestampMs ?? nowMs();
    const pending = pendingSettlements.get(input.txHash);
    incrementCounter("settlement_confirmed_total", 1, {
      tableId: input.tableId,
      handId: input.handId
    });
    if (pending) {
      const lagMs = Math.max(0, confirmedAtMs - pending.submittedAtMs);
      recordHistogram("settlement_confirmation_lag_ms", lagMs, {
        tableId: input.tableId,
        handId: input.handId
      });
      pendingSettlements.delete(input.txHash);
    }
  };

  const evaluateAlerts = (referenceTime = new Date()): ObservabilityAlert[] => {
    const referenceMs = referenceTime.getTime();
    pruneWindowedEvents(referenceMs);
    let maxSettlementLagMs = 0;
    for (const pending of pendingSettlements.values()) {
      maxSettlementLagMs = Math.max(maxSettlementLagMs, referenceMs - pending.submittedAtMs);
    }
    const updatedAt = referenceTime.toISOString();
    return [
      {
        id: "auth_failure_spike",
        status: authFailures.length >= appliedThresholds.authFailureCount ? "firing" : "ok",
        severity: "warning",
        message: `Auth failures in ${Math.floor(appliedThresholds.windowMs / 1000)}s window`,
        value: authFailures.length,
        threshold: appliedThresholds.authFailureCount,
        updatedAt,
        runbookSlug: "auth-errors"
      },
      {
        id: "hand_timeout_saturation",
        status: handTimeouts.length >= appliedThresholds.handTimeoutCount ? "firing" : "ok",
        severity: "warning",
        message: `Hand timeout auto-actions in ${Math.floor(appliedThresholds.windowMs / 1000)}s window`,
        value: handTimeouts.length,
        threshold: appliedThresholds.handTimeoutCount,
        updatedAt,
        runbookSlug: "hand-timeouts"
      },
      {
        id: "settlement_lag",
        status: maxSettlementLagMs >= appliedThresholds.settlementLagMs ? "firing" : "ok",
        severity: "critical",
        message: "Max pending settlement confirmation lag (ms)",
        value: maxSettlementLagMs,
        threshold: appliedThresholds.settlementLagMs,
        updatedAt,
        runbookSlug: "settlement-lag"
      }
    ];
  };

  const snapshot = (): ObservabilitySnapshot => ({
    spans: [...spanRecords],
    counters: [...counterBySeries.values()],
    histograms: [...histogramPoints],
    alerts: evaluateAlerts()
  });

  return {
    startSpan,
    incrementCounter,
    recordHistogram,
    observeAuthResult,
    observeHandTimeout,
    observeSettlementSubmitted,
    observeSettlementConfirmed,
    evaluateAlerts,
    snapshot
  };
};

export const runWithSpan = <T>(
  observability: ServiceObservability,
  name: string,
  attributes: SpanAttributes | undefined,
  execute: () => T
): T => {
  const span = observability.startSpan(name, attributes ?? {});
  try {
    const result = execute();
    span.end({ status: "ok" });
    return result;
  } catch (error) {
    span.end({
      status: "error",
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

export const runWithSpanAsync = async <T>(
  observability: ServiceObservability,
  name: string,
  attributes: SpanAttributes | undefined,
  execute: () => Promise<T>
): Promise<T> => {
  const span = observability.startSpan(name, attributes ?? {});
  try {
    const result = await execute();
    span.end({ status: "ok" });
    return result;
  } catch (error) {
    span.end({
      status: "error",
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};
