#!/usr/bin/env bash
set -euo pipefail

# Prefer remote MCP as recommended by Figma docs.
FIGMA_MCP_URL="${FIGMA_MCP_URL:-https://mcp.figma.com/mcp}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

echo "Checking Figma MCP endpoint: ${FIGMA_MCP_URL}"

status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$FIGMA_MCP_URL" || true)"

case "$status" in
  200|301|302|307|308|405)
    echo "Figma MCP endpoint is reachable (HTTP ${status})."
    ;;
  401|403)
    echo "Figma MCP endpoint is reachable and requires authentication (HTTP ${status})."
    ;;
  404)
    echo "Received HTTP 404 from ${FIGMA_MCP_URL}. Verify the URL points to /mcp." >&2
    exit 1
    ;;
  000)
    echo "No HTTP response. Check your network, proxy settings, or local MCP server state." >&2
    exit 1
    ;;
  *)
    echo "Unexpected HTTP status from MCP endpoint: ${status}" >&2
    exit 1
    ;;
esac

echo "Connection check passed."
