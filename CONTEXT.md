# Cryptopoker

Cryptopoker is a private-table poker experience with dollar-denominated table chips, browser-persistent guest identity, and no in-app custody in version 1. The context exists to define the language around guest players, rooms, seats, buy-ins, and server-authoritative poker play.

## Language

**Player**:
A person participating in poker through a browser-persistent guest identity, without implying an account or wallet.
_Avoid_: Account, user, wallet

**Display Name**:
A table-visible label chosen by a **Player**.
_Avoid_: Username, account name

**Room**:
An inviteable private poker space with shared settings and access.
_Avoid_: Table when referring to invite links or room settings

**Invite Link**:
An unguessable link that grants access to a private **Room**.
_Avoid_: Room ID, public listing

**Table**:
The poker surface inside a **Room** where seats, stacks, hands, pots, and turns exist.
_Avoid_: Room when referring to active hand state

**Seat**:
A numbered position at a **Table** that may be empty or occupied by one **Player**.
_Avoid_: Slot, chair

**Waitlist**:
The ordered set of **Players** waiting for a **Seat** in a full **Room** without spectating the **Table**.
_Avoid_: Spectators, rail, viewers

**Seat Offer**:
A temporary opportunity for a waitlisted **Player** to claim an open **Seat**.
_Avoid_: Reservation when the seat has not been accepted

**Room Host**:
The **Player** who creates a **Room** and verifies buy-ins for that **Room** in version 1.
_Avoid_: Escrow provider, banker

**Hand**:
A single deal of poker from blinds and private cards through pot settlement.
_Avoid_: Game when referring to one deal

**Live Hand**:
A **Hand** that has been dealt and has not yet been settled.
_Avoid_: Active game

**Player Action**:
An intent submitted by the **Player** whose turn it is during a **Live Hand**.
_Avoid_: Move, command when discussing poker play

**Raise To**:
A **Player Action** that sets the acting **Player**'s total committed amount for the betting round to a higher value.
_Avoid_: Raise by, increase by

**Turn Timer**:
The server-owned deadline for the current **Player Action** during a **Live Hand**.
_Avoid_: Client countdown

**Sitting Out**:
A seated **Player** state that excludes the **Player** from new **Hands** without removing their **Seat**.
_Avoid_: Disconnected when the player may return

**Dealing Paused**:
A **Table** state where no new **Hand** will start even though the **Room** remains open.
_Avoid_: Closed, stopped

**Closed Room**:
A **Room** state that prevents new joins, cancels pending **Buy-Ins**, clears the **Waitlist**, and preserves history.
_Avoid_: Deleted room

**No Limit Texas Hold'em Cash Room**:
A **Room** where seated **Players** play No Limit Texas Hold'em hands with dollar-denominated **Table Stacks**.
_Avoid_: Tournament, Omaha, limit poker

**Buy-In**:
The dollar-denominated amount a **Player** requests to convert into a **Table** stack.
_Avoid_: Deposit, wallet balance

**Host-Verified Buy-In**:
A **Buy-In** approved by the **Room Host** after payment is handled outside the app.
_Avoid_: Escrow, in-app payment

**Table Stack**:
The dollar-denominated chips a seated **Player** has available at the **Table**.
_Avoid_: Bankroll, wallet balance

## Relationships

- A **Player** has exactly one current **Display Name**
- A **Display Name** is not unique across **Players**
- A **Player** may change their **Display Name** outside a **Live Hand**
- A **Player** may participate in at most one active **Room** at a time in version 1
- A **Room** is private and accessible through an **Invite Link** in version 1
- A **Room** is a **No Limit Texas Hold'em Cash Room** in version 1
- A **Room** has exactly one **Table** in version 1
- A **Room** has exactly one **Room Host**
- An **Invite Link** is not the same as the internal **Room** identifier
- A **Room Host** may rotate the **Invite Link** without affecting already-present **Players**
- A **Room Host** may edit **Room** settings before the first **Hand**
- After the first **Hand** starts, only the **Room** name and **Invite Link** may change
- A **Table** belongs to exactly one **Room**
- A **Table** has a fixed number of **Seats**
- A **Seat** is occupied by at most one **Player**
- A **Waitlist** belongs to exactly one **Room**
- A **Player** may be on the **Waitlist** only when they have a **Host-Verified Buy-In** and do not occupy a **Seat** in that **Room**
- A **Seat Offer** is made to the first eligible **Player** on the **Waitlist** when a **Seat** opens
- A **Seat Offer** must be accepted before the **Player** occupies the **Seat**
- A **Buy-In** must become a **Host-Verified Buy-In** before it creates a **Table Stack**
- A **Player** must have a **Host-Verified Buy-In** before occupying a **Seat**
- A **Table Stack** exists only inside one **Room**
- A **Room Host** may remove a **Player** only outside a **Live Hand**
- A **Room Host** may not change cards, force another **Player**'s live action, or edit **Table Stacks** during a **Live Hand**
- A **Player Action** during a **Live Hand** is one of fold, check, call, bet, **Raise To**, or all-in
- A **Turn Timer** expiring creates an automatic check when checking is legal, otherwise an automatic fold
- A disconnected **Player** remains in the **Live Hand** until normal poker rules or timeout behavior resolve their participation
- A disconnected **Player** may become **Sitting Out** after the **Live Hand** ends
- A seated **Player** may choose **Sitting Out** for future **Hands**, but not to escape a **Live Hand**
- The first **Hand** starts when the **Room Host** starts it with at least two seated **Players** who are not **Sitting Out**
- Later **Hands** start automatically after a short intermission unless the **Table** is **Dealing Paused** or has fewer than two eligible **Players**
- A **Room Host** may set **Dealing Paused** only between **Hands**
- A **Room Host** may close a **Room** between **Hands**
- A close request during a **Live Hand** closes the **Room** after that **Hand** settles

## Example Dialogue

> **Dev:** "If two people both enter `riverrat`, are they the same **Player**?"
> **Domain expert:** "No. `riverrat` is only a **Display Name**; it is not identity."
>
> **Dev:** "Does a **Player** disappear when the tab closes?"
> **Domain expert:** "No. A **Player** is remembered by a persistent guest session cookie on that browser."
>
> **Dev:** "If a **Player** changes their **Display Name**, does past hand history change?"
> **Domain expert:** "No. History keeps the display-name snapshot used at the time."
>
> **Dev:** "Can the same browser sit in two **Rooms** at once?"
> **Domain expert:** "No. In version 1, a **Player** has at most one active **Room** participation."
>
> **Dev:** "Does the invite link point to the **Table**?"
> **Domain expert:** "No. The invite link opens the **Room**; the **Table** is where the hand is played after taking a seat."
>
> **Dev:** "Can someone join by guessing a **Room** ID?"
> **Domain expert:** "No. Access requires an unguessable **Invite Link**."
>
> **Dev:** "If the **Room Host** rotates the **Invite Link**, are seated **Players** removed?"
> **Domain expert:** "No. Rotation only invalidates old links for future access."
>
> **Dev:** "Can the **Room Host** change blinds after play starts?"
> **Domain expert:** "No. Blinds, buy-in range, seat count, and action timer lock when the first **Hand** starts."
>
> **Dev:** "Can someone on the **Waitlist** watch the current hand?"
> **Domain expert:** "No. The **Waitlist** is only for waiting on a **Seat**; it is not spectator mode."
>
> **Dev:** "If a **Seat** opens, do we immediately put the first waitlisted **Player** in it?"
> **Domain expert:** "No. We create a **Seat Offer** first; the **Player** must accept before becoming seated."
>
> **Dev:** "Does the app escrow a **Buy-In**?"
> **Domain expert:** "No. In version 1, payment is handled outside the app and the **Room Host** approves a **Host-Verified Buy-In**."
>
> **Dev:** "Can an invited **Player** take an open **Seat** before the **Room Host** verifies their **Buy-In**?"
> **Domain expert:** "No. Host verification comes before seating or waitlisting."
>
> **Dev:** "Can the **Room Host** kick a **Player** during a pot?"
> **Domain expert:** "No. Host powers apply around play; they must not alter a **Live Hand**."
>
> **Dev:** "Should the API accept `raiseBy: 40`?"
> **Domain expert:** "No. Use **Raise To** so the amount means the acting **Player**'s total commitment for the betting round."
>
> **Dev:** "If a **Turn Timer** expires while a **Player** faces a bet, should we call for them?"
> **Domain expert:** "No. Timeout never commits more chips; it checks when possible and otherwise folds."
>
> **Dev:** "Does disconnecting fold a **Player** immediately?"
> **Domain expert:** "No. Disconnecting is not a **Player Action**; their **Turn Timer** still governs check-or-fold behavior."
>
> **Dev:** "Can a **Player** sit out on the turn?"
> **Domain expert:** "They can choose to be **Sitting Out** for future **Hands**, but they remain responsible for the current **Live Hand**."
>
> **Dev:** "Does the **Room Host** need to click deal every **Hand**?"
> **Domain expert:** "No. The first **Hand** is host-started; later **Hands** auto-deal unless **Dealing Paused** or too few eligible **Players** remain."
>
> **Dev:** "Does closing a **Room** delete the history?"
> **Domain expert:** "No. A **Closed Room** rejects new participation but keeps the record of what happened."

## Flagged Ambiguities

- "name" in the product means **Display Name**, not an account identity.
- "guest" means no account is required; it does not mean the **Player** disappears when the tab closes.
- "room" and "table" were used interchangeably in early UI copy; resolved: a **Room** is the inviteable space, and a **Table** is the poker surface inside it.
- "invite link" must not be treated as a public **Room** ID; it is the access mechanism for a private **Room**.
- "waitlist" does not mean spectators or viewers; waitlisted **Players** are waiting for a **Seat** and cannot spectate the **Table**.
- "escrow" is avoided in version 1 because the app does not custody funds; the canonical term is **Host-Verified Buy-In**.
