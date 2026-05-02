import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { RoomSettingsDto } from "@cryptopoker/contracts";
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
        .post("/rooms")
        .set("Cookie", hostCookie)
        .send(defaultSettings)
        .expect(201);

      expect(created.body.room.settings).toEqual({
        ...defaultSettings,
        mode: "blockchain-backed",
        blockchain: {
          network: "base",
          stablecoin: "USDC",
          maxTotalBuyIn: defaultSettings.buyInMax,
          antiRatholing: true,
          noRake: true,
          compliance: {
            allowedJurisdictions: ["US-CA"],
            publicAccess: "closed-alpha",
            screeningMode: "require-clear",
          },
        },
      });
      expect(created.body.room.hostPlayerId).toBeTruthy();
      expect(created.body.room.tableId).toBeTruthy();
      expect(created.body.room.tableId).not.toBe(created.body.room.id);
      expect(created.body.room.inviteCode).toHaveLength(32);
      expect(created.body.room.inviteCode).not.toBe(created.body.room.id);
      expect(created.body.room.players).toHaveLength(1);
      expect(created.body.room.seats).toHaveLength(6);

      await request(server)
        .post("/rooms")
        .set("Cookie", hostCookie)
        .send({ ...defaultSettings, name: "Second Room" })
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("ONE_ACTIVE_ROOM"));
    } finally {
      await app.close();
    }
  });
});

describe("Blockchain-backed Room creation and wallet preflight", () => {
  it("creates blockchain-backed Rooms with Base/native USDC policy and reports wallet preflight states", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");

      const created = await request(server)
        .post("/rooms")
        .set("Cookie", hostCookie)
        .send({
          ...defaultSettings,
          mode: "blockchain-backed",
          blockchain: {
            network: "base",
            stablecoin: "USDC",
            maxTotalBuyIn: 800,
            antiRatholing: true,
            noRake: true,
            compliance: {
              allowedJurisdictions: ["US-CA", "US-NY"],
              publicAccess: "closed-alpha",
              screeningMode: "require-clear",
            },
          },
        })
        .expect(201);

      expect(created.body.room.settings.mode).toBe("blockchain-backed");
      expect(created.body.room.settings.blockchain).toEqual({
        network: "base",
        stablecoin: "USDC",
        maxTotalBuyIn: 800,
        antiRatholing: true,
        noRake: true,
        compliance: {
          allowedJurisdictions: ["US-CA", "US-NY"],
          publicAccess: "closed-alpha",
          screeningMode: "require-clear",
        },
      });

      await request(server)
        .get(`/rooms/${created.body.room.id}/wallet-preflight?connectedNetwork=base&connectedStablecoin=USDC&jurisdiction=US-CA&ageAttested=true&legalLocationAttested=true&walletScreening=clear`)
        .set("Cookie", hostCookie)
        .expect(200)
        .expect(({ body }) => {
          expect(body.preflight.status).toBe("wallet-required");
          expect(body.preflight.fundingAllowed).toBe(false);
          expect(body.preflight.requiredNetwork).toBe("base");
          expect(body.preflight.requiredStablecoin).toBe("USDC");
        });

      await request(server).post("/players/current/wallet").set("Cookie", hostCookie).send({}).expect(201);

      await request(server)
        .get(`/rooms/${created.body.room.id}/wallet-preflight?connectedNetwork=other&connectedStablecoin=USDC&jurisdiction=US-CA&ageAttested=true&legalLocationAttested=true&walletScreening=clear`)
        .set("Cookie", hostCookie)
        .expect(200)
        .expect(({ body }) => expect(body.preflight.status).toBe("wrong-chain"));

      await request(server)
        .get(`/rooms/${created.body.room.id}/wallet-preflight?connectedNetwork=base&connectedStablecoin=other&jurisdiction=US-CA&ageAttested=true&legalLocationAttested=true&walletScreening=clear`)
        .set("Cookie", hostCookie)
        .expect(200)
        .expect(({ body }) => expect(body.preflight.status).toBe("unsupported-token"));

      await request(server)
        .get(`/rooms/${created.body.room.id}/wallet-preflight?connectedNetwork=base&connectedStablecoin=USDC&jurisdiction=US-TX&ageAttested=true&legalLocationAttested=true&walletScreening=clear`)
        .set("Cookie", hostCookie)
        .expect(200)
        .expect(({ body }) => expect(body.preflight.status).toBe("jurisdiction-blocked"));

      await request(server)
        .get(`/rooms/${created.body.room.id}/wallet-preflight?connectedNetwork=base&connectedStablecoin=USDC&jurisdiction=US-CA&ageAttested=false&legalLocationAttested=true&walletScreening=clear`)
        .set("Cookie", hostCookie)
        .expect(200)
        .expect(({ body }) => expect(body.preflight.status).toBe("age-attestation-required"));

      await request(server)
        .get(`/rooms/${created.body.room.id}/wallet-preflight?connectedNetwork=base&connectedStablecoin=USDC&jurisdiction=US-CA&ageAttested=true&legalLocationAttested=false&walletScreening=clear`)
        .set("Cookie", hostCookie)
        .expect(200)
        .expect(({ body }) => expect(body.preflight.status).toBe("location-attestation-required"));

      await request(server)
        .get(`/rooms/${created.body.room.id}/wallet-preflight?connectedNetwork=base&connectedStablecoin=USDC&jurisdiction=US-CA&ageAttested=true&legalLocationAttested=true&walletScreening=blocked`)
        .set("Cookie", hostCookie)
        .expect(200)
        .expect(({ body }) => expect(body.preflight.status).toBe("wallet-screening-blocked"));

      await request(server)
        .get(`/rooms/${created.body.room.id}/wallet-preflight?connectedNetwork=base&connectedStablecoin=USDC&jurisdiction=US-CA&ageAttested=true&legalLocationAttested=true&walletScreening=clear`)
        .set("Cookie", hostCookie)
        .expect(200)
        .expect(({ body }) => {
          expect(body.preflight.status).toBe("ready");
          expect(body.preflight.fundingAllowed).toBe(true);
          expect(body.preflight.noRake).toBe(true);
        });
    } finally {
      await app.close();
    }
  });

  it("still supports explicit Host-Verified Buy-In Room creation", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");

      const created = await request(server)
        .post("/rooms")
        .set("Cookie", hostCookie)
        .send({
          ...defaultSettings,
          mode: "host-verified",
        })
        .expect(201);

      expect(created.body.room.settings.mode).toBe("host-verified");
      expect(created.body.room.settings.blockchain).toBeNull();
    } finally {
      await app.close();
    }
  });

  it("blocks funding when legal review keeps public access disabled and enforces no-rake", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const hostCookie = await createPlayer(server, "host");

      const created = await request(server)
        .post("/rooms")
        .set("Cookie", hostCookie)
        .send({
          ...defaultSettings,
          mode: "blockchain-backed",
          blockchain: {
            network: "base",
            stablecoin: "USDC",
            maxTotalBuyIn: 800,
            antiRatholing: true,
            noRake: true,
            compliance: {
              allowedJurisdictions: ["US-CA"],
              publicAccess: "public-disabled",
              screeningMode: "require-clear",
            },
          },
        })
        .expect(201);

      await request(server)
        .get(`/rooms/${created.body.room.id}/wallet-preflight?connectedNetwork=base&connectedStablecoin=USDC&jurisdiction=US-CA&ageAttested=true&legalLocationAttested=true&walletScreening=clear`)
        .set("Cookie", hostCookie)
        .expect(200)
        .expect(({ body }) => expect(body.preflight.status).toBe("launch-disabled"));

      await request(server)
        .post("/rooms")
        .set("Cookie", await createPlayer(server, "host2"))
        .send({
          ...defaultSettings,
          name: "Bad Rake",
          mode: "blockchain-backed",
          blockchain: {
            network: "base",
            stablecoin: "USDC",
            maxTotalBuyIn: 800,
            antiRatholing: true,
            noRake: false,
          },
        })
        .expect(400)
        .expect(({ body }) => expect(body.code).toBe("RAKE_FORBIDDEN"));
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
        .post("/rooms")
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
        .post("/rooms")
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
        .post("/rooms")
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
  const response = await request(server).post("/players").send({ displayName }).expect(201);
  return readSetCookie(response.headers["set-cookie"])[0];
}

function readSetCookie(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}
