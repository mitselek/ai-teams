#!/usr/bin/env bash
# session-start.sh (*FR:Brunel*)
#
# Start a Claude Code agent team session inside a fully isolated Docker container.
#
# Container layout:
#   User:        ai-teams
#   $HOME:       /home/ai-teams/
#   ~/.claude/:  /home/ai-teams/.claude/   (named volume — auto-memory persists)
#   Repo:        /home/ai-teams/workspace/ (named volume — git clone/pull)
#
# Prerequisites:
#   GITHUB_TOKEN must be set in environment or .env file
#   ANTHROPIC_API_KEY must be set in environment or .env file
#
# Usage: ./session-start.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load .env file if present (gitignored — store credentials here)
if [ -f "$SCRIPT_DIR/.env" ]; then
    # shellcheck disable=SC1091
    set -a && source "$SCRIPT_DIR/.env" && set +a
fi

# Resolve GITHUB_TOKEN — fallback chain:
# 1. Already set in environment
# 2. Loaded from .env above
# 3. gh CLI (if available and authenticated)
if [ -z "${GITHUB_TOKEN:-}" ]; then
    if command -v gh >/dev/null 2>&1; then
        GITHUB_TOKEN="$(gh auth token 2>/dev/null)" || true
        if [ -n "${GITHUB_TOKEN:-}" ]; then
            echo "Using GITHUB_TOKEN from gh CLI."
        fi
    fi
fi
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "ERROR: GITHUB_TOKEN is not set. Options:"
    echo "  1. Export it:  export GITHUB_TOKEN=ghp_..."
    echo "  2. Add to .env file:  echo 'GITHUB_TOKEN=ghp_...' >> $SCRIPT_DIR/.env"
    echo "  3. Authenticate gh CLI:  gh auth login"
    exit 1
fi
export GITHUB_TOKEN

export REPO_URL="${REPO_URL:-https://github.com/mitselek/ai-teams.git}"

echo "Starting ai-teams session (fully isolated)..."
echo "  Repo URL:   $REPO_URL"
echo "  Repo path:  /home/ai-teams/workspace/ (inside container)"
echo "  Memory:     docker volume 'ai-teams_claude-home' (~/.claude/)"
echo ""
echo "The container will clone/pull the repo, then open a bash shell."
echo "Run 'claude' to start Claude Code."
echo "To stop: exit the shell or Ctrl+D."
echo ""

# Build image if not present or outdated (idempotent)
docker compose -f "$SCRIPT_DIR/docker-compose.yml" build --quiet

# Start interactive session (--rm removes container on exit; volumes are preserved)
docker compose -f "$SCRIPT_DIR/docker-compose.yml" run --rm session bash
