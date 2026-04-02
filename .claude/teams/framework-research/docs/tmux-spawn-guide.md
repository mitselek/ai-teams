# Spawning Agents into tmux Panes (*FR:Brunel*)

Reusable guide for spawning Claude Code agents into pre-existing tmux panes.
Applies to any container team using the `spawn_member.sh` + tmux pattern.

## Conventions

Throughout this guide:

- `<team-name>` — the team name (e.g. `apex-research`, `polyphony-dev`)
- `<agent-name>` — the agent to spawn (e.g. `champollion`, `codd`)
- `<pane-id>` — the tmux pane ID (e.g. `%1`, `%3`)
- `<session>` — the tmux session name (usually matches `<team-name>`)

## Pane Map

Each team's `apply-layout.sh` or startup procedure writes pane IDs to `/tmp/<team-name>-panes.env`:

    cat /tmp/<team-name>-panes.env

Example output:

    PANE_LEAD=%0
    PANE_AGENT_A=%1
    PANE_AGENT_B=%2
    PANE_AGENT_C=%3

The team lead runs in the first pane. Agent panes are pre-created and labeled.

## Prerequisites

1. Run `TeamCreate(team_name="<team-name>")` first — this creates `~/.claude/teams/<team-name>/config.json` with the `leadSessionId`
2. Verify:

       jq .leadSessionId ~/.claude/teams/<team-name>/config.json

## Spawning Agents

Use `spawn_member.sh` from the Bash tool. Run one at a time, wait for intro before spawning the next:

    bash ~/workspace/.claude/spawn_member.sh --target-pane <pane-id> <agent-name>

Example for a 4-agent team:

    bash ~/workspace/.claude/spawn_member.sh --target-pane %1 agent-a
    bash ~/workspace/.claude/spawn_member.sh --target-pane %2 agent-b
    bash ~/workspace/.claude/spawn_member.sh --target-pane %3 agent-c
    bash ~/workspace/.claude/spawn_member.sh --target-pane %4 agent-d

## What spawn_member.sh Does

1. Reads the agent definition from `roster.json` (model, color, agentType)
2. Reads `leadSessionId` from `config.json`
3. Creates a temporary spawn script with all `--agent-*` CLI flags
4. Sends the script to the target tmux pane via `tmux send-keys`
5. Registers the agent in `config.json` (so messages route correctly)

## Manual Spawn (if spawn_member.sh fails)

If the script is unavailable, spawn manually:

    LEAD_SID=$(jq -r .leadSessionId ~/.claude/teams/<team-name>/config.json)
    tmux send-keys -t <pane-id> "claude --agent-id <agent-name>@<team-name> --agent-name <agent-name> --team-name <team-name> --agent-color <color> --parent-session-id $LEAD_SID --agent-type general-purpose --model <model> \"Read your prompt. Send team-lead an intro and stand by.\"" Enter

Then manually register in config.json:

    jq --arg name "<agent-name>" --arg id "<agent-name>@<team-name>" \
      '.members += [{ agentId: $id, name: $name, agentType: "general-purpose", backendType: "tmux" }]' \
      ~/.claude/teams/<team-name>/config.json > /tmp/config.tmp && mv /tmp/config.tmp ~/.claude/teams/<team-name>/config.json

## Respawning Agents (model upgrade, crash recovery)

When an agent needs to be restarted:

### 1. Save state

Send a message asking the agent to write their scratchpad. Wait for confirmation.

### 2. Exit via /exit

Do NOT use `shutdown_request` — it destroys the tmux pane.

    tmux send-keys -t <pane-id> "/exit" Enter

Verify pane survived:

    tmux list-panes -a -F '#{pane_id} #{pane_dead}'

### 3. Remove from config.json

    jq 'del(.members[] | select(.name == "<agent-name>"))' \
      ~/.claude/teams/<team-name>/config.json > ~/.claude/teams/<team-name>/config.json.tmp
    mv ~/.claude/teams/<team-name>/config.json.tmp ~/.claude/teams/<team-name>/config.json

### 4. Respawn

    bash ~/workspace/.claude/spawn_member.sh --target-pane <pane-id> <agent-name>

### 5. Wait for intro message

The pane shell survives `/exit` because `spawn_member.sh` uses `tmux send-keys` — the pane's original bash process is the parent and persists after claude exits.

## Recreating a Lost Pane

If a pane was destroyed (e.g. by `shutdown_request`), recreate it by splitting above the next pane:

    tmux split-window -t <next-pane-id> -b -v -l '25%' -c ~/workspace
    # Capture the new pane ID from: tmux list-panes -t <session> -F '#{pane_id} #{pane_title}'
    tmux select-pane -t <new-pane-id> -T "<agent-name>"

Then spawn as normal.

## Critical Rules

- Run `TeamCreate` BEFORE spawning — agents need `leadSessionId` to connect
- Check `config.json` before spawning — if agent already registered, use `SendMessage` instead
- Spawn one at a time and wait for the intro message before spawning the next
- Use `/exit` for respawns, NEVER `shutdown_request` (which destroys panes)
- Check for `name-2` duplicates in `config.json` after spawns — indicates stale registration
