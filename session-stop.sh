#!/usr/bin/env bash
# session-stop.sh (*FR:Brunel*)
#
# Stop all running session containers. Named volumes are preserved.
#
# Usage:
#   ./session-stop.sh                       # stop containers, keep all volumes
#   ./session-stop.sh --wipe-memory [team]  # delete a team's claude-home volume
#                                           # team: framework-research (default) or comms-dev
#   ./session-stop.sh --wipe-all            # delete ALL volumes (irreversible!)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-}"
TEAM="${2:-framework-research}"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
    # shellcheck disable=SC1091
    set -a && source "$SCRIPT_DIR/.env" && set +a
fi

export REPO_URL="${REPO_URL:-https://github.com/mitselek/ai-teams.git}"

echo "Stopping ai-teams session containers..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" down

if [ "$MODE" = "--wipe-memory" ]; then
    case "$TEAM" in
        framework-research) MEM_VOLUME="ai-teams_fr-claude-home" ;;
        comms-dev)          MEM_VOLUME="ai-teams_cd-claude-home" ;;
        *)
            echo "ERROR: Unknown team '$TEAM'. Use: framework-research, comms-dev"
            exit 1
            ;;
    esac
    echo ""
    echo "WARNING: Deleting $MEM_VOLUME — wipes $TEAM's ~/.claude/ memory permanently."
    read -r -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        docker volume rm "$MEM_VOLUME" && echo "Volume deleted."
    else
        echo "Aborted. Volume preserved."
    fi
elif [ "$MODE" = "--wipe-all" ]; then
    echo ""
    echo "WARNING: Deleting ALL volumes. This is irreversible."
    echo "  ai-teams_fr-claude-home  (framework-research auto-memory)"
    echo "  ai-teams_cd-claude-home  (comms-dev auto-memory)"
    echo "  ai-teams_repo-data       (shared git repo)"
    echo "  ai-teams_comms           (inter-team comms)"
    read -r -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        docker volume rm \
            ai-teams_fr-claude-home \
            ai-teams_cd-claude-home \
            ai-teams_repo-data \
            ai-teams_comms \
            && echo "All volumes deleted."
    else
        echo "Aborted. Volumes preserved."
    fi
else
    echo ""
    echo "Volumes preserved:"
    echo "  ai-teams_fr-claude-home  (framework-research ~/.claude/)"
    echo "  ai-teams_cd-claude-home  (comms-dev ~/.claude/)"
    echo "  ai-teams_repo-data       (shared git repo)"
    echo "  ai-teams_comms           (inter-team comms at /shared/comms/)"
    echo ""
    echo "To wipe a team's memory:  $0 --wipe-memory [framework-research|comms-dev]"
    echo "To wipe everything:       $0 --wipe-all"
fi
