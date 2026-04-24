# hr-devs Container — Session Startup

(*FR:Brunel*)

## Connect

```bash
ssh -i ~/.ssh/id_ed25519_hr_devs -p 2225 ai-teams@100.96.54.170
```

You land in a tmux session named `hr-devs` with 7 labeled panes already created.

## Tmux session name

The session is named **`hr-devs`** (short identifier, lowercase). If scripts ask for a session name, always use `hr-devs` — not `hr-platform`, not `HR-DEVS`.

Verify: `tmux list-sessions`

## Layout (full-review)

```
| lead   | marcus  | arvo      |
|        |---------------------|
|--------| tess    | sven      |
| finn   |---------------------|
|        | dag                 |
```

You land in the **team-lead** pane. Type `claude` to start your session.

## Start the team

### Step 1: TeamCreate (with inbox preservation)

```bash
# Backup inboxes if old team exists
if [ -d ~/.claude/teams/hr-devs/inboxes ]; then
  cp -r ~/.claude/teams/hr-devs/inboxes /tmp/hr-devs-inboxes-backup
fi

# Remove stale team dir
rm -rf ~/.claude/teams/hr-devs

# Then in Claude: TeamCreate(team_name="hr-devs")

# Restore inboxes after TeamCreate
if [ -d /tmp/hr-devs-inboxes-backup ]; then
  mkdir -p ~/.claude/teams/hr-devs/inboxes
  cp -r /tmp/hr-devs-inboxes-backup/* ~/.claude/teams/hr-devs/inboxes/
fi
```

### Step 2: Spawn agents

Pane IDs are in `/tmp/hr-devs-panes.env` (written by apply-layout.sh on login):

```bash
source /tmp/hr-devs-panes.env
```

Then spawn into pre-created panes:

```bash
SPAWN="$HOME/workspace/hr-platform/teams/hr-devs/spawn_member.sh"

# Spawn in this order (wait for each intro before next):
bash "$SPAWN" --target-pane $PANE_FINN    finn    hr-devs
bash "$SPAWN" --target-pane $PANE_MARCUS  marcus  hr-devs
bash "$SPAWN" --target-pane $PANE_ARVO    arvo    hr-devs
bash "$SPAWN" --target-pane $PANE_TESS    tess    hr-devs
bash "$SPAWN" --target-pane $PANE_SVEN    sven    hr-devs
bash "$SPAWN" --target-pane $PANE_DAG     dag     hr-devs
```

Medici can be spawned on demand if needed (gets a new split pane — omit `--target-pane`).

## Vite dev server

With `network_mode: host`, port 5173 is taken by apex-research. Use 5178:

```bash
cd ~/workspace/hr-platform/conversations
npm run dev -- --port 5178
```

For wrangler dev (Cloudflare bindings):

```bash
npm run local:start   # check wrangler.jsonc for port config
# Or explicitly: npx wrangler dev --port 8787
```

## Wrangler deploys

```bash
cd ~/workspace/hr-platform/conversations
npm run deploy:dev          # deploy to dev environment
npm run deploy:production   # deploy to production
```

`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are in `.bashrc` — no extra setup needed.

## MCP servers

Jira and Dynamics MCP servers are configured in `~/.claude/mcp.json` (written on first container start). They start automatically when Claude Code launches.

Verify they're working: ask an agent to run a Jira search or query Dynamics.

## If the layout is missing on login

Re-create it manually:

```bash
bash ~/workspace/hr-platform/teams/hr-devs/apply-layout.sh hr-devs
source /tmp/hr-devs-panes.env
```

## Shutdown

1. Send shutdown to all agents (broadcast or one-by-one)
2. Wait for confirmations
3. Commit + push memory files: `cd ~/workspace/hr-platform && git add teams/hr-devs/memory/ && git commit -m "chore: session memory" && git push`
4. Do NOT TeamDelete — preserves inboxes for next session
