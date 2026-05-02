# Escrow Settlement and Payout Reconciliation

Status: ready-for-agent

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Settle escrow-backed balances from authoritative poker outcomes and release payouts or refunds with replay-safe reconciliation.

## Acceptance criteria

- [ ] The authoritative poker engine persists per-Hand settlement outcomes to a durable ledger before any payout is queued.
- [ ] The escrow ledger can represent starting balance, in-play allocation, settlement delta, and withdrawable balance per Player.
- [ ] The API can queue payouts and refunds without double-paying on retries or replay.
- [ ] Operator tooling exists for stuck, failed, or disputed payouts before production release.
- [ ] Room closeout can verify that offchain liabilities and onchain balances reconcile before the Room is finalized.
- [ ] Tests cover replay, idempotency, partial failure, and room-close reconciliation.

## Blocked by

- [01 - ADR and Escrow Foundation](01-adr-and-escrow-foundation.md)
- [02 - Wallet Funding and Escrow-Backed Room Entry](02-wallet-funding-and-escrow-backed-room-entry.md)

## Relevant files

- `apps/api/src/`
- `packages/contracts/src/`
- `docs/adr/`

