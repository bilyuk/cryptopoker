#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

pnpm --filter @cryptopoker/backend-api build
pnpm --filter @cryptopoker/backend-api build --watch &
BUILD_WATCH_PID=$!

cleanup() {
  kill "$BUILD_WATCH_PID" >/dev/null 2>&1 || true
  wait "$BUILD_WATCH_PID" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

node --watch server/api/dist/mvp-server.js
