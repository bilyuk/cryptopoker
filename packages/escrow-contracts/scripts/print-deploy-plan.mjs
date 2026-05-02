import { readFile } from "node:fs/promises";

const network = process.argv[2];
if (!network) {
  throw new Error("Usage: node ./scripts/print-deploy-plan.mjs <network>");
}

const path = new URL(`../deployments/${network}/config.json`, import.meta.url);
const config = JSON.parse(await readFile(path, "utf8"));
console.log(JSON.stringify({ deploymentPlan: config }, null, 2));
