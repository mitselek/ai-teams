#!/usr/bin/env bash
# (*FR:Volta*) — Persist inboxes from runtime to repo, pruning to last 100 messages
#
# Usage:
#   persist-inboxes.sh           # persist ALL inboxes (team-lead shutdown)
#   persist-inboxes.sh <name>    # persist only <name>'s inbox (agent shutdown)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"
REPO_INBOXES="$SCRIPT_DIR/inboxes"
RUNTIME_INBOXES="$HOME/.claude/teams/$TEAM_NAME/inboxes"

AGENT_NAME="${1:-}"

# If no runtime inboxes dir, nothing to persist
if [ ! -d "$RUNTIME_INBOXES" ]; then
  echo "No runtime inboxes found at $RUNTIME_INBOXES — nothing to persist."
  exit 0
fi

mkdir -p "$REPO_INBOXES"

# Per-agent mode: persist a single inbox
if [ -n "$AGENT_NAME" ]; then
  SOURCE_FILE="$RUNTIME_INBOXES/${AGENT_NAME}.json"
  if [ ! -f "$SOURCE_FILE" ]; then
    echo "ERROR: Inbox not found: $SOURCE_FILE" >&2
    exit 1
  fi

  jq '.[-100:]' "$SOURCE_FILE" > "$REPO_INBOXES/${AGENT_NAME}.json"

  echo "Persisted ${AGENT_NAME}'s inbox from runtime to repo (pruned to last 100 messages)."
  exit 0
fi

# All-inboxes mode: persist everything
SOURCE_COUNT=$(find "$RUNTIME_INBOXES" -maxdepth 1 -name '*.json' -type f | wc -l)
if [ "$SOURCE_COUNT" -eq 0 ]; then
  echo "Runtime inboxes dir exists but contains no .json files — nothing to persist."
  exit 0
fi

PERSISTED=0
for inbox_file in "$RUNTIME_INBOXES"/*.json; do
  [ -f "$inbox_file" ] || continue
  filename=$(basename "$inbox_file")

  jq '.[-100:]' "$inbox_file" > "$REPO_INBOXES/$filename"

  PERSISTED=$((PERSISTED + 1))
done

# Verification
DEST_COUNT=$(find "$REPO_INBOXES" -maxdepth 1 -name '*.json' -type f | wc -l)
if [ "$PERSISTED" -ne "$SOURCE_COUNT" ] || [ "$DEST_COUNT" -lt "$SOURCE_COUNT" ]; then
  echo "ERROR: Count mismatch — source=$SOURCE_COUNT persisted=$PERSISTED dest=$DEST_COUNT" >&2
  exit 1
fi

echo "Persisted $PERSISTED inbox(es) from runtime to repo (pruned to last 100 messages each)."
exit 0
