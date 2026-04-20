# PR-Only Single-Repository Policy

This project uses one canonical implementation repository and a pull-request-only delivery workflow.

## Canonical Repository

- Canonical repository URL: `https://github.com/bilyuk/cryptopoker`
- Canonical git remote: `git@github.com:bilyuk/cryptopoker.git`
- Default branch: `main`

All production code, infrastructure code, and operational workflow updates for CryptoPoker must land in this repository.

## Mandatory Delivery Workflow

1. Create a feature branch from `main`.
2. Push commits to that branch only.
3. Open a pull request targeting `main`.
4. Pass required CI checks.
5. Obtain required approvals.
6. Merge via PR only.

Direct pushes to `main` are not allowed.

## Enforcement Controls

Repository branch protection for `main` must enforce:

1. Pull request required before merge.
2. At least one approving review.
3. Required status checks (`Lint, Typecheck, Test`).
4. Up-to-date branch before merge.
5. Conversation resolution before merge.
6. No force-push and no branch deletion.

Apply enforcement from repo root:

```bash
pnpm ops:enforce-main-protection
```

Verify enforcement:

```bash
gh api repos/bilyuk/cryptopoker/branches/main/protection
```

## Historical Traceability Note

The `npm run dev` startup fix (port fallback + startup behavior) exists in commit:

- `f6386190a767a292c01ff6d1494fdd0e1e18bfea`

That change was historically delivered directly to `main`. This policy formalizes PR-only controls to prevent recurrence.
