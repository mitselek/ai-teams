#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
stationmaster-courier.py -- reference courier for the stationmaster mail network.

(*FR:Herald*)

A courier is the customer-side process that moves mail between local Claude Code
team inboxes and the stationmaster hub. It is a PATTERN, not a product
(stationmaster-protocol.md S1): any implementation honoring the wire contract is a
citizen. This file is the reference implementation -- single file, Python stdlib
only, run as-is or read side-by-side with the courier hints.

Authority split:
  - WIRE behaviour  -> stationmaster-protocol.md v1.0.0 (cited as "protocol Sx.y")
  - LOCAL file rules -> stationmaster-courier-hints.md  (cited as "hints Sx", the
    PRIMARY doc for this file; section-numbered comments below map to its sections)
  - SUBSTRATE facts  -> TRUTHS.md (cited as T-numbers / S-numbers via the hints
    substrate table, hints S2)

THE ONE RULE everything descends from (hints, masthead): never modify a
harness-watched inbox file in place. Outbound consumes by atomic rename; inbound
injects by verify-empty -> rename-aside -> exclusive-create. Neither path ever
opens a watched inbox for writing.

Transport: outbound ssh only (protocol S2 assumed capability). Each hub exchange
is ONE conversation over ONE `ssh -T` connection -- a pure authenticated byte
pipe: request conversation on stdin, response conversation on stdout, connect /
exchange / hang up (protocol S3.1). The team name is NEVER sent by the client;
it reaches the hub via the forced-command argument bound to the key (protocol
S2.2 -- "the channel is the identity").

Usage:
    stationmaster-courier.py --config courier.json [--once] [--ping]

See build_default_config_help() / the CONFIG section for the config shape.
"""

from __future__ import annotations

import argparse
import errno
import hashlib  # noqa: F401  (kept available for optional local-id debug; hub owns id)
import json
import os
import re
import subprocess
import sys
import time
import uuid
from pathlib import Path

# Protocol entry timestamp format: ISO YYYY-MM-DDTHH:MM:SSZ (NOT _utc_stamp()'s
# filename form). Used at delivery to validate/normalize the inbox entry timestamp.
_TS_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")


# ===========================================================================
# CONFIG
# ===========================================================================
# The courier needs to know: who it is locally, where the hub is, which local
# files are the ghost outbox(es) and target inbox, and where its private state
# (spool + ledger) lives.
#
# Config is a JSON file:
#   {
#     "team":            "framework-research",   # our team name (hub knows it via key; this is for logging/sanity)
#     "ssh_target":      "sm@hub.example",       # protocol S3.1: sm@<hub>
#     "ssh_key":         "~/.ssh/sm_myteam",     # private key, never leaves host (onboarding S1)
#     "ssh_opts":        ["-o", "BatchMode=yes"],# optional extra ssh args
#     "inboxes_dir":     "~/.claude/teams/framework-research/inboxes",
#     "ghost_outboxes":  ["hr-devs-courier"],    # session-less names our agents SendMessage to (hints S1; -bridge accepted for backwards-compat)
#     "target_inbox":    "team-lead",            # live member inbox we inject into (hints S1)
#     "state_dir":       "~/.stationmaster/framework-research",  # spool + ledger live here
#     "poll_interval_s": 30,                      # hints S8 [CONV] 5-60s
#     "collect_limit":   100                      # protocol S5.3 default 100
#   }
#
# CRITICAL placement rule (hints S3, "Spool placement"): the state_dir MUST be on
# the SAME filesystem/volume as inboxes_dir -- rename() atomicity is per-volume.
# Validated at startup; the courier refuses to run otherwise.

PROTOCOL_MAJOR = 1  # protocol S3: the major version this client speaks


class Config:
    def __init__(self, raw: dict) -> None:
        # `team` is cosmetic (logging/sanity only). Required when inboxes_dir is an explicit
        # path; OPTIONAL when inboxes_dir="auto" (the discovered session-<id> fills it for log
        # fidelity -- see the inboxes_dir block below). Default "" keeps the field always set.
        self.team: str = raw.get("team", "")
        self.ssh_target: str = raw["ssh_target"]
        self.ssh_key: str = os.path.expanduser(raw["ssh_key"])
        self.ssh_opts: list[str] = list(raw.get("ssh_opts", []))
        # Path.home() / %USERPROFILE%, NOT $HOME -- Git Bash $HOME-empty gotcha (hints S8).
        # inboxes_dir resolution (WS1 #86): an explicit path is honored verbatim (the 2.1.177
        # form, e.g. ~/.claude/teams/framework-research/inboxes -- this is ALSO the rollback).
        # The sentinel "auto" runtime-DISCOVERS the live session-<id> team dir on 2.1.178+
        # (team dir is random per session; hardcoded name breaks -- probe P1). Discovery is the
        # detached-courier vantage (no session pid -> glob .name + process-liveness filter);
        # the FR_COURIER_* override family disambiguates a multi-dir host (one convention for
        # the courier AND the lifecycle scripts -- Aen 2026-06-18):
        #   FR_COURIER_SESSION_PID       -> pid tiebreaker (post-unpin session-<id> dirs)
        #   FR_COURIER_TEAM_DIR_NAME     -> explicit dir override (the 2.1.177 named-host bridge)
        # Discovery only fires for "auto"; the pinned-2.1.177 explicit-path config is untouched.
        _raw_inboxes = raw["inboxes_dir"]
        if _raw_inboxes == "auto":
            _claude_home = _expand(raw.get("claude_home", "~/.claude"))
            _pid_env = os.environ.get("FR_COURIER_SESSION_PID")
            _team_dir = resolve_team_dir(
                _claude_home,
                session_pid=int(_pid_env) if _pid_env and _pid_env.isdigit() else None,
                # config primary, env fallback: a deliberately-set config value wins; a
                # null/absent config falls to the FR_COURIER_TEAM_DIR_NAME env (an ambient
                # env must not silently override a persisted config field).
                explicit_dir_name=raw.get("team_dir_name") or os.environ.get("FR_COURIER_TEAM_DIR_NAME"),
            )
            self.inboxes_dir: Path = _team_dir / "inboxes"
            if not raw.get("team"):
                self.team = _team_dir.name  # log fidelity: report the discovered session-<id>
        else:
            self.inboxes_dir = _expand(_raw_inboxes)
        self.ghost_outboxes: list[str] = list(raw["ghost_outboxes"])
        self.target_inbox: str = raw["target_inbox"]
        self.state_dir: Path = _expand(raw["state_dir"])
        self.poll_interval_s: float = float(raw.get("poll_interval_s", 30))
        self.collect_limit: int = int(raw.get("collect_limit", 100))

    @property
    def spool_dir(self) -> Path:
        return self.state_dir / "spool"

    @property
    def ledger_path(self) -> Path:
        return self.state_dir / "delivered-ledger.jsonl"

    @property
    def inject_tmp_dir(self) -> Path:
        # rename-aside scratch (hints S4 step 2) -- on the same volume as inboxes.
        return self.state_dir / "inject-tmp"

    @property
    def lock_path(self) -> Path:
        return self.state_dir / "courier.lock"


def _expand(p: str) -> Path:
    # Resolve ~ via Path.home() rather than relying on $HOME (hints S8 Git-Bash gotcha).
    if p.startswith("~"):
        return Path.home() / p.lstrip("~/\\")
    return Path(os.path.expandvars(p)).expanduser()


def load_config(path: str) -> Config:
    with open(path, "r", encoding="utf-8") as fh:
        return Config(json.load(fh))


# ===========================================================================
# LOGGING
# ===========================================================================
# Plain stderr; a courier is a daemon-ish loop, keep it greppable.

def log(level: str, msg: str) -> None:
    ts = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    print(f"{ts} {level:5s} {msg}", file=sys.stderr, flush=True)


def info(msg: str) -> None:
    log("INFO", msg)


def warn(msg: str) -> None:
    log("WARN", msg)


def err(msg: str) -> None:
    log("ERROR", msg)


# ===========================================================================
# TRANSPORT  (protocol S3, S3.1)
# ===========================================================================
# One conversation per connection. A conversation is:
#     request:  envelope line + 0..N body lines   (NDJSON)
#     response: envelope line + 0..N data lines    (NDJSON)
#
# Golden rule (onboarding S6, protocol S3): got a response envelope -> believe it.
# No envelope (transport failure) -> nothing is assumed to have happened; the
# caller retries the SAME conversation safely (every command is idempotent or
# retry-safe by construction, protocol S5).


class TransportError(Exception):
    """No response envelope arrived -- transport failure, nothing happened."""


class HubResponse:
    """Parsed hub response: the envelope line plus any trailing data lines."""

    def __init__(self, envelope: dict, data_lines: list[dict]) -> None:
        self.envelope = envelope
        self.data_lines = data_lines

    @property
    def ok(self) -> bool:
        return bool(self.envelope.get("ok"))

    @property
    def error(self) -> dict | None:
        return self.envelope.get("error")

    @property
    def error_code(self) -> str | None:
        e = self.error
        return e.get("code") if e else None


def converse(cfg: Config, request_lines: list[str], timeout_s: float = 60.0) -> HubResponse:
    """
    Run one stationmaster conversation over one `ssh -T` connection.

    request_lines: the already-serialized NDJSON lines to send (envelope first,
                   then any body lines). Each must be a single line, no newline.

    Returns HubResponse on a well-formed reply (envelope present, ok true OR false).
    Raises TransportError when no parseable envelope comes back -- the caller MUST
    treat that as "nothing happened" and may safely retry (protocol S3).
    """
    # protocol S3.1: `ssh -T -i <team_key> sm@<hub>` -- the forced command on the
    # hub runs sm-shell regardless of what we request, so we request nothing; the
    # conversation rides stdin/stdout. -T disables pty (we send raw NDJSON).
    cmd = ["ssh", "-T", "-i", cfg.ssh_key, *cfg.ssh_opts, cfg.ssh_target]
    payload = "".join(line + "\n" for line in request_lines)

    try:
        proc = subprocess.run(
            cmd,
            input=payload.encode("utf-8"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout_s,
        )
    except subprocess.TimeoutExpired as exc:
        raise TransportError(f"ssh timed out after {timeout_s}s") from exc
    except OSError as exc:
        raise TransportError(f"ssh failed to launch: {exc}") from exc

    out = proc.stdout.decode("utf-8", errors="replace").strip()
    if not out:
        # No output at all = transport problem (onboarding troubleshooting table).
        # ssh's own diagnostics (Permission denied, connection refused) land on
        # stderr; surface them so a key/registration problem is debuggable.
        stderr_tail = proc.stderr.decode("utf-8", errors="replace").strip()
        raise TransportError(
            f"no response envelope (ssh rc={proc.returncode}); stderr: {stderr_tail or '<empty>'}"
        )

    lines = [ln for ln in out.splitlines() if ln.strip()]
    try:
        envelope = json.loads(lines[0])
    except (IndexError, json.JSONDecodeError) as exc:
        # We got bytes but no parseable envelope -> treat as transport failure,
        # NOT as a hub error (protocol S3: "a received response envelope is
        # authoritative"; an unparseable first line is no envelope at all).
        raise TransportError(f"first response line is not a JSON envelope: {exc}") from exc

    data_lines: list[dict] = []
    for ln in lines[1:]:
        try:
            data_lines.append(json.loads(ln))
        except json.JSONDecodeError:
            # A malformed data line within an otherwise-valid envelope: log and
            # drop it. The envelope is authoritative for ok/err; per-line results
            # we can't parse are reported by their absence to the caller.
            warn(f"dropping unparseable data line: {ln!r}")
    return HubResponse(envelope, data_lines)


def make_envelope(cmd: str, args: dict | None = None) -> str:
    # protocol S3 request envelope: {"v":1, "cmd":..., "args":{...}}
    env: dict = {"v": PROTOCOL_MAJOR, "cmd": cmd}
    if args:
        env["args"] = args
    return json.dumps(env, separators=(",", ":"), ensure_ascii=False)


# ---- Command wrappers (protocol S5) ---------------------------------------
# Each returns a HubResponse; transport failure raises TransportError upward so
# the loop can retry the same conversation next cycle (protocol S3).


def cmd_ping(cfg: Config) -> HubResponse:
    # protocol S5.1: connectivity + identity. Data line: {team, fingerprint, protocol}.
    return converse(cfg, [make_envelope("ping")])


def cmd_collect(cfg: Config) -> HubResponse:
    # protocol S5.3: fetch waiting inbound mail. DOES NOT DELETE. Repeated collect
    # without ack returns the same entries -- the at-least-once half of two-phase.
    return converse(cfg, [make_envelope("collect", {"limit": cfg.collect_limit})])


def cmd_ack(cfg: Config, ids: list[str]) -> HubResponse:
    # protocol S5.4: confirm + delete. Idempotent: unknown/already-acked ->
    # "already_gone". A re-ack repays a lost ack (hints S6).
    return converse(cfg, [make_envelope("ack", {"ids": ids})])


def cmd_deposit(cfg: Config, consignments: list[dict]) -> HubResponse:
    # protocol S5.2: push outbound. Envelope line + one consignment body line each.
    lines = [make_envelope("deposit")]
    for c in consignments:
        lines.append(json.dumps(c, separators=(",", ":"), ensure_ascii=False))
    return converse(cfg, lines)


# ===========================================================================
# DELIVERED-LEDGER  (hints S5)
# ===========================================================================
# Inbound dedup is OUR job: the hub redelivers anything uncollected or unacked
# (at-least-once, by design). The ledger is append-only JSONL keyed by the HUB
# ENVELOPE `id` -- never recomputed locally (we rewrite `from`, so local content
# differs from what the hub hashed; hints S5).
#
# Check before inject; append AFTER inject (hints S5, S6 -- inject-before-ledger
# ordering, see process_inbound()).


class Ledger:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._seen: set[str] = set()
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            return
        with open(self.path, "r", encoding="utf-8") as fh:
            for ln in fh:
                ln = ln.strip()
                if not ln:
                    continue
                try:
                    rec = json.loads(ln)
                    self._seen.add(rec["id"])
                except (json.JSONDecodeError, KeyError):
                    # Tolerate a torn last line from a crash mid-append; the worst
                    # case is one re-inject (the accepted at-least-once cost, hints S6).
                    warn(f"ledger: skipping malformed line: {ln!r}")

    def contains(self, envelope_id: str) -> bool:
        return envelope_id in self._seen

    def append(self, envelope_id: str) -> None:
        # Append AFTER a durable inject (hints S6). Flush + fsync so a crash right
        # after this line does not lose the dedup record (would cause a duplicate,
        # not a loss -- but we minimize even that).
        rec = {"id": envelope_id, "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
        with open(self.path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec, separators=(",", ":")) + "\n")
            fh.flush()
            os.fsync(fh.fileno())
        self._seen.add(envelope_id)

    def compact(self, retain_days: int = 7, retain_max: int = 10_000) -> None:
        # hints S5: compact at startup; retention 7 days OR 10k IDs, whichever
        # trims first [CONV]. The redelivery window is only collect-to-ack, so this
        # is generous -- we never trim an id that could still be redelivered.
        if not self.path.exists():
            return
        cutoff = time.time() - retain_days * 86400
        kept: list[dict] = []
        with open(self.path, "r", encoding="utf-8") as fh:
            for ln in fh:
                ln = ln.strip()
                if not ln:
                    continue
                try:
                    rec = json.loads(ln)
                    rec_ts = time.mktime(time.strptime(rec["ts"], "%Y-%m-%dT%H:%M:%SZ"))
                except (json.JSONDecodeError, KeyError, ValueError):
                    continue
                if rec_ts >= cutoff:
                    kept.append(rec)
        # whichever trims first: cap by count, keeping the most recent.
        if len(kept) > retain_max:
            kept = kept[-retain_max:]
        # Rewrite the ledger atomically via a private temp + rename (the ledger is
        # courier-private, so in-place rewrite would be allowed -- hints S3 -- but
        # atomic-replace protects against a crash mid-compaction).
        tmp = self.path.with_suffix(".jsonl.tmp")
        with open(tmp, "w", encoding="utf-8") as fh:
            for rec in kept:
                fh.write(json.dumps(rec, separators=(",", ":")) + "\n")
            fh.flush()
            os.fsync(fh.fileno())
        os.replace(tmp, self.path)
        self._seen = {rec["id"] for rec in kept}


# ===========================================================================
# OUTBOUND  (hints S3 -- SPEC-v3 D1, verified by Test #5)
# ===========================================================================
# local ghost outbox --rename--> local spool --deposit--> hub
#
# The ghost outbox is an inbox file for a session-less name (hints S1): our agents
# SendMessage to that name, nothing drains it, entries accumulate (S1/T3.a). It is
# our team's outgoing mail slot. We NEVER write that watched path -- not even to
# truncate; we consume it by atomic rename into our private spool.


def consume_outboxes_to_spool(cfg: Config) -> int:
    """
    hints S3 steps 1-4: for each ghost outbox, poll by content, parse-before-consume,
    consume = atomic rename of the WHOLE outbox file into the spool. Returns the
    number of outbox files rolled into the spool this cycle.
    """
    rolled = 0
    cfg.spool_dir.mkdir(parents=True, exist_ok=True)
    for name in cfg.ghost_outboxes:
        outbox = cfg.inboxes_dir / f"{name}.json"

        # S3.1: poll by CONTENT (S5: mtime lies). Absent file = empty outbox,
        # normal (S2: inbox files are auto-created on first dispatch; absence is legitimate).
        if not outbox.exists():
            continue
        try:
            raw = outbox.read_text(encoding="utf-8")
        except OSError as exc:
            # Windows sharing violation on read -> skip this cycle, retry next (S3.4 spirit).
            warn(f"outbox {name}: read failed ({exc}); retry next cycle")
            continue

        # S3.2: parse before consuming. Parse failure = likely mid-write (S4:
        # enqueue lag is variable 0.5-9s) -> skip this cycle, retry next.
        try:
            entries = json.loads(raw)
        except json.JSONDecodeError:
            warn(f"outbox {name}: parse failed (likely mid-write); skip, retry next")
            continue
        if not isinstance(entries, list) or len(entries) == 0:
            # Empty outbox ([]), normal steady state. Do NOT write the path to
            # "clean up" -- the in-place ban (hints S7) covers truncation too.
            continue

        # S3.3: consume = atomic rename() of the whole outbox file into the spool.
        # Never write the watched path. The harness recreates it fresh on the next
        # enqueue, no error, no resurrection (T5.a). The residual unprovable race
        # (harness read-modify-write straddling the rename) is absorbed by the
        # hub's dedup-by-id (S3 closing note).
        seq = uuid.uuid4().hex[:8]
        spool_file = cfg.spool_dir / f"{_utc_stamp()}-{seq}.json"
        try:
            os.rename(outbox, spool_file)
        except OSError as exc:
            # S3.4: rename failure (Windows sharing violation) = safe no-op; retry next poll.
            warn(f"outbox {name}: rename failed ({exc}); safe no-op, retry next poll")
            continue
        info(f"outbox {name}: consumed {len(entries)} entr{'y' if len(entries) == 1 else 'ies'} -> {spool_file.name}")
        rolled += 1
    return rolled


def deposit_spool(cfg: Config) -> None:
    """
    hints S3 steps 5-6: spool is the crash journal. Wrap each spooled entry as a
    consignment, deposit, delete the spool file on accepted OR duplicate (both mean
    the hub has it -- protocol S5.2). FIFO: oldest-first, preserve array order
    within a file, single-threaded per direction (hints S3.6 -- deposit order =
    delivery order, protocol S7, only if we don't reorder).
    """
    if not cfg.spool_dir.exists():
        return
    spool_files = sorted(cfg.spool_dir.glob("*.json"))  # oldest-first by utc-stamped name
    for spool_file in spool_files:
        try:
            entries = json.loads(spool_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            warn(f"spool {spool_file.name}: unreadable ({exc}); leaving in place for inspection")
            continue
        if not isinstance(entries, list):
            warn(f"spool {spool_file.name}: not a JSON array; leaving in place")
            continue
        if not entries:
            # Empty spool file (shouldn't happen -- we only spool non-empty outboxes);
            # safe to remove.
            spool_file.unlink(missing_ok=True)
            continue

        # protocol S4: a consignment wraps one harness inbox entry VERBATIM.
        # entry is forwarded untouched (protocol S4 / SPEC-v3 D9 -- no body
        # rewriting, no prefixes). The recipient is the same for all entries in a
        # ghost outbox if the ghost name encodes one target; but a ghost outbox is
        # generic, so the destination team is a courier-config concern. Here we map
        # the ghost outbox -> recipient via convention: the entries themselves do
        # NOT carry routing (the harness entry has no `to_team`); the ghost name is
        # the route. We pass the recipient through the consignment `to` field.
        #
        # NOTE (protocol ambiguity surfaced to team-lead, NOT resolved here): the
        # docs specify consignment = {"to": <team>, "entry": {...}} but do not
        # specify how a generic ghost outbox names its destination team. This
        # reference maps one ghost-outbox name -> one destination team via the
        # `<name>-courier` -> `<name>` convention (hints S1; `-bridge` accepted for
        # backwards-compat -- see _outbox_to_team). If a ghost outbox must fan out
        # to multiple teams, that is a routing extension the protocol does not yet
        # define.
        to_team = _outbox_to_team(spool_file, cfg)
        if to_team is None:
            warn(f"spool {spool_file.name}: cannot derive destination team; leaving for inspection")
            continue

        consignments = [{"to": to_team, "entry": entry} for entry in entries]

        try:
            resp = cmd_deposit(cfg, consignments)
        except TransportError as exc:
            # protocol S3: no envelope -> nothing happened. Leave the spool file;
            # redeposit next cycle (deposit is retry-safe; duplicate-by-id on the
            # hub absorbs any partial delivery). hints S6 row 1/2: cost none.
            warn(f"spool {spool_file.name}: deposit transport failure ({exc}); will retry")
            return  # stop the cycle; preserve FIFO -- do not skip ahead past a stuck file

        if not resp.ok:
            # Conversation-level error (envelope ok:false). E.g. E_VERSION (our v
            # unsupported -- protocol S8), E_MALFORMED, E_INTERNAL. These are not
            # per-consignment; the whole deposit failed. Do NOT delete the spool;
            # surface and retry. E_NOGRANT/E_UNKNOWN_TEAM arrive PER-CONSIGNMENT
            # (status rejected), not at the envelope level (protocol S5.2).
            warn(f"spool {spool_file.name}: deposit refused: {resp.error_code} {resp.error}; will retry")
            return

        # Per-consignment results (protocol S5.2): accepted | duplicate | rejected.
        results = {r.get("id"): r for r in resp.data_lines if isinstance(r, dict)}
        statuses = [r.get("status") for r in resp.data_lines]
        n = len(consignments)
        n_ok = sum(1 for s in statuses if s in ("accepted", "duplicate"))
        n_rej = sum(1 for s in statuses if s == "rejected")

        if n_rej:
            # rejected (E_NOGRANT: recipient hasn't granted us; E_UNKNOWN_TEAM:
            # not registered) -- protocol S5.2. We MUST NOT drop or expire mail on
            # our own initiative (hints S7: no TTL anywhere). A rejected consignment
            # stays in the spool so it ships once the grant lands. We can only make
            # forward progress when ALL consignments in the file succeed; partial
            # success on a multi-entry file is handled below.
            rejected = [r for r in resp.data_lines if r.get("status") == "rejected"]
            warn(
                f"spool {spool_file.name}: {n_rej}/{n} rejected "
                f"(e.g. {rejected[0].get('error')}); retaining rejected, retry next cycle"
            )

        if n_ok == n:
            # All accepted/duplicate -> the hub has the whole file. Delete the
            # spool entry (hints S3.5).
            spool_file.unlink(missing_ok=True)
            info(f"spool {spool_file.name}: deposited {n}/{n} (accepted/duplicate); removed")
        else:
            # Partial: some accepted, some rejected. Rewrite the spool file to
            # retain ONLY the consignments not yet accepted, so accepted ones are
            # not redeposited forever and rejected ones survive for a later grant.
            # The spool is courier-private -> in-place rewrite is permitted
            # (hints S3.5: the in-place ban applies only to harness-contested files).
            # Atomic-replace anyway, to survive a crash mid-rewrite.
            remaining = [
                consignments[i]["entry"]
                for i, r in enumerate(resp.data_lines[: len(consignments)])
                if (r.get("status") if isinstance(r, dict) else None) not in ("accepted", "duplicate")
            ]
            _atomic_write_json(spool_file, remaining)
            info(
                f"spool {spool_file.name}: deposited {n_ok}/{n}; {len(remaining)} retained "
                f"(rejected -- awaiting grant), will retry"
            )
            # Stop after a partial: keep FIFO and avoid hammering the hub when a
            # grant is missing. Next cycle re-attempts the retained entries.
            return


# ===========================================================================
# INBOUND  (hints S4 -- SPEC-v3 D11, verified by Test #6)
# ===========================================================================
# hub --collect--> inject into local target inbox --ack--> hub deletes
#
# Injecting into a LIVE, CONTESTED inbox (usually team-lead). Blind overwrite
# erases native entries; read-modify-write resurrects drained ones or loses a
# concurrent native enqueue (hints S7). The verified sequence (hints S4):
#   1. poll until target path is absent or []  (steady state of a live inbox, S3)
#   2. if an empty file exists, rename it ASIDE first; if it gained native entries
#      in the race window, the rename captures them losslessly -- prepend them to
#      the inject batch (ride-along delivery, T6.b)
#   3. exclusive-create (O_CREAT|O_EXCL / 'x') the path with the batch; atomic,
#      cannot clobber a harness-recreated file (T6.a). On failure: harness got
#      there first -> loop to 1 and merge.


class InjectError(Exception):
    """Could not durably inject after the bounded retry budget."""


def _read_inbox_entries(path: Path) -> list | None:
    """Read + parse a watched inbox WITHOUT writing it. Returns the parsed list,
    or None if absent / unparseable (mid-write)."""
    if not path.exists():
        return None
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError:
        return None  # sharing violation; treat as "not readable right now"
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return None  # mid-write; caller retries
    return data if isinstance(data, list) else None


def inject_batch(cfg: Config, batch_entries: list[dict], max_rounds: int = 50) -> None:
    """
    hints S4: deliver a batch of (already attribution-rewritten) entries into the
    live target inbox using verify-empty -> rename-aside -> exclusive-create.

    A multi-entry batch delivers as separate messages, in batch order (T6.b).

    The loop terminates fast: harness writes per file are seconds-apart events;
    our window is sub-second (hints S4.4). max_rounds is a safety bound, not the
    expected path.
    """
    target = cfg.inboxes_dir / f"{cfg.target_inbox}.json"
    cfg.inject_tmp_dir.mkdir(parents=True, exist_ok=True)

    for _round in range(max_rounds):
        # S4.1: poll until absent or [] -- the steady state of a live inbox.
        current = _read_inbox_entries(target)

        ride_along: list = []
        if target.exists():
            if current is None:
                # Unparseable right now (mid-write) -> wait a beat, retry. Do NOT
                # touch the file.
                time.sleep(0.1)
                continue
            if len(current) == 0:
                # S4.2: an empty file exists -> rename it aside first. If it gained
                # native entries in the race window between our read and the rename,
                # the rename captures them losslessly. We re-read the ASIDE copy
                # (now uncontested -- the harness recreates at the original path) to
                # recover any ride-along entries.
                aside = cfg.inject_tmp_dir / f"aside-{_utc_stamp()}-{uuid.uuid4().hex[:8]}.json"
                try:
                    os.rename(target, aside)
                except OSError:
                    # Harness recreated/rewrote it between our read and rename, or a
                    # sharing violation. Loop and re-evaluate (S4.3 failure -> loop to 1).
                    time.sleep(0.05)
                    continue
                aside_entries = _read_inbox_entries(aside) or []
                if aside_entries:
                    # Ride-along native entries (T6.b): prepend them so we deliver
                    # them losslessly. We do NOT rewrite their attribution -- they
                    # are NATIVE local entries, not hub mail.
                    ride_along = aside_entries
                    info(f"inject: captured {len(ride_along)} native ride-along entr(y/ies) during rename-aside")
                # We have moved the empty (or race-won) file aside; the path is now
                # free for an exclusive-create. Discard the aside copy after reading.
                aside.unlink(missing_ok=True)
            else:
                # Non-empty live inbox: native entries are present and the harness
                # has NOT yet drained them. We must NOT clobber them. Wait for the
                # harness to drain (S3: delivered entries are removed ~0.8s), then
                # retry. This is the contested-but-occupied case S4.1 waits out.
                time.sleep(0.2)
                continue

        # S4.3: exclusive-create the path with the batch (ride-along first, then
        # our hub mail, preserving batch order). O_CREAT|O_EXCL is atomic; it
        # cannot clobber a file the harness recreated in the gap.
        payload = ride_along + batch_entries
        try:
            _exclusive_create_json(target, payload)
        except FileExistsError:
            # Harness got there first (recreated the inbox in the gap). Loop to 1
            # and merge (S4.3). The ride-along we captured is already removed from
            # disk (we unlinked the aside); to avoid losing it, re-stage it into the
            # next round's batch_entries-equivalent by folding into batch_entries.
            if ride_along:
                batch_entries = ride_along + batch_entries
                ride_along = []
            time.sleep(0.05)
            continue
        # Success: the batch is durably written into the target inbox.
        return

    raise InjectError(
        f"inject: exhausted {max_rounds} rounds against contested inbox {target.name}; "
        f"did NOT write -- will NOT ack (custody not transferred)"
    )


def rewrite_attribution(entry: dict, from_team: str) -> dict:
    """
    hints S4 attribution duty (protocol S4): derive the injected `from` from the
    hub envelope's from_team -- cross-team convention `<from_team>-courier`. NEVER
    trust a team identity claimed inside entry (spoofable -- T4.b). Rewrite ONLY
    `from`; body (`text`/`summary`) stays verbatim.

    Delivery-metadata guarantee (surfacing gate, empirically established 2026-07-15):
    the live Claude harness surfaces an inbox entry only if it carries an unread
    marker (`read: False`) AND a well-formed `timestamp`; entries lacking either are
    drained but never surfaced. Real SendMessage-originated entries already carry
    both; hub-mail arriving here may not. We guarantee them so surfacing never depends
    on sender hygiene. `read`/`timestamp` are canonical-entry ENVELOPE metadata
    (§4 shape {from, read, summary, text, timestamp, type}), NOT body -- so the §4
    verbatim body rule stays intact, exactly as it does for the `from` rewrite. These
    are local, inbox-bound mutations on a shallow copy: dedup-safe (the hub envelope
    id was computed remotely at deposit and is only compared as an opaque string --
    never recomputed here) and never re-sent to the hub.

    Channel-naming note (S53, adopted from apex-research): a remote team's mail is
    attributed to a single `<remote-team>-courier` channel name -- the SAME name
    both sides use as the cross-team outbox (see _outbox_to_team). Standardizing on
    one channel name closes the reply dead-letter class: when an agent replies to an
    inbound peer message, SendMessage targets the inbound `from`; if attribution and
    the watched outbox disagree, the reply silently dead-letters. The prior local
    convention was `<from_team>-ghost`; `-courier` is now the documented standard.
    """
    rewritten = dict(entry)  # shallow copy; we touch only top-level envelope metadata
    rewritten["from"] = f"{from_team}-courier"
    # FORCE unread: a just-delivered inbound message is unread for the recipient by
    # definition; `read` is recipient-local state, not sender content. Forcing (not
    # fill-if-missing) also closes the case where a sender deposits read:true.
    rewritten["read"] = False
    # VALIDATE-and-normalize the timestamp: keep a present, well-formed protocol stamp
    # (ordering/preview fidelity); synthesize protocol-format UTC when absent OR
    # malformed, so surfacing never depends on the exact stamp shipped. Protocol format
    # is ISO YYYY-MM-DDTHH:MM:SSZ -- _utc_stamp() is a FILENAME stamp (no dashes/colons/
    # Z) and is deliberately NOT used here.
    ts = rewritten.get("timestamp")
    if not (isinstance(ts, str) and _TS_RE.match(ts)):
        rewritten["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    return rewritten


def process_inbound(cfg: Config, ledger: Ledger) -> None:
    """
    hints S6 cycle: collect -> for each entry, if id in ledger skip inject, else
    inject (D11) THEN ledger.append -> ack ALL collected ids (including skipped).

    Ordering is load-bearing (hints S6 row 4): inject FIRST, ledger SECOND. A crash
    between inject and ledger-append re-delivers ONE duplicate (accepted cost);
    reversing the order would convert that rare duplicate into a rare SILENT LOSS.
    ack only after durable local write (custody transfer -- protocol S5.4).
    """
    try:
        resp = cmd_collect(cfg)
    except TransportError as exc:
        # protocol S3: no envelope -> nothing happened. Nothing collected, nothing
        # to ack. Retry next cycle. hints S6 "collect and inject" crash row: cost none.
        warn(f"collect: transport failure ({exc}); retry next cycle")
        return

    if not resp.ok:
        warn(f"collect refused: {resp.error_code} {resp.error}; retry next cycle")
        return

    consignments = resp.data_lines  # hub-enveloped consignments (protocol S4), oldest-first
    if not consignments:
        return  # nothing waiting

    collected_ids: list[str] = []
    for c in consignments:
        if not isinstance(c, dict) or "id" not in c or "entry" not in c:
            warn(f"collect: skipping malformed consignment: {c!r}")
            continue
        env_id = c["id"]
        collected_ids.append(env_id)

        # hints S5: check the ledger BEFORE inject; keyed by hub envelope id.
        if ledger.contains(env_id):
            # Already delivered in a prior cycle (the hub redelivered because a
            # previous ack was lost). Skip inject; we still re-ack below (hints S6
            # row 5: re-ack repays a lost ack; cost none).
            continue

        from_team = c.get("from_team")
        if not from_team:
            # protocol S4: from_team is stamped by the hub from the authenticated
            # channel. Its absence means a malformed envelope -- do NOT inject with
            # an unattributable origin; skip and do NOT ack (so the hub redelivers
            # once the hub is fixed). Surface it.
            warn(f"collect: consignment {env_id} missing from_team; not injecting, not acking this id")
            collected_ids.remove(env_id)
            continue

        injected = rewrite_attribution(c["entry"], from_team)

        try:
            # D11 inject. A multi-entry "batch" here is a single consignment's
            # entry, injected as one message. (collect returns one entry per
            # consignment; we inject per consignment to keep the ledger 1:1 with
            # envelope ids -- the dedup key.)
            inject_batch(cfg, [injected])
        except InjectError as exc:
            # Did NOT durably write -> custody NOT transferred -> we must NOT ack
            # this id (protocol S5.4). Drop it from the ack list; the hub redelivers
            # next cycle. hints S6 "collect and inject" crash row: cost none.
            err(f"inject failed for {env_id}: {exc}; will NOT ack -- hub will redeliver")
            collected_ids.remove(env_id)
            continue

        # inject succeeded and is durable -> append to ledger (inject-before-ledger,
        # hints S6 row 4). Custody is now transferred; this id is safe to ack.
        ledger.append(env_id)

    if not collected_ids:
        return

    # ack ALL collected ids that reached durable custody (including skipped-because-
    # already-in-ledger ones -- a re-ack repays a lost ack; hints S6).
    try:
        ack_resp = cmd_ack(cfg, collected_ids)
    except TransportError as exc:
        # protocol S3: no envelope -> the ack did not happen; the hub still holds
        # these. Next cycle re-collects; ledger dedups the injected ones (skip
        # inject), and we re-ack. hints S6 "inject and ledger-append"/"ledger and
        # ack" rows: cost none for the already-ledgered ids. Safe.
        warn(f"ack: transport failure ({exc}); hub retains, re-ack next cycle")
        return
    if not ack_resp.ok:
        warn(f"ack refused: {ack_resp.error_code} {ack_resp.error}; re-ack next cycle")
        return
    info(f"inbound: injected+acked {len(collected_ids)} consignment(s)")


# ===========================================================================
# LOCAL FILE PRIMITIVES
# ===========================================================================
# The two write primitives the hints permit against contested paths, plus the
# courier-private atomic write. POSIX + Windows notes per hints S8.

def _exclusive_create_json(path: Path, data) -> None:
    """
    hints S4 step 3 / S8: exclusive-create -- open(path, 'x') == O_CREAT|O_EXCL.
    Atomic; raises FileExistsError if the path already exists (harness got there
    first). This is the ONLY way the courier ever brings a watched inbox into
    existence with content.
    """
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    # 'x' mode: exclusive creation, fails if the file exists.
    with open(path, "x", encoding="utf-8") as fh:
        fh.write(payload)
        fh.flush()
        os.fsync(fh.fileno())


def _atomic_write_json(path: Path, data) -> None:
    """
    Atomic replace via temp-on-same-volume + os.replace. For COURIER-PRIVATE files
    only (spool, ledger) -- NEVER a harness-watched inbox (that path uses
    exclusive-create). os.replace is atomic on POSIX and on Windows.
    """
    tmp = path.with_name(path.name + f".tmp-{uuid.uuid4().hex[:8]}")
    payload = json.dumps(data, ensure_ascii=False, indent=2)
    with open(tmp, "w", encoding="utf-8") as fh:
        fh.write(payload)
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, path)


def _utc_stamp() -> str:
    # Sortable UTC stamp for spool/aside filenames: YYYYMMDDTHHMMSSffffff.
    return time.strftime("%Y%m%dT%H%M%S", time.gmtime()) + f"{int((time.time() % 1) * 1e6):06d}"


def _outbox_to_team(spool_file: Path, cfg: Config) -> str | None:
    """
    Derive the destination team for a spool file. Convention (hints S1): a
    cross-team outbox name `<team>-courier` routes to `<team>` (strip `-courier`).
    The spool filename does not carry the source outbox name in v1, so we fall back
    to single-destination config when only one outbox is defined.

    Channel-naming standard (S53, adopted from apex-research): the cross-team
    channel name is `<team>-courier` -- the SAME name both sides use (see
    rewrite_attribution). The legacy `<team>-bridge` suffix is STILL accepted for
    backwards-compat (the live FR<->apex link runs `apex-research-bridge` until
    Brunel's gated config flip lands; do not break it). Strip `-courier` first, then
    `-bridge`; if neither suffix matches, the outbox name IS the team name.

    PROTOCOL AMBIGUITY (surfaced to team-lead, not resolved here): the docs do not
    specify how a generic outbox names its destination when multiple outboxes or
    multiple destinations exist. This reference handles the single-destination and
    `<team>-courier` / `<team>-bridge` cases; multi-destination fan-out is an
    undefined extension.
    """
    if len(cfg.ghost_outboxes) == 1:
        name = cfg.ghost_outboxes[0]
        for suffix in ("-courier", "-bridge"):  # -courier standard; -bridge backwards-compat
            if name.endswith(suffix):
                return name[: -len(suffix)]
        return name
    # Multiple ghost outboxes: cannot disambiguate from the spool file alone in v1.
    # (A production extension would stamp the source outbox into the spool filename
    # or wrap entries with routing at consume time.) Surface rather than guess.
    return None


# ===========================================================================
# SINGLE-INSTANCE LOCK  (hints S7: never run two couriers against the same dir)
# ===========================================================================
# No substrate protection (S6: harness writes are not lock-protected). Use a lock
# file -- exclusive-create with PID + staleness check (the T6.a primitive again,
# hints S7 last bullet).

class InstanceLock:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._held = False

    def acquire(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        try:
            self._write_lock()
        except FileExistsError:
            # A lock exists. Check staleness: if the recorded PID is not alive, the
            # previous courier crashed without releasing -> reclaim. Otherwise refuse.
            if self._is_stale():
                warn(f"lock: reclaiming stale lock at {self.path}")
                self.path.unlink(missing_ok=True)
                self._write_lock()
            else:
                raise RuntimeError(
                    f"another courier instance is already running (lock {self.path}); refusing to start"
                )
        self._held = True

    def _write_lock(self) -> None:
        rec = json.dumps({"pid": os.getpid(), "ts": _utc_stamp()})
        with open(self.path, "x", encoding="utf-8") as fh:
            fh.write(rec)

    def _is_stale(self) -> bool:
        try:
            rec = json.loads(self.path.read_text(encoding="utf-8"))
            pid = int(rec["pid"])
        except (OSError, json.JSONDecodeError, KeyError, ValueError):
            return True  # unreadable lock -> treat as stale
        return not _pid_alive(pid)

    def release(self) -> None:
        if self._held:
            self.path.unlink(missing_ok=True)
            self._held = False

    def __enter__(self) -> "InstanceLock":
        self.acquire()
        return self

    def __exit__(self, *exc) -> None:
        self.release()


def _pid_alive(pid: int, procstart: "str | None" = None) -> bool:
    """Cross-platform process-liveness probe.

    Used in two places, hence the optional `procstart` guard:
      - InstanceLock._is_stale (no procstart) -- reclaim a lock only if its PID is dead.
      - _has_live_session (with procstart) -- the team-dir liveness filter (WS1 resolver).
        V3 (WS3b probe, 2.1.181) proved sessions/<pid>.json is NOT GC'd on exit and dead
        entries linger status:"idle" -- so liveness MUST be process-based, not status-based.

    `procstart` is an OPTIONAL Linux-only PID-reuse guard: when supplied AND /proc is
    readable, the recorded process start-time (/proc/<pid>/stat field 22) must still match,
    else the PID was recycled to an unrelated process -> dead. It is strictly NARROWING and
    only fires on POSITIVE evidence of reuse; on Windows or any /proc-read failure it degrades
    to the cross-platform liveness result below (never flips a conservative-alive to dead on a
    transient error). The cross-platform liveness contract (Windows tasklist / POSIX os.kill,
    conservative-on-can't-tell) is UNCHANGED for the no-procstart caller."""
    # Entry guard: a sessions/<pid>.json may carry a null / missing / non-numeric `pid`
    # (partial write, corrupted entry) -- exactly the messy registry the V3 fix must survive.
    # Coerce-or-dead FIRST, before any arithmetic, so the liveness filter (and resolve_team_dir)
    # never crash on a malformed entry. (d.get("pid", 0) yields None for an explicit JSON null,
    # not the 0 default -- so this guard, not the default, is what makes the caller crash-safe.)
    try:
        pid = int(pid)
    except (TypeError, ValueError):
        return False
    if pid <= 0:
        return False
    if os.name == "nt":
        # Windows: query the task list. No os.kill(0) semantics for liveness.
        # No /proc, so the procstart reuse-guard is unavailable here (degrades to tasklist).
        try:
            out = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/NH"],
                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=10,
            )
            return str(pid) in out.stdout.decode(errors="replace")
        except (OSError, subprocess.SubprocessError):
            return True  # can't tell -> assume alive (conservative; refuse to reclaim)
    else:
        try:
            os.kill(pid, 0)  # signal 0 = liveness probe, no signal delivered
        except ProcessLookupError:
            return False
        except PermissionError:
            return True  # exists but not ours
        except OSError:
            return True
        # PID is live. If a procstart was recorded, confirm it's the SAME process
        # (PID-reuse guard, Linux-only -- /proc/<pid>/stat field 22, the value after the
        # final ')'). Mismatch -> recycled PID -> dead. Unreadable /proc (race / no procfs)
        # -> fall back to the os.kill result (do NOT mis-drop a live process on a read error).
        if procstart is not None:
            try:
                with open(f"/proc/{int(pid)}/stat", encoding="utf-8") as fh:
                    fields = fh.read().rsplit(")", 1)[1].split()
                return str(procstart) == str(fields[19])  # field 22 overall; idx 19 post-comm
            except (OSError, IndexError, ValueError):
                return True
        return True


# ===========================================================================
# RUNTIME TEAM-DIR DISCOVERY (WS1 -- issue #86, 2.1.178+ implicit teams)
# ===========================================================================
# On CLI 2.1.178+ the on-disk team dir is `session-<id>` (random per session); the
# Agent-tool `team_name` is ignored on disk (probe P1). So the hardcoded
# `~/.claude/teams/framework-research/inboxes` path breaks -- the courier (and the
# lifecycle scripts) must DISCOVER the live team dir at runtime. This is the ONE shared
# resolver (function = the contract); the path that fires is caller-relative:
#   - a caller that holds the session pid (lifecycle, in-session) passes session_pid ->
#     pid tiebreaker, O(1), unambiguous even amid stale leftovers;
#   - the detached courier (Scheduled Task, no session pid) passes None -> glob config.json
#     `.name` (canonical) + liveness filter.
# Resolution order: explicit-override -> single-dir -> pid tiebreaker -> liveness filter ->
# FAIL FAST (never guess; no hardcoded-name fallback -- that's the bug being removed).
# Decision: wiki/decisions/courier-must-runtime-discover-team-name.md +
# startup-create-collapses-to-discover.md. Validated: migration-validation-probe-findings
# -2026-06-18.md (V1 glob PASS, V2 pid PASS, V3 forced liveness=process-not-status).

def discover_by_config_glob(claude_home: Path) -> "list[tuple[str, Path]]":
    """[(name, team_dir), ...] for every team dir with a readable config.json `.name`."""
    out = []
    for cfg_path in sorted(Path(claude_home, "teams").glob("*/config.json")):
        try:
            name = json.loads(cfg_path.read_text(encoding="utf-8"))["name"]
        except (OSError, json.JSONDecodeError, KeyError):
            continue  # skip unreadable / malformed (stale, mid-write) dirs
        out.append((name, cfg_path.parent))
    return out


def discover_by_session_pid(claude_home: Path, pid: int) -> "str | None":
    """Read sessions/<pid>.json, return session-<first8hex-of-sessionId> (the team slug)."""
    sess = Path(claude_home, "sessions", f"{pid}.json")
    try:
        sid = json.loads(sess.read_text(encoding="utf-8"))["sessionId"]
    except (OSError, json.JSONDecodeError, KeyError):
        return None
    return f"session-{sid[:8]}"


def _has_live_session(claude_home: Path, team_name: str) -> bool:
    """A team dir is LIVE if some sessions/<pid>.json matches its slug AND that pid is a live
    PROCESS. V3 (WS3b, 2.1.181): sessions/<pid>.json is NOT GC'd on exit and dead entries linger
    status:"idle" -- so `status` is NOT a liveness signal. Liveness keys on the cross-platform
    _pid_alive against the entry's `pid`, procStart-guarded against PID reuse (Linux-only,
    degrades on Windows). This drops stale dirs for the no-pid (courier) caller."""
    for sess in Path(claude_home, "sessions").glob("*.json"):
        try:
            d = json.loads(sess.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if f"session-{d.get('sessionId', '')[:8]}" == team_name \
           and _pid_alive(d.get("pid", 0), d.get("procStart")):
            return True
    return False


def resolve_team_dir(
    claude_home: Path,
    *,
    session_pid: "int | None" = None,
    explicit_dir_name: "str | None" = None,
) -> Path:
    """Resolve the live on-disk team dir under ~/.claude/teams/. Returns the team DIR (caller
    appends /inboxes). Raises RuntimeError on no-match or unresolved-ambiguity -- never guesses,
    never falls back to a hardcoded name. Order: explicit -> single-dir -> pid -> liveness -> fail."""
    teams_root = Path(claude_home, "teams")
    if explicit_dir_name:
        d = teams_root / explicit_dir_name
        if not d.is_dir():
            raise RuntimeError(f"explicit team_dir_name {explicit_dir_name!r} not found under {teams_root}")
        return d
    candidates = discover_by_config_glob(claude_home)
    if not candidates:
        raise RuntimeError(
            f"no team dir found under {teams_root} (no config.json). "
            f"Is a Claude session running on 2.1.178+?"
        )
    if len(candidates) == 1:
        # defensive single-dir self-confirm: if a pid was passed and its derived slug
        # disagrees with the one dir, WARN rather than blindly return (Aen hardening note).
        if session_pid is not None:
            want = discover_by_session_pid(claude_home, session_pid)
            if want and want != candidates[0][0]:
                warn(f"resolve_team_dir: single dir {candidates[0][0]!r} != pid-derived {want!r}")
        return candidates[0][1]
    # multiple dirs -> disambiguate
    if session_pid is not None:
        want = discover_by_session_pid(claude_home, session_pid)
        for name, d in candidates:
            if name == want:
                return d
    live = [(name, d) for name, d in candidates if _has_live_session(claude_home, name)]
    if len(live) == 1:
        return live[0][1]
    raise RuntimeError(
        f"ambiguous team dir: {[n for n, _ in candidates]} (live: {[n for n, _ in live]}). "
        f"Set team_dir_name in config or pass session_pid to disambiguate."
    )


# ===========================================================================
# STARTUP VALIDATION
# ===========================================================================

def validate_startup(cfg: Config) -> None:
    """
    Fail fast on the invariants the disciplines depend on:
      - inboxes_dir exists (hints S2: files auto-create, but the DIR must exist)
      - spool / state on the SAME VOLUME as inboxes (hints S3: rename() atomicity
        is per-volume) -- refuse to run otherwise
      - private key present
    """
    # Bug A(b) fix (Volta-found, co-signed; 2026-06-18 S58): a bare-fresh 2.1.178+
    # session has a session-<id> team dir but NO inboxes/ subdir until first activity
    # (same rationale restore-inboxes.sh mkdir -p's it). The old hard-raise here turned
    # that benign cold-start into a courier-start failure. Create it instead -- matching
    # the parents=True, exist_ok=True pattern used for state/spool/inject below.
    cfg.inboxes_dir.mkdir(parents=True, exist_ok=True)
    cfg.state_dir.mkdir(parents=True, exist_ok=True)
    cfg.spool_dir.mkdir(parents=True, exist_ok=True)
    cfg.inject_tmp_dir.mkdir(parents=True, exist_ok=True)

    # Same-volume check (hints S3 "Spool placement"). On POSIX compare st_dev; on
    # Windows compare the drive/anchor. rename() across volumes is NOT atomic (it
    # silently degrades to copy+unlink), which would break the consume-by-rename
    # and inject-rename-aside guarantees.
    if not _same_volume(cfg.inboxes_dir, cfg.state_dir):
        raise RuntimeError(
            f"state_dir ({cfg.state_dir}) is NOT on the same volume as inboxes_dir "
            f"({cfg.inboxes_dir}); rename() atomicity is per-volume (hints S3). Refusing to run."
        )

    if not Path(cfg.ssh_key).exists():
        warn(f"ssh_key not found at {cfg.ssh_key} -- ssh will fail until the key is in place")


def _same_volume(a: Path, b: Path) -> bool:
    if os.name == "nt":
        return os.path.splitdrive(os.path.abspath(a))[0].lower() == \
               os.path.splitdrive(os.path.abspath(b))[0].lower()
    try:
        # Compare the device id of the nearest existing ancestor of each path.
        return _nearest_existing(a).stat().st_dev == _nearest_existing(b).stat().st_dev
    except OSError:
        return False


def _nearest_existing(p: Path) -> Path:
    p = p.resolve()
    while not p.exists() and p != p.parent:
        p = p.parent
    return p


# ===========================================================================
# MAIN LOOP  (hints S6 cycle choreography)
# ===========================================================================

def run_once(cfg: Config, ledger: Ledger) -> None:
    # hints S6 order: outbound first (consume -> deposit), then inbound
    # (collect -> inject -> ack). Single-threaded per direction preserves FIFO
    # (hints S3.6, protocol S7).
    try:
        consume_outboxes_to_spool(cfg)
        deposit_spool(cfg)
    except Exception as exc:  # never let one bad cycle kill the loop
        err(f"outbound cycle error: {exc}")
    try:
        process_inbound(cfg, ledger)
    except Exception as exc:
        err(f"inbound cycle error: {exc}")


def run_loop(cfg: Config, ledger: Ledger) -> None:
    info(
        f"courier up: team={cfg.team} target={cfg.ssh_target} "
        f"interval={cfg.poll_interval_s}s outboxes={cfg.ghost_outboxes} inject->{cfg.target_inbox}"
    )
    while True:
        run_once(cfg, ledger)
        time.sleep(cfg.poll_interval_s)


def do_ping(cfg: Config) -> int:
    # onboarding S3 verify: ping -> {team, fingerprint, protocol}.
    try:
        resp = cmd_ping(cfg)
    except TransportError as exc:
        err(f"ping: transport failure ({exc}) -- check hub address and key registration")
        return 2
    if not resp.ok:
        err(f"ping refused: {resp.error_code} {resp.error}")
        return 3
    ident = resp.data_lines[0] if resp.data_lines else {}
    info(f"ping ok: hub sees team={ident.get('team')!r} fingerprint={ident.get('fingerprint')} "
         f"protocol={ident.get('protocol')}")
    if ident.get("team") != cfg.team:
        warn(f"hub identity {ident.get('team')!r} != configured team {cfg.team!r} "
             f"(the channel is the identity -- protocol S2.2; trust the hub, fix your config)")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="stationmaster reference courier")
    # --config is NOT required when --resolve-team-dir is given: that is a PRE-config-load
    # lifecycle touchpoint (WS2 T1/T2/T3 -- startup discover + restore/persist-inboxes.sh run
    # before any courier config exists). It's required for every other mode.
    ap.add_argument("--config", help="path to courier JSON config")
    ap.add_argument("--once", action="store_true", help="run a single cycle and exit")
    ap.add_argument("--ping", action="store_true", help="ping the hub and exit (onboarding verify)")
    # WS2 lifecycle shim (#86): discover the team dir WITHOUT a courier config, so the bash
    # lifecycle scripts can `SLUG=$(stationmaster-courier.py --resolve-team-dir --name)`.
    #   --resolve-team-dir         -> print the discovered team DIR (the inboxes_dir base)
    #   --resolve-team-dir --name  -> print the bare session-<id> slug
    # exit 0 on success; stderr message + nonzero on no-resolve / unresolved ambiguity.
    ap.add_argument("--resolve-team-dir", dest="resolve_team_dir", action="store_true",
                    help="discover and print the live team dir (or --name = bare slug), then exit")
    ap.add_argument("--name", action="store_true",
                    help="with --resolve-team-dir: print the bare session-<id> slug, not the full path")
    ap.add_argument("--claude-home", default="~/.claude", help="claude home for --resolve-team-dir")
    ap.add_argument("--session-pid", type=int, default=None,
                    help="with --resolve-team-dir: session pid for the pid tiebreaker (in-session callers)")
    ap.add_argument("--team-dir-name", default=None,
                    help="with --resolve-team-dir: explicit team dir name override (skip discovery)")
    args = ap.parse_args(argv)

    # Pre-config lifecycle shim: resolve + print + exit, no config / no lock / no hub.
    if args.resolve_team_dir:
        # session_pid precedence: explicit --session-pid, else FR_COURIER_SESSION_PID env
        # (the same env the "auto" Config path reads -- one contract for both callers).
        pid = args.session_pid
        if pid is None:
            _env = os.environ.get("FR_COURIER_SESSION_PID")
            pid = int(_env) if _env and _env.isdigit() else None
        try:
            team_dir = resolve_team_dir(
                _expand(args.claude_home), session_pid=pid, explicit_dir_name=args.team_dir_name
            )
            print(team_dir.name if args.name else team_dir)
            return 0
        except RuntimeError as exc:
            sys.stderr.write(f"{exc}\n")
            return 1

    if not args.config:
        ap.error("--config is required unless --resolve-team-dir is given")

    cfg = load_config(args.config)

    if args.ping:
        # ping needs no lock and no local-file work.
        return do_ping(cfg)

    validate_startup(cfg)

    with InstanceLock(cfg.lock_path):  # hints S7: single instance per team dir
        ledger = Ledger(cfg.ledger_path)
        ledger.compact()  # hints S5: compact at startup
        if args.once:
            run_once(cfg, ledger)
            return 0
        try:
            run_loop(cfg, ledger)
        except KeyboardInterrupt:
            info("courier stopping (interrupt)")
        return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
