import assert from "node:assert/strict";
import test from "node:test";
import {
  createEscrowSettlementExecutor,
  createInMemoryObservability,
  createTableLifecycleService,
  createWalletAuthSessionService
} from "../dist/index.js";

const HERO_WALLET = "0x1111111111111111111111111111111111111111";
const VILLAIN_WALLET = "0x2222222222222222222222222222222222222222";

test("fires auth failure and hand-timeout alerts from service signals", async () => {
  const observability = createInMemoryObservability({
    windowMs: 60_000,
    authFailureCount: 2,
    handTimeoutCount: 1,
    settlementLagMs: 10_000
  });

  const auth = createWalletAuthSessionService({
    sessionSecret: "test-secret",
    observability,
    verifySignature: async () => false
  });

  const nonce = auth.requestNonce({ walletAddress: HERO_WALLET });
  const firstAuth = await auth.issueSession({
    walletAddress: HERO_WALLET,
    nonce: nonce.nonce,
    signature: "bad-sig"
  });
  assert.equal(firstAuth.ok, false);

  const secondNonce = auth.requestNonce({ walletAddress: HERO_WALLET });
  const secondAuth = await auth.issueSession({
    walletAddress: HERO_WALLET,
    nonce: secondNonce.nonce,
    signature: "bad-sig"
  });
  assert.equal(secondAuth.ok, false);

  const table = createTableLifecycleService({ observability });
  const created = table.createTable();
  const tableId = created.snapshot.tableId;
  table.joinTable({ tableId, walletAddress: HERO_WALLET });
  const joined = table.joinTable({ tableId, walletAddress: VILLAIN_WALLET });
  assert.equal(joined.ok, true);

  const action = table.applyAction({
    tableId,
    handId: joined.snapshot.snapshot.handId,
    actor: "hero",
    action: "fold",
    source: "timeout_auto_action",
    idempotencyKey: "timeout-1"
  });
  assert.equal(action.ok, true);

  const alerts = observability.evaluateAlerts();
  const authAlert = alerts.find((alert) => alert.id === "auth_failure_spike");
  const timeoutAlert = alerts.find((alert) => alert.id === "hand_timeout_saturation");
  assert.equal(authAlert?.status, "firing");
  assert.equal(timeoutAlert?.status, "firing");
});

test("settlement lag alert clears after confirmation and records lag histogram", () => {
  let currentMs = Date.parse("2026-01-01T00:00:00.000Z");
  const now = () => new Date(currentMs);
  const observability = createInMemoryObservability({
    windowMs: 60_000,
    authFailureCount: 10,
    handTimeoutCount: 10,
    settlementLagMs: 1_000
  });
  const executor = createEscrowSettlementExecutor({ now, observability });

  const submission = executor.executeSettlement({
    tableId: "table-1",
    handId: "hand-1",
    winnerSeat: "hero",
    winnerWalletAddress: HERO_WALLET,
    loserWalletAddress: VILLAIN_WALLET,
    amount: 200,
    idempotencyKey: "table-1:hand-1"
  });
  assert.equal(submission.replayed, false);

  currentMs += 1_500;
  const laggingAlerts = observability.evaluateAlerts(now());
  const lagAlert = laggingAlerts.find((alert) => alert.id === "settlement_lag");
  assert.equal(lagAlert?.status, "firing");

  currentMs += 500;
  executor.markConfirmed(submission.txHash, 12345, now().toISOString());
  const recoveredAlerts = observability.evaluateAlerts(now());
  const recoveredLagAlert = recoveredAlerts.find((alert) => alert.id === "settlement_lag");
  assert.equal(recoveredLagAlert?.status, "ok");

  const snapshot = observability.snapshot();
  const lagMetric = snapshot.histograms.find((entry) => entry.name === "settlement_confirmation_lag_ms");
  assert.notEqual(lagMetric, undefined);
  assert.equal(lagMetric.value, 2_000);
});
