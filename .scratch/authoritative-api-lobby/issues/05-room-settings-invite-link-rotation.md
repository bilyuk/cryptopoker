# Room Settings and Invite Link Rotation

Status: needs-triage

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Let the Room Host manage mutable Room details before play starts and rotate the Invite Link without disrupting already-present Players.

## Acceptance criteria

- [ ] The Room Host can update allowed Room settings before the first Hand starts.
- [ ] Non-Host Players cannot update Room settings.
- [ ] Settings that affect fairness are rejected after play has started once that state exists.
- [ ] The Room Host can rotate the Invite Link.
- [ ] Old Invite Links no longer grant new access after rotation.
- [ ] Already-present Players remain in the Room after Invite Link rotation.
- [ ] The frontend reflects updated Room settings and the current Invite Link.
- [ ] Tests cover Host-only updates, setting validation, Invite Link rotation, old link rejection, and preservation of present Players.

## Blocked by

- [03 - Room Host Creates Private Room](03-room-host-creates-private-room.md)
