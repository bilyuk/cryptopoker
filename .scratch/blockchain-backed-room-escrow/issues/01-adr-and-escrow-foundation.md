# ADR and Escrow Foundation

Status: in_review

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Supersede the Host-Verified Buy-In decision with a new ADR and lay the technical foundation for escrow-backed Rooms without shipping live fund movement yet.

## Acceptance criteria

- [x] A new ADR explicitly supersedes [ADR-0002](../../../docs/adr/0002-host-verified-buy-ins.md) and records the approved custody/network/stablecoin decision.
- [x] `CONTEXT.md` is updated so Buy-In and Room vocabulary no longer depends on Host verification once escrow is enabled.
- [x] Shared contracts add escrow-specific DTOs and state enums for funding, payout, refund, and reconciliation.
- [x] The API has a dedicated escrow module boundary and a durable ledger schema proposal, even if later phases implement the endpoints.
- [x] A contract workspace exists with deployment config, ABI generation, and automated test scaffolding.
- [x] The plan names the signer, key-management, and event-indexing approach that later phases will use.

## Relevant files

- `CONTEXT.md`
- `docs/adr/0002-host-verified-buy-ins.md`
- `packages/contracts/src/`
- `apps/api/src/`


## Comments

### 2026-05-02 - Engineer update
https://github.com/bilyuk/cryptopoker/pull/10

Implemented CRY-125 escrow foundation: added ADR-0013 superseding ADR-0002 with Base + native USDC custody decision and signer/key/indexer plan; updated CONTEXT vocabulary for escrow-enabled Rooms; added escrow funding/payout/refund/reconciliation DTOs and lifecycle states in shared contracts; introduced API escrow module boundary with a foundation endpoint and durable ledger schema proposal entity; and scaffolded `@cryptopoker/escrow-contracts` with deployment config, ABI generation, and test scaffolding.

Validation run:
- `pnpm -w typecheck`
- `pnpm -w test`

CI status: no required checks reported on this branch at PR creation time.

### 2026-05-02 - Engineer update (post-resync)
https://github.com/bilyuk/cryptopoker/pull/10

Acknowledged CRY-141 resync guidance and treated `.scratch/blockchain-backed-room-escrow/issues/01-adr-and-escrow-foundation.md` as the source-of-truth brief. Verified this branch already contains the requested foundation scope (ADR supersession, CONTEXT escrow vocabulary updates, shared escrow DTO/state additions, API escrow module boundary + ledger schema proposal, and contract workspace scaffolding). Acceptance checklist is now marked complete in this issue file.

Current validation state (latest run on this branch):
- `pnpm -w typecheck`
- `pnpm -w test`

PR remains open for review; no required CI checks are currently reported for this branch.

### 2026-05-02 - Engineer update (continuation)
https://github.com/bilyuk/cryptopoker/pull/10

Continuation heartbeat completed. Normalized PR metadata to match CRY-125 foundation scope and reconfirmed issue status remains `in_review` with all acceptance criteria checked in the local tracker. This ticket is now waiting on reviewer approval.

Validation reference:
- `pnpm -w typecheck`
- `pnpm -w test`

CI/checks reference:
- `gh pr checks 10` currently reports no required checks on this branch.
