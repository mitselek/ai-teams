#!/usr/bin/env bash
# test-agent-routing.sh -- self-contained test for issue #106 agent-level
# inbound routing.  Sets up temp dirs, exercises inject_batch routing and
# read_mail merging, tears down.  Exit 0 = all passed, non-zero = failure.
#
# Expects: python3 on PATH, stationmaster-courier.py + comms-mcp.py reachable
# at the paths below (or override via SM_COURIER / COMMS_MCP env vars).

set -euo pipefail

# --- locate source files ---------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
SM_COURIER="${SM_COURIER:-$REPO_ROOT/teams/framework-research/poc/ghost-bridge/stationmaster-courier.py}"
COMMS_MCP="${COMMS_MCP:-$REPO_ROOT/teams/framework-research/poc/ghost-bridge/comms-mcp.py}"

# If repo copies are EPERM (macOS TCC), fall back to scratchpad copies
if [ ! -r "$SM_COURIER" ]; then
    SCRATCH="/private/tmp/claude-501/-Users-michelek-Documents-github-ai-teams/c7098357-a4ba-412b-bb28-d30e42768ae1/scratchpad/courier-src"
    if [ -r "$SCRATCH/stationmaster-courier.py" ]; then
        SM_COURIER="$SCRATCH/stationmaster-courier.py"
        COMMS_MCP="$SCRATCH/comms-mcp.py"
    else
        echo "FAIL: cannot find stationmaster-courier.py" >&2
        exit 1
    fi
fi

# --- temp workspace ---------------------------------------------------------
TMPDIR_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMPDIR_ROOT"' EXIT

INBOXES="$TMPDIR_ROOT/inboxes"
STATE="$TMPDIR_ROOT/state"
mkdir -p "$INBOXES" "$STATE"

PASS=0
FAIL=0

check() {
    local label="$1" expected="$2" actual="$3"
    if [ "$expected" = "$actual" ]; then
        echo "  PASS: $label"
        PASS=$((PASS + 1))
    else
        echo "  FAIL: $label (expected=$expected, actual=$actual)"
        FAIL=$((FAIL + 1))
    fi
}

# ============================================================================
# TEST 1-3: inject_batch agent routing via _resolve_inbound_target
# ============================================================================
echo "=== inject_batch agent routing ==="

# Write a Python test harness that imports the reference courier and exercises
# _resolve_inbound_target + inject_batch directly.
cat > "$TMPDIR_ROOT/test_inject.py" <<'PYEOF'
import json, sys, os
from pathlib import Path

sm_path = sys.argv[1]
inboxes_dir = Path(sys.argv[2])
state_dir = Path(sys.argv[3])
test_num = int(sys.argv[4])

# Load stationmaster-courier as a module
import importlib.util
spec = importlib.util.spec_from_file_location("sm", sm_path)
sm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sm)

# Build a minimal Config-like object
class FakeCfg:
    def __init__(self):
        self.inboxes_dir = inboxes_dir
        self.target_inbox = "team-lead"
        self.state_dir = state_dir
        self.inject_tmp_dir = state_dir / "inject-tmp"

cfg = FakeCfg()

if test_num == 1:
    # to: gama@po-team -- gama.json exists -> should land in gama.json
    entry = {"from": "test-sender", "text": "to: gama@po-team\nHello gama!", "read": False,
             "timestamp": "2026-07-16T10:00:00Z"}
    target = sm._resolve_inbound_target(cfg, entry, "env-001")
    sm.inject_batch(target, [entry])
    # Check which file got the entry
    gama = json.loads((inboxes_dir / "gama.json").read_text()) if (inboxes_dir / "gama.json").exists() else []
    lead = json.loads((inboxes_dir / "team-lead.json").read_text()) if (inboxes_dir / "team-lead.json").exists() else []
    print(f"gama_count={len(gama)} lead_count={len(lead)}")

elif test_num == 2:
    # to: unknown@po-team -- unknown.json does NOT exist -> should land in team-lead.json
    entry = {"from": "test-sender", "text": "to: unknown@po-team\nHello unknown!", "read": False,
             "timestamp": "2026-07-16T10:01:00Z"}
    target = sm._resolve_inbound_target(cfg, entry, "env-002")
    sm.inject_batch(target, [entry])
    lead = json.loads((inboxes_dir / "team-lead.json").read_text()) if (inboxes_dir / "team-lead.json").exists() else []
    unknown_exists = (inboxes_dir / "unknown.json").exists()
    print(f"lead_count={len(lead)} unknown_exists={unknown_exists}")

elif test_num == 3:
    # No to: line -> should land in team-lead.json
    entry = {"from": "test-sender", "text": "Just a plain message, no routing.", "read": False,
             "timestamp": "2026-07-16T10:02:00Z"}
    target = sm._resolve_inbound_target(cfg, entry, "env-003")
    sm.inject_batch(target, [entry])
    lead = json.loads((inboxes_dir / "team-lead.json").read_text()) if (inboxes_dir / "team-lead.json").exists() else []
    print(f"lead_count={len(lead)}")

PYEOF

# --- Test 1: to: gama@po-team, gama.json exists ---
echo "[]" > "$INBOXES/team-lead.json"
echo "[]" > "$INBOXES/gama.json"
OUTPUT=$(python3 "$TMPDIR_ROOT/test_inject.py" "$SM_COURIER" "$INBOXES" "$STATE" 1 2>/dev/null)
check "gama inbox receives entry" "gama_count=1 lead_count=0" "$OUTPUT"

# Clean up for next test
rm -f "$INBOXES/team-lead.json" "$INBOXES/gama.json"

# --- Test 2: to: unknown@po-team, unknown.json does NOT exist ---
echo "[]" > "$INBOXES/team-lead.json"
# deliberately NO unknown.json
OUTPUT=$(python3 "$TMPDIR_ROOT/test_inject.py" "$SM_COURIER" "$INBOXES" "$STATE" 2 2>/dev/null)
check "unknown falls back to team-lead" "lead_count=1 unknown_exists=False" "$OUTPUT"

rm -f "$INBOXES/team-lead.json"

# --- Test 3: no to: line -> team-lead ---
echo "[]" > "$INBOXES/team-lead.json"
OUTPUT=$(python3 "$TMPDIR_ROOT/test_inject.py" "$SM_COURIER" "$INBOXES" "$STATE" 3 2>/dev/null)
check "no to: line falls back to team-lead" "lead_count=1" "$OUTPUT"

rm -f "$INBOXES/team-lead.json"

# ============================================================================
# TEST 4: read_mail merges all inbox files
# ============================================================================
echo ""
echo "=== read_mail merging ==="

cat > "$TMPDIR_ROOT/test_read_mail.py" <<'PYEOF'
import json, sys, os
from pathlib import Path

sm_path = sys.argv[1]
comms_path = sys.argv[2]
inboxes_dir = Path(sys.argv[3])

# Load modules
import importlib.util

spec = importlib.util.spec_from_file_location("sm", sm_path)
sm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sm)

spec2 = importlib.util.spec_from_file_location("comms", comms_path)
comms = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(comms)
# comms.sm is None after exec (module-level sm = None); bind it now
comms.sm = sm

# Minimal cfg
class FakeCfg:
    def __init__(self):
        self.inboxes_dir = inboxes_dir
        self.target_inbox = "team-lead"
        self.ghost_outboxes = ["courier-outbox"]
        self._auto_inboxes = False  # explicit dir, no auto-resolve

cfg = FakeCfg()

# Monkey-patch _resolve_inboxes_dir to return our test dir directly
comms._resolve_inboxes_dir = lambda c: c.inboxes_dir

result, is_err = comms.tool_read_mail(cfg)
print(f"count={result['count']} is_err={is_err}")

# Verify entries are sorted by timestamp
timestamps = [e.get("timestamp", "") for e in result["entries"]]
is_sorted = timestamps == sorted(timestamps)
print(f"sorted={is_sorted}")

# Verify sources include both inboxes
sources = result["inbox"].split("+")
has_gama = "gama" in sources
has_lead = "team-lead" in sources
print(f"has_gama={has_gama} has_lead={has_lead}")
PYEOF

# Set up inboxes with entries in multiple files
echo '[{"from":"alice","text":"msg1","read":false,"timestamp":"2026-07-16T10:00:00Z"}]' > "$INBOXES/team-lead.json"
echo '[{"from":"bob","text":"msg2","read":false,"timestamp":"2026-07-16T09:59:00Z"}]' > "$INBOXES/gama.json"
# Ghost outbox file -- should be excluded
echo '[{"from":"outgoing","text":"should not appear","read":false,"timestamp":"2026-07-16T09:58:00Z"}]' > "$INBOXES/courier-outbox.json"

OUTPUT=$(python3 "$TMPDIR_ROOT/test_read_mail.py" "$SM_COURIER" "$COMMS_MCP" "$INBOXES" 2>/dev/null)

# Parse output lines
LINE1=$(echo "$OUTPUT" | sed -n '1p')
LINE2=$(echo "$OUTPUT" | sed -n '2p')
LINE3=$(echo "$OUTPUT" | sed -n '3p')

check "read_mail returns 2 entries (excludes ghost outbox)" "count=2 is_err=False" "$LINE1"
check "entries sorted by timestamp" "sorted=True" "$LINE2"
check "sources include both inboxes" "has_gama=True has_lead=True" "$LINE3"

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
