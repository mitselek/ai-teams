#!/usr/bin/env python3
# THROWAWAY probe stand-in for WS1 resolve_team_dir (real home = stationmaster-courier.py).
# Staged into the probe container by harness.sh. Mirrors the MERGED resolver in
# stationmaster-courier.py (Herald, L927-) so the harness re-run validates production-equivalent
# logic -- including the CROSS-PLATFORM _pid_alive (the live courier runs on WINDOWS / Scheduled
# Task; a Linux-only os.kill replacement would break production liveness -- Herald's catch).
# LIVENESS = PROCESS-LIVENESS (V3-corrected): sessions/<pid>.json is NOT GC'd on exit and dead
# entries linger status:"idle", so `status` is useless; key on cross-platform _pid_alive against
# the entry's `pid`, with an OPTIONAL Linux-only procStart PID-reuse guard that degrades on Windows.
# (*FR:Brunel*)
import json, os, subprocess, sys, argparse
from pathlib import Path

def discover_by_config_glob(claude_home):
    out = []
    for cfg in sorted(Path(claude_home, "teams").glob("*/config.json")):
        try:
            name = json.loads(cfg.read_text(encoding="utf-8"))["name"]
        except (OSError, json.JSONDecodeError, KeyError):
            continue
        out.append((name, cfg.parent))
    return out

def discover_by_session_pid(claude_home, pid):
    s = Path(claude_home, "sessions", f"{pid}.json")
    try:
        sid = json.loads(s.read_text(encoding="utf-8"))["sessionId"]
    except (OSError, json.JSONDecodeError, KeyError):
        return None
    return f"session-{sid[:8]}"

def _pid_alive(pid, procstart=None):
    """Cross-platform process-liveness -- MIRRORS stationmaster-courier.py L927 (the merged
    production function). Windows tasklist (conservative-on-can't-tell) / POSIX os.kill. The
    `procstart` guard is an OPTIONAL Linux-only PID-reuse narrowing (/proc/<pid>/stat field 22);
    it degrades to the cross-platform result on Windows or any /proc-read failure -- never flips
    a conservative-alive to dead on a transient error. status is NOT a liveness signal (V3)."""
    try:
        pid = int(pid)
    except (TypeError, ValueError):
        return False
    if pid <= 0:
        return False
    if os.name == "nt":
        try:
            out = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/NH"],
                                 stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=10)
            return str(pid) in out.stdout.decode(errors="replace")
        except (OSError, subprocess.SubprocessError):
            return True  # can't tell -> assume alive (conservative)
    else:
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return False
        except (PermissionError, OSError):
            return True  # exists but not ours / can't tell -> conservative alive
        if procstart is not None:
            try:
                with open(f"/proc/{pid}/stat", encoding="utf-8") as fh:
                    fields = fh.read().rsplit(")", 1)[1].split()
                return str(procstart) == str(fields[19])  # field 22; idx 19 post-comm
            except (OSError, IndexError, ValueError):
                return True
        return True

def _has_live_session(claude_home, team_name):
    # PROCESS-LIVENESS (V3-corrected): match the team's session-<id> AND confirm its pid is a
    # live process (status is NOT a liveness signal -- dead entries linger status:"idle").
    for s in Path(claude_home, "sessions").glob("*.json"):
        try:
            d = json.loads(s.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if f"session-{d.get('sessionId','')[:8]}" == team_name \
           and _pid_alive(d.get("pid"), d.get("procStart")):
            return True
    return False

def resolve_team_dir(claude_home, *, session_pid=None, explicit_dir_name=None):
    teams_root = Path(claude_home, "teams")
    if explicit_dir_name:
        d = teams_root / explicit_dir_name
        if not d.is_dir():
            raise RuntimeError(f"explicit team_dir_name {explicit_dir_name!r} not found under {teams_root}")
        return d
    candidates = discover_by_config_glob(claude_home)
    if not candidates:
        raise RuntimeError(f"no team dir found under {teams_root}")
    if len(candidates) == 1:
        # defensive single-dir self-confirm (Aen hardening note): warn on pid mismatch.
        if session_pid is not None:
            want = discover_by_session_pid(claude_home, session_pid)
            if want and want != candidates[0][0]:
                sys.stderr.write(f"WARN: single dir {candidates[0][0]} != pid-derived {want}\n")
        return candidates[0][1]
    if session_pid is not None:
        want = discover_by_session_pid(claude_home, session_pid)
        for name, d in candidates:
            if name == want:
                return d
    live = [(n, d) for n, d in candidates if _has_live_session(claude_home, n)]
    if len(live) == 1:
        return live[0][1]
    raise RuntimeError(f"ambiguous: {[n for n,_ in candidates]} (live: {[n for n,_ in live]})")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--claude-home", default="~/.claude")
    ap.add_argument("--session-pid", type=int, default=None)
    ap.add_argument("--team-dir-name", default=None)
    # --name -> print the bare session-<id> slug (Herald's lifecycle bash contract for T2/T3:
    #   SLUG=$(resolve_team_dir.py --name)  -> slug to stdout + exit 0; stderr msg + nonzero on no-resolve).
    # default -> print the full team dir PATH (the courier's inboxes_dir base).
    ap.add_argument("--name", action="store_true", help="print bare session-<id> slug, not the full path")
    a = ap.parse_args()
    try:
        d = resolve_team_dir(Path(a.claude_home).expanduser(),
                             session_pid=a.session_pid, explicit_dir_name=a.team_dir_name)
        print(d.name if a.name else d)
    except RuntimeError as e:
        sys.stderr.write(f"{e}\n"); sys.exit(1)
