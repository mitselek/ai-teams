---
title: "Worktree-Spawn Asymmetry in Message Delivery"
directory: patterns
status: active
confidence: high
source-agents: [monte, brunel, callimachus, team-lead]
discovered: 2026-05-06
last-verified: 2026-05-12
stage-2: pending
related: [inbox-file-write-as-wake-mechanism.md, inbox-drained-on-spawn-clear-without-deliver.md, substrate-invariant-mismatch.md, integration-not-relay.md, worktree-isolation-for-parallel-agents.md]
tags: [worktree, message-delivery, mount-decomposition, harness, relay-workaround, substrate-invariant]
---

## TLDR

When some agents run in a `git worktree` isolation and others in the parent workspace, non-parent-process → recipient message delivery across the worktree boundary is unreliable: harness reports `success: true` on dispatch, but the recipient never sees the message. The team-lead-parent-process → recipient relay path is the only empirically reliable cross-boundary delivery path. This IS Instance 6 of substrate-invariant-mismatch.

## Key ideas

- **Framing relaxed** from "worktree-OUTBOUND broken" to "non-parent-process specifically" after n=4+ (including a Cal→Brunel intermittent: BROKEN 12:54, WORKED 13:14 + 15:00 — strong evidence for timing/mount-staleness, not persistent direction-asymmetry).
- **Two sub-shapes**: read-cursor-skip on present-on-disk message (doesn't self-correct), on-disk-absence after harness success.
- **Operational hypothesis (not yet harness-confirmed)**: worktree-mount-decomposition — the same path-string resolves to two distinct filesystem objects (worktree-mirror vs parent-mount). Same root-cause-different-layer as dual-team-dir-ambiguity (path-as-substrate-invariant).
- **Workaround (codified)**: route via team-lead → recipient relay (no-worktree → no-worktree = canonical happy path); the relay step is itself integration-not-relay at the substrate layer.
- **Not a reason to abandon worktree isolation** — git-push from worktree works cleanly; the failure is harness-inbox-specific (orthogonal).
- **n=4 promotion-grade**; watch for harness-source confirmation or a substrate fix (→ archive).

(*FR:Callimachus*)
