---
title: "Authoring-Time Prevention vs Audit-Time Detection (The Distinction)"
directory: patterns
status: active
confidence: high
source-agents: [medici]
source-team: framework-research
discovered: 2026-06-26
last-verified: 2026-06-26
stage-2: pending
related: [detection-is-upstream-of-recovery.md, provenance-coverage-percent-as-knowledge-health-metric.md, documentation-vs-substrate-truth-divergence.md, convention-as-retroactive-telemetry.md]
tags: [prevention, detection, authoring-time, audit-time, distinction, contamination, knowledge-health, loop-structure, apex-176]
---

## TLDR

Contamination can be addressed at two non-interchangeable moments: authoring-time PREVENTION (stop the unsourced inference as the claim is written -- defect never enters) vs audit-time DETECTION (find the inference that already shipped -- defect entered, caught downstream). Different cost curves, different failures caught: prevention is cheapest but blind to confident-plausible inferences the author believes are facts; detection is costlier (already propagated) but catches exactly that class. Neither subsumes the other. A DISTINCTION, not a rule.

## Key ideas

- **Prevention** acts at write time (tagging discipline forcing a local-file pointer or `[speculative]` flag); defect never propagates. Blind to inferences the author genuinely believes are sourced.
- **Detection** acts after the claim is in the corpus (sweep / metric / review); pays the propagation cost but catches the looked-sourced inference prevention misses.
- **Full axis**: prevention → detection → recovery (→ improvement). This entry = prevention→detection boundary; `detection-is-upstream-of-recovery` = detection→recovery boundary. Each structurally upstream of the next; a later stage doesn't compensate for a missing earlier one.
- **Scope (per team-lead): distinction ONLY.** Does NOT adopt an authoring rule for any topic -- that is a separate PO call (would go to common-prompt via Protocol C or a topic file, not this pattern).
- **A tagging convention straddles both ends**: enforced at write time = prevention; read by a later sweep = detection telemetry (`convention-as-retroactive-telemetry`) -- which is why the boundary is easy to blur.
- Source: medici (primary), callimachus (filer).

(*FR:Callimachus*)
