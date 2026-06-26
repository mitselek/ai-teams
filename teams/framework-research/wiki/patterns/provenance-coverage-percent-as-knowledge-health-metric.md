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
  - convention-as-retroactive-telemetry.md
  - documentation-vs-substrate-truth-divergence.md
  - knowledge-coherence-as-provider-constraint.md
---

# Provenance-Coverage % Per Corpus Segment as a Knowledge-Health Metric

**Pattern (cross-team, observation-based).** Track **the fraction of claims in a corpus that trace to a local file** (vs. claims riding on no provenance link at all), **measured per corpus segment** -- not just as a single corpus-wide number. Provenance coverage is a standing knowledge-health metric: a falling ratio in any segment is a leading indicator that contamination is accumulating *there*, before any human contradicts a specific claim.

## The metric

- **Definition:** for a given segment of the corpus, `provenance-coverage % = (claims with a valid local-file provenance link) / (total claims) * 100`.
- **Per-segment, not corpus-wide.** A single global percentage hides where the rot is. The same 90%-overall corpus can have one segment at 99% and another at 55%; the average masks the at-risk segment. Segment by whatever the corpus's natural unit is (source-doc domain, decision-record series, glossary category, topic file).
- **A leading indicator, not a lagging one.** It moves *before* a stakeholder correction arrives. Unlike a recovery procedure (which fires only on external trigger), a coverage metric surfaces the at-risk segment proactively -- it is one of the internally-triggered detection instruments that detection-is-upstream-of-recovery argues the framework must build.

## Why per-segment matters (the load-bearing claim)

Contamination is *local* before it is global. A model-knowledge inference propagates through a neighbourhood of related claims (a source-doc family, an ADR chain) faster than it spreads corpus-wide. A per-segment coverage delta catches the neighbourhood while a corpus-wide average is still comfortably high. The metric's value is the *gradient across segments*, not the absolute number.

## Relationship to neighbours

- **`detection-is-upstream-of-recovery.md`** names provenance-coverage tracking as one of three detection mechanisms (alongside re-grounding sweeps and claim-aging audits). THIS entry is the metric itself, specified: the per-segment cut, the leading-indicator property, the definition. Loop-structure entry says *that* detection belongs upstream; this entry says *how* one detection instrument is computed. Cross-referenced, not merged.
- **`convention-as-retroactive-telemetry.md`** -- provenance-coverage is a telemetry-from-convention instance: the provenance-link convention (and the `[speculative]` tag) doubles as the measurement substrate. No separate instrumentation needed; the coverage metric reads the conventions already in place.
- **`documentation-vs-substrate-truth-divergence.md`** -- the authoring-tier defect this metric helps detect: an inferred-but-substrate-wrong claim that shipped without provenance lowers its segment's coverage.

## Note

Observation-based pattern (a proposed knowledge-health instrument), not an architectural fact -- standard dedup-as-confirmation applies; independent rediscovery or a deployment that emits the metric would raise confidence. The revision trigger is empirical: a measured deployment that shows per-segment coverage does NOT predict contamination (or that corpus-wide suffices) would amend this entry. Scope: this records the metric as a principle; it does not mandate a coverage threshold or an authoring rule (that would be a separate PO call).

(*FR:Callimachus*)
