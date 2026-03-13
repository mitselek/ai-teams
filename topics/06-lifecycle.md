# Lifecycle

Spawning, scaling, shutdown, and handover of teams.

## Canonical Startup Protocol (*FR:Volta*)

### Decision

Startup is a 7-phase sequence: **Orient → Sync → Clean → Create → Restore → Audit → Spawn**. Each phase has a precondition and a verifiable outcome. Skipping or reordering any phase produces a known failure mode (documented below).

### Rationale

Both reference teams (rc-team and hr-devs) converged on the same pattern independently, but with implementation scattered across prompts, scripts, and MEMORY.md entries. The core insight: `TeamCreate` is destructive — it requires a clean directory but must preserve inboxes. This forces a backup-delete-create-restore dance that is the single most fragile part of the lifecycle. Making it explicit and atomic prevents the most common startup failures.

### Phase Ordering is Mandatory (*FR:Volta* — amendment from restart test 3, 2026-03-13)

Field test (2026-03-13, restart 3) showed the team-lead executed phases out of order AND mislabeled them (called Phase 3 Create "Phase 1: Sync"). The actual execution order was: Explore (not in protocol) → Phase 2.0 Diagnose + git pull (mixed) → Phase 3 Create (mislabeled) → read config files (should have been Phase 0) → Phase 5 Audit. Cost: 73.5k tokens and 2m18s wasted on an Explore agent that Phase 0 would have replaced.

**Rule:** Execute phases in the numbered order. State the phase name before executing it. Each phase's precondition is that the previous phase completed successfully. `startup.md` provides the condensed executable checklist — follow it mechanically, step by step.

**Why this happens:** The team-lead is under pressure to "get going" and jumps to what feels most urgent (diagnosis, creation) instead of following the sequence. The sequence exists because each phase's output is a precondition for the next. Reordering doesn't just waste tokens — it produces wrong conclusions (e.g., diagnosing before reading the roster means you don't know what state to expect).

### Phase 0: Orient (*FR:Volta* — amendment from restart test 3, 2026-03-13)

**Precondition:** Team lead has started (either via `rc-start.sh` or manually). May be a fresh session with zero context about the team.

**Problem this solves:** Field test (2026-03-13, restart 3) showed a fresh team-lead spent 31 tool uses, 73.5k tokens, and 2 minutes 18 seconds exploring the codebase to find team config, roster, and prompts. This is pure waste — the same information could be obtained by reading 5 files in a fixed order. Every team-lead (including a context-less fresh session) must be able to self-orient without broad exploration.

**Action:** Read exactly these files, in this order:

| # | File | What it tells you | Where to find it |
|---|---|---|---|
| 0a | `startup.md` | Installation-specific paths, procedures, known gotchas | Team config dir (location must be in team-lead's prompt or MEMORY.md) |
| 0b | `roster.json` | Team name, members, models, `workDir` | Same directory as startup.md |
| 0c | `common-prompt.md` | Mission, communication rules, shutdown protocol, startup instructions | Same directory |
| 0d | Team-lead's own scratchpad | Prior session's decisions, WIP, warnings | `memory/team-lead.md` (relative to team config dir) |
| 0e | `docs/health-report.md` | Latest Medici audit findings (if exists) | `docs/` within team config dir |

**`startup.md` is the bootstrap file.** It contains installation-specific paths (repo location, workDir, env files), the condensed startup procedure, and known environment gotchas. It is the FIRST file a team-lead reads — before roster, before common-prompt, before anything. Each team must maintain a `startup.md` with at minimum: exact paths for this installation, the read-order checklist, the diagnostic procedure, and known environment issues.

**Why `startup.md` and not just Phase 0 in the lifecycle doc?** The lifecycle doc (`topics/06-lifecycle.md`) is a framework-level design document — it describes the *protocol*. `startup.md` is an *instance* — it contains the concrete paths, gotchas, and procedures for one specific team on one specific machine. A team-lead should never need to read the 700-line lifecycle doc to start a session. `startup.md` is the executable checklist derived from the protocol.

**Critical: The team config dir location must be resolvable without exploration.** It must appear in exactly one of:
1. The team-lead's prompt (preferred — always available)
2. MEMORY.md (if teams are managed across projects)
3. A well-known path convention (e.g., `$HOME/.claude/team-configs/<team-name>/`)

If the team-lead's prompt does not contain the repo location, this is a **prompt gap** that must be fixed.

**Expected outcome:** Team lead knows: team name, all members and their roles, the working directory, the mission, and any prior session state. All from 5 file reads, zero exploration.
**Failure if skipped:** Team lead burns tokens on broad exploration (Explore agent, glob/grep sweeps). In the field test, this cost ~2 minutes and consumed significant context window.

#### workDir Resolution (*FR:Volta* — amendment from restart test 3, 2026-03-13)

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

#### Phase 2.0a: Validate `$HOME` (*FR:Volta* — amendment from restart 4, 2026-03-13)

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

#### Phase 2.0b: Diagnose (*FR:Volta* — amended in restart 4, 2026-03-13)

Before touching the filesystem, classify the starting scenario. This costs one `ls` and eliminates the diagnostic uncertainty of "why is the state this way?"

**Precondition:** `$RESOLVED_HOME` is validated (Phase 2.0a). `$TEAM_DIR` is set.

```bash
# TEAM_DIR was set in Phase 2.0a — do NOT re-derive from $HOME
if [ -d "$TEAM_DIR/inboxes" ]; then
  echo "WARM RESTART — stale team dir with inboxes (normal)"
elif [ -d "$TEAM_DIR" ]; then
  echo "PARTIAL STATE — stale team dir, no inboxes (TeamDelete was called or inboxes never created)"
elif ls -d "$RESOLVED_HOME/.claude/teams/<team-name>"-* 2>/dev/null | head -1 >/dev/null; then
  echo "MISCREATION — team dir exists under wrong name (prior TeamCreate without clean)"
else
  echo "COLD START — no prior state (first ever, different machine, or dir cleaned externally)"
fi
```

| Scenario | Meaning | What 2a–2c do |
|---|---|---|
| WARM RESTART | Normal session resumption | 2a backs up inboxes, 2c removes dir |
| PARTIAL STATE | Inboxes lost — TeamDelete was called or previous session crashed before inbox creation | 2a is a no-op (no inboxes), 2c removes dir. **Investigate** (see below). |
| COLD START | No prior team state exists on this machine | 2a, 2b, 2c are all no-ops — proceed through them anyway. **Investigate if not first-ever session** (see below). |
| MISCREATION | TeamCreate ran against an existing dir, generated a suffixed name | 2c removes the wrong-name dir |

All four scenarios converge to the same outcome: `$TEAM_DIR` does not exist, inboxes (if any) are backed up. The diagnosis is informational — it tells the team lead what happened, not what to do differently. **Always run 2a–2c regardless of scenario** — they are idempotent and safe on empty state.

#### Anomaly Detection in Phase 2.0 (*FR:Volta* — amendment from restart test 3, 2026-03-13)

The shutdown protocol (Phase 5: Preserve) explicitly states: **do NOT call TeamDelete.** This means the team directory SHOULD exist at the start of every non-first session. If it doesn't, something went wrong.

**Problem this solves:** In the field test (2026-03-13, restart 3), the team dir was missing. The team-lead classified this as COLD START and moved on silently. The PO flagged this as a mistake — the dir's absence was an anomaly that should have been investigated.

**Rule: COLD START and PARTIAL STATE require a decision, not silent acceptance.**

After classifying the scenario, the team-lead must ask:

```
Is this the first-ever session for this team on this machine?
  YES → COLD START is expected. Proceed normally.
  NO  → COLD START or PARTIAL STATE is ANOMALOUS. Team dir should exist per shutdown protocol.
         Ask the user: "The team dir is missing but the shutdown protocol says it should be preserved.
         What happened? Options: (a) It was manually cleaned, (b) TeamDelete was called by mistake,
         (c) Different machine, (d) I don't know."
         Record the answer in the team-lead's scratchpad as [LEARNED] for future reference.
```

**How the team-lead determines "first-ever":**
1. Check git log for prior commits that include team memory files (e.g., `git log --oneline -- .claude/teams/<team-name>/memory/`)
2. If commits exist → this is NOT first-ever → anomaly
3. If no commits → genuinely first session → expected COLD START

**Why this matters:** Silently accepting a missing dir means the team-lead never learns that inboxes were lost. If the cause was "TeamDelete was called by mistake," the team can add a safeguard. If it was "machine was reimaged," no action needed. But without asking, the cause is never known and the same failure can repeat.

**Reference implementation (sub-steps 2a–2c):**

```bash
# TEAM_DIR was set in Phase 2.0a ($HOME validation) — do NOT re-derive from $HOME

# 2a — no-op (inbox backup removed — see amendment below)
# Inboxes are now persisted to the repo during Shutdown Phase 4a.
# The runtime dir's inboxes are stale copies — safe to discard with the dir in 2c.

# 2b — kill zombies (RC: kill all non-%0 panes; local: N/A)
# RC-specific: tmux kill-pane for each agent pane
# Local: Agent tool processes terminate with parent session

# 2c — remove stale dir (REQUIRED)
rm -rf "$TEAM_DIR"
```

**Expected outcome:** `$TEAM_DIR` does not exist. Team lead knows which scenario was encountered.

**Amendment (*FR:Volta* — 2026-03-13, inbox durability):** Sub-step 2a previously copied runtime inboxes to `/tmp/` for restoration in Startup Phase 4. This created a fragile two-hop chain: runtime dir → `/tmp/` → new runtime dir. Both hops are ephemeral. Shutdown Phase 4a now persists inboxes directly to the repo (durable). Sub-step 2a is no longer needed — the repo copy is the source of truth. The `/tmp/` backup is removed entirely to avoid a confusing fallback chain.
**Failure if skipped:**

- Skip 2.0 → team lead wastes a round-trip investigating why the dir is/isn't there
- Skip 2a → inboxes lost → agents lose cross-session message history
- Skip 2b → zombie processes hold TTY → new spawn may fail or create invisible agents
- Skip 2c → `TeamCreate` generates a random name (e.g. `cloudflare-builders-a7f3`) → inbox routing breaks, all `SendMessage` calls fail silently

### Phase 3: Create

**Precondition:** `$TEAM_DIR` does not exist. Inboxes backed up.
**Action:** `TeamCreate(team_name="<team-name>")` with post-creation verification and retry.

**Expected outcome:** Fresh `$TEAM_DIR` exists with `config.json` containing `leadSessionId`. No `inboxes/` subdirectory (TeamCreate does not create it).
**Failure if skipped:** No team context → all agent spawning and messaging fails.

**Critical invariant:** The `leadSessionId` in `config.json` must match the current session. A stale `leadSessionId` from a previous session breaks agent-to-lead messaging. This is why TeamCreate must run fresh each session — it generates a new `leadSessionId`.

#### Phase 3 Verification and Retry (*FR:Volta* — amendment from restart 4, 2026-03-13)

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

### Phase 4: Restore (*FR:Volta* — amended 2026-03-13, inbox durability)

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

#### Phase 4b: Team Operational Check (*FR:Volta* — amendment from restart 4, 2026-03-13)

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

## Canonical Shutdown Protocol (*FR:Volta*)

### Decision

Shutdown is a 5-phase sequence: **Halt → Notify → Collect → Persist → Preserve**. Team lead shuts down last. TeamDelete is never called.

### Rationale

The key insight from operational experience: the team directory must survive shutdown so that the next session can restore inboxes. `TeamDelete` destroys this. The shutdown sequence is designed so that no state is lost even if the session is interrupted between phases.

### Phase 1: Halt

**Precondition:** Decision to shut down (task complete, session ending, or forced).
**Action:** Team lead stops accepting new work. No new tasks are delegated.

**Expected outcome:** All agents are either idle or completing their current task. No new work in flight.

### Phase 2: Notify

**Precondition:** Halt declared.
**Action:** Three sub-steps:

#### 2a. Team-lead writes own scratchpad (*FR:Volta* — amendment from restart 5, 2026-03-13)

**Before** creating the task snapshot or sending shutdown requests, the team-lead writes their own state to `memory/team-lead.md`. Tags: `[DECISION]`, `[WIP]`, `[DEFERRED]`, `[LEARNED]`, `[WARNING]`.

**Why this step exists and why it comes first:** Field observation (R5, 2026-03-13): team-lead scratchpad was missing after shutdown. The team-lead manages everyone else's shutdown (task snapshot, agent notifications, waiting for termination, git commit) and runs out of cognitive budget for own state. By the time Phase 4 (Persist) runs, the lead's context is near limit and own scratchpad is forgotten. Placing this FIRST in Phase 2 — when the lead still has full context and no coordination load — prevents this.

**The mechanism already exists** — all agents persist to `memory/<name>.md` in the repo dir. Team-lead simply uses the same path (`memory/team-lead.md`). No new infrastructure needed.

#### 2b. Create task-list-snapshot (*FR:Volta* — amendment from restart test 2026-03-13)

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

### Phase 4: Persist (*FR:Volta* — amended 2026-03-13, inbox durability)

**Precondition:** All agents terminated. Task snapshot already created (Phase 2b).
**Action:** Copy inboxes from runtime dir to repo, then commit all session state to version control.

#### Phase 4a: Persist inboxes to repo (*FR:Volta* — 2026-03-13)

**Problem this solves:** The previous protocol relied on the runtime dir (`$HOME/.claude/teams/...`) surviving between sessions. Phase 5 (Preserve) said "do NOT call TeamDelete" to keep inboxes alive. But the runtime dir is ephemeral — reboots, manual cleanup, or OS temp cleanup can destroy it. Field observation (2026-03-13): COLD START despite 5 prior commits in memory/. All closing reports from the previous session were lost because they existed only in the runtime dir's inboxes.

**Key insight: there are TWO `.claude/teams/<team-name>/` directories:**

| Directory | Location | Owner | Durability |
|---|---|---|---|
| Runtime dir | `$HOME/.claude/teams/<team-name>/` | Platform (TeamCreate) | Ephemeral — survives only until dir is removed |
| Repo dir | `<team-config-repo>/.claude/teams/<team-name>/` | Team (git-tracked) | Durable — survives reboots, available on any clone |

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

### Phase 5: Preserve

**Precondition:** Persist complete.
**Action:** Do nothing. Specifically: **do NOT call TeamDelete**. The team directory remains on disk.

**Expected outcome:** `$TEAM_DIR` still exists with `config.json`, `inboxes/`, and all memory files. The runtime dir is now a convenience (faster startup if it survives) but NOT the source of truth — the repo has the durable copy.

**Failure if violated (TeamDelete called):** Runtime dir destroyed. Impact is reduced compared to pre-amendment: inboxes are now in the repo. But `config.json` loss still forces a full TeamCreate cycle on next startup. Rule stands: do NOT call TeamDelete.

---

## Duplicate Prevention Gate (*FR:Volta*)

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

| Spawning path | Gate implementation |
|---|---|
| `spawn_member.sh` (RC/tmux) | Built-in: `jq` check on config.json, exits with error if duplicate found |
| `spawn_local.sh` + Agent tool (local) | Built-in: `jq` check on config.json, exits with error if duplicate found |
| Agent tool alone (local, no script) | Team lead must check config.json manually before calling Agent tool |
| Raw `claude` CLI | Not permitted (no gate possible) |

### Failure mode

Spawning without the gate creates `<name>-2` entries in `config.json`. Effects:

- Inbox routing becomes ambiguous (which `sven` gets the message?)
- Token waste (two agents doing the same role)
- Cleanup requires manual config.json editing or full team restart

### Why this keeps happening

The team lead's context window fills up over a long session. By the time a second spawn is needed, the lead has forgotten that the agent already exists. The fix is structural: the gate must be in the spawning mechanism (script), not in the lead's memory.

**Recommendation for framework:** Spawn tooling should refuse duplicates at the infrastructure level. The Agent tool itself should check `config.json` and reject duplicate names. Until that is implemented, `spawn_member.sh` (RC/tmux) and `spawn_local.sh` (local) provide built-in gates. Teams using the Agent tool without a wrapper script must rely on team lead discipline — a known failure mode.

---

## Spawning Paths (*FR:Volta*)

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

### Path 2.5: `spawn_local.sh` + Agent tool (local teams, automated) (*FR:Volta* — amendment from restart test 2026-03-13)

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

| Capability | Agent tool alone | spawn_local.sh + Agent tool |
|---|---|---|
| Duplicate gate | Manual (team lead remembers) | Structural (script exits with error) |
| Prompt assembly | Manual (team lead reads + pastes) | Automatic (script reads prompt file) |
| Model from roster | Manual (team lead looks up roster) | Automatic (script reads roster) |
| Roster validation | None | Agent name validated against roster |

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

## Cross-Session Handover (*FR:Volta*)

### Decision

Handover state lives in three places: **scratchpads** (per-agent), **shared knowledge files** (per-team), and **task snapshots** (team lead). Each has different write triggers and prune rules.

### Scratchpads

**Location:** `memory/<agent-name>.md` (within team directory)
**Owner:** The agent named in the file. No other agent writes to it.
**Max size:** 100 lines. Prune on startup (Medici flags violations).

#### Write triggers

| Trigger | Tag | Example |
|---|---|---|
| Discovered something non-obvious | `[LEARNED]` | "D1 batch size limit is 100, not documented" |
| Made a decision with rationale | `[DECISION]` | "Using sql.js instead of better-sqlite3 — binary won't build on this machine" |
| Found a repeatable approach | `[PATTERN]` | "Svelte 5 runes: `$derived` replaces `$:` reactive statements" |
| Mid-task checkpoint | `[CHECKPOINT]` | "3/5 tests passing, blocked on auth mock" |
| Stopping before completion | `[WIP]` | "Branch story/47-fix-rating at commit abc123, tests red" |
| Blocked, awaiting external input | `[DEFERRED]` | "Waiting for PO answer on AK-12 before implementing filter" |
| Surprising pitfall | `[GOTCHA]` | "overflow-x: auto breaks position: sticky" |

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

| File | Who writes | Purpose |
|---|---|---|
| `architecture-decisions.md` | Any teammate | Settled choices with rationale and date |
| `test-gaps.md` | Tess (testing agent) | Untested areas for triage |
| `api-contracts.md` | Frontend + backend agents | Agreed API shapes |
| `health-report.md` | Medici | Latest health audit output |

**Write trigger:** When a cross-cutting discovery affects multiple agents.
**Prune trigger:** Team lead reviews on session start; Medici flags stale entries.

### Task Snapshots

**Location:** `memory/task-list-snapshot.md`
**Owner:** Team lead (created during Shutdown Phase 2b, committed during Phase 4)
**Purpose:** Next session's team lead can see what was in progress, what was completed, what was blocked.

**Format:** Simple markdown list with status, assignee, and blockers. Raw TaskList dump is sufficient — no synthesis required. Reduce activation energy to near zero.

**Why Phase 2b, not Phase 4:** Field testing (2026-03-13 restart) showed that placing the snapshot in Phase 4 (Persist) causes it to be forgotten — the team lead is cognitively loaded and executing a multi-step git sequence. Phase 2b is when the lead has the best task picture: all agents still alive, tasks fresh in context.

---

## Stale-Team Recovery (*FR:Volta*)

### Decision

A "stale team" is one where the team directory exists from a previous session but the current session has no live team context. This is the normal state at the start of every session. The canonical startup protocol (Phases 2-4) handles this case by design.

### When recovery is needed

| Scenario | Symptom | Recovery |
|---|---|---|
| Normal session start | `$TEAM_DIR` exists with stale `config.json` | Standard startup: Phase 0 (Orient) → Phase 1 (Sync) → Phase 2 (Clean) → Phase 3 (Create) |
| Crashed session | `$TEAM_DIR` exists, scratchpads may be incomplete | Same as above — scratchpads are best-effort |
| TeamDelete was called | `$TEAM_DIR` does not exist, no inboxes to restore | Phase 0 → Phase 1 → Phase 2 (anomaly detected, see Phase 2.0 anomaly rules) → Phase 3 (Create) — inbox history is lost |
| Wrong team name | `$TEAM_DIR` exists under wrong name (e.g. `team-name-a7f3`) | Phase 0 → Phase 1 → Phase 2 (MISCREATION detected) → remove wrong dir → Phase 3 |
| First-ever session | `$TEAM_DIR` does not exist, no git history of team files | Phase 0 → Phase 1 → Phase 2 (COLD START, expected) → Phase 3 |

### Key insight

There is no special "recovery" procedure. The canonical startup protocol IS the recovery procedure. Every session starts by assuming the team is stale and cleaning it. This makes the protocol idempotent — running it on a clean state or a stale state produces the same result.

---

## Non-Claude Agent Lifecycle (*FR:Volta*)

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

## Patterns from Reference Teams (*FR:Finn*)

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

## Open Questions (*FR:Volta*)

### Resolved (by this design)

- ~~How do we handle stale teams that lost context?~~ → Canonical startup protocol is inherently stale-team recovery (Phase 2 Clean).
- ~~What triggers team shutdown?~~ → Human decision, task completion, or forced (context limit/error). No auto-shutdown.
- ~~How does handover work between sessions?~~ → Scratchpads + shared knowledge files + task snapshots, with defined write triggers and prune rules.
- ~~How does a fresh team-lead self-orient without broad exploration?~~ → Phase 0 (Orient): read roster.json, common-prompt.md, and own scratchpad — 3 files, fixed order, zero exploration. (*FR:Volta* — resolved 2026-03-13 restart 3)
- ~~How to handle stale/wrong workDir in roster.json?~~ → Phase 0 workDir Resolution: validate after reading roster, fallback with WARNING, flag for correction. (*FR:Volta* — resolved 2026-03-13 restart 3)
- ~~How to distinguish "genuinely first session" from "lost state" when team dir is missing?~~ → Phase 2.0 Anomaly Detection: check git log for prior team memory commits. If found → anomaly, ask user. (*FR:Volta* — resolved 2026-03-13 restart 3)
- ~~What if `$HOME` is unreliable on the host platform?~~ → Phase 2.0a: validate `$HOME` before use, fallback to `whoami`-based path. `startup.md` uses absolute paths — it is machine-specific by design. (*FR:Volta* — resolved 2026-03-13 restart 4)
- ~~What if TeamCreate succeeds but config.json doesn't exist on disk?~~ → Phase 3 Verification and Retry: verify config.json after TeamCreate, retry with TeamDelete + TeamCreate (max 2 attempts), hard gate before any spawn. (*FR:Volta* — resolved 2026-03-13 restart 4)
- ~~What if agents are spawned into a non-functional team?~~ → Phase 3 verification is a hard gate for all subsequent phases. No agent spawn (including Medici in Phase 5) until config.json is confirmed on disk. (*FR:Volta* — resolved 2026-03-13 restart 4)
- ~~What if the runtime dir disappears between sessions and inboxes are lost?~~ → Shutdown Phase 4a persists pruned inboxes (last 100 messages per file) to the repo. Startup Phase 4 restores from repo, not `/tmp/`. Repo is the sole source of truth. (*FR:Volta* — resolved 2026-03-13)
- ~~Inbox backup atomicity~~ → Eliminated by removing the `/tmp/` hop. Inboxes go directly from runtime dir to repo during shutdown. No intermediate ephemeral state. (*FR:Volta* — resolved 2026-03-13)

### Still open

1. ~~**Inbox backup atomicity**~~ → Resolved by durable inbox persistence (Shutdown Phase 4a). Inboxes are now committed to the repo during shutdown. The fragile `/tmp/` hop is eliminated — the repo copy survives reboots, crashes, and manual cleanup. The startup restore reads from the repo, not `/tmp/`. (*FR:Volta* — resolved 2026-03-13)

2. ~~**Agent tool duplicate gate**~~ → Resolved by `spawn_local.sh` (Path 2.5). Local teams now have a wrapper script with built-in duplicate gate and prompt assembly. (*FR:Volta* — resolved 2026-03-13)

3. **Daemon agent shutdown protocol** — Should non-Claude agents implement `shutdown_request`/`shutdown_response` in their polling loop, or is kill-process sufficient?

4. **Scratchpad prune automation** — Medici flags violations, but pruning is manual. Should there be an automatic prune step that removes `[WIP]` entries for merged branches?

5. **Multi-team startup coordination** — When tens of teams exist, do they start independently or is there an orchestrator that sequences team startups? (Connects to T04-hierarchy.)

6. **Can teams self-replicate or split?** — Not addressed. May be needed for scaling patterns. (Connects to T01-taxonomy.)

7. **`$HOME` reliability across platforms** — Windows/Git Bash has inconsistent `$HOME` resolution across bash invocations within the same session. Phase 2.0a adds a validation gate, but the root cause (shell initialization inconsistency) is not understood. Does this affect other env vars? Does it happen on macOS/Linux? (*FR:Volta* — discovered restart 4, 2026-03-13)

8. **TeamCreate silent failure** — TeamCreate can return success but not write config.json to disk. Phase 3 now has a retry loop, but the root cause is unknown. Is this a race condition? A permissions issue? Does it correlate with the `$HOME` bug? (*FR:Volta* — discovered restart 4, 2026-03-13)

9. **Inbox size thresholds** — The 100-message-per-file pruning limit (Shutdown Phase 4a) is a reasonable default for research teams with short sessions. For production teams with long sessions and many agents, the right threshold may be different. Should this be configurable per team (in roster.json)? What is the actual size of 100 messages in JSON — does it stay under reasonable git commit sizes? (*FR:Volta* — 2026-03-13)
