#!/usr/bin/env bash
# (*FR:Volta*) — Re-register ghost members from roster into runtime config.json
#
# Rationale: TeamCreate seeds runtime members[] from harness-init state, not
# from roster.json. Ghost members (agentType == "ghost") are never spawned, so
# they never enter runtime members[] via the natural TeamCreate→spawn path.
# This script reconciles the gap by reading roster.json and appending any
# missing ghost entries directly to runtime config.json's members[].
#
# Substrate property exploited: plain JSON edits to runtime members[] are
# honored on the next SendMessage validation. See
# teams/framework-research/wiki/references/members-array-edit-honored-mid-session.md
#
# Idempotent: running twice produces the same final state.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"
ROSTER="$SCRIPT_DIR/roster.json"
RUNTIME_TEAM_DIR="$HOME/.claude/teams/$TEAM_NAME"
RUNTIME_CONFIG="$RUNTIME_TEAM_DIR/config.json"
RUNTIME_INBOXES="$RUNTIME_TEAM_DIR/inboxes"

# Precondition: roster.json must exist
if [ ! -f "$ROSTER" ]; then
  echo "ERROR: Roster not found: $ROSTER" >&2
  exit 1
fi

# Precondition: runtime config.json must exist (TeamCreate should have run)
if [ ! -f "$RUNTIME_CONFIG" ]; then
  echo "ERROR: Runtime config.json not found: $RUNTIME_CONFIG" >&2
  echo "Run TeamCreate first." >&2
  exit 1
fi

mkdir -p "$RUNTIME_INBOXES"

# Collect ghost names from roster (agentType == "ghost")
GHOST_NAMES=$(jq -r '.members[] | select(.agentType == "ghost") | .name' "$ROSTER")

if [ -z "$GHOST_NAMES" ]; then
  echo "No ghost members in roster — nothing to register."
  exit 0
fi

ADDED=0
NOW_MS=$(($(date +%s) * 1000))

while IFS= read -r GHOST_NAME; do
  [ -n "$GHOST_NAME" ] || continue

  # Ensure empty inbox file exists for every ghost (regardless of registration state)
  INBOX_FILE="$RUNTIME_INBOXES/${GHOST_NAME}.json"
  if [ ! -f "$INBOX_FILE" ]; then
    echo "[]" > "$INBOX_FILE"
  fi

  # Skip if already present in runtime members[]
  EXISTS=$(jq --arg n "$GHOST_NAME" '[.members[] | select(.name == $n)] | length' "$RUNTIME_CONFIG" 2>/dev/null) || EXISTS=0
  EXISTS=${EXISTS:-0}
  if [ "$EXISTS" -gt 0 ]; then
    continue
  fi

  # Append a new ghost entry to runtime members[].
  # Shape: agentId, name, agentType, [backendType], [color], isActive, joinedAt, tmuxPaneId, cwd, subscriptions
  # (backendType and color are copied from roster only if present; null fields are stripped.)
  TMP="$RUNTIME_CONFIG.tmp"
  jq \
    --slurpfile roster "$ROSTER" \
    --arg n "$GHOST_NAME" \
    --arg team "$TEAM_NAME" \
    --argjson now "$NOW_MS" \
    '
      ($roster[0].members[] | select(.name == $n)) as $src
      | .members += [
          ({
            agentId: ($n + "@" + $team),
            name: $n,
            agentType: "ghost",
            backendType: ($src.backendType // null),
            color: ($src.color // null),
            isActive: false,
            joinedAt: $now,
            tmuxPaneId: "",
            cwd: "",
            subscriptions: []
          }
          | with_entries(select(.value != null)))
        ]
    ' "$RUNTIME_CONFIG" > "$TMP"

  mv "$TMP" "$RUNTIME_CONFIG"
  ADDED=$((ADDED + 1))
done <<< "$GHOST_NAMES"

if [ "$ADDED" -eq 0 ]; then
  echo "All ghost members already registered."
else
  echo "Re-registered $ADDED ghost member(s)."
fi
exit 0
