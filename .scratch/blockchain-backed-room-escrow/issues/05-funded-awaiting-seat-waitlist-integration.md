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

### 2026-05-02 — Engineer update
https://github.com/bilyuk/cryptopoker/pull/11

Implemented funded-awaiting-seat integration in API and foyer routing: escrow-funded players now auto-join waitlist when room is full, seat-offer acceptance in blockchain-backed rooms transitions to `lock-pending` (no pre-accept lock), and seating occurs only after lock confirmation. Added integration test coverage for auto-waitlist and offer-accept->lock->seat flow; updated UI routing so funded unseated players see waitlist/seat-offer state and lock-pending status copy.

Validation run:
- `pnpm -C apps/api test -- table-lobby.spec.ts`
- `pnpm -C apps/web test -- room-view.test.ts`
- `pnpm -C apps/web test -- unverified-foyer`

### 2026-05-02 — Continuation blocker update
https://github.com/bilyuk/cryptopoker/pull/11

Re-checked PR status this heartbeat: `gh pr checks 11` still reports no CI checks on branch `feat/cry-139-compliance-no-rake`.
Requesting unblock from repo maintainer/CI owner: please attach and run required checks for this PR branch so the ticket can be advanced to `in_review` per PR-driven DoD.

### 2026-05-02 — Active branch PR update
https://github.com/bilyuk/cryptopoker/pull/12

Opened PR from the current claimed worktree branch `plan/cry-120-blockchain-room-escrow` to keep CRY-129 in PR-driven flow for this checkout context.
Current blocker remains CI visibility: `gh pr checks 12` reports no checks on this branch, so the issue cannot advance to `in_review` until repository CI is attached/running.

### 2026-05-02 — PR unblock comment posted
https://github.com/bilyuk/cryptopoker/pull/12#issuecomment-4364183198

Posted explicit unblock request on PR `#12` asking repo maintainer/CI owner to attach and run required checks. Waiting on external CI ownership before proceeding to `in_review`.
