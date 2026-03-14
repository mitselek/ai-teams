#!/usr/bin/env bash
# (*CD:Babbage*)
# start-broker.sh — launch the comms-dev message broker daemon.
#
# Run inside the comms-dev container (or any host with Node.js + tsx).
#
# Environment:
#   COMMS_TEAM_NAME    — team name registered in registry (default: comms-dev)
#   COMMS_TEAM_PREFIX  — log prefix (default: CD)
#   COMMS_SOCKET_DIR   — UDS socket directory (default: /shared/comms)
#   COMMS_PSK_FILE     — path to PSK hex file (default: /run/secrets/comms-psk)
#                        If absent, broker starts in PLAINTEXT mode (dev only)
#
# Usage:
#   ./comms-dev/scripts/start-broker.sh
#   COMMS_PSK_FILE=/tmp/my-psk ./comms-dev/scripts/start-broker.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMMS_DIR="$REPO_ROOT/comms-dev"

export COMMS_TEAM_NAME="${COMMS_TEAM_NAME:-comms-dev}"
export COMMS_TEAM_PREFIX="${COMMS_TEAM_PREFIX:-CD}"
export COMMS_SOCKET_DIR="${COMMS_SOCKET_DIR:-/shared/comms}"
export COMMS_PSK_FILE="${COMMS_PSK_FILE:-/run/secrets/comms-psk}"

# Ensure socket directory exists and is writable
mkdir -p "$COMMS_SOCKET_DIR"

echo "[start-broker] Team:       $COMMS_TEAM_NAME"
echo "[start-broker] Socket dir: $COMMS_SOCKET_DIR"
echo "[start-broker] PSK file:   $COMMS_PSK_FILE"

cd "$COMMS_DIR"

# Install deps if node_modules is missing (first run in fresh volume)
if [ ! -d node_modules ]; then
    echo "[start-broker] Installing dependencies..."
    npm install
fi

exec npx tsx src/broker/daemon.ts
