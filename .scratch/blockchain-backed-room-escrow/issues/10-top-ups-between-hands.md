# Top-Ups Between Hands

Status: ready-for-human
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Let seated Players request **Top-Ups** with native USDC on Base, queue them during a **Live Hand**, lock confirmed funds before applying them, and increase **Table Stack** only at a hand boundary.

## Acceptance criteria

- [ ] A seated Player can request a Top-Up that respects the Room's maximum total Buy-In policy.
- [ ] A Top-Up requested during a Live Hand is visible as pending and applies only after that Hand settles.
- [ ] A seated Top-Up confirms and locks before increasing Table Stack.
- [ ] Top-Ups from unseated Players follow the normal Escrowed Buy-In and refund path.
- [ ] Multiple pending Top-Ups apply before the next Hand is dealt.
- [ ] Tests cover between-hand Top-Up, Live Hand queueing, max Buy-In rejection, seated auto-lock, unseated cancellability, and visible pending state.

## Blocked by

- [04 - Lock-Before-Seat Escrow Seating](04-lock-before-seat-escrow-seating.md)

## Comments

### 2026-05-02 - Engineer update (status normalization)
https://github.com/bilyuk/cryptopoker/pull/10

CTO cleanup pass after CRY-140/CRY-151 closure: no active launch blocker remains on this child ticket. Current status normalized to `ready-for-human` for closure/triage consistency, with implementation considered either merged in escrow slices already landed or superseded by merged slices on the parent rollout thread.
