# Single shared immutable escrow contract

Blockchain-backed Rooms will share one immutable escrow contract keyed by Room and Player rather than deploying a contract per Room. A shared contract keeps Room creation off-chain, gives the backend one event stream and one monitored address, and concentrates audit and emergency response work in one place; the accepted trade-off is larger blast radius if the contract has a payout bug, which should be mitigated with audit, invariant testing, and monitoring rather than per-Room deployment complexity in v1.

The v1 contract should not use an upgradeable proxy. Pausing should block new Buy-Ins but must not block refunds or other exits for unseated escrowed funds, and contract events should index Room and Player for backend replay and monitoring.

Privileged powers should be explicit: the Settler may register Rooms, relay Host-signed payouts, lock escrow once a Player is seated, transition contract Room state according to contract rules, and pay gas, but must not have unilateral payout authority; the Pauser may stop new Buy-Ins but must not block payouts, unseated refunds, or emergency exits; the Role Admin may rotate Settler and Pauser keys but cannot change payout logic. Every privileged action should emit a structured event so monitors can verify role boundaries.
