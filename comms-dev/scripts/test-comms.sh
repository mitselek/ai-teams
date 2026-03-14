#!/usr/bin/env bash
# (*CD:Babbage*)
# test-comms.sh — cross-container comms integration test.
#
# Tests that comms-dev can send a message to framework-research and
# that it is delivered to the framework-research inbox.
#
# Prerequisites:
#   - Both containers running with /shared/comms volume mounted
#   - framework-research broker already running (or this script starts it)
#   - COMMS_PSK_FILE set to a shared PSK file, OR both sides in PLAINTEXT mode
#
# Usage (run from either container or host with docker exec):
#   ./comms-dev/scripts/test-comms.sh
#
# Environment:
#   COMMS_PSK_FILE        — path to PSK (default: /run/secrets/comms-psk)
#   COMMS_SOCKET_DIR      — UDS directory (default: /shared/comms)
#   FR_INBOX_DIR          — framework-research inbox dir to verify delivery
#                           (default: /home/ai-teams/.claude/teams/framework-research/inboxes)
#   TEST_TIMEOUT_SECS     — seconds to wait for delivery (default: 15)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMMS_DIR="$REPO_ROOT/comms-dev"

COMMS_SOCKET_DIR="${COMMS_SOCKET_DIR:-/shared/comms}"
COMMS_PSK_FILE="${COMMS_PSK_FILE:-/run/secrets/comms-psk}"
FR_INBOX_DIR="${FR_INBOX_DIR:-/home/ai-teams/.claude/teams/framework-research/inboxes}"
TEST_TIMEOUT_SECS="${TEST_TIMEOUT_SECS:-15}"

REGISTRY="$COMMS_SOCKET_DIR/registry.json"

pass() { echo "[PASS] $*"; }
fail() { echo "[FAIL] $*" >&2; exit 1; }
info() { echo "[test-comms] $*"; }

# ── Preflight ────────────────────────────────────────────────────────────────

info "Preflight checks..."

if [ ! -d "$COMMS_SOCKET_DIR" ]; then
    fail "Socket dir not found: $COMMS_SOCKET_DIR — is the comms volume mounted?"
fi

if [ ! -f "$REGISTRY" ]; then
    fail "registry.json not found at $REGISTRY — is the comms-dev broker running?"
fi

# Check that framework-research is registered
if ! jq -e '.teams["framework-research"]' "$REGISTRY" > /dev/null 2>&1; then
    fail "framework-research not in registry — is the framework-research broker running?"
fi

if ! jq -e '.teams["comms-dev"]' "$REGISTRY" > /dev/null 2>&1; then
    fail "comms-dev not in registry — is the comms-dev broker running?"
fi

pass "Both teams registered in registry"

# ── Send test message ────────────────────────────────────────────────────────

TEST_BODY="Cross-container comms test at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
info "Sending test message to framework-research/team-lead..."

cd "$COMMS_DIR"

# Install deps if needed
if [ ! -d node_modules ]; then
    npm install --silent
fi

COMMS_TEAM_NAME="${COMMS_TEAM_NAME:-comms-dev}" \
COMMS_TEAM_PREFIX="${COMMS_TEAM_PREFIX:-CD}" \
COMMS_PSK_FILE="$COMMS_PSK_FILE" \
COMMS_SOCKET_DIR="$COMMS_SOCKET_DIR" \
npx tsx src/cli/comms-send.ts \
    --to framework-research \
    --to-agent team-lead \
    --type broadcast \
    --body "$TEST_BODY"

pass "Message sent"

# ── Verify delivery ──────────────────────────────────────────────────────────

info "Waiting up to ${TEST_TIMEOUT_SECS}s for delivery to $FR_INBOX_DIR..."

INBOX_FILE="$FR_INBOX_DIR/team-lead.json"
DEADLINE=$(( $(date +%s) + TEST_TIMEOUT_SECS ))

while [ "$(date +%s)" -lt "$DEADLINE" ]; do
    if [ -f "$INBOX_FILE" ]; then
        # Check if the test body appears in the inbox
        if jq -e --arg body "$TEST_BODY" \
               'map(select(.text | contains($body))) | length > 0' \
               "$INBOX_FILE" > /dev/null 2>&1; then
            pass "Message found in framework-research/team-lead inbox"
            echo ""
            echo "Cross-container comms: PASS"
            exit 0
        fi
    fi
    sleep 1
done

fail "Message not found in $INBOX_FILE after ${TEST_TIMEOUT_SECS}s"
