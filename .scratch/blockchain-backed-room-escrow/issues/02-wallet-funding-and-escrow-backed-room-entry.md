# Wallet Funding and Escrow-Backed Room Entry

Status: ready-for-human

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Replace Host approval as the gate for room participation with wallet-linked escrow funding and asynchronous deposit confirmation.

## Acceptance criteria

- [ ] A Player can link or provision a supported wallet while preserving the existing browser-persistent Player identity.
- [ ] The app can create a room funding intent for a supported stablecoin and network.
- [ ] Deposit confirmation is driven by indexed chain events, not client-side optimistic trust.
- [ ] Room participation eligibility uses an escrow-funded state instead of `host-verified`.
- [ ] Pre-play refunds exist for aborted funding, expired joins, or room closure before live play.
- [ ] API and realtime updates expose enough state for the foyer UI to show funding pending, funded, refund pending, and refund complete states.
- [ ] Tests cover idempotent deposit confirmation, duplicate event delivery, and failed or expired room-entry attempts.

## Blocked by

- [01 - ADR and Escrow Foundation](01-adr-and-escrow-foundation.md)

## Relevant files

- `apps/api/src/lobby/`
- `apps/api/src/sessions/`
- `apps/web/lib/use-room-client.ts`
- `apps/web/components/aurum/screens/`
- `packages/contracts/src/`


## Comments

### 2026-05-02 - Engineer update
https://github.com/bilyuk/cryptopoker/pull/10

Implemented escrow-backed room entry on top of the CRY-125 foundation: wallet link/provision endpoint (`POST /players/current/wallet`), escrow funding intent fields on buy-ins, indexer-driven deposit/refund confirmation endpoints (`POST /escrow/events/deposits`, `POST /escrow/events/refunds`), pre-play expiry/refund transitions, and escrow-funded seating/waitlist gating (removed host approval as participation gate). Updated foyer/table UI copy and actions to escrow lifecycle states, and migrated integration tests to event-confirmed funding with duplicate-event idempotency and expired/refund entry coverage.

Validation run:
- `pnpm -w typecheck`
- `pnpm -w test`

QA re-wake payload requested in CRY-128:
- Branch/PR with executable implementation: `plan/cry-120-blockchain-room-escrow`, https://github.com/bilyuk/cryptopoker/pull/10
- Authoritative validation commands:
  - `pnpm -w typecheck`
  - `pnpm -w test`
  - API-focused regression: `pnpm --filter @cryptopoker/api test`
  - Browser room view mapping regression: `pnpm --filter @cryptopoker/web test`
- Local chain / seeded-wallet prerequisites:
  - No local chain required for this phase; escrow confirmations are modeled via indexed-event API endpoints.
  - Wallet prerequisite for deterministic room funding is linking/provisioning per player session via `POST /players/current/wallet` before `POST /buy-ins`.
