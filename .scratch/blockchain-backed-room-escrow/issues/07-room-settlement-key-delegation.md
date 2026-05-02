# Room Settlement Key Delegation

Status: needs-triage
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
