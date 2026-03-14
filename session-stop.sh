#!/usr/bin/env bash
# session-stop.sh (*FR:Brunel*)
#
# Stop all running session containers. Named volumes are preserved.
#
# Usage:
#   ./session-stop.sh                 # stop containers, keep all volumes
#   ./session-stop.sh --wipe-memory   # also delete claude-home volume (irreversible!)
#   ./session-stop.sh --wipe-all      # also delete claude-home AND repo-data volumes
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-}"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
    # shellcheck disable=SC1091
    set -a && source "$SCRIPT_DIR/.env" && set +a
fi

export REPO_URL="${REPO_URL:-https://github.com/mitselek/ai-teams.git}"

echo "Stopping ai-teams session containers..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" down

if [ "$MODE" = "--wipe-memory" ]; then
    echo ""
    echo "WARNING: Deleting claude-home volume — this wipes ~/.claude/ memory permanently."
    read -r -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        docker volume rm ai-teams_claude-home && echo "claude-home volume deleted."
    else
        echo "Aborted. Volume preserved."
    fi
elif [ "$MODE" = "--wipe-all" ]; then
    echo ""
    echo "WARNING: Deleting ALL volumes (claude-home + repo-data). This is irreversible."
    read -r -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        docker volume rm ai-teams_claude-home ai-teams_repo-data && echo "All volumes deleted."
    else
        echo "Aborted. Volumes preserved."
    fi
else
    echo ""
    echo "Volumes preserved:"
    echo "  ai-teams_claude-home  (~/.claude/ auto-memory)"
    echo "  ai-teams_repo-data    (git repo)"
    echo ""
    echo "To wipe memory:   $0 --wipe-memory"
    echo "To wipe all:      $0 --wipe-all"
fi
