#!/usr/bin/env bash
# (*FR:Volta*) — Restore session logs from tarball. MANUAL-ONLY.
# Prints MANIFEST content before extraction so the operator knows what's in the tarball.
#
# Usage:
#   restore-session-logs.sh                       # list available tarballs
#   restore-session-logs.sh <tarball-filename>    # show MANIFEST, prompt, extract
#   restore-session-logs.sh <filename> --dry-run  # show MANIFEST, no extraction
set -euo pipefail

DRY_RUN=0
POS_ARGS=()
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -*) echo "Unknown arg: $arg" >&2; exit 2 ;;
    *) POS_ARGS+=("$arg") ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"
BACKUP_DIR="${SESSION_BACKUP_DIR:-$HOME/.claude-session-backups/$TEAM_NAME}"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "No backup dir at $BACKUP_DIR — nothing to restore." >&2
  exit 1
fi

if [ "${#POS_ARGS[@]}" -eq 0 ]; then
  echo "Available tarballs in $BACKUP_DIR:"
  ls -1t "$BACKUP_DIR"/session-logs-*.tar.gz 2>/dev/null || echo "(none)"
  echo ""
  echo "Usage: restore-session-logs.sh <tarball-filename> [--dry-run]"
  exit 0
fi

TARBALL="$BACKUP_DIR/${POS_ARGS[0]}"
if [ ! -f "$TARBALL" ]; then
  echo "Tarball not found: $TARBALL" >&2
  exit 1
fi

# Show MANIFEST before extracting, so operator sees scope before action
echo "=== MANIFEST ==="
tar xzOf "$TARBALL" MANIFEST.md 2>/dev/null || echo "(no MANIFEST found — older tarball format)"
echo "=== end MANIFEST ==="
echo ""

if [ "$DRY_RUN" = "1" ]; then
  echo "[DRY-RUN] would extract: $TARBALL"
  echo "[DRY-RUN] into: $HOME/.claude/projects/"
  echo "[DRY-RUN] entries at root (first 20):"
  tar tzf "$TARBALL" | head -n 20 | sed 's/^/[DRY-RUN]   /'
  exit 0
fi

read -r -p "Proceed with extraction? (y/N) " CONFIRM
[ "$CONFIRM" = "y" ] || { echo "Aborted."; exit 0; }

cd "$HOME/.claude/projects" && tar xzf "$TARBALL"
echo "Restored from $TARBALL into $HOME/.claude/projects/"
exit 0
