#!/bin/bash
# rc-start.sh — start a clean team-lead session
# Usage: ~/rc-start.sh
# Cleans stale team state, sends startup prompt, starts Claude Code
set -e

TEAMS_DIR="$HOME/.claude/teams"
TMUX_BIN="/home/dev/local/bin/tmux"
source ~/.profile

echo "[rc-start] Cleaning stale team state..."

# Remove ALL team runtime dirs — forces TeamCreate on startup
if [ -d "$TEAMS_DIR" ]; then
    for d in "$TEAMS_DIR"/*/; do
        [ -d "$d" ] && rm -rf "$d" && echo "[rc-start] Removed $d"
    done
fi

# Kill ALL agent panes (keep only pane %0 — the team-lead pane)
PANES=$($TMUX_BIN list-panes -t "$CLAUDE_ENV_ID" -F "#{pane_id}" 2>/dev/null | grep -v '%0' || true)
if [ -n "$PANES" ]; then
    for p in $PANES; do
        $TMUX_BIN kill-pane -t "$p" 2>/dev/null || true
    done
    echo "[rc-start] Killed leftover panes: $PANES"
fi

# Queue the startup prompt — will be waiting in the input buffer when Claude loads
STARTUP_MSG='Sa oled cloudflare-builders tiimi team-lead. Tee startup sammud: 1) cd ~/github/dev-toolkit && git pull 2) TeamCreate(team_name="cloudflare-builders") 3) Loe roster dev-toolkit/teams/cloudflare-builders.json ja common-prompt.md 4) Spawni Finn tiimiliikmena (run_in_background: true). Seejärel raporteeri et oled valmis ja oota ülesannet.'

echo "[rc-start] Starting Claude Code with auto-prompt..."
cd ~/github/hr-platform/conversations

# Start claude in background, wait for it to load, then send the prompt
claude --model sonnet &
CLAUDE_PID=$!
sleep 6
$TMUX_BIN send-keys -t %0 "$STARTUP_MSG"
$TMUX_BIN send-keys -t %0 C-m
echo "[rc-start] Startup prompt sent"
wait $CLAUDE_PID
