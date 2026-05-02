# Base Sepolia Escrow Funding Tracer

Status: needs-triage
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Create the first Base Sepolia funding tracer: a shared immutable escrow contract shape, Permit2/native USDC test funding path, backend event listener with `ESCROW_CONFIRMATIONS=2`, and UI state that turns a confirmed on-chain funding event into an **Escrowed Buy-In** without seating yet.

## Acceptance criteria

- [ ] The escrow contract accepts only the configured native USDC test asset for a registered blockchain-backed Room.
- [ ] Funding uses a one-shot Permit2-style flow and emits indexed events for Room and Player.
- [ ] The backend records events only after `currentBlock - txBlock + 1 >= ESCROW_CONFIRMATIONS`, with the containing block counted as confirmation 1.
- [ ] The backend replays escrow events from the last processed block after restart.
- [ ] The UI shows funding pending, confirmed **Escrowed Buy-In**, and failed or reverted funding states.
- [ ] Contract and backend tests cover wrong Room, wrong amount, wrong token, confirmation threshold, event replay, and confirmed Escrowed Buy-In creation.

## Blocked by

- [01 - Blockchain-Backed Room Creation and Wallet Preflight](01-blockchain-backed-room-creation-wallet-preflight.md)
