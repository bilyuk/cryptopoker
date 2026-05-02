# Local Dev Setup and Repo Familiarization

Last verified: 2026-05-01 (America/Los_Angeles)

## Prerequisites

- Node.js 22+ with Corepack enabled
- `pnpm` (workspace uses `pnpm@10.11.0`)
- Docker (for Postgres)

## First-time setup

1. Install dependencies:

```bash
pnpm install
```

2. Create local env file:

```bash
cp .env.example .env
```

3. Start Postgres:

```bash
pnpm db:up
```

If you see a container-name conflict for `cryptopoker-postgres`, it usually means the DB container already exists and is running. Check it with:

```bash
docker ps -a --filter name=cryptopoker-postgres
```

4. Start API and web in separate terminals:

```bash
pnpm --filter @cryptopoker/api dev
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 pnpm --filter @cryptopoker/web dev
```

## Validation commands

- Full tests:

```bash
pnpm test
```

- Typecheck:

```bash
pnpm typecheck
```

Current state: tests pass; typecheck currently fails in `@cryptopoker/web` because React type declarations are missing (`TS7016` for `react` and `react/jsx-runtime`).

## Monorepo familiarization

- `apps/api`: NestJS API + Socket.IO realtime lobby/table gateways and integration tests.
- `apps/web`: Next.js app, Storybook stories, and UI/client state logic.
- `packages/contracts`: shared runtime and type contracts used by API and web.
- `docs/adr/`: architecture decisions (authoritative game server, room actors, Postgres persistence, REST + websocket event model, etc.).
- `CONTEXT.md`: domain language glossary and relationship invariants; use this vocabulary in code and docs.

## Important domain and architecture references

- Domain language and invariants: `CONTEXT.md`
- ADR index: `docs/adr/`
- Agent issue tracker rules: `docs/agents/issue-tracker.md`
- Triage label mapping: `docs/agents/triage-labels.md`
