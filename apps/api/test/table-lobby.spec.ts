import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { RoomSettingsDto } from "@cryptopoker/contracts";
import { AppModule } from "../src/app.module.js";

const headsUpSettings: RoomSettingsDto = {
  name: "Brass Cage",
  smallBlind: 10,
  bigBlind: 25,
  buyInMin: 1000,
  buyInMax: 2500,
  seatCount: 2,
  actionTimerSeconds: 30,
};

describe("Escrow-backed room entry", () => {
  it("starts first hand only for host with at least two seated players", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");
      const guestCookie = await createPlayer(server, "guest");

      const created = await request(server).post("/rooms").set("Cookie", hostCookie).send(headsUpSettings).expect(201);
      const roomId = created.body.room.id;

      await request(server)
        .post(`/rooms/${roomId}/deal-first-hand`)
        .set("Cookie", hostCookie)
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("INSUFFICIENT_SEATED_PLAYERS"));

      await join(server, guestCookie, created.body.room.inviteCode);
      await fundAndConfirm(server, guestCookie, roomId, 1500, "deal");

      await request(server).post(`/rooms/${roomId}/deal-first-hand`).set("Cookie", guestCookie).expect(403);

      const dealt = await request(server).post(`/rooms/${roomId}/deal-first-hand`).set("Cookie", hostCookie).expect(201);
      expect(dealt.body.room.hasStarted).toBe(true);

      await request(server)
        .post(`/rooms/${roomId}/deal-first-hand`)
        .set("Cookie", hostCookie)
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("HAND_ALREADY_STARTED"));
    } finally {
      await app.close();
    }
  });

  it("seats/waitlists players only after indexed deposit confirmation", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");
      const firstGuestCookie = await createPlayer(server, "first");
      const secondGuestCookie = await createPlayer(server, "second");

      const created = await request(server).post("/rooms").set("Cookie", hostCookie).send(headsUpSettings).expect(201);
      const roomId = created.body.room.id;
      const inviteCode = created.body.room.inviteCode;

      await join(server, firstGuestCookie, inviteCode);
      await join(server, secondGuestCookie, inviteCode);

      const firstPending = await request(server)
        .post("/buy-ins")
        .set("Cookie", firstGuestCookie)
        .send({ roomId, amount: 1200 })
        .expect(400);
      expect(firstPending.body.code).toBe("WALLET_REQUIRED");

      await linkWallet(server, firstGuestCookie);
      await linkWallet(server, secondGuestCookie);

      const fundedCandidate = await request(server)
        .post("/buy-ins")
        .set("Cookie", firstGuestCookie)
        .send({ roomId, amount: 1200 })
        .expect(201);

      let room = await currentRoom(server, hostCookie);
      expect(room.room.seats[1].playerId).toBeNull();

      await confirmDeposit(server, fundedCandidate.body.buyIn.fundingReference, "evt-1", "tx-1");
      room = await currentRoom(server, hostCookie);
      expect(room.room.seats[1].playerId).toBe(playerIdOf(room.room, "first"));

      const secondPending = await request(server)
        .post("/buy-ins")
        .set("Cookie", secondGuestCookie)
        .send({ roomId, amount: 1300 })
        .expect(201);
      await confirmDeposit(server, secondPending.body.buyIn.fundingReference, "evt-2", "tx-2");

      room = await currentRoom(server, hostCookie);
      expect(room.room.waitlist).toEqual([{ playerId: playerIdOf(room.room, "second"), position: 1 }]);
    } finally {
      await app.close();
    }
  });

  it("handles duplicate events idempotently and supports expired/refund flows", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");
      const guestCookie = await createPlayer(server, "guest");
      const created = await request(server).post("/rooms").set("Cookie", hostCookie).send(headsUpSettings).expect(201);
      const roomId = created.body.room.id;
      await join(server, guestCookie, created.body.room.inviteCode);
      await linkWallet(server, guestCookie);

      const pending = await request(server).post("/buy-ins").set("Cookie", guestCookie).send({ roomId, amount: 1500 }).expect(201);
      const fundingReference = pending.body.buyIn.fundingReference;

      const firstConfirm = await confirmDeposit(server, fundingReference, "evt-dup", "tx-dup");
      const secondConfirm = await confirmDeposit(server, fundingReference, "evt-dup", "tx-dup");
      expect(firstConfirm.body.buyIn.status).toBe("escrow-funded");
      expect(secondConfirm.body.buyIn.status).toBe("escrow-funded");

      const toExpire = await request(server).post("/buy-ins").set("Cookie", guestCookie).send({ roomId, amount: 1700 }).expect(201);
      await request(server).post(`/buy-ins/${toExpire.body.buyIn.id}/expire`).set("Cookie", hostCookie).expect(201);

      const refundedPending = await request(server)
        .post(`/buy-ins/${toExpire.body.buyIn.id}/refund`)
        .set("Cookie", guestCookie)
        .expect(201);
      expect(refundedPending.body.buyIn.status).toBe("refund-pending");

      const refunded = await request(server)
        .post("/escrow/events/refunds")
        .send({ eventId: "evt-refund", buyInId: toExpire.body.buyIn.id, txHash: "tx-refund", blockNumber: 123 })
        .expect(201);
      expect(refunded.body.buyIn.status).toBe("refunded");
    } finally {
      await app.close();
    }
  });

  it("queues seated Top-Ups until hand settlement, enforces max total Buy-In, and applies multiple pending Top-Ups", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");
      const guestCookie = await createPlayer(server, "guest");
      const guestTwoCookie = await createPlayer(server, "guest-two");

      const created = await request(server).post("/rooms").set("Cookie", hostCookie).send({
        ...blockchainHeadsUpSettings,
        blockchain: {
          ...blockchainHeadsUpSettings.blockchain,
          maxTotalBuyIn: 4_300,
        },
      }).expect(201);
      const roomId = created.body.room.id;
      await join(server, guestCookie, created.body.room.inviteCode);
      await join(server, guestTwoCookie, created.body.room.inviteCode);
      await linkWallet(server, guestCookie);
      await linkWallet(server, guestTwoCookie);

      const initialBuyIn = await request(server).post("/buy-ins").set("Cookie", guestCookie).send({ roomId, amount: 1_500 }).expect(201);
      await confirmDeposit(server, initialBuyIn.body.buyIn.fundingReference, "evt-topup-initial", "tx-topup-initial");
      let room = await currentRoom(server, hostCookie);
      const guestId = playerIdOf(room.room, "guest");
      let guestBuyIn = room.room.buyIns.find((buyIn: { playerId: string }) => buyIn.playerId === guestId);
      await request(server)
        .post("/escrow/events/locks")
        .send({
          eventId: "evt-topup-lock-initial",
          buyInId: guestBuyIn.id,
          txHash: "tx-topup-lock-initial",
          blockNumber: 300,
          currentBlockNumber: 301,
        })
        .expect(201);

      const unseatedPending = await request(server).post("/buy-ins").set("Cookie", guestTwoCookie).send({ roomId, amount: 1_000 }).expect(201);
      await confirmDeposit(server, unseatedPending.body.buyIn.fundingReference, "evt-topup-unseated", "tx-topup-unseated");
      const refundedPending = await request(server)
        .post(`/buy-ins/${unseatedPending.body.buyIn.id}/refund`)
        .set("Cookie", guestTwoCookie)
        .expect(201);
      expect(refundedPending.body.buyIn.status).toBe("refund-pending");

      await request(server).post(`/rooms/${roomId}/deal-first-hand`).set("Cookie", hostCookie).expect(201);

      const topUpOne = await request(server).post("/buy-ins").set("Cookie", guestCookie).send({ roomId, amount: 1_000 }).expect(201);
      await confirmDeposit(server, topUpOne.body.buyIn.fundingReference, "evt-topup-1", "tx-topup-1");
      const topUpTwo = await request(server).post("/buy-ins").set("Cookie", guestCookie).send({ roomId, amount: 1_000 }).expect(201);
      await confirmDeposit(server, topUpTwo.body.buyIn.fundingReference, "evt-topup-2", "tx-topup-2");

      room = await currentRoom(server, hostCookie);
      const pendingTopUps = room.room.buyIns.filter((buyIn: { playerId: string; status: string }) => buyIn.playerId === guestId && buyIn.status === "escrow-funded");
      const guestSeatBeforeSettlement = room.room.seats.find((seat: { playerId: string | null }) => seat.playerId === guestId);
      expect(pendingTopUps).toHaveLength(2);
      expect(guestSeatBeforeSettlement.tableStack).toBe(1_500);

      await request(server)
        .post("/escrow/settlements/hands")
        .send({
          roomId,
          handId: "hand-topup-1",
          deltas: [
            { playerId: created.body.room.hostPlayerId, delta: 50 },
            { playerId: guestId, delta: -50 },
          ],
        })
        .expect(201);

      room = await currentRoom(server, hostCookie);
      const guestSeatAfterSettlement = room.room.seats.find((seat: { playerId: string | null }) => seat.playerId === guestId);
      const appliedTopUps = room.room.buyIns.filter((buyIn: { playerId: string; status: string }) => buyIn.playerId === guestId && buyIn.status === "in-play");
      expect(appliedTopUps.length).toBeGreaterThanOrEqual(2);
      expect(guestSeatAfterSettlement.tableStack).toBe(3_500);

      const exceedsMax = await request(server).post("/buy-ins").set("Cookie", guestCookie).send({ roomId, amount: 1_000 }).expect(400);
      expect(exceedsMax.body.code).toBe("MAX_TOTAL_BUY_IN_EXCEEDED");
    } finally {
      await app.close();
    }
  });
});

async function createPlayer(server: Parameters<typeof request>[0], displayName: string): Promise<string> {
  const response = await request(server).post("/players").send({ displayName }).expect(201);
  return readSetCookie(response.headers["set-cookie"])[0];
}

function readSetCookie(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}

async function join(server: Parameters<typeof request>[0], cookie: string, inviteCode: string): Promise<void> {
  await request(server).post(`/invite-links/${inviteCode}/join`).set("Cookie", cookie).expect(201);
}

async function linkWallet(server: Parameters<typeof request>[0], cookie: string): Promise<void> {
  await request(server).post("/players/current/wallet").set("Cookie", cookie).send({}).expect(201);
}

function confirmDeposit(server: Parameters<typeof request>[0], fundingReference: string, eventId: string, txHash: string) {
  return request(server)
    .post("/escrow/events/deposits")
    .send({ eventId, fundingReference, txHash, blockNumber: 123 })
    .expect(201);
}

async function fundAndConfirm(
  server: Parameters<typeof request>[0],
  playerCookie: string,
  roomId: string,
  amount: number,
  id: string,
): Promise<void> {
  await linkWallet(server, playerCookie);
  const buyIn = await request(server).post("/buy-ins").set("Cookie", playerCookie).send({ roomId, amount }).expect(201);
  await confirmDeposit(server, buyIn.body.buyIn.fundingReference, `evt-${id}`, `tx-${id}`);
}

async function currentRoom(server: Parameters<typeof request>[0], cookie: string): Promise<{ room: any }> {
  const res = await request(server).get("/rooms/current").set("Cookie", cookie).expect(200);
  return res.body;
}

function playerIdOf(room: { players: Array<{ playerId: string; displayName: string }> }, displayName: string): string {
  const match = room.players.find((p) => p.displayName === displayName);
  if (!match) throw new Error(`Player with displayName ${displayName} not found in room.`);
  return match.playerId;
}
