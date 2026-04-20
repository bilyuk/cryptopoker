# MVP Launch Checklist

## Reliability gates

- [ ] No `settlement_lag` alert firing for 24h pre-launch window.
- [ ] No sustained `hand_timeout_saturation` alert (>10 min) in pre-launch soak.
- [ ] Auth failure rate remains below threshold (`auth_failure_spike` not firing).
- [ ] End-to-end trace coverage verified for auth -> table action -> settlement confirmation.
- [ ] Reconciliation replay validated for at least one forced worker restart.

## Security gates

- [ ] Session token signing secret rotated and stored in secure runtime config.
- [ ] Signature verification path tested against malformed payloads and replay attempts.
- [ ] Settlement confirmation path rejects tx hash mismatch and invalid hand mapping.
- [ ] Audit logs retained for auth/session actions and suspicious reconnect patterns.

## Operational readiness

- [ ] On-call owner acknowledged: CTO.
- [ ] Runbook reviewed and linked in incident channel.
- [ ] Dashboard panels available to launch responders.
- [ ] Rollback command/playbook tested in staging.

## Go/no-go criteria

Launch only if all gates pass. Any critical alert in firing state is a no-go until mitigated and stable for one full observation window.
