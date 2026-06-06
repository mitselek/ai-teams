# Entu Consultant-Agents — Grounding Findings Digest

**Session:** S44 · **Author:** Finn (Research Coordinator) · **Date:** 2026-06-06
**Purpose:** Ground the consultant-agents spec (Celes) and competency-index schema (Callimachus) in real artifacts, not guesses. This is **grounding, not design** — it gathers and structures evidence; it does not decide the architecture.
**Scope discipline:** read-only on all external repos (`gh`/API reads only; no writes to `entu/*` or `mvox-dev/*`).

> Note on a key correction to topic-10 / #42's path sketch: entu/api is **not** laid out as `src/api/formulas`. It is a **Nitro/h3 file-routed server** — endpoints live under `routes/`, shared logic under `utils/`. The `src/api/...` paths that #42 cites are **docs paths in entu/www** (the VitePress site), not code paths. The spec must cite the right repo for each kind of evidence: behaviour → entu/api `utils/*`; documented contract → entu/www `src/api/*`.

(*FR:Finn*)

---

## 1. entu/api — real repo layout + endpoint/behaviour surface for the four domains

**Repo shape:** Nitro server, default branch `main`. File-based routing.

| Real path | What it is |
|---|---|
| `routes/[db]/entity/index.get.js` | List/query entities (the query-reference surface) |
| `routes/[db]/entity/index.post.js` | Create entity |
| `routes/[db]/entity/[_id]/index.{get,post,delete}.js` | Read / add-properties / delete one entity |
| `routes/[db]/entity/[_id]/{aggregate,duplicate,history}.{get,post}.js` | Computed-property aggregate, duplicate, change history |
| `routes/[db]/property/[_id]/index.{get,delete}.js` | Read / soft-delete one property value |
| `routes/auth/{index,[provider],refresh,passkey}.*.js` | Auth: API-key/session exchange, OAuth, JWT refresh, WebAuthn |
| `routes/graphql/[db].{get,post}.js` | GraphQL endpoint (hidden from public OpenAPI) |
| `routes/openapi.get.js` | The published OpenAPI spec assembler |
| `utils/entity.js` | `setEntity` — validation, defaults, inheritance, create/insert |
| `utils/rights.js` | `getParentRights`, `combineRights`, `getAccessArray` — the rights engine |
| `utils/formula.js` | Strict-RPN formula engine |

**OpenAPI:** live at `https://api.entu.app/openapi`; assembled by `routes/openapi.get.js`. Server URL `https://api.entu.app`. Auth scheme advertised: **Bearer JWT only**. Tags: Authentication, Database, Entity, Property. GraphQL + `_*` internal routes are **excluded** from the public spec.

### Domain A — data-lifecycle (entity CRUD, `_sharing`/`_inheritrights`, bulk, import)

Ground truth from `utils/entity.js::setEntity` and `routes/`:

- **No in-place update. `POST /{db}/entity/{id}` *appends* a property value** — route desc verbatim: *"Add properties to an entity. Does not remove existing properties."* To change a value: `DELETE` the old value-id, then `POST` the new one (two ops).
- **`DELETE /{db}/property/{id}` is a soft-delete** — desc: *"Soft-delete a property … Entity is re-aggregated automatically. Files are removed from S3. Requires editor rights; rights properties require owner rights. `_type` cannot be deleted."* Reversible by re-POSTing.
- **No bulk/batch endpoint exists.** The route tree has only single-`{id}` mutation routes. Confirmed independently by two teams' live probes (404 on `/properties`, HTTP 500 on comma-list DELETE).
- **Allowed system property types** (`setEntity` allowlist): `_type, _parent, _noaccess, _viewer, _expander, _editor, _owner, _sharing, _inheritrights`. User properties may not start with `_`.
- **`_sharing` validation:** value must be one of `public | domain | private`.
- **Create-time inheritance (`inheritParentProperties`)** — THE mechanism behind the `_sharing` correction (see §3/§5):
  - Runs **only at entity creation**, and only when the child doesn't already specify the property.
  - `_sharing`: if any parent is `public`, child gets `public`; else if any parent is `domain`, child gets `domain`. **A parent `private` writes nothing** → child resolves to default `private`. So inheritance only ever *escalates* visibility, never restricts, and only at birth.
  - `_inheritrights`: copied as `true` only if a parent has it `true`.
- **`applyDefaultParents`:** the entity type's `default_parent` is auto-added as an extra `_parent` at create.
- **`applyPropertyDefaults`:** prop-defs with a `default` value seed it on create; supports **relative server-date offsets** `+1d / -2h / +1w / +1m / +1y` (`resolveServerDate`).
- **Create-time rights check on `_parent`:** the creating user must be in the parent's `_expander` (or be system user), else 400.

### Domain B — auth/identity (JWT, OAuth, API keys, refresh)

From `routes/auth/*`:

- **API key → JWT exchange** at `GET /auth`. Permanent API keys are **SHA-256 hashed**; temporary OAuth/passkey session tokens also accepted. Optional `db`/`account` scopes auth to one database; `invite` JWT can be accepted during auth.
- **JWT lifetime — DISCREPANCY (flag for index):** `routes/openapi.get.js` top-level description says **"48-hour JWT"**; `routes/auth/index.get.js` + `refresh.get.js` descriptions say **"12-hour JWT"**. The mvox handbook also says 48h. The two in-repo strings disagree — the index must not pin a number without a live probe.
- **JWT is IP-bound.** `refresh.get.js` re-validates IP. A changing egress IP (VPN/serverless) → `401 Invalid JWT audience`, requires full re-auth.
- **Refresh refusal cases:** token not refreshed in >14 days, OR original auth >30 days old → both require full re-authentication.
- **OAuth** via OAuth.ee. `provider` enum: `e-mail, google, apple, smart-id, mobile-id, id-card`. Flow: redirect → code exchange → match/create person entity → temporary session token → exchange at `/auth`.
- **WebAuthn passkey** routes present (`routes/auth/passkey.*`, `routes/[db]/passkey.*`).

### Domain C — formula-engine (RPN, single-hop, rights bypass)

From `utils/formula.js` (code-confirmed, not just docs):

- **Strict RPN, single value stack, left-to-right.** A "slot" is an array of values (Entu properties are multi-value). Operators: variadic reducers (`arity:'all'`, consume whole stack), fixed-arity, per-value.
- **Implicit `CONCAT`** appended if the formula doesn't end on a recognized operator.
- **Single-hop references confirmed in code:** token resolution caps at `strParts.length === 3` (`ref.type.property` / `ref.*.property`). Field kinds: same-entity, `propertyName.*.prop` / `propertyName.type.prop` (referenced entities), `_child.*`, `_parent.*`, `_referrer.*`. No deeper chaining.
- **Rights bypass confirmed in code:** formula field resolution queries Mongo with a direct `private.*` projection — it does **not** apply the `getAccessArray`/`combineRights` filter. So a formula can aggregate over values the requesting user couldn't read directly. (entu/www flags this: *"safe for aggregates, not raw projection."*)
- **`_referrer`** excludes system reference properties (`_parent/_owner/_editor/_viewer/_expander`) — only user-defined `reference` props count.
- **Output is always scalar/string-coerced**, never a reference (ObjectId → `String()`).
- **Re-aggregation is eventually consistent** for `_referrer`/`_child` formulas (queued, may not land in the same request).

### Domain D — schema-design (entity types, `reference_query`, `add_from`/`default_parent`, rights)

"**Type is just an entity**" — entity types and prop-defs are themselves entities, mutated via the same `POST /entity` + `DELETE /entity/{id}` endpoints. From entu/www `src/configuration/entity-types/` + handbook §1:

- **`add_from`** — controls where a type may be created (reference a menu / an entity type / a specific entity). Unset → the type can't be created via UI.
- **`default_parent`** — auto-added as an extra `_parent` on create (matches `applyDefaultParents` in code).
- **`reference_query`** — a **static** filter string (e.g. `_type.string=person`) limiting which entities are selectable in a `reference` field. (entu/www #5: "static filter".)
- **Type-level `_sharing` is a *projection cap*, not instance access:** the type's `_sharing` caps which property values can be projected into domain/public responses; it does **not** make instances accessible. Instance-level `_sharing` governs instance accessibility. (Well-documented now — likely PR #11/#13's contribution.)
- **Rights model:** `_noaccess > _owner > _editor > _expander > _viewer`; `_noaccess` subtracts. `_expander` = "can add children." Parent→child rights cascade via `_inheritrights:true` (union across multiple parents, materialized, eventually consistent, entries flagged `inherited:true`).

---

## 2. entu/www — docs structure: documented vs gap (the gap-loop targets)

VitePress site, default branch `main`, **bilingual** (English `src/`, Estonian mirror `src/et/`).

**Documented API surface** (`src/api/`): `authentication`, `best-practices`, `files`, `formulas`, `properties`, `query-reference`, `quickstart`.
**Configuration** (`src/configuration/`): `entity-types`, `menus`, `plugins`, `users`, `best-practices`.
**Overview** (`src/overview/`): `entities`, `properties`, `authentication`. Plus `db-mutations`, `changelog`, `examples`, `terms`.

**Documented well (post-PoC):** RPN formula semantics incl. single-hop, scalar output, rights-bypass warning, `CONCAT_WS`; `_sharing` type-cap-vs-instance-access; rights-property delete requirements; `add_from`/`default_parent`/`reference_query`. Much of this depth traces to the PoC's own PR #11.

**Known live gaps / discrepancies (gap-loop targets):**

- **`_sharing` non-inheritance** — the single most-hit misconception (two independent teams). entu/www **#12 open → PR #13 open** adds the explicit one-liner. Not yet merged.
- **`date` wire-format** — docs say `YYYY-MM-DD`, API returns full ISO `…T00:00:00.000Z`. **entu/api #41 open**, no docs fix yet.
- **`DELETE /property` S3 cleanup** — the OpenAPI desc claims *"Files are removed from S3"* but the route (`entu/api routes/[db]/property/[_id]/index.delete.js`) only soft-deletes the Mongo property + re-aggregates; there is **no S3 delete call** in the route or `utils/aggregate.js`. A `src`-read that **contradicts** the published spec. Found by mvox-dev (file-property-wire-shape note, session 18); not yet filed as an entu issue. *(Third confirmed doc↔code discrepancy, alongside JWT-lifetime and date-format — these are the gap-loop's worked examples.)*
- **Estonian mirror lag** — PR #11 deliberately left `src/et/` untouched; bilingual drift is a standing gap class.
- **PRs not yet merged** — #11 (9 issues) and #13 are **OPEN** as of this digest. The "13/14 PRs merged" track record (#42) is the integrator's *own* history; these specific Entu-facing PRs are still pending Argo. (Matches #42's observation that entu issues/PRs sit unanswered 2–3 wks.)

---

## 3. The PoC artifacts — what the consult did + what flowed back

The manual PoC is the **lived template** for the productized pattern. Full trail:

| Artifact | Role in the consult |
|---|---|
| **esmuseum-map-app #41** (CLOSED) | The **client engagement**. Client posted a 5-question consult request (bulk-restrict 6,352 entities). mvox-dev answered with a verified, probe-backed reply. Phase 2 executed: **6,352 `DELETE /property/{_sharing}` ops, 0 errors**, GET-before-DELETE idempotency + checkpoint resume. |
| **entu/www PR #11** (OPEN) | **9 behaviour notes → one docs PR**, each mapped to a numbered issue (#2–#10). The gap-detection loop's *output*: doc text already written (PR, not issue). |
| **entu/www #12 → PR #13** (OPEN) | The `_sharing`-not-inherited clarification — the exact misconception the consult corrected, filed as a docs fix. |
| **entu/api #41** (OPEN) | The `date`-format wire discrepancy report — a found-during-build bug, filed with full reproduction. |

**What the consult actually delivered (the answer shape to productize):** per question, a verdict + the *mechanism* + *how-verified* + a truth table. Examples:

- *"Is delete-`_sharing` the idiomatic restrict-at-scale move?"* → **Yes, but your mental model is wrong:** `_sharing` is not inherited; absent `_sharing` resolves to **default** `private`. (Mechanism matters for predicting future imports.)
- *"Bulk API?"* → **None.** Verified against live OpenAPI today; serial only. (Anchored with: "we once ran ~104k serial DELETEs in ~87 min.")
- *"DELETE vs overwrite?"* → **Plain DELETE** — halves the work (6,352 not 12,704); soft-delete = reversible.
- *"Future imports?"* → ⚠️ **test before declaring victory** — gave the create-time truth table, flagged the importer-re-stamps-`public` risk.
- *"Scale/safety?"* → no rate limits (~8 calls/sec ≈ 13 min), **idempotency must guard** (`DELETE` of already-deleted → 404), JWT IP-bound, `limit=1000` probe-first.

**What flowed back to Entu (the gap-loop in the wild):** 9-issue docs PR (#11) + `_sharing` clarification (#13) + date wire-bug (api #41). And a **data point back to the client**: `limit=1000` pagination verified working (client confirmed it for mvox in return). Bidirectional knowledge flow.

**My own role in the PoC (for prompt grounding):** the consult attribution lines name **Finn = API/docs verification** (verified answers against the current OpenAPI) and **Pérotin = live controlled probes**. The data-lifecycle "specialist" and the "docs/API reference specialist" of #42 are these two real roles.

---

## 4. mvox-dev's verified Entu behaviour notes — FORMAT + location (so the index schema mirrors real evidence shapes)

**Location:** `mvox-dev/mvox_v4e_web` (public GitHub repo, PO-owned org), at `docs/migration/findings/*.md`, plus the aggregating `docs/migration/entu-schema-mutation-handbook.md`. (NOT under `teams/mvox-dev/` — that subtree holds team config; the evidence lives at repo-root `docs/migration/`.) Reachable read-only via `gh api`.

**The corpus** (~16 finding files; the "~25 notes" are the discrete claims *inside* them). Entu-behaviour-bearing ones:
`entu-mutation-wire-shapes`, `entu-formula-unwrap`, `entu-api-key-expiry`, `file-property-wire-shape`, `org-rights-cascade-audit`, `phase-b-api-probes`, `type-name-string-sweep`, `section-voice-types` — plus phase diagnostics and seed/migration-specific notes.

**The verified-behaviour-note FORMAT (this is the evidence shape the index schema should mirror):**

```text
# <Title> — Live-Verified <YYYY-MM-DD>

**Probe:** scripts/migrations/probes/<probe>.ts          ← the executable that proved it
**Result artifact:** scripts/migrations/seed-results/<run>.json  ← captured raw output
**Architecture-decisions entry:** <git-sha> — "<summary>"  ← the ratified backing commit

## Question            ← the precise claim under test (one falsifiable question)
## Probe setup         ← throwaway entities, exact fixtures
## Results             ← a STEP | OP | RESULT table with REAL ids + read-backs
## Conclusions         ← numbered claims, each tied to a result row
## Gotchas / Implications
(*MVOX:<author>*)      ← attribution (Pérotin = probes, Finn = docs/API)
```

**Three evidence-strength tiers visible in the corpus** (useful for the index's confidence field):

1. **Live-probe-verified** — has a probe script + result JSON + truth table (e.g. mutation-wire-shapes, formula-unwrap). Strongest.
2. **Live-audit-verified** — probe-script audit over real data with a per-row table (org-rights-cascade-audit). Strong, observational.
3. **Handbook-asserted** — synthesized in the handbook's §1.5 conceptual model, citing the probes above. Source-of-truth narrative.

**The handbook (`entu-schema-mutation-handbook.md`) is the closest thing to a competency-backend already built:** a "living document, all operations live-tested," **mirrored to Brilliant KB** (`Resources/mvox/entu-schema-mutation-handbook`). Its **§1.5 "What Propagates, What Doesn't"** is the canonical mental model for the data-lifecycle agent: type→instance propagates *nothing at runtime*; parent→child cascades rights via `_inheritrights`; formulas materialize at save; `_sharing` lives only on the bearing entity.

**One nuance to hand the spec authors (don't let the index over-state it):** handbook §1.5 says "`_sharing` … no mechanic propagates it — not type→instance, not parent→child." That is true *post-creation* (read-time), which is what the esmuseum correction was about. But the entu/api **create-time** code (`inheritParentProperties`) *does* copy a parent's `public`/`domain` `_sharing` onto a new child. The esmuseum Q4 answer states this correctly ("materializes a copy at create time"); the handbook's one-liner is slightly more absolute than the code. **Resolution for the index: `_sharing` has a create-time escalation-only copy AND no post-creation propagation — both clauses needed, or the index will reproduce a subtler version of the very misconception the PoC corrected.** This is itself a candidate gap-loop entry.

---

## Cross-cutting observations for the spec authors (grounding, not design)

1. **Evidence already has a native shape** — claim + probe-script + result-artifact + ratified-commit + truth-table. The competency-index schema (Task #2) can mirror this 1:1 rather than invent a format. (Note for Callimachus: the user's standing preference is flat ordered lists where each entry maps 1:1 to a tool operation — the finding-note's STEP|OP|RESULT table already fits that grain.)
2. **Backing types are heterogeneous** — code path (entu/api `utils/*`), documented contract (entu/www `src/api/*`), live-probe artifact (mvox JSON), ratified commit. The index's "source" field needs to express all four, and they have different staleness profiles (code = authoritative; docs = may lag/contradict; probe = point-in-time).
3. **Live discrepancies are real and current** — JWT 12h-vs-48h (in-repo contradiction), `date` wire-format (docs-vs-API). These are exactly the `[GAP]`/unverified-claim cases the gap-loop exists to catch; the spec can cite them as worked examples.
4. **The four #42 domains map cleanly to the four evidence sources** found here — data-lifecycle ↔ handbook §1.5 + entity.js; auth ↔ routes/auth; formula ↔ utils/formula.js + formulas docs; schema ↔ entity-types docs + "type-is-entity" handbook §1.
5. **PRs-merge / issues-stall asymmetry is confirmed live** — #11/#13/api-#41 all still OPEN. The gap-loop-emits-PRs-not-issues argument in #42 is well-founded; the index should treat "filed as PR" vs "filed as issue" as a real disposition field.

---

*Grounding complete. Hand-offs: §1/§3 → Celes (spec author). §4 + cross-cutting #1/#2 → Callimachus (index-schema designer). Discrepancies in §1.B/§2 → gap-loop worked-examples.*

(*FR:Finn*)
