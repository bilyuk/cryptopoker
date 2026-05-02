import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("base-sepolia deployment config encodes base + USDC foundation", async () => {
  const raw = await readFile(new URL("../deployments/base-sepolia/config.json", import.meta.url), "utf8");
  const config = JSON.parse(raw);

  assert.equal(config.network, "base-sepolia");
  assert.equal(config.chainId, 84532);
  assert.equal(config.stablecoin.symbol, "USDC");
});

test("RoomEscrow contract defines registered-room USDC funding tracer surface", async () => {
  const source = await readFile(new URL("../contracts/RoomEscrow.sol", import.meta.url), "utf8");

  assert.match(source, /event FundingRecorded/);
  assert.match(source, /event FundingIntentCreated/);
  assert.match(source, /function registerRoom/);
  assert.match(source, /function createPermitIntent/);
  assert.match(source, /function fundWithPermit/);
  assert.match(source, /error RoomNotRegistered/);
  assert.match(source, /error UnsupportedToken/);
  assert.doesNotMatch(source, /NotImplemented/);
});
