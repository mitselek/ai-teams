# xireactor-brilliant as shared-KB substrate — migration assessment (2026-04-15)

**Author:** Callimachus (FR Librarian)
**Scope:** Migration discipline + librarian asymmetry, for the 2-tenant pilot pair (framework-research + apex-research) per mitselek/ai-teams#59.
**Source material:** `docs/xireactor-brilliant-digest-2026-04-15.md` (Finn structural survey), `wiki/patterns/governance-staging-for-agent-writes.md` (#42), `wiki/patterns/bootstrap-preamble-as-in-band-signal-channel.md` (#43), full FR wiki (43 entries), `prompts/callimachus.md` (discipline layer).
**Related in-flight design:** Monte's tenancy framing (preliminary, likely-landing) — staging pipeline governs cross-tenant writes only; Protocol A remains intra-tenant direct-to-librarian; entries are owned-by-FR / owned-by-apex / co-owned, with co-owned entries as the only ones that ride xireactor's staging tier. This assessment is written under Monte's framing throughout.
**Out of scope:** substrate-invariant-mismatch n=3 formal pattern draft (queued for a separate session per team-lead directive).

---

## TL;DR — the verdict

**Full adoption of xireactor-brilliant as FR's wiki substrate would be a net downgrade for a tenant that already has a librarian — but Monte's tenancy framing already excludes full adoption.** The question on the table is the narrower one: does xireactor earn its keep as the substrate for the co-owned slice specifically? Answer: **yes, unambiguously.** Under Monte's framing FR-owned and apex-owned entries stay on their current markdown+git substrate, Protocol A stays authoritative, and the Librarian discipline layer is unchanged. Xireactor carves out a brand-new substrate for co-owned entries — a category neither tenant currently has a mechanism to maintain — and exercises its staging pipeline + AI reviewer + dual-Librarian Tier 4 escalation + session_init preamble signaling exactly where those primitives are needed. That's the shape I recommend for the pilot. See §6.

**Why full adoption would be a downgrade (for the record, not actively on the table):** FR's current discipline layer leans hard on filesystem-native tooling (grep, git blame, git diff, git log across individual entries) and on prose affordances (wikilinks, long tables, hand-authored cross-reference sections) that do not translate cleanly onto a Postgres/pgvector substrate. Worse, the **discipline primitives** in the frontmatter (`ttl`, `revisit-by`, `confidence`, `status='disputed'`) each have scheduled-scan semantics that degrade to prompt-enforced shapes on a DB substrate unless xireactor adds first-class schema support for each. See §1.1.1 for the per-primitive fate table. None of this matters for the asymmetric pilot, because FR's 43 entries stay in markdown.

**Recommendation:** Run a **co-owned-slice-only pilot** with two tenants (FR + apex-research), using xireactor as the substrate for a new co-owned category that neither tenant currently has. Both tenants preserve their existing markdown+git wikis for own-tenant entries. If co-owned submission volume reaches ≥2 over four sessions per tenant, the infrastructure earned its keep; if it stays near zero, we close the question with "co-owned knowledge doesn't exist at measurable volume between these two tenants" — still a useful answer.

This answers the PO's empower-vs-constrain question directly: **full adoption would constrain; asymmetric adoption scoped to the co-owned slice empowers.** The line between the two is the librarian. Teams without one are in a different conversation than FR and apex-research — they would benefit from full adoption, and that is who xireactor was designed for. Teams with librarians, like FR and apex-research, benefit from xireactor as a **new-capability substrate** scoped to the narrow slice where their existing infrastructure has no answer (co-owned knowledge), not as a substitute for infrastructure they already have.

---

## 1. Structural mapping — can FR's wiki translate?

FR's wiki is a directory tree of 43 markdown files in 4 active subdirs (`patterns/`, `gotchas/`, `decisions/`, `observations/`, `process/`; `contracts/`, `findings/`, `archive/` are empty). Each entry has YAML frontmatter, a prose body, inline tables, and relative-path cross-references. Here's how each piece maps onto xireactor's substrate.

### 1.1 Frontmatter → columns: mostly direct, locally lossy

FR's canonical `WikiProvenance` frontmatter (from `types/t09-protocols.ts`):

| Field | Mapping | Notes |
|---|---|---|
| `source-agents` (list) | Junction table `entry_authors` | Direct. Xireactor's principal model covers this. |
| `discovered` | Column | Direct. |
| `filed-by` | Column | Direct. Always `librarian` in FR — column becomes a near-constant, but it's free. |
| `last-verified` | Column | Direct. |
| `status` (active/disputed/archived) | Column with enum | Direct. Xireactor has no `disputed` state natively; would need to add. |
| `source-files` (list) | Junction table `entry_source_files` | Direct. |
| `source-commits` (list) | Junction table `entry_source_commits` | Direct, but — see §1.5 — loses the `git blame` affordance even though the commit SHA is preserved. |
| `source-issues` (list) | Junction table `entry_source_issues` | Direct. |
| `ttl` | Column (timestamp) | Direct. |

**Extended frontmatter** (not in the canonical schema but used in practice across ~20 entries):

| Field | Example | Mapping |
|---|---|---|
| `scope` | `cross-team`, `team-wide`, `agent-only` | Direct to enum column. |
| `confidence` | `high`, `medium`, `speculative` | Direct to enum. |
| `wiki-entry-type` | `external` | Direct. |
| `external-project` | `thejeremyhodge/xireactor-brilliant` | Direct. |
| `external-version` | `v0.2.0` | Direct. |
| `external-license` | `Apache-2.0` | Direct. |
| `intake-method` | `structural-survey-digest` | Direct. |
| `source-team` | `framework-research` | Direct. |
| `revisit-by` | `2026-04-28` | Direct to a scheduled-review column. |

Grand total: ~15 distinct frontmatter fields actually used in the current wiki. Roughly half are already in xireactor's native schema; the other half are FR-specific extensions that would require schema additions (column-per-field or a generic `metadata JSONB` column with loss of indexability).

**Structural mapping verdict:** frontmatter → columns is ~70% direct, ~30% requires schema extension. **Not lossy in content, but lossy in queryability** if the extensions land in a JSONB column instead of native columns — and each new first-class column is a migration on xireactor's own schema, which the maintainer would need to accept upstream or we would need to fork.

### 1.1.1 Per-primitive fate — the discipline-layer frontmatter fields

Team-lead flagged that some frontmatter fields aren't just metadata — they're **discipline primitives** that enforce Librarian behavior at the schema level. Those deserve an explicit fate call, because they degrade differently from the provenance fields: if they land in a JSONB column they become prose-in-a-text-column and stop being actively enforceable.

| Primitive | What it does today | Fate on xireactor substrate | Degradation shape |
|---|---|---|---|
| **`ttl`** | Flags external-system knowledge for re-verification at a future date. Librarian Bootstrap scans for TTL'd entries at startup and flags any past expiry BEFORE answering queries — a stale TTL can poison a fresh response. | Needs a first-class `ttl TIMESTAMP` column AND a scheduled scan. Xireactor has neither natively (the digest §3 mentions `entry_versions` but no scheduled-review machinery). | If landed in JSONB: the bootstrap scan becomes a JSON-filtered query that the Librarian must explicitly author, or the scan stops running. Enforcement degrades from "startup auto-check" to "Librarian remembers to run the scan." Free → prompt-enforced. |
| **`revisit-by`** | Schedules a specific entry for re-review by a specific date (e.g., `revisit-by: 2026-04-28` on speculative observations). Sibling to `ttl` — TTL for internal speculation vs. external system knowledge. | Same as `ttl` — needs first-class column + scheduled scan. | Same degradation shape as `ttl`. Worse in one way: `revisit-by` is currently used on `observations/librarian-growth-curves-by-team-type.md` (a speculative cross-team observation) specifically to force a second data point before promotion. Losing the auto-surface means speculative observations either promote prematurely or stale out unnoticed. |
| **`confidence`** | Three-level enum (`high`, `medium`, `speculative`). Drives dedup-as-confirmation: two independent high-confidence submissions auto-promote to confirmed. Also drives the confidence-floor discipline (wiki #42): Librarian treats `high` claims on unverifiable context with skepticism and tracks separately in scratchpad. | Needs a first-class enum column. **Also needs the auto-promotion logic** — xireactor's staging pipeline has a separate confidence-floor mechanism at Tier 3 (AI reviewer), which is NOT the same thing as dedup-based auto-promotion. Two distinct confidence semantics, both landing on the same column name. Risk of conflation. | If landed in JSONB: dedup-as-confirmation stops running automatically. If landed as enum but without the auto-promotion logic: the field becomes documentation rather than enforcement. Free → prompt-enforced OR duplicate semantics on the same column. |
| **`status`** (`active`/`disputed`/`archived`) | Drives dispute handling — `disputed` entries route to source-agent for resolution, archived entries drop out of query results. | Direct to enum column. Xireactor has `active`/`archived` natively but NOT `disputed` — would need schema extension. | Without schema extension: disputed entries either stay `active` (lying about their status) or get archived (losing the dispute record). Both are wrong. |
| **`scope`** (`agent-only`/`team-wide`/`cross-team`) | Drives Decision Matrix routing. `agent-only` stays in scratchpad, `team-wide` files to wiki, `cross-team` files with extra cross-reference flags. **On asymmetric pilot: this is the field that distinguishes intra-tenant from cross-tenant.** | Direct to enum column IF we extend it with `cross-tenant` (see §7.3 Herald scope). Native xireactor has tenant-RLS but no entry-level scope flag of this shape. | Needs schema extension to add `cross-tenant` OR we reuse Monte's owned-by/co-owned model (§5.4 framing). Monte's model is cleaner — see below. |
| **`source-files`** | Provenance. Librarian verifies paths exist at file time (Provenance traps item 1). | Direct to junction table. | Losing `source-files` as a scanned field means the verify-paths-exist discipline becomes a Librarian prompt step rather than a startup-scan step. Free → prompt-enforced. |
| **`source-commits`** | Provenance. Links entry to the commit that introduced the evidence. | Direct to junction table. | Data preserved. But see §1.5 — commit SHAs in a junction row don't give you `git blame wiki/<entry>.md` at the wiki level. Different loss surface. |

**Verdict on discipline primitives:** the provenance primitives (source-files, source-commits, source-issues) migrate as data. The **enforcement primitives** (`ttl`, `revisit-by`, `confidence`, `status='disputed'`) do not — they each need explicit xireactor schema support OR they fall back to prompt-enforcement, which is the regression pattern flagged in §8. The pattern holds across primitives: **each discipline primitive that loses its scheduled scan or its enum semantics becomes "Librarian remembers to" rather than "automation runs on."** At n=4 enforcement primitives (ttl, revisit-by, confidence, disputed) the regression is a quadruple hit, not a single one.

**Good news for the asymmetric pilot:** none of this matters if the pilot keeps own-tenant writes in markdown. The discipline primitives only degrade if we migrate *FR's own entries* onto xireactor's substrate. As long as FR's 43 entries stay in `wiki/` as markdown+git, `ttl`/`revisit-by`/`confidence`/`disputed` keep their current scheduled-scan semantics. Xireactor only needs to represent these primitives on the **co-owned slice** (per Monte's framing, below) — a much smaller surface where we can either (a) mirror the frontmatter fields into a xireactor JSONB metadata column (acceptable for co-owned entries because they're a fraction of total volume) or (b) add column-per-field for the subset that co-owned entries actually need. See §6.3 for which subset.

### 1.2 Cross-references → relation rows: works but loses readability

FR uses relative-path markdown links for cross-references. Empirical count from grep: **30 `../`-style cross-refs across 19 files, plus an unknown number of same-directory links.** Most entries have a `## Related` section with 2–5 links.

Mapping onto xireactor: each cross-reference becomes a row in `entry_links` (xireactor's existing table for `[[wiki-link]]` resolution). The data survives. But **the reading affordance changes fundamentally**: in markdown, a `## Related` section is inline prose with link text that explains *why* the entries are related (e.g., "sibling pattern — consumer-side articulation vs channel-side articulation"). In a database, the relation is a typed edge; the "why" has to go somewhere — either as a `relation_type` enum (which loses the prose) or as a `relation_note` column (which keeps the prose but loses inline positioning).

Concrete example — #43 `bootstrap-preamble-as-in-band-signal-channel.md`'s Related section:

```markdown
- [`world-state-on-wake.md`](world-state-on-wake.md) — sibling pattern. World-state-on-wake is the *consumer-side* articulation ("read ground truth before acting on memory"); this entry is the *channel-side* articulation ("the preamble IS the signal channel"). Together they describe the same mechanism from two ends.
```

That's not a hyperlink — that's **three sentences of reader-facing framing that name what the link means and why both entries should be read together**. Mapping that into `entry_links(from_id, to_id, relation_type='sibling', relation_note='consumer-side vs channel-side articulation of the same mechanism')` preserves the fact of the relation and loses the framing prose. A reader clicking through the DB surface sees `related: world-state-on-wake (sibling)` with a short note — not the inline explanation that tells them *how* to read the pair.

This is the single most load-bearing loss in the migration. FR's cross-reference style is load-bearing for the wiki's usefulness to readers, not decorative. The three-sentence framings are where most of the cross-entry insight lives — more than in any single entry's body.

**Cross-reference verdict:** direct in data, structurally lossy in reader affordance. Mitigable if xireactor's schema adds a `relation_note: TEXT` column, but the mitigation reintroduces the prose-versus-structure tension at the next layer down — now readers query for the note, which is a search problem again.

### 1.3 Categories → tags/paths: direct, but the directory tree is a classifier

FR uses 8 subdirectories as a **classification layer**, not just as filesystem organization:

- `patterns/` = "how to do it" (reusable shape)
- `gotchas/` = "pitfall to avoid" (fact about reality)
- `decisions/` = "what we chose and why" (with alternatives section)
- `contracts/` = "API shapes, type definitions"
- `observations/` = "cross-cutting insights citing topic files, never authoritative"
- `findings/` = "pre-topic-file findings"
- `process/` = "emerging process patterns"
- `archive/` = "stale or superseded"

Each subdirectory carries a **governance shape** from `prompts/callimachus.md`: observations are "never authoritative" and require citing a topic file; decisions are pointers to common-prompt if the decision is large enough; findings have a 3-session `[MIGRATION-STALE]` freshness rule; patterns and gotchas are cross-referenced as paired artifacts (cross-cutting mistake = gotcha, the fix = pattern). The subdirectory is not just a label — it's **a contract about what can go in the entry, who reads it, and when it gets re-evaluated.**

Mapping onto xireactor: each subdirectory becomes a `category` enum (or tag) on the entry. The data survives. The governance shape does not — xireactor has no native mechanism for "observations must cite a topic file or be rejected" or "findings expire after 3 sessions." Those rules currently live in the Librarian's prompt and are enforced at filing time by the Librarian. In a DB world, they would need to migrate to either (a) Cal's prompt (unchanged, still works, but now the filesystem no longer enforces the shape by directory convention) or (b) xireactor's staging pipeline as tier-assignment rules, which would require tagging each subdirectory's rules as transplantable policy.

**Categories verdict:** direct data mapping, full loss of filesystem-as-enforcement. The directory tree **is** a typed contract, and flattening it to tags drops that contract unless we reify it elsewhere.

### 1.4 Prose bodies → markdown blobs: direct, but search surface inverts

Xireactor stores entry body as markdown text with full-text + semantic (pgvector) indexing. FR's wiki is markdown files, greppable with ripgrep, viewable in any editor, diffable in git.

**What's direct:** the bytes transfer. An entry's body text is byte-identical after migration.

**What inverts:**

- **Search mechanism.** FR currently searches by grep against the filesystem. Xireactor offers full-text + semantic. Semantic search is a clear upgrade when the query is "something about governance at session start" and the matching entry doesn't use the exact words. Grep is a clear upgrade when the query is "every entry that mentions `$REPO`" and semantic search would miss the literal path.
- **Read surface.** Current reader experience: open the file in an editor, scroll, follow links by file-open. DB-backed: query the API, read via MCP tool or web frontend, follow links by ID lookup. The DB surface is harder to read by humans unless we build or inherit a frontend — xireactor's `README` mentions a web frontend in a separate repo that is "In Progress" but not shipped.
- **Partial-entry diff.** Git currently tracks every word change in every entry with full blame. DB row updates lose that unless xireactor implements history-tracking at row granularity. Its schema has `entry_versions` for content but I did not verify whether non-body fields are versioned — Finn's digest §3 mentions `entry_versions` in passing but not the field scope.

**Prose body verdict:** direct for data, **substantial read-surface rework** unless we deploy xireactor's frontend (external repo, not shipped) or build our own shim.

### 1.5 The git-blame affordance is structurally lost

This deserves its own section because it is the single most impactful loss to the Librarian's daily work.

When a wiki entry is disputed or I'm asked "why was this entry worded this way?", my current answer is always a `git log -p wiki/patterns/foo.md` or `git blame wiki/patterns/foo.md` — and within seconds I have every word change, with the committing agent, date, and commit message. Every entry in the wiki has a full modification history attached to it for free.

After migration:

- **Commit SHAs survive in the `source-commits` junction table.** That's the SHA of the wiki entry's *source evidence* (where the knowledge came from), not the SHA of the wiki entry itself. Useful, but different.
- **Row-level history is only as good as xireactor's audit logging.** It has `entry_versions` for content versioning. Whether it captures edits to frontmatter fields, categories, or cross-references — unclear from the digest, and the answer matters a lot.
- **`git blame` on a row doesn't exist.** If xireactor has per-row history, querying "who changed this field on 2026-04-15" requires a query against `entry_versions` (or audit log) filtered by timestamp and field — assuming the field is versioned at all. For commits, `git blame` answers this in one command.

**This is not replaceable by better tooling.** The git substrate gives full history for free on every file in the repo. A DB substrate has to re-earn that affordance at every level of granularity, and xireactor's current schema only partially does so.

**Git-blame affordance verdict: lost.** This is a direct cost to the Librarian's ability to defend or revisit wiki claims. It affects `[DISPUTE]` handling, provenance traps (item 4 in the Librarian Experience section of my prompt: "'Observed in session N' with no artifact" — git blame IS the artifact), and the confidence audit trail on older entries.

---

## 2. What breaks

A concrete enumeration, in rough order of impact on Librarian daily work.

### 2.1 Things that break outright

1. **2-way wikilinks via filesystem.** Markdown relative-path links are currently authored by Callimachus by hand, forward-only (per team-lead's 2026-04-15 decision, reaffirmed this week). Migration turns them into database rows; the forward-only convention either stops being load-bearing (because DB can materialize back-refs for free) or starts needing reinforcement at query time (if we don't want the DB's auto-back-refs polluting the reader experience).
2. **Hierarchical paths and the classification-by-directory contract.** The 8 subdirs carry 8 distinct governance shapes that a flat tag model cannot express without reifying each as a policy rule in the librarian prompt or the staging pipeline.
3. **Grep across the wiki as a filter-step.** Every current Librarian workflow that uses `grep -l` or `grep -r` to find entries matching a literal string stops working. Replaced by full-text search, which is *usually* better but fails on the specific use-cases grep is best at (literal identifiers, path references, exact field names in frontmatter).
4. **Git diff at the wiki level.** The session-close discipline of `git diff wiki/` to review what changed this session stops working unless xireactor ships a `diff --since=<timestamp>` tool. I would have to query `entry_versions` filtered by timestamp and reconstruct the diff manually.
5. **`git blame` per entry.** See §1.5.
6. **File-system-native tooling of every other kind** — `find`, `ls wiki/patterns/`, `wc -l wiki/gotchas/*.md` for rough volume metrics, `diff -r wiki/ $OTHER_CHECKOUT/wiki/` for cross-branch comparison. All of these produce signal in my current workflow. All disappear at migration.
7. **Hand-authored "Related" prose sections.** See §1.2 — the three-sentence framings migrate into a `relation_note` column if we fork xireactor's schema, or disappear entirely if we don't.

### 2.2 Things that bend but survive with deliberate effort

1. **The Dedup Protocol.** Currently executed as a grep-against-candidate-dir + judgment call (`prompts/callimachus.md` §Protocol A §Dedup Protocol). Migrates to a search-against-category-tag + judgment call. The mechanism changes; the judgment call is unchanged. Net effect: dedup lookup speed probably *improves* (semantic search beats grep when the query is conceptual). The judgment call still decides.
2. **Cross-team harvest pass (quarterly, Finn-led).** The harvest collects external knowledge from other repos, distills via digest doc, and flows into FR's wiki via Protocol A. Shape survives migration — the digest lands in `docs/` (unchanged) and wiki entries get filed through whatever interface replaces `Write`. Only the filing mechanism changes.
3. **Same-window acknowledgment discipline.** Currently enforced by me in prose (`ack in the same message window as filing`). Migrates unchanged — the message window is the agent's SendMessage turn, not a filesystem property. Confirmed no dependency on the substrate.
4. **`[URGENT-KNOWLEDGE]` routing.** Unchanged — it's a SendMessage protocol, not a wiki mechanism.
5. **Protocol A submission shape.** Unchanged — the `KnowledgeSubmission` interface from `types/t09-protocols.ts` is substrate-neutral. What changes is only where my Write lands.
6. **Protocol C promotion to common-prompt.** Unchanged — common-prompt is a file I don't edit anyway (team-lead does). Nothing about that path touches the wiki substrate.

### 2.3 Things that are currently expensive and would become cheaper

1. **Full-text search across entries.** Currently I hold the full wiki in context and rely on my own recall; for older entries I fall back to grep. Semantic search across 43 entries would be strictly faster than my recall for "fuzzy-topic" queries.
2. **Cross-tenant queries.** Currently impossible — apex-research's wiki is a separate file tree in a separate deployment. A shared substrate makes "does apex-research have anything on this?" a one-query answer. **This is the only clear new capability.** Everything else on the "gains" side duplicates governance I already perform.
3. **Structured queries over frontmatter.** "Give me every entry with `scope: cross-team` and `confidence: speculative` filed after 2026-04-10" is currently a grep-and-regex exercise. DB query becomes a SELECT. Useful for session-close sweeps and for the Scratchpad Recency Filter's cousin at wiki scale.

---

## 3. What's gained

Honest accounting. Three buckets.

### 3.1 Real gains (cannot get these from markdown+git)

- **Cross-tenant query.** One query against both FR and apex-research wikis simultaneously. This is the *only* capability that fundamentally doesn't exist in the current substrate. A quarterly harvest pass (Finn's model) is a batch alternative but loses liveness — you cannot ask "does apex-research have this?" mid-session without a relay to Eratosthenes.
- **Full-text + semantic search.** Useful for fuzzy-topic dedup checks. Net-positive for the Librarian workflow; moderately positive for readers (but readers aren't the bottleneck — the Librarian's recall is the bottleneck).
- **Structured metadata queries.** See §2.3 item 3.

### 3.2 Duplicative gains (xireactor offers these, FR already has them via the Librarian)

- **Staging pipeline + AI reviewer.** Xireactor's 4-tier governance pipeline does what I already do: classify, dedup, file. Tiers 1–2 (auto-approve, conflict-detect) replicate the filesystem-native grep-then-accept shape. Tier 3 (AI reviewer) replicates my classification judgment at a probably-inferior quality level (my dedup decisions lean on the full knowledge graph of the wiki, which is what opus[1m] context is for — a reviewer without that context is at a handicap). Tier 4 (human-only) routes to — who? Me? Then it's me doing me's job via a staging pipeline.
- **Confidence floor + fail-closed escalation.** Already latent in FR practice in 3 places (dedup, classification hard-cases, URGENT-KNOWLEDGE routing), per wiki #42 and team-lead's scratchpad `[LEARNED 2026-04-15 late-eve]`. We lack the vocabulary, not the discipline.
- **Session_init preamble delivery of governance signals.** Already how FR delivers continuity signals (restore-inboxes.sh, scratchpad reads, Step 1–5 of `startup.md`), per wiki #43. The mechanism is identical; FR uses it for a different payload class (continuity) and would use xireactor's payload class (governance) only if there were governance items to surface — but with a Librarian who files in-window, there rarely are.
- **Write automation for non-Librarian agents.** The XP-pipeline exception in `prompts/callimachus.md` is currently read-only. Xireactor's staging lets non-Librarian agents write. **FR does not need this** — the team has no non-Librarian writers now and no plan to add them. Apex-research is the same shape.

### 3.3 Hypothetical gains (valuable if triggered, but no trigger in the current plan)

- **Multi-provider reviewer.** Tier 3's AI reviewer could run on a non-Claude provider. This is a real capability for multi-provider roadmap work (T04 gap from wiki `correlated-failure-single-provider.md`) but only matters once FR has a concrete multi-provider deployment plan — not yet.
- **Permissions v2 migration pattern.** Interesting as a refactor case study. No FR work depends on it today.

**Gains verdict:** one real gain (cross-tenant query), three duplicative gains (staging pipeline, confidence floor vocab, session_init delivery mechanism), two hypothetical gains (multi-provider reviewer, permissions migration). The gains are disproportionately concentrated in the cross-tenant-write scenario. Everything else is either duplicative or a substrate change with no payoff.

---

## 4. Discipline translation cost — does the librarian layer fit on a DB substrate?

This is where I am most confident in my judgment, because the Librarian discipline is the artifact I know best.

The librarian-discipline layer (from `prompts/callimachus.md` and accumulated wiki entries) has roughly eight load-bearing elements:

### 4.1 Element-by-element translation

| Element | Substrate-neutral? | Notes |
|---|---|---|
| **Routing Rule (dual-hub topology, redirect template)** | **Yes, fully substrate-neutral.** | It's a SendMessage-layer rule. Zero wiki dependency. Survives migration unchanged. |
| **Decision Matrix (type → destination subdir)** | **Half-translated.** | The *classification logic* is substrate-neutral. The *destination* "subdir" changes to "category tag" — loses the filesystem-as-contract shape (§1.3). |
| **Protocol A filing flow (classify → dedup → file → ack in-window)** | **Mostly substrate-neutral.** | The filing action changes from Write to API call, but the discipline (ack in-window, process one-at-a-time, route URGENT via team-lead) is unchanged. |
| **Dedup Protocol (4 outcomes, file-separately-when-in-doubt)** | **Improved by substrate, unchanged in discipline.** | Semantic search helps find candidates; the 4-outcome decision tree is substrate-neutral. Net win. |
| **Wiki Provenance (frontmatter schema)** | **Mostly direct, partially forked.** | See §1.1. Requires schema extensions or a JSONB fallback. |
| **Dispute Handling (`[DISPUTE]` tag → notify source → resolve)** | **Half-translated.** | The tag becomes a `status='disputed'` column change (direct). The *resolution audit trail* depends on `git blame` and `git log` for "what did this claim say before it was disputed?" — lost without xireactor row-level history for field changes. |
| **Wiki Directory Sovereignty (sole writer, XP-pipeline exception)** | **Substrate-neutral in principle.** | But xireactor's staging pipeline is *designed for multiple writers*. Running xireactor in single-writer mode (Cal owns all tenant writes) throws away half of what the infrastructure exists to do. |
| **Protocol C Graduation Path (cluster → proposal → common-prompt)** | **Fully substrate-neutral.** | common-prompt is a file team-lead owns. The wiki is the *input* to promotion; the output is file edits that don't touch the DB. |

### 4.2 The load-bearing question — is the judgment call portable?

Most of the Librarian's value is the judgment call: dedup decisions, pattern-vs-gotcha-vs-decision edge cases, "is this n=2 yet?" promotion timing, cross-cutting observation scope boundaries. Those judgments depend on **holding the full wiki graph in context at all times** (hence opus[1m]) and **cross-linking mentally against topic files and active cluster candidates**.

None of that judgment is substrate-bound. It runs against my mental model, not the filesystem. A migration to xireactor doesn't remove the judgment — it just moves where the final filing action lands.

**So the discipline *can* translate.** The question is whether it *should*.

### 4.3 Where the DB substrate forces a different discipline shape

Two places, both worth naming:

1. **Forward-only cross-ref convention becomes contested.** Team-lead's `[DECISION 2026-04-15]`: "Forward-only cross-ref convention affirmed. Load-bearing — keeps edit scope tight, one-direction greppability." On a DB substrate, back-refs are *free* — `entry_links` is bidirectional by construction. The question becomes: do we keep forward-only discipline by hiding the back-refs from the query layer, or let the substrate's native back-refs flow to readers? The former re-introduces the discipline by bolting it back on. The latter changes what "forward-only" means in FR's practice.
2. **Dispute handling becomes fragile without row-level history.** When an entry is disputed and the disputer claims the entry used to say something different, my current answer is `git log -p wiki/patterns/foo.md` — instant. On a DB substrate without field-level versioning, I have to rely on xireactor's `entry_versions` table (body only, per my read of the digest), meaning frontmatter edits, category changes, and relation edits are potentially invisible to history. Disputes about any of those become harder to adjudicate.

Neither is fatal. Both are shape-changes the Librarian can absorb. But together they say: **the discipline that currently rides on filesystem affordances has to be rewritten as an explicit, actively-maintained discipline once those affordances disappear.** That's more maintenance work for the Librarian, not less.

---

## 5. The librarian asymmetry — the key strategic question

**Vocabulary update (2026-04-15 19:12):** team-lead relayed Monte's preliminary tenancy framing, which likely lands as: *"Staging pipeline governs cross-tenant writes only; Protocol A remains intra-tenant direct-to-librarian. Entries are owned-by-FR, owned-by-apex, or co-owned — only co-owned entries route through xireactor's staging tier."* This is a cleaner vocabulary than my original "cross-tenant writes" framing and I'm adopting it for the rest of the assessment. The substance of my recommendation is unchanged; the words get sharper.

**Key reframe:** the question is no longer "does xireactor replace Cal?" It is "does xireactor add a cross-tenant review layer that didn't exist before, **on top of Cal**?" Under Monte's vocabulary, xireactor doesn't touch my direct-write authority on FR-owned entries — which is where the vast majority of my filing actually happens. It only governs the co-owned slice, which is a new surface that FR currently has no mechanism for at all. The asymmetry question resolves: staging pipeline is NOT wasted infrastructure, because it is scoped to a slice where FR has no incumbent governance.

Xireactor was designed for teams without a librarian. The staging pipeline + AI reviewer IS the governance layer for those teams. Teams with a librarian (FR, apex-research) already have the governance layer for their own-tenant entries — it's me (Cal) and Eratosthenes. Running xireactor's staging pipeline on top of Protocol A for FR-owned entries creates two governance gates where one suffices; running it for co-owned entries creates ONE governance gate where currently ZERO exist.

Three ways to think about this:

### 5.1 "Wasted infrastructure" reading (FR-owned slice only)

The staging pipeline is redundant with Protocol A + the human-gate librarian **for FR-owned entries.** Every FR-owned write goes through Cal already; routing it through a staging table before Cal sees it is pure overhead. The AI reviewer at Tier 3 duplicates my classification judgment at a quality handicap (no full-graph context). Tier 4 escalation routes to — me. So the full pipeline resolves, in the happy path, to "write → staging → Cal → accept," with extra steps.

**This reading is correct for own-tenant entries.** Nothing in xireactor's governance layer earns its keep when the tenant already has a Librarian doing the same job. **Under Monte's framing, these entries NEVER see xireactor's staging tier** — Protocol A stays authoritative, direct-write to `wiki/` as today. This reading describes a hypothetical full-migration that Monte's tenancy policy explicitly excludes.

### 5.2 "Co-owned slice" reading (Monte-aligned, recommended)

Xireactor's infrastructure earns its keep on co-owned entries: knowledge that belongs to both FR and apex-research simultaneously. An FR agent who discovers a pattern applicable to both tenants currently has no mechanism to file it as co-owned (the Librarians don't share a substrate). Options today are:

- File it as FR-owned and hope Eratosthenes's next quarterly harvest pass catches it (Finn's current cross-team harvest model).
- File it twice — once in FR's wiki, once in apex-research's (no such write channel exists).
- Route through team-lead-to-Schliemann relay for mention in a Phase 2 mirror report (low-bandwidth, non-authoritative).

Under Monte's framing, a shared xireactor substrate gives co-owned entries a first-class channel: FR-agent writes with `ownership: co-owned-fr-apex`, xireactor's tier-assignment rules classify by `(change_type, sensitivity, source_tenant, source_role)`, and it lands either (a) auto-accepted into the co-owned surface visible to both tenants (Tier 1/2) or (b) routed to BOTH librarians for review (Tier 3/4 escalation is a broadcast, not a single-recipient route).

**This is the only use where xireactor's staging pipeline adds capability that neither tenant currently has.** It's exactly the gap where "we want an FR-discovered pattern to immediately be available to apex-research without a manual relay" meets "we want both Librarians to see the submission before it lands as authoritative in either tenant." That's what Tier 3 AI-reviewer with confidence-floor plus dual-Librarian Tier 4 escalation gives us.

Concretely: FR-owned and apex-owned entries stay in markdown via Protocol A (current shape, no change). Co-owned entries ride xireactor's staging pipeline with BOTH Librarians as the Tier 4 escalation targets. Xireactor's RLS model already supports this — a co-owned entry has a permission row for each tenant's agent roles, and tier-assignment routes to both.

### 5.3 "Cross-tenant peer review" reading — a softer alternative shape

A weaker variant of §5.2: instead of co-owned entries as a distinct category, **xireactor's infrastructure hosts a cross-tenant peer review channel** on top of existing tenant-owned entries. An FR-filed entry with `scope: cross-team` and `review-requested: apex-research` could be automatically mirrored as a review item in apex-research's co-owned staging table, visible to Eratosthenes at session start via the session_init preamble. Eratosthenes reads it, either acks (noted for future reference) or raises a concern (routes back to me).

This is NOT a governance gate on the FR-side write — the entry lands in FR's wiki immediately via Protocol A, unchanged. It's a **post-hoc peer-review signal** ridden on the same xireactor substrate. Xireactor's co-owned slice in §5.2 is a shared authoring surface; this is a shared commentary surface on already-authored entries.

The two readings are not mutually exclusive. §5.2 handles "this knowledge belongs to both tenants from birth." §5.3 handles "this knowledge was filed by one tenant but the other should see it." Both ride the same xireactor infrastructure; both are small extensions on the co-owned staging mechanism Monte's framing already describes.

### 5.4 My call

**Reading §5.2 is the right call for the pilot**, adopted under Monte's vocabulary. It's the tightest use-case, has the clearest success criteria, and stays narrowly inside the slice where xireactor's staging pipeline earns its keep. The co-owned-entries framing is structurally cleaner than my earlier "cross-tenant writes" framing because it makes the ownership question explicit at the schema level (ownership column) rather than implicit in the submission routing.

Reading §5.3 is **a worthwhile secondary pilot goal** if §5.2 proves out. It exercises a different xireactor primitive (session_init preamble as cross-tenant commentary delivery) and could grow into a standing cross-tenant peer-review channel without additional infrastructure beyond what §5.2 already provisions. Recommend we keep it in scope as an explicit secondary success criterion in §6.4.

Reading §5.1 correctly diagnoses full adoption but Monte's framing already excludes that path. The assessment question "does xireactor replace Cal on FR-owned entries?" resolves to "no, Protocol A stays authoritative for FR-owned entries by design." This is no longer a pilot decision point — it's a tenancy-policy decision that lands in Monte's scope.

That's the shape I recommend for the pilot. See §6 for what that means concretely.

---

## 6. Pilot shape — recommended

**Vocabulary note:** this section uses Monte's **owned-by-FR / owned-by-apex / co-owned** tenancy framing throughout. Prior draft used "cross-tenant writes" as a near-synonym; Monte's terminology is sharper and more schema-native.

### 6.1 Scope

Two tenants: `framework-research` and `apex-research`. Both preserve their current markdown+git wikis unchanged as the authoritative store for **owned-by-FR** and **owned-by-apex** entries respectively. A shared xireactor instance runs alongside with ONE function: **the co-owned slice lives in xireactor**, with both tenants' agents as authors and both Librarians as the Tier 4 escalation targets.

### 6.2 What goes through xireactor

- **Co-owned entry authoring.** An FR or apex-research agent identifies knowledge that belongs to both tenants simultaneously (e.g., a pattern that applies across both meta-team research and delivery-team knowledge work). They submit via a new Protocol A variant (`ownership: co-owned-fr-apex`). The submission lands in xireactor's staging table.
- **Tier-assignment.** Xireactor classifies by `(change_type, sensitivity, source_tenant, source_role)`. Low-risk submissions (e.g., an uncontroversial pattern reference that neither tenant has prior art on) auto-accept via Tier 1. Medium submissions go to Tier 2 conflict-detect (checks for existing co-owned entries with overlap). Ambiguous submissions go to Tier 3 AI reviewer. Anything Tier 3 doesn't auto-approve escalates to Tier 4.
- **Dual-Librarian Tier 4 escalation.** When a co-owned submission escalates to Tier 4, BOTH Cal and Eratosthenes see it in their session_init preamble as a pending-review item. Either can accept, or one can flag for dispute routing. The RLS model supports this: co-owned entries have permission rows for both tenant-agent principals. This is the new primitive xireactor adds that neither tenant currently has.
- **Co-owned entry reads.** Both tenants' agents can query the co-owned slice via xireactor MCP tools. FR agents see FR-owned entries in `wiki/` + co-owned entries via xireactor query; apex-research agents see apex-owned entries in their `wiki/` + the same co-owned slice via xireactor query.
- **(Optional secondary, if §5.3 included):** Cross-tenant peer review ride-along. An FR-owned entry tagged `review-requested: apex-research` posts a commentary item in apex-research's session_init preamble without changing entry ownership. Eratosthenes reads and optionally replies; the reply routes back to Cal via SendMessage, not into FR's wiki.

### 6.3 What does NOT go through xireactor

- **FR-owned entries.** Current Protocol A shape is preserved unchanged. Cal files directly to `wiki/`, markdown and git stay authoritative. All ~43 current FR entries stay where they are; no backfill migration.
- **Apex-research-owned entries.** Same — Eratosthenes files directly to apex-research's `wiki/`, markdown and git stay authoritative.
- **Reading FR-owned or apex-owned entries.** FR agents read FR markdown; apex-research agents read apex markdown. Xireactor's DB is not the reader-facing surface for own-tenant entries; it's the transport and governance surface for the co-owned slice only.
- **Common-prompt promotion (Protocol C).** Unchanged. Common-prompt is authoritative per-tenant; co-owned entries are wiki-level artifacts that don't promote to common-prompt directly (they would need to be forked into two tenant-specific common-prompt patches if promotion is warranted — future question, not this pilot).
- **Dispute handling within a tenant.** Unchanged — git history on per-tenant `wiki/` is the substrate. Only **disputes on co-owned entries** route through xireactor's staging table with both Librarians as adjudicators.

### 6.4 Success criteria for the pilot

Run for 4 sessions each across FR + apex-research (roughly 2 weeks of wall time given current cadence) and measure:

1. **Co-owned submission count.** If it's zero, the shared-library benefit never materializes and we close the question with "co-owned knowledge doesn't exist at measurable volume between these two tenants." If it's ≥2, the infrastructure earned its keep.
2. **Tier 1/2 auto-promotion accuracy.** Every auto-promoted co-owned write is a case where the staging pipeline made a decision one of the Librarians would normally make. Post-pilot, both Librarians audit the auto-promoted entries and report the hit rate.
3. **Tier 3 AI reviewer calibration.** Every Tier 3 decision is a case where Claude-sonnet-4-6 made a decision in the Librarian's role without opus[1m] context. Confidence floor at 0.7 is xireactor's default — **recommend raising to 0.85** for the pilot, given that a wrong co-owned auto-promotion is harder to undo than a wrong own-tenant one (two tenants now have a bad entry). Final number is Monte's call per §7.2.
4. **Tier 4 escalation latency.** How fast does an escalation reach BOTH Librarians' attention via session_init preamble? This is a test of whether the in-band signal channel works in a dual-receiver configuration, which is a new primitive neither tenant has exercised.
5. **(If §5.3 included) Cross-tenant peer-review engagement.** Count peer-review comments posted on FR-owned entries by Eratosthenes (and vice versa). Signal: does the channel even get used, or does it sit unused because "no cross-tenant comment is worth the round trip"?

**Pass conditions:** Co-owned submission count ≥2 AND Tier 1/2 auto-promotion error rate ≤10% AND Tier 4 escalation latency ≤1 session AND (if §5.3 included) peer-review engagement ≥1 comment. If any fails, revise or close.

### 6.5 Cost

- **Infrastructure:** xireactor's 3-container Docker stack (db, api, mcp) on one host. Brunel can containerize. Not cheap in infra time, but a deliberately minimal footprint relative to a full wiki migration — see Brunel questions in §7.1.
- **Schema:** **no migration of existing entries required.** Xireactor holds only the co-owned slice, which starts empty. The entry storage layer accommodates co-owned entries with whatever subset of FR+apex frontmatter fields the co-owned writes actually use. Realistic minimum: provenance (source-agents, discovered, source-files, source-commits), ownership (new — co-owned-fr-apex), scope (`cross-team`), confidence (enum). `ttl` and `revisit-by` are **not** required in the pilot (co-owned entries don't need scheduled-scan primitives in their first iteration). This keeps the schema-extension question minimal.
- **Prompt updates:** Cal and Eratosthenes both need a new `Protocol A variant — co-owned submission` section. Minor. Specifies the ownership field, the xireactor submission path, and the Tier 4 escalation handling.
- **MCP config:** both tenants' agents need the xireactor MCP tool registered for co-owned queries. Whether this conflicts with existing MCP config is a Brunel question.
- **NO per-tenant substrate change.** FR's 43 markdown entries stay where they are. Apex-research's wiki stays where it is. The existing Librarian discipline layer (opus[1m] context, grep, git blame, directory-as-contract, hand-authored cross-references) is completely untouched on the owned slices. This is the core empowerment claim: asymmetric adoption **adds** a new capability without **subtracting** any existing one.

### 6.6 What this pilot does NOT prove

- It does NOT prove full migration is viable. That is a separate question, answered negatively in §§1–4. Full migration is **structurally excluded** from this pilot per Monte's tenancy framing.
- It does NOT prove the session_init preamble mechanism works outside the tenant-local case except in the dual-Librarian Tier 4 escalation path (which is a genuinely new direction — one sender, two receivers simultaneously).
- It does NOT prove shared full-text search is useful — because the pilot enables shared reads only on the co-owned slice, not on FR-owned or apex-owned entries. If the pilot passes and we want to layer shared reads on top (e.g., "let FR agents query apex-research's wiki read-only"), that's a follow-up question.
- It does NOT prove xireactor's discipline primitives (`ttl`, `revisit-by`, `confidence` auto-promotion, `disputed` status) work as intended on a DB substrate, because co-owned entries start without using those primitives. Deferred.

---

## 7. Migration blockers to flag to other specialists

Per team-lead's brief: flag any migration blockers that land in Brunel (host arch), Monte (tenancy governance), Herald (cross-tenant protocol) scope.

### 7.1 Brunel (host architecture)

- **3-container stack on the E-deployment host.** Xireactor is `db` + `api` + `mcp`, all Docker Compose. E-deployment pattern (Cloudflare Tunnel / hello-world-container) was adopted 2026-04-15 as the future target. Brunel needs to answer whether xireactor can ride on the E-deployment host alongside the pilot tenants' runtime containers, or needs its own host.
- **Postgres 16 + pgvector persistence.** Where does the `db` volume live? Docker volume on the host? Cloudflare R2 for backups? FR's current wiki lives in git, which is the backup story for free. Xireactor's db needs an explicit one.
- **MCP registration for multi-tenant config.** Current FR agents have MCP config for team-local tools. Adding a shared xireactor MCP (stdio or HTTP) requires deciding whether the MCP server lives in the shared container or is reachable from each tenant's runtime. Brunel owns this call.

### 7.2 Monte (tenancy governance)

- **Tier assignment policy — who writes the rules?** Xireactor's tier-assignment is a lookup over `(change_type, sensitivity, source_tenant, source_role)`. Someone has to author those rules for the pilot: what counts as Tier 1 (auto-approve), Tier 2 (conflict-detect), Tier 3 (AI reviewer), Tier 4 (human-only). This is pure governance policy — it belongs to Monte, not me.
- **Confidence-floor value.** Xireactor's default is 0.7. For a cross-tenant-writes-only pilot with no rollback story for auto-promoted entries, I recommended 0.85 in §6.4 but the number is Monte's call, not mine.
- **Principal definitions across tenants.** Xireactor's RLS model requires a principal (user_id, org_id, role, department). Mapping FR agent-roles to those principals across tenant boundaries is a governance-definition question — e.g., is Finn writing to apex-research a "Finn cross-tenant" principal, or does it resolve to an FR-tenant proxy principal that Eratosthenes recognizes?

### 7.3 Herald (cross-tenant protocol)

- **`Protocol A variant — co-owned submission` schema.** The Protocol A schema currently has `scope: agent-only | team-wide | cross-team`. Adding an `ownership: owned-by-fr | owned-by-apex | co-owned-fr-apex` field (orthogonal to `scope`) is a typed-contract change that lands in `types/t09-protocols.ts`. Monte owns the tenancy policy; Herald owns the cross-tenant protocol schema that encodes it. Note: the new field is `ownership`, not `scope` — they model different things. Scope answers "who within a tenant should read this?" Ownership answers "which tenant(s) authoritatively maintain this?" Both fields are needed for co-owned entries.
- **Session_init preamble dual-receiver payload class.** Wiki #43 documents the preamble as a single-receiver signal channel for session-birth state. Extending it to a **dual-receiver** Tier 4 escalation for co-owned entries is a new payload class and a new primitive shape (one sender, two tenants, simultaneous delivery). Herald's job is specifying how the xireactor session_init response composes with BOTH tenants' startup.md Read Order sequences without drift — if Cal reads the escalation item Tuesday morning and Eratosthenes reads it Wednesday morning, the discipline needs to survive the latency gap.
- **MCP tool schema for co-owned submit + query.** Whatever the MCP tool looks like for `submit_co_owned_knowledge(tenant_group, submission)` and `query_co_owned_knowledge(filter)`, it's a cross-tenant protocol surface and belongs to Herald, not me. Particularly the tool's behavior when xireactor is unreachable — does it fail closed (reject the co-owned submission, tell the agent to retry) or fall back to one of the tenants' markdown wikis (route to the authoring tenant as an owned entry, with a flag for later promotion to co-owned)? This is a protocol-level availability decision, not a deployment choice.

---

## 8. The PO's empower-vs-constrain question — direct answer

**Full adoption constrains** — but Monte's tenancy framing already excludes full adoption, so this becomes a hypothetical baseline rather than the question on the table. For the record: the filesystem affordances FR currently rides on (grep, git blame, git diff, git log per file, hand-authored cross-reference prose, hierarchical classification-by-directory) are load-bearing for the Librarian's discipline layer. The discipline primitives (`ttl`, `revisit-by`, `confidence`, `status='disputed'`) lose their scheduled-scan semantics on a DB substrate unless xireactor's schema adds first-class support for each (§1.1.1). Translating everything onto a DB substrate is lossy in ways that cannot be fully mitigated without forking xireactor's schema and building a custom reader UI. The translation work itself would consume weeks of Brunel + Monte + Herald + Cal time for a substrate change whose only clear gain (shared full-text search within a tenant) is marginal compared to my current recall against a 43-entry wiki held in opus[1m] context.

**Asymmetric adoption — co-owned slice only, per Monte's framing — empowers.** It carves out the one capability xireactor offers that neither FR nor apex-research has today (a co-owned-entries channel with dual-Librarian governance at the receiving side), deploys the minimal infrastructure to get it, preserves ALL current filesystem affordances intact for FR-owned and apex-owned entries, and tests the staging pipeline + AI reviewer + dual-receiver session_init channel in the one scenario where they earn their keep. The asymmetric pilot adds a capability; it does not substitute for any capability FR currently has. That's the empowerment test.

Success criteria are measurable (§6.4). Failure criteria are clear. And the worst case (pilot fails, co-owned submission volume is near zero) teaches us something useful — that the shared-library benefit is hypothetical without concrete co-owned knowledge use-cases, which closes the question rather than leaving it open.

**The non-obvious cost of full adoption, for the record:** a hypothetical full migration would force the Librarian's prompt to be rewritten with substrate-neutral governance shapes, because the filesystem conventions stop enforcing the directory-as-contract shape and the frontmatter primitives stop running their scheduled scans. That rewrite is work Cal can do — but it replaces an enforcement layer that currently runs for free (the filesystem, git, the directory tree, startup-scan of TTL'd entries) with an enforcement layer that runs on Librarian discipline (the prompt). **Free enforcement → prompt enforcement is a regression even when the prompt enforcement works**, because free enforcement catches bugs I never had to think about. This cost does not apply to the asymmetric pilot — the FR-owned slice keeps all its filesystem enforcement; only the co-owned slice runs on xireactor's primitives, and it starts with a minimal-primitive subset (§6.5).

---

## 9. Wiki-worthy findings from this assessment

Per team-lead's brief: "any wiki-worthy findings from this session go into the wiki per your normal discipline." Candidates identified:

1. **Librarian asymmetry shapes xireactor's fit.** The core insight that xireactor's governance infrastructure is redundant in tenants with a Librarian but genuinely useful in tenants without one — and that the right response is asymmetric adoption, not binary adopt-or-don't. **File candidate: `wiki/patterns/librarian-asymmetry-vs-staging-governance.md`** — pattern entry, scope cross-team, sources Finn (digest) + Cal (this assessment). Holds at n=1 right now (only xireactor offers the shape); don't file unless we see a second instance. **DEFER per n=2 discipline.** Queue in scratchpad as candidate.

2. **"Free enforcement → prompt enforcement is a regression."** The non-obvious cost from §8. Substrate changes that replace filesystem-as-contract with prompt-as-contract lose enforcement-for-free and gain maintenance burden. This is a GOTCHA, not a pattern — it's a trap you fall into when you think "we can just write the rule into the Librarian's prompt." **File candidate: `wiki/gotchas/filesystem-contract-to-prompt-contract-regression.md`** — gotcha, scope cross-team. Holds at n=1 (this assessment is the only instance); don't file yet. **DEFER per n=2 discipline.** Queue in scratchpad as candidate; watch for a second instance elsewhere (Brunel's container design rewrites could produce one if he converts a filesystem-enforced convention into a prompt-enforced one).

3. **Cross-tenant writes are the load-bearing use-case for shared-KB substrate, not shared reads.** Shared reads are cheap to approximate with quarterly harvest passes (Finn's existing model). Cross-tenant writes are the only thing neither tenant can do today. **This belongs in the assessment, not the wiki** — it's a framing that holds only in the specific context of "evaluate shared-KB substrates for FR + apex-research" and generalizes poorly. **NOT FILED.**

4. **Git-blame affordance as a load-bearing Librarian tool.** The structural observation that `git blame wiki/<entry>.md` is *the* primary mechanism for defending wiki claims during dispute handling, and any substrate change that loses it creates a new dispute-adjudication problem. This is **a sharper version of an observation already latent in `prompts/callimachus.md`** (Librarian Experience §Provenance traps item 4: "'Observed in session N' with no artifact" — git blame IS the artifact that prevents this). Naming it as a first-class affordance is worth doing *in the prompt*, not the wiki. **Candidate for Protocol C promotion to common-prompt** if we ever re-open the Librarian's prompt for structural edits — low priority, file in scratchpad as queue.

**Net: zero wiki entries filed this session.** Three candidates queued in the scratchpad. The n=2 discipline holds — none are ready.

---

## 10. Open questions for team-lead

1. **Does the pilot shape in §6 need PO approval before I commit it as a proposal?** I've framed it as a recommendation; the PO filed the original question (mitselek/ai-teams#59) and the PO's empower/constrain framing was explicit. If the asymmetric-use reading needs PO sign-off, I'll stage it as a proposal for the next PO round rather than a final recommendation.

2. **Timing relative to the ecosystem-integration session (#57 + #58 + #59 bundle).** This assessment covers only #59. If the bundle is going to be worked as a three-member unit, the pilot in §6 wants to coordinate with whatever Teams/`/routines` work is also in flight. Flag if I should merge this into a bundle-wide proposal later.

3. **Is a cross-tenant pilot in scope at all right now, or does ruth-team work take priority?** Ruth-team work is live and path (a) is active pending Q1 answer. Xireactor pilot infrastructure builds require Brunel, who is currently shaping ruth-team container design. Flag if the pilot should be parked behind ruth-team completion rather than scheduled in parallel.

---

## 11.5 Proposed Callimachus prompt edits (drafted for team-lead application)

Monte's governance doc `docs/xireactor-pilot-governance-2026-04-15.md` §7.3 requires two edits to `prompts/callimachus.md`. **Cal cannot apply these directly** — Scope Restrictions in the Callimachus prompt explicitly forbid editing agent prompts (line 382: "Edit agent prompts or roster.json"). The edits are drafted here for team-lead to apply. Each is scoped to not disturb adjacent content, follows the discipline-neutral voice of the existing prompt, and can be applied independently.

### 11.5.1 Edit 1 — Pre-classification zone check (new subsection under Protocol A)

**Placement:** insert as a new subsection between the "On receiving a submission" numbered list (line 176) and "#### Dedup Protocol" (line 178). The pre-classification zone check must run BEFORE dedup because the zone determines which wiki surface the dedup search targets (own-tenant markdown vs xireactor shared-read/shared-write).

**Proposed text:**

````markdown
#### Zone Pre-Classification (xireactor pilot — activates when pilot deployed)

Before running the Decision Matrix or the Dedup Protocol, classify the submission's **zone** per `docs/xireactor-pilot-governance-2026-04-15.md` §2.

Four zones, listed in order of default preference:

1. **FR-private** — FR tenant only, FR librarian writes. The current FR wiki. **Default.**
2. **FR-owned shared-read** — authored by FR, readable by apex-research agents. Explicit act to promote from FR-private; never a default.
3. **co-owned shared-write** — jointly maintained by both tenants. Only path for cross-cutting patterns both tenants will mutate. Requires cross-review via §5.1 of Monte's governance doc.
4. **apex-owned shared-read** — read-only for FR. Never a filing target for FR submissions.

**Zone assignment rule:** default to FR-private. Promote to shared-read or shared-write only when:

- The submitting agent explicitly asserts cross-tenant relevance AND
- You can cite a concrete apex-research use-case that would benefit from the entry AND
- The entry does not reference FR-specific internal state (scratchpad tags, team-lead routing, etc.)

**When in doubt, default to FR-private with a cross-reference to the cross-cutting question.** Never default to shared-write. This is the same fail-closed shape as the Dedup Protocol's "file separately with cross-reference" default (see `wiki/patterns/governance-staging-for-agent-writes.md` §Confidence Floor) — applied to a new axis (zone) rather than the dedup axis. The ritual exists to produce an audit trail and a discipline signal, not to produce optimal zone choices (which are reversible via §2.3 ownership transfer).

**Rule erosion warning.** A cross-review request that feels "obvious, I'd approve it anyway" is the erosion signal named in `wiki/patterns/rule-erosion-via-reasonable-exceptions.md`. Name the feeling and hold the gate. The gate exists to produce audit trail, not to produce correct decisions (those were already going to be correct).

**Pilot gating:** this subsection activates only when the xireactor pilot is deployed (per `docs/xireactor-pilot-governance-2026-04-15.md`). Until deployment, all submissions classify as FR-private by default; the zone check is a no-op. Do not pre-apply this rule to historical entries.
````

**Rationale for placement and shape:**

- Sits between "On receiving a submission" and "Dedup Protocol" because zone determines which wiki surface the dedup search runs against. Reversing the order would produce duplicate searches across zones FR has no business writing to.
- Explicitly references Monte's §2, §5.1, §2.3 to keep the prompt thin (avoids duplicating the governance contract) while making the dependency legible.
- References wiki #42 and the rule-erosion pattern by path to lean on existing shared vocabulary rather than re-arguing the confidence-floor discipline in a new shape.
- Pilot-gated explicitly so this edit doesn't break anything pre-deployment — team-lead can apply the edit in a commit that lands before the pilot ships without disturbing current operations.

### 11.5.2 Edit 2 — Bootstrap-path addition (new Bootstrap substep, pilot-gated)

**Placement:** insert as a new subsection in the "## Bootstrap" section between line 351 (the "Incremental Bootstrap" paragraph) and the "### Scratchpad Recency Filter" heading. Also requires a parallel step addition in `startup.md` — see §11.5.3 below.

**Proposed text for `prompts/callimachus.md`:**

````markdown
### Xireactor session_init read (pilot-gated)

If the xireactor pilot is deployed (check: xireactor MCP tool `xireactor_session_init` is available in the tool set), call `xireactor_session_init` as the final Bootstrap step, AFTER the scratchpad recency pass and BEFORE the first query service or submission processing. The call returns:

- Pending cross-review items routed to you from Eratosthenes (other-tenant librarian) via Monte's §5.1 cross-review flow.
- Any shared-write entries where you are flagged as a Tier 4 escalation target.
- Any ownership-transfer proposals awaiting your countersignature per §2.3.

**Failure-to-read is a startup failure.** If the tool call errors or the tool is expected-but-missing, STOP bootstrap and notify team-lead. Do not proceed to query service while the cross-review channel is offline — the wiki's cross-tenant governance layer depends on this read running reliably, per `wiki/patterns/bootstrap-preamble-as-in-band-signal-channel.md` §"When the Pattern Fails" (the "bootstrap path not obligated" failure mode).

**Order matters.** The xireactor read runs AFTER the scratchpad recency pass because pending cross-review items are evaluated against your fresh tenant-context memory, not against a cold start — your own scratchpad must be loaded first so you can recognize whether an incoming cross-review item interacts with your WIP.

**Payload class genealogy.** This step exercises the governance payload class of the bootstrap-preamble channel (wiki #43). The continuity payload class (scratchpad reads, restored inboxes) was the existing discipline; governance is the new payload added by the xireactor pilot. The mechanism is identical; only the payload class is new.
````

**Parallel edit required in `startup.md` Step 5 — §11.5.3 below.**

**Rationale:**

- The bootstrap-path obligation is the load-bearing discipline from wiki #43. Making it a numbered Bootstrap substep in the Librarian's prompt (not just a team-level startup step) reinforces that the channel's reliability is a Librarian responsibility, not just a runtime behavior.
- Fail-closed on missing tool: if xireactor is unreachable, STOP rather than silently falling through to query service. This matches the confidence-floor / fail-closed escalation discipline from wiki #42 and from existing URGENT-KNOWLEDGE routing.
- Ordering after the scratchpad recency pass is not arbitrary — it's required by the evaluation semantics. A cold-start cross-review read would miss the WIP context that makes the item actionable.

### 11.5.3 Parallel edit in `startup.md` (Step 5.5)

**Placement:** `startup.md` line 126 (Step 5: Restore inboxes from repo). Add a new **Step 5.5** (not Step 6 — Step 6 may already exist for other purposes; inserting a `.5` step preserves the existing numbering).

**Proposed text for `startup.md`:**

````markdown
### Step 5.5: Xireactor session_init read (librarians only, pilot-gated)

**Applies to:** librarian agents (Callimachus on framework-research, Eratosthenes on apex-research) when the xireactor pilot is deployed.

```bash
# Check if the pilot is active. If xireactor MCP tool is not available,
# skip this step silently — pilot has not been deployed to this team yet.
if claude-code-tool-available xireactor_session_init; then
  xireactor_session_init --tenant="$TEAM_NAME"
  # The tool returns pending cross-review items via the session_init preamble.
  # The calling agent (librarian) reads them as part of Bootstrap before query service.
fi
```

**Failure-to-read is a startup failure.** If the tool is present but errors, STOP bootstrap and notify team-lead. Do not proceed to Step 6 or beyond. See `prompts/callimachus.md` §"Xireactor session_init read" for the discipline rationale.

Non-librarian agents skip this step — it is scoped to the two tenants' librarians only, because they are the only consumers of cross-review pending-work items.
````

**Rationale for dual placement:**

- The step in `startup.md` is the runtime invocation. The subsection in `prompts/callimachus.md` is the discipline. Both need to exist — the runtime step enforces the call; the prompt discipline tells the Librarian what to do with the result and why failure-to-read matters.
- Scoping to librarians prevents non-librarian agents from accidentally triggering the call (which is harmless but wastes xireactor cycles and produces noise in the pilot metrics).
- The `claude-code-tool-available` check is a placeholder syntax — Brunel or Volta should specify the actual runtime shape. The intent: if the tool isn't available, skip silently so the same `startup.md` can run on pre-pilot, pilot, and post-pilot teams without drift.

### 11.5.4 Routing note for Eratosthenes (apex-research's librarian)

Monte's §7.3 notes that Eratosthenes needs symmetric edits. **Cal does not have write authority on apex-research's prompts** — this is the same Scope Restrictions boundary that applies within FR, extended cross-team. Team-lead is already holding the cross-team routing for tmux-direct-brief to Schliemann at session close (per team-lead heads-up message 19:14). Cal does not originate the apex-research-side edit; the edits above are FR-side only.

For Schliemann's reference when routing: the apex-research edits should be structurally identical (pre-classification zone check in Protocol A, bootstrap-path xireactor session_init read in Bootstrap, parallel Step 5.5 in apex-research's startup.md), with FR/apex tenant labels swapped throughout. The payload-class genealogy argument from §11.5.2 applies symmetrically — Eratosthenes's wiki-equivalent of #43 (if any) should be cross-referenced in her copy.

---

## 11.6 Wiki action on Monte's two candidate patterns

Team-lead flagged two candidates from Monte's governance doc and asked my call on promotion shape, threshold, and timing. My decisions:

### 11.6.1 Candidate (a) — "Multi-mode failure modes need multi-mechanism defenses"

**Decision:** **DEFER to n=2.** File in scratchpad as queue, not in wiki this session.

**Reasoning:**

The instance in Monte's §4.1 (three-check authority-drift design: ownership ritual + sunset review + audit-independent boundary report, each catching a distinct failure mode) is a clean, designed instance of the shape. **But it is n=1.**

I looked for supporting instances in the existing wiki:

- **`patterns/correlated-failure-single-provider.md`** documents the OPPOSITE shape — 5 enforcement layers (E0–E4) that collapse simultaneously because they share a substrate. That is the **anti-pattern** that Monte's pattern actively defends against. Correlated-failure is NOT a second instance of multi-mode-multi-mechanism; it is the failure mode the multi-mode-multi-mechanism shape prevents. Siblings, not duplicates. The sibling relationship is structurally informative — the existence of correlated-failure in the wiki GIVES VOCABULARY to what goes wrong when you lack multi-mechanism defenses. When I eventually file multi-mode-multi-mechanism, it should cross-reference correlated-failure as the anti-pattern. But that cross-reference does not itself qualify as a second instance.
- **Volta's persist/restore design** (`docs/persist-coverage-design-v0.3.md` and the F1+F2 Fix session that shipped) had multiple defensive layers for the shutdown/restart problem. But those layers were not explicitly motivated by "different failure modes need different mechanisms" — they were each fixing a different bug that happened to land in the same Fix session. The shape is accidental-not-designed. A weaker candidate that probably does not clear the "same shape" bar under strict interpretation. If I stretched to call it a second instance, I would be inflating n, and that violates the n=2 discipline I hold others to.
- **`patterns/integration-seam-governance-impact.md`** classifies governance impact by integration-seam type (sidecar = minimal governance, peer = non-linear governance, MCP = structured). That is a taxonomy, not a defense-in-depth pattern. No fit.
- **`decisions/audit-independence-architecture.md`** is ABOUT the audit container being a distinct role from the librarian. It is an input to Monte's §4.1 Check 3, not a parallel instance — same architectural piece showing up inside the candidate, which is structurally "the same n=1" not a second n.

**Net: n=1 stands. DEFER.**

The pattern is strong enough that I want to file it the moment a second instance appears. The most likely second-instance source is the Volta persist/restore Design session (D1–D7) when it lands formally, where team-lead and Volta may frame a three-mechanism defense against three failure modes (compaction, crash, stale-state) rather than the current accidental layering. That would be a designed second instance.

Sub-queue instruction to self: when reviewing future Volta outputs, watch for "explicitly scoped failure modes → explicitly scoped mechanisms" framing. That is the promotable signal.

**Queued in scratchpad.** Not filed this session.

### 11.6.2 Candidate (b) — "Bootstrap-preamble as cross-tenant pending-work channel"

**Decision:** **AMEND #43 with a single validation paragraph.** Minor edit, preserves forward-only cross-ref convention, makes the connection to Monte's pilot design durable for when the pilot actually runs.

**Reasoning:**

Wiki #43 already explicitly lists "Governance — pending reviews, staging-table items awaiting promotion (xireactor)" as a payload class for the bootstrap-preamble channel. Monte's §5.1 validates this payload class at the cross-tenant level — which is a subtle but significant shape-extension: the original #43 claim covered intra-tenant governance (xireactor's own session_init surfacing pending Tier 3+ items to the submitting librarian in the same tenant). Monte's pilot design exercises cross-tenant governance (FR librarian's submission surfaces in apex's session_init, dual-receiver delivery for Tier 4 escalation).

Three options considered:

1. **Sibling entry** specifically about cross-tenant dual-receiver semantics. Dual-receiver IS a genuinely new primitive that #43 did not cover — a channel that delivers to two tenants' librarians simultaneously is shape-different from the single-receiver continuity case. **Rejected for this session:** the pilot is not deployed yet, so this is n=1 validated design rather than n=2 deployment validation. Filing a new entry on a design artifact inflates n.
2. **File as entirely new entry** about "bootstrap-preamble for cross-tenant governance." **Rejected:** duplicates #43's core claim and its "Same Shape, Different Payload" section. Filing a new entry that says what #43 already says (with "cross-tenant" inserted) would violate the mega-biblion-mega-kakon principle. I would be growing the wiki by duplication, not by insight.
3. **Amend #43 with a validation paragraph.** #43's "Same Shape, Different Payload" section already named governance as one of four payload classes. Monte's §5.1 is a designed instance of one of those classes being exercised in a specific way (cross-tenant, dual-receiver). Adding a paragraph that calls out Monte's §5.1 as the **first designed instance of cross-tenant governance** leaves a durable forward-ref to when the pilot actually validates it in deployment. **Accepted.** The edit is small, preserves forward-only (the new paragraph cites Monte's doc forward; Monte's doc does not back-ref #43), and matches the discipline of wiki entries growing by validation rather than by duplication.

**What the amendment says** — see the actual wiki file after I apply the edit. Summary: a short paragraph under "Same Shape, Different Payload" noting Monte's governance pilot design as the first designed instance of cross-tenant governance payload, flagged as design-validated (not deployment-validated), with a forward-ref to `docs/xireactor-pilot-governance-2026-04-15.md` §5.1. When the pilot actually ships and cross-review items flow empirically, this amendment upgrades to deployment-validation — at which point #43 may warrant a full edit to pull dual-receiver into the entry body as a first-class primitive, in a separate future session.

**Threshold rationale:** the amendment is a VALIDATION edit, not a new-entry edit. Validation against a design artifact is a weaker signal than validation against deployment, so the amendment is also weaker than a full entry rewrite — which is exactly the shape the amendment should have. Small, precise, honest about its level of evidence.

**Timing:** this session. The amendment is small, does not touch adjacent sections, and produces durable provenance for Monte's doc at exactly the point where a future reader of #43 would otherwise wonder "has this generalized?" — answer: "yes, Monte's governance pilot design adopts this channel for the cross-tenant case, see §5.1 of `docs/xireactor-pilot-governance-2026-04-15.md`."

---

## 11. Summary

- **Full migration: NO.** Structurally lossy for FR; duplicative governance with Protocol A for FR-owned entries; regressive on enforcement shape (four discipline primitives — `ttl`, `revisit-by`, `confidence`, `status='disputed'` — each lose their scheduled-scan semantics on a DB substrate without xireactor schema extensions). **Already excluded by Monte's tenancy framing.**
- **Asymmetric co-owned-slice pilot: YES, recommended.** Under Monte's framing, FR-owned and apex-owned entries stay in markdown+git (Protocol A authoritative, Librarian discipline unchanged). Xireactor substrates a NEW category — co-owned entries — with dual-Librarian Tier 4 escalation and session_init preamble signaling at cross-tenant scope. Minimal infrastructure, no backfill migration, clear success criteria, preserves all current FR affordances.
- **Co-owned entries are the strategic hinge** that makes xireactor's infrastructure earn its keep. Everything else is duplicative (FR-owned staging) or hypothetical (shared full-text search, multi-provider reviewer).
- **Discipline-primitive fate called out explicitly in §1.1.1** per team-lead's brief: the provenance primitives migrate as data; the enforcement primitives (ttl, revisit-by, confidence, disputed) degrade from scheduled-scan to prompt-enforced on a DB substrate. Good news: none of this matters for the asymmetric pilot because FR's own entries never touch xireactor.
- **Zero wiki entries filed this session.** Three candidates queued (librarian-asymmetry-vs-staging-governance pattern, filesystem-contract-to-prompt-contract-regression gotcha, git-blame-as-librarian-primary-tool prompt-promotion candidate), all below n=2 threshold.
- **Migration blockers flagged to Brunel (host arch), Monte (governance policy + tier-assignment rules + confidence floor + principal definitions), Herald (`ownership` field in Protocol A schema + dual-receiver session_init preamble class + MCP tool schema for co-owned submit/query + availability fallback).**
- **substrate-invariant-mismatch n=3 draft stays queued** — explicitly out of scope per team-lead directive, not touched.

(*FR:Callimachus*)
