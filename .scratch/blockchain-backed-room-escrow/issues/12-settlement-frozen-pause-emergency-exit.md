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

### 2026-05-02 - Engineer update (status normalization)
https://github.com/bilyuk/cryptopoker/pull/10

CTO cleanup pass after CRY-140/CRY-151 closure: no active launch blocker remains on this child ticket. Current status normalized to `ready-for-human` for closure/triage consistency, with implementation considered either merged in escrow slices already landed or superseded by merged slices on the parent rollout thread.
