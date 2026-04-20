# Poker UI Component + State Spec (MVP)

Owner: UX Design  
Issue: CRY-5

## 1) Layout blueprint (desktop reference)

```
+----------------------------------------------------------------------------------+
| TopBar: room | blinds | fairness status | wallet                                 |
+----------------------------------------------------------------------------------+
|                                                                                  |
|   Seat 2                 Seat 3                 Seat 4                            |
|                                                                                  |
|                [ Community Cards ]                                               |
|                [ Pot + Street Label ]                                            |
|                                                                                  |
|   Seat 1                 Seat 0 (local)          Seat 5                          |
|                                                                                  |
|                      Local Player Hole Cards                                     |
|           [Check/Call] [Bet/Raise + Slider] [Fold]                              |
|                                                                                  |
+------------------------------------------------------+---------------------------+
| Optional footer/chat                                 | Right Rail (history/fair) |
+------------------------------------------------------+---------------------------+
```

## 2) Canonical enums

```ts
type TablePhase = "connecting" | "waiting" | "in_hand" | "showdown" | "settling" | "paused";

type Street = "preflop" | "flop" | "turn" | "river" | "complete";

type SeatState =
  | "empty"
  | "ready"
  | "acting"
  | "all_in"
  | "folded"
  | "sitting_out"
  | "disconnected";

type PlayerActionType = "check" | "call" | "bet" | "raise" | "fold" | "all_in" | "auto_fold";

type FairnessState = "seed_committed" | "reveal_pending" | "verified" | "verification_failed";
```

## 3) Component contracts

## `TableShell`

Purpose: Owns phase + street rendering and slots for seats/cards/actions.

Props:
- `phase: TablePhase`
- `street: Street`
- `potAmount: string`
- `communityCards: CardViewModel[]`
- `children` slots for seats + action bar + side panel

## `PlayerSeat`

Purpose: Present one player position and participation state.

Props:
- `seatIndex: number`
- `displayName: string`
- `stack: string`
- `currentBet?: string`
- `state: SeatState`
- `isDealer: boolean`
- `isLocal: boolean`
- `timeRemainingMs?: number`

Behavior:
- Show timer only in `acting`.
- Apply opacity reduction in `folded`.
- Show reconnect affordance in `disconnected`.

## `CommunityCards`

Props:
- `cards: CardViewModel[]` (0-5)
- `revealMask: boolean` (for animation step)

## `ActionBar`

Props:
- `isTurn: boolean`
- `canCheck: boolean`
- `callAmount?: string`
- `minBet?: string`
- `maxBet?: string`
- `stackAmount: string`
- `disabledReason?: string`
- callbacks: `onCheckOrCall`, `onBetOrRaise`, `onFold`

Behavior:
- Replace button label automatically:
- `Check` when `callAmount` is 0.
- `Call {amount}` when `callAmount` > 0.
- If disabled, keep buttons visible and show reason text.

## `FairnessPanel`

Props:
- `state: FairnessState`
- `handId: string`
- `seedCommitHash?: string`
- `seedReveal?: string`
- `verificationProofUrl?: string`
- `settlementTxHash?: string`

## `StatusBanner`

Props:
- `kind: "info" | "warning" | "error" | "success"`
- `message: string`
- `actionLabel?: string`
- `onAction?: () => void`

## 4) State transition UX requirements

## Turn lifecycle

1. Seat enters `acting` -> timer appears + action bar enabled.
2. Player commits action -> optimistic log row appears.
3. Action confirmed -> pot/stack animate to new values.
4. Turn moves -> previous timer removed, new seat highlighted.

## Hand end lifecycle

1. `showdown` phase shows revealed cards and winner seat.
2. Pot animates toward winner stack.
3. Phase moves to `settling` while settlement tx confirms.
4. On success: transient success banner + next hand countdown.

## Failure lifecycle

1. Any tx or sync error raises `StatusBanner(kind=error)`.
2. Action bar disabled when game state is uncertain.
3. User can trigger retry or resync from banner action.

## 5) Responsive constraints

- `>=1280`: 6-seat ring + right rail visible.
- `1024-1279`: tighter seat spacing, right rail as tab.
- `768-1023`: reduced card sizes, bottom sheet utilities.
- `<768`: stacked layout, drawers for history/fairness, sticky action footer.

## 6) Acceptance criteria for UI implementation

- Every enum value above maps to a visible UI state.
- Local player can always identify:
- whose turn it is,
- available legal actions,
- current pot,
- current fairness/settlement status.
- No interactive control is hidden solely due to disablement; disabled controls provide reason text.
- Mobile action controls stay visible while table content scrolls.
