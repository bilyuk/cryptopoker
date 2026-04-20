import { startMvpWebsocketServer } from "./websocket-mvp.js";

const DEFAULT_MVP_PORT = 3000;
const MVP_PORT_ENV = "CRYPTOPOKER_MVP_PORT";
const DEV_EVENT_NAME = "dev";
const MAX_PORT_RETRIES = 10;

const resolvePort = (): number => {
  const rawPort = process.env[MVP_PORT_ENV];
  if (!rawPort) {
    return DEFAULT_MVP_PORT;
  }

  const parsed = Number(rawPort);
  const validPort = Number.isInteger(parsed) && parsed > 0 && parsed <= 65535;
  if (!validPort) {
    throw new Error(`Invalid ${MVP_PORT_ENV} value: ${rawPort}`);
  }

  return parsed;
};

const requestedPort = resolvePort();
const retryOnPortInUse = process.env.npm_lifecycle_event === DEV_EVENT_NAME;
let activePort = requestedPort;
let attempts = 0;

try {
  while (true) {
    try {
      await startMvpWebsocketServer(activePort);
      break;
    } catch (error) {
      const typedError = error as NodeJS.ErrnoException;
      const canRetry =
        retryOnPortInUse && typedError.code === "EADDRINUSE" && attempts < MAX_PORT_RETRIES;

      if (!canRetry) {
        throw error;
      }

      attempts += 1;
      activePort += 1;
    }
  }

  if (retryOnPortInUse && activePort !== requestedPort) {
    console.log(`Port ${requestedPort} is busy, using ${activePort} instead.`);
  }

  console.log(`CryptoPoker MVP websocket server listening on http://localhost:${activePort}`);
  console.log(`Websocket endpoint: ws://localhost:${activePort}/ws`);
} catch (error) {
  const typedError = error as NodeJS.ErrnoException;
  if (typedError.code === "EADDRINUSE") {
    console.error(
      `Failed to start websocket MVP server: port ${activePort} is already in use.\n` +
        `Use a different port: ${MVP_PORT_ENV}=3300 pnpm mvp:websocket\n` +
        `Then connect to ws://localhost:3300/ws`
    );
    process.exit(1);
  }

  const reason = error instanceof Error ? error.message : String(error);
  console.error(`Failed to start websocket MVP server: ${reason}`);
  process.exit(1);
}
