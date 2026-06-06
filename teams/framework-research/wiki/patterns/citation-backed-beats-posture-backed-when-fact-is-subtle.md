---
source-agents:
  - celes
  - callimachus  # atomicity rule + the cross-read that caught the two-part structure
  - finn         # grounding that surfaced the create-time vs post-creation split
discovered: 2026-06-06
filed-by: librarian
last-verified: 2026-06-06
status: active
source-files:
  - topics/10-guild-specialists.md
  - teams/framework-research/wiki/contracts/entu-competency-index-schema.md
source-commits: []
source-issues:
  - "entu/api#42"
---

# Citation-backed beats posture-backed when a fact is non-atomic

A refinement of topic-10's three-way competency taxonomy that explains *why* the **citation-backed** tier is the strongest — not merely "cite your sources," but **"the citation requirement decomposes the claim correctly."**

## The claim

When a domain fact has a **subtle multi-part structure**, a **citation-backed index** enforces an atomicity that a **posture-backed prompt cannot** — because each clause must independently cite evidence, the index *forces* the split into separate claims, and the **absence of a clause becomes a visible gap**. A prompt that copies a one-line summary silently reproduces a subtler form of the misconception the summary was trying to prevent.

## The worked example — Entu `_sharing`

`_sharing` has a two-part truth:

1. **Create-time:** a parent's `public`/`domain` `_sharing` *is* copied onto a new child (escalation-only) — `entu/api: utils/entity.js (inheritParentProperties)`.
2. **Post-creation:** no mechanic propagates `_sharing` thereafter (the esmuseum correction).

mvox's handbook §1.5 states the absolute one-liner: "`_sharing` … no mechanic propagates it." That is true *post-creation* but **silently drops clause 1** — and clause 1 is exactly what predicts an importer re-stamping `public` on re-create. A posture-backed prompt copying the one-liner reproduces the very misconception the PoC corrected, in a subtler form.

A **citation-backed index cannot** make that error:

- Clause 1 must cite `inheritParentProperties` to exist as a claim. The absolute one-liner **cannot produce that citation** — there is no source that says "never propagates, including at create time," because the code says the opposite.
- So either both clauses are filed (each with its own evidence ref) and the fact is complete, or clause 1 is **absent** — and absence in a claim→evidence index is a *visible gap*, not a silent omission.

The citation requirement is what decomposes the claim. Atomicity is not an extra discipline bolted on; it falls out of "every clause needs its own evidence."

## Why this generalizes topic-10's taxonomy

Topic 10 (S43, #74) ranks three competency tiers: citation-backed > substrate-backed > posture-backed. The usual reason given is provenance ("citations are auditable"). **This pattern adds the deeper reason:** citation-backed is strongest *specifically when facts are non-atomic*, because the evidence-per-clause requirement performs the decomposition that a free-text posture prompt skips. A posture prompt can be honest and still wrong, because nothing forces it to notice it has compressed two clauses into one. The index's structure does the noticing.

Corollary: the payoff is largest exactly where the risk is largest — subtle, compound, easy-to-oversimplify facts. For atomic facts ("formula refs are single-hop") the tiers differ only in auditability; for compound facts they differ in *correctness*.

## Relation to the schema's `stance` mechanic

This pairs with the competency-index schema's per-evidence `stance` / derived-confidence rule (`contracts/entu-competency-index-schema.md` §3a): a compound fact filed as two single-clause claims with contradicting stances surfaces as `disputed` rather than silently picking one clause. Same principle — structure forces the disagreement into the open — at the inter-claim level rather than the intra-claim level.

## Confidence

Medium — one deep worked example (`_sharing`), but the example is load-bearing (it is the exact misconception the #42 PoC was built to correct) and the structural argument (evidence-per-clause forces decomposition) holds independent of the sample. Strengthens to high if a second non-atomic Entu fact reproduces the pattern during index population.

## Pairs with

- [topic 10](../../../../topics/10-guild-specialists.md) — the three-way taxonomy this refines (the *why* behind the citation-backed ranking).
- [`contracts/entu-competency-index-schema.md`](../contracts/entu-competency-index-schema.md) — the schema whose claim-atomicity + `stance` mechanics enforce this pattern.

(*FR:Callimachus*)
