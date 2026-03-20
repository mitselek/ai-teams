#!/usr/bin/env bash
set -euo pipefail

# apply-layout.sh — Create tmux pane structure for backlog-triage (*FR:Brunel*)
#
# Usage: apply-layout.sh [tmux-session]
#
# Creates the pipeline layout (2 columns):
#
#   | team-lead  | archivist  |
#   |   30%      |------------|
#   |            | forensic   |
#   |            |------------|
#   |            | consul     |
#
# Split tree:
#   Window (%0) — initial pane becomes team-lead (left 30%)
#   └── split -h 70% → right_col
#       ├── archivist (top third of right_col)
#       ├── split -v → forensic (middle third)
#       └── split -v → consul (bottom third)
#
# After running, pane IDs are written to /tmp/backlog-triage-panes.env:
#   PANE_LEAD=%XX
#   PANE_ARCHIVIST=%XX
#   PANE_FORENSIC=%XX
#   PANE_CONSUL=%XX
#
# Safe to run from Claude's Bash tool or external SSH. Uses -l (absolute sizes)
# not -p (percent) — tmux requires an attached client to resolve percentages,
# which fails from subprocesses (see runbook §17). Uses -d to keep focus on
# team-lead's pane, and -P -F '#{pane_id}' to capture pane IDs reliably.

TMUX_SESSION="${1:-backlog-triage}"
WORK_DIR="${HOME}/workspace/hr-platform"
PANE_ENV="/tmp/backlog-triage-panes.env"

# Verify session exists
if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
    echo "ERROR: tmux session '$TMUX_SESSION' not found." >&2
    echo "Create it first: tmux new-session -d -s $TMUX_SESSION" >&2
    exit 1
fi

echo "[apply-layout] Creating pipeline layout for session: $TMUX_SESSION"

# Get window dimensions — works without an attached client
TOTAL_W=$(tmux display-message -t "$TMUX_SESSION" -p '#{window_width}')
TOTAL_H=$(tmux display-message -t "$TMUX_SESSION" -p '#{window_height}')

# Step 1: The initial pane is team-lead (left 30%)
PANE_LEAD=$(tmux list-panes -t "$TMUX_SESSION" -F '#{pane_id}' | head -1)
echo "  team-lead  → $PANE_LEAD (window ${TOTAL_W}x${TOTAL_H})"

# Step 2: Split right 70% — absolute column count, -d keeps focus on team-lead
RIGHT_W=$((TOTAL_W * 70 / 100))
PANE_ARCHIVIST=$(tmux split-window -t "$PANE_LEAD" -d -h -l $RIGHT_W -c "$WORK_DIR" -P -F '#{pane_id}' 'bash --norc -i')

# Step 3: Split right column vertically — archivist takes top third, forensic middle, consul bottom.
# Split once to get forensic+consul block (bottom 2/3 → then split again).
# Easier: split archivist pane in half to get forensic, then split forensic in half to get consul.
# Each split divides the remaining space, so:
#   - First split: archivist (top ~33%), forensic+consul_block (bottom ~67%)
#   - Second split of forensic+consul_block: forensic (top 50% of block = ~33% total), consul (bottom 50% = ~33% total)
SPLIT_H=$((TOTAL_H * 2 / 3))
PANE_FORENSIC=$(tmux split-window -t "$PANE_ARCHIVIST" -d -v -l $SPLIT_H -c "$WORK_DIR" -P -F '#{pane_id}' 'bash --norc -i')

# Step 4: Split forensic+consul block in half → forensic (top), consul (bottom)
CONSUL_H=$((SPLIT_H / 2))
PANE_CONSUL=$(tmux split-window -t "$PANE_FORENSIC" -d -v -l $CONSUL_H -c "$WORK_DIR" -P -F '#{pane_id}' 'bash --norc -i')

# Write pane IDs for entrypoint auto-tmux and manual spawn
cat > "$PANE_ENV" << EOF
PANE_LEAD=$PANE_LEAD
PANE_ARCHIVIST=$PANE_ARCHIVIST
PANE_FORENSIC=$PANE_FORENSIC
PANE_CONSUL=$PANE_CONSUL
EOF

# Label panes with agent names (runbook §19 — no -g, scoped to this session only)
tmux select-pane -t "$PANE_LEAD"      -T "team-lead"
tmux select-pane -t "$PANE_ARCHIVIST" -T "archivist"
tmux select-pane -t "$PANE_FORENSIC"  -T "forensic"
tmux select-pane -t "$PANE_CONSUL"    -T "consul"

tmux set-option -t "$TMUX_SESSION" pane-border-format " #{pane_title} "
tmux set-option -t "$TMUX_SESSION" pane-border-status top

echo "[apply-layout] Done. Pane IDs written to $PANE_ENV"
