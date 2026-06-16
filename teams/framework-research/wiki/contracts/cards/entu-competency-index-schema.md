---
title: "Entu Competency-Index Schema -- the claim→evidence spine"
directory: contracts
status: active
confidence: medium-high
source-agents: [callimachus, finn]
discovered: 2026-06-06
last-verified: 2026-06-06
stage-2: confirmed
related: [../../process/stage-2-confirms-filing-gate.md]
tags: [contract, entu, competency-index, claim-evidence, provenance, wikiprovenance-parallel, gap-loop, schema, entu-api-42, stance, maintainer-authoritative, method-ladder]
---

## TLDR

Schema for the competency index backing Entu's product-native consultant agents (entu/api#42). The PO chose the index as the **spine** (approach B): prompts *consume* an auditable claim→evidence KB instead of embedding knowledge. Atomic unit is a **claim** (verifiable assertion) + `evidence[]` of `{type: docs|openapi|src|probe, ref, stance, excerpt?}` + `verification` (5-rung method ladder) + derived `confidence`. Defines on-disk layout (one-claim-per-file, sharded by domain), the `search_claims`/`get_claim` query surface, and how `confidence` is derived from evidence stance + drives the runtime label + gap-loop.

## Key ideas

- **Atomic unit = claim, not topic.** "Formula references are single-hop" (refutable against a ref), never "I know about formulas." Zero-evidence claims are gaps, not entries.
- **Re-points WikiProvenance, doesn't reinvent.** `evidence.ref`↔`sourceFiles`, `verification`↔`discovered/lastVerified/sourceAgents`, `ttl`/`status` direct reuse. The architectural-fact-vs-observation split maps onto doc/spec-cited (fact-like, staleness-on-change) vs probe-derived (observation, TTL-guarded).
- **`probe` evidence is first-class + always TTL'd.** #42's strongest move was Pérotin's live probes correcting a wrong `_sharing` mental model. Highest-trust, most perishable → probe-only caps at `confidence: partial` unless a doc/spec ref corroborates.
- **One-claim-per-file** → diffable, atomically revisable (the *index's own* change review is claim-by-claim -- NOT a statement about which channel to use reporting gaps to Entu), auditable-before-hiring (`grep confidence: unverified` shows where the agent is honest).
- **`confidence` is DERIVED, not asserted** (§3a stance rule): `backed` / `partial` / `unverified`→`[GAP]`. The label is a function of evidence **and how it agrees**, not agent self-assessment -- that IS "trust is auditable." An integrator sees *why* a claim is disputed (a visible `contradicts` entry), not just *that* it is.
- **Gap loop output = a new file/evidence entry in the schema's own format.** Self-densifying index; instantiates topic-10 design-component-4. Schema sits in the **citation-backed** row of the three-way taxonomy -- the only kind needing the runtime loop.
- **5-rung verification-method ladder (§2a, PO-ratified S44):** doc-cited → spec-derived → live-probe → **live-audit** (probe over real prod data; prevalence claims) → **maintainer-authoritative** (APEX -- Argo's direct answer outranks all). `live-audit` formalizes a tier the corpus already had (`org-rights-cascade-audit`).
- **Gap-loop = signal producer, NOT remediation engine (§6, PO S44).** Two DISTINCT mechanisms, not a 3-rung PR-preference: **(a) gap reporting** (missing/wrong doc) → structured evidence-backed report, **issue-default**, PR a channel-neutral option when natural + actor has rights -- **no PR-over-issue bias** (Entu owns its triage; we don't engineer around it). **(b) dispute resolution** (contradicting evidence, no code settles it, e.g. JWT 12h/48h) → escalate to Argo for an authoritative answer → recorded as `maintainer-authoritative` apex evidence (§2b), claim apex-backed for the whole pool. The loop guarantees the *signal*, not the *remediation* -- whether a doc gap gets fixed is Entu's pipeline.
- **`stance` field on each evidence entry (§3a):** `confirms | contradicts | supersedes`. One claim can carry *disagreeing* evidence (JWT case); claim-level confidence is **derived** from the mix. Rule: apex confirm→`backed`; `supersedes` drops stale evidence; equal-rank confirm+contradict→`disputed`+`[GAP]`; **code-beats-docs exception** (src confirm vs docs contradict = claim holds, docs is the gap-target). Re-points WikiProvenance's whole-entry dispute model to per-evidence granularity.

- **§3 ref-formats GROUNDED (S44, Finn's digest).** Real shapes: `src`→`entu/api: utils/*.js (symbol)` (Nitro file-router, NOT `src/api/*`); `docs`→`entu/www: src/api/*#anchor` or `PR #N`; `openapi`→`https://api.entu.app/openapi` tag+op; `probe`→`mvox-dev: docs/migration/findings/<note>` (probe-script + result-JSON + ratified-commit + STEP\|OP\|RESULT table maps 1:1). Three real doc↔code discrepancies (JWT 12h/48h, date wire-format, S3-cleanup) are the gap-loop's worked examples; `src`>`docs` precedence where they conflict.

**Stage-2-confirms gate** (#70): single-source authored-and-filed-by-Callimachus → `confirmed` per three-bucket rule; Finn's S44 grounding reconciled §3 (cross-credited in `source-agents`). Handed to Celes for the architecture-doc spine section (a fold-in by a consumer, not a co-author read-back).
