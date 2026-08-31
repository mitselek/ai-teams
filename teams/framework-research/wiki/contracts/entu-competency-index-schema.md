---
source-agents:
  - callimachus
  - finn  # S44 grounding digest reconciled §2 evidence-ref formats against real Entu artifacts
discovered: 2026-06-06
filed-by: librarian
last-verified: 2026-08-31
status: active
source-files:
  - topics/10-guild-specialists.md
  - teams/framework-research/types/t09-protocols.ts (WikiProvenance interface)
  - teams/framework-research/docs/2026-06-06-entu-consultant-grounding-digest.md
  - teams/framework-research/docs/2026-06-06-data-lifecycle-competency-harvest.md  # the ACTUAL source of the 32 §2 ref exemplars; omitted at filing -- see Amendments 2026-08-31
source-commits: []
source-issues:
  - "entu/api#42"
  - "entu/api#41"   # date wire-format discrepancy -- gap-loop worked example
  - "entu/www#12"   # _sharing non-inheritance -- gap-loop worked example
ttl: 2026-11-30   # extended 2026-08-31: the 09-06 TTL fired and the decay check came back CLEAN (external substrate stable over the full 3 months; the defects it surfaced were born-wrong, not drift). Guards §2 ref-format re-drift only -- see the TTL note below and Amendments.
---

# Entu competency-index schema -- the claim→evidence spine

Schema for the **competency index** that backs Entu's product-native consultant agents (entu/api#42). The PO chose the index as the **spine** (approach B): agent prompts *consume* an auditable claim→evidence knowledge base rather than embedding knowledge in the prompt. The trust differentiator is that **every competency claim maps to a readable source, not training data -- auditable by an integrator before hiring.** This entry specifies (a) the on-disk file layout, (b) the queryable shape, and (c) how `confidence` wires into the runtime confidence label and the gap-detection loop.

This is an **architectural-fact / contract** entry: it defines a schema, not an observed behaviour. Revision trigger is at the bottom.

> **TTL note:** the *schema* is stable; the TTL fires re-verification of the **evidence-ref formats** (§2) against Entu's actual artifacts, because probe-derived claims and external doc anchors go stale. The schema shape does not expire on the TTL -- only the "do the real Entu refs still look like this" check does. **§2 was reconciled against the real corpus in S44 via Finn's grounding digest** (`docs/2026-06-06-entu-consultant-grounding-digest.md`); the TTL now guards *re-drift* of those refs (e.g. entu/api moving off Nitro file-routing), not the original first-draft uncertainty.

## 1. The atomic unit -- a competency `claim`

The atomic unit is **not** "the agent knows about formulas." It is a single **verifiable assertion** with its evidence attached. One claim = one assertion = one auditable row.

```yaml
# one entry in the competency index
id: formula-references-single-hop        # stable kebab slug, filename-derived (no separate id field on disk -- see §2)
claim: >
  Formula field references are single-hop only -- a formula cannot
  reference a field that is itself computed by another formula.
domain: formula                          # data-lifecycle | auth | formula | schema  → maps to one agent
evidence:
  - type: src                            # docs | openapi | src | probe -- code is the authoritative tier
    ref: "entu/api: utils/formula.js (token resolution)"
    stance: confirms                     # confirms | contradicts | supersedes (§3a)
    excerpt: "Token resolution caps at strParts.length === 3 (ref.type.property); no deeper chaining."
  - type: docs
    ref: "entu/www: src/api/formulas#field-references"
    stance: confirms
    excerpt: "Field kinds: same-entity, referenced-entities, _child.*, _referrer.* -- single hop."
verification:
  method: spec-derived                   # doc-cited | spec-derived | live-probe | live-audit | maintainer-authoritative (§2a method ladder)
  date: 2026-06-06
  verifier: finn                         # the agent/persona -- or "argo" for maintainer-authoritative
confidence: backed                       # backed | partial | unverified -- two confirms, no contradicts → backed (§3a rule)
last-verified: 2026-06-06
# no ttl -- backed by code (entu/api utils/formula.js), not a probe; tracked by source-file change
status: active                           # active | disputed | archived
```

### Field semantics

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Stable kebab slug. On disk it is the **filename** (no separate `id:` key -- filename is the key, mirroring the wiki-card convention). The `id:` above is shown for the queryable shape only. |
| `claim` | yes | A **verifiable assertion**, phrased so it can be true or false against a source. Never "I know about X." The grammar test: *could a reader confirm or refute this by reading one of the `evidence` refs?* If not, it is not a claim -- it is a topic. |
| `domain` | yes | One of `data-lifecycle \| auth \| formula \| schema`. Maps the claim to exactly one agent persona (the roster in #42). One claim has one home domain; cross-domain claims are split, not tagged with two domains (see §5 synergy). |
| `evidence` | yes, ≥1 | Array of evidence objects (§2). A claim with zero evidence cannot be filed -- that is the whole point of the spine. Zero-evidence "claims" are gaps (§6), not index entries. |
| `verification` | yes | How the claim was confirmed: `method` + `date` + `verifier`. `method` is one of the **five-rung method ladder** (§2a -- doc-cited / spec-derived / live-probe / live-audit / maintainer-authoritative). Distinct from `confidence` (which is the *output label*); `verification` is the *act*, `confidence` is the *grade*. |
| `confidence` | yes | `backed \| partial \| unverified`. **Derived from the evidence set via the §3a stance rule** (a `contradicts` stance caps it; `maintainer-authoritative` apex evidence sets it to `backed`). Drives the runtime confidence label (§4). Fail-closed default on ambiguity: `unverified`. |
| `last-verified` | yes | ISO date the claim was last checked against its evidence. Drives staleness. |
| `ttl` | conditional | **Required for `probe`-only claims** (live-probe results go stale as the platform evolves). Optional for doc/spec-cited claims that track a versioned artifact. |
| `status` | yes | `active \| disputed \| archived`. A claim disputed by a later probe goes `disputed` until reconciled -- never silently overwritten. |

## 2. Evidence object -- `{type, ref, stance, excerpt?}`

```yaml
- type: docs | openapi | src | probe
  ref: <locator -- see format table below>
  stance: confirms | contradicts | supersedes   # this ref's relation to the claim (§3a). Default: confirms.
  excerpt: <optional verbatim snippet that the claim rests on>
```

`stance` makes the evidence array a **triangulation set**, not a flat list of corroborations: a single claim can legitimately carry evidence that *disagrees* with it (the JWT 12h/48h case), and the claim-level `confidence` is then *derived* from the mix (§3a). `type` says *what kind of source*; `stance` says *which way it points*. Default `stance` is `confirms` (a bare evidence ref with no stance is read as confirming).

The four `type` values and their `ref` locator formats. **Reconciled against real Entu artifacts via Finn's grounding digest** (`teams/framework-research/docs/2026-06-06-entu-consultant-grounding-digest.md`, S44) -- these are now the verified shapes, not drafts:

| `type` | Backs | `ref` locator format (grounded) | Staleness behaviour |
|---|---|---|---|
| `docs` | A documentation section in **entu/www** (VitePress site, bilingual `src/` EN + `src/et/` ET) | `entu/www: src/<path>#<anchor>` -- e.g. `entu/www: src/api/formulas#field-references`; a docs-PR ref is also valid -- e.g. `entu/www: PR #13` | Tracked by source-file change; flag LOW on doc edit since `last-verified`. **Docs may lag or contradict code** -- a `docs` ref is weaker than a `src` ref where they conflict. **PR-form refs have their own rule** (they have no source file to diff): a PR-form ref records the PR's **merge state at citation time**; its staleness trigger is **merge-state change or close-unmerged**, not source-file change. An **unmerged** PR means the cited text is **not yet authoritative** -- a claim resting on one is provisional and must be marked so. |
| `openapi` | The published OpenAPI spec | Live at `https://api.entu.app/openapi` (assembled by `entu/api: routes/openapi.get.js`); pin a tag + operation -- e.g. `openapi: tag=Entity op=POST /{db}/entity/{_id}`. **Excludes** GraphQL + `_*` internal routes. | Tracked by spec version; flag HIGH if the path/tag no longer exists. |
| `src` | Source code in **entu/api** (Nitro/h3 **file-router** -- endpoints under `routes/`, shared logic under `utils/`) | `entu/api: <path> (<symbol>)` -- e.g. `entu/api: utils/entity.js (inheritParentProperties)`, `entu/api: routes/[db]/property/[_id]/index.delete.js`. **NOT `src/api/...`** -- that is an entu/www *docs* path, not code. | Tracked by source-file change; flag HIGH if symbol/path gone. **Code is the authoritative tier** where docs and code disagree. |
| `probe` | A **live probe** against a running Entu, captured in mvox-dev's native finding-note shape | `mvox-dev: docs/migration/findings/<note>-YYYY-MM-DD` -- e.g. `mvox-dev: docs/migration/findings/org-rights-cascade-audit-2026-05-21`. **The date suffix is mandatory** (32/32 files in that directory carry a date) and the prefix is the short form `mvox-dev:` (13/13 S44 refs used it). The note carries its own `**Probe:**` script + `**Result artifact:**` JSON + ratified-commit + a STEP\|OP\|RESULT table (maps 1:1 onto evidence/verification/excerpt). | **Always TTL'd.** A probe is a point-in-time observation; it has no source file to diff, so only the clock guards it. |

**The mvox finding-note shape maps 1:1 onto a competency claim** (confirmed by Finn against the real corpus -- "mirror, don't invent"): the note's `## Question` → the `claim`; `**Probe:**`/`**Result artifact:**`/ratified-commit → the `probe` `evidence.ref`; the `STEP|OP|RESULT` table row → the `excerpt`; `Live-Verified <date>` → `verification.date`; `(*MVOX:<author>*)` → `verification.verifier`. The three evidence-strength tiers Finn found in the corpus (live-probe-verified → live-audit-verified → handbook-asserted) align with the `confidence` grades: probe+result-JSON+truth-table = `backed`-eligible; audit-over-real-data = `backed`/`partial`; handbook-asserted-narrative alone = `partial` until a probe/code ref corroborates.

**Why `probe` is first-class, not a footnote.** The #42 PoC's strongest move was Pérotin running *controlled live probes* to build a truth table for `_sharing` inheritance -- correcting a wrong mental model ("`_sharing` inherits from parent" → it doesn't) that doc-reading alone missed. Probe-derived claims are the highest-trust *and* the most perishable. The schema makes that tension explicit: `type: probe` evidence forces a `ttl`, and a probe-only claim caps at `confidence: partial` unless a doc/spec ref corroborates it (§4).

`excerpt` is optional but strongly encouraged for `docs`/`src` -- it lets an integrator audit the claim **without leaving the index** (read the excerpt, trust-but-verify against the ref). For `probe`, the excerpt is the observed result line.

### 2a. The verification-method ladder (five rungs)

`verification.method` records *how* a claim was confirmed. There are **five rungs, ordered by authority** -- higher rungs outrank lower ones when they bear on the same claim. The two new rungs (`live-audit`, `maintainer-authoritative`) were ratified by the PO (S44) on Finn's grounding evidence; the lower three were already in use.

| Rung | `method` | What it is | Backing evidence `type` | Confidence ceiling |
|---|---|---|---|---|
| 1 | `doc-cited` | Read in the published docs | `docs` | `partial` alone; `backed` if a `src`/`openapi` ref corroborates |
| 2 | `spec-derived` | Derived from the OpenAPI spec **or** read directly from code | `openapi`, `src` | `backed` (code is authoritative -- §2) |
| 3 | `live-probe` | A controlled probe was run against live Entu, captured with a result artifact + truth table | `probe` | `backed`, but **TTL'd** (perishable) |
| 4 | `live-audit` | A probe-script **audit over real production data** (not a throwaway fixture) with a per-row result table | `probe` | `backed`, TTL'd. Stronger than `live-probe` for *prevalence* claims ("how often does X happen in real data"), since it observes the live corpus, not a constructed case. |
| 5 | `maintainer-authoritative` | **The maintainer (Argo) answered directly**, pinning the truth to a `file:line` or an authoritative statement | `src` (the `file:line` Argo designates) -- or `probe` (a captured statement, when he gives no locator). **No new `type`** -- apex authority lives in the *method*, not a type. | **APEX -- top-tier `backed`.** Outranks all other evidence on the same claim. |

`live-audit` formalizes the middle tier Finn already found in the corpus (`org-rights-cascade-audit` is a real instance: a probe-script audit over real org data with a per-row table). It is not a new *evidence type* -- it is still `type: probe` -- but a distinct *method* because it answers a different question (prevalence-in-real-data vs behaviour-of-a-constructed-case) and so earns its own confidence reasoning.

**Method ladder vs type set -- the key separation.** There are **five methods** (this table) but still **four evidence `type`s** (`docs | openapi | src | probe`, §2). Authority is a property of the *method*, not the *type*: `live-audit` and `maintainer-authoritative` are high-authority *methods* that ride on existing types (`probe`, and `src`/`probe` respectively). This is deliberate -- adding a type changes the on-disk shape and the `ref`-format contract; adding a method only changes the confidence reasoning. Keep the two axes separate.

### 2b. `maintainer-authoritative` -- the apex tier and the Argo escalation path

`maintainer-authoritative` is the apex rung: a direct answer from the platform maintainer (Argo). It exists because some claims *cannot* be settled by docs, spec, code-reading, or probing -- the JWT-lifetime contradiction is the canonical case (two in-repo strings disagree; only the maintainer's word, or a definitive `file:line` he points to, resolves it).

**How it earns top-tier confidence:** an evidence entry whose `verification.method` is `maintainer-authoritative` (recorded as `type: src` with the `file:line` Argo designates, or `type: probe` for a captured statement) and `stance: confirms` sets the claim to `confidence: backed` **regardless of other evidence**, and a `maintainer-authoritative` entry with `stance: supersedes` *overrides* any lower-rung evidence it disagrees with (§3a). The maintainer is, by definition, the ground truth for his own platform. The apex authority is carried by the **method**, not by a special evidence type -- so the type set stays at four (§2).

**The escalation-records-back path** (this is the mechanism that serves #42's "Argo gets prioritized signal" goal):

```text
Agent hits a claim it cannot back  →  [GAP]/unverified (or a disputed mixed-stance claim, §3a)
   →  escalates the specific question to Argo (the dispute-resolution mechanism, §6 —
       used when the answer requires the maintainer; distinct from gap reporting, which is a doc-fix signal)
   →  Argo answers (a statement, or "it's utils/auth.js:NN")
   →  the agent records his answer back into the index as a new evidence entry:
         type: src      # with his designated file:line  (or `probe` for a bare statement)
         stance: confirms | supersedes
         verification.method: maintainer-authoritative   # ← the apex authority lives HERE
         verification.verifier: argo
         verification.date: <when he answered>
   →  the claim is now apex-backed; the [GAP] stops firing for every future agent.
```

This closes the dispute at the **highest** authority: a single maintainer answer, recorded once, upgrades the claim to apex-backed for the whole pool -- Argo's scarce attention is spent once per dispute and captured permanently as top-tier backing, rather than re-asked per engagement. **This is one of the gap-loop's two distinct mechanisms (§6): dispute resolution.** It is separate from *gap reporting* (a doc-fix signal, issue-default, §6a) -- escalation is for questions only the maintainer can answer, not for routing documentation fixes. The two must not be conflated into a single "remediation ladder": one obtains evidence authority, the other emits a signal Entu's own pipeline acts on.

`maintainer-authoritative` evidence is **not TTL'd by default** (the maintainer's word doesn't perish on a clock), but it carries `verification.date` so a later substrate change can flag it for re-confirmation.

## 3. The WikiProvenance parallel -- reuse what transfers (key leverage)

This schema is **not invented from scratch.** It is the Librarian's own `WikiProvenance` frontmatter (`types/t09-protocols.ts`), re-pointed from "where this *wiki entry* came from" to "where this *claim* is backed." The shapes are near-identical; the table below maps them so the architecture reuses a battle-tested provenance model instead of a new one.

| Competency-index field | WikiProvenance analogue | What transfers | What differs |
|---|---|---|---|
| `evidence[].ref` (`docs`/`src`) | `sourceFiles[]` | File-path provenance; automated staleness check on file change | Index splits by `type` and attaches a per-ref `excerpt`; WikiProvenance keeps one flat file list |
| `evidence[].ref` (`openapi`) | `sourceFiles[]` (spec file) | Same staleness model | Index pins to a path/operationId *within* the spec, not just the file |
| `evidence[].ref` (`probe`) | (no direct analogue) | -- | **New.** Live-probe evidence has no source file → governed by `ttl` alone, exactly as WikiProvenance governs `ttl`-only external-system entries |
| `verification.{method,date,verifier}` | `discovered` + `lastVerified` + `sourceAgents[]` | Who confirmed it and when | Index records the *method* (doc-cited/spec-derived/live-probe) explicitly; WikiProvenance leaves method implicit |
| `confidence` | `status` (`active`/`disputed`) + the speculative/confirmed distinction | The confirmed-vs-speculative grading instinct | Index has a 3-grade scale (`backed/partial/unverified`) because it drives a *runtime* label, not just a file status |
| `last-verified`, `ttl` | `lastVerified`, `ttl` | **Direct reuse.** TTL-for-external-knowledge + staleness signals carry over verbatim | None -- this is the cleanest transfer |
| `status` (active/disputed/archived) | `status` (active/disputed/archived) | **Direct reuse**, including dispute handling | None |
| `domain` | (no analogue -- wiki uses directory) | -- | Index routes by `domain` field; wiki routes by subdirectory. Same job, different mechanism |

**The two distinctions that transfer hardest** (and matter most for #42):

1. **Architectural-fact vs observation-based.** WikiProvenance treats an *architectural fact* (substrate by design) differently from an *observed behaviour* -- n+1 sightings don't raise confidence on a fact; the revision trigger is a substrate change. **This maps directly onto Entu claims:** a `docs`/`openapi`/`src`-cited claim is architectural-fact-like (it is true because Entu's design/spec says so; it changes when the spec changes). A `probe`-derived claim is observation-based (it is true because we *saw* it; it changes when the platform's behaviour changes under it). This is exactly why probe-claims carry a TTL and doc/spec-claims carry a source-file staleness check -- **the same split, re-pointed.**

2. **TTL-for-external-knowledge.** WikiProvenance's `ttl` exists precisely for "external-system knowledge with no source file." Entu *is* an external system to the agents consuming this index, and probe results *are* that no-source-file knowledge. The TTL re-verification discipline transfers without modification.

### 3a. `stance` and the claim-level derived-confidence rule

Each `evidence[]` entry carries a `stance` -- its relation to the claim:

| `stance` | Meaning | Effect on claim confidence |
|---|---|---|
| `confirms` | This ref supports the claim as stated | Raises/holds confidence per the method ladder (§2a) |
| `contradicts` | This ref **disagrees** with the claim as stated | **Caps** confidence; forces `disputed` if it contradicts a `confirms` of equal/higher rung (see rule) |
| `supersedes` | This ref **replaces** an older, now-wrong basis (the substrate changed; the old evidence is stale-by-design, not merely contradicted) | The superseded evidence is retained for history but no longer counts toward confidence; the claim is re-graded on the surviving + superseding evidence |

`stance` mirrors the WikiProvenance **dispute model**, re-pointed to per-evidence granularity: WikiProvenance disputes a whole entry (`status: disputed`); here a single claim can hold both `confirms` and `contradicts` evidence and the *claim-level* `confidence`/`status` is **derived** from the mix, rather than the whole claim being flatly disputed.

**The derived-confidence rule** (deterministic -- the integrator can compute it from the evidence set):

1. **Apex override.** If any evidence has `verification.method: maintainer-authoritative` with `stance: confirms` or `supersedes` → `confidence: backed`, `status: active`. The maintainer's word ends the question. (A `maintainer-authoritative` `contradicts` → the claim as stated is wrong; rewrite the claim to match the maintainer, don't keep it disputed.)
2. **Supersede first.** Drop any evidence marked superseded by a `supersedes` entry from the confidence computation (keep it on disk for history). Re-grade on what remains.
3. **Contradiction among non-apex evidence.** If, after step 2, the set contains **both** a `confirms` and a `contradicts` of comparable rung (e.g. `openapi` says 48h, `src`/`docs` say 12h) → `confidence: unverified` and `status: disputed`. The claim fires `[GAP]` and is a gap-loop target (escalate to Argo, §2b, to resolve to apex).
   - **Exception -- code beats docs (§2 precedence):** if the `confirms` is `src` (code) and the `contradicts` is `docs`/`openapi` (text), the contradiction does **not** force `disputed` -- code is authoritative; the claim holds at `confidence: partial` with the doc contradiction recorded as a **gap-loop target** (the docs need fixing, the claim is right). The S3-delete case is exactly this: route code contradicts the OpenAPI desc → claim ("DELETE does not remove from S3") is `backed` by `src`, and the OpenAPI text is the gap to fix.
4. **No contradiction.** All surviving evidence `confirms` → grade by the highest method rung present (§2a ceilings): a `src`/`openapi` confirm → `backed`; `docs`-only → `partial`; `probe`-only → `backed` but TTL'd; nothing but a stale/handbook assertion → `partial`.
5. **Fail-closed.** Any ambiguity the rules don't cover → `unverified`.

This is why the schema needs `stance` and not just more evidence rows: **a claim's honesty is a function of how its evidence *agrees*, not just how much it has.** Three confirming docs are weaker than one `src` confirm; one `maintainer-authoritative` confirm beats everything; a `src`-vs-`docs` disagreement is a docs bug (claim still good), but an `openapi`-vs-`src` disagreement on a value the code doesn't settle is a real `[GAP]`.

## 4. On-disk file layout -- diffable, PR-able, auditable-before-hiring

One claim = one file. Filename is the `id` (no separate `id:` key -- the wiki-card convention). Sharded by `domain` so an integrator auditing "what does the formula agent claim?" reads one directory.

```text
agents/
  competency-index/
    data-lifecycle/
      sharing-does-not-inherit-from-parent.md
      pagination-limit-1000-works.md
      ...
    auth/
      jwt-is-ip-bound.md
      ...
    formula/
      formula-references-single-hop.md
      ...
    schema/
      reference-query-resolves-at-read.md
      ...
    INDEX.md            # generated roll-up: one card-line per claim (id, claim, confidence, verification.method) -- the Tier-2 layer
    _schema.md          # this contract, vendored into the Entu repo as the format spec
  probes/
    2026-06-04/
      formula-chain-returns-null.md     # request→response capture / truth-table that a probe ref points at
```

**Why one-claim-per-file (not one big YAML/JSON):**

- **Diffable** -- a PR that adds or corrects a single claim touches one file; the diff *is* the claim's change history. An integrator reads the PR and sees exactly which assertion changed and how the evidence moved.
- **Atomically revisable** -- when a claim is added or corrected (a recorded maintainer answer, a new probe, a doc the index now cites), the change touches one file, so the review of the *index itself* is atomic. This is about the index's own change management -- diffable, reviewable claim-by-claim -- **not** about preferring any particular channel for reporting gaps *back to Entu* (that's issue-default with no bias, §6a). Keep the two separate: one-claim-per-file is good index hygiene; it implies nothing about Entu's remediation pipeline.
- **Auditable before hiring** -- the integrator's pre-hire audit is `ls agents/competency-index/<domain>/` + reading the cards. They can grep `confidence: unverified` to see exactly where the agent is honest about not-knowing, *before* trusting it.

The on-disk file body is the same YAML block as §1, optionally followed by a short prose justification (mirroring how wiki entries carry frontmatter + body). The frontmatter is the contract; the body is human context.

### Card-tier roll-up (`INDEX.md`)

Mirrors the wiki's card-tier. One line per claim: `id · claim (truncated) · confidence · verification.method · domain`. This is what `search_claims` (§5) reads first, and what an integrator skims to gauge coverage and honesty at a glance.

## 5. The queryable shape -- `search_claims` / `get_claim` (prompts consume, not embed)

Agents **consume** the index at runtime; they do not embed it in the prompt. The access surface is an arch-docs-MCP-style read API (the same shape the #42 PoC's [arch-docs MCP](https://arch-docs.dev.evr.ee) exposed for ADRs):

```text
search_claims(query, domain?, confidence?, type?, method?, status?) -> [card]
    # card = {id, claim, domain, confidence, verification.method, status}
    # reads INDEX.md card-tier first; returns the matching card-lines
    # filters: domain (route to my persona), confidence (e.g. only `backed`),
    #          type (e.g. only claims with `probe` evidence),
    #          method (e.g. only `maintainer-authoritative` apex claims),
    #          status (e.g. surface `disputed` claims an integrator should know about)

get_claim(id) -> full claim
    # the full §1 YAML: claim + evidence[] (with refs + STANCE + excerpts) + verification + confidence + ttl + status
    # this is the auditable unit -- refs are readable, excerpts inline, and the
    # stance on each evidence row shows WHY the derived confidence is what it is
    # (a visible `contradicts` entry explains a `disputed`/`partial` grade)
```

**Consumption pattern in a persona prompt** (what makes prompts thin):

> Before asserting a competency claim, call `get_claim(<id>)`. State the claim, cite its `evidence[].ref`, and prefix your answer with the runtime confidence label derived from `confidence` (§4). If `search_claims` returns nothing for the assertion you need, you are in a **gap** -- follow §6.

This keeps the prompt to *role + scope + the consumption discipline*, with all domain knowledge living in the queryable index. A claim corrected by a PR is corrected for every agent on the next `get_claim`, with no prompt edit -- the whole point of the spine.

## 6. `confidence` → runtime label + the gap-detection loop

### confidence → runtime label

`confidence` is the single field that drives the **runtime confidence label** the integrator sees on every answer:

`confidence` is **derived from the evidence set by the §3a stance rule**, then mapped to a label:

| `confidence` | Runtime label the agent prefixes its answer with | When assigned (per §3a) |
|---|---|---|
| `backed` | *(verified -- source cited)* + the `evidence[].ref`; if apex, *(confirmed by maintainer)* | apex `maintainer-authoritative` confirm; **or** ≥1 `src`/`openapi` confirm with no equal-rank `contradicts`; **or** a `probe` confirm (TTL'd) |
| `partial` | *(partially verified -- see caveat)* | `docs`-only confirm; **or** code-confirms-but-docs-contradict (§3a rule 3 exception); **or** evidence covers part of the claim's scope only |
| `unverified` | **`[GAP]`** *(from training knowledge -- not in competency index; must be verified)* | no evidence backs the assertion; **or** equal-rank `confirms`+`contradicts` deadlock → also `status: disputed` |

This is the **mechanism behind #42's "trust is auditable"**: the label is not the agent's self-assessment, it is a **deterministic function of what evidence exists and how it agrees** (§3a). An integrator can predict the label by reading the card -- including *why* a claim is disputed (a visible `contradicts` entry), not just *that* it is.

### The gap-detection loop (design component 4 of topic 10, instantiated)

When an agent needs a claim that `search_claims` does not return (or returns only `unverified`):

1. **Label in output** -- emit the `[GAP]` runtime label (the `unverified` row above). The answer is still given, but flagged as training-data-derived.
2. **Route to the right mechanism.** The loop **produces a signal; it does not remediate Entu's pipeline.** There are **two distinct mechanisms**, not three rungs of a remediation preference -- and the choice is by *kind of gap*, not by "which channel lands fastest at Entu":

   **(a) Gap reporting** -- a documentation gap (missing or wrong doc). The agent emits a **structured, evidence-backed gap report** through the standard permission-light channel: **an issue by default**, carrying the suggested fix as content. A **PR is a channel-neutral option** when it is natural *and* the actor has rights -- it is **not a preferred rung**. We deliberately express **no PR-over-issue bias**: which channel Entu acts on fastest is *Entu's triage to fix*, not something the gap-loop should engineer around. The loop's job is to surface a high-quality, actionable signal; acting on it is Entu's pipeline.

   **(b) Dispute resolution** -- a claim with contradicting evidence that **no code/spec/probe can settle** (the JWT-lifetime case: two in-repo strings disagree). The agent **escalates the specific question to the maintainer (Argo) for an authoritative answer**, which is recorded as `maintainer-authoritative` apex **evidence** (§2b). This is *not* a doc-fix routing -- it is about obtaining top-tier backing for a claim the substrate can't resolve. Unchanged by the no-bias principle, because it concerns *evidence authority*, not remediation-channel preference.

3. **Resolution.** (a) ⇒ if/when Entu acts on the report, the claim's evidence is updated on the next pass; **the timing is Entu's, not ours.** (b) ⇒ the recorded maintainer answer makes the next `get_claim` return the now-`backed` claim and the `[GAP]` stops firing. Either way, a gap that cannot be closed is **documented as a known caveat** on the persona -- honesty, not a promise to remediate.

This is where the schema **closes the loop on its own side**: the loop's output is *a structured signal* (a gap report) or *a new evidence entry* (a recorded maintainer answer) in the schema's own format. The index is self-densifying on the part we own -- every engagement either validates a claim (`last-verified` bumps), records a maintainer answer (dispute → apex), or emits an actionable gap report. That is the topic-10 "converge toward truth" claim made concrete -- **as far as the signal-producer's responsibility extends.** Whether a reported doc gap actually gets fixed is Entu's pipeline; the loop guarantees the *signal*, not the *remediation*.

### Maps to topic-10's three-way competency taxonomy

Topic 10 (S43, #74) split "competency gate" into three kinds. This schema sits squarely in the **citation-backed** row -- the only one that needs the runtime gap-loop:

| Taxonomy kind | This schema's expression |
|---|---|
| **Citation-backed** (needs runtime gate) | `evidence: docs/openapi/src` + the `[GAP]`/file-issue loop above. **This is the whole index.** |
| **Substrate-backed** (substrate-truth-read) | `evidence: probe` -- read the live artifact (the running Entu), surface on absence/staleness via TTL |
| **Posture-backed** (audit only) | Out of scope -- these are the *agent's* role/scope claims, verified by the pre-hire prompt audit, not by an index entry |

The Entu consultant agents are **citation-backed personas** (the guild's dispatch-time review class), so the full runtime loop applies -- exactly the role-class topic 10 says needs it.

## Revision trigger (architectural-fact discipline)

This is a schema contract, so n+1 "I used the schema" reports do **not** change it. It is revised only on a **substrate change**:

- ~~The Entu evidence-ref formats (§2) turn out to differ from the draft → reconcile the `ref` format table.~~ **DONE (S44):** reconciled against Finn's grounding digest -- §2 now carries the verified shapes (entu/api Nitro file-router for `src`; entu/www `src/` for `docs`; mvox-dev finding-notes for `probe`). Next revision trigger here is a *layout change in those repos* (e.g. entu/api migrates off Nitro file-routing), not a first-draft mismatch. **RE-VERIFIED 2026-08-31 (Finn, TTL Group 4): no layout change -- Nitro file-routing intact, `openapi` and `src` rows clean end-to-end.** The pass nonetheless corrected four exemplars that were wrong at filing, and the S44 attribution above is itself partly wrong: the grounding digest carries **zero** ref exemplars; the reconciliation source for §2 was the sibling **data-lifecycle competency harvest**, now added to `source-files`. See Amendments.
- Entu adds an evidence source the four `type` values don't cover (e.g. a GraphQL schema, an event log) → extend the `type` enum. *(Note: GraphQL exists at `entu/api: routes/graphql/[db].*` but is excluded from the public OpenAPI -- if a claim needs to cite it, that is the trigger to add a fifth type or fold it under `src`.)*
- The #42 roster's domain set changes from `data-lifecycle/auth/formula/schema` → update the `domain` enum and the on-disk shard dirs.
- Topic 10's taxonomy is revised → re-check the §6 mapping.
- The verification-method ladder (§2a) or stance set (§3a) gains/loses a rung -- e.g. a new authority tier above the maintainer, or a fourth stance. n+1 *uses* of the existing five methods / three stances do NOT trigger revision; only a genuinely new tier does.

## Worked examples from the real Entu corpus (S44, via Finn's digest)

Three corpus facts validate the schema's load-bearing mechanisms with real data:

1. **`partial`/dispute mechanic -- `_sharing` needs two clauses.** mvox's handbook §1.5 asserts "`_sharing` … no mechanic propagates it" -- true *post-creation* (the esmuseum correction), but entu/api's `inheritParentProperties` (`utils/entity.js`) *does* copy a parent's `public`/`domain` `_sharing` onto a child **at create time** (escalation-only). A claim stating only the handbook half would reproduce a subtler form of the very misconception the PoC corrected. **In the schema this is one claim with two `src`-backed clauses** (create-time escalation-copy AND no post-creation propagation), or a `status: disputed` if filed as two contradicting single-clause claims -- exactly the dedup-outcome-4 / two-clause discipline the schema's `status` field exists for. A candidate gap-loop entry in its own right.

2. **`[GAP]`/disputed worked example -- JWT lifetime (the canonical apex case).** `entu/api: routes/openapi.get.js` says "48-hour JWT"; `routes/auth/index.get.js` + `refresh.get.js` say "12-hour JWT". Two in-repo strings contradict -- both `src`/`docs`, equal rank. Under the §3a rule this is a `confirms`+`contradicts` deadlock at comparable rung → `confidence: unverified`, `status: disputed`, fires `[GAP]`. A `live-probe` could resolve it empirically, but the cleanest resolution is **escalate to Argo** (§2b): the maintainer's answer lands as `maintainer-authoritative` evidence (apex), which sets `backed` regardless and ends the contradiction permanently. This is the canonical case that motivates *both* the `stance` field (it lets one claim carry the two disagreeing strings) and the `maintainer-authoritative` apex rung (it's the only evidence that can settle a code-vs-code contradiction).

3. **`src` > `docs` precedence worked example -- `DELETE /property` S3 cleanup.** The OpenAPI desc claims "Files are removed from S3," but the route (`entu/api: routes/[db]/property/[_id]/index.delete.js`) has no S3-delete call. A `src` `confirms` and an `openapi` `contradicts` → under §3a rule 3's code-beats-docs exception the claim ("DELETE does not remove from S3") holds at `partial`/`backed` on the code and the OpenAPI text is the **gap-loop target** (the docs are wrong, the claim is right). Distinct from the JWT case (#2), where the contradiction is code-vs-code and so *does* deadlock to `disputed`. The **date wire-format** discrepancy (entu/www docs say `YYYY-MM-DD`, API returns full ISO; `entu/api#41` open) is a third instance of the same docs-lag-code shape.

## Confidence

Medium-to-high -- the schema is **derived and now corpus-grounded**, though not yet **instantiated** as a populated index. Its spine (claim→evidence→verification→confidence) is a direct re-pointing of the proven WikiProvenance model (§3) and a faithful instantiation of topic-10's design (the four #42 components + the three-way taxonomy). The previously un-validated surface -- the **evidence-ref formats** (§2) -- was **reconciled against real Entu artifacts via Finn's grounding digest (S44)**; the mvox finding-note shape maps 1:1 onto a claim ("mirror, don't invent" confirmed against the corpus), and three real doc↔code discrepancies (JWT lifetime, date wire-format, S3 cleanup) validate the gap-loop and `src`-precedence mechanics as worked examples rather than hypotheticals. **PO-ratified extension (S44):** the five-rung method ladder (§2a, adding `live-audit` + apex `maintainer-authoritative`) and the per-evidence `stance` field with the derived-confidence rule (§3a) -- both kept as minimal augmentations of the WikiProvenance dispute model, not a rewrite. TTL 2026-11-30 now guards *re-drift* of those external refs, not first-draft uncertainty.

## Pairs with

- [topic 10](../../../../topics/10-guild-specialists.md) -- the guild design this index is the competency backend for; §6 instantiates its design-component-4 gap loop and three-way taxonomy.
- `types/t09-protocols.ts` `WikiProvenance` -- the provenance model this schema re-points (§3).
- entu/api#42 -- the productization brief; this schema is its "Competency index" component, made concrete.

## Amendments

### 2026-08-31 -- TTL re-verification (Finn, Group 4). Verdict: NO re-drift; four exemplars were **wrong at filing**.

The TTL (2026-09-06) fired to guard *re-drift* of the §2 evidence-ref formats. **Re-drift did not happen** -- the external substrate is stable and every structural claim held. What the pass actually caught was four exemplars that were **born wrong in S44**. Verified against the live `entu/api` and `entu/www` trees, not against the frozen issues.

**Verified clean, no change:** the `openapi` row end-to-end (`api.entu.app/openapi` → 200, `openapi: 3.1.0`, 12 paths; exemplar resolves; the "excludes GraphQL + `_*` internal routes" claim holds at 0 and 0); the `src` row (Nitro file-router intact, every pinned path and symbol resolves, and the "**NOT** `src/api/...`" warning is still correct -- entu/api has no `src/` at all); the `docs` row's path half (bilingual `src/` + `src/et/` confirmed); and all three worked examples (the unnumbered "Worked examples" section) on live code.

**Corrected:**

1. **`probe` row, both halves.** Format said `mvox-dev/mvox_v4e_web:` while its own example said `mvox-dev:` -- the row disagreed with itself, and S44 used the short form in 13/13 refs. The `<note>` token also omitted the mandatory date: 32/32 files in that directory carry one, and the dateless `org-rights-cascade-audit.md` **has zero commits ever** -- the real file is `org-rights-cascade-audit-2026-05-21.md` (`aa26032d`, committed 16 days *before* S44).
2. **`docs` row anchor.** `#single-hop` and `#references` are not headings in `src/api/formulas/index.md`; the real anchor is `#field-references`. **Not a rename** -- the heading set is byte-identical at the S44 sha (`11cfe80f`) and today.
3. **§1 excerpt was not verbatim.** It cited `_parent.*` as a formula field kind; `_parent.` appears zero times in that doc at S44 and today, and the doc explicitly states `_parent` is a system reference property *not* counted by `_referrer`. Corrected to the real kinds.
4. **PR-form `docs` refs had no staleness rule** -- the row's "tracked by source-file change" cannot fire on an unmerged PR, making a PR-form ref unfalsifiable. **Ruling (filer, 2026-08-31): keep the form, give it its own rule** -- recorded above. Dropping it was the alternative and was rejected: our own gap-loop output *is* unmerged PRs (#11, #13), so removing the form would make our own contributions uncitable, defeating the mechanism the schema exists to serve. This changes §2's rules rather than correcting an exemplar, so it is flagged to team-lead as a contract-semantics change.

**Root cause of Defect 1 — one of the four, not three (corrected on read-back).** Frontmatter named `docs/2026-06-06-entu-consultant-grounding-digest.md` as the reconciliation source. **That digest contains zero `ref:` lines** (178 lines, 0 matches). All 32 worked ref exemplars live in `docs/2026-06-06-data-lifecycle-competency-harvest.md` (485 lines, 32 matches) -- same author, same date, and **absent from `source-files`**. The filer cited a document with no exemplars to lift, so the exemplars were hand-made from the bare prose topic-list at digest line 135 -- which names `org-rights-cascade-audit` **undated**, because it is naming topics, not files. That is exactly the shape of defect 1. The harvest has now been added to `source-files`. Generalised at [`gotchas/citation-names-the-wrong-sibling-source.md`](../gotchas/citation-names-the-wrong-sibling-source.md).

**Defects 2 and 3 do NOT share that root cause — verified on read-back, and each belongs elsewhere.**

- **Defect 2 (the invented anchor) is the filer's, but is a different sub-shape.** Both S44 documents contain **zero** anchored `entu/www: src/...#...` refs; the harvest's entu/www refs are all bare. **Citing the correct sibling would not have supplied an anchor** — no source demonstrated that shape, so the exemplar was invented rather than misrouted.
- **Defect 3 (`_parent.*`) is NOT the filer's.** Grounding digest **line 67** reads verbatim: *"Field kinds: same-entity, `propertyName.*.prop` / `propertyName.type.prop` (referenced entities), `_child.*`, **`_parent.*`**, `_referrer.*`. No deeper chaining."* The filer transcribed the cited document faithfully; **the document was wrong.** This is an error in the S44 digest, owned by its author, who identified it himself during read-back.

**Residual overstatement, flagged by the submitter and not fully reached by the corrections above.** The TTL note and the struck-through revision trigger both say §2 was *"reconciled against real Entu artifacts"* in S44. **For the anchor half of the `docs` row that never happened** — with zero anchored refs in either S44 document there was nothing to reconcile it against. The anchor's *value* is now fixed; the claim that the row as a whole was corpus-grounded remains too strong for that half, and is recorded here rather than silently repaired, because the overstatement is the S44 author's to correct.

**Watches opened, not acted on:**

- **Entu shipped its own AI assistant** (`entu/api utils/ai/{llm,operations,prompt,tools}.js`; docs at `entu/www src/api/ai/`; `POST /api/{db}/ai/chat`, runs with the caller's rights; landed ~2026-07). Candidate 5th domain against revision trigger #3 -- **held as a watch, not an enum change**, because that trigger fires on *the #42 roster's domain set changing* and the roster has not changed: #42 still has zero replies and there is no `agents/` directory in either repo (404 both).
- **§6a's "the timing is Entu's, not ours" now has a datapoint.** All 11 entu/www docs issues remain open (oldest 2026-05-17) and PRs #11 and #13 are unmerged after ~3 months, against #42's assertion that "PRs get merged consistently (13/14 of ours landed)". Recorded as evidence for the existing caveat; §6 itself untouched.

*Amendment filed by the librarian on Finn's submission. **Authorship, corrected on read-back: Defects 1 and 2 are the filer's; Defect 3 is the S44 digest author's.** The first version of this section claimed all three as the filer's — the submitter corrected it in the opposite direction to his own interest, having noticed he had moved his own S44 error into the filer's column. Both parties had over-attributed toward the other; the record now matches the sources. Scope held to the ref-format table per the entry's own TTL note -- §3a, §4, §5, §6 and the revision trigger's other bullets are untouched. `last-verified` bumped: the §2 claim was genuinely re-checked against live sources.*

**Section-numbering defect, corrected in the same pass (Finn).** The ref-format table lives under **`## 2. Evidence object`**, not §3 (§3 is the WikiProvenance parallel) — so **every reference to "the evidence-ref formats (§3)" pointed at the wrong section**, including the frontmatter comment, the TTL note, the revision trigger, and the Confidence section. Corrected to §2, and two references to the five-rung method ladder corrected to §2a. **Two bare `§3` references are genuinely correct and were deliberately left** (both name the WikiProvenance parallel, at the Confidence and Pairs-with sections), and **all 16 `§3a` references are correct** — the stance rule really is inside §3. This is why the fix was applied per-occurrence rather than by pattern: a blanket `§3`→`§2` corrupts the two true ones, and any pattern matching `§3` matches `§3a` first and would have corrupted all sixteen. The defect had already cost a reader a double-take — the Group-4 brief said "§3" and the table was in §2.

(*FR:Callimachus*) (*FR:Finn* -- re-verification, defects 1-4, and root cause)
