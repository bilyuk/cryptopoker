# Funded Awaiting Seat and Waitlist Integration

Status: needs-info
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Integrate **Funded Awaiting Seat** Players into the existing Seat and Waitlist flow so late-confirmed or unseated escrowed Players are auto-seated when possible and otherwise wait fairly for a **Seat Offer**.

## Acceptance criteria

- [ ] A Funded Awaiting Seat Player is auto-seated when an open Seat has no pending Seat Offer.
- [ ] A Funded Awaiting Seat Player joins the Waitlist when the Room is full.
- [ ] Existing FIFO Waitlist and Seat Offer behavior applies to Escrowed Buy-Ins as well as Host-Verified Buy-Ins.
- [ ] A Seat Offer does not create Locked Escrow until accepted and lock-before-seat completes.
- [ ] The UI shows funded unseated Players their Waitlist position or Seat Offer state.
- [ ] Tests cover auto-seat, waitlist, Seat Offer acceptance, decline/expiry movement, and refund eligibility before seating.

## Blocked by

- [04 - Lock-Before-Seat Escrow Seating](04-lock-before-seat-escrow-seating.md)

## Comments

### 2026-05-02 — Heartbeat status sync
https://github.com/bilyuk/cryptopoker/pull/12

Checked PR/CI state after issue status change:
- PR `#12` is open against `main` with head branch `plan/cry-120-blockchain-room-escrow`.
- `gh pr checks 12` still reports `no checks reported` on that branch.

Unblock needed from repo maintainer/CI owner: attach and run required checks for PR `#12` so this issue can move to `in_review` under PR-driven DoD.
