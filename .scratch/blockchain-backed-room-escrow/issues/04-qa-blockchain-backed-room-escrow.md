# QA Blockchain-Backed Room Escrow

Status: ready-for-agent

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Validate escrow-backed room funding, settlement, payout, refund, and recovery behavior across API, worker, contract, and browser surfaces.

## Acceptance criteria

- [ ] QA has a written matrix for deposit, refund, payout, reconnect, duplicate-event, and stuck-transaction scenarios.
- [ ] Automated end-to-end coverage exists for at least two Players funding a Room, joining play, and exiting through payout or refund paths.
- [ ] Contract tests, API integration tests, worker replay tests, and browser flows are all included in the sign-off checklist.
- [ ] Manual finance-ops verification exists for payout retries, dispute handling, and reconciliation review.
- [ ] Release sign-off explicitly confirms that the escrow ledger and onchain balances reconcile for the tested scenarios.

## Blocked by

- [02 - Wallet Funding and Escrow-Backed Room Entry](02-wallet-funding-and-escrow-backed-room-entry.md)
- [03 - Escrow Settlement and Payout Reconciliation](03-escrow-settlement-and-payout-reconciliation.md)

## Relevant files

- `apps/api/test/`
- `apps/web/`
- `docs/agents/`
