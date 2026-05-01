# Room Host Creates Private Room

Status: needs-triage

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Let a Player create one active private Room, become the Room Host, configure the Room's pre-play settings, receive an unguessable Invite Link, and see server-backed Room state in the frontend.

## Acceptance criteria

- [ ] An authenticated Player can create a private Room with name, blinds, buy-in range, Seat count, and action timer.
- [ ] The creator becomes the Room Host.
- [ ] A Room creates exactly one Table in version 1.
- [ ] A Room receives an unguessable Invite Link distinct from the internal Room identifier.
- [ ] A Player cannot create or join a second active Room while already participating in one.
- [ ] Room creation validates settings and returns clear command errors.
- [ ] The frontend create-room flow creates the Room through the API and renders the returned Room state.
- [ ] Tests cover successful Room creation, Host assignment, Invite Link creation, and one-active-Room enforcement.

## Blocked by

- [02 - Persistent Player Session and Display Name](02-persistent-player-session-display-name.md)
