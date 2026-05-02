# Three-slice blockchain escrow roadmap

Blockchain escrow should ship through three vertical slices: testnet skeleton, closed-alpha settlement, and hardening for public launch. This keeps each phase demoable and testable while creating explicit stop points for technical, audit, and legal risk.

**Slice 1: Testnet skeleton** runs on Base Sepolia. It includes the shared immutable escrow contract shape, native USDC and Permit2 funding flow, smart-wallet-compatible signature verification in the contract, `joinRoom`, `cancelEscrowed`, `lockDeposit`, basic events, baseline Room Solvency accounting, backend event replay, Settler relay plumbing, Funding Holds, lock-before-seat, Escrowed Buy-Ins, unseated refunds, and a multi-Player testnet stability gate.

**Slice 2: Settlement closed alpha** moves to Base mainnet for an invite-only cohort after slice 1 has been stable on testnet. It adds Room Settlement Key delegation, Host-Arbitrated Payouts, Checkouts, Gas Share ledger and receipts, payout monitoring, Settler key infrastructure, rate limiting, `settlementFrozen`, pause, and Emergency Exit contract mechanisms. Contract safety mechanisms must exist before real mainnet funds are used, even if some UI polish remains for slice 3.

**Slice 3: Hardening and public launch** keeps contract logic frozen except for audit remediation. It adds smart-wallet fixtures and edge-case tests, complete emergency-exit UI, advanced monitoring and anomaly alerts, sanctions screening, jurisdiction allow-listing, age/legal-location attestation, trust-model disclosure surfaces, ToS and policy review, audit remediation, and public-launch feature flags.

The gate into public launch is external audit completion plus legal review completion. During the audit window, backend, frontend, monitoring, compliance, and disclosure work may continue, but gameplay expansions such as tournaments, multi-table play, fiat ramps, token swaps, referrals, and rake remain out of scope.
