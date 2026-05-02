# CRY-111 Install Local Dev Environment and Document Repo Familiarization

Status: ready-for-human

Category: chore

## What to do

Set up the local development environment and capture onboarding/familiarization notes for this repository, including validated commands and known setup gotchas.

## Acceptance criteria

- [x] Dependencies install successfully with workspace tooling.
- [x] Database startup path is validated and documented.
- [x] Core validation command(s) are run and results captured.
- [x] Repo familiarization notes are documented (app layout, contracts, ADR/domain docs).
- [x] Follow-up owner is assigned for any remaining blocker(s).

## Comments

### 2026-05-01 22:23 PT — CTO agent update

Progress on CRY-111:

- Ran `pnpm install` successfully in workspace root.
- Verified Postgres exists and is healthy as `cryptopoker-postgres` on `localhost:5432`.
- Ran `pnpm test` successfully (API + web + contracts tests passed).
- Ran `pnpm typecheck`; this failed in `@cryptopoker/web` with many `TS7016` errors (`react` / `react/jsx-runtime` declaration missing), plus downstream implicit `any` errors.
- Added onboarding doc: `docs/dev-setup.md` with verified setup commands, runbook, and repo familiarization.

Blockers / follow-up needed:

- Typecheck failure is not introduced by this task but prevents clean full validation.
- Needs assignment to the frontend owner to add/restore proper React typings (likely `@types/react` / `@types/react-dom` alignment with current Next/TS config), then re-run `pnpm typecheck`.

### 2026-05-01 22:25 PT — CTO agent update

Unblock action taken:

- Created follow-up ticket for assignment and execution: `./02-web-typecheck-react-types-missing.md`.
- Marked this ticket `ready-for-human` pending that fix and final typecheck confirmation.
