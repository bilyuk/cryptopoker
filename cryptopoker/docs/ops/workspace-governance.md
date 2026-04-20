# Workspace Governance

This document defines baseline ownership and merge controls for the implementation workspace.

## Workspace Scope

Active implementation workspace:

- Project: `Onboarding` (Paperclip project id `4cb48a26-96f2-4022-b0b2-1acf82dc78f5`)
- Issue execution owner: [CRY-21](/CRY/issues/CRY-21)
- Root layout: `contracts/`, `server/`, `ui/`, `infra/`, `docs/`

## Ownership Model

Repository ownership is codified in `.github/CODEOWNERS`.

- `contracts/`: CTO + Researcher
- `server/`: CTO
- `ui/`: CTO
- `infra/`: CTO
- `docs/`: CTO + Researcher

## Baseline CI Policy

GitHub Actions workflow: `.github/workflows/ci.yml`

Required checks for pull requests:

1. `Lint, Typecheck, Test` job must pass.
2. Pull requests must target `main`.
3. Direct pushes to `main` should be blocked by branch protection.

## Branch Protection Defaults

Apply these defaults on repository initialization:

1. Require pull request before merge.
2. Require status checks to pass before merge.
3. Require branch to be up to date before merge.
4. Restrict force-push and branch deletion on `main`.
