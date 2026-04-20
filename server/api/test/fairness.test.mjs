import assert from "node:assert/strict";
import test from "node:test";
import { computeFairnessCommitment, createFairnessService } from "../dist/fairness.js";

const TABLE_ID = "4bf721f1-f5c8-4c9b-8490-30e363a89f81";
const HAND_ID = "d8fd81b8-27ef-4dc4-a52d-34dce6e7939d";

test("records commit/reveal and returns immutable proof bundle", () => {
  let tick = 0;
  const service = createFairnessService({
    now: () => new Date(`2026-01-01T00:00:0${Math.min(tick++, 9)}.000Z`)
  });
  const commitment = computeFairnessCommitment("server-seed", "salt-1");

  const committed = service.commit({
    tableId: TABLE_ID,
    handId: HAND_ID,
    commitment
  });
  assert.equal(committed.ok, true);
  assert.equal(committed.replayed, false);

  const revealed = service.reveal({
    tableId: TABLE_ID,
    handId: HAND_ID,
    reveal: "server-seed",
    revealSalt: "salt-1"
  });
  assert.equal(revealed.ok, true);
  assert.equal(revealed.replayed, false);

  const proof = service.getProof({ tableId: TABLE_ID, handId: HAND_ID });
  assert.equal(proof.ok, true);
  assert.equal(proof.response.proof.matchesCommitment, true);
  assert.equal(proof.response.proof.computedCommitment, commitment);

  const replayedProof = service.getProof({ tableId: TABLE_ID, handId: HAND_ID });
  assert.equal(replayedProof.ok, true);
  assert.deepEqual(replayedProof.response, proof.response);
});

test("does not allow changing commitment or reveal after proof finalization", () => {
  const service = createFairnessService();
  const commitment = computeFairnessCommitment("seed-a", "salt-a");

  service.commit({ tableId: TABLE_ID, handId: HAND_ID, commitment });
  service.reveal({
    tableId: TABLE_ID,
    handId: HAND_ID,
    reveal: "seed-a",
    revealSalt: "salt-a"
  });
  const finalized = service.getProof({ tableId: TABLE_ID, handId: HAND_ID });
  assert.equal(finalized.ok, true);

  const postFinalizeCommit = service.commit({
    tableId: TABLE_ID,
    handId: HAND_ID,
    commitment: computeFairnessCommitment("seed-b", "salt-b")
  });
  assert.deepEqual(postFinalizeCommit, { ok: false, reason: "already_finalized" });

  const postFinalizeReveal = service.reveal({
    tableId: TABLE_ID,
    handId: HAND_ID,
    reveal: "seed-b",
    revealSalt: "salt-b"
  });
  assert.deepEqual(postFinalizeReveal, { ok: false, reason: "already_finalized" });
});

test("returns proof-not-ready responses when reveal data is missing", () => {
  const service = createFairnessService();
  const commitment = computeFairnessCommitment("seed", "salt");

  const noCommitment = service.getProof({ tableId: TABLE_ID, handId: HAND_ID });
  assert.deepEqual(noCommitment, { ok: false, reason: "commitment_not_found" });

  const committed = service.commit({ tableId: TABLE_ID, handId: HAND_ID, commitment });
  assert.equal(committed.ok, true);
  const noReveal = service.getProof({ tableId: TABLE_ID, handId: HAND_ID });
  assert.deepEqual(noReveal, { ok: false, reason: "reveal_not_found" });
});
