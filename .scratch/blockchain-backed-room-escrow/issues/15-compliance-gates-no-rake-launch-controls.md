# Compliance Gates and No-Rake Launch Controls

Status: ready-for-human
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

Status: ready-for-human

## Comments
- 2026-05-02 (agent): Picked up implementation. Existing code already enforces Base/USDC wallet preflight and defaults `noRake=true`, but CRY-139 gaps remain: jurisdiction allow-list gate, age/legal-location attestation gate, sanctions/wallet-risk hook, legal-review launch flag, and explicit trust-model disclosures with test coverage. Implementing these now across contracts, API, and UI.
- 2026-05-02 (agent): Implementation and validation are complete for CRY-139 scope in this working tree (API compliance gates + no-rake enforcement + disclosure text + tests). Blocked before PR creation because the repo currently includes unexpected pre-existing modifications in additional tracked files (`apps/api/src/lobby/buy-ins.controller.ts`, `apps/api/src/lobby/table-seating.ts`, `apps/web/lib/room-view.ts`, `apps/web/lib/room-view.test.ts`, and others). Need owner direction on whether to include them in this PR, split them, or reset to a clean baseline.

### 2026-05-02 - Engineer update (status normalization)
https://github.com/bilyuk/cryptopoker/pull/10

CTO cleanup pass after CRY-140/CRY-151 closure: no active launch blocker remains on this child ticket. Current status normalized to `ready-for-human` for closure/triage consistency, with implementation considered either merged in escrow slices already landed or superseded by merged slices on the parent rollout thread.
