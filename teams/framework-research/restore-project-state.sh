#!/usr/bin/env bash
# (*FR:Volta*) — Restore project-scoped auto-memory from repo to runtime.
# Runs on TeamCreate post-bootstrap. Merge semantics (not mirror): ADDs repo
# versions over whatever is in runtime, does NOT wipe runtime first.
#
# Usage:
#   restore-project-state.sh            # normal mode
#   restore-project-state.sh --dry-run  # print intended actions, no writes
set -euo pipefail

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"
REPO_PROJECT_MEMORY="$SCRIPT_DIR/project-memory"
MARKER_FILE="$SCRIPT_DIR/.project-dir-name"

# --- cwd-discovery (same as persist-project-state.sh) ---
if [ -f "$MARKER_FILE" ]; then
  PROJECT_DIR_NAME=$(tr -d '[:space:]' < "$MARKER_FILE")
  DISCOVERY_METHOD="marker"
else
  SPAWN_CWD_GUESS=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)
  PROJECT_DIR_NAME=$(printf '%s' "$SPAWN_CWD_GUESS" | sed 's/[^A-Za-z0-9_]/-/g')
  DISCOVERY_METHOD="computed-fallback"
  echo "WARNING: No marker file at $MARKER_FILE. Using computed fallback: $PROJECT_DIR_NAME" >&2
fi

PROJECT_DIR="$HOME/.claude/projects/$PROJECT_DIR_NAME"
RUNTIME_MEMORY="$PROJECT_DIR/memory"

if [ ! -d "$REPO_PROJECT_MEMORY" ]; then
  echo "No repo project-memory at $REPO_PROJECT_MEMORY — cold start, nothing to restore."
  exit 0
fi

if [ "$DRY_RUN" = "1" ]; then
  echo "[DRY-RUN] team: $TEAM_NAME"
  echo "[DRY-RUN] discovery_method: $DISCOVERY_METHOD"
  echo "[DRY-RUN] source: $REPO_PROJECT_MEMORY"
  echo "[DRY-RUN] dest:   $RUNTIME_MEMORY"
  echo "[DRY-RUN] files that would be copied from repo (merge, not wipe):"
  find "$REPO_PROJECT_MEMORY" -maxdepth 1 -name '*.md' -type f -printf '[DRY-RUN]   %f\n' 2>/dev/null || true
  echo "[DRY-RUN] files currently in runtime dest (would be overwritten if name matches):"
  find "$RUNTIME_MEMORY" -maxdepth 1 -name '*.md' -type f -printf '[DRY-RUN]   %f\n' 2>/dev/null || true
  exit 0
fi

mkdir -p "$RUNTIME_MEMORY"

RESTORED=0
for md_file in "$REPO_PROJECT_MEMORY"/*.md; do
  [ -f "$md_file" ] || continue
  filename=$(basename "$md_file")
  cp "$md_file" "$RUNTIME_MEMORY/$filename"
  RESTORED=$((RESTORED + 1))
done

echo "Restored $RESTORED project-memory .md file(s) from repo to $RUNTIME_MEMORY."
exit 0
