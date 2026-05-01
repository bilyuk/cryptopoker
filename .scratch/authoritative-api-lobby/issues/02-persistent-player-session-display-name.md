# Persistent Player Session and Display Name

Status: needs-triage

## Parent

[PRD: Authoritative API Foundation and Realtime Room Lobby](../PRD.md)

## What to build

Add browser-persistent guest identity. A Player can create or resume a persistent session through an httpOnly cookie, see their current Player state, and update their Display Name without creating an account, wallet, password, or frontend-readable bearer token.

## Acceptance criteria

- [ ] A new browser can create a guest session with a Display Name.
- [ ] The API sets a persistent httpOnly session cookie and uses it to authenticate later REST requests.
- [ ] Returning with the same cookie resolves to the same Player.
- [ ] Two browsers may choose the same Display Name while remaining distinct Players.
- [ ] A Player can fetch their current Player state.
- [ ] A Player can update their current Display Name outside Live Hand concerns.
- [ ] The welcome flow uses server-backed Player identity instead of local-only state.
- [ ] Tests cover session creation, session reuse, non-unique Display Names, and Display Name updates.

## Blocked by

- [01 - Monorepo API Health Tracer](01-monorepo-api-health-tracer.md)
