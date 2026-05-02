# Settlement Frozen, Pause, and Emergency Exit

Status: ready-for-human
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Add the contract and product fail-safe path for broken settlement: global pause for new funding, **Settlement Frozen** Room state after settlement authority is revoked or unavailable, resume through new delegation, and **Emergency Exit** after the configured delay.

## Acceptance criteria

- [ ] Global pause blocks new Buy-Ins and Top-Ups but does not block payouts, Escrow Refunds, or Emergency Exit.
- [ ] Revoking settlement authority can put a Room into Settlement Frozen.
- [ ] Settlement Frozen blocks new Hands and normal Checkouts.
- [ ] A Host can register a new Room Settlement Key to resume normal settlement before Emergency Exit is available.
- [ ] After `EMERGENCY_EXIT_DELAY_DAYS=7`, a Player can self-call Emergency Exit to recover deposits minus amounts already paid and Gas Shares.
- [ ] Closed is terminal and requires zero escrowed USDC balance.
- [ ] Tests cover pause intersections, freeze/resume, emergency delay, exit math, closed Room behavior, and no new funding while frozen or closed.

## Blocked by

- [07 - Room Settlement Key Delegation](07-room-settlement-key-delegation.md)
- [08 - Host-Arbitrated Checkout and Receipts](08-host-arbitrated-checkout-receipts.md)

## Comments

### 2026-05-02 Engineer Update

https://github.com/bilyuk/cryptopoker/pull/11

Implemented settlement failsafe controls in the escrow API layer: global funding pause, Room settlement lifecycle (`active`, `settlement-frozen`, `closed`), freeze-on-delegation-revoke path, host-driven settlement resume via new delegation before emergency window, emergency-exit delay and payout math (`deposits - already paid - gas share`), hand-start and normal-checkout blocking in frozen/closed states, and terminal close requiring zero escrow liability. Added integration coverage for pause intersections, freeze/resume, emergency delay/exit, closed-room behavior, and zero-balance close enforcement.

Validation run:
- `pnpm --filter @cryptopoker/api test`
- `pnpm --filter @cryptopoker/api typecheck`

### 2026-05-02 Engineer QA Request

https://github.com/bilyuk/cryptopoker/pull/11

Requesting QA review for settlement failsafe coverage on this PR, focused on:
- freeze/resume timing and emergency-exit delay behavior
- pause intersections (funding blocked, refund/payout/emergency path open)
- closed-room zero-liability terminal rule
