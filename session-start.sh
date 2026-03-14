#!/usr/bin/env bash
# session-start.sh (*FR:Brunel*)
#
# Start a Claude Code agent team session inside a fully isolated Docker container.
#
# Usage:
#   ./session-start.sh                    # start framework-research (default)
#   ./session-start.sh framework-research # start framework-research
#   ./session-start.sh comms-dev          # start comms-dev
#
# Container layout (both teams share the same image):
#   User:        ai-teams
#   $HOME:       /home/ai-teams/
#   ~/.claude/:  per-team named volume (auto-memory isolated per team)
#   Repo:        /home/ai-teams/workspace/ (shared — same repo, both teams)
#   Comms:       /shared/comms/ (shared — Unix domain sockets between teams)
#
# Prerequisites:
#   GITHUB_TOKEN — set in environment, .env file, or via gh CLI (auto-detected)
#   ANTHROPIC_API_KEY — set in environment or .env file
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM="${1:-framework-research}"

# Validate team name
case "$TEAM" in
    framework-research|comms-dev) ;;
    *)
        echo "ERROR: Unknown team '$TEAM'."
        echo "Valid teams: framework-research, comms-dev"
        exit 1
        ;;
esac

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

# Determine which claude-home volume this team uses
case "$TEAM" in
    framework-research) MEM_VOLUME="ai-teams_fr-claude-home" ;;
    comms-dev)          MEM_VOLUME="ai-teams_cd-claude-home" ;;
esac

echo "Starting '$TEAM' session (fully isolated)..."
echo "  Repo URL:   $REPO_URL"
echo "  Repo path:  /home/ai-teams/workspace/ (inside container)"
echo "  Memory:     docker volume '$MEM_VOLUME'"
echo "  Comms:      docker volume 'ai-teams_comms' (/shared/comms/)"
echo ""
echo "The container will clone/pull the repo, then open a bash shell."
echo "Run 'claude' to start Claude Code."
echo "To stop: exit the shell or Ctrl+D."
echo ""

# Build image (idempotent — both services share the same image)
docker compose -f "$SCRIPT_DIR/docker-compose.yml" build --quiet "$TEAM"

# Start interactive session for the selected team
# --rm removes the container on exit; volumes are preserved
docker compose -f "$SCRIPT_DIR/docker-compose.yml" run --rm "$TEAM" bash
