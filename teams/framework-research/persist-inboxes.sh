#!/usr/bin/env bash
# (*FR:Volta*) -- Persist inboxes from runtime to repo, pruning to last 100 messages
#
# Usage:
#   persist-inboxes.sh           # persist ALL inboxes (team-lead shutdown)
#   persist-inboxes.sh <name>    # persist only <name>'s inbox (agent shutdown)
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"
REPO_INBOXES="$SCRIPT_DIR/inboxes"
RUNTIME_INBOXES="$HOME/.claude/teams/$TEAM_NAME/inboxes"

AGENT_NAME="${1:-}"

# If no runtime inboxes dir, nothing to persist
if [ ! -d "$RUNTIME_INBOXES" ]; then
  echo "No runtime inboxes found at $RUNTIME_INBOXES -- nothing to persist."
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

  if ! jq '.[-100:]' "$SOURCE_FILE" > "$REPO_INBOXES/${AGENT_NAME}.json"; then
    echo "ERROR: jq failed on $SOURCE_FILE" >&2
    exit 1
  fi

  echo "Persisted ${AGENT_NAME}'s inbox from runtime to repo (pruned to last 100 messages)."
  exit 0
fi

# All-inboxes mode: persist everything
PERSISTED=0
SKIPPED=0
for inbox_file in "$RUNTIME_INBOXES"/*.json; do
  [ -f "$inbox_file" ] || continue
  filename=$(basename "$inbox_file")

  # Skip filenames with non-ASCII characters (corrupt artifacts from harness bugs)
  if [[ "$filename" =~ [^a-zA-Z0-9._-] ]]; then
    echo "WARN: Skipping non-standard filename: $filename" >&2
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if ! jq '.[-100:]' "$inbox_file" > "$REPO_INBOXES/$filename"; then
    echo "WARN: jq failed on $filename -- skipping" >&2
    rm -f "$REPO_INBOXES/$filename"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  PERSISTED=$((PERSISTED + 1))
done

if [ "$PERSISTED" -eq 0 ] && [ "$SKIPPED" -eq 0 ]; then
  echo "Runtime inboxes dir exists but contains no .json files -- nothing to persist."
  exit 0
fi

if [ "$SKIPPED" -gt 0 ]; then
  echo "Persisted $PERSISTED inbox(es) from runtime to repo (pruned to last 100 messages each). Skipped $SKIPPED file(s) with warnings."
else
  echo "Persisted $PERSISTED inbox(es) from runtime to repo (pruned to last 100 messages each)."
fi
exit 0
