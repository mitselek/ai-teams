---
source-agents:
  - brunel
  - monte
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-05
status: active
confidence: medium
source-files: []
source-commits:
  - "07abf35"
source-issues: []
amendments:
  - "2026-05-05: Instance A first-person addendum (Brunel near-miss substrate observations) + git show origin/<branch>:<file> recovery primitive added to §How to apply"
related: []
---

# Worktree Isolation for Parallel Agents on a Shared Clone

When two or more specialists work on the same git repository in parallel — different feature branches, different design docs, but the SAME local clone — the shared working tree silently corrupts parallel work. The durable fix is `git worktree add` to give each specialist a separate physical working directory; the underlying object database is shared but each working tree is isolated.

The discipline names: **for parallel-agent contexts on a shared clone, default to worktree isolation; do not default to stash-and-coordinate or sequential branch-handoff.**

## The failure mode (anti-shape)

Without worktree isolation, four things break:

1. **Specialist A's uncommitted changes block Specialist B's branch switch.** `git checkout -b NEW origin/main` refuses with "local changes would be overwritten."
2. **Stashing A's work to make room for B is risky.** Stash is per-repo, not per-specialist; A may lose track of what's stashed when they return.
3. **Force-switch overwrites uncommitted work.** `git checkout -f` produces silent data loss.
4. **Even with clean working tree, branch ambiguity persists.** If A's branch is checked out and B starts work, B's untracked files appear inside A's branch's working tree, creating visual ambiguity ("which branch do these belong to?").

The natural reflexes (stash, force-switch, sequential-handoff) are all degraded paths:

- **Stash** preserves work but hides it; risk of abandonment.
- **Force-switch** overwrites; silent data loss.
- **Sequential handoff** serializes work and eliminates the parallelism that motivated the multi-specialist setup.

Worktree isolation is the third path: keep parallel work parallel without shared-state contention. Each specialist's working directory is theirs; the underlying object database (`.git/`) is shared but read-mostly from each working tree's perspective.

## How to apply

```bash
# Specialist starts a new branch, isolated from primary working tree
git worktree add <path> -b <new-branch> <base-ref>

# Example (from instance B below):
git worktree add ~/.mmp/prism-monte -b phase-a-1-monte origin/main

# When the branch's PR merges, clean up:
git worktree remove <path>
```

Each worktree has independent index, working tree, and branch. Two worktrees cannot have the same branch checked out simultaneously (worktrees are an exclusive lease on a branch's working state). The object database (`.git/objects/`) is shared.

### Recovery: when the working tree appears to show "lost" work

If a system-reminder or tool claims a file was externally modified (and you didn't modify it), the most likely cause is that another specialist switched branches on the shared clone — your work isn't lost, the working-tree view just isn't on your branch anymore. **Diagnostic + recovery sequence:**

```bash
# 1. Diagnose: which branch is actually checked out?
git status
git branch --show-current

# 2. If the working tree is on someone else's branch, verify your work is safe on origin:
git show origin/<your-branch>:<your-file>

# 3. If your work is intact on origin, do NOT re-Edit. Instead:
#    - Either switch back to your branch (will fail if other specialist has uncommitted changes)
#    - Or, preferably, create your own worktree:
git worktree add <new-path> <your-branch>
```

**Origin truth ≠ working-tree view when worktrees aren't isolated.** The "lost work" is a viewing artifact, not real loss. Re-Editing without diagnosis would commit your re-applied work onto whichever branch the working tree is currently on — silently polluting another specialist's branch and leaving your origin commit appearing "missing" from your view.

## When the pattern applies

Three joint conditions:

1. **Multiple specialists active in the same repo.** Two or more parallel agents (or humans) working on different branches at the same time.
2. **Shared local clone.** The team operates on a single physical clone of the repo, not per-specialist clones.
3. **Branch overlap is incidental, not intentional.** Each specialist owns their branch; cross-specialist branch sharing is via PR merges, not direct working-tree sharing.

When all three hold, default to worktree isolation. The substrate-level cost (disk space, command-line ceremony) is bounded; the failure-mode cost (lost work, false synchronization) is unbounded.

## When this is in tension

- **Disk space.** Each worktree is a full working directory copy. For multi-GB repos, this matters; for design-doc repos like prism (~5MB) it doesn't.
- **Cross-worktree references.** Symlinks, hardcoded paths, or build artifacts that reference the original working tree's paths break in worktrees. Codebases that assume "the repo lives at `~/myrepo`" need adjustment. Pure-markdown repos are unaffected.
- **Single-specialist workflows.** If only one specialist is active in the repo, worktree adds overhead without benefit. The pattern is specifically for parallel-agent contexts.

## What this is NOT

- **Not a sandboxing mechanism.** Worktrees share `.git/objects/` and references. Privileged operations (force-push, branch deletion, gc) affect all worktrees.
- **Not a substitute for branches.** Worktrees and branches are orthogonal — every worktree is on a branch; every branch can be checked out into at most one worktree.
- **Not a remote-mirroring tool.** All worktrees pull from the same `origin`.

The discipline is **scoped to parallel-agent shared-clone work**; do not propose it as a universal git practice. Single-specialist workflows have different cost-benefit; worktrees there are overhead with no failure-mode to mitigate.

## First instances — Phase A.1, session 26 (2026-05-05)

n=2 within-session-empirical. Both observed in `mitselek/prism` work during Phase A.1 specialist coordination.

### Instance A — Brunel near-miss (first-person)

**Trigger.** Brunel had just pushed `phase-a-1-brunel-s3` (commit `07abf35`, §3 namespace allocation fill-in). Within seconds, the `Edit` tool surfaced a system-reminder claiming "the file was modified, either by the user or by a linter" — and the reminder showed the file content reverted to the *pre-§3-fill* state.

**What almost happened.** Brunel's next instinct would have been to re-apply the four §3 edits and re-commit. That re-commit would have landed on whichever branch the working tree was actually on — which had not yet been checked.

**What triggered the catch.** The diff in the system-reminder was too clean to be a linter artifact. A linter would touch frontmatter formatting or whitespace; this was a complete reversion of 51 lines of substantive content. That mismatch made Brunel run `git status` instead of re-Editing.

**What `git status` revealed.** The working tree had been silently switched to `phase-a-1-herald` by an external process (Herald checking out his branch for parallel A.1 work on the shared `~/.mmp/prism` clone). The `phase-a-1-brunel-s3` branch was NOT checked out; the working tree showed the file as it appears on Herald's branch (which doesn't have Brunel's §3 commit).

**What would have happened uncaught.** Brunel would have re-applied 51 lines of `phase-a-1-brunel-s3`'s §3 content onto Herald's `phase-a-1-herald` branch and committed it under his branch name. Either: (a) the commit would have landed on Herald's branch, polluting his PR with unrelated work; (b) Herald would have had to revert it; (c) Brunel's §3 commit on origin (`07abf35`) would have appeared "lost" from the working-tree view, prompting wasted re-do effort.

**Verification step that resolved the alarm.** `git show origin/phase-a-1-brunel-s3:designs/brunel/brilliant-mcp-fr-setup-2026-05-05.md` confirmed the §3-ratified content was safe on origin under the correct branch. **Origin truth ≠ working-tree view when worktrees aren't isolated.**

**Discipline this teaches.** When a system-reminder claims a file was externally modified, run `git status` + `git branch --show-current` BEFORE re-Editing. If the working tree is on someone else's branch, the "lost work" is a viewing artifact, not real loss. See §How to apply for the `git show origin/<branch>:<file>` recovery primitive.

### Instance B — Monte preemptive worktree creation (2026-05-05 16:25–16:34)

Monte detected a shared-clone collision while preparing the Surface 2 PR. Herald had ~22 lines of uncommitted v1.1 fold-in modifications in `designs/herald/01-federation-envelope-contract.md` on the shared `~/.mmp/prism` clone (Herald's in-progress task). Monte's `git checkout -b phase-a-1-monte origin/main` failed:

```
error: Your local changes to the following files would be overwritten by checkout:
  designs/herald/01-federation-envelope-contract.md
```

Per FR's existing memory rule (*"use isolation: worktree when spawning parallel agents that work in the same git repo"*), Monte created `~/.mmp/prism-monte` as a worktree off `origin/main`. Files copied in, committed, pushed; PR #4 opened with zero touch on Herald's working tree. PR #4 merged cleanly at 16:33; worktree removed cleanly at 16:34.

**Team-lead ratified the autonomous decision at 16:33:** *"worktree-isolation autonomous decision is the superior approach. Adopting as default for Phase A.2+ specialist work."*

## Promotion posture

n=2 within-session-empirical, both substantive (one near-miss caught before damage, one collision-resolution shipped clean). Team-lead explicitly endorsed pattern-class filing at this n + adopted worktree-isolation as default for Phase A.2+ specialist work.

**Watch for session-tempo n=3** (a future session producing a third instance) to consider promotion to `common-prompt.md` as a team-wide rule. The current memory-rule formulation (*"use isolation: worktree when spawning parallel agents..."*) already lives in user memory; common-prompt promotion would lift it into the team's L1 standards layer.

## Substrate-level analog to coordination-layer patterns

This pattern is the **substrate-layer analog to the contract-layer coordination patterns filed today**:

- [`dispatch-granularity-matches-recovery-handler.md`](dispatch-granularity-matches-recovery-handler.md) and [`coordination-loop-self-correction.md`](coordination-loop-self-correction.md) describe what specialists *DO* when their designs interact in parallel — how to structure the typed contract, how to self-correct mid-loop.
- This entry describes what *TOOLING* enables them to work in parallel without interference. The tooling-layer discipline + the contract-layer discipline together complete the parallel-agent operational story.

A team with the contract-layer disciplines but without worktree isolation will still hit silent corruption on the shared clone. A team with worktree isolation but without the contract-layer disciplines will isolate cleanly but produce divergent designs that have to be reconciled by retroactive coordination. Both layers are needed.

## Related

- [`integration-not-relay.md`](integration-not-relay.md) — adjacent at the substrate analog: specialist positions are time-indexed state at the *content* layer; this pattern says specialist *workspaces* are time-indexed state at the *substrate* layer. Isolating workspaces prevents one specialist's transient state from corrupting another's, parallel to how integration-not-relay says don't propagate one specialist's pending position as another specialist's accepted contract.
- [`dispatch-granularity-matches-recovery-handler.md`](dispatch-granularity-matches-recovery-handler.md) — sibling at the contract layer; together with this entry's substrate-layer discipline they cover both what specialists DO and what TOOLING enables them.
- [`coordination-loop-self-correction.md`](coordination-loop-self-correction.md) — sibling at the contract-layer process; the within-loop self-correction discipline operates *inside* the worktree-isolation tooling. Without isolation, self-correction can't happen because the corrupting state has already mixed.

(*FR:Cal*)
