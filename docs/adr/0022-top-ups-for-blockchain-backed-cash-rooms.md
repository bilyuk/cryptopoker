# Top-Ups for Blockchain-Backed cash Rooms

Blockchain-backed cash Rooms will support Top-Ups because cash poker without reloads feels like a different game. Top-Ups are additional Buy-Ins for a Player in the same Room, allowed only between Hands or queued during a Live Hand and applied at the next hand boundary before a new Hand is dealt.

The contract should treat Top-Ups as additional deposits to the same Room and Player while enforcing any per-Player maximum total Buy-In configured for that Room. A Top-Up from a seated Player should confirm and become Locked Escrow before increasing the Player's Table Stack; a Top-Up from an unseated Player follows the normal Escrowed Buy-In path and remains cancellable until seating. Pending Top-Ups should be visible at the Table so stack changes are not covert.
