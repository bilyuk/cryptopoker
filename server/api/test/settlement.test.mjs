import assert from "node:assert/strict";
import test from "node:test";
import {
  createEscrowSettlementExecutor,
  createSettlementReconciliationWorker
} from "../dist/settlement.js";
import { createTableLifecycleService } from "../dist/table-lifecycle.js";

const HERO_WALLET = "0x1111111111111111111111111111111111111111";
const VILLAIN_WALLET = "0x2222222222222222222222222222222222222222";

test("deduplicates settlement submission by idempotency key", () => {
  const executor = createEscrowSettlementExecutor();
  const first = executor.executeSettlement({
    tableId: "4bf721f1-f5c8-4c9b-8490-30e363a89f81",
    handId: "d8fd81b8-27ef-4dc4-a52d-34dce6e7939d",
    winnerSeat: "hero",
    winnerWalletAddress: HERO_WALLET,
    loserWalletAddress: VILLAIN_WALLET,
    amount: 250,
    idempotencyKey: "table-1:hand-1"
  });
  const second = executor.executeSettlement({
    tableId: "4bf721f1-f5c8-4c9b-8490-30e363a89f81",
    handId: "d8fd81b8-27ef-4dc4-a52d-34dce6e7939d",
    winnerSeat: "hero",
    winnerWalletAddress: HERO_WALLET,
    loserWalletAddress: VILLAIN_WALLET,
    amount: 250,
    idempotencyKey: "table-1:hand-1"
  });

  assert.equal(first.replayed, false);
  assert.equal(second.replayed, true);
  assert.equal(second.txHash, first.txHash);
  assert.equal(executor.getSettlementByHandId("d8fd81b8-27ef-4dc4-a52d-34dce6e7939d")?.txHash, first.txHash);
});

test("maps chain confirmations back to hand ids and completes table settlement", () => {
  const executor = createEscrowSettlementExecutor();
  const worker = createSettlementReconciliationWorker(executor);
  const service = createTableLifecycleService({ settlementExecutor: executor });

  const created = service.createTable();
  const tableId = created.snapshot.tableId;
  service.joinTable({ tableId, walletAddress: HERO_WALLET });
  const joined = service.joinTable({ tableId, walletAddress: VILLAIN_WALLET });
  assert.equal(joined.ok, true);
  const handId = joined.snapshot.snapshot.handId;
  assert.notEqual(handId, null);

  const folded = service.applyAction({
    tableId,
    handId,
    actor: "hero",
    action: "fold",
    idempotencyKey: "hero-fold-1"
  });
  assert.equal(folded.ok, true);

  const settlement = executor.getSettlementByHandId(handId);
  assert.notEqual(settlement, null);
  const reconciliation = worker.reconcileConfirmedEvent({
    eventType: "escrow.settlement_confirmed",
    txHash: settlement.txHash,
    blockNumber: 12345,
    emittedAt: new Date().toISOString()
  });
  assert.equal(reconciliation.matched, true);
  assert.equal(reconciliation.settlement.handId, handId);

  const confirmed = service.reconcileSettlementConfirmation({
    tableId,
    handId,
    txHash: settlement.txHash,
    blockNumber: 12345
  });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.updated, true);
  assert.equal(confirmed.snapshot.snapshot.phase, "completed");

  const replayed = service.reconcileSettlementConfirmation({
    tableId,
    handId,
    txHash: settlement.txHash,
    blockNumber: 12345
  });
  assert.equal(replayed.ok, true);
  assert.equal(replayed.updated, false);
  assert.equal(replayed.alreadyConfirmed, true);

  const stream = service.readEvents({ tableId });
  assert.equal(stream.ok, true);
  assert.equal(stream.events.some((event) => event.eventType === "settlement.tx_submitted"), true);
  assert.equal(stream.events.some((event) => event.eventType === "settlement.tx_confirmed"), true);
  assert.equal(
    stream.events.some(
      (event) =>
        event.eventType === "table.phase_changed" &&
        event.reason === "settlement_confirmed" &&
        event.phase === "completed"
    ),
    true
  );
});
