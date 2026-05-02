# Gas Share Ledger and Exit Deduction

Status: needs-triage
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Track backend-relayed Room transaction costs as **Gas Shares**, split them equally across Players with **Locked Escrow** at transaction time, and deduct accumulated Gas Shares only when each Player exits escrow.

## Acceptance criteria

- [ ] Backend-relayed transaction records include tx hash, gas used, effective gas price, ETH/USDC quote, locked player count, computed Room gas cost, and per-Player Gas Share.
- [ ] Gas Shares are calculated when each backend-relayed transaction is recorded.
- [ ] Gas Shares are split only among Players with Locked Escrow in that Room at transaction submission time.
- [ ] Gas Shares do not change Table Stack during play.
- [ ] Checkout, Escrow Refund, and Emergency Exit deduct accumulated Gas Shares, capped at the Player's available escrow exit amount.
- [ ] Receipts show Gas Shares as reimbursement, not rake.
- [ ] Tests cover equal split, join/leave timing, quote recording, exit deduction, cap at available funds, and no Table Stack mutation.

## Blocked by

- [08 - Host-Arbitrated Checkout and Receipts](08-host-arbitrated-checkout-receipts.md)
