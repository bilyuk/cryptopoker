# Funding via Permit2 and native USDC on Base

Blockchain-backed Rooms will fund Buy-Ins and Top-Ups with Circle native USDC on Base through Permit2. The production asset is the Base USDC contract `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`; bridged USDC variants, USDT, ETH, and custom tokens are out of scope so Player liquidity and contract accounting stay unified.

The v1 funding path should use Permit2's per-transaction signature transfer flow, not recurring allowance transfer. Fresh wallets may see both a USDC authorization prompt and a Room funding prompt, while subsequent Buy-Ins and Top-Ups use the same one-shot funding path; the UI should label each prompt plainly rather than collapsing them into vague crypto jargon.

Permit2 is only for funds entering escrow. Escrow Refunds, Checkouts, and Emergency Exits are funds leaving the escrow contract and follow the contract's normal refund or payout rules. Testnet token addresses should be verified against current Circle documentation during implementation rather than inferred from mainnet.
