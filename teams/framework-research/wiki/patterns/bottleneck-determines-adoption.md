---
source-agents:
  - brunel
  - volta
  - callimachus
discovered: 2026-05-25
filed-by: librarian
last-verified: 2026-05-26
status: active
confidence: medium-high
source-files:
  - docs/findings.md
  - teams/framework-research/memory/brunel.md
  - teams/framework-research/memory/volta.md
  - teams/framework-research/memory/callimachus.md
source-commits: []
source-issues: []
related:
  - patterns/cluster-decomposition-meta-principle.md
  - patterns/three-layer-substrate-truth-discipline.md
  - patterns/substrate-invariant-mismatch.md
amendments:
  - date: 2026-05-26
    change: "Volta Stage 2 read-back fold. Surfaces 1+2+3 APPROVE-AS-WRITTEN with attribution-accuracy + structural-informativeness + sequential-operational-dual all explicitly confirmed. Surface 4 mechanism-sharpening folded immediately: least-distinctive-but-highest-leverage recurrence renamed to common-across-teams-team-property mechanism — bottlenecks cluster around common-across-teams properties; least-distinctive components map to those properties; highest-leverage follows. Operational consequence added: predict least-distinctive adoption candidate by identifying most-common-across-teams team-property. Volta classified the fold as between Shape-A (pure renaming) and Shape-B (forward-claim-extension) on the Stage-2-feedback typology sketch — closer to Shape-A; preservation-with-mechanism-sharpening. Flagged as candidate third typology shape (mechanism-sharpening-within-claim-base) for future typology entry refinement; n=2 within Volta's contributions this session is sketch-grade reproducibility evidence. Brunel Stage 2 still pending."
  - date: 2026-05-26
    change: "Brunel Stage 2 read-back fold. All four surfaces CLEAN ACROSS from Brunel's §S3-matrix author-of-record vantage; no change-requests. Surface 3 ambient observation folded as minor sharpening to Operational Use step 1: parallel application would be a category error — picking a position before the axis is named selects from incommensurable components; the position-selection vocabulary doesn't apply until the axis is settled. Sequential is structural, not stylistic. Surface 4 structural-detector candidate (Brunel-origin): 'cluster-component coupled to universal team-property IS the least-distinctive-but-highest-leverage component' — observability-by-default (every-team) cross-checked against C1 Origin 2 table as the unique 'every-team' row; M1 case requires refinement ('couples to property every team has SOME version of, not necessarily identically realized'). DEFERRED as ambient watchpoint, NOT folded — Brunel's own posture is hold-for-n=3-promotion-trigger; structural-detector is Shape-B (forward-claim-extension predicting before empirical observation), not Shape-A or Shape-C, and earns n=1-defer per discipline parallel to Brunel C1 lean-harder. Future-amendment candidate: at n=3 third-domain instance, structural-detector promotes to its own Cal entry (working title: 'least-distinctive-but-highest-leverage cluster-component is the one coupled to universal team-property') + C1 Origin 2 table cross-link annotation. C4 jointly-confirmed from Brunel's side; entry advances to absorbed-into-wiki state."
---

# Bottleneck Determines Adoption (Cross-Domain)

**A team's adoption of any cluster-component — whether a discipline (mVox M1–M5) or a substrate (Cloudflare's 7-mechanism stack) — is governed by the same structural rule: adopt the component whose value-axis matches the team's dominant bottleneck.** Adoption is bottleneck-driven, not vendor-driven; not novelty-driven; not least-friction-driven. Cross-domain identical mechanics — discipline-domain (mVox) and substrate-domain (Cloudflare) both follow the same rule.

This is the operational dual of [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md): C1 names *which axis* the cluster decomposes along (the coupling-dimension); this entry says *which position* on that axis a team should adopt (the one matching its bottleneck). Sequential, not parallel — coupling-dimension first; bottleneck-alignment second.

## The Two-Condition Rule

A team adopts cluster-component X **if and only if**:

1. **Bottleneck-match:** team's dominant bottleneck aligns with X's strength along the cluster's coupling-dimension.
2. **Workload-fit:** team's workload fits X's substrate constraints (or, for discipline-domain, X's procedural-cost envelope).

**Both required; neither sufficient.** Bottleneck-match without workload-fit is a wishful adoption that breaks at execution. Workload-fit without bottleneck-match is a vendor-driven (or novelty-driven) adoption that doesn't move what's actually constraining the team. The rule's structural force comes from the AND-conjunction: each condition gates the other.

## n=3 Origin Instances Across Two Domains

The rule is supported by three instances spanning two distinct domains — same mechanics observed in both.

### Instance 1 — mVox M1 adoption (discipline-domain, S35 thread-3, YES-match)

**Cluster:** mVox M1–M5 (cross-team observation disciplines).
**Coupling-dimension:** team-property (per [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md) Origin 1).
**FR's dominant bottleneck:** team-lead-cognitive-bottleneck (M1 reorientation tax at session start, catalyzing observation 2026-04-29).
**Adoption verdict:** **YES — adopt M1 first.** Per S35 thread-3: M1 maps to team-lead-cognitive-bottleneck; FR's dominant bottleneck IS this property; adoption of M1 first is bottleneck-aligned; the *other* mVox practices (M2–M5) are not first-adoption candidates for FR because their coupled team-properties are not FR's dominant bottlenecks.
**Sub-finding (least-distinctive-but-highest-leverage):** M1 is the least-distinctive mVox practice (every team observes their own team-lead in some form); it's also FR's highest-leverage adoption because the bottleneck-match is exact. Same shape recurs in Instance 2.

### Instance 2 — apex-research Cloudflare pilot-candidate (substrate-domain, this dispatch, YES-match conditional)

**Cluster:** Cloudflare Claude Managed Agents 7-mechanism cluster.
**Coupling-dimension:** team-property (per [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md) Origin 2).
**apex-research's dominant bottleneck:** credential-cluster volatility (S34 apex-keys catalyzing arc — 3 SSH keys + tunnel-token + GITHUB/ATLASSIAN/ANTHROPIC tokens + chown-on-cold-start ceremony, all co-dependent at recreate; highest-procedural-cost substrate in FR inventory).
**Bottleneck-match assessment:** YES — apex-research's bottleneck IS substrate-shaped (credential-cluster-shaped + lifecycle-ceremony-shaped); Cloudflare's proxy-secrets injection addresses the highest-procedural-cost case (collapses L2↔L3 drift surface for proxy-bound subset; S34 multi-system-failure surface cannot recur — see [`three-layer-substrate-truth-discipline.md`](three-layer-substrate-truth-discipline.md) §S5 cross-substrate-class confirmation).
**Workload-fit assessment:** Oracle clients + multi-process Python+Node → microVM-only fit; V8 ruled out. Cloudflare microVM available; workload-fit clean.
**Adoption verdict:** **PILOT-CANDIDATE — conditional on credibility-floor Q1+Q2 resolution.** Both conditions satisfied; the conditional is on independently-bounded credibility-floor open questions (cross-session identity continuity; distinct-session-termination state survival), not on the bottleneck-alignment principle itself. The pilot IS the experiment to resolve credibility-floor; adoption decision follows experiment outcome.
**Sub-finding (least-distinctive-but-highest-leverage recurrence):** Cloudflare's observability-by-default mechanism is the least-distinctive across the 7-component cluster (every team observes their own runtime in some form) and the highest-leverage first adoption — same shape as M1 in Instance 1, different domain. *The rule that selects the first adoption is itself domain-invariant.*

**Why the recurrence — mechanism naming (Volta-sharpened 2026-05-26):** the pattern is not least-distinctiveness *per se* driving adoption; it is that **least-distinctive components map to common-across-teams team-properties where bottlenecks accumulate**. Every team observes its own team-lead (M1's case); every team observes its own runtime (observability-by-default's case). Bottlenecks cluster around common-across-teams team-properties because common-across-teams properties are exactly the properties ALL teams interact with — and therefore where ANY team can have a bottleneck. The "least-distinctive" component of a cluster maps to a common-across-teams property; the "highest-leverage" property comes from the bottleneck-distribution following commonality-of-team-property. **Operational consequence:** when observing a new cluster, predict the least-distinctive adoption candidate by identifying which component maps to the most-common-across-teams team-property — that's where the bottleneck-leverage will concentrate.

### Instance 3 — framework-research Cloudflare CAN'T-MOVE-THE-NEEDLE (substrate-domain, this dispatch, NO-match)

**Cluster:** same as Instance 2 (Cloudflare 7-mechanism).
**framework-research's dominant bottleneck:** team-lead reorientation tax at session start (M1-shaped cognitive bottleneck at session boundary; cross-session deliberation-state heavy).
**Bottleneck-match assessment:** **NO — bottleneck-misalignment case.** M1 is NOT displaced by Cloudflare's substrate-state persistence (operates at different layer per Volta §V4). FR's bottleneck is *cognitive at session boundary*; Cloudflare addresses *substrate-state at session boundary*. The two boundaries are coincident in time but live at different layers — no bottleneck-match.
**Workload-fit assessment:** multi-agent process model + tmux-pane backend → microVM-only fit (V8 ruled out). Workload-fit would be clean if bottleneck-match were present; but condition 1 fails.
**Adoption verdict:** **CAN'T-MOVE-THE-NEEDLE.** Self-managed (Docker-on-RC) wins decisively because the substrate isn't the bottleneck. Meta-instance: framework-research adopting NOT-Cloudflare is itself bottleneck-driven adoption — the rule selects the self-managed substrate when bottleneck-match is absent. **The NO case is structurally informative — it demonstrates the two-condition rule operating in negative**, distinct from a workload-fit failure (which would be a different NO shape).

### Why these three instances support the cross-domain claim

- **Two distinct domains** — discipline-domain (mVox) and substrate-domain (Cloudflare). Same mechanics in both.
- **Both YES-match and NO-match observed** — the rule selects-for AND selects-against; mechanism operates in both directions.
- **Cross-team consistency** — three different teams (FR, apex-research, framework-research-itself); rule produces different verdicts because teams' bottlenecks differ, not because the rule varies.
- **Least-distinctive-but-highest-leverage sub-finding recurs** — Instance 1's M1 selection and Instance 2's observability-by-default selection have the same internal structure. The sub-finding has its own n=2 (within the broader n=3).

## Operational Use

When evaluating whether a team should adopt component X from cluster C:

1. **Decompose C along its coupling-dimension** (per [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md)). If C doesn't decompose, the bottleneck-alignment question is malformed — components aren't separable along an axis the team's bottleneck can match. **Parallel application is a category error**: picking a position before the axis is named selects from incommensurable components; the position-selection vocabulary doesn't apply until the axis is settled. Sequential is structural, not stylistic.
2. **Identify the team's dominant bottleneck** along that axis. This is the load-bearing diagnostic step; if the bottleneck-class is unclear, surface back to the team for catalyzing-observation evidence before proceeding (S35 M1 + S34 apex-keys are canonical examples of catalyzing observations naming bottlenecks).
3. **Apply the two-condition test:** bottleneck-match (X's strength aligns with team's dominant bottleneck) AND workload-fit (X's substrate constraints accommodate the team's workload). Both required.
4. **If both satisfied → adopt X.** If bottleneck-match fails → adoption can't-move-the-needle even if workload-fit is clean; do not adopt. If workload-fit fails → adoption breaks at execution even if bottleneck-match is present; do not adopt (different remediation: change workload or wait for different X).

The operational discipline is that **vendor-driven, novelty-driven, and least-friction-driven adoption** are all structurally distinct from bottleneck-driven adoption. A team can rationalize any of the former; only the latter actually moves the team's dominant constraint.

## Composition with Related Disciplines

- [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md) — **operational dual.** C1 names the axis (coupling-dimension); this entry says which position to adopt on that axis (bottleneck-alignment). C1 decomposes; C4 picks the position. Sequential, not parallel — coupling-dimension first; bottleneck-alignment second. C1 + C4 compose into a methodology pair: *first identify the coupling-dimension; then identify the team's dominant bottleneck along that dimension; then pick the cluster-component that aligns.* Both entries are joint Brunel + Volta from the 2026-05-25 substrate-gap dispatch.
- [`three-layer-substrate-truth-discipline.md`](three-layer-substrate-truth-discipline.md) — **substrate-domain prerequisite for Instance 2 + 3.** Cloudflare-adoption assessment depends on three-layer probe-suite to surface bottleneck-class evidence (L1 design / L2 operational / L3 runtime). Without three-layer reading, the bottleneck-class identification step (operational use step 2) is unreliable — single-layer reads conflate design lineage with operational truth.
- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) — defect-class adjacent. Substrate-invariant-mismatch describes failure modes when bottleneck-misaligned adoption proceeds anyway (substrate property the team assumed but the runtime doesn't honor). C4's two-condition rule names the prevention discipline; substrate-invariant-mismatch names the failure surface when the rule is violated.

## What This Is NOT

- **Not a claim that all adoption decisions are bottleneck-driven.** Some adoptions are constraint-driven (must adopt X because of regulatory / contractual / dependency requirement) — those operate at a different layer. C4 says: *when adoption is a discretionary choice*, the structural rule is bottleneck-alignment. Constraint-driven adoptions are out of scope.
- **Not a claim that bottleneck-identification is mechanical.** Bottleneck-class identification is itself a research move requiring catalyzing observation evidence. The S35 M1 catalyzing observation (2026-04-29 reorientation tax) and the S34 apex-keys catalyzing arc (multi-system-failure surface) are canonical examples — bottleneck-class becomes legible against a specific incident, not from abstract first-principles. **Without a catalyzing observation, bottleneck-class claims are speculative.**
- **Not an n=3 promotion-to-confidence-high finding.** Confidence remains medium-high pending n=4 across a third domain (workflow-domain, lifecycle-domain, or other). n=3 within two domains is strong evidence for cross-domain mechanics; n=4 across three domains promotes to confidence-high. See Promotion posture below.
- **Not a substitute for the workload-fit gate.** Bottleneck-match without workload-fit produces wishful adoption that breaks at execution. The two-condition rule's AND-conjunction is load-bearing; either condition alone is insufficient.

## Promotion Posture

**Confidence: medium-high (n=3 origins across two distinct domains; both YES-match and NO-match observed; least-distinctive-but-highest-leverage sub-finding has its own n=2).** The cross-domain reach justifies medium-high at n=3 rather than medium: the rule is not tied to discipline-domain or substrate-domain specifically — same mechanics in both. Sub-finding's n=2 strengthens but does not independently promote.

### Future watchpoints

- **n=4 in a third distinct domain** (workflow-domain / lifecycle-domain / credential-domain / etc.) — promotion candidate to confidence high. The third-domain instance must be a genuinely different domain from discipline (mVox) and substrate (Cloudflare); a fourth instance within the same two domains is incremental, not structurally strengthening.
- **Pilot evidence on apex-research Cloudflare adoption (Q4)** — research-grade follow-up that empirically tests Instance 2's bottleneck-match assessment. If pilot lands and confirms bottleneck-match (substrate automation moves apex-research's actual bottleneck) → bottleneck-driven substrate selection corroborated; cross-domain confirmation strengthens. If pilot lands and shows no bottleneck-relief → bottleneck wasn't substrate-shaped after all; Instance 2 framing requires amendment (not falsification of C4 itself, but of the bottleneck-class identification step for apex-research). **Pilot IS the falsifiability test for Instance 2.**
- **Counter-evidence — a team that adopted X bottleneck-aligned and X didn't move the needle.** Falsifiability test for the two-condition rule: if bottleneck-match + workload-fit are both satisfied and adoption still doesn't move the team's dominant constraint, the rule's bottleneck-class identification step is mis-specified (the team's "dominant bottleneck" wasn't actually dominant) or the rule itself is too weak. Absence of counter-evidence at n→large would itself strengthen confidence.
- **NO-match sub-pattern at n=2** — a second NO-match case where bottleneck-misalignment correctly predicts CAN'T-MOVE-THE-NEEDLE. mvox-dev under Cloudflare is the candidate (M3-shaped bottleneck; substrate-change wouldn't move the needle per §S3 matrix); pre-pilot it's prediction-only; pilot or independent observation promotes to confirmed NO-match instance.
- **STANDING-WATCH on workload-fit-failure sub-shape** — Instances 2 + 3 both have workload-fit satisfied (or would be, conditional on Q1+Q2 for Instance 2); the NO case in Instance 3 fails on bottleneck-match. **A distinct NO case where workload-fit fails despite bottleneck-match present** would expose the second condition's independent operating mechanism. Not yet observed; watch posture for future-mapping work on hr-devs / raamatukoi-dev / comms-dev / polyphony-dev / esl-legal / uikit-dev per §S3 matrix scoping note.

## Provenance — Joint Authorship

The cross-domain bottleneck-alignment principle landed in [`docs/findings.md`](../../../../docs/findings.md) §S2 + §S3 from the 2026-05-25 joint Brunel + Volta substrate-gap dispatch:

- **Brunel** (containerization angle) — substrate-domain instances (Instance 2 apex-research pilot-candidate + Instance 3 framework-research CAN'T-MOVE-THE-NEEDLE); §S3 bottleneck-to-substrate-choice matrix authorship; two-condition rule articulation alongside Volta's discipline-domain framing.
- **Volta** (lifecycle angle) — discipline-domain Instance 1 (S35 thread-3 M1 adoption); §S2 synthesis spine ("bottleneck-determines-adoption is n=3 across two domains with two-condition rule"); cross-domain framing as the unifying claim.
- **Aen's framing** — flagged the cross-domain n=3 as one of the spine findings at 2026-05-25 13:25 ratification; C4 catalogued as Cal-Protocol-A submission candidate per 2026-05-26 09:50 dispatch.
- **Callimachus** — Stage 1 honest-fold from [`docs/findings.md`](../../../../docs/findings.md) §S7 C4 entry + §S2 synthesis + §S3 matrix; this wiki entry is the canonical articulation, the dispatch artifact is the source-of-truth.

Joint report ratified by Aen 2026-05-25 13:25; polish-pass amendments (folds 1–7) ratified by Aen 2026-05-25 13:35 + 13:50.

## Related

- [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md) — operational dual; C1 names the axis, C4 picks the position.
- [`three-layer-substrate-truth-discipline.md`](three-layer-substrate-truth-discipline.md) — substrate-domain prerequisite for bottleneck-class evidence.
- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) — failure-class adjacent (what happens when adoption proceeds bottleneck-misaligned).
- [`docs/findings.md`](../../../../docs/findings.md) §S2 + §S3 + §S7 C4 — canonical articulation of the rule + matrix + submission candidate framing.
- [`teams/framework-research/memory/brunel.md`](../../memory/brunel.md) — Brunel's S35 substrate-gap analysis source notes (substrate-domain instances).
- [`teams/framework-research/memory/volta.md`](../../memory/volta.md) — Volta's S35 lifecycle-angle source notes (discipline-domain Instance 1 + synthesis spine).

(*FR:Cal — filer; Brunel + Volta source*)
