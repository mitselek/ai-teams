#!/usr/bin/env python3
"""ghost-chat -- RFC #66 cross-host PoC, Python port.

Single-file sketch-grade CLI for cross-host chat into a remote AI team via SSH.
Replaces ~/bin/ghost-chat.ps1; same architecture, host-quirks gone.

Architecture (Step 2 per Aen 2026-05-12 16:25):
  - CLI on Windows local-dev (or any host with ssh + python3.7+).
  - Remote team interaction via single ssh invocations per action.
  - Background thread polls own inbox on apex every WATCH_INTERVAL seconds.
  - Inbox messages marked read=true on disk after display (addresses PowerShell
    PoC Bug C: BACKLOG-on-every-launch).
  - PO arranges manual ghost registration in apex config.json beforehand.
  - This script NEVER writes to apex config.json (ACL one-sided per RFC #66).

Reads SSH details from ~/bin/rc-deployments.json; deployment alias hard-coded
to 'apex-research' for the PoC.

Usage:
    python ghost-chat.py --name <ghost_name> [--target <teammate>]
or:
    python ghost-chat.py <ghost_name> [<teammate>]   # positional fallback

(*FR:Brunel*) 2026-05-12 S31 -- sketch grade, NOT for production.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

WATCH_INTERVAL_S = 2.0
DEPLOYMENT_ALIAS = "apex-research"

# Reconfigure stdio to UTF-8 (Python 3.7+). On Windows this sidesteps the same
# CP850/CP1252 mojibake the PowerShell port had to fight with [Console]::Encoding.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
    except (AttributeError, ValueError):
        pass

# ANSI colors. Windows 10+ terminals support these natively; no colorama.
C_YELLOW = "\033[33m"
C_CYAN = "\033[36m"
C_DARKCYAN = "\033[36;2m"
C_GREEN = "\033[32m"
C_RED = "\033[31m"
C_GRAY = "\033[90m"
C_RESET = "\033[0m"


# === Config loader ===

def load_ssh_config() -> dict:
    registry_path = Path.home() / "bin" / "rc-deployments.json"
    if not registry_path.exists():
        sys.exit(f"ERROR: {registry_path} not found")
    reg = json.loads(registry_path.read_text(encoding="utf-8"))
    hostmap = reg["hosts"]
    dep = next((d for d in reg["deployments"] if d.get("name") == DEPLOYMENT_ALIAS), None)
    if not dep:
        sys.exit(f"ERROR: deployment '{DEPLOYMENT_ALIAS}' not in registry")
    return {
        "host": hostmap[dep["hostAlias"]],
        "port": dep["port"],
        "user": dep["user"],
        "key": str(Path(dep["key"]).expanduser()),
    }


# === SSH wrapper ===
#
# stdin=DEVNULL is load-bearing -- without it, the child ssh process can swallow
# bytes from our parent's stdin, breaking the watcher thread's interaction with
# the input loop. PoC Bug-D/E candidates trace partly to this issue when
# subprocess hasn't been shielded.

def ssh_exec(cfg: dict, remote_script: str, timeout: float = 30.0) -> tuple[int, str, str]:
    """Run a base64-shipped shell snippet on the remote. Returns (returncode, stdout, stderr).

    The b64 shipping convention is inherited from the PowerShell PoC and survives
    every quoting layer (Windows arg-passing, OpenSSH transport, remote bash).
    """
    b64 = base64.b64encode(remote_script.encode("utf-8")).decode("ascii")
    remote_cmd = f"echo {b64} | base64 -d | bash"
    args = [
        "ssh",
        "-i", cfg["key"],
        "-p", str(cfg["port"]),
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "BatchMode=yes",
        f"{cfg['user']}@{cfg['host']}",
        remote_cmd,
    ]
    proc = subprocess.run(
        args,
        stdin=subprocess.DEVNULL,
        capture_output=True,
        timeout=timeout,
    )
    return (proc.returncode, proc.stdout.decode("utf-8", errors="replace"),
            proc.stderr.decode("utf-8", errors="replace"))


# === Remote primitives ===

REMOTE_TEAM_DIR = "~/.claude/teams/apex-research"
REMOTE_CONFIG = f"{REMOTE_TEAM_DIR}/config.json"


def remote_own_inbox(name: str) -> str:
    return f"{REMOTE_TEAM_DIR}/inboxes/{name}.json"


# Atomic-write primitive ported as-is from PoC (SF-4 substrate finding):
# read-modify-write under fcntl.flock(LOCK_EX), single ssh roundtrip, process-atomic.
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


# Read+mark-read primitive: fetch the inbox, return any messages with read:false
# AS NDJSON, then flip their read flag in the file under flock. The "fetch-and-mark"
# happens in a single round trip to keep the ssh-cost down and avoid races where
# apex writes a new message between our fetch and our mark-call.
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


LIST_MEMBERS_SCRIPT = (
    "jq -r '.members[] | \"\\(.name) :: agentType=\\(.agentType // \"-\") "
    "backendType=\\(.backendType // \"-\")\"' " + REMOTE_CONFIG
)


# === Display ===

console_lock = threading.Lock()


def write(text: str = "", end: str = "\n", flush: bool = True) -> None:
    """Console write under lock -- watcher and main loop both write."""
    with console_lock:
        sys.stdout.write(text + end)
        if flush:
            sys.stdout.flush()


def write_prompt(name: str, buffer: str = "") -> None:
    with console_lock:
        sys.stdout.write(f"{C_YELLOW}{name}> {C_RESET}{buffer}")
        sys.stdout.flush()


def show_message(msg: dict) -> None:
    try:
        ts_str = msg.get("timestamp", "")
        # Try parse ISO-8601 with Z; fall back to printing raw if parse fails.
        try:
            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00")).astimezone()
            ts_disp = ts.strftime("%H:%M:%S")
        except Exception:
            ts_disp = ts_str
        from_field = msg.get("from", "?")
        summary = msg.get("summary", "")
        text = msg.get("text", "")
        with console_lock:
            sys.stdout.write("\n")
            sys.stdout.write(f"{C_CYAN}[{ts_disp}] <{from_field}>{C_RESET}")
            if summary:
                sys.stdout.write(f" {C_DARKCYAN}({summary}){C_RESET}")
            sys.stdout.write(f"\n{text}\n\n")
            sys.stdout.flush()
    except Exception as e:
        write(f"{C_RED}[malformed message]{C_RESET} {e}: {msg!r}")


# === Watcher thread ===

class Watcher(threading.Thread):
    """Background thread polling own inbox every WATCH_INTERVAL_S seconds.

    Each poll fetches unread (read:false) messages and marks them read in the
    same ssh round-trip. Display happens under console_lock so the main thread's
    prompt redraw won't interleave.
    """

    def __init__(self, cfg: dict, name: str, on_messages: callable):
        super().__init__(daemon=True)
        self.cfg = cfg
        self.name = name
        self.on_messages = on_messages
        self.stop_event = threading.Event()

    def run(self) -> None:
        inbox = remote_own_inbox(self.name)
        script = (FETCH_AND_MARK_READ_SCRIPT
                  .replace("__INBOX_PATH_REPR__", repr(inbox)))
        while not self.stop_event.is_set():
            rc, stdout, stderr = ssh_exec(self.cfg, script)
            if rc == 0 and stdout.strip():
                msgs = []
                for line in stdout.splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        msgs.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass
                if msgs:
                    self.on_messages(msgs)
            elif rc != 0:
                # Don't spam the user; first error is enough then back off.
                write(f"{C_RED}[watcher ssh rc={rc}]{C_RESET} {stderr.strip()[:200]}")
            self.stop_event.wait(WATCH_INTERVAL_S)


# === Commands ===

def fetch_members(cfg: dict) -> tuple[list[str], str | None]:
    """Return (member_names, error). On success error is None.

    Shared between F1 pre-flight and the modal list-mode UI; consolidates the
    ssh+jq lookup so we don't drift two copies.
    """
    rc, stdout, stderr = ssh_exec(cfg, LIST_MEMBERS_SCRIPT)
    if rc != 0:
        return ([], f"ssh rc={rc}: {stderr.strip()[:200]}")
    names = [ln.split(" ::")[0].strip() for ln in stdout.splitlines() if " :: " in ln]
    return (names, None)


def send_line(cfg: dict, name: str, target: str, body: str) -> None:
    if not body:
        return
    # Build envelope. Omit `color` field -- SF-3 contract: let apex apply the
    # registered-color. Including a per-message color override caused the
    # cosmetic-anomaly observed in PoC.
    now = datetime.now(timezone.utc)
    ts = f"{now.strftime('%Y-%m-%dT%H:%M:%S')}.{now.microsecond // 1000:03d}Z"
    msg = {
        "from": name,
        "text": body,
        "summary": body[:60],
        "timestamp": ts,
        "read": False,
    }
    msg_b64 = base64.b64encode(json.dumps(msg, ensure_ascii=False).encode("utf-8")).decode("ascii")
    inbox = f"{REMOTE_TEAM_DIR}/inboxes/{target}.json"
    script = (APPEND_INBOX_SCRIPT
              .replace("__INBOX_PATH_REPR__", repr(inbox))
              .replace("__MSG_B64_REPR__", repr(msg_b64)))

    t0 = time.monotonic()
    rc, stdout, stderr = ssh_exec(cfg, script)
    elapsed_ms = int((time.monotonic() - t0) * 1000)

    if rc == 0 and "OK" in stdout:
        write(f"  {C_GRAY}-> {target}  ({elapsed_ms} ms){C_RESET}")
    else:
        write(f"  {C_RED}-> {target}  FAILED (rc={rc}): {stderr.strip()[:200]}{C_RESET}")


# === Non-blocking input ===
#
# select.select() works on Linux/macOS stdin but NOT on Windows. msvcrt is the
# Windows-Python idiom (kbhit + getwch). We branch at module load.

if sys.platform == "win32":
    import msvcrt

    def read_one_char(timeout_s: float) -> str | None:
        """Return next char (or None on timeout). Windows version."""
        deadline = time.monotonic() + timeout_s
        while time.monotonic() < deadline:
            if msvcrt.kbhit():
                ch = msvcrt.getwch()
                return ch
            time.sleep(0.02)
        return None

    def classify_key(ch: str) -> str:
        """Translate a raw char into a logical key token.

        Returns one of: 'UP','DOWN','LEFT','RIGHT','ESC','ENTER','BACKSPACE',
        'CTRLC','TAB', or the original char for ordinary printables.
        Windows arrow-key prefix is '\\xe0' or '\\x00' followed by a code byte.
        The OS guarantees the code byte follows the prefix immediately, so we
        block on getwch() rather than gating on kbhit() (which can transiently
        report empty between the two reads and cause the code byte to leak
        into the next read_one_char as a bare printable).
        """
        if ch in ("\xe0", "\x00"):
            code = msvcrt.getwch()  # second byte always follows the special-key prefix
            return {"H": "UP", "P": "DOWN", "K": "LEFT", "M": "RIGHT"}.get(code, "")
        if ch == "\x1b":
            return "ESC"
        if ch in ("\r", "\n"):
            return "ENTER"
        if ch in ("\b", "\x7f"):
            return "BACKSPACE"
        if ch == "\x03":
            return "CTRLC"
        if ch == "\t":
            return "TAB"
        return ch
else:
    import select

    def read_one_char(timeout_s: float) -> str | None:
        r, _, _ = select.select([sys.stdin], [], [], timeout_s)
        if r:
            return sys.stdin.read(1)
        return None

    def classify_key(ch: str) -> str:
        """POSIX: an Esc may be a lone Esc OR the lead of an ANSI '\\x1b[X' sequence.
        Disambiguate via select-with-zero-timeout: no follow-up byte = lone Esc.
        """
        if ch == "\x1b":
            r, _, _ = select.select([sys.stdin], [], [], 0.05)
            if not r:
                return "ESC"
            nxt = sys.stdin.read(1)
            if nxt != "[":
                return "ESC"
            r2, _, _ = select.select([sys.stdin], [], [], 0.05)
            if not r2:
                return "ESC"
            code = sys.stdin.read(1)
            return {"A": "UP", "B": "DOWN", "D": "LEFT", "C": "RIGHT"}.get(code, "")
        if ch in ("\r", "\n"):
            return "ENTER"
        if ch in ("\b", "\x7f"):
            return "BACKSPACE"
        if ch == "\x03":
            return "CTRLC"
        if ch == "\t":
            return "TAB"
        return ch


# === Modal list-mode (Down-arrow target picker) ===
#
# Console-lock strategy: we hold `console_lock` for the entire duration of
# list mode. The watcher thread blocks on its own writes until we release;
# any messages that arrived will print after we tear the list down and
# redraw the prompt + preserved buffer. Simpler than cursor-save/restore
# above-the-list rendering, and sufficient for sketch grade.

def run_list_mode(cfg: dict, name: str, current_target: str) -> str | None:
    """Show the member list with cursor + active-target highlight.

    Returns the newly chosen target (str) on Enter, or None on Esc/cancel.
    Caller is responsible for redrawing the prompt + typing buffer afterward.
    """
    members, err = fetch_members(cfg)
    if err is not None:
        write(f"{C_RED}member fetch failed: {err}{C_RESET}")
        return None
    if not members:
        write(f"{C_YELLOW}No members found on apex.{C_RESET}")
        return None

    # Start cursor at the current target if present, else top.
    try:
        cursor = members.index(current_target) if current_target else 0
    except ValueError:
        cursor = 0

    def render(first: bool) -> None:
        # Erase prompt line (or previously-rendered list) and draw fresh.
        # On `first`, we clear the current prompt line; on redraws we move
        # back up over the previously drawn list + header before clearing.
        if first:
            sys.stdout.write("\r\033[K")
        else:
            # Move cursor up past header + N member lines and clear each.
            sys.stdout.write(f"\033[{len(members) + 1}A")
        sys.stdout.write(f"\033[2K{C_GRAY}-- target picker: Up/Down, Enter=set, Esc=cancel --{C_RESET}\n")
        for i, m in enumerate(members):
            sys.stdout.write("\033[2K")
            is_active = (m == current_target)
            is_cursor = (i == cursor)
            prefix = "> " if is_cursor else "  "
            if is_cursor and is_active:
                sys.stdout.write(f"\033[7m{C_CYAN}{prefix}{m}{C_RESET}\n")
            elif is_cursor:
                sys.stdout.write(f"\033[7m{prefix}{m}\033[0m\n")
            elif is_active:
                sys.stdout.write(f"{C_CYAN}{prefix}{m}{C_RESET}\n")
            else:
                sys.stdout.write(f"{prefix}{m}\n")
        sys.stdout.flush()

    # Hold the console lock across the whole modal interaction.
    console_lock.acquire()
    try:
        render(first=True)
        while True:
            ch = read_one_char(0.5)
            if ch is None:
                continue
            key = classify_key(ch)
            if key == "UP":
                if cursor > 0:
                    cursor -= 1
                    render(first=False)
            elif key == "DOWN":
                if cursor < len(members) - 1:
                    cursor += 1
                    render(first=False)
            elif key == "ENTER":
                # Tear down the list area before returning so caller's prompt
                # redraw starts on a clean line.
                sys.stdout.write(f"\033[{len(members) + 1}A")
                for _ in range(len(members) + 1):
                    sys.stdout.write("\033[2K\n")
                sys.stdout.write(f"\033[{len(members) + 1}A")
                sys.stdout.flush()
                return members[cursor]
            elif key in ("ESC", "CTRLC"):
                sys.stdout.write(f"\033[{len(members) + 1}A")
                for _ in range(len(members) + 1):
                    sys.stdout.write("\033[2K\n")
                sys.stdout.write(f"\033[{len(members) + 1}A")
                sys.stdout.flush()
                return None
            # Ignore other keys while modal -- sketch-grade.
    finally:
        console_lock.release()


# === Main loop ===

def main() -> int:
    parser = argparse.ArgumentParser(description="ghost-chat -- RFC #66 cross-host PoC")
    parser.add_argument("--name", "-n", help="ghost name registered on apex side")
    parser.add_argument("--target", "-t", default="", help="initial send target")
    parser.add_argument("posname", nargs="?", help="positional ghost name (fallback)")
    parser.add_argument("postarget", nargs="?", help="positional initial target (fallback)")
    args = parser.parse_args()

    name = args.name or args.posname
    if not name:
        parser.error("ghost name is required (--name or positional)")
    target = args.target or args.postarget or ""

    cfg = load_ssh_config()

    write()
    write(f"{C_CYAN}ghost-chat PoC -- RFC #66 cross-host verification (Python){C_RESET}")
    write(f"  {C_GRAY}ghost name : {name}{C_RESET}")
    write(f"  {C_GRAY}apex ssh   : {cfg['user']}@{cfg['host']}:{cfg['port']}{C_RESET}")
    write(f"  {C_GRAY}own inbox  : {remote_own_inbox(name)}{C_RESET}")
    target_disp = target if target else "(unset -- press Down to pick)"
    write(f"  {C_GRAY}target     : {target_disp}{C_RESET}")
    write()
    write(f"{C_GRAY}Down=pick target  Enter=send  /exit=quit{C_RESET}")
    write()

    # F1 pre-flight: confirm ghost is in members[].
    member_names, err = fetch_members(cfg)
    if err is None:
        if name in member_names:
            write(f"{C_GREEN}F1 OK: '{name}' is registered in apex members[].{C_RESET}")
        else:
            write(f"{C_YELLOW}WARNING: '{name}' NOT in apex members[]. F1 not satisfied.{C_RESET}")
            write(f"{C_YELLOW}  Ask apex team-lead to register before sends (RFC #66 one-sided ACL).{C_RESET}")
    else:
        write(f"{C_RED}F1 check FAILED -- {err}{C_RESET}")
    write()

    # State held in mutable cell so the watcher callback can read target without
    # cross-thread mutation pain on a primitive.
    state = {"target": target, "buffer": ""}

    def on_new_messages(msgs: list[dict]) -> None:
        # Called from watcher thread. Acquire console_lock implicitly via write helpers.
        # We don't redraw the prompt here -- let the next user keypress trigger redraw,
        # or the input loop's idle tick will redraw after WATCH_INTERVAL_S.
        with console_lock:
            sys.stdout.write("\r\033[K")  # carriage-return + ANSI erase-to-end-of-line
            sys.stdout.flush()
        for m in msgs:
            show_message(m)
        # Redraw prompt + in-progress buffer so user keeps typing seamlessly.
        write_prompt(name, state["buffer"])

    watcher = Watcher(cfg, name, on_new_messages)
    watcher.start()

    write_prompt(name, state["buffer"])

    try:
        while True:
            ch = read_one_char(0.1)
            if ch is None:
                continue

            key = classify_key(ch)

            if key == "ENTER":
                line = state["buffer"]
                state["buffer"] = ""
                with console_lock:
                    sys.stdout.write("\n")
                    sys.stdout.flush()

                if line:
                    trimmed = line.strip()
                    if trimmed == "/exit":
                        write(f"{C_GRAY}Exiting. (Ghost persists on apex per PO-managed registration.){C_RESET}")
                        break
                    elif trimmed.startswith("/"):
                        write(f"{C_RED}Unknown command: {trimmed}{C_RESET}")
                    else:
                        if not state["target"]:
                            write(f"{C_RED}ERROR: No target set. Press Down to pick one.{C_RESET}")
                        else:
                            send_line(cfg, name, state["target"], line)

                write_prompt(name, state["buffer"])

            elif key == "DOWN":
                # Modal list-mode. Buffer is preserved across; we only redraw
                # the prompt + restored buffer after the modal closes.
                chosen = run_list_mode(cfg, name, state["target"])
                if chosen is not None:
                    state["target"] = chosen
                    write(f"{C_YELLOW}Target set to: {state['target']}{C_RESET}")
                write_prompt(name, state["buffer"])

            elif key == "BACKSPACE":
                if state["buffer"]:
                    state["buffer"] = state["buffer"][:-1]
                    with console_lock:
                        sys.stdout.write("\b \b")
                        sys.stdout.flush()

            elif key == "CTRLC":
                write(f"\n{C_GRAY}Interrupted.{C_RESET}")
                break

            elif key in ("UP", "LEFT", "RIGHT", "ESC", ""):
                # Swallow -- no semantics outside list-mode. Sketch grade.
                pass

            elif key == "TAB" or (len(key) == 1 and key.isprintable()):
                state["buffer"] += key
                with console_lock:
                    sys.stdout.write(key)
                    sys.stdout.flush()

    finally:
        watcher.stop_event.set()

    return 0


if __name__ == "__main__":
    sys.exit(main())
