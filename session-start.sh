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

# Validate required credentials
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "ERROR: GITHUB_TOKEN is not set."
    echo "Set it in your environment or create $SCRIPT_DIR/.env:"
    echo "  echo 'GITHUB_TOKEN=ghp_...' >> $SCRIPT_DIR/.env"
    exit 1
fi

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
