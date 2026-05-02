import test from "node:test";
import assert from "node:assert/strict";

class RoomEscrowFundingTracer {
  #registeredRooms = new Set();
  #permitIntents = new Map();
  #events = [];

  registerRoom(roomId) {
    this.#registeredRooms.add(roomId);
  }

  createPermitIntent({ permitId, roomId, playerId, tokenSymbol, amount }) {
    if (!this.#registeredRooms.has(roomId)) {
      throw new Error("ROOM_NOT_REGISTERED");
    }
    if (tokenSymbol !== "USDC") {
      throw new Error("UNSUPPORTED_TOKEN");
    }
    if (amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }
    this.#permitIntents.set(permitId, { permitId, roomId, playerId, tokenSymbol, amount, consumed: false });
  }

  fundWithPermit({ permitId, roomId, playerId, tokenSymbol, amount, txHash, blockNumber }) {
    const intent = this.#permitIntents.get(permitId);
    if (!intent || intent.consumed) {
      throw new Error("PERMIT_ALREADY_USED");
    }
    if (intent.roomId !== roomId) {
      throw new Error("WRONG_ROOM");
    }
    if (intent.playerId !== playerId) {
      throw new Error("WRONG_PLAYER");
    }
    if (intent.tokenSymbol !== tokenSymbol) {
      throw new Error("WRONG_TOKEN");
    }
    if (intent.amount !== amount) {
      throw new Error("WRONG_AMOUNT");
    }

    intent.consumed = true;
    const event = {
      name: "FundingRecorded",
      indexed: {
        roomId,
        playerId,
      },
      data: {
        permitId,
        amount,
        tokenSymbol,
        txHash,
        blockNumber,
      },
    };
    this.#events.push(event);
    return event;
  }

  events() {
    return this.#events.slice();
  }
}

test("accepts funding only for registered room with native USDC and one-shot permit intent", () => {
  const tracer = new RoomEscrowFundingTracer();
  tracer.registerRoom("room-1");

  tracer.createPermitIntent({
    permitId: "permit-1",
    roomId: "room-1",
    playerId: "player-1",
    tokenSymbol: "USDC",
    amount: 150,
  });

  const event = tracer.fundWithPermit({
    permitId: "permit-1",
    roomId: "room-1",
    playerId: "player-1",
    tokenSymbol: "USDC",
    amount: 150,
    txHash: "0xabc",
    blockNumber: 100,
  });

  assert.equal(event.name, "FundingRecorded");
  assert.deepEqual(event.indexed, { roomId: "room-1", playerId: "player-1" });

  assert.throws(
    () =>
      tracer.fundWithPermit({
        permitId: "permit-1",
        roomId: "room-1",
        playerId: "player-1",
        tokenSymbol: "USDC",
        amount: 150,
        txHash: "0xdef",
        blockNumber: 101,
      }),
    /PERMIT_ALREADY_USED/,
  );
});

test("rejects wrong room, wrong token, and wrong amount", () => {
  const tracer = new RoomEscrowFundingTracer();
  tracer.registerRoom("room-1");

  assert.throws(
    () =>
      tracer.createPermitIntent({
        permitId: "permit-x",
        roomId: "room-missing",
        playerId: "player-1",
        tokenSymbol: "USDC",
        amount: 100,
      }),
    /ROOM_NOT_REGISTERED/,
  );

  assert.throws(
    () =>
      tracer.createPermitIntent({
        permitId: "permit-y",
        roomId: "room-1",
        playerId: "player-1",
        tokenSymbol: "USDT",
        amount: 100,
      }),
    /UNSUPPORTED_TOKEN/,
  );

  tracer.createPermitIntent({
    permitId: "permit-z",
    roomId: "room-1",
    playerId: "player-1",
    tokenSymbol: "USDC",
    amount: 100,
  });

  assert.throws(
    () =>
      tracer.fundWithPermit({
        permitId: "permit-z",
        roomId: "room-2",
        playerId: "player-1",
        tokenSymbol: "USDC",
        amount: 100,
        txHash: "0xaaa",
        blockNumber: 200,
      }),
    /WRONG_ROOM/,
  );

  assert.throws(
    () =>
      tracer.fundWithPermit({
        permitId: "permit-z",
        roomId: "room-1",
        playerId: "player-1",
        tokenSymbol: "USDC",
        amount: 99,
        txHash: "0xbbb",
        blockNumber: 200,
      }),
    /WRONG_AMOUNT/,
  );

  assert.throws(
    () =>
      tracer.fundWithPermit({
        permitId: "permit-z",
        roomId: "room-1",
        playerId: "player-1",
        tokenSymbol: "USDT",
        amount: 100,
        txHash: "0xccc",
        blockNumber: 200,
      }),
    /WRONG_TOKEN/,
  );
});
