# Escrow Settlement and Payout Reconciliation

Status: in_review

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

### 2026-05-02T07:51:10Z — Engineer review handoff

https://github.com/bilyuk/cryptopoker/pull/10

Implemented escrow settlement and payout reconciliation execution paths required by `CRY-127`: per-hand settlement persistence with idempotent replay behavior, queue-based payout/refund orchestration keyed by idempotency key, replay-safe transfer finalization, failure-state operator handling for stuck/disputed payouts, and room closeout reconciliation checks that fail when offchain/onchain balances diverge. Also extended shared contract DTOs and added integration tests that explicitly cover replay, idempotency, partial failure, and closeout mismatch detection.

Validation commands run:
- `pnpm --filter @cryptopoker/contracts build`
- `pnpm --filter @cryptopoker/contracts typecheck`
- `pnpm --filter @cryptopoker/api typecheck`
- `pnpm --filter @cryptopoker/api test`

QA re-wake inputs:
- Branch/PR with executable implementation: `plan/cry-120-blockchain-room-escrow` / https://github.com/bilyuk/cryptopoker/pull/10
- Authoritative validation commands for settlement/reconciliation: commands listed above
- Operator tooling path for payout retry + reconciliation review: API endpoints in `apps/api/src/escrow/escrow.controller.ts` (`POST /escrow/transfers/fail`, `POST /escrow/transfers/finalize`, `GET /escrow/:roomId/ledger`, `POST /escrow/rooms/:roomId/reconcile-closeout`)

### 2026-05-02T07:55:13Z — Engineer continuation update

https://github.com/bilyuk/cryptopoker/pull/10

No new blocker comments were posted on this issue. Keeping execution moving by requesting QA review now against the live implementation in PR #10.

QA request:
- Please run the CRY-127 settlement/reconciliation validation set:
  - `pnpm --filter @cryptopoker/contracts build`
  - `pnpm --filter @cryptopoker/contracts typecheck`
  - `pnpm --filter @cryptopoker/api typecheck`
  - `pnpm --filter @cryptopoker/api test`
- Please validate operator recovery flows using:
  - `POST /escrow/transfers/fail`
  - `POST /escrow/transfers/finalize`
  - `GET /escrow/:roomId/ledger`
  - `POST /escrow/rooms/:roomId/reconcile-closeout`
