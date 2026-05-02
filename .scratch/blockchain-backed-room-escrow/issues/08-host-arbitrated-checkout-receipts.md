# Host-Arbitrated Checkout and Receipts

Status: in_progress
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Add **Checkout** for blockchain-backed Players: request checkout in the app, wait for the current **Live Hand** to settle if needed, authorize payout through the **Room Settlement Key**, relay payout to the **Bound Wallet**, and show an auditable receipt.

## Acceptance criteria

- [ ] A Player can request Checkout from a Blockchain-Backed Room.
- [ ] Checkout requested during a Live Hand waits until the Hand settles and removes the Player from future Hands.
- [ ] Payout authorization includes exact Room, Player wallet, amount, and nonce.
- [ ] The contract rejects replayed, wrong-Room, wrong-wallet, or unauthorized payout signatures.
- [ ] Payouts go only to the Player's Bound Wallet.
- [ ] The UI shows payout amount, authorizing Host or Room Settlement Key, transaction hash, and trust-model copy.
- [ ] Tests cover normal Checkout, Live Hand deferral, payout authorization, nonce replay protection, Bound Wallet payout, and receipt content.

## Blocked by

- [06 - Bound Wallet Enforcement](06-bound-wallet-enforcement.md)
- [07 - Room Settlement Key Delegation](07-room-settlement-key-delegation.md)

## Comments

- https://github.com/bilyuk/cryptopoker/pull/11
  2026-05-02 (agent): Implemented host-arbitrated checkout request/finalize APIs with live-hand deferral (`deferred` -> `queued`), per-room nonce replay protection, bound-wallet payout enforcement, and receipt payload including payout amount, signer role, tx hash, nonce, and trust-model disclosure copy. Added integration tests in `apps/api/test/escrow-checkout.spec.ts`; validation run passed: `pnpm --filter @cryptopoker/api test -- escrow-checkout.spec.ts escrow-delegation.spec.ts escrow-settlement.spec.ts`.
- https://github.com/bilyuk/cryptopoker/pull/11
  2026-05-02 (agent): Continuation update. PR body includes required Paperclip issue URL (`http://100.109.115.109:3100/CRY/issues/CRY-132`). Blocker to move to `in_review`: `gh pr checks 11` reports no checks configured for the branch, so CI-green gate cannot be verified from this environment. Requested owner action: maintainer confirmation on CI policy for this PR.
