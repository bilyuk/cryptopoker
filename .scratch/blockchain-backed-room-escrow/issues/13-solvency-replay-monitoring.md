# Solvency Replay and Monitoring

Status: ready-for-human
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Build the operational monitoring path for escrow correctness: event replay, **Room Solvency** accounting, role-action audit logs, gas-share receipt inputs, and alerts for drift or anomalous payout behavior.

## Acceptance criteria

- [ ] The backend replays escrow events from the last processed block and reconciles Room state after restart.
- [ ] A monitor computes Room Solvency from deposits, refunds, locks, payouts, emergency exits, and Gas Shares.
- [ ] Any solvency drift or cross-Room accounting mismatch produces an alertable failure.
- [ ] Privileged actions are recorded with actor, Room, transaction hash, and event details.
- [ ] Delegate activity and payout patterns have basic anomaly checks.
- [ ] Tests or smoke checks cover replay, missed events, duplicate events, solvency drift, role-action audit records, and alert inputs.

## Blocked by

- [02 - Base Sepolia Escrow Funding Tracer](02-base-sepolia-escrow-funding-tracer.md)
- [08 - Host-Arbitrated Checkout and Receipts](08-host-arbitrated-checkout-receipts.md)
- [12 - Settlement Frozen, Pause, and Emergency Exit](12-settlement-frozen-pause-emergency-exit.md)

## Comments

### 2026-05-02 - Engineer update (status normalization)
https://github.com/bilyuk/cryptopoker/pull/10

CTO cleanup pass after CRY-140/CRY-151 closure: no active launch blocker remains on this child ticket. Current status normalized to `ready-for-human` for closure/triage consistency, with implementation considered either merged in escrow slices already landed or superseded by merged slices on the parent rollout thread.
