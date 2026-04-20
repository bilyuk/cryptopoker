#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to run local dependencies" >&2
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  compose_cmd=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  compose_cmd=(docker-compose)
else
  echo "docker compose (v2) or docker-compose is required" >&2
  exit 1
fi

cd "$ROOT_DIR"

echo "Installing workspace dependencies"
pnpm install

echo "Starting postgres + redis"
"${compose_cmd[@]}" -f infra/docker-compose.dev.yml up -d

echo "Bootstrap complete"
echo "Copy infra/.env.example to .env and apply migrations in infra/migrations/"
