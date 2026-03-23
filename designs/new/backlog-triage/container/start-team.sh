#!/usr/bin/env bash
set -euo pipefail

# start-team.sh — One-shot startup for backlog-triage team
#
# Usage: start-team.sh [tmux-session]
#
# Assumes:
#   - You are already inside Claude as Theseus (team-lead).
#   - TeamCreate("backlog-triage") has already been called.
#
# This script:
#   1. Creates pane layout if not already done (idempotent — skips if
#      /tmp/backlog-triage-panes.env already exists from .bashrc startup hook)
#   2. Spawns all 3 specialist agents into their assigned panes
#
# After this script finishes, wait for all 3 agents to send their intro
# messages before assigning work.
#
# Agent assignment:
#   Left column (30%)        : team-lead (YOU — already here, not spawned)
#   Right column top (33%)   : archivist (Hypatia)
#   Right column mid  (33%)  : forensic  (Vidocq)
#   Right column bot  (33%)  : consul    (Portia)

TMUX_SESSION="${1:-backlog-triage}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PANE_ENV="/tmp/backlog-triage-panes.env"

echo "[start-team] Starting backlog-triage team in session: $TMUX_SESSION"
echo ""

# Step 1: Create pane layout (skip if already done by .bashrc startup hook)
if [ -f "$PANE_ENV" ]; then
    echo "[start-team] Step 1/2: Pane layout already exists ($PANE_ENV) — skipping apply-layout.sh"
else
    echo "[start-team] Step 1/2: Creating pane layout..."
    bash "$SCRIPT_DIR/apply-layout.sh" "$TMUX_SESSION"
    echo ""
fi

# Load pane IDs
source "$PANE_ENV"

echo "[start-team] Step 2/2: Spawning 3 specialist agents..."

bash "$SCRIPT_DIR/spawn_member.sh" --target-pane "$PANE_ARCHIVIST" archivist "$TMUX_SESSION"
sleep 1
bash "$SCRIPT_DIR/spawn_member.sh" --target-pane "$PANE_FORENSIC" forensic "$TMUX_SESSION"
sleep 1
bash "$SCRIPT_DIR/spawn_member.sh" --target-pane "$PANE_CONSUL" consul "$TMUX_SESSION"
echo ""

echo "[start-team] Done. All 3 agents spawned."
echo "Panes are labeled with agent names (Theseus, Hypatia, Vidocq, Portia) in the tmux borders."
echo "Wait for intro messages from: archivist, forensic, consul."
