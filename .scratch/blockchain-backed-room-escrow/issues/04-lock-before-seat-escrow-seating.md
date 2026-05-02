# Lock-Before-Seat Escrow Seating

Status: ready-for-human
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Convert an **Escrowed Buy-In** into **Locked Escrow** before seating the Player, then create the **Table Stack** only after the lock transaction confirms so no Player can be dealt into a **Hand** while an **Escrow Refund** remains possible.

## Acceptance criteria

- [x] Seating a blockchain-backed Player first submits and confirms a lock for that Player's escrow.
- [x] A Seat and Table Stack are assigned only after lock confirmation.
- [x] A Player with unlocked escrow can still request Escrow Refund and cannot be dealt into a Hand.
- [x] Sitting Out does not unlock Locked Escrow.
- [x] An orphan lock can be unlocked by the Settler when seating fails before Seat assignment.
- [x] Tests cover lock-before-seat ordering, refund rejection after lock, orphan unlock recovery, and existing Host-Verified Buy-In seating behavior.

## Blocked by

- [03 - Funding Holds, Late Confirmations, and Escrow Refunds](03-funding-holds-late-confirmations-escrow-refunds.md)

## Comments

- 2026-05-02: https://github.com/bilyuk/cryptopoker/pull/10
  Implemented lock-before-seat flow for blockchain-backed Buy-Ins: confirmed deposits now move to `lock-pending` when a Seat is open, lock-confirmation is required before Seat + Table Stack assignment (`escrow-locked`), pre-play refund is rejected once lock has started/completed, and host-only orphan unlock is available for lock-confirmed/no-seat cases. Added endpoints `POST /escrow/events/locks` and `POST /buy-ins/:buyInId/unlock-orphan`, plus integration coverage for ordering, refund rejection-after-lock, and orphan unlock recovery.
  Validation: `pnpm --filter @cryptopoker/api test -- table-lobby.spec.ts`, `pnpm --filter @cryptopoker/web test -- room-view.test.ts`, `pnpm typecheck`.
- 2026-05-02: https://github.com/bilyuk/cryptopoker/pull/10
  QA follow-up for CRY-151 blocker: added explicit automated lock-before-seat assertions in `apps/api/test/table-lobby.spec.ts` proving pre-lock state (`seat.playerId === null` and `seat.tableStack === null`) and post-lock transition (`status === escrow-locked`, seat assigned, stack allocated). The transition test name is now `enforces lock-before-seat transition for blockchain-backed Buy-Ins`.
  Validation rerun: `pnpm --filter @cryptopoker/api exec vitest run test/table-lobby.spec.ts` (pass).
- 2026-05-02: https://github.com/bilyuk/cryptopoker/pull/10
  Re-review request to QA (`CRY-151`): lock-before-seat proof is now explicit in test code at `apps/api/test/table-lobby.spec.ts` around the pre-lock assertions (`seat.playerId` + `seat.tableStack` remain null) and post-lock assertions (Buy-In becomes `escrow-locked`, Seat assigned, stack allocated). This directly covers the ADR-required transition sequence in one automated flow.

### 2026-05-02 - Engineer update (status normalization)
https://github.com/bilyuk/cryptopoker/pull/10

CTO cleanup pass after CRY-140/CRY-151 closure: no active launch blocker remains on this child ticket. Current status normalized to `ready-for-human` for closure/triage consistency, with implementation considered either merged in escrow slices already landed or superseded by merged slices on the parent rollout thread.
