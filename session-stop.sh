#!/usr/bin/env bash
# session-stop.sh (*FR:Brunel*)
#
# Stop all running session containers and show volume status.
# Volume 'ai-teams_claude-home' is preserved (your ~/.claude/ memory lives here).
#
# Usage: ./session-stop.sh [--wipe-memory]
#   --wipe-memory  Also delete the claude-home volume (irreversible!)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WIPE_MEMORY="${1:-}"

# Export vars needed by docker-compose.yml substitution
export HOST_UID="$(id -u)"
export HOST_GID="$(id -g)"
export HOST_USER="$(id -un)"
export REPO_PATH="$SCRIPT_DIR"

echo "Stopping ai-teams session containers..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" down

if [ "$WIPE_MEMORY" = "--wipe-memory" ]; then
  echo ""
  echo "WARNING: Deleting claude-home volume — this wipes ~/.claude/ memory permanently."
  read -r -p "Are you sure? (yes/no): " confirm
  if [ "$confirm" = "yes" ]; then
    docker volume rm ai-teams_claude-home && echo "Volume deleted."
  else
    echo "Aborted. Volume preserved."
  fi
else
  echo ""
  echo "Volume 'ai-teams_claude-home' preserved. Memory intact."
  echo "To intentionally wipe: $0 --wipe-memory"
fi
