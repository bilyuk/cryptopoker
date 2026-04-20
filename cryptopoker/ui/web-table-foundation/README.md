# Web Table Realtime MVP Client (CRY-73)

This client is wired to the live MVP websocket backend and is intended as the QA harness for the frontend + realtime delivery path.

## What this includes

- Figma-aligned responsive table shell and seat cards.
- Real room join flow (`POST /api/rooms`).
- Live websocket lifecycle handling:
  - connect handshake (`room:welcome`)
  - room presence sync (`room:presence`)
  - chat broadcast (`chat:message`)
  - reconnect with exponential backoff
  - protocol error handling (`error`, close `1008 invalid_session`)
- QA buttons for error-path validation:
  - send invalid JSON
  - send invalid message payload

## Run

From repo root:

```bash
pnpm mvp:websocket
```

By default this serves on `http://localhost:3000` (ambient `PORT` is ignored).
To override the port:

```bash
CRYPTOPOKER_MVP_PORT=3300 pnpm mvp:websocket
```

Then open `http://localhost:<port>` in two browser tabs/windows.

## QA validation checklist

1. In tab A and tab B, join the same room with different display names.
2. Confirm both tabs show `connected` status and player presence updates.
3. Send chat from tab A and verify message appears in tab B event log.
4. Click `Disconnect Socket` in tab B and verify tab A receives disconnect presence.
5. Click `Reconnect Socket` in tab B and verify both tabs show reconnected presence.
6. Click `Send Invalid JSON` and `Send Invalid Message` and verify error banner + protocol log entries.

Protocol contract reference: [`docs/websocket-protocol-contract.md`](../../docs/websocket-protocol-contract.md).
