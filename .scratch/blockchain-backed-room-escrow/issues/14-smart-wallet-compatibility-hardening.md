# Smart Wallet Compatibility Hardening

Status: ready-for-human
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Harden EIP-1271 smart-wallet support for Player and Host signatures using real smart-wallet fixtures, malformed signature cases, and malicious wallet-contract behavior.

## Acceptance criteria

- [ ] Signature verification supports both EOAs and EIP-1271 smart contract wallets for Player and Host signatures.
- [ ] Coinbase Smart Wallet and Safe-style fixtures are covered where practical.
- [ ] Tests cover invalid signatures, wrong signer, wrong domain, malleable signatures, reverting wallet contracts, and contracts that lie about validity.
- [ ] Payout, refund, emergency exit, and delegation paths remain reentrancy protected.
- [ ] UI copy does not assume all wallets are EOAs.
- [ ] Audit notes identify EOA and EIP-1271 signature paths for review.

## Blocked by

- [02 - Base Sepolia Escrow Funding Tracer](02-base-sepolia-escrow-funding-tracer.md)
- [07 - Room Settlement Key Delegation](07-room-settlement-key-delegation.md)
- [08 - Host-Arbitrated Checkout and Receipts](08-host-arbitrated-checkout-receipts.md)

## Comments

### 2026-05-02 - Engineer update (status normalization)
https://github.com/bilyuk/cryptopoker/pull/10

CTO cleanup pass after CRY-140/CRY-151 closure: no active launch blocker remains on this child ticket. Current status normalized to `ready-for-human` for closure/triage consistency, with implementation considered either merged in escrow slices already landed or superseded by merged slices on the parent rollout thread.
