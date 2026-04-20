# Shared Schema Versioning Flow

Owner: CTO
Last updated: 2026-04-13

## Version contract

`contracts/api-schema/src/events.ts` exports `schemaVersion`.

Rules:

- Any backward-compatible change increments the patch version (for example `0.1.0` -> `0.1.1`).
- Any breaking change increments the minor version during pre-1.0 (for example `0.1.1` -> `0.2.0`).
- Emitters and consumers must validate against the same `schemaVersion` literal.

## One-command consumer update

After changing shared schemas, run:

```bash
pnpm build
```

This compiles `@cryptopoker/api-schema` first and then rebuilds backend + web consumers using project references.

## Change checklist

1. Update schema definitions and exported types in `contracts/api-schema/src`.
2. Update `schemaVersion` when contract shape changes.
3. Rebuild all consumers with `pnpm build`.
4. Add migration SQL under `infra/migrations` if persistence changes are required.
5. Commit schema and consumer updates in one changeset/PR.
