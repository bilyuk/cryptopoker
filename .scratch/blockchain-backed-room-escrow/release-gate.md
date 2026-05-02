# Blockchain-Backed Room Release Gate

This runbook defines the release gate for moving blockchain-backed Rooms from Base Sepolia testing into Base mainnet closed alpha and, later, public launch.

## Stage model

- `testnet`
  - Base Sepolia only.
  - `closedAlphaEnabled=false`.
  - Public access remains disabled or explicitly held to the closed-alpha gate.
- `closed-alpha`
  - Invite-only cohort on Base mainnet.
  - `closedAlphaEnabled=true`.
  - `testnetStatus=stable`.
  - Jurisdiction allow-listing, age/legal-location attestation, and clear-wallet screening stay enforced.
- `public-launch`
  - `publicAccess=public-enabled`.
  - Requires `testnetStatus=stable`, `auditStatus=complete`, `legalReviewStatus=complete`, `monitoringStatus=ready`, `emergencyControlsStatus=ready`, `trustDisclosuresStatus=ready`, and `supportEvidenceStatus=ready`.

## Public-launch exclusions

The first blockchain-backed release remains blocked from expanding into:

- tournaments
- multi-table play
- fiat ramps
- token swaps
- referrals
- rake

## Rollback and pause

- If a release regression affects new funding, move the Room back to `public-disabled` or `closed-alpha` immediately.
- Global pause is only for blocking new Buy-Ins and Top-Ups.
- Pause must not block valid payouts, Escrow Refunds, or Emergency Exit.
- If public launch is rolled back, only retain closed-alpha access while screening and attestations remain intact.

## Settlement Frozen and Emergency Exit

- `Settlement Frozen` is the containment state when payout authority is revoked or unavailable.
- In `Settlement Frozen`, no new Hands start and normal Checkouts stop.
- The Room Host may delegate a new Room Settlement Key before the emergency delay expires.
- `Emergency Exit` remains the fallback for locked escrow after the configured delay and must stay operable even when pause is active.

## Monitoring and support evidence

- Monitoring must cover solvency drift, duplicate or missing replay, payout anomalies, pause usage, and settlement-key changes.
- Support evidence must let operators trace funding reference, lock, payout or refund transaction, signer or delegate identity, and gas-share receipts.
- Release readiness is not complete until rollback steps and evidence lookup have been rehearsed and recorded.
