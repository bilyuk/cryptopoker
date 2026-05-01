# Seat Claiming and Leaving

Status: ready-for-human

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Let Players with Host-Verified Buy-Ins claim open Seats, leave Seats between Hands, and see server-backed seated state while preventing unverified or duplicate seating.

## Acceptance criteria

- [x] A Player with a Host-Verified Buy-In can claim an open Seat.
- [x] A Player without a Host-Verified Buy-In cannot claim a Seat.
- [x] A Player cannot occupy more than one Seat in the Room.
- [x] Seat capacity is enforced.
- [x] A seated Player can leave their Seat while no Live Hand rules are involved in this slice.
- [x] The waiting-room UI renders server-backed Seats and Table Stack information.
- [x] Tests cover successful Seat claiming, unverified Player rejection, duplicate Seat prevention, capacity enforcement, and leaving a Seat.

## Blocked by

- [06 - Host-Verified Buy-In Flow](06-host-verified-buy-in-flow.md)
