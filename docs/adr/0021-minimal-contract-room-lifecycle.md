# Minimal contract Room lifecycle

The escrow contract will track only fund-movement Room states: `active`, `settlementFrozen`, and `closed`. Product concepts such as Table lifecycle, Hand state, Seating, Waitlist, Sitting Out, and Dealing Paused remain off-chain; the contract state only determines whether new Buy-Ins, normal payouts, refunds, delegate rotation, emergency exits, and closure are allowed.

Global pause is a separate dimension from per-Room state and should only block new Buy-Ins. Unseated Escrow Refunds, valid payouts, and Emergency Exit must remain available when globally paused so pause cannot trap Player funds.

Escrowed funds become Locked Escrow only after the Settler records the lock on-chain for seating and that lock transaction is confirmed. Before locking, a Player may cancel and receive an Escrow Refund; after locking, funds can exit only through a valid payout or Emergency Exit. The backend must lock escrow before assigning a Seat or dealing the Player into a Hand, because seating before lock confirmation would let a Player play while an Escrow Refund remains possible.

The Settler may unlock escrow as an orphan recovery path when a lock succeeds but backend seating does not complete. Unlocks are a small Settler trust surface and should emit indexed audit events for Room and Player; Sitting Out never unlocks Locked Escrow. A Room may close on-chain only when its escrowed USDC balance is zero, and `closed` is terminal.
