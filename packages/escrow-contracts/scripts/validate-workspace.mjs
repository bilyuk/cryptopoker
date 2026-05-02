import { access } from "node:fs/promises";

const required = [
  new URL("../contracts/RoomEscrow.sol", import.meta.url),
  new URL("../deployments/base-sepolia/config.json", import.meta.url),
  new URL("../scripts/generate-abi-stubs.mjs", import.meta.url),
  new URL("../test/escrow-workspace.test.mjs", import.meta.url),
];

for (const file of required) {
  await access(file);
}

console.log("Escrow contracts workspace scaffold is valid.");
