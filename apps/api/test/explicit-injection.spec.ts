import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { RoomSettingsDto } from "@cryptopoker/contracts";
import { BuyInsController } from "../src/lobby/buy-ins.controller.js";
import { InviteLinksController } from "../src/lobby/invite-links.controller.js";
import { LobbyStore } from "../src/lobby/lobby.store.js";
import { RoomsController } from "../src/lobby/rooms.controller.js";
import { SeatOffersController } from "../src/lobby/seat-offers.controller.js";
import { SeatsController } from "../src/lobby/seats.controller.js";
import { WaitlistController } from "../src/lobby/waitlist.controller.js";
import { AppModule } from "../src/app.module.js";
import { PlayersController } from "../src/sessions/players.controller.js";

const defaultSettings: RoomSettingsDto = {
  name: "Gilt Room",
  smallBlind: 2,
  bigBlind: 5,
  buyInMin: 100,
  buyInMax: 500,
  seatCount: 6,
  actionTimerSeconds: 30,
};

describe("API dependency injection without emitted constructor metadata", () => {
  it("serves session and Room commands through explicit provider tokens", async () => {
    stripConstructorMetadata();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();
      const createdPlayer = await request(server).post("/players").send({ displayName: "host" }).expect(201);
      const cookie = readSetCookie(createdPlayer.headers["set-cookie"])[0];

      const createdRoom = await request(server)
        .post("/rooms")
        .set("Cookie", cookie)
        .send(defaultSettings)
        .expect(201);

      expect(createdRoom.body.room.settings.name).toBe("Gilt Room");
      expect(createdRoom.body.room.players).toEqual([
        {
          playerId: createdPlayer.body.player.id,
          displayName: "host",
          role: "host",
        },
      ]);
    } finally {
      await app.close();
    }
  });
});

function stripConstructorMetadata(): void {
  const reflect = Reflect as typeof Reflect & {
    deleteMetadata?: (metadataKey: string, target: object) => boolean;
  };

  for (const target of [
    PlayersController,
    LobbyStore,
    RoomsController,
    InviteLinksController,
    BuyInsController,
    SeatsController,
    WaitlistController,
    SeatOffersController,
  ]) {
    reflect.deleteMetadata?.("design:paramtypes", target);
  }
}

function readSetCookie(header: string | string[] | undefined): string[] {
  if (!header) return [];
  return Array.isArray(header) ? header : [header];
}
