# Lifecycle

Spawning, scaling, shutdown, and handover of teams.

## Canonical Startup Protocol (_FR:Volta_)

### Decision

Startup is a 7-phase sequence: **Orient → Sync → Clean → Create → Restore → Audit → Spawn**. Each phase has a precondition and a verifiable outcome. Skipping or reordering any phase produces a known failure mode (documented below).

### Rationale

Both reference teams (rc-team and hr-devs) converged on the same pattern independently, but with implementation scattered across prompts, scripts, and MEMORY.md entries. The core insight: `TeamCreate` is destructive — it requires a clean directory but must preserve inboxes. This forces a backup-delete-create-restore dance that is the single most fragile part of the lifecycle. Making it explicit and atomic prevents the most common startup failures.

### Phase Ordering is Mandatory (_FR:Volta_ — amendment from restart test 3, 2026-03-13)

Field test (2026-03-13, restart 3) showed the team-lead executed phases out of order AND mislabeled them (called Phase 3 Create "Phase 1: Sync"). The actual execution order was: Explore (not in protocol) → Phase 2.0 Diagnose + git pull (mixed) → Phase 3 Create (mislabeled) → read config files (should have been Phase 0) → Phase 5 Audit. Cost: 73.5k tokens and 2m18s wasted on an Explore agent that Phase 0 would have replaced.

**Rule:** Execute phases in the numbered order. State the phase name before executing it. Each phase's precondition is that the previous phase completed successfully. `startup.md` provides the condensed executable checklist — follow it mechanically, step by step.

**Why this happens:** The team-lead is under pressure to "get going" and jumps to what feels most urgent (diagnosis, creation) instead of following the sequence. The sequence exists because each phase's output is a precondition for the next. Reordering doesn't just waste tokens — it produces wrong conclusions (e.g., diagnosing before reading the roster means you don't know what state to expect).

### Phase 0: Orient (_FR:Volta_ — amendment from restart test 3, 2026-03-13)

**Precondition:** Team lead has started (either via `rc-start.sh` or manually). May be a fresh session with zero context about the team.

**Problem this solves:** Field test (2026-03-13, restart 3) showed a fresh team-lead spent 31 tool uses, 73.5k tokens, and 2 minutes 18 seconds exploring the codebase to find team config, roster, and prompts. This is pure waste — the same information could be obtained by reading 5 files in a fixed order. Every team-lead (including a context-less fresh session) must be able to self-orient without broad exploration.

**Action:** Read exactly these files, in this order:

| #   | File                       | What it tells you                                                     | Where to find it                                                      |
| --- | -------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 0a  | `startup.md`               | Installation-specific paths, procedures, known gotchas                | Team config dir (location must be in team-lead's prompt or MEMORY.md) |
| 0b  | `roster.json`              | Team name, members, models, `workDir`                                 | Same directory as startup.md                                          |
| 0c  | `common-prompt.md`         | Mission, communication rules, shutdown protocol, startup instructions | Same directory                                                        |
| 0d  | Team-lead's own scratchpad | Prior session's decisions, WIP, warnings                              | `memory/team-lead.md` (relative to team config dir)                   |
| 0e  | `docs/health-report.md`    | Latest Medici audit findings (if exists)                              | `docs/` within team config dir                                        |

**`startup.md` is the bootstrap file.** It contains installation-specific paths (repo location, workDir, env files), the condensed startup procedure, and known environment gotchas. It is the FIRST file a team-lead reads — before roster, before common-prompt, before anything. Each team must maintain a `startup.md` with at minimum: exact paths for this installation, the read-order checklist, the diagnostic procedure, and known environment issues.

**Why `startup.md` and not just Phase 0 in the lifecycle doc?** The lifecycle doc (`topics/06-lifecycle.md`) is a framework-level design document — it describes the _protocol_. `startup.md` is an _instance_ — it contains the concrete paths, gotchas, and procedures for one specific team on one specific machine. A team-lead should never need to read the 700-line lifecycle doc to start a session. `startup.md` is the executable checklist derived from the protocol.

**Critical: The team config dir location must be resolvable without exploration.** It must appear in exactly one of:

1. The team-lead's prompt (preferred — always available)
2. MEMORY.md (if teams are managed across projects)
3. A well-known path convention (e.g., `$HOME/.claude/team-configs/<team-name>/`)

If the team-lead's prompt does not contain the repo location, this is a **prompt gap** that must be fixed.

**Expected outcome:** Team lead knows: team name, all members and their roles, the working directory, the mission, and any prior session state. All from 5 file reads, zero exploration.
**Failure if skipped:** Team lead burns tokens on broad exploration (Explore agent, glob/grep sweeps). In the field test, this cost ~2 minutes and consumed significant context window.

#### workDir Resolution (_FR:Volta_ — amendment from restart test 3, 2026-03-13)

The `workDir` field in `roster.json` may be stale or use environment variables that resolve differently across machines. The field test found `$HOME/github/mitselek-ai-teams` in roster.json but the actual path was `$HOME/Documents/github/mitselek-ai-teams/`.

**Validation step (part of Phase 0):**

```bash
# After reading roster.json, resolve and validate workDir
WORK_DIR=$(eval echo "<workDir from roster.json>")
if [ ! -d "$WORK_DIR" ]; then
  echo "WARNING: workDir '$WORK_DIR' does not exist."
  echo "Attempting fallback: $HOME/Documents/github/<repo-name>"
  WORK_DIR="$HOME/Documents/github/<repo-name>"
  if [ ! -d "$WORK_DIR" ]; then
    echo "ERROR: Cannot resolve workDir. Ask user."
    exit 1
  fi
  echo "ACTION NEEDED: Update roster.json workDir to '$WORK_DIR'"
fi
```

**If workDir is wrong:** The team-lead must flag it for correction (not silently use the fallback). The roster is a team-wide contract — a wrong `workDir` will trip up every agent that reads it.

### Phase 1: Sync

**Precondition:** Orient complete. Team lead knows the team config repo location and workDir is validated.
**Action:** Pull the team config repository to get the latest prompts, roster, and common-prompt.

```bash
cd <team-config-repo> && git pull
```

**Expected outcome:** Prompts, roster, and common-prompt are at HEAD.
**Failure if skipped:** Stale prompts or roster — agents spawn with outdated instructions or wrong models.

### Phase 2: Clean

**Precondition:** Orient and Sync complete. Team lead has read the roster, common-prompt, and own scratchpad (Phase 0), and pulled the latest config (Phase 1).
**Action:** Four sub-steps, strictly ordered:

```
2.0. Diagnose team dir state
2a.  Backup inboxes (if stale team dir exists)
2b.  Kill zombie agent processes (tmux panes, background daemons)
2c.  Remove stale team directory
```

#### Phase 2.0a: Validate `$HOME` (_FR:Volta_ — amendment from restart 4, 2026-03-13)

**Problem this solves:** Restart 4 field test revealed that `$HOME` resolves to an EMPTY STRING in some bash invocations on Windows/Git Bash. The diagnose script then checks `/.claude/teams/framework-research` (root path) instead of the correct user path. Other bash calls in the same session resolved `$HOME` correctly. Shell initialization is inconsistent across bash invocations on this platform.

**Rule: Never use `$HOME` directly in path construction. Always resolve it first and validate.**

```bash
# Resolve HOME — do NOT trust $HOME on Windows/Git Bash
RESOLVED_HOME="$HOME"
if [ -z "$RESOLVED_HOME" ] || [ "$RESOLVED_HOME" = "/" ]; then
  # Fallback: use /c/Users/<username> pattern (MSYS2/Git Bash)
  RESOLVED_HOME="/c/Users/$(whoami)"
fi

# Validate
if [ ! -d "$RESOLVED_HOME" ]; then
  echo "FATAL: Cannot resolve home directory. HOME='$HOME', fallback='$RESOLVED_HOME'"
  echo "Manual intervention required."
  exit 1
fi

TEAM_DIR="$RESOLVED_HOME/.claude/teams/<team-name>"
echo "Using TEAM_DIR=$TEAM_DIR"
```

**Why not just use absolute paths everywhere?** Absolute paths solve the immediate problem but create a new one: `startup.md` and protocol scripts become machine-specific. The `$HOME` validation gate is the correct fix because it keeps scripts portable while defending against the platform bug. However, `startup.md` (which IS machine-specific) SHOULD use absolute paths — it's the one place where portability doesn't matter.

**Impact on all subsequent phases:** Every bash script in Phases 2-4 that references `$HOME` must use `$RESOLVED_HOME` instead, or must run this validation first. The reference implementations below are updated accordingly.

#### Phase 2.0b: Diagnose (_FR:Volta_ — rewritten R7, 2026-03-15)

Before touching the filesystem, check whether a stale runtime dir exists. This costs one `ls`.

**Precondition:** `$RESOLVED_HOME` is validated (Phase 2.0a). `$TEAM_DIR` is set.

**Key insight (R7, 2026-03-15):** The runtime dir (`$HOME/.claude/teams/<team-name>/`) is **ephemeral by platform design**. The Claude Code platform does not preserve team directories between CLI sessions. An empty runtime dir at startup is the **normal** state, not an anomaly. All durable state lives in the repo (scratchpads in `memory/`, inboxes in `inboxes/`, both git-tracked). The previous protocol (R1–R6) treated a missing runtime dir as anomalous and required investigation — this was wrong and wasted tokens every session.

```bash
# TEAM_DIR was set in Phase 2.0a — do NOT re-derive from $HOME
if [ -d "$TEAM_DIR" ]; then
  echo "STALE DIR — runtime dir exists (interrupted session or same CLI invocation). Will clean."
else
  echo "CLEAN — no runtime dir. Normal state between sessions."
fi
```

| Scenario  | Meaning                                                          | What 2a–2c do                              |
| --------- | ---------------------------------------------------------------- | ------------------------------------------ |
| STALE DIR | Runtime dir left over from interrupted or same-invocation session | 2b kills zombies if needed, 2c removes dir |
| CLEAN     | Normal state — platform cleaned up after last session            | 2a, 2b, 2c are all no-ops                 |

Both scenarios converge to the same outcome: `$TEAM_DIR` does not exist. **Always run 2a–2c regardless** — they are idempotent and safe on empty state. No anomaly investigation is needed; the repo is the source of truth for all cross-session state.

**Reference implementation (sub-steps 2a–2c):**

```bash
# TEAM_DIR was set in Phase 2.0a ($HOME validation) — do NOT re-derive from $HOME

# 2a — no-op. Inboxes are persisted to the repo during Shutdown Phase 4a.
# Runtime dir inboxes are stale copies — safe to discard with the dir in 2c.

# 2b — kill zombies (RC: kill all non-%0 panes; local: N/A)
# RC-specific: tmux kill-pane for each agent pane
# Local: Agent tool processes terminate with parent session

# 2c — remove stale dir (safe even if it doesn't exist)
rm -rf "$TEAM_DIR"
```

**Expected outcome:** `$TEAM_DIR` does not exist. Ready for Phase 3 (Create).
**Failure if skipped:**

- Skip 2.0b → team lead wastes tokens investigating a non-problem
- Skip 2b → zombie processes hold TTY → new spawn may fail or create invisible agents
- Skip 2c → `TeamCreate` generates a random name (e.g. `cloudflare-builders-a7f3`) → inbox routing breaks, all `SendMessage` calls fail silently

### Phase 3: Create

**Precondition:** `$TEAM_DIR` does not exist. Inboxes backed up.
**Action:** `TeamCreate(team_name="<team-name>")` with post-creation verification and retry.

**Expected outcome:** Fresh `$TEAM_DIR` exists with `config.json` containing `leadSessionId`. No `inboxes/` subdirectory (TeamCreate does not create it).
**Failure if skipped:** No team context → all agent spawning and messaging fails.

**Critical invariant:** The `leadSessionId` in `config.json` must match the current session. A stale `leadSessionId` from a previous session breaks agent-to-lead messaging. This is why TeamCreate must run fresh each session — it generates a new `leadSessionId`.

#### Phase 3 Verification and Retry (_FR:Volta_ — amendment from restart 4, 2026-03-13)

**Problem this solves:** Restart 4 revealed that TeamCreate can return success (`team_file_path` + `leadAgentId`) but `config.json` does NOT exist on disk. The team appears created but is non-functional — agent spawning silently fails. The previous protocol said "verify config.json exists" but had no recovery path when verification failed.

**Rule: TeamCreate is not complete until config.json is verified on disk. If verification fails, retry with TeamDelete + TeamCreate (max 2 attempts).**

```
1. TeamCreate(team_name="<team-name>")
2. Verify: does config.json exist?
   - Check: ls "$TEAM_DIR/config.json" (or Read the file)
   - YES → Phase 3 complete. Proceed to Phase 4.
   - NO  → TeamCreate silently failed. Go to step 3.
3. Recovery attempt (max 1 retry):
   a. TeamDelete(team_name="<team-name>")  — clean up phantom state
   b. TeamCreate(team_name="<team-name>")  — fresh attempt
   c. Verify config.json again
   - YES → Phase 3 complete.
   - NO  → FATAL: TeamCreate is broken. Stop startup. Report to user:
           "TeamCreate succeeded twice but config.json does not exist on disk.
            This is a platform/tool bug. Cannot proceed."
```

**Why TeamDelete before retry:** The first TeamCreate may have registered internal state (the tool returned `leadAgentId`) even though it didn't write config.json. A second TeamCreate without TeamDelete may say "Already leading team" but still not fix the disk state. TeamDelete clears the phantom internal state.

**Why max 2 attempts:** If the tool is fundamentally broken (disk permission issue, path bug), retrying indefinitely wastes time. Two attempts distinguish "transient glitch" from "systematic failure."

**CRITICAL: Do NOT spawn any agents until Phase 3 verification passes.** In Restart 4, Medici was spawned after the first (broken) TeamCreate — the spawn returned "success" but the team was non-functional. The agent was wasted. Phase 3 verification is a hard gate for all subsequent phases.

### Phase 4: Restore (_FR:Volta_ — amended 2026-03-13, inbox durability)

**Precondition:** TeamCreate succeeded. `config.json` exists with fresh `leadSessionId`.
**Action:** Restore inboxes from repo (durable copy persisted during prior session's Shutdown Phase 4a).

```bash
TEAM_CONFIG_DIR="<team-config-repo>/.claude/teams/<team-name>"
# TEAM_DIR is the runtime dir, set in Phase 2.0a

if [ -d "$TEAM_CONFIG_DIR/inboxes" ]; then
  mkdir -p "$TEAM_DIR/inboxes"
  cp -r "$TEAM_CONFIG_DIR/inboxes/"* "$TEAM_DIR/inboxes/"
fi
```

**Restore source:** The repo dir (`$TEAM_CONFIG_DIR/inboxes/`) is the sole source of truth. There is no `/tmp/` fallback. If the repo has no inboxes (first-ever session or inboxes were never committed), this step is a no-op — equivalent to a cold start for inbox state.

**Expected outcome:** `$TEAM_DIR/inboxes/` exists with prior session messages (pruned to last 100 per file). Stale `read: true` messages are harmless.
**Failure if skipped:** No inboxes dir → first SendMessage to any agent fails or creates messages in wrong location.

**Why `mkdir -p` is required:** TeamCreate does NOT create the `inboxes/` subdirectory. Without it, the `cp` command fails silently or writes to the wrong path.

#### Phase 4b: Team Operational Check (_FR:Volta_ — amendment from restart 4, 2026-03-13)

**Problem this solves:** In Restart 4, Medici was spawned after a TeamCreate that returned success but was non-functional (no config.json on disk). The spawn returned "success" but the agent couldn't communicate. The Phase 3 verification (config.json check) should catch this, but if it's somehow bypassed or if there are other failure modes beyond config.json, spawning into a broken team wastes an agent.

**Rule: Before spawning ANY agent (including Medici in Phase 5), verify the team is operational.**

Operational check (after Phase 4 Restore, before Phase 5 Audit):

```
1. Verify config.json exists and is readable:
   - Read "$TEAM_DIR/config.json"
   - Check: contains "leadSessionId" field
   - If FAIL → STOP. Do not proceed to Phase 5. Re-run Phase 3.

2. Verify inboxes dir exists:
   - ls "$TEAM_DIR/inboxes/" (may be empty — that's OK)
   - If dir missing → mkdir -p "$TEAM_DIR/inboxes"

3. State check summary (log, don't act):
   - "Team <name> operational: config.json OK, inboxes dir exists, ready for agent spawn"
```

**Why this is separate from Phase 3 verification:** Phase 3 verifies that TeamCreate wrote config.json. Phase 4b verifies that the entire team infrastructure (config + inboxes) is ready for agents AFTER the restore step. It's a final gate — the last check before committing resources (agent spawns cost tokens).

**Failure mode if skipped:** Agent spawned into broken team → spawn appears to succeed → agent can't send/receive messages → health report never arrives → team-lead waits indefinitely or diagnoses the wrong problem.

### Phase 5: Audit

**Precondition:** Team operational check passed (Phase 4b). Config.json exists with `leadSessionId`, inboxes dir exists.
**Action:** Spawn Medici (health auditor) first, before any other agents.

Medici reads all scratchpads, prompts, and common-prompt, then reports:

- Stale scratchpad entries to prune
- Prompt/common-prompt inconsistencies
- Missing or outdated memory files

**Expected outcome:** Health report delivered. Team lead applies recommendations before spawning work agents.
**Failure if skipped:** Agents spawn with stale scratchpad state, outdated instructions, or conflicting prompt versions. Cost: wasted tokens on confused agents.

### Phase 6: Spawn

**Precondition:** Audit complete. Recommendations applied. Team lead knows which agents are needed (from roster + task).
**Action:** Spawn agents using the correct spawning path (see Spawning Paths below), with duplicate prevention gate.

**Spawn order:** Sequential with confirmation gates:

1. Research agent first (e.g., Finn) → wait for intro report → confirm
2. Review/oversight agents (e.g., Marcus) → wait → confirm
3. Implementation agents (parallel if independent: Sven + Tess + Dag)
4. Specialist agents (only if needed for current task)

**Expected outcome:** All needed agents registered in `config.json`, each with intro report received.

---

## Canonical Shutdown Protocol (_FR:Volta_)

### Decision

Shutdown is a 4-phase sequence: **Halt → Notify → Collect → Persist**. Team lead shuts down last. The repo is the sole durable store — the runtime dir is ephemeral.

### Rationale

The key insight from operational experience: the team directory must survive shutdown so that the next session can restore inboxes. `TeamDelete` destroys this. The shutdown sequence is designed so that no state is lost even if the session is interrupted between phases.

### Phase 1: Halt

**Precondition:** Decision to shut down (task complete, session ending, or forced).
**Action:** Team lead stops accepting new work. No new tasks are delegated.

**Expected outcome:** All agents are either idle or completing their current task. No new work in flight.

### Phase 2: Notify

**Precondition:** Halt declared.
**Action:** Three sub-steps:

#### 2a. Team-lead writes own scratchpad (_FR:Volta_ — amendment from restart 5, 2026-03-13)

**Before** creating the task snapshot or sending shutdown requests, the team-lead writes their own state to `memory/team-lead.md`. Tags: `[DECISION]`, `[WIP]`, `[DEFERRED]`, `[LEARNED]`, `[WARNING]`.

**Why this step exists and why it comes first:** Field observation (R5, 2026-03-13): team-lead scratchpad was missing after shutdown. The team-lead manages everyone else's shutdown (task snapshot, agent notifications, waiting for termination, git commit) and runs out of cognitive budget for own state. By the time Phase 4 (Persist) runs, the lead's context is near limit and own scratchpad is forgotten. Placing this FIRST in Phase 2 — when the lead still has full context and no coordination load — prevents this.

**The mechanism already exists** — all agents persist to `memory/<name>.md` in the repo dir. Team-lead simply uses the same path (`memory/team-lead.md`). No new infrastructure needed.

#### 2b. Create task-list-snapshot (_FR:Volta_ — amendment from restart test 2026-03-13)

**Before** sending shutdown to agents, team lead creates `memory/task-list-snapshot.md`. This is when the lead has the best picture of task state — all agents still alive, tasks fresh in context. By Phase 4 (Persist), the lead's context is near limit and this step gets forgotten.

```bash
# Dump current task state — raw format, no synthesis needed
# TaskList output → memory/task-list-snapshot.md
# Include: task ID, status, assignee, one-line description, blockers
```

**Rationale for timing:** The previous protocol placed the snapshot in Shutdown Phase 4 (Persist). Field testing showed this is the worst possible timing — the team lead is the last agent standing, executing a multi-step git sequence, with context near limit. Moving it to Phase 2 (before agents shut down) means the lead can even ask agents for status updates to improve snapshot accuracy.

#### 2c. Send shutdown requests

Send shutdown request to all agents (broadcast or one-by-one).

Each agent, on receiving shutdown:

1. Write in-progress state to scratchpad (`[WIP]` or `[CHECKPOINT]`)
2. Send closing message to team-lead with exactly 3 items (1 bullet max each):
   - `[LEARNED]` — key discovery worth remembering
   - `[DEFERRED]` — unfinished work with reason
   - `[WARNING]` — risk or blocker for next session
3. Approve the shutdown

**Expected outcome:** Team-lead scratchpad written (2a), task snapshot created (2b), all agents have saved state and sent closing messages (2c).

### Phase 3: Collect

**Precondition:** All agents have responded (approved or rejected shutdown).
**Action:** Team lead waits for `teammate_terminated` from each agent.

**Critical:** `shutdown_approved` is NOT sufficient. The agent process may still be writing its scratchpad. Wait for `teammate_terminated` before proceeding.

**For RC/tmux:** Panes close automatically after `shutdown_approved` — do NOT call `tmux kill-pane` manually (causes race conditions with scratchpad writes).

**Expected outcome:** All agent processes terminated. Team lead is the only active process.

#### Phase 3a: PURPLE grace period watchdog (_FR:Volta_ — 2026-04-09, from T09 v2)

**Applies to:** Cathedral-tier teams running the XP development pipeline (T09). PURPLE (the Refactorer) may be mid-refactor when shutdown arrives, with tests temporarily broken while it migrates call sites. The standard `teammate_terminated` wait is insufficient — a naive wait risks hanging the shutdown indefinitely, and a naive timeout risks corrupting the working tree.

**This subsection extends Phase 3 for PURPLE only.** All other agents follow the standard Phase 3 wait. PURPLE enters this state machine instead.

**Spec source:** [T09 v2 "Mid-Cycle Shutdown: Watchdog + Team Lead Authority"](09-development-methodology.md). This amendment is faithful propagation from T09 into T06 — no new design decisions.

##### The composed model

Three round-5 contributions compose into one mechanism:

1. **Git-state watchdog (Volta).** The watchdog monitors the git working tree, not wall-clock time. Polling every 10 seconds. A PURPLE that has not changed any files in 60 seconds is either done or stuck — both warrant action. A PURPLE that is actively modifying files is doing work, regardless of how long it takes.
2. **5-minute soft boundary (Monte).** Inside 5 minutes from the shutdown request, PURPLE holds sovereignty over its atomic commit. At the 5-minute mark, team-lead termination authority activates and decides based on watchdog state.
3. **`[DEFERRED-REFACTOR]` Librarian handoff (Medici).** Before PURPLE reverts uncommitted work, it submits the intended refactoring to the Librarian as a `[DEFERRED-REFACTOR]` entry — a description of what PURPLE was trying to do and why. The next session's PURPLE queries this entry and resumes from the reverted state. Memory bridge across the revert, not a replacement for the watchdog.

##### Watchdog trigger

After the team lead sends `shutdown_request` to PURPLE, the team lead begins polling git state every 10 seconds:

```bash
# Per-poll checks (run every 10 seconds after shutdown_request sent to PURPLE):
MODIFIED_FILES=$(git status --short | wc -l)
NEW_COMMITS=$(git log --since="$SHUTDOWN_REQUEST_TIME" --oneline | wc -l)
```

The poll does not wait on PURPLE; it observes the working tree independently. PURPLE may be idle, thinking, or mid-commit — the watchdog only cares what the tree shows.

##### Four exit states

| State | Signal | Action | Authority |
|---|---|---|---|
| **Clean exit** | `shutdown_approved` received (any time before 5-minute boundary) | Proceed with standard Phase 3 wait for `teammate_terminated`, then Phase 4. | PURPLE |
| **Atomic commit completed** | Working tree clean AND ≥1 new commit since `shutdown_request`, but no `shutdown_approved` yet | Wait 30 seconds for `shutdown_approved`. If still not received, force-terminate cleanly (PURPLE finished its refactoring but got stuck on the shutdown handshake). | PURPLE |
| **Hung** | Working tree unchanged for 60 seconds AND no new commits since `shutdown_request` | `git reset --hard HEAD` to revert any uncommitted changes. Force-terminate PURPLE. Next session's PURPLE starts from HEAD. | Team lead (via watchdog) |
| **Stuck mid-refactor** | Files changing but no commits after 3 minutes | Team lead intervenes: either extend the grace period once (give PURPLE another 2 minutes) or force-revert if the changes look incoherent. Case-by-case judgment, not automated. | Team lead |

**Why 60 seconds for the unchanged-files check.** An actively refactoring PURPLE touches files within any 60-second window. A PURPLE that has stopped touching files is either done (waiting to send `shutdown_approved`) or hung. Sixty seconds distinguishes these from momentary pauses (reading a file, planning a rename) without wasting shutdown time on a truly hung process. The value is tunable per deployment; the reasoning is what matters.

**Why git state and not wall-clock time.** Refactoring duration is highly variable — a rename across N files can be 30 seconds or 5 minutes. A wall-clock budget either terminates legitimate work or waits too long on a stuck PURPLE. Worse, a wall-clock limit creates false urgency: PURPLE under time pressure may commit incomplete work to "beat the watchdog," which is exactly the failure mode the atomic-commit rule exists to prevent. Observing git state asks the right question — "is PURPLE making progress toward an atomic commit?" — rather than "has PURPLE used too much time?"

##### Authority progression and escalation rule

```
t=0       shutdown_request sent to PURPLE
          │
          ├── PURPLE has sovereignty over its atomic commit
          ├── Watchdog observes git state every 10 seconds
          │
t=0-300s  (inside the 5-minute soft boundary)
          │   Watchdog may still trigger the Hung state at 60s unchanged,
          │   which is a delegated team-lead authority baked into the
          │   watchdog. Everything else: PURPLE decides.
          │
t=300s    5-minute soft boundary — team lead termination authority activates
          │
          ├── If state is Clean exit or Atomic commit → already proceeded
          ├── If state is Hung → already handled by watchdog
          └── If state is Stuck mid-refactor → team lead decides now
              │
              ├── Extend grace period once (additional 2 minutes), OR
              └── Force revert (git reset --hard HEAD + force-terminate)
```

**Escalation rule:** At the 5-minute boundary, if the state is "stuck mid-refactor," the team lead forces termination. **PURPLE cannot refuse.** Execution authority (L3) does not override coordination authority (L2). This is the standard L3→L2 relationship from T04, made explicit for PURPLE because the refactoring context creates a temptation to claim "I'm about to finish — just a bit more."

##### Librarian handoff before revert

Before the team lead issues `git reset --hard HEAD` (in either the Hung state or the team-lead-forced revert from Stuck mid-refactor), PURPLE must submit a `[DEFERRED-REFACTOR]` entry to the Librarian. This is a brief description of what PURPLE was attempting and why:

```markdown
## Knowledge Submission
- From: purple-<pipeline>
- Type: pattern
- Scope: team-wide
- Urgency: standard
- Tag: [DEFERRED-REFACTOR]

### Content
Refactoring intent: <what PURPLE was trying to do>
Trigger: <why — e.g., "duplication across modules X and Y",
          "leaky abstraction in module Z">
State at revert: <files touched, call sites migrated, remaining work>

### Evidence
<files involved, CYCLE_COMPLETE of most recent successful cycle>
```

The next session's PURPLE queries the Librarian for `[DEFERRED-REFACTOR]` entries on first activation. If it finds one relevant to the current story, it resumes from the reverted state. The reverted work is not lost — only the in-progress code is gone, and the intent is preserved in the wiki. This is a **memory bridge**, not a replacement for the revert. The git state is clean; the knowledge of what to do next session is preserved.

**If the team has no Librarian (Standard tier or below),** the `[DEFERRED-REFACTOR]` entry goes into the team-lead's scratchpad with a `[WIP]` tag. Less durable but still functional: the next session's team lead reads it during Phase 0 Orient and can brief PURPLE manually.

##### Expected outcome

- All agents (including PURPLE) terminated. Team lead is the only active process.
- Working tree is clean: either PURPLE committed atomically, or the watchdog/team-lead reverted uncommitted changes.
- If revert happened, an `[DEFERRED-REFACTOR]` entry exists in the Librarian (or team-lead scratchpad) describing the interrupted work.

##### Failure modes

| Failure | Cause | Mitigation |
|---|---|---|
| Watchdog terminates a legitimate long-running refactor | Refactor genuinely needs >60s of continuous file edits but took a brief pause | Tune the unchanged-files window per deployment (60s is a default, not a law). Document the tuning in team's `startup.md`. |
| Team lead forgets to run the watchdog and standard Phase 3 wait hangs indefinitely | Human/protocol error — team lead treated PURPLE like any other agent | `startup.md` and team-lead prompt must explicitly list PURPLE in the watchdog path. Duplicate check at spawn: if roster contains PURPLE, the shutdown protocol must include Phase 3a. |
| `[DEFERRED-REFACTOR]` entry is lost because Librarian crashed during submission | Librarian SPOF (see T09) | Team lead respawns Librarian (per T09's standard SPOF handling). PURPLE retries the submission. If that fails, the entry falls back to team-lead scratchpad. |
| Next session's PURPLE does not check for `[DEFERRED-REFACTOR]` entries | PURPLE prompt gap | PURPLE prompt template must include "On activation, query Librarian for `[DEFERRED-REFACTOR]` entries matching current story." This is a T09 Cathedral-tier deployment checklist item. |

##### Non-scope for this amendment

- **Watchdog tooling implementation.** The mechanism is specified here, but the actual polling loop, git state detection, and integration with the spawning scripts are implementation work (not T06 design).
- **Refactoring duration metrics.** The 60-second unchanged-files window and 3-minute stuck-mid-refactor threshold are documented defaults, not measured field values. Future field data may tune them.
- **Non-PURPLE L3 agents with similar risk profiles.** If another role develops a similar mid-shutdown risk (e.g., a long-running data migration agent), this Phase 3a extension can be generalized — but that is future work, not this amendment.

### Phase 4: Persist (_FR:Volta_ — amended 2026-03-13, inbox durability)

**Precondition:** All agents terminated. Task snapshot already created (Phase 2b).
**Action:** Copy inboxes from runtime dir to repo, then commit all session state to version control.

#### Phase 4a: Persist inboxes to repo (_FR:Volta_ — 2026-03-13)

**Problem this solves:** The previous protocol relied on the runtime dir (`$HOME/.claude/teams/...`) surviving between sessions. Phase 5 (Preserve) said "do NOT call TeamDelete" to keep inboxes alive. But the runtime dir is ephemeral — reboots, manual cleanup, or OS temp cleanup can destroy it. Field observation (2026-03-13): COLD START despite 5 prior commits in memory/. All closing reports from the previous session were lost because they existed only in the runtime dir's inboxes.

**Key insight: there are TWO `.claude/teams/<team-name>/` directories:**

| Directory   | Location                                        | Owner                 | Durability                                         |
| ----------- | ----------------------------------------------- | --------------------- | -------------------------------------------------- |
| Runtime dir | `$HOME/.claude/teams/<team-name>/`              | Platform (TeamCreate) | Ephemeral — survives only until dir is removed     |
| Repo dir    | `<team-config-repo>/.claude/teams/<team-name>/` | Team (git-tracked)    | Durable — survives reboots, available on any clone |

Scratchpads live in the repo dir and are already committed. Inboxes live in the runtime dir and were NOT committed — this was the gap. The fix: copy inboxes from runtime to repo during shutdown, making them durable.

**Rule: On shutdown, copy pruned inboxes from runtime dir to repo dir. The repo is the sole source of truth for inbox restore.**

```bash
# Phase 4a: Persist inboxes
TEAM_CONFIG_DIR="<team-config-repo>/.claude/teams/<team-name>"
RUNTIME_DIR="$RESOLVED_HOME/.claude/teams/<team-name>"

if [ -d "$RUNTIME_DIR/inboxes" ]; then
  mkdir -p "$TEAM_CONFIG_DIR/inboxes"
  # Copy with pruning: keep only the last 100 messages per inbox file
  for inbox_file in "$RUNTIME_DIR/inboxes/"*.json; do
    [ -f "$inbox_file" ] || continue
    filename=$(basename "$inbox_file")
    # jq: keep last 100 array elements (messages are stored as JSON arrays)
    jq '.[-100:]' "$inbox_file" > "$TEAM_CONFIG_DIR/inboxes/$filename"
  done
fi
```

**Pruning rule (mandatory):** Each inbox file is truncated to the last 100 messages during the copy. This prevents unbounded growth — a team with 11 agents (like cloudflare-builders) would otherwise accumulate thousands of messages across sessions. 100 messages per agent captures the full closing sequence and recent conversation context. Older messages are not needed for cross-session continuity.

**Why prune during shutdown, not startup:** The team lead's context is freshest at shutdown Phase 4 — all work is done, the commit sequence is mechanical. Deferring pruning to startup adds complexity to an already fragile sequence. Prune once, commit clean.

#### Phase 4b: Commit all session state

```bash
# Commit scratchpads + task snapshot + inboxes in one atomic commit
git add .claude/teams/<team-name>/memory/
git add .claude/teams/<team-name>/inboxes/
git commit -m "chore: save team state (scratchpads, tasks, inboxes)"
git push
```

**Expected outcome:** All scratchpads, task snapshots, and pruned inboxes are committed and pushed.
**Failure if skipped:** Next session has no scratchpad state and no inbox history — agents restart with amnesia, closing reports lost.

**Note (_FR:Volta_ — R7, 2026-03-15):** Previous versions had a Phase 5 (Preserve) that said "do NOT call TeamDelete." This was removed because the runtime dir is ephemeral by platform design — the platform destroys it between sessions regardless. Phase 4 (Persist to repo) is the final shutdown step. The repo is the sole durable store. Calling TeamDelete is harmless (the platform will clean up anyway) but also pointless.

---

## Duplicate Prevention Gate (_FR:Volta_)

### Decision

Every spawn attempt must pass through a duplicate check. This is a hard gate — not a best practice, not a suggestion. Both reference teams document this as a REPEATED violation.

### The Gate

Before spawning agent `<name>`:

```
1. Read config.json
2. Check: does a member with name == <name> exist?
   YES → Do NOT spawn. SendMessage with the new task instead.
   NO  → Proceed with spawn.
```

### Where the gate lives

| Spawning path                         | Gate implementation                                                      |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `spawn_member.sh` (RC/tmux)           | Built-in: `jq` check on config.json, exits with error if duplicate found |
| `spawn_local.sh` + Agent tool (local) | Built-in: `jq` check on config.json, exits with error if duplicate found |
| Agent tool alone (local, no script)   | Team lead must check config.json manually before calling Agent tool      |
| Raw `claude` CLI                      | Not permitted (no gate possible)                                         |

### Failure mode

Spawning without the gate creates `<name>-2` entries in `config.json`. Effects:

- Inbox routing becomes ambiguous (which `sven` gets the message?)
- Token waste (two agents doing the same role)
- Cleanup requires manual config.json editing or full team restart

### Why this keeps happening

The team lead's context window fills up over a long session. By the time a second spawn is needed, the lead has forgotten that the agent already exists. The fix is structural: the gate must be in the spawning mechanism (script), not in the lead's memory.

**Recommendation for framework:** Spawn tooling should refuse duplicates at the infrastructure level. The Agent tool itself should check `config.json` and reject duplicate names. Until that is implemented, `spawn_member.sh` (RC/tmux) and `spawn_local.sh` (local) provide built-in gates. Teams using the Agent tool without a wrapper script must rely on team lead discipline — a known failure mode.

---

## Spawning Paths (_FR:Volta_)

### Decision

Three spawning paths exist. Each is correct in exactly one context. Using the wrong path produces a specific failure.

### Decision Tree

```
Is the team running on a remote machine via tmux (RC)?
  YES → spawn_member.sh (reads roster, spawns in tmux pane)
  NO → Is it a local Claude Code session?
    YES → Does spawn_local.sh exist for this team?
      YES → spawn_local.sh (duplicate gate + prompt assembly) → Agent tool
      NO  → Agent tool directly (team lead must check duplicates and compose prompt manually)
    NO  → Not a supported configuration
```

### Path 1: `spawn_member.sh` (RC/tmux teams)

**When:** Remote Claude (RC) teams running in tmux sessions.
**How:** `spawn_member.sh [--target-pane %XX] <agent-name> [tmux-session]`
**Reads:** roster.json (model, color, agentType), config.json (leadSessionId, duplicate check)
**Produces:** New tmux pane with claude CLI process, config.json entry

**Advantages:**

- Respects roster model settings (opus vs sonnet per agent)
- Built-in duplicate gate
- Visible to user in tmux layout
- Handles daemon-backed agents (Eilama pattern)

**Disadvantages:**

- Requires tmux (not available in local Claude Code)
- Requires TTY (background spawn does not work)

### Path 2: Agent tool (local teams)

**When:** Local Claude Code sessions without tmux.
**How:** `Agent(name="<name>", model="<model>", prompt="...", run_in_background: true)`
**Reads:** Nothing automatically — team lead must supply model, prompt, and name as parameters.
**Produces:** Background agent process, config.json entry

**Advantages:**

- Works without tmux
- Simple — no shell script needed
- Supports per-agent model selection via `model` parameter (e.g., `model: "opus"`)

**Disadvantages:**

- No built-in duplicate gate — team lead must check config.json manually
- No prompt file loading — team lead must read prompt file and pass content inline
- `run_in_background: true` is MANDATORY — foreground blocks team lead from receiving messages

### Path 2.5: `spawn_local.sh` + Agent tool (local teams, automated) (_FR:Volta_ — amendment from restart test 2026-03-13)

**When:** Local Claude Code sessions where the team has a roster and prompt files.
**How:** Team lead runs `spawn_local.sh` to get the duplicate check and assembled prompt, then passes the output to the Agent tool.
**Reads:** roster.json (model, name validation), config.json (duplicate check), prompts/<name>.md (prompt content)
**Produces:** Validated prompt text on stdout. Agent tool spawns the process.

**Reference implementation:**

```bash
#!/usr/bin/env bash
set -euo pipefail
# spawn_local.sh <team-name> <agent-name>
# For local Claude Code sessions. Validates and outputs spawn parameters.
# Team lead uses the output with the Agent tool.

TEAM_NAME="${1:?Usage: spawn_local.sh <team-name> <agent-name>}"
AGENT_NAME="${2:?Usage: spawn_local.sh <team-name> <agent-name>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_DIR="$SCRIPT_DIR/$TEAM_NAME"
CONFIG="$HOME/.claude/teams/$TEAM_NAME/config.json"
ROSTER="$TEAM_DIR/roster.json"

# Validate prerequisites
[[ -f "$CONFIG" ]] || { echo "ERROR: $CONFIG not found. Run TeamCreate first." >&2; exit 1; }
[[ -f "$ROSTER" ]] || { echo "ERROR: $ROSTER not found." >&2; exit 1; }

# Duplicate gate
if jq -e ".members[] | select(.name == \"$AGENT_NAME\")" "$CONFIG" >/dev/null 2>&1; then
  echo "ERROR: $AGENT_NAME already registered in config.json. Use SendMessage instead." >&2
  exit 1
fi

# Read roster entry
ROSTER_ENTRY=$(jq -r ".members[] | select(.name == \"$AGENT_NAME\")" "$ROSTER")
[[ -n "$ROSTER_ENTRY" ]] || { echo "ERROR: $AGENT_NAME not found in roster." >&2; exit 1; }

MODEL=$(echo "$ROSTER_ENTRY" | jq -r '.model')

# Compose prompt
PROMPT=""
if [[ -f "$TEAM_DIR/prompts/$AGENT_NAME.md" ]]; then
  PROMPT=$(cat "$TEAM_DIR/prompts/$AGENT_NAME.md")
fi

echo "--- spawn_local output ---"
echo "agent: $AGENT_NAME"
echo "model: $MODEL"
echo "prompt_file: $TEAM_DIR/prompts/$AGENT_NAME.md"
echo "---"
echo "$PROMPT"
```

**Advantages over raw Agent tool:**

| Capability        | Agent tool alone                   | spawn_local.sh + Agent tool          |
| ----------------- | ---------------------------------- | ------------------------------------ |
| Duplicate gate    | Manual (team lead remembers)       | Structural (script exits with error) |
| Prompt assembly   | Manual (team lead reads + pastes)  | Automatic (script reads prompt file) |
| Model from roster | Manual (team lead looks up roster) | Automatic (script reads roster)      |
| Roster validation | None                               | Agent name validated against roster  |

**Disadvantages:**

- Requires shell execution before Agent tool call (two-step process)
- Team lead must still manually invoke the Agent tool with the script's output
- No tmux pane management (agent not visible as separate terminal)

### Path 3: Raw `claude` CLI

**When:** Never for teams. Only for standalone, non-team usage.

**Why forbidden:**

- No duplicate gate
- No config.json registration
- No tmux pane management (agent invisible to user)
- No roster model/color settings

**Exception:** `rc-start.sh` uses raw CLI to start the team-lead process itself (bootstrapping — the lead is not a team member being spawned).

---

## Git Isolation Strategy Selection (_FR:Volta_ — R9, 2026-03-18)

### Decision

The isolation model for a team's git operations depends on the team's **data flow architecture**, not on team size or output volume. Two archetypes exist, each with its own canonical isolation strategy. This decision must be made at **team design time** (before the first spawn) and encoded in the team's common-prompt.

| Team archetype | Data flow | Isolation model | Mechanism |
|---|---|---|---|
| **Independent output** | Agents produce outputs that no other agent consumes in real-time | Branch/worktree isolation | `isolation: "worktree"` at spawn; per-agent branches |
| **Pipeline** | Each agent's output is another agent's input, consumed immediately | Directory ownership on trunk | Resource partition table in common-prompt |

### Rationale

The framework's prior recommendation (T02, T07) was: "use `isolation: "worktree"` when spawning parallel agents that work in the same git repo." This is correct for independent-output teams (e.g., two developers building separate features) where isolation prevents accidental conflicts with no downside.

Field evidence from the apex-research team (6 sessions, 37 commits from 4 agents, zero conflicts) revealed a second archetype where worktree isolation is a **downgrade**: pipeline teams. In their architecture, agents form a sequential chain:

```
Champollion → inventory/    (extraction)
    → Nightingale → shared/     (analysis, reads inventory/)
        → Hammurabi → specs/    (specification, reads shared/ + inventory/)
        → Berners-Lee → dashboard/  (visualization, reads shared/ + specs/ + inventory/)
```

Each agent reads another's output **immediately from the same checkout on trunk**. Worktree isolation would give each agent a separate working tree on a separate branch — breaking real-time visibility. The data wouldn't flow until branches were merged back to main and other agents rebased or pulled. This converts a real-time pipeline into a batch pipeline with merge ceremonies between every stage.

### Independent-Output Teams: Branch/Worktree Isolation

**When to use:** Agents produce outputs that no other agent needs to see in real-time. Typical for development teams where two agents build separate features, pages, or services.

**Mechanism:** Spawn with `isolation: "worktree"`. Each agent gets its own working tree on its own branch. Merges happen via PR when the work is complete.

**Advantages:**

- Git-level conflict prevention (impossible to touch the same file by accident)
- Clean PR/review workflow per agent
- Long-running work doesn't pollute main

**Lifecycle implications:**

- Phase 6 (Spawn): worktree must be created before or during agent spawn
- Shutdown Phase 4: worktree branches must be either merged or preserved (stale worktrees accumulate)
- Roster should encode `isolation: "worktree"` per agent so spawning scripts handle it automatically

**Reference:** T02 Section "Git Isolation — Worktrees vs Forks vs Separate Repos"; T07 "git worktree isolation for parallel agents."

### Pipeline Teams: Directory Ownership on Trunk

**When to use:** Agents form a data flow chain where each agent's output is another's input, consumed immediately. Typical for research/analysis teams with extraction → analysis → specification → visualization stages.

**Mechanism:** All agents commit to main. Conflict prevention is achieved by a **resource partition table** — a contract specifying which directories each agent writes to. No two agents write to the same directory. All agents can read any directory.

**Resource partition table format** (placed in common-prompt.md):

```markdown
## Resource Partition Table

| Agent | Writes to | Reads from |
|---|---|---|
| Champollion | inventory/, scripts/ | source-data (read-only) |
| Nightingale | shared/ | inventory/ |
| Hammurabi | specs/, decisions/ | shared/, inventory/ |
| Berners-Lee | dashboard/ | shared/, inventory/, specs/ |
```

**Advantages:**

- Zero-latency data flow — each agent sees others' commits immediately
- No merge ceremonies between pipeline stages
- No worktree lifecycle overhead (creation, cleanup, stale worktree pruning)
- Proven: 37 commits from 4 agents, zero conflicts (apex-research, session 6)

**Failure mode if partition is violated:** Merge conflict on the conflicting file. This is visible and fixable — not data loss. The partition is enforced by prompt (behavioral), not by tooling (structural). Field evidence from 6 sessions shows prompt-based enforcement holds.

**Lifecycle implications:**

- Phase 6 (Spawn): no worktree creation needed. All agents share the main checkout.
- Phase 0 (Orient): single `workDir` is sufficient — no worktree paths to track.
- Resource partition table must be maintained in common-prompt.md. Changes to partition boundaries require team-lead approval and common-prompt update before the affected agent is (re)spawned.
- CI build gate on trunk is recommended: `npm run build && npm run check` (or equivalent) after every push. One broken commit blocks the entire pipeline.

**Reference:** apex-research RFC #3 response (Eesti-Raudtee/apex-migration-research#3).

### Decision Tree: Which Isolation Model?

```
Does any agent consume another agent's output in real-time (same session, no merge step)?
  YES → Do all agents write to non-overlapping directories?
    YES → Pipeline: directory ownership on trunk
    NO  → Hybrid: trunk for non-overlapping agents, worktree for overlapping ones
  NO  → Independent output: branch/worktree isolation
```

**The hybrid case:** Some teams have both pipeline and independent agents. Example: a research pipeline (Champollion → Nightingale → Hammurabi on trunk) plus a developer agent building an unrelated service. The developer gets worktree isolation; the pipeline agents share trunk. The roster should encode isolation per agent, not per team.

### When to Reconsider the Chosen Strategy

**Pipeline → upgrade to worktree when:**

1. Two agents need to write to the same directory (partition breaks down)
2. Git lock contention becomes frequent (concurrent `git commit` hitting `index.lock`)
3. Long-running feature work needs isolation from trunk (multi-session branches)

**Worktree → simplify to trunk when:**

1. Merge ceremonies become the bottleneck (agents waiting for merges to see each other's output)
2. All agents' write domains are naturally non-overlapping
3. Team velocity matters more than branch safety (early-stage research, prototyping)

**The signal for each:** Pipeline teams upgrade on the first cross-directory write conflict. Worktree teams simplify when merge overhead exceeds conflict risk.

### Coordination Note (T03)

The resource partition table is both a **lifecycle artifact** (determines spawn-time isolation configuration) and a **communication artifact** (defines the implicit data contract between agents). T03 (Communication) may formalize the protocol aspects — message format for partition changes, notification when an agent's read dependency is updated. The lifecycle concern here is narrower: which isolation model to select and when to switch.

---

## Cross-Session Handover (_FR:Volta_)

### Decision

Handover state lives in three places: **scratchpads** (per-agent), **shared knowledge files** (per-team), and **task snapshots** (team lead). Each has different write triggers and prune rules.

### Scratchpads

**Location:** `memory/<agent-name>.md` (within team directory)
**Owner:** The agent named in the file. No other agent writes to it.
**Max size:** 100 lines. Prune on startup (Medici flags violations).

#### Write triggers

| Trigger                          | Tag            | Example                                                                       |
| -------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| Discovered something non-obvious | `[LEARNED]`    | "D1 batch size limit is 100, not documented"                                  |
| Made a decision with rationale   | `[DECISION]`   | "Using sql.js instead of better-sqlite3 — binary won't build on this machine" |
| Found a repeatable approach      | `[PATTERN]`    | "Svelte 5 runes: `$derived` replaces `$:` reactive statements"                |
| Mid-task checkpoint              | `[CHECKPOINT]` | "3/5 tests passing, blocked on auth mock"                                     |
| Stopping before completion       | `[WIP]`        | "Branch story/47-fix-rating at commit abc123, tests red"                      |
| Blocked, awaiting external input | `[DEFERRED]`   | "Waiting for PO answer on AK-12 before implementing filter"                   |
| Surprising pitfall               | `[GOTCHA]`     | "overflow-x: auto breaks position: sticky"                                    |

#### Save timing

- **Immediately on discovery** — never defer to session end. Context compaction can trigger at any time and will erase unsaved discoveries.
- **Periodically during long tasks** — checkpoint every significant milestone.
- **On shutdown** — final WIP/CHECKPOINT before approving shutdown.

#### What NOT to save

- Search paths ("I grepped for X in Y") — ephemeral, no re-discovery value
- Transient failures already fixed — the fix is in the code
- Anything in CLAUDE.md or derivable from `git log` / one grep
- Superseded draft work — clutters the scratchpad

#### Prune rules

On startup, Medici checks all scratchpads for:

- Entries older than 2 sessions with no `[DECISION]` or `[PATTERN]` tag → suggest removal
- `[WIP]` entries where the branch was already merged → safe to remove
- `[DEFERRED]` entries where the blocker was resolved → safe to remove
- Total lines > 100 → flag for agent to prune

### Shared Knowledge Files

**Location:** `docs/` (hr-devs) or `memory/` (rc-team) — convention varies
**Canonical location (recommendation):** `docs/` within team directory — separates team-wide knowledge from per-agent state

Files with defined owners and purpose:

| File                        | Who writes                | Purpose                                 |
| --------------------------- | ------------------------- | --------------------------------------- |
| `architecture-decisions.md` | Any teammate              | Settled choices with rationale and date |
| `test-gaps.md`              | Tess (testing agent)      | Untested areas for triage               |
| `api-contracts.md`          | Frontend + backend agents | Agreed API shapes                       |
| `health-report.md`          | Medici                    | Latest health audit output              |

**Write trigger:** When a cross-cutting discovery affects multiple agents.
**Prune trigger:** Team lead reviews on session start; Medici flags stale entries.

### Task Snapshots

**Location:** `memory/task-list-snapshot.md`
**Owner:** Team lead (created during Shutdown Phase 2b, committed during Phase 4)
**Purpose:** Next session's team lead can see what was in progress, what was completed, what was blocked.

**Format:** Simple markdown list with status, assignee, and blockers. Raw TaskList dump is sufficient — no synthesis required. Reduce activation energy to near zero.

**Why Phase 2b, not Phase 4:** Field testing (2026-03-13 restart) showed that placing the snapshot in Phase 4 (Persist) causes it to be forgotten — the team lead is cognitively loaded and executing a multi-step git sequence. Phase 2b is when the lead has the best task picture: all agents still alive, tasks fresh in context.

---

## Stale-Team Recovery (_FR:Volta_)

### Decision

A "stale team" is one where the team directory exists from a previous session but the current session has no live team context. This is the normal state at the start of every session. The canonical startup protocol (Phases 2-4) handles this case by design.

### When recovery is needed

| Scenario              | Symptom                                                     | Recovery                                                                                                               |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Normal session start  | `$TEAM_DIR` exists with stale `config.json`                 | Standard startup: Phase 0 (Orient) → Phase 1 (Sync) → Phase 2 (Clean) → Phase 3 (Create)                               |
| Crashed session       | `$TEAM_DIR` exists, scratchpads may be incomplete           | Same as above — scratchpads are best-effort                                                                            |
| TeamDelete was called | `$TEAM_DIR` does not exist, no inboxes to restore           | Phase 0 → Phase 1 → Phase 2 (anomaly detected, see Phase 2.0 anomaly rules) → Phase 3 (Create) — inbox history is lost |
| Wrong team name       | `$TEAM_DIR` exists under wrong name (e.g. `team-name-a7f3`) | Phase 0 → Phase 1 → Phase 2 (MISCREATION detected) → remove wrong dir → Phase 3                                        |
| First-ever session    | `$TEAM_DIR` does not exist, no git history of team files    | Phase 0 → Phase 1 → Phase 2 (COLD START, expected) → Phase 3                                                           |

### Key insight

There is no special "recovery" procedure. The canonical startup protocol IS the recovery procedure. Every session starts by assuming the team is stale and cleaning it. This makes the protocol idempotent — running it on a clean state or a stale state produces the same result.

---

## Non-Claude Agent Lifecycle (_FR:Volta_)

### Decision

Non-Claude agents (e.g., local LLM daemons like Eilama) use the same team infrastructure (inboxes, config.json) but have a different process lifecycle. `spawn_member.sh` already handles this via the `backendType` field in roster.json.

### Pattern

```json
{
  "name": "eilama",
  "model": "ollama:codellama:13b-instruct",
  "backendType": "daemon"
}
```

When `backendType == "daemon"`:

- `spawn_member.sh` starts a Python daemon instead of `claude` CLI
- Daemon polls its inbox file (`inboxes/<name>.json`) for messages
- Daemon registers in `config.json` like any other agent
- No TTY required — can run in background or in a tmux pane

**Shutdown:** Daemon agents do not respond to `shutdown_request` messages via the standard protocol. Team lead must send a poison-pill message or kill the process directly.

**Open question:** Should daemon agents implement the `shutdown_request` / `shutdown_response` protocol in their polling loop?

---

## Patterns from Reference Teams (_FR:Finn_)

### Creation: human-initiated, medici-first

Team creation is always human-triggered (no autonomous team spawning). Startup sequence:

**rc-team (inline in team-lead prompt):**

1. Pull dev-toolkit
2. Backup inboxes → kill zombie processes → remove stale team dir
3. `TeamCreate(team_name="cloudflare-builders")`
4. Restore inboxes (TeamCreate does NOT create inboxes/ dir — mkdir first)
5. Spawn Medici first for health audit, apply recommendations
6. Spawn remaining agents per configuration preset
7. Send ready message to user, wait for task

**hr-devs (externalised to `docs/startup-shutdown.md`):**
Same pattern, adds: dashboard startup (node server + browser kiosk), `spawn_member.sh` replaces Agent tool.

**Critical invariant:** TeamCreate must be called fresh each session. If old team dir exists, TeamCreate generates a random name — breaking inbox routing. Stale dir must be removed first, inboxes preserved separately.

### Spawning: shell script, not Agent tool

**Evolution:** rc-team originally used the Agent tool. hr-devs replaced it with `spawn_member.sh`.

**Why (RC/tmux teams):** `spawn_member.sh` reads roster JSON for model, color, session ID, manages tmux panes, and has a built-in duplicate gate. The Agent tool lacks tmux integration and prompt file loading.

**Correction (2026-03-13):** The Agent tool DOES support per-agent model selection via the `model` parameter. The original claim that it "ignores roster model settings" was incorrect. The remaining gaps for local teams are: no duplicate gate, no prompt file loading. See Path 2.5 (`spawn_local.sh`) for the local equivalent.

**Rule (RC/tmux):** Use `spawn_member.sh`. NEVER use raw `claude` CLI (runs in background without tmux pane — agent invisible to user).
**Rule (local):** Use `spawn_local.sh` + Agent tool when available. Raw Agent tool is acceptable but lacks structural safeguards.

**Spawn order matters:** Finn first (wait for intro report, user confirmation) → Marcus (wait, confirm) → Tess + Sven (parallel) → Dag (if needed).

### Duplicate prevention

Before spawning any agent:

1. Read `config.json` to see who is already registered
2. If name exists → SendMessage with new task
3. Only spawn if name is NOT in config

Spawning a duplicate creates `name-2` clutter and wastes tokens. This is a REPEATED violation across sessions (per MEMORY.md).

### Operation: handover across sessions

Each agent maintains a personal scratchpad (`memory/<name>.md`, max 100 lines). Tags structure the scratchpad:

- `[DECISION]`, `[PATTERN]`, `[WIP]`, `[CHECKPOINT]`, `[DEFERRED]`, `[GOTCHA]`, `[LEARNED]`

**When to save:** immediately on discovery (not deferred to session end — context compaction kills deferred writes). Checkpoint during long tasks.

**What to save:** non-obvious, stable, costly-to-rediscover, >5 min of re-discovery value. NOT: search paths, transient failures already fixed, anything already in CLAUDE.md.

Shared knowledge files (`docs/` in hr-devs, `memory/` flat in rc-team):

- `architecture-decisions.md` — any teammate may append
- `test-gaps.md` — Tess appends, team-lead triages
- `api-contracts.md` — Sven + Dag write

### Shutdown: ordered, confirmed, no TeamDelete

Shutdown sequence (both teams):

1. Stop all new work
2. Send shutdown to all agents (broadcast or one-by-one)
3. Wait for confirmation from each
4. Save task list snapshot to memory/
5. `git add .claude/teams/.../memory/ && git commit -m "chore: save team scratchpads" && git push`
6. **DO NOT TeamDelete** — directory stays so next session can restore inboxes

Each agent on shutdown: write WIP to scratchpad → send closing message (LEARNED / DEFERRED / WARNING, 1 bullet max each) → approve.

**Gotchas from practice:**

- Panes close AUTOMATICALLY after shutdown_approved — do NOT call `tmux kill-pane` manually
- Stale inbox messages (`read: true`) do NOT cause problems on re-spawn
- Wait for `teammate_terminated` before re-spawning same-name agents — `shutdown_approved` is NOT enough
- Always show procedure and ask for confirmation BEFORE acting

### Eilama: lifecycle of a non-Claude agent

Eilama (codellama:13b daemon) has a different lifecycle:

- Not spawned via TeamCreate/spawn_member.sh
- Started as a background Python daemon: `python3 eilama-daemon.py &`
- Not given a tmux pane (doesn't need TTY)
- Added as a one-liner to the startup checklist
- "Appears" as a teammate via inbox polling — same messaging substrate

This shows the lifecycle framework can accommodate non-Claude agents transparently.

---

## Open Questions (_FR:Volta_)

### Resolved (by this design)

- ~~How do we handle stale teams that lost context?~~ → Canonical startup protocol is inherently stale-team recovery (Phase 2 Clean).
- ~~What triggers team shutdown?~~ → Human decision, task completion, or forced (context limit/error). No auto-shutdown.
- ~~How does handover work between sessions?~~ → Scratchpads + shared knowledge files + task snapshots, with defined write triggers and prune rules.
- ~~How does a fresh team-lead self-orient without broad exploration?~~ → Phase 0 (Orient): read roster.json, common-prompt.md, and own scratchpad — 3 files, fixed order, zero exploration. (_FR:Volta_ — resolved 2026-03-13 restart 3)
- ~~How to handle stale/wrong workDir in roster.json?~~ → Phase 0 workDir Resolution: validate after reading roster, fallback with WARNING, flag for correction. (_FR:Volta_ — resolved 2026-03-13 restart 3)
- ~~How to distinguish "genuinely first session" from "lost state" when team dir is missing?~~ → Phase 2.0 Anomaly Detection: check git log for prior team memory commits. If found → anomaly, ask user. (_FR:Volta_ — resolved 2026-03-13 restart 3)
- ~~What if `$HOME` is unreliable on the host platform?~~ → Phase 2.0a: validate `$HOME` before use, fallback to `whoami`-based path. `startup.md` uses absolute paths — it is machine-specific by design. (_FR:Volta_ — resolved 2026-03-13 restart 4)
- ~~What if TeamCreate succeeds but config.json doesn't exist on disk?~~ → Phase 3 Verification and Retry: verify config.json after TeamCreate, retry with TeamDelete + TeamCreate (max 2 attempts), hard gate before any spawn. (_FR:Volta_ — resolved 2026-03-13 restart 4)
- ~~What if agents are spawned into a non-functional team?~~ → Phase 3 verification is a hard gate for all subsequent phases. No agent spawn (including Medici in Phase 5) until config.json is confirmed on disk. (_FR:Volta_ — resolved 2026-03-13 restart 4)
- ~~What if the runtime dir disappears between sessions and inboxes are lost?~~ → Shutdown Phase 4a persists pruned inboxes (last 100 messages per file) to the repo. Startup Phase 4 restores from repo, not `/tmp/`. Repo is the sole source of truth. (_FR:Volta_ — resolved 2026-03-13)
- ~~Inbox backup atomicity~~ → Eliminated by removing the `/tmp/` hop. Inboxes go directly from runtime dir to repo during shutdown. No intermediate ephemeral state. (_FR:Volta_ — resolved 2026-03-13)

### Still open

1. ~~**Inbox backup atomicity**~~ → Resolved by durable inbox persistence (Shutdown Phase 4a). Inboxes are now committed to the repo during shutdown. The fragile `/tmp/` hop is eliminated — the repo copy survives reboots, crashes, and manual cleanup. The startup restore reads from the repo, not `/tmp/`. (_FR:Volta_ — resolved 2026-03-13)

2. ~~**Agent tool duplicate gate**~~ → Resolved by `spawn_local.sh` (Path 2.5). Local teams now have a wrapper script with built-in duplicate gate and prompt assembly. (_FR:Volta_ — resolved 2026-03-13)

3. **Daemon agent shutdown protocol** — Should non-Claude agents implement `shutdown_request`/`shutdown_response` in their polling loop, or is kill-process sufficient?

4. **Scratchpad prune automation** — Medici flags violations, but pruning is manual. Should there be an automatic prune step that removes `[WIP]` entries for merged branches?

5. **Multi-team startup coordination** — When tens of teams exist, do they start independently or is there an orchestrator that sequences team startups? (Connects to T04-hierarchy.)

6. **Can teams self-replicate or split?** — Not addressed. May be needed for scaling patterns. (Connects to T01-taxonomy.)

7. **`$HOME` reliability across platforms** — Windows/Git Bash has inconsistent `$HOME` resolution across bash invocations within the same session. Phase 2.0a adds a validation gate, but the root cause (shell initialization inconsistency) is not understood. Does this affect other env vars? Does it happen on macOS/Linux? (_FR:Volta_ — discovered restart 4, 2026-03-13)

8. **TeamCreate silent failure** — TeamCreate can return success but not write config.json to disk. Phase 3 now has a retry loop, but the root cause is unknown. Is this a race condition? A permissions issue? Does it correlate with the `$HOME` bug? (_FR:Volta_ — discovered restart 4, 2026-03-13)

9. **Inbox size thresholds** — The 100-message-per-file pruning limit (Shutdown Phase 4a) is a reasonable default for research teams with short sessions. For production teams with long sessions and many agents, the right threshold may be different. Should this be configurable per team (in roster.json)? What is the actual size of 100 messages in JSON — does it stay under reasonable git commit sizes? (_FR:Volta_ — 2026-03-13)

---

## Container Lifecycle (_FR:Brunel_)

### Problem

Claude's auto-memory (`~/.claude/`) lives on the host filesystem. Each new shell session starts with whatever state was accumulated. When teams are run in ephemeral environments (cloud VMs, CI, shared machines), the `~/.claude/` directory is lost between sessions. The repo-versioned scratchpads and inboxes survive (via git), but the auto-memory does not. Teams also need resource isolation — one team's auto-memory must not be visible to another.

### Solution

Full container isolation: each team runs in its own service inside a shared Docker image, with separate named volumes for auto-memory. No host bind mounts. Git credentials are passed via `GITHUB_TOKEN` environment variable. Claude is installed via npm inside the image.

Named volumes survive `docker stop`/`docker start`. The container is ephemeral; the volumes are persistent.

### Architecture (implemented)

| Component | Container path | Persistence | Isolation |
|---|---|---|---|
| Auto-memory | `/home/ai-teams/.claude/` | Named volume per team | Per-team — `ai-teams_fr-claude-home` / `ai-teams_cd-claude-home` |
| Repo (workspace) | `/home/ai-teams/workspace/` | Shared named volume `ai-teams_repo-data` | Shared — both teams read same repo |
| Inter-team comms | `/shared/comms/` | Shared named volume `ai-teams_comms` | Shared — Unix socket inter-team messaging |
| Claude binary | `/home/ai-teams/.npm/...` | Inside image (npm install -g) | Shared image layer |
| Git credentials | env `GITHUB_TOKEN` | `.env` file on host (not mounted) | Per-container env |

**Container user:** `ai-teams` (UID 1000, GID 1000). Ubuntu 24.04's default UID 1000 (`ubuntu`) is renamed via `groupmod -n` + `usermod -l` in the Dockerfile.

**`$HOME` inside container:** always `/home/ai-teams`. Volta's lifecycle scripts use `$HOME/.claude/teams/<team-name>` for the runtime team dir — this resolves correctly inside the container. No `$HOME` validation failures; the Windows/Git Bash `$HOME` bug documented in Phase 2.0a does not apply in the container environment.

**Workspace init:** `entrypoint.sh` clones the repo on first start (`/home/ai-teams/workspace/` is empty on a fresh volume); subsequent starts do `git pull`. Race condition possible if both teams start simultaneously on a fresh volume — acceptable for current sequential-start usage.

### First-Run Volume Ownership Problem

Docker creates named volumes owned by root before any container user exists. `ai-teams` (UID 1000) cannot write to `/home/ai-teams/.claude/` or `/shared/comms/` on first start.

**Fix:** `entrypoint.sh` runs as root, loops over `/home/ai-teams/.claude/` and `/shared/comms/`, chowns both to `1000:1000` on first start, then uses `gosu` to drop privileges and exec the user command. `gosu` (unlike `su -c`) preserves the full environment, including `ANTHROPIC_API_KEY`.

### Implementation Files

| File | Purpose |
|---|---|
| `Dockerfile` | Ubuntu 24.04 + nodejs + npm + git + gh + jq + openssh-client + gosu; renames ubuntu user to ai-teams |
| `docker-compose.yml` | Two services (framework-research, comms-dev); 4 named volumes; YAML anchor for shared config |
| `entrypoint.sh` | Root → chown volumes → git clone/pull → gosu drop to ai-teams |
| `session-start.sh` | One command to build (if needed) and start interactive session for a named team |
| `session-stop.sh` | Stop containers; `--wipe-memory [team]` / `--wipe-all` flags for intentional wipe |
| `.env.example` | `GITHUB_TOKEN`, `ANTHROPIC_API_KEY` |

### Usage

```bash
# Start a session for a specific team (defaults to framework-research)
./session-start.sh framework-research
./session-start.sh comms-dev

# Inside the container, run Claude:
claude

# Stop (from another terminal, or Ctrl+D inside container)
./session-stop.sh

# Intentionally wipe one team's auto-memory (irreversible):
./session-stop.sh --wipe-memory framework-research

# Wipe all team memory:
./session-stop.sh --wipe-all
```

### Interaction with Volta's Startup/Shutdown Protocol

The container is transparent to Volta's protocol. From the lifecycle protocol's perspective:

- **Phase 0 (Orient):** reads files from `/home/ai-teams/workspace/` — the cloned repo. Same paths as non-container usage.
- **Phase 1 (Sync):** `git pull` inside container. GITHUB_TOKEN is available as env var for HTTPS auth.
- **Phase 2.0a ($HOME validation):** `$HOME` is always `/home/ai-teams` — validation passes immediately. The Windows/Git Bash fallback path is never triggered.
- **Phase 3 (Create):** `TeamCreate` writes to `/home/ai-teams/.claude/teams/<team-name>/` — on the team's named volume. Survives container restarts.
- **Phase 4 (Restore inboxes):** reads from repo dir (`/home/ai-teams/workspace/.claude/teams/<team-name>/inboxes/`). Same path resolution as non-container.
- **Shutdown Phase 4a (Persist inboxes):** writes to repo dir, then `git push`. GITHUB_TOKEN covers auth.

No protocol changes required. The container is a deployment detail, not a protocol change.

### Interaction with Herald's Protocol 4 (Inter-Team Transport)

Herald's Protocol 4 (T03) specifies UDS-based inter-team messaging via a shared Docker volume at `/shared/comms/`. The current container implementation provides the volume infrastructure; the broker daemon is built by comms-dev.

**What the container provides:**

| Component | Status | Notes |
|---|---|---|
| `/shared/comms/` volume | Implemented — `ai-teams_comms` named volume | Both team services mount it |
| Socket directory ownership | Implemented — `entrypoint.sh` chowns to 1000:1000 | Broker can create socket files as `ai-teams` user |
| `comms-channel:` volume in compose | Volume name: `ai-teams_comms` | Herald's spec calls it `comms-channel` — naming difference, same concept |

**What is NOT yet in the container (comms-dev team's responsibility):**

- Message broker daemon implementation (Python/Node) — `ai-teams-broker:latest` image is a placeholder in compose
- `registry.json` management with file locking
- `comms-send` / `comms-publish` / `comms-watch` CLI tools

**Broker deployment: SIDECAR** (decided 2026-03-14, Brunel + Herald). Rationale: broker must outlive the Claude session. Inline daemon drops queued messages on `Ctrl+D` — same failure mode as no broker. Linear service count cost (N teams = N extra services) is acceptable.

**Compose architecture (implemented in docker-compose.yml):**

```
broker-framework-research  ──healthcheck(socket)──►  framework-research (Claude)
broker-comms-dev           ──healthcheck(socket)──►  comms-dev (Claude)
```

- Claude containers: `depends_on: broker-<team>: condition: service_healthy`
- Healthcheck: `test -S /shared/comms/<team>.sock` — Claude cannot start before broker socket exists
- TLS-PSK: secret mounts on broker sidecars only (Claude containers do not need the PSK)
- Per-team broker inbox volumes (`fr-broker-inbox`, `cd-broker-inbox`) persist queued messages across broker restarts

**Volumes added for broker pattern:**

| Volume | Name | Purpose |
|---|---|---|
| `fr-broker-inbox` | `ai-teams_fr-broker-inbox` | framework-research broker message queue |
| `cd-broker-inbox` | `ai-teams_cd-broker-inbox` | comms-dev broker message queue |

### Open Questions

- **SSH agent forwarding** — `git push` over SSH requires `SSH_AUTH_SOCK` forwarding. Currently HTTPS + `GITHUB_TOKEN` covers the common case. SSH forwarding is a one-line addition to `docker-compose.yml` when needed.
- **MCP servers** — No MCP servers configured. If added, may require port or socket mounts into the container.
- **Simultaneous first-start race condition** — If both team containers start simultaneously against a fresh `repo-data` volume, both attempt `git clone` concurrently. Low priority for current sequential-start usage; fix is a lock file or init container pattern.
- **GITHUB_TOKEN rotation** — Token is passed at container start via `.env`. Rotation requires container restart. For long-running containers, a secrets manager mount would be preferable.
- **Broker image** — `ai-teams-broker:latest` is a placeholder. comms-dev team delivers the implementation. Compose is ready to wire it in.
