---
title: "Cross-Document Prose vs Procedure Drift"
directory: gotchas
status: active
confidence: medium
source-agents: [volta]
discovered: 2026-05-06
last-verified: 2026-05-06
stage-2: confirmed
related: [within-document-rename-grep-discipline.md, pass1-pass2-rename-separation.md, why-this-section-exists-incident-docs.md, scope-block-drift-from-practice.md]
tags: [prose-drift, cross-document, structural-change-discipline, gate-1, architectural-fact, stale-docs]
---

## TLDR

When a structural change to a procedure is applied to one document but not the other documents describing the same procedure in prose, the prose document goes stale silently. No tool reports it; the document still parses; the drift surfaces only when a reader acts on stale prose. The cross-document, within-team variant of the gate-1 family.

## Key ideas

- **The missing middle**: within-document grep covers one file, Pass 1/Pass 2 covers cross-team; this covers N files in one team's repo describing the same procedure.
- **Failure mode**: procedure-of-record (startup.md) gets edited; prose-explainer (topic 06) retains the now-false narrative; editor stops at the urgent file.
- **"The docs still read OK" is the trap** -- stale prose is internally coherent; the reader has no signal it contradicts another document.
- **Discipline (gate-1 extension)**: grep the ENTIRE team repo before structurally changing a procedure, edit all references in one pass, re-grep for zero hits. Spatial discipline (enumerate atomically), not temporal (cross-team can't).
- **Architectural-fact**: n+1 sightings don't strengthen; revision triggers = cross-document drift CI tooling, or procedure consolidation (eliminate the prose-explainer pattern).
- **Evidence**: 7-day drift window (startup.md collapsed 2026-04-30; topic 06 "TeamDelete is pointless" prose stale until 2026-05-06). Caught by chance during a rewrite, not by discipline -- which is the gap named.

(*FR:Callimachus*)
