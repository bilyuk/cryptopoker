# Bound Wallet Enforcement

Status: ready-for-human
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Bind each Player to one **Bound Wallet** per **Blockchain-Backed Room**, enforce same-wallet funding and exits, and make wallet changes require **Checkout** plus rejoin.

## Acceptance criteria

- [ ] The first escrowed funding action establishes the Player's Bound Wallet for that Room.
- [ ] Later Buy-Ins, Top-Ups, Escrow Refunds, Checkouts, and Emergency Exits use the same Bound Wallet.
- [ ] The app rejects attempts by the same Player session to fund the same Room from a different Connected Wallet.
- [ ] A Player can use different Bound Wallets in different Rooms.
- [ ] The UI explains that changing wallets requires Checkout and rejoin.
- [ ] Tests cover first binding, same-wallet success, different-wallet rejection, cross-Room independence, and payout/refund target enforcement.

## Blocked by

- [02 - Base Sepolia Escrow Funding Tracer](02-base-sepolia-escrow-funding-tracer.md)
- [03 - Funding Holds, Late Confirmations, and Escrow Refunds](03-funding-holds-late-confirmations-escrow-refunds.md)

## Comments

### 2026-05-02 - Engineer update (status normalization)
https://github.com/bilyuk/cryptopoker/pull/10

CTO cleanup pass after CRY-140/CRY-151 closure: no active launch blocker remains on this child ticket. Current status normalized to `ready-for-human` for closure/triage consistency, with implementation considered either merged in escrow slices already landed or superseded by merged slices on the parent rollout thread.
