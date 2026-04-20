import assert from "node:assert/strict";
import test from "node:test";
import { createTableLifecycleService } from "../../../server/api/dist/table-lifecycle.js";
import { createTableSessionClient } from "../dist/table-session.js";

const HERO_WALLET = "0x1111111111111111111111111111111111111111";
const VILLAIN_WALLET = "0x2222222222222222222222222222222222222222";
const HERO_SESSION = "00000000-0000-4000-8000-000000000111";

const createServiceBackedApi = (service) => {
  return {
    getSnapshot: async ({ tableId }) => {
      const resynced = service.resync({
        tableId,
        clientSessionId: HERO_SESSION,
        handId: null,
        lastEventId: null
      });
      if (!resynced.ok) {
        throw new Error(`snapshot failed: ${resynced.reason}`);
      }
      return {
        snapshot: resynced.response.snapshot,
        streamCursor: resynced.response.streamCursor
      };
    },
    resync: async (input) => {
      const resynced = service.resync(input);
      if (!resynced.ok) {
        throw new Error(`resync failed: ${resynced.reason}`);
      }
      return resynced.response;
    },
    readEvents: async ({ tableId, afterEventId = null }) => {
      const events = service.readEvents({ tableId, afterEventId });
      if (!events.ok) {
        throw new Error(`events failed: ${events.reason}`);
      }
      return {
        events: events.events,
        streamCursor: events.streamCursor
      };
    },
    submitAction: async (input) => {
      const action = service.applyAction(input);
      if (!action.ok) {
        throw new Error(`action failed: ${action.reason}`);
      }
      return action.response;
    }
  };
};

test("plays one full hand from client actions through settlement confirmation", async () => {
  const service = createTableLifecycleService();
  const created = service.createTable();
  const tableId = created.snapshot.tableId;

  service.joinTable({ tableId, walletAddress: HERO_WALLET });
  service.joinTable({ tableId, walletAddress: VILLAIN_WALLET });

  const api = createServiceBackedApi(service);
  const client = createTableSessionClient({
    api,
    tableId,
    seat: "hero",
    clientSessionId: HERO_SESSION
  });

  await client.bootstrap();
  assert.equal(client.getState().phase, "in_hand");
  assert.equal(client.getState().legalActions.includes("fold"), true);

  await client.submitAction({ action: "fold", idempotencyKey: "hero-fold-e2e" });
  await client.pullEvents();

  assert.equal(client.getState().phase, "settling");
  assert.notEqual(client.getState().settlementTxHash, null);

  const handId = client.getState().handId;
  const txHash = client.getState().settlementTxHash;
  assert.notEqual(handId, null);
  assert.notEqual(txHash, null);

  const reconciled = service.reconcileSettlementConfirmation({
    tableId,
    handId,
    txHash,
    blockNumber: 123
  });
  assert.equal(reconciled.ok, true);

  await client.pullEvents();
  assert.equal(client.getState().completed, true);
  assert.equal(client.getState().phase, "completed");
});

test("resync restores authoritative table state after refresh", async () => {
  const service = createTableLifecycleService();
  const created = service.createTable();
  const tableId = created.snapshot.tableId;

  service.joinTable({ tableId, walletAddress: HERO_WALLET });
  const joined = service.joinTable({ tableId, walletAddress: VILLAIN_WALLET });
  assert.equal(joined.ok, true);

  const api = createServiceBackedApi(service);

  const staleClient = createTableSessionClient({
    api,
    tableId,
    seat: "hero",
    clientSessionId: HERO_SESSION
  });
  await staleClient.bootstrap();

  const handId = joined.snapshot.snapshot.handId;
  const action = service.applyAction({
    tableId,
    handId,
    actor: "hero",
    action: "fold",
    idempotencyKey: "hero-fold-refresh"
  });
  assert.equal(action.ok, true);

  const resyncFirst = await staleClient.resync();
  assert.equal(resyncFirst.idempotency.replayed, false);
  assert.equal(staleClient.getState().phase, "settling");
  const settledTxHash = staleClient.getState().settlementTxHash;
  assert.notEqual(settledTxHash, null);

  const resyncSecond = await staleClient.resync();
  assert.equal(resyncSecond.idempotency.replayed, false);
  assert.equal(staleClient.getState().phase, "settling");
  assert.equal(staleClient.getState().settlementTxHash, settledTxHash);
});
