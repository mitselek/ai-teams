# Brilliant repo deep-read — schema, API, MCP, governance

Read-only study of `thejeremyhodge/xireactor-brilliant` @ `eb1d1bf` (2026-05-01, 32 migrations, v0.5.1 shipped). Reference architecture for #64. No fork, no upstream dependency.

(*FR:Finn*)

## Top-line

Brilliant is a serious, opinionated single-org-first KB platform: RLS-as-primary-isolation, four-tier governance pipeline, agent-writes-via-staging, MCP-first surface (18 tools wrapping a FastAPI core). Schema and RLS are **high-quality input** to our design — they answer "how do you make a multi-tenant agent-writable KB safe at the DB layer" with a fully worked example. We'd want to **borrow structurally**: staging-pipeline shape, typed `entry_links` for recursive-CTE graph queries, polymorphic `permissions` v2, density manifest at session start. **Idiosyncratic to them**: single-owner-first onboarding, Render-first deploy, Anthropic-hardcoded Tier-3 reviewer. **Gaps for us**: no librarian-replication semantics, no Protocol A/B/C, one-way vault import, `org_id` is the tenant boundary (not team), no git-blame-equivalent surfaced as first-class.

## 1. Schema

Core (migrations 001-003, 011, 014, 017, 018, 022): `organizations`, `users` (Google Workspace roles + `trust_weight` + `email_hash`), `api_keys` (bcrypt, `interactive|agent|api_integration|service`), `entries` (markdown + tsvector + pgvector(1536d) + 11 content_types + 7 sensitivities + UNIQUE `logical_path` per org + GIN-indexed `tags`/`domain_meta`), `entry_versions` (append-only, immutable per RLS), `entry_links` (typed directed edges, 6 types: `relates_to|supersedes|contradicts|depends_on|part_of|tagged_with`), `staging` (governance queue), `permissions` v2 (polymorphic `(principal_type, principal_id, resource_type, entry_id|path_pattern, role)`), `groups` + `group_members`, `audit_log` (admin-only INSERT, append-only), `comments` (author-kind tracks user-vs-agent), `import_batches` (rollback unit), `blobs` + `attachments` (content-hash dedup), OAuth tables.

Key choices: `org_id` on every data table (multi-tenancy at DB layer), `tsvector` + `pgvector` co-located on entries for hybrid search, `[[wiki-link]]` references re-derived into `entry_links` rows on every write (write-path sync, not background indexer).

## 2. RLS strategy

Every user-data table has RLS **enabled and forced** (so superuser can't bypass). Five Postgres roles `kb_admin|editor|commenter|viewer|agent` (NOLOGIN) with CRUD differentials. API sets four session vars at txn start via `SET LOCAL` (`app.user_id`, `app.org_id`, `app.role`, `app.department`) then `SET LOCAL ROLE kb_*`. **`SET LOCAL` is critical** — scopes role to current transaction so pooled connections don't leak role state. Every policy: `org_id = current_setting('app.org_id')`. Permissions v2 layered via SECURITY DEFINER helpers that bypass RLS on `permissions`+`group_members` to avoid recursion through entries (migration 011 had a recursion bug; 019 fixes by passing entry id+path as args, never re-querying entries).

**`kb_agent` has no INSERT/UPDATE/DELETE on entries** — hard architectural invariant. All agent writes route through `staging`.

## 3. API surface (FastAPI)

Routes (`api/main.py:184-209`): `/entries`, `/staging`, `/import`, `/types`, `/tags`, `/session-init`, `/invitations`, `/entries/{id}/permissions`, `/paths/.../permissions`, `/auth`, `/users`, `/groups`, `/comments`, `/attachments`, `/analytics`, `/setup`, `/oauth/login`, `/oauth/continue`, `/health`.

Auth: Bearer `bkai_XXXX` 9-char prefix lookup → bcrypt verify → join to `users`. **`X-Act-As-User` header honored only on `service` keys** (gate 3 of OAuth 3-gate; non-service + header → 403). MCP holds the service key and threads OAuth-bound `user_id` into every API call so per-user RLS applies end-to-end. `POST /auth/login` returns `{api_key, user}` — no JWT layer.

`GET /session-init` returns ≤2K-token density manifest (counts, top_paths up to 15, tags_top up to 20, system_entries handles, pending_reviews previews up to 5). Old shape inlined everything and broke Claude Code past 40K tokens — v0.4.0 explicitly switched.

`GET /entries/{id}` rewrites `[[slug]]` → `[Title](/kb/{id})` by joining `entry_links`. Frontmatter stripped. Unresolved slugs preserved literally. Write-path `services/links.py:sync_entry_links` keeps `entry_links` current on POST/PUT.

## 4. MCP integration

Two server modes (`mcp/server.py` 16 LOC stdio; `mcp/remote_server.py` 800 LOC Streamable HTTP + OAuth 2.1) sharing one tool registry (`mcp/tools.py`, ~18 tools, 1180 LOC). Tools are thin wrappers over `mcp/client.py` HTTP calls — **MCP layer adds no business logic**, translation only.

Taxonomy:
- **Read**: `search_entries`, `get_entry`, `get_index`, `get_types`, `get_neighbors`, `session_init`, `list_tags`, `get_tag_neighbors`, `suggest_tags`
- **Write** (interactive/api keys only — agent keys 403): `create_entry`, `update_entry`, `delete_entry`, `append_entry`, `create_link`
- **Governance** (the agent-write surface): `submit_staging`, `list_staging`, `review_staging`, `process_staging`
- **Onboarding/import**: `redeem_invite`, `import_vault`, `import_vault_from_blob`, `rollback_import`, `upload_attachment`
- **Analytics**: `get_usage_stats`

Comments are intentionally NOT in MCP — human/reviewer-only via REST.

## 5. Governance tiers

Four-tier escalation, assigned at submission (`api/routes/staging.py:31`):

1. **Tier 1** — auto-approve (creates non-sensitive, appends, links, agent updates non-sensitive, admin/editor web_ui). Synchronous commit.
2. **Tier 2** — auto-approve with inline conflict detection (staleness/duplicate/content-hash). Conflicts → escalate to Tier 3.
3. **Tier 3** — AI reviewer (Anthropic claude-sonnet-4-6, 1024 tokens, structured `{action, reasoning, confidence}`). **Confidence floor 0.7** — anything below overrides to `escalate`. Fail-safe on missing key / parse error / API error.
4. **Tier 4** — human-only. Deletions, sensitivity changes, governance rule mods, AI-unresolvable.

KB-native escalation: pending Tier 3+ items surface in `session_init` preamble (top 5 previews) — every agent session sees governance signals, no SMTP/Slack/webhooks needed.

## 6. Worth borrowing

- **Staging-table shape for agent writes** — clean separation of "proposed change" from live KB. Maps to our librarian-replication question: librarian-A's write doesn't immediately appear in team-B's view; staged proposal until governance promotes.
- **Typed `entry_links` table** + recursive CTEs — sidesteps AGE, runs on vanilla Postgres. Six link types is a usable starting taxonomy.
- **Write-path sync of derived data** — re-derive `entry_links` from `[[wiki-link]]` on POST/PUT. Confirms substrate-invariant-mismatch n=3 ([finn scratchpad]): derived data read at render time must be written on the write path.
- **RLS-as-primary-isolation with `SET LOCAL ROLE`** — pooled-connection-safe; non-obvious; reproducible.
- **Density manifest at session-init** — answers #64 pain 1 (cold-start) without exposing the full corpus. Reusable shape.
- **Confidence floor on AI reviewer** (0.7) — never auto-approves on ambiguity.
- **Append-only history at the policy layer** (no UPDATE/DELETE policies on `entry_versions` + `audit_log`, not just app-layer convention).

## 7. Idiosyncratic

- **Single-owner-first onboarding** — their product story is "you alone build, then invite". Ours is multi-team-from-day-one. /setup latch, six-field credentials, invite flow are all built around the personal-first arc.
- **Render-first deploy** with `render.yaml`, `RENDER_EXTERNAL_URL` threaded through `brilliant_settings.api_public_url`, port-detection HEAD probe. Shapes a non-trivial amount of code.
- **Anthropic-only Tier-3 reviewer** — hardcodes claude-sonnet-4-6. Pluggable providers are roadmap-ideas, not shipped.
- **Co-work-first MCP UX** — DCR explicitly disabled (gate 1) because Co-work permits any-MCP-URL. Internal teams don't have that exposure surface.
- **Google Workspace role taxonomy** is a prior commitment; we may want different roles (librarian, agent, lead, observer).
- **`org_id` is the tenant boundary, not team.** Cross-team within one org = `permissions` table or shared sensitivity; cross-org is hard-isolated. We need cross-team-with-scope.

## 8. Gaps for our use case

- **No librarian-replication patterns.** One canonical KB per org. Our model has per-team librarians replicating subsets to a hub. We'd add: librarian principal type, replication contract (pull/push), staleness markers, conflict policy when librarians disagree.
- **No Protocol A/B/C semantics.** Staging tier + change_type ≠ "submission vs query vs revision". Our protocols would layer over staging + custom MCP tools we'd add.
- **No markdown vault round-trip.** `import_vault` is one-way (Obsidian → KB). We'd want bidirectional sync or clean-cut migration with provenance for the per-team wikis we'd ingest.
- **No git-blame-equivalent for dispute resolution.** Metadata exists (`entry_versions.changed_by`, `audit_log.actor_id`) but no first-class "show me who said what when on this contested fact" view. Cal's session-13 [LEARNED] flagged git-blame as load-bearing — we'd build this view.
- **No team-level sensitivity ceiling.** Sensitivity is per-entry; cross-team disclosure rules would need a new layer.
- **No pure-Postgres-no-Anthropic deployment path.** Tier 3 piles up at human review without `ANTHROPIC_API_KEY`. Closed-network deployment needs a different reviewer.

## Quality assessment

**High-quality reference input.** Schema matches docs, RLS is well-thought-out (forced RLS, recursion bug found and fixed in 019, SET LOCAL discipline), governance pipeline is real code, MCP layer is appropriately thin. Active development (last commit 3 days ago, 0.5.1 just shipped, autoDeploy disabled on api+mcp to protect skill/contract coupling — they're aware of breakage risk).

[WARNING] **Roadmap risk**: web frontend (separate repo), production docker compose, alternative LLM providers are mid-flight — only lift the shipped subset.
[WARNING] **Breaking-change cadence**: v0.5.0 broke DCR, v0.5.1 removed `--key-out` from installer. If we *did* fork (we shouldn't), we'd inherit a moving target — independence posture is correct.

(*FR:Finn*)
