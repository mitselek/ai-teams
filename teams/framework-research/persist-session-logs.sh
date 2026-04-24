#!/usr/bin/env bash
# (*FR:Volta*) — Persist session .jsonl transcripts as a compressed tarball.
# EXPENSIVE — runs on coordinated team shutdown or pre-rebuild only.
# NOT invoked on per-agent shutdown.
# Requires GNU tar for --exclude **/pattern support.
#
# Usage:
#   persist-session-logs.sh            # normal mode
#   persist-session-logs.sh --dry-run  # print intended actions, no writes
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
MARKER_FILE="$SCRIPT_DIR/.project-dir-name"
BACKUP_DIR="${SESSION_BACKUP_DIR:-$HOME/.claude-session-backups/$TEAM_NAME}"

# --- cwd-discovery (marker primary) ---
if [ -f "$MARKER_FILE" ]; then
  PROJECT_DIR_NAME=$(tr -d '[:space:]' < "$MARKER_FILE")
  DISCOVERY_METHOD="marker"
else
  SPAWN_CWD_GUESS=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)
  PROJECT_DIR_NAME=$(printf '%s' "$SPAWN_CWD_GUESS" | sed 's/[^A-Za-z0-9_]/-/g')
  DISCOVERY_METHOD="computed-fallback"
  echo "WARNING: No marker file at $MARKER_FILE, using computed fallback: $PROJECT_DIR_NAME" >&2
fi

PROJECT_DIR="$HOME/.claude/projects/$PROJECT_DIR_NAME"
if [ ! -d "$PROJECT_DIR" ]; then
  echo "No project dir at $PROJECT_DIR — nothing to persist." >&2
  exit 0
fi

TIMESTAMP=$(date -u +%Y-%m-%dT%H-%M-%SZ)
TARBALL="$BACKUP_DIR/session-logs-$TEAM_NAME-$TIMESTAMP.tar.gz"
MANIFEST_TMP=$(mktemp)
trap 'rm -f "$MANIFEST_TMP"' EXIT

# --- build MANIFEST file documenting what's in the tarball ---
cat > "$MANIFEST_TMP" <<MANIFEST_EOF
# Session Logs Tarball — MANIFEST

team: $TEAM_NAME
created_utc: $TIMESTAMP
source_project_dir: $PROJECT_DIR
discovery_method: $DISCOVERY_METHOD
hostname: $(hostname)
creator_script: persist-session-logs.sh (v0.3)

## Included

- Top-level session transcripts: <uuid>.jsonl
- Subagent transcripts: <uuid>/subagents/*.jsonl
- This MANIFEST.md (at tarball root)

## EXCLUDED (by design, not corruption)

- memory/ — per-user auto-memory, covered by persist-project-state.sh, persisted to repo separately
- **/tool-results/ — redundant with parent agent conversations, excluded to reduce size
- tool-results/ (top-level, defense in depth for non-GNU tar)

## To restore

    cd \$HOME/.claude/projects && tar xzf <this-tarball>

Then verify:

    ls -la ./$PROJECT_DIR_NAME
MANIFEST_EOF

if [ "$DRY_RUN" = "1" ]; then
  echo "[DRY-RUN] team: $TEAM_NAME"
  echo "[DRY-RUN] discovery_method: $DISCOVERY_METHOD"
  echo "[DRY-RUN] source: $PROJECT_DIR"
  echo "[DRY-RUN] would create: $TARBALL"
  echo "[DRY-RUN] backup_dir: $BACKUP_DIR"
  echo "[DRY-RUN] exclude: memory/, **/tool-results, /tool-results"
  FILE_COUNT=$(cd "$HOME/.claude/projects" 2>/dev/null && \
    find "./$PROJECT_DIR_NAME" \
      -not -path "*/memory/*" \
      -not -path "*/tool-results/*" \
      -type f 2>/dev/null | wc -l || echo 0)
  echo "[DRY-RUN] file count that would be included: $FILE_COUNT"
  echo "[DRY-RUN] MANIFEST content:"
  sed 's/^/[DRY-RUN] | /' "$MANIFEST_TMP"
  exit 0
fi

mkdir -p "$BACKUP_DIR"

# --- hyphen-safe tar with staged MANIFEST ---
STAGE_DIR=$(mktemp -d)
trap 'rm -f "$MANIFEST_TMP"; rm -rf "$STAGE_DIR"' EXIT
cp "$MANIFEST_TMP" "$STAGE_DIR/MANIFEST.md"

cd "$HOME/.claude/projects" && \
  tar czf "$TARBALL" \
    --exclude="./$PROJECT_DIR_NAME/memory" \
    --exclude="./$PROJECT_DIR_NAME/**/tool-results" \
    --exclude="./$PROJECT_DIR_NAME/tool-results" \
    "./$PROJECT_DIR_NAME" \
    -C "$STAGE_DIR" "MANIFEST.md"

SIZE=$(du -h "$TARBALL" | cut -f1)
echo "Persisted session logs to $TARBALL ($SIZE)."

# --- retention: count + age floor ---
# Never prune tarballs younger than RETENTION_AGE_DAYS (default 7)
# Within the older set, keep newest RETENTION_COUNT (default 5)
RETENTION_COUNT="${SESSION_BACKUP_RETENTION:-5}"
RETENTION_AGE_DAYS="${SESSION_BACKUP_RETENTION_AGE_DAYS:-7}"

cd "$BACKUP_DIR" || exit 0

# Find tarballs strictly older than age floor, newest-first
OLD_TARBALLS=$(find . -maxdepth 1 -name "session-logs-$TEAM_NAME-*.tar.gz" \
                 -type f -mtime "+$RETENTION_AGE_DAYS" \
                 -printf '%T@ %p\n' 2>/dev/null | \
               sort -rn | awk '{print $2}')

if [ -n "$OLD_TARBALLS" ]; then
  echo "$OLD_TARBALLS" | tail -n +$((RETENTION_COUNT + 1)) | \
    while IFS= read -r victim; do
      [ -n "$victim" ] || continue
      rm -v "$victim"
    done
fi

TOTAL_KEPT=$(find . -maxdepth 1 -name "session-logs-$TEAM_NAME-*.tar.gz" -type f | wc -l)
echo "Retention: kept $TOTAL_KEPT tarball(s) for $TEAM_NAME (count=$RETENTION_COUNT, age_floor=${RETENTION_AGE_DAYS}d)."
exit 0
