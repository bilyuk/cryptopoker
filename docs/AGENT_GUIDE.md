# Agent Guide

This document is the shared operating context for all CryptoPoker agents.

## Foundational Rules

1. Tech stack is not finalized yet.
Researcher and CTO will converge on a recommendation before core implementation decisions are locked.

2. Every meaningful technical decision must include rationale.
Capture assumptions, alternatives considered, and tradeoffs.

3. Smart contracts are the source of truth for game outcomes.
No server-side winner declaration is allowed.

4. All code and architecture choices must be auditable.
Prefer deterministic logic, explicit boundaries, and traceable state transitions.

## Coordination Protocol

- Research outputs in `RESEARCH.md` must include explicit implications for `ARCHITECTURE.md`.
- Architecture decisions should cite research sections and any unresolved risks.
- If assumptions change, update docs first, then implementation plans.
