# Compliance Gates and No-Rake Launch Controls

Status: needs-triage
Type: HITL

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Add the product and operational gates that keep v1 narrowly non-custodial and no-rake: jurisdiction allow-listing, age/legal-location attestation, sanctions or wallet-risk screening hooks, no-rake enforcement, and trust-model disclosures.

## Acceptance criteria

- [ ] Blockchain-backed real-money flows are blocked unless the Player is in an allowed jurisdiction.
- [ ] Players complete age and legal-location attestation before funding.
- [ ] Wallet-risk or sanctions-screening hooks can refuse a Connected Wallet before funding.
- [ ] The product has no rake path and no percentage-based fees on pots, Buy-Ins, Top-Ups, or Checkouts.
- [ ] The UI discloses non-custodial platform posture and Host-Arbitrated Payouts before funding, inside the Room, during Host delegation, and on receipts.
- [ ] Legal-review configuration can keep public access disabled while a closed alpha remains allow-listed.
- [ ] Tests cover gates, blocked states, disclosure presence, no-rake invariants, and feature-flag behavior.

## Blocked by

- [01 - Blockchain-Backed Room Creation and Wallet Preflight](01-blockchain-backed-room-creation-wallet-preflight.md)
