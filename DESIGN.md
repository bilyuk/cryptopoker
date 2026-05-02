# Aurum — Design System for Cryptopoker

## The memorable thing

A velvet-rope room you arrived at by invitation. Not a casino. Not a corporate dashboard. A small, intentional space where the architecture itself is a trust signal: the chandelier, the brass columns, the gilt hairlines say "this is private, this is real, you belong here." Every visual decision either serves that feeling or erodes it.

## Product Context

- **What this is:** Cryptopoker is a private-table poker app with dollar-denominated table chips, browser-persistent guest identity, and Host-Verified Buy-Ins (no in-app custody). v1 is invite-only.
- **Who it's for:** Friend groups playing No Limit Hold'em, with one of them acting as Host (the trust anchor for buy-ins).
- **Space:** Adjacent to gambling apps and casino-themed UIs but explicitly anti-casino in posture. Closer to a private poker room than to PokerStars or DraftKings.
- **Project type:** Next.js + NestJS web app. Mobile and desktop both first-class.

## Aesthetic Direction

- **Direction:** Art Deco × Luxury Refined. Dark sapphire foundation, gold and champagne accents, serif display, generous architectural decoration on hero screens.
- **Decoration level:** Expressive — the Backdrop carries decorative chandelier (48 hanging gold rods), brass columns, concentric ceiling ovals, and a perspective-projected carpet floor. Decoration is the brand, not noise.
- **Mood:** Private, intentional, slightly theatrical. Calm during play, slightly ceremonial during entry/seating.
- **Anti-references:** PokerStars, casino slot UIs, generic SaaS dashboards. Anything that looks like it wants to take your money.

## Color

CSS variables live in `apps/web/app/globals.css` under `@theme`. Reference by Tailwind class.

| Token              | Hex       | Role                                                  |
| ------------------ | --------- | ----------------------------------------------------- |
| `sapphire-950`     | `#070a16` | App background, deepest surfaces                      |
| `sapphire-900`    | `#0b1024` | Backdrop second-layer gradient                        |
| `sapphire-850`    | `#0e1433` | Carpet inner gradient                                 |
| `sapphire-800`    | `#11183a` | Panel fill top                                        |
| `sapphire-500`    | `#33477e` | Supporting borders, dividers                          |
| `sapphire-400`    | `#6277b8` | Eyebrow caps text                                     |
| `sapphire-200`    | `#c6cfe8` | Caption / supporting body text                        |
| `ivory-50`        | `#fdfbf4` | Display headings (max contrast)                       |
| `ivory-100`       | `#f6f1e3` | Primary body text                                     |
| `champagne-300`   | `#f0d9a4` | Highlight strokes, avatar gradient stop               |
| `champagne-500`   | `#d4a85a` | Primary accent — borders, brass columns, hairlines    |
| `gold-400`        | `#e4c37d` | Numeric values, button text, mono accents             |
| `verified-400`    | `#6fc9a1` | Semantic — Host-Verified Buy-In, success, ready state |
| `danger-400`      | `#d4615a` | Semantic — rejection, destructive confirmation        |

**Approach:** restrained. Sapphire as 80% of the surface, champagne/gold as the only accent (used sparingly for borders, strokes, numeric values), ivory for text. Verified and danger are reserved for state — never as decoration.

**Dark mode is the only mode.** This is a dim-room product by design. Do not introduce a light mode.

## Typography

Loaded from Google Fonts in `globals.css`.

| Token          | Family                  | Role                                                   |
| -------------- | ----------------------- | ------------------------------------------------------ |
| `font-display` | Cormorant Garamond      | Serif display — room names, screen heroes              |
| `font-sans`    | Inter Tight, Inter      | UI body, paragraphs, labels, buttons                   |
| `font-mono`    | JetBrains Mono          | All numerics — stacks, blinds, buy-in values, timers   |

**Rules:**
- Numerics are **always** mono. A dollar value rendered in a sans face is a bug.
- Display serif is reserved for room name, big confirmations, and waitlist-position copy. Do not use it for buttons, body, or labels.
- Inter Tight is the default; fall back to Inter if Tight is not loaded.

**Scale (observed in current code, codify):**

| Use                | Size                       | Weight    | Notes                                  |
| ------------------ | -------------------------- | --------- | -------------------------------------- |
| Hero display       | `clamp(42px, 5vw, 58px)`   | 500       | Cormorant, line-height: none           |
| Section heading    | 32px                       | 500       | Cormorant or Inter Tight, by context   |
| Body               | 14px (sm) / 16px (base)    | 400       | Inter Tight                            |
| Body small         | 12px                       | 400       | Inter Tight                            |
| Eyebrow caps       | 9px / 10px (xl)            | 600       | Inter Tight, uppercase, tracking 0.28em|
| Caption            | 10px / 12px / 13px         | 400       | sapphire-200                            |
| Mono value         | 12px / 14px / 16px         | 500       | JetBrains Mono, gold-400               |
| Action title       | 11px / 12px / 14px         | 600       | Inter Tight, tracking 0.02em           |
| Action detail      | 9px / 10px / 11px          | 400       | JetBrains Mono                         |

Reusable utility classes in `globals.css` already encode these: `.aurum-eyebrow`, `.aurum-caption`, `.aurum-mono-value`, `.aurum-action-title`, `.aurum-action-detail`. Prefer these over ad-hoc Tailwind sizing.

## Spacing

- **Base unit:** 4px (Tailwind default).
- **Density:** comfortable. Panels breathe; hero screens lean spacious.
- **Common values in use:** `gap-3` (12px), `gap-4` (16px), `p-3` (12px), `p-5` (20px), `p-6` (24px), `mt-7` (28px), `mt-20` (80px) for hero offset.
- **Max content width:** `max-w-[1052px]` for the room/table screens; `max-w-[600px]` for foyer-style centered cards.

## Layout

- **Approach:** hybrid. Grid-disciplined for app surfaces (the table, settings, players panel). Editorial-leaning for hero screens (centered hero with decorative chandelier and pillars).
- **Grid:** `md:grid-cols-2` is the workhorse for room-level layouts. Single column below `md`.
- **Border radius scale:** `rounded-md` (6px) for compact rows, `rounded-lg` (8px) for buttons, `rounded-xl` (12px) for inputs and small cards, `rounded-[18px]` for the sticky header on mobile, `rounded-[28px]` for primary panels.
- **Backdrop:** every app screen renders the `<Backdrop />` component. The atmosphere is part of the layout, not the chrome.

## Motion

- **Approach:** intentional. Functional transitions on interactive elements, reserved decorative motion for state changes.
- **Easing:** `transition` (default Tailwind, ease-in-out 150ms) for hover/active, `transition duration-200` for buttons.
- **Decorative motion:**
  - **Foyer "waiting for verification" state:** single gold dot, 1.4s ease-in-out, scale 1.0 → 1.3 → 1.0, infinite.
  - **Foyer → TableView morph:** 240ms ease-out crossfade. Honor `prefers-reduced-motion` (skip the morph, snap-replace).
  - **Pending verifications banner:** slide-in from top, 200ms ease-out, when a buy-in arrives. No animation when banner is initially rendered.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` halts the chandelier shimmer, the foyer pulse, and the morph. State changes still happen; they just stop being decorative.

## Component vocabulary

Components live under `apps/web/components/aurum/`. Add new primitives here only when a pattern repeats across screens.

| Component        | Purpose                                                                              |
| ---------------- | ------------------------------------------------------------------------------------ |
| `Backdrop`       | The room atmosphere: chandelier, brass columns, ceiling ovals, carpet. Renders once at app root. |
| `Header`         | Sticky top bar with logo, mode label, player avatar pill, sign-out.                  |
| `Logo`           | Brand mark.                                                                          |
| `Panel`          | The `gilt-panel` with the gold hairline (`gilt-line`) at top. Default container.     |
| `AurumButton`    | Primary, ghost, segment variants. All min-h-11, gold-400 text, focus-ring gold.      |
| `AurumChip`      | NEW — quick-pick selector (e.g. buy-in amount). Ghost-by-default, primary-when-selected. Composes into a `role="radiogroup"`. |
| `SpecRow`        | Inline "label / value" row for room metadata (Variant, Blinds, Buy-in, Timer, Seats).|
| `PlayingCard`    | Card-rendering primitive for the table.                                              |
| `RoomCard`       | Card representation of a Room in lists.                                              |

### AurumChip (new)

```
<AurumChip selected={amount === 100} onClick={() => setAmount(100)}>$100</AurumChip>
```

- **Resting:** ghost-style — transparent bg, `border-ivory-100/10`, `text-gold-400`, `min-h-11`, `rounded-lg`, same paddings as AurumButton.
- **Selected:** matches AurumButton primary — `border-champagne-500/35`, `bg-gradient-to-b from-champagne-500/30 to-[#8b6a2e]/25`, `shadow-[inset_0_1px_0_rgb(240_217_164_/_0.2)]`.
- **Hover:** `border-champagne-500/30 bg-sapphire-800/40` (matches ghost hover).
- **Focus:** outline 2px gold-400 with offset 2px (visible against sapphire-950).
- **Group:** parent uses `role="radiogroup"` and tabbed-once-then-arrow-keys keyboard model. Each chip has `role="radio" aria-checked={selected}`.
- **Storybook:** add `apps/web/stories/aurum/chip.stories.tsx` with resting / selected / disabled / focused / radio-group examples.

## Forms

- Inputs use `.aurum-input` (`min-h-14`, `rounded-xl`, `border-champagne-500/35`, `bg-sapphire-950/70`, `text-ivory-100`, focus-border `champagne-500/70`).
- Labels are visible above inputs (no placeholder-as-label).
- Helper text below inputs uses `text-xs text-sapphire-300` for default, `text-champagne-500` for warning (warm, not red).
- Validation: inline helper that explains the rule; never silent auto-clamp.

## Accessibility minimums

- **Color contrast:** body text on sapphire-950 must hit WCAG AA (4.5:1). Verified pairings: `ivory-100` on `sapphire-950` (≈14:1), `gold-400` on `sapphire-950` (≈8:1), `sapphire-200` on `sapphire-950` (≈9:1). Do not put body text in `sapphire-400` (fails).
- **Focus rings:** all interactive elements have a visible focus ring. Default is `outline-2 outline-offset-2 outline-gold-400`.
- **Touch targets:** ≥44px on touch surfaces. AurumButton's `min-h-11` (44px) is compliant; do not shrink below this on mobile.
- **Live regions:** state-change copy that the user wasn't already looking at (e.g., "Waiting for {Host} to verify") wraps in `role="status" aria-live="polite"` so screen readers announce it.
- **Reduced motion:** all decorative motion respects `@media (prefers-reduced-motion: reduce)`.
- **Keyboard:** chip groups are tabbed-once-then-arrows (radio-group model). Forms are fully Tab-navigable. No keyboard trap.

## Decoration vocabulary

These are part of the brand, not noise. Use them deliberately.

- **Gilt hairline (`.gilt-line`):** a 1px gold gradient at the top of every Panel. Do not replace with a solid border.
- **Brass columns (`.brass-column`):** gold/brown gradient vertical strips on hero screens. Two pairs (8% and 16% from each edge), present on Backdrop. Do not introduce additional pillars elsewhere.
- **Chandelier:** the 48-rod hanging fixture in the Backdrop. One per page; never in a panel.
- **Ceiling ovals:** concentric stroke ellipses behind the chandelier. Already in Backdrop; do not add ad-hoc.
- **Carpet floor:** perspective-projected sapphire ground with subtle dot pattern. Backdrop only.

## Iconography

- Lucide React (`lucide-react`) is the icon library, observed in `room-screen.tsx` (`ArrowRight`, `Copy`, `Share2`).
- Icon size 14–16px inline with text; 20px for standalone affordances.
- Color: `text-gold-400` matches button text. Do not introduce filled or 3D icons.

## Voice and copy

- **Direct, calm, friend-to-friend.** Not casino-speak. "You're in" beats "Welcome aboard." "Buy-in not yet verified" beats "Buy-in REJECTED." The Host is referred to by their display name, not a role.
- **No happy talk.** No "Welcome to The Velvet Room!" No "Get ready to play!" Trust the architecture; don't oversell.
- **Numbers everywhere.** "$40" not "forty dollars." "1/2 blinds" not "small blinds and big blinds." "Seat 3" not "the third seat."
- **Domain language wins.** Use the words from `CONTEXT.md` exactly: Player, Room, Table, Seat, Host, Buy-In, Host-Verified Buy-In, Waitlist, Seat Offer, Table Stack. Never substitute "user," "account," "wallet," "deposit."

## What this design system does NOT do

- No light mode.
- No purple, no neon, no gradients-as-CTA, no rainbow.
- No 3-column feature grid, no icon-in-circle decoration.
- No casino chips emoji or playing-card emoji as ornament. (`PlayingCard` component renders real cards for the actual game; never as decoration.)
- No stock-photo hero images.
- No "Built for Players" / "Designed for Hosts" marketing copy patterns.
- No system-ui or `-apple-system` as primary font.

## Decisions Log

| Date       | Decision                                                                | Rationale                                                                  |
| ---------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 2026-05-01 | Initial DESIGN.md created from existing Aurum implementation            | Formalize implicit system; close gap surfaced in /plan-design-review        |
| 2026-05-01 | AurumChip primitive added (ghost-by-default, primary-when-selected)     | Velvet Room redesign needed a quick-pick selector for buy-in amount        |
| 2026-05-01 | Foyer waiting state: single gold dot, 1.4s ease-in-out, scale 1.0→1.3→1.0 | Specified by /plan-design-review Pass 7                                     |
| 2026-05-01 | Live-region announcements on async state changes                        | A11y minimum surfaced in /plan-design-review Pass 6                         |
| 2026-05-01 | Chip radio-group keyboard model (tabbed-once-then-arrows)               | A11y minimum surfaced in /plan-design-review Pass 6                         |
