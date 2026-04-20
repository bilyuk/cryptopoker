# Workspace Path Migration Notes

## Context

The repo layout moved from:

- `<project>/_default/cryptopoker` (nested)

to:

- `<project>/_default` (repo root)

Some workspace bootstrap flows still create links that target the old nested
path, causing immediate "repo not found" failures when agents start work.

## Compatibility behavior implemented

Repository root now contains:

- `cryptopoker -> .`

This keeps both paths valid during migration:

- `<project>/_default`
- `<project>/_default/cryptopoker`

CI enforces this compatibility alias via `pnpm ops:verify-workspace-alias`.

## Required platform follow-up

Workspace provisioning should be updated to link workspaces directly to:

- `<project>/_default`

instead of:

- `<project>/_default/cryptopoker`

## Removal plan

Once all workspace creators are updated and no consumers depend on the nested
path, the `cryptopoker -> .` alias can be removed. Keep the CI check until that
platform change is rolled out to avoid regressions.
