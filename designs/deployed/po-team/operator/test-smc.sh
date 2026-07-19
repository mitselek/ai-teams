#!/bin/bash
# test-smc.sh -- exercise smc against a fake hub (no network, no real mail).
# Runs inbox / read / ack / send / check / log / teams. Loud on any failure.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SMC="$HERE/smc"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

export SMC_STATE_DIR="$WORK/state"
export NO_COLOR=1

FAIL=0
t() { # t <name> <expected-exit> -- runs "$@" (from 3rd arg), captures output
  local name="$1" want="$2"; shift 2
  OUT="$("$@" 2>&1)"; RC=$?
  if [ "$RC" -ne "$want" ]; then
    echo "FAIL $name: exit $RC (wanted $want)"; echo "$OUT" | sed 's/^/    /'
    FAIL=1
  else
    echo "ok   $name"
  fi
}
expect() { # expect <name> <needle> -- checks $OUT from the last t()
  local name="$1" needle="$2"
  if ! printf '%s' "$OUT" | grep -qF "$needle"; then
    echo "FAIL $name: output missing '$needle'"; echo "$OUT" | sed 's/^/    /'
    FAIL=1
  else
    echo "ok   $name"
  fi
}

# ---- fake hub: reads the conversation from stdin, answers canned JSON ----
cat > "$WORK/fake-hub.sh" <<'EOF'
#!/bin/bash
read -r first
rest="$(cat)"
case "$first" in
  *'"collect"'*)
    echo '{"v":1,"ok":true,"cmd":"collect","ts":"2026-07-19T10:00:00Z"}'
    if [ ! -f "$FAKE_ACKED" ]; then
      echo '{"id":"aaaa111122223333","from_team":"po-team","to_team":"operator","deposited_at":"2026-07-19T09:00:00Z","entry":{"from":"henry","text":"[2026-07-19 09:00] daemon is live","summary":"daemon is live"}}'
      echo '{"id":"bbbb444455556666","from_team":"mvox","to_team":"operator","deposited_at":"2026-07-19T09:30:00Z","entry":{"from":"gama","text":"[2026-07-19 09:30] deploy done\nsecond line","summary":"deploy done"}}'
    fi
    ;;
  *'"ack"'*)
    touch "$FAKE_ACKED"
    echo '{"v":1,"ok":true,"cmd":"ack","ts":"2026-07-19T10:01:00Z"}'
    echo '{"id":"aaaa111122223333","status":"deleted"}'
    echo '{"id":"bbbb444455556666","status":"deleted"}'
    ;;
  *'"deposit"'*)
    echo '{"v":1,"ok":true,"cmd":"deposit","ts":"2026-07-19T10:02:00Z"}'
    case "$rest" in
      *'"to":"nosuch"'*)
        echo '{"id":null,"to":"nosuch","status":"rejected","error":{"code":"E_UNKNOWN_TEAM","detail":"not registered"}}' ;;
      *'"to":"gama@po-team"'*)
        # real hub knows only TEAMS -- an agent@team in the deposit "to"
        # field means smc failed to split; reject like the hub would
        echo '{"id":null,"to":"gama@po-team","status":"rejected","error":{"code":"E_UNKNOWN_TEAM","detail":"not registered"}}' ;;
      *'dupe-me'*)
        echo '{"id":"dddd000011112222","to":"po-team","status":"duplicate"}' ;;
      *) echo '{"id":"cccc777788889999","to":"po-team","status":"accepted"}' ;;
    esac
    ;;
  *'"status"'*)
    echo '{"v":1,"ok":true,"cmd":"status","ts":"2026-07-19T10:03:00Z"}'
    echo '{"team":"operator","grants_in":[{"from":"po-team","since":"2026-07-19T08:00:00Z"},{"from":"mvox","since":"2026-07-19T08:00:00Z"}],"grants_out":[{"to":"po-team","since":"2026-07-19T08:00:00Z"},{"to":"mvox","since":"2026-07-19T08:00:00Z"}],"waiting_for_me":{"po-team":1},"deposited_uncollected":{},"hub":{"uptime_s":100,"protocol":1}}'
    ;;
  *)
    echo '{"v":1,"ok":false,"cmd":"?","ts":"2026-07-19T10:04:00Z","error":{"code":"E_MALFORMED","detail":"fake hub confused"}}'
    ;;
esac
EOF
chmod +x "$WORK/fake-hub.sh"
export FAKE_ACKED="$WORK/acked.flag"
export SMC_HUB_CMD="$WORK/fake-hub.sh"

# ---- inbox ----
t "inbox exit"            0 "$SMC" inbox
expect "inbox shows po-team"    "po-team"
expect "inbox shows body"       "daemon is live"
expect "inbox shows second msg" "deploy done"
expect "inbox shows id"         "aaaa111122223333"

# archived before anything else?
t "archive has both msgs" 0 grep -c '"received"' "$SMC_STATE_DIR/archive.jsonl"
expect "archive count 2" "2"

# re-run inbox: must NOT duplicate archive entries
t "inbox rerun"           0 "$SMC" inbox
t "archive still 2"       0 grep -c '"received"' "$SMC_STATE_DIR/archive.jsonl"
expect "no dup archive" "2"

# ---- status.json: written on inbox, nothing seen yet -> unseen 2 ----
t "status after inbox"    0 python3 - <<PYEOF
import json
s = json.load(open("$SMC_STATE_DIR/status.json"))
assert len(s["waiting"]) == 2, s
assert s["unseen"] == 2, s
assert s["waiting"][0]["id"] == "aaaa111122223333", s
assert s["waiting"][0]["from_team"] == "po-team", s
assert s["waiting"][0]["summary"] == "daemon is live", s
assert s["waiting"][1]["from_team"] == "mvox", s
assert "checked_at" in s, s
print("status.json ok: 2 waiting, 2 unseen")
PYEOF
expect "status inbox content"   "2 waiting, 2 unseen"

# ---- read by inbox number and id prefix ----
t "read by number"        0 "$SMC" read 2
expect "read shows full body"   "second line"
t "read by id prefix"     0 "$SMC" read aaaa
expect "read prefix works"      "daemon is live"

# ---- ordinal 0 / out-of-range must fail loud, never resolve ----
t "read 0 rejected"       1 "$SMC" read 0
expect "read 0 loud"            "out of range"
t "ack 0 rejected"        1 "$SMC" ack 0
expect "ack 0 loud"             "out of range"
t "ack 9 rejected"        1 "$SMC" ack 9
expect "ack 9 loud"             "out of range"

# ---- check (first run: 2 new; second: silent -- launchd log hygiene) ----
t "check first"           0 "$SMC" check
expect "check counts 2"         "2 new message(s)"
t "check second"          0 "$SMC" check
if [ -n "$OUT" ]; then
  echo "FAIL check silent after seen: expected no stdout"; echo "$OUT" | sed 's/^/    /'
  FAIL=1
else
  echo "ok   check silent after seen"
fi

# ---- status.json: after check marks seen -> unseen 0, still 2 waiting ----
t "status after check"    0 python3 - <<PYEOF
import json
s = json.load(open("$SMC_STATE_DIR/status.json"))
assert len(s["waiting"]) == 2, s
assert s["unseen"] == 0, s
print("status.json ok: 2 waiting, 0 unseen")
PYEOF
expect "status seen content"    "2 waiting, 0 unseen"

# ---- check with hub down: quiet exit 0 ----
SMC_HUB_CMD="false" t "check offline exit 0" 0 "$SMC" check
expect "check offline notes stderr" "hub unreachable"

# ---- interactive command with hub down: loud nonzero ----
SMC_HUB_CMD="false" t "inbox offline fails loud" 1 "$SMC" inbox

# ---- ack all (messages are archived, so allowed) ----
t "ack all"               0 "$SMC" ack all
expect "ack reports deleted"    "acked"

# ---- status.json: ack must prune acked ids so the badge clears ----
t "status after ack"      0 python3 - <<PYEOF
import json
s = json.load(open("$SMC_STATE_DIR/status.json"))
assert s["waiting"] == [], s
assert s["unseen"] == 0, s
print("status.json ok: pruned to empty")
PYEOF
expect "status ack pruned"      "pruned to empty"

# after ack the fake hub spool is empty
t "inbox empty after ack" 0 "$SMC" inbox
expect "inbox empty msg"        "inbox empty"

# ---- send: accepted, timestamped, archived ----
t "send accepted"         0 "$SMC" send po-team hello from the test rig
expect "send verdict"           "accepted"
t "sent in archive"       0 grep -c '"sent"' "$SMC_STATE_DIR/archive.jsonl"
expect "sent archived" "1"
t "sent text timestamped" 0 grep -cE '\[20[0-9]{2}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}\] hello from the test rig' "$SMC_STATE_DIR/archive.jsonl"
expect "timestamp prefix" "1"

# ---- send: agent@team DM (deposit to bare TEAM, ratified to:-line in body) ----
t "send agent@team"       0 "$SMC" send gama@po-team please survey the board
expect "dm verdict shows dest"  "gama@po-team"
t "dm to-line in body"    0 grep -c '"text":"to: gama@po-team' "$SMC_STATE_DIR/archive.jsonl"
expect "dm to-line" "1"
t "dm archived under dest" 0 grep -c '"to_team":"gama@po-team"' "$SMC_STATE_DIR/archive.jsonl"
expect "dm archive dest" "1"
t "send bad agent name"   1 "$SMC" send 'bad name@po-team' hi
expect "bad agent rejected"     "bad agent name"

# ---- send: stdin compose mode ----
printf 'body from stdin\n' > "$WORK/body.txt"
t "send stdin"            0 bash -c "\"$SMC\" send po-team < \"$WORK/body.txt\""
expect "send stdin verdict"     "accepted"

# ---- send: rejected -> nonzero ----
t "send rejected nonzero" 1 "$SMC" send nosuch this will bounce
expect "send rejected loud"     "E_UNKNOWN_TEAM"

# ---- send: duplicate -> exit 2, explicit non-delivery ----
t "send duplicate exit 2" 2 "$SMC" send po-team dupe-me please
expect "send duplicate loud"    "NOT redelivered"

# ---- log ----
t "log"                   0 "$SMC" log
expect "log shows received"     "daemon is live"
expect "log shows sent"         "hello from the test rig"
t "log 0 rejected"        1 "$SMC" log 0
expect "log 0 usage"            "N >= 1"
t "log -5 rejected"       1 "$SMC" log -5
expect "log -5 usage"           "N >= 1"

# ---- teams ----
t "teams"                 0 "$SMC" teams
expect "teams shows grant out"  "po-team"
expect "teams shows waiting"    "1 waiting"

# ---- usage ----
t "help"                  0 "$SMC" --help
expect "usage text"             "smc send"
t "unknown subcommand"    1 "$SMC" bogus

echo
if [ "$FAIL" -ne 0 ]; then echo "TESTS FAILED"; exit 1; fi
echo "ALL TESTS PASSED"
