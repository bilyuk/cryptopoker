# ADR and Escrow Foundation

Status: ready-for-agent

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Supersede the Host-Verified Buy-In decision with a new ADR and lay the technical foundation for escrow-backed Rooms without shipping live fund movement yet.

## Acceptance criteria

- [ ] A new ADR explicitly supersedes [ADR-0002](../../../docs/adr/0002-host-verified-buy-ins.md) and records the approved custody/network/stablecoin decision.
- [ ] `CONTEXT.md` is updated so Buy-In and Room vocabulary no longer depends on Host verification once escrow is enabled.
- [ ] Shared contracts add escrow-specific DTOs and state enums for funding, payout, refund, and reconciliation.
- [ ] The API has a dedicated escrow module boundary and a durable ledger schema proposal, even if later phases implement the endpoints.
- [ ] A contract workspace exists with deployment config, ABI generation, and automated test scaffolding.
- [ ] The plan names the signer, key-management, and event-indexing approach that later phases will use.

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
