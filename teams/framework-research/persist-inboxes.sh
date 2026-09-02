#!/usr/bin/env bash
# (*FR:Volta*) -- Persist inboxes from runtime to repo, pruning to last 100 messages
#
# Usage:
#   persist-inboxes.sh           # persist ALL inboxes (team-lead shutdown)
#   persist-inboxes.sh <name>    # persist only <name>'s inbox (agent shutdown)
#
# 2.1.178+ (implicit teams): the runtime team dir name is a random session-<id>,
# discovered at runtime via Brunel's WS1 resolver shim -- NOT the hardcoded
# "framework-research" (which was basename $SCRIPT_DIR pre-migration). The repo-side
# durable copy is agent-name-keyed, so it survives a team name that rotates per session.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_INBOXES="$SCRIPT_DIR/inboxes"
RESOLVER="$SCRIPT_DIR/poc/ghost-bridge/stationmaster-courier.py"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"

AGENT_NAME="${1:-}"

# Precondition: resolver shim must exist (fail-closed)
if [ ! -f "$RESOLVER" ]; then
  echo "ERROR: Team-dir resolver shim missing: $RESOLVER" >&2
  echo "Cannot discover the runtime team dir name (2.1.178+ implicit teams). Refusing to proceed." >&2
  exit 1
fi

# Runtime-discover the team dir name via the shared WS1 resolver.
# Disambiguation (Brunel WS1 finding 2026-06-18: a real box has many team dirs):
#   - --session-pid "${FR_COURIER_SESSION_PID:-$PPID}" : the Claude SESSION pid maps to the
#       live dir (session-<sessionId[:8]>). MEASURED 2026-09-02 on CLI 2.1.258: under the
#       Claude Bash tool $PPID is 1, NOT the session pid -- so the caller must supply the real
#       pid via FR_COURIER_SESSION_PID. An explicit flag beats the resolver's own env fallback,
#       which is why this expression honours the env var instead of hardcoding $PPID.
#       Read the pid from ~/.claude/sessions/*.json, matching .cwd to the repo (startup.md Step 2').
#   - FR_COURIER_TEAM_DIR_NAME : explicit team-dir override (shared FR_COURIER_* env family, Aen
#       2026-06-18; the courier reads the same name). This is the PRIMARY disambiguator today:
#       it is version-independent and needs no working pid. Set it to the DISCOVERED slug
#       (session-<id>), not the literal framework-research -- that name was the 2.1.177-bridge
#       value and the bridge is retired. See startup.md Step 3 / docs/startup-rationale.md.
# Fail-closed on no-resolve / ambiguity (resolver exits non-zero + stderr).
RESOLVE_ARGS=(--resolve-team-dir --name --claude-home "$CLAUDE_HOME" --session-pid "${FR_COURIER_SESSION_PID:-$PPID}")
if [ -n "${FR_COURIER_TEAM_DIR_NAME:-}" ]; then
  RESOLVE_ARGS+=(--team-dir-name "$FR_COURIER_TEAM_DIR_NAME")
fi
if ! TEAM_NAME="$(python3 "$RESOLVER" "${RESOLVE_ARGS[@]}")"; then
  echo "ERROR: Could not resolve the live team dir name via $RESOLVER --resolve-team-dir." >&2
  echo "Resolver failed (no dir / ambiguous). Set FR_COURIER_TEAM_DIR_NAME=<discovered session-<id> slug> (startup.md Step 2'/3)." >&2
  echo "Refusing to write into an empty team-dir path." >&2
  exit 1
fi
RUNTIME_INBOXES="$CLAUDE_HOME/teams/$TEAM_NAME/inboxes"

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
