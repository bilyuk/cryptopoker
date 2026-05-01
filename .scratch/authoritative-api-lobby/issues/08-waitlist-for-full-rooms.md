# Waitlist for Full Rooms

Status: ready-for-human

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Let verified Players join and leave a FIFO Waitlist when no Seat is open, persist their position across refreshes, and ensure Waitlist participation does not grant spectator access to the Table.

## Acceptance criteria

- [x] A Player with a Host-Verified Buy-In can join the Waitlist when the Room has no open Seat.
- [x] A Player without a Host-Verified Buy-In cannot join the Waitlist.
- [x] A seated Player cannot also be on the Waitlist for the same Room.
- [x] Waitlist order is FIFO.
- [x] A waitlisted Player can leave the Waitlist.
- [x] A waitlisted Player's position is recovered after refresh.
- [x] Waitlist state does not expose Live Hand or spectator-only Table state.
- [x] Tests cover eligibility, FIFO ordering, leaving, refresh recovery, and no spectator access.

## Blocked by

- [07 - Seat Claiming and Leaving](07-seat-claiming-and-leaving.md)
