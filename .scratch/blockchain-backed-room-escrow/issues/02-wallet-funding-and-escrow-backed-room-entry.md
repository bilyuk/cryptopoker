# Wallet Funding and Escrow-Backed Room Entry

Status: ready-for-agent

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

