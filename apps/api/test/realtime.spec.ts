import { Test } from "@nestjs/testing";
import request from "supertest";
import { io, type Socket } from "socket.io-client";
import { afterEach, describe, expect, it } from "vitest";
import { REALTIME_EVENTS, type RoomSettingsDto } from "@cryptopoker/contracts";
import { AppModule } from "../src/app.module.js";

const settings: RoomSettingsDto = {
  name: "Realtime Room",
  smallBlind: 1,
  bigBlind: 2,
  buyInMin: 40,
  buyInMax: 200,
  seatCount: 2,
  actionTimerSeconds: 30,
};

const sockets: Socket[] = [];

afterEach(() => {
  for (const socket of sockets.splice(0)) {
    socket.disconnect();
  }
});

describe("realtime Room and Player events", () => {
  it("authenticates Socket.IO with the session cookie, authorizes Room subscriptions, emits Room events, and targets Seat Offers privately", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    await app.listen(0);

    try {
      const server = app.getHttpServer();
      const address = server.address();
      const url = typeof address === "object" && address ? `http://127.0.0.1:${address.port}` : "";

      const hostCookie = await createPlayer(server, "host");
      const firstCookie = await createPlayer(server, "first");
      const secondCookie = await createPlayer(server, "second");
      const thirdCookie = await createPlayer(server, "third");
      const outsiderCookie = await createPlayer(server, "outsider");

      const created = await request(server).post("/rooms").set("Cookie", hostCookie).send(settings).expect(201);
      const roomId = created.body.room.id;
      const inviteCode = created.body.room.inviteCode;

      await join(server, firstCookie, inviteCode);
      await join(server, secondCookie, inviteCode);
      await join(server, thirdCookie, inviteCode);

      const hostSocket = await connectSocket(url, hostCookie);
      const secondSocket = await connectSocket(url, secondCookie);
      const thirdSocket = await connectSocket(url, thirdCookie);
      const outsiderSocket = await connectSocket(url, outsiderCookie);

      await expect(emitWithAck(hostSocket, "room.subscribe", { roomId })).resolves.toEqual({ ok: true });
      await expect(emitWithAck(outsiderSocket, "room.subscribe", { roomId })).resolves.toEqual({
        ok: false,
        code: "ROOM_ACCESS_REQUIRED",
      });

      const roomUpdated = once(hostSocket, REALTIME_EVENTS.roomUpdated);
      // Host is already at Seat 1 (auto). first auto-seats at Seat 2 on approve.
      await verify(server, hostCookie, firstCookie, roomId, 100);
      await expect(roomUpdated).resolves.toEqual(expect.objectContaining({ roomId }));

      // Heads-up room is now full. second auto-waitlists at #1. third auto-waitlists at #2.
      await verify(server, hostCookie, secondCookie, roomId, 120);
      await verify(server, hostCookie, thirdCookie, roomId, 140);
      const secondOfferPrompt = once(secondSocket, REALTIME_EVENTS.seatOfferCreated);
      const thirdOfferPrompt = once(thirdSocket, REALTIME_EVENTS.seatOfferCreated, 200);
      await request(server).post("/seats/leave").set("Cookie", firstCookie).send({ roomId }).expect(201);

      // FIFO: second was waitlisted before third, so second gets the Seat Offer.
      await expect(secondOfferPrompt).resolves.toEqual(expect.objectContaining({ roomId }));
      await expect(thirdOfferPrompt).rejects.toThrow("Timed out");
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

async function connectSocket(url: string, cookie: string): Promise<Socket> {
  const socket = io(url, {
    extraHeaders: { Cookie: cookie },
    transports: ["websocket"],
  });
  sockets.push(socket);
  await once(socket, "connect");
  return socket;
}

function emitWithAck(socket: Socket, event: string, payload: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    socket.emit(event, payload, resolve);
  });
}

function once(socket: Socket, event: string, timeoutMs = 1000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error("Timed out waiting for socket event"));
    }, timeoutMs);
    const onEvent = (payload: unknown) => {
      clearTimeout(timer);
      resolve(payload);
    };
    socket.once(event, onEvent);
  });
}
