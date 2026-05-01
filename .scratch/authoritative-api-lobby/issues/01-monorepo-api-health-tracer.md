# Monorepo API Health Tracer

Status: needs-triage

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Create the first end-to-end monorepo tracer: the existing web app remains runnable, a new NestJS API app boots with a health endpoint, a shared contracts package can be imported, and workspace scripts can build or test the repo through pnpm and Turborepo.

## Acceptance criteria

- [ ] The repo uses pnpm workspaces and Turborepo with separate web, API, and shared contract workspaces.
- [ ] The existing Next frontend still builds and runs from its workspace.
- [ ] The NestJS API exposes a health endpoint that can be called locally.
- [ ] The API has a TypeORM/Postgres configuration path without requiring feature modules to be implemented yet.
- [ ] The shared contracts package can be imported by both the web and API workspaces.
- [ ] Workspace-level build and test commands run successfully.

## Blocked by

None - can start immediately
