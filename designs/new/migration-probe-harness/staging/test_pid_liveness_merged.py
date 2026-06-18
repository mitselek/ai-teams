#!/usr/bin/env python3
# test_pid_liveness_merged.py -- Herald's belt-and-suspenders: run the SAME 12 liveness assertions
# but importing _pid_alive / _has_live_session from the LITERAL MERGED stationmaster-courier.py
# (not the byte-identical staged copy). Evidence-by-execution > evidence-by-equivalence for a
# production-unpin must-fix: this catches any import-time/integration error of the full merged
# module that the isolated staged copy structurally cannot. (*FR:Brunel*, Herald-requested 2026-06-18)
#
# RUN (Linux, no OAuth, Tier R -- spawns/kills its own sleeps in a tempdir):
#   python3 test_pid_liveness_merged.py /path/to/stationmaster-courier.py
#   (repo path: teams/framework-research/poc/ghost-bridge/stationmaster-courier.py)
#   -> exit 0 + "ALL PASS (merged file)" on success; exit 1 + the failing assertion otherwise.
import os, sys, subprocess, time, json, tempfile, pathlib, importlib.util

if len(sys.argv) < 2:
    sys.stderr.write("usage: test_pid_liveness_merged.py <path-to-stationmaster-courier.py>\n")
    sys.exit(2)

# Import the hyphen-named module by path (can't `import` it normally; importlib, same as the daemon).
_REF = pathlib.Path(sys.argv[1]).resolve()
if not _REF.exists():
    sys.stderr.write(f"FATAL: merged courier not found at {_REF}\n"); sys.exit(2)
spec = importlib.util.spec_from_file_location("stationmaster_courier_merged", _REF)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)   # <-- this is the integration check: full module must import clean
_pid_alive = mod._pid_alive
_has_live_session = mod._has_live_session
print(f"imported _pid_alive + _has_live_session from MERGED {_REF.name} (module loaded clean)")

def _proc_start(pid):
    with open(f"/proc/{pid}/stat", encoding="utf-8") as fh:
        return fh.read().rsplit(")", 1)[1].split()[19]

fails = []
def check(name, got, want):
    ok = got == want
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}: got={got!r} want={want!r}")
    if not ok:
        fails.append(name)

check("own-pid alive (no procstart)", _pid_alive(os.getpid()), True)
check("own-pid alive (correct procstart)", _pid_alive(os.getpid(), _proc_start(os.getpid())), True)
check("own-pid DEAD under wrong procstart (PID-reuse guard)", _pid_alive(os.getpid(), "1"), False)

p = subprocess.Popen(["sleep", "30"]); time.sleep(0.2)
real_start = _proc_start(p.pid)
check("spawned sleep alive (no procstart)", _pid_alive(p.pid), True)
check("spawned sleep alive (correct procstart)", _pid_alive(p.pid, real_start), True)
p.kill(); p.wait(); time.sleep(0.1)
check("killed sleep is DEAD", _pid_alive(p.pid), False)
check("killed sleep DEAD even with old procstart", _pid_alive(p.pid, real_start), False)

check("huge unused pid dead", _pid_alive(9999999), False)
check("None pid dead", _pid_alive(None), False)
check("non-numeric pid dead", _pid_alive("abc"), False)

with tempfile.TemporaryDirectory() as td:
    home = pathlib.Path(td); (home / "sessions").mkdir()
    live = subprocess.Popen(["sleep", "30"]); time.sleep(0.2)
    (home / "sessions" / f"{live.pid}.json").write_text(json.dumps(
        {"pid": live.pid, "sessionId": "live1234-aaaa-bbbb", "procStart": _proc_start(live.pid), "status": "idle"}))
    dead = subprocess.Popen(["sleep", "30"]); dead.kill(); dead.wait()
    (home / "sessions" / f"{dead.pid}.json").write_text(json.dumps(
        {"pid": dead.pid, "sessionId": "dead5678-cccc-dddd", "procStart": "999", "status": "idle"}))
    check("_has_live_session true for the LIVE session-<id>", _has_live_session(home, "session-live1234"), True)
    check("_has_live_session FALSE for the DEAD-but-idle session-<id>", _has_live_session(home, "session-dead5678"), False)
    live.kill(); live.wait()

print()
if fails:
    print(f"FAIL ({len(fails)}): {', '.join(fails)}"); sys.exit(1)
print("ALL PASS (merged file) -- production stationmaster-courier.py liveness validated on Linux.")
sys.exit(0)
