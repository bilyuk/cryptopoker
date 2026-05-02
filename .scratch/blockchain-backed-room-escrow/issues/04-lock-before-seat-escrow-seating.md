# Lock-Before-Seat Escrow Seating

Status: needs-triage
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Convert an **Escrowed Buy-In** into **Locked Escrow** before seating the Player, then create the **Table Stack** only after the lock transaction confirms so no Player can be dealt into a **Hand** while an **Escrow Refund** remains possible.

## Acceptance criteria

- [ ] Seating a blockchain-backed Player first submits and confirms a lock for that Player's escrow.
- [ ] A Seat and Table Stack are assigned only after lock confirmation.
- [ ] A Player with unlocked escrow can still request Escrow Refund and cannot be dealt into a Hand.
- [ ] Sitting Out does not unlock Locked Escrow.
- [ ] An orphan lock can be unlocked by the Settler when seating fails before Seat assignment.
- [ ] Tests cover lock-before-seat ordering, refund rejection after lock, orphan unlock recovery, and existing Host-Verified Buy-In seating behavior.

## Blocked by

- [03 - Funding Holds, Late Confirmations, and Escrow Refunds](03-funding-holds-late-confirmations-escrow-refunds.md)
