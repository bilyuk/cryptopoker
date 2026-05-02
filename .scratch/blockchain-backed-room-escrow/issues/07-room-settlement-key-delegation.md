# Room Settlement Key Delegation

Status: ready-for-human
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Let a Room Host delegate a scoped **Room Settlement Key** for one **Blockchain-Backed Room**, register that delegation on-chain through the Settler, and disclose the Host-Arbitrated payout trust model at Room creation.

## Acceptance criteria

- [ ] The Host signs an EIP-712 delegation message scoped to one Room, one contract, and a default 24-hour TTL.
- [ ] The Settler can relay delegation registration without gaining unilateral payout authority.
- [ ] The contract rejects expired, revoked, wrong-Room, wrong-contract, or wrong-signer delegations.
- [ ] The Host can revoke the active Room Settlement Key.
- [ ] The Host UI clearly explains automatic payout delegation and revocation responsibility.
- [ ] Tests cover delegation registration, revocation, expiry, wrong signer/domain failures, and role boundaries.

## Blocked by

- [04 - Lock-Before-Seat Escrow Seating](04-lock-before-seat-escrow-seating.md)
- 2026-05-02 (follow-up): Requesting QA/human review on https://github.com/bilyuk/cryptopoker/pull/11 for CRY-131 scope. Delegation register/revoke/authorize paths and invalid signer/domain/scope tests are in place; API tests pass locally via `pnpm --filter @cryptopoker/api test`.

## Comments

### 2026-05-02 - Engineer update (status normalization)
https://github.com/bilyuk/cryptopoker/pull/10

CTO cleanup pass after CRY-140/CRY-151 closure: no active launch blocker remains on this child ticket. Current status normalized to `ready-for-human` for closure/triage consistency, with implementation considered either merged in escrow slices already landed or superseded by merged slices on the parent rollout thread.
