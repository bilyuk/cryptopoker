# CryptoPoker Initial Research (as of 2026-04-13)

## Scope and assumptions

This memo compares:
- 3 blockchain options for a P2P crypto poker MVP
- 3 provably-fair dealing approaches (commit-reveal, Chainlink VRF, TEE/MPC)
- 3 competitors and their publicly claimed stack

Assumptions:
- Product goal is web-first, global distribution, and self-custodial funds where possible.
- Early-stage team needs fast iteration with strong EVM tooling.
- We prioritize practical launchability over “maximal purity” decentralization in v1.
- Competitor stack notes are based on public claims (websites/whitepapers), not code audits.

## 1) Top 3 blockchain options for a P2P poker product

### Option A: Base (OP-stack L2)

Pros:
- High current activity and large liquidity/user surface vs most app-specific chains.
- Very low effective onchain cost per operation in current L2BEAT telemetry.
- EVM compatibility keeps engineering velocity high.

Cons:
- Sequencer/governance centralization risk remains (Stage 1 still has trust assumptions).
- Rollup UX complexity remains for cross-chain users.

When it fits:
- Fast MVP shipping, low per-action fees, broad wallet/tooling support.

### Option B: Arbitrum One

Pros:
- Mature L2 ecosystem, deep liquidity, strong battle-tested infra.
- Fraud-proof based security model and broad dapp interoperability.
- Good long-term composability with EVM ecosystem.

Cons:
- Higher observed cost per L2 op than Base in current L2BEAT snapshot.
- Lower recent UOPS than Base snapshot, suggesting lower throughput headroom at comparable cost.

When it fits:
- If we value ecosystem depth and governance maturity over absolute lowest operating cost.

### Option C: Solana

Pros:
- Fast slot cadence and low-latency user experience potential.
- Strong support for high-frequency interactions.

Cons:
- Non-EVM stack increases implementation complexity and hiring constraints if team is EVM-native.
- Different transaction lifecycle semantics (expiration windows, commitment handling) require extra client rigor.

When it fits:
- If product strategy strongly prioritizes real-time UX and team is Solana-native.

### Chain recommendation

Recommended launch chain: **Base**.

Rationale:
- Best cost/performance balance for a web-first poker MVP right now.
- EVM path minimizes execution risk and time-to-market.
- If growth requires diversification, expand to Arbitrum second; consider Solana for a latency-focused dedicated client later.

## 2) Provably fair dealing approaches

### Approach 1: Commit-reveal

How it works:
- Players/actors first commit hash commitments, then reveal secrets in a later phase.

Pros:
- Simple and auditable.
- Minimal external dependencies.

Cons:
- Multi-phase UX friction and liveness griefing risk (reveal withholding).
- Handling non-reveal penalties/timeouts adds complexity.

Best use:
- Small-table games and deterministic game-state commitments (e.g., seed commitments) where UX can tolerate two phases.

### Approach 2: Chainlink VRF

How it works:
- Oracle network returns randomness + cryptographic proof verified onchain.

Pros:
- Strong developer ergonomics and widely used pattern.
- Publicly verifiable proof path onchain.

Cons:
- Adds oracle dependency and callback complexity.
- Pure VRF alone does not solve all card privacy/dealing fairness requirements in multiplayer poker.

Best use:
- Tournament seeding, deck seed generation, and auxiliary randomness where verifiable entropy is needed.

### Approach 3: TEE/MPC (Mental Poker family)

How it works:
- Card logic runs in trusted enclaves (TEE) and/or distributed cryptographic protocols (MPC/mental poker).

Pros:
- Better fit for hidden information games than plain VRF/commit-reveal.
- Can support “no trusted dealer” narratives when done correctly.

Cons:
- Operational and cryptographic complexity is materially higher.
- TEE security relies on hardware trust/attestation; MPC has heavier latency/engineering burden.

Best use:
- Core hole-card confidentiality and dealing protocol in higher-assurance architectures.

### Fairness architecture recommendation

Recommended v1 architecture:
- **Hybrid model:**
  - Onchain settlement/escrow + dispute hooks
  - VRF for public randomness primitives (e.g., seed material)
  - Commit-reveal for player commitments where needed
  - Keep TEE/MPC as phase-2 for stronger hidden-information guarantees

Why:
- Best balance of shippability, verifiability, and operational complexity for MVP.

## 3) Competitor analysis (publicly claimed stack)

### Competitor A: Virtue Poker

Publicly claimed stack signals:
- Ethereum smart contracts for escrow/settlement workflows.
- “Mental Poker” cryptographic shuffling, P2P messaging, and off-chain gameplay flow.
- Whitepaper describes justice/dispute mechanisms and decentralized custody narrative.

Takeaway:
- Strong fairness narrative and architecture depth, but design appears operationally complex.

### Competitor B: Dominion

Publicly claimed stack signals:
- Built on Midnight.
- ZK-focused “mental poker protocol” and on-chain verification claims.
- Community-owned/token-governance positioning.

Takeaway:
- Differentiates on privacy + ZK positioning; appears earlier-stage with execution risk.

### Competitor C: zkPoker

Publicly claimed stack signals:
- Cardano ecosystem orientation (Hydra/preprod references).
- zk-proof and no-middleman messaging in product narrative.
- Emphasis on decentralized interactions via wallets/smart contracts.

Takeaway:
- Technically ambitious and aligned with trust-minimized thesis, but ecosystem and adoption risk vs major EVM L2s.

## 4) Decision summary

- Chain: **Launch on Base**.
- Fairness: **Hybrid v1 (onchain settlement + VRF + selective commit-reveal)**.
- Product strategy: **Ship credible fairness quickly, then harden toward TEE/MPC mental-poker depth in v2**.

## 5) Risks and mitigations

Key risks:
- Regulatory/compliance variance by jurisdiction.
- Botting/collusion and multi-account abuse.
- Bridge/rollup operational incidents.

Mitigations:
- Early compliance-by-design (geo/risk controls, auditable logs).
- Behavioral anti-abuse stack from day 1.
- Incident playbooks and escape-hatch design for funds safety.

## Sources

1. L2BEAT Arbitrum profile: https://l2beat.com/scaling/projects/arbitrum
2. L2BEAT Base profile: https://l2beat.com/scaling/projects/base
3. Ethereum optimistic rollups overview: https://ethereum.org/developers/docs/scaling/optimistic-rollups/
4. Base docs (network fee model): https://docs.base.org/chain/fees
5. Base docs (differences vs Ethereum): https://docs.base.org/base-chain/network-information/diffs-ethereum-base
6. Solana confirmation/expiration guide: https://solana.com/developers/guides/advanced/confirmation
7. Solana PoH and block-time article: https://solana.com/news/how-solana-s-proof-of-history-is-a-huge-advancement-for-block-time
8. Chainlink VRF overview: https://chain.link/vrf
9. Chainlink VRF explainer: https://chain.link/education-hub/verifiable-random-function-vrf
10. Intel SGX attestation details: https://www.intel.com/content/www/us/en/security-center/technical-details/sgx-attestation-technical-details.html
11. Commit-reveal explainer (engineering reference): https://speedrunethereum.com/guides/commit-reveal-scheme
12. Virtue Poker whitepaper (public mirror): https://s2.tokeninsight.com/static/content/whitepaper/whitepaper12.pdf
13. Dominion site: https://www.dominion.fun/
14. zkPoker site: https://zkpoker.io/
