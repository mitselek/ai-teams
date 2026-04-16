# xireactor-as-shared-KB Pilot — Host Architecture

**Author:** (*FR:Brunel*)
**Date:** 2026-04-15
**Version:** v0.6.3 (session-final) — team-lead 20:11 caught that 19:58's acceptance of v0.5's full-withdrawal was itself an error (error #6): the §1.2-violation concern applied only to §10.5 option (a) (schema column addition), NOT to the recommended option (c) (application-layer pre-filter wrapper which modifies zero upstream code/schema). v0.6.3 restores §10 as PROPOSED per v0.6.1 with a §1.2-compliance note in §10.4 that explicitly names option (c) as the compliant path, closing the loop for future readers who would otherwise wonder how §1.2 stopped applying between v0.6.2 and v0.6.3. Full revision history: v0.1 phantom → v0.3 self-rejection → v0.4 novel proposal → v0.5 overbroad withdrawal → v0.6.1 PROPOSED restoration → v0.6.2 over-withdrawal on option-(a)-only §1.2 grounds → v0.6.3 final restoration as PROPOSED with option-(c) §1.2-compliance documented. v0.6's Monte v4 folds remain intact: (1) **Monte v4 §7.1.1 convergence confirmation** — Monte shipped v4 around the same time as Brunel's v0.3, recording topology as "CONVERGED: row-level-only" and preserving the schema-per-tenant reasoning as withdrawal-history with self-aware architectural lesson. v0.5's §3.2 convergence framing is correct; v0.6 adds explicit cross-reference to Monte v4 §7.1.1 and reframes the closing rationale paragraph from live-argumentation to preserved-footnote. (2) **§1.2 upstream-discipline principle sharpened and named** — "piloting a different artifact than the one under evaluation is category-invalid" is load-bearing for framework direction, marked as possible wiki candidate. CI-lint-vs-silent-upstream-regression added as named two-layer regression defense. (3) **Monte v4 §3.6.3 schema invariant relayed** — `owned_by` column MUST be `NOT NULL` and MUST default to inserting session's single-tenant value, never `'co-owned'`. Added to §3.3 as a new `9000_schema_ext.sql` file with explicit CHECK constraint and default-expression shape. Anti-race invariant enforced at schema time, not application time. (4) **§3.5 audit container explicitly closes Monte v4 §7.1.2** — Brunel-owned flag left open in Monte's doc, now answered. Header of §3.5 updated with cross-reference. (5) **Herald Q1+Q2 retraction folded** — Herald v1.1 §A retracted SOFT/MEDIUM precondition claims after honest digest re-read; v1.2 landing on outcome (c)/(c) — digest silent on both Q1 and Q2. §8 dependency rows reverted to "OPEN — digest-silent precondition, resolves via §8.1 source-code walkthrough." **§8.1 extended** from Q2-only (session_init RLS) to Q1+Q2 both — same walkthrough surface, one reading-the-source pass at stand-up, 3×3 outcome matrix scoped.
**Status:** Not deployment-ready. **Both Q1 and Q2 are digest-silent preconditions that resolve via the §8.1 source-code walkthrough at stand-up.** Monte topology, credential loops, transport, file placement, and pilot thesis framing are all closed. Monte v4 §3.6.3 `owned_by NOT NULL` schema invariant is now in the migration spec (§3.3).
**Scope:** Infrastructure + pilot-thesis framing for the **xireactor-brilliant** 3-container stack (db + api + audit_sidecar) deployed as a cross-tenant-writes-only slice serving framework-research (FR) and apex-research. Nothing in this doc depends on the generic ruth-team container substrate — different stack, different tenants, different governance surface. Wiki migration is NOT in scope per v0.5 thesis reshape.
**Substrate reference:** Finn's structural survey — `docs/xireactor-brilliant-digest-2026-04-15.md`.
**Related issue:** `mitselek/ai-teams#59` — xireactor-brilliant as shared-KB substrate — pilot evaluation.

---

## Overview

The xireactor-brilliant release (v0.2.0 pre-release, Apache 2.0, `thejeremyhodge/xireactor-brilliant`) ships as a three-tier Docker Compose stack upstream:

1. `db` — `pgvector/pgvector:pg16` with 21 sequential SQL migrations auto-applied via `/docker-entrypoint-initdb.d`
2. `api` — FastAPI (from `./api`) on port 8010, bearer-token + RLS-role-switching, primary REST surface
3. `mcp` — dual-transport server (from `./mcp`) on port 8011:
   - `server.py` — stdio for Claude Code/Desktop
   - `remote_server.py` — Streamable HTTP + OAuth 2.1 (DCR + PKCE) for Claude Co-work, state persisted in Postgres

**The pilot deploys db + api + a bespoke audit_sidecar = 3 containers**, deliberately NOT running the upstream `mcp` container (see §3.4 — stdio-only collapse resolved 2026-04-15 19:19 per §9.1 Q2). Consumers launch upstream's `server.py` as a stdio subprocess from their own Claude Code sessions, which speaks to `api` over HTTP.

Multi-tenant isolation is enforced by Postgres **Row-Level Security** — every tenant-scoped table has RLS forced, the API sets `app.user_id`/`app.org_id`/`app.role`/`app.department` + `SET LOCAL ROLE kb_{admin,editor,commenter,viewer,agent}` per transaction (explicit `LOCAL` to survive pooled connections). Agent writes are never direct — they route through a `staging` table and a 4-tier governance pipeline (auto-approve → conflict-detect → AI reviewer with confidence-floor escalation → human-only).

The **pilot** is a 2-tenant deployment: `org_id=fr` and `org_id=apex-research`, one shared Postgres database, one shared API instance, with RLS + Monte's §3.2.1 three-state `owned_by` column providing the cross-tenant boundary. One compose stack, co-located on the existing RC dev host.

**Pilot thesis (reshaped 2026-04-15 19:26 per Cal's migration assessment):** xireactor is deployed as a **cross-tenant-writes-only slice on top of both tenants' existing wikis**, NOT as a wiki migration. Cal's assessment (`docs/xireactor-pilot-migration-assessment-2026-04-15.md`) established that a full wiki migration is a net DOWNGRADE for tenants that already have librarians + Protocol A discipline — most of what xireactor provides duplicates governance the librarians already perform, while adding infrastructure cost. The **only** genuinely new capability is cross-tenant co-owned entries, which neither tenant can produce today without a git-mediated bridge. The pilot tests that one capability at the substrate where it naturally lives; existing wikis (FR's 43 entries, apex-research's librarian-owned entries) stay in their current home and do not move. See §10 for the full thesis framing.

**Non-goal:** deciding whether the pilot succeeds (that's the post-pilot evaluation, not this design). **Non-goal (explicit):** wiki migration tooling for moving FR or apex-research entries into the KB — the pilot deliberately does NOT migrate corpora. This doc is strictly infra + thesis-framing.

---

## 1. Portability-First Design

**Principle:** Identical to the ruth-team container design (§1 of `docs/ruth-team-container-design-2026-04-15.md`) — every path, port, identifier, or host-specific value is parameterized via environment variable. B→E migration is a `.env` file swap plus a deployment-mode toggle, never a compose-structure edit.

### 1.1 Parameterization contract

The pilot stack reads the following from a `.env` file at compose-up time. Defaults are sensible universal values where possible.

| Variable | Purpose | Default | B value | E value |
|---|---|---|---|---|
| `PILOT_NAME` | Stack short identifier | — (required) | `xireactor-pilot` | same |
| `PILOT_REPO_REF` | Upstream commit/tag pinned for reproducibility (we do NOT fork — see §1.2) | — (required) | v0.2.0 tag | same |
| `POSTGRES_PORT` | Host port for db (internal-only, debug binding optional) | `5432` | `5432` (internal-only) | internal-only |
| `API_HOST_BIND` | Interface binding for host-exposed api port | `127.0.0.1` | `100.96.54.170` (Tailscale iface) | unused (CF Tunnel origin, no host bind) |
| `API_PORT` | Host port for FastAPI api | `8010` | `8010` (Tailscale-scoped, NOT `0.0.0.0`) | internal-only |
| `POSTGRES_DATA_VOLUME` | Named volume for Postgres data | `${PILOT_NAME}_pgdata` | `xireactor-pilot_pgdata` | Swarm volume (`driver: local` or cloud-backed) |
| `DEPLOYMENT_MODE` | `B` (local-host) or `E` (tunnel) | `B` | `B` | `E` |
| `WARP_CA_PATH` | Host path to WARP CA cert (for outbound Anthropic API from AI reviewer Tier 3) | `/usr/local/share/ca-certificates/managed-warp.pem` | same | `""` (no WARP on E) |
| `AI_REVIEWER_CREDS_SOURCE` | How Tier-3 AI reviewer's Anthropic API key is injected | `bind` \| `secret` \| `swarm-secret` | `bind` | `swarm-secret` |
| `AUDIT_ROLE_PASSWORD_SOURCE` | How the `audit_role` password is injected (§3.5) | `env` \| `swarm-secret` | `env` | `swarm-secret` |
| `PILOT_TENANTS` | Comma-separated list of `org_id` to provision | — (required) | `fr,apex-research` | same |

**v0.4 note:** `MCP_HTTP_PORT` and `MCP_OAUTH_PUBLIC_URL` were present in v0.2/v0.3 and are removed in v0.4 — the stdio-only collapse (§3.4) eliminated the OAuth issuer surface entirely. If a future pilot re-enables HTTP+OAuth per §3.4's documented path-back, those variables come back together with the `mcp` compose service.

**Non-portable choices called out explicitly:**

| Choice | Why non-portable | Mitigation |
|---|---|---|
| `network_mode: host` | **NOT used** on B for this stack. Xireactor's services do not need WARP TLS interception on inbound paths — their only outbound need is Anthropic API for the AI reviewer (Tier 3), which we handle with `NODE_EXTRA_CA_CERTS` equivalent in the api container's env. This is **simpler** than ruth-team's substrate. | Compose uses the default `bridge` network on B, `overlay` on E — profile toggle only. |
| WARP CA bind-mount (for Tier 3 reviewer outbound) | Host-specific (corporate-only) | Absent on E. Compose uses a Docker secret OR empty string; entrypoint is a no-op when `WARP_CA_PATH=""`. |
| Host port 8010 bound to Tailscale interface | Conflicts if another stack on RC claims 8010; also must NOT bind `0.0.0.0` (§2.3 security note) | Port is a per-stack parameter. RC port table (§2.3) keeps a registry. Binding interface is explicit via `API_HOST_BIND`. |

**[E-migrate:** all non-portable items collapse to a single `DEPLOYMENT_MODE=E` switch. The upstream images (db, api) do not change because they are upstream-pinned; our delta is **compose orchestration only**, not the stack itself.**]**

### 1.2 Upstream discipline

**Named principle: piloting a different artifact than the one under evaluation is category-invalid.** If we ever forked xireactor to test xireactor, we would be testing a fork. The whole pilot thesis is "does xireactor-as-shipped work for us as a cross-tenant-writes-only slice?" — forking invalidates the question by construction. This principle scopes beyond this pilot; any future framework pilot that evaluates a third-party substrate should treat upstream-as-shipped as a non-negotiable boundary. Candidate for wiki promotion if the principle recurs.

**Concretely, do not fork the xireactor source.** The pilot consumes `thejeremyhodge/xireactor-brilliant` at a pinned tag (`v0.2.0` or later-stable). Our customization layer is:

- `.env` (per-deployment config)
- `docker-compose.override.yml` (per-deployment orchestration — volume names, port maps, network profile toggles)
- A `bootstrap/` directory with SQL files mounted into `/docker-entrypoint-initdb.d/` **after** upstream's 21 migrations (see §3.3 for the current 5-file list)
- A small `audit_sidecar/` directory with Dockerfile + cron script for the audit container (§3.5)
- A deployment runbook doc (TBD after Herald v1.1 + §8.1 source-code walkthrough outcomes)

If upstream refactors, we bump the pinned tag and re-test. We do **not** patch upstream files in place — any necessary patches go in a thin `patches/` directory applied at build time, flagged as tech debt and reported to upstream. **This is the opposite of ruth-team, which builds its own image on `evr-ai-base:latest` — here we stay downstream.**

**Two-layer regression defense for the pinned-tag model:**

- **Layer 1 — upstream pinning** protects us from upstream drift we chose not to adopt. If upstream v0.3.0 breaks something, we stay on v0.2.0 until we deliberately bump.
- **Layer 2 — CI lint (`bootstrap/9999_rls_lint.sql`, see §3.2)** protects us from *silent upstream regression we didn't notice at tag-bump time.* A future upstream tag that ships a new tenant-scoped table without `FORCE ROW LEVEL SECURITY` would silently merge zones under row-level isolation; the lint catches it at init.d time and refuses to start the stack with a clear error. Layer 2 is what lets Layer 1 be cheap — we can bump tags confidently because the lint is defensive.

### 1.3 Finding — xireactor-pilot is a **simpler** B→E case than ruth-team

Named as its own subsection because this flips an assumption worth recording explicitly: when E-pattern was adopted 2026-04-15 as the future target for all team deployments, ruth-team was drafted first and became the implicit reference case. It is in fact the **harder** case. Xireactor-pilot is simpler along three independent axes:

- **No corporate-TLS-interception constraint.** Ruth-team's agents run Claude Code inside the container and talk to `api.anthropic.com` through the corporate WARP substrate — this forces `network_mode: host`, `WARP_CA_PATH` bind-mounting, and an entrypoint no-op branch for the E case. Xireactor-pilot's only outbound API call is the Tier-3 AI reviewer from within the `api` container; its inbound traffic is MCP clients reaching it, not the other way around. No WARP, no host networking, no CA cert path — a straight bridge network on B, overlay on E.
- **No team-config-repo parameter surface.** Ruth-team clones a team config repo at boot to discover its roster, scratchpads, inboxes, and lifecycle scripts — `TEAM_REPO_URL`, `TEAM_REPO_BRANCH`, `TEAM_CONFIG_PATH`, `HOST_WORKSPACE_DIR`. Xireactor-pilot is a backend service that knows nothing about rosters or team configs; the tenants it serves reach it over the network as clients, and their per-tenant state lives in `org_id` rows, not in bind-mounted git clones.
- **No per-team sshd/tmux substrate.** Ruth-team exposes sshd on a host port so the operator can attach to tmux panes where Claude Code runs. Xireactor-pilot exposes only `:8010` for the api (and only to Tailscale peers per §2.3) — no operator-facing interactive substrate. On E, the api moves behind a CF Tunnel hostname or CF Access private hostname; on ruth-team, the SSH+tmux interaction channel has to be replaced by Cloudflare Access + hostname routing (a substrate change, not a config swap).

**Consequence for future E-migrations:** xireactor-pilot is the reference migration target for teams considering the B→E move, NOT ruth-team. A team whose container is mostly a backend service (no agents running inside, no corporate TLS interception in-scope) follows the xireactor-pilot pattern. A team whose container runs agents (Claude Code + tmux + sshd, WARP-bound) follows the ruth-team pattern. Publish both as reference cases when the time comes.

This finding also means **the pilot's B→E migration should be attempted early** — it's the cheapest test of the E-pattern's portability claims. If xireactor-pilot cannot B→E-migrate cleanly, no other team will either.

---

## 2. Host Placement — Can the dev server handle it?

**Question:** does the xireactor 3-service footprint (pgvector + FastAPI + dual-transport MCP + OAuth issuer state) fit on the existing RC dev server `100.96.54.170` alongside apex-research, polyphony-dev, and entu-research, or does it need dedicated infra?

**Short answer:** **yes, it fits on RC.** No dedicated infra required for the pilot. Estimated incremental cost: **one named volume for pgdata, one docker network, three containers, ≈1 GB RAM baseline, ≈2 GB disk for the v0.2.0 data footprint.** See §2.1 for the sizing rationale.

### 2.1 Sizing rationale

Finn's digest §5 captured the upstream concurrency stress test: 20–120 clients, 178 ops/sec, 99.8%+ success. Extrapolating to our pilot:

- **Workload:** 2 tenants × ~5 agents each × bursty KB read/write. Realistic ops/sec sustained: <1 (burst peaks to 10s during session_init preambles at tmux spawn or cross-session catch-up). Upstream's 178 ops/sec ceiling is 100× our expected sustained load. Zero headroom concerns.
- **Postgres memory:** pgvector/pg16 default tuning (no explicit override) fits in 256 MB RAM for a <100 MB database. Our total entry count ≤2k per tenant for the first pilot month = ~4k rows + pgvector embeddings (384-d or 1536-d depending on upstream model) → ≤500 MB disk, ≤256 MB RAM working set.
- **FastAPI (`api`):** single uvicorn worker, ≈100-200 MB RAM idle. Scales with concurrency; our concurrency is single-digit.
- **MCP (stdio-only per §3.4):** `server.py` (stdio) is launched per-Claude-Code-session by each consumer, **NOT as a container in the pilot stack**. Upstream's `remote_server.py` (HTTP+OAuth) is not deployed. The host runs exactly 3 containers: db + api + audit_sidecar. Sizing counts them, not the stdio MCP (which is a subprocess of whatever Claude Code session needs it, on the consumer side).
- **Total RAM budget:** ≈750 MB for all three services at idle, ≤1.5 GB at burst. RC currently hosts 3 framework-research-adjacent containers with comparable footprints; it is not memory-constrained at this scale.
- **Disk:** ≤2 GB for the v0.2.0 upstream image layers + pgdata + bootstrap tenants + modest growth buffer.
- **CPU:** effectively idle. Embedding generation happens once per entry write — pgvector stores pre-computed embeddings, no runtime GPU/CPU load per query beyond cosine-similarity math on ≤5k rows.

**Hardware on RC:** the runbook §1 implies a machine sized for multiple ai-teams containers + WARP + Docker daemon with no reported saturation. Adding a ≈1 GB-idle KB backend is a rounding error.

**Conclusion: co-locate on RC.** The pilot substrate is small enough that dedicated infra would be premature optimization AND would block the cheapest benefit-signal experiment: "do the two tenants actually share knowledge?". Separating them onto different hosts before proving the pattern would be architecture-first-of-need.

### 2.2 Ops load

| Task | Frequency | Owner | Effort |
|---|---|---|---|
| Initial `docker compose up` | once | operator | ~15 min (mostly waiting for 21 SQL migrations + image pulls) |
| Tenant seeding (run `bootstrap/*.sql`) | once | operator | ~5 min |
| Monitoring (pgdata disk usage, container restarts) | weekly passive | operator | ~5 min/week |
| Upstream tag bump | ad-hoc (when stable) | operator + Brunel review | ~30 min |
| OAuth token rotation (AI reviewer key, Tier 3) | ad-hoc (~quarterly) | operator | ~5 min |
| Incident response (container crash, disk full, etc) | ad-hoc | operator | as needed |

No new tooling to maintain. The pilot runs as a sibling compose stack on RC, monitored via the same `docker ps` / `docker logs` habit already in place for apex-research et al.

### 2.3 Port allocation

RC port table (from `deployments.md`), updated with pilot additions:

| Service | Host port | Notes | Source of truth |
|---|---|---|---|
| apex-research (SSH) | 2222 | live | deployments.md |
| polyphony-dev (SSH) | 2223 | live | deployments.md |
| entu-research (SSH) | 2224 | live | deployments.md |
| xireactor-pilot API | 8010 (proposed, host-exposed Tailscale-scoped) | accepts HTTP from Tailscale peers only; docker-internal for co-located containers; firewalled from public internet | this doc |
| xireactor-pilot db | 5432 (internal-only) | NOT exposed to host — accessed over docker network by api + audit_sidecar | this doc |
| *next team SSH* | 2225+ | reserved — next-available | — |
| *other pilots / backends* | 8011+ | reserved — next-available for host-exposed backend ports | — |

**Registry rule:** SSH host ports grow 2225, 2226, ... (one per team container); backend host ports grow 8011, 8012, ... (one per host-exposed backend service). Any new stack consuming a host port MUST register it in this table via the stack's own design doc, not verbally. This prevents future stacks from colliding with xireactor-pilot's 8010 or with each other.

**Important — 8010 exposure scope:** this is the only host port the pilot adds. Host binding should use `127.0.0.1:8010:8010` OR be explicitly bound to the Tailscale interface (`100.96.54.170:8010:8010`) — **never** `0.0.0.0:8010:8010`, which would expose the api to the public internet. The firewall on RC must drop inbound connections to 8010 from anywhere except Tailscale peers. Operator verifies this in step 11 of §4.2 before the pilot goes live.

**Design choice (v0.4):** only `8010` is host-exposed, and only to Tailscale peers via the explicit `API_HOST_BIND` interface parameter (§1.1). The database and `audit_sidecar` are strictly internal to the docker network. This reduces the attack surface and keeps the pilot's external dependency footprint to zero CF Tunnel ingress rules (the existing sidecar is not touched — see §4.1). Consumer agents reach the api over the existing Tailscale link; no new network infrastructure.

**[E-migrate:** host port 8010 binding drops from the compose file; api joins a CF Tunnel origin at `xireactor.dev.evr.ee` OR a Cloudflare Access private hostname, depending on whether path-back-to-HTTP+OAuth is exercised (see §3.4). Clients update their `XIREACTOR_API_URL` from `http://100.96.54.170:8010` to the new endpoint. One-line env change on each consumer, no server-side image change.**]**

---

## 3. Service Topology — Single stack, two tenants via RLS

### 3.1 Service graph

```
┌─────────────────────────────────────────────────────────────────┐
│  docker network: xireactor-pilot_default                        │
│                                                                 │
│    ┌──────────────┐   ┌────────────┐                            │
│    │  api         │──▶│  db        │                            │
│    │  (FastAPI    │   │  (pgvector │◀┐                          │
│    │   :8010)     │   │   pg16)    │ │                          │
│    │              │   │            │ │                          │
│    │  RLS role    │   │  RLS forced│ │                          │
│    │  SET LOCAL   │   │  on every  │ │                          │
│    │  per txn     │   │  tenant    │ │                          │
│    └──────────────┘   │  table     │ │                          │
│           ▲            └────────────┘ │                          │
│           │                           │                          │
│           │          ┌────────────────┴───┐                      │
│           │          │  audit_sidecar     │                      │
│           │          │  role=audit_role   │                      │
│           │          │  BYPASSRLS         │                      │
│           │          │  read-only session │                      │
│           │          │  → /reports/*.md   │                      │
│           │          └────────────────────┘                      │
│           │                   (§3.5)                             │
│           │                                                      │
│           │ HTTP (over docker network, or over Tailscale         │
│           │ to 100.96.54.170:8010 from consumer workstations)    │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │
  ┌─────────┴─────────────────────────────┐
  │  stdio MCP server (upstream's         │
  │  server.py) — launched as subprocess  │
  │  by each consuming Claude Code        │
  │  session. NOT a container in the      │
  │  xireactor-pilot stack.               │
  │                                       │
  │  - FR main session on Win workstation │
  │    (Tailscale-routed to api)          │
  │  - apex-research container on RC      │
  │    (docker-network-routed to api)     │
  │  - Future: any agent host that can    │
  │    reach http://<api-endpoint>:8010   │
  └───────────────────────────────────────┘
```

**Container count: 3** (db, api, audit_sidecar). The upstream `mcp` container (HTTP+OAuth, `remote_server.py`) is **explicitly not deployed** in the pilot — stdio transport approved per §9.1 Q2 resolution. Upstream's `server.py` (stdio MCP) runs as a subprocess of each consuming Claude Code session, not as a container in the pilot stack. It's upstream code copied into each consumer's image (or installed as a dependency); no orchestration layer at the pilot level.

**Sizing updated:**

- `db` (pgvector/pg16): ~256 MB RAM working set, ~500 MB disk (tenant data + embeddings)
- `api` (FastAPI uvicorn, single worker): ~150 MB RAM idle
- `audit_sidecar` (Python cron + `psql` client): ~100 MB RAM idle
- **Total: ~500 MB idle, ~1 GB at burst** — lower than v0.2's 3-service estimate (~750 MB) because the mcp container's OAuth-issuer state + DCR handlers + `remote_server.py` uvicorn worker are all gone. Net *reduction* from v0.2 via the stdio-only collapse. RC remains comfortably over-provisioned.

**How agents actually reach the api:**

- **FR agents (main session on Windows workstation):** stdio MCP server launches as a local subprocess of the Claude Code main session; `server.py` reads `XIREACTOR_API_URL=http://100.96.54.170:8010` (or equivalent Tailscale hostname) and makes HTTP calls to the api container over the existing Tailscale link to RC. No new network infrastructure.
- **apex-research agents (inside the apex-research container on RC):** if the apex-research container joins the `xireactor-pilot_default` docker network (compose `networks:` external reference), `server.py` reads `XIREACTOR_API_URL=http://xireactor-api:8010` and resolves via docker DNS. If it doesn't, it uses `http://100.96.54.170:8010` and loops back through the host. Either works — the first is slightly cleaner.
- **Consequence:** api port 8010 must be host-exposed on RC, **but firewalled to Tailscale peers only** (not public internet). See §2.3 port table update.

### 3.2 Single database, per-tenant rows (recommended)

**Recommendation: one Postgres instance, one database, one schema, two `org_id` values (`fr`, `apex-research`).**

**Rationale:**

- Upstream's RLS model is row-based via `app.org_id`, not schema-based. Forcing a schema-per-tenant layout would require patching upstream — violating §1.2 upstream discipline.
- The pilot's whole point is to test whether a **shared** KB produces cross-team value. Physically separating tenants into two databases would make the "shared" claim vacuous at the substrate level (you'd need an explicit cross-database bridge, which is exactly the git-mediated workaround we're trying to supersede).
- RLS + `SET LOCAL ROLE` is the isolation primitive upstream designed for. Upstream's concurrency stress test exercises it. It is production-grade for the single-tenant case and upstream's entire documentation assumes multi-tenant in one DB. We trust the primitive.
- Two tenants is the minimum multi-tenant configuration — if RLS fails to isolate `fr` from `apex-research`, it would fail to isolate any two tenants, and the failure is **loud** (cross-tenant entries visible in queries, easy to spot in pilot observations).

**Alternative considered:** two databases in one Postgres instance (`db_fr`, `db_apex-research`). Rejected because:

- Doubles the migration cost (21 migrations × 2 = 42 runs), doubles the pgvector extension overhead, doubles the backup footprint.
- Does NOT share data at the substrate level — cross-tenant queries become impossible even when desirable (e.g., Cal running a dedup scan across both teams' wiki entries).
- Adds a coordination surface (which DB does a given MCP call target?) that upstream's REST API does not handle — would require patching the FastAPI auth layer. Violates §1.2.

**Alternative also considered:** two Postgres instances (separate containers). Rejected because:

- 2× RAM baseline (~500 MB → 1 GB) for zero isolation gain over RLS.
- 2× backup + 2× upgrade + 2× tuning overhead for a pilot that should be maximally cheap.
- Same coordination problem as two databases, plus network partitioning concerns if one instance crashes.

**[RESOLVED 2026-04-15 19:19 — Brunel + Monte convergence on row-level topology. CONFIRMED by Monte v4 §7.1.1, 2026-04-15.]** Team-lead closed this loop directly with Monte on 19:19 after reading Monte's §3.2.1 sharpening pass. Monte then shipped **v4** (~same time as Brunel's v0.3 was drafting) with the topology recorded as **"Status: CONVERGED: row-level-only"** in his §7.1, and his earlier schema-per-tenant reasoning preserved as a withdrawal-history subsection §7.1.1 with the principled self-correction: *"I was reaching for structural cues that the three-state ownership model already provides at a cheaper layer."* Brunel's row-level-only argument (infrastructure layer) and Monte's three-state `owned_by` column sharpening in his §3.2.1 (governance layer) are **structurally the same model at different altitudes** — one physical substrate, with authority encoded as a column (`owned_by` ∈ {FR, apex, co-owned}) that selects which governance layer applies to which row. Convergent answers, independent reasoning.

**This doc's §3.2 is the concrete evidence layer** under Monte v4 §7.1.1's principled self-correction. Monte's §7.1.1 records *why the row-level model is structurally sufficient*; the three supporting notes below (cheap shared-read, BYPASSRLS audit, CI lint) record *why the row-level model also satisfies every concern his schema-per-tenant framing was reaching for*. Read both together; neither layer alone is load-bearing.

**Final topology — single instance, single database, row-level RLS via `app.org_id`, with Monte's three-state `owned_by` as a first-class column.** Monte's four zones (FR-private, apex-private, FR-owned shared-read, apex-owned shared-read) map to `(org_id, zone)` tuples; his shared-write zone maps to rows with `owned_by = co-owned`. The staging layer governs **only** rows with `owned_by = co-owned` under the committed pilot thesis. Intra-tenant writes (`owned_by ∈ {FR, apex}`) go through the owning tenant's librarian gate and bypass staging — both tenants run Monte §3.2.1 as written under the committed baseline. §10 proposes a second-thesis addition (PROPOSED, gated on PO + apex consent) that would route apex intra-tenant writes through staging via an application-layer wrapper (§1.2-compliant, no schema fork).

**Three supporting technical notes that survived the convergence review:**

1. **Cheap shared-read path.** Both row-level and schema-per-tenant models are equally cheap for shared-read — RLS policy evaluation is sub-microsecond at our table sizes (<5k rows per tenant). The "cheap shared-read" property distinguishes single-database from federation, not row-level from schema-per-tenant. Monte's original concern is satisfied.

2. **Clean audit read-only mount.** Postgres has `CREATE ROLE audit_role BYPASSRLS;` (core feature since 9.5). A role with `BYPASSRLS` sees all rows regardless of RLS policies. The audit container connects as `audit_role` with `default_transaction_read_only = on` and reads the entire schema without needing schema-by-schema grants. **The audit mount is structurally cleaner under row-level than under schema-per-tenant**, not more complex — Monte's §7.1 "more complex view layer" framing was based on an older audit pattern; the `BYPASSRLS` idiom closes the concern in one line of SQL. See §3.5 for the full audit container shape.

3. **Migration-error safety net.** The one legitimate concern about row-level isolation is the failure mode "a new table created by an upstream migration gets deployed without RLS policies, silently merging zones." Mitigation: a 20-line CI lint SQL file (`bootstrap/9999_rls_lint.sql`) that asserts every tenant-scoped table has `FORCE ROW LEVEL SECURITY` enabled. It runs (a) after every fresh-DB bootstrap via the init.d pipeline, and (b) before every upstream-tag bump as a manual check gate. Upstream's existing 21 migrations already set `FORCE` on every tenant-scoped table (per Finn's digest §3 line 29), so the lint is **defensive against future upstream regressions**, not corrective of current state. Concrete SQL:

```sql
-- bootstrap/9999_rls_lint.sql — runs after all other migrations
DO $$
DECLARE
  unforced_count int;
BEGIN
  SELECT count(*) INTO unforced_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = (
    SELECT oid FROM pg_namespace WHERE nspname = t.schemaname
  )
  WHERE t.schemaname = 'public'
    AND t.tablename IN (SELECT table_name FROM tenant_scoped_tables)
    AND NOT c.relforcerowsecurity;
  IF unforced_count > 0 THEN
    RAISE EXCEPTION 'RLS lint failure: % tenant-scoped tables missing FORCE ROW LEVEL SECURITY', unforced_count;
  END IF;
END $$;
```

The `tenant_scoped_tables` allowlist is a small bootstrap table — a one-time audit of upstream's v0.2.0 schema populates it, future upstream bumps require updating the allowlist (an explicit, reviewable act). Monte's structural safety net is preserved without forking upstream.

**Adopting Monte's governance zone vocabulary intact:** four zones (FR-private, apex-private, FR-owned shared-read, apex-owned shared-read), one shared-write zone, `owned_by` three-state enum, `created_by` as historical-only provenance field (per Monte §3.2.1's explicit separation of authority from provenance), strategic asymmetric use of librarian gate vs staging pipeline (Monte §3.2), simultaneous-discovery protocol for land-grab avoidance (Monte §3.6), three-check drift prevention (Monte §4.1), auditor-is-neither-tenant property (Monte §4.3). These are implemented at the row level via columns on upstream's existing tables, not via schema boundaries. **Governance architecture survives unchanged; only the physical isolation tactic is row-level instead of schema-per-tenant.**

**Preserved rationale — why forking upstream was never going to work.** Kept as a rationale footnote (not a live escalation path) so future readers understand *why* row-level was structurally load-bearing even though it looks like a tactical preference. Xireactor ships 21 sequential SQL migrations that assume a single-schema row-level layout with `app.org_id` as the RLS key. Adopting schema-per-tenant would have required one of: (a) patching 21 upstream migrations to relocate tables into per-tenant schemas, (b) wrapper views in per-tenant schemas pointing at upstream's single-table layout, (c) running two xireactor instances with a bridge service. All three are forks of xireactor's schema model; §1.2 upstream discipline forbids them because every subsequent upstream tag bump re-pays the rewrite cost. Independently, the pilot thesis is specifically "does xireactor as shipped work as a cross-tenant-writes slice for us?" — forking xireactor to test xireactor would have been category-invalid per the §1.2 named principle. Monte's §3.2.1 sharpening pass reached the row-level conclusion from the governance side; the infrastructure side reaches the same conclusion from upstream discipline. Both trails preserved here so a future reader can trace either.

### 3.3 Tenant provisioning

**Five** SQL files in `bootstrap/`, mounted into `/docker-entrypoint-initdb.d/` **after** upstream's 21 migrations (filename sort order — `9000_` prefix ensures they run last, in numeric order):

- `9000_schema_ext.sql` — adds Monte §3.2.1 governance columns (`owned_by`, `zone`) to upstream's tenant-scoped tables if they do not already exist natively; enforces the `owned_by NOT NULL` schema invariant per Monte v4 §3.6.3 (see invariant note below). **Whether this file is a no-op or load-bearing depends on §8.1 source-code walkthrough outcome** — if upstream already has `owned_by`-shaped columns with the right semantics, this file becomes a constraint-tightening file only; if not, it's a column-add + trigger file.
- `9001_tenant_fr.sql` — FR organization + users + bearer token placeholders
- `9002_tenant_apex.sql` — apex-research organization + users + bearer token placeholders
- `9998_audit_role.sql` — `audit_role` with `BYPASSRLS` attribute, read-only session default (see §3.5)
- `9999_rls_lint.sql` — defensive assertion that every tenant-scoped table has `FORCE ROW LEVEL SECURITY`; raises exception on violation (see §3.2 migration-error safety net, note 3)

**[Monte v4 §3.6.3 schema invariant — relayed 2026-04-15 19:32 via team-lead]:** the `owned_by` column MUST be `NOT NULL` and MUST default at insertion time to the **submitting librarian's single-tenant value** (`'fr'` or `'apex-research'`), never to `'co-owned'`. Rationale: `co-owned` is always the result of a deliberate transition via Monte §2.3 ownership-transfer ritual or Monte §3.6 simultaneous-discovery protocol, never a default. A default-to-`co-owned` schema would let a migration accident or ORM-default bug produce silent authority drift (an entry intended as single-ownership lands in co-owned state and inherits cross-review authority it wasn't supposed to have). Monte wants this written into the migration spec explicitly so the anti-race invariant is enforced at schema time, not just at application time.

Concrete constraint shape (in `9000_schema_ext.sql`):

```sql
-- If owned_by does not exist, add it with the strict default:
ALTER TABLE entries ADD COLUMN IF NOT EXISTS owned_by text NOT NULL
  DEFAULT current_setting('app.org_id');  -- pulls the inserting session's tenant from SET LOCAL
-- CHECK constraint enforcing the three-state domain:
ALTER TABLE entries ADD CONSTRAINT entries_owned_by_domain
  CHECK (owned_by IN ('fr', 'apex-research', 'co-owned'));
-- NEVER default to 'co-owned':
-- (the DEFAULT expression above uses app.org_id which is either 'fr' or 'apex-research';
--  'co-owned' can only enter the table via explicit UPDATE from Monte's §2.3 or §3.6 flows)
```

Whether this SQL runs against an upstream-native `owned_by` column or adds the column fresh depends on the source-code walkthrough outcome (§8.1). The invariant holds regardless: no insertion path, no default, no migration, no ORM binding may produce `owned_by='co-owned'` without an explicit state-transition call.

Sample tenant-seeding content:

Sample tenant-seeding content:

```sql
-- bootstrap/9001_tenant_fr.sql
INSERT INTO organizations (id, name, created_at) VALUES ('fr', 'framework-research', NOW());
INSERT INTO users (id, org_id, email, role) VALUES
  ('fr-team-lead', 'fr', 'team-lead@fr.local', 'admin'),
  ('fr-agent',     'fr', 'agent@fr.local',     'agent');
-- Insert one bearer token per user into whatever table upstream uses
-- (look up exact shape in `api/auth.py` — TBD during build)

-- bootstrap/9002_tenant_apex.sql
INSERT INTO organizations (id, name, created_at) VALUES ('apex-research', 'apex-research', NOW());
INSERT INTO users (id, org_id, email, role) VALUES
  ('ar-team-lead', 'apex-research', 'team-lead@ar.local', 'admin'),
  ('ar-agent',     'apex-research', 'agent@ar.local',     'agent');
```

**Tokens are generated per user out-of-band** (see §5 credentials) and stored in a file **outside the repo** (operator workstation, gitignored). Each team's stdio MCP subprocess reads its tenant bearer token from a local env var (`XIREACTOR_BEARER_TOKEN`) and forwards it in the `Authorization` header on every api call. The token identifies the `org_id` and RLS takes care of the rest.

**[OPEN for Herald]** See §6 — Herald's cross-tenant protocol choices may add fields to bootstrap (e.g., a `bridge_permissions` table that lets FR agents read apex-research's "shared" entries without the promoting tenant having to duplicate them). Mark as open question and do not over-pre-commit the schema.

### 3.4 Transport — stdio-only (RESOLVED: §9.1 Q2, team-lead 19:19)

**Pilot runs stdio-only.** Upstream's `remote_server.py` (HTTP+OAuth with DCR + PKCE) is **not deployed** in the pilot stack. Consequences:

- No `mcp` container in §3.1 (service count is 3, not 4)
- No Dynamic Client Registration surface on the deployment
- No OAuth issuer `iss`-claim hostname coupling (the stability constraint that dominated v0.2 §1.1 is gone)
- No CF Tunnel ingress for xireactor (§4 simplifies — see below)
- No OAuth signing key persistence concern in pgdata (the credential surface in §5 drops from 5 to 4 classes)
- **Consumer access model:** each Claude Code session that needs xireactor launches upstream's `server.py` as a local subprocess (standard MCP stdio pattern), passing `XIREACTOR_API_URL` + `XIREACTOR_BEARER_TOKEN` via env. The subprocess makes authenticated HTTP calls to the `api` container (see §3.1 service graph for routing paths).

**Path back to HTTP+OAuth, if a future pilot adds it.** Documented here so the reopening is cheap, not free:

1. Re-enable the upstream `mcp` service in `docker-compose.override.yml` (currently commented out or profile-excluded).
2. Re-add the `cloudflared-ingress.yml` snippet for `xireactor.dev.evr.ee → http://xireactor-mcp:8011` and restart the sidecar.
3. Generate tenant OAuth clients via DCR + PKCE on first Claude Co-work connection.
4. Add the OAuth signing key loss-of-pgdata concern back to §5.2 Q5 (and accept the operator re-registration burden, OR upgrade to secret-manager-backed key).

**Estimated cost of re-enablement: 1-2 hours of operator work + one container added to the stack.** Preserving the path back is cheap because upstream already ships `remote_server.py` — we just choose not to run it.

### 3.5 Audit container — closing Monte v4 §7.1.2

**[Closes Monte v4 §7.1.2]** Monte's governance doc §4.1 (Check 3) and §7.1 flag a separate **audit container** requirement: an independent process that reads xireactor's committed schema snapshot and produces a tenant-boundary report. Monte v4 §7.1.2 left this Brunel-side — he listed three implementation options (pg dump pipeline, read replica, read-only role on the primary) and deferred to infrastructure. This section is Brunel's answer.

**Recommendation: read-only role on the primary, via `BYPASSRLS`.** Concretely:

```sql
-- bootstrap/9998_audit_role.sql — runs after all tenant-seeding migrations
CREATE ROLE audit_role WITH LOGIN PASSWORD :'audit_password' BYPASSRLS;
GRANT CONNECT ON DATABASE xireactor TO audit_role;
GRANT USAGE ON SCHEMA public TO audit_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO audit_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO audit_role;
-- Defense-in-depth: force read-only at the session level too
ALTER ROLE audit_role SET default_transaction_read_only = on;
```

**Container shape:** a sidecar container in the same docker-compose stack as the xireactor services, running a periodic scheduled script (cron inside the container, or an external trigger — see §3.5.2 for cadence). The audit container:

- Connects to `db` as `audit_role` using `audit_password` (Docker Swarm secret on E, env var on B)
- Reads what it needs via `SELECT` queries against the tenant-boundary schema
- Emits the tenant-boundary report as a markdown file written to a bridge volume
- Never writes to `db` (enforced by `default_transaction_read_only = on`)
- Never runs as a role other than `audit_role` (enforced by connection string, not by code discipline)

**Why not the other two options:**

- **pg_dump pipeline** — produces a consistent snapshot but is an extra moving part (dump file to manage, restore step, disk space for the dump). For a <100 MB database the cost is trivial but the process is more complex than needed. The only situation where pg_dump beats a live read-only role is when auditor needs to operate **without** network connectivity to the primary, which is not our case.
- **Read replica** — Postgres streaming replication is overkill at this scale. A read replica buys write-isolation-from-audit-traffic, which matters at high write throughput we do not have. Adds ops complexity (replication lag monitoring, failover).

The live read-only role option is the cheapest for our actual constraints (<5k rows per tenant, bursty read at review time, cadence measured in hours-to-days) and still gives Monte the "auditor is neither tenant" property via the separate role + separate container + explicit read-only enforcement at three layers (role attribute, session default, container filesystem).

**[E-migrate:** on E, the `audit_password` becomes a Docker Swarm secret (same pattern as the pg superuser password); the sidecar container becomes a swarm service in the same stack; `default_transaction_read_only = on` enforcement survives the migration unchanged. One-line delta in the compose file's secrets section.**]**

#### 3.5.1 Audit role + `BYPASSRLS` security implications

The `audit_role` bypasses RLS by design — Monte's Check 3 audit is explicitly cross-tenant ("does FR own entries whose content sounds like apex-research territory?"), and that question cannot be answered by a role that RLS restricts to one tenant's view. **This means the `audit_password` is a cross-tenant-privileged credential** and must be treated as such:

- Stored as a Docker Swarm secret on E / bind-mounted read-only-root-owned file on B
- Rotated on the same cadence as the pg superuser password (quarterly or on suspicion)
- Not shared with any Claude Code agent or inbox message
- Audit container logs are also cross-tenant-privileged and should be written to a bridge volume readable by both team-leads but no tenant agents

This is the same trust surface as the pg superuser password — one more cross-tenant-privileged credential to track, not a new trust category. Fits within the §5 credential surface table as a fifth row.

#### 3.5.2 Audit cadence

Monte's §4.1 Check 2 (shared-read sunset review) is "monthly, run by a non-librarian auditor" and §4.1 Check 3 (tenant boundary report) is "per session." I read those as different cadences for different outputs:

- **Per-session boundary report** — runs at xireactor session_init time (when any Claude Code session starts and connects to the MCP endpoint). Cheap enough because it's small-scoped.
- **Monthly sunset review** — runs on a fixed calendar cadence independent of any session.

For pilot simplicity, I recommend running the audit container on an hourly cron inside the sidecar, emitting a fresh boundary report each run. Monthly sunset review is a filter applied on top of the same report — no separate process. **Both cadences collapse to one cron job + one script with two output sections.** Flagged to Monte for confirmation.

---

## 4. Deploy path on RC — host-exposed api over Tailscale

### 4.1 No CF Tunnel in pilot scope (stdio-only collapse)

v0.2 planned to reuse the existing cloudflared sidecar (tunnel ID `526a23d1-1f7f-472f-8df1-a9239bbe3fe4`) by adding an ingress rule `xireactor.dev.evr.ee → http://xireactor-mcp:8011`. That plan **is no longer in pilot scope** now that §3.4 resolved stdio-only — there is no `mcp` container for the ingress to route to.

**Pilot network path:**

- The `api` container exposes port 8010 on the RC host, bound to the Tailscale interface only (`100.96.54.170:8010:8010`, NOT `0.0.0.0:8010:8010`).
- Consumers reach it via Tailscale: FR workstation → `http://100.96.54.170:8010/`, apex-research container on RC → `http://xireactor-api:8010/` (docker DNS via shared network) or `http://100.96.54.170:8010/` (host loopback).
- The existing `cloudflared` sidecar is **not touched** — `apex-research.dev.evr.ee` continues to route to `http://apex-research:5173` unchanged. Pilot adds zero ingress rules.

**Known issue from scratchpad (still relevant for ruth-team and other CF Tunnel consumers, but not xireactor-pilot):** QUIC is blocked on RC's corporate network; existing ingress rules use `--protocol http2` flag to work around this. Flagged here for context because future path-back-to-HTTP+OAuth would re-encounter it.

**[E-migrate:** on E, the api container joins a CF Tunnel origin at `xireactor.dev.evr.ee` (or an internal hostname via Cloudflare Access) and the Tailscale-host-port pattern goes away. Host-port binding drops from the compose file; CF Tunnel ingress rule is added. Same host port binding idiom drops as it did for ruth-team's SSH ports. See §7 migration table.**]**

### 4.2 Deployment sequence (B)

1. **Pre-flight:** verify RC has ≥2 GB free disk, ≥1 GB free RAM, docker daemon healthy. Verify the Tailscale interface is up (`tailscale status` on RC).
2. Clone the pilot infra from `mitselek/ai-teams` repo into `/home/dev/xireactor-pilot/` (this is the bind-mount surface; actual sources live under `containers/xireactor-pilot/` in the repo per §4.3).
3. Copy real secrets into `.env` and `secrets/` (not committed).
4. `cd /home/dev/xireactor-pilot && docker compose pull` — fetches upstream `pgvector/pgvector:pg16` + built `api` image. **Does not pull the mcp image** per §3.4.
5. `docker compose up -d db` — start Postgres first, wait for upstream's 21 migrations to run (~2-5 min), then for the four bootstrap SQL files (9001 tenant FR, 9002 tenant apex, 9998 audit_role, 9999 rls_lint) to execute via init.d order.
6. **Verify RLS lint passed** — `docker compose logs db | grep 'rls_lint'` should show clean exit, no exception. If the lint raised, stop here and investigate.
7. `docker compose up -d api audit_sidecar` — start api and audit sidecar; they start in order per compose `depends_on`.
8. **Verify port binding scope** — `ss -lntp | grep 8010` on RC must show the bind bound to `127.0.0.1:8010` OR `100.96.54.170:8010`, NOT `0.0.0.0:8010`. This is the security-critical check per §2.3 "Important — 8010 exposure scope" note.
9. Verify api reachability: `curl http://100.96.54.170:8010/health` (or whatever upstream exposes) from a Tailscale peer → 200. From a non-Tailscale host → should be refused/timed-out.
10. Configure each team's Claude Code MCP config to launch upstream's `server.py` as stdio subprocess with `XIREACTOR_API_URL=http://100.96.54.170:8010` + `XIREACTOR_BEARER_TOKEN=<tenant token>`.
11. Smoke-test: run a known-good search query from FR's Claude Code session, verify the response includes only `org_id=fr` entries + any shared-zone entries with FR read visibility.

**Rollback:** `docker compose down` (keeps pgdata volume). `docker compose down -v` destroys pgdata — only if reverting a bad pilot.

### 4.3 Build-step requirements — commit-tracked in-repo

Per the team-lead constraint on ruth-team (2026-04-15 §7 answer — container infra is first-class tracked artifact): **all pilot-specific files must be committed to `mitselek/ai-teams` before `docker compose up`.**

**Layout (RESOLVED: §9.1 Q1, team-lead 19:19):** pilot infra lives at `containers/xireactor-pilot/` at repo root — NOT under `.claude/teams/framework-research/pilots/`. Rationale from team-lead: pilot infra serves two teams (FR + apex-research); nesting under the FR team dir creates an ownership illusion where apex-research is hosting on FR infrastructure. Repo-root `containers/xireactor-pilot/` correctly signals shared cross-team substrate.

```
mitselek-ai-teams/
  containers/
    xireactor-pilot/
      README.md                         <- runbook (separate doc, TBD after Herald)
      docker-compose.yml                <- override only — upstream compose referenced via `-f`
      docker-compose.override.yml       <- pilot-specific (profile toggles, network config)
      .env.example                      <- template, real values in operator-side .env (gitignored)
      bootstrap/
        9001_tenant_fr.sql
        9002_tenant_apex.sql
        9998_audit_role.sql
        9999_rls_lint.sql
      audit_sidecar/                    <- Dockerfile + cron script for the audit container
        Dockerfile
        audit-run.sh
      secrets/                          <- gitignored, operator-side only
        .gitignore                      <- commit this to ensure dir exists
```

**No file lives on the operator workstation unversioned.** Same principle as ruth-team.

**Reconciliation note:** ruth-team's own container infra layout (set in my earlier design doc) has a different convention. Team-lead has filed this as a `[NEXT-SESSION-CHORE]` for reconciliation — not this session's work. The two layouts may end up different (ruth-team is a team-for-a-human, xireactor-pilot is cross-team infra), or they may converge. Not my call here.

---

## 5. Credentials and governance — Monte's call

This section documents the **shape** of the credential surface and routes **policy decisions** to Monte. No policy assertions here.

### 5.1 Credentials in scope

**Four** distinct credential classes (was 5 in v0.3; OAuth issuer signing key dropped in v0.4 because §3.4 resolved stdio-only, eliminating the OAuth issuer entirely):

| Credential | Purpose | Storage | Rotation |
|---|---|---|---|
| Postgres superuser password | Admin of the db container (migrations, bootstrap) | `.env` on B, Docker Swarm secret on E | Quarterly or on operator change |
| Tenant bearer tokens | Per-user API auth for FR and apex-research users | Outside repo (operator laptop + secure share); injected via `XIREACTOR_BEARER_TOKEN` env to stdio subprocess | Ad-hoc on user change |
| Anthropic API key for AI reviewer (Tier 3) | Upstream's governance-staging Tier 3 calls `claude-sonnet-4-6` via direct API, not via pool. Fires on cross-tenant `owned_by=co-owned` writes only per Monte §3.2.1. Cross-tenant-writes-only pilot (§10) keeps total Tier-3 usage low. | Bind mount on B, Docker Swarm secret on E | Quarterly or on suspicion |
| **audit_role password** (§3.5) | Audit sidecar connects with `BYPASSRLS` to produce tenant-boundary report | `.env` on B, Docker Swarm secret on E | Same cadence as pg superuser (quarterly or on suspicion) — cross-tenant-privileged credential |

### 5.2 Governance questions — resolved and outstanding

**[RESOLVED 2026-04-15 19:19 — row-level topology convergence].** Monte's earlier schema-per-tenant framing (§7.1 of his governance doc) gave way to his own §3.2.1 three-state `owned_by` column model. Row-level RLS + `owned_by` column is the final topology. Team-lead closed the loop directly with Monte. See §3.2 for the convergence narrative and technical evidence.

**[OPEN for Monte Q1]** Does the pilot run on a **dedicated Anthropic API account** (separate billing line + quota), or does it reuse the same account as FR's runtime + apex-research's runtime? Tier-3 AI reviewer usage is bursty but bounded (only fires on cross-tenant `owned_by=co-owned` writes per Monte §3.2.1; cross-tenant-writes-only pilot means lower total usage than a full-wiki deployment would produce). Dedicated account = clean attribution for the pilot's cost signal; shared = zero new governance surface. **Brunel recommendation: reuse for pilot initial run.**

**[RESOLVED Q2 — operator trust boundary, answered by row-level topology convergence].** Under the row-level model, the operator holds pg superuser password (same as all other containers on RC), which can bypass RLS. Cross-tenant isolation reduces to operator trust — the status quo. `audit_role` with `BYPASSRLS` is a parallel cross-tenant-privileged role for the audit container only. Both credentials are stored as `.env` on B / Docker Swarm secrets on E. No new governance surface beyond existing container practice.

**[RESOLVED Q3 (committed baseline) — librarian-asymmetry, answered by Monte §3.2.1].** Monte's §3.2.1 specifies intra-tenant writes bypass staging regardless of tenant; cross-tenant writes (`owned_by = co-owned`) go through Tier-3 AI reviewer. Both tenants follow this rule unchanged under the committed pilot thesis. **§10 proposes a second-thesis addition** (PROPOSED, gated on PO + apex consent) that would deviate from this baseline for apex-research intra-tenant writes via an application-layer wrapper (§1.2-compliant per §10.4). If §10 is not adopted, Q3 stays resolved as-written: no per-tenant staging config, both tenants run Monte §3.2.1.

**[RESOLVED Q5 — Tier-3 confidence floor, Cal recommendation].** Per Cal's migration assessment §6.4: raise confidence floor from upstream's default 0.7 to **0.85** for the cross-tenant-writes-only pilot. Rationale: lower rollback margin for auto-promoted cross-tenant entries than for intra-tenant entries a librarian would catch; tightening the floor reduces the auto-promotion risk at the cost of more Tier-4 human escalations. The number is Monte's call — flagged to team-lead for relay. Brunel defers.

**[OPEN for Monte Q4]** Cross-tenant write scope: can FR agents write to apex-research's tenant? Hypothetically a Cal-to-Eratosthenes cross-team dedup scan might want to propose entries on both sides. Under Monte's §3.2.1 model, cross-tenant writes land in the `co-owned` state via the simultaneous-discovery protocol (his §3.6) — a fresh co-owned entry is filed with both intra-tenant entries as sources, NOT a direct write to the other tenant's rows. **Brunel recommendation: enforce this via application-layer policy (librarians only file co-owned entries via the simultaneous-discovery flow); substrate-level cross-tenant writes are allowed but conventions-only restricted.**

### 5.3 Brunel working assumption (v0.6.3 session-final)

**Committed baseline:** shared Anthropic API account, operator holds pg superuser password, `audit_role` with `BYPASSRLS` per §3.5, row-level RLS + `owned_by` three-state column per §3.2, staging + Tier-3 active for cross-tenant `owned_by=co-owned` writes on both tenants per Monte §3.2.1 unchanged, staging disabled for intra-tenant writes on both tenants per Monte §3.2.1 unchanged, Tier-3 confidence floor raised to 0.85 per Cal's assessment §6.4 pending Monte confirmation, cross-tenant reads allowed per application-layer zone policy. All reversible by changing bootstrap SQL or env vars — no image or compose change required.

**IF §10 is adopted:** apex-research intra-tenant writes additionally route through staging via application-layer pre-filter wrapper (option (c) from §10.4 — §1.2-compliant, no upstream schema change). Gated on PO approval + apex consent. FR config unchanged under both paths.

---

## 6. Cross-tenant protocol — Herald's call

This section enumerates **what cross-tenant interactions the pilot infrastructure must support** and routes protocol design to Herald.

### 6.1 Interactions in scope

- **Cross-tenant search:** an FR agent issues a search query — does the result set include `org_id=apex-research` entries (with permission-respecting filtering), or only `org_id=fr` entries?
- **Cross-tenant wiki-link resolution:** FR's wiki entry #42 references `patterns/foo.md`. If apex-research also has `patterns/foo.md`, does the wiki-link resolver (upstream's `entry_links` table, re-derived on write — see Finn's digest §4(d)) produce ambiguity or tenant-scoped resolution?
- **Cross-tenant session_init preamble:** at FR's team-lead spawn, does the session_init preamble include pending-review items from apex-research's staging queue, or only from FR's queue?
- **Cross-tenant promotion:** if AI reviewer Tier 3 escalates an apex-research entry to human review, does Cal (FR librarian-gate proxy) see it in her session_init? If so, is that a feature (cross-team knowledge awareness) or a governance leak (FR seeing apex-research internals)?

### 6.2 Open questions for Herald

**[OPEN for Herald Q1]** What's the cross-tenant read model? Options: (a) fully shared (all entries visible across tenants, governed by `visibility: shared|tenant|private` field in schema — requires upstream-compatible extension), (b) opt-in sharing (an entry becomes cross-visible only when explicitly promoted — adds a `shared_with` table), (c) no cross-visibility (the "shared KB" claim becomes false and the pilot just proves two tenants can run on one DB without interfering). **Brunel recommendation: (b) opt-in sharing, because it mirrors Cal's wiki governance discipline (explicit promotion = explicit decision).**

**[OPEN for Herald Q2]** Is the session_init preamble tenant-scoped or cross-tenant? Per Finn's digest §4(b), upstream uses session_init as an in-band governance signal channel. The cheapest pilot implementation is tenant-scoped (each Claude Code session sees only its own tenant's pending reviews). The richest is cross-tenant with filtering (Cal sees apex-research escalations if marked `cross_team_relevant: true`). Richer version requires protocol work.

**[OPEN for Herald Q3]** Conflict resolution for identical paths across tenants (e.g., both tenants have `patterns/foo.md`): does the substrate handle this transparently (RLS already partitions by `org_id` so paths are namespaced), or does cross-tenant search need a path-disambiguation protocol?

**[OPEN for Herald Q4]** Protocol A/B/C vocabulary ingestion: FR uses Protocol A (pattern/gotcha/decision), apex-research uses the same after librarian deployment. Can both tenants share Protocol A vocabulary at the DB level, or does each tenant run its own vocabulary? Decision affects whether xireactor's wiki-link resolver can dedupe across tenants or must treat them as disjoint namespaces.

**[OPEN for Herald Q5]** Bridge vs. replacement: once the pilot runs, does the git-mediated ruth↔apex bridge (ruth-team doc §5) become obsolete, or does xireactor augment it? Different surfaces: xireactor is KB-shaped (entries + staging), the bridge is artifact-shaped (migration specs + readiness reports). Herald should call whether the pilot's learnings should retroactively reshape ruth-team's bridge.

### 6.3 Brunel working assumption

**Proceeding with:** tenant-scoped everything at substrate level (RLS isolates), with the expectation that Herald's protocol answers will come back as **additive schema extensions** (new tables like `shared_entries` or `bridge_permissions`), not as a rearchitecture of the substrate. This keeps the deployment path forward-compatible — if Herald decides cross-tenant visibility is required, it's a SQL migration, not a teardown.

---

## 7. B→E Migration — cost estimate

Applying the same framework as `docs/ruth-team-container-design-2026-04-15.md` §6, here is the delta for migrating the xireactor pilot from (B) RC co-location to (E) Cloudflare Tunnel / hello-world-container pattern.

| Section | B choice | E delta | Complexity |
|---|---|---|---|
| §1.1 Parameterization | .env with B values | .env with E values | Trivial — file swap |
| §1.1 Network mode | `bridge` network, docker-compose default | `overlay` network, swarm | Compose profile toggle (`b-bridge` vs `e-overlay`) |
| §2 Host placement | Co-located on RC | Dedicated swarm service (possibly separate node) | Swarm service declaration |
| §2.3 api host port | `100.96.54.170:8010:8010` (Tailscale-scoped host bind) | Internal-only; CF Tunnel fronts hostname (if re-enabled) OR Cloudflare Access routes via private hostname | `ports:` drops from compose; tunnel config adds one ingress rule |
| §3 Postgres persistence | Docker named volume, `local` driver | Swarm volume, `local` or cloud-backed driver | Compose driver field swap |
| §4.1 Cloudflared | Pilot does NOT touch the sidecar on B | Dedicated CF Tunnel origin in swarm (only if path-back-to-HTTP+OAuth is exercised — see §3.4) | No change for stdio-only pilot; ~5 lines if HTTP+OAuth gets re-enabled |
| §5 Anthropic API creds | Bind mount on B | Docker Swarm secret | Entrypoint fetch path + compose `secrets:` block |
| §5 Pg superuser password | `.env` variable | Docker Swarm secret | Same pattern |
| §5 audit_role password (§3.5) | `.env` variable | Docker Swarm secret | Same pattern |
| §3.5 audit sidecar container | Compose service `audit_sidecar`, cron-driven | Swarm service, cron-driven | No change — sidecar is a normal compose/swarm service |
| Upstream images (db, api) | Pulled from registry | Same — pulled from registry | No change |
| Bootstrap SQL (9001-9002 tenants, 9998 audit, 9999 rls lint) | Mounted into init.d | Same — mounted into init.d via swarm config | No change |

**Migration cost estimate — concrete:**

1. Set `DEPLOYMENT_MODE=E` in `.env`.
2. Swap `POSTGRES_DATA_VOLUME` driver (if cloud-backed).
3. Move pg superuser password, Anthropic API key, and `audit_role` password from bind mounts → `docker secret create`.
4. Drop the host port binding from compose (api no longer exposed on host); decide between CF Tunnel ingress (HTTP+OAuth path-back reopened, see §3.4) or Cloudflare Access to a private hostname (stdio-only preserved but consumer network path changes).
5. `docker stack deploy -c docker-compose.yml xireactor-pilot` on the target swarm.
6. Migrate pgdata: `pg_dump` on RC → `pg_restore` in swarm pgdata volume. **One-time data migration step — not reversible without a second dump.**
7. Update consuming MCP configs to point at the new endpoint (whether `xireactor.dev.evr.ee` or a CF-Access hostname). This IS client-side reconfiguration on stdio-only — a change from v0.3's "0 client-side reconfiguration" claim, because the stdio collapse shifted the endpoint discovery cost from the server to the client.

**Files changed: 2** (`.env`, compose override `ports:` section). **Operator commands: 4-5** (secret creates, stack deploy, pgdata dump+restore, MCP config update on each consumer). **Image rebuild: 0** — upstream images are registry-pulled.

**Compared to ruth-team's migration delta:** xireactor pilot is **simpler** because (a) no WARP interception in scope, (b) no team-config-repo parameter surface (upstream ships its own images, not the `evr-ai-base:latest` rebuild model), (c) no per-team sshd/tmux substrate. The biggest migration cost is the **pgdata dump/restore**, which has no analog in the ruth-team container migration. The stdio-only collapse (§3.4) shifted a small cost from server-side to client-side — consumers need to know the new api endpoint — but eliminated the OAuth issuer hostname-stability constraint that v0.2/v0.3 had to plan around.

**[E-migrate critical path:** dump/restore window requires a brief (minutes) write-freeze on the pilot. Schedule during low-activity window. No other coordination surface.**]**

---

## 8. Dependency flags — hard blockers on build

| Depends on | What is blocked | Who owns the answer | Severity |
|---|---|---|---|
| **Herald Q1** (§6.2 — cross-tenant read model + per-tenant tier-assignment lookup) | Whether xireactor's tier-assignment logic actually routes on `owned_by` column (or equivalent) to skip staging on intra-tenant writes | Brunel source-code walkthrough at stand-up (see §8.1) | **OPEN — digest-silent precondition.** v0.5 had this as SOFT based on Monte v3 §7.2 classification; team-lead 19:32 confirmed Herald v1.1 §A retracted the SOFT extrapolation after re-reading Finn's digest and finding no digest-evidence. **Herald v1.2 landing on outcome (c)/(c) — digest silent on both Q1 and Q2.** Resolves via the §8.1 source-code walkthrough at stand-up, same walkthrough surface that covers Q2. |
| **Herald Q2** (§6.2 — session_init preamble tenant scoping) | Whether session_init code path respects `SET LOCAL app.org_id` + `SET LOCAL ROLE kb_*` when building the preamble payload | Brunel source-code walkthrough at stand-up (see §8.1) | **OPEN — digest-silent precondition.** v0.5 had this as MEDIUM based on Monte v3 §7.2 classification; same Herald v1.1 retraction applies. **Herald v1.2 landing on outcome (c)/(c).** This is the highest-consequence item per team-lead 19:26 — wiki #43 names the invisible-cross-tenant-leak failure mode and session_init is where it lives. |
| **Herald Q3** (§6.2 — ownership-transfer wire format) | Post-pilot protocol cleanup | Herald | **DELIVERABLE** — not a pilot precondition; conventions-on-comments are sufficient for pilot (Monte §7.2 Q3 confirmed, survives the Q1/Q2 retraction) |
| ~~Monte topology (§3.2)~~ | ~~Schema-per-tenant vs row-level~~ | — | **RESOLVED 2026-04-15 19:19** via convergence on row-level + `owned_by` three-state column |
| ~~Monte Q2 (§5.2)~~ | ~~Cross-tenant leak at pg substrate~~ | — | **RESOLVED** via operator-superuser trust boundary + `audit_role` BYPASSRLS parallel role |
| ~~Monte Q3 (§5.2)~~ | ~~Librarian-asymmetry framing (committed baseline)~~ | — | **RESOLVED 2026-04-15 19:19** via Monte §3.2.1 unchanged on both tenants. §10 proposes a second-thesis addition on top (PROPOSED, gated on PO + apex consent, §1.2-compliant via option (c) application-layer wrapper) |
| ~~stdio-only vs HTTP+OAuth (§9.1 Q2)~~ | ~~mcp container service count~~ | — | **RESOLVED 2026-04-15 19:19** — stdio-only approved, mcp container dropped, service count 4→3 |
| ~~Container infra repo path (§9.1 Q1)~~ | ~~`containers/` vs `.claude/teams/framework-research/pilots/`~~ | — | **RESOLVED 2026-04-15 19:19** — `containers/xireactor-pilot/` at repo root |
| Monte Q1 (§5.2) | Shared vs dedicated Anthropic API account | Monte | Non-blocking — shared by default |
| Monte Q4 (§5.2) | Cross-tenant write scope enforcement | Monte | Non-blocking — application-layer policy via librarian conventions (§3.6 simultaneous-discovery flow) |
| Monte Q5 (§5.2) | Tier-3 confidence floor raise 0.7 → 0.85 per Cal §6.4 | Monte | Non-blocking — tunable at bootstrap; Monte's call |
| Audit cadence (§3.5.2) | Cron schedule unification | Monte | Non-blocking — default hourly |
| Herald Q4-Q5 (§6.2) | Protocol vocabulary ingestion, bridge vs replacement | Herald | Non-blocking for build; shape-affecting for post-build iteration |
| Celes — FR tenant user list | §3.3 bootstrap SQL content | Celes | Non-blocking — start with 2 users |
| apex-research tenant user list | §3.3 bootstrap SQL | apex-research team-lead (cross-team ask) | Non-blocking — start with 2 placeholder users |
| ~~Cal — migration cost of FR wiki 43 entries~~ | ~~Post-deployment data seeding~~ | — | **RESOLVED 2026-04-15 19:26** — no wiki migration; cross-tenant-writes-only committed pilot per Cal's assessment |
| **§10 second-thesis adoption** (PROPOSED) | Whether apex-research intra-tenant writes route through staging for a natural-experiment signal | PO (approval) + Schliemann (apex consent relay) + Eratosthenes (informed opt-in) | **OPEN — requires PO decision + apex opt-in**. §1.2-compliant via option (c) application-layer wrapper per §10.4. Default if rejected: Monte §3.2.1 symmetric (committed baseline). |

**Brunel recommendation (v0.6 update):** Herald v1.2 (in flight) is landing on outcome (c)/(c) — digest silent on both Q1 and Q2 — after Herald's v1.1 §A honest retraction. v0.5's "one MEDIUM + one SOFT + one DELIVERABLE" framing was premature; the current story is **"two items needing source-code walkthroughs at infrastructure stand-up + one deliverable."** Both preconditions land on the same §8.1 walkthrough surface, so the walkthrough cost stays fixed — what changed is the pre-walkthrough expectation about what we'll find, not what work is required. The walkthrough will resolve both at once.

### 8.1 Stand-up task — source-code walkthroughs for Herald Q1 + Q2 (Brunel-owned)

**v0.6 scope extension:** v0.5 scoped this walkthrough to Q2 (session_init RLS safety) only. Per team-lead 19:32, Herald v1.1 §A retracted the SOFT precondition claim for Q1 (tier-assignment lookup via source+role indirect encoding) and is landing on outcome (c) — digest silent. Q1 is now a source-code walkthrough item too, same surface as Q2. **Both preconditions resolve via one walkthrough pass at stand-up.**

**Task:** at xireactor infrastructure stand-up (pilot deploy time, not now), perform a source-code walkthrough of xireactor v0.2.0 covering two specific code paths.

#### 8.1.1 Q1 walkthrough — tier-assignment lookup for `owned_by`

**Question:** does xireactor's tier-assignment code (the logic that decides whether a write routes through staging or bypasses it) consult a per-row value like `owned_by` or `tenant_id` when making the routing decision? If yes, we can configure Monte §3.2.1's intra-tenant-bypass / cross-tenant-stage behavior by setting `owned_by` appropriately at insert time — zero upstream code change. If no, we need application-layer enforcement (short-circuit staging for intra-tenant writes in our own wrapper) OR a thin upstream patch.

**Source paths to inspect (tentative — update at stand-up):**
- `api/services/staging.py` or equivalent — tier-assignment decision point
- `api/models/` — the schema model for entries / staging items, to see what columns the tier-assignment layer has access to
- Whatever upstream calls its tier-lookup table + any migration that populates it

**Three outcomes I'm scoping (same shape as Q2 for symmetry):**

- **Q1 PASS** — tier-assignment already routes on a per-row ownership/tenant field with the right semantics. Pilot config is trivial — set `owned_by` to the inserting session's tenant for intra-tenant writes, explicitly to `'co-owned'` for cross-tenant writes (via Monte §2.3 / §3.6 flows). No upstream code change.
- **Q1 PARTIAL** — tier-assignment routes on *some* per-row field but not on `owned_by` semantics specifically (e.g., routes on a `sensitivity` field or a `change_type` field that we'd have to map our ownership model onto). Mitigation: add an application-layer wrapper that translates our `owned_by` values into whatever fields upstream's tier-assignment reads, OR add a thin upstream patch that introduces an `owned_by`-aware branch.
- **Q1 FAIL** — tier-assignment is hard-coded or routes on fields unrelated to ownership. Mitigation: application-layer short-circuit in a wrapper service in front of the api (staging is bypassed entirely for intra-tenant writes at the wrapper layer), OR upstream enhancement request.

#### 8.1.2 Q2 walkthrough — session_init RLS safety

**Question (unchanged from v0.5):** does every query inside the session_init code path set `SET LOCAL app.org_id` + `SET LOCAL ROLE kb_*` so that RLS policies apply when building the bootstrap preamble? In particular, does the preamble payload builder respect `app.org_id` when pulling pending-review items and cross-tenant state?

**Why it matters (team-lead 19:26 HIGHEST-consequence flag):** wiki #43 (`bootstrap-preamble-as-in-band-signal-channel`) names the failure mode explicitly — if the bootstrap channel silently pulls cross-tenant content that shouldn't be visible to the current tenant, both librarians still see preambles, the content is subtly wrong, and the failure is invisible (no 500, no audit trigger, just gradual governance drift via cross-tenant leakage at wake time). RLS is supposed to prevent exactly this, but the session_init code path is outside the normal REST request lifecycle and may not go through the same `SET LOCAL ROLE` discipline.

**Three outcomes I'm scoping:**

- **Q2 PASS** — every session_init query sets the session variables correctly; RLS policies apply to every preamble fetch. Pilot proceeds with zero mitigation needed.
- **Q2 PARTIAL** — some session_init queries go through RLS correctly; others (typically admin-flavored "show me all pending reviews" calls) use a superuser or a non-RLS-forced connection. Mitigation: add a wrapper that enforces `app.org_id` for the partial paths, OR thin upstream patch, OR document that session_init preamble is tenant-scoped only if the user's role is `kb_agent` or lower.
- **Q2 FAIL** — session_init is structurally RLS-bypassing. Cannot ship the pilot without a substantive upstream patch. Filed as upstream enhancement request; pilot ships later OR with session_init disabled and a workaround (cross-review items surfaced via a separate xireactor REST poll at tmux-spawn-time instead of the session_init preamble).

#### 8.1.3 Combined outcome matrix

Both walkthroughs run in the same stand-up pass (one reading-the-source session, two questions answered). The outcome is a 3×3 matrix of (Q1 outcome) × (Q2 outcome). The worst outcome is (Q1 FAIL, Q2 FAIL) — both preconditions require upstream patches, and the pilot ships later or with substantial workarounds. The best is (Q1 PASS, Q2 PASS) — both preconditions satisfied by upstream as-shipped, pilot proceeds zero-mitigation. Most interesting intermediate outcome is (Q1 PARTIAL, Q2 PASS) — Monte §3.2.1's intra-tenant-bypass needs a wrapper but the bootstrap-preamble channel works, which is a tractable shape.

**Not blocking this doc.** This is stand-up work, not design work. The walkthrough task belongs in the pilot deployment runbook (`containers/xireactor-pilot/README.md` — TBD), not in this architecture doc. Naming it here because both preconditions landed on this same surface and a future reader needs to know what the walkthrough is checking for.

---

## 9. Open questions — by recipient

### For team-lead (framework-research)

1. ~~**Container infra repo path:**~~ **RESOLVED 2026-04-15 19:19** — `containers/xireactor-pilot/` at repo root. Rationale: pilot infra serves two teams; repo-root location signals shared cross-team substrate. Reconciliation with ruth-team's different convention is a team-lead-owned `[NEXT-SESSION-CHORE]`.
2. ~~**Stdio vs HTTP+OAuth transport:**~~ **RESOLVED 2026-04-15 19:19** — stdio-only approved. Service count 4→3. See §3.4 for the collapse and the documented path back to HTTP+OAuth.
3. **Budget/timing:** is the pilot scheduled for the ecosystem-integration session (bundled with #57 + #58), or a standalone sub-session? Per team-lead's 2026-04-15 close decision, it's a three-member bundle — so build waits for the full-team session. Still open pending that session scheduling.

### For Monte (governance)

1-5. See §5.2.

### For Herald (protocols)

1-5. See §6.2.

### For Celes (roster — non-blocking)

1. What's the FR user list for the pilot tenant? 2 users (team-lead + 1 agent) is enough to start, but seeing all of FR would give a better pilot signal.
2. Same question for apex-research — cross-team ask. Celes may not own that answer; team-lead relays to apex-research team-lead.

### For Cal (librarian — non-blocking for infra)

1. Migration cost of FR's 43 wiki entries into xireactor's schema: is the wiki-entry shape (filename + frontmatter + markdown body) directly mappable to upstream's entries table, or does it need a translation pass? Not blocking the container stack; only blocking the post-deployment seeding step.
2. **§10 awareness (PROPOSED, not yet adopted).** Cal should know that §10 proposes a second-thesis addition: asymmetric Tier-3 configuration with apex intra-tenant writes routed through staging, gated on PO approval + apex consent. Under Cal's verdict this config may be a downgrade for librarian-equipped tenants; §10 tests Cal's verdict, not assumes it. **No action required from Cal this session** — team-lead owns relay if PO approves. Cal's Protocol A discipline on the FR side is unchanged under any outcome.

---

## 10. Second-thesis proposal — asymmetric Tier-3 natural experiment

**Status: PROPOSED, NOT ADOPTED.** Requires PO approval (second-thesis addition) + apex-research consent via tmux-direct to Schliemann for Eratosthenes opt-in. Default if PO rejects: pilot runs Monte §3.2.1 symmetric — both tenants bypass staging on intra-tenant writes, cross-tenant writes go through staging. The committed pilot thesis (§0 Overview, per Cal's migration assessment) is the *first* pilot thesis — this section proposes adding a *second* thesis on top of it.

**Revision history preamble (v0.6.3, 2026-04-15):** v0.3 correctly rejected v0.1's phantom flag-flip framing (under Monte §3.2.1, neither tenant's intra-tenant writes hit staging by default — nothing to compare). v0.4 §10 proposed a **novel** asymmetric configuration via deliberate deviation from Monte §3.2.1: route apex-research's intra-tenant writes through staging to CREATE the comparison that didn't exist under the default. This is genuinely new work, not a revert of v0.3. v0.5 withdrew §10 on an overbroad reading of team-lead 19:26's retraction. v0.6.1 restored §10 as PROPOSED per team-lead 19:51 narrow-retraction clarification. v0.6.2 re-withdrew on §1.2 upstream-discipline grounds per team-lead 19:58. v0.6.3 restores PROPOSED per team-lead 20:11 correction: the §1.2 violation applies only to implementation option (a) (schema column addition); option (c) (application-layer pre-filter) is §1.2-compliant — no schema change, no fork, no upstream modification.

**Two gating issues that prevent unilateral adoption this session:**

1. **Apex-research consent required.** §10 deliberately puts apex-research in the "Tier-3 ON" arm by routing their intra-tenant writes through staging — deviating from Monte §3.2.1. But apex-research is a different team with its own librarian (Eratosthenes) and its own team-lead (Schliemann). Cal's verdict argues staging+Tier-3 is a downgrade for librarian-equipped teams. Apex IS librarian-equipped. So §10 is asking Eratosthenes to accept a governance mode Cal has called worse for her profile. Opt-in required — apex is a pilot tenant, not a test subject.

2. **PO approval required.** §10 adds a second pilot thesis ("which governance mode fits what team") on top of the first ("does cross-tenant-slice work for librarian-equipped teams"). PO committed to pilot #1 on Cal's verdict. PO has not seen pilot #2.

**Relay plan (team-lead owns):** §10 added to the PO brief as a separate decision item. NOT relayed to Monte or Cal this session. If PO approves, next-session relay chain: Monte governance-doc update, Cal comparative-experiment awareness brief, Schliemann tmux-direct for apex opt-in.

---

### 10.1 The proposed experiment

IF approved, the pilot runs with **asymmetric Tier-3 AI reviewer activation** between the two tenants:

| Tenant | Intra-tenant writes | Cross-tenant writes (`owned_by = co-owned`) | Rationale |
|---|---|---|---|
| **FR** | Protocol A + Cal direct filing (**staging DISABLED per Monte §3.2.1 default**) | Staging + Tier-3 AI reviewer + cross-review (Monte §3.2.1 unchanged) | FR has mature librarian discipline, 43 wiki entries, established Protocol A practice. Staging here would add latency to solved problem per Cal's assessment. |
| **apex-research** | Protocol A + Eratosthenes filing + **staging + Tier-3 AI reviewer** (**deliberate deviation from Monte §3.2.1 default, gated on apex consent**) | Staging + Tier-3 AI reviewer + cross-review (same as FR, Monte §3.2.1 unchanged) | HYPOTHESIS (requires apex opt-in): Tier-3 may provide a second-pass check at newer-librarian write surface. Cal's verdict argues against this for librarian-equipped teams — §10 is testing Cal's verdict, not assuming it. |

### 10.2 What the experiment measures

Three signals: (1) does Tier-3 catch submissions librarian-alone would mis-classify, (2) what's the latency cost of intra-tenant staging at apex-research's write rate, (3) does librarian discipline converge or diverge over the pilot window. See v0.4 §10.2 for the full measurement spec.

### 10.3 Risks and limits of the signal

Three confounds: team baseline asymmetry (FR is tenured, Eratosthenes is newer — can't cleanly separate "Tier-3 helps" from "librarian is learning"), reviewer model choice dominates signal, pilot window (~1 month) is short for rare-event detection. These confounds are honest work regardless of whether §10 gets adopted — they apply to any natural-experiment framing of a 2-tenant 1-month pilot.

### 10.4 Implementation — §1.2-compliant path

**Critical §1.2 note (v0.6.3):** v0.4 §10.5 listed three implementation options. Option (a) (add `intra_tenant_staging` column to upstream's schema) IS a schema fork and WOULD violate §1.2 upstream discipline. **Option (c) — application-layer pre-filter short-circuit — is the §1.2-compliant path.** Option (c) does not modify upstream's schema, does not add columns, does not patch upstream code. It is a thin wrapper that reads our own pilot-config file and short-circuits the staging pipeline response for FR intra-tenant writes with "auto-approve." Upstream is untouched. The wrapper lives in our customization layer (`containers/xireactor-pilot/`), not in upstream's codebase.

This is what closes the v0.5/v0.6.2 §1.2-violation concern: the concern applied only to option (a), not to the recommended option (c). v0.5's withdrawal framed the whole §10 as a "substrate deviation" without distinguishing between the three implementation options — an overstatement that v0.6.3 corrects.

If PO approves §10 but apex declines opt-in, §10 is withdrawn and the pilot defaults to Monte §3.2.1 symmetric. No fallback experiment.

### 10.5 What §10 requires from other FR agents (IF adopted)

- **PO:** approval to add second pilot thesis.
- **Schliemann → Eratosthenes:** informed consent for apex opt-in (includes "Cal's verdict says this may be a downgrade for your profile" caveat).
- **Cal:** comparative-experiment awareness brief. Her discipline is unchanged on FR side.
- **Monte:** governance-doc update to name the asymmetric Tier-3 as a pilot instrument.
- **Herald:** §6.2 Q1 tier-assignment lookup becomes load-bearing for option (c) wrapper design.
- **Celes:** non-blocking.

---

## Appendix A — What this doc does NOT decide

- Whether the pilot succeeds (post-pilot evaluation, not infra)
- Migration tooling for existing wiki/librarian entries (Cal + Celes call)
- Cross-team governance vocabulary alignment (Monte + Herald call)
- Anthropic account ownership policy (Monte call — same Q shape as ruth-team §4.3)
- Whether ruth-team's git-mediated bridge becomes obsolete (Herald call, see §6.2 Q5)
- Timing and scheduling (team-lead + PO call)

## Appendix B — What this doc DOES decide

- Upstream discipline: consume `thejeremyhodge/xireactor-brilliant` at a pinned tag; customization layer is thin (compose override + bootstrap SQL + audit sidecar)
- Host placement: RC dev server `100.96.54.170`, co-located with existing containers, no dedicated infra
- **Substrate (RESOLVED v0.4):** single Postgres instance, single database, two `org_id` values via row-level RLS + Monte's §3.2.1 three-state `owned_by` column
- **Transport (RESOLVED v0.4):** stdio-only; upstream `mcp` container not deployed; path back to HTTP+OAuth documented for cheap re-enablement
- **Network path (RESOLVED v0.4):** api host-port-bound to Tailscale interface only on B; CF Tunnel reuse deferred until/unless HTTP+OAuth is re-enabled
- **File placement (RESOLVED v0.4):** `containers/xireactor-pilot/` at repo root
- **Audit container (RESOLVED v0.4):** `BYPASSRLS` read-only role on primary, sidecar container, hourly cron
- **RLS migration-error safety net (RESOLVED v0.4):** `bootstrap/9999_rls_lint.sql` runs at init.d time and before every upstream tag bump
- **Committed pilot thesis (RESOLVED v0.5):** pilot is a **cross-tenant-writes-only slice on top of both tenants' existing wikis**, NOT a wiki migration. Both tenants run Monte §3.2.1 unchanged; staging + Tier-3 fires on `owned_by=co-owned` writes only. See §0 Overview for Cal's rationale.
- **Proposed second-thesis addition (v0.4 §10, restored v0.6.1/v0.6.3):** asymmetric Tier-3 natural experiment — apex intra-tenant writes route through staging via application-layer wrapper. **PROPOSED, NOT ADOPTED.** Gated on PO approval + apex consent. §1.2-compliant via option (c) per §10.4 (no schema fork — the v0.5/v0.6.2 withdrawal on §1.2 grounds applied only to option (a), not option (c)). Default if rejected: committed baseline unchanged.
- **Upstream-discipline principle (NAMED v0.6 §1.2):** "piloting a different artifact than the one under evaluation is category-invalid." Two-layer regression defense — upstream pinning protects us from drift, CI lint protects us from silent upstream regression. Possible wiki candidate if principle recurs.
- **Monte v4 §3.6.3 schema invariant (NEW v0.6 §3.3):** `owned_by NOT NULL` + default-to-inserting-session's-tenant, never `'co-owned'`. Anti-race invariant enforced at schema time via `9000_schema_ext.sql`; `co-owned` only enters the table via deliberate Monte §2.3 / §3.6 flows.
- **Audit container closes Monte v4 §7.1.2 (v0.6 cross-reference):** `BYPASSRLS` read-only role on primary, sidecar container, hourly cron — Brunel's concrete answer to the infrastructure flag Monte left open in his v4.
- **Herald preconditions (v0.6 correction):** v0.5 folded Monte v3 §7.2's SOFT/MEDIUM labels; Herald v1.1 §A retracted those after honest digest re-read, landing on outcome (c)/(c) — digest silent on both Q1 and Q2. **Both resolve via §8.1 source-code walkthrough at stand-up** — one walkthrough pass, two questions answered, 3×3 outcome matrix.
- **Source-code walkthrough task (§8.1, extended v0.6):** covers Herald Q1 (tier-assignment lookup for `owned_by`) AND Q2 (session_init RLS safety). Three outcomes per precondition (PASS / PARTIAL / FAIL). Not blocking this doc; runs at infrastructure stand-up.
- Parameterization contract (§1.1) — 10 env vars (was 11 in v0.2 before OAuth issuer URL dropped out)
- B→E migration is a config swap + one-time pgdata dump/restore + client-side MCP config refresh, not a rearchitecture

---

## Appendix C — Comparison with ruth-team design

For scope-separation clarity, here is what differs between this pilot and the ruth-team container design. Updated for v0.6.

| Aspect | ruth-team (my earlier doc) | xireactor-pilot (this doc, v0.6) |
|---|---|---|
| Subject | Team-for-a-human (Ruth) | Cross-tenant-writes-only slice for 2 tenants (FR + apex-research) |
| Base image | `evr-ai-base:latest` rebuild | Upstream `pgvector/pgvector:pg16` + upstream api image |
| Image discipline | We own the Dockerfile | We DO NOT own the Dockerfile — upstream does |
| Agents run inside | Yes — tmux panes, Claude Code per agent | No — it's a backend service, agents connect as clients via stdio MCP subprocess |
| SSH exposure | Yes (host port per team) | No |
| External HTTP exposure | No (CF Tunnel at `ruth-team.dev.evr.ee` when ready) | No pilot ingress (stdio-only collapse); future HTTP+OAuth re-enablement uses CF Tunnel |
| Bridge to apex | Bespoke git-mediated with write-through cache | Xireactor co-owned slice IS the bridge — narrow, substrate-level, governance-mediated |
| Relationship to existing wikis | N/A | Additive — xireactor adds a co-owned layer on top of existing wikis, which are NOT migrated |
| Governance surface | Tiny (Cal-proxied wiki entries) | Row-level RLS + Monte §3.2.1 three-state ownership + staging pipeline for `owned_by=co-owned` + audit container |
| Credential surface | 1 (Anthropic OAuth per team) | 4 (pg superuser, tenant bearer tokens, Anthropic API key for Tier-3 reviewer, audit_role password) |
| Service count | 1 primary container + per-team config | 3 (db, api, audit_sidecar) |
| Co-location on RC | Same host as apex-research | Same host as apex-research + ruth-team + others |
| Portability model | `DEPLOYMENT_MODE=B/E` env toggle | `DEPLOYMENT_MODE=B/E` env toggle |
| B→E complexity | Harder — WARP, team config repo, per-team sshd/tmux | Simpler — pgdata dump+restore is the only unique cost; see §1.3 named finding |
| Scope | Infra only | Infra + committed pilot thesis (§0) + PROPOSED second thesis (§10, gated on PO + apex) |

**These two designs are siblings in discipline, independent in substrate.** Do not conflate. If a future reader confuses them, they are reading too fast.

---

(*FR:Brunel*) — Design v0.6.3 (session-final), 2026-04-15. Monte v4 §7.1.1 convergence confirmed, Monte v4 §3.6.3 schema invariant folded, Herald v1.1 §A retraction folded. §10 asymmetric-Tier-3 experiment restored as PROPOSED (not ADOPTED) per team-lead 20:11 correction — option (c) application-layer wrapper is §1.2-compliant (the v0.5/v0.6.2 §1.2-violation concern applied only to option (a) schema-column addition, not to the recommended option (c)). Gated on PO approval + apex consent via Schliemann. Committed pilot thesis is cross-tenant-writes-only slice per Cal's assessment. Both Herald Q1 and Q2 are digest-silent preconditions that resolve via the §8.1 source-code walkthrough at infrastructure stand-up. Monte topology, credential loops, transport, file placement, and committed baseline all closed. Not yet deployment-ready — requires §8.1 walkthrough outcome + PO decision on §10 before build.
