#!/usr/bin/env bash
# entrypoint.sh (*FR:Brunel*)
#
# Runs as root. Ensures ~/.claude/ inside the named volume has correct
# ownership (Docker creates volumes owned by root before any user exists),
# then uses gosu to drop to the container user and exec the command.
# This preserves all environment variables (ANTHROPIC_API_KEY, etc.).
set -e

CLAUDE_DIR="/home/${HOST_USER:-michelek}/.claude"
TARGET_UID="${HOST_UID:-1000}"
TARGET_GID="${HOST_GID:-1000}"
TARGET_USER="${HOST_USER:-michelek}"

# Fix ownership if dir is owned by root (happens on first run with fresh volume)
if [ -d "$CLAUDE_DIR" ]; then
    OWNER=$(stat -c '%u' "$CLAUDE_DIR")
    if [ "$OWNER" = "0" ]; then
        chown "${TARGET_UID}:${TARGET_GID}" "$CLAUDE_DIR"
    fi
else
    mkdir -p "$CLAUDE_DIR"
    chown "${TARGET_UID}:${TARGET_GID}" "$CLAUDE_DIR"
fi

# Drop to user and exec — gosu preserves the full environment
exec gosu "${TARGET_USER}" "$@"
