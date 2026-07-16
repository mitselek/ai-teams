#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
comms-mcp.py -- stdio MCP server: the agent-facing SEND + pull-READ interface
for the stationmaster mail network (epic #92, issue #100).

WHY THIS EXISTS
  Native SendMessage cannot reach the cross-team outbox (the harness routes only
  to REGISTERED agents; pre-creating the outbox file does not help -- both
  tested). So agents send via an MCP TOOL instead. A tool call is a synchronous
  JSON-RPC request/response, so `send` can return the hub's accept/duplicate/
  reject verdict IN THE SAME CALL -- the whole point vs a fire-and-forget file
  drop.

WHAT IT IS
  A single stdlib Python file. No pip, no `mcp` SDK (neither is present in the
  ai-team containers; the whole comms stack is deliberately stdlib-only). It
  hand-rolls the tiny stdio JSON-RPC 2.0 surface MCP requires -- initialize,
  tools/list, tools/call (+ notifications, which it ignores) -- and imports the
  two reference couriers BY PATH to reuse, verbatim:
    - the ssh wire + deposit                (stationmaster-courier.py: cmd_deposit)
    - config load + inboxes_dir="auto" defer (company-courier.py:  build_cfg)
    - the to: name grammar                   (company-courier.py:  _NAME)
    - live session-<id> team-dir discovery   (stationmaster-courier.py: resolve_team_dir)
    - the non-destructive inbox read         (stationmaster-courier.py: _read_inbox_entries)
  Nothing about the ssh transport or the harness inbox rules is reimplemented here.

TOOLS
  send(to, message)   Validate `to` (<team> | <agent>@<team>), DEPOSIT DIRECTLY to
                      the hub via the per-team key (~/.ssh/sm_<team>), and return
                      the SYNCHRONOUS hub verdict:
                        {"status":"accepted"|"duplicate"|"rejected"|"error",
                         "id":...?, "error":...?}
                      Bad `to` -> validation error, NO deposit. Never silent.

  read_mail()         NON-DESTRUCTIVE pull of the team's local inbound. Resolves
                      the live session-<id> inboxes dir and reads ONLY
                      <target_inbox>.json (the single file the sidecar injects
                      into). Does NOT hub-collect -- that would race/ack-double
                      the always-running sidecar courier, which owns the
                      collect->inject->ack cycle. read_mail is a pure read of the
                      sidecar's output; it is most valuable in a solo session,
                      where the harness never surfaces the injected inbox.

CONFIG
  Reads the SAME per-team config the sidecar courier reads
  (<team>-courier-config.json: team, ssh_target, ssh_key, ssh_opts, inboxes_dir,
  target_inbox, state_dir, ghost_outboxes, claude_home?, team_dir_name?).
  Pass its path with --config <path> or the COMMS_MCP_CONFIG env var. That path
  is what pins WHICH team this server speaks for (there is no MCP field that
  carries team identity).

STDOUT HYGIENE (MCP hard rule): stdout carries ONLY framed JSON-RPC messages,
one per line, no embedded newlines. All logging goes to stderr (reuses the
reference's greppable logger).

Usage (spawned by Claude Code as a subprocess of the team session, via .mcp.json):
    comms-mcp.py --config /path/to/<team>-courier-config.json
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import re
import sys
import time
from pathlib import Path

# ---------------------------------------------------------------------------
# Reference-courier resolution (hyphenated filenames -> importlib by path)
# Same precedence pattern company-courier.py uses: explicit -> env -> sibling -> repo.
# ---------------------------------------------------------------------------
_HERE = Path(__file__).resolve().parent
_SM_ENV = "STATIONMASTER_COURIER_REF"
_CC_ENV = "COMPANY_COURIER_REF"
_SM_REPO = Path(
    "/Users/michelek/Documents/github/ai-teams/teams/framework-research/"
    "poc/ghost-bridge/stationmaster-courier.py"
)
_CC_REPO = Path(
    "/Users/michelek/Documents/github/ai-teams/teams/framework-research/"
    "poc/ghost-bridge/company-courier.py"
)


def _resolve_file(explicit, env_name, sibling_name, repo_path):
    for cand in (explicit, os.environ.get(env_name), _HERE / sibling_name, repo_path):
        if cand and Path(cand).is_file():
            return Path(cand)
    raise RuntimeError(
        f"cannot locate {sibling_name}; set the config key or ${env_name}"
    )


def _load_module(mod_name, path):
    spec = importlib.util.spec_from_file_location(mod_name, str(path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # safe: reference work is all behind __main__
    return mod


# Bound in main(): sm = stationmaster-courier, cc = company-courier.
sm = None
cc = None
_TO_RE = None          # built from cc._NAME once cc is loaded
FROM_IDENTITY = "team-lead"  # advisory: receiver rewrites `from` to <team>-courier

SERVER_NAME = "comms"
SERVER_VERSION = "1.0.0"
DEFAULT_PROTOCOL = "2025-06-18"


# ---------------------------------------------------------------------------
# Logging -- stderr ONLY (stdout is reserved for framed JSON-RPC)
# ---------------------------------------------------------------------------
def log(level, msg):
    if sm is not None:
        sm.log(level, msg)
        return
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    print(f"{ts} {level:5s} {msg}", file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# SEND -- validate `to`, build the entry, deposit DIRECTLY, return the verdict
# ---------------------------------------------------------------------------
def _validate_to(to):
    """Reuse the courier's exact name grammar (cc._NAME) against the bare `to`
    argument -- <team> or <agent>@<team>. Returns (route, None) or (None, reason)."""
    if not isinstance(to, str) or not to.strip():
        return None, "to is required and must be a non-empty string"
    m = _TO_RE.match(to.strip())
    if not m:
        return None, (
            "invalid 'to': expected '<team>' or '<agent>@<team>'. Name grammar: "
            "start with a letter or digit, then letters/digits/'.'/'_'/'-', max 64 chars."
        )
    return {"team": m.group("team"), "agent": m.group("agent")}, None


def tool_send(cfg, to, message):
    """Returns (payload_dict, is_error). is_error=False only for a hub success
    (accepted/duplicate). Bad input / rejected / transport all set is_error=True."""
    route, reason = _validate_to(to)
    if reason:
        return {"status": "rejected", "error": reason}, True
    if not isinstance(message, str) or message == "":
        return {"status": "rejected", "error": "message must be a non-empty string"}, True

    # The entry MUST be byte-stable across retries: the hub dedups by hashing the
    # entry content, so a retry after a lost-response timeout (the deposit may have
    # actually landed) must rebuild the SAME bytes -> same hub id -> recognized as
    # a duplicate, not delivered twice. Therefore NO volatile fields here: we omit
    # `read` and `timestamp` -- the receiving courier's rewrite_attribution forces
    # read:false and a fresh timestamp at inject time (fills when absent). `from`
    # is likewise rewritten to <from_team>-courier on delivery. `text`/`summary`
    # travel verbatim and are stable.
    entry = {
        "from": FROM_IDENTITY,
        "text": message,
        "summary": message.split("\n", 1)[0][:80],
        "type": "message",
    }
    # Deposit to the TEAM. The hub routes by team (a bare '<team>' in consignment.to);
    # 'agent@team' as consignment.to would be an unknown team -> E_UNKNOWN_TEAM. The
    # agent part is a v1 no-op on the receiving side (delivered to the team default
    # inbox -- company-courier V1 LIMITATION), so we route to route["team"].
    consignment = {"to": route["team"], "entry": entry}

    try:
        resp = sm.cmd_deposit(cfg, [consignment])
    except sm.TransportError as exc:
        # No envelope -> nothing happened; caller may safely retry (protocol S3).
        return {"status": "error", "error": f"transport failure: {exc}"}, True
    except Exception as exc:  # never leak a stack trace onto the wire
        return {"status": "error", "error": f"deposit failed: {exc}"}, True

    if not resp.ok:
        # Envelope-level refusal (E_VERSION / E_MALFORMED / E_INTERNAL): whole
        # deposit refused, not a per-consignment reject. Surface code + detail
        # only (resp.error is the full dict -- don't leak its repr).
        eo = resp.error if isinstance(resp.error, dict) else {}
        return {"status": "rejected",
                "error": f"{resp.error_code or 'E_REFUSED'} {eo.get('detail', '')}".strip()}, True

    r = resp.data_lines[0] if resp.data_lines else None
    if not isinstance(r, dict):
        return {"status": "error",
                "error": "hub returned no per-consignment result"}, True

    status = r.get("status")
    if status in ("accepted", "duplicate"):
        # duplicate is a SUCCESS for the caller -- the hub already has it.
        return {"status": status, "id": r.get("id")}, False

    # rejected: E_NOGRANT (recipient hasn't granted) / E_UNKNOWN_TEAM (not registered).
    eo = r.get("error") if isinstance(r.get("error"), dict) else {}
    code = eo.get("code", "E_REJECTED")
    detail = eo.get("detail", "")
    return {"status": "rejected", "id": r.get("id"),
            "error": (f"{code} {detail}").strip()}, True


# ---------------------------------------------------------------------------
# READ_MAIL -- non-destructive pull of the local injected inbox
# ---------------------------------------------------------------------------
def _read_ppid(pid):
    """ppid via /proc/<pid>/stat field 4 (Linux). None on any failure / non-Linux."""
    try:
        with open(f"/proc/{pid}/stat", encoding="utf-8") as fh:
            after = fh.read().rsplit(")", 1)[1].split()
        return int(after[1])  # after ')': state(idx0) ppid(idx1)
    except (OSError, IndexError, ValueError):
        return None


def _discover_session_pid(claude_home):
    """The MCP server is a subprocess of the claude session, so it can supply the
    session pid resolve_team_dir wants (the O(1), unambiguous tiebreaker the
    detached sidecar lacks). Honor FR_COURIER_SESSION_PID first, else walk our
    ancestry to the first pid registered under ~/.claude/sessions/<pid>.json."""
    env = os.environ.get("FR_COURIER_SESSION_PID")
    if env and env.isdigit():
        return int(env)
    sessions = Path(claude_home, "sessions")
    pid = os.getpid()
    for _ in range(24):  # bounded ancestry walk
        if (sessions / f"{pid}.json").exists():
            return pid
        ppid = _read_ppid(pid)
        if not ppid or ppid == pid or ppid <= 1:
            break
        pid = ppid
    return None


def _resolve_inboxes_dir(cfg):
    """Live session-<id>/inboxes for THIS call. Explicit inboxes_dir -> honored
    verbatim; "auto" -> re-resolve via resolve_team_dir with our session pid."""
    if getattr(cfg, "_auto_inboxes", False):
        pid = _discover_session_pid(cfg._claude_home)
        team_dir = sm.resolve_team_dir(
            cfg._claude_home,
            session_pid=pid,
            explicit_dir_name=cfg._team_dir_name,
        )
        return team_dir / "inboxes"
    return cfg.inboxes_dir


def tool_read_mail(cfg):
    """Returns (payload_dict, is_error). Reads ONLY <target_inbox>.json -- NOT a
    glob of inboxes/*.json (that dir also holds the team's OUTBOUND ghost outbox).
    Pure read: never mutates the harness-watched file (THE ONE RULE)."""
    inboxes_dir = _resolve_inboxes_dir(cfg)  # may raise RuntimeError (no live dir)
    path = inboxes_dir / f"{cfg.target_inbox}.json"
    entries = sm._read_inbox_entries(path)  # read-without-write; None if absent/mid-write
    # _read_inbox_entries returns None for BOTH "absent" and "transiently unreadable"
    # (the sidecar's rename-aside->exclusive-create window, or a mid-write). If the
    # path exists but read None, briefly retry so a single unlucky pull doesn't
    # report "no mail" while mail is momentarily unreadable.
    if entries is None and path.exists():
        for _ in range(3):
            time.sleep(0.06)
            entries = sm._read_inbox_entries(path)
            if entries is not None:
                break
    if entries is None:
        entries = []
    return {"inbox": cfg.target_inbox, "count": len(entries), "entries": entries}, False


# ---------------------------------------------------------------------------
# MCP tool declarations (tools/list)
# ---------------------------------------------------------------------------
TOOLS = [
    {
        "name": "send",
        "description": (
            "Send a message to another team (or agent) over the stationmaster mail "
            "hub and return the hub's SYNCHRONOUS verdict. `to` is '<team>' or "
            "'<agent>@<team>'. Returns status accepted | duplicate | rejected "
            "(with an error code such as E_NOGRANT / E_UNKNOWN_TEAM) | error."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "to": {
                    "type": "string",
                    "description": "Recipient: '<team>' or '<agent>@<team>'. "
                                   "Name: start alnum, then [A-Za-z0-9._-], max 64.",
                },
                "message": {
                    "type": "string",
                    "description": "The message body. Travels verbatim to the recipient.",
                },
            },
            "required": ["to", "message"],
            "additionalProperties": False,
        },
    },
    {
        "name": "read_mail",
        "description": (
            "Pull this team's waiting inbound mail on demand (non-destructive). "
            "Complementary to the always-running sidecar courier that pushes mail "
            "into the inbox; most useful in a solo session where the harness does "
            "not surface it. Reads the local inbox only; does not contact the hub."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {},
            "additionalProperties": False,
        },
    },
]


# ---------------------------------------------------------------------------
# JSON-RPC 2.0 over stdio -- minimal hand-rolled loop
# ---------------------------------------------------------------------------
def _write(obj):
    # One framed message per line, no embedded newlines (separators avoid spaces
    # but that is cosmetic; the newline is the frame).
    sys.stdout.write(json.dumps(obj, separators=(",", ":"), ensure_ascii=False) + "\n")
    sys.stdout.flush()


def _result(id_, result):
    _write({"jsonrpc": "2.0", "id": id_, "result": result})


def _error(id_, code, message):
    _write({"jsonrpc": "2.0", "id": id_, "error": {"code": code, "message": message}})


def _handle_initialize(id_, params):
    # Echo the client's protocolVersion; advertise the tools capability only.
    pv = (params or {}).get("protocolVersion") or DEFAULT_PROTOCOL
    _result(id_, {
        "protocolVersion": pv,
        "capabilities": {"tools": {}},
        "serverInfo": {"name": SERVER_NAME, "version": SERVER_VERSION},
    })


def _handle_tools_call(cfg, id_, params):
    name = (params or {}).get("name")
    args = (params or {}).get("arguments") or {}
    try:
        if name == "send":
            payload, is_err = tool_send(cfg, args.get("to"), args.get("message"))
        elif name == "read_mail":
            payload, is_err = tool_read_mail(cfg)
        else:
            # Unknown tool name = invalid params (a protocol fault, not a tool fault).
            _error(id_, -32602, f"unknown tool: {name!r}")
            return
    except Exception as exc:
        # Tool-level failure -> report IN-BAND (content + isError), never as a
        # JSON-RPC error (those are for protocol faults only).
        payload, is_err = {"error": f"{name} failed: {exc}"}, True
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    _result(id_, {"content": [{"type": "text", "text": text}], "isError": is_err})


def serve(cfg):
    while True:
        line = sys.stdin.readline()
        if line == "":
            break  # EOF: client closed the pipe / session ended
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            log("WARN", f"dropping unparseable stdin line: {line!r}")
            continue
        if not isinstance(msg, dict):
            continue

        method = msg.get("method")
        has_id = "id" in msg
        id_ = msg.get("id")

        if method is None:
            # A response to something we sent -- we send no requests. Ignore.
            continue
        if method == "initialize":
            if has_id:
                _handle_initialize(id_, msg.get("params"))
        elif method == "tools/list":
            if has_id:
                _result(id_, {"tools": TOOLS})
        elif method == "tools/call":
            if has_id:
                _handle_tools_call(cfg, id_, msg.get("params"))
        elif method == "ping":
            if has_id:
                _result(id_, {})
        elif method.startswith("notifications/"):
            pass  # notifications get no reply (initialized, cancelled, ...)
        else:
            if has_id:
                _error(id_, -32601, f"method not found: {method}")
            # else: unknown notification -> ignore


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main(argv):
    global sm, cc, _TO_RE, FROM_IDENTITY
    ap = argparse.ArgumentParser(description="stdio MCP comms server (send + read_mail)")
    ap.add_argument("--config", default=os.environ.get("COMMS_MCP_CONFIG"),
                    help="per-team courier config (also COMMS_MCP_CONFIG env)")
    args = ap.parse_args(argv)
    if not args.config:
        sys.stderr.write("comms-mcp: --config PATH (or COMMS_MCP_CONFIG) is required\n")
        return 2

    # Pin UTF-8 on the JSON-RPC pipes: message bodies carry non-ASCII (e.g. Estonian
    # accented text, emoji). On a non-UTF-8 locale, ensure_ascii=False writes would
    # otherwise raise UnicodeEncodeError and crash the loop.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stdin.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

    with open(args.config, "r", encoding="utf-8") as fh:
        raw = json.load(fh)

    sm = _load_module(
        "sm_courier",
        _resolve_file(raw.get("reference_courier"), _SM_ENV,
                      "stationmaster-courier.py", _SM_REPO),
    )
    cc = _load_module(
        "company_courier",
        _resolve_file(raw.get("company_courier"), _CC_ENV,
                      "company-courier.py", _CC_REPO),
    )
    # company-courier's module-global `sm` is None until ITS main() runs; build_cfg
    # / resolve helpers dereference it, so bind our reference in explicitly.
    cc.sm = sm

    _TO_RE = re.compile(rf"^(?:(?P<agent>{cc._NAME})@)?(?P<team>{cc._NAME})$")
    FROM_IDENTITY = raw.get("mcp_from", "team-lead")

    # build_cfg DEFERS inboxes_dir="auto" discovery (no live session needed to
    # start; read_mail re-resolves per call). A send never touches the inbox dir.
    cfg = cc.build_cfg(raw)

    # Loud-at-boot key check (mirrors company-courier main): a missing per-team hub
    # key surfaces here, not as an opaque transport failure on the first send.
    key = getattr(cfg, "ssh_key", None)
    if key and not sm._expand(str(key)).exists():
        log("WARN", f"ssh_key {key} does not exist -- hub auth will fail until the "
                    "per-team key is provisioned and sm-register'd on the hub")

    log("INFO", f"comms-mcp up: team={cfg.team!r} hub={cfg.ssh_target} "
                f"target_inbox={cfg.target_inbox} (stdio JSON-RPC)")
    serve(cfg)
    log("INFO", "comms-mcp: stdin closed, exiting")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
