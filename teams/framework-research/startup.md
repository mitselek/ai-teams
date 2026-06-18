# Startup -- framework-research (*FR:Volta*)

**Read this file FIRST on every session start.** It tells you where everything is and what to do, without exploration.

**DO NOT use an Explore agent or broad file search.** In the 2026-03-13 restart, an Explore agent cost 31 tool uses, 73.5k tokens, and 2 minutes 18 seconds. This file replaces all of that.

## This Installation

All paths are derived from two anchors:

| Anchor | How to resolve |
|---|---|
| `REPO` | The git repo root: run `git rev-parse --show-toplevel` or use the working directory |
| `TEAM_DIR` | `$HOME/.claude/teams/<SLUG>` (runtime, ephemeral) -- `<SLUG>` is the **discovered** `session-<id>`, NOT the literal `framework-research` (see Implicit Teams below) |

| Item | Path |
|---|---|
| Team config repo | `$REPO/` |
| Team config dir | `$REPO/teams/framework-research/` (repo-side dir name is stable; only the *runtime* dir is `session-<id>`) |
| Working directory | `$REPO/` |
| Runtime team dir | `$TEAM_DIR/` (= `$HOME/.claude/teams/<discovered-slug>/`) |
| Roster | `teams/framework-research/roster.json` (relative to repo) |
| Common prompt | `teams/framework-research/common-prompt.md` |
| Agent prompts | `teams/framework-research/prompts/*.md` |
| Scratchpads | `teams/framework-research/memory/*.md` |
| Topic files | `topics/01` through `topics/08` |
| Reference teams | `reference/rc-team/`, `reference/hr-devs/` |
| Lifecycle scripts | `teams/framework-research/restore-inboxes.sh`, `persist-inboxes.sh` |
| Team-dir resolver (shim) | `teams/framework-research/poc/ghost-bridge/stationmaster-courier.py --resolve-team-dir` (Brunel's WS1; the lifecycle CALLS it, never reinvents it) |

### Implicit teams (CLI 2.1.178+) -- the load-bearing change (*FR:Volta* -- 2026-06-18, S55)

This installation runs CLI **2.1.178+**, which **removed `TeamCreate` and `TeamDelete`**. Teams are now **implicit**: a lone authenticated session is *already* a 1-member team with itself as `team-lead`, and `config.json` is written **eagerly** on session start (before any spawn). The on-disk dir name is a **random `session-<id>`**, derived per session -- the Agent-tool `team_name` param is a cosmetic chat label, **ignored on disk**.

Consequences threaded through this file:

- **The team is not created or deleted -- it is discovered.** Startup Step 2 (Clean+Create) collapses to **Step 2' Discover** (look up which `session-<id>` dir is mine, verify it operational). Shutdown Step S5 (Release leadership) is **deleted** -- leadership is the implicit property of a live session and **evaporates on process exit**; there is no `TeamDelete` and nothing to release.
- **Everything name-keyed must use the discovered `<slug>`,** not the literal `framework-research`. Inbox restore/persist target `~/.claude/teams/<discovered-slug>/inboxes/`. The repo-side durable copy stays keyed by **agent name** (`team-lead.json`, ...), so it survives a team name that rotates every session.
- **The host carries MANY team dirs, so discovery MUST disambiguate** (Brunel WS1 finding 2026-06-18: 11 on this box). The resolver is called with `--session-pid "$PPID"` on 2.1.178+, or `--team-dir-name framework-research` on the **2.1.177 bridge** (the lifecycle scripts + the courier share the env `FR_COURIER_TEAM_DIR_NAME` for this override -- Aen 2026-06-18). See gotcha #5.

Full design: `teams/framework-research/docs/lifecycle-rework-implicit-teams-2026-06-18.md` (Herald, WS2). Probe evidence: `teams/framework-research/docs/migration-validation-probe-findings-2026-06-18.md` (Hopper, V1-V5).

**Known gotcha #1:** `roster.json` says `workDir: "$HOME/github/mitselek-ai-teams"` -- this may be WRONG on your machine. Use `git rev-parse --show-toplevel` to get the actual repo path.

**Known gotcha #2 (from Restart 4, 2026-03-13):** `$HOME` can be UNRELIABLE on some platforms (e.g., Windows/Git Bash resolves it to empty string). The lifecycle scripts use `$SCRIPT_DIR` to derive repo paths and `$HOME` only for the runtime dir. If `$HOME` is empty, set it explicitly before running scripts.

**Known gotcha #3 (HISTORICAL -- pre-2.1.178; superseded):** On the old explicit-team CLI, `TeamCreate` could return success yet `config.json` was not on disk immediately (hypothesis: lazy write). On 2.1.178+ this gotcha is **moot** -- there is no `TeamCreate`, and `config.json` is written **eagerly** on session start (probe P3), before Step 2' runs. The verify-on-disk check survives as the Step 2' *discovery gate* (confirm the auto-created config is present and operational), not as a defense against a missing `TeamCreate` write.

**Known gotcha #4 (HISTORICAL -- pre-2.1.178; superseded):** On the old explicit-team CLI, in-memory team-leadership state survived `/clear`, so a bare `rm -rf $TEAM_DIR` left stale leadership and the next `TeamCreate` failed with "Already leading team." On 2.1.178+ this **no longer applies the same way**: leadership is not a held token -- it is the implicit property of a running session and **ends when the process ends** (probe P3 + absence of TeamCreate/TeamDelete). There is no acquire-step that stale state can block; the next session derives a *fresh* `session-<id>` and ignores any leftover dir. The new hazard is the inverse: leftover `session-<id>` dirs **accumulate** (nothing deletes them on exit) -- non-fatal (the resolver's liveness filter skips dead dirs), handled by an out-of-band pid-guarded sweep, NOT a mandatory lifecycle step. See `topics/06-lifecycle.md` (Stale-dir hygiene) and the Callimachus gotcha `no-teamdelete-stale-session-dirs-accumulate`.

**Known gotcha #5 (2.1.178+ AND the 2.1.177 bridge):** `~/.claude/teams/` holds MANY team dirs -- on 2.1.178+ because stale `session-*/` dirs accumulate (no `TeamDelete` cleanup), and on 2.1.177 because every team this CLI ever created has a dir (Brunel WS1 finding: 11 on this box). So `glob ~/.claude/teams/*/` returns N>1 and a bare resolver call returns `ambiguous ... (live: [])` + exits non-zero. Discovery (Step 2') MUST go through the shared resolver WITH a disambiguator: `--session-pid "$PPID"` on 2.1.178+ (the dir is `session-<id>`; the live session's pid maps to it), or `--team-dir-name framework-research` on the 2.1.177 bridge (dirs are TeamCreate-named, so only the explicit override resolves). The resolver's liveness filter keys on **process-liveness**, NOT the `status` field (probe V3: dead sessions linger `status:"idle"`, indistinguishable from live). NEVER hardcode the runtime path; NEVER guess on genuine ambiguity (the resolver fails fast with the candidate list).

## Read Order

On every session start, read these files in this exact order:

| # | File | Why |
|---|---|---|
| 1 | **This file** (`startup.md`) | Paths, procedures, gotchas for this installation |
| 2 | `roster.json` | Team members, models, roles |
| 3 | `common-prompt.md` | Mission, communication rules, shutdown protocol |
| 4 | `prompts/aeneas.md` | Team-lead role, scope, coordination rules |
| 5 | `memory/team-lead.md` | Your prior session's decisions, WIP, warnings |

After these 5 reads, you know everything you need to execute the startup protocol. Zero exploration required.

## Startup Procedure

**Execute these steps in exact order. Do not reorder, skip, or combine steps.** Each step has a precondition (the previous step completed) and a verifiable outcome. State the step name out loud before executing it (e.g., "Step 1: Sync").

Field test (2026-03-13) showed the team-lead scrambled the phase order AND mislabeled phases (called Create "Phase 1: Sync"). The checklist format below prevents this -- follow it mechanically.

### Step 0.5: Verify parent CLI session model matches roster team-lead model

Verify the parent CLI session is running on the model the roster pins team-lead to. On Agent-tool team architecture, `roster.json`'s `model` field is **documentation-only** -- the *parent session model* is stamped into runtime `config.json` regardless of roster intent, and all subsequently-spawned specialists inherit it (Agent tool's `model` param accepts only family-level overrides `opus`/`sonnet`/`haiku`, which resolve to the current default version, not a specific pin like `claude-opus-4-6[1m]`).

**Intent and action are unchanged from the explicit-team era.** The only delta on 2.1.178+: the parent model is stamped into the **auto-created** `config.json` (written eagerly on session start, probe P3), so this check now *reads the already-present config's effective model* rather than gating a `TeamCreate` stamp. Same model to verify, same fix, same place -- it just precedes Step 2' (Discover) instead of a `TeamCreate`.

```
Roster says:  claude-opus-4-6[1m]   (team-lead intent)
Parent says:  ???                   (run `claude --version` or check /context header for active model)
```

**If parent model ≠ roster team-lead.model:** STOP. Switch parent via `/model claude-opus-4-6[1m]` (or restart CLI with `--model claude-opus-4-6[1m]`) before proceeding. Substrate-truth catch from S38 (2026-05-28): parent on 4.7 stamped `"model": "claude-opus-4-7[1m]"` into config.json despite roster saying 4.6. All specialists would inherit 4.7 -- ~40% context-cost differential per agent vs. the 4.6 baseline historic to S35-S37.

**Verify:** Parent model string matches roster `members[0].model`. If matched → proceed to Step 1.

### Step 1: Sync

```bash
REPO="$(git rev-parse --show-toplevel)"
cd "$REPO" && git pull
```

**Verify:** Output says "Already up to date" or shows pulled changes.

### Step 2': Discover team identity (*FR:Volta* -- 2026-06-18, S55; REPLACES old Step 2 Clean+Create)

**On 2.1.178+ there is nothing to create and nothing to clean.** The CLI session is live (you are running this step), so its team `config.json` already exists on disk (eager write, probe P3). Step 2's job is to **discover** which `session-<id>` dir is this session's, and confirm it operational. No `TeamDelete`, no `TeamCreate`, no retry-via-create.

```bash
REPO="$(git rev-parse --show-toplevel)"
SHIM="$REPO/teams/framework-research/poc/ghost-bridge/stationmaster-courier.py"

# Discover the live team dir via the shared WS1 resolver.
# Resolver order: explicit-override -> single-dir -> pid-tiebreaker -> liveness-filter -> fail-fast.
# A real box has MANY team dirs (Brunel WS1 finding 2026-06-18: 11 on this host), so the
# multi-dir path is the NORM, not the exception. Disambiguate explicitly:
#   - 2.1.178+ (post-unpin): pass --session-pid <session pid>. The in-session caller holds it
#     ($PPID from a script = the Claude session); the dir is session-<sessionId[:8]>, so the
#     pid maps to it unambiguously.
#   - 2.1.177 (bridge, current pin): dirs are TeamCreate-NAMED (framework-research), not
#     session-<id> -- neither glob nor pid disambiguates, so the explicit override is required:
#     add --team-dir-name framework-research.
SLUG="$(python3 "$SHIM" --resolve-team-dir --name --session-pid "$PPID")"   # bare slug to stdout; exit 0, or stderr+exit 1 on no-resolve/ambiguity
# On the 2.1.177 bridge: SLUG="$(python3 "$SHIM" --resolve-team-dir --name --team-dir-name framework-research)"

echo "Team dir: $SLUG"                                  # surface the discovered name to the operator (OQ4)
ls "$HOME/.claude/teams/$SLUG/config.json"              # operational gate (old Step 2b's role, verbatim)
```

**Verify (all three):**

1. `SLUG` resolved (shim exit 0) -- a `session-<id>` was discovered
2. `config.json` exists on disk under the discovered `<slug>` (the `ls` above), `.name == <slug>`, and `members[]` contains this session as `team-lead`
3. Roster matches `teams/framework-research/roster.json`

Record `SLUG` as `TEAM_DIR_NAME` for the rest of startup -- Step 3 (inbox restore) and Step 4 (spawn dup-gate) read it. **In v1 (FR is the sole migrated team) you do NOT need to emit a session pid** -- Step 3.5's courier restart runs bare (option b), and the lifecycle scripts derive their own `$PPID` best-effort. Only the **v2** multi-migrated-team courier (Step 3.5 option a) needs the live Claude session pid (the CLI process with a `~/.claude/sessions/<pid>.json` entry, the one `--session-pid` resolved against) -- record it then.

**Failure mode -- there is NO create-retry.** If discovery returns no dir, or `config.json` is absent under the discovered slug, that is a substrate/platform fault: the same code path that started the session creates the team, so its absence means the session itself is broken. **STOP and report to the user.** Do NOT attempt to fabricate a team dir by hand (the harness owns that file). Do NOT guess if discovery is genuinely ambiguous -- the resolver fails fast with the candidate list.

**Multi-dir is the norm, not an error (Brunel WS1 finding 2026-06-18).** A real host has many team dirs (11 on this box). The resolver returns `ambiguous ... (live: [])` and exits non-zero UNLESS you disambiguate -- so always pass a disambiguator: `--session-pid "$PPID"` on 2.1.178+ (the dir is `session-<id>` and the live session's pid maps to it), or `--team-dir-name framework-research` on the 2.1.177 bridge (dirs are TeamCreate-named, so the explicit override is the only thing that resolves). Ambiguity here is the **expected** state of an undisambiguated call, not a fault to STOP on -- supply the disambiguator. STOP only when even the disambiguated call fails (genuine absence / a slug you cannot positively identify).

**Cold-start window note (probe V4):** `config.json` is written FIRST; `sessions/<pid>.json` appears only at interactive-ready (~10-25s later). If Step 2' runs in that window and there are multiple dirs, the pid tiebreaker is not yet usable -- single-dir glob still resolves (the common case). For a multi-dir cold start, prefer a short wait for `sessions/<pid>.json` before passing `--session-pid`, OR accept single-dir-glob with fail-fast-then-retry. By the time the Step 3 / Shutdown-S4 lifecycle scripts run (after this gate), the pid entry is reliably present.

**Cold-start false-negative (S57 halt -- *FR:Herald*, 2026-06-18):** the window is not only a degraded-pid-tiebreaker problem; it produces false negatives for ANY existence/liveness probe. A discovery or liveness probe that returns "nothing here" within ~25s of cold start must AWAIT/RETRY before reporting absence -- never conclude lazy-create. (S57's halt was exactly this false negative: `config.json` was present but the probe checked inside the window before `sessions/<pid>.json` existed and mis-generalized the transient absence as a permanent "lazy-create" property.)

#### Operational gate (*FR:Volta* -- from R4-3, retained under implicit teams)

**Do NOT spawn any agent until the team is verified operational.** In Restart 4 an agent was spawned into a broken team and wasted. The verify-on-disk check above IS this gate -- one `ls` under the *discovered* slug separates a working team from a broken one. Do not proceed to Step 4 (Spawn) until `config.json` is confirmed under `$SLUG`.

### Step 3: Restore inboxes from repo

```bash
REPO="$(git rev-parse --show-toplevel)"
bash "$REPO/teams/framework-research/restore-inboxes.sh"
```

The script handles:

- **Runtime-discovers the team dir name** via the shared resolver (NOT the hardcoded `framework-research`), passing `--session-pid "$PPID"` for the 2.1.178+ pid tiebreaker, then targets `~/.claude/teams/<discovered-slug>/inboxes/`. **On the 2.1.177 bridge** (multi-dir, TeamCreate-named), export `FR_COURIER_TEAM_DIR_NAME=framework-research` before running -- the script forwards it as the resolver's `--team-dir-name` override (the only thing that disambiguates a multi-dir 2.1.177 box; shared env with the courier per Aen 2026-06-18). Fail-closed: a resolver no-resolve/ambiguity aborts the script (it will NOT write into an empty path).
- Precondition check (runtime dir must exist) + `mkdir -p` the `inboxes/` dir (bare-fresh sessions have no `inboxes/` until first activity). **This step runs BEFORE Step 3.5 (courier restart) specifically so the `inboxes/` dir exists when the courier validates it** -- see the Step 3.5 ordering note (Bug A, *FR:Volta* S58).
- Copies inbox JSON files from repo to runtime, **keyed by agent name** (`team-lead.json`, ...) -- the agent-name keying is what makes the durable copy portable across `session-<id>` rotations
- **Prunes stale shutdown/idle messages** (shutdown_request, shutdown_approved, shutdown_response, idle_notification)
- Verification (source/dest count match)
- Exit code 0 on success, 1 on error

**Why this is MORE load-bearing now:** the runtime dir is platform-ephemeral *and* its name rotates every session; the durable copy in the repo (agent-name-keyed) is the only bridge across both. Restore runs *during* startup while the session is **active** -- it rides the normal active-session inbox-read path (probe P4-class, confirmed on 2.1.181), NOT the idle-proactive-wake path (P6, inconclusive on 2.1.181). Restore correctness does not depend on proactive wake.

**Verify:** Script outputs "Restored N inbox(es)..." or "No repo inboxes found..." (cold start). Non-zero exit = error, investigate before proceeding.

### Step 3.5: Restart the FR courier (the rotation fix) (*FR:Volta* -- 2026-06-18, S55; renumbered from Step 2.5 in S58; 2.1.178+ only)

**Ordering note (Bug A fix -- *FR:Volta* S58, 2026-06-18):** this step runs **AFTER Step 3 (restore)**, not before. The courier's `validate_startup` requires its resolved `inboxes_dir` to exist; on a bare-fresh cold boot that dir is first created by Step 3's `restore-inboxes.sh` (`mkdir -p`). Running the courier first crashed it (`inboxes_dir does not exist`) until Step 3 had run. **Two fixes, belt-and-suspenders:** (a) this reorder (Step 3 before Step 3.5), and (b) the courier now self-creates its resolved `inboxes_dir` in `validate_startup` (`mkdir parents/exist_ok`, matching its sibling state/spool/inject dirs -- Brunel, S58), so the courier is robust regardless of boot order or caller. Bonus of the reorder: inboxes are restored **before** the courier starts polling, so there is no window where a live courier acts on a half-populated inbox dir.

**Why this step exists (the rotation fix):** on 2.1.178+ the team dir is `session-<id>`, **random per session**. A courier resolves its `inboxes_dir` **once** at Config-load -- so a courier left running from a prior session tracks a **stale, dead** team dir and silently delivers nothing. The fix is to **restart the courier at each session start onto auto-discovery**: the restart re-resolves the current live `session-<id>`, which is what solves rotation. The single-session probe could not surface this (no rotation in one session).

**You do NOT touch any config -- the wrapper owns the auto/explicit choice (launch-override).** There are **two local configs** (gitignored infra, persisted on disk, NOT committed): `fr-courier.config.json` (the explicit-default -- **always safe**, a plain start can never crash) and `fr-courier.config.auto.json` (the `inboxes_dir:"auto"` variant). The wrapper's `-Config` **defaults to `.auto.json`**, so the no-arg call loads auto -- and **only the wrapper ever loads auto**, behind its V4 pre-flight dry-run guard. So Step 3.5 is one call; you do not edit any config, set `inboxes_dir`, or manage the auto/explicit choice.

**Courier lifetime is CLI-version-SPLIT (Direction #4 amendment, ratified S58 2026-06-18 -- *FR:Volta*; Herald rotation-teardown contract §3).** The earlier "courier stays UP between sessions, no stop step needed" property is **2.1.177-ONLY** and is **RETIRED on 2.1.178+** -- obsolete, not broken: the static `inboxes_dir` path it relied on no longer exists once the team dir is a per-session `session-<id>`.

- **2.1.177 (bridge / rollback baseline):** the explicit config has a static path, so that courier MAY stay up between sessions and is left untouched -- this is the rollback baseline.
- **2.1.178+ (the live path):** the courier is **PER-SESSION**. Step 3.5's restart-at-session-start is a full **reap-then-restart**: `stop-fr-courier.ps1` kills + drains + releases the lock of the prior-session courier *against the launched `-Config` (default `.auto.json`)*, THEN `start-fr-courier.ps1` re-resolves the live `session-<id>` and acquires. The courier is NOT "left up untouched" between sessions on 2.1.178+ -- it is reaped and re-pointed each session start. (Making the explicit config session-aware was REJECTED -- it would duplicate the resolver.)

Rollback = stop calling the wrapper (on the 2.1.177 baseline the explicit default is untouched); the CLI-side rollback is reinstall 2.1.177 + revert the tracked-files commit.

**v1 invocation (option b -- OMIT the pid):** while **FR is the sole migrated 2.1.178+ team** on the host, the courier's bare `"auto"`+process-liveness resolution narrows to the one live `session-<id>` (FR's own). No pid needed; the restart-at-session-start handles rotation by itself.

**Precondition:** Step 2' confirmed the team operational AND Step 3 (restore) has run (so the runtime `inboxes/` dir exists -- the Bug A ordering above). (No SESSION_PID hand-off is needed for the courier in v1 -- see the v2 note.)

```powershell
# Windows substrate (the live FR host). ONE line, no args. The wrapper loads fr-courier.config.auto.json
# (the wrapper's -Config default -- NOT the explicit fr-courier.config.json); runs a read-only pre-flight
# dry-run of the SAME resolution the courier will do at Config-load (so a mis-timed restart ABORTS and
# leaves the live courier UNTOUCHED rather than taking comms down); stop-fr-courier.ps1 (hard-kill +
# external --drain-once + lock release) -> start-fr-courier.ps1 on the auto config; courier resolves
# FR's live session-<id> via bare liveness.
./teams/framework-research/poc/ghost-bridge/restart-fr-courier-with-pid.ps1
```

**Verify:** the wrapper prints the `(b) no -SessionPid -- bare auto+liveness` line and the restart; check `fr-courier.log` shows `inboxes_dir` resolved to `~/.claude/teams/session-<id>/inboxes` (the live session's dir, NOT a stale one and NOT the literal `framework-research`). The wrapper is **self-protecting**: its pre-flight dry-run aborts (leaving the running courier untouched) if resolution fails -- e.g. a restart placed too early in the V4 cold-start window before `sessions/<pid>.json` exists. If it aborts, retry the step once the session is fully interactive-ready.

**v2 upgrade (option a -- pass the pid; multi-migrated-team only):** once a **second** team migrates to 2.1.178+ on the same host, bare liveness can see >1 live `session-<id>` and the courier needs FR's specifically. Then pass FR's Claude-session pid: `restart-fr-courier-with-pid.ps1 -SessionPid <claude-session-pid>` -- the wrapper binds `FR_COURIER_SESSION_PID` so the resolver's pid tiebreaker picks FR's dir. The supplied pid MUST be the live Claude session pid (the one with `~/.claude/sessions/<pid>.json`), NOT the launcher/script pid; the wrapper **fails closed** if that file is absent. Step 2' would then need to emit the session pid for this step. **v1 omits all of that** -- it is the simpler correct default while FR is the only migrated team.

**2.1.177 bridge note:** Step 3.5 is a **2.1.178+ step -- do NOT call it on the pinned CLI** (the courier stays on the default explicit-path config, which is always safe). Even if called on 2.1.177, the wrapper's pre-flight dry-run aborts (the multi-dir fail-fast) rather than crashing the courier. If FR runs no cross-team courier this session, Step 3.5 is skippable (it only matters when the courier must track the live inbox dir).

### Step 4: Spawn agents

Ask the user which agents to spawn. Do NOT auto-spawn any agent (including Medici). Spawn per task requirements. Before each spawn, check `config.json` **under the discovered `$SLUG`** -- if agent name already exists, use SendMessage instead of spawning. `members[]` injection and SendMessage targeting are confirmed working on 2.1.178+ (probe P4), so the spawn + ghost-courier registration path is unchanged except for the discovered-slug dir.
**Verify:** No `name-2` entries in `config.json`.

## Shutdown Procedure (*FR:Volta* -- 2026-03-13; 4-phase on 2.1.178+, 2026-06-18)

**Execute these steps in exact order after deciding to shut down.** See `topics/06-lifecycle.md` for full rationale. On 2.1.178+ this is a **4-phase** procedure (S1-S4) -- old S5 (leadership release) is deleted because leadership evaporates on process exit (see Step S5 below).

### Step S1: Halt

Stop accepting new work. Let agents finish current tasks.

### Step S2: Own scratchpad + task snapshot + shutdown requests

**S2a. Write your own scratchpad FIRST** -- before task snapshot or agent shutdown. Write to `memory/team-lead.md` with tags: `[DECISION]`, `[WIP]`, `[DEFERRED]`, `[LEARNED]`, `[WARNING]`. You have the clearest picture of your own state right now -- by S4 you'll be cognitively loaded with git operations.

**S2b. Task snapshot:**

```bash
# Create task snapshot BEFORE sending shutdown -- this is when you have the best picture
# TaskList output → memory/task-list-snapshot.md
```

**S2c.** Send shutdown requests to all agents. Wait for each agent's closing report (`[LEARNED]`, `[DEFERRED]`, `[WARNING]`).

### Step S3: Collect

Wait for `teammate_terminated` from each agent. Do NOT proceed on `shutdown_approved` alone -- the agent may still be writing its scratchpad.

### Step S4: Persist inboxes + commit (LAST durable step)

```bash
REPO="$(git rev-parse --show-toplevel)"
bash "$REPO/teams/framework-research/persist-inboxes.sh"

# Commit all session state
cd "$REPO"
git add teams/framework-research/memory/
git add teams/framework-research/inboxes/
git commit -m "chore: save team state (scratchpads, tasks, inboxes)"
git push
```

The persist script handles:

- **Runtime-discovers the team dir name** via the shared resolver (NOT the hardcoded `framework-research`), passing `--session-pid "$PPID"`; reading from `~/.claude/teams/<discovered-slug>/inboxes/`. Same 2.1.177-bridge override applies: export `FR_COURIER_TEAM_DIR_NAME=framework-research` on the pinned CLI. Fail-closed on no-resolve/ambiguity.
- Copies inbox JSON files from runtime to repo, **keyed by agent name** (the durable, name-rotation-proof copy)
- Prunes to last 100 messages per file
- Verification (source/dest count match)
- Exit code 0 on success, 1 on error

**Verify:** `git log --oneline -1` shows the commit. Inboxes are in the repo.

**This is now the last durable action at shutdown** -- old S5 (leadership release) is deleted (see below), so the persist + commit is the final step before process exit.

### Step S5: Release team leadership -- **DELETED on 2.1.178+** (*FR:Volta* -- 2026-06-18, S55)

**There is no S5.** On the old explicit-team CLI, the parent CLI held in-memory team-leadership state that survived `/clear`, and `TeamDelete` was the only primitive that released it -- so S5 called `TeamDelete` on graceful exit. On 2.1.178+ **all three clauses of that rationale evaporate**:

- Leadership is **not a held token** -- it is the implicit property of a running session.
- It does not survive process exit -- **process exit IS the release.** When the CLI process ends, the live session ends, and with it the implicit leadership.
- There is **no `TeamDelete`** to call and **nothing to release.** The next session derives a fresh `session-<id>` and ignores any leftover dir, so there is no acquire-step that stale state could block.

S5 is therefore **deleted, not replaced.** The shutdown protocol goes from **5 phases to 4** (S1-S4). The old symmetry argument (startup Phase 2 `TeamDelete` ⟷ shutdown Phase 5 `TeamDelete`) also evaporates -- there is no create/delete pair to be symmetric about. The new symmetry: startup **discovers** the implicit team; shutdown **persists** durable state and exits. Both ends are about durable state in the repo, not leadership tokens.

**Residue -- stale-dir hygiene (NOT a shutdown step):** `TeamDelete` used to also remove the on-disk team dir, so dirs no longer get cleaned on exit and `~/.claude/teams/session-*/` accumulates. This is **disk hygiene, not a leadership concern and not a per-shutdown blocker** (the next session ignores leftovers; the resolver's liveness filter skips dead dirs). Handle it out-of-band via an optional pid-guarded sweep that MUST exclude the live session's own dir and keys liveness on **process-liveness** (not the `status` field -- probe V3: dead sessions linger `status:"idle"`). Kept OUT of the mandatory sequence so a failed sweep never blocks a session. See `topics/06-lifecycle.md` (Stale-dir hygiene) + gotcha #5.

## Environment Notes

- **CLI version:** 2.1.178+ (implicit teams; no `TeamCreate`/`TeamDelete`). This file is correct ONLY on 2.1.178+ -- on 2.1.177 Step 2' has no team to discover. Do not run this startup against a 2.1.177 CLI.
- **Platform:** the **LIVE FR substrate is the Windows dev box** (FR's only host; dev-only by policy). The abstract lifecycle scripts (`restore-inboxes.sh` / `persist-inboxes.sh`) are `$SCRIPT_DIR`/`$HOME`-portable and run under Git Bash; the live **courier** is PowerShell (`start-fr-courier.ps1` / `stop-fr-courier.ps1`). The historical "Linux (Ubuntu)" note described the abstract `.sh` scripts, not the live host.
- **Git remote:** `mitselek/ai-teams` (private)
- **This is a research team** -- no production code, only design docs
- **jq** is available and used by lifecycle scripts
- **python3** is required by the team-dir resolver shim (`stationmaster-courier.py --resolve-team-dir`) the lifecycle scripts call for runtime team-name discovery

### ⚠ Cutover notes -- validate at the 2.1.181 flip (*FR:Volta* -- 2026-06-18, S55)

1. **Windows-substrate validation (not yet exercised at the flip):** the lifecycle scripts + the resolver shim were authored against the abstract Linux model but the live host is Windows. At the flip, quick-validate: (a) `python3` vs `python` on Git Bash -- the scripts call `python3`; if only `python` is on PATH, set an alias or adjust; (b) `$PPID` in a `bash script.sh` invocation on the Windows box -- confirm it resolves to the Claude session pid (the disambiguator depends on it on 2.1.178+); (c) the courier restart-with-pid (Step 3.5) is the `.ps1` path, not the `.sh` path.
2. **Commit stays gated:** team-lead (Aen) holds the commit until the CLI flips to 2.1.181. This file BREAKS on 2.1.177 by its own CLI-version note above, so the rewrite + the flip are ONE coherent step. Do not commit ahead of the flip.

(*FR:Volta*)
