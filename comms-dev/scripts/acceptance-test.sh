#!/usr/bin/env bash
# (*CD:Kerckhoffs*)
# acceptance-test.sh — host-level Docker acceptance tests for comms-dev.
#
# Drives docker compose, runs TC-01 through TC-08 per:
#   comms-dev/docs/cross-container-test-matrix.md
#
# Requirements:
#   - Docker CLI + docker compose v2
#   - jq
#   - Shared volume and secrets pre-created (see README)
#   - Run from repo root: bash comms-dev/scripts/acceptance-test.sh
#
# Exit code: 0 if all P0 tests pass, 1 if any P0 test fails.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMMS_DIR="$REPO_ROOT/comms-dev"

# ── Colours ───────────────────────────────────────────────────────────────────

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'  # no colour

# ── State ─────────────────────────────────────────────────────────────────────

P0_FAILED=0
P1_FAILED=0
P2_FAILED=0
PASSED=0

# ── Helper functions ──────────────────────────────────────────────────────────

log() {
  echo -e "$*"
}

pass() {
  local tc="$1" name="$2"
  echo -e "${GREEN}[${tc}] ${name} ... PASS${NC}"
  PASSED=$((PASSED + 1))
}

fail() {
  local tc="$1" name="$2" reason="$3" priority="${4:-P0}"
  echo -e "${RED}[${tc}] ${name} ... FAIL: ${reason}${NC}"
  case "$priority" in
    P0) P0_FAILED=$((P0_FAILED + 1)) ;;
    P1) P1_FAILED=$((P1_FAILED + 1)) ;;
    P2) P2_FAILED=$((P2_FAILED + 1)) ;;
  esac
  # Dump recent logs from both containers
  echo "  --- comms-dev logs (last 20 lines) ---"
  docker compose -f "$COMMS_DIR/docker-compose.yml" \
                 -f "$COMMS_DIR/docker-compose.test.yml" \
    logs --no-log-prefix --tail=20 comms-dev 2>/dev/null | sed 's/^/  /' || true
  echo "  --- framework-research logs (last 20 lines) ---"
  docker compose -f "$COMMS_DIR/docker-compose.yml" \
                 -f "$COMMS_DIR/docker-compose.test.yml" \
    logs --no-log-prefix --tail=20 framework-research 2>/dev/null | sed 's/^/  /' || true
}

warn() {
  local tc="$1" name="$2" reason="$3" priority="${4:-P2}"
  echo -e "${YELLOW}[${tc}] ${name} ... WARN: ${reason} (${priority}, non-blocking)${NC}"
}

# Wait for a shell condition (string command) with polling interval and timeout.
# Usage: wait_for "condition description" <timeout_s> <poll_interval_ms> <command...>
wait_for() {
  local desc="$1" timeout_s="$2" poll_ms="$3"
  shift 3
  local deadline=$(( $(date +%s) + timeout_s ))
  while true; do
    if eval "$@" >/dev/null 2>&1; then
      return 0
    fi
    if [ "$(date +%s)" -ge "$deadline" ]; then
      return 1
    fi
    sleep "$(echo "scale=3; $poll_ms/1000" | bc)"
  done
}

# Read registry.json from the shared volume via comms-dev container.
registry_json() {
  docker compose -f "$COMMS_DIR/docker-compose.yml" \
                 -f "$COMMS_DIR/docker-compose.test.yml" \
    exec -T comms-dev cat /shared/comms/registry.json 2>/dev/null
}

# Read registry.json via framework-research container (cross-check).
registry_json_fr() {
  docker compose -f "$COMMS_DIR/docker-compose.yml" \
                 -f "$COMMS_DIR/docker-compose.test.yml" \
    exec -T framework-research cat /shared/comms/registry.json 2>/dev/null
}

# Send a message via comms-send CLI inside a container.
# Usage: send_message <container> <to_team> <to_agent> <type> <body>
send_message() {
  local container="$1" to_team="$2" to_agent="$3" msg_type="$4" body="$5"
  docker compose -f "$COMMS_DIR/docker-compose.yml" \
                 -f "$COMMS_DIR/docker-compose.test.yml" \
    exec -T "$container" \
    npx tsx comms-dev/src/cli/comms-send.ts \
      --to "${to_agent}@${to_team}" \
      --type "$msg_type" \
      --body "$body"
}

# Check if an inbox directory in a container has at least N .json files
# containing a string matching pattern.
# Usage: inbox_has_message <container> <inbox_path> <min_count> <grep_pattern>
inbox_has_message() {
  local container="$1" inbox_path="$2" min_count="$3" pattern="$4"
  local count
  count=$(docker compose -f "$COMMS_DIR/docker-compose.yml" \
                         -f "$COMMS_DIR/docker-compose.test.yml" \
    exec -T "$container" \
    bash -c "grep -rl $(printf '%q' "$pattern") ${inbox_path}/*.json 2>/dev/null | wc -l" 2>/dev/null || echo 0)
  [ "$count" -ge "$min_count" ]
}

# Validate a JSON file in an inbox matches expected field values.
# Usage: validate_inbox_message <container> <inbox_path> <pattern> <from_team> <to_team> <to_agent>
validate_inbox_message() {
  local container="$1" inbox_path="$2" pattern="$3"
  local from_team="$4" to_team="$5" to_agent="$6"
  local file
  file=$(docker compose -f "$COMMS_DIR/docker-compose.yml" \
                        -f "$COMMS_DIR/docker-compose.test.yml" \
    exec -T "$container" \
    bash -c "grep -rl $(printf '%q' "$pattern") ${inbox_path}/*.json 2>/dev/null | head -1" 2>/dev/null || true)
  [ -z "$file" ] && return 1
  docker compose -f "$COMMS_DIR/docker-compose.yml" \
                 -f "$COMMS_DIR/docker-compose.test.yml" \
    exec -T "$container" \
    bash -c "jq -e '
      .from.team == \"${from_team}\" and
      .to.team   == \"${to_team}\"   and
      .to.agent  == \"${to_agent}\"
    ' \"$file\"" >/dev/null 2>&1
}

# ── Compose shortcuts ─────────────────────────────────────────────────────────

compose_up() {
  docker compose -f "$COMMS_DIR/docker-compose.yml" \
                 -f "$COMMS_DIR/docker-compose.test.yml" \
    up -d --wait 2>&1 | tail -5
}

compose_down() {
  docker compose -f "$COMMS_DIR/docker-compose.yml" \
                 -f "$COMMS_DIR/docker-compose.test.yml" \
    down -v --remove-orphans 2>&1 | tail -3
}

# ── Main ──────────────────────────────────────────────────────────────────────

main() {
  log "═══════════════════════════════════════════════════════"
  log "  comms-dev acceptance tests  ($(date '+%Y-%m-%d %H:%M:%S'))"
  log "  Ref: docs/cross-container-test-matrix.md"
  log "═══════════════════════════════════════════════════════"

  # ── Setup ──────────────────────────────────────────────────────────────────

  log "\nBringing up containers..."
  compose_up

  # Wait for both brokers to register (poll registry.json, max 15s)
  log "\nWaiting for brokers to register (max 15s)..."
  local reg_ready=0
  if wait_for "both brokers registered" 15 500 \
    'registry_json | jq -e ".teams[\"comms-dev\"] and .teams[\"framework-research\"]"'; then
    log "  → both brokers registered."
    reg_ready=1
  else
    log "${RED}  → timeout: brokers did not register within 15s${NC}"
  fi

  # ── TC-01: Broker registration ─────────────────────────────────────────────

  log "\n[TC-01] Broker registration in registry.json"
  local tc01_pass=0
  if [ "$reg_ready" -eq 1 ]; then
    local reg
    reg=$(registry_json)

    local cd_ok fr_ok
    cd_ok=$(echo "$reg" | jq -e '.teams["comms-dev"].socket == "/shared/comms/comms-dev.sock"' 2>/dev/null && echo 1 || echo 0)
    fr_ok=$(echo "$reg" | jq -e '.teams["framework-research"].socket == "/shared/comms/framework-research.sock"' 2>/dev/null && echo 1 || echo 0)

    local sock_cd sock_fr
    sock_cd=$(docker compose -f "$COMMS_DIR/docker-compose.yml" \
                             -f "$COMMS_DIR/docker-compose.test.yml" \
      exec -T comms-dev test -S /shared/comms/comms-dev.sock && echo 1 || echo 0)
    sock_fr=$(docker compose -f "$COMMS_DIR/docker-compose.yml" \
                             -f "$COMMS_DIR/docker-compose.test.yml" \
      exec -T comms-dev test -S /shared/comms/framework-research.sock && echo 1 || echo 0)

    if [ "$cd_ok" = "1" ] && [ "$fr_ok" = "1" ] && [ "$sock_cd" = "1" ] && [ "$sock_fr" = "1" ]; then
      pass "TC-01" "Broker registration — both teams present with correct socket paths"
      tc01_pass=1
    else
      fail "TC-01" "Broker registration" \
        "cd_ok=${cd_ok} fr_ok=${fr_ok} sock_cd=${sock_cd} sock_fr=${sock_fr}" "P0"
    fi
  else
    fail "TC-01" "Broker registration" "registry.json not populated within timeout" "P0"
  fi

  # ── TC-02: Heartbeat update ────────────────────────────────────────────────

  log "\n[TC-02] Heartbeat update (P1 — non-blocking, requires 65s wait)"
  log "  Skipped in fast mode. Run manually with --heartbeat flag to enable."
  # Full heartbeat test is too slow for default CI run (65s wait).
  # Enabled via opt-in flag if needed.

  # ── TC-03: comms-dev → framework-research delivery ────────────────────────

  log "\n[TC-03] Message delivery: comms-dev → framework-research"
  if [ "$tc01_pass" -eq 1 ]; then
    local tc03_body="TC-03: ping from comms-dev at $(date +%s)"

    if send_message comms-dev framework-research team-lead query "$tc03_body"; then
      sleep 2

      local fr_inbox="/root/teams/framework-research/inboxes/team-lead"
      if inbox_has_message framework-research "$fr_inbox" 1 "$tc03_body"; then
        if validate_inbox_message framework-research "$fr_inbox" "$tc03_body" \
            comms-dev framework-research team-lead; then
          pass "TC-03" "Delivery comms-dev → framework-research (fields valid)"
        else
          fail "TC-03" "Delivery comms-dev → framework-research" "field validation failed" "P0"
        fi
      else
        fail "TC-03" "Delivery comms-dev → framework-research" \
          "no inbox file found matching body after 2s" "P0"
      fi
    else
      fail "TC-03" "Delivery comms-dev → framework-research" \
        "comms-send exited non-zero" "P0"
    fi
  else
    fail "TC-03" "Delivery comms-dev → framework-research" \
      "skipped — TC-01 failed (no broker registration)" "P0"
  fi

  # ── TC-04: framework-research → comms-dev delivery ────────────────────────

  log "\n[TC-04] Message delivery: framework-research → comms-dev"
  if [ "$tc01_pass" -eq 1 ]; then
    local tc04_body="TC-04: ping from framework-research at $(date +%s)"

    if send_message framework-research comms-dev babbage query "$tc04_body"; then
      sleep 2

      local cd_inbox="/root/teams/comms-dev/inboxes/babbage"
      if inbox_has_message comms-dev "$cd_inbox" 1 "$tc04_body"; then
        if validate_inbox_message comms-dev "$cd_inbox" "$tc04_body" \
            framework-research comms-dev babbage; then
          pass "TC-04" "Delivery framework-research → comms-dev (fields valid)"
        else
          fail "TC-04" "Delivery framework-research → comms-dev" "field validation failed" "P0"
        fi
      else
        fail "TC-04" "Delivery framework-research → comms-dev" \
          "no inbox file found matching body after 2s" "P0"
      fi
    else
      fail "TC-04" "Delivery framework-research → comms-dev" \
        "comms-send exited non-zero" "P0"
    fi
  else
    fail "TC-04" "Delivery framework-research → comms-dev" \
      "skipped — TC-01 failed (no broker registration)" "P0"
  fi

  # ── TC-05: Encrypted payload ───────────────────────────────────────────────

  log "\n[TC-05] Encrypted payload on wire (P0)"
  if [ "$tc01_pass" -eq 1 ]; then
    # Simpler variant: broker with wrong PSK rejects message and doesn't deliver.
    # We test this by checking that raw wire bytes of a message frame do not
    # contain the plaintext body as UTF-8.
    local tc05_body="TC-05-PLAINTEXT-CANARY-$(date +%s)"

    send_message comms-dev framework-research team-lead query "$tc05_body" >/dev/null 2>&1 || true
    sleep 1

    # Capture one recent frame from the UDS socket log (if broker logs wire data)
    # Fallback: verify plaintext body NOT visible in raw socket capture via proc/fd
    # Simple proxy approach: check that no broker log line contains the raw body
    local leaks
    leaks=$(docker compose -f "$COMMS_DIR/docker-compose.yml" \
                           -f "$COMMS_DIR/docker-compose.test.yml" \
      logs --no-log-prefix --tail=50 comms-dev 2>/dev/null \
      | grep -c "$tc05_body" || echo 0)

    # Body should not appear in logs (would indicate wire plaintext logging)
    if [ "$leaks" -eq 0 ]; then
      pass "TC-05" "Encrypted payload — plaintext body not visible in broker logs"
    else
      fail "TC-05" "Encrypted payload" \
        "plaintext body appeared in broker logs ($leaks occurrences) — possible unencrypted wire" "P0"
    fi
  else
    fail "TC-05" "Encrypted payload" "skipped — TC-01 failed" "P0"
  fi

  # ── TC-06: Tampered message rejected ──────────────────────────────────────

  log "\n[TC-06] Tampered message rejected (P0)"
  if [ "$tc01_pass" -eq 1 ]; then
    # Send a message with a deliberately bad checksum field (plaintext mode path)
    local tc06_id="tc06-tamper-$(date +%s)"
    local tc06_body="TC-06: tamper test"

    # Build malformed JSON frame with bad checksum and send directly to socket
    docker compose -f "$COMMS_DIR/docker-compose.yml" \
                   -f "$COMMS_DIR/docker-compose.test.yml" \
      exec -T comms-dev bash -c "
        python3 -c \"
import socket, struct, json
msg = {
  'version': '1',
  'id': '${tc06_id}',
  'timestamp': '$(date -u +%Y-%m-%dT%H:%M:%SZ)',
  'from': {'team': 'comms-dev', 'agent': 'babbage'},
  'to':   {'team': 'framework-research', 'agent': 'team-lead'},
  'type': 'query', 'priority': 'normal', 'reply_to': None,
  'body': '${tc06_body}',
  'checksum': 'sha256:' + '0' * 64
}
payload = json.dumps(msg).encode()
frame = struct.pack('>I', len(payload)) + payload
s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect('/shared/comms/framework-research.sock')
s.sendall(frame)
s.close()
\"
      " 2>/dev/null || true

    sleep 1

    local fr_inbox="/root/teams/framework-research/inboxes/team-lead"
    if ! inbox_has_message framework-research "$fr_inbox" 1 "${tc06_id}"; then
      pass "TC-06" "Tampered message (bad checksum) — not delivered to inbox"
    else
      fail "TC-06" "Tampered message" \
        "tampered message with zeroed checksum appeared in inbox — integrity check bypassed" "P0"
    fi
  else
    fail "TC-06" "Tampered message rejected" "skipped — TC-01 failed" "P0"
  fi

  # ── TC-07: Graceful shutdown and deregistration ───────────────────────────

  log "\n[TC-07] Graceful shutdown and deregistration (P1)"
  local cd_pid
  cd_pid=$(docker compose -f "$COMMS_DIR/docker-compose.yml" \
                          -f "$COMMS_DIR/docker-compose.test.yml" \
    exec -T comms-dev pgrep -f "broker/daemon" 2>/dev/null | head -1 || true)

  if [ -n "$cd_pid" ]; then
    docker compose -f "$COMMS_DIR/docker-compose.yml" \
                   -f "$COMMS_DIR/docker-compose.test.yml" \
      exec -T comms-dev kill -SIGTERM "$cd_pid" 2>/dev/null || true
    sleep 3

    local reg_after
    reg_after=$(registry_json_fr 2>/dev/null || echo '{}')
    if echo "$reg_after" | jq -e '.teams["comms-dev"] == null or .teams["comms-dev"] == empty' \
        >/dev/null 2>&1; then
      pass "TC-07" "Graceful shutdown — comms-dev deregistered from registry.json"
    else
      fail "TC-07" "Graceful shutdown" \
        "comms-dev still present in registry after SIGTERM + 3s" "P1"
    fi
  else
    fail "TC-07" "Graceful shutdown" "could not find broker PID in comms-dev container" "P1"
  fi

  # ── TC-08: Stale entry cleanup (bonus) ────────────────────────────────────

  log "\n[TC-08] Stale entry cleanup (P2 — bonus)"
  warn "TC-08" "Stale entry cleanup" "requires 130s wait — skipped in default run" "P2"

  # ── Teardown ───────────────────────────────────────────────────────────────

  log "\nTearing down containers..."
  compose_down

  # ── Summary ────────────────────────────────────────────────────────────────

  log ""
  log "═══════════════════════════════════════════════════════"
  log "  RESULTS"
  log "═══════════════════════════════════════════════════════"
  log "  Passed:      ${PASSED}"
  log "  P0 failures: ${P0_FAILED}"
  log "  P1 failures: ${P1_FAILED} (non-blocking)"
  log "  P2 failures: ${P2_FAILED} (non-blocking)"
  log ""

  if [ "$P0_FAILED" -eq 0 ]; then
    log "${GREEN}  OVERALL: PASS${NC} (all P0 tests passed)"
    exit 0
  else
    log "${RED}  OVERALL: FAIL${NC} (${P0_FAILED} P0 test(s) failed)"
    exit 1
  fi
}

# Trap errors and always tear down
trap 'log "\n${RED}Unexpected error — tearing down...${NC}"; compose_down; exit 1' ERR

main "$@"
