# Entu Product-Native Consultant Agents — Architecture & Spec

**Status:** DRAFT for review (S44, 2026-06-06) — design lead Celes (*FR:Celes*)
**Scope:** Architecture / spec only — the *contract* for product-native consultant agents. NOT populated agents (no filled-in prompts, no populated competency claims). This doc defines the shapes; populating them is a later engagement.
**Target:** [entu/api #42](https://github.com/entu/api/issues/42). A digestible proposal comment is derived from this doc (team-lead posts it).
**Precedent:** `topics/10-guild-specialists.md` (the FR guild/expert-companion pattern, validated S41/S42); `docs/2026-06-05-competency-gap-analysis.md` (S43 reflexive three-way competency taxonomy).

---

## 0. What this is, in one paragraph

Entu ships a small set of **product-native consultant agents** that integrators "hire" into their dev teams. These are not chatbots or doc-search wrappers; they are specialists whose every domain claim is backed by a **referenced, verifiable source in a competency index** — not by training data. The index is the spine: it is queryable, diffable, and **auditable before hiring**. Agents are thin consumers of the index. When an agent must reach past its backed knowledge, it labels the answer and **files an evidence-backed gap report** (an issue, by default) — the loop closes when *Entu acts* on it: updated docs → updated index → every agent smarter. The agent produces signal; acting on it is Entu's pipeline.

This architecture productizes a pattern Entu already ran by hand (the esmuseum bulk-restrict consult, see §6) and that FR has independently validated as a framework primitive (topic 10).

---

## 1. The competency index — the spine

> **CANONICAL SCHEMA:** the field-level specification of the index — atomic claim unit, evidence types, the queryable `search_claims`/`get_claim` API, the on-disk layout, and the `WikiProvenance` reuse mapping — is **`teams/framework-research/wiki/contracts/entu-competency-index-schema.md`** (*FR:Callimachus*, Task #2). It is the source of truth and is vendored into the Entu repo as `agents/competency-index/_schema.md`. This section states the *role* the index plays in the architecture and summarizes the schema's load-bearing decisions; the contract above governs the field details.

### 1.1 Why the index is primary (approach B)

The index is the **source of truth**, and the agent prompts are **thin consumers** of it. This is a deliberate inversion of the obvious design ("write smart prompts, give them some references"). The reasons:

- **Auditable before hiring.** An integrator can read the index and decide whether to trust the agent *without running it*. Trust is a property of the index, not of a model's opaque weights.
- **One backing, many consumers.** A single claim ("formula references are single-hop only") backs the formula agent's answer, the schema agent's handoff caveat, and any future tool that queries the index. Write the evidence once.
- **The prompt stays cheap and stable.** A prompt that embeds facts goes stale every time the platform changes and bloats with every new fact. A prompt that *queries* an index never embeds a fact, so it ages on posture, not on content. (This is what makes the persona-anchor economy in §2.5 safe — see the guardrail there.)
- **The gap loop has somewhere to write.** "Self-improving" requires a substrate that improvement lands in. The index is that substrate; a merged docs PR refreshes it (§3.4).

### 1.2 The atomic unit — one claim = one verifiable assertion

The atomic unit is **not** "the agent knows about formulas." It is a single **verifiable assertion** with its evidence attached — one claim, one file. The canonical field set (schema §1) is:

| Field | Carries |
|---|---|
| `claim` | The verifiable assertion, phrased so a reader could confirm or refute it by reading one `evidence` ref. The grammar test: if no ref can confirm it, it is a *topic*, not a claim. |
| `domain` | One of `data-lifecycle / auth / formula / schema` — maps the claim to exactly one agent. Also the slice key (§2.2). Cross-domain claims are **split, not double-tagged**. |
| `evidence[]` | ≥1 typed reference `{type: docs\|openapi\|src\|probe, ref, stance, excerpt?}`. `stance` (`confirms\|contradicts\|supersedes`, default `confirms`) is each ref's *direction* relative to the claim — so the array is a **triangulation set**, not a flat list (schema §2, §3a). **A claim with zero evidence cannot be filed** — zero-evidence assertions are gaps (§3.3 / FR `[ORPHAN-CLAIM]`), not index entries. |
| `verification` | The *act* of confirming: `{method, date, verifier}`, where `method` is one of the **five-rung ladder** `doc-cited \| spec-derived \| live-probe \| live-audit \| maintainer-authoritative` (schema §3). Distinct from `confidence`, which is the *grade*. `verifier` is the agent — or `"argo"` for maintainer-authoritative. |
| `confidence` | `backed / partial / unverified` — **derived from the evidence set via the stance rule** (schema §3a), not asserted; **drives the runtime label** the integrator sees (§3.2). Fail-closed default on ambiguity: `unverified`. |
| `last-verified`, `ttl`, `status` | Staleness + lifecycle. `ttl` is **required for `probe`-only claims** (live observations perish); `status` is `active/disputed/archived`, and a contradiction in the evidence set can *derive* `disputed` (§3a), never a silent overwrite. |

Four schema decisions are load-bearing for the rest of this doc:

- **`probe` evidence is first-class and perishable.** The PoC's strongest move was a *live probe* (Pérotin's `_sharing` truth table) correcting a mental model doc-reading missed. So `type: probe` is a real evidence type — but it forces a `ttl`, and a **probe-only claim caps at `confidence: partial`** unless a doc/spec ref corroborates it. Highest-trust *and* most perishable, made explicit. (This is the schema's answer to Open Q §7.3.)
- **Maintainer-authoritative is the apex tier; confidence is *derived* from evidence stance.** The five-rung method ladder tops out at **`maintainer-authoritative`** — Argo (or a maintainer) answering directly with a `file:line` reference. It **outranks docs/code/probe on any conflict**: an apex `confirms`/`supersedes` sets the claim to `backed`/`active` and ends the question, and the escalation path records the maintainer's answer back into the index as top-tier backing (this is what the #42 proposal headlines — one maintainer reply upgrades the whole roster). Below the apex, `confidence` is **computed** from how the evidence agrees (schema §3a derived-confidence rule), not asserted: a `contradicts` of comparable rung forces `disputed`/`[GAP]`; but **code beats docs** — a `src` confirm vs a `docs`/`openapi` contradiction does *not* dispute the claim (the claim holds, the docs are the gap to report). Honesty is a function of how the evidence *agrees*, not how much there is.
- **The schema re-points `WikiProvenance`, it is not invented.** Cal's contract §3 maps every field onto the Librarian's existing `WikiProvenance` frontmatter (`types/t09-protocols.ts`) — `last-verified`/`ttl`/`status` transfer verbatim; `stance` re-points WikiProvenance's dispute model to per-evidence granularity; the docs/spec-vs-probe split *is* the architectural-fact-vs-observation split FR already runs. The index reuses a battle-tested provenance model.
- **Citation-backed taxonomy slot.** Per topic-10's three-way taxonomy, this whole index is the **citation-backed** kind — the only kind needing the runtime gap-loop (§3.3). That is exactly the dispatch-time review role-class the guild design says needs it.

### 1.3 The index is queried, not embedded

The index exposes an arch-docs-MCP-style read API (schema §5): `search_claims(query, domain?, confidence?, type?, method?, status?) -> [card]` and `get_claim(id) -> full claim`. Agent prompts reference the index *by query*, never by copy. A domain agent's competency set is `search_claims(domain="formula")` — a **view**, not a duplicate. The `method?`/`status?` filters let a prompt surface exactly the claims that matter operationally: `method="maintainer-authoritative"` pulls the apex-backed claims, `status="disputed"` pulls the open `[GAP]`s an agent should flag rather than answer. This is what makes the per-agent slice (§2.2) a projection, not a maintenance liability, and it is why a claim corrected by one PR (or one Argo answer) is corrected for every agent on the next `get_claim`, with **no prompt edit**.

---

## 2. The agent-definition container

Each agent is a directory `agents/<domain>/` with **five elements**. The first four are the topic-10 / #42 components; the fifth (persona anchor) is new in this spec and is what makes the prompts cheap.

```text
agents/
  competency-index/              # the GLOBAL index (schema §4) — one claim = one file, sharded by domain
    data-lifecycle/  auth/  formula/  schema/
    INDEX.md                     #   generated card-tier roll-up
    _schema.md                   #   Cal's contract, vendored as the format spec
  data-lifecycle/                # the AGENT container for one domain
    prompt.md                    #   1. thin role prompt — queries the index, embeds no facts
    competencies.yaml            #   2. this domain's slice = search_claims(domain="data-lifecycle"), generated/diffable
    synergy.md                   #   3. handoff edges to other agents
    persona.md                   #   4. the persona anchor (posture/voice) + the hard guardrail
    README.md                    #   (optional) human-facing "what is this agent" card
  auth/  formula/  schema/       # the other three agent containers, same shape
```

> **Naming + layout note (reconciles with schema §4).** #42's table lists four things: Agent prompt / Competency claims / Competency index / Synergy map. This spec resolves them onto two scopes: the **global index** lives once under `agents/competency-index/` (Cal's canonical one-claim-per-file layout — the auditable, PR-able store), and each **agent container** under `agents/<domain>/` holds the thin consumers. The agent's `competencies.yaml` is the **generated slice** `search_claims(domain=...)` — the same claims at agent scope, a projection of the global store, *not* a hand-maintained second copy. "Competency claims" (per-agent) and "competency index" (global) are therefore the same data viewed at two scopes.

### 2.1 `prompt.md` — the thin role prompt

The prompt defines role, scope (read-only vs mutation-capable), and the **discipline of consulting the index**. It contains **no domain facts**. Its job is behavioral:

- "You answer questions about *X domain*. Every domain claim you make MUST resolve to a claim in your competency index. Cite the claim's evidence ref."
- "When you cannot find a backing claim, you do not guess — you follow the gap protocol (§3.3)."
- "You carry the posture of your persona anchor (§2.4) for *how* you work, never for *what is true*."

Because facts live in the index, the prompt does not bloat or go stale as Entu evolves. This is the §1.1 "ages on posture, not content" property realized.

### 2.2 `competencies.yaml` — the domain slice

The agent's slice of the global index: `search_claims(domain="<this domain>")` materialized as a diffable file. It is **PR-able and auditable** — an integrator reviewing `agents/auth/competencies.yaml` sees exactly what the auth agent claims to know and what backs each claim, before hiring. It regenerates from the index on index change; it is a projection, not a hand-maintained copy (§1.3).

The slice is clean on **both** axes (Cal): the index is one store with a first-class `domain` field, so `search_claims(domain=...)` is the runtime view; and the on-disk store is sharded one-claim-per-file *by domain directory* (`agents/competency-index/<domain>/`), so the build-time view is just "read that directory." Runtime query and build-time directory-read return the same data and cannot diverge.

**`competencies.yaml` MUST be generated, never hand-edited** — and it carries a provenance header `generated-from: competency-index/<domain>/ @ <commit>` plus a generation timestamp. This is load-bearing for the audit-before-hiring guarantee: the moment someone hand-edits the slice it stops being a slice and becomes a *fork*, and the integrator can no longer trace the slice back to the index claims. As a generated view, a gap-loop correction to the index reaches the agent on its next regeneration with no copy to re-sync (the embed-drift the spine exists to prevent, §1.1). The `generated-from` line makes the slice→source link *itself* auditable.

### 2.3 `synergy.md` — handoff edges

Names the agent's handoff edges: which questions it routes to which sibling, the productive overlap, and the shared cross-check step. The full graph is §5. Each agent carries only its own edges; the union is the synergy map. (Topic-10/S42 finding: synergy lives in the work product and emerges from prompt-encoded lens discipline — but the *predictable* pairings must still be wired, so they live here.)

### 2.4 `persona.md` — the PERSONA ANCHOR (5th element)

**The idea.** Each agent is anchored to a **well-known real or literary figure**, chosen for **posture and voice** — meticulousness, probe-driven method, boundary-respect — so that the prompt can lean on the model's training-data-established sense of that personality instead of spending tokens re-specifying "be careful, be rigorous, verify before asserting." This mirrors FR's own roster convention exactly: Aeneas (steadfast coordinator), Volta (precise instrumentation), Medici (patron/curator judgment), Callimachus (the librarian who catalogs). The anchor buys *character* cheaply.

**The hard guardrail (load-bearing — the whole design depends on it):**

> **A persona anchor supplies POSTURE and VOICE. It NEVER supplies FACTS.**
> Every domain claim the agent makes cites the competency index (§1). No claim is ever justified by appeal to the persona's training-data authority. "Anderson would know X about NIS2" is forbidden reasoning; "claim #N in the index, evidence ref Y, says X" is the only allowed reasoning.

**The cautionary case (name it so no one deletes the guardrail later):** in the S41 Arhitecture consultancy, the Ross Anderson persona — chosen for genuine security-domain *fame* — fabricated regulatory links (NIS2/ISO citations with no backing) precisely because the persona's domain authority *invited* the model to answer from training data. The fix that S42 validated: keep the posture, sever the facts. The persona makes the agent *careful*; the index makes the agent *correct*. (S42 regression test: with facts severed to the index, the same highest-fabrication-risk lenses produced **zero fabrication, 5/5** — topic 10 §S42.)

**Selection rule (derived from the cautionary case):** prefer figures famed for **method/posture**, not for **domain-fact authority**.

- **Good anchors** — known for *how they work*: meticulous, probe-driven, boundary-respecting, systematic. The fame is in the method, so the model borrows method.
- **Risky anchors** — known for *what they know* in the agent's exact domain. The fame is in the facts, so the model is tempted to borrow facts. If such a figure is used, the guardrail must be stated twice as loudly. (Anderson-in-security is the worked example of the risky kind.)

`persona.md` therefore contains: the figure, a one-line lore tie to the domain *posture* (not domain knowledge), the voice register, and a verbatim restatement of the hard guardrail. The guardrail travels with the persona, always, because the persona is exactly where the temptation lives.

### 2.5 Why five elements and not four

The four #42 components answer "what does the agent know and how does it hand off." The persona anchor answers "how does the agent *carry itself* while doing so" — and does it at near-zero prompt cost by reusing training-data personality. The four components are the **correctness** machinery; the persona is the **posture** machinery. The guardrail (§2.4) is the wall between them, and it is the single most important sentence in this document.

---

## 3. The engagement protocol

The lifecycle of one consult: **hire → consult → confidence-labeled answer → gap-detection loop.**

### 3.1 Hire

An integrator adds `agents/<domain>/` to their working set (or invokes the hosted agent). Before hiring, they **audit the index** (§1, §2.2): read the claims, read the evidence refs, decide whether the backing meets their bar. Hiring is an informed act, not a leap of faith — that is the differentiator.

### 3.2 Consult → confidence-labeled answer

The agent answers a question by resolving each domain claim against its competency index and emitting a **per-claim confidence label**. The label is the claim's `confidence`, which is *derived* from its evidence set by the stance rule (§1.2; schema §3a) — not the agent's self-assessment:

- **`backed`** — "Formula references are single-hop only [src: `entu/api utils/formula.js`; docs: `entu/www src/api/formulas`]." Cited, verifiable, the integrator can click through. (An apex `maintainer-authoritative` confirm is always `backed` — Argo's word ends the question.)
- **`partial`** — backed but with a caveat: probe-only (perishable), or a `src` confirm that a `docs`/`openapi` ref *contradicts* (code wins, so the claim still holds — but the doc disagreement is recorded and is itself a gap to report). Labeled so the integrator knows the edge.
- **`unverified` / `[GAP]` (incl. the disagreement case)** — either the agent reached past its backed knowledge, **or** the evidence set itself disagrees: a `confirms` and a `contradicts` of comparable rung with no code/maintainer ref to settle it → the claim is `disputed`/`unverified` and fires `[GAP]`. **This triggers the gap loop (§3.3).** The claim is never presented as fact; the disagreement is surfaced to the integrator and escalated toward an apex (maintainer) answer.

**Worked disagreement case (ties §6):** the JWT-lifetime claim has two `contradicts`-rung evidence entries — `routes/openapi.get.js` says 48h, `routes/auth/*` say 12h. Two comparable-rung sources disagree and no code value settles it → the derived confidence is `unverified`/`disputed`, the agent fires `[GAP]`, and the resolution is an escalation to Argo (whose direct answer would land as `maintainer-authoritative` apex backing and close it permanently). This is the stance rule doing exactly what a flat "count the evidence" model cannot: *two* sources is *less* certain here, not more, because they point opposite ways.

The label is **per claim, not per answer** — a single answer can mix backed and unverified claims, and the integrator sees exactly which is which. Confidence is a property the integrator reads off the output, not a tone they infer.

### 3.3 Gap-detection loop — a signal producer, not a remediation service

When an agent hits a claim it cannot back (`unverified`), it does two things:

1. **Labels the claim** `[GAP]` in its output (§3.2) so the integrator's confidence is calibrated in the moment.
2. **Emits a structured, evidence-backed gap report** — the missing or contested fact, the evidence the agent did find, and a *suggested fix as content* — through the standard, permission-light channel (**an issue, by default**). The report is written to be easy to act on; **acting on it is Entu's pipeline responsibility, not the agent's.**

**The agent produces signal; it does not own the fix.** This is a deliberate boundary. The gap loop's job is to surface, with evidence, exactly what the documentation should say and doesn't — not to push the change through Entu's repo. Designing the loop to *remediate* (e.g. routing every gap to a PR to dodge a slow issue queue) would be a mistake on three counts: it burdens the agent with work that isn't its role, it assumes write/PR permissions the integrator often won't have, and it quietly absorbs the cost of a triage backlog instead of surfacing it. A consultant that files clean, actionable reports is doing its job; whether those reports get actioned is a property of Entu's pipeline, and a *stalled* pipeline is itself a signal worth surfacing (§7) — not something the architecture should engineer around.

**The surviving kernel is quality, not channel.** What makes a gap report valuable is that it carries evidence plus a suggested fix, so it is cheap for a maintainer to act on — and suggested doc text lives perfectly well in an issue body. **Issue is the first-class default; a PR is an optional upgrade**, used only when it is the natural artifact *and* the actor happens to have the rights — never a designed preference, never an obligation. The channel is incidental; the report's quality is the point.

**Separately — escalate-to-Argo for a disputed claim (a different mechanism).** When a claim is `disputed` because its *evidence set disagrees* and no code value settles it (the JWT 12h/48h case, §3.2), the resolution is to escalate to the maintainer for an **authoritative answer**, which is recorded back into the index as `maintainer-authoritative` evidence (`verifier: argo`) — apex-backing the claim for the whole pool (schema §2b). This is *not* gap-doc routing: gap-doc routing reports a missing/contested doc *to Entu to fix*; the apex escalation captures Argo's *answer as evidence* to resolve an internal disagreement. Both surface signal to the maintainer; they differ in what comes back (a doc change Entu owns vs. an authoritative datum the index records). It remains the strongest realization of #42's "Argo gets prioritized signal" — his scarce attention captured once as top-tier backing every agent inherits.

The boundary, stated precisely (matching schema §6): *reporting a doc gap is a signal we hand to Entu; escalating a dispute to Argo is how we obtain top-tier evidence for ourselves — the first never enters the evidence-method ladder (a gap report is an emitted signal, not a `verification.method`), the second is the only thing that produces `maintainer-authoritative` backing.*

This is also the **orphan-claim** boundary (FR `[ORPHAN-CLAIM]` category, S43): a `[GAP]` is "I have a claim but thin/absent backing" → the loop fires. The index must never carry a `backed` claim with zero evidence — that orphan is the failure the audit catches before hiring, distinct from the runtime gap the protocol catches during a consult.

### 3.4 The flywheel

`consult surfaces gap → agent files an evidence-backed gap report → **Entu triages and acts** → index refreshes → every agent that queries that claim is now smarter.` Each real engagement either validates the index or surfaces a documented improvement *for Entu to act on*, driven by real integrator need, not by guessing what to document.

**The loop guarantees the signal, not the remediation** (Cal's schema §6). Whether a reported doc gap actually gets fixed is Entu's pipeline, not the agents' — so the convergence claim extends only as far as the signal-producer's responsibility: the loop *emits* gap reports (it does not *close* doc gaps), and it *closes disputes* via the separate apex-evidence path (§3.3, where one Argo answer resolves a disputed claim permanently for the whole pool). Name the dependency honestly: the flywheel only spins if Entu triages and acts; the architecture does not (and should not) engineer around a slow pipeline. A stalled pipeline doesn't break the agents — the reports just queue, and **a backlog of clean, evidence-backed gap reports is itself a surfaced signal to Entu** about where its documentation and its triage are falling behind. Topic 10 §S42 demonstrated the loop end-to-end: gap-reaction fired 4/4 where a gap existed.

---

## 4. Roster spec

Four agents, specified at the **contract level** (domain boundary, scope, competency-claim categories, key handoff edges). Populating them is out of scope; this is the shape each must fill. Domain↔evidence-source mapping is grounded in Finn's digest (Task #1): each domain has a primary *code* source in `entu/api` (`routes/`, `utils/`) and a primary *docs* source in `entu/www` (`src/api/`, `src/configuration/`).

> **Repo-routing correction (Finn, Task #1) — load-bearing for every evidence ref.** entu/api is a **Nitro/h3 file-routed server**: endpoints live under `routes/[db]/…`, shared logic under `utils/…`. The `src/api/formulas`-style paths #42 cites are **docs paths in entu/www** (the VitePress site), *not* code paths. So evidence refs route by kind: **behaviour → `entu/api utils/*` or `routes/*`; documented contract → `entu/www src/api/*` or `src/configuration/*`; observed truth → mvox-dev probe artifact.** Cal's schema `evidence.type` (`src`/`openapi`/`docs`/`probe`) already encodes this; this note pins which repo each type points at.

| Agent (`agents/<domain>/`) | Domain boundary | Scope | Primary evidence sources (Finn) | Competency-claim categories |
|---|---|---|---|---|
| **data-lifecycle** | Entity CRUD (append-only properties, soft-delete), `_sharing`/`_inheritrights` mechanics, serial ops, import/migration | read-only by default; **mutation-capable only under explicit integrator opt-in** (serial mutation is destructive) | `entu/api utils/entity.js` (`setEntity`, `inheritParentProperties`); `entu/www src/api/properties`; mvox handbook §1.5 | wire-shape, inheritance-mechanics, serial-op-limit, migration-pattern |
| **auth/identity** | JWT (IP-binding, refresh-refusal cases, API-key SHA-256 exchange), OAuth.ee flow, passkey, `entu_user` lifecycle | read-only | `entu/api routes/auth/*`; `entu/www src/api/authentication` | token-mechanics, flow, rights-binding |
| **formula-engine** | Strict-RPN, operator/arity behaviour, **single-hop** field references, implicit `CONCAT`, **rights-bypass**, eventual-consistency | read-only | `entu/api utils/formula.js`; `entu/www src/api/formulas` | syntax, operator-semantics, single-hop-reference, rights-bypass |
| **schema-design** | Entity-type architecture ("type is just an entity"), `reference_query` (static filter), `add_from`/`default_parent`, rights model | read-only (advisory) | `entu/www src/configuration/entity-types`; `entu/api utils/rights.js`; mvox handbook §1 | architecture-pattern, reference-resolution, rights-model |

**Scope discipline:** only data-lifecycle is mutation-capable, and only opt-in. Everything else is advisory/read-only — keeping a hired agent's blast radius near zero by default and making the one dangerous capability an explicit, audited choice. **There is no bulk/batch endpoint** (Finn): the route tree has only single-`{id}` mutation routes (404 on `/properties`, 500 on comma-list DELETE, two-team-confirmed). "Mutation-capable" therefore means *driving a serial loop of single-id ops* (as the esmuseum 6,352-op run did), not a batch call.

### 4.1 Worked exemplar — data-lifecycle (Pérotin-backed)

Data-lifecycle is the exemplar because it has **real empirical backing** from the manual PoC: Pérotin live-probed `_sharing` behaviour and produced a truth table (not guesses), and the consult corrected a wrong mental model that would have flawed a 6,352-entity operation. The `_sharing` case is the *ideal* exemplar because it shows the spine doing the one thing a smart prompt cannot: **enforcing atomicity that prevents a subtle, real misconception.**

**The subtlety (Finn's grounding).** The mvox handbook §1.5 says *"no mechanic propagates `_sharing`"* — which is true **post-creation**. But entu/api's **create-time** code (`utils/entity.js::inheritParentProperties`) *does* copy a parent's `public`/`domain` `_sharing` onto a new child. The esmuseum consult's Q4 answer stated this correctly ("materializes a copy at create time"); the handbook one-liner is slightly more absolute than the code. A single fused claim that copied the handbook verbatim would reproduce a *subtler* form of the very misconception the PoC corrected.

**The fix (per Cal's atomicity rule — one claim = one verifiable assertion):** this is **two separate claims**, each with its own evidence, not one fused claim. The spine *forces* the split because each clause must independently cite evidence — and the create-time clause cites code the absolute version cannot produce.

```yaml
# CLAIM 1 — data-lifecycle/sharing-no-post-creation-propagation.md
claim: >
  After entity creation, NO mechanic propagates _sharing — not type->instance,
  not parent->child. A child's _sharing is independent of its parent's at read time.
domain: data-lifecycle
evidence:
  - type: docs
    ref: "entu/www: PR #13 (_sharing clarification, OPEN)"
    stance: confirms
    excerpt: "_sharing is not inherited from the parent entity"
  - type: probe
    ref: "mvox-dev: docs/migration/findings/org-rights-cascade-audit (esmuseum truth table)"
    stance: confirms
    excerpt: "absent _sharing resolves to default `private`; no read-time propagation observed"
verification: { method: live-audit, date: 2026-06-04, verifier: perotin }   # tier-2: audit over real data
confidence: backed         # two confirms, no contradicts -> backed (schema §3a)
last-verified: 2026-06-04
ttl: 2026-09-04            # probe evidence present -> ttl required (schema §2)
status: active

# CLAIM 2 — data-lifecycle/sharing-create-time-escalation-copy.md
claim: >
  At entity creation only, inheritParentProperties copies a parent's _sharing to ESCALATE
  visibility (any parent public -> child public; else any parent domain -> child domain;
  a parent `private` writes nothing -> child falls to default `private`), and only when
  the child does not already specify _sharing. Escalation-only; never restricts.
domain: data-lifecycle
evidence:
  - type: src
    ref: "entu/api: utils/entity.js (inheritParentProperties)"
    stance: confirms
    excerpt: "runs only at create; parent public->child public; parent private writes nothing"
verification: { method: doc-cited, date: 2026-06-06, verifier: finn }   # code-read
confidence: backed         # src confirm -> backed (schema §3a)
last-verified: 2026-06-06
status: active            # src-cited, no probe -> ttl optional
```

**Why two claims is the whole point.** An integrator asking *"does `_sharing` inherit?"* gets BOTH cards back from `search_claims(domain="data-lifecycle", query="_sharing inherit")` and reads the correct, complete answer: *no post-creation propagation (claim 1) AND a create-time escalation-only copy (claim 2)* — not the over-absolute "it never propagates" (true only post-creation) and not the naive "it inherits" (false post-creation). Note the two claims also differ in **evidence strength and staleness**: claim 1 is observation-backed (live-audit, perishable, carries a `ttl`); claim 2 is `src`-cited (architectural-fact-like, no `ttl`). The schema records that difference, so the integrator can see *why* each is trusted.

**The meta-point (make it explicit in any pitch):** this exemplar is *itself a candidate gap-loop entry.* The handbook §1.5 one-liner should gain the create-time clause — exactly the kind of doc gap the productized agents would `[GAP]`-flag and PR. The spine doesn't just store the correct answer; the act of populating it *surfaces* the doc that needs fixing. That is the flywheel (§3.4) demonstrated on the very first claim. **A prompt cannot do this** — only a per-claim-evidence-cited index can force the atomicity that exposes the gap.

**The evidence shape is already native (Finn) — the index mirrors it 1:1, doesn't invent it.** mvox-dev's verified notes (`mvox-dev/mvox_v4e_web: docs/migration/findings/*.md` + the aggregating `entu-schema-mutation-handbook.md`) already carry, per note: a *probe-script* ref, a *result-JSON* artifact, a *ratified-commit* sha, and a `STEP | OP | RESULT` truth table — which map directly onto the schema's `evidence[].ref` (probe), `verification`, and `excerpt`. Finn's **three strength tiers** in that corpus map onto `confidence`: (1) *live-probe-verified* (probe-script + result-JSON + truth table) → `backed`/`partial`; (2) *live-audit-verified* (audit over real data with a per-row table) → `backed`; (3) *handbook-asserted* (synthesized §1.5 narrative citing the probes) → `partial` until a primary ref is attached. So populating the index is mostly *re-housing existing evidence into a queryable, per-claim shape* — not manufacturing it. (Claim 1 above is a tier-2 audit row; claim 2 is a code-read.)

---

## 5. Synergy map

Handoff edges where one agent's lane abuts another's, plus the shared cross-check step.

```text
        data-lifecycle ⟷ auth/identity
            │   (rights/JWT: a _sharing or _inheritrights question that turns on
            │    WHO can act routes to auth; auth defers entity-mechanics back)
            │
        formula-engine ⟷ schema-design
            │   (single-hop refs + rights-bypass: a formula that reads across a
            │    reference, or bypasses rights, is a schema-design concern about
            │    how the reference/rights model is built; schema defers RPN semantics back)
            │
        ── shared cross-check step (all four) ──
        Every backed claim is verified against BOTH the docs and the OpenAPI spec
        before it is labeled `backed`. This is the Finn-shaped verifier from the PoC
        (Finn cross-checked the consult's answers against the current OpenAPI spec).
```

**The two wired pairings:**

- **data-lifecycle ⟷ auth/identity** — `_sharing`/`_inheritrights` mechanics (data-lifecycle's lane) and *who is permitted* (auth's lane, via JWT/rights) are the same wire at different layers. A bulk-restrict op (data-lifecycle) that turns on rights semantics (auth) is the exact shape of the esmuseum consult. They must hand off cleanly or the integrator gets a half-answer.
- **formula-engine ⟷ schema-design** — single-hop reference resolution and rights-bypass implications sit on the boundary: formula owns *the RPN behaviour*, schema owns *how the reference/rights model is built such that the behaviour matters*. A "why can my formula read a field it shouldn't?" question crosses this edge.

**The shared verifier (Finn-shaped):** the cross-check against **both docs and OpenAPI spec** is not one agent's job — it is a step every claim passes before earning `backed`. In the PoC this was Finn verifying against the OpenAPI spec; in the productized form it is a verification discipline wired into every claim's `verification` field (§1.2) and re-run at index-refresh time. Docs and OpenAPI can disagree (the #42 PoC surfaced a date-format wire discrepancy → entu/api #41); the cross-check is exactly what catches that, and a disagreement is itself a gap to report.

---

## 6. The manual PoC this productizes (grounding — Finn, Task #1)

The esmuseum-map-app team needed to restrict 6,352 Entu entities ([esmuseum #41](https://github.com/mitselek/esmuseum-map-app/issues/41), the client engagement). The mvox-dev team fielded a 5-question consult: **Pérotin** ran controlled live probes and produced truth tables; **Finn** verified every answer against the current OpenAPI spec. The consult **corrected a wrong mental model** (`_sharing` does not post-creation-inherit; an absent `_sharing` resolves to *default* `private`) that would otherwise have flawed the operation. Phase 2 then executed **6,352 serial `DELETE /property/{_sharing}` ops with 0 errors** (GET-before-DELETE idempotency + checkpoint resume — there is no bulk endpoint, so it was a guarded serial loop).

**The answer shape the consult delivered — the thing to productize:** per question, a *verdict + the mechanism + how-verified + a truth table*, not a bare yes/no. E.g. "Is delete-`_sharing` the idiomatic restrict-at-scale move? → **Yes, but your mental model is wrong** (mechanism: no *post-creation* propagation, but a create-time escalation-only copy exists — both clauses, §4.1; absent → default `private`)"; "Bulk API? → **None**, verified against live OpenAPI today, serial only"; "Future imports? → ⚠️ **test before declaring victory**, here is the create-time truth table." This is exactly the per-claim confidence-labeled, evidence-cited answer §3.2 specifies.

**What flowed back to Entu (the gap-loop in the wild — all still OPEN as of Finn's digest):** a [9-issue docs PR (entu/www #11)](https://github.com/entu/www/pull/11), a [`_sharing` clarification (entu/www #12 → PR #13)](https://github.com/entu/www/pull/13), and a [date-format wire-discrepancy report (entu/api #41)](https://github.com/entu/api/issues/41). Plus a data point *back to the client*: pagination `limit=1000` verified working — bidirectional knowledge flow.

**Three live discrepancies make worked `[GAP]` examples (cite these in any pitch — all surfaced by Finn's grounding). Two are already-filed; the third is the strongest because it is *not yet filed*:**

- **JWT lifetime is contradicted *inside* entu/api itself** — `routes/openapi.get.js` says "48-hour JWT"; `routes/auth/index.get.js`/`refresh.get.js` say "12-hour JWT". In schema terms this is **two `contradicts`-stance evidence entries of comparable rung with no code value to settle them** → the derived confidence is `unverified`/`disputed`, the claim fires `[GAP]`, and the resolution escalates to an apex (Argo) answer (§3.2). The stance rule working: two sources is *less* certain, not more.
- **`date` wire-format** — docs say `YYYY-MM-DD`, API returns full ISO `…T00:00:00.000Z` (already filed: entu/api #41). The docs-vs-OpenAPI disagreement the shared verifier (§5) catches.
- **`DELETE /property` S3 cleanup — the prospective gap-report (the headline demo).** The OpenAPI description claims *"Files are removed from S3,"* but the route (`entu/api routes/[db]/property/[_id]/index.delete.js`) and `utils/aggregate.js` only soft-delete the Mongo property + re-aggregate — **no S3 delete call exists in code** (mvox-dev's file-property-wire-shape note, Finn digest §2). Unlike JWT and date, **this one has *not* been reported to Entu yet.** So it isn't a retrospective example of the loop — it is *exactly the gap report the agent would file next*: a live, prospective gap-loop OUTPUT, sitting in the evidence right now, waiting for the first consult that touches file deletion. That is a stronger proof than the already-surfaced cases, because it shows the loop producing *new* signal, not re-narrating signal a human already produced. In schema terms it is the **code-beats-docs** case (§3a): the claim *"DELETE does not remove from S3"* is `src`-confirmed, the OpenAPI text `contradicts` it → code wins, so the claim is `backed`/`partial` (not disputed) and the OpenAPI desc is the gap to report. The disagreement doesn't weaken the claim; it *names the doc bug* — and Entu decides whether to fix the code or the doc.

Everything in §1–§5 is the *productized* form of what this consult did by hand: the truth tables → backed competency claims (§4.1); Finn's OpenAPI check → the shared verifier step (§5); the docs gap reports → the gap-loop flywheel (§3.4); the manual PO+lead+2-specialist coordination → the container + synergy map that lets the pool dispatch without re-engineering per consult.

**Evidence already has a native shape** (Finn): mvox-dev's verified notes live at `mvox-dev/mvox_v4e_web: docs/migration/findings/*.md` + the aggregating `entu-schema-mutation-handbook.md`, in a *claim + probe-script + result-artifact + ratified-commit + truth-table* format. Cal's index schema mirrors that shape 1:1 rather than inventing one — the productization is mostly *re-housing existing evidence into a queryable index*, not manufacturing it.

---

## 7. Open questions for Argo (first-class — these need an owner's decision)

These are genuine forks where the platform owner's call shapes the architecture. They are not blockers to *specifying* the contract, but they block *operating* it.

1. **Where does `agents/` live?** `entu/api` (next to the code the claims cite)? `entu/www` (next to the docs the gap reports target)? A new dedicated repo (`entu/agents`)? Trade-off: co-locating with code keeps `type: src` evidence refs short and CI-checkable; a separate repo keeps the agent definitions from coupling to the API release cycle.
2. **Who triages the gap reports, and what is the responsiveness expectation?** This is an honest dependency, not a workaround: the flywheel (§3.4) only spins if someone on Entu's side triages and acts on the agents' evidence-backed reports. The agents produce the signal; the loop closes only when Entu acts. So — who owns that triage (Argo, a delegated maintainer)? And what turnaround makes the model worth it? The architecture deliberately does *not* try to compensate for a slow pipeline; it surfaces the question instead.
3. **Probe-derived-claim staleness.** A `probe`-typed claim was true on its verification date; the platform can change under it. The schema (Cal §2) already makes `ttl` *required* on probe-only claims and caps them at `confidence: partial` unless corroborated — so the mechanism exists. The open *policy* question for Argo: what TTL duration, and what triggers a re-probe (API version bump? a fixed cadence?). This is the FR "competency-backend-staleness" open question (topic 10) in its Entu-native form.
4. **MCP backend now or later?** The index can start as flat diffable files (`competencies.yaml` per domain) and graduate to a queryable MCP (arch-docs style) when the volume justifies it. Start file-only (YAGNI, auditable-by-reading) and add the query layer when a second consumer appears? Or stand up the MCP from day one because the agents are themselves the second consumer?
5. **(Secondary) Hosting model.** Are these agent definitions shipped *for integrators to run in their own harness*, or *hosted by Entu as a service*? §3.1 "hire" is written harness-agnostic, but the answer changes who pays for runtime and who audits the index.

---

## 8. Bind-status checklist (for the reviewer)

All inputs landed; the doc is fully bound. (Tasks #1 Finn and #2 Cal both completed.)

| Section | Bound? | Notes |
|---|---|---|
| §0 framing | ✅ | — |
| §1 index spine | ✅ | Cal's schema canonical at `wiki/contracts/entu-competency-index-schema.md` (incl. the schema update: five-rung method ladder, `maintainer-authoritative` apex tier, `stance` field); §1.2 four load-bearing decisions; on-disk layout reconciled |
| §2 container + persona | ✅ | five-element container; persona-anchor guardrail fully specified |
| §3 engagement protocol | ✅ | per-claim **derived** confidence label (stance rule); apex/disagreement/code-beats-docs cases; gap loop = **signal producer (issue-by-default, PR optional upgrade)**, not a remediation service; escalate-to-Argo kept as the separate disputed-claim apex path |
| §4 roster spec | ✅ | Finn's real evidence sources per domain; §4.1 exemplar uses the corrected two-clause `_sharing` claim with real refs |
| §5 synergy map | ✅ | Finn-shaped docs+OpenAPI verifier; date-discrepancy worked example |
| §6 PoC grounding | ✅ | Finn's full artifact trail; JWT + date discrepancies as worked `[GAP]` examples |
| §7 open questions | ✅ | 5 Qs for Argo; #3 notes the schema partially answers the staleness mechanism |

**Reviewer-flagged corrections folded from grounding (worth a second look):**

- **Repo-routing correction** (§4 note): #42's `src/api/*` paths are entu/www *docs*, not entu/api *code* — every evidence ref routes by kind.
- **No bulk endpoint** (§4): "mutation-capable" = guarded serial loop, not a batch call.
- **`_sharing` two-clause subtlety** (§4.1): create-time escalation-only copy AND no post-creation propagation — both clauses required, or the index reproduces a subtler form of the very misconception the PoC corrected.

(*FR:Celes*)
