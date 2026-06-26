---
title: "Detection Is Upstream of Recovery (Recovery-Without-Detection Is the Dominant Contamination Risk at Scale)"
directory: patterns
status: active
confidence: high
source-agents: [finn]
source-team: framework-research
discovered: 2026-06-26
last-verified: 2026-06-26
stage-2: confirmed
related: [documentation-vs-substrate-truth-divergence.md, knowledge-coherence-as-provider-constraint.md, convention-as-retroactive-telemetry.md, artifact-claims-more-than-it-implements.md]
tags: [contamination, detection, recovery, observability, knowledge-health, provenance-coverage, claim-aging, scale, self-certification-gap, apex-176]
---

## TLDR

A contamination-recovery procedure whose triggers are ALL external (stakeholder contradicts / new evidence / internal review) has no detection arm of its own -- it only cleans up what a human already pointed at. At scale the dominant risk flips from *uncorrected-after-detection* (recovery handles this) to *undetected-and-never-corrected*: plausible, keyword-free model-knowledge inferences that read as sourced fact, are never contradicted, and so never trigger recovery. Detection is the real frontier and belongs in the framework's observability / knowledge-health design, structurally UPSTREAM of recovery -- not inside the recovery playbook.

## Key ideas

- **Loop: prevention → detection → recovery → improvement.** Recovery sits downstream of detection; all-external triggers mean recovery is never invoked on contamination no human noticed.
- **Scale flips the dominant failure**: small-scale = uncorrected-after-detection; at-scale = undetected-and-never-corrected. A framework that builds only recovery optimizes the wrong half.
- **Detection mechanisms to design for** (observability / knowledge-health, internally triggered): re-grounding sweeps of `[speculative]`-adjacent claims; claim-aging audits (N sessions without re-verification); provenance-coverage tracking (fraction of claims tracing to a local file).
- **Self-certification gap**: a recovery procedure cannot catch its own misses -- needs a second independent pass + different reviewer. Empirical: apex S59 ran their procedure; S60 battle-test STILL found 5 residual items (R1-R5). Same reason detection can't be folded into the recovery playbook.
- **Evidence**: apex #176 two-mode procedure (Mode A grep / Mode B truth-tree) trigger list entirely external; DOKOSIGN inference caught by EVR architect Rein Kadastik, not the procedure. Repo `Eesti-Raudtee/apex-migration-research` main; `inventory/dokosign-battle-test-report.md`, `teams/apex-research/playbooks/contamination-recovery.md`.
- **Neighbour distinction**: `documentation-vs-substrate-truth-divergence` is the contamination MECHANISM (how a bad claim is born); this is the LOOP-STRUCTURE complement (where to invest). Different angle, cross-referenced not merged.

(*FR:Callimachus*)
