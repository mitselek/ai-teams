#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fr-courier-daemon.py -- session-scoped FR-side wrapper around the stationmaster
reference courier.

(*FR:Brunel*)

This is a WRAP, not a reimplementation. The wire behaviour, local-file disciplines,
delivered-ledger dedup, single-instance lock, and startup validation all live in the
reference courier (`stationmaster-courier.py`, Herald). We import that file by path
(its name has a hyphen, so it cannot be `import`-ed normally; importlib handles it)
and reuse its primitives verbatim. We add EXACTLY two things the reference does not do:

  GAP A -- PER-AGENT ROUTING (Task #4 req 2).
    The reference injects every collected consignment into ONE configured inbox.
    We need to wake the CORRECT idle agent: inject into inboxes/<entry.to>.json.
    The hub envelope (protocol S4) carries only from_team/to_team -- the agent-level
    recipient rides INSIDE the verbatim entry as entry["to"]. So we route on
    entry["to"] with THREE guards (team-lead-ratified 2026-06-15):
       (1) entry["to"] is present,
       (2) it passes the name-hygiene regex,
       (3) inboxes/<entry.to>.json ALREADY EXISTS.
    Guard (3) is load-bearing: we NEVER create a new inbox file. Creating one would
    wake a ghost / wrong name -- the exact failure class stationmaster exists to kill.
    If any guard fails, fall back to default_inbox (team-lead). Injection itself is
    the reference's D11 verify-empty -> rename-aside -> exclusive-create, run
    per-target.

  GAP B -- SESSION-SCOPED LIFECYCLE (Task #4 req 5).
    The reference run_loop is `while True` with no session binding and no
    drain-on-shutdown. We add:
       - immediate cycle on startup (start-on-session-start),
       - poll-on-timer (the loop),
       - drain-on-shutdown: a final outbound+inbound cycle on SIGINT/SIGTERM so
         queued outbox mail ships and any collectable inbound is delivered+acked
         before we exit,
       - clean death: the reference InstanceLock (PID + Windows tasklist staleness)
         is released in a finally/atexit so the session does NOT leave a detached
         zombie (the v2 11-instance / stale-PID-36772 failure we must not reproduce).

Dedup discipline (Task #4 req 4) is INHERITED UNCHANGED from the reference: the
delivered-ledger is keyed by hub envelope id, checked before inject, appended after
inject, and ack covers all collected ids. On restart the hub re-delivers (at-least-
once) but the ledger skips re-inject -> 1x delivery, never the v2 4x/8x burst. We add
NO second dedup mechanism; we must not perturb the one that works.

Usage:
    fr-courier-daemon.py --config fr-courier.json [--ping | --once | --drain-once]

    --ping        delegate to the reference ping (connectivity + identity), exit.
    --once        one full cycle (outbound + inbound) then exit. Dry validation.
    --drain-once  alias of --once used as the shutdown drain step; identical work,
                  named for intent in scripts/logs.
    (no flag)     session-scoped daemon: immediate cycle, then poll loop, with a
                  drain-once on SIGINT/SIGTERM.

PLATFORM NOTE on the SIGINT/SIGTERM drain-on-shutdown (verified 2026-06-15): the
signal-driven drain is the POSIX/Linux path -- there a SIGTERM is delivered and the
handler runs the final cycle + atexit releases the lock. On WINDOWS, the usual stop
(PowerShell Stop-Process == TerminateProcess) is a HARD KILL: Python receives no
signal, so neither this drain nor atexit fires on stop. On Windows the drain is
performed EXTERNALLY by stop-fr-courier.ps1 (kill -> wait-for-exit -> `--drain-once`,
whose NORMAL exit fires atexit and releases the lock). No data is lost on either
platform because the spool journals before deposit (spool-durability).

Per team-lead 2026-06-15: validate with --ping and --once FIRST, checkpoint the
build, and do NOT start the persistent loop against the live hub until told.
"""

from __future__ import annotations

import argparse
import atexit
import importlib.util
import json
import re
import signal
import sys
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Import the reference courier by path (hyphenated filename -> importlib).
# We treat it as a library of primitives; we never edit it.
# ---------------------------------------------------------------------------
_REF_PATH = Path(__file__).resolve().parent / "stationmaster-courier.py"


def _load_reference():
    if not _REF_PATH.exists():
        sys.stderr.write(
            f"FATAL: reference courier not found at {_REF_PATH}. "
            f"fr-courier-daemon wraps it; it must sit beside this file.\n"
        )
        sys.exit(2)
    spec = importlib.util.spec_from_file_location("stationmaster_courier", _REF_PATH)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


ref = _load_reference()


# ---------------------------------------------------------------------------
# GAP A -- per-agent routing
# ---------------------------------------------------------------------------
# Name hygiene: the hub's own team-name grammar (protocol S2.4) is a safe, strict
# allowlist for an inbox basename too -- it forbids path separators, "..", leading
# dots, and anything that could escape the inboxes dir. We reuse it deliberately so
# a malicious or malformed entry["to"] can never be turned into a traversal.
_NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")


def resolve_target_inbox(entry: dict, cfg: Any, default_inbox: str) -> str:
    """
    Decide which local inbox basename a collected entry should be injected into.

    Returns an inbox basename (without `.json`). Applies the three team-lead-ratified
    guards; on any failure returns default_inbox. NEVER returns a name whose
    inbox file does not already exist -- guard (3) -- so injection can only ever
    wake an already-real agent, never conjure a ghost inbox.
    """
    to = entry.get("to") if isinstance(entry, dict) else None

    # Guard (1): present and a non-empty string.
    if not isinstance(to, str) or not to:
        return default_inbox

    # Guard (2): name hygiene (no traversal, hub grammar).
    if not _NAME_RE.match(to):
        ref.warn(f"route: entry.to {to!r} fails name hygiene; falling back to {default_inbox!r}")
        return default_inbox

    # Guard (3): the target inbox file ALREADY EXISTS. We never create one.
    candidate = cfg.inboxes_dir / f"{to}.json"
    if not candidate.exists():
        ref.warn(
            f"route: inbox {to}.json does not exist (would wake a ghost name); "
            f"falling back to {default_inbox!r}"
        )
        return default_inbox

    return to


def inject_to(cfg: Any, target_inbox: str, entries: list[dict]) -> None:
    """
    Inject `entries` into inboxes/<target_inbox>.json using the reference courier's
    D11 inject_batch. inject_batch reads cfg.target_inbox internally, so we
    temporarily point it at the resolved target -- the reference is single-threaded
    per direction (process_inbound calls us one consignment at a time), so this
    swap is never concurrent.
    """
    saved = cfg.target_inbox
    cfg.target_inbox = target_inbox
    try:
        ref.inject_batch(cfg, entries)
    finally:
        cfg.target_inbox = saved


def process_inbound_routed(cfg: Any, ledger: Any, default_inbox: str) -> None:
    """
    FR variant of the reference process_inbound: identical collect -> dedup ->
    inject -> ack choreography and identical crash-safety ordering (inject FIRST,
    ledger SECOND, ack ALL collected) -- the ONLY change is that the inject target
    is resolved per-entry by resolve_target_inbox instead of being the single
    configured inbox. Everything else is copied from the reference so the dedup
    contract is preserved bit-for-bit.
    """
    try:
        resp = ref.cmd_collect(cfg)
    except ref.TransportError as exc:
        ref.warn(f"collect: transport failure ({exc}); retry next cycle")
        return

    if not resp.ok:
        ref.warn(f"collect refused: {resp.error_code} {resp.error}; retry next cycle")
        return

    consignments = resp.data_lines
    if not consignments:
        return

    collected_ids: list[str] = []
    for c in consignments:
        if not isinstance(c, dict) or "id" not in c or "entry" not in c:
            ref.warn(f"collect: skipping malformed consignment: {c!r}")
            continue
        env_id = c["id"]
        collected_ids.append(env_id)

        # Dedup BEFORE inject (inherited contract). Already-delivered -> skip inject,
        # still re-ack below (a re-ack repays a lost ack; cost none).
        if ledger.contains(env_id):
            continue

        from_team = c.get("from_team")
        if not from_team:
            ref.warn(f"collect: consignment {env_id} missing from_team; not injecting, not acking")
            collected_ids.remove(env_id)
            continue

        # Attribution rewrite (reference duty): from <- <from_team>-ghost; body verbatim.
        injected = ref.rewrite_attribution(c["entry"], from_team)

        # GAP A: resolve the per-agent target from the verbatim entry, with the
        # three guards. We route on the ORIGINAL entry's `to` (the recipient the
        # remote sender addressed), not the rewritten copy -- rewrite only touches
        # `from`, so c["entry"]["to"] == injected["to"], but we read the source of
        # truth explicitly.
        target_inbox = resolve_target_inbox(c["entry"], cfg, default_inbox)

        try:
            inject_to(cfg, target_inbox, [injected])
        except ref.InjectError as exc:
            ref.err(f"inject failed for {env_id} -> {target_inbox}: {exc}; will NOT ack -- hub redelivers")
            collected_ids.remove(env_id)
            continue

        ledger.append(env_id)
        ref.info(f"inbound: injected {env_id} -> {target_inbox}.json")

    if not collected_ids:
        return

    try:
        ack_resp = ref.cmd_ack(cfg, collected_ids)
    except ref.TransportError as exc:
        ref.warn(f"ack: transport failure ({exc}); hub retains, re-ack next cycle")
        return
    if not ack_resp.ok:
        ref.warn(f"ack refused: {ack_resp.error_code} {ack_resp.error}; re-ack next cycle")
        return
    ref.info(f"inbound: injected+acked {len(collected_ids)} consignment(s)")


# ---------------------------------------------------------------------------
# GAP B -- session-scoped lifecycle
# ---------------------------------------------------------------------------

class FRConfig:
    """Thin extension: the reference Config plus default_inbox (Gap A fallback)."""

    def __init__(self, raw: dict) -> None:
        self.ref_cfg = ref.Config(raw)
        # Fallback inbox when per-agent routing's guards don't fire. Defaults to the
        # reference's target_inbox so an existing reference config Just Works.
        self.default_inbox: str = raw.get("default_inbox", self.ref_cfg.target_inbox)


def run_cycle(cfg: Any, ledger: Any, default_inbox: str) -> None:
    """
    One full FR cycle: outbound (reference, unchanged) then inbound (routed).
    Order matches the reference (outbound first, FIFO single-threaded per direction).
    Each half is guarded so one bad cycle never kills the loop.
    """
    try:
        ref.consume_outboxes_to_spool(cfg)
        ref.deposit_spool(cfg)
    except Exception as exc:  # noqa: BLE001 -- never let one cycle kill the daemon
        ref.err(f"outbound cycle error: {exc}")
    try:
        process_inbound_routed(cfg, ledger, default_inbox)
    except Exception as exc:  # noqa: BLE001
        ref.err(f"inbound cycle error: {exc}")


class _Shutdown(Exception):
    """Raised by the signal handler to break the loop and trigger the drain."""


def _install_signal_handlers() -> None:
    def _handler(signum, _frame):
        ref.info(f"signal {signum} received -- draining then exiting")
        raise _Shutdown()

    signal.signal(signal.SIGINT, _handler)
    signal.signal(signal.SIGTERM, _handler)


def run_session_daemon(cfg: Any, ledger: Any, default_inbox: str) -> None:
    """
    Session-scoped daemon:
      1. immediate cycle on startup (start-on-session-start),
      2. poll-on-timer loop,
      3. drain-on-shutdown: one final cycle on SIGINT/SIGTERM,
      4. lock release is handled by the caller's `with InstanceLock` / atexit.
    """
    _install_signal_handlers()
    ref.info(
        f"FR session courier up: team={cfg.team} target={cfg.ssh_target} "
        f"interval={cfg.poll_interval_s}s outboxes={cfg.ghost_outboxes} "
        f"default_inbox={default_inbox} (per-agent routing on entry.to)"
    )
    # (1) immediate cycle so a freshly-started session collects without waiting a tick.
    run_cycle(cfg, ledger, default_inbox)
    try:
        # (2) poll loop.
        import time
        while True:
            time.sleep(cfg.poll_interval_s)
            run_cycle(cfg, ledger, default_inbox)
    except (_Shutdown, KeyboardInterrupt):
        # (3) drain-on-shutdown: a final cycle so queued outbound ships and any
        # last inbound is delivered+acked before we let go of the session.
        ref.info("drain-on-shutdown: final cycle")
        run_cycle(cfg, ledger, default_inbox)
        ref.info("FR session courier stopped cleanly")


# ---------------------------------------------------------------------------
# ENTRY POINT
# ---------------------------------------------------------------------------

def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="session-scoped FR stationmaster courier (wraps the reference)")
    ap.add_argument("--config", required=True, help="path to FR courier JSON config")
    mode = ap.add_mutually_exclusive_group()
    mode.add_argument("--ping", action="store_true", help="ping the hub and exit (delegates to reference)")
    mode.add_argument("--once", action="store_true", help="run one full cycle and exit (dry validation)")
    mode.add_argument("--drain-once", action="store_true", help="alias of --once, named for shutdown drain")
    args = ap.parse_args(argv)

    # The reference load_config returns a built Config; we need the raw dict so
    # FRConfig can read both the reference fields and our default_inbox extension.
    with open(args.config, "r", encoding="utf-8") as fh:
        raw_cfg = json.load(fh)
    fr_cfg = FRConfig(raw_cfg)
    cfg = fr_cfg.ref_cfg
    default_inbox = fr_cfg.default_inbox

    # --ping needs no lock and no local-file work; delegate verbatim.
    if args.ping:
        return ref.do_ping(cfg)

    ref.validate_startup(cfg)

    lock = ref.InstanceLock(cfg.lock_path)
    lock.acquire()
    # Clean death: release the lock on ANY exit path, so the session never leaves a
    # held lock / detached zombie (the v2 / stale-PID-36772 failure).
    atexit.register(lock.release)
    try:
        ledger = ref.Ledger(cfg.ledger_path)
        ledger.compact()  # reference startup discipline

        if args.once or args.drain_once:
            run_cycle(cfg, ledger, default_inbox)
            return 0

        run_session_daemon(cfg, ledger, default_inbox)
        return 0
    finally:
        lock.release()


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
