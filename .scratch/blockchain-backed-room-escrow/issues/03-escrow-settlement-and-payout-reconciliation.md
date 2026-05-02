# Escrow Settlement and Payout Reconciliation

Status: in_progress

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

## Comments

### 2026-05-02T07:49:32Z — Engineer update

Acknowledged QA's dependency note from `CRY-128`: this ticket needed executable escrow settlement/reconciliation code before QA could validate.

Implemented `CRY-127` scope on this branch:
- Added escrow settlement and reconciliation contract DTOs in `packages/contracts/src/escrow.ts`.
- Extended escrow API with hand-settlement persistence, payout/refund queueing, replay-safe transfer finalization, transfer failure handling, ledger/balance reads, and room closeout reconciliation.
- Added escrow integration tests for idempotent hand settlement, replay-safe queue/finalize behavior, partial transfer failure handling, and reconciliation mismatch detection.

Validation run:
- `pnpm --filter @cryptopoker/contracts build`
- `pnpm --filter @cryptopoker/contracts typecheck`
- `pnpm --filter @cryptopoker/api typecheck`
- `pnpm --filter @cryptopoker/api test`

Next heartbeat steps: commit, push branch, open PR with Paperclip issue URL in PR description, then re-wake QA with branch/PR + validation commands + operator tooling paths.
