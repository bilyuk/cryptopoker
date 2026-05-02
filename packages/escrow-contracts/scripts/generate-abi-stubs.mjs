import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const abiDir = new URL("../abi", import.meta.url);
await mkdir(abiDir, { recursive: true });

const roomEscrowAbi = [
  {
    type: "function",
    name: "version",
    stateMutability: "pure",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
];

await writeFile(join(abiDir.pathname, "RoomEscrow.abi.json"), JSON.stringify(roomEscrowAbi, null, 2) + "\n", "utf8");
console.log("Generated ABI stub: abi/RoomEscrow.abi.json");
