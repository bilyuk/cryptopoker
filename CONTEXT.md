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

**Blockchain-Backed Room**:
A **Room** whose **Buy-Ins** and checkouts settle through on-chain escrow using native USDC on Base.
_Avoid_: Multi-chain room, ETH room, token room

**Buy-In**:
The dollar-denominated amount a **Player** requests to convert into a **Table** stack.
_Avoid_: Deposit, wallet balance

**Top-Up**:
An additional blockchain-backed **Buy-In** that increases a **Player**'s **Table Stack** in a **Blockchain-Backed Room**.
_Avoid_: Re-buy, reload, deposit

**Anti-Ratholing**:
A **Room** policy that limits how quickly a checked-out **Player** can rejoin the same **Room** with a smaller **Buy-In**.
_Avoid_: Cooldown, penalty, cashout lock

**Host-Verified Buy-In**:
A **Buy-In** approved by the **Room Host** after payment is handled outside the app.
_Avoid_: Escrow, in-app payment

**Escrowed Buy-In**:
A **Buy-In** confirmed as funded in the on-chain escrow for a **Blockchain-Backed Room**.
_Avoid_: Signed buy-in, pending transaction, wallet approval

**Funding Hold**:
A temporary **Seat** hold while a **Player**'s blockchain-backed **Buy-In** is waiting for escrow confirmation.
_Avoid_: Reservation, Seat Offer, occupied Seat

**Funded Awaiting Seat**:
A **Player** state in a **Blockchain-Backed Room** where an **Escrowed Buy-In** exists but no **Seat** is currently occupied.
_Avoid_: Failed funding, expired deposit, stranded funds

**Escrow Refund**:
A return of escrowed USDC to a **Player**'s **Connected Wallet** before that **Player** is seated.
_Avoid_: Chargeback, reversal, payout

**Connected Wallet**:
A crypto wallet address controlled by a **Player** and used for blockchain-backed **Buy-Ins** and checkouts.
_Avoid_: Account, app wallet, custodial wallet

**Bound Wallet**:
The **Connected Wallet** address locked to a **Player**'s deposits in one **Blockchain-Backed Room**.
_Avoid_: Payout address, account wallet, default wallet

**Table Stack**:
The dollar-denominated chips a seated **Player** has available at the **Table**.
_Avoid_: Bankroll, wallet balance

**Checkout**:
A **Player** request to leave a **Blockchain-Backed Room** and receive a USDC payout for their **Table Stack**.
_Avoid_: Cashout, withdrawal, leaving a seat

**Payout Authorization**:
A **Room Host** signature authorizing an exact **Checkout** payout from a **Blockchain-Backed Room**.
_Avoid_: Backend approval, admin payout, manual payment

**Room Solvency**:
The condition that a **Blockchain-Backed Room**'s escrowed USDC covers that **Room**'s unpaid checkout and refund obligations.
_Avoid_: Platform balance, wallet balance, treasury balance

**Host-Arbitrated Payouts**:
The trust model where the **Room Host** authorizes checkout amounts for a **Blockchain-Backed Room**.
_Avoid_: Trustless payouts, platform custody, automated arbitration

**Room Settlement Key**:
A scoped signing key delegated by the **Room Host** to authorize automatic **Checkout** payouts for one **Blockchain-Backed Room**.
_Avoid_: Platform wallet, global payout key, admin key

**Settlement Frozen**:
A **Blockchain-Backed Room** state where normal **Checkout** payouts are suspended after settlement authority is revoked or unavailable.
_Avoid_: Paused Room, Closed Room, deleted Room

**Locked Escrow**:
Escrowed USDC that has been converted into a seated **Player**'s **Table Stack**.
_Avoid_: Locked wallet balance, committed deposit

**Emergency Exit**:
A self-service return of a **Player**'s remaining escrowed deposits from a **Settlement Frozen** **Blockchain-Backed Room** after a delay.
_Avoid_: Dispute payout, arbitration, platform refund

**Gas Share**:
A **Player**'s equal share of backend-relayed on-chain transaction costs while their escrow is **Locked Escrow** in a **Blockchain-Backed Room**.
_Avoid_: Platform fee, rake, host fee

**Contract Room Lifecycle**:
The fund-movement states of a **Blockchain-Backed Room** as tracked by the escrow contract.
_Avoid_: Table lifecycle, Hand state, product Room lifecycle

## Relationships

- A **Player** has exactly one current **Display Name**
- A **Display Name** is not unique across **Players**
- A **Player** may change their **Display Name** outside a **Live Hand**
- A **Player** may participate in at most one active **Room** at a time in version 1
- A **Room** is private and accessible through an **Invite Link** in version 1
- A **Room** is a **No Limit Texas Hold'em Cash Room** in version 1
- A **Room** has exactly one **Table** in version 1
- A **Room** has exactly one **Room Host**
- A **Blockchain-Backed Room** uses native USDC on Base in the first blockchain-backed version
- A **Blockchain-Backed Room** uses Circle's native USDC contract on Base, not bridged USDC variants
- A **Blockchain-Backed Room** does not accept ETH, USDT, wrapped USDC, custom tokens, or multiple chains in the first blockchain-backed version
- A **Blockchain-Backed Room** does not provide fiat on-ramps, fiat off-ramps, token swaps, custodial balances, or KYC collection in the first blockchain-backed version
- A **Blockchain-Backed Room** still relies on the authoritative API for **Table Stack** accounting and checkout amounts
- A **Blockchain-Backed Room** has a **Room Host** whose **Connected Wallet** authorizes payout settlement for that **Room**
- A **Blockchain-Backed Room** uses **Host-Arbitrated Payouts**
- A **Blockchain-Backed Room** must maintain **Room Solvency**
- A **Blockchain-Backed Room** may define a per-**Player** maximum total **Buy-In** amount
- A **Blockchain-Backed Room** may enforce **Anti-Ratholing** for the same **Player** rejoining the same **Room**
- **Anti-Ratholing** is enabled by default for **Blockchain-Backed Rooms** and may be disabled by the **Room Host** at Room creation
- A **Player** has at most one **Bound Wallet** per **Blockchain-Backed Room**
- A **Bound Wallet** is established by the **Player**'s first escrowed funding action in that **Blockchain-Backed Room**
- A **Bound Wallet** may be an externally owned wallet or a smart contract wallet
- A **Player** may use different **Bound Wallets** in different **Blockchain-Backed Rooms**
- **Room Solvency** is increased by **Escrowed Buy-Ins** and reduced by **Checkout** payouts and **Escrow Refunds**
- A **Room Settlement Key** belongs to exactly one **Blockchain-Backed Room**
- A **Room Settlement Key** is delegated by the **Room Host** and may expire or be revoked
- A **Checkout** in a **Blockchain-Backed Room** pays native USDC to the **Player**'s **Connected Wallet**
- A **Checkout** payout requires a **Payout Authorization** for the exact **Room**, **Player**, amount, and nonce
- A **Checkout** payout for a **Blockchain-Backed Room** must be sent to the **Player**'s **Bound Wallet**
- **Escrow Refunds** and **Emergency Exits** must be sent to the **Player**'s **Bound Wallet**
- A **Payout Authorization** may be signed by the **Room Host** or by an active **Room Settlement Key** for that **Room**
- A **Payout Authorization** must not violate **Room Solvency**
- Revoking a **Room Settlement Key** may make a **Blockchain-Backed Room** **Settlement Frozen**
- A **Settlement Frozen** **Blockchain-Backed Room** does not create new **Hands** or process normal **Checkouts**
- A **Settlement Frozen** **Blockchain-Backed Room** may resume normal settlement if the **Room Host** delegates a new **Room Settlement Key** before **Emergency Exit** is available
- **Emergency Exit** returns remaining escrowed deposits, not the **Player**'s current **Table Stack**
- A **Blockchain-Backed Room** may be closed on-chain only after its escrowed USDC balance is zero
- Backend-relayed on-chain transaction costs for a **Blockchain-Backed Room** are split equally through **Gas Shares**
- A **Gas Share** applies only while the **Player** has **Locked Escrow** in the **Blockchain-Backed Room**
- A **Gas Share** is calculated when the backend-relayed transaction is recorded for the **Blockchain-Backed Room**
- A **Gas Share** is deducted from the **Player**'s **Checkout** payout or other escrow exit
- A **Gas Share** does not change the **Player**'s **Table Stack** during play
- A **Blockchain-Backed Room** charges no platform rake in the first blockchain-backed version
- Public access to **Blockchain-Backed Rooms** requires jurisdiction allow-listing after legal review
- A **Checkout** should not require the **Player** to submit a second wallet transaction after requesting it in the app
- A **Checkout** may be requested during a **Live Hand**, but payout settlement waits until that **Hand** settles
- A **Checkout** removes the **Player** from future **Hands** once requested
- An **Invite Link** is not the same as the internal **Room** identifier
- A **Room Host** may rotate the **Invite Link** without affecting already-present **Players**
- A **Room Host** may edit **Room** settings before the first **Hand**
- After the first **Hand** starts, only the **Room** name and **Invite Link** may change
- A **Table** belongs to exactly one **Room**
- A **Table** has a fixed number of **Seats**
- A **Seat** is occupied by at most one **Player**
- A **Funding Hold** may temporarily prevent other **Players** from claiming a **Seat**
- A **Funding Hold** is not an occupied **Seat** and does not create a **Table Stack**
- An **Escrowed Buy-In** remains valid if its **Funding Hold** expires before confirmation
- A **Player** with an **Escrowed Buy-In** and no **Seat** is **Funded Awaiting Seat**
- A **Player** who is **Funded Awaiting Seat** should be seated automatically when a **Seat** is open, otherwise placed on the **Waitlist**
- A **Player** who is **Funded Awaiting Seat** may request an **Escrow Refund**
- **Locked Escrow** cannot be cancelled through an **Escrow Refund**
- **Locked Escrow** begins only after the escrow contract confirms the **Player**'s escrow has been locked for seating
- A **Player** must not be dealt into a **Hand** until their escrow is **Locked Escrow**
- **Sitting Out** does not unlock **Locked Escrow**
- A seated **Player** may request a **Top-Up** only between **Hands**
- A **Top-Up** requested during a **Live Hand** waits until that **Hand** settles
- A seated **Player**'s confirmed **Top-Up** becomes **Locked Escrow** before increasing their **Table Stack**
- Pending **Top-Ups** are visible to **Players** at the **Table**
- **Anti-Ratholing** applies to **Checkout** followed by rejoining the same **Room**, not to **Top-Ups**
- **Anti-Ratholing** uses the **Player**'s most recent **Checkout** amount in that **Room**
- **Anti-Ratholing** is enforced before seating; it does not prevent **Escrow Refunds**
- A **Room**'s maximum total **Buy-In** amount overrides **Anti-Ratholing** when the two conflict
- A **Waitlist** belongs to exactly one **Room**
- A **Player** may be on the **Waitlist** only when they have a **Host-Verified Buy-In** or **Escrowed Buy-In** and do not occupy a **Seat** in that **Room**
- A **Seat Offer** is made to the first eligible **Player** on the **Waitlist** when a **Seat** opens
- A **Seat Offer** must be accepted before the **Player** occupies the **Seat**
- A **Buy-In** must become a **Host-Verified Buy-In** before it creates a **Table Stack**
- Blockchain-backed **Buy-Ins** require the **Player** to use a **Connected Wallet**
- A blockchain-backed **Buy-In** must become an **Escrowed Buy-In** before it creates a **Table Stack**
- A **Player** must have a **Host-Verified Buy-In** or **Escrowed Buy-In** before occupying a **Seat**
- The app must not custody a **Player**'s funds or operate a **Connected Wallet** for a **Player**
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
- **Host-Verified Buy-In** and **Escrowed Buy-In** are parallel buy-in modes; do not use host verification language for **Blockchain-Backed Rooms**.
- A signed wallet request is not an **Escrowed Buy-In**; escrow requires on-chain confirmation.
- **Funding Hold** expiration does not invalidate an **Escrowed Buy-In**; it only releases the specific **Seat** hold.
- **Escrowed Buy-In** is an on-chain funding state; **Funded Awaiting Seat** is the product state for a funded **Player** without a **Seat**.
- **Top-Up** is distinct from leaving and rejoining a **Room**.
- **Anti-Ratholing** is a per-**Room** fairness policy, not a blockchain escrow rule.
- A **Connected Wallet** may disconnect from the browser without changing the **Bound Wallet** for a **Blockchain-Backed Room**.
- Changing **Bound Wallets** means completing **Checkout** and rejoining the **Room** with a different **Connected Wallet**.
- "No rake" means the platform takes no percentage of pots, **Buy-Ins**, **Top-Ups**, or **Checkouts**.
- "wallet" does not mean **Player** identity; when blockchain-backed funds are involved, use **Connected Wallet** for the crypto address controlled by the **Player**.
- "checkout" is not the same as simply leaving a **Seat**; in a **Blockchain-Backed Room**, **Checkout** includes payout settlement.
- The backend relays **Payout Authorizations** and pays gas; it must not be the unilateral authority for payouts.
- A **Room Settlement Key** is a scoped delegate for one **Blockchain-Backed Room**, not a platform payout wallet.
- **Room Solvency** belongs to one **Blockchain-Backed Room**; one **Room**'s escrowed USDC must not pay another **Room**'s obligations.
- **Host-Arbitrated Payouts** means **Blockchain-Backed Rooms** are non-custodial against the platform, not trustless against the **Room Host**.
- **Emergency Exit** is a fail-safe for broken settlement, not a way to adjudicate disputed **Table Stacks**.
- **Gas Shares** are reimbursement for Room on-chain execution costs, not poker rake.
- A **Contract Room Lifecycle** is separate from the product lifecycle of **Rooms**, **Tables**, and **Hands**.
