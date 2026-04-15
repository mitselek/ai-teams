# xireactor-brilliant — structural survey (2026-04-15)

## 1. What is it?

A Postgres-backed multi-tenant institutional knowledge base for teams where AI agents and humans share context, with an MCP surface for Claude Co-work and Claude Code. Target user: a solo owner who builds a personal KB first, then scales into a team platform. Current release: v0.2.0 pre-release, Apache 2.0, single repo (`thejeremyhodge/xireactor-brilliant`), branded "context engineering infrastructure for institutional-grade teams".

## 2. Mechanisms exposed to consumers

- **FastAPI REST API** (port 8010) — Bearer-token auth, entries CRUD, full-text+semantic search, staging/governance, imports, links, permissions v2, comments. Primary surface.
- **MCP server, dual transport** (port 8011):
  - `server.py` — stdio for Claude Code/Desktop
  - `remote_server.py` — Streamable HTTP + OAuth 2.1 (DCR + PKCE) for Claude Co-work
  - Both register the same ~18 tools from `tools.py` (thin wrappers over the REST client — zero business logic in MCP layer)
- **Claude Skill bundle** (`skill/SKILL.md` + `knowledge-base.zip`) — Co-work skill with inbox/outbox review workflow and KB-aware session bootstrap
- **CLI helper** (`tools/vault_import.py`) — Obsidian vault bulk import

Tool surface: 6 read, 5 write, 4 governance, 1 onboarding, 2 import = 18 tools. Comments are deliberately API-only (human/reviewer primitive, not exposed via MCP).

## 3. Architectural shape

Three-tier Docker Compose stack:

- `db` (pgvector/pgvector:pg16) — Postgres 16 + pgvector, 21 sequential SQL migrations auto-applied via `/docker-entrypoint-initdb.d`
- `api` (FastAPI, built from `./api`) — the brain; routes, services, auth, RLS-role switching
- `mcp` (built from `./mcp`) — OAuth state persists in Postgres, depends on `db` + `api`

Data flow: Claude Co-work/Code → MCP server → REST client → FastAPI → Postgres (RLS enforced). Agent writes are NEVER direct — all agent-key writes route through a `staging` table, then a 4-tier governance pipeline promotes them: Tier 1 auto-approve, Tier 2 conflict-detect, Tier 3 AI reviewer (claude-sonnet-4-6 with confidence-floor escalation), Tier 4 human-only. Pending Tier 3+ items surface in the `session_init` preamble — **the KB delivers its own governance signals via session bootstrap, no SMTP/Slack/webhook infra**.

RLS is the core isolation primitive. Every tenant-scoped table has RLS forced. The API layer does `SET LOCAL app.user_id/org_id/role/department` + `SET LOCAL ROLE kb_{admin,editor,commenter,viewer,agent}` per transaction (explicit `LOCAL` usage to survive pooled connections).

## 4. Framework-research relevance — FIVE candidate veins

Ranked by my read of substrate-invariance and coordination-pattern signal:

**(a) Governance-gated agent writes via staging tier** — HIGH signal. Our framework has nothing equivalent. Agent proposes → staging → tier assignment (by change type / sensitivity / source / role) → auto-promote OR escalate. The AI-reviewer fail-safe discipline is notable: confidence < 0.7 AUTO-overrides stated action to "escalate", all error paths return "escalate", never auto-approves on ambiguity. **Protocol A candidate: pattern/decision — "governance-staging as the write path for agent-authored KB mutations"**. Potentially substrate-invariant: the tier assignment logic is pure data, transplants cleanly into any agent→KB pipeline.

**(b) KB-native governance signal via session_init preamble** — HIGH signal. Instead of out-of-band notifications (Slack/email/webhook), pending reviews are injected into the agent's session bootstrap response. **Protocol A candidate: pattern — "in-band governance surfacing via session preamble"**. Strong candidate for our teammate-startup / scratchpad-bootstrap thinking. Compare-and-contrast against our current model of restoring inboxes from the repo at session start: same abstract pattern (durable-state → runtime-context at session birth), different substrate.

**(c) Dual-transport MCP with shared tool registration** — MEDIUM signal. `server.py` (stdio) and `remote_server.py` (HTTP+OAuth) register identical tools from a shared `tools.py` module. Auth model diverges per transport, business logic doesn't. **Protocol A candidate: pattern — "shared-tool-registry across MCP transports"**. Mild substrate-variance candidate: stdio vs HTTP are genuinely different substrates and the repo demonstrates clean abstraction.

**(d) Write-path sync + render-time resolution coupling** — MEDIUM signal. `[[wiki-link]]` references are re-derived from content on every POST/PUT into the `entry_links` table, and the render-time resolver joins against that table on GET. Spec 0030 explicitly fixes a prior gap where new wiki-links rendered literally until a background pass re-indexed them. **Protocol A candidate: gotcha — "derived-data that's read at render time must be written on the write path, not backfilled async"**. This is a generic structural-mismatch pattern worth filing — the same shape likely appears in our inbox→scratchpad flows.

**(e) Permissions v2 migration pattern** — LOW-to-MEDIUM signal. Polymorphic unified `permissions` table (principal_type × resource_type) with backfill migration (019) replacing legacy `entry_permissions` + `path_permissions`. "Grants can only widen, never restrict beyond the sensitivity ceiling" is a clean invariant. Less directly relevant to framework-research but documents a mature refactor pattern.

**NOT seen:** multi-agent coordination patterns in the sense we mean (no agent-to-agent messaging, no concurrent-session arbitration beyond RLS + staging conflict detection). Brilliant treats every agent as a single-writer that routes through governance — it doesn't address the n-agents-same-team problem.

## 5. Active or dormant?

**Active.** Signals:

- v0.2.0 pre-release shipped with a working concurrency stress test (20–120 clients, 178 ops/sec, 99.8%+ success) — this is current work, not archived.
- ROADMAP has clear "In Progress" section (web frontend in separate repo, docker-compose.prod.yml for v1.1).
- CONTRIBUTING.md has a formalized `main`/`dev` two-branch model and explicit PR mechanics — evidence of recent process maturation.
- References to specs 0026, 0028, 0029, 0030 in the ROADMAP imply an active spec pipeline we didn't read.
- `mcp/README.md` contains a "Cortex→Brilliant rename" note — a recent renaming was executed and documented with back-compat env-var preservation (itself a minor Pass-1/Pass-2 discipline artifact).
- Solo-maintainer shape (CONTRIBUTING references "the maintainer" singular, private vulnerability reports go to "the maintainer directly"). Cadence is likely bursty but engaged.

## 6. Open questions for Aen

None blocking. Digest stands on its own for the "Protocol A intake? deeper follow-up? park?" decision.

---

**Budget spent:** 7 file reads + 3 Bash ls/date calls = ~10 tool uses (well under 12 cap). No source files read, no Explore agent used.

(*FR:Finn*)
