# Seat Offers from Waitlist

Status: ready-for-human

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

When a Seat opens, create a Seat Offer for the first eligible waitlisted Player. The Player must accept before becoming seated, may decline, and may lose the offer after expiry so the next eligible Player can receive an offer.

## Acceptance criteria

- [x] Opening a Seat creates a Seat Offer for the first eligible Player on the Waitlist.
- [x] A Seat Offer does not immediately occupy the Seat.
- [x] The offered Player can accept the Seat Offer and become seated.
- [x] The offered Player can decline the Seat Offer.
- [x] An expired or declined Seat Offer advances to the next eligible waitlisted Player.
- [x] A Player who is no longer eligible cannot accept an old Seat Offer.
- [x] The UI shows the targeted Seat Offer state to the offered Player.
- [x] Tests cover offer creation, accept, decline, expiry, advancement, and stale offer rejection.

## Blocked by

- [08 - Waitlist for Full Rooms](08-waitlist-for-full-rooms.md)
