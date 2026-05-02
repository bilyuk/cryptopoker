# Web Typecheck Fails Due to Missing React Type Declarations

Status: ready-for-human

Category: bug

## Parent

[CRY-111 Install Local Dev Environment and Document Repo Familiarization](01-cry-111-install-local-dev-environment-and-document-repo-familiarization.md)

## What is broken

`pnpm typecheck` fails in `@cryptopoker/web` with `TS7016` errors that TypeScript cannot find declarations for `react` and `react/jsx-runtime`, plus many downstream implicit `any` errors.

## Reproduction

1. Run `pnpm install`.
2. Run `pnpm typecheck`.
3. Observe failures in `apps/web`.

## Expected behavior

`pnpm typecheck` passes across all workspace packages.

## Suggested fix direction

- Align web app type dependencies with current React/Next versions.
- Add missing type packages if needed (`@types/react`, `@types/react-dom`).
- Re-run `pnpm typecheck` at workspace root.

## Comments

- 2026-05-01 (agent): Started CRY-112. Reproducing `pnpm typecheck` failure in `@cryptopoker/web` and preparing dependency/type fix.
- 2026-05-01 (agent): Added `@types/react` and `@types/react-dom` to `@cryptopoker/web` devDependencies, reran `pnpm typecheck` successfully, pushed branch `cry-111-dev-setup-docs`, and opened PR: https://github.com/bilyuk/cryptopoker/pull/5
