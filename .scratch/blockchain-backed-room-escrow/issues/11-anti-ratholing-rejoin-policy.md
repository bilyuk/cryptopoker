# Anti-Ratholing Rejoin Policy

Status: needs-triage
Type: AFK

## Parent

[PRD: Blockchain-Backed Room Escrow](../PRD.md)

## What to build

Enforce default-on, Host-configurable **Anti-Ratholing** when a checked-out Player tries to rejoin the same **Blockchain-Backed Room** with a smaller Buy-In inside the configured window.

## Acceptance criteria

- [ ] Blockchain-backed Room creation stores Anti-Ratholing enabled/disabled and window policy.
- [ ] A Player's most recent Checkout amount in the same Room determines the minimum rejoin Buy-In during the window.
- [ ] The Room's maximum total Buy-In policy overrides Anti-Ratholing when they conflict.
- [ ] Anti-Ratholing is enforced before seating and does not block Escrow Refund.
- [ ] Top-Ups are not affected by Anti-Ratholing.
- [ ] Rejected rejoin attempts return clear UI/API messages explaining required amount and expiry time.
- [ ] Tests cover default-on behavior, disabled behavior, window expiry, cap-wins conflict, refund path, and no Top-Up interaction.

## Blocked by

- [08 - Host-Arbitrated Checkout and Receipts](08-host-arbitrated-checkout-receipts.md)

### 2026-05-02 - Engineer Follow-up
https://github.com/bilyuk/cryptopoker/pull/11

Tried to split CRY-135 into a clean `main`-based branch, but `origin/main` is behind the current escrow/lobby stack (hard cherry-pick conflicts, including files deleted on `main` that this change must modify). Keeping this ticket on PR #11 to preserve a valid build/test base.

Blocking owner: repo maintainers to confirm whether `main` should be fast-forwarded to the current integration baseline, or whether CRY-135 should intentionally stay on this active feature stream.
