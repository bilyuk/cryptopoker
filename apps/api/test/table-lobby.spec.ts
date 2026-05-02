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

const threeSeatSettings: RoomSettingsDto = {
  ...headsUpSettings,
  seatCount: 3,
};

describe("Velvet Room: auto-seat on Host verification", () => {
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

      // Need at least two seated players.
      await request(server)
        .post(`/rooms/${roomId}/deal-first-hand`)
        .set("Cookie", hostCookie)
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("INSUFFICIENT_SEATED_PLAYERS"));

      await join(server, guestCookie, created.body.room.inviteCode);
      await verify(server, hostCookie, guestCookie, roomId, 1500);

      // Non-host cannot deal.
      await request(server).post(`/rooms/${roomId}/deal-first-hand`).set("Cookie", guestCookie).expect(403);

      // Host can deal once, and Room is marked started.
      const dealt = await request(server).post(`/rooms/${roomId}/deal-first-hand`).set("Cookie", hostCookie).expect(201);
      expect(dealt.body.room.hasStarted).toBe(true);

      // First hand can only be started once.
      await request(server)
        .post(`/rooms/${roomId}/deal-first-hand`)
        .set("Cookie", hostCookie)
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("HAND_ALREADY_STARTED"));
    } finally {
      await app.close();
    }
  });

  it("auto-seats the Host on Room creation, fills lowest open Seats on approval, and auto-waitlists when full", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");
      const firstGuestCookie = await createPlayer(server, "first");
      const secondGuestCookie = await createPlayer(server, "second");
      const thirdGuestCookie = await createPlayer(server, "third");

      const created = await request(server)
        .post("/rooms")
        .set("Cookie", hostCookie)
        .send(threeSeatSettings)
        .expect(201);
      const roomId = created.body.room.id;
      const inviteCode = created.body.room.inviteCode;

      // Host is auto-seated at Seat 1 with a host-verified Buy-In at the room minimum.
      expect(created.body.room.seats[0].playerId).toBe(created.body.room.hostPlayerId);
      expect(created.body.room.seats[0].tableStack).toBe(threeSeatSettings.buyInMin);
      expect(created.body.room.buyIns).toHaveLength(1);
      expect(created.body.room.buyIns[0].status).toBe("host-verified");

      await join(server, firstGuestCookie, inviteCode);
      await join(server, secondGuestCookie, inviteCode);
      await join(server, thirdGuestCookie, inviteCode);

      // Guest cannot self-approve.
      const firstPending = await request(server)
        .post("/buy-ins")
        .set("Cookie", firstGuestCookie)
        .send({ roomId, amount: 1200 })
        .expect(201);
      await request(server)
        .post(`/buy-ins/${firstPending.body.buyIn.id}/approve`)
        .set("Cookie", firstGuestCookie)
        .expect(403);

      // Host approves first guest -> auto-seated at Seat 2.
      const firstApproved = await request(server)
        .post(`/buy-ins/${firstPending.body.buyIn.id}/approve`)
        .set("Cookie", hostCookie)
        .expect(201);
      expect(firstApproved.body.buyIn.status).toBe("host-verified");
      const afterFirst = await currentRoom(server, hostCookie);
      expect(afterFirst.room.seats[1].playerId).toBe(playerIdOf(afterFirst.room, "first"));
      expect(afterFirst.room.seats[1].tableStack).toBe(1200);

      // Host approves second guest -> auto-seated at Seat 3 (room now full).
      await verify(server, hostCookie, secondGuestCookie, roomId, 1500);
      const afterSecond = await currentRoom(server, hostCookie);
      expect(afterSecond.room.seats[2].playerId).toBe(playerIdOf(afterSecond.room, "second"));

      // Host approves third guest -> room full, auto-waitlisted at #1.
      await verify(server, hostCookie, thirdGuestCookie, roomId, 1100);
      const afterThird = await currentRoom(server, hostCookie);
      expect(afterThird.room.seats.every((seat: { playerId: string | null }) => seat.playerId !== null)).toBe(true);
      expect(afterThird.room.waitlist).toEqual([
        { playerId: playerIdOf(afterThird.room, "third"), position: 1 },
      ]);

      // First guest leaves -> Seat 2 opens, Seat Offer issued to third (waitlist head).
      const opened = await request(server)
        .post("/seats/leave")
        .set("Cookie", firstGuestCookie)
        .send({ roomId })
        .expect(201);
      const offer = opened.body.room.seatOffers[0];
      expect(offer.status).toBe("pending");
      expect(offer.playerId).toBe(playerIdOf(opened.body.room, "third"));
      expect(opened.body.room.seats[1].playerId).toBeNull();

      // Third accepts -> seated at Seat 2, waitlist drains.
      const accepted = await request(server)
        .post(`/seat-offers/${offer.id}/accept`)
        .set("Cookie", thirdGuestCookie)
        .expect(201);
      expect(accepted.body.room.seats[1].playerId).toBe(offer.playerId);
      expect(accepted.body.room.waitlist).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("guards Buy-In status transitions, blocks duplicate pending requests, and auto-waitlists when target Seat has a pending Seat Offer", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");
      const firstCookie = await createPlayer(server, "first");
      const secondCookie = await createPlayer(server, "second");
      const thirdCookie = await createPlayer(server, "third");
      const fourthCookie = await createPlayer(server, "fourth");

      const created = await request(server).post("/rooms").set("Cookie", hostCookie).send(headsUpSettings).expect(201);
      const roomId = created.body.room.id;
      const inviteCode = created.body.room.inviteCode;

      for (const cookie of [firstCookie, secondCookie, thirdCookie, fourthCookie]) {
        await join(server, cookie, inviteCode);
      }

      // Out-of-range Buy-In is rejected.
      await request(server)
        .post("/buy-ins")
        .set("Cookie", firstCookie)
        .send({ roomId, amount: 999 })
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("BUY_IN_OUT_OF_RANGE"));

      // First guest requests, then duplicate request is blocked.
      const firstPending = await request(server)
        .post("/buy-ins")
        .set("Cookie", firstCookie)
        .send({ roomId, amount: 1000 })
        .expect(201);
      await request(server)
        .post("/buy-ins")
        .set("Cookie", firstCookie)
        .send({ roomId, amount: 1500 })
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("BUY_IN_PENDING"));

      // Host approves first -> auto-seated at Seat 2 (heads-up room is now full).
      await request(server)
        .post(`/buy-ins/${firstPending.body.buyIn.id}/approve`)
        .set("Cookie", hostCookie)
        .expect(201);

      // Re-approving an already-verified Buy-In is rejected.
      await request(server)
        .post(`/buy-ins/${firstPending.body.buyIn.id}/approve`)
        .set("Cookie", hostCookie)
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("BUY_IN_STATUS_INVALID"));

      // Rejecting an already-verified Buy-In is rejected.
      await request(server)
        .post(`/buy-ins/${firstPending.body.buyIn.id}/reject`)
        .set("Cookie", hostCookie)
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("BUY_IN_STATUS_INVALID"));

      // After firstCookie is seated, second + third + fourth all queue through buy-in.
      // Second is auto-waitlisted at #1 (room full).
      await verify(server, hostCookie, secondCookie, roomId, 1500);

      // Reject flow: host rejects fourth, then re-approving rejected Buy-In is blocked,
      // and fourth can request a fresh Buy-In afterward.
      const rejected = await request(server)
        .post("/buy-ins")
        .set("Cookie", fourthCookie)
        .send({ roomId, amount: 1100 })
        .expect(201);
      await request(server)
        .post(`/buy-ins/${rejected.body.buyIn.id}/reject`)
        .set("Cookie", hostCookie)
        .expect(201);
      await request(server)
        .post(`/buy-ins/${rejected.body.buyIn.id}/approve`)
        .set("Cookie", hostCookie)
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("BUY_IN_STATUS_INVALID"));
      await request(server)
        .post(`/buy-ins/${rejected.body.buyIn.id}/reject`)
        .set("Cookie", hostCookie)
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("BUY_IN_STATUS_INVALID"));

      // First leaves -> Seat 2 opens, Seat Offer goes to second (head of waitlist).
      const opened = await request(server)
        .post("/seats/leave")
        .set("Cookie", firstCookie)
        .send({ roomId })
        .expect(201);
      const offer = opened.body.room.seatOffers[0];
      expect(offer.playerId).toBe(playerIdOf(opened.body.room, "second"));

      // While that offer is pending, host approves third's Buy-In.
      // Seat 2 is "open" but has a pending Seat Offer -> third must auto-waitlist (FIFO preserved).
      await verify(server, hostCookie, thirdCookie, roomId, 1300);
      const afterThird = await currentRoom(server, hostCookie);
      const thirdEntry = afterThird.room.waitlist.find(
        (w: { playerId: string }) => w.playerId === playerIdOf(afterThird.room, "third"),
      );
      expect(thirdEntry).toBeDefined();
      expect(afterThird.room.seats[1].playerId).toBeNull();

      // Second declines the offer -> next offer goes to third (now head of waitlist).
      await request(server)
        .post(`/seat-offers/${offer.id}/decline`)
        .set("Cookie", secondCookie)
        .expect(201);
      const afterDecline = await currentRoom(server, hostCookie);
      const nextOffer = afterDecline.room.seatOffers.find(
        (o: { status: string }) => o.status === "pending",
      );
      expect(nextOffer.playerId).toBe(playerIdOf(afterDecline.room, "third"));

      // Expire the offer; trying to accept the original (declined) offer is rejected.
      await request(server).post(`/seat-offers/${nextOffer.id}/expire`).expect(201);
      await request(server)
        .post(`/seat-offers/${offer.id}/accept`)
        .set("Cookie", secondCookie)
        .expect(400);
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

async function verify(
  server: Parameters<typeof request>[0],
  hostCookie: string,
  playerCookie: string,
  roomId: string,
  amount: number,
): Promise<{ buyIn: { id: string; status: string } }> {
  const buyIn = await request(server).post("/buy-ins").set("Cookie", playerCookie).send({ roomId, amount }).expect(201);
  const approved = await request(server)
    .post(`/buy-ins/${buyIn.body.buyIn.id}/approve`)
    .set("Cookie", hostCookie)
    .expect(201);
  return approved.body;
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
