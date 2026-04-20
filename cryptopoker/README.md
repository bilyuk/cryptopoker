# CryptoPoker Monorepo Scaffold

This repository is scaffolded for shared API contracts across backend and web clients.
Canonical remote: `https://github.com/bilyuk/cryptopoker`.

## Workspace layout

- `contracts/api-schema`: shared request/response/event schemas (Zod + TS types)
- `server/api`: backend API foundation consuming shared schema package
- `ui/web-app`: web app foundation consuming shared schema package
- `infra`: local dependency definitions and baseline migration

## Quick start

```bash
pnpm bootstrap:local
```

Then:

1. Copy `infra/.env.example` to `.env`.
2. Apply SQL files from `infra/migrations/` to Postgres.
3. Build all packages:

```bash
pnpm build
```

## Useful commands

- `pnpm lint`: run ESLint across contracts/backend/web packages
- `pnpm build`: compile all workspace packages
- `pnpm typecheck`: run strict TS checks across workspaces
- `pnpm test`: run backend/web test suites, including websocket handshake/chat smoke coverage
- `pnpm contracts:test`: run Solidity unit tests for escrow/payout contracts
- `pnpm contracts:deploy:base-sepolia`: deploy `BaseEscrowSettlement` to Base Sepolia
- `pnpm figma:mcp:verify`: verify Figma MCP endpoint reachability for this project
- `pnpm mvp:websocket`: build and run the websocket-ready MVP baseline server
- `pnpm clean`: remove build artifacts

## Websocket-ready MVP flow

Run the baseline websocket service:

```bash
pnpm mvp:websocket
```

The command always defaults to port `3000` (it does not use ambient `PORT` from your shell).
To run on a different port, set `CRYPTOPOKER_MVP_PORT` explicitly:

```bash
CRYPTOPOKER_MVP_PORT=3300 pnpm mvp:websocket
```

Service endpoints:

- `POST /api/rooms` with `{"displayName":"alice","roomName":"Velvet"}`
- `GET /health`
- websocket handshake: `ws://localhost:<port>/ws?roomId=<roomId>&playerId=<playerId>`
- realtime QA client UI: `http://localhost:<port>`

The websocket flow supports room join, room presence updates, and cross-client `chat:message` broadcast.
Protocol details and payload contract: `docs/websocket-protocol-contract.md`.
UI validation steps: `ui/web-table-foundation/README.md`.

## Operations docs

- `docs/websocket-protocol-contract.md`: websocket handshake, request/response schemas, and message types
- `docs/ops/observability-baseline.md`: traces, metrics, alert thresholds, and dashboard baseline
- `docs/ops/incident-runbook.md`: incident triage + mitigation + rollback playbooks
- `docs/ops/mvp-launch-checklist.md`: reliability/security launch gates
- `docs/ops/workspace-governance.md`: ownership model, CI checks, and branch protection defaults
- `docs/ops/figma-mcp-runbook.md`: Figma MCP setup, verification, and usage workflow
