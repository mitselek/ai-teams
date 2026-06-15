# ghost-bridge — team-lead cross-host comms daemon (v1)

> **[DECOMMISSIONED 2026-06-15 — SUPERSEDED BY stationmaster]**
> The ghost-bridge v2 daemon is decommissioned. Its single-process-per-pair design was a no-supervisor SPOF: on the dev box the daemon died (stale PID 36772) and the FR⇄apex route went dark with no automatic recovery, while its read-flag-flip-on-forward + re-forward-on-restart caused the 5x/8x/4x duplicate-delivery bursts (2026-06-10 dupe-root-cause exchange; old registered outbox name = 4x vs fresh never-registered name = 1x controlled comparison). Those failure modes are exactly what motivated the **stationmaster** post-office hub (SSH-forced-command + durable custody + delete-on-collect + at-least-once-with-dedup). See `stationmaster-protocol.md`, `stationmaster-onboarding.md`, `stationmaster-courier.py`.
> At decommission: PID 36772 was already dead; v2 carried **no live traffic** — `fr-apex` was already migrated to stationmaster grants (no-op), and `fr-hr-devs` had only a week-old read test-ping inbound + a never-created outbox (`fr-hr-devs` deferred until hr-devs onboards as a hub customer). The config/scripts below are retained as the v2 record and the "why we built the hub" artifact; the runtime pidfile was removed.
> (*FR:Herald*)

Sketch-grade reference implementation of `SPEC.md` (this directory). Generalizes the S31 RFC #66 PoC (`../ghost-member-cli/ghost-chat.py`) into a long-running daemon that bridges Aen (FR team-lead) <-> Schliemann (apex-research team-lead).

One pair per process (v1 scope). Outbound forwards FR-local outbox -> remote inbox via SSH; inbound fetches remote outbox -> FR-local inbox via SSH. Each direction runs once per polling cycle (default 2.0s).

## Files

| File | Purpose |
|---|---|
| `SPEC.md` | The full design. Read before editing code. |
| `ghost-bridge.py` | The daemon. Stdlib only, Python 3.7+. |
| `ghost-bridge.config.example.json` | Config template. Copy and edit. |
| `ghost-bridge.config.json` | Live config. **gitignored.** |
| `start-ghost-bridge.sh` | Launch in background. Refuses if alive PID file exists. |
| `stop-ghost-bridge.sh` | SIGTERM, 5s grace, SIGKILL fallback. |
| `ghost-bridge.pid` | Runtime PID file. **gitignored.** |
| `ghost-bridge.log` | Runtime log file. **gitignored.** Truncated at each daemon start. |

## Prerequisites

1. **`~/bin/rc-deployments.json`** with an `apex-research` deployment entry. Same registry the PoC uses.
2. **SSH key + auth** pre-configured for the user invoking the daemon. The PoC's existing setup is reused.
3. **Python 3.7+** on the FR host (the daemon's host). `python3` preferred; `python` accepted as fallback.
4. **Apex-side prerequisites** per SPEC § Apex-side prerequisites — `fr-lead-ghost` member entry in apex's `roster.json`, then a fresh apex session so apex's harness creates `inboxes/fr-lead-ghost.json`.
5. **FR-side roster entry** for `apex-lead-ghost` per SPEC § Components. Restart FR's session so the harness creates `$HOME/.claude/teams/framework-research/inboxes/apex-lead-ghost.json`.

## Install

Nothing to install. The daemon uses only the Python standard library and standard SSH from the system PATH.

```bash
cd teams/framework-research/poc/ghost-bridge
cp ghost-bridge.config.example.json ghost-bridge.config.json
# Edit ghost-bridge.config.json if your pair/aliases differ from the defaults
chmod +x start-ghost-bridge.sh stop-ghost-bridge.sh
```

## Start / stop

```bash
./start-ghost-bridge.sh   # launches in background, writes ghost-bridge.pid
./stop-ghost-bridge.sh    # SIGTERM, waits 5s, SIGKILL if needed
```

The daemon truncates `ghost-bridge.log` at every start. Tail it during the session:

```bash
tail -f ghost-bridge.log
```

## Test path (team-lead validation)

Run these in order against a real apex session that has `fr-lead-ghost` set up. Substitute your actual paths if not running from the canonical FR repo root.

### Smoke: daemon survives idle

```bash
cd teams/framework-research/poc/ghost-bridge
cp ghost-bridge.config.example.json ghost-bridge.config.json
./start-ghost-bridge.sh
sleep 60
# Daemon should still be alive:
kill -0 "$(cat ghost-bridge.pid)" && echo "ALIVE"
tail -20 ghost-bridge.log
# Should see startup line + no errors.
./stop-ghost-bridge.sh
```

### Outbound: FR -> apex

```bash
# With the daemon running:
./start-ghost-bridge.sh

# Manually drop a test message into FR-local outbox:
INBOX="$HOME/.claude/teams/framework-research/inboxes/apex-lead-ghost.json"
TS="$(python3 -c 'from datetime import datetime,timezone; n=datetime.now(timezone.utc); print(f"{n.strftime(\"%Y-%m-%dT%H:%M:%S\")}.{n.microsecond//1000:03d}Z")')"
python3 -c "
import json, os
p = os.path.expanduser('$INBOX')
arr = json.load(open(p)) if os.path.exists(p) and open(p).read().strip() else []
arr.append({'from':'team-lead','text':'ghost-bridge outbound smoke test','summary':'smoke','timestamp':'$TS','read':False})
json.dump(arr, open(p,'w'), ensure_ascii=False)
print('appended to', p)
"

# Within ~3s:
#   - the FR-local entry's `read` flag should flip to true
#   - apex's ~/.claude/teams/apex-research/inboxes/team-lead.json gains an entry
#     with from=fr-lead-ghost, read:false
# Check FR-local:
python3 -c "import json; print(json.load(open('$INBOX'))[-1])"
# Check apex (via ssh):
ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@<apex-host> \
  "tail -c 600 ~/.claude/teams/apex-research/inboxes/team-lead.json"

tail -20 ghost-bridge.log
./stop-ghost-bridge.sh
```

### Inbound: apex -> FR

```bash
./start-ghost-bridge.sh

# Drop a test message into apex's outbox (the FR-bound one):
ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@<apex-host> "
python3 - <<'PY'
import json, os, fcntl
p = os.path.expanduser('~/.claude/teams/apex-research/inboxes/fr-lead-ghost.json')
fd = os.open(p, os.O_RDWR|os.O_CREAT, 0o644)
fcntl.flock(fd, fcntl.LOCK_EX)
raw = os.read(fd, 1<<24).decode('utf-8') or '[]'
arr = json.loads(raw) if raw.strip() else []
arr.append({'from':'team-lead','text':'ghost-bridge inbound smoke','summary':'smoke','timestamp':'2026-05-14T00:00:00.000Z','read':False})
os.lseek(fd,0,0); os.ftruncate(fd,0); os.write(fd, json.dumps(arr, ensure_ascii=False).encode())
fcntl.flock(fd, fcntl.LOCK_UN); os.close(fd)
PY
"

# Within ~3s:
#   - apex-side flag flips to read:true
#   - FR-local ~/.claude/teams/framework-research/inboxes/team-lead.json gains
#     an entry with from=apex-lead-ghost, read:false
python3 -c "import json,os; p=os.path.expanduser('~/.claude/teams/framework-research/inboxes/team-lead.json'); print(json.load(open(p))[-1])"

tail -20 ghost-bridge.log
./stop-ghost-bridge.sh
```

### Clean shutdown

```bash
./start-ghost-bridge.sh
sleep 3
./stop-ghost-bridge.sh
# Expect:
#   - "ghost-bridge stopped cleanly." from stop script
#   - ghost-bridge.pid removed
#   - tail of ghost-bridge.log shows "signal 15 received" + summary line
ls ghost-bridge.pid 2>/dev/null && echo "BAD: pid file lingered" || echo "OK: pid file gone"
```

## Reading the log

Lines are `<ISO-UTC-timestamp> [LEVEL] <msg>`. Levels: `INFO`, `WARN`, `ERROR`.

Useful greps:

```bash
grep "forwarded ->" ghost-bridge.log   # outbound deliveries
grep "received <-"  ghost-bridge.log   # inbound deliveries
grep -E "ERROR|WARN" ghost-bridge.log  # all anomalies
```

## Windows local-dev caveats

Validated end-to-end on 2026-05-14 with FR on Windows-Git-Bash + apex on Linux container. The daemon's data plane works correctly; setup + control plane each have known substrate frictions on this combination. These are **local-dev only**, not framework findings — Linux deploy substrate behaves as designed.

### SSH-key setup gotchas (setup-time)

Both surface as `Permission denied (publickey)` despite the key apparently being correct. Discovered by Aleksandr Lerko (apex-side peer) during his 2026-05-15 Win11 bring-up.

1. **PowerShell empty-passphrase trap.** `ssh-keygen -N '""'` (the natural-looking PowerShell quoting) creates a passphrase-protected key with literal `""` as the passphrase, not an empty-passphrase key. Use `ssh-keygen -N ''` instead. Diagnostic via `ssh -vv`: `Server accepts key` immediately followed by `Permission denied (publickey)` fingerprints this (privkey-load-failed, distinct from key-not-in-authorized_keys). Recovery: `ssh-keygen -p -P '""' -N '' -f <keyfile>`.

2. **CRLF in `.pub` file.** Windows `ssh-keygen` writes `\r\n` line endings; sshd's `authorized_keys` parser does not tolerate trailing `\r`. If the pubkey is copy-pasted via Notepad / PowerShell / a gist / etc., `Permission denied (publickey)` results — and the fingerprint matches, making this counter-intuitive. Recovery on the remote side: `sed -i 's/\r$//' ~/.ssh/authorized_keys`.

### Daemon-runtime frictions (Git-Bash-specific)

3. **Win32 vs POSIX PID mismatch.** Python's `os.getpid()` returns the Win32 PID; MSYS `kill -0` / `ps -ef` operate on POSIX PIDs. The daemon writes its Win32 PID to `ghost-bridge.pid`; `stop-ghost-bridge.sh` checks via MSYS → "not alive" → removes the PID file as stale → daemon keeps running. **Workaround:**
   ```bash
   ps -ef | grep '[g]host-bridge.py' | awk '{print $2}' | xargs -r kill -TERM
   ```

4. **SIGTERM via MSYS doesn't run Python's `finally`.** The graceful-shutdown log line (`ghost-bridge stopping — cycles=N forwarded=N received=N`) doesn't get written. The process IS terminated; just no closing log. Last line of `ghost-bridge.log` will be the most recent message event, not a shutdown summary.

All four behave correctly on Linux/Ubuntu substrate (the framework's target deploy environment).

## Known limitations (v1)

Inherited from `SPEC.md § Known limitations`:

1. **No supervisor.** Daemon dies -> all comms stop until restart.
2. **Race on FR-local read-flag flip.** No fcntl on FR-side. Rare but possible.
3. **No backpressure.** Unbounded growth if apex unreachable for long.
4. **Polling latency.** Up to 2s reply-arrival latency.
5. **Sender-rewrite drops original sender.** By design for v1.
6. **Single-pair coded.** Config supports list; code handles `pairs[0]`. Additional pairs logged as a WARN at startup and ignored.

## Architecture notes (cross-reference to SPEC)

- Reuses `APPEND_INBOX_SCRIPT` and `FETCH_AND_MARK_READ_SCRIPT` from `../ghost-member-cli/ghost-chat.py` verbatim — SF-4 substrate-validated.
- No `color` field on forwarded envelopes (SF-3 contract).
- FR-local file ops use plain `open()` / `json.load`/`json.dump` (SPEC § Substrate invariants accepts Known limitation #2 for v1).
- Path resolution uses `pathlib.Path.home()` — works on Windows + POSIX.
- Empty / missing remote inbox file: skip with one log line, retry next cycle (SPEC § Open decisions #2).
- Log rotation: truncate at every daemon start (SPEC § Open decisions #1).
- PID file location: script-adjacent (SPEC § Open decisions #3).

---

(*FR:Aen via coding-subagent*)
