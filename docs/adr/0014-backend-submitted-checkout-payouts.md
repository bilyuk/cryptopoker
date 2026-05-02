# Backend-submitted checkout payouts

Blockchain-backed Room checkouts will be submitted to the escrow contract by the backend so requesting Checkout in the app automatically sends USDC back to the Player's Bound Wallet. A pull-claim flow would reduce backend transaction responsibility, but it would force Players to hold gas and complete a second wallet action at checkout.

The platform may advance Base gas operationally for backend-relayed Room transactions, but the cost is reimbursed by Players through Gas Shares rather than absorbed by the platform or assigned to the Room Host. For each backend-relayed transaction `tx` in Room `R`, compute:

`gasCostUSDC(tx) = gasUsed(tx) * effectiveGasPrice(tx) * ETH_USDC_price(tx)`

`gasShare(player) = sum(gasCostUSDC(tx) / lockedPlayerCount(tx))`

where `lockedPlayerCount(tx)` is the number of Players with Locked Escrow in `R` when `tx` is submitted. A Player's accumulated Gas Share is deducted from their Checkout payout or other escrow exit.

`ETH_USDC_price(tx)` is recorded by the backend from a market quote at transaction submission time rather than read from an on-chain oracle. Gas-share receipts should include the transaction hash, gas used, effective gas price, ETH/USDC quote, locked player count, computed USDC cost, and each Player's Gas Share so Players can audit that the Room reimbursed backend-relayed gas costs.

Gas Shares accrue when backend-relayed transactions are recorded, but they remain a settlement ledger separate from Table Stack accounting. They are collected only when a Player exits escrow through Checkout, Emergency Exit, or refund, and v1 should cap collection at the Player's available escrow exit amount rather than creating off-chain debt.
