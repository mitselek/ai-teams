#!/usr/bin/env python3
# THROWAWAY probe stand-in for WS1 resolve_team_dir (real home = stationmaster-courier.py).
# Staged into the probe container by harness.sh. Verbatim WS1 §5 logic + a __main__ shim.
# The `status` dead-string allowlist below is a GUESS pending V3 -- V3 records the ACTUAL
# post-exit status string; the real WS1 integration keys on what V3 finds, not this guess.
# (*FR:Brunel*)
import json, sys, argparse
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

def _has_live_session(claude_home, team_name):
    # GUESS allowlist -- replace with V3's actual dead-status finding before real integration.
    for s in Path(claude_home, "sessions").glob("*.json"):
        try:
            d = json.loads(s.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if f"session-{d.get('sessionId','')[:8]}" == team_name \
           and d.get("status") not in ("dead", "exited", "stopped"):
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
