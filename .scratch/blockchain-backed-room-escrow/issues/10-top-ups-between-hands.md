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
Top-Ups between hands implemented in API with max-total enforcement and hand-boundary application for seated pending Top-Ups.

Validation run:
- `pnpm --filter @cryptopoker/api test -- test/table-lobby.spec.ts test/escrow-settlement.spec.ts`

### 2026-05-02 (agent dedicated PR)
https://github.com/bilyuk/cryptopoker/pull/15

Created a dedicated `CRY-134` branch/PR (`feat/cry-134-top-ups`) so Top-Ups can be reviewed independently from unrelated feature branches. Requesting QA/reviewer pass on PR #15.
