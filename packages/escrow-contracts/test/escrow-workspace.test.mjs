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
