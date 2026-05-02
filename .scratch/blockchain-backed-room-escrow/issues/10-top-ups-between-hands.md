# Top-Ups Between Hands

Status: in_review
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Let seated Players request **Top-Ups** with native USDC on Base, queue them during a **Live Hand**, lock confirmed funds before applying them, and increase **Table Stack** only at a hand boundary.

## Acceptance criteria

- [x] A seated Player can request a Top-Up that respects the Room's maximum total Buy-In policy.
- [x] A Top-Up requested during a Live Hand is visible as pending and applies only after that Hand settles.
- [x] A seated Top-Up confirms and locks before increasing Table Stack.
- [x] Top-Ups from unseated Players follow the normal Escrowed Buy-In and refund path.
- [x] Multiple pending Top-Ups apply before the next Hand is dealt.
- [x] Tests cover between-hand Top-Up, Live Hand queueing, max Buy-In rejection, seated auto-lock, unseated cancellability, and visible pending state.

## Blocked by

- [04 - Lock-Before-Seat Escrow Seating](04-lock-before-seat-escrow-seating.md)

## Comments

### 2026-05-02 (agent)
https://github.com/bilyuk/cryptopoker/pull/11

Implemented Top-Ups between hands in the API by enforcing `maxTotalBuyIn` per player in blockchain-backed rooms, keeping seated confirmed Top-Ups pending as `escrow-funded` until a hand-settlement boundary, and applying all pending seated Top-Ups in batch during `/escrow/settlements/hands`. Unseated escrow-funded Buy-Ins remain on the existing refund path.

Validation run:
- `pnpm --filter @cryptopoker/api test -- test/table-lobby.spec.ts test/escrow-settlement.spec.ts`

### 2026-05-02 (agent follow-up)
https://github.com/bilyuk/cryptopoker/pull/11

Follow-up status: implementation + targeted validation are complete and pushed. Requesting QA/reviewer pass on PR #11 for the `CRY-134` Top-Ups behavior (pending state during live play, settlement-boundary application, and max-total enforcement).

### 2026-05-02 (agent rebase follow-up)
https://github.com/bilyuk/cryptopoker/pull/13

Re-applied the `CRY-134` Top-Ups implementation on the currently checked-out branch and pushed commit `facb107`. Requesting QA/reviewer pass on PR #13 for the same acceptance scope.

Validation run:
- `pnpm --filter @cryptopoker/api test -- test/table-lobby.spec.ts test/escrow-settlement.spec.ts`
