# Base Sepolia Escrow Funding Tracer

Status: ready-for-human
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Create the first Base Sepolia funding tracer: a shared immutable escrow contract shape, Permit2/native USDC test funding path, backend event listener with `ESCROW_CONFIRMATIONS=2`, and UI state that turns a confirmed on-chain funding event into an **Escrowed Buy-In** without seating yet.

## Acceptance criteria

- [x] The escrow contract accepts only the configured native USDC test asset for a registered blockchain-backed Room.
- [x] Funding uses a one-shot Permit2-style flow and emits indexed events for Room and Player.
- [x] The backend records events only after `currentBlock - txBlock + 1 >= ESCROW_CONFIRMATIONS`, with the containing block counted as confirmation 1.
- [x] The backend replays escrow events from the last processed block after restart.
- [x] The UI shows funding pending, confirmed **Escrowed Buy-In**, and failed or reverted funding states.
- [x] Contract and backend tests cover wrong Room, wrong amount, wrong token, confirmation threshold, event replay, and confirmed Escrowed Buy-In creation.

## Blocked by

- [01 - Blockchain-Backed Room Creation and Wallet Preflight](01-blockchain-backed-room-creation-wallet-preflight.md)

## Comments

### 2026-05-02 - Engineer update
https://github.com/bilyuk/cryptopoker/pull/10

Implemented CRY-126 tracer-phase behavior on the shared branch: escrow deposit events now enforce confirmation depth (`currentBlock - txBlock + 1 >= 2`), under-confirmed deposit events are retained for replay processing, replay endpoint processes pending events once they cross threshold, and confirmed blockchain funding updates Buy-In state to `escrow-funded` without auto-seating in this phase. Added reverted/failure state handling (`funding-failed`) and updated foyer UI to surface pending, confirmed escrowed buy-in, and reverted funding states.

Validation run:
- `pnpm -w typecheck`
- `pnpm --filter @cryptopoker/api test`
- `pnpm --filter @cryptopoker/web test`

### 2026-05-02 - Engineer update (continuation)
https://github.com/bilyuk/cryptopoker/pull/10

Continuation shipped for CRY-126: added contract-side tracer tests for registered-room/native-USDC constraints plus one-shot Permit2-style intent consumption and indexed funding events (`roomId`, `playerId`), and finalized backend tracer threshold/replay coverage with confirmed escrowed buy-in state creation (without auto-seating). UI funding foyer states now include reverted/failure messaging (`funding-failed`) in addition to pending and confirmed.

Additional validation run:
- `pnpm --filter @cryptopoker/escrow-contracts test`
- `pnpm --filter @cryptopoker/api test`
- `pnpm --filter @cryptopoker/web test`
- `pnpm -w typecheck`

### 2026-05-02 - Engineer update (post-merge closure)
https://github.com/bilyuk/cryptopoker/pull/10

PR is merged to `main` and CRY-126 acceptance criteria are fully implemented and validated. No additional code changes required in this heartbeat; posting closure note to keep tracker continuity explicit.

Final validation references from merged branch:
- `pnpm --filter @cryptopoker/escrow-contracts test`
- `pnpm --filter @cryptopoker/api test`
- `pnpm --filter @cryptopoker/web test`
- `pnpm -w typecheck`
