#!/usr/bin/env bash
# (*FR:Volta*) -- Restore inboxes from repo to runtime, pruning stale shutdown messages
#
# 2.1.178+ (implicit teams): the runtime team dir name is a random session-<id>,
# discovered at runtime via Brunel's WS1 resolver shim -- NOT the hardcoded
# "framework-research" (which was basename $SCRIPT_DIR pre-migration). The repo-side
# durable copy stays agent-name-keyed, so it survives a team name that rotates per session.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_INBOXES="$SCRIPT_DIR/inboxes"
FILTER_FILE="$SCRIPT_DIR/restore-filter.jq"
RESOLVER="$SCRIPT_DIR/poc/ghost-bridge/stationmaster-courier.py"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"

# Precondition: sibling filter file must exist (fail-closed, not fail-open)
if [ ! -f "$FILTER_FILE" ]; then
  echo "ERROR: Filter file missing: $FILTER_FILE" >&2
  echo "Cannot restore inboxes without shutdown-message filter. Refusing to proceed." >&2
  exit 1
fi

# Precondition: resolver shim must exist (fail-closed)
if [ ! -f "$RESOLVER" ]; then
  echo "ERROR: Team-dir resolver shim missing: $RESOLVER" >&2
  echo "Cannot discover the runtime team dir name (2.1.178+ implicit teams). Refusing to proceed." >&2
  exit 1
fi

# Runtime-discover the team dir name via the shared WS1 resolver.
# Disambiguation (Brunel WS1 finding 2026-06-18: a real box has many team dirs):
#   - --session-pid $PPID : post-unpin (2.1.178+) norm. $PPID is the Claude SESSION pid
#       (this script's parent); the live dir is session-<sessionId[:8]>, so the pid maps
#       to it unambiguously. Harmless on 2.1.177 (no sessions/<pid>.json -> path no-ops).
#       WINDOWS cutover caveat: on Git Bash $PPID may NOT be the Claude process. Non-fatal --
#       a wrong pid degrades to the resolver's process-liveness filter, which resolves FR's
#       sole live session-<id> while FR is the only migrated team. Validate at the flip.
#   - FR_COURIER_TEAM_DIR_NAME : 2.1.177 BRIDGE override (shared FR_COURIER_* env family, Aen
#       2026-06-18; the courier reads the same name). On the pinned CLI dirs are TeamCreate-NAMED
#       (framework-research), not session-<id>, so neither glob nor pid disambiguates a multi-dir
#       box -> the resolver's explicit-override (step 1) is required. Set
#       FR_COURIER_TEAM_DIR_NAME=framework-research during the bridge period.
# Fail-closed on no-resolve / ambiguity (resolver exits non-zero + stderr).
RESOLVE_ARGS=(--resolve-team-dir --name --claude-home "$CLAUDE_HOME" --session-pid "$PPID")
if [ -n "${FR_COURIER_TEAM_DIR_NAME:-}" ]; then
  RESOLVE_ARGS+=(--team-dir-name "$FR_COURIER_TEAM_DIR_NAME")
fi
if ! TEAM_NAME="$(python3 "$RESOLVER" "${RESOLVE_ARGS[@]}")"; then
  echo "ERROR: Could not resolve the live team dir name via $RESOLVER --resolve-team-dir." >&2
  echo "Resolver failed (no dir / ambiguous). On the 2.1.177 bridge set FR_COURIER_TEAM_DIR_NAME=framework-research." >&2
  echo "Refusing to write into an empty team-dir path." >&2
  exit 1
fi
RUNTIME_TEAM_DIR="$CLAUDE_HOME/teams/$TEAM_NAME"
RUNTIME_INBOXES="$RUNTIME_TEAM_DIR/inboxes"
echo "Discovered runtime team dir: $TEAM_NAME"

# Precondition: runtime team dir must exist (auto-created eagerly on session start, P3)
if [ ! -d "$RUNTIME_TEAM_DIR" ]; then
  echo "ERROR: Runtime team dir does not exist: $RUNTIME_TEAM_DIR" >&2
  echo "The team auto-exists on session start (2.1.178+); its absence means the session is broken." >&2
  exit 1
fi

# If no repo inboxes, nothing to restore
if [ ! -d "$REPO_INBOXES" ]; then
  echo "No repo inboxes found at $REPO_INBOXES -- cold start, nothing to restore."
  exit 0
fi

# Count source files
SOURCE_COUNT=$(find "$REPO_INBOXES" -maxdepth 1 -name '*.json' -type f | wc -l)
if [ "$SOURCE_COUNT" -eq 0 ]; then
  echo "Repo inboxes dir exists but contains no .json files -- nothing to restore."
  exit 0
fi

mkdir -p "$RUNTIME_INBOXES"

# Copy and prune shutdown/idle messages from each inbox
RESTORED=0
for inbox_file in "$REPO_INBOXES"/*.json; do
  [ -f "$inbox_file" ] || continue
  filename=$(basename "$inbox_file")

  # Filter out shutdown/idle protocol messages (structural JSON match, not free-string)
  jq -f "$FILTER_FILE" "$inbox_file" > "$RUNTIME_INBOXES/$filename"

  RESTORED=$((RESTORED + 1))
done

# Verification -- tolerate dest > source (runtime may carry inbox files not
# present in the repo, e.g. ad-hoc courier outboxes), reject dest < source.
DEST_COUNT=$(find "$RUNTIME_INBOXES" -maxdepth 1 -name '*.json' -type f | wc -l)
if [ "$RESTORED" -ne "$SOURCE_COUNT" ] || [ "$DEST_COUNT" -lt "$SOURCE_COUNT" ]; then
  echo "ERROR: Count mismatch -- source=$SOURCE_COUNT restored=$RESTORED dest=$DEST_COUNT" >&2
  exit 1
fi

echo "Restored $RESTORED inbox(es) from repo to runtime (shutdown messages pruned)."
exit 0
