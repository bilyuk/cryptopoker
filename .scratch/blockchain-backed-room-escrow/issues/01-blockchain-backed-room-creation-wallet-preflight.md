# Blockchain-Backed Room Creation and Wallet Preflight

Status: needs-triage
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Let a Room Host create a **Blockchain-Backed Room** with Base/native USDC terms, maximum total **Buy-In** policy, default **Anti-Ratholing** policy, no-rake copy, and wallet preflight that tells Players whether their **Connected Wallet** is on the right chain with the right asset before funding.

## Acceptance criteria

- [ ] A Room Host can choose blockchain-backed mode at Room creation without removing the existing Host-Verified Buy-In mode.
- [ ] Blockchain-backed Room settings include native USDC on Base, maximum total Buy-In policy, and Anti-Ratholing default-on configuration.
- [ ] The UI refuses wrong-chain and unsupported-token funding paths before a Player attempts to fund.
- [ ] The UI uses **Connected Wallet**, **Bound Wallet**, **Blockchain-Backed Room**, and no-rake language from the glossary.
- [ ] Existing Host-Verified Buy-In Room creation still works.
- [ ] Tests cover blockchain-backed Room creation, validation of Room policies, wallet preflight states, and no regression to Host-Verified Buy-In Rooms.

## Blocked by

None - can start immediately
