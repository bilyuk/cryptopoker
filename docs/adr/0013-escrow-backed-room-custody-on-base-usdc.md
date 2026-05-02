# Escrow-backed room custody on Base with native USDC

Supersedes: [ADR-0002](./0002-host-verified-buy-ins.md)

Cryptopoker version 2 will move from host-verified outside-the-app payment to product-managed room escrow custody for eligible Rooms. The approved baseline is EVM-compatible contracts on Base, denominated in native USDC, with the API remaining the authoritative source of room participation and hand settlement while the chain executes deposits, payouts, and refunds.

Decision details:
- Custody model: room escrow contract holds supported stablecoin balances per Player and Room.
- Network: Base (starting with Base Sepolia for non-production).
- Stablecoin: native USDC.
- Authority split: offchain API controls Room/Table/Hand state; onchain contracts execute value movement from authenticated server intent.
- Release scope: no production fund movement until ledger reconciliation and settlement phases are complete.

Operational plan:
- Signer model: server-side operator signer for payout/refund authorization with per-environment keys and role separation.
- Key management: managed KMS/HSM-backed signing keys, rotation schedule, and least-privilege access.
- Event indexing: chain indexer consumes deposit/payout/refund events, persists checkpoints, and supports idempotent replay.

Consequences:
- Domain language and contracts must support escrow lifecycle states alongside existing host-verified flows during transition.
- API introduces dedicated escrow and ledger boundaries before enabling live value movement.
- Reconciliation and payout failure handling become first-class operational requirements.
