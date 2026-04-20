# Architecture Direction

## High-Level Services

- API Gateway: Authenticated client entrypoint, rate limiting, session boundaries.
- Identity Service: Accounts, auth factors, session lifecycle.
- Wallet Service: Deposit/withdrawal orchestration and ledger abstraction.
- Game Engine: Table state machine, hand progression, settlement logic.
- Fairness Service: Randomness commitments, reveal proofs, verification endpoint.
- Risk Service: Fraud, collusion heuristics, and policy enforcement.
- Notification Service: User-facing system and transactional notifications.

## Data Boundaries

- Ledger data is append-only and auditable.
- Gameplay events are event-sourced for replayability.
- Personally identifiable information is isolated with strict access controls.

## Cross-Cutting Requirements

- Idempotent fund-transfer operations.
- Replay-safe state transitions for hand resolution.
- Distributed tracing across request, gameplay, and wallet flows.
- Versioned APIs and explicit backward compatibility policy.

## MVP Infrastructure Assumptions

- Containerized services deployed via CI/CD.
- Managed relational database for transactional consistency.
- Message bus for asynchronous risk and notification workloads.
- Centralized observability stack with logs, metrics, traces, and alerts.
