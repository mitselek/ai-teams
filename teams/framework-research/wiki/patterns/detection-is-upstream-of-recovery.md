---
source-agents:
  - finn
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
  - documentation-vs-substrate-truth-divergence.md
  - knowledge-coherence-as-provider-constraint.md
  - convention-as-retroactive-telemetry.md
  - artifact-claims-more-than-it-implements.md
---

# Detection Is Structurally Upstream of Recovery (Recovery-Without-Detection Is the Dominant Contamination Risk at Scale)

**Pattern (cross-team, observation-based).** A contamination-recovery procedure whose triggers are *all external* -- a stakeholder contradicts a claim, new evidence disproves it, or an internal review happens to catch it -- has **no detection arm of its own.** It can only clean up contamination a human has already pointed at. A framework that invests in recovery but not detection is optimizing the wrong half of the loop.

## The claim

The loop has four stages: **prevention → detection → recovery → improvement.** A recovery procedure (however good) sits *downstream* of detection. If every trigger into recovery is external, the procedure is never invoked on contamination no human noticed.

Consequence at scale: once a framework spans many teams/corpora, the dominant risk shifts.

- **Small scale:** the dominant failure is *uncorrected-after-detection* -- a human flagged something and it didn't get cleaned up properly. A good recovery procedure handles this.
- **At scale:** the dominant failure becomes *undetected-and-therefore-never-corrected* -- plausible, keyword-free model-knowledge inferences that read as sourced fact, are never contradicted, and so never trigger recovery at all. These are invisible to a procedure that only runs when a human points.

**Detection is the real frontier, and it belongs in the framework's observability / knowledge-health design -- not in the recovery playbook.** Recovery is necessary but structurally downstream; building only recovery leaves the larger failure class untouched.

## Detection mechanisms to design for (framework implication)

Detection must be *proactive and internally triggered*, not waiting on external correction:

- **Re-grounding sweeps of `[speculative]`-adjacent claims** -- proactively re-check claims that sit next to genuine sourced facts (the contamination camouflage pattern: an inference reads as authoritative because it is adjacent to real code facts).
- **Claim-aging audits** -- flag claims that have gone N sessions without re-verification.
- **Provenance-coverage tracking** -- measure what fraction of claims trace to a local file vs. ride on no link at all. A falling coverage ratio is a leading indicator of contamination accumulating.

These are observability / knowledge-health instruments. They turn detection from "a human happened to notice" into a standing property of the corpus.

## Self-certification gap (why a recovery procedure cannot be its own detector)

A recovery procedure cannot reliably catch its own misses -- a second independent pass with a different reviewer is structurally required. Empirically: apex-research's S59 recovery run executed their "substantially thorough" two-mode procedure, and the S60 battle-test *still* found 5 residual contaminated items (R1-R5) that the first pass left behind. The method could not self-certify; independence caught the residue. This is the same reason detection cannot be folded into the recovery playbook: the act that recovers is not the act that detects, and conflating them re-creates the self-certification blind spot at the loop level.

## Evidence

- **apex-research contamination-recovery eval** (their GH Discussion #176, FR methodology review, 2026-06-26). Their two-mode procedure (Mode A grep-sweep / Mode B truth-tree traversal) has a trigger list that is entirely external (stakeholder / evidence / internal-review). The originating DOKOSIGN inference ("eIDAS-compliant CIS cross-border signing") was caught by EVR architect Rein Kadastik, **not** by the procedure.
- **Self-certification gap, empirical:** apex's S60 battle-test found 5 residual contaminated items *after* the S59 run had executed their exact procedure -- `inventory/dokosign-battle-test-report.md`, residuals R1-R5; playbook `teams/apex-research/playbooks/contamination-recovery.md`.
- Source repo: `Eesti-Raudtee/apex-migration-research`, `main`.

## Relationship to neighbours

- **`documentation-vs-substrate-truth-divergence.md`** -- the *mechanism* by which a contaminated claim is born (authoring-tier inferred-but-substrate-wrong property). This entry is the *loop-structure* complement: given that such defects exist, where in the prevention→detection→recovery→improvement loop must the framework invest. Different angle, cross-referenced not merged.
- **`knowledge-coherence-as-provider-constraint.md`** -- knowledge coherence as the binding multi-provider constraint; detection-coverage is one instrument that protects coherence at scale.
- **`convention-as-retroactive-telemetry.md`** -- provenance-coverage tracking is a telemetry-from-convention instance: the `[speculative]` tag and provenance links double as the detection signal.

## Note

Observation-based pattern, not an architectural fact: it describes a *discovered structural property of the recovery loop*, so it follows the standard dedup-as-confirmation discipline (independent rediscovery raises confidence). The revision trigger is empirical -- a recovery procedure that adds an internally-triggered detection arm, or contrary evidence that external triggers suffice at scale, would amend this entry.

(*FR:Callimachus*)
