# MVP Technical Scope and Ticket Breakdown

Owner: CTO  
Last updated: 2026-04-13

## 1) MVP technical scope

MVP acceptance target (from `MVP_SPEC.md`):
- Two players can connect, play one full hand, and settle pot on-chain.

### System boundaries

- Web client (`web-app`): wallet connect, lobby/table shell, action controls, hand/pot state rendering, transaction prompts, fairness/proof surface.
- API backend (`api`): authenticated session APIs, table lifecycle, hand orchestration, event stream, settlement orchestration trigger.
- Game engine (`engine`): deterministic hand state machine and server-side validation of legal actions; no winner declaration beyond deterministic transition outputs.
- Fairness module (`fairness`): commitment lifecycle and reveal/proof publication APIs for auditable hand history.
- Contracts (`contracts`): escrow/buy-in, settlement, payout source of truth, event emission for reconciliation.
- Data stack (`postgres + redis`): append-only ledger/events and low-latency table/session state.
- Observability (`otel + logs + alerts`): traces, metrics, structured logs, and incident signals across wallet/game/settlement paths.

### Non-goals for MVP

- Tournament mode and multi-table progression.
- Fiat rails / KYC workflow automation.
- Full anti-collusion ML pipeline (MVP uses rules + audit hooks only).
- Advanced TEE/MPC dealing (deferred to post-MVP; MVP uses hybrid commit/reveal + verifiable randomness approach).

## 2) Delivery workstreams

- Foundation: repo/workspace split, scaffolding, CI, baseline service runtime.
- Backend core: auth/session, table/hand state machine APIs, settlement orchestration.
- Web app foundation: app shell, wallet/session UX, table action UI wired to backend events.
- Integrity controls: commitment/reveal flow and auditable hand transcript.
- Ops baseline: observability, runbooks, and release quality gates.

## 3) MVP acceptance slices (release-ordered)

These slices define the execution contract for CRY-67 implementation. Each slice
must satisfy its acceptance criteria before the next slice is considered complete.

- Slice 1 (T1-T2): implementation workspace and shared contracts.
- Slice 2 (T3-T4): wallet/session and table lifecycle baseline.
- Slice 3 (T5): deterministic hand engine and action validation.
- Slice 4 (T6): on-chain settlement integration.
- Slice 5 (T8): playable browser table flow over realtime events.
- Slice 6 (T7): fairness commitments and proof surfaces.
- Slice 7 (T9): observability, runbooks, and launch gates.

## 4) Ticket breakdown (dependency-ordered)

### T1. Create implementation project and execution workspace

Priority: P0  
Depends on: none

Scope:
- Create a dedicated implementation project/workspace separate from planning docs repo.
- Define workspace layout for `contracts/`, `backend/`, `web/`, `infra/`.
- Add baseline CI and branch protections.

Acceptance criteria:
- New project exists in Paperclip with linked workspace metadata.
- `README` defines local run/test commands for each package.
- CI runs lint + unit tests on pull requests.

### T2. Monorepo scaffolding and shared contracts

Priority: P0  
Depends on: T1

Scope:
- Set up package manager/workspaces and shared type package.
- Add API schema package for request/response/event contracts.
- Establish migrations and environment config strategy.

Acceptance criteria:
- `backend` and `web` compile against shared schema package.
- Schema changes can be versioned and consumed in one command.
- Local bootstrap script stands up required dependencies.

### T3. Wallet/session foundation (web + backend)

Priority: P0  
Depends on: T2

Scope:
- Web wallet connect/disconnect UX and signed nonce auth flow.
- Backend auth/session issuance and session verification middleware.
- Session telemetry for login failures and suspicious reconnect rates.

Acceptance criteria:
- User can connect wallet and obtain valid session token.
- Session expiration and revoke paths are tested.
- Auth audit logs capture wallet, session id, and reason codes.

### T4. Table lifecycle and matchmaking-lite APIs

Priority: P0  
Depends on: T3

Scope:
- Create/join/leave table APIs and minimal two-player seat assignment.
- In-memory + persistent table state with idempotent join semantics.
- Web lobby and table waiting-room states.

Acceptance criteria:
- Two distinct users can join same table reliably.
- Duplicate joins and stale reconnects do not corrupt seat state.
- Table status transitions are persisted and queryable.

### T5. Hand state machine and action validation

Priority: P0  
Depends on: T4

Scope:
- Deterministic hand phases (deal, betting rounds, showdown/resolve).
- Legal action validation and timeout/auto-fold policy for MVP.
- Event-sourced hand log with replay endpoint.

Acceptance criteria:
- Engine rejects invalid actions with deterministic reason codes.
- Replaying hand events recreates identical final state.
- Hand completion emits settlement-ready payload.

### T6. On-chain escrow and settlement integration

Priority: P0  
Depends on: T5

Scope:
- Deploy MVP contract(s) for escrow and payout.
- Settlement executor submits chain tx from finalized hand output.
- Reconciliation worker consumes contract events and updates ledger.

Acceptance criteria:
- End-to-end hand moves funds according to final pot distribution.
- Failed tx paths are retried safely without double-settlement.
- On-chain events map to internal hand/ledger ids.

### T7. Fairness commitments and proof surface

Priority: P1  
Depends on: T5

Scope:
- Commitment and reveal lifecycle recorded per hand.
- Public API endpoint for hand fairness transcript/proof bundle.
- Web surface linking hand result to proof data.

Acceptance criteria:
- Every completed hand includes commitment + reveal artifacts.
- Proof endpoint is immutable for finalized hands.
- Audit script validates sample hands from stored artifacts.

### T8. Web table interaction foundation

Priority: P1  
Depends on: T4, T5

Scope:
- Implement responsive table shell, seat cards, action panel, pot/status rail.
- Real-time updates for hand phase and opponent actions.
- UX states for pending tx, action timeout, and hand completion.

Acceptance criteria:
- User can complete one hand from browser without manual API calls.
- UI remains synchronized after refresh/reconnect.
- Core flows validated on desktop + mobile breakpoints.

### T9. Observability, runbooks, and MVP launch gates

Priority: P0  
Depends on: T3, T5, T6

Scope:
- Distributed tracing across auth, table, hand, and settlement pipelines.
- Service-level dashboards and alert thresholds.
- Incident runbook for stuck hand, settlement failure, and degraded chain RPC.

Acceptance criteria:
- Alerts fire for settlement lag, hand timeout saturation, and auth errors.
- Runbook includes owner, triage steps, and rollback guidance.
- MVP launch checklist includes reliability + security gates.

## 5) Cross-ticket dependencies

- Critical path: T1 -> T2 -> T3 -> T4 -> T5 -> T6.
- UX/Frontend alignment: T8 must track `CRY-11` UX scope decisions for components, flows, and responsive constraints.
- Integrity and operations gates before MVP demo sign-off: T7 and T9.

## 6) Delivery risks and mitigations

### Risk 1: Contract settlement edge cases delay MVP if payout model changes after T6 starts.

Mitigation:
- Freeze payout model at the T5->T6 handoff with one signed decision record.
- Add settlement dry-run fixtures and replay tests before chain deployment.
- Add explicit rollback behavior for failed payout invariants in runbooks.

### Risk 2: Real-time sync complexity (reconnect/idempotency) destabilizes hand progression.

Mitigation:
- Enforce idempotency keys on join, action, and resync endpoints.
- Require replay/resync tests as T4 and T5 acceptance gates.
- Track reconnect error budget and alert thresholds in T9 dashboards.

### Risk 3: Fairness proof UX is under-scoped and weakens trust narrative at demo time.

Mitigation:
- Define a minimum proof bundle schema in T7 before UI polish begins.
- Add an audit script walkthrough artifact to demo checklist.
- Include a user-visible proof-link workflow in T8 acceptance.

## 7) Assumptions

- Launch chain remains Base (per `RESEARCH.md`).
- MVP supports heads-up (2-player) cash table only.
- No separate QA agent exists yet; engineering owners run test plans until QA role is staffed.
