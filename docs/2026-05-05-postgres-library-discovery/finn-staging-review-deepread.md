# Brilliant staging-review code path deep-read

Read-only follow-up to `finn-brilliant-deepread.md` — focused on whether the surrounding code path could host a 24/7 team-of-curators. Files studied: `api/routes/staging.py` (1126 LOC), `api/services/ai_reviewer.py` (245 LOC).

(*FR:Finn*)

## Top-line

Brilliant's Tier 3 reviewer is a **single-shot, stateless, single-call** Anthropic API invocation with no plugin surface, no hooks, no events, no queue abstraction, no multi-reviewer support. Observability surface is **three poll-only Postgres tables** (`audit_log`, `request_log`, `entry_access_log`) — no `pg_notify`, no LISTEN, no WebSocket, no SSE, no message queue (deps: `fastapi`, `psycopg`, `bcrypt`, `anthropic`, `boto3`, `pypdf`, `PyYAML`). **Q7 framed as substrate-map**: data model fully reusable across multiple extension shapes; Tier 3 reviewer code path requires replacement under any shape that adds a curator team. Substrate accommodates *brilliant-as-shipped* and *time-based maintenance* without modification; accommodates *sidecar-event-bus* and *hybrid* with additions only; requires reviewer-code replacement under any curator-team shape. Phase A picks the architecture; this memo only maps costs against the surface.

## 1. Tier 3 entry/exit

**One call site:** `staging.py:889` inside `process_staging` admin batch loop, after deterministic checks pass.

**Function:** `services/ai_reviewer.py:153 review_staging_item(conn, staging_item: dict, context_entries=None) -> AIReviewResult`

**Input the model sees** (`_build_user_prompt`):
- target_path, change_type, submitted_by, governance_tier
- proposed content_type + sensitivity (from `proposed_meta`)
- proposed_title
- proposed_content (truncated to 4000 chars)
- evaluator_notes (e.g., reasons it escalated from Tier 2)
- Up to 5 related entries: title + logical_path + (summary or first 500 chars)

**Output:** `AIReviewResult(action ∈ {approve|reject|escalate}, reasoning, confidence ∈ [0,1])`. Confidence `<0.7` force-overridden to `escalate`. Any error path → `escalate`.

**State the reviewer can inspect:** Strictly limited to what `_build_user_prompt` packs. `_fetch_related_entries` runs two SQL queries: `WHERE logical_path LIKE '<prefix>%' LIMIT 3` then `WHERE tags && %s LIMIT 5-len(related)`. **No full-corpus access, no full history, no graph traversal, no search, no sub-tool calling.** Frozen snapshot.

## 2. Iterative or single-shot?

**Single-shot.** One `await client.messages.create(...)`. No tool definitions in the call. No `messages` continuation. The model cannot re-query, cannot ask clarifications, cannot call sub-tools, cannot iterate.

## 3. Integration hooks

**None.** Zero matches for `webhook|notify_*|publish_event|emit_event|EventEmitter|on_approve|on_reject|on_escalate|register_reviewer|reviewer_plugin`. No queue abstraction (no Redis/Celery/SQS — just Postgres `staging` table polled by `process_staging`). No pre-/post-review hooks. The call site is a direct synchronous-within-async function call. `audit_log` is write-only; nothing subscribes. The closest "extension point" is the `governance_tier` integer that code branches on — there is no `Reviewer` interface or strategy pattern.

## 4. Multi-reviewer / consensus

**Not supported.** The `staging` schema has single-reviewer fields: one `evaluator_notes TEXT`, one `evaluator_decision JSONB`, one `reviewed_by`, one `reviewed_at`. No table for per-reviewer votes, no consensus policy, no quorum. Subsequent calls overwrite (or COALESCE-append) `evaluator_notes`. Adding multi-reviewer requires: (a) new `staging_reviews` keyed `(staging_id, reviewer_id)` with action/reasoning/confidence per row, (b) consensus-policy function (unanimous? majority? weighted by `users.trust_weight`?), (c) rewrite of `process_staging` to fan out and aggregate.

## 5. Tier 1/2/4 details

**Tier 1 (auto-approve):** Synchronous in `submit_staging` (lines 552-660). Optimistic-concurrency check on update/append (raises 409 on `expected_version` mismatch). Then `SET LOCAL ROLE kb_admin`, calls `_promote_staging_item`, links staging→entry, writes `staging.tier1_auto_approved` audit row.

**Tier 2 (auto-approve with conflict detection):** Inline SQL only — (a) duplicate `content_hash` in `entries` (skipped for metadata-only updates), (b) other pending staging rows targeting the same entry. Any conflict → escalate-in-place: `UPDATE staging SET status='pending', governance_tier=3, evaluator_notes=...`. Clean → promote synchronously like Tier 1. **Conflict detection is purely SQL — no semantic check, no diff analysis, no merge logic.**

**Tier 4 (human-only):** No dedicated UI. No notification path (no email/Slack/webhook — confirmed absent). Surfaces only via (a) `GET /staging?status=pending` (admin sees all via RLS), (b) `session_init` density manifest's `pending_reviews` block (top 5 previews when `governance_tier >= 3`). Resolution: admin-only `POST /staging/{id}/approve` + `POST /staging/{id}/reject`. **No second-opinion workflow, no escalation chain, no SLA tracker, no aging metric.** `process_staging` explicitly skips Tier 4 (`WHERE governance_tier <= 3`).

`_promote_staging_item` (lines 119-422) handles `create | update | append | create_link`. Validates content_type, `SET LOCAL ROLE kb_admin` to bypass agent restrictions, INSERTs into entries + entry_versions atomically.

## 6. State/memory access

Reviewer gets a tightly scoped slice (per §1). What it does NOT see: KB-wide search, density manifest, full `entry_versions` history, graph traversal via `entry_links`, other pending staging items, audit_log, submitter's `trust_weight`, comments. The data exists in the schema; the reviewer code path doesn't fetch any of it. **No persistent-memory primitive** — no per-reviewer state, no learned-preferences, no bias-correction. Every call is stateless.

## 7. Replacement-vs-extension surface

What survives intact under any extension shape: `staging` table; `_promote_staging_item` (agent-orchestration-agnostic write-to-entries with version-bump); `_assign_governance_tier` (reusable routing tree); Tier 1/2 deterministic checks (orthogonal to agent layer); `audit_log` (extend with new `staging.*` action verbs).

What requires replacement under any curator-team shape: `services/ai_reviewer.py` (single-shot Anthropic call has no seams — no tool-calling, no iteration, no plugin protocol, no reviewer-id parameter, no consensus); Tier 3 branch in `process_staging` (lines 887-931) becomes either a redirect to a new orchestrator or a stripped block that enqueues "needs team review". Multi-reviewer schema additions (e.g., `staging_reviews` sibling table) are additive but required if consensus/peer-review is a feature.

The integration site has no `Reviewer` interface, no event to subscribe to, no queue to attach a different worker to. Two reviewers (Anthropic + curator-team) writing the same staging row would race; one must own Tier 3 at a time, with the other configurable as fallback.

[NOTE] Brilliant's roadmap lists "alternative LLM providers for Tier 3 reviewer" as *idea, not committed*. Even that lighter refactor needs a provider abstraction they currently lack. Our team-of-curators ambition is one step further on the same axis.

See §"Q7 verdict — substrate map" below for the four-shape characterization.

## 8. Event/observability hooks (Q8)

**Brilliant emits no events.** Three poll-only Postgres tables capture the full read+write surface:

| Table | Captures | Coverage | Mechanism |
|---|---|---|---|
| `request_log` | endpoint template, method, status, duration_ms, response_bytes, approx_tokens, org_id, actor_id, ts | **Every read AND write** (excludes `/health`, `/static/*`) | Fire-and-forget `asyncio.create_task` from `RequestLogMiddleware` |
| `entry_access_log` | actor_type, actor_id, entry_id, source, ts | **Every read returning entry IDs** (list, get, graph, neighbors, staging list with target_entry_id) | One batched multi-row INSERT per request via `services.access_log.log_entry_reads` |
| `audit_log` | actor_id, actor_role, source, action (allowlisted), target_table, target_id, target_path, change_summary, ts | **Writes only**, allowlisted verbs (comment_*, grant, revoke, group_*, import_rollback, staging.tier{1,2}_auto_approved, staging.batch_approved, staging.approved, staging.rejected) | Savepointed INSERT in `services/audit.py::record` |

**No push surface anywhere:**
- Zero matches for `pg_notify | LISTEN | NOTIFY` in `api/`.
- Zero matches for `WebSocket | SSE | StreamingResponse | EventSourceResponse`.
- No message queue / pub-sub — `requirements.txt` is `fastapi, uvicorn, psycopg, psycopg_pool, bcrypt, anthropic, boto3, python-multipart, pypdf, PyYAML`. No Redis, Celery, Kafka, NATS.
- No webhooks / outbound HTTP from write paths (only outbound is the Anthropic call from the Tier-3 reviewer).

**Four ingestion paths a consumer could use** (covered in detail in §"Q7 verdict — substrate map" below):

1. **Poll the three log tables with a sequence-cursor.** Lowest cost, 0 LOC against Brilliant, polling-interval-bounded latency.
2. **Postgres triggers + `pg_notify`.** Sub-second latency; forks Brilliant's migrations; NOTIFYs drop on listener disconnect (mitigate via cursor replay).
3. **Fork the middleware + `services/audit.py` + `log_entry_reads` to also emit events.** Sub-second; merge-conflict surface on every Brilliant upgrade.
4. **CDC (logical replication / Debezium).** Sub-second; highest ops overhead.

The substrate imposes a polling-interval latency floor unless the consumer adopts option 2-4. Filtering and aggregation can live in the consumer regardless of ingestion path; the read+write firehose never has to leave Brilliant's DB if the consumer doesn't want it raw.

## 9. Throughput sanity check (Q9)

**No deployment-running data available** — read-only code study only. Numbers below are Brilliant's own published figures + clearly-marked SPECULATIVE estimates for our context.

**Brilliant's published concurrency stress** (README "Concurrency Results"): 20-120 concurrent clients sustained ~178 ops/s flat, 99.8%+ success, zero data corruption. Mixed read+write, single Postgres-Basic-256mb on Render. The flat curve suggests pool saturation (`max_size=10` in `database.py:46`), not a Postgres limit.

**SPECULATIVE volume estimate for our context** (no source data, order-of-magnitude only):
- Per-team-per-day: 7-agent team × 4-8 sessions × 20-50 queries ≈ 600-2,800 reads/day/team. 5x on heavy curation days.
- 10 teams: 6K-30K reads/day cluster-wide; writes ≈ 5-10% of read volume.
- Sustained ~1-10 reads/sec, peaks ~30-50 reads/sec. Well inside ~178 ops/s headroom.

The polling sidecar adds 3 SELECTs per interval against indexed `WHERE id > $cursor` — at 5s interval, 0.6 ops/s. Negligible.

**Consumer-design notes** (substrate is permissive; cost lives in the consumer):

- Raw-firehose consumer absorbs ~1-10 reads/sec at our SPECULATIVE volume; cost grows linearly with event rate.
- Derived-signal consumer (heat: entry-read-N-times-in-window; collision: pending writes to the same path; gap: search-with-no-result patterns) bounds cost at derivation rate, orders of magnitude below firehose.
- Periodic-batch consumer scans `WHERE ts > $last_run` once per N hours; bounded by run frequency × scan cost; latency floor = run interval.
- Brilliant's `entry_access_log` + `get_usage_stats` rollups (top-entries, session-depth, 15-min windows) are designed for derived-signal consumption — same shape, just synchronously-queryable rather than push-emitted.

The substrate accommodates all three consumer shapes (and their hybrid). Phase A picks the consumer design.

## Q7 verdict — substrate map of four extension shapes

Restated as a substrate-only characterization (not an architecture pick):

| Extension shape | Substrate verdict | What's needed |
|---|---|---|
| **Brilliant-as-shipped** (no curator team; rely on Tier 1/2 + Anthropic Tier 3 + admin Tier 4) | **Accommodates without modification** | Configure `ANTHROPIC_API_KEY`; admin uses `/staging/{id}/approve|reject` for Tier 4. Zero LOC against Brilliant. |
| **Time-based maintenance runs** (curator agent wakes every N hours, scans `staging`/`audit_log`/`entry_access_log`, decides what to delegate) | **Accommodates without modification** | Worker reads via the existing REST API or directly via `kb_admin` Postgres role. The append-only logs + `staging` table are designed for periodic scanning. No fork, no migrations. Tier 3's Anthropic call can be left as a fallback for items the curator-agent doesn't touch in time, or disabled by unsetting the env var. |
| **Sidecar with event bus** (continuous read+write firehose; rule-based filter+derivation; team-lead notified on derived events) | **Accommodates with additions only** (no Brilliant code change) | Sidecar polls the three log tables with a sequence-cursor; emits its own derived events to whatever bus consumes them. **Or** add a Postgres trigger migration to `pg_notify` from the log tables — additive, but does fork the migration set. |
| **Hybrid** (time-based maintenance + sidecar for high-priority writes; raw-event firehose only for collision/conflict signals; periodic deep-scan for governance drift) | **Accommodates with additions only** | Same additions as sidecar shape, plus the cron job. The substrate doesn't care which subset of events flow through which path. |
| **Curator-team replaces Tier 3 reviewer** (any of the four shapes above, plus a multi-agent reviewer that supplants the single Anthropic call) | **Requires replacement** of `services/ai_reviewer.py` + the Tier 3 branch in `process_staging` (lines 887-931). Multi-reviewer schema additions (e.g., `staging_reviews` sibling table) likely needed if consensus/peer-review is a feature. The rest of the pipeline (`staging` table, `_promote_staging_item`, `_assign_governance_tier`, Tier 1/2 deterministic checks, audit_log) is unaffected. |

**What the substrate gives for free** across all four shapes: append-only logs with `(org_id, ts DESC)` indexes, RLS-enforced multi-tenancy, the `kb_admin` role for privileged scans, the staging table as a "proposed change" queue, the audit_log as a writes-only append-only mutation history. None of these need modification regardless of which shape phase A picks.

**What the substrate does NOT give for free** (independent of shape): per-reviewer state, consensus voting schema, push events, sub-second reactivity without trigger additions, `pg_notify` plumbing, message-queue infrastructure, librarian-replication semantics, cross-team-with-scope (vs. cross-org).

(*FR:Finn*)
