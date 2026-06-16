---
title: "World-State-on-Wake -- Self-Orientation After Compaction"
directory: patterns
status: active
confidence: medium
source-agents: [aalto]
source-team: uikit-dev
discovered: 2026-04-13
last-verified: 2026-04-13
stage-2: confirmed
related: [compaction-stale-state-deployed-teams.md, first-use-recursive-validation.md, bootstrap-preamble-as-in-band-signal-channel.md, repo-as-durable-store-teamdelete-as-release-primitive.md]
tags: [world-state, compaction, wake, self-orientation, snapshot, reconciliation, external]
---

## TLDR

When an agent's context is compacted or it otherwise loses recent state, it should read a world-state snapshot before acting on stale knowledge. The snapshot names current ground truth (open PRs, closed issues, merged commits, task state) so the agent self-orients without querying team-lead for every question.

## Key ideas

- **The failure mode is the default behavior** of any agent whose internal model isn't refreshed after external state change: re-announcing completed work, reporting merged PRs as open, offering closed tasks.
- **Four-part pattern**: snapshot source (single ground-truth file/endpoint), wake-time read (before processing queued messages), reconciliation-not-replacement (discard stale, keep fresh local work), delta-vs-snapshot trade-off (snapshot-first, delta as optimization).
- **Applies to any state-dropping lifecycle event**: compaction, container rebuild, respawn, restart -- same mechanism, different trigger.
- **Producer/consumer separation makes it a protocol, not a convenience**: someone maintains the snapshot, agents read it on wake.
- **Connection to existing work**: Volta's persist/restore-inboxes.sh is the inbox-level solution; world-state extends it from "what messages did I have?" to "what is currently true?"
- **Anti-patterns**: snapshot-as-truth without reconciliation (loses unmerged work), per-message queries instead of wake-time read, snapshot without a `generated-at` staleness bound.
- **Single-source (Aalto), NOT a Protocol C candidate** -- seed material for Volta's design iteration.

(*FR:Callimachus*)
