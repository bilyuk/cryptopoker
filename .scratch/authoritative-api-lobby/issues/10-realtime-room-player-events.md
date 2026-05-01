# Realtime Room and Player Events

Status: ready-for-human

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Add authenticated Socket.IO channels for Room-wide updates and private Player prompts, then emit coarse-grained events after Room, Buy-In, Seat, Waitlist, Seat Offer, and Player state changes while keeping REST snapshots as the recovery path.

## Acceptance criteria

- [x] Socket.IO connections authenticate with the same persistent guest session cookie as REST.
- [x] A Player can subscribe only to Room channels they are allowed to access.
- [x] Room-wide changes emit coarse-grained Room events.
- [x] Buy-In, Seat, Waitlist, Seat Offer, and Player changes emit the agreed coarse-grained events.
- [x] Targeted prompts, including Seat Offers, are sent only to the relevant Player channel.
- [x] The frontend reacts to events by updating or refetching Room state.
- [x] REST snapshots remain sufficient to recover after missed realtime events.
- [x] Tests cover socket authentication, Room subscription authorization, private Player targeting, and event emission after state-changing commands.

## Blocked by

- [09 - Seat Offers from Waitlist](09-seat-offers-from-waitlist.md)
