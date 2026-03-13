#!/usr/bin/env bash
set -euo pipefail

# Usage: spawn_member.sh [--target-pane %XX] <agent-name> [tmux-session]
# Reads roster, registers in config.json, spawns in tmux pane.

# Parse --target-pane option
TARGET_PANE=""
if [[ "${1:-}" == "--target-pane" ]]; then
  TARGET_PANE="${2:?--target-pane requires a pane ID (e.g. %25)}"
  shift 2
fi

AGENT_NAME="${1:?Usage: spawn_member.sh [--target-pane %XX] <agent-name> [tmux-session]}"
TMUX_SESSION="${2:-RC-DEV}"

TEAM_NAME="framework-research"
TEAM_DIR="$HOME/.claude/teams/$TEAM_NAME"
CONFIG="$TEAM_DIR/config.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROSTER="$SCRIPT_DIR/roster.json"

# Validate prerequisites
[[ -f "$CONFIG" ]] || { echo "ERROR: $CONFIG not found. Run TeamCreate first."; exit 1; }
[[ -f "$ROSTER" ]] || { echo "ERROR: $ROSTER not found."; exit 1; }

# Check not already registered
if jq -e ".members[] | select(.name == \"$AGENT_NAME\")" "$CONFIG" >/dev/null 2>&1; then
  echo "ERROR: $AGENT_NAME already registered in config.json"
  exit 1
fi

# Validate target pane exists (if specified)
if [[ -n "$TARGET_PANE" ]]; then
  if ! tmux list-panes -t "$TMUX_SESSION" -F '#{pane_id}' | grep -q "^${TARGET_PANE}$"; then
    echo "ERROR: Target pane $TARGET_PANE not found in session $TMUX_SESSION"
    exit 1
  fi
fi

# Read roster entry
ROSTER_ENTRY=$(jq -r ".members[] | select(.name == \"$AGENT_NAME\")" "$ROSTER")
[[ -n "$ROSTER_ENTRY" ]] || { echo "ERROR: $AGENT_NAME not found in roster."; exit 1; }

MODEL=$(echo "$ROSTER_ENTRY" | jq -r '.model')
COLOR=$(echo "$ROSTER_ENTRY" | jq -r '.color // "gray"')
AGENT_TYPE=$(echo "$ROSTER_ENTRY" | jq -r '.agentType // "general-purpose"')

# Read prompt from dedicated file (prompts/<name>.md)
PROMPTS_DIR="$SCRIPT_DIR/prompts"
PROMPT_FILE=""
if [[ -f "$PROMPTS_DIR/$AGENT_NAME.md" ]]; then
  PROMPT_FILE="$PROMPTS_DIR/$AGENT_NAME.md"
fi

# Read leadSessionId
LEAD_SESSION_ID=$(jq -r '.leadSessionId' "$CONFIG")

# Build spawn script (avoids all quoting issues with tmux)
SPAWN_SCRIPT=$(mktemp /tmp/spawn-cmd-XXXXXX.sh)
{
  echo '#!/usr/bin/env bash'
  echo 'export CLAUDECODE=1'
  echo 'export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1'
  echo 'export NODE_EXTRA_CA_CERTS=/home/dev/.claude/custom_certs.pem'
  if [[ -n "$PROMPT_FILE" ]]; then
    echo "PROMPT=\"\$(cat '$PROMPT_FILE')\""
  fi
  printf 'exec claude --agent-id "%s" \\\n' "${AGENT_NAME}@${TEAM_NAME}"
  printf '  --agent-name "%s" --team-name "%s" \\\n' "$AGENT_NAME" "$TEAM_NAME"
  printf '  --agent-color "%s" --parent-session-id "%s" \\\n' "$COLOR" "$LEAD_SESSION_ID"
  printf '  --agent-type general-purpose --model "%s"' "$MODEL"
  if [[ -n "$PROMPT_FILE" ]]; then
    printf ' \\\n  --append-system-prompt "$PROMPT"'
  fi
  printf ' \\\n  "Loe oma prompt ja scratchpad. Saada team-leadile intro ja jää standby'"'"'sse."'
  echo
} > "$SPAWN_SCRIPT"
chmod +x "$SPAWN_SCRIPT"

# Working directory for this team
WORK_DIR="$HOME/github/mitselek-ai-teams"

if [[ -n "$TARGET_PANE" ]]; then
  TMUX_PANE_ID="$TARGET_PANE"
  tmux send-keys -t "$TARGET_PANE" "cd '$WORK_DIR' && bash $SPAWN_SCRIPT" Enter
else
  tmux split-window -t "$TMUX_SESSION" -h -l '70%' -c "$WORK_DIR" \
    "$SPAWN_SCRIPT"
  TMUX_PANE_ID=$(tmux list-panes -t "$TMUX_SESSION" -F '#{pane_id}' | tail -1)
fi

# Register in config.json
TIMESTAMP=$(date +%s)000
jq --arg name "$AGENT_NAME" \
   --arg agentId "${AGENT_NAME}@${TEAM_NAME}" \
   --arg agentType "$AGENT_TYPE" \
   --arg model "$MODEL" \
   --arg color "$COLOR" \
   --arg paneId "$TMUX_PANE_ID" \
   --argjson joinedAt "$TIMESTAMP" \
   '.members += [{
     agentId: $agentId,
     name: $name,
     agentType: $agentType,
     model: $model,
     color: $color,
     joinedAt: $joinedAt,
     tmuxPaneId: $paneId,
     backendType: "tmux",
     cwd: "",
     subscriptions: []
   }]' "$CONFIG" > "${CONFIG}.tmp" && mv "${CONFIG}.tmp" "$CONFIG"

echo "Spawned $AGENT_NAME in pane $TMUX_PANE_ID"
echo "Done."
