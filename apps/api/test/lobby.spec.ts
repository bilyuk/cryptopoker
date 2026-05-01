import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { PLAYERS_PATH, ROOMS_PATH, type RoomSettingsDto } from "@cryptopoker/contracts";
import { AppModule } from "../src/app.module.js";

const defaultSettings: RoomSettingsDto = {
  name: "Gilt Room",
  smallBlind: 2,
  bigBlind: 5,
  buyInMin: 100,
  buyInMax: 500,
  seatCount: 6,
  actionTimerSeconds: 30,
};

describe("Room Host private Room flow", () => {
  it("lets a Player create one private Room with a distinct Invite Link and exactly one Table", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");

      const created = await request(server)
        .post(ROOMS_PATH)
        .set("Cookie", hostCookie)
        .send(defaultSettings)
        .expect(201);

      expect(created.body.room.settings).toEqual(defaultSettings);
      expect(created.body.room.hostPlayerId).toBeTruthy();
      expect(created.body.room.tableId).toBeTruthy();
      expect(created.body.room.tableId).not.toBe(created.body.room.id);
      expect(created.body.room.inviteCode).toHaveLength(32);
      expect(created.body.room.inviteCode).not.toBe(created.body.room.id);
      expect(created.body.room.players).toHaveLength(1);
      expect(created.body.room.seats).toHaveLength(6);

      await request(server)
        .post(ROOMS_PATH)
        .set("Cookie", hostCookie)
        .send({ ...defaultSettings, name: "Second Room" })
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("ONE_ACTIVE_ROOM"));
    } finally {
      await app.close();
    }
  });
});

describe("Invite Link access", () => {
  it("allows invited Players to preview and join by Invite Link while rejecting guessed Room identifiers and second active Rooms", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");
      const guestCookie = await createPlayer(server, "guest");

      const created = await request(server)
        .post(ROOMS_PATH)
        .set("Cookie", hostCookie)
        .send(defaultSettings)
        .expect(201);

      await request(server).get(`/invite-links/${created.body.room.inviteCode}`).expect(200);
      await request(server).get(`/invite-links/${created.body.room.id}`).expect(404);

      const joined = await request(server)
        .post(`/invite-links/${created.body.room.inviteCode}/join`)
        .set("Cookie", guestCookie)
        .expect(201);

      expect(joined.body.room.players.map((player: { displayName: string }) => player.displayName)).toContain("guest");

      await request(server)
        .post(ROOMS_PATH)
        .set("Cookie", guestCookie)
        .send({ ...defaultSettings, name: "Other Room" })
        .expect(400);

      await request(server)
        .get("/rooms/current")
        .set("Cookie", guestCookie)
        .expect(200)
        .expect(({ body }) => expect(body.room.id).toBe(created.body.room.id));
    } finally {
      await app.close();
    }
  });
});

describe("Room settings and Invite Link rotation", () => {
  it("keeps Room Host settings commands private and rotates Invite Links without removing present Players", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");
      const guestCookie = await createPlayer(server, "guest");

      const created = await request(server)
        .post(ROOMS_PATH)
        .set("Cookie", hostCookie)
        .send(defaultSettings)
        .expect(201);
      const roomId = created.body.room.id;
      const oldInviteCode = created.body.room.inviteCode;

      await request(server).post(`/invite-links/${oldInviteCode}/join`).set("Cookie", guestCookie).expect(201);

      await request(server)
        .patch(`/rooms/${roomId}/settings`)
        .set("Cookie", guestCookie)
        .send({ name: "Guest Rename" })
        .expect(403);

      const renamed = await request(server)
        .patch(`/rooms/${roomId}/settings`)
        .set("Cookie", hostCookie)
        .send({ name: "Velvet Room" })
        .expect(200);
      expect(renamed.body.room.settings.name).toBe("Velvet Room");

      const rotated = await request(server)
        .post(`/rooms/${roomId}/rotate-invite`)
        .set("Cookie", hostCookie)
        .expect(201);

      expect(rotated.body.room.inviteCode).not.toBe(oldInviteCode);
      expect(rotated.body.room.players).toHaveLength(2);
      await request(server).get(`/invite-links/${oldInviteCode}`).expect(404);
    } finally {
      await app.close();
    }
  });
});

async function createPlayer(server: Parameters<typeof request>[0], displayName: string): Promise<string> {
  const response = await request(server).post(PLAYERS_PATH).send({ displayName }).expect(201);
  return readSetCookie(response.headers["set-cookie"])[0];
}

function readSetCookie(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}
