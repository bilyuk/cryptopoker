# Figma MCP Connection Runbook

This project uses Figma's official MCP server for design-to-code workflows.

## Recommended path (remote server)

Figma recommends the remote MCP server for the broadest feature set.

- Endpoint: `https://mcp.figma.com/mcp`
- Auth: OAuth sign-in flow from your MCP client
- Supports link-based design context and remote-only tools such as write-to-canvas/code-to-canvas (client-dependent)

## Local fallback (desktop server)

Use the desktop server only when your org setup requires it.

- Endpoint: `http://127.0.0.1:3845/mcp`
- Prerequisite: Figma desktop app running with Dev Mode MCP enabled

## Codex setup

### Option A: Codex app plugin (preferred)

1. Open Codex app.
2. Go to Plugins.
3. Install Figma.
4. Complete OAuth (Allow access).

### Option B: Codex CLI manual setup

```bash
codex mcp add figma --url https://mcp.figma.com/mcp
```

When prompted, authenticate the server in your browser.

## Project-level verification

Use the repo helper to verify that the configured endpoint is reachable:

```bash
pnpm figma:mcp:verify
```

For desktop mode:

```bash
FIGMA_MCP_URL=http://127.0.0.1:3845/mcp pnpm figma:mcp:verify
```

Expected outcomes:

- `200`/redirect: reachable
- `401`/`403`: reachable but auth required (normal for remote until login)

## Usage notes for this repo

1. Copy a frame/layer URL from Figma.
2. In your MCP client, ask it to implement/update code from that URL.
3. Keep generated UI aligned with docs under `ui/` and architecture constraints in `ARCHITECTURE.md`.

## Sources

- Figma Dev Docs: "Set up the remote server (recommended)"
- Figma Dev Docs: "Set up the desktop server (using desktop app)"
- Figma Learn: "Guide to the Figma MCP server"
