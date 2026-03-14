#!/usr/bin/env bash
# (*FR:Volta*) — Restore inboxes from repo to runtime, pruning stale shutdown messages
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"
REPO_INBOXES="$SCRIPT_DIR/inboxes"
RUNTIME_INBOXES="$HOME/.claude/teams/$TEAM_NAME/inboxes"

# Precondition: runtime team dir must exist (TeamCreate should have run)
RUNTIME_TEAM_DIR="$HOME/.claude/teams/$TEAM_NAME"
if [ ! -d "$RUNTIME_TEAM_DIR" ]; then
  echo "ERROR: Runtime team dir does not exist: $RUNTIME_TEAM_DIR" >&2
  echo "Run TeamCreate first." >&2
  exit 1
fi

# If no repo inboxes, nothing to restore
if [ ! -d "$REPO_INBOXES" ]; then
  echo "No repo inboxes found at $REPO_INBOXES — cold start, nothing to restore."
  exit 0
fi

# Count source files
SOURCE_COUNT=$(find "$REPO_INBOXES" -maxdepth 1 -name '*.json' -type f | wc -l)
if [ "$SOURCE_COUNT" -eq 0 ]; then
  echo "Repo inboxes dir exists but contains no .json files — nothing to restore."
  exit 0
fi

mkdir -p "$RUNTIME_INBOXES"

# Copy and prune shutdown/idle messages from each inbox
RESTORED=0
for inbox_file in "$REPO_INBOXES"/*.json; do
  [ -f "$inbox_file" ] || continue
  filename=$(basename "$inbox_file")

  # Filter out messages where the text field contains shutdown or idle notification types
  jq '[.[] | select(
    (.text | test("\"type\"\\s*:\\s*\"shutdown_request\"") | not) and
    (.text | test("\"type\"\\s*:\\s*\"shutdown_approved\"") | not) and
    (.text | test("\"type\"\\s*:\\s*\"shutdown_response\"") | not) and
    (.text | test("\"type\"\\s*:\\s*\"idle_notification\"") | not)
  )]' "$inbox_file" > "$RUNTIME_INBOXES/$filename"

  RESTORED=$((RESTORED + 1))
done

# Verification
DEST_COUNT=$(find "$RUNTIME_INBOXES" -maxdepth 1 -name '*.json' -type f | wc -l)
if [ "$RESTORED" -ne "$SOURCE_COUNT" ] || [ "$DEST_COUNT" -ne "$SOURCE_COUNT" ]; then
  echo "ERROR: Count mismatch — source=$SOURCE_COUNT restored=$RESTORED dest=$DEST_COUNT" >&2
  exit 1
fi

echo "Restored $RESTORED inbox(es) from repo to runtime (shutdown messages pruned)."
exit 0
