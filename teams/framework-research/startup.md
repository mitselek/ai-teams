# Startup -- framework-research (*FR:Volta*)

**Read this file FIRST on every session start.** It is the executable runbook: paths, steps, verify lines. Nothing else needs to be explored.

**DO NOT use an Explore agent or broad file search.** In the 2026-03-13 restart that cost 31 tool uses, 73.5k tokens and 2m18s. This file replaces all of it.

**History, rationale, superseded gotchas and probe citations live in [`docs/startup-rationale.md`](docs/startup-rationale.md).** This file carries only what you execute. Step names (`Step 0.5`, `1`, `2'`, `3`, `3.5`, `4`; `S1`-`S4`) are stable identifiers cited from the wiki -- do not renumber them.

**Last validated CLI: 2.1.258 (2026-09-02, S71).** Step 0 owns re-validating this.

## Anchors and paths

| Anchor | How to resolve |
|---|---|
| `REPO` | `git rev-parse --show-toplevel` |
| `CLAUDE_PID` | the live Claude session pid -- read from `~/.claude/sessions/*.json` by `cwd` (Step 2'). **Never `$PPID`.** |
| `SLUG` | the discovered runtime team dir name, `session-<id>` -- resolver output (Step 2'). **Never the literal `framework-research`.** |

`TEAM` below is `$REPO/teams/framework-research/` -- the durable, stably-named repo dir. Do not confuse it with the ephemeral runtime dir `$HOME/.claude/teams/$SLUG/`, whose name rotates every session.

| Item | Path |
|---|---|
| Roster, common prompt | `$TEAM/roster.json`, `$TEAM/common-prompt.md` |
| Agent prompts, scratchpads | `$TEAM/prompts/*.md`, `$TEAM/memory/*.md` |
| Topic files | `$REPO/topics/01` .. `08` |
| Lifecycle scripts | `$TEAM/restore-inboxes.sh`, `$TEAM/persist-inboxes.sh` |
| Team-dir resolver (shim) | `$TEAM/poc/ghost-bridge/stationmaster-courier.py --resolve-team-dir` |
| Courier wrappers | `$TEAM/poc/ghost-bridge/{restart-fr-courier-with-pid,stop-fr-courier}.ps1` |

## Substrate facts (verified S70/S71 on CLI 2.1.258, Windows, Bash tool)

1. **`$PPID` is `1` under the Bash tool.** It is not the Claude session pid and never resolves the team dir. Derive `CLAUDE_PID` from `~/.claude/sessions/*.json` instead (Step 2').
2. **Two or more live sessions is the norm on this box** (S71: pid 26376 in the repo, pid 8496 in the home dir). Bare auto-plus-liveness is therefore **ambiguous** -- every call must carry a disambiguator (`--session-pid`, `-SessionPid`, or `FR_COURIER_TEAM_DIR_NAME`).
3. **`~/.claude/teams/` holds many dirs** (S71: 23, of which 2 live). Nothing deletes them on exit. An undisambiguated resolver call exits non-zero with the candidate list -- that is the expected result of a bad call, not a fault to stop on.
4. **Runtime `config.json` has no `model` key for team-lead** (`jq .model` prints `null` for the absent key). Spawned members carry the literal family string the Agent tool was given (`"opus"`), not a version. See Step 0.5.
5. **The courier restart wrapper inherits stdout to the daemon.** Call it with `run_in_background`, or redirect to a file. See Step 3.5.
6. **Cold-start window (~25s):** `config.json` is written first; `sessions/<pid>.json` appears only at interactive-ready. Any probe returning "nothing here" within that window must retry, never conclude absence.
7. **Two path traps.** `roster.json`'s `workDir` may be wrong on your machine -- always use `git rev-parse --show-toplevel`. `$HOME` can resolve empty on some Git Bash installs; fine on this box, but set it explicitly if it is empty.

## Read Order

Read these five, in this order, and you can execute the whole procedure with zero exploration:
**this file** (paths, steps, gotchas), `roster.json` (members, models, roles), `common-prompt.md` (mission, comms rules, shutdown protocol), `prompts/aeneas.md` (team-lead role and scope), `memory/team-lead.md` (prior session's decisions, WIP, warnings).

## Startup Procedure

**Execute in exact order. Do not reorder, skip or combine.** Say the step name before executing it ("Step 1: Sync"). Each step ends with a verify line; do not advance on an unmet verify.

### Step 0: Host check (owner: team-lead, moment: now)

```bash
claude --version          # compare to "Last validated CLI" at the top of this file
python3 --version         # the resolver shim needs python3
pwsh --version            # the courier wrappers are PowerShell
jq -r '"\(.pid) \(.kind) \(.status) \(.cwd)"' ~/.claude/sessions/*.json   # how many live sessions?
```

**Verify:** all three tools answer. **If `claude --version` differs from "Last validated CLI":** the substrate may have moved -- run the rest of startup with extra scepticism, re-check the Step 0.5 and Step 2' assumptions against reality, and update the "Last validated CLI" line in this file at session end. This step exists because a version trigger with no owner and no moment is not a control. Step 0 is the owner and the moment.

### Step 0.5: Parent model vs roster team-lead model

The roster's `members[0].model` is the **intent** for the team-lead seat. It is neither enforceable nor observable in runtime `config.json` (substrate fact 4), so **read the parent model from your own system prompt or `/context`** and compare it to the roster by hand. Do not read the model off `config.json` -- that check cannot be performed as written any more.

```bash
jq -r '.members[0] | "\(.name)\t\(.model)"' teams/framework-research/roster.json   # the intent
```

**If the parent model does not match:** STOP and switch with `/model <roster model>` (or restart the CLI with `--model`) before proceeding. Every specialist spawned from a mismatched parent inherits the wrong baseline.

**Per-specialist version pins in the roster are documentation-only.** The Agent tool's `model` parameter accepts only `sonnet | opus | haiku | fable`, so a pin like `claude-opus-4-6[1m]` cannot be expressed at spawn time.

**Verify:** the parent model matches `members[0].model`, or the mismatch was resolved.

### Step 1: Sync

```bash
REPO="$(git rev-parse --show-toplevel)"
cd "$REPO" && git pull
```

**Verify:** "Already up to date" or pulled changes.

### Step 2': Discover team identity

There is nothing to create and nothing to clean. The session is live, so its `config.json` already exists on disk. This step **discovers** which `session-<id>` dir is ours and confirms it operational.

```bash
REPO="$(git rev-parse --show-toplevel)"; REPO_WIN="$(cygpath -w "$REPO")"
CLAUDE_PID="$(jq -r --arg cwd "$REPO_WIN" \
  'select(.kind=="interactive" and .status=="busy" and .cwd==$cwd) | .pid' ~/.claude/sessions/*.json)"
tasklist //FI "PID eq $CLAUDE_PID" //FO CSV //NH | grep -c claude.exe    # expect 1

SHIM="$REPO/teams/framework-research/poc/ghost-bridge/stationmaster-courier.py"
SLUG="$(python3 "$SHIM" --resolve-team-dir --name --session-pid "$CLAUDE_PID")"
echo "CLAUDE_PID=$CLAUDE_PID SLUG=$SLUG"
ls "$HOME/.claude/teams/$SLUG/config.json"
```

**Verify (all four):**

1. `CLAUDE_PID` is exactly one pid and that process is alive (`grep -c` prints 1).
2. `SLUG` resolved, shim exit 0.
3. `config.json` exists under `$SLUG`.
4. Its roster matches `teams/framework-research/roster.json`.

**Carry `CLAUDE_PID` and `SLUG` forward -- Steps 3, 3.5, 4 and S4 all need them.** Bash-tool calls do not share an environment, so re-derive or inline them on every later call.

**Failure modes.** An *ambiguous* result means you omitted the disambiguator: supply it and re-run, do not stop. A *genuine* no-resolve, or a missing `config.json` under a resolved slug, is a substrate fault -- the code path that starts the session also creates the team, so its absence means the session is broken. STOP and report to the user. Never hand-create a team dir; never guess a slug. Inside the cold-start window, retry before concluding absence (fact 6).

**Operational gate:** do not spawn any agent until `config.json` is confirmed under `$SLUG`. In Restart 4 an agent was spawned into a broken team and wasted.

### Step 3: Restore inboxes from repo

```bash
REPO="$(git rev-parse --show-toplevel)"
FR_COURIER_TEAM_DIR_NAME="$SLUG" bash "$REPO/teams/framework-research/restore-inboxes.sh"
```

The env prefix must be **inline on this call** -- it does not survive between Bash-tool invocations. `FR_COURIER_TEAM_DIR_NAME` is the disambiguator that always works, on any CLI version, because it is the resolver's explicit override. (`FR_COURIER_SESSION_PID="$CLAUDE_PID"` also works as of this commit, but prefer the slug: Step 2' already produced it, and it cannot be defeated by a pid the resolver fails to map.)

The script re-resolves the team dir itself, creates `inboxes/` if absent, copies the repo's agent-name-keyed inbox files into the runtime dir, prunes shutdown and idle protocol messages, and fails closed on a resolver error rather than writing into an empty path.

**Verify:** "Discovered runtime team dir: `<slug>`" naming **your** slug, then "Restored N inbox(es)..." (or "No repo inboxes found" on a genuine cold start). A non-zero exit means stop and investigate. S71 measured 45 inboxes restored.

### Step 3.5: Restart the FR courier

**Runs after Step 3, never before** -- the courier validates its `inboxes_dir` at startup, and on a bare-fresh boot that dir is first created by Step 3.

**Why it exists:** the courier resolves `inboxes_dir` once, at config load, so one left running from a previous session points at a dead `session-<id>` and silently delivers nothing. The restart re-resolves the live dir. Skip the step only if the team runs no cross-team comms this session.

```powershell
# Run with run_in_background, or redirect -- the wrapper inherits stdout to the daemon and will hang a
# foreground caller. Pass the session pid: bare liveness is ambiguous with two live sessions (fact 2).
pwsh -File teams/framework-research/poc/ghost-bridge/restart-fr-courier-with-pid.ps1 -SessionPid <CLAUDE_PID>
```

If you redirect instead of backgrounding, send output to `~/.stationmaster/framework-research/restart.out` -- **not** into the ghost-bridge dir, which is not gitignored.

The wrapper owns the auto-versus-explicit config choice; you never edit a courier config. It dry-runs the resolution first, then reaps the old courier and starts the new one. On a failed resolution it aborts and leaves the running courier untouched, so a mis-timed restart cannot take comms down. If it aborts inside the cold-start window, retry once the session is interactive-ready.

**Verify:** the wrapper's `pre-flight OK: would resolve to <path>` line names **your** `$SLUG`. That line is the **only** evidence of correct binding -- the daemon never logs its `inboxes_dir`, and its "courier up" line prints the config's `team` field (`framework-research`), which masks the real slug. Filed as a defect; see the rationale doc.

### Step 4: Spawn agents

Ask the user which agents to spawn. Do **not** auto-spawn anyone. Before each spawn, check `config.json` under `$SLUG`: if the name already exists, use SendMessage instead of spawning. Spawn with `run_in_background: true`.

**Verify:** no `name-2` entries in `config.json`.

## Shutdown Procedure (S1-S4)

**Four phases. Execute in exact order.** There is no S5 -- leadership evaporates on process exit. See the rationale doc.

### S1: Halt

Stop accepting new work. Let agents finish what they hold.

### S2: Own scratchpad, task snapshot, shutdown requests

**S2a.** Write **your own** scratchpad first, to `memory/team-lead.md`, tagged `[DECISION]` `[WIP]` `[DEFERRED]` `[LEARNED]` `[WARNING]`. You have the clearest picture of your own state now; by S4 you are loaded with git.

**S2b.** Snapshot the task list to `memory/task-list-snapshot.md`.

**S2c.** Send shutdown requests to all agents. Wait for each agent's closing report.

### S3: Collect

Wait for `teammate_terminated` from each agent. Do **not** proceed on `shutdown_approved` alone -- the agent may still be writing its scratchpad.

### S4: Stop courier, persist inboxes, commit (last durable step)

**The order is load-bearing: stop and drain the courier FIRST**, so the last inbound message lands in `inboxes/` before persist reads them.

```bash
REPO="$(git rev-parse --show-toplevel)"

# 1. stop + drain the courier (the drain resolves the live dir, so it needs the pid too)
FR_COURIER_SESSION_PID=<CLAUDE_PID> pwsh -File \
  "$REPO/teams/framework-research/poc/ghost-bridge/stop-fr-courier.ps1"

# 2. persist runtime inboxes to the repo
FR_COURIER_TEAM_DIR_NAME="$SLUG" bash "$REPO/teams/framework-research/persist-inboxes.sh"

# 3. commit
cd "$REPO"
git add teams/framework-research/memory/ teams/framework-research/inboxes/
git commit -m "chore: save team state (scratchpads, tasks, inboxes)"
git push
```

`stop-fr-courier.ps1` takes no pid parameter -- it reads `FR_COURIER_SESSION_PID` from the environment, so the prefix above is the only way to point its drain at the right dir. The persist script mirrors restore: re-resolves the dir, copies runtime inboxes into the repo keyed by agent name, prunes to the last 100 messages per file, fails closed.

**Verify:** `git log --oneline -1` shows the commit, and the inboxes are in the repo.

## Environment Notes

- **CLI:** 2.1.178+ (implicit teams; no `TeamCreate` / `TeamDelete`). This file is correct only on 2.1.178+.
- **Platform:** the live FR substrate is the Windows dev box, dev-only by policy. The lifecycle scripts are portable `.sh` under Git Bash; the courier wrappers are PowerShell. Required on PATH: `jq`, `python3`, `pwsh`.
- **Git remote:** `mitselek/ai-teams` (private). This is a research team -- design docs, no production code.

(*FR:Volta*)
