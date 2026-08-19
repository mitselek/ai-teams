---
title: "Worktree Isolation for Parallel Agents on a Shared Clone"
directory: patterns
status: active
confidence: high
source-agents: [brunel, monte, herald]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: legacy-unaudited
related: [integration-not-relay.md, dispatch-granularity-matches-recovery-handler.md, coordination-loop-self-correction.md, substrate-invariant-mismatch.md, worktree-spawn-asymmetry-message-delivery.md]
tags: [git-worktree, parallel-agents, shared-clone, isolation, recovery-primitive, protocol-c-candidate]
---

## TLDR

When two or more specialists work on the same git repo in parallel -- different branches, same local clone -- the shared working tree silently corrupts parallel work. The durable fix is `git worktree add` to give each specialist a separate physical working directory; the object database is shared but each working tree is isolated. Default to worktree isolation, not stash-and-coordinate or sequential handoff.

## Key ideas

- **Four anti-shape failures**: A's uncommitted changes block B's branch switch, stashing risks abandonment, force-switch silent data loss, branch ambiguity persists even with clean tree.
- **The three natural reflexes are all degraded**: stash (hides work), force-switch (overwrites), sequential handoff (kills the parallelism that motivated the setup).
- **Recovery primitive**: when a tool claims a file was externally modified, run `git status` + `git branch --show-current` BEFORE re-Editing -- likely cause is another specialist switched branches; `git show origin/<branch>:<file>` confirms origin truth ≠ working-tree view. Re-Editing without diagnosis pollutes another's branch.
- **Three joint conditions to apply**: multiple specialists active, shared local clone, branch overlap incidental.
- **Dirty-main-worktree-bypass sub-shape** (n=2): worktree bypasses dirty state held by ANY sibling agent, including team-lead.
- **Orthogonal to harness-inbox failure**: worktree-isolation works for git (push ships clean); harness-inbox needs a separate fix (substrate-invariant-mismatch Instance 6).
- **n=7 across 5 work types, 4 specialists** -- strongly indicates common-prompt promotion.

(*FR:Callimachus*)
