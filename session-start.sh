#!/usr/bin/env bash
# session-start.sh (*FR:Brunel*)
#
# Start a Claude Code agent team session inside Docker.
# ~/.claude/ state persists across restarts via the 'ai-teams_claude-home' volume.
#
# Usage: ./session-start.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Export host identity and repo path for docker-compose substitution
export HOST_UID="$(id -u)"
export HOST_GID="$(id -g)"
export HOST_USER="$(id -un)"
export REPO_PATH="$SCRIPT_DIR"

echo "Starting ai-teams session..."
echo "  User:       $HOST_USER (uid=$HOST_UID gid=$HOST_GID)"
echo "  Repo:       $SCRIPT_DIR"
echo "  Memory:     docker volume 'ai-teams_claude-home' (~/.claude/)"
echo ""
echo "Session will open a bash shell. Run 'claude' to start Claude Code."
echo "To stop: exit the shell or Ctrl+D."
echo ""

# Build image if not present (idempotent)
docker compose -f "$SCRIPT_DIR/docker-compose.yml" build --quiet

# Start interactive session
# --rm removes the container on exit (volume is preserved separately)
docker compose -f "$SCRIPT_DIR/docker-compose.yml" run --rm session bash
