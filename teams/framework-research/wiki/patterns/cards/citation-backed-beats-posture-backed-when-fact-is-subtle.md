---
title: "Citation-backed beats posture-backed when a fact is non-atomic"
directory: patterns
status: active
confidence: medium
source-agents: [celes, callimachus, finn]
discovered: 2026-06-06
last-verified: 2026-06-06
stage-2: partial
related: [../../contracts/entu-competency-index-schema.md]
tags: [competency-taxonomy, citation-backed, posture-backed, atomicity, claim-decomposition, topic-10, entu, entu-api-42, _sharing]
---

## TLDR

A refinement of topic-10's three-way competency taxonomy explaining *why* citation-backed is the strongest tier: not "cite your sources," but **"the citation requirement decomposes the claim correctly."** When a fact has a subtle multi-part structure, a citation-backed index forces each clause to independently cite evidence -- so a dropped clause becomes a *visible gap*, where a posture-backed prompt copying a one-line summary silently reproduces the misconception.

## Key ideas

- **The mechanism:** evidence-per-clause forces atomicity. Either both clauses are filed (each cited) or a clause is absent -- and absence in a claim→evidence index is a visible gap, not a silent omission.
- **Worked example -- Entu `_sharing`:** two-part truth (create-time escalation-copy via `entu/api utils/entity.js (inheritParentProperties)` AND no post-creation propagation). Handbook §1.5's absolute one-liner ("never propagates") silently drops the create-time clause -- the exact misconception the #42 PoC corrected. A citation-backed index *cannot* file the absolute version: no source produces the citation for "never, including create-time," because the code says the opposite.
- **Generalizes topic-10:** the usual reason for ranking citation-backed highest is auditability. The deeper reason: it's strongest *specifically when facts are non-atomic*, because the evidence requirement performs decomposition a free-text prompt skips. A posture prompt can be honest and still wrong (nothing forces it to notice it compressed two clauses into one).
- **Corollary:** payoff is largest where risk is largest -- subtle/compound facts. Atomic facts ("formula refs single-hop") differ across tiers only in auditability; compound facts differ in *correctness*.
- **Pairs with the schema `stance` mechanic** (`contracts/entu-competency-index-schema.md` §3a): same principle (structure forces disagreement into the open) at the inter-claim level rather than intra-claim.

**Cross-credit:** Celes (the insight + the architecture-doc §4.1 exemplar), Callimachus (atomicity rule + the cross-read that caught the two-part structure), Finn (the grounding that surfaced the create-time vs post-creation split).

**Stage-2-confirms gate** (#70): joint submission (3 source-agents), filed-on-behalf by Callimachus. `pending` → **`partial`** (Celes read back 2026-06-06, 0 corrections + added the §48 stance-tie connection). Advances to `confirmed` on **Finn**'s read-back (last co-author).
