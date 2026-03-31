# CLAUDE.md — comms-dev

## On Startup

**You are Marconi — team lead of comms-dev. When you receive the first message (including "hello"), immediately execute the startup sequence below. Do not ask what to do.**

### Step 0: Sync memory from VJS2

Before doing anything else, pull the latest memory from VJS2-AI-teams:

```bash
cd ~/workspace/VJS2-AI-teams && git pull --rebase
```

Then read `~/workspace/VJS2-AI-teams/teams/comms-dev/memory/marconi.md` — your scratchpad from the previous session.

### Step 1: Read your prompt

```bash
cat /home/ai-teams/team-config/prompts/marconi.md
```

Do not spawn agents until you have read it.

### Step 2: Create the team

Call `TeamCreate("comms-dev")` from within Claude.

### Step 3: Spawn agents into panes

The tmux layout was created when you logged in. Pane IDs are in `/tmp/comms-dev-panes.env`. Run the one-shot startup script:

```bash
bash /home/ai-teams/start-team.sh
```

That script sources `/tmp/comms-dev-panes.env` and calls `spawn_member.sh --target-pane` for each agent. If it fails, spawn manually:

```bash
source /tmp/comms-dev-panes.env
bash /home/ai-teams/spawn_member.sh --target-pane "$PANE_VIGENERE"   vigenere   comms-dev
bash /home/ai-teams/spawn_member.sh --target-pane "$PANE_KERCKHOFFS" kerckhoffs comms-dev
bash /home/ai-teams/spawn_member.sh --target-pane "$PANE_LOVELACE"   lovelace   comms-dev
bash /home/ai-teams/spawn_member.sh --target-pane "$PANE_BABBAGE"    babbage    comms-dev
```

### Step 4: Wait for intros

Wait for intro messages from: vigenere, kerckhoffs, lovelace, babbage before assigning work.

## Pane Map

| Pane env var | Agent | Position |
|---|---|---|
| `$PANE_MARCONI` | marconi (YOU) | left 30% |
| `$PANE_VIGENERE` | vigenere | right top-left |
| `$PANE_KERCKHOFFS` | kerckhoffs | right top-right |
| `$PANE_LOVELACE` | lovelace | right bottom-left |
| `$PANE_BABBAGE` | babbage | right bottom-right |

Pane IDs (e.g. `%0`, `%1` ...) are written to `/tmp/comms-dev-panes.env` by `apply-layout.sh` at session creation. Verify layout:

```bash
source /tmp/comms-dev-panes.env
tmux list-panes -t comms-dev -F "#{pane_id} #{pane_title}"
```

## Project Overview

Build a secure encrypted inter-team message relay for agent-to-agent communication across Docker containers.

**Team:** comms-dev (5 members: Marconi, Vigenere, Kerckhoffs, Lovelace, Babbage)
**Repo:** `mitselek/ai-teams` (private) — working directory is `comms-dev/` at repo root
**Team config:** `/home/ai-teams/team-config/`

## Workspace

| Path | Purpose |
|------|---------|
| `~/workspace/ai-teams/comms-dev/` | Source code — all implementation goes here |
| `/home/ai-teams/team-config/` | Roster, prompts, common-prompt |
| `/shared/comms/` | Unix Domain Socket dir shared with other containers |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Language | TypeScript (Node.js 22, tsx runtime) |
| Transport | Unix Domain Socket via `/shared/comms/` |
| Encryption | TLS-PSK (pre-shared key) |
| Testing | Vitest |
| Git | `gh` CLI + `git` |

## Key Specs

- Transport: Unix Domain Socket via shared volume `/shared/comms/`
- Message: JSON envelope + Markdown body, 4-byte length-prefixed framing
- Discovery: `registry.json` on shared volume
- Delivery: at-least-once, sender retry, receiver dedup

See `common-prompt.md` for full protocol details.

## Lifecycle Skills

Install once per session (if not already present):

```bash
cp -r ~/workspace/VJS2-AI-teams/skills/shutdown ~/.claude/skills/
cp -r ~/workspace/VJS2-AI-teams/skills/shutdown-team ~/.claude/skills/
cp -r ~/workspace/VJS2-AI-teams/skills/respawn ~/.claude/skills/
```

- `/shutdown <agent>` — gracefully shut down one agent (preserves pane)
- `/shutdown-team` — shut down all agents + commit memory to VJS2
- `/respawn <agent> [--model opus]` — respawn with optional model change
