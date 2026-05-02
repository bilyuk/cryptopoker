# Smart-wallet-compatible signatures

Blockchain-backed Rooms will support both externally owned wallets and EIP-1271 smart contract wallets for Player and Host signatures. Excluding smart wallets would create avoidable onboarding friction on Base and would be harder to retrofit after Host delegations and payout flows are live.

The contract should use a battle-tested signature checker that supports both ECDSA and EIP-1271 rather than hand-written signature dispatch. Player and Host signatures should use typed data; payout, delegation, refund, and emergency-exit paths should follow checks-effects-interactions and use reentrancy protection because EIP-1271 verification calls wallet contracts.

Operational keys are narrower: Room Settlement Keys and Settler keys are backend-operated EOAs, while Pauser and Role Admin keys may be multisig or smart-wallet based. The audit brief should explicitly cover EOA and EIP-1271 signature paths, malformed signatures, wrong-domain signatures, reverting wallet contracts, and malicious EIP-1271 implementations.
