#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: enforce-main-pr-workflow.sh [options]

Enforces PR-only workflow on a branch using GitHub Branch Protection.

Options:
  --owner <owner>                 GitHub owner/org (default: derived from origin remote)
  --repo <repo>                   GitHub repository (default: derived from origin remote)
  --branch <branch>               Branch to protect (default: main)
  --approval-count <n>            Required approving reviews (default: 1)
  --required-check <context>      Required status check context (repeatable)
  --no-required-checks            Do not require status checks
  --dry-run                       Print the request payload without calling GitHub
  -h, --help                      Show this help

Examples:
  ./scripts/enforce-main-pr-workflow.sh
  ./scripts/enforce-main-pr-workflow.sh --required-check "CI / Lint, Typecheck, Test"
  ./scripts/enforce-main-pr-workflow.sh --owner bilyuk --repo cryptopoker --dry-run
EOF
}

owner=""
repo=""
branch="main"
approval_count="1"
dry_run="false"
no_required_checks="false"
required_checks=("Lint, Typecheck, Test")

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner)
      owner="${2:-}"
      shift 2
      ;;
    --repo)
      repo="${2:-}"
      shift 2
      ;;
    --branch)
      branch="${2:-}"
      shift 2
      ;;
    --approval-count)
      approval_count="${2:-}"
      shift 2
      ;;
    --required-check)
      required_checks+=("${2:-}")
      shift 2
      ;;
    --no-required-checks)
      no_required_checks="true"
      required_checks=()
      shift
      ;;
    --dry-run)
      dry_run="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if ! [[ "$approval_count" =~ ^[0-9]+$ ]]; then
  echo "Invalid --approval-count value: $approval_count" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required." >&2
  exit 1
fi

resolve_repo_from_remote() {
  local remote_url
  remote_url="$(git config --get remote.origin.url || true)"
  if [[ -z "$remote_url" ]]; then
    echo "Could not derive owner/repo from git remote. Provide --owner and --repo." >&2
    exit 1
  fi

  local parsed
  parsed="$(printf '%s' "$remote_url" | sed -E 's#(git@github.com:|https://github.com/)([^/]+)/([^/.]+)(\.git)?#\2/\3#')"
  if [[ "$parsed" != */* ]]; then
    echo "Unable to parse owner/repo from remote URL: $remote_url" >&2
    exit 1
  fi

  owner="${parsed%%/*}"
  repo="${parsed##*/}"
}

if [[ -z "$owner" || -z "$repo" ]]; then
  resolve_repo_from_remote
fi

if [[ "$no_required_checks" == "true" ]]; then
  required_status_checks_json="null"
else
  checks_json="$(printf '%s\n' "${required_checks[@]}" | jq -R . | jq -s .)"
  required_status_checks_json="$(jq -cn --argjson contexts "$checks_json" '{strict: true, contexts: $contexts}')"
fi

protection_payload="$(
  jq -cn \
    --argjson requiredStatusChecks "$required_status_checks_json" \
    --argjson approvalCount "$approval_count" \
    '{
      required_status_checks: $requiredStatusChecks,
      enforce_admins: true,
      required_pull_request_reviews: {
        required_approving_review_count: $approvalCount,
        dismiss_stale_reviews: true,
        require_code_owner_reviews: true,
        require_last_push_approval: false
      },
      restrictions: null,
      required_linear_history: true,
      allow_force_pushes: false,
      allow_deletions: false,
      block_creations: false,
      required_conversation_resolution: true,
      lock_branch: false,
      allow_fork_syncing: true
    }'
)"

echo "Target: $owner/$repo (branch: $branch)"
echo "Requested required checks: ${required_checks[*]:-<none>}"

if [[ "$dry_run" == "true" ]]; then
  echo "Dry run mode. Branch protection payload:"
  echo "$protection_payload" | jq .
  exit 0
fi

echo "Applying GitHub branch protection..."
set +e
apply_output="$(gh api --method PUT "repos/$owner/$repo/branches/$branch/protection" --input - 2>&1 <<<"$protection_payload")"
apply_status=$?
set -e

if [[ $apply_status -ne 0 ]]; then
  echo "Failed to apply branch protection."
  echo "$apply_output"
  if grep -q "Upgrade to GitHub Pro or make this repository public" <<<"$apply_output"; then
    echo "Action required: upgrade repository plan or make the repository public, then re-run this script."
  fi
  exit $apply_status
fi

echo "Branch protection applied. Verifying..."
gh api "repos/$owner/$repo/branches/$branch/protection" \
  --jq '{required_pull_request_reviews,required_status_checks,enforce_admins,allow_force_pushes,allow_deletions,required_linear_history,required_conversation_resolution}'
