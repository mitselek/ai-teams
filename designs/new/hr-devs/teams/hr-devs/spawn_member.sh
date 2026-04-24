#!/usr/bin/env bash
set -euo pipefail

# DEPRECATED — 2026-04-24 (mitselek/ai-teams#60)
# ──────────────────────────────────────────────────────────────────────────────
# tmux-pane spawning retired as the framework default. This design artifact
# remains in designs/new/ as historical reference; do NOT invoke.
#
# New spawn path (issue #60): Agent tool with team_name + name parameters,
# called from the team-lead Claude Code session. No tmux, no subprocess.
# Respawn: ar-remove-member <agent> + re-Agent() call.
# (*FR:Brunel*)
# ──────────────────────────────────────────────────────────────────────────────

echo "ERROR: designs/new/hr-devs spawn_member.sh is deprecated (#60). Do not execute." >&2
exit 1

# spawn_member.sh (*FR:Brunel*)
#
# Container variant of hr-devs spawn_member.sh.
# Adapted from hr-platform/teams/hr-devs/spawn_member.sh with fixes:
#   - NODE_EXTRA_CA_CERTS sourced from .bashrc (not hardcoded)
#   - TMUX_SESSION default: "hr-devs" (container session name)
#   - Eilama daemon support removed (dropped per spec)
#
# Usage: spawn_member.sh [--target-pane %XX] <agent-name> [tmux-session]
#
# tmux session name: "hr-devs" (short name — NOT "hr-devs" full team name, they happen to match)
# See container-deployment-runbook.md §15 and §21.

# Parse --target-pane option
TARGET_PANE=""
if [[ "${1:-}" == "--target-pane" ]]; then
  TARGET_PANE="${2:?--target-pane requires a pane ID (e.g. %25)}"
  shift 2
fi

AGENT_NAME="${1:?Usage: spawn_member.sh [--target-pane %XX] <agent-name> [tmux-session]}"
TMUX_SESSION="${2:-hr-devs}"

TEAM_NAME="hr-devs"
TEAM_DIR="$HOME/.claude/teams/$TEAM_NAME"
CONFIG="$TEAM_DIR/config.json"

# Roster lives in the cloned hr-platform repo (not baked into container image)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROSTER="$HOME/workspace/hr-platform/teams/hr-devs/roster.json"
PROMPTS_DIR="$HOME/workspace/hr-platform/teams/hr-devs/prompts"

# Validate prerequisites
[[ -f "$CONFIG" ]] || { echo "ERROR: $CONFIG not found. Run TeamCreate first."; exit 1; }
[[ -f "$ROSTER" ]] || { echo "ERROR: $ROSTER not found. Is hr-platform cloned?"; exit 1; }

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

# Read prompt from dedicated file
PROMPT_FILE=""
if [[ -f "$PROMPTS_DIR/$AGENT_NAME.md" ]]; then
  PROMPT_FILE="$PROMPTS_DIR/$AGENT_NAME.md"
fi

# Read leadSessionId
LEAD_SESSION_ID=$(jq -r '.leadSessionId' "$CONFIG")

# Build spawn script
SPAWN_SCRIPT=$(mktemp /tmp/spawn-cmd-XXXXXX.sh)
{
  echo '#!/usr/bin/env bash'
  echo 'export CLAUDECODE=1'
  echo 'export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1'
  # NODE_EXTRA_CA_CERTS: use the value from .bashrc (set by entrypoint).
  # Not hardcoded — path differs between bare-metal (/home/dev/.claude/custom_certs.pem)
  # and container (/opt/warp-ca.pem). Source .bashrc to pick up the correct value.
  echo 'source ~/.bashrc 2>/dev/null || true'
  echo "export CLAUDE_ENV_ID=\"HR-DEVS\""
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

if [[ -n "$TARGET_PANE" ]]; then
  TMUX_PANE_ID="$TARGET_PANE"
  tmux send-keys -t "$TARGET_PANE" "bash $SPAWN_SCRIPT" Enter
else
  # Fallback: split a new pane (uncontrolled layout — prefer --target-pane)
  tmux split-window -t "$TMUX_SESSION" -h -l '70%' -c "$HOME/workspace/hr-platform/conversations" \
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
