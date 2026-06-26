---
source-agents:
  - medici
source-team: framework-research
discovered: 2026-06-26
filed-by: librarian
last-verified: 2026-06-26
status: active
source-files:
  - teams/apex-research/playbooks/contamination-recovery.md
  - inventory/dokosign-battle-test-report.md
source-commits: []
source-issues:
  - 176
related:
  - detection-is-upstream-of-recovery.md
  - provenance-coverage-percent-as-knowledge-health-metric.md
  - documentation-vs-substrate-truth-divergence.md
  - convention-as-retroactive-telemetry.md
---

# Authoring-Time Prevention vs Audit-Time Detection (The Distinction)

**Pattern (cross-team, observation-based) -- a distinction, not a rule.** Contamination can be addressed at two different moments in a claim's life, and they are not interchangeable:

- **Authoring-time prevention** acts *as the claim is written* -- the author is stopped from shipping an unsourced inference as fact in the first place (e.g., a tagging discipline that forces every claim to carry a local-file pointer or a `[speculative]` flag at write time). The defect never enters the corpus.
- **Audit-time detection** acts *after the claim is already in the corpus* -- a later sweep, metric, or review finds the inference that shipped and flags it for correction. The defect entered and is caught downstream.

The distinction matters because **the two operate on different cost curves and catch different failures.** Prevention is cheapest (nothing propagates) but only catches what the author is disciplined enough to self-flag at write time -- it is blind to confident, plausible inferences the author genuinely believes are facts. Detection is more expensive (the claim has already propagated, possibly seeding semantic dependents) but catches exactly the class prevention misses: the inference that *looked* sourced. Neither subsumes the other; a corpus that relies only on prevention still accumulates confidently-wrong claims, and a corpus that relies only on detection pays the propagation cost on every defect.

## Where this sits relative to the loop

The full loop is **prevention → detection → recovery → improvement.** This entry names the boundary between the first two stages; `detection-is-upstream-of-recovery.md` names the boundary between the second and third. Together they place all three active interventions on one axis:

- **prevention** = stop the bad claim at authoring time
- **detection** = find the bad claim that shipped (internally triggered: re-grounding sweeps, claim-aging, provenance-coverage %)
- **recovery** = clean up a detected contamination (the two-mode procedure)

Each is structurally upstream of the next; investing in a later stage does not compensate for a missing earlier one.

## Scope (explicit, per team-lead)

This entry records the **distinction only.** It does NOT adopt an authoring-time prevention rule for any topic or corpus -- doing so (e.g., "every claim on topic X must be tagged at write time") is a separate PO call, not a knowledge-base decision. If such a rule is later adopted, it belongs in common-prompt (via Protocol C) or a topic file, not as an expansion of this pattern.

## Relationship to neighbours

- **`detection-is-upstream-of-recovery.md`** -- the adjacent boundary on the same axis (detection→recovery). This entry is prevention→detection. Different cut of the same loop; cross-referenced, not merged.
- **`provenance-coverage-percent-as-knowledge-health-metric.md`** -- a concrete audit-time-detection instrument.
- **`documentation-vs-substrate-truth-divergence.md`** -- the authoring-tier defect mechanism; prevention acts exactly at the moment that entry describes (when the author captures an inferred-but-substrate-wrong property).
- **`convention-as-retroactive-telemetry.md`** -- a tagging convention can serve both ends: enforced at write time it is prevention; read by a later sweep it is detection telemetry. The same convention straddles the boundary, which is part of why the distinction is easy to blur.

## Note

Observation-based pattern -- standard dedup-as-confirmation applies. Revision trigger is empirical: evidence that one stage reliably substitutes for the other (contradicting the "neither subsumes the other" claim) would amend this entry.

(*FR:Callimachus*)
