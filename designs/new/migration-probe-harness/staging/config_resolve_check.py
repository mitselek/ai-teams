#!/usr/bin/env python3
# config_resolve_check.py -- harness V1 stand-in for the courier's inboxes_dir resolution.
# (*FR:Brunel*)
#
# Why this exists instead of `fr-courier-daemon.py --once`: the throwaway probe has NO hub
# (no SSH egress to a stationmaster), so a full courier --once cycle can't run. V1's real
# question is narrower and IS answerable in isolation: does the WS1 `inboxes_dir:"auto"`
# sentinel resolve to the LIVE session-<id> dir (and NOT the hardcoded framework-research)?
# This reproduces exactly the Config.__init__ resolution branch the WS1 patch adds (§6.2),
# using the same standalone resolve_team_dir staged beside it. It does NOT touch the hub.
import json, os, sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from resolve_team_dir import resolve_team_dir  # staged sibling

def _expand(p):
    if p.startswith("~"):
        return Path.home() / p.lstrip("~/\\")
    return Path(os.path.expandvars(p)).expanduser()

def main(cfg_path):
    raw = json.load(open(cfg_path))
    raw_inboxes = raw.get("inboxes_dir")
    # The WS1 Config.__init__ branch (verbatim shape):
    if raw_inboxes and raw_inboxes != "auto":
        inboxes_dir = _expand(raw_inboxes)        # explicit path (2.1.177 / rollback)
        print(f"EXPLICIT inboxes_dir={inboxes_dir}")
        return 0
    claude_home = _expand(raw.get("claude_home", "~/.claude"))
    pid_env = os.environ.get("FR_COURIER_SESSION_PID")
    team_dir = resolve_team_dir(
        claude_home,
        session_pid=int(pid_env) if pid_env else None,
        explicit_dir_name=raw.get("team_dir_name"),
    )
    inboxes_dir = team_dir / "inboxes"
    print(f"AUTO-RESOLVED team_dir={team_dir}")
    print(f"AUTO-RESOLVED inboxes_dir={inboxes_dir}")
    # The discriminating assertion V1 cares about:
    if "framework-research" in str(inboxes_dir):
        print("FAIL: resolved to a hardcoded framework-research path", file=sys.stderr)
        return 1
    if "session-" not in team_dir.name:
        print(f"WARN: team dir name {team_dir.name!r} is not a session-<id> slug", file=sys.stderr)
    return 0

if __name__ == "__main__":
    cfg = sys.argv[1] if len(sys.argv) > 1 else "/home/ai-teams/fr-courier.config.json"
    sys.exit(main(cfg))
