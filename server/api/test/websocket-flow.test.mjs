import assert from "node:assert/strict";
import test from "node:test";
import { schemaVersion } from "@cryptopoker/api-schema";
import { WebSocket } from "ws";
import { createMvpWebsocketApp } from "../dist/websocket-mvp.js";

const closeWebSocket = (socket) =>
  new Promise((resolve) => {
    if (socket.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    socket.once("close", () => resolve());
    socket.close();
  });

const waitForMessage = (socket, predicate, timeoutMs = 2000) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off("message", onMessage);
      reject(new Error("timed_out_waiting_for_message"));
    }, timeoutMs);

    const onMessage = (rawPayload) => {
      const payload = JSON.parse(String(rawPayload));
      if (!predicate(payload)) {
        return;
      }
      clearTimeout(timeout);
      socket.off("message", onMessage);
      resolve(payload);
    };

    socket.on("message", onMessage);
  });

const waitForClose = (socket, timeoutMs = 2000) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off("close", onClose);
      reject(new Error("timed_out_waiting_for_close"));
    }, timeoutMs);

    const onClose = (code, reasonBuffer) => {
      clearTimeout(timeout);
      socket.off("close", onClose);
      resolve({ code, reason: reasonBuffer.toString() });
    };

    socket.on("close", onClose);
  });

test("accepts two players and broadcasts chat over websocket", async () => {
  const { server } = createMvpWebsocketApp();
  await new Promise((resolve) => server.listen(0, resolve));

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const websocketUrl = `ws://127.0.0.1:${address.port}`;

  const firstJoinResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "alice", roomName: "Velvet" })
  });
  assert.equal(firstJoinResponse.status, 201);
  const firstSeat = await firstJoinResponse.json();

  const secondJoinResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "bob", roomName: "Velvet" })
  });
  assert.equal(secondJoinResponse.status, 201);
  const secondSeat = await secondJoinResponse.json();

  const firstSocket = new WebSocket(
    `${websocketUrl}/ws?roomId=${firstSeat.roomId}&playerId=${firstSeat.player.id}`
  );
  const secondSocket = new WebSocket(
    `${websocketUrl}/ws?roomId=${secondSeat.roomId}&playerId=${secondSeat.player.id}`
  );

  try {
    const firstWelcome = await waitForMessage(firstSocket, (msg) => msg.type === "room:welcome");
    const secondWelcome = await waitForMessage(secondSocket, (msg) => msg.type === "room:welcome");
    assert.equal(firstWelcome.version, schemaVersion);
    assert.equal(secondWelcome.version, schemaVersion);
    assert.equal(firstWelcome.player.displayName, "alice");
    assert.equal(secondWelcome.player.displayName, "bob");

    firstSocket.send(JSON.stringify({ type: "chat:send", text: "hello table" }));
    const delivered = await waitForMessage(
      secondSocket,
      (msg) => msg.type === "chat:message" && msg.text === "hello table"
    );

    assert.equal(delivered.version, schemaVersion);
    assert.equal(typeof delivered.at, "string");
    assert.notEqual(Number.isNaN(Date.parse(delivered.at)), true);
    assert.equal(delivered.from, "alice");
  } finally {
    await Promise.all([closeWebSocket(firstSocket), closeWebSocket(secondSocket)]);
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test("rejects malformed websocket payloads with protocol error messages", async () => {
  const { server } = createMvpWebsocketApp();
  await new Promise((resolve) => server.listen(0, resolve));

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const websocketUrl = `ws://127.0.0.1:${address.port}`;

  const joinResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "alice", roomName: "Velvet" })
  });
  assert.equal(joinResponse.status, 201);
  const seat = await joinResponse.json();

  const socket = new WebSocket(`${websocketUrl}/ws?roomId=${seat.roomId}&playerId=${seat.player.id}`);

  try {
    await waitForMessage(socket, (msg) => msg.type === "room:welcome");

    socket.send("{not-json");
    const invalidJson = await waitForMessage(
      socket,
      (msg) => msg.type === "error" && msg.code === "invalid_json"
    );
    assert.equal(invalidJson.version, schemaVersion);

    socket.send(JSON.stringify({ type: "chat:send", text: "" }));
    const invalidMessage = await waitForMessage(
      socket,
      (msg) => msg.type === "error" && msg.code === "invalid_message"
    );
    assert.equal(invalidMessage.version, schemaVersion);
  } finally {
    await closeWebSocket(socket);
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test("supports reconnect and broadcasts presence transitions", async () => {
  const { server } = createMvpWebsocketApp();
  await new Promise((resolve) => server.listen(0, resolve));

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  const baseUrl = `http://127.0.0.1:${address.port}`;
  const websocketUrl = `ws://127.0.0.1:${address.port}`;

  const aliceJoinResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "alice", roomName: "Velvet" })
  });
  assert.equal(aliceJoinResponse.status, 201);
  const aliceSeat = await aliceJoinResponse.json();

  const bobJoinResponse = await fetch(`${baseUrl}/api/rooms`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ displayName: "bob", roomName: "Velvet" })
  });
  assert.equal(bobJoinResponse.status, 201);
  const bobSeat = await bobJoinResponse.json();

  const aliceSocket = new WebSocket(
    `${websocketUrl}/ws?roomId=${aliceSeat.roomId}&playerId=${aliceSeat.player.id}`
  );
  const bobSocket = new WebSocket(`${websocketUrl}/ws?roomId=${bobSeat.roomId}&playerId=${bobSeat.player.id}`);

  try {
    await waitForMessage(aliceSocket, (msg) => msg.type === "room:welcome");
    await waitForMessage(bobSocket, (msg) => msg.type === "room:welcome");

    await closeWebSocket(bobSocket);
    const disconnectedPresence = await waitForMessage(
      aliceSocket,
      (msg) =>
        msg.type === "room:presence" &&
        msg.room.players.some((player) => player.id === bobSeat.player.id && player.connected === false)
    );
    assert.equal(disconnectedPresence.version, schemaVersion);

    const bobReconnected = new WebSocket(
      `${websocketUrl}/ws?roomId=${bobSeat.roomId}&playerId=${bobSeat.player.id}`
    );
    try {
      const reconnectWelcome = await waitForMessage(bobReconnected, (msg) => msg.type === "room:welcome");
      assert.equal(reconnectWelcome.player.id, bobSeat.player.id);

      const reconnectedPresence = await waitForMessage(
        aliceSocket,
        (msg) =>
          msg.type === "room:presence" &&
          msg.room.players.some((player) => player.id === bobSeat.player.id && player.connected === true)
      );
      assert.equal(reconnectedPresence.version, schemaVersion);
    } finally {
      await closeWebSocket(bobReconnected);
    }
  } finally {
    await closeWebSocket(aliceSocket);
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});

test("rejects invalid session sockets during handshake", async () => {
  const { server } = createMvpWebsocketApp();
  await new Promise((resolve) => server.listen(0, resolve));

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws?roomId=bad_room&playerId=bad_player`);
  try {
    const close = await waitForClose(socket);
    assert.equal(close.code, 1008);
    assert.equal(close.reason, "invalid_session");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
});
