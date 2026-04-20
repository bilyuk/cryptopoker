# Poker UI Direction (MVP)

Owner: UX Design  
Issue: CRY-5

## 1) Product UX goals

- Make table state legible in less than 3 seconds.
- Keep player action path obvious: `Check/Call`, `Bet/Raise`, `Fold`.
- Reinforce trust with visible fairness and settlement status without crowding gameplay.
- Keep parity across desktop, tablet, and mobile.

## 2) Visual language

### Tone

- Competitive, high-clarity, low-noise.
- Gameplay surfaces first, decorative elements second.

### Color roles

- `bg-app`: deep neutral (`#0D1117`)
- `bg-table`: felt green (`#115E3B`)
- `surface-card`: elevated dark (`#161B22`)
- `surface-control`: darker neutral (`#1F2937`)
- `text-primary`: near-white (`#F3F4F6`)
- `text-secondary`: muted gray (`#9CA3AF`)
- `accent-primary`: action blue (`#3B82F6`)
- `accent-success`: win/ready green (`#22C55E`)
- `accent-warning`: timer amber (`#F59E0B`)
- `accent-danger`: fold/error red (`#EF4444`)

### Typography

- Display/Numbers: `Space Grotesk` (pot size, chip counts, timers).
- UI body: `Manrope` (labels, chat, settings).
- Scale:
- `12`: captions, seat status.
- `14`: metadata, secondary controls.
- `16`: default body and buttons.
- `20`: key section labels.
- `28-36`: pot size and showdown outcomes.

### Spacing and radius

- 4-point spacing grid (`4/8/12/16/24/32`).
- Radius:
- `8`: chips, small controls.
- `12`: cards and panel blocks.
- `20`: major action bar.

## 3) Core screen layout

## Desktop (>= 1280)

- Top bar: room name, blind level, network/fairness status, wallet.
- Center: oval table with community cards + pot in center.
- Around table: up to 6 player seats.
- Bottom center: local player hand and action bar.
- Right rail (320px): hand history + fairness panel toggle.

## Tablet (768-1279)

- Right rail collapses into tabbed bottom sheet.
- Seats and table scale down 10-15%.
- Action bar remains pinned bottom.

## Mobile (< 768)

- Single-column composition:
- Top: status strip + pot.
- Middle: compact table/community cards + seat ring.
- Bottom: sticky action controls with horizontal chip slider.
- Hand history and fairness open as full-height drawers.

## 4) Component specs

## Table shell

- Felt ellipse with subtle inner shadow and edge rim.
- Center cluster:
- Pot amount (largest numeric element).
- Street label (`Pre-Flop`, `Flop`, `Turn`, `River`).
- Community cards row (max 5 cards).

## Player seat card

- Avatar + short wallet name.
- Chip stack.
- State badge:
- `Waiting`, `Acting`, `All-in`, `Folded`, `Disconnected`, `Sitting Out`.
- Bet contribution indicator near table edge.
- Acting seat shows:
- 2px amber pulse ring.
- Circular countdown timer.

## Card visuals

- White card body with high-contrast rank/suit.
- Back pattern for hidden cards.
- Folded cards reduce opacity to 40%.

## Action bar

- Primary actions (order):
- `Check/Call` (primary filled blue).
- `Bet/Raise` (secondary outlined).
- `Fold` (tertiary text danger).
- Bet entry:
- Slider with blind-step snapping.
- Numeric input for precise value.
- Quick chips: `1/2 Pot`, `3/4 Pot`, `Pot`, `All-in`.

## Fairness panel

- Status chip: `Seed Committed`, `Reveal Pending`, `Verified`.
- Hand proof summary:
- Hand ID.
- Seed hash snippet.
- Settlement tx hash link.
- Copy actions for hashes.

## 5) Interaction and state matrix

## Global states

- `Connecting`: skeleton seats, disabled actions.
- `Waiting for players`: table visible, CTA to invite player.
- `In hand`: full controls.
- `Showdown`: reveal animation, winner highlight.
- `Settling on-chain`: spinner + tx status.
- `Table paused`: non-blocking banner, controls disabled.

## Local player action states

- `Your turn`: controls enabled, timer active.
- `Insufficient chips`: raise disabled with inline reason.
- `All-in`: controls hidden except confirm/read-only status.
- `Timed out`: auto-action result displayed in action log.

## Error states

- Wallet/network loss: sticky top warning + reconnect CTA.
- Tx failure: retry settlement banner with support trace id.
- Desync detected: modal forcing table resync.

## 6) Motion and feedback

- Deal cards: 180-220ms per card, slight stagger.
- Bet placement: chip fly-to-pot animation (150-200ms).
- Showdown winner: seat glow + pot count-up animation.
- Keep animations interruptible; never block player action.

## 7) Accessibility and UX constraints

- Minimum text contrast ratio 4.5:1 for body.
- Touch targets >= 44x44px on mobile.
- Color is never the only state signal; pair with icon/text.
- Keyboard support:
- `Tab` cycles actions.
- `Enter` triggers focused action.
- `Esc` closes drawers/modals.

## 8) Implementation tokens (starter)

```css
:root {
  --cp-bg-app: #0d1117;
  --cp-bg-table: #115e3b;
  --cp-surface-1: #161b22;
  --cp-surface-2: #1f2937;
  --cp-text-1: #f3f4f6;
  --cp-text-2: #9ca3af;
  --cp-accent-primary: #3b82f6;
  --cp-accent-success: #22c55e;
  --cp-accent-warning: #f59e0b;
  --cp-accent-danger: #ef4444;
  --cp-radius-sm: 8px;
  --cp-radius-md: 12px;
  --cp-radius-lg: 20px;
  --cp-space-1: 4px;
  --cp-space-2: 8px;
  --cp-space-3: 12px;
  --cp-space-4: 16px;
  --cp-space-5: 24px;
  --cp-space-6: 32px;
}
```

## 9) MVP deliverables for engineering handoff

- One table screen implementing all states above.
- Reusable components:
- `TableShell`, `PlayerSeat`, `CommunityCards`, `ActionBar`, `FairnessPanel`, `StatusBanner`.
- State-driven view model contract for seat + action states.
- Responsive behavior at breakpoints `1280`, `1024`, `768`, `390`.
