#!/usr/bin/env bash
# entrypoint.sh (*FR:Brunel*)
#
# Runs as root. Three tasks before handing off to the ai-teams user:
# 1. Fix ~/.claude/ volume ownership (Docker creates named volumes as root)
# 2. Clone repo to ~/workspace/ on first run, or git pull on subsequent runs
# 3. gosu drop to ai-teams and exec the requested command (preserves env vars)
#
# Required env vars:
#   GITHUB_TOKEN  — personal access token for HTTPS git operations
#   REPO_URL      — git remote URL (e.g. https://github.com/mitselek/ai-teams.git)
set -e

CONTAINER_USER="ai-teams"
CONTAINER_UID="1000"
CONTAINER_GID="1000"
HOME_DIR="/home/ai-teams"
CLAUDE_DIR="${HOME_DIR}/.claude"
WORKSPACE="${HOME_DIR}/workspace"

COMMS_DIR="/shared/comms"

# ── Step 1: Fix volume ownership ────────────────────────────────────────────
# Docker creates named volumes owned by root. Fix on first container start.
for DIR in "$CLAUDE_DIR" "$COMMS_DIR"; do
    if [ -d "$DIR" ]; then
        OWNER=$(stat -c '%u' "$DIR")
        if [ "$OWNER" = "0" ]; then
            chown "${CONTAINER_UID}:${CONTAINER_GID}" "$DIR"
        fi
    else
        mkdir -p "$DIR"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "$DIR"
    fi
done

# ── Step 2: Repo clone or pull ───────────────────────────────────────────────
if [ -z "${REPO_URL:-}" ]; then
    echo "ERROR: REPO_URL is not set." >&2
    exit 1
fi
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "ERROR: GITHUB_TOKEN is not set." >&2
    exit 1
fi

# Inject token into URL for HTTPS auth (not logged, not stored in image)
AUTH_URL=$(echo "$REPO_URL" | sed "s|https://|https://${GITHUB_TOKEN}@|")

if [ -d "${WORKSPACE}/.git" ]; then
    echo "[entrypoint] Repo exists — running git pull..."
    # Refresh remote URL with current token (token may rotate between sessions)
    gosu "${CONTAINER_USER}" git -C "${WORKSPACE}" remote set-url origin "${AUTH_URL}"
    gosu "${CONTAINER_USER}" git -C "${WORKSPACE}" pull --ff-only
else
    echo "[entrypoint] First run — cloning repo to ${WORKSPACE}..."
    mkdir -p "${WORKSPACE}"
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "${WORKSPACE}"
    gosu "${CONTAINER_USER}" git clone "${AUTH_URL}" "${WORKSPACE}"
fi

# ── Step 3: Drop privileges and exec ────────────────────────────────────────
exec gosu "${CONTAINER_USER}" "$@"
