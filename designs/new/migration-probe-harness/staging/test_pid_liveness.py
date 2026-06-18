#!/usr/bin/env python3
# test_pid_liveness.py -- LINUX unit-validation for the V3-corrected process-liveness resolver.
# (*FR:Brunel*) 2026-06-18.
#
# WHY: the V3 finding (sessions/<pid>.json lingers status:"idle" for dead sessions) forced
# _has_live_session to switch from a status-allowlist to PROCESS-liveness (os.kill(pid,0) +
# procStart-vs-/proc/<pid>/stat-field-22 PID-reuse guard). os.kill(pid,0) and /proc are POSIX --
# the logic can only be unit-validated on LINUX (the Windows dev box gives false negatives because
# its os.kill semantics differ). This test uses REAL pids (no Claude session, no OAuth, no probe
# spin-up, per team-lead 2026-06-18) so the must-fix can be Linux-validated cheaply before routing.
#
# RUN (on the rc host or any Linux box with python3):
#   python3 test_pid_liveness.py
#   -> exit 0 + "ALL PASS" on success; exit 1 + the failing assertion otherwise.
import os, sys, subprocess, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from resolve_team_dir import _pid_alive, _has_live_session

def _proc_start(pid):
    """The real /proc/<pid>/stat field-22 start-time for a pid (what procStart should match)."""
    with open(f"/proc/{pid}/stat", encoding="utf-8") as fh:
        return fh.read().rsplit(")", 1)[1].split()[19]

fails = []
def check(name, got, want):
    ok = got == want
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}: got={got!r} want={want!r}")
    if not ok:
        fails.append(name)

print("test_pid_liveness (Linux process-liveness unit-validation)")

# --- 1. own pid is alive ---
check("own-pid alive (no procstart)", _pid_alive(os.getpid()), True)
check("own-pid alive (correct procstart)", _pid_alive(os.getpid(), _proc_start(os.getpid())), True)
check("own-pid DEAD under wrong procstart (PID-reuse guard)", _pid_alive(os.getpid(), "1"), False)

# --- 2. a real spawned process: alive while running, dead after kill ---
p = subprocess.Popen(["sleep", "30"])
time.sleep(0.2)
real_start = _proc_start(p.pid)
check("spawned sleep alive (no procstart)", _pid_alive(p.pid), True)
check("spawned sleep alive (correct procstart)", _pid_alive(p.pid, real_start), True)
p.kill(); p.wait()
time.sleep(0.1)
check("killed sleep is DEAD", _pid_alive(p.pid), False)
check("killed sleep DEAD even with old procstart", _pid_alive(p.pid, real_start), False)

# --- 3. garbage / impossible pids ---
check("huge unused pid dead", _pid_alive(9999999), False)
check("None pid dead", _pid_alive(None), False)
check("non-numeric pid dead", _pid_alive("abc"), False)

# --- 4. _has_live_session end-to-end: a fixture sessions/ dir with one live + one dead entry ---
import json, tempfile, pathlib
with tempfile.TemporaryDirectory() as td:
    home = pathlib.Path(td)
    (home / "sessions").mkdir()
    live = subprocess.Popen(["sleep", "30"]); time.sleep(0.2)
    # live entry: real pid + its real procStart
    (home / "sessions" / f"{live.pid}.json").write_text(json.dumps(
        {"pid": live.pid, "sessionId": "live1234-aaaa-bbbb", "procStart": _proc_start(live.pid), "status": "idle"}))
    # dead entry: a killed pid, status STILL "idle" (the V3 lingering shape)
    dead = subprocess.Popen(["sleep", "30"]); dead.kill(); dead.wait()
    (home / "sessions" / f"{dead.pid}.json").write_text(json.dumps(
        {"pid": dead.pid, "sessionId": "dead5678-cccc-dddd", "procStart": "999", "status": "idle"}))
    check("_has_live_session true for the LIVE session-<id>", _has_live_session(home, "session-live1234"), True)
    check("_has_live_session FALSE for the DEAD-but-idle session-<id>", _has_live_session(home, "session-dead5678"), False)
    live.kill(); live.wait()

print()
if fails:
    print(f"FAIL ({len(fails)}): {', '.join(fails)}")
    sys.exit(1)
print("ALL PASS -- process-liveness resolver validated on Linux.")
sys.exit(0)
