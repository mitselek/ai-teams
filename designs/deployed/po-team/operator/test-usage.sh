#!/bin/bash
# test-usage.sh -- exercise usage-snapshot + usage-log against a FAKE endpoint.
# No keychain, no real network: USAGE_TOKEN skips the keychain, USAGE_ENDPOINT
# points at a local http server serving canned JSON (incl. a 401 and a
# malformed case). Proves: append on success, soft-fail + ok:false row on 401
# in --quiet, loud nonzero on 401 interactive, generic limits[] parsing
# (Fable renamed to Opus), csv+jsonl both written, viewer renders.
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SNAP="$HERE/usage-snapshot"
LOG="$HERE/usage-log"
PY=/usr/bin/python3
WORK="$(mktemp -d)"
FAKE_PORT=0

cleanup() {
  [ -n "${SRV_PID:-}" ] && kill "$SRV_PID" 2>/dev/null
  rm -rf "$WORK"
}
trap cleanup EXIT

export USAGE_STATE_DIR="$WORK/state"
export USAGE_TOKEN="fake-token-not-a-real-secret"
export NO_COLOR=1

FAIL=0
OUT=""
t() { # t <name> <expected-exit> -- runs "$@", captures combined output in $OUT
  local name="$1" want="$2"; shift 2
  OUT="$("$@" 2>&1)"; RC=$?
  if [ "$RC" -ne "$want" ]; then
    echo "FAIL $name: exit $RC (wanted $want)"; echo "$OUT" | sed 's/^/    /'
    FAIL=1
  else
    echo "ok   $name (exit $RC)"
  fi
}
expect() { # expect <name> <needle> -- $OUT must contain needle
  local name="$1" needle="$2"
  if ! printf '%s' "$OUT" | grep -qF "$needle"; then
    echo "FAIL $name: output missing '$needle'"; echo "$OUT" | sed 's/^/    /'
    FAIL=1
  else
    echo "ok   $name"
  fi
}
jsonl_last() { tail -n 1 "$USAGE_STATE_DIR/usage.jsonl"; }

# ---- fixtures -----------------------------------------------------------
# A valid response with the per-model scope renamed Fable -> Opus, to prove
# limits[] parsing is generic and does NOT hardcode "Fable".
cat > "$WORK/ok.json" <<'EOF'
{"five_hour":{"utilization":12.0,"resets_at":"2026-08-07T16:00:00+00:00"},
 "seven_day":{"utilization":87.0,"resets_at":"2026-08-12T20:00:00+00:00"},
 "limits":[
   {"kind":"session","group":"session","percent":12,"severity":"normal","resets_at":"2026-08-07T16:00:00+00:00","scope":null,"is_active":false},
   {"kind":"weekly_all","group":"weekly","percent":87,"severity":"warning","resets_at":"2026-08-12T20:00:00+00:00","scope":null,"is_active":true},
   {"kind":"weekly_scoped","group":"weekly","percent":83,"severity":"warning","resets_at":"2026-08-12T20:00:00+00:00","scope":{"model":{"id":null,"display_name":"Opus"},"surface":null},"is_active":false}
 ],
 "subscription":"max"}
EOF
echo 'this is { not valid json' > "$WORK/malformed.json"

# ---- fake http server: path decides the response ------------------------
cat > "$WORK/fakeserver.py" <<PYEOF
import http.server, socketserver, sys
OKJSON = open("$WORK/ok.json","rb").read()
BADJSON = open("$WORK/malformed.json","rb").read()
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if self.path.startswith("/401"):
            self.send_response(401); self.end_headers()
            self.wfile.write(b'{"error":"unauthorized"}'); return
        if self.path.startswith("/malformed"):
            self.send_response(200)
            self.send_header("Content-Type","application/json"); self.end_headers()
            self.wfile.write(BADJSON); return
        self.send_response(200)
        self.send_header("Content-Type","application/json"); self.end_headers()
        self.wfile.write(OKJSON)
httpd = socketserver.TCPServer(("127.0.0.1", 0), H)
sys.stdout.write(str(httpd.server_address[1])+"\n"); sys.stdout.flush()
httpd.serve_forever()
PYEOF

# Start it and read the chosen port from its first stdout line.
exec 3< <("$PY" "$WORK/fakeserver.py")
SRV_PID=$!
read -r FAKE_PORT <&3
if [ -z "$FAKE_PORT" ]; then echo "FAIL: fake server did not start"; exit 1; fi
BASE="http://127.0.0.1:$FAKE_PORT"
echo "fake endpoint on port $FAKE_PORT"

# ========================================================================
echo "== success path =="
export USAGE_ENDPOINT="$BASE/ok"
t   snap-success 0 "$SNAP"
expect snap-success-msg "ok -- 3 limit(s)"
# jsonl row written, ok:true
t   jsonl-exists 0 test -f "$USAGE_STATE_DIR/usage.jsonl"
OUT="$(jsonl_last)"
expect jsonl-ok-true '"ok":true'
expect jsonl-generic-opus '"model":"Opus"'   # proves NOT hardcoded to Fable
expect jsonl-5h '"five_hour_pct":12.0'
# csv written with header + one row per limit
t   csv-exists 0 test -f "$USAGE_STATE_DIR/usage.csv"
OUT="$(cat "$USAGE_STATE_DIR/usage.csv")"
expect csv-header "ts_utc,kind,model,percent,resets_at"
expect csv-session "session,,12"
expect csv-opus-row ",weekly_scoped,Opus,83,"

echo "== append (second success adds a row, does not clobber) =="
BEFORE=$(wc -l < "$USAGE_STATE_DIR/usage.jsonl")
t   snap-again 0 "$SNAP"
AFTER=$(wc -l < "$USAGE_STATE_DIR/usage.jsonl")
if [ "$AFTER" -eq $((BEFORE + 1)) ]; then echo "ok   append-grew ($BEFORE -> $AFTER)";
else echo "FAIL append: $BEFORE -> $AFTER"; FAIL=1; fi

echo "== 401 in --quiet: soft-fail, exit 0, ok:false row =="
export USAGE_ENDPOINT="$BASE/401"
t   snap-401-quiet 0 "$SNAP" --quiet
expect snap-401-quiet-msg "soft-fail"
OUT="$(jsonl_last)"
expect jsonl-ok-false '"ok":false'
expect jsonl-401-reason "401 unauthorized"
t   errlog-exists 0 test -f "$USAGE_STATE_DIR/snapshot.err"

echo "== 401 interactive: loud, NONZERO =="
t   snap-401-loud 1 "$SNAP"
expect snap-401-loud-msg "FAILED"

echo "== malformed body in --quiet: soft-fail + ok:false =="
export USAGE_ENDPOINT="$BASE/malformed"
t   snap-malformed 0 "$SNAP" --quiet
OUT="$(jsonl_last)"
expect malformed-ok-false '"ok":false'
expect malformed-reason "non-JSON"

echo "== viewer renders =="
unset USAGE_ENDPOINT
t   view-latest 0 "$LOG"
# latest row is malformed(ok:false) -> shows failure but falls back to last good
expect view-fail-shown "FAILED"
expect view-fallback "last good snapshot"
expect view-session-bar "session (5h)"

t   view-history 0 "$LOG" history 10
expect view-hist-header "5h%"
expect view-hist-ok "ok"
expect view-hist-fail "FAIL"

t   view-csv 0 "$LOG" csv
expect view-csv-path "usage.csv"

echo "== empty/missing log handled gracefully =="
EMPTY="$WORK/empty"; mkdir -p "$EMPTY"
t   view-empty 0 env USAGE_STATE_DIR="$EMPTY" NO_COLOR=1 "$LOG"
expect view-empty-msg "no snapshots yet"
t   view-empty-hist 0 env USAGE_STATE_DIR="$EMPTY" NO_COLOR=1 "$LOG" history

echo "========================================================"
if [ "$FAIL" -eq 0 ]; then echo "ALL GREEN"; else echo "SOME FAILED"; fi
exit "$FAIL"
