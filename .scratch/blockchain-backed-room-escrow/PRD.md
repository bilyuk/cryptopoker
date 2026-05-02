# PRD: Blockchain-Backed Room Escrow

Status: needs-triage

## Problem Statement

Cryptopoker version 1 is intentionally built around Host-Verified Buy-Ins, no in-app custody, and no wallet model. The request for blockchain-backed room escrow is therefore not a small payment enhancement. It changes the trust model from "the Room Host verifies outside-the-app payment" to "the product holds or controls onchain value flows tied to Room state and eventually Hand outcomes."

The current repo also stops before Live Hand play and settlement. That means there is no authoritative chip-ledger or payout engine yet, so a true escrow design cannot stop at funding. It must eventually cover funding, in-play balances, settlement, payout, reconciliation, and failure handling.

## Recommendation

- Treat this as a version 2 expansion, not a terminology cleanup.
- Explicitly reopen and supersede [ADR-0002](../../docs/adr/0002-host-verified-buy-ins.md), because the request directly contradicts the current no-custody decision.
- Sequence escrow after the authoritative poker engine owns Hand settlement, or the product will be able to lock funds without a trustworthy way to redistribute them.
- If product approves the pivot, prefer a TypeScript-friendly EVM L2 plus native USDC, with Base as the default starting point.

That Base recommendation is an inference from current official docs and the repo's existing TypeScript/Next/Nest stack:

- Base documents one-tap USDC payments and gas-sponsored Base Account flows.
- Circle documents native USDC support across Base and other networks.
- OpenZeppelin documents standard EVM payment and escrow primitives plus ERC-4337 account patterns.

## Current Gap

Today the codebase has none of the capabilities required for room escrow:

1. `CONTEXT.md` and [ADR-0002](../../docs/adr/0002-host-verified-buy-ins.md) define Buy-Ins as outside-the-app payment verified by the Room Host.
2. `apps/api/src/lobby/lobby.store.ts` models Buy-Ins as `pending`, `host-verified`, or `rejected` and auto-seats/waitlists Players after Host approval.
3. `packages/contracts/src/room.ts` has no escrow, wallet, payout, dispute, or settlement DTOs.
4. There is no wallet identity, signer linkage, or transaction authorization model.
5. There is no durable chip ledger for live play; the current lobby flow stops before Hand settlement.
6. There is no contract workspace, chain indexer, reconciliation worker, or payout pipeline.
7. There is no compliance, dispute, recovery, or key-management policy documented for app-controlled funds.

## Proposed Product Model

If approved, the domain should stop treating a Buy-In as a Host approval artifact and instead model the funding lifecycle explicitly:

- `funding-pending`: the Player has initiated a room funding intent but the transfer is not yet final.
- `escrow-funded`: onchain funds are confirmed and assigned to the Room escrow ledger.
- `in-play`: some or all funded value is locked against a seated Table Stack during active participation.
- `payout-pending`: the Player has left the Room or a payout is queued after settlement.
- `paid-out`: escrow has released value to the destination wallet.
- `refund-pending` / `refunded`: escrow could not start play and funds are being returned.

This should use new domain language in context and contracts rather than overloading `host-verified`.

## Target Architecture

### 1. Offchain authority remains the game source of truth

The authoritative API should still own seating, Hand progression, betting rules, and settlement. The chain should not become the poker game engine. Onchain contracts should escrow balances and execute payouts based on authenticated server decisions.

### 2. Room escrow ledger spans offchain state and onchain balances

Add a durable room ledger with:

- player funding intents
- confirmed escrow deposits
- in-play stack allocations
- Hand settlement deltas
- queued payouts and refunds
- reconciliation state per blockchain transaction

This ledger must be durable before real money moves.

### 3. Dedicated chain integration boundary

Add a separate onchain integration surface instead of mixing chain code into lobby services:

- `packages/escrow-contracts`: smart contracts, ABI artifacts, deployment config, invariant tests
- `apps/api/src/escrow/`: room escrow domain module, funding/payout orchestration, REST command handlers
- `apps/api/src/ledger/`: durable chip and liability ledger
- `apps/chain-indexer` or background worker module: deposit confirmation, payout confirmation, replay/reconciliation

### 4. Wallet model must be explicit

The current guest-session cookie can still represent app identity, but escrow requires wallet linkage:

- guest session owns the Cryptopoker Player identity
- Player links or provisions a wallet for funding and payouts
- API stores wallet linkage and consent/audit history
- payouts only release to an authorized destination

### 5. Contracts stay narrow

The first escrow contract should only do these jobs:

- accept supported stablecoin deposits into a Room escrow vault
- track per-Player available escrow balances
- allow server-authorized payout execution
- allow refunds before play starts or after abort conditions
- emit events for deposit, payout, refund, and room-close reconciliation

Avoid putting poker rules or seat logic onchain.

## Sequencing

### Phase 0: Product and ADR approval

- Approve the custody pivot and acceptable regulatory scope.
- Supersede ADR-0002 and update `CONTEXT.md` vocabulary.
- Freeze the supported network and stablecoin for v2.

### Phase 1: Escrow foundation

- Add escrow ADR and domain glossary updates.
- Add durable escrow ledger schema and contract package.
- Add wallet-linking primitives and room funding intents.

### Phase 2: Funding and room participation

- Accept Player escrow funding.
- Confirm deposits asynchronously from indexed chain events.
- Gate seating and waitlist eligibility on `escrow-funded`, not Host approval.
- Add refund flows for aborted or expired room participation before play.

### Phase 3: Hand settlement prerequisite

- Implement the authoritative poker engine with durable per-Hand chip settlement.
- Persist per-Player liability changes so escrow-backed balances can follow game outcomes.

Escrow should not ship to production before this phase is done.

### Phase 4: Payouts and closeout

- Queue payouts when Players leave or when the Room closes.
- Support server-authorized payouts, retries, and operator review.
- Add reconciliation dashboards and alerting for stuck transfers.

### Phase 5: QA hardening

- multi-Player funding and seating flows
- reconnect and wallet re-link recovery
- chain event replay and idempotency
- partial failure, duplicate callback, and delayed-finality handling
- refund and payout edge cases

## Key Risks

1. Product and regulatory scope risk. Escrow changes the business model from coordination software to money-moving software.
2. Settlement dependency risk. Without the poker engine, the product can collect money but cannot safely compute final ownership.
3. Reconciliation risk. Offchain room state and onchain balances can diverge without durable ledgering and replayable workers.
4. Wallet UX risk. Guest identity is intentionally low-friction today; wallet linkage adds drop-off and recovery complexity.
5. Operational risk. Payout retries, stuck transactions, and dispute handling need operator tooling before launch.
6. Security risk. Contract bugs, signer compromise, or replay mistakes can cause irreversible loss.

## QA Plan

- Contract unit and invariant tests for deposit, payout, refund, and authorization rules.
- API integration tests for wallet linkage, funding intent creation, deposit confirmation, seating eligibility, and payout requests.
- End-to-end browser tests with at least two Players covering funding, seating, room close, payout, and refund paths.
- Worker replay tests that rerun the same chain events without double-crediting or double-paying.
- Failure-injection tests for delayed confirmations, dropped websocket updates, payout retries, and duplicate webhook/indexer delivery.
- Manual finance ops runbook validation before any production rollout.

## Local Execution Issues

- [01 - ADR and Escrow Foundation](issues/01-adr-and-escrow-foundation.md)
- [02 - Wallet Funding and Escrow-Backed Room Entry](issues/02-wallet-funding-and-escrow-backed-room-entry.md)
- [03 - Escrow Settlement and Payout Reconciliation](issues/03-escrow-settlement-and-payout-reconciliation.md)
- [04 - QA Blockchain-Backed Room Escrow](issues/04-qa-blockchain-backed-room-escrow.md)

## Decision Summary

The request is both a v2 expansion and a direct contradiction of the current product decision record. It is worth pursuing only as a deliberate post-v1 track, with product approval, an ADR update, and poker settlement as a hard prerequisite for production escrow.
