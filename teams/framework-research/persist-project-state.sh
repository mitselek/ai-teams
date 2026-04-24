#!/usr/bin/env bash
# (*FR:Volta*) — Persist project-scoped auto-memory .md files to repo.
# Runs on per-agent shutdown (cheap: small text files, typically <100KB total).
# Mirror semantics: dest is wiped before copy, so removing a file in runtime
# also removes it from the repo-persisted version. Prevents orphan accumulation.
#
# Usage:
#   persist-project-state.sh            # normal mode
#   persist-project-state.sh --dry-run  # print intended actions, no writes
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

# --- cwd-discovery (marker primary, computed fallback with warning) ---
if [ -f "$MARKER_FILE" ]; then
  PROJECT_DIR_NAME=$(tr -d '[:space:]' < "$MARKER_FILE")
  DISCOVERY_METHOD="marker"
else
  SPAWN_CWD_GUESS=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)
  PROJECT_DIR_NAME=$(printf '%s' "$SPAWN_CWD_GUESS" | sed 's/[^A-Za-z0-9_]/-/g')
  DISCOVERY_METHOD="computed-fallback"
  echo "WARNING: No marker file at $MARKER_FILE. Using computed fallback: $PROJECT_DIR_NAME" >&2
  echo "WARNING: If wrong, write correct sanitized name to $MARKER_FILE." >&2
fi

PROJECT_DIR="$HOME/.claude/projects/$PROJECT_DIR_NAME"
RUNTIME_MEMORY="$PROJECT_DIR/memory"

if [ ! -d "$RUNTIME_MEMORY" ]; then
  if [ "$DISCOVERY_METHOD" = "marker" ]; then
    echo "ERROR: Marker-specified project dir missing memory/: $RUNTIME_MEMORY" >&2
    exit 1
  else
    echo "No runtime auto-memory at $RUNTIME_MEMORY — nothing to persist."
    exit 0
  fi
fi

if [ "$DRY_RUN" = "1" ]; then
  echo "[DRY-RUN] team: $TEAM_NAME"
  echo "[DRY-RUN] discovery_method: $DISCOVERY_METHOD"
  echo "[DRY-RUN] source: $RUNTIME_MEMORY"
  echo "[DRY-RUN] dest:   $REPO_PROJECT_MEMORY"
  echo "[DRY-RUN] files that would be mirrored from source:"
  find "$RUNTIME_MEMORY" -maxdepth 1 -name '*.md' -type f -printf '[DRY-RUN]   %f\n' 2>/dev/null || true
  echo "[DRY-RUN] files currently in dest that would be wiped first:"
  find "$REPO_PROJECT_MEMORY" -maxdepth 1 -name '*.md' -type f -printf '[DRY-RUN]   %f\n' 2>/dev/null || true
  exit 0
fi

# --- mirror-semantic persist ---
mkdir -p "$REPO_PROJECT_MEMORY"
find "$REPO_PROJECT_MEMORY" -maxdepth 1 -name '*.md' -type f -delete

PERSISTED=0
for md_file in "$RUNTIME_MEMORY"/*.md; do
  [ -f "$md_file" ] || continue
  filename=$(basename "$md_file")
  cp "$md_file" "$REPO_PROJECT_MEMORY/$filename"
  PERSISTED=$((PERSISTED + 1))
done

DEST_COUNT=$(find "$REPO_PROJECT_MEMORY" -maxdepth 1 -name '*.md' -type f | wc -l)
if [ "$DEST_COUNT" -ne "$PERSISTED" ]; then
  echo "ERROR: Count mismatch — persisted=$PERSISTED dest=$DEST_COUNT" >&2
  exit 1
fi

echo "Persisted $PERSISTED project-memory .md file(s) (mirror) from $RUNTIME_MEMORY."
exit 0
