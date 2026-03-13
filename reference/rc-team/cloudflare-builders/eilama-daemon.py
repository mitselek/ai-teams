#!/usr/bin/env python3
"""
Eilama daemon — polls eilama inbox, forwards tasks to ollama, replies to requester.

Usage:
    python3 eilama-daemon.py &

Reads:  ~/.claude/teams/cloudflare-builders/inboxes/eilama.json  (every 2s)
Writes: ~/.claude/teams/cloudflare-builders/inboxes/<requester>.json
Model:  codellama:13b-instruct via http://localhost:11434
"""

import json
import time
import datetime
import pathlib
import urllib.request
import urllib.error

# ── Paths ─────────────────────────────────────────────────────────────────────

DAEMON_DIR = pathlib.Path(__file__).parent
INBOXES    = pathlib.Path("~/.claude/teams/cloudflare-builders/inboxes").expanduser()
MY_INBOX   = INBOXES / "eilama.json"
PROMPT_PATH = DAEMON_DIR / "prompts" / "eilama.md"

# ── Config ────────────────────────────────────────────────────────────────────

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL      = "codellama:13b-instruct"
POLL_SEC   = 2
TIMEOUT    = 120

# ── State ─────────────────────────────────────────────────────────────────────

seen_ids: set[str] = set()


def load_system_prompt() -> str:
    try:
        return PROMPT_PATH.read_text(encoding="utf-8")
    except OSError as e:
        print(f"[eilama] WARNING: could not read system prompt: {e}")
        return "You are Eilama, a code scaffold specialist. Generate boilerplate code."


def is_idle_notification(msg: dict) -> bool:
    """Skip idle_notification messages — they have 'idle_notification' in their text JSON."""
    text = msg.get("text", "")
    return isinstance(text, str) and '"idle_notification"' in text


def msg_id(msg: dict) -> str:
    return f"{msg.get('timestamp', '')}/{msg.get('from', '')}"


def call_ollama(prompt: str, system: str) -> str:
    payload = json.dumps({
        "model":   MODEL,
        "system":  system,
        "prompt":  prompt,
        "stream":  False,
        "options": {"num_ctx": 4096, "temperature": 0.1},
    }).encode("utf-8")

    req = urllib.request.Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["response"]


def reply(to: str, text: str) -> None:
    inbox = INBOXES / f"{to}.json"
    try:
        msgs = json.loads(inbox.read_text(encoding="utf-8")) if inbox.exists() else []
    except (OSError, json.JSONDecodeError):
        msgs = []

    msgs.append({
        "from":      "eilama",
        "to":        to,
        "text":      text,
        "summary":   text[:60],
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "color":     "yellow",
        "read":      False,
    })
    inbox.write_text(json.dumps(msgs, indent=2), encoding="utf-8")


def process_message(msg: dict, system: str) -> None:
    sender = msg.get("from", "unknown")
    text   = msg.get("text", "").strip()

    print(f"[eilama] task from {sender}: {text[:80]}…")
    try:
        response = call_ollama(text, system)
        reply(sender, f"[eilama]\n\n{response}")
        print(f"[eilama] replied to {sender}")
    except urllib.error.URLError as e:
        error_text = f"[eilama] ERROR: ollama unreachable — {e.reason}"
        print(error_text)
        reply(sender, error_text)
    except Exception as e:  # noqa: BLE001
        error_text = f"[eilama] ERROR: {e}"
        print(error_text)
        reply(sender, error_text)


def poll_once(system: str) -> None:
    if not MY_INBOX.exists():
        return
    try:
        msgs = json.loads(MY_INBOX.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return

    for msg in msgs:
        mid = msg_id(msg)
        if mid in seen_ids:
            continue
        seen_ids.add(mid)

        if is_idle_notification(msg):
            continue

        process_message(msg, system)


def main() -> None:
    # Ensure inbox exists
    INBOXES.mkdir(parents=True, exist_ok=True)
    if not MY_INBOX.exists():
        MY_INBOX.write_text("[]", encoding="utf-8")

    system = load_system_prompt()
    print(f"[eilama] daemon started — model={MODEL}, poll={POLL_SEC}s")
    print(f"[eilama] inbox: {MY_INBOX}")

    while True:
        poll_once(system)
        time.sleep(POLL_SEC)


if __name__ == "__main__":
    main()
