# Claude Code instructions for cryptopoker

## Domain language

Read `CONTEXT.md` before making domain decisions. The vocabulary there is the authoritative product language: Player, Room, Table, Seat, Host, Buy-In, Host-Verified Buy-In, Waitlist, Seat Offer, Table Stack. Never substitute "user," "account," "wallet," "deposit."

## Design system

Always read `DESIGN.md` before making any visual or UI decisions. All font choices, colors, spacing, motion, and aesthetic direction are defined there. Do not deviate without explicit user approval. In QA mode, flag any code that doesn't match `DESIGN.md`.

The Aurum design system primitives live under `apps/web/components/aurum/`. Reuse `Panel`, `AurumButton`, `AurumChip`, `SpecRow`, `Header`, etc. before introducing new primitives. New primitives go in the same directory and need a Storybook story.

## Inline HTTP paths

Write route URLs as plain string literals at every call site. No path constants, no path builders. This was a deliberate decision; see commit `3326ea0`.

## Issue tracker

Issues and PRDs live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

## Testing

Run `pnpm test` to run tests. The API uses Vitest with NestJS testing utilities; the web app uses Vitest with Testing Library. Integration tests in `apps/api/test/` exercise real HTTP endpoints via `supertest`.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:

- Product ideas / brainstorming → invoke /office-hours
- Strategy / scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system / plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs / errors → invoke /investigate
- QA / testing site behavior → invoke /qa or /qa-only
- Code review / diff check → invoke /review
- Visual polish → invoke /design-review
- Ship / deploy / PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
