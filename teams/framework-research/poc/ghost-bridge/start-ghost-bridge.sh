#!/usr/bin/env bash
# (*FR:Aen via coding-subagent*) -- Launch ghost-bridge.py in the background.
#
# Refuses to start if PID file exists AND that PID is alive. Writes the PID
# of the launched python process. Output (stdout/stderr from the daemon itself
# beyond its own log file) is discarded.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAEMON="$SCRIPT_DIR/ghost-bridge.py"
CONFIG="$SCRIPT_DIR/ghost-bridge.config.json"
PID_FILE="$SCRIPT_DIR/ghost-bridge.pid"

if [ ! -f "$DAEMON" ]; then
  echo "ERROR: daemon script not found: $DAEMON" >&2
  exit 1
fi
if [ ! -f "$CONFIG" ]; then
  echo "ERROR: config not found: $CONFIG" >&2
  echo "       Copy ghost-bridge.config.example.json to ghost-bridge.config.json and edit." >&2
  exit 1
fi

# Liveness check on existing PID file.
if [ -f "$PID_FILE" ]; then
  EXISTING_PID="$(cat "$PID_FILE" 2>/dev/null || echo "")"
  if [ -n "$EXISTING_PID" ] && kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "ERROR: ghost-bridge already running (PID $EXISTING_PID per $PID_FILE)" >&2
    exit 1
  fi
  echo "Stale PID file found (PID $EXISTING_PID not alive) -- removing."
  rm -f "$PID_FILE"
fi

# Pick a python interpreter. Prefer `python3`, fall back to `python` (Windows).
if command -v python3 >/dev/null 2>&1; then
  PYTHON=python3
elif command -v python >/dev/null 2>&1; then
  PYTHON=python
else
  echo "ERROR: no python3/python on PATH" >&2
  exit 1
fi

# Launch detached. nohup + & is the portable shape; works on Linux, macOS, and
# Git Bash on Windows. Daemon writes its own PID file on startup, but we ALSO
# capture $! and write it ourselves to cover the brief window before the daemon
# does so itself. Daemon may overwrite -- that's fine, same value.
nohup "$PYTHON" "$DAEMON" --config "$CONFIG" >/dev/null 2>&1 &
LAUNCHED_PID=$!

# Persist PID we just launched. Daemon will (re)write same value.
echo "$LAUNCHED_PID" > "$PID_FILE"

# Tiny grace period to let the daemon either crash visibly or stabilize.
sleep 0.5
if ! kill -0 "$LAUNCHED_PID" 2>/dev/null; then
  echo "ERROR: daemon exited immediately -- check $SCRIPT_DIR/ghost-bridge.log" >&2
  rm -f "$PID_FILE"
  exit 1
fi

echo "ghost-bridge started (PID $LAUNCHED_PID). Log: $SCRIPT_DIR/ghost-bridge.log"
exit 0
