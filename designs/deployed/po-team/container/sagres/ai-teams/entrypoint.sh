#!/usr/bin/env bash
# Fix home-volume ownership (docker creates volumes as root), seed
# authorized_keys from AUTHORIZED_KEYS env on first run, then exec CMD (sshd).
set -e

HOME_DIR=/home/ai-teams
if [ "$(stat -c '%u' "$HOME_DIR")" = "0" ]; then
    chown 1000:1000 "$HOME_DIR"
fi
mkdir -p "$HOME_DIR/.ssh"
if [ -n "${AUTHORIZED_KEYS:-}" ] && [ ! -s "$HOME_DIR/.ssh/authorized_keys" ]; then
    printf '%s\n' "$AUTHORIZED_KEYS" > "$HOME_DIR/.ssh/authorized_keys"
fi
chown -R 1000:1000 "$HOME_DIR/.ssh"
chmod 700 "$HOME_DIR/.ssh"
chmod 600 "$HOME_DIR/.ssh/authorized_keys" 2>/dev/null || true

exec "$@"
