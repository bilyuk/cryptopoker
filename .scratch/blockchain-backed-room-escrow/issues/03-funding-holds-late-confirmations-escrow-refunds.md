# Funding Holds, Late Confirmations, and Escrow Refunds

Status: needs-triage
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Add server-authoritative **Funding Holds** with persisted 45-second expiry, late-confirmation handling, **Funded Awaiting Seat** state, and **Escrow Refund** for funded but unseated Players.

## Acceptance criteria

- [ ] A funding attempt creates a persisted Funding Hold for a specific Seat with `ESCROW_FUNDING_HOLD_SECONDS=45`.
- [ ] Hold expiry is decided by server state, not client countdowns or in-memory timers.
- [ ] A late-confirmed funding event remains valid and moves the Player to **Funded Awaiting Seat** instead of discarding funds.
- [ ] A funded unseated Player can request **Escrow Refund** to their funding wallet.
- [ ] The UI distinguishes Funding Hold, funding pending, Funded Awaiting Seat, and Escrow Refund states.
- [ ] Tests cover hold persistence, expiry after restart, late confirmation, refund eligibility, and refund-to-wallet behavior.

## Blocked by

- [02 - Base Sepolia Escrow Funding Tracer](02-base-sepolia-escrow-funding-tracer.md)
