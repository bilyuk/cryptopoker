import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  CURRENT_PLAYER_DISPLAY_NAME_PATH,
  CURRENT_PLAYER_PATH,
  PLAYERS_PATH,
  SESSION_COOKIE_NAME,
} from "@cryptopoker/contracts";
import { AppModule } from "../src/app.module.js";

describe("persistent Player session", () => {
  it("creates a guest Player, reuses the httpOnly session cookie, allows non-unique Display Names, and updates the current Display Name", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      const server = app.getHttpServer();

      const created = await request(server)
        .post(PLAYERS_PATH)
        .send({ displayName: "riverrat" })
        .expect(201);

      const setCookie = readSetCookie(created.headers["set-cookie"]);
      expect(setCookie?.some((cookie) => cookie.includes(`${SESSION_COOKIE_NAME}=`) && cookie.includes("HttpOnly"))).toBe(true);
      const firstBrowserCookie = setCookie?.[0];
      expect(firstBrowserCookie).toBeDefined();

      const resumed = await request(server).get(CURRENT_PLAYER_PATH).set("Cookie", firstBrowserCookie ?? "").expect(200);
      expect(resumed.body.player).toEqual(created.body.player);

      const duplicateName = await request(server)
        .post(PLAYERS_PATH)
        .send({ displayName: "riverrat" })
        .expect(201);

      expect(duplicateName.body.player.displayName).toBe("riverrat");
      expect(duplicateName.body.player.id).not.toBe(created.body.player.id);

      const renamed = await request(server)
        .patch(CURRENT_PLAYER_DISPLAY_NAME_PATH)
        .set("Cookie", firstBrowserCookie ?? "")
        .send({ displayName: "river_rat" })
        .expect(200);

      expect(renamed.body.player).toEqual({
        id: created.body.player.id,
        displayName: "river_rat",
      });
    } finally {
      await app.close();
    }
  });
});

function readSetCookie(header: string | string[] | undefined): string[] | undefined {
  if (!header) return undefined;
  return Array.isArray(header) ? header : [header];
}
