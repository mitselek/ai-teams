#!/usr/bin/env bash
set -euo pipefail

# apply-layout.sh — Create 7-pane tmux layout for screenwerk-dev
#
# Layout: 3 columns
#   Left (20%):  Lumiere (team lead) — pane 0
#   Center (40%): Daguerre (top), Niepce (mid), Talbot (bottom)
#   Right (40%):  Reynaud (top), Plateau (mid), Melies (bottom)
#
# (*FR:Brunel*)

SESSION="screenwerk-dev"
WORK_DIR="$HOME/workspace"

if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "Session $SESSION already exists. Attaching."
    exec tmux -u attach -t "$SESSION"
fi

# Get window dimensions
W=$(tmux display -p '#{window_width}' 2>/dev/null || echo 220)
H=$(tmux display -p '#{window_height}' 2>/dev/null || echo 55)

# Create session with first pane (Lumiere — team lead)
tmux -u new-session -d -s "$SESSION" -c "$WORK_DIR" -x "$W" -y "$H"

# Split into 3 columns: left 20%, center 40%, right 40%
# First split: left (20%) | right (80%)
tmux split-window -t "$SESSION" -h -l "80%" -c "$WORK_DIR"
# Split right into center (50%) | right (50%) — each is 40% of total
tmux split-window -t "$SESSION:.1" -h -l "50%" -c "$WORK_DIR"

# Split center column into 3 rows
tmux split-window -t "$SESSION:.1" -v -l "66%" -c "$WORK_DIR"
tmux split-window -t "$SESSION:.2" -v -l "50%" -c "$WORK_DIR"

# Split right column into 3 rows
tmux split-window -t "$SESSION:.4" -v -l "66%" -c "$WORK_DIR"
tmux split-window -t "$SESSION:.5" -v -l "50%" -c "$WORK_DIR"

# Label panes (visible in tmux border with pane-border-format)
tmux select-pane -t "$SESSION:.0" -T "Lumiere"
tmux select-pane -t "$SESSION:.1" -T "Daguerre"
tmux select-pane -t "$SESSION:.2" -T "Niepce"
tmux select-pane -t "$SESSION:.3" -T "Talbot"
tmux select-pane -t "$SESSION:.4" -T "Reynaud"
tmux select-pane -t "$SESSION:.5" -T "Plateau"
tmux select-pane -t "$SESSION:.6" -T "Melies"

# Enable pane border labels
tmux set -t "$SESSION" pane-border-status top
tmux set -t "$SESSION" pane-border-format " #{pane_index}: #{pane_title} "

# Write pane IDs to env file for spawn_member.sh
PANE_FILE="/tmp/screenwerk-panes.env"
{
    echo "PANE_LUMIERE=$(tmux list-panes -t "$SESSION" -F '#{pane_index} #{pane_id}' | awk '$1==0 {print $2}')"
    echo "PANE_DAGUERRE=$(tmux list-panes -t "$SESSION" -F '#{pane_index} #{pane_id}' | awk '$1==1 {print $2}')"
    echo "PANE_NIEPCE=$(tmux list-panes -t "$SESSION" -F '#{pane_index} #{pane_id}' | awk '$1==2 {print $2}')"
    echo "PANE_TALBOT=$(tmux list-panes -t "$SESSION" -F '#{pane_index} #{pane_id}' | awk '$1==3 {print $2}')"
    echo "PANE_REYNAUD=$(tmux list-panes -t "$SESSION" -F '#{pane_index} #{pane_id}' | awk '$1==4 {print $2}')"
    echo "PANE_PLATEAU=$(tmux list-panes -t "$SESSION" -F '#{pane_index} #{pane_id}' | awk '$1==5 {print $2}')"
    echo "PANE_MELIES=$(tmux list-panes -t "$SESSION" -F '#{pane_index} #{pane_id}' | awk '$1==6 {print $2}')"
} > "$PANE_FILE"

echo "Layout created. Pane IDs in $PANE_FILE"
echo "Panes:"
tmux list-panes -t "$SESSION" -F '  #{pane_index}: #{pane_id} #{pane_title} (#{pane_width}x#{pane_height})'

# Focus on lead pane
tmux select-pane -t "$SESSION:.0"
