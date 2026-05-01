import { Test } from "@nestjs/testing";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { API_HEALTH_PATH, createHealthResponse } from "@cryptopoker/contracts";
import { AppModule } from "../src/app.module";

describe("API health endpoint", () => {
  it("returns the shared health contract", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    try {
      await request(app.getHttpServer())
        .get(API_HEALTH_PATH)
        .expect(200)
        .expect(createHealthResponse("ok"));
    } finally {
      await app.close();
    }
  });
});
