# Data-Lifecycle Competency Harvest — mvox repo → claim→evidence index

**Session:** S44 · **Task:** #5 · **Author:** Finn · **Date:** 2026-06-06
**Source (read-only):** `mvox-dev/mvox_v4e_web` — all 16 `docs/migration/findings/*.md` + `docs/migration/entu-schema-mutation-handbook.md`.
**Target schema:** `teams/framework-research/wiki/contracts/entu-competency-index-schema.md` (Cal). Each claim conforms to §1 (atomic verifiable assertion), §2 (evidence `{type, ref, stance, excerpt?}`), §2a (five-rung method ladder), §3a (derived-confidence rule), §1 field semantics (`ttl` required for probe-only).
**For:** Celes → folds into `designs/new/entu-consultant-agents/data-lifecycle/competencies.yaml`. Cal → schema-conformance check.

**Honesty note up front:** I harvested only **generalizable Entu platform behaviour**. The mvox repo is ~40% project-specific migration logs (member IDs, v4E type names, ISBN-storage decisions, phase-plan sequencing) — those are NOT Entu competency claims and are deliberately excluded. Where a behaviour is real but thin/perishable/ambiguous I marked it `partial`/`unverified` and listed it in the **FLAGGED GAPS** section for the team-lead's consult-on-gaps decision. No fabrication; no over-claim.

**Claim count: 18 filed claims** — 16 `backed`, 2 `partial` (C12 touch-save-recompute, caveated as gap G1; C16 limit-cap, caveated as gap G2). Plus 2 deliberately-**unfiled** gaps (G3, G4) that are NOT claims — surfaced in FLAGGED GAPS, not counted among the 18. Multi-clause facts split per the schema (e.g. `_sharing` → 2 claims; formula-value-lifecycle → 2 claims).

(*FR:Finn*)

---

## Domain: data-lifecycle — the claims

> All `verifier: finn` entries are this harvest's attribution (I authored/verified the claim against the cited artifact). `verifier` values of `pérotin`/`josquin` mark claims where the *probe* was run by that mvox persona (recorded faithfully — the probe authorship is part of the evidence). `ttl: 2026-09-06` on probe-only claims = 3 months, matching the schema contract's own TTL cadence.

### C1 — POST appends, never replaces (no in-place update)

```yaml
id: post-appends-never-replaces
claim: >
  POST /{db}/entity/{id} APPENDS a property value; it never updates in place.
  To change a value you must DELETE the old value-id, then POST the new one.
domain: data-lifecycle
evidence:
  - type: src
    ref: "entu/api: routes/[db]/entity/[_id]/index.post.js"
    stance: confirms
    excerpt: "Route desc: 'Add properties to an entity. Does not remove existing properties.'"
  - type: probe
    ref: "mvox-dev: docs/migration/findings/entu-mutation-wire-shapes-2026-05-20"
    stance: confirms
    excerpt: "Probe-mutation-ops: 'POST appends. Always DELETE the old value-id before POSTing a replacement.' (ratified 43517ac)"
verification: { method: spec-derived, date: 2026-06-06, verifier: finn }
confidence: backed   # src confirm + probe confirm, no contradicts → §3a rule 4
last-verified: 2026-06-06
status: active
# no ttl — anchored by code (entu/api), not probe-only
```

### C2 — DELETE /property is a soft-delete (reversible)

```yaml
id: delete-property-is-soft-delete
claim: >
  DELETE /{db}/property/{id} soft-deletes a single property value (record retained
  for audit); the entity is re-aggregated automatically. Reversible by re-POSTing the value.
domain: data-lifecycle
evidence:
  - type: src
    ref: "entu/api: routes/[db]/property/[_id]/index.delete.js"
    stance: confirms
    excerpt: "Route desc: 'Soft-delete a property. Entity is re-aggregated automatically. Requires editor rights; rights properties require owner rights. _type cannot be deleted.'"
  - type: probe
    ref: "mvox-dev: docs/migration/findings/entu-mutation-wire-shapes-2026-05-20"
    stance: confirms
    excerpt: "REMOVE: DELETE /property/{id} → {deleted:true}; subsequent GET returns property key absent (not null)."
verification: { method: spec-derived, date: 2026-06-06, verifier: finn }
confidence: backed
last-verified: 2026-06-06
status: active
```

### C3 — No bulk/batch mutation API (serial only)

```yaml
id: no-bulk-mutation-api
claim: >
  Entu has no bulk/batch mutation endpoint. Every property/entity DELETE and every
  entity POST is a single-{id} operation; mutations at scale are serial calls.
domain: data-lifecycle
evidence:
  - type: src
    ref: "entu/api: routes/ (route tree)"
    stance: confirms
    excerpt: "Route tree has only single-{_id} mutation routes; no batch/collection-mutation route exists."
  - type: probe
    ref: "mvox-dev: docs/migration/findings/entu-mutation-wire-shapes-2026-05-20"
    stance: confirms
    excerpt: "Gotcha: 'No bulk DELETE. DELETE /property/{id1},{id2} returns HTTP 500. All deletes are serial.'"
  - type: probe
    ref: "mitselek/esmuseum-map-app#41 (consult reply)"
    stance: confirms
    excerpt: "Verified against live OpenAPI: 'no comma-list, no batch route, no query-scoped mutation. Serial calls only.' (~104k serial DELETEs run in ~87 min on Entu)"
verification: { method: spec-derived, date: 2026-06-06, verifier: finn }
confidence: backed
last-verified: 2026-06-06
status: active
```

### C4 — `_sharing` clause 1: create-time escalation-copy

```yaml
id: sharing-create-time-escalation-copy
claim: >
  At entity CREATION, if a parent's _sharing is public or domain AND the child does not
  itself specify _sharing, Entu copies that value onto the new child (escalation only —
  a parent _sharing of private writes nothing; the child then defaults to private).
domain: data-lifecycle
evidence:
  - type: src
    ref: "entu/api: utils/entity.js (inheritParentProperties)"
    stance: confirms
    excerpt: "needsSharing branch: parentSharings includes 'public' → push _sharing public; else includes 'domain' → push domain; parent 'private' → nothing pushed."
  - type: probe
    ref: "mitselek/esmuseum-map-app#41 (Q4 truth table, Pérotin)"
    stance: confirms
    excerpt: "Create-time rule (verified by controlled probe): parent public/domain → copy materialized on child; parent private/absent → no _sharing written → child defaults private."
verification: { method: spec-derived, date: 2026-06-06, verifier: finn }
confidence: backed
last-verified: 2026-06-06
status: active
```

### C5 — `_sharing` clause 2: no post-creation propagation

```yaml
id: sharing-no-post-creation-propagation
claim: >
  After creation, no mechanic propagates _sharing. An entity with no explicit _sharing
  resolves to the DEFAULT private regardless of its parent's value; _sharing is NOT
  inherited via _inheritrights (only _viewer/_expander/_editor/_owner inherit).
domain: data-lifecycle
evidence:
  - type: src
    ref: "entu/api: utils/entity.js (setEntity allowlist) + utils/rights.js (getParentRights)"
    stance: confirms
    excerpt: "_sharing and _inheritrights are separate allowlisted types; getParentRights inherits only _noaccess/_viewer/_expander/_editor/_owner — _sharing is absent from the inherit set."
  - type: probe
    ref: "mitselek/esmuseum-map-app#41 (Pérotin truth table)"
    stance: confirms
    excerpt: "parent private + child _sharing deleted + _inheritrights → child 403 (hidden) because absent resolves to default private, NOT because it inherited."
  - type: docs
    ref: "entu/www: PR #13 (closes #12)"
    stance: confirms
    excerpt: "'_sharing is not propagated via _inheritrights; an entity with no explicit _sharing defaults to private regardless of its parent's setting.'"
verification: { method: spec-derived, date: 2026-06-06, verifier: finn }
confidence: backed
last-verified: 2026-06-06
status: active
# NOTE: C4+C5 are the two-clause split. The mvox handbook §1.5 one-liner states only C5
#       and is over-absolute (drops C4). Filed as two claims so neither clause hides.
```

### C6 — `_sharing` value is constrained to three strings

```yaml
id: sharing-value-enum
claim: >
  _sharing accepts exactly one of: public | domain | private. Any other value is
  rejected with HTTP 400.
domain: data-lifecycle
evidence:
  - type: src
    ref: "entu/api: utils/entity.js (validatePropertyTypes)"
    stance: confirms
    excerpt: "if _sharing && !['public','domain','private'].includes(string) → 400 'Property _sharing value must be public, domain or private'."
verification: { method: spec-derived, date: 2026-06-06, verifier: finn }
confidence: backed
last-verified: 2026-06-06
status: active
```

### C7 — Parent→child rights cascade via `_inheritrights`

```yaml
id: rights-cascade-via-inheritrights
claim: >
  When a child has _inheritrights: true, it inherits _owner/_editor/_expander/_viewer
  from its _parent(s); multi-parent rights are a UNION, materialized, with inherited
  entries flagged inherited:true, and _noaccess subtracts.
domain: data-lifecycle
evidence:
  - type: src
    ref: "entu/api: utils/rights.js (getParentRights, combineRights)"
    stance: confirms
    excerpt: "getParentRights merges _viewer/_expander/_editor/_owner across parents (union), marks inherited:true; combineRights removes _noaccess references."
  - type: probe
    ref: "mvox-dev: docs/migration/findings/org-rights-cascade-audit-2026-05-21"
    stance: confirms
    excerpt: "Live audit over 6 real orgs + sections + members: _inheritrights:false at org boundary isolates; sections/members inside inherit within the boundary. Cascade verdict CLEAN."
verification: { method: live-audit, date: 2026-05-21, verifier: pérotin }
confidence: backed   # src confirm + live-audit (rung 4) confirm
last-verified: 2026-06-06
ttl: 2026-09-06   # carries a probe; TTL per schema §1 (probe evidence present)
status: active
```

### C8 — `_inheritrights` change on a TYPE entity does not retro-apply to instances

```yaml
id: inheritrights-type-vs-instance
claim: >
  Setting _inheritrights (or any system property) on a TYPE entity affects the type
  entity only — existing and future instances carry their own _inheritrights set at
  their creation. Retroactively changing instances requires a per-instance update pass.
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/entu-schema-mutation-handbook (§1.5) + findings/org-rights-cascade-audit-2026-05-21 (Part 2 YELLOW-D4)"
    stance: confirms
    excerpt: "'organization TYPE entity has _inheritrights=true (explicitly set) → every new instance born with true, requiring a manual flip on each. Sub-op 5 only fixed the 6 existing instances.'"
  - type: src
    ref: "entu/api: utils/entity.js (inheritParentProperties)"
    stance: confirms
    excerpt: "Create-time inheritance reads PARENT entities, not the TYPE entity, for _inheritrights/_sharing — confirming type→instance does not propagate these at runtime."
verification: { method: live-audit, date: 2026-05-21, verifier: pérotin }
confidence: backed
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
```

### C9 — Formula values are virtual (no per-value `_id`)

```yaml
id: formula-values-have-no-id
claim: >
  A formula-computed property value has no per-value _id in the entity payload (unlike
  a regular property value, which always carries an _id). There is no formula property
  value on the instance to address directly.
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-api-probes-2026-05-20 (Q2, Josquin)"
    stance: confirms
    excerpt: "member_count_per_section:[{number:0}] and member_count:[{number:50}] — NO _id, vs name:[{_id,string}] which has one."
verification: { method: live-probe, date: 2026-05-20, verifier: josquin }
confidence: backed   # probe confirm, clean truth table; TTL'd per §2a rung 3
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
```

### C10 — Formula values are nonetheless PERSISTED, not recomputed on every read

```yaml
id: formula-values-persisted-not-live
claim: >
  Despite having no _id, a materialized formula value is PERSISTED on the instance and
  survives deletion of its source property — it is NOT recomputed on every read. It
  re-evaluates only on a write to the instance (any non-formula property POST) or a
  formula-expression change on the prop-def.
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-api-probes-2026-05-20 (Q4, Josquin)"
    stance: confirms
    excerpt: "DELETE source forename → name STILL 'Test User' (materialized value survived source deletion). Contradicts the naive 'virtual read' inference from Q2."
verification: { method: live-probe, date: 2026-05-20, verifier: josquin }
confidence: backed
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
# NOTE: C9+C10 are a deliberate two-clause split — "no _id" (C9) and "yet persisted" (C10)
#       are independently surprising and the second corrects the naive reading of the first.
```

### C11 — Direct write to a formula property is silently dropped

```yaml
id: formula-property-not-directly-writable
claim: >
  POSTing a value directly to a formula property returns 200 (a new property _id is
  issued) but the formula immediately re-evaluates against current sources and
  overwrites the direct value — net effect: direct writes to formula properties are
  silently dropped.
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-api-probes-2026-05-20 (Q5, Josquin)"
    stance: confirms
    excerpt: "POST name=OverrideName → 200 + new _id; subsequent GET name=[{string:'Test User'}] — direct write rejected by formula re-eval."
verification: { method: live-probe, date: 2026-05-20, verifier: josquin }
confidence: backed
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
```

### C12 — Touch-save: POST any non-formula property to trigger formula recompute

```yaml
id: touch-save-via-nonformula-post
claim: >
  Because formula values have no addressable _id, the way to trigger formula
  recomputation on an instance is to POST any non-formula property value back to it;
  Entu re-evaluates dependent formulas as part of the write/save path.
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-api-probes-2026-05-20 (Q2, Josquin)"
    stance: confirms
    excerpt: "POST re-asserted name → 200, new prop _id; mechanism: 'POST any non-formula property; Entu re-runs formula evaluation as part of the write.'"
verification: { method: live-probe, date: 2026-05-20, verifier: josquin }
confidence: partial   # see honesty note below
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
# HONESTY DOWNGRADE to partial: the probe could NOT observe the recompute end-to-end (the
# dependent formula was broken at probe time → value stayed 0 regardless). The mechanism
# (POST triggers re-eval) is a REASONABLE INFERENCE the author flagged as needing definitive
# validation post-fix. Backed on "POST succeeds + rotates _id"; partial on "triggers recompute."
```

### C13 — Property filter `.string=` is exact, case-sensitive, NFC-required

```yaml
id: string-filter-exact-case-sensitive-nfc
claim: >
  The query filter <prop>.string=<value> is an EXACT, case-sensitive match with no
  substring matching, and the value must be NFC-normalized (NFD-encoded chars return 0).
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-api-probes-2026-05-20 (Q3, Finn)"
    stance: confirms
    excerpt: "name.string=Soprano → 1; name.string=soprano → 0; name.string=Bas → 0 (no substring). NFD-encoded chars return 0 — clients must NFC-normalize."
  - type: docs
    ref: "entu/www: src/api/query-reference"
    stance: confirms
    excerpt: "Documented {property}.string= and {property}.string.regex= / .in= filter operators."
verification: { method: live-probe, date: 2026-05-20, verifier: finn }
confidence: backed   # probe confirm + docs confirm (operator existence)
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
```

### C14 — Free-text `q=` is case-insensitive substring across all string props

```yaml
id: q-search-substring-case-insensitive
claim: >
  The q=<term> query param is a case-insensitive substring/prefix search across all of
  an entity's string properties (distinct from the exact .string= filter); it returns
  full entities and does not honor props= exclusion.
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-api-probes-2026-05-20 (Q3, Finn)"
    stance: confirms
    excerpt: "q=Soprano and q=soprano both count=3; q=sop returns all 3 (substring); returns full entities."
  - type: docs
    ref: "entu/www: src/api/query-reference"
    stance: confirms
    excerpt: "Documented q= search-query parameter."
verification: { method: live-probe, date: 2026-05-20, verifier: finn }
confidence: backed
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
```

### C15 — Pagination is offset-only (`skip`+`limit`); envelope carries total `count`

```yaml
id: pagination-offset-only-with-count
claim: >
  Entu pagination is offset-based via skip + limit only (no cursor, no next URL). Every
  list response is { entities, count, limit, skip } where count is the TOTAL matching
  corpus size (not page size), usable to compute total pages from the first request.
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-api-probes-2026-05-20 (Q1, Finn)"
    stance: confirms
    excerpt: "{entities, count, limit, skip}; count=28 total across pages; 'skip + limit is the only pagination method', no next URL, no _id-cursor."
  - type: docs
    ref: "entu/www: src/api/query-reference"
    stance: confirms
    excerpt: "Documented limit (default 100) + skip (default 0) query params."
verification: { method: live-probe, date: 2026-05-20, verifier: finn }
confidence: backed
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
```

### C16 — `limit` default is 100; no silent cap observed (verified to 1000)

```yaml
id: limit-default-100-no-observed-cap
claim: >
  The list limit defaults to 100 and Entu does not silently cap it — it echoes the
  requested limit. No cap observed up to limit=1000 (mvox verified to 500; esmuseum
  verified 1000 against a separate large account).
domain: data-lifecycle
evidence:
  - type: docs
    ref: "entu/www: src/api/query-reference + entu/api: routes/[db]/entity/index.get.js"
    stance: confirms
    excerpt: "OpenAPI param: limit, integer, default 100."
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-api-probes-2026-05-20 (Q1, Finn)"
    stance: confirms
    excerpt: "limit=500 → all 28 returned, 'no error, no cap — Entu does NOT silently cap limit'; 'no documented max'."
  - type: probe
    ref: "mitselek/esmuseum-map-app#41 (client data-point back)"
    stance: confirms
    excerpt: "Client ran limit=1000 GETs against a 6,352-entity account, full clean pages, no issue."
verification: { method: live-probe, date: 2026-05-20, verifier: finn }
confidence: partial   # see note
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
# HONESTY: "default 100" is backed (openapi). "no cap" is probe-only and bounded — no DOCUMENTED
# ceiling, observed clean to 1000 on real data but never stress-tested beyond. partial on the
# "no cap at arbitrary scale" portion; a large-N account should probe before relying on >1000.
```

### C17 — All non-formula properties are implicitly multi-valued (the append trap)

```yaml
id: properties-implicitly-multivalue
claim: >
  Every non-formula property is implicitly multi-valued: POSTing a value to a property
  that already has one ADDS a second value rather than replacing it. To set a single
  value you must DELETE all existing values first. (This is the operational face of C1.)
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-api-probes-2026-05-20 (Q5, Josquin)"
    stance: confirms
    excerpt: "POST forename=Changed to entity with forename=Test → forename=[Test, Changed] (two values); formula then concatenated both → 'TestChanged User'."
verification: { method: live-probe, date: 2026-05-20, verifier: josquin }
confidence: backed
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
```

### C18 — `DELETE /property/{id}` 404s on a property-DEFINITION; use `DELETE /entity/{id}`

```yaml
id: property-def-deleted-via-entity-endpoint
claim: >
  A property DEFINITION is an entity, not a property value. DELETE /{db}/property/{id}
  returns 404 for a prop-def _id; prop-defs (and entity types) must be deleted via
  DELETE /{db}/entity/{id}. The /property endpoint addresses property VALUES only.
domain: data-lifecycle
evidence:
  - type: probe
    ref: "mvox-dev: docs/migration/findings/phase-b-execution-diagnostics-2026-05-20"
    stance: confirms
    excerpt: "DELETE /property/{propdef-id} → 404 universally (19 ops left targets present); DELETE /entity/69c7ea53...062 → 200 {deleted:true} deleted the prop-def. Wire shape was wrong."
verification: { method: live-probe, date: 2026-05-20, verifier: josquin }
confidence: backed
last-verified: 2026-06-06
ttl: 2026-09-06
status: active
```

---

## FLAGGED GAPS — consult-on-gaps candidates (team-lead decision)

These are where the repo evidence is **thin, perishable-without-corroboration, or self-flagged as needing validation**. Per the honesty gate I did NOT promote them to `backed`. They are the only cases where going back to the (dormant) mvox team — or running a fresh probe — would add real value.

| # | Claim (downgraded) | Why flagged | What would close it |
|---|---|---|---|
| G1 | **C12 — touch-save triggers recompute** (`partial`) | The probe could not observe the recompute end-to-end (dependent formula broken at probe time); author Josquin explicitly flagged "definitive validation will come after the formula fix lands." Mechanism is inference, not observation. | A fresh probe: touch-save POST → read shows the recomputed non-zero value. mvox may already have this post-Phase-B. |
| G2 | **C16 — no limit cap at arbitrary scale** (`partial`) | Observed clean only to 1000, on two accounts; "no documented max." The "no cap" generalization is unbounded-from-evidence. | A large-N probe (>1000) on a big account, OR a maintainer-authoritative answer from Argo on the real ceiling. |
| G3 | **`_inheritrights` create-time default source** (`unverified` — NOT filed as a claim above) | The handbook says new instances are "born with the type's `_inheritrights`," but C8's code reading shows create-time inheritance reads the PARENT, not the TYPE. These may both be true via different paths (type as default_parent?) but the repo does not resolve HOW a fresh instance gets its initial `_inheritrights` when no parent sets it. | Code-trace of `createEntityRecord` defaults + a create probe with a bare entity. Candidate Argo question. |
| G4 | **Rate-limiting / 429 behaviour** (`unverified` — NOT filed) | esmuseum consult says "no rate limits / 429 — none documented, probe saw no throttling" but this is absence-of-evidence at modest throughput (~8 calls/sec). No positive confirmation of behaviour under high concurrency. | A concurrency probe, or a maintainer statement. Don't file as a `backed` "no rate limits" claim — that's exactly the over-claim the gap-loop guards against. |

**G3 and G4 are deliberately NOT in the 18 claims** — filing them as claims would require asserting something the evidence doesn't support. They are surfaced here as questions, not claims. This is the honesty gate doing its job: the absence of a claim is a visible gap (per the citation-backed pattern), not a silent omission.

---

## Harvest provenance (what I read, what I excluded)

**Read in full (behaviour-bearing):** `entu-mutation-wire-shapes`, `entu-formula-unwrap`, `entu-api-key-expiry` (auth domain — handed to auth, not data-lifecycle), `file-property-wire-shape`, `org-rights-cascade-audit`, `phase-b-api-probes` (Q1–Q5), `phase-b-execution-diagnostics`, `type-name-string-sweep`, plus `entu-schema-mutation-handbook` §1/§1.5.

**Scanned and EXCLUDED as project-specific (not generalizable Entu behaviour):** `phase-b-1-diagnostic`, `phase-c-discovery`, `phase-c-preflight`, `seeding-source-plan`, `section-voice-types`, `menu-items-per-entity-type-design`, `v4e-rename-avatar-logo-to-photo`, `2026-05-23-librarian-seed-strategy`. These are mvox v4E migration logs (member IDs, type-name canonical lists, ISBN-storage decisions, menu-ordering schemes). Real work, but not Entu platform competency.

**Cross-domain notes routed elsewhere (not data-lifecycle):**

- `entu-api-key-expiry` (SHA-256 keys, JWT 12h-vs-48h, IP-binding, OAuth) → **auth** domain. The JWT-lifetime contradiction is the schema's canonical `disputed`/apex worked example (§2b) — auth-domain author should file it with the `stance: contradicts` pair.
- `file-property-wire-shape` straddles data-lifecycle and a **files** sub-area. The S3-orphan finding (DELETE /property does not remove the S3 object, contradicting the OpenAPI desc) is the schema's `src`>`docs` precedence worked example (§3a rule 3 exception) — I left it for the files/data-lifecycle author to file as a `src`-confirms + `openapi`-contradicts claim, since it's a clean gap-loop instance. Two-step upload flow + 60s TTL + `_thumbnail`=full-photo are filed-able data-lifecycle/files claims if the roster includes a files persona; flagged here so they aren't lost.

(*FR:Finn*)
