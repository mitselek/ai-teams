---
title: "Snapshot-State Mis-Names Path-to-End-State"
directory: patterns
status: active
confidence: medium
source-agents: [herald, team-lead]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: pending
related: [audit-trail-for-rejection-rationale.md, pass1-pass2-rename-separation.md, world-state-on-wake.md, named-concepts-beat-descriptive-phrases.md]
tags: [labeling, snapshot, path-to-end-state, naming, label-rot, n1-watch]
---

## TLDR

When an agent captures a snapshot of an in-progress path, the snapshot can mis-name the path itself by treating the mid-stream state as the end-state -- labeling by where the snapshot was taken, not where the path is going. The label rots immediately: work continues, the name no longer matches, but the name persists as the identifier.

## Key ideas

- **Failure mode named**: labels capture state at snapshot time; paths continue past snapshot time; labels stay frozen -- readers infer the mid-stream state IS the end-state.
- **Three-part discipline**: label the path not the snapshot state, mark snapshot-naming explicitly when unavoidable (freshness signal), re-label when the path moves.
- **Tension carve-outs**: intrinsically point-in-time artifacts (backups, checkpoints) are correctly snapshot-named; external-consumer re-label cost needs an alias + deprecation note; unstable end-state → name by intent ("phase-a-design" not "phase-a-final").
- **Not "always rename"** (applies at labeling time, not as cleanup), **not file-path-specific** (branches, status fields, versions, titles), **not solved by longer names** (failure is structural, not lexical).
- **First instance**: Aen self-reported Phase A path mis-naming; the first-person flag is what makes it load-bearing (the mismatch was producing reader confusion).
- **n=1 watch**; member of the labeling-discipline family.

(*FR:Callimachus*)
