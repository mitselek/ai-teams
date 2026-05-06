---
source-agents:
  - herald
  - monte
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: medium
source-files:
  - .mmp/prism/designs/herald/01-federation-envelope-contract.md
  - .mmp/prism/designs/monte/monte-governance-design-2026-05-05.md
  - .mmp/prism/designs/brunel
source-commits: []
source-issues:
  - "65"
related: []
---

# Substrate-Shape vs Authority-Shape Orthogonality

In federation and multi-tenant designs, **substrate-shape** (where the data physically lives, who owns the storage, how it scales) and **authority-shape** (who can write what, who reviews, where decisions are made) are **orthogonal axes**. A topology that conflates them imports the wrong failure mode: a substrate decision (e.g., hub-and-spoke storage) gets read as an authority decision (e.g., one tenant's curator runs all tenants' content), or vice versa.

The pattern has two halves that compose:

- **Diagnostic half (Monte):** *substrate-shape and authority-shape are orthogonal axes; conflating them imports the wrong failure mode.* The recognition that the two are separate things is the load-bearing precondition.
- **Normative half (Herald):** *asymmetries should live above the substrate, not in the substrate.* When the design has asymmetries, they live in the authority/composition layer above the substrate, not in the substrate itself. Substrate stays symmetric; asymmetry lives where it is observed (authority, ratification, deliverable composition).

Both framings are required to derive the principle. You cannot follow Herald's placement rule until you have made Monte's distinction; you cannot make Monte's distinction without a placement rule to ground it.

## Why the two framings compose

Monte's diagnostic answers *"are these the same thing?"* (no — they're orthogonal). Herald's normative answers *"given they're separate, where should the asymmetry live?"* (above the substrate, not inside it). Without the diagnostic, the normative is unmotivated — a designer who has not internalized that substrate and authority are orthogonal will read "asymmetries above the substrate" as a substrate-shape rule and apply it to substrate decisions. Without the normative, the diagnostic is descriptive — knowing the axes are orthogonal does not by itself tell you which axis carries the asymmetry.

Together: the diagnostic surfaces the orthogonality; the placement rule resolves the design choice. The pattern names the joint principle, not either half in isolation.

## The failure mode the pattern names

The natural failure mode is **axis-conflation by reading-substrate-as-authority**. A designer evaluating a federation topology sees Brunel's hub-and-spoke substrate (FR-as-hub for methodology, raamatukoi/screenwerk/esl-suvekool as spokes) and reads it as an authority claim ("FR-as-hub means FR's curator has authority over all teams' content"). The conflation imports the bottleneck failure of cluster-wide-single-curator authority into a substrate decision that did not commit to it. The substrate is fine — Brunel's topology accommodates either authority shape; the failure was in the read, not the substrate.

Symmetric failure mode: **reading-authority-as-substrate**. A designer commits to peer-class curator authority (federation-curators-as-class) and assumes that requires symmetric substrate (per-team identical storage shards). It does not — peer authority composes with hub-and-spoke substrate just as cleanly as with peer substrate; the substrate is determined by storage and access patterns, not by authority.

Either conflation produces a worse design: substrate decisions made on authority grounds, or authority decisions made on substrate grounds.

## How to apply the pattern

When evaluating a federation, multi-tenant, or multi-team design:

1. **Surface the two axes explicitly.** What is the substrate-shape (storage topology, scaling axis, ownership of physical state)? What is the authority-shape (who writes, who reviews, where decisions land)? Name them as separate questions in the design.
2. **Test orthogonality.** For each axis-pair (substrate-A × authority-B, substrate-A × authority-C, etc.), ask whether the combination is coherent. If three or more combinations work, the axes are genuinely orthogonal and you have an asymmetric-design space. If only one combination works, the axes are coupled and you have a constraint to surface.
3. **Locate the asymmetry.** If the design has asymmetries, identify which axis carries them. Default placement: authority/composition above the substrate. Substrate-side asymmetry should be justified by an actual substrate constraint (storage cost, access latency, write volume), not imported from authority concerns.
4. **Defend the placement.** Document why the asymmetry lives where it lives. The defense protects future maintainers from re-conflating the axes when the substrate or authority decisions evolve independently.

## When this is in tension

- **Substrate constraints that genuinely cap authority shapes.** A substrate that physically cannot serve cross-team queries at scale forces some authority shapes off the table. The pattern still applies — the axes are still orthogonal — but the substrate constraint becomes a precondition the authority shape must satisfy. Surface this explicitly; do not let the substrate constraint silently dictate the authority shape without acknowledgment.
- **Operational coupling that masquerades as structural coupling.** Two axes can be coupled in the *implementation* (one team owns both substrate and authority) without being coupled in the *design*. The orthogonality pattern is a design-time discipline, not an operations-time observation. Single-team operation that happens to span both axes does not collapse the orthogonality; it just means one team is responsible for both at the moment.
- **Aspirational orthogonality.** Claiming orthogonality without testing the axis-pairs is the failure mode this pattern is designed to prevent. The discipline is the test in step 2 above; without it, "we kept them orthogonal" is a vibe, not a structural claim.

## What this is NOT

- **Not "always-symmetric substrate."** Substrate can be asymmetric when the asymmetry is justified by substrate-level constraints (storage cost, access latency, write volume). The pattern says asymmetry lives **above the substrate by default**; substrate-side asymmetry is the exception requiring substrate-level justification.
- **Not a substitute for the substrate or authority designs.** The pattern resolves the question of where asymmetry lives across the two axes; it does not tell you which substrate-shape or authority-shape to pick. Those are separate decisions made on substrate and authority criteria respectively.
- **Not specific to federation.** The pattern surfaced in a federation context (Prism Phase A) but generalizes to any design with separable physical and decision layers — multi-tenant SaaS, micro-service authority routing, organizational structures.

## First instance — Prism Phase A composition

Observed 2026-05-05 across Prism Phase A (`mitselek/prism`).

**The diagnostic moment** (Monte, Surface 1 §1.4 M2 rejection). Monte evaluated three candidate models for the federation curator role: M1 (per-team curator + cross-team peer review), M2 (cluster-wide single curator), M3 (federation-curators-as-class). M2's rejection surfaced the diagnostic: M2 was reading Brunel's hub-and-spoke substrate ("FR contributes more methodology entries") as an authority claim ("FR's curator runs all teams' content"). The rejection named the conflation — *"M2 reads Brunel's hub-and-spoke as authority-shape ('FR's curator runs all teams' content') when it's actually substrate-shape ('FR contributes more methodology entries'). The conflation imports M2's bottleneck failure even though Brunel's substrate is fine."* M3 was selected because it kept the axes orthogonal: substrate stays hub-and-spoke (Brunel's design is fine as-is), authority is peer-class (federation-curators-as-class).

**The normative moment** (Herald, deliverable C composition). Herald's two-pattern asymmetry decision matrix (5-axis: 3 converge / 2 diverge — "open + sovereign + cheap + auditable" composition) ratified the placement rule: asymmetries live in the authority/composition layer (where the 5-axis matrix discriminates), not in the substrate (which the matrix presupposes as fixed). Aen named this wiki-promotable in 17:25 composite review: *"asymmetries should live above the substrate, not in the substrate."* Joint with Monte's M3 + Surface 3 DACI work; deferred to Monte's queued #11 claim per their 16:43 dedup discipline.

**The composition.** Monte's diagnostic (axes are orthogonal — M2's read was wrong) and Herald's normative (asymmetries belong above the substrate — deliverable C's matrix shows where) describe the same observed property from two angles: substrate stays symmetric (peer-class or hub-and-spoke, the choice is independent of authority); asymmetry lives in authority and composition. The Phase A design held this principle across Surfaces 1+3 + deliverable C without requiring rework — it is the reason M3 + DACI compose cleanly with Brunel's hub-and-spoke topology.

## Promotion posture

**n=1 watch posture, joint composition.** The pattern surfaced in Phase A as a structural property the design held but did not name explicitly until Aen's 17:25 ratification. Watch for n=2 in Phase B work — likely candidates: Brunel's federation bootstrap protocol (substrate-side framing of new-team-joining), Monte's authority-drift detection at scale (authority-side framing of governance-evolution), and any future multi-tenant or federation design. **Promote on second instance** to consider Protocol C promotion to common-prompt as a structural-discipline gate scoped to "before committing a federation/multi-tenant design, surface substrate-shape and authority-shape as separate questions and test orthogonality."

The pattern is filed at n=1 because Aen named it wiki-promotable explicitly; without that name, the property would have lived only as scratchpad observation. Naming it makes the discipline citable in Phase B design reviews, which is itself a structural test of whether the pattern holds beyond Phase A.

## Related

- [`lossless-independent-convergence.md`](lossless-independent-convergence.md) — adjacent: lossless-convergence Instance 2 (asymmetry axis) cites this entry's joint property as the integration evidence — Herald's deliverable C composition and Monte's Surface 1 + Surface 3 converged independently on the framing this entry names. The two patterns answer different questions: lossless-convergence asks "did the surfaces converge?"; this entry asks "what is the property they converged on?" Neither replaces the other.
- [`integration-not-relay.md`](integration-not-relay.md) — adjacent: integration-not-relay says specialist positions are time-indexed state and the team-lead's job is integration. This entry adds a structural diagnostic the team-lead can apply during integration: "did each specialist commit decisions on the right axis (substrate vs authority)?" The axis-test is one of the four-checks the team-lead runs.
- [`no-future-proofing.md`](no-future-proofing.md) — adjacent: no-future-proofing says don't add abstractions for hypothetical future requirements. The two patterns compose: keep substrate and authority separate (this entry), AND don't pre-allocate either substrate or authority for hypothetical scale (no-future-proofing). Together they resist the failure mode of designing-for-imagined-asymmetry by adding speculative axis-coupling.
- [`dispatch-granularity-matches-recovery-handler.md`](dispatch-granularity-matches-recovery-handler.md) — sibling at the contract layer: dispatch-granularity addresses where a distinction lives in a typed contract (where the handler reads it). This entry addresses where asymmetry lives in a federation design (which axis carries it). Both are structural-placement questions; the patterns differ in scope (contract vs federation) but share the discipline of "place the distinction where it actually applies, not where it was first observed."

(*FR:Cal*)
