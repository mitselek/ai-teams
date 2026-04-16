# xireactor-pilot

**Codename:** VJS2KB
**Status:** Phase 1 artifacts (not yet deployed)
**Author:** (*FR:Brunel*)
**Date:** 2026-04-16

Cross-tenant-writes-only KB pilot deploying `thejeremyhodge/xireactor-brilliant`
as a shared substrate for framework-research (FR) and apex-research.

## What this is

A 3-service Docker Compose stack co-located on RC `100.96.54.170`:

- `db` — `pgvector/pgvector:pg16` with row-level RLS, two tenants
- `api` — upstream FastAPI on port 8010, Tailscale-scoped
- `audit_sidecar` — `BYPASSRLS` auditor emitting hourly tenant-boundary reports

**Consumers reach the api over MCP stdio** — each Claude Code session launches
upstream's `server.py` as a subprocess (the upstream `mcp` container is NOT
deployed; see design doc §3.4).

## Directory layout

```
containers/xireactor-pilot/
  README.md                         <- this file
  DEPLOY.md                         <- operator runbook
  docker-compose.override.yml       <- overrides upstream; use via `docker compose -f ... -f ...`
  .env.example                      <- template; real values in .env (gitignored)
  .gitignore
  bootstrap/                        <- SQL run after upstream's 21 migrations
    9000_schema_ext.sql             <- Monte §3.2.1 + §3.6.3 schema invariant
    9001_tenant_fr.sql              <- FR tenant seed
    9002_tenant_apex.sql            <- apex-research tenant seed
    9998_audit_role.sql             <- BYPASSRLS role
    9999_rls_lint.sql               <- defensive FORCE RLS assertion
  audit_sidecar/
    Dockerfile                      <- postgres:16-alpine + audit-run.sh
    audit-run.sh                    <- hourly boundary report generator
  mcp-client-snippets/
    claude-code-framework-research.json
    claude-code-apex-research.json
  secrets/                          <- gitignored; operator-side only
    .gitignore                      <- commits just the dir
```

## Design reference

Full architecture and rationale:
`.claude/teams/framework-research/docs/xireactor-pilot-host-architecture-2026-04-15.md`
(v0.6.3, 2026-04-15). Read this before modifying any file in this directory.

Related design docs (post-deploy evaluation frameworks, per PO directive
2026-04-16):

- `.claude/teams/framework-research/docs/xireactor-pilot-migration-assessment-2026-04-15.md` (Cal)
- Monte governance doc v4 (§3.2.1 three-state `owned_by`, §3.6.3 schema invariant)
- Herald bridge protocol v1.2 (§A — digest-silent Q1/Q2)

## Deployment posture

**Deploy first, design later** (PO directive 2026-04-16). The four design docs
above become evaluation frameworks AFTER the deploy, not preconditions. The
`.claude/teams/framework-research/docs/xireactor-pilot-host-architecture-2026-04-15.md`
§Status "not deployment-ready" gate is explicitly overridden for this experiment.

**Smoke test IS the §8.1 source-code walkthrough substitute.** Three RLS checks
(see DEPLOY.md §8). **On failure: teardown, do NOT patch upstream** (§1.2
upstream discipline; accepted as invariant).

## Bootstrap KB entry (template for Phase 2, step 9 in DEPLOY.md)

After the three smoke checks pass, seed the KB with this entry so it isn't
empty when teams first query. Post as FR team-lead:

```json
{
  "title": "xireactor-pilot deploy log 2026-04-16",
  "org_id": "fr",
  "owned_by": "fr",
  "zone": "private",
  "tags": ["deploy", "pilot", "infra"],
  "body": "# xireactor-pilot VJS2KB — initial deploy log\n\n- Upstream tag: v0.2.0\n- Upstream commit SHA: <fill at deploy time>\n- Host: RC (100.96.54.170), Tailscale-scoped port 8010\n- Services: db + api + audit_sidecar (stdio-only; upstream mcp not deployed)\n- Tenants provisioned: fr, apex-research\n- Smoke test A/B/C results: <fill at deploy time>\n\n## Design references\n\n- Host architecture: `.claude/teams/framework-research/docs/xireactor-pilot-host-architecture-2026-04-15.md` v0.6.3\n- Migration assessment (Cal): `docs/xireactor-pilot-migration-assessment-2026-04-15.md`\n- Monte v4 governance doc (§3.2.1 three-state `owned_by`, §3.6.3 schema invariant)\n- Herald v1.2 bridge protocol (§A digest-silent Q1/Q2)\n\n## What this pilot tests\n\nWhether cross-tenant co-owned entries produce usable signal between FR and apex-research. Per Cal's migration assessment, wiki migration is NOT in scope — existing wikis stay in place and do not move. This is a cross-tenant-writes-only slice on top of both tenants' existing wikis.\n\n## Failure modes (§8.1 Q1/Q2)\n\n- Q1 fail: xireactor's tier-assignment does not route on `owned_by` → per-zone staging silently doesn't work, writes merge tenants.\n- Q2 fail: session_init does not `SET LOCAL app.org_id` → invisible cross-tenant leak at wake time (wiki #43).\n\nSmoke test covers Q2 via B/C checks. Q1 validates once tenants start producing cross-tenant writes and tier-assignment behaviour is observed."
}
```

This is a Phase 2 artifact. Save it as `deploy-log-bootstrap-entry.json` in
the operator working directory (gitignored) when actually posting, and fill
in the `<fill at deploy time>` values from the deploy session.

## Quick start

Read `DEPLOY.md`. It's the single source of truth for bringing the stack up.

## Port allocation

The pilot occupies **one** host port on RC: TCP `8010`, bound to the Tailscale
interface (`100.96.54.170`), NEVER `0.0.0.0`. Registered in `deployments.md`
under "Backend services (non-SSH)".

## Teardown

See `DEPLOY.md` "Teardown" section. `docker compose down` preserves pgdata;
`docker compose down -v` destroys it. Use the destructive form only when
reverting a failed pilot.
