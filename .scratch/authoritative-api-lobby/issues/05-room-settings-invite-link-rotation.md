# Room Settings and Invite Link Rotation

Status: ready-for-agent

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Let the Room Host manage mutable Room details before play starts and rotate the Invite Link without disrupting already-present Players.

## Acceptance criteria

- [x] The Room Host can update allowed Room settings before the first Hand starts.
- [x] Non-Host Players cannot update Room settings.
- [ ] Settings that affect fairness are rejected after play has started once that state exists.
- [x] The Room Host can rotate the Invite Link.
- [x] Old Invite Links no longer grant new access after rotation.
- [x] Already-present Players remain in the Room after Invite Link rotation.
- [x] The frontend reflects updated Room settings and the current Invite Link.
- [x] Tests cover Host-only updates, setting validation, Invite Link rotation, old link rejection, and preservation of present Players.

## Blocked by

- [03 - Room Host Creates Private Room](03-room-host-creates-private-room.md)
