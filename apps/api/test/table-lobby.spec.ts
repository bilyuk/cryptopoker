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

describe("Host-Verified Buy-Ins, Seats, Waitlist, and Seat Offers", () => {
  it("requires Host verification before seating, preserves FIFO Waitlist order, and offers an opened Seat before seating a waitlisted Player", async () => {
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
        .send(headsUpSettings)
        .expect(201);
      const roomId = created.body.room.id;
      const inviteCode = created.body.room.inviteCode;

      await join(server, firstGuestCookie, inviteCode);
      await join(server, secondGuestCookie, inviteCode);
      await join(server, thirdGuestCookie, inviteCode);

      const pending = await request(server)
        .post("/buy-ins")
        .set("Cookie", firstGuestCookie)
        .send({ roomId, amount: 1200 })
        .expect(201);
      expect(pending.body.buyIn.status).toBe("pending");

      await request(server)
        .post("/seats/claim")
        .set("Cookie", firstGuestCookie)
        .send({ roomId, seatNumber: 1 })
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("HOST_VERIFIED_BUY_IN_REQUIRED"));

      await request(server)
        .post(`/buy-ins/${pending.body.buyIn.id}/approve`)
        .set("Cookie", firstGuestCookie)
        .expect(403);

      await request(server)
        .post(`/buy-ins/${pending.body.buyIn.id}/approve`)
        .set("Cookie", hostCookie)
        .expect(201)
        .expect(({ body }) => expect(body.buyIn.status).toBe("host-verified"));

      const seatedFirst = await request(server)
        .post("/seats/claim")
        .set("Cookie", firstGuestCookie)
        .send({ roomId, seatNumber: 1 })
        .expect(201);
      expect(seatedFirst.body.room.seats[0].tableStack).toBe(1200);

      await verifyAndSeat(server, hostCookie, secondGuestCookie, roomId, 1500, 2);

      await verify(server, hostCookie, thirdGuestCookie, roomId, 1100);
      const waitlisted = await request(server)
        .post("/waitlist/join")
        .set("Cookie", thirdGuestCookie)
        .send({ roomId })
        .expect(201);
      expect(waitlisted.body.room.waitlist).toEqual([{ playerId: waitlisted.body.room.players[3].playerId, position: 1 }]);
      expect(waitlisted.body.room).not.toHaveProperty("liveHand");

      const opened = await request(server)
        .post("/seats/leave")
        .set("Cookie", firstGuestCookie)
        .send({ roomId })
        .expect(201);
      const offer = opened.body.room.seatOffers[0];
      expect(offer.status).toBe("pending");
      expect(opened.body.room.seats[0].playerId).toBeNull();

      await request(server)
        .post("/seats/claim")
        .set("Cookie", thirdGuestCookie)
        .send({ roomId, seatNumber: 1 })
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("SEAT_OFFER_ACCEPTANCE_REQUIRED"));

      const accepted = await request(server)
        .post(`/seat-offers/${offer.id}/accept`)
        .set("Cookie", thirdGuestCookie)
        .expect(201);

      expect(accepted.body.room.seats[0].playerId).toBe(offer.playerId);
      expect(accepted.body.room.waitlist).toEqual([]);
    } finally {
      await app.close();
    }
  });

  it("rejects out-of-range or rejected Buy-Ins and advances Seat Offers after decline or expiry", async () => {
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

      await request(server).post("/buy-ins").set("Cookie", firstCookie).send({ roomId, amount: 999 }).expect(400);

      const rejected = await request(server).post("/buy-ins").set("Cookie", fourthCookie).send({ roomId, amount: 1000 }).expect(201);
      await request(server).post(`/buy-ins/${rejected.body.buyIn.id}/reject`).set("Cookie", hostCookie).expect(201);
      await request(server).post("/waitlist/join").set("Cookie", fourthCookie).send({ roomId }).expect(400);

      await verifyAndSeat(server, hostCookie, firstCookie, roomId, 1000, 1);
      await verifyAndSeat(server, hostCookie, secondCookie, roomId, 1000, 2);
      await verify(server, hostCookie, thirdCookie, roomId, 1000);
      await verify(server, hostCookie, fourthCookie, roomId, 1200);
      await request(server).post("/waitlist/join").set("Cookie", thirdCookie).send({ roomId }).expect(201);
      await request(server).post("/waitlist/join").set("Cookie", fourthCookie).send({ roomId }).expect(201);

      const opened = await request(server).post("/seats/leave").set("Cookie", firstCookie).send({ roomId }).expect(201);
      const firstOffer = opened.body.room.seatOffers[0];

      await request(server).post(`/seat-offers/${firstOffer.id}/decline`).set("Cookie", thirdCookie).expect(201);
      const afterDecline = await request(server).get("/rooms/current").set("Cookie", hostCookie).expect(200);
      expect(afterDecline.body.room.seatOffers[1].playerId).toBe(afterDecline.body.room.waitlist[0].playerId);

      await request(server).post(`/seat-offers/${afterDecline.body.room.seatOffers[1].id}/expire`).expect(201);
      await request(server).post(`/seat-offers/${firstOffer.id}/accept`).set("Cookie", thirdCookie).expect(400);
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

async function verify(server: Parameters<typeof request>[0], hostCookie: string, playerCookie: string, roomId: string, amount: number): Promise<void> {
  const buyIn = await request(server).post("/buy-ins").set("Cookie", playerCookie).send({ roomId, amount }).expect(201);
  await request(server).post(`/buy-ins/${buyIn.body.buyIn.id}/approve`).set("Cookie", hostCookie).expect(201);
}

async function verifyAndSeat(
  server: Parameters<typeof request>[0],
  hostCookie: string,
  playerCookie: string,
  roomId: string,
  amount: number,
  seatNumber: number,
): Promise<void> {
  await verify(server, hostCookie, playerCookie, roomId, amount);
  await request(server).post("/seats/claim").set("Cookie", playerCookie).send({ roomId, seatNumber }).expect(201);
}
