# PRD: Blockchain-Backed Room Escrow

Status: needs-triage

## Problem Statement

Cryptopoker currently models real-money trust socially: a **Room Host** verifies **Buy-Ins** outside the app, the API creates **Table Stacks**, and leaving a **Seat** only clears the local stack. This works for private friend groups, but it makes the Host the de facto banker and leaves no automatic checkout path for Players who want their funds returned without manual coordination.

The product needs a least-resistance blockchain-backed path where Players freeze native USDC on Base, receive dollar-denominated **Table Stacks** only after funds are confirmed in escrow, and receive automatic USDC payouts when they complete **Checkout**. The solution must avoid building a new blockchain, avoid platform custody, preserve the authoritative poker server boundary, and remain honest that payouts are **Host-Arbitrated Payouts**, not trustless poker adjudication.

## Solution

Add **Blockchain-Backed Rooms** as a Room mode that uses a shared immutable escrow contract on Base with native USDC. Players connect their own wallets, fund **Buy-Ins** and **Top-Ups** through Permit2, wait for confirmed escrow, and become seated only after their escrow is locked. The API remains authoritative for poker state, **Table Stack** accounting, seat lifecycle, waitlist behavior, hand boundaries, and proposed checkout amounts.

Checkout remains automatic from the Player's perspective. A **Room Host** delegates a scoped **Room Settlement Key** for one Room, allowing the backend to relay payout transactions without asking the Host to approve every checkout in a wallet popup. The escrow contract verifies Room-scoped payout authorization, enforces **Room Solvency**, prevents cross-Room fund movement, supports unseated refunds, and provides **Settlement Frozen** plus **Emergency Exit** containment when settlement authority is revoked or unavailable.

The first version uses native USDC on Base only, no platform rake, no fiat ramps, no swaps, no custodial balances, and no KYC collection. Backend-relayed gas is reimbursed by Players through equal **Gas Shares** rather than absorbed by the platform or hidden as a fee. Public launch is gated on legal review, jurisdiction allow-listing, audit, and launch controls.

## User Stories

1. As a Player, I want to join a **Blockchain-Backed Room**, so that my **Buy-In** is protected by on-chain escrow instead of Host trust alone.
2. As a Player, I want to connect a **Connected Wallet**, so that I can fund a Room with my own native USDC on Base.
3. As a Player, I want the app to distinguish my **Player** identity from my **Connected Wallet**, so that my guest session and crypto address are not treated as the same concept.
4. As a Player, I want my first escrow funding action to establish a **Bound Wallet** for that Room, so that all later refunds and payouts have a clear destination.
5. As a Player, I want to use different **Bound Wallets** in different Rooms, so that I can segregate funds by Room.
6. As a Player, I want the app to prevent me from switching **Bound Wallets** mid-Room, so that payouts and dispute receipts stay unambiguous.
7. As a Player, I want the app to tell me when I need native USDC on Base, so that I do not accidentally try to fund with ETH, USDT, bridged USDC, or the wrong chain.
8. As a Player, I want the app to show a clear funding prompt before I sign, so that I know I am buying in to a specific Room for a specific amount.
9. As a Player, I want first-time Permit2 or USDC authorization prompts to be labeled plainly, so that I understand what each signature or approval means.
10. As a Player, I want my **Buy-In** to remain pending until the escrow contract confirms my funding, so that no one receives chips from an unconfirmed wallet popup.
11. As a Player, I want a **Funding Hold** while my funding is pending, so that a Seat is not immediately taken by someone else during normal confirmation time.
12. As a Player, I want a slow or late confirmation not to lose my funds, so that a missed **Funding Hold** does not strand my USDC.
13. As a Player, I want to become **Funded Awaiting Seat** if my funding confirms after a hold expires, so that I can still be seated or waitlisted fairly.
14. As a Player, I want an **Escrow Refund** if I am funded but unseated, so that I can recover my USDC before I start playing.
15. As a Player, I want **Escrow Refunds** to go to my **Bound Wallet**, so that refunds cannot be redirected to a different address.
16. As a Player, I want my escrow to become **Locked Escrow** only when I am being seated, so that waitlisted funds remain cancellable.
17. As a Player, I want escrow locking to complete before I am dealt into a **Hand**, so that no one can play while still able to cancel their escrow.
18. As a Player, I want **Sitting Out** not to unlock my escrow, so that the poker state and fund state stay consistent.
19. As a Player, I want to request **Top-Ups** between **Hands**, so that I can reload my **Table Stack** like a normal cash game.
20. As a seated Player, I want a **Top-Up** requested during a **Live Hand** to wait until that **Hand** settles, so that live betting math is not changed mid-hand.
21. As a Player, I want pending **Top-Ups** to be visible at the **Table**, so that stack changes are not covert.
22. As a Player, I want a seated **Top-Up** to lock before it increases my **Table Stack**, so that funds are at risk only after they are committed.
23. As a Player, I want the Room to enforce maximum total **Buy-In** policy, so that stack sizes respect Room terms.
24. As a Room Host, I want to configure the maximum total **Buy-In** amount for a **Blockchain-Backed Room**, so that I can choose capped or deep cash-game behavior.
25. As a Room Host, I want **Anti-Ratholing** enabled by default, so that a checked-out Player cannot immediately rejoin the same Room with a much smaller stack.
26. As a Room Host, I want to disable **Anti-Ratholing** for casual Rooms, so that friend groups can choose a looser policy.
27. As a Player, I want rejoin validation to explain **Anti-Ratholing** restrictions, so that I understand why a smaller rejoin **Buy-In** is rejected.
28. As a Player, I want **Anti-Ratholing** enforced before seating rather than by trapping funds, so that I can still refund if I cannot rejoin yet.
29. As a Player, I want the Room's maximum **Buy-In** cap to override **Anti-Ratholing** when they conflict, so that I am not blocked from rejoining by incompatible policies.
30. As a Player, I want to request **Checkout**, so that I can leave the Room and receive a USDC payout for my final **Table Stack**.
31. As a Player, I want **Checkout** requested during a **Live Hand** to wait until the **Hand** settles, so that I cannot escape live risk.
32. As a Player, I want **Checkout** to remove me from future **Hands**, so that I am not dealt in after asking to leave.
33. As a Player, I want **Checkout** to pay my **Bound Wallet**, so that payouts cannot be redirected.
34. As a Player, I want **Checkout** to feel automatic in the app, so that I do not need to submit a second wallet transaction to receive funds.
35. As a Player, I want a checkout receipt with payout amount, signer, transaction hash, and gas share details, so that I can audit what happened.
36. As a Player, I want to see that the **Room Host** or **Room Settlement Key** authorized my payout, so that the trust model is visible.
37. As a Player, I want **Host-Arbitrated Payouts** disclosed before I fund, so that I understand the Host remains the payout authority for that Room.
38. As a Player, I want the Room to show the Host and settlement trust model persistently, so that the trust surface is not hidden after funding.
39. As a Player, I want the app to avoid the word "trustless," so that the product does not overstate what the escrow can guarantee.
40. As a Player, I want on-chain facts to be distinguished from platform-attested hand history, so that I know what is contract-verifiable.
41. As a Player, I want platform support to surface evidence in a dispute, so that I can reason about deposits, signatures, payouts, and hand logs.
42. As a Player, I want to understand that valid Host-signed payouts are not reversible by the platform, so that my expectations match the contract.
43. As a Player, I want **Emergency Exit** if settlement breaks down, so that my remaining escrowed deposits are not trapped forever.
44. As a Player, I want **Emergency Exit** to remain available despite global pause, so that an emergency switch cannot freeze my exit path.
45. As a Player, I want **Emergency Exit** to return deposits minus amounts already paid rather than reconstructing the poker result, so that the fail-safe is predictable.
46. As a Room Host, I want to create a **Blockchain-Backed Room** without deploying a contract per Room, so that Room creation remains fast.
47. As a Room Host, I want to authorize a **Room Settlement Key** at Room creation, so that checkout can be automatic without wallet prompts for every Player exit.
48. As a Room Host, I want **Room Settlement Key** delegation to be scoped to one Room, so that compromise cannot drain other Rooms.
49. As a Room Host, I want a default 24-hour settlement delegation TTL, so that long-lived delegation exposure is bounded.
50. As a Room Host, I want to revoke a **Room Settlement Key**, so that I can contain suspected compromise.
51. As a Room Host, I want revocation to move the Room into **Settlement Frozen** when needed, so that new normal settlement stops cleanly.
52. As a Room Host, I want to register a new **Room Settlement Key** before **Emergency Exit** becomes available, so that legitimate settlement can resume.
53. As a Room Host, I want Room creation to disclose my settlement responsibility, so that I understand my Host obligations.
54. As a Room Host, I want clear warnings that I may have gambling-law responsibility in my jurisdiction, so that I do not assume the platform has removed Host risk.
55. As a Room Host, I want no platform rake in the first blockchain-backed version, so that the Room remains aligned with private poker rather than a platform-run casino.
56. As a Room Host, I want backend-relayed gas to be split between Players through **Gas Shares**, so that I am not personally paying every settlement transaction.
57. As a Player, I want **Gas Shares** to be calculated when backend-relayed transactions occur, so that gas reimbursement is tied to actual Room activity.
58. As a Player, I want **Gas Shares** to be split only among Players with **Locked Escrow** at the time of each transaction, so that I do not pay for Room activity before joining or after leaving.
59. As a Player, I want **Gas Shares** to be deducted at escrow exit, so that my visible **Table Stack** does not change during play.
60. As a Player, I want **Gas Shares** capped at my available escrow exit amount in v1, so that I do not leave with off-chain debt.
61. As a Player, I want **Gas Shares** to be shown as reimbursement and not rake, so that costs are transparent.
62. As a backend operator, I want the backend to relay checkout and settlement transactions, so that Players get automatic UX while reimbursing gas through **Gas Shares**.
63. As a backend operator, I want to record transaction hash, gas used, effective gas price, ETH/USDC quote, locked player count, and computed **Gas Shares**, so that reimbursements are auditable.
64. As a backend operator, I want **ESCROW_CONFIRMATIONS** to default to 2 and be policy-configurable, so that confirmation latency can be tuned without changing contract flow.
65. As a backend operator, I want the funding confirmation convention documented, so that block inclusion counts consistently as confirmation 1.
66. As a backend operator, I want **ESCROW_FUNDING_HOLD_SECONDS** to default to 45, so that first-time wallet users have enough time to complete funding.
67. As a backend operator, I want **Funding Holds** persisted with server-owned expiry timestamps, so that restarts do not lose or overextend holds.
68. As a backend operator, I want event replay from the last processed block, so that escrow confirmations are not lost during backend restarts.
69. As a backend operator, I want a visible Base-delay state when blocks stop arriving, so that Players are not left staring at an unexplained pending state.
70. As a backend operator, I want a single shared event stream from one escrow contract, so that monitoring and replay are operationally simple.
71. As a backend operator, I want Room-level **Room Solvency** monitoring, so that any accounting drift pages someone immediately.
72. As a backend operator, I want per-Room delegate anomaly alerts, so that suspicious payout patterns are detected quickly.
73. As a backend operator, I want Settler keys generated per environment and held outside env vars, so that operational key handling is not casual.
74. As a backend operator, I want privileged contract actions to emit structured events, so that role use can be audited.
75. As a smart contract developer, I want one immutable shared escrow contract, so that the audit surface is concentrated.
76. As a smart contract developer, I want no upgradeable proxy in v1, so that payout logic cannot be rewritten by an upgrade key.
77. As a smart contract developer, I want a **Settler** role that can relay, lock, unlock, and transition contract Room state but cannot unilaterally pay funds, so that backend compromise is constrained.
78. As a smart contract developer, I want a **Pauser** role that can pause new **Buy-Ins** but cannot block exits, so that emergency response does not trap Player funds.
79. As a smart contract developer, I want a **Role Admin** multisig that can rotate operational keys but not change payout logic, so that recovery exists without mutable contract behavior.
80. As a smart contract developer, I want **Room Solvency** enforced on every payout, so that one Room's USDC cannot pay another Room's obligations.
81. As a smart contract developer, I want payout authorization to use typed signatures over exact Room, Player, amount, and nonce, so that signatures cannot be replayed or repurposed.
82. As a smart contract developer, I want EOA and EIP-1271 signature support, so that both ordinary wallets and smart wallets work.
83. As a smart contract developer, I want to use battle-tested signature verification libraries, so that custom signature bugs are avoided.
84. As a smart contract developer, I want reentrancy protection on payout and exit paths, so that smart wallet verification and USDC transfers do not create avoidable risk.
85. As a smart contract developer, I want Permit2 SignatureTransfer funding, so that buy-ins are one-shot authorizations rather than recurring allowances.
86. As a smart contract developer, I want the contract to reject wrong Room, wrong amount, wrong token, or wrong chain funding paths, so that only valid escrow creates **Escrowed Buy-Ins**.
87. As a frontend developer, I want screens for wallet connection, funding pending, funded awaiting seat, settlement delegation, checkout, receipts, and frozen settlement, so that Players and Hosts see the right state.
88. As a frontend developer, I want trust-model disclosure before funding, inside the Room, at Host delegation, and on checkout receipts, so that consent is not buried.
89. As a frontend developer, I want wallet prompts and transaction states to use domain language, so that Players do not confuse wallet approval, **Escrowed Buy-In**, **Locked Escrow**, and **Checkout**.
90. As a frontend developer, I want geo, age, and sanctions gates to block access before funding, so that restricted users cannot enter real-money flows.
91. As a compliance operator, I want jurisdiction allow-listing rather than block-listing, so that public access only opens where legal review has approved it.
92. As a compliance operator, I want age and legal-location self-attestation, so that user responsibility is recorded before real-money play.
93. As a compliance operator, I want wallet-risk screening before funding, so that sanctioned or high-risk wallets can be refused by the app.
94. As a compliance operator, I want no fiat on-ramp, off-ramp, token swap, KYC collection, or custodial balance in v1, so that the product remains narrowly non-custodial software.
95. As a product owner, I want public launch gated on legal review and audit, so that the team does not ship real-money poker into unknown legal and contract risk.
96. As a product owner, I want a closed invite-only alpha before public launch, so that real integration issues can be found in a controlled cohort.
97. As a product owner, I want no tournaments, multi-table play, fiat ramps, swaps, referrals, or rake in the escrow roadmap, so that scope does not delay audit and legal gates.
98. As a future maintainer, I want the escrow roadmap split into three slices, so that testnet funding, mainnet settlement alpha, and public launch hardening can be triaged separately.

## Implementation Decisions

- Add **Blockchain-Backed Room** as a Room mode alongside the existing **Host-Verified Buy-In** flow. The existing social-trust flow remains valid; **Escrowed Buy-In** is a parallel buy-in mode.
- Use Base and Circle native USDC only for blockchain-backed Rooms. The production USDC contract is pinned by ADR; bridged USDC variants, ETH, USDT, custom tokens, and multi-chain support are out of scope.
- Add an escrow smart contract module as a deep module with a small public surface: Room registration, funding, cancellation, lock/unlock, delegation, payout, pause/freeze, emergency exit, and close.
- The escrow contract is a single shared immutable contract keyed by Room and Player, not one contract per Room.
- The contract tracks only **Contract Room Lifecycle** fund states: active, settlement frozen, and closed.
- The contract does not mirror **Table**, **Seat**, **Hand**, **Waitlist**, **Sitting Out**, or **Dealing Paused** state.
- The API remains authoritative for poker state, **Table Stack** accounting, seat lifecycle, hand boundaries, waitlist behavior, and proposed payout amounts.
- The contract remains authoritative for native USDC movement, signatures, nonces, locked escrow state, room solvency, refundability, and emergency exit rules.
- Use Permit2 SignatureTransfer for funding **Buy-Ins** and **Top-Ups**. Do not use Permit2 AllowanceTransfer in v1.
- Use typed signatures for funding context, settlement delegation, and payout authorization.
- Support both EOA and EIP-1271 smart contract wallets for Player and Host signatures.
- Use battle-tested signature verification rather than custom ECDSA-only recovery.
- Treat **Room Settlement Keys**, Settler keys, and backend-generated operational keys as EOAs. Pauser and Role Admin may be smart-wallet or multisig based.
- A **Room Host** delegates a per-Room **Room Settlement Key** for automatic checkout.
- **Room Settlement Key** delegation defaults to a 24-hour TTL and can be revoked by the Host.
- A **Room Settlement Key** is scoped to one Room and one contract, with payout authorization enforced on-chain.
- The Settler relays Host-signed delegation and delegate-signed payout transactions but cannot unilaterally authorize payouts.
- The Settler can register Rooms, relay settlement actions, lock escrow before seating, unlock orphan locks, and transition contract Room state according to contract rules.
- The Pauser can pause new funding but cannot block payouts, refunds, or emergency exits.
- The Role Admin can rotate operational keys but cannot change payout logic.
- **Room Solvency** is enforced by contract accounting. Deposits increase the Room pool; refunds, cancellations, payouts, and emergency exits reduce it.
- One Room's escrowed USDC must never pay another Room's obligations.
- The contract should provide enough observable state for external monitors to detect solvency drift.
- **ESCROW_CONFIRMATIONS** defaults to 2. The containing block counts as confirmation 1.
- Confirmation depth is policy-configurable and may later become amount-sensitive without changing contract flow.
- The service does not wait for L1 settlement before marking funding confirmed.
- **ESCROW_FUNDING_HOLD_SECONDS** defaults to 45.
- **Funding Holds** are server-authoritative, persisted, and released from persisted expiry rather than in-memory timers.
- A **Funding Hold** reserves a specific Seat but does not create a **Table Stack**.
- If funding confirms after a **Funding Hold** expires, the Player becomes **Funded Awaiting Seat** instead of losing the deposit.
- A **Player** who is **Funded Awaiting Seat** is auto-seated if a Seat is open, otherwise enters the **Waitlist**.
- A **Player** who is **Funded Awaiting Seat** may request **Escrow Refund**.
- **Escrowed Buy-In** is the on-chain state of confirmed funds. **Funded Awaiting Seat** is the product state of a funded Player with no Seat.
- Escrow becomes **Locked Escrow** only after the lock transaction confirms for seating.
- The backend must lock escrow before assigning a Seat or dealing the Player into a **Hand**.
- The Settler may unlock escrow as an orphan recovery path if lock succeeds but backend seating does not complete.
- **Sitting Out** never unlocks **Locked Escrow**.
- A seated Player may request **Top-Up** only between **Hands**.
- A **Top-Up** requested during a **Live Hand** queues until the **Hand** settles.
- A seated Player's confirmed **Top-Up** auto-locks before increasing **Table Stack**.
- Pending **Top-Ups** are visible at the **Table**.
- Blockchain-backed Rooms may define a per-Player maximum total **Buy-In** amount at Room creation.
- **Anti-Ratholing** is a per-Room product policy, enabled by default and configurable at Room creation.
- **Anti-Ratholing** applies to **Checkout** followed by rejoining the same Room, not to **Top-Ups**.
- **Anti-Ratholing** uses the most recent **Checkout** amount within the configured window.
- **Anti-Ratholing** is enforced at seating time, not by refusing refunds or moving funds in the contract.
- When **Anti-Ratholing** conflicts with maximum total **Buy-In**, the maximum **Buy-In** policy wins.
- A **Player** has at most one **Bound Wallet** per blockchain-backed Room.
- The **Bound Wallet** is established by the Player's first escrowed funding action in that Room.
- All **Checkouts**, **Escrow Refunds**, and **Emergency Exits** pay the **Bound Wallet**.
- Changing wallets requires **Checkout** and rejoining the Room with the new **Connected Wallet**.
- **Checkout** can be requested during a **Live Hand**, but settlement waits until the **Hand** settles.
- **Checkout** removes the Player from future **Hands** once requested.
- **Checkout** payout requires authorization for exact Room, Player, amount, and nonce.
- Normal **Checkout** is backend-relayed so the Player does not submit a second wallet transaction to receive payout.
- Backend-relayed gas is reimbursed through **Gas Shares**, not platform rake.
- For each backend-relayed Room transaction, gas cost in USDC is computed from gas used, effective gas price, and a backend-recorded ETH/USDC market quote.
- Each **Gas Share** is the transaction gas cost divided equally among Players with **Locked Escrow** in the Room when the transaction is submitted.
- **Gas Shares** accrue when transactions are recorded, remain outside **Table Stack** accounting, and are collected when the Player exits escrow.
- v1 caps **Gas Share** collection at the Player's available escrow exit amount and does not create off-chain debt.
- v1 charges no platform rake: no percentage of pots, hands, **Buy-Ins**, **Top-Ups**, or **Checkouts**.
- **Settlement Frozen** stops new **Hands** and normal **Checkouts** while preserving exit safety rules.
- **Emergency Exit** becomes available after a default 7-day delay from settlement freeze.
- **Emergency Exit** returns cumulative deposits minus amounts already paid, not current **Table Stack**.
- Public launch requires legal review, audit, jurisdiction allow-listing, age/legal-location attestation, sanctions screening, and trust-model disclosure.
- The first blockchain-backed version avoids fiat on-ramps, fiat off-ramps, token swaps, custodial balances, KYC collection, promotional tokens, and loyalty credits.
- Educational guidance for acquiring native USDC on Base must remain generic and not become an integrated on-ramp or exchange referral flow.
- Use a three-slice roadmap: Base Sepolia testnet skeleton, Base mainnet closed-alpha settlement, then hardening and public launch.
- Smart-wallet-compatible contract interfaces begin in slice 1; full smart-wallet fixtures and edge-case tests land in slice 3.
- Pause, settlement freeze, emergency exit contract mechanisms, and solvency accounting are present before mainnet funds enter the system.
- External audit and legal review gate public launch.

## Testing Decisions

- Tests should verify external behavior, domain outcomes, contract invariants, and user-visible state rather than implementation details.
- Smart contract tests should cover funding, cancellation, locking, unlocking, payout, pause, settlement freeze, emergency exit, close, roles, nonces, and room isolation.
- Smart contract tests should include fuzz or property tests for **Room Solvency**, cross-Room isolation, payout bounds, replay protection, and deposit/refund/payout accounting.
- Signature tests should cover valid EOA signatures, valid EIP-1271 signatures, invalid signatures, wrong signer, wrong Room, wrong chain/domain, wrong nonce, reverting contract wallets, and malicious EIP-1271 implementations.
- Permit2 funding tests should cover initial **Buy-In**, **Top-Up**, wrong token, wrong amount, wrong Room, expired permit, reused nonce, and insufficient USDC.
- Role-boundary tests should attempt every privileged action from every role and assert unauthorized actions fail.
- Reentrancy tests should cover payout, refund, emergency exit, and smart-wallet signature paths.
- Backend event-listener tests should cover confirmation thresholds, off-by-one confirmation counting, replay from last processed block, late confirmations after **Funding Hold** expiry, dropped or reverted transactions, and backend restart during pending funding.
- Backend room-escrow tests should cover **Funding Hold** lifecycle, **Escrowed Buy-In**, **Funded Awaiting Seat**, **Locked Escrow**, orphan unlock recovery, and lock-before-seat behavior.
- Seating integration tests should cover current host-verified paths continuing to work and blockchain-backed paths requiring **Escrowed Buy-In** or **Locked Escrow** at the right boundary.
- Checkout tests should cover request during **Live Hand**, settlement after **Hand** completion, removal from future **Hands**, payout authorization, payout receipt, and payout to **Bound Wallet**.
- **Top-Up** tests should cover between-hand application, queued application after **Live Hand**, visible pending top-ups, maximum **Buy-In** enforcement, seated auto-lock, and unseated cancellability.
- **Anti-Ratholing** tests should cover default-on behavior, Host-disabled behavior, most recent **Checkout** amount, window expiry, cap-wins conflict resolution, and no application to **Top-Ups**.
- **Gas Share** tests should cover transaction-time calculation, locked player count snapshots, equal split, collection at escrow exit, cap at available exit amount, receipts, and no mutation of **Table Stack** during play.
- **Settlement Frozen** and **Emergency Exit** tests should cover delegate revocation, new delegate resume, emergency delay, exit math, closed Room terminal behavior, pause interaction, and no new funding while frozen or closed.
- Frontend tests should cover wallet connection, wrong-chain/wrong-token state, funding prompts, funding pending, late-confirmed funding, waitlist with escrow, top-up state, checkout state, receipts, frozen settlement state, and trust disclosures.
- Compliance gate tests should cover jurisdiction allow-listing, age/legal-location attestation, sanctions or wallet-risk refusal, and feature-flagged public launch gates.
- Monitoring tests or smoke checks should cover event-indexer health, missed-event replay, solvency dashboard inputs, gas-share receipt generation, and anomalous payout alerts.
- Prior art in the repo includes API integration tests around Room creation, Host-Verified Buy-Ins, seating, Waitlist, Seat Offers, and first-Hand gating.
- Prior art in the repo includes room-view tests and local browser test documentation for multi-Player flows.
- The first slice should run multi-Player testnet sessions for at least a week without outstanding critical bugs before mainnet closed alpha.
- Public launch requires audit remediation and legal-review gates to pass, not just tests.

## Out of Scope

- Building a new blockchain.
- Supporting any chain other than Base.
- Supporting ETH, USDT, bridged USDC variants, custom tokens, or multiple stablecoins.
- Fiat on-ramps, fiat off-ramps, bank withdrawals, card payments, ACH, or exchange integrations.
- Token swaps inside the app.
- Custodial Player balances or app-operated Player wallets.
- Platform KYC collection in v1.
- Platform rake or percentage-based monetization.
- Tournaments, multi-table play, referrals, promotions, loyalty credits, or platform tokens.
- On-chain poker hand execution, deck order, action validation, pots, side pots, showdown, or hand evaluation.
- On-chain dispute adjudication or platform override payouts.
- Trustless payout claims; payouts remain **Host-Arbitrated Payouts**.
- Cross-Room **Anti-Ratholing**.
- Wallet migration without **Checkout** and rejoin.
- Per-Room escrow contract factories or clones.
- Upgradeable escrow proxy in v1.
- Waiting for L1 settlement before funding confirmation.
- Public launch before legal review, audit, jurisdiction allow-listing, sanctions screening, and trust disclosures are complete.

## Further Notes

This PRD follows the updated domain glossary in `CONTEXT.md` and the blockchain escrow ADRs recorded during design: API authority for escrow payouts, backend-relayed checkout, confirmed escrow before **Table Stacks**, separated **Funding Holds**, shared immutable escrow, **Room Settlement Keys**, trust-model disclosure, evidence-and-containment disputes, minimal contract Room lifecycle, **Top-Ups**, smart-wallet-compatible signatures, Permit2 with native USDC on Base, non-custodial compliance scope, legal-review launch gating, and the three-slice roadmap.

The implementation should preserve the existing server-authoritative poker direction. Blockchain is the money rail and custody boundary, not the poker engine.

The next step after triage should be to split this PRD into independently grabbable implementation issues, aligned to the three roadmap slices.
