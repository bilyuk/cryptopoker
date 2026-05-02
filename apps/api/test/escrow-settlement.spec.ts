import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { AppModule } from "../src/app.module.js";

describe("Escrow settlement and reconciliation", () => {
  it("persists a hand settlement before payout queueing and keeps settlement idempotent", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const settlement = {
        roomId: "room-a",
        handId: "hand-1",
        deltas: [
          { playerId: "p1", delta: 50 },
          { playerId: "p2", delta: -50 },
        ],
      };

      const first = await request(server).post("/escrow/settlements/hands").send(settlement).expect(201);
      const second = await request(server).post("/escrow/settlements/hands").send(settlement).expect(201);

      expect(first.body.idempotent).toBe(false);
      expect(second.body.idempotent).toBe(true);
      expect(second.body.ledgerEntry.id).toBe(first.body.ledgerEntry.id);

      const queued = await request(server)
        .post("/escrow/payouts/queue")
        .send({
          roomId: "room-a",
          playerId: "p1",
          amount: 25,
          payoutAddress: "0xabc",
          idempotencyKey: "payout-key-1",
        })
        .expect(201);

      expect(queued.body.transfer.state).toBe("queued");

      const replayQueue = await request(server)
        .post("/escrow/payouts/queue")
        .send({
          roomId: "room-a",
          playerId: "p1",
          amount: 25,
          payoutAddress: "0xabc",
          idempotencyKey: "payout-key-1",
        })
        .expect(201);
      expect(replayQueue.body.transfer.id).toBe(queued.body.transfer.id);

      const roomLedger = await request(server).get("/escrow/room-a/ledger").expect(200);
      expect(roomLedger.body.ledger.some((entry: { entryType: string }) => entry.entryType === "settlement")).toBe(true);
      expect(roomLedger.body.ledger.some((entry: { entryType: string }) => entry.entryType === "payout")).toBe(true);
    } finally {
      await app.close();
    }
  });

  it("handles partial transfer failures and replay-safe finalization", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      await request(server)
        .post("/escrow/settlements/hands")
        .send({
          roomId: "room-b",
          handId: "hand-2",
          deltas: [
            { playerId: "w1", delta: 80 },
            { playerId: "w2", delta: -80 },
          ],
        })
        .expect(201);

      const queued = await request(server)
        .post("/escrow/payouts/queue")
        .send({ roomId: "room-b", playerId: "w1", amount: 60, idempotencyKey: "payout-key-2", payoutAddress: "0xdef" })
        .expect(201);

      const failed = await request(server)
        .post("/escrow/transfers/fail")
        .send({ transferId: queued.body.transfer.id, reason: "rpc timeout" })
        .expect(201);
      expect(failed.body.transfer.state).toBe("failed");

      await request(server)
        .post("/escrow/transfers/finalize")
        .send({ transferId: queued.body.transfer.id, eventId: "evt-paid-1", txHash: "0xtx-paid-1", blockNumber: 42 })
        .expect(400);

      const requeued = await request(server)
        .post("/escrow/payouts/queue")
        .send({ roomId: "room-b", playerId: "w1", amount: 60, idempotencyKey: "payout-key-3", payoutAddress: "0xdef" })
        .expect(201);

      const finalized = await request(server)
        .post("/escrow/transfers/finalize")
        .send({ transferId: requeued.body.transfer.id, eventId: "evt-paid-2", txHash: "0xtx-paid-2", blockNumber: 43 })
        .expect(201);
      expect(finalized.body.transfer.state).toBe("paid");

      const replayFinalized = await request(server)
        .post("/escrow/transfers/finalize")
        .send({ transferId: requeued.body.transfer.id, eventId: "evt-paid-2", txHash: "0xtx-paid-2", blockNumber: 43 })
        .expect(201);
      expect(replayFinalized.body.transfer.id).toBe(requeued.body.transfer.id);
    } finally {
      await app.close();
    }
  });

  it("verifies room closeout reconciliation before finalization", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();

      await request(server)
        .post("/escrow/settlements/hands")
        .send({
          roomId: "room-c",
          handId: "hand-3",
          deltas: [
            { playerId: "c1", delta: 20 },
            { playerId: "c2", delta: -20 },
          ],
        })
        .expect(201);

      const mismatch = await request(server)
        .post("/escrow/rooms/room-c/reconcile-closeout")
        .send({ onchainBalanceByPlayer: { c1: 10, c2: -20 } })
        .expect(201);
      expect(mismatch.body.reconciliation.reconciled).toBe(false);
      expect(mismatch.body.reconciliation.mismatches.length).toBe(1);

      const clean = await request(server)
        .post("/escrow/rooms/room-c/reconcile-closeout")
        .send({ onchainBalanceByPlayer: { c1: 20, c2: -20 } })
        .expect(201);
      expect(clean.body.reconciliation.reconciled).toBe(true);
      expect(clean.body.reconciliation.mismatches.length).toBe(0);
    } finally {
      await app.close();
    }
  });
});
