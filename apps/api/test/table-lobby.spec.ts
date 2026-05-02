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
  mode: "host-verified",
  blockchain: null,
};

const blockchainHeadsUpSettings: RoomSettingsDto = {
  ...headsUpSettings,
  mode: "blockchain-backed",
  blockchain: {
    network: "base",
    stablecoin: "USDC",
    maxTotalBuyIn: 5_000,
    antiRatholing: true,
    noRake: true,
  },
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
      await request(server).post("/buy-ins").set("Cookie", guestCookie).send({ roomId, amount: 1500 }).expect(201);

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

  it("enforces lock-before-seat transition for blockchain-backed Buy-Ins", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");
      const firstGuestCookie = await createPlayer(server, "first");
      const secondGuestCookie = await createPlayer(server, "second");

      const created = await request(server).post("/rooms").set("Cookie", hostCookie).send(blockchainHeadsUpSettings).expect(201);
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
      expect(room.room.seats[1].tableStack).toBeNull();

      await request(server)
        .post("/escrow/events/deposits")
        .send({
          eventId: "evt-1",
          fundingReference: fundedCandidate.body.buyIn.fundingReference,
          txHash: "tx-1",
          blockNumber: 123,
          currentBlockNumber: 123,
        })
        .expect(201);
      room = await currentRoom(server, hostCookie);
      expect(room.room.seats[1].playerId).toBeNull();
      expect(room.room.seats[1].tableStack).toBeNull();
      const firstBeforeReplay = room.room.buyIns.find((buyIn: { playerId: string }) => buyIn.playerId === playerIdOf(room.room, "first"));
      expect(firstBeforeReplay.status).toBe("funding-pending");

      await request(server).post("/escrow/events/deposits/replay").send({ currentBlockNumber: 124 }).expect(201);

      room = await currentRoom(server, hostCookie);
      const firstBuyIn = room.room.buyIns.find((buyIn: { playerId: string }) => buyIn.playerId === playerIdOf(room.room, "first"));
      expect(firstBuyIn.status).toBe("lock-pending");
      expect(room.room.seats[1].playerId).toBeNull();
      expect(room.room.seats[1].tableStack).toBeNull();

      await request(server)
        .post("/escrow/events/locks")
        .send({
          eventId: "evt-lock-1",
          buyInId: firstBuyIn.id,
          txHash: "tx-lock-1",
          blockNumber: 130,
          currentBlockNumber: 131,
        })
        .expect(201);

      room = await currentRoom(server, hostCookie);
      const firstAfterLock = room.room.buyIns.find((buyIn: { playerId: string }) => buyIn.playerId === playerIdOf(room.room, "first"));
      expect(firstAfterLock.status).toBe("escrow-locked");
      expect(room.room.seats[1].playerId).toBe(playerIdOf(room.room, "first"));
      expect(room.room.seats[1].tableStack).toBe(1200);

      await request(server)
        .post(`/buy-ins/${firstAfterLock.id}/refund`)
        .set("Cookie", firstGuestCookie)
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("BUY_IN_STATUS_INVALID"));

      const secondPending = await request(server)
        .post("/buy-ins")
        .set("Cookie", secondGuestCookie)
        .send({ roomId, amount: 1300 })
        .expect(201);
      await confirmDeposit(server, secondPending.body.buyIn.fundingReference, "evt-2", "tx-2");

      room = await currentRoom(server, hostCookie);
      const secondBuyIn = room.room.buyIns.find((buyIn: { playerId: string }) => buyIn.playerId === playerIdOf(room.room, "second"));
      expect(secondBuyIn.status).toBe("escrow-funded");
      expect(room.room.waitlist).toEqual([]);
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
      const guestTwoCookie = await createPlayer(server, "guest-two");
      const created = await request(server).post("/rooms").set("Cookie", hostCookie).send(blockchainHeadsUpSettings).expect(201);
      const roomId = created.body.room.id;
      await join(server, guestCookie, created.body.room.inviteCode);
      await join(server, guestTwoCookie, created.body.room.inviteCode);
      await linkWallet(server, guestCookie);
      await linkWallet(server, guestTwoCookie);

      const pending = await request(server).post("/buy-ins").set("Cookie", guestCookie).send({ roomId, amount: 1500 }).expect(201);
      const pendingTwo = await request(server).post("/buy-ins").set("Cookie", guestTwoCookie).send({ roomId, amount: 1400 }).expect(201);
      const fundingReference = pending.body.buyIn.fundingReference;
      const fundingReferenceTwo = pendingTwo.body.buyIn.fundingReference;

      const firstConfirm = await confirmDeposit(server, fundingReference, "evt-dup", "tx-dup");
      const secondConfirm = await confirmDeposit(server, fundingReference, "evt-dup", "tx-dup");
      expect(firstConfirm.body.buyIn.status).toBe("lock-pending");
      expect(secondConfirm.body.buyIn.status).toBe("lock-pending");
      const secondGuestConfirm = await confirmDeposit(server, fundingReferenceTwo, "evt-dup-2", "tx-dup-2");
      expect(secondGuestConfirm.body.buyIn.status).toBe("lock-pending");

      const toExpire = await request(server).post("/buy-ins").set("Cookie", guestCookie).send({ roomId, amount: 1700 }).expect(201);
      await request(server).post(`/buy-ins/${toExpire.body.buyIn.id}/expire`).set("Cookie", hostCookie).expect(201);

      const refundedPending = await request(server)
        .post(`/buy-ins/${toExpire.body.buyIn.id}/refund`)
        .set("Cookie", guestCookie)
        .expect(201);
      expect(refundedPending.body.buyIn.status).toBe("refund-pending");

      const refunded = await request(server)
        .post("/escrow/events/refunds")
        .send({ eventId: "evt-refund", buyInId: toExpire.body.buyIn.id, txHash: "tx-refund", blockNumber: 123, currentBlockNumber: 123 })
        .expect(201);
      expect(refunded.body.buyIn.status).toBe("refunded");

      const firstLock = await request(server)
        .post("/escrow/events/locks")
        .send({
          eventId: "evt-lock-guest-1",
          buyInId: pending.body.buyIn.id,
          txHash: "tx-lock-guest-1",
          blockNumber: 140,
          currentBlockNumber: 141,
        })
        .expect(201);
      expect(firstLock.body.buyIn.status).toBe("escrow-locked");

      const lockedWithoutSeat = await request(server)
        .post("/escrow/events/locks")
        .send({
          eventId: "evt-lock-orphan",
          buyInId: pendingTwo.body.buyIn.id,
          txHash: "tx-lock-orphan",
          blockNumber: 142,
          currentBlockNumber: 143,
        })
        .expect(201);
      expect(lockedWithoutSeat.body.buyIn.status).toBe("escrow-locked");

      const roomAfterOrphan = await currentRoom(server, hostCookie);
      const guestTwoId = playerIdOf(roomAfterOrphan.room, "guest-two");
      expect(roomAfterOrphan.room.seats.some((seat: { playerId: string | null }) => seat.playerId === guestTwoId)).toBe(false);

      const orphanUnlocked = await request(server)
        .post(`/buy-ins/${pendingTwo.body.buyIn.id}/unlock-orphan`)
        .set("Cookie", hostCookie)
        .expect(201);
      expect(orphanUnlocked.body.buyIn.status).toBe("escrow-funded");
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
    .send({ eventId, fundingReference, txHash, blockNumber: 123, currentBlockNumber: 124 })
    .expect(201);
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
