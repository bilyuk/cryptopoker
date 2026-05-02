# TODOs

Issues deferred from the Velvet Room redesign (`/plan-eng-review`, 2026-05-01).

---

## Server-side enforcement of "no spectating" rule

**What:** Today, `RoomDto` includes the full players array, buy-ins, seats, waitlist, and seat offers, sent unfiltered to every Player who has joined the Room — including unverified Players and Players on the Waitlist. CONTEXT.md says "the Waitlist is only for waiting on a Seat; it is not spectator mode," but FE-only panel hiding doesn't enforce that — the data still goes over the wire.

**Why:** Domain rule is currently aspirational. A motivated unverified Player or waitlisted Player can read the seated roster, table stacks, and pending Seat Offers from the WebSocket payload directly.

**Pros:**
- Closes a domain-rule gap.
- Sets the pattern for any future scope-restricted DTOs (e.g., spectators in v2).

**Cons:**
- Non-trivial refactor: either player-scoped serialization (`toRoomDto(room, viewer)`) or two DTO shapes (full vs. restricted).
- Realtime fan-out has to choose which shape per recipient — touches `realtime.service.ts`.
- Tests double in surface area.

**Context:** Found by codex outside-voice review on 2026-05-01 during /plan-eng-review of the Velvet Room redesign. Filed `apps/api/src/lobby/lobby.gateway.ts:43` (joined-room auth only), `apps/api/src/lobby/realtime.service.ts:20` (broadcasts to room channel without per-player filtering), `packages/contracts/src/room.ts:46` (RoomDto includes everything).

**Depends on / blocked by:** None. Independent. Can land any time; suggest after the Velvet Room redesign ships so the FE side stops needing to hide the data.

---

## `POST /rooms/:id/leave` endpoint

**What:** Add a server-side leave-room mutation. It vacates the Player's seat (if any), removes them from the waitlist, cancels any pending seat offer for them, and clears `activeRoomIdByPlayerId`. The existing "Leave Room" button on the room screen calls this endpoint instead of just navigating away.

**Why:** Today, "Leave Room" only changes the FE screen (`apps/web/app/page.tsx:42`). The server still considers the Player active. They can't join or create another Room until the session is forgotten because of `assertNoActiveRoom` (`apps/api/src/lobby/lobby.store.ts:225`). This causes confusing "ONE_ACTIVE_ROOM" errors on otherwise-clean flows. The redesign makes the mismatch more visible because seated/waitlist state is more prominent.

**Pros:**
- Fixes a real bug visible to users.
- Removes a class of "I closed the tab and now I'm stuck" support questions.

**Cons:**
- Has to handle in-progress Live Hand correctly per CONTEXT.md ("a Live Hand resolves under normal poker rules"); cannot just yank a seated Player mid-hand.
- Must trigger Seat Offer creation for any waitlisted Player when seat vacates.

**Context:** Found by codex outside-voice review on 2026-05-01 during /plan-eng-review of the Velvet Room redesign. Filed `apps/web/app/page.tsx:42` (FE-only nav), `apps/api/src/lobby/lobby.store.ts:225` (`assertNoActiveRoom` blocking re-join).

**Depends on / blocked by:** None. Independent.

---

## Public-rooms cleanup (referenced in office hours, separate cleanup)

**What:** Audit and remove any UI traces or copy referencing public/discoverable Rooms. CONTEXT.md is already clear: rooms are private and accessible by Invite Link in v1.

**Why:** User flagged this in /office-hours: "remove the public rooms, we had a decision to remove those." Unclear scope; likely lobby/dashboard text or stale Storybook copy.

**Context:** Mentioned during /office-hours, deferred from the Velvet Room redesign. Run a grep for "public room" / "discover" / "browse rooms" across the codebase to scope.

**Depends on / blocked by:** None.

---

## Dev-loop WS recovery: surviving tsx-watch restarts

**What:** During development, every time the API code is edited, `tsx watch` restarts the API process and wipes the in-memory `SessionStore`. The browser still has the `cryptopoker_session` cookie pointing at the now-dead sessionId. The FE's Socket.IO client tries to reconnect, the gateway's `handleConnection` calls `currentPlayerFromCookie(...).require()`, throws, calls `client.disconnect(true)`. Per Socket.IO docs, the client does NOT auto-recover from `io server disconnect`. Realtime is dead until the user reloads the page.

**Why:** Real friction during dev iteration on the API. Symptoms look like a WS bug ("events stop arriving after I save a file") but the root cause is session eviction. Production behavior is unaffected because there's no hot-reload.

**Pros (of fixing):**
- Saves several minutes of confusion per dev session.
- Removes a class of red herring during /investigate runs (this exact path consumed an hour today).
- Makes the realtime contract more believable in dev — what works in tests works in the browser.

**Cons (of fixing):**
- Requires non-trivial work: persist `SessionStore` to disk/DB, OR teach the FE to detect auth-fail-on-WS-reconnect and re-issue a guest session.
- Persisting sessions means picking a backing store (sqlite, JSON file, or extend the existing TypeORM/Postgres setup in `apps/api/src/database/`).

**Two reasonable fixes (pick one):**
1. **Persist `SessionStore`.** Replace the in-memory `Map` in `apps/api/src/sessions/session.store.ts:14-15` with a Postgres-backed store using the existing TypeORM setup. Sessions survive tsx-watch and feel like production. Touches: `session.store.ts`, new entity, migration. Smallest behavioral surface area.
2. **FE reconnect-on-auth-failure.** In `apps/web/lib/use-room-client.ts`, listen for `socket.on("disconnect", reason => ...)`. If `reason === "io server disconnect"`, hit `GET /players/current`; if 404, drop to welcome screen. If 200, reconnect (with the still-valid cookie). Lighter change but only addresses dev — same UX in production for any future "session evicted" scenario, which is good.

**Context:** Discovered during /investigate on 2026-05-02 while verifying the Velvet Room redesign in the browser. Realtime works in `apps/api/test/realtime.spec.ts` (passes). Realtime works in a stable dev session (verified live: triggered buy-in via curl while host watched the FE, pending banner appeared without reload; after Approve, seat filled without reload). Issue only manifests after a tsx-watch restart.

**Depends on / blocked by:** None.
