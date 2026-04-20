# Observability Baseline

This baseline defines tracing, metrics, dashboards, and alerts for MVP gameplay-critical flows.

## Trace coverage

`@cryptopoker/backend-api` now emits spans for:

- `auth.request_nonce`
- `auth.issue_session`
- `auth.verify_session_token`
- `auth.revoke_session`
- `table.create`
- `table.join`
- `table.leave`
- `table.resync`
- `table.apply_action`
- `table.read_events`
- `table.reconcile_settlement_confirmation`
- `settlement.execute`
- `settlement.mark_confirmed`

Each span includes operation attributes (`tableId`, `handId`, `txHash`, or request-scoped fields when present).

## Metric names

Counters:

- `auth_attempt_total` (`ok`, `reason` labels)
- `hand_timeout_total` (`tableId`, `handId`, `actor` labels)
- `settlement_submitted_total` (`tableId`, `handId` labels)
- `settlement_confirmed_total` (`tableId`, `handId` labels)

Histogram:

- `settlement_confirmation_lag_ms` (`tableId`, `handId` labels)

## Alert thresholds (MVP defaults)

Window: 5 minutes

- Auth failure spike: `auth_failure_spike` fires when failed auth attempts >= `5`.
- Hand timeout saturation: `hand_timeout_saturation` fires when timeout auto-actions >= `3`.
- Settlement lag: `settlement_lag` fires when max pending settlement lag >= `45_000` ms.

These thresholds are configurable through `createInMemoryObservability({ ...thresholds })`.

## Dashboard panels

Minimum dashboard set:

- Auth success/failure split (`auth_attempt_total` grouped by `ok` + `reason`)
- Timeout rate by table (`hand_timeout_total` grouped by `tableId`)
- Settlement pipeline (`settlement_submitted_total` vs `settlement_confirmed_total`)
- Settlement lag percentile and max (`settlement_confirmation_lag_ms`)
- Live alert state (`evaluateAlerts()` projection)

## Wiring guidance

Instantiate one shared observability object and pass it into all services:

```ts
const observability = createInMemoryObservability();
const settlement = createEscrowSettlementExecutor({ observability });
const table = createTableLifecycleService({ observability, settlementExecutor: settlement });
const auth = createWalletAuthSessionService({ sessionSecret, observability, verifySignature });
```

This ensures traces and metrics span auth, table/hand progression, and settlement confirmation in one signal plane.
