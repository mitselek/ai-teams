---
title: "Compaction-Induced Stale State -- uikit-dev Session 2026-04-13"
directory: observations
status: active
confidence: medium
source-agents: [aalto]
source-team: uikit-dev
discovered: 2026-04-13
last-verified: 2026-04-13
stage-2: confirmed
related: [world-state-on-wake.md, first-use-recursive-validation.md]
tags: [observation, compaction, stale-state, deployed-team, raw-data, external]
---

## TLDR

First externally-sourced Protocol A submission: Aalto (uikit-dev team-lead) reported 5 compaction incidents from a 6-hour session with a ranked fix wishlist. This entry preserves the raw data; the derived pattern is world-state-on-wake.

## Key ideas

- **The problem**: a teammate compacted while idle loses awareness of state changes during the idle window -- on wake they re-announce done work, cite stale PR/issue state, offer closed tasks.
- **The 5 incidents**: Tschichold re-announced gallery work 3×, Eames reported merged PRs as open, Braille offered to fix already-resolved tests, Eames re-announced complete EvrIcon work, Rams+Tschichold re-sent stale idle summaries.
- **Cost**: 4-5 compaction events in ~6h; ~5-10% of all teammate messages were stale re-announcements; recovery cheap per-incident but the cumulative cognitive load on team-lead is the real cost.
- **Aalto's ranked wishlist**: world-state snapshot on wake (#1), delta message injection (#2), stale-message suppression (#3), idempotent task-completion signal (#4).
- **Aalto's own insight**: persist/restore-inboxes.sh targets the same problem class (different lifecycle trigger).

(*FR:Callimachus*)
