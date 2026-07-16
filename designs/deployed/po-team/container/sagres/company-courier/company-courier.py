#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
company-courier.py -- container-side courier daemon for the company comms stack.

Thin wrapper over the reference courier
(teams/framework-research/poc/ghost-bridge/stationmaster-courier.py): the ssh
wire, the dedup Ledger, InstanceLock, the INBOUND collect/inject/ack cycle with
its 3 per-consignment guards, and live-session team-dir discovery are ALL
imported by path and reused VERBATIM. Only the OUTBOUND addressing is rewritten:
one ghost outbox; each entry carries `to: <team>` / `to: <agent>@<team>` on its
first line; parse OK -> deposit, parse-fail -> bounce into the sender's inbox.
Exactly two outcomes, nothing silent. Container-native continuous loop; the
session-<id> inbox dir is re-resolved every cycle.

Usage:
    company-courier.py --config /etc/company-courier/config.json
    company-courier.py --config <cfg> --once
    company-courier.py --config <cfg> --ping

V1 LIMITATIONS (documented, low-risk; see #95 follow-ups):
  - Agent-level RECEIVING routing is not implemented: `to: <agent>@<team>` is
    parsed and forwarded verbatim, but the far side delivers to the team's
    default inbox (team-lead), not the named agent. Team-level delivery only.
  - PASS-2 deposit results are matched to consignments POSITIONALLY. Safe while
    the hub echoes one result line per consignment in order (it does); a future
    id-keyed match would harden against a dropped malformed line.
  - Outbound deposit currently runs only when a live session is resolvable
    (the outbox lives in the session inbox dir). Queued spool does not ship while
    no claude session exists; it ships on the next cycle once a session returns.
"""

from __future__ import annotations

import argparse
import fcntl
import importlib.util
import json
import os
import re
import signal
import sys
import time
from pathlib import Path


class _FlockGuard:
    """Advisory whole-process lock via fcntl.flock on an fd held open for the
    process lifetime. Unlike the reference's persisted-PID InstanceLock, the
    kernel releases a flock automatically when the holding process dies -- even
    on SIGKILL / OOM / host crash -- so a sidecar on a PERSISTENT volume never
    inherits a stale lock that blocks restart (the deploy blocker). Fail loud:
    if another live daemon holds it, LOCK_NB raises and we exit non-zero."""

    def __init__(self, path):
        self._path = Path(path)
        self._fh = None

    def __enter__(self):
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._fh = open(self._path, "w")
        try:
            fcntl.flock(self._fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as exc:
            self._fh.close()
            raise RuntimeError(
                f"another company-courier already holds {self._path} ({exc}); "
                "refusing to start a second instance"
            ) from exc
        self._fh.write(f"{os.getpid()}\n")
        self._fh.flush()
        return self

    def __exit__(self, *exc):
        try:
            fcntl.flock(self._fh, fcntl.LOCK_UN)
        finally:
            self._fh.close()


# ---------------------------------------------------------------------------
# Import the reference courier by path (hyphenated filename -> importlib)
# ---------------------------------------------------------------------------
_REF_ENV = "STATIONMASTER_COURIER_REF"
_REF_SIBLING = Path(__file__).resolve().parent / "stationmaster-courier.py"
_REF_REPO = Path(
    "/Users/michelek/Documents/github/ai-teams/teams/framework-research/"
    "poc/ghost-bridge/stationmaster-courier.py"
)


def _resolve_reference(explicit):
    for cand in (explicit, os.environ.get(_REF_ENV), _REF_SIBLING, _REF_REPO):
        if cand and Path(cand).is_file():
            return Path(cand)
    raise RuntimeError(
        "cannot locate the reference courier (stationmaster-courier.py); set "
        f"config.reference_courier or ${_REF_ENV}"
    )


def _load_reference(path):
    spec = importlib.util.spec_from_file_location("sm_courier", str(path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # safe: reference work is all behind __main__
    return mod


sm = None  # bound in main()


# ---------------------------------------------------------------------------
# Logging (delegates to the reference's greppable stderr logger once bound)
# ---------------------------------------------------------------------------
def _log(level, msg):
    if sm is not None:
        sm.log(level, msg)
    else:
        ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        print(f"{ts} {level:5s} {msg}", file=sys.stderr, flush=True)


def info(m): _log("INFO", m)
def warn(m): _log("WARN", m)
def err(m):  _log("ERROR", m)


# ---------------------------------------------------------------------------
# Config: wrap the reference Config, defer inbox-dir discovery to each cycle
# ---------------------------------------------------------------------------
def build_cfg(raw):
    claude_home = sm._expand(raw.get("claude_home", "~/.claude"))
    pid_env = os.environ.get("FR_COURIER_SESSION_PID")
    session_pid = int(pid_env) if (pid_env and pid_env.isdigit()) else raw.get("session_pid")
    team_dir_name = raw.get("team_dir_name") or os.environ.get("FR_COURIER_TEAM_DIR_NAME")

    inboxes_mode = raw.get("inboxes_dir", "auto")
    raw_for_sm = dict(raw)
    if inboxes_mode == "auto":
        # placeholder keeps sm.Config.__init__ from firing discovery at load time
        state_dir = sm._expand(raw["state_dir"])
        raw_for_sm["inboxes_dir"] = str(state_dir / "_inboxes_unresolved")

    cfg = sm.Config(raw_for_sm)
    cfg._auto_inboxes = (inboxes_mode == "auto")
    cfg._claude_home = claude_home
    cfg._session_pid = session_pid
    cfg._team_dir_name = team_dir_name
    cfg._configured_team = bool(raw.get("team"))
    return cfg


def resolve_inboxes(cfg):
    """Re-resolve the live session-<id> inboxes dir for THIS cycle. Returns False
    (skip the cycle) if no live session exists or the same-volume invariant fails."""
    if cfg._auto_inboxes:
        try:
            team_dir = sm.resolve_team_dir(
                cfg._claude_home,
                session_pid=cfg._session_pid,
                explicit_dir_name=cfg._team_dir_name,
            )
        except RuntimeError as exc:
            warn(f"no live team dir this cycle ({exc}); skipping cycle")
            return False
        cfg.inboxes_dir = team_dir / "inboxes"
        if not cfg._configured_team:
            cfg.team = team_dir.name

    try:
        cfg.inboxes_dir.mkdir(parents=True, exist_ok=True)  # cold-start subdir
    except OSError as exc:
        err(f"cannot create/access inboxes dir {cfg.inboxes_dir} ({exc}); skipping cycle")
        return False

    if not sm._same_volume(cfg.inboxes_dir, cfg.state_dir):
        err(
            f"state_dir {cfg.state_dir} is NOT on the same volume as inboxes_dir "
            f"{cfg.inboxes_dir}; rename() atomicity is per-volume. Skipping cycle."
        )
        return False
    return True


# ---------------------------------------------------------------------------
# OUTBOUND -- the rewritten path: consume (reference) -> route-or-bounce
# ---------------------------------------------------------------------------
_NAME = r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}"
_TO_RE = re.compile(rf"^to:\s*(?:(?P<agent>{_NAME})@)?(?P<team>{_NAME})$", re.IGNORECASE)

BOUNCE_FROM = "courier"  # session-less channel; a reply to it dead-letters harmlessly


def parse_to_line(entry):
    """Parse ONLY the first line of the entry body. Returns (route, None) with
    route={'team':..,'agent':..|None}, or (None, reason) on any parse failure.
    The body is NEVER mutated -- the first line travels with it."""
    if not isinstance(entry, dict):
        return None, "consignment entry is not a JSON object"
    text = entry.get("text")
    if not isinstance(text, str) or text == "":
        return None, "entry has no 'text' body to parse a routing line from"
    first = text.split("\n", 1)[0].strip()
    m = _TO_RE.match(first)
    if not m:
        return None, (
            "first line is not a valid routing directive; expected "
            "'to: <team>' or 'to: <agent>@<team>', got " + repr(first)
        )
    return {"team": m.group("team"), "agent": m.group("agent")}, None


class _InboxTarget:
    """Duck-typed Config view overriding ONLY target_inbox, so the reference
    inject_batch() (verify-empty -> rename-aside -> exclusive-create) is reused
    VERBATIM to deliver a bounce into an arbitrary sender inbox."""

    def __init__(self, cfg, inbox_name):
        object.__setattr__(self, "_cfg", cfg)
        object.__setattr__(self, "target_inbox", inbox_name)

    def __getattr__(self, name):
        return getattr(self._cfg, name)


def _build_bounce_entry(orig, reason):
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    first = ""
    t = orig.get("text") if isinstance(orig, dict) else None
    if isinstance(t, str):
        first = t.split("\n", 1)[0]
    body = (
        "BOUNCE -- your outbound message could not be routed and was NOT sent.\n"
        f"Reason: {reason}\n\n"
        "The outbox daemon parses ONLY the first line of the message body. It must be:\n"
        "    to: <team>            -> deliver to that team\n"
        "    to: <agent>@<team>    -> deliver to that agent\n"
        "Name grammar: start with a letter or digit, then letters / digits / '.' / '_' / '-', "
        "max 64 characters.\n\n"
        f"--- the first line of your message was ---\n{first!r}\n\n"
        "Fix the first line and SendMessage it to the outbox again."
    )
    return {
        "from": BOUNCE_FROM,
        "text": body,
        "summary": f"Undeliverable: {reason[:64]}",
        "type": "bounce",
        "read": False,
        "timestamp": ts,
    }


def _bounce_target(cfg, entry):
    """Resolve WHERE a bounce for this entry goes. Normally the sender
    (entry['from']); but an entry with no 'from', a 'from' that is one of our own
    ghost outboxes, or the bounce-author name would loop back through consume --
    those DEAD-LETTER to default_inbox so the failure still surfaces LOUD, never
    silently vanishes (no-fallbacks). Returns a single inbox name."""
    sender = entry.get("from") if isinstance(entry, dict) else None
    ghosts = set(getattr(cfg, "ghost_outboxes", []) or [])
    if not isinstance(sender, str) or not sender or sender in ghosts or sender == BOUNCE_FROM:
        target = getattr(cfg, "default_inbox", None) or cfg.target_inbox
        warn(f"unbounceable sender {sender!r}; dead-lettering bounce to {target!r}")
        return target
    return sender


def deposit_spool_routed(cfg):
    """FIFO over the spool (oldest-first), per-entry route-or-bounce. Preserves the
    reference's crash-journal, retry and partial-retention; replaces only addressing.
    Stops the cycle on transport/envelope failure so a stuck file never lets a newer
    file jump the queue."""
    if not cfg.spool_dir.exists():
        return
    for spool_file in sorted(cfg.spool_dir.glob("*.json")):
        if _process_one_spool_file(cfg, spool_file):
            return  # hard stop this cycle: preserve FIFO past a stuck file


def _process_one_spool_file(cfg, spool_file):
    """Handle one spool file. Returns True to STOP the outbound cycle (FIFO guard)."""
    try:
        entries = json.loads(spool_file.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        warn(f"spool {spool_file.name}: unreadable ({exc}); leaving in place for inspection")
        return False
    if not isinstance(entries, list):
        warn(f"spool {spool_file.name}: not a JSON array; leaving in place")
        return False
    if not entries:
        spool_file.unlink(missing_ok=True)
        return False

    # decisions[i] parallels entries[i]:
    #   "drop"                   -> terminally handled (hub-accepted, or bounced)
    #   "retain"                 -> keep for a later cycle
    #   ("deposit", team)        -> pending hub deposit, resolved in PASS 2
    #   ("bounce", target, ent)  -> pending bounce inject, resolved in PASS 3
    decisions = [None] * len(entries)

    # ---- PASS 1: classify. Routeable -> deposit; parse-fail -> bounce-pending ----
    for i, entry in enumerate(entries):
        route, reason = parse_to_line(entry)
        if route is not None:
            decisions[i] = ("deposit", route["team"])
        else:
            decisions[i] = ("bounce", _bounce_target(cfg, entry), _build_bounce_entry(entry, reason))

    # ---- PASS 2: deposit the routeable entries in one conversation ----
    deposit_idx = [i for i, d in enumerate(decisions) if d[0] == "deposit"]
    if deposit_idx:
        consignments = [{"to": decisions[i][1], "entry": entries[i]} for i in deposit_idx]
        try:
            resp = sm.cmd_deposit(cfg, consignments)
        except sm.TransportError as exc:
            warn(f"spool {spool_file.name}: deposit transport failure ({exc}); will retry")
            for i in deposit_idx:
                decisions[i] = "retain"
            _finalize_spool(cfg, spool_file, entries, decisions)
            return True  # hard stop: transport is down, do not thrash other files
        if not resp.ok:
            warn(f"spool {spool_file.name}: deposit refused: {resp.error_code} {resp.error}; will retry")
            for i in deposit_idx:
                decisions[i] = "retain"
            _finalize_spool(cfg, spool_file, entries, decisions)
            return True

        statuses = resp.data_lines  # positional: one result line per consignment, in order
        for k, i in enumerate(deposit_idx):
            r = statuses[k] if (k < len(statuses) and isinstance(statuses[k], dict)) else None
            status = r.get("status") if r else None
            if status in ("accepted", "duplicate"):
                decisions[i] = "drop"
            else:
                # Hub rejected a well-formed consignment (E_NOGRANT / E_UNKNOWN_TEAM).
                # Do NOT retain-forever silently -- that is a third, silent outcome the
                # convention forbids. Turn it into a bounce (no-fallbacks: loud to sender).
                eo = r.get("error") if isinstance(r, dict) else None
                code = eo.get("code") if isinstance(eo, dict) else "E_REJECTED"
                detail = eo.get("detail", "") if isinstance(eo, dict) else ""
                reason = f"hub rejected deposit to '{decisions[i][1]}': {code} {detail}".strip()
                decisions[i] = ("bounce", _bounce_target(cfg, entries[i]), _build_bounce_entry(entries[i], reason))

    # ---- PASS 3: inject all bounces, BATCHED PER TARGET ----
    # inject_batch creates the inbox fresh and rejects a contested (non-drained)
    # inbox; injecting once per bounce would fail the 2nd bounce to the same
    # sender in a cycle. Group by target and inject each target's bounces in ONE
    # call (exactly how process_inbound batches multiple consignments per agent).
    by_target = {}
    for i, d in enumerate(decisions):
        if isinstance(d, tuple) and d[0] == "bounce":
            by_target.setdefault(d[1], []).append(i)
    n_bounced = 0
    for target, idxs in by_target.items():
        batch = [decisions[i][2] for i in idxs]
        try:
            sm.inject_batch(_InboxTarget(cfg, target), batch)
        except sm.InjectError as exc:
            warn(f"spool {spool_file.name}: {len(batch)} bounce(s) to {target!r} did not inject ({exc}); retry next cycle")
            for i in idxs:
                decisions[i] = "retain"
            continue
        for i in idxs:
            decisions[i] = "drop"
        n_bounced += len(batch)
        info(f"spool {spool_file.name}: BOUNCED {len(batch)} to {target!r}")

    _finalize_spool(cfg, spool_file, entries, decisions)
    return False


def _finalize_spool(cfg, spool_file, entries, decisions):
    remaining = [entries[i] for i, d in enumerate(decisions) if d == "retain"]
    if not remaining:
        spool_file.unlink(missing_ok=True)
        info(f"spool {spool_file.name}: all {len(entries)} entr(y/ies) handled (deposited/bounced); removed")
    else:
        sm._atomic_write_json(spool_file, remaining)
        info(f"spool {spool_file.name}: {len(remaining)}/{len(entries)} retained for retry")


# ---------------------------------------------------------------------------
# Cycle + container-native lifecycle
# ---------------------------------------------------------------------------
def run_cycle(cfg, ledger):
    if not resolve_inboxes(cfg):
        return
    try:
        sm.consume_outboxes_to_spool(cfg)  # reference, verbatim
        deposit_spool_routed(cfg)          # rewritten addressing
    except Exception as exc:
        err(f"outbound cycle error: {exc}")
    try:
        sm.process_inbound(cfg, ledger)    # reference, verbatim (dedup + 3 guards)
    except Exception as exc:
        err(f"inbound cycle error: {exc}")


class _Stop:
    flag = False


def _install_signal_handlers():
    def _handler(signum, frame):
        _Stop.flag = True
        info(f"signal {signum} received; stopping after this cycle")
    signal.signal(signal.SIGTERM, _handler)
    signal.signal(signal.SIGINT, _handler)


def _interruptible_sleep(seconds):
    deadline = time.time() + seconds
    while not _Stop.flag and time.time() < deadline:
        time.sleep(min(0.5, max(0.0, deadline - time.time())))


def run_loop(cfg, ledger):
    info(
        f"company-courier up: team={cfg.team!r} hub={cfg.ssh_target} "
        f"interval={cfg.poll_interval_s}s outbox={cfg.ghost_outboxes} "
        f"inbound->{cfg.target_inbox} (inbox dir re-resolved each cycle)"
    )
    while not _Stop.flag:
        run_cycle(cfg, ledger)
        _interruptible_sleep(cfg.poll_interval_s)
    info("company-courier stopped")


def do_ping(cfg):
    try:
        resp = sm.cmd_ping(cfg)
    except sm.TransportError as exc:
        err(f"ping: transport failure ({exc}) -- check hub address and key registration")
        return 2
    if not resp.ok:
        err(f"ping refused: {resp.error_code} {resp.error}")
        return 3
    ident = resp.data_lines[0] if resp.data_lines else {}
    info(
        f"ping ok: hub sees team={ident.get('team')!r} "
        f"fingerprint={ident.get('fingerprint')} protocol={ident.get('protocol')}"
    )
    return 0


def main(argv):
    global sm
    ap = argparse.ArgumentParser(description="company comms container-side courier daemon")
    ap.add_argument("--config", required=True, help="path to courier JSON config")
    ap.add_argument("--once", action="store_true", help="run a single cycle and exit")
    ap.add_argument("--ping", action="store_true", help="ping the hub and exit")
    args = ap.parse_args(argv)

    with open(args.config, "r", encoding="utf-8") as fh:
        raw = json.load(fh)

    sm = _load_reference(_resolve_reference(raw.get("reference_courier")))
    cfg = build_cfg(raw)

    # Mirror the reference validate_startup ssh_key check: a missing/misplaced
    # per-team hub key (onboarding #96) should be loud at boot, not an opaque
    # transport failure on the first cycle.
    key = getattr(cfg, "ssh_key", None)
    if key and not sm._expand(str(key)).exists():
        warn(f"ssh_key {key} does not exist -- hub auth will fail until the "
             "per-team key is provisioned and sm-register'd on the hub (#96)")

    if args.ping:
        return do_ping(cfg)

    cfg.state_dir.mkdir(parents=True, exist_ok=True)
    cfg.spool_dir.mkdir(parents=True, exist_ok=True)
    cfg.inject_tmp_dir.mkdir(parents=True, exist_ok=True)

    with _FlockGuard(cfg.lock_path):  # single instance; kernel-released on death
        ledger = sm.Ledger(cfg.ledger_path)
        ledger.compact()
        if args.once:
            run_cycle(cfg, ledger)
            return 0
        _install_signal_handlers()
        run_loop(cfg, ledger)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))