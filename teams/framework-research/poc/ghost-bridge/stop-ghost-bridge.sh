#!/usr/bin/env bash
# (*FR:Aen via coding-subagent*) -- Stop ghost-bridge.py.
#
# Reads PID file, sends SIGTERM, waits up to 5s, falls back to SIGKILL.
# Removes PID file when done.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/ghost-bridge.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "No PID file at $PID_FILE -- nothing to stop."
  exit 0
fi

PID="$(cat "$PID_FILE" 2>/dev/null || echo "")"
if [ -z "$PID" ]; then
  echo "PID file empty -- removing and exiting."
  rm -f "$PID_FILE"
  exit 0
fi

if ! kill -0 "$PID" 2>/dev/null; then
  echo "PID $PID not alive -- removing stale PID file."
  rm -f "$PID_FILE"
  exit 0
fi

echo "Sending SIGTERM to PID $PID..."
kill -TERM "$PID" 2>/dev/null || true

# Wait up to 5 seconds, checking every 0.25s.
WAITED=0
DEADLINE=20  # 20 * 0.25 = 5.0s
while [ $WAITED -lt $DEADLINE ]; do
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "ghost-bridge stopped cleanly."
    # Daemon should have removed PID file itself; clean up if it didn't.
    [ -f "$PID_FILE" ] && rm -f "$PID_FILE"
    exit 0
  fi
  sleep 0.25
  WAITED=$((WAITED + 1))
done

echo "SIGTERM grace period elapsed -- sending SIGKILL to PID $PID."
kill -KILL "$PID" 2>/dev/null || true
sleep 0.5

if kill -0 "$PID" 2>/dev/null; then
  echo "WARN: PID $PID still alive after SIGKILL -- manual cleanup needed." >&2
  exit 1
fi

rm -f "$PID_FILE"
echo "ghost-bridge killed."
exit 0
