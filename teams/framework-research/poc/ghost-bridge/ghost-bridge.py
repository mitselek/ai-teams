#!/usr/bin/env python3
# (*FR:Aen via coding-subagent*)
"""ghost-bridge -- team-lead-to-team-lead cross-host comms daemon (v2).

Generalizes the S31 ghost-chat PoC into a long-running daemon shape. Multi-pair
support (v2): all pairs[] in config are polled each cycle. Outbound forwards
FR-local outbox -> remote inbox via ssh; inbound fetches remote outbox ->
FR-local inbox.

Primitives (APPEND_INBOX_SCRIPT, FETCH_AND_MARK_READ_SCRIPT, ssh_exec,
load_ssh_config) are adapted from teams/framework-research/poc/ghost-member-cli/
ghost-chat.py. SF-4 substrate-validated.

Sketch grade -- not production. Python 3.7+ stdlib only.

Usage:
    python ghost-bridge.py [--config ghost-bridge.config.json]

Lifecycle:
    start-ghost-bridge.sh   launches the daemon in background, writes PID file
    stop-ghost-bridge.sh    SIGTERM, waits 5s, falls back to SIGKILL

See README.md for operational notes.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# === Constants ===

DEFAULT_WATCH_INTERVAL_S = 2.0
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_CONFIG_PATH = SCRIPT_DIR / "ghost-bridge.config.json"

# Reconfigure stdio to UTF-8 (Python 3.7+) -- same rationale as ghost-chat.py.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except (AttributeError, ValueError):
        pass


# === Logging (lightweight, append-only) ===

class Logger:
    def __init__(self, log_path: Path):
        self.log_path = log_path
        # Truncate at startup per Open decision #1 ("keep it simple: truncate at
        # start of each session").
        log_path.parent.mkdir(parents=True, exist_ok=True)
        log_path.write_text("", encoding="utf-8")
        self._fh = open(log_path, "a", encoding="utf-8", buffering=1)  # line-buffered

    def log(self, level: str, msg: str) -> None:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        line = f"{ts} [{level}] {msg}\n"
        try:
            self._fh.write(line)
        except Exception:
            # Last-ditch fallback to stderr; don't crash the daemon on logging woes.
            sys.stderr.write(line)

    def info(self, msg: str) -> None:
        self.log("INFO", msg)

    def warn(self, msg: str) -> None:
        self.log("WARN", msg)

    def error(self, msg: str) -> None:
        self.log("ERROR", msg)

    def close(self) -> None:
        try:
            self._fh.close()
        except Exception:
            pass


# === SSH config loader (verbatim shape from ghost-chat.py) ===

def load_ssh_config(deployment_alias: str) -> dict:
    """Resolve an SSH config block from ~/bin/rc-deployments.json by deployment name."""
    registry_path = Path.home() / "bin" / "rc-deployments.json"
    if not registry_path.exists():
        raise RuntimeError(f"deployments registry not found: {registry_path}")
    reg = json.loads(registry_path.read_text(encoding="utf-8"))
    hostmap = reg["hosts"]
    dep = next((d for d in reg["deployments"] if d.get("name") == deployment_alias), None)
    if not dep:
        raise RuntimeError(f"deployment '{deployment_alias}' not in registry")
    return {
        "host": hostmap[dep["hostAlias"]],
        "port": dep["port"],
        "user": dep["user"],
        "key": str(Path(dep["key"]).expanduser()) if dep.get("key") else "",
        "remote_team_name": dep["name"],
    }


# === SSH wrapper (verbatim shape from ghost-chat.py) ===

def ssh_exec(cfg: dict, remote_script: str, timeout: float = 30.0) -> tuple:
    """Run a shell script on the remote via stdin. Returns (rc, stdout, stderr)."""
    args = ["ssh"]
    if cfg.get("key"):
        args += ["-i", cfg["key"]]
    args += [
        "-p", str(cfg["port"]),
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "BatchMode=yes",
        f"{cfg['user']}@{cfg['host']}",
        "bash",
    ]
    proc = subprocess.run(
        args,
        input=remote_script.encode("utf-8"),
        capture_output=True,
        timeout=timeout,
    )
    return (proc.returncode,
            proc.stdout.decode("utf-8", errors="replace"),
            proc.stderr.decode("utf-8", errors="replace"))


# === Remote primitives (verbatim from ghost-chat.py) ===

APPEND_INBOX_SCRIPT = r"""
python3 - <<'PYEOF'
import json, os, base64, fcntl, sys
path = os.path.expanduser(__INBOX_PATH_REPR__)
msg = json.loads(base64.b64decode(__MSG_B64_REPR__).decode("utf-8"))
fd = os.open(path, os.O_RDWR | os.O_CREAT, 0o644)
try:
    fcntl.flock(fd, fcntl.LOCK_EX)
    raw = os.read(fd, 1<<24).decode("utf-8") or "[]"
    arr = json.loads(raw) if raw.strip() else []
    arr.append(msg)
    os.lseek(fd, 0, 0)
    os.ftruncate(fd, 0)
    os.write(fd, json.dumps(arr, ensure_ascii=False).encode("utf-8"))
finally:
    fcntl.flock(fd, fcntl.LOCK_UN)
    os.close(fd)
print("OK")
PYEOF
"""

FETCH_AND_MARK_READ_SCRIPT = r"""
python3 - <<'PYEOF'
import json, os, fcntl, sys
path = os.path.expanduser(__INBOX_PATH_REPR__)
if not os.path.exists(path):
    sys.exit(0)
fd = os.open(path, os.O_RDWR, 0o644)
try:
    fcntl.flock(fd, fcntl.LOCK_EX)
    raw = os.read(fd, 1<<24).decode("utf-8") or "[]"
    arr = json.loads(raw) if raw.strip() else []
    changed = False
    for m in arr:
        if not m.get("read", False):
            print(json.dumps(m, ensure_ascii=False))
            m["read"] = True
            changed = True
    if changed:
        os.lseek(fd, 0, 0)
        os.ftruncate(fd, 0)
        os.write(fd, json.dumps(arr, ensure_ascii=False).encode("utf-8"))
finally:
    fcntl.flock(fd, fcntl.LOCK_UN)
    os.close(fd)
PYEOF
"""


# === Path helpers ===
#
# LOCAL_TEAM is overridden from config at Daemon init. Default kept for
# backward-compat with configs that pre-date the local_team field.

LOCAL_TEAM = "framework-research"


def local_inbox_path(name: str) -> Path:
    return Path.home() / ".claude" / "teams" / LOCAL_TEAM / "inboxes" / f"{name}.json"


def remote_inbox_path(remote_team: str, name: str) -> str:
    return f"~/.claude/teams/{remote_team}/inboxes/{name}.json"


# === Envelope construction ===

def build_forward_envelope(orig: dict, rewrite_from_to: str) -> dict:
    """Build the forward envelope per SPEC § Sender-identity rewrite.

    Copies text/summary/timestamp verbatim; overrides `from`; sets read:false.
    Does NOT include `color` (SF-3 contract -- let recipient harness apply
    registered color).
    """
    return {
        "from": rewrite_from_to,
        "text": orig.get("text", ""),
        "summary": orig.get("summary", ""),
        "timestamp": orig.get("timestamp", ""),
        "read": False,
    }


# === Local file ops ===
#
# No fcntl on FR-side per SPEC § Substrate invariants (Known limitation #2
# accepted for v1). Straight open/json.load/dump.

def local_read_inbox(path: Path) -> list:
    if not path.exists():
        return []
    try:
        raw = path.read_text(encoding="utf-8").strip()
        if not raw:
            return []
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        return []
    except (json.JSONDecodeError, OSError):
        return []


def local_write_inbox(path: Path, arr: list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(arr, ensure_ascii=False), encoding="utf-8")


def local_append_inbox(path: Path, msg: dict) -> None:
    arr = local_read_inbox(path)
    arr.append(msg)
    local_write_inbox(path, arr)


# === Outbound: FR-local outbox -> remote inbox ===

def poll_outbound(cfg: dict, ssh_cfg: dict, log: Logger, missing_logged: dict) -> int:
    """One outbound polling cycle. Returns count of messages forwarded."""
    local_outbox_name = cfg["local_to_remote"]["local_outbox_inbox"]
    remote_inbox_name = cfg["local_to_remote"]["remote_inbox"]
    rewrite_from = cfg["local_to_remote"]["rewrite_from_to"]
    remote_team = ssh_cfg["remote_team_name"]

    local_path = local_inbox_path(local_outbox_name)
    if not local_path.exists():
        # Skip silently with one-time log line per spec Open decision #2.
        if not missing_logged.get("outbound_local"):
            log.warn(f"outbound: local outbox file not yet present: {local_path}")
            missing_logged["outbound_local"] = True
        return 0
    missing_logged["outbound_local"] = False

    arr = local_read_inbox(local_path)
    unread_indexes = [i for i, m in enumerate(arr) if not m.get("read", False)]
    if not unread_indexes:
        return 0

    forwarded = 0
    remote_path = remote_inbox_path(remote_team, remote_inbox_name)

    for i in unread_indexes:
        orig = arr[i]
        envelope = build_forward_envelope(orig, rewrite_from)
        msg_b64 = base64.b64encode(
            json.dumps(envelope, ensure_ascii=False).encode("utf-8")
        ).decode("ascii")
        script = (APPEND_INBOX_SCRIPT
                  .replace("__INBOX_PATH_REPR__", repr(remote_path))
                  .replace("__MSG_B64_REPR__", repr(msg_b64)))
        try:
            rc, stdout, stderr = ssh_exec(ssh_cfg, script)
        except subprocess.TimeoutExpired:
            log.error(f"outbound: ssh timeout forwarding to {remote_path}")
            break  # don't drain whole batch on transport hiccup; retry next cycle
        except Exception as exc:
            log.error(f"outbound: ssh raised {type(exc).__name__}: {exc}")
            break

        if rc == 0 and "OK" in stdout:
            arr[i]["read"] = True
            forwarded += 1
            local_write_inbox(local_path, arr)
            log.info(
                f"outbound: forwarded -> {remote_team}:{remote_inbox_name} "
                f"(ts={orig.get('timestamp','?')}, summary={orig.get('summary','')[:40]!r})"
            )
        else:
            log.error(
                f"outbound: forward FAILED rc={rc} stderr={stderr.strip()[:200]}; "
                f"leaving read:false for retry"
            )
            # Don't continue draining on failure -- likely transport-wide;
            # try again next poll cycle.
            break

    return forwarded


# === Inbound: remote outbox -> FR-local inbox ===

def poll_inbound(cfg: dict, ssh_cfg: dict, log: Logger, missing_logged: dict) -> int:
    """One inbound polling cycle. Returns count of messages received."""
    remote_outbox_name = cfg["remote_to_local"]["remote_outbox_inbox"]
    local_inbox_name = cfg["remote_to_local"]["local_inbox"]
    rewrite_from = cfg["remote_to_local"]["rewrite_from_to"]
    remote_team = ssh_cfg["remote_team_name"]
    remote_path = remote_inbox_path(remote_team, remote_outbox_name)

    script = FETCH_AND_MARK_READ_SCRIPT.replace("__INBOX_PATH_REPR__", repr(remote_path))
    try:
        rc, stdout, stderr = ssh_exec(ssh_cfg, script)
    except subprocess.TimeoutExpired:
        log.error(f"inbound: ssh timeout fetching from {remote_path}")
        return 0
    except Exception as exc:
        log.error(f"inbound: ssh raised {type(exc).__name__}: {exc}")
        return 0

    if rc != 0:
        # Could be missing remote file (which fetch script exits 0 for) or genuine
        # ssh error. Log but don't spam.
        if not missing_logged.get("inbound_remote_err"):
            log.error(f"inbound: ssh rc={rc} stderr={stderr.strip()[:200]}")
            missing_logged["inbound_remote_err"] = True
        return 0
    missing_logged["inbound_remote_err"] = False

    if not stdout.strip():
        return 0

    local_path = local_inbox_path(local_inbox_name)
    received = 0
    for line in stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            orig = json.loads(line)
        except json.JSONDecodeError as exc:
            log.warn(f"inbound: malformed message line, skipping: {exc}")
            continue
        envelope = build_forward_envelope(orig, rewrite_from)
        try:
            local_append_inbox(local_path, envelope)
            received += 1
            log.info(
                f"inbound: received <- {remote_team}:{remote_outbox_name} "
                f"(ts={orig.get('timestamp','?')}, summary={orig.get('summary','')[:40]!r})"
            )
        except OSError as exc:
            log.error(
                f"inbound: local write FAILED for {local_path}: {exc}; "
                f"message LOST (apex flag already flipped -- substrate invariant #4 break)"
            )
            # SPEC § Substrate invariants failure mode (4): "inbound message
            # dropped". Acknowledged.

    return received


# === Main loop ===

class Daemon:
    def __init__(self, config_path: Path):
        self.config_path = config_path
        self.config = json.loads(config_path.read_text(encoding="utf-8"))
        self.watch_interval = float(self.config.get("watch_interval_s", DEFAULT_WATCH_INTERVAL_S))

        # Override module-level LOCAL_TEAM from config (team-agnostic deployment).
        # Backward-compat: missing field keeps the default "framework-research".
        global LOCAL_TEAM
        LOCAL_TEAM = self.config.get("local_team", LOCAL_TEAM)

        pid_file_str = self.config.get("pid_file", "ghost-bridge.pid")
        log_file_str = self.config.get("log_file", "ghost-bridge.log")
        # Resolve relative paths against the config file's directory (script-adjacent).
        self.pid_file = self._resolve(pid_file_str)
        self.log_file = self._resolve(log_file_str)

        self.log = Logger(self.log_file)

        pairs = self.config.get("pairs", [])
        if not pairs:
            raise RuntimeError("config has no pairs[]")

        self.pairs = []
        for pair_cfg in pairs:
            ssh_cfg = load_ssh_config(pair_cfg["remote_deployment_alias"])
            if pair_cfg.get("remote_team_name"):
                ssh_cfg["remote_team_name"] = pair_cfg["remote_team_name"]
            missing = {}
            self.pairs.append((pair_cfg, ssh_cfg, missing))

        self._stop = False

    def _resolve(self, p: str) -> Path:
        path = Path(p)
        if not path.is_absolute():
            path = self.config_path.parent / path
        return path

    def write_pid(self) -> None:
        self.pid_file.write_text(str(os.getpid()), encoding="utf-8")

    def remove_pid(self) -> None:
        try:
            if self.pid_file.exists():
                self.pid_file.unlink()
        except OSError:
            pass

    def install_signal_handlers(self) -> None:
        def handler(signum, frame):
            self.log.info(f"signal {signum} received -- beginning graceful shutdown")
            self._stop = True

        signal.signal(signal.SIGTERM, handler)
        signal.signal(signal.SIGINT, handler)

    def run(self) -> int:
        pair_names = ", ".join(p[0]["pair_name"] for p in self.pairs)
        self.log.info(
            f"ghost-bridge starting "
            f"local_team={LOCAL_TEAM} "
            f"pairs=[{pair_names}] ({len(self.pairs)} pair(s)) "
            f"interval={self.watch_interval}s "
            f"pid={os.getpid()}"
        )
        for pair_cfg, ssh_cfg, _ in self.pairs:
            self.log.info(
                f"  pair={pair_cfg['pair_name']} "
                f"remote={ssh_cfg['user']}@{ssh_cfg['host']}:{ssh_cfg['port']} "
                f"team={ssh_cfg['remote_team_name']}"
            )
        self.write_pid()
        self.install_signal_handlers()

        out_total = 0
        in_total = 0
        cycle = 0

        try:
            while not self._stop:
                cycle += 1
                for pair_cfg, ssh_cfg, missing in self.pairs:
                    if self._stop:
                        break
                    try:
                        sent = poll_outbound(pair_cfg, ssh_cfg, self.log, missing)
                        out_total += sent
                    except Exception as exc:
                        self.log.error(
                            f"poll_outbound [{pair_cfg['pair_name']}] "
                            f"raised {type(exc).__name__}: {exc}"
                        )
                    if self._stop:
                        break
                    try:
                        got = poll_inbound(pair_cfg, ssh_cfg, self.log, missing)
                        in_total += got
                    except Exception as exc:
                        self.log.error(
                            f"poll_inbound [{pair_cfg['pair_name']}] "
                            f"raised {type(exc).__name__}: {exc}"
                        )

                # Sleep responsively to signals: chunk into 0.25s slices.
                t_end = time.monotonic() + self.watch_interval
                while not self._stop and time.monotonic() < t_end:
                    time.sleep(min(0.25, max(0.0, t_end - time.monotonic())))

        finally:
            self.log.info(
                f"ghost-bridge stopping -- cycles={cycle} forwarded={out_total} "
                f"received={in_total}"
            )
            self.remove_pid()
            self.log.close()

        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="ghost-bridge -- multi-pair cross-team comms daemon")
    parser.add_argument("--config", "-c", default=str(DEFAULT_CONFIG_PATH),
                        help="path to ghost-bridge.config.json")
    args = parser.parse_args()

    config_path = Path(args.config).resolve()
    if not config_path.exists():
        sys.stderr.write(f"ERROR: config not found: {config_path}\n")
        return 2

    try:
        daemon = Daemon(config_path)
    except Exception as exc:
        sys.stderr.write(f"ERROR: daemon init failed: {type(exc).__name__}: {exc}\n")
        return 3

    return daemon.run()


if __name__ == "__main__":
    sys.exit(main())
