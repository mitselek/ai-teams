#!/bin/sh
# smoke-test.sh -- post-deploy protocol acceptance for a running stationmaster
# hub. Exercises the full conversation surface over real ssh with two scratch
# team keys. Run AFTER the hub is up and the two scratch keys are registered.
#
# This is the deploy-time analogue of the local sm-shell unit smoke test; it
# proves the ssh forced-command binding + sshd config + sm-shell all line up
# on the deployment substrate (TRUTHS.md T6.a re-run gate is a SEPARATE,
# operator-owned harness -- this script does not cover the inbox-injection race).
#
# Usage:
#   ./smoke-test.sh <hub-host> <hub-port> <keyA> <teamA> <keyB> <teamB>
# Example:
#   ./smoke-test.sh 10.100.136.162 2222 ~/.ssh/sm_alpha alpha ~/.ssh/sm_beta beta
# (*FR:Brunel*)
set -eu

HUB="${1:?hub host}"; PORT="${2:?hub port}"
KA="${3:?keyA}"; TA="${4:?teamA}"
KB="${5:?keyB}"; TB="${6:?teamB}"

SSH="ssh -T -o BatchMode=yes -o StrictHostKeyChecking=accept-new -p $PORT"
asA() { printf '%s\n' "$@" | $SSH -i "$KA" "sm@$HUB"; }
asB() { printf '%s\n' "$@" | $SSH -i "$KB" "sm@$HUB"; }

pass=0; fail=0
check() {  # check "<label>" "<expected substring>" "<actual>"
    if printf '%s' "$3" | grep -q "$2"; then
        echo "  PASS  $1"; pass=$((pass+1))
    else
        echo "  FAIL  $1"; echo "        expected ~ $2"; echo "        got: $3"
        fail=$((fail+1))
    fi
}

echo "== stationmaster smoke test against $HUB:$PORT =="

# Step 0 -- host-key existence (catches the entrypoint host-key-gen failure
# class directly, before the protocol tests). If sshd came up with no host
# key, ssh-keyscan returns nothing; a healthy hub presents its ed25519 key.
# This is the explicit assertion of the invariant the S50 ssh-keygen -A -f
# bug would have violated -- a runtime failure invisible to the build.
HK=$(ssh-keyscan -t ed25519 -p "$PORT" "$HUB" 2>/dev/null || true)
check "hub presents an ed25519 host key (sshd started with a host key)" "ssh-ed25519" "$HK"

R=$(asA '{"v":1,"cmd":"ping"}')
check "ping returns bound team A" "\"team\":\"$TA\"" "$R"
check "ping reports a fingerprint" "SHA256:" "$R"

# Deposit-rejection ladder -- three distinct states, in order. The hub
# distinguishes them, and the registry is lazy-populated on a team's FIRST
# connection (sm-shell touch_last_seen), so the order matters:
#   1. recipient never connected   -> E_UNKNOWN_TEAM (not in registry yet)
#   2. recipient connected, no grant-> E_NOGRANT
#   3. recipient granted            -> accepted
# (S50: the original test checked only state 2 but ran it before B had ever
#  connected, so the hub correctly answered E_UNKNOWN_TEAM and the test failed
#  -- the hub was more correct than the test. This ladder tests all three.)

# State 1 -- B has never connected, so it is not in the registry yet.
R=$(asA "{\"v\":1,\"cmd\":\"deposit\"}" "{\"to\":\"$TB\",\"entry\":{\"from\":\"team-lead\",\"text\":\"smoke\",\"summary\":\"s\"}}")
check "deposit to never-connected team -> E_UNKNOWN_TEAM" "E_UNKNOWN_TEAM" "$R"

# B connects once (status is a no-op read) -> now registry-known, still no grant.
R=$(asB '{"v":1,"cmd":"status"}')
check "B status (first connect registers B in the registry)" "\"team\":\"$TB\"" "$R"

# State 2 -- B is now known but has not granted A.
R=$(asA "{\"v\":1,\"cmd\":\"deposit\"}" "{\"to\":\"$TB\",\"entry\":{\"from\":\"team-lead\",\"text\":\"smoke\",\"summary\":\"s\"}}")
check "deposit to known-but-ungranted team -> E_NOGRANT" "E_NOGRANT" "$R"

R=$(asB "{\"v\":1,\"cmd\":\"grant\",\"args\":{\"team\":\"$TA\"}}")
check "B grants A" "\"from\":\"$TA\"" "$R"

R=$(asA "{\"v\":1,\"cmd\":\"deposit\"}" "{\"to\":\"$TB\",\"entry\":{\"from\":\"team-lead\",\"text\":\"smoke\",\"summary\":\"s\"}}")
check "deposit after grant -> accepted" "\"status\":\"accepted\"" "$R"
ID=$(printf '%s' "$R" | sed -n 's/.*"id":"\([0-9a-f]*\)".*/\1/p' | head -1)

R=$(asA "{\"v\":1,\"cmd\":\"deposit\"}" "{\"to\":\"$TB\",\"entry\":{\"from\":\"team-lead\",\"text\":\"smoke\",\"summary\":\"s\"}}")
check "redeposit same -> duplicate" "\"status\":\"duplicate\"" "$R"

R=$(asB '{"v":1,"cmd":"collect"}')
check "B collect sees the consignment" "\"from_team\":\"$TA\"" "$R"
R2=$(asB '{"v":1,"cmd":"collect"}')
check "collect is non-destructive (same id again)" "$ID" "$R2"

R=$(asB "{\"v\":1,\"cmd\":\"ack\",\"args\":{\"ids\":[\"$ID\"]}}")
check "ack deletes" "\"status\":\"deleted\"" "$R"
R=$(asB "{\"v\":1,\"cmd\":\"ack\",\"args\":{\"ids\":[\"$ID\"]}}")
check "re-ack idempotent -> already_gone" "already_gone" "$R"

R=$(asB '{"v":1,"cmd":"status"}')
check "B status shows grants_in A" "\"from\":\"$TA\"" "$R"
R=$(asA '{"v":1,"cmd":"status"}')
check "A status shows grants_out B (can be heard)" "\"to\":\"$TB\"" "$R"

R=$(asA '{"v":1,"cmd":"registry"}')
check "registry lists both teams" "\"name\":\"$TB\"" "$R"

R=$(asA '{"v":2,"cmd":"ping"}')
check "wrong major -> E_VERSION" "E_VERSION" "$R"

echo "== $pass passed, $fail failed =="
[ "$fail" -eq 0 ]
