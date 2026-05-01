# Invite Link Join and Room Access

Status: ready-for-human

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Let invited Players open an Invite Link, inspect the private Room they were invited to, join the Room access context, and recover current Room state through REST snapshots while preventing access by guessed Room identifiers.

## Acceptance criteria

- [x] A Player can fetch invite preview state using an Invite Link.
- [x] A Player can join a Room access context using an Invite Link.
- [x] Guessing or directly using an internal Room identifier does not grant private Room access.
- [x] Joining is rejected when the Player already participates in another active Room.
- [x] The current Room snapshot can be fetched after refresh.
- [x] The invite screen uses server-backed Invite Link lookup and join behavior.
- [x] Tests cover valid Invite Link access, invalid Invite Link access, guessed Room identifier rejection, and current Room recovery.

## Blocked by

- [03 - Room Host Creates Private Room](03-room-host-creates-private-room.md)
