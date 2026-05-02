# Smart Wallet Compatibility Hardening

Status: in_progress
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
- https://github.com/bilyuk/cryptopoker/pull/11
- 2026-05-02 (agent): Continuation heartbeat update for CRY-138. Smart-wallet compatibility hardening implementation and tests were completed and pushed in commit `9a53aea` on branch `feat/cry-139-compliance-no-rake`, with tracker update commit `582f5ef`. Validation run there: `pnpm --filter @cryptopoker/api test -- escrow-delegation.spec.ts escrow-checkout.spec.ts escrow-failsafe.spec.ts`, `pnpm --filter @cryptopoker/contracts build`, `pnpm --filter @cryptopoker/api typecheck`. This current worktree is a different branch baseline, so I did not reapply those commits here to avoid cross-issue regressions.
