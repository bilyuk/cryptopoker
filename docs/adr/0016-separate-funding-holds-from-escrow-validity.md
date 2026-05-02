# Separate Funding Holds from escrow validity

A Funding Hold reserves a specific Seat for a short policy-driven window, but it does not decide whether an on-chain deposit is valid. If a funding transaction confirms after its Funding Hold expires, the Buy-In still becomes Escrowed, the Player becomes Funded Awaiting Seat, and the backend should auto-seat them when a Seat is open or place them on the Waitlist when the Room is full; this prevents slow wallet signing or delayed Base confirmations from losing Player funds while also preventing a stalled transaction from holding a Seat indefinitely.

The v1 default is `ESCROW_FUNDING_HOLD_SECONDS=45`. Funding Holds are server-authoritative and persisted with an expiry timestamp; clients render the state but do not decide expiry, and the backend must release expired holds through persisted state rather than relying on in-memory timers.
