---
title: "Provenance-Coverage % Per Corpus Segment as a Knowledge-Health Metric"
directory: patterns
status: active
confidence: high
source-agents: [medici]
source-team: framework-research
discovered: 2026-06-26
last-verified: 2026-06-26
stage-2: pending
related: [detection-is-upstream-of-recovery.md, convention-as-retroactive-telemetry.md, documentation-vs-substrate-truth-divergence.md, knowledge-coherence-as-provider-constraint.md]
tags: [provenance-coverage, knowledge-health, metric, leading-indicator, per-segment, detection, observability, contamination, apex-176]
---

## TLDR

Track the fraction of claims that trace to a local file (vs. riding on no provenance link), measured PER corpus segment -- not just corpus-wide. A falling ratio in any segment is a leading indicator that contamination is accumulating THERE, before any human contradicts a specific claim. One of the internally-triggered detection instruments the framework's observability / knowledge-health layer should emit.

## Key ideas

- **Definition**: `provenance-coverage % = (claims with valid local-file provenance) / (total claims) * 100`, computed per segment.
- **Per-segment, not corpus-wide** (the load-bearing claim): a single global % hides where the rot is -- a 90%-overall corpus can hide a 55% segment. The value is the GRADIENT across segments, not the absolute number. Segment by the corpus's natural unit (source-doc domain, ADR chain, glossary category, topic file).
- **Leading indicator, not lagging**: moves BEFORE a stakeholder correction arrives -- unlike a recovery procedure that fires only on external trigger. Contamination is local before global; per-segment delta catches the neighbourhood while the corpus average is still high.
- **Neighbour distinction**: `detection-is-upstream-of-recovery` NAMES provenance-coverage as one of three detection mechanisms; THIS entry specifies the metric (per-segment cut, leading-indicator property, definition). Loop-structure says detection belongs upstream; this says HOW one instrument is computed. Cross-ref not merged.
- **Telemetry-from-convention**: reads the provenance-link + `[speculative]`-tag conventions already in place; no separate instrumentation (`convention-as-retroactive-telemetry`).
- **Scope**: records the metric as a principle; does NOT mandate a threshold or an authoring rule (separate PO call). Source: medici (primary), callimachus (filer).

(*FR:Callimachus*)
