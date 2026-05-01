# PRD: Authoritative API Foundation and Realtime Room Lobby

Status: ready-for-agent

## Problem Statement

Cryptopoker currently has a polished frontend prototype, but poker state, Room creation, guest identity, Buy-Ins, Seats, Waitlists, and table transitions are all simulated in the browser. That prevents real multiplayer play because the frontend cannot be trusted to own poker state, Room access, Host verification, or seating rules.

The next implementation step needs to turn Cryptopoker into a real private-table product without attempting the entire poker engine at once. The first slice should create the monorepo foundation, a separate authoritative API server, durable Room and Player state, Host-Verified Buy-Ins, Seat and Waitlist mechanics, and realtime Room updates that the existing frontend can progressively adopt.

## Solution

Build a pnpm workspace monorepo with a Next frontend, NestJS API server, and shared contract package. The API server becomes the authority for Rooms, Players, persistent guest sessions, Invite Links, Buy-Ins, Seats, Waitlists, Seat Offers, and realtime lobby state. The frontend sends intents to the API and renders server state rather than inventing Room state locally.

The first implementation slice stops before Live Hand play and settlement. It should support the complete pre-hand multiplayer flow: a Player is remembered by a persistent guest session cookie, creates or joins a private Room through an Invite Link, requests a Buy-In, waits for Room Host approval, takes a Seat when available, joins a Waitlist when full, receives a Seat Offer when a Seat opens, and receives Socket.IO updates when the Room changes.

## User Stories

1. As a returning Player, I want the app to remember me on the same browser, so that I can reclaim my Room, Seat, pending Buy-In, Waitlist position, or Seat Offer without creating an account.
2. As a Player, I want to choose a Display Name, so that other Players can recognize me at the Room.
3. As a Player, I want to change my Display Name outside a Live Hand, so that I can correct or update my table-visible label.
4. As a Player, I want Display Names to be non-unique, so that I can use the name I want without it becoming an account identity.
5. As a Player, I want my Display Name to be separate from my identity, so that two browsers using the same Display Name are still distinct Players.
6. As a Room Host, I want to create a private Room, so that I can invite selected Players to a poker Table.
7. As a Room Host, I want a Room to create exactly one Table in version 1, so that the product model stays simple.
8. As a Room Host, I want to configure Room name, blinds, buy-in range, Seat count, and action timer before play starts, so that the Table has clear terms before Players join.
9. As a Room Host, I want Room settings that affect fairness to lock when the first Hand starts, so that Players cannot be surprised by changed stakes after joining.
10. As a Room Host, I want to edit the Room name after creation, so that I can fix presentation without altering poker terms.
11. As a Room Host, I want each Room to have an unguessable Invite Link, so that access is private and not based on public Room discovery.
12. As a Room Host, I want to rotate the Invite Link, so that I can stop old links from bringing in new Players.
13. As a seated Player, I want Invite Link rotation not to remove me, so that current participation is not disrupted by access-control changes.
14. As an invited Player, I want to open an Invite Link and see the Room, so that I can decide whether to request a Buy-In.
15. As an invited Player, I want joining by guessed Room ID to fail, so that private Rooms remain private.
16. As a Player, I want to participate in at most one active Room at a time in version 1, so that my guest identity cannot create conflicting Seats or Buy-Ins across Rooms.
17. As a Player, I want to request a Buy-In within the Room’s allowed range, so that I can ask to receive a Table Stack.
18. As a Room Host, I want to see pending Buy-In requests, so that I can verify outside-the-app payment.
19. As a Room Host, I want to approve a Buy-In, so that the Player can receive a Table Stack and become eligible for a Seat or Waitlist.
20. As a Room Host, I want to reject a Buy-In, so that an unverified Player cannot take a Seat or join the Waitlist.
21. As a Player, I want the app to avoid calling Host verification “escrow,” so that it is clear the app does not move or hold funds.
22. As a Player, I want dollar-denominated Table Stacks after approval, so that the Room can represent agreed-upon poker chips.
23. As a Player, I want no global wallet or bankroll in version 1, so that Room-local chip tracking does not imply deposits, withdrawals, or custody.
24. As a Player with a Host-Verified Buy-In, I want to claim an open Seat, so that I can join the Table.
25. As a Player without a Host-Verified Buy-In, I want Seat claiming to fail, so that only verified Players can sit.
26. As a Player in a full Room, I want to join the Waitlist after Host verification, so that I can wait fairly for the next Seat.
27. As a waitlisted Player, I want not to spectate the Table, so that Waitlist access is not confused with spectator mode.
28. As a waitlisted Player, I want my Waitlist position to be preserved across refreshes, so that I do not lose my place accidentally.
29. As a Room Host, I want Waitlist order to be FIFO, so that Seats are offered fairly.
30. As a waitlisted Player, I want to receive a Seat Offer when a Seat opens, so that I can choose whether to claim it.
31. As a waitlisted Player, I want Seat Offers to require acceptance, so that I am not silently seated after walking away.
32. As a waitlisted Player, I want a Seat Offer to expire or be declined, so that the next eligible Player can receive the opportunity.
33. As a Player, I want to leave a Seat between Hands, so that my Seat can become available to others.
34. As a Room Host, I want a newly open Seat to trigger the next Seat Offer, so that Waitlist movement does not require manual administration.
35. As a Room Host, I want to remove a Player only outside a Live Hand, so that Host powers cannot alter live poker outcomes.
36. As a Room Host, I want to pause dealing between Hands in later slices, so that Room control remains outside Live Hand state.
37. As a Player, I want REST commands to return clear validation errors, so that the frontend can explain why a command failed.
38. As a Player, I want Room state to be recoverable through REST snapshots, so that I can resync after missed realtime events.
39. As a Player, I want Socket.IO updates when Room state changes, so that Buy-In approval, Seat changes, Waitlist movement, and Seat Offers appear without manual refresh.
40. As a Room Host, I want targeted realtime prompts for Buy-In requests and Seat state changes, so that I can administer the Room quickly.
41. As a Player, I want targeted realtime prompts for Seat Offers, so that private decisions are not broadcast as public Room state.
42. As a frontend developer, I want shared DTOs and event names, so that the web app and API cannot drift silently.
43. As an API developer, I want single-parameter REST routes, so that command URLs stay readable and relationship validation remains in service logic.
44. As an API developer, I want explicit verb endpoints for domain commands, so that approving a Buy-In or accepting a Seat Offer is not reduced to a generic status patch.
45. As an API developer, I want Postgres to store durable Room, Player, session, Buy-In, Seat, Waitlist, and Seat Offer state, so that refreshes and restarts do not erase the multiplayer lobby.
46. As an API developer, I want TypeORM entities to represent durable state, so that NestJS modules have a consistent persistence style.
47. As an API developer, I want the first slice to defer Live Hand settlement, so that we can validate Room and seating mechanics before implementing poker rules.
48. As a future poker-engine developer, I want the first slice to preserve the domain language for Hands, Live Hands, Player Actions, Turn Timers, and Table Stacks, so that later slices attach cleanly.

## Implementation Decisions

- Convert the project into a pnpm workspace monorepo orchestrated by Turborepo.
- Keep the existing Next frontend as the web app workspace.
- Add a separate NestJS API workspace for authoritative server behavior.
- Add a shared contracts workspace for DTOs, event names, and validation-safe types shared between frontend and API.
- The API server is authoritative for Room lifecycle, Invite Links, Player identity, Host-Verified Buy-Ins, Seats, Waitlists, Seat Offers, and realtime Room state.
- The first slice intentionally stops before Live Hand play, poker action validation, hand evaluation, side pots, and settlement.
- Use Postgres as the durable source of truth.
- Use TypeORM for persistence mapping in the NestJS API.
- Use persistent opaque httpOnly session cookies for browser-based guest identity.
- Do not introduce accounts, passwords, wallets, deposits, withdrawals, or in-app escrow.
- A Player may participate in at most one active Room at a time in version 1.
- A Room is private and accessed through an unguessable Invite Link.
- The Invite Link is not the internal Room identifier.
- The Room Host can rotate an Invite Link without affecting already-present Players.
- Room settings that affect fairness are editable before the first Hand starts and locked afterward.
- The Room Host approves or rejects Buy-Ins after payment is handled outside the app.
- A Buy-In must become a Host-Verified Buy-In before it creates a Table Stack.
- A Player must have a Host-Verified Buy-In before claiming a Seat or joining the Waitlist.
- A Waitlist is not spectator mode; waitlisted Players cannot spectate the Table.
- Seat Offers are created for waitlisted Players when Seats open and must be accepted before the Player occupies the Seat.
- REST endpoints use at most one path parameter.
- REST command routes use explicit domain verbs rather than generic status patches.
- Initial REST resources include guest sessions, current Player state, Rooms, Invite Links, Buy-Ins, Seats, Waitlist participation, and Seat Offers.
- Initial command examples include creating a guest session, updating Display Name, creating a Room, rotating an Invite Link, joining an Invite Link, requesting a Buy-In, approving or rejecting a Buy-In, claiming or leaving a Seat, joining or leaving the Waitlist, and accepting or declining a Seat Offer.
- Use Socket.IO gateways for realtime Room state.
- Realtime events should be coarse-grained state-change events such as Room updated, Buy-In updated, Seat updated, Waitlist updated, Seat Offer created or updated, and Player updated.
- REST snapshots remain the recovery path after missed or stale realtime events.
- Broad Room updates use Room channels; targeted prompts use private Player channels.
- The existing frontend should be preserved during monorepo migration, then progressively wired to server-backed state.

## Testing Decisions

- Tests should verify external behavior and domain outcomes rather than implementation details.
- Monorepo migration should be tested by running the web app build and API test/build commands through the workspace task runner.
- The session module should be tested for guest creation, persistent cookie issuance, Player reuse, sign-out behavior if implemented, and Display Name updates.
- The Room module should be tested for private Room creation, Invite Link lookup, Invite Link rotation, one active Room participation per Player, settings validation, and settings lock behavior.
- The Buy-In module should be tested for request validation, Host-only approval and rejection, rejection of non-Host decisions, and prevention of seating before Host verification.
- The seating module should be tested for claiming open Seats, refusing unverified Players, leaving Seats, fixed Seat capacity, and preventing duplicate Seats.
- The Waitlist module should be tested for FIFO ordering, no spectating permission, eligibility only after Host-Verified Buy-In, leaving the Waitlist, and persistence across refreshes.
- The Seat Offer module should be tested for offer creation when a Seat opens, targeted acceptance, decline, expiration behavior, and movement to the next eligible waitlisted Player.
- The realtime gateway should be tested for authenticated Socket.IO connections, Room channel subscription authorization, private Player event targeting, and event emission after state-changing commands.
- API route tests should assert the single-parameter route convention for new command routes where practical.
- Shared contracts should be tested or type-checked so frontend and API event/DTO names remain aligned.
- Current frontend stories are useful prior art for expected screen states, but the repo does not yet have backend tests to copy.
- Future poker evaluator tests should be extensive and contract-like, but the evaluator is out of scope for this first slice.

## Out of Scope

- Live Hand play.
- Player Actions such as fold, check, call, bet, Raise To, and all-in.
- Turn Timer enforcement.
- Deck order, dealing, board cards, and private cards.
- Pot settlement, side pots, showdown, and Hand history settlement.
- The owned No Limit Texas Hold'em hand evaluator.
- In-process Room Actors for Live Hands.
- Redis-backed room ownership or multi-instance scaling.
- True escrow, wallets, deposits, withdrawals, cashout, or payment processing.
- Public Room discovery.
- Spectator mode.
- Accounts, passwords, email login, OAuth, or persistent user profiles beyond guest cookie identity.
- Multiple active Rooms per Player.
- Tournaments, Omaha, limit poker, or non-cash Room variants.

## Further Notes

This PRD follows the domain glossary in the project context and the recorded ADRs for the authoritative game server, Host-Verified Buy-Ins, REST plus Socket.IO, monorepo structure, pnpm plus Turborepo, NestJS, Socket.IO gateways, Postgres plus TypeORM, persistent guest session cookies, and single-parameter REST routes.

The first implementation slice is intentionally a multiplayer lobby foundation. It should make the existing frontend real enough for Players and Room Hosts to coordinate private Rooms, Buy-Ins, Seats, Waitlists, and Seat Offers before the project implements the poker engine.

## Implementation progress

- API behavior for guest Player sessions, private Rooms, Invite Links, Host-Verified Buy-Ins, Seats, Waitlists, Seat Offers, and Socket.IO Room/Player events is implemented and covered by integration tests.
- The web app now creates/resumes Player sessions, creates Rooms through the API, renders returned Room state, and refetches Room snapshots after realtime Room updates.
- Remaining follow-up work: persist lobby state through Postgres/TypeORM instead of the current in-process store, add full waiting-room controls for Seats/Table Stacks and targeted Seat Offers, and cover fairness-setting locks once first-Hand state exists.
