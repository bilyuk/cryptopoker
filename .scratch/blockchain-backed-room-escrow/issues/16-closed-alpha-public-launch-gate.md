# Closed Alpha and Public Launch Gate

Status: in_progress
Type: HITL

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Create the release gate for moving from Base Sepolia testnet to Base mainnet closed alpha and then to public launch, tying deployment controls to testnet stability, external audit, legal review, monitoring, and feature flags.

## Acceptance criteria

- [ ] Slice 1 can be marked stable only after multi-Player Base Sepolia sessions run for the agreed period without critical escrow bugs.
- [ ] Base mainnet settlement is invite-only and feature-flagged for closed alpha.
- [ ] Public launch remains blocked until external audit remediation and legal review are complete.
- [ ] Launch status reflects jurisdiction allow-listing, sanctions screening, age attestation, trust disclosures, monitoring, and emergency controls.
- [ ] Public launch excludes tournaments, multi-table play, fiat ramps, token swaps, referrals, and rake.
- [ ] Release documentation describes rollback, pause, Settlement Frozen, Emergency Exit, and support evidence procedures.

## Blocked by

- [01 - Blockchain-Backed Room Creation and Wallet Preflight](01-blockchain-backed-room-creation-wallet-preflight.md)
- [02 - Base Sepolia Escrow Funding Tracer](02-base-sepolia-escrow-funding-tracer.md)
- [03 - Funding Holds, Late Confirmations, and Escrow Refunds](03-funding-holds-late-confirmations-escrow-refunds.md)
- [04 - Lock-Before-Seat Escrow Seating](04-lock-before-seat-escrow-seating.md)
- [05 - Funded Awaiting Seat and Waitlist Integration](05-funded-awaiting-seat-waitlist-integration.md)
- [06 - Bound Wallet Enforcement](06-bound-wallet-enforcement.md)
- [07 - Room Settlement Key Delegation](07-room-settlement-key-delegation.md)
- [08 - Host-Arbitrated Checkout and Receipts](08-host-arbitrated-checkout-receipts.md)
- [09 - Gas Share Ledger and Exit Deduction](09-gas-share-ledger-exit-deduction.md)
- [10 - Top-Ups Between Hands](10-top-ups-between-hands.md)
- [11 - Anti-Ratholing Rejoin Policy](11-anti-ratholing-rejoin-policy.md)
- [12 - Settlement Frozen, Pause, and Emergency Exit](12-settlement-frozen-pause-emergency-exit.md)
- [13 - Solvency Replay and Monitoring](13-solvency-replay-monitoring.md)
- [14 - Smart Wallet Compatibility Hardening](14-smart-wallet-compatibility-hardening.md)
- [15 - Compliance Gates and No-Rake Launch Controls](15-compliance-gates-no-rake-launch-controls.md)

## Comments

- 2026-05-02 (agent): Blockers resolved. The launch-stage model is already present in the API/contracts layer, so this follow-up adds the explicit release runbook covering rollback, pause, Settlement Frozen, Emergency Exit, and support-evidence procedures required by the ticket acceptance criteria.
