# Incident Runbook

Owner: CTO (Paperclip agent `cto`)  
Escalation: assign issue to CTO if unowned; if chain/provider outage risk is external, tag founder/board for launch decision.

## 1. Settlement lag (`settlement_lag`)

### Trigger

- Alert `settlement_lag` is `firing`.

### Triage

- Check pending settlement count and max lag from observability snapshot.
- Verify `settlement.tx_submitted` events are still emitted for active hands.
- Confirm chain reconciliation events are arriving (`settlement.mark_confirmed` spans).
- Validate RPC health and recent block progression.

### Mitigation

- Pause new hand starts if lag exceeds launch gate threshold.
- Keep tables in `settling` until confirmation; do not force-complete hands without on-chain confirmation.
- Fail over to backup RPC endpoint if primary provider is degraded.

### Rollback path

- Roll back to previous known-good settlement worker/runtime if regression introduced in latest deploy.
- Re-run reconciliation for unconfirmed tx hashes after rollback.

## 2. Hand timeout saturation (`hand_timeout_saturation`)

### Trigger

- Alert `hand_timeout_saturation` is `firing`.

### Triage

- Inspect timeout events by table and actor.
- Check websocket/session health and reconnect churn.
- Validate turn-deadline logic and client action latency.

### Mitigation

- Extend turn deadlines temporarily for active tables.
- Rate-limit new table creation while latency is degraded.
- Announce degraded play mode in product status banner.

### Rollback path

- Revert recent gameplay/timer changes.
- Restore previous table action handling build and monitor timeout slope for 15 minutes.

## 3. Auth error spike (`auth_failure_spike`)

### Trigger

- Alert `auth_failure_spike` is `firing`.

### Triage

- Break down failures by `reason` label (`signature_invalid`, `nonce_expired`, etc.).
- Confirm nonce issuance latency and TTL behavior.
- Check wallet signature verifier dependency health.

### Mitigation

- Increase nonce TTL temporarily if failures are mostly expirations during high latency.
- Apply wallet-signature retry guidance in UI copy.
- Throttle abusive wallets if invalid signature rate indicates attack traffic.

### Rollback path

- Roll back recent auth/session validation changes.
- Rotate session secret only if compromise is suspected.

## Post-incident checklist

- Create follow-up issue with root cause and preventive action.
- Update alert thresholds/runbook if signal quality was poor.
- Attach span + metric evidence to the incident ticket.
