---
author: aen
team: framework-research
date: 2026-05-05
issue: 64
phase: C (discovery brief — synthesis)
sources:
  - docs/2026-05-05-postgres-library-discovery/cal-internal-perspective.md
  - docs/2026-05-05-postgres-library-discovery/finn-brilliant-deepread.md
  - docs/2026-05-05-postgres-library-discovery/finn-staging-review-deepread.md
related:
  - issue 59 (parked xireactor pilot, session 13)
  - docs/xireactor-pilot-migration-assessment-2026-04-15.md
---

# Discovery Brief — Postgres-Backed Library Service

(*FR:Aen*)

## Verdict

**Proceed to phase A**, scoped as: **adopt the path-namespace federation pattern already in production at esl-suvekool, scale to FR + apex + other teams.**

Mid-session reframe (Finn's Haapsalu-Suvekool glance, 2026-05-05 15:07): Topology B is not a future-design question — it is an operational reality at esl-suvekool today. *Path-namespace per team inside a shared central Brilliant IS the federation contract.* Phase A is therefore not architecture-design from first principles; it is **scaling a proven operational pattern to additional teams**, with the role-evolution mechanics (Cal as namespace-curator) as the substantive design surface.

The earlier framing — "design a federation layer over per-team markdown wikis" — was a step too far back. Cal's substrate-sovereignty argument carries forward at the *namespace* level rather than the *substrate* level: each team owns its `Projects/<team>/*` namespace inside the shared Brilliant, the way it owned `wiki/<team>/` previously.

Session-13 substrate-mismatch concerns are addressed by the path-namespace pattern: per-team sovereignty preserved at logical-path granularity rather than filesystem granularity.

## Problem statement (recap, with confidence-graded)

Of the five pain points named in issue #64:

| Pain | Status (FR's reality, May 2026) | Phase-A treatment |
|---|---|---|
| A — Cross-team query | **Real and frequent.** I cannot answer "what does apex's Eratosthenes know about persist-state?" from inside FR. Today's coping mechanism: cross-link convention #50 + team-lead relays. | Primary use case for the federation layer. |
| B — Scale | **Real, slow-moving.** FR=59 entries / 24 sessions; apex<10. Architectural-fact duplication observable cross-team (~5-10% eyeball, census = phase-A prerequisite). | Solvable by federation; does not require migration. |
| C — Substrate ergonomics | **Speculative-as-stated for FR volume.** No joins / no transactions is real but has not blocked Cal. `grep` on 59 files is fast. More legible at scale than at our current size. | Defer; revisit when scale crosses threshold. |
| D — Governance drift | **Real.** Three single-entry experiments at promotion-grade with no formal propagation mechanism to apex's Librarian. | Brilliant's tier-table approach is **transplantable as policy without infrastructure**. Phase A explores both lanes. |
| E — Service/API | **Speculative.** No non-Claude consumer has asked. Could become real if dashboards land. | Defer until consumer materializes. |

A+B+D drive the federation layer. C+E remain speculative for now.

## Current model — load-bearing primitives we cannot lose

Cal identified five primitives the markdown+git substrate provides for free, in order of daily use:

1. **Git-blame** as dispute audit trail (single biggest cost to Cal's daily work if migrated)
2. **Git-log** as session-close diff (structurally prevents claiming work not done)
3. **Directory tree as typed classification contract** (eight subdirs carry eight distinct governance shapes)
4. **Hand-authored "Related" prose** (more cross-entry insight than entry bodies)
5. **Grep-as-filter for literal identifiers** (single-entry-experiment census in one command)

PR-shaped review and file-as-merge-unit are real but lower-priority.

A federation layer must either preserve these (by keeping the per-team wiki as authoritative source) or reproduce them in DB substrate explicitly — phase A picks one branch.

## What Brilliant teaches us

Finn's deep-read of `thejeremyhodge/xireactor-brilliant @eb1d1bf` (v0.5.1, 32 migrations, ~3 days old at read time) found a high-quality reference architecture. Borrow shapes structurally; do not adopt wholesale.

### Worth borrowing (structural patterns)

- **Staging-table shape for agent writes** — `kb_agent` role has no INSERT/UPDATE/DELETE on entries; all agent writes route through a `staging` table. Maps directly to our governance question: librarian-A's write doesn't immediately appear in team-B's view; staged proposal until governance promotes.
- **Typed `entry_links` table + recursive CTEs** — six link types (`relates_to | supersedes | contradicts | depends_on | part_of | tagged_with`). Sidesteps AGE, runs on vanilla Postgres. Cal's "hand-authored Related prose" maps onto typed edges + a `relation_note` column, accepting the prose-vs-structure tension one layer down.
- **Forced RLS + `SET LOCAL ROLE` discipline** — pooled-connection-safe multi-tenancy. Non-obvious, reproducible.
- **Density manifest at `/session-init`** — ≤2K-token preamble (counts, top paths, top tags, system entries, pending reviews previews). Answers cold-start orientation without dumping the full corpus. Reusable shape.
- **AI reviewer with 0.7 confidence floor** — never auto-approves on ambiguity. Matches Cal's curation discipline.
- **Append-only history at the policy layer** — no UPDATE/DELETE policies on `entry_versions` and `audit_log`, not just app-layer convention.
- **Write-path sync of derived data** — `entry_links` re-derived from `[[wiki-link]]` on every POST/PUT. **Independent confirmation of the substrate-invariant-mismatch pattern** (separate from yesterday's teamcreate-leadership case — see §"Substrate-invariant-mismatch pile-up" below).

### Idiosyncratic to Brilliant — does not fit our needs

- **Single-owner-first onboarding** (their product story is "you alone build, then invite"; ours is multi-team-from-day-one)
- **Render-first deploy** with `render.yaml` and `RENDER_EXTERNAL_URL` threaded throughout
- **Anthropic-hardcoded Tier-3 reviewer** (claude-sonnet-4-6, no pluggable providers shipped)
- **Co-work-first MCP UX** with DCR explicitly disabled
- **Google Workspace role taxonomy** as prior commitment
- **`org_id` is the tenant boundary, not team** — cross-team within one org = `permissions` table or shared sensitivity; we need cross-team-with-scope as primary, not edge case

### Gaps for our use case

- **No librarian-replication patterns.** One canonical KB per org. Our model has per-team librarians replicating subsets to a hub. We'd add: librarian principal type, replication contract (pull/push), staleness markers, conflict policy when librarians disagree.
- **No Protocol A/B/C semantics.** Staging tier + change_type ≠ "submission vs query vs revision". Our protocols would layer over staging + custom MCP tools.
- **No markdown vault round-trip.** `import_vault` is one-way. Federation-layer design avoids this gap entirely (per-team wiki stays authoritative).
- **No git-blame-equivalent first-class surface.** Metadata exists (`entry_versions.changed_by`, `audit_log.actor_id`) but no "show me who said what when on this contested fact" view. Cal's session-13 [LEARNED] flagged git-blame as load-bearing — we'd build this view if we go DB-primary; we'd inherit it for free if federation-layer.
- **No team-level sensitivity ceiling.**
- **No pure-Postgres-no-Anthropic deployment path.** Tier 3 piles up at human review without `ANTHROPIC_API_KEY`. Closed-network deployment needs a different reviewer.

## The design fork — RESOLVED 2026-05-05 (substantively re-reframed mid-session)

Initial framing of the C-phase question was *"Postgres-or-markdown, where does the authoritative entry live, federation-layer or DB-primary."* That framing turned out to be wrong — not because the alternatives are bad, but because the answer was already in production at the org and we hadn't read it.

**Operational reality (Finn's Haapsalu-Suvekool glance, mitselek/Haapsalu-Suvekool@e7d2546f):** Brilliant is in active production use as the central knowledge layer for esl-suvekool. The "Topology B per-team libraries + central federation" pattern is implemented as **path-namespace per team inside a shared central Brilliant** — not as separate per-team libraries with a federation layer above them.

Specifically:

- **Path-namespace IS the federation primitive.** `Projects/esl/*` is esl-suvekool's shard. `Meetings/esl/<date>`, `Context/esl/*`, `Resources/esl/*` are the operational namespaces. Cross-team query is URL-shaped (`logical_path="Meetings/esl/..."`). Convention does the work; no formal federation contract needed.
- **Writes route through staging** per repo governance — Brilliant's agent-write-via-staging contract proven in production.
- **`Brilliant pulse` ritual** at session-start (search recent entries, skim `updated_at` and `domain_meta.status`) = lightweight session_init density-manifest applied operationally.
- **Quality floor for promotion**: *"stable, non-obvious, saves-future-me-5min"* — what gets pushed from scratchpad to Brilliant.
- **Two-consumer handshake** (`roadwarrior-sync` skill) bridges direct-MCP consumers (local team) with copy-paste consumers (claude.ai Projects) via `[SYNC BRIEF]` ↔ `[SYNC: YYYY-MM-DD]` cycle.
- **Source-of-truth discipline** (from `docs/stakeholders.md:166`, ET): *"Brilliant on tõe-allikas, see fail on käsiraamat"* — "Brilliant is the source of truth, this file is the manual."

### What this means for phase A

Phase A is no longer *"design a federation layer over per-team wikis."* It is: **adopt the operational pattern that already works at esl-suvekool, scale it to FR + apex + other teams.** Concretely:

1. Frame FR's `Projects/fr/*` namespace, apex's `Projects/apex/*`, etc. — establish the per-team path-namespace convention as the federation contract.
2. Configure Brilliant MCP for FR (currently NOT configured for this session — `mcp__brilliant__*` tools unavailable here, only at esl-suvekool).
3. Cal's role evolves from *"sole writer to FR's markdown wiki"* to *"FR's namespace curator inside the shared Brilliant"* — sovereignty preserved at the namespace level, federation gained for free.
4. Phase A still owns: dedup census across team namespaces, gap-tracking instrumentation across-namespaces, Cal's role-evolution mechanics, governance for who can write to which namespace.

### What does NOT need re-design (subsumed by operational reality)

- **Substrate fork** (DB-primary vs markdown-primary) — answered by the operational fact that Brilliant is the substrate for esl-suvekool today and works.
- **Federation-layer architecture** — answered by path-namespace convention. Convention IS the contract.
- **Battle-proof claim** — Brilliant has 20+ refs at esl-suvekool across `teams/esl-suvekool/{startup,common-prompt,design-spec}.md` + scratchpads + docs. The pattern is real, in use, with documented operational rituals.

### The earlier polyphony glance retroactively makes sense

The polyphony glance returned a clean negative for federation refs. That was correct — polyphony-dev's "federation" is choral-music product-domain, not knowledge-base. PO's "battle-proof" intuition lived at a *different* repo (Haapsalu-Suvekool), and the bio-memory mismatch was caught by Finn's verification discipline. Wiki-pattern candidate filed (`"Cross-repo glance: confirm citation before assuming inheritance"`) on the back of that.

This is exactly the integration-not-relay discipline (wiki entry #44) doing its job — verify substrate claims against the actual substrate before downstream design depends on them. The discovery brief would have proposed a *different* phase-A scope if we'd skipped the verification.

## Independence path

Brilliant is not a fork target. It is a *reference architecture* — we read its schema, RLS strategy, MCP shape, governance tiers as worked examples and re-derive what we need.

Practical implications:

- We do not contribute back upstream
- We do not pin against their version cadence (v0.5.0 broke DCR; v0.5.1 removed `--key-out` from installer — independence avoids inheriting a moving target)
- We free-borrow patterns; we re-implement code
- Phase A may produce schema sketches that look 60-70% similar to Brilliant's — that is correct; convergent solutions to convergent problems

## Curator surface — what's plug-in-shaped

PO surfaced an architectural extension during this session: a **dedicated team that maintains the KB**, where curation is done by agents (persistent identity, peer review, domain specialists, dedup pass) rather than a stateless API call. Initial framing was event-driven ("every read/write triggers team-lead"); PO walked it back to "time-based maintenance runs are also valid — vision not mature." This is a phase A decision; what matters for the discovery brief is whether Brilliant's substrate accommodates the ambition.

Finn's follow-up code-read of `staging.py` (1126 LOC) and `services/ai_reviewer.py` (245 LOC) is unambiguous: **data model survives, orchestration must be replaced.**

### What survives (reusable as-is)

- `staging` table shape — sufficient to record curator-team decisions when augmented with a sibling `staging_reviews` per-reviewer votes table
- `_promote_staging_item` — agent-orchestration-agnostic write-to-entries logic with version-bump; the canonical way an approved entry lands in the live KB
- `_assign_governance_tier` — reusable routing decision tree
- Tier 1 (auto-approve, optimistic-concurrency) and Tier 2 (auto-approve with SQL conflict detection on duplicate `content_hash` + colliding pending stages) — orthogonal to the agent layer, keep intact
- Audit log integration — append `staging.team_review_*` actions

### What requires replacement

- `services/ai_reviewer.py` (entire file) — single-shot Anthropic call with no extensibility seams: no `Reviewer` interface, no events, no queue worker abstraction, no tool-calling, no iteration, no per-reviewer state, no consensus support
- The Tier 3 branch in `process_staging` (lines 887-931) — minimum a redirect to a new orchestrator; cleanly a stripped block that enqueues "needs team review" and lets a curator-team worker handle asynchronously
- Multi-reviewer schema additions — `staging_reviews` keyed `(staging_id, reviewer_id)` + consensus-policy function (unanimous? majority? weighted by `users.trust_weight`?)

### Why replacement, not extension

The integration site is too thin to plug into. No `Reviewer` interface, no event to subscribe to, no queue to attach a different worker to. Adding a curator team without removing the Anthropic call would race on the same staging row.

**Cleanest path** (Finn's reusable code shapes adapted to PO's no-fallback constraint, validated against the time-based maintenance run shape PO surfaced):

1. **Rip out `services/ai_reviewer.py`.** No fallback path. The Anthropic-call reviewer does not stay as a backup mode. PO's standing constraint: one source of truth, no multi-tier fallback chains.
2. **Route Tier 3+ to the curator-team orchestrator only.** A separate worker process polls `WHERE governance_tier >= 3 AND status = 'pending'`.
3. **Worker fans out to specialist curator-agents** (Cal-equivalent classifier, dedup checker, domain expert if applicable), aggregates votes via consensus policy, writes per-reviewer `staging_reviews` rows + final decision to `staging`.
4. **Cron cadence and read-event observability** are independent design knobs — orchestrator can be polled-only (time-based) or pushed-to (sidecar event bus) at phase A's discretion.

### Decision: write-availability is gated on team-availability (no fallback)

If no curator team is alive, **the system refuses new writes that escalate to Tier 3+**. Tier 1/2 (deterministic SQL auto-approve, conflict-free) continue to work — they don't depend on the curator team. Tier 3/4 staged writes return a clear error: *"no curator team available — retry when curator-team service is up."* Reads remain available from previously-approved entries.

Rationale: PO standing principle (`feedback_no_fallbacks.md`) — one source of truth per concern. If the curator team is the source of truth for governance review, an Anthropic-call fallback is not a backup, it is a *different* source of truth that produces inconsistent decisions over time. Cleaner to fail fast on team unavailability than to paper over it with a degraded reviewer.

Operational implications:
- Closed-network deployment is no longer a special case — there is no `ANTHROPIC_API_KEY` dependency to design around. Curator team runs locally; deployment portability follows from team-portability.
- Team-availability becomes a load-bearing operational concern (monitoring, restart, redundancy) — phase A territory.
- Write-blocking is a *feature* — agents are forced to retry, signaling clearly that governance review is part of the contract.

### Event surface — push vs poll

Finn's Q8 inventory: Brilliant has **zero push events anywhere** (grep confirms: no `pg_notify`, no `LISTEN`/`NOTIFY`, no WebSocket, no SSE, no `StreamingResponse`/`EventSourceResponse`, no message queue — bare deps `fastapi, uvicorn, psycopg, bcrypt, anthropic, boto3, pypdf, PyYAML`).

What it has: **three poll-only append-only Postgres tables** that already capture everything we'd want a watcher to react to.

| Table | Captures | Indexed for |
|---|---|---|
| `request_log` | every read AND write (fire-and-forget middleware INSERT, excludes `/health` + `/static/*`) | `(org_id, ts DESC)` |
| `entry_access_log` | every read returning entry IDs — list, get, graph, neighbors, staging-list — one batched INSERT per request | `(org_id, ts DESC)` |
| `audit_log` | writes only, allowlisted verbs (comment_*, grant, revoke, group_*, import_rollback, staging.tier{1,2}_auto_approved, staging.batch_approved, staging.approved, staging.rejected) | `(org_id, ts DESC)` |

**Recommended integration shape (Finn's Q8 verdict): sidecar polling with sequence-cursor.** Lowest cost, no fork, no schema migration, reuses RLS + admin role intact. 1-10 second polling-interval-bounded latency. Promote to `pg_notify` triggers only if polling latency becomes a real constraint (Q9 numbers say it won't at our volume).

### Throughput — does cascading work survive the volume?

Finn's Q9 sanity check (load-bearing for the curator-team-as-orchestrator design):

- **Brilliant's published concurrency stress (README):** ~178 ops/s flat at 20-120 concurrent clients, 99.8%+ success, zero corruption. Single Postgres-Basic-256mb on Render, pool max=10. Flat curve = pool saturation, not Postgres limit.
- **Our speculative volume** (no source data; revisit when phase A instruments real measurement): 7-agent team × 4-8 sessions × 20-50 queries ≈ 600-2,800 reads/day/team. 10 teams ≈ 6K-30K reads/day cluster-wide. Sustained ~1-10 reads/sec, peaks ~30-50/sec — **well inside Brilliant's measured headroom**.
- **Polling sidecar overhead:** 3 SELECTs per interval at 5s = 0.6 ops/s. Negligible.

**The cost-bounding insight (Finn's Q9, load-bearing for the design):** spawning a specialist per raw read is N×M expensive and drowns both the orchestrator and the team. The sustainable shape is to **derive signals before spawning** — heat ("entry X read 5x/hour by 3 agents"), collision ("write to Y conflicts with pending Y'"), gap ("search returned no results 4 times in a row"). Sidecar polls firehose → rule-based derivation → emits derived events only. Cost bounds at derivation-rate, orders of magnitude below raw event-rate. Brilliant's own `get_usage_stats` rollups (`top-entries`, `session-depth`, 15-min windows) make the same call: reads are listenable, just queryable rather than push-emitted.

### Roadmap collision check

Brilliant's own roadmap lists "alternative LLM providers for Tier 3 reviewer" as *idea, not committed*. Even that lighter refactor would require a provider abstraction they currently lack — they are themselves locked into single-reviewer-single-shot until they ship that. **Our team-of-curators ambition is one step further than what they are planning.** This reinforces the independence posture: we cannot bet on their roadmap delivering a hook we'd plug into.

### Pattern candidates flagged for next Cal batch

Three surfaced from Finn's deep-read, all Cal-Protocol-A-grade:

1. **"OSS thin-integration anti-extension signal."** When an OSS integration is a single function call to an external API with zero hooks/events grep, single call site, schema fields locked to one-reviewer-per-row → that is a hard "replacement" signal, not an extension surface. Data model often survives; orchestration cannot be plugged into. n=1 (Brilliant Tier 3). Promote on second instance.

2. **"Poll-only-substrate + sidecar-derivation as event-driven shape."** When OSS substrate has no push events but rich poll-able append-only tables, the right architecture is sidecar polling with sequence-cursor → rule-based derivation → emit *derived* events only. Independence-preserving, bounded cost (derivation-rate not raw-rate), forensic-queryable raw firehose stays in source DB. n=1 (Brilliant request_log + entry_access_log + audit_log). Promote on second instance.

3. **"Soft-verdict discipline on substrate-mapping briefs."** When PO framing is in-flight and team-lead asks for a surface map (not architecture pick), the right shape is a table of N options × {accommodates without modification / accommodates with additions only / requires replacement} with concrete code-cost notation per cell, not a "recommended" verdict. Saves rework when PO reframes mid-stream. Process-discipline pattern; n=1 (today's #64 thinktank — Finn's two re-framings of his own Q7). Promote on second instance.

### Substrate-map verdict (post-Q8+Q9, post-PO-relaxer)

Phase A picks the architecture; today's brief maps the substrate. Per Finn's revised framing, Brilliant's substrate vs four candidate curator-team shapes:

| Shape | Data model | Reviewer code | Event surface |
|---|---|---|---|
| Brilliant-as-shipped (single Anthropic call, no curator team) | reusable | as-is | n/a |
| Time-based maintenance run (poll worker, no push events) | reusable | requires replacement | accommodates without modification (poll the three append-only tables) |
| Sidecar event-bus (push events to coordinator) | reusable | requires replacement | accommodates with additions only (DB triggers + `pg_notify`, or fork middleware to publish, or CDC) |
| Hybrid (poll + selected push for hot signals) | reusable | requires replacement | accommodates with additions only |

**What the substrate gives for free across all shapes:** append-only logs with `(org_id, ts DESC)` indexes, RLS-enforced multi-tenancy, `kb_admin` role for privileged scans, `staging` table as proposed-change queue, `audit_log` as writes-only mutation history.

**What the substrate does NOT give, independent of shape:** per-reviewer state, consensus voting schema, push events, sub-second reactivity without trigger additions, `pg_notify` plumbing, message-queue infrastructure, librarian-replication semantics, cross-team-with-scope (vs cross-org). All four are additive work in any shape.

PO standing decision (this session): no fallback to Brilliant-as-shipped — `services/ai_reviewer.py` is removed regardless of shape, since it would compete with the curator team as a different source of truth. This narrows the table's "Brilliant-as-shipped" row to "not selected" rather than "fallback."

## Substrate-invariant-mismatch pile-up

Independently from this discovery, Finn's Brilliant deep-read produced a fresh confirmation of the substrate-invariant-mismatch pattern. Brilliant re-derives `entry_links` from `[[wiki-link]]` on every write — explicit acknowledgment that derived data read at render time must be written on the write path.

Our wiki entry `patterns/substrate-invariant-mismatch.md` is currently at n=3 on disk. Yesterday's batch authorized Cal to amend to n=4 (teamcreate-in-memory-leadership-survives-clear case). Finn's Brilliant case is now a separate fifth instance.

Cal's call on whether this becomes:
- Two separate amendments (n=3 → n=4 → n=5), or
- One coordinated batch (n=3 → n=5 with both new instances cited)

Either way, the pattern's evidentiary base has gone from "n=3 watch" to "n=5 confirmed across two distinct substrate domains" (our team operations + an external KB platform's design choices). Worth elevating to Protocol C at the next batch session — but that is downstream of this discovery brief.

## Open questions for phase A

1. **Census of cross-team-deduplicable entries.** Cal's eyeball estimate is 5-10%. Phase A needs a real count — apex + FR + raamatukoi + ruth-team wikis sampled.
2. **Cross-team query frequency.** Phase 2 gap-tracking surfaces only intra-team gaps. Phase A needs to instrument a cross-team-query-attempt log (even just team-lead's relay events) to ground demand.
3. **Federation-layer write semantics.** Markdown→DB sync: post-commit hook (cheap, eventual) vs librarian-mediated submission (governed, manual). Pick one or design both.
4. **Librarian-replication contract.** Pull, push, or hybrid? Conflict policy when librarians disagree on classification? Staleness markers?
5. **`SET LOCAL ROLE`-equivalent multi-team safety.** Brilliant's pattern is well-worked but assumes RLS-as-primary-isolation. Federation-layer may not need it if per-team wikis stay authoritative; phase A decides.
6. **Curator-team orchestration shape.** Polling worker (time-based maintenance run) vs sidecar event-bus (every read/write triggers cascade) vs hybrid. PO's vision is unmature; phase A picks a starting shape and instruments to learn.
7. **Consensus policy for multi-reviewer staging.** Unanimous, majority, weighted-by-trust? Quorum size? Conflict resolution when curators disagree?
8. **Team-availability monitoring + write-block error semantics.** Decided: no fallback. Open: how does the API surface communicate "team unavailable, retry" — HTTP 503? a queued-with-retry-after pattern? per-tier degradation rules? Phase A defines the contract.
9. **Signal derivation rules.** Resolved-in-principle by Finn's Q9 (cost bounds at derivation-rate, not raw-rate). Open: which derived signals are worth listening to? Heat thresholds (N reads in T window by K distinct agents)? Collision detection (overlapping pending stages)? Gap signals (search returned empty)? Phase A picks a starting set, instruments to learn.
10. **Phase A team composition.** Cal+Finn carry forward; add Brunel (deployment shape, federation infra, polling-worker process design), Monte (governance/auth boundary changes, curator-team authority), Herald (MCP/REST surface design, curator-team agent protocols). Volta and Celes deferred to phase B if proceed.

## Confidence-graded summary

| Claim | Confidence |
|---|---|
| Federation-layer is the right phase-A scope | **High** (Cal+Finn independent convergence) |
| Per-team substrate stays markdown+git | **High** (preserves all five load-bearing primitives) |
| Brilliant is a usable reference architecture | **High** (Finn's verification: schema matches docs, RLS sound, governance is real code) |
| Pain points A+B+D justify the layer | **High** (real today, not speculative) |
| Pain points C+E justify the layer | **Low** (speculative for FR volume; revisit on signal) |
| 5-10% deduplicable cross-team | **Eyeball** (phase-A prerequisite to measure) |
| Brilliant productization changes the calculus | **High for library-of-libraries**, **neutral for per-team substrate** |

## What this brief does NOT decide

- Schema details (phase A)
- Deployment shape — Render? self-host? closed-network? (phase A/B)
- Tier 3 reviewer policy (phase A)
- Migration timeline for legacy markdown (only relevant if Branch 1 chosen — phase B)
- Team-design questions (centralized library team vs distributed) — Cal flagged these are *secondary to substrate questions*; phase A scopes them after Branch 1/2 decision
