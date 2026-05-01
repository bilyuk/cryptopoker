# E2E testing with two visible agent-browser instances

Use this when testing multi-Player flows such as invite joins, Buy-In approval, Seat claims, and first-Hand gating.

The default for this workflow is **headed browser windows** so the user can see what is happening.

## Start the app

From the repo root:

```bash
NODE_ENV=test pnpm --filter @cryptopoker/api dev
```

In another terminal:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 pnpm --filter @cryptopoker/web dev
```

Verify the app is reachable:

```bash
curl -sS http://localhost:4000/health
```

Expected:

```json
{"status":"ok"}
```

## Reset browser sessions

Use two isolated sessions. Keep them headed:

```bash
agent-browser --session poker-host close --all || true
agent-browser --session poker-guest close --all || true
```

Open both visible browsers:

```bash
agent-browser --session poker-host --headed open http://localhost:3000
agent-browser --session poker-guest --headed open http://localhost:3000
```

If `agent-browser` says `--headed ignored: daemon already running`, close all sessions and reopen:

```bash
agent-browser close --all
agent-browser --session poker-host --headed open http://localhost:3000
agent-browser --session poker-guest --headed open http://localhost:3000
```

## Baseline verification

Run this for each session:

```bash
agent-browser --session poker-host eval 'document.body.innerText.trim().length > 0 ? "HAS_CONTENT" : "BLANK"'
agent-browser --session poker-host eval 'document.querySelector("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay") ? "ERROR_OVERLAY" : "OK"'
agent-browser --session poker-host snapshot -i
agent-browser --session poker-host errors
```

Repeat with `poker-guest`.

## Happy-path room E2E

Use `snapshot -i` after each page-changing action because element refs change.

1. Host enters lobby:

```bash
agent-browser --session poker-host snapshot -i
agent-browser --session poker-host fill @DISPLAY_NAME_REF host-e2e
agent-browser --session poker-host focus @DISPLAY_NAME_REF
agent-browser --session poker-host press Enter
agent-browser --session poker-host wait 500
agent-browser --session poker-host snapshot -i
```

2. Host creates a room:

```bash
agent-browser --session poker-host click @CREATE_ROOM_REF
agent-browser --session poker-host wait 500
agent-browser --session poker-host snapshot -i
agent-browser --session poker-host fill @ROOM_NAME_REF "E2E Visible Room"
agent-browser --session poker-host focus @CREATE_PRIVATE_ROOM_REF
agent-browser --session poker-host press Enter
agent-browser --session poker-host wait 1000
agent-browser --session poker-host snapshot
```

Copy the invite code from the `cryptopoker.game/r/<invite-code>` text.

3. Host requests and approves their own Buy-In, then claims Seat 1:

```bash
agent-browser --session poker-host snapshot -i
agent-browser --session poker-host focus @REQUEST_BUY_IN_REF
agent-browser --session poker-host press Enter
agent-browser --session poker-host wait 500
agent-browser --session poker-host snapshot -i
agent-browser --session poker-host focus @APPROVE_REF
agent-browser --session poker-host press Enter
agent-browser --session poker-host wait 500
agent-browser --session poker-host snapshot -i
agent-browser --session poker-host focus @CLAIM_SEAT_REF
agent-browser --session poker-host press Enter
agent-browser --session poker-host wait 500
agent-browser --session poker-host snapshot
```

Expected host state:

- `Players in room` shows `host-e2e`
- Host status is `Seated - $40.00`
- Seats show `1/6`
- `Deal the First Hand` is disabled

4. Guest joins the invite:

```bash
agent-browser --session poker-guest snapshot -i
agent-browser --session poker-guest fill @DISPLAY_NAME_REF guest-e2e
agent-browser --session poker-guest focus @DISPLAY_NAME_REF
agent-browser --session poker-guest press Enter
agent-browser --session poker-guest wait 500
agent-browser --session poker-guest snapshot -i
agent-browser --session poker-guest click @JOIN_WITH_LINK_REF
agent-browser --session poker-guest wait 500
agent-browser --session poker-guest snapshot -i
agent-browser --session poker-guest fill @INVITE_INPUT_REF <invite-code>
agent-browser --session poker-guest focus @PREVIEW_ROOM_REF
agent-browser --session poker-guest press Enter
agent-browser --session poker-guest wait 500
agent-browser --session poker-guest snapshot
agent-browser --session poker-guest focus @TAKE_A_SEAT_REF
agent-browser --session poker-guest press Enter
agent-browser --session poker-guest wait 1000
agent-browser --session poker-guest snapshot
```

Expected guest state:

- Room heading matches the host room.
- Invite preview says the Host invited the guest.
- `Players in room` shows both Host and Guest.
- Seats still show `1/6`.
- Guest can request Buy-In.

5. Guest requests Buy-In:

```bash
agent-browser --session poker-guest snapshot -i
agent-browser --session poker-guest focus @REQUEST_BUY_IN_REF
agent-browser --session poker-guest press Enter
agent-browser --session poker-guest wait 500
agent-browser --session poker-guest snapshot
```

Expected:

- Guest status is `Buy-In pending`.
- Guest cannot claim Seat yet.

6. Host approves Guest Buy-In:

```bash
agent-browser --session poker-host snapshot -i
agent-browser --session poker-host focus @GUEST_APPROVE_REF
agent-browser --session poker-host press Enter
agent-browser --session poker-host wait 1000
agent-browser --session poker-host snapshot
```

Expected:

- Host sees Guest as `Buy-In verified`.
- Host still shows `1/6`.

7. Guest claims Seat 2:

```bash
agent-browser --session poker-guest snapshot -i
agent-browser --session poker-guest focus @CLAIM_SEAT_REF
agent-browser --session poker-guest press Enter
agent-browser --session poker-guest wait 1000
agent-browser --session poker-guest snapshot
```

Expected:

- Guest status is `Buy-In verified - seated`.
- Seats show `2/6`.
- Guest `Deal the First Hand` is disabled because only the Host starts the first Hand.

8. Host receives the socket update:

```bash
agent-browser --session poker-host wait 1000
agent-browser --session poker-host snapshot
```

Expected:

- Host sees Guest seated.
- Seats show `2/6`.
- Host `Deal the First Hand` is enabled.

9. Host deals:

```bash
agent-browser --session poker-host snapshot -i
agent-browser --session poker-host focus @DEAL_REF
agent-browser --session poker-host press Enter
agent-browser --session poker-host wait 1000
agent-browser --session poker-host snapshot -i
```

Expected:

- Host enters the Table screen.
- Guest currently does not automatically enter the shared Table screen. The Table screen is still client-side simulated gameplay.

## Screenshots

Save evidence as you go:

```bash
mkdir -p /tmp/cryptopoker-agent-browser
agent-browser --session poker-host screenshot /tmp/cryptopoker-agent-browser/host-ready.png --annotate
agent-browser --session poker-guest screenshot /tmp/cryptopoker-agent-browser/guest-seated.png --annotate
```

## Cleanup

```bash
agent-browser --session poker-host close --all
agent-browser --session poker-guest close --all
```

Stop the dev servers with `Ctrl-C` in their terminals.

## Notes

- Use `--session` for isolation. Separate sessions have separate cookies and local storage.
- Use `--headed` by default for this repo’s E2E checks so the user can watch both browsers.
- If a click reports success but no UI change happens, use `focus @ref` plus `press Enter`.
- Re-run `snapshot -i` after every navigation, submit, modal change, or re-render.
- The Room and Seat flow is server-backed. The current Table hand UI is still local client simulation.
