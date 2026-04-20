# Settlement Contracts (Base)

This package contains the MVP escrow and payout contract used by the settlement pipeline.

## Contract

`BaseEscrowSettlement` tracks per-table escrow balances and allows the settlement operator to move funds from loser to winner exactly once per hand.

### Key behaviors

- Player escrow deposits are tracked by `(tableId, walletAddress)`.
- `settleHand` is owner-only and records `handId` as settled to prevent double-settlement.
- Settlement events include `tableId`, `handId`, and `idempotencyKey` so backend reconciliation can map chain events to internal ledger records.
- Players withdraw from their escrow balance directly.

## Environment variables

- `BASE_SEPOLIA_RPC_URL`: RPC URL for Base Sepolia.
- `BASE_MAINNET_RPC_URL`: RPC URL for Base mainnet.
- `DEPLOYER_PRIVATE_KEY`: deployer private key for funded wallet.
- `ESCROW_OWNER_ADDRESS`: optional owner for settlement execution (defaults to deployer).
- `BASESCAN_API_KEY`: optional Basescan key for verification.
- `VERIFY_CONTRACT=true`: optional toggle to auto-verify on deploy.

## Commands

```bash
pnpm --filter @cryptopoker/settlement-contracts build
pnpm --filter @cryptopoker/settlement-contracts test
pnpm --filter @cryptopoker/settlement-contracts deploy:base-sepolia
pnpm --filter @cryptopoker/settlement-contracts deploy:base
```

Deployment metadata is stored in `contracts/settlement/deployments/<network>.base-escrow-settlement.json`.
