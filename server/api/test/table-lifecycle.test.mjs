import assert from "node:assert/strict";
import test from "node:test";
import { createTableLifecycleService } from "../dist/table-lifecycle.js";

const HERO_WALLET = "0x1111111111111111111111111111111111111111";
const VILLAIN_WALLET = "0x2222222222222222222222222222222222222222";

test("assigns seats idempotently and starts a hand once table is full", () => {
  const service = createTableLifecycleService();
  const created = service.createTable();
  const tableId = created.snapshot.tableId;

  const firstJoin = service.joinTable({ tableId, walletAddress: HERO_WALLET });
  assert.equal(firstJoin.ok, true);
  assert.equal(firstJoin.seat, "hero");
  assert.equal(firstJoin.rejoined, false);

  const duplicateJoin = service.joinTable({ tableId, walletAddress: HERO_WALLET });
  assert.equal(duplicateJoin.ok, true);
  assert.equal(duplicateJoin.seat, "hero");
  assert.equal(duplicateJoin.rejoined, true);

  const secondJoin = service.joinTable({ tableId, walletAddress: VILLAIN_WALLET });
  assert.equal(secondJoin.ok, true);
  assert.equal(secondJoin.seat, "villain");
  assert.equal(secondJoin.snapshot.snapshot.phase, "in_hand");
  assert.equal(secondJoin.snapshot.snapshot.currentActor, "hero");
  assert.equal(secondJoin.snapshot.snapshot.handId !== null, true);
});

test("replays resync response idempotently for same session and hand scope", () => {
  const service = createTableLifecycleService();
  const created = service.createTable();
  const tableId = created.snapshot.tableId;

  service.joinTable({ tableId, walletAddress: HERO_WALLET });
  service.joinTable({ tableId, walletAddress: VILLAIN_WALLET });
  const snapshot = service.readEvents({ tableId });
  assert.equal(snapshot.ok, true);

  const first = service.resync({
    tableId,
    clientSessionId: "00000000-0000-4000-8000-000000000001",
    handId: null,
    lastEventId: null
  });
  assert.equal(first.ok, true);
  assert.equal(first.response.idempotency.replayed, false);

  const second = service.resync({
    tableId,
    clientSessionId: "00000000-0000-4000-8000-000000000001",
    handId: null,
    lastEventId: null
  });
  assert.equal(second.ok, true);
  assert.equal(second.response.idempotency.replayed, true);
  assert.equal(second.response.idempotency.scopeKey, first.response.idempotency.scopeKey);
});

test("returns stream events for phase transition and settlement submit", () => {
  const service = createTableLifecycleService();
  const created = service.createTable();
  const tableId = created.snapshot.tableId;

  service.joinTable({ tableId, walletAddress: HERO_WALLET });
  const joined = service.joinTable({ tableId, walletAddress: VILLAIN_WALLET });
  assert.equal(joined.ok, true);
  const handId = joined.snapshot.snapshot.handId;
  assert.notEqual(handId, null);

  const action = service.applyAction({
    tableId,
    handId,
    actor: "hero",
    action: "fold",
    idempotencyKey: "hero-fold-1"
  });
  assert.equal(action.ok, true);
  assert.equal(action.response.accepted, true);
  assert.equal(action.response.actionEventId !== null, true);

  const stream = service.readEvents({ tableId });
  assert.equal(stream.ok, true);
  assert.equal(stream.events.some((event) => event.eventType === "table.phase_changed"), true);
  assert.equal(
    stream.events.some(
      (event) =>
        event.eventType === "table.phase_changed" &&
        event.reason === "hand_resolved" &&
        event.previousPhase === "in_hand" &&
        event.phase === "settling"
    ),
    true
  );
  assert.equal(
    stream.events.some(
      (event) =>
        event.eventType === "hand.action_applied" &&
        event.actor === "hero" &&
        event.action === "fold" &&
        event.source === "player_input"
    ),
    true
  );
  assert.equal(stream.events.some((event) => event.eventType === "settlement.tx_submitted"), true);
});

test("exposes legal actions by seat for snapshots and stream transitions", () => {
  const service = createTableLifecycleService();
  const created = service.createTable();
  const tableId = created.snapshot.tableId;
  service.joinTable({ tableId, walletAddress: HERO_WALLET });
  const joined = service.joinTable({ tableId, walletAddress: VILLAIN_WALLET });

  assert.equal(joined.ok, true);
  assert.deepEqual(joined.snapshot.snapshot.legalActionsBySeat.hero, [
    "check",
    "call",
    "bet",
    "raise",
    "fold",
    "all_in"
  ]);
  assert.deepEqual(joined.snapshot.snapshot.legalActionsBySeat.villain, []);

  const stream = service.readEvents({ tableId });
  assert.equal(stream.ok, true);
  const started = stream.events.find((event) => event.eventType === "hand.street_changed");
  assert.notEqual(started, undefined);
  assert.equal(started.reason, "hand_started");
  assert.deepEqual(started.legalActionsBySeat.hero, ["check", "call", "bet", "raise", "fold", "all_in"]);
  assert.deepEqual(started.legalActionsBySeat.villain, []);
});

test("emits timeout and auto-action payloads when action source is timeout", () => {
  const service = createTableLifecycleService();
  const created = service.createTable();
  const tableId = created.snapshot.tableId;
  service.joinTable({ tableId, walletAddress: HERO_WALLET });
  const joined = service.joinTable({ tableId, walletAddress: VILLAIN_WALLET });
  assert.equal(joined.ok, true);

  const action = service.applyAction({
    tableId,
    handId: joined.snapshot.snapshot.handId,
    actor: "hero",
    action: "fold",
    source: "timeout_auto_action",
    idempotencyKey: "hero-timeout-1"
  });
  assert.equal(action.ok, true);

  const stream = service.readEvents({ tableId });
  assert.equal(stream.ok, true);
  assert.equal(
    stream.events.some(
      (event) =>
        event.eventType === "hand.timeout_applied" &&
        event.timedOutActor === "hero" &&
        event.autoAction.action === "fold" &&
        event.nextActor === "villain"
    ),
    true
  );
  assert.equal(
    stream.events.some(
      (event) =>
        event.eventType === "hand.action_applied" &&
        event.source === "timeout_auto_action" &&
        event.actor === "hero"
    ),
    true
  );
});
