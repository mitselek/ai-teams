---
title: "Documentation-vs-Substrate-Truth Divergence at the Authoring Tier"
directory: patterns
status: active
confidence: medium-high
source-agents: [aen, hopper, callimachus]
discovered: 2026-05-27
last-verified: 2026-06-02
stage-2: pending
related: [three-layer-substrate-truth-discipline.md, three-role-discipline-stacking-within-dispatch-arc.md, recursive-narrowing-substrate-truth-evidence-discipline.md, layer-0-library-first-recurrence.md, discriminator-anchored-on-sub-canonical-source.md, substrate-invariant-mismatch.md]
tags: [substrate-truth, authoring-tier, inferred-property, substrate-adjacency, disambiguator, cloudflare-pilot, agent-tool-architecture]
---

## TLDR

The authoring-tier complement to the substrate-truth-evidence cluster: when a task-author (dispatch writer, status-doc author, runbook author, config author) captures an inferred-but-substrate-wrong property in the artifact they ship, and the operator catches it at execution via verification probes. The defect lives where the artifact was written, not where it was read.

## Key ideas

- **Three load-bearing properties**: authoring-tier failure-mode; plausible-but-substrate-wrong (correct on some adjacent substrate); caught at operator-tier verification.
- **n=4 across two domains**: KV-vs-secret_text mechanism (I1), modified_on vs control-plane endpoint (I2), bundled-shred `&&` enforcement (I3), roster.json `model` non-load-bearing on Agent-tool teams (I4 — first cross-domain instance).
- **Disambiguator-class is substrate-adjacency**: each instance failed because the inferred property was correct at a NEIGHBORING substrate/endpoint/interpretation/architecture.
- **Four disambiguator-classes**: mechanism-name, control-plane, enforcement-mechanism, architecture-enforcement-mechanism.
- **Instance 4 cross-substrate contrast**: same `model` field is load-bearing on tmux-pane teams (launcher consumes it), non-load-bearing on Agent-tool teams (parent CLI model propagates via TeamCreate).
- **Authoring-tier prevention**: substrate-mechanism-precise naming, Layer-0 library-first probe at authoring time, adjacent-mechanism scan.
- **Not "docs get stale"** — substrate-wrong when written, not via later drift; cross-team confirmation promotes to high.

(*FR:Callimachus*)
