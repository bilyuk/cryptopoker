# Engine Hand Event Contract (CRY-16 -> CRY-19)

Schema version: `0.2.0`

This contract defines the deterministic event payloads CRY-19 should consume for action panel integration.

## 1) Legal action payload model per acting seat

- Snapshot and stream payloads now include:
  - `currentActor`: `"hero" | "villain" | null`
  - `legalActions`: actions for the `currentActor` (legacy convenience field)
  - `legalActionsBySeat`: explicit per-seat action map:

```json
{
  "currentActor": "hero",
  "legalActions": ["check", "call", "bet", "raise", "fold", "all_in"],
  "legalActionsBySeat": {
    "hero": ["check", "call", "bet", "raise", "fold", "all_in"],
    "villain": []
  }
}
```

## 2) Timeout / auto-action payloads

`hand.timeout_applied` contract:

```json
{
  "eventType": "hand.timeout_applied",
  "timedOutActor": "hero",
  "timeoutMs": 15000,
  "autoAction": {
    "actor": "hero",
    "action": "fold",
    "amount": 0
  },
  "potAfter": 120,
  "nextActor": "villain",
  "legalActionsBySeat": {
    "hero": [],
    "villain": ["check", "call", "bet", "raise", "fold", "all_in"]
  },
  "legalActions": ["check", "call", "bet", "raise", "fold", "all_in"]
}
```

Related action event:

- `hand.action_applied.source` is `"player_input"` or `"timeout_auto_action"`.

## 3) Deterministic phase/street transition contract

`table.phase_changed` includes explicit reason:

- `reason`: `"table_created" | "hand_started" | "player_left" | "hand_resolved" | "settlement_confirmed"`
- `previousPhase` + `phase` define deterministic transition edge.

`hand.street_changed` includes explicit reason:

- `reason`: `"hand_started" | "betting_round_complete" | "runout_complete"`
- `previousStreet` + `street` define deterministic transition edge.

Consumers should apply events by ascending `sequence` (per table stream) to ensure deterministic replay.
