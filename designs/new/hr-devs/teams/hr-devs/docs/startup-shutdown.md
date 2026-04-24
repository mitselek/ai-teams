---
name: Team startup and shutdown procedures
description: Canonical source of truth for hr-devs team startup, spawn, and shutdown orchestration
type: reference
---

# hr-devs — Startup & Shutdown Procedures

**Team location:** `hr-platform/teams/hr-devs/`
**Spawn script:** `hr-platform/teams/hr-devs/spawn_member.sh`
**Roster:** `hr-platform/teams/hr-devs/roster.json`

## Startup

### Step 0: Read prompts and sync

1. Read `hr-platform/teams/hr-devs/prompts/team-lead.md`
2. Read `hr-platform/teams/hr-devs/common-prompt.md`
3. Read `hr-platform/teams/hr-devs/roster.json`
4. Read `hr-platform/teams/hr-devs/memory/lead.md` (scratchpad, if exists)
5. `cd ~/github/hr-platform && git pull` (sync latest prompts/roster)

### Step 1: TeamCreate (with inbox preservation)

```bash
# 1. Backup inboxes if old team exists
if [ -d ~/.claude/teams/hr-devs/inboxes ]; then
  cp -r ~/.claude/teams/hr-devs/inboxes /tmp/hr-devs-inboxes-backup
fi

# 2. Kill zombie agent processes
~/cleanup-zombies.sh

# 3. Remove stale team directory (required — otherwise TeamCreate generates random name)
rm -rf ~/.claude/teams/hr-devs
```

Then call `TeamCreate(team_name="hr-devs")`.

```bash
# 4. Restore inboxes (TeamCreate does NOT create inboxes/ — mkdir first)
if [ -d /tmp/hr-devs-inboxes-backup ]; then
  mkdir -p ~/.claude/teams/hr-devs/inboxes
  cp -r /tmp/hr-devs-inboxes-backup/* ~/.claude/teams/hr-devs/inboxes/
  rm -rf /tmp/hr-devs-inboxes-backup
fi
```

### Step 2: Dashboard

```bash
cd ~/github/dev-toolkit/agent-dashboard && CLAUDE_TEAM_DIR=~/github/hr-platform/teams/hr-devs CLAUDE_TEAM_NAME=hr-devs node server.ts &
WAYLAND_DISPLAY=wayland-0 XDG_RUNTIME_DIR=/run/user/1000 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus MOZ_ENABLE_WAYLAND=1 firefox-esr --kiosk http://localhost:4242 &
```

### Step 3: Spawn Medici (health audit)

Spawn Medici first for health audit of scratchpads, prompts, common-prompt. Apply recommendations before spawning other agents.

### Step 4: Spawn agents

Use `spawn_member.sh` (NEVER Agent tool, NEVER raw CLI):

```bash
~/github/hr-platform/teams/hr-devs/spawn_member.sh <agent-name> [tmux-session]
```

## Team Configurations

### "full" — story work (full-tdd layout)

Agents: finn, marcus, tess, sven, dag

**Spawn order:**
1. **Finn** → wait for report → user confirmation
2. **Marcus** → wait for report → user confirmation
3. **Tess + Sven** (parallel)
4. **Dag** (if needed)

### "full-review" — story work with AC verification

Agents: finn, marcus, arvo, tess, sven, dag

**Spawn order:**
1. **Finn** → wait for report → user confirmation
2. **Marcus + Arvo** (parallel — code review + AC verification)
3. **Tess + Sven** (parallel)
4. **Dag** (if needed)

### "lite" — quick fix

Agents: finn, sven

## Spawn Rules

- Pre-create layout with empty panes using recursive splits, then spawn into target panes
- Layout diagrams and split trees: [`docs/tmux-layouts.md`](tmux-layouts.md)
- Spawn into pane: `spawn_member.sh --target-pane %XX <agent-name>`
- `spawn_member.sh` reads roster automatically for model, color, session ID
- Agent tool ignores roster models — ALWAYS use spawn_member.sh
- Background spawn DOES NOT WORK — claude CLI requires TTY
- NEVER spawn duplicates — check config.json first, use SendMessage for existing agents

## Shutdown

1. Stop all new work
2. Send shutdown to ALL agents (broadcast or one-by-one)
3. Wait for confirmation from each agent
4. Save task list to `hr-platform/teams/hr-devs/memory/task-list-snapshot.md`
5. Commit and push memory files
6. Do NOT use TeamDelete — team directory stays for inbox restoration on next startup

### Learned gotchas

- Panes close AUTOMATICALLY after shutdown_approved — do NOT call `tmux kill-pane` manually
- Stale inbox messages (`read: true`) do NOT cause problems on re-spawn
- Always show procedure and ask for confirmation BEFORE acting
