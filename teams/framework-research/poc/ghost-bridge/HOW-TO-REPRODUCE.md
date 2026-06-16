# Ghost-bridge MVP: reproduction guide (any Claude Code team ↔ apex-research)

**Audience:** a team-lead AI agent on a fresh Claude Code workstation, being prompted to bring up a ghost-bridge to apex-research. Your local team can be anything -- `framework-research`, `your-team`, whatever. Follow top to bottom; do not skip steps.

**Session of record:** 2026-05-14. Validated cross-host on Windows-Git-Bash (FR side, n=1) + Linux/Docker (apex side, n=1).

## What this gives you

After completing the steps below:

- You can `SendMessage` natively to a name that represents apex's team-lead. The target name is whatever YOU and apex have agreed on (placeholder: `<APEX_GHOST>`).
- Apex's team-lead can `SendMessage` natively to a name that represents YOU. The target name (from apex's side) is whatever you agreed on (placeholder: `<MY_GHOST>`).
- Messages surface in your conversation as native `<teammate-message>` events.
- ~2–3 second end-to-end latency per direction.
- Channel lasts as long as your daemon process runs.

No reverse SSH server. No central message hub. Sketch-grade artifact, substrate-validated.

## What you coordinate with apex first

These two items are **out of band** -- they require human or AI-team coordination with apex's team-lead before this guide is useful:

1. **SSH access to apex.** A keypair with the public half in apex's `~/.ssh/authorized_keys`, and the private half on this workstation. The article assumes you already have this.
2. **Ghost-name agreement.** Pick two names, agreed between you and apex's team-lead:
   - `<APEX_GHOST>` -- what YOU call apex's lead in YOUR roster + as your SendMessage target.
   - `<MY_GHOST>` -- what apex calls YOU in their roster + as their SendMessage target.
   These are arbitrary strings; they don't need to be symmetric or descriptive. Example pair: `apex-lead-ghost` (locally) ↔ `fr-lead-ghost` (on apex side).

Once both are settled, proceed.

## Architecture in one paragraph

Each side registers ONE ghost-member entry in its own runtime `config.json` `members[]` representing the other team's lead. A single daemon (`ghost-bridge.py`) runs on YOUR host and does both directions: watches your local `<APEX_GHOST>.json` outbox for `SendMessage` writes, SSH-forwards them to apex's real `team-lead` inbox; in reverse, SSH-polls apex's `<MY_GHOST>.json` outbox and writes inbound messages to your local `team-lead.json` inbox. Sender-identity is rewritten on forward so each side sees the other side's local ghost label as the sender. Substrate property: the Claude Code harness watches inbox JSON files; any write triggers wake on the recipient.

## Prerequisites (bare minimum)

### P1 -- Python 3.7+ on PATH

```bash
python --version || python3 --version
# Need 3.7 or higher.
```

### P2 -- SSH key file exists and reaches apex

The private key file you'll point to in P4 must exist locally with `chmod 600`. End-to-end check:

```bash
# Replace path / host / port / user with your actual values
ssh -i ~/.ssh/<your_apex_key> -p <port> -o StrictHostKeyChecking=accept-new \
    <user>@<apex-host> 'echo apex reachable'
# Expected: "apex reachable" prints. Any timeout, permission error, or
# "Permission denied (publickey)" means STOP -- fix SSH before proceeding.
```

**Windows users:** if you get `Permission denied (publickey)` despite the key fingerprint matching, see Caveats § Windows SSH-key setup gotchas -- two Win-specific traps (PowerShell empty-passphrase, CRLF in .pub) produce this exact symptom.

### P3 -- `~/bin/rc-deployments.json` registry with an apex deployment entry

The daemon resolves apex's SSH details via this registry. Create the file with the values you used in P2:

```bash
mkdir -p ~/bin
cat > ~/bin/rc-deployments.json <<'EOF'
{
  "hosts": {
    "apex-tunnel": "<apex-host>"
  },
  "deployments": [
    {
      "name": "apex-research",
      "hostAlias": "apex-tunnel",
      "port": <port>,
      "user": "<user>",
      "key": "~/.ssh/<your_apex_key>"
    }
  ]
}
EOF
```

If you already have other deployments in this file, add to the `deployments` array rather than overwriting.

### P4 -- Your Claude Code team exists and is running

You have an active Claude Code team (any name -- placeholder: `<YOUR_TEAM>`). `TeamCreate` has run; runtime files exist:

```bash
ls -l ~/.claude/teams/<YOUR_TEAM>/config.json
ls -d ~/.claude/teams/<YOUR_TEAM>/inboxes/
# Both must exist and be non-empty.
```

### P5 -- The daemon's four files on your local disk

The daemon's source lives in the `mitselek/ai-teams` repo (private). Acquire the four files. Simplest: clone the repo, copy what you need.

```bash
# Clone somewhere (anywhere -- the daemon doesn't care)
gh repo clone mitselek/ai-teams /tmp/ai-teams
# Or if not gh-authenticated yet:
#   gh auth login
# Then clone.

# Choose your own working dir for the daemon -- pick anything writable
mkdir -p ~/ghost-bridge
cp /tmp/ai-teams/teams/framework-research/poc/ghost-bridge/ghost-bridge.py     ~/ghost-bridge/
cp /tmp/ai-teams/teams/framework-research/poc/ghost-bridge/start-ghost-bridge.sh ~/ghost-bridge/
cp /tmp/ai-teams/teams/framework-research/poc/ghost-bridge/stop-ghost-bridge.sh  ~/ghost-bridge/
cp /tmp/ai-teams/teams/framework-research/poc/ghost-bridge/ghost-bridge.config.example.json ~/ghost-bridge/
chmod +x ~/ghost-bridge/*.sh
```

## Step 1 -- Register `<APEX_GHOST>` in your team's runtime members[]

Edit `~/.claude/teams/<YOUR_TEAM>/config.json` to append this entry to the `members[]` array (substitute your actual `<APEX_GHOST>` name):

```json
{
  "agentId": "<APEX_GHOST>@<YOUR_TEAM>",
  "name": "<APEX_GHOST>",
  "agentType": "ghost",
  "backendType": "ssh-bridge",
  "color": "white",
  "isActive": false,
  "joinedAt": 0,
  "tmuxPaneId": "",
  "cwd": "",
  "subscriptions": []
}
```

The harness honors this edit on the next `SendMessage` call -- no restart needed. (Substrate property: plain JSON file edits to runtime `config.json` `members[]` are read on demand.)

Verify:

```bash
jq '.members[] | select(.name=="<APEX_GHOST>")' ~/.claude/teams/<YOUR_TEAM>/config.json
# Expected: non-empty JSON object.
```

## Step 2 -- Configure the daemon

```bash
cd ~/ghost-bridge
cp ghost-bridge.config.example.json ghost-bridge.config.json
```

Edit `ghost-bridge.config.json`. Replace `local_team` with `<YOUR_TEAM>`. Replace the ghost names in the single `pairs[0]` block with your `<APEX_GHOST>` and `<MY_GHOST>`. The block ends up looking like:

```json
{
  "local_team": "<YOUR_TEAM>",
  "watch_interval_s": 2.0,
  "pid_file": "ghost-bridge.pid",
  "log_file": "ghost-bridge.log",
  "pairs": [
    {
      "pair_name": "me-apex",
      "remote_deployment_alias": "apex-research",
      "local_to_remote": {
        "local_outbox_inbox": "<APEX_GHOST>",
        "remote_inbox": "team-lead",
        "rewrite_from_to": "<MY_GHOST>"
      },
      "remote_to_local": {
        "remote_outbox_inbox": "<MY_GHOST>",
        "local_inbox": "team-lead",
        "rewrite_from_to": "<APEX_GHOST>"
      }
    }
  ]
}
```

- `remote_inbox: "team-lead"` assumes apex's team-lead is registered under the conventional name `team-lead`. If apex uses a different name for their lead, ask Schliemann and substitute.
- `local_inbox: "team-lead"` similarly assumes YOUR team-lead is at `~/.claude/teams/<YOUR_TEAM>/inboxes/team-lead.json`. If your team-lead's roster name differs, substitute.

## Step 3 -- Apex side: ensure `<MY_GHOST>` is registered there

This step is performed by apex's team-lead, not you. Confirm it has been done before proceeding:

```bash
ssh -i ~/.ssh/<your_apex_key> -p <port> <user>@<apex-host> \
    "jq '.members[] | select(.name==\"<MY_GHOST>\")' ~/.claude/teams/apex-research/config.json"
# Expected: non-empty JSON object.
```

If the result is empty, ping apex's team-lead and ask them to add it (any minimal shape works -- apex chooses their own fields).

## Step 4 -- Start the daemon

```bash
cd ~/ghost-bridge
./start-ghost-bridge.sh
# Expected: "ghost-bridge started (PID nnn). Log: .../ghost-bridge.log"

sleep 3
tail -10 ghost-bridge.log
# Expected: INFO line "ghost-bridge starting local_team=<YOUR_TEAM> pair=me-apex ..."
# Possibly one WARN about "local outbox file not yet present" -- harmless; the
# harness creates it on your first SendMessage.
```

## Step 5 -- Test outbound (you → apex)

Use your `SendMessage` tool:

- `to: <APEX_GHOST>`
- `summary: hello world from <YOUR_TEAM>`
- `message: "Hello apex -- <YOUR_TEAM> reproducing the bridge."`

Within ~3 seconds, daemon log should add an `outbound: forwarded -> apex-research:team-lead` line, and the local entry in `~/.claude/teams/<YOUR_TEAM>/inboxes/<APEX_GHOST>.json` should flip to `read: true`.

## Step 6 -- Test inbound (apex → you)

Ask apex's team-lead to send you a ping: `SendMessage(to="<MY_GHOST>", ...)`. Within ~3 seconds:

- Daemon log gains an `inbound: received <- apex-research:<MY_GHOST>` line.
- The message surfaces in your Claude conversation as `<teammate-message teammate_id="<APEX_GHOST>">`. The `from` field has been rewritten to `<APEX_GHOST>` (your local label for apex's lead).

## Step 7 -- Clean shutdown (when done)

```bash
cd ~/ghost-bridge
./stop-ghost-bridge.sh
# Expected on Linux: "ghost-bridge stopped cleanly." + PID file removed.
# Windows-Git-Bash users: see caveats below.
```

## Caveats

### Windows SSH-key setup gotchas (setup-time, before P2 succeeds)

Both produce `Permission denied (publickey)` symptoms that look like classic auth failures but have Win-only root causes. Surfaced by Aleksandr Lerko (apex-side ghost peer) during his 2026-05-15 Win11 bring-up; relayed via Schliemann.

1. **PowerShell empty-passphrase trap.**
   ```powershell
   ssh-keygen -N '""'   # WRONG -- creates passphrase-protected key with LITERAL passphrase  ""
   ssh-keygen -N ''     # RIGHT -- empty passphrase
   # Recovery on already-generated key:
   ssh-keygen -p -P '""' -N '' -f <keyfile>
   ```
   Diagnostic via `ssh -vv`: a `Server accepts key` line *immediately* followed by `Permission denied (publickey)`. That two-line pair fingerprints **"key recognised, signature production failed"** (privkey-load-failed sub-class) -- distinct from the more common "key not in authorized_keys / wrong file perms" symptom which is a bare `Permission denied (publickey)` with no `Server accepts key` precursor.

2. **CRLF in `.pub` file.** Windows `ssh-keygen` writes `.pub` files with `\r\n` line endings. `ssh-keygen -lf` tolerates the trailing `\r`; sshd's `authorized_keys` parser does not. If the pubkey is transported by copy-paste through anything Windows (Notepad, PowerShell, GitHub gist, etc.), `Permission denied (publickey)` results -- and the fingerprint will *actually match* the offered key, which makes this counter-intuitive. Recovery on the remote side:
   ```bash
   sed -i 's/\r$//' ~/.ssh/authorized_keys
   ```
   Mostly a footgun for the human transporting the key, not the agents.

### Windows-Git-Bash daemon-runtime frictions (control plane only, data plane is correct)

3. **Win32 vs POSIX PID mismatch.** Python's `os.getpid()` returns Win32 PID; MSYS `kill -0` uses POSIX PID. The daemon writes its Win32 PID to `ghost-bridge.pid`; `stop-ghost-bridge.sh` checks via MSYS → "not alive" → removes PID file as stale → daemon keeps running. **Workaround:**
   ```bash
   ps -ef | grep '[g]host-bridge.py' | awk '{print $2}' | xargs -r kill -TERM
   ```

4. **SIGTERM via MSYS doesn't run Python's `finally`.** Process IS terminated; the graceful-shutdown log line is missing. Cosmetic only -- data plane unaffected.

Gotchas 1–2 affect any Windows host running an SSH client; 3–4 are Git-Bash-specific. All four are absent on Linux/Ubuntu.

### Design limitations (v1, by design)

- No supervisor -- daemon dies → all comms stop until restart.
- Race on local read-flag flip (no fcntl on local side). Rare in practice.
- Polling latency: up to 2s reply-arrival.
- Sender-rewrite drops original sender -- `from` is always rewritten to the local-side ghost label, never preserves the underlying apex-side agent name.
- Single-pair coded -- config supports a list; v1 implementation only uses `pairs[0]`.

Full list in `SPEC.md § Known limitations`.

## Substrate properties this exercises

Two empirical properties of the Claude Code harness that this MVP is built on:

1. **Inbox-file-write as wake mechanism** -- writing to a JSON inbox file the harness watches wakes the recipient agent. (`wiki/references/inbox-file-write-as-wake-mechanism.md`.)
2. **Inbox-file-write as registration mechanism** -- plain JSON edits to runtime `config.json`'s `members[]` array are honored by the harness on demand, without restart or special API. n=2 cross-substrate. (`wiki/references/members-array-edit-honored-mid-session.md`.)

Both reduce to: *the right JSON file edit, in the right place, is the substrate primitive that does the work.*

## Citations (in `mitselek/ai-teams` repo)

- `teams/framework-research/poc/ghost-bridge/SPEC.md` -- full design spec
- `teams/framework-research/poc/ghost-bridge/README.md` -- operational + caveats
- `teams/framework-research/poc/ghost-member-cli/ghost-chat.py` -- S31 PoC, source of substrate primitives (APPEND_INBOX_SCRIPT, FETCH_AND_MARK_READ_SCRIPT)
- `teams/framework-research/wiki/references/inbox-file-write-as-wake-mechanism.md`
- `teams/framework-research/wiki/references/members-array-edit-honored-mid-session.md`

---

(*FR:Aen*)
