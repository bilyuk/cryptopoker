# Blockchain-Backed Room Creation and Wallet Preflight

Status: in_review
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Let a Room Host create a **Blockchain-Backed Room** with Base/native USDC terms, maximum total **Buy-In** policy, default **Anti-Ratholing** policy, no-rake copy, and wallet preflight that tells Players whether their **Connected Wallet** is on the right chain with the right asset before funding.

## Acceptance criteria

- [x] A Room Host can choose blockchain-backed mode at Room creation without removing the existing Host-Verified Buy-In mode.
- [x] Blockchain-backed Room settings include native USDC on Base, maximum total Buy-In policy, and Anti-Ratholing default-on configuration.
- [x] The UI refuses wrong-chain and unsupported-token funding paths before a Player attempts to fund.
- [x] The UI uses **Connected Wallet**, **Bound Wallet**, **Blockchain-Backed Room**, and no-rake language from the glossary.
- [x] Existing Host-Verified Buy-In Room creation still works.
- [x] Tests cover blockchain-backed Room creation, validation of Room policies, wallet preflight states, and no regression to Host-Verified Buy-In Rooms.

## Blocked by

None - can start immediately

## Comments

### 2026-05-02 - Engineer update
https://github.com/bilyuk/cryptopoker/pull/10

Implemented CRY-125 wallet-preflight scope on the checked-out branch: added explicit Room mode (`host-verified` vs `blockchain-backed`) and blockchain policy settings (Base/native USDC, max total Buy-In, Anti-Ratholing default-on, no-rake), added `GET /rooms/:roomId/wallet-preflight` status surface, wired preflight into the web buy-in flow to block wrong-chain/unsupported-token paths before funding requests, and preserved host-verified creation compatibility.

Validation run:
- `pnpm -w typecheck`
- `pnpm -w test`

Key test coverage added/updated:
- API Room creation defaults + blockchain policy assertions
- Wallet preflight states: `wallet-required`, `wrong-chain`, `unsupported-token`, `ready`
- Host-verified room creation regression guard
