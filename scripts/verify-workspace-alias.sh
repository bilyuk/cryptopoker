#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
legacy_alias_path="${repo_root}/cryptopoker"

if [ ! -L "${legacy_alias_path}" ]; then
  echo "Expected legacy alias '${legacy_alias_path}' to be a symlink." >&2
  exit 1
fi

alias_target="$(readlink "${legacy_alias_path}")"
if [ "${alias_target}" != "." ]; then
  echo "Expected '${legacy_alias_path}' to point to '.', got '${alias_target}'." >&2
  exit 1
fi

resolved_alias_root="$(cd "${legacy_alias_path}" && pwd -P)"
if [ "${resolved_alias_root}" != "${repo_root}" ]; then
  echo "Legacy alias resolved to '${resolved_alias_root}', expected '${repo_root}'." >&2
  exit 1
fi

echo "Workspace alias check passed: ${legacy_alias_path} -> ${alias_target}"
