# Host-Verified Buy-In Flow

Status: needs-triage

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Let a Player request a Buy-In for a Room, let the Room Host approve or reject it after outside-the-app payment verification, and create a Room-local Table Stack only after Host approval.

## Acceptance criteria

- [ ] A Player with Room access can request a Buy-In within the Room's allowed range.
- [ ] Buy-In requests outside the allowed range are rejected with clear errors.
- [ ] The Room Host can see pending Buy-In requests.
- [ ] Only the Room Host can approve or reject a Buy-In.
- [ ] Approving a Buy-In creates a Host-Verified Buy-In and Room-local Table Stack.
- [ ] Rejecting a Buy-In prevents the Player from claiming a Seat or joining the Waitlist.
- [ ] The UI avoids escrow, wallet, deposit, withdrawal, and bankroll language for this flow.
- [ ] Tests cover request validation, Host-only approval and rejection, and prevention of seating eligibility before Host verification.

## Blocked by

- [04 - Invite Link Join and Room Access](04-invite-link-join-room-access.md)
