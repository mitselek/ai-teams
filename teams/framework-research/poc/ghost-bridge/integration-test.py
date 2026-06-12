#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
integration-test.py -- local courier <-> hub integration smoke (Task #6).

(*FR:Herald*)

Drives the REAL reference courier (stationmaster-courier.py) against the REAL
hub forced-command shell (stationmaster/sm-shell), wired together in-process.

What this covers:  the full protocol conversation surface AND the courier-side
local-file disciplines that Brunel's smoke-test.sh cannot reach (consume-by-
rename, spool retention on rejection, inject-by-exclusive-create, anti-spoof
attribution, delivered-ledger dedup, two-phase ack/custody-transfer).

What this does NOT cover (covered elsewhere -- do not claim it here):
  - the ssh / sshd forced-command / Docker transport hop. That is exercised by
    stationmaster/smoke-test.sh over real ssh, and by the deploy-time run on
    prod-llm. Here, the courier's `converse()` is redirected to invoke sm-shell
    directly (`sm-shell <team>` on stdin/stdout) -- which is EXACTLY the byte
    pipe the forced command presents, minus the transport.
  - the T6.a inbox-injection race harness on the deployment substrate (Task #3,
    operator-owned; SPEC-v3 D10 -- Windows-only run is not authoritative).

Run:  python integration-test.py        (exits non-zero on any failure)
stdlib only; requires sibling stationmaster-courier.py and stationmaster/sm-shell.
"""

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SM_SHELL = HERE / "stationmaster" / "sm-shell"
COURIER = HERE / "stationmaster-courier.py"
PYEXE = sys.executable


def load_courier():
    spec = importlib.util.spec_from_file_location("courier", COURIER)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    if not SM_SHELL.exists():
        print(f"SKIP: hub shell not found at {SM_SHELL} (Task #1 not landed yet)")
        return 0
    courier = load_courier()

    root = Path(tempfile.mkdtemp(prefix="sm-integ-"))
    hub_state = root / "hub-state"
    hub_state.mkdir()
    # Human registration step (prod: authorized_keys + forced-command binding).
    (hub_state / "registry.json").write_text(json.dumps({
        "framework-research": {"registered": "2026-06-12T00:00:00Z"},
        "hr-devs": {"registered": "2026-06-12T00:00:00Z"},
    }), encoding="utf-8")

    def run_sm_shell(team, request_lines):
        # Invoke sm-shell exactly as the sshd forced command would: team is
        # argv[1] (channel-is-identity), conversation on stdin -> stdout.
        payload = "".join(l + "\n" for l in request_lines)
        env = dict(os.environ, SM_STATE_DIR=str(hub_state))
        proc = subprocess.run([PYEXE, str(SM_SHELL), team],
                              input=payload.encode("utf-8"),
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              env=env, timeout=30)
        if proc.returncode != 0 and not proc.stdout:
            raise courier.TransportError(
                f"sm-shell rc={proc.returncode}: {proc.stderr.decode(errors='replace')}")
        lines = [l for l in proc.stdout.decode("utf-8").strip().splitlines() if l.strip()]
        return courier.HubResponse(json.loads(lines[0]), [json.loads(l) for l in lines[1:]])

    fr_inboxes = root / "fr" / "inboxes"
    fr_inboxes.mkdir(parents=True)
    cfg = courier.Config({
        "team": "framework-research", "ssh_target": "sm@hub", "ssh_key": "~/.ssh/none",
        "inboxes_dir": str(fr_inboxes), "ghost_outboxes": ["hr-devs-bridge"],
        "target_inbox": "team-lead", "state_dir": str(root / "fr" / "state"),
    })
    courier.validate_startup(cfg)
    # Redirect the courier transport to the real hub shell (team from config).
    courier.converse = lambda c, lines, timeout_s=60.0: run_sm_shell(c.team, lines)

    stats = {"p": 0, "f": 0}

    def check(label, cond):
        if cond:
            stats["p"] += 1
            print(f"  PASS  {label}")
        else:
            stats["f"] += 1
            print(f"  FAIL  {label}")

    print("== courier <-> hub LOCAL INTEGRATION (real sm-shell, real courier loop) ==")

    r = courier.cmd_ping(cfg)
    check("ping ok + hub identifies framework-research",
          r.ok and r.data_lines[0]["team"] == "framework-research")
    check("ping reports a fingerprint field", "fingerprint" in r.data_lines[0])

    ob = fr_inboxes / "hr-devs-bridge.json"
    ob.write_text(json.dumps([{"from": "finn", "text": "hi hr-devs", "summary": "s",
                               "timestamp": "2026-06-12T10:00:00Z", "read": False}]), encoding="utf-8")
    courier.consume_outboxes_to_spool(cfg)
    check("outbox consumed by atomic rename (watched file gone)", not ob.exists())
    courier.deposit_spool(cfg)
    check("deposit before grant -> E_NOGRANT, spool RETAINED (no drop, no TTL)",
          len(list(cfg.spool_dir.glob("*.json"))) == 1)

    gr = run_sm_shell("hr-devs", ['{"v":1,"cmd":"grant","args":{"team":"framework-research"}}'])
    check("hr-devs grants framework-research",
          gr.ok and any(e["from"] == "framework-research" for e in gr.data_lines[0]["grants_in"]))

    courier.deposit_spool(cfg)
    check("after grant: deposit accepted, spool cleared",
          list(cfg.spool_dir.glob("*.json")) == [])

    ob.write_text(json.dumps([{"from": "finn", "text": "hi hr-devs", "summary": "s",
                               "timestamp": "2026-06-12T10:00:00Z", "read": False}]), encoding="utf-8")
    courier.consume_outboxes_to_spool(cfg)
    courier.deposit_spool(cfg)
    check("duplicate deposit treated as success (spool cleared)",
          list(cfg.spool_dir.glob("*.json")) == [])

    run_sm_shell("framework-research", ['{"v":1,"cmd":"grant","args":{"team":"hr-devs"}}'])
    dep = run_sm_shell("hr-devs", ['{"v":1,"cmd":"deposit"}', json.dumps(
        {"to": "framework-research", "entry": {"from": "IMPERSONATED-LEAD", "text": "inbound hello",
                                               "summary": "s", "timestamp": "2026-06-12T11:00:00Z", "read": False}})])
    check("hr-devs->fr deposit accepted", dep.ok and dep.data_lines[0]["status"] == "accepted")

    ledger = courier.Ledger(cfg.ledger_path)
    courier.process_inbound(cfg, ledger)
    tgt = fr_inboxes / "team-lead.json"
    got = json.loads(tgt.read_text()) if tgt.exists() else []
    check("inbound: injected into team-lead inbox", len(got) == 1)
    check("anti-spoof: from = hr-devs-ghost (authenticated from_team, NOT entry.from claim)",
          bool(got) and got[0]["from"] == "hr-devs-ghost")
    check("body forwarded verbatim", bool(got) and got[0]["text"] == "inbound hello")

    r = run_sm_shell("framework-research", ['{"v":1,"cmd":"collect"}'])
    check("two-phase: after courier ack, hub has nothing waiting", len(r.data_lines) == 0)

    run_sm_shell("hr-devs", ['{"v":1,"cmd":"deposit"}', json.dumps(
        {"to": "framework-research", "entry": {"from": "x", "text": "second", "summary": "s2",
                                               "timestamp": "2026-06-12T11:05:00Z", "read": False}})])
    tgt.write_text("[]", encoding="utf-8")  # harness drained the first delivery
    ledger2 = courier.Ledger(cfg.ledger_path)  # reload from disk (crash-survival)
    courier.process_inbound(cfg, ledger2)
    got2 = json.loads(tgt.read_text())
    check("second distinct message injected", len(got2) == 1 and got2[0]["text"] == "second")
    courier.process_inbound(cfg, ledger2)
    check("no duplicate on clean re-run (ledger + ack both held)",
          len(json.loads(tgt.read_text())) == 1)

    print(f"== {stats['p']} passed, {stats['f']} failed ==")
    return 1 if stats["f"] else 0


if __name__ == "__main__":
    sys.exit(main())
