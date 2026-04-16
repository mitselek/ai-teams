# xireactor-pilot — Deploy Runbook

**Author:** (*FR:Brunel*)
**Target host:** `dev@100.96.54.170` (RC)
**Expected duration:** ~30 min including smoke test
**Reference:** `.claude/teams/framework-research/docs/xireactor-pilot-host-architecture-2026-04-15.md` v0.6.3

This runbook gets the 3-service stack (db + api + audit_sidecar) live with two
provisioned tenants (framework-research + apex-research) and a smoke test that
verifies RLS isolation.

---

## 0. Pre-flight

On the operator workstation:

- [ ] `mitselek/ai-teams` repo is cloned and this file is at
      `containers/xireactor-pilot/DEPLOY.md` within that clone.
- [ ] Tailscale is up and you can reach `dev@100.96.54.170`.
- [ ] SSH to RC works: `ssh dev@100.96.54.170` returns a shell.

On RC:

- [ ] `docker` daemon is healthy: `docker ps` returns cleanly.
- [ ] Disk: `df -h /` shows ≥2 GB free.
- [ ] RAM: `free -h` shows ≥1 GB free.
- [ ] Tailscale interface is up: `tailscale status` shows `100.96.54.170` self.
- [ ] Ports free: `ss -lntp | grep -E ':(8010|5432)\s'` returns empty.

---

## 1. Stage the pilot on RC

```bash
ssh dev@100.96.54.170
cd /home/dev

# First-time only: clone the pilot infra repo.
# If already cloned, cd in and git pull.
git clone git@github.com:mitselek/ai-teams.git mitselek-ai-teams || true
cd mitselek-ai-teams
git pull
cd containers/xireactor-pilot
```

The staging path is `/home/dev/mitselek-ai-teams/containers/xireactor-pilot/`.
Everything below is run from that directory unless stated otherwise.

---

## 2. Clone upstream xireactor

Per §1.2 upstream discipline, we consume `thejeremyhodge/xireactor-brilliant`
at a pinned tag. Do NOT fork, do NOT patch upstream files in place.

```bash
cd /home/dev
git clone https://github.com/thejeremyhodge/xireactor-brilliant.git
cd xireactor-brilliant
git checkout v0.2.0   # matches PILOT_REPO_REF in .env
```

Record the exact commit SHA on the deploy log (step 11).

---

## 3. Produce `.env` + secrets

Back in the pilot directory:

```bash
cd /home/dev/mitselek-ai-teams/containers/xireactor-pilot
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and AUDIT_ROLE_PASSWORD to fresh values.
# 24 random bytes hex is a reasonable choice: `openssl rand -hex 24`
```

Tenant bearer tokens and the Anthropic API key live under `secrets/`
(gitignored):

```bash
# Anthropic API key — real key in a plain file (root:600 ideally)
echo 'sk-ant-CHANGE_ME' > secrets/anthropic-api-key
chmod 600 secrets/anthropic-api-key

# Tenant tokens file (operator-only, never committed)
cat > secrets/tenant-tokens.env <<'EOF'
FR_TEAM_LEAD_TOKEN=$(openssl rand -hex 32)
FR_AGENT_TOKEN=$(openssl rand -hex 32)
APEX_TEAM_LEAD_TOKEN=$(openssl rand -hex 32)
APEX_AGENT_TOKEN=$(openssl rand -hex 32)
EOF
# Expand the openssl calls — the heredoc above is illustrative; substitute
# real hex strings before saving.
chmod 600 secrets/tenant-tokens.env
```

The tokens will be wired into the db by a small post-bootstrap INSERT in
step 5.

---

## 4. Bring the database up

```bash
cd /home/dev/mitselek-ai-teams/containers/xireactor-pilot

docker compose \
  -f /home/dev/xireactor-brilliant/docker-compose.yml \
  -f docker-compose.override.yml \
  pull

docker compose \
  -f /home/dev/xireactor-brilliant/docker-compose.yml \
  -f docker-compose.override.yml \
  up -d db

# Wait for upstream's 21 migrations + our 5 bootstrap files to run.
docker compose -f /home/dev/xireactor-brilliant/docker-compose.yml \
               -f docker-compose.override.yml \
               logs -f db
# Expect to see the bootstrap files run in order:
#   9000_schema_ext.sql → 9001_tenant_fr.sql → 9002_tenant_apex.sql
#   9998_audit_role.sql → 9999_rls_lint.sql
# The RLS lint MUST exit cleanly. If it RAISEs, stop and investigate.
```

**Checkpoint — RLS lint:**

```bash
docker compose -f /home/dev/xireactor-brilliant/docker-compose.yml \
               -f docker-compose.override.yml \
               logs db | grep -i 'rls lint\|rls_lint\|RAISE'
# No 'RAISE EXCEPTION' line ⇒ lint passed. If you see one, tear down per §8
# and escalate to team-lead (do NOT patch upstream).
```

---

## 5. Wire tenant bearer tokens

Upstream's auth table shape needs to be confirmed during the §8.1 source-code
walkthrough. Tentative pattern (UPDATE with the real table/column names once
the walkthrough completes):

```bash
source secrets/tenant-tokens.env

docker compose -f /home/dev/xireactor-brilliant/docker-compose.yml \
               -f docker-compose.override.yml \
               exec -T db \
  psql -U postgres -d xireactor <<SQL
INSERT INTO api_tokens (user_id, token, created_at) VALUES
  ('fr-team-lead', '${FR_TEAM_LEAD_TOKEN}', NOW()),
  ('fr-agent',     '${FR_AGENT_TOKEN}',     NOW()),
  ('ar-team-lead', '${APEX_TEAM_LEAD_TOKEN}', NOW()),
  ('ar-agent',     '${APEX_AGENT_TOKEN}',     NOW());
SQL
```

If upstream's token table is named differently, update the `INSERT` target.
The token→org_id binding comes from the `users` row seeded by `9001/9002`.

---

## 6. Bring api + audit_sidecar up

```bash
docker compose \
  -f /home/dev/xireactor-brilliant/docker-compose.yml \
  -f docker-compose.override.yml \
  up -d api audit_sidecar
```

**Checkpoint — port binding scope (CRITICAL, §2.3):**

```bash
ss -lntp | grep 8010
```

Expected: bound to `100.96.54.170:8010` OR `127.0.0.1:8010`.
**If bound to `0.0.0.0:8010`: STOP.** The api is exposed to the public
internet — tear down (`docker compose down`) and fix `API_HOST_BIND` in
`.env` before restart.

---

## 7. API reachability

From any Tailscale peer (operator workstation is fine):

```bash
curl -sSf http://100.96.54.170:8010/health
# Expect 200 + whatever body upstream ships.
```

From a non-Tailscale host (e.g., phone on LTE): the request should time out
or be refused. If it succeeds, the firewall on RC is not scoping the port
correctly — stop and fix before going live.

---

## 8. Smoke test — RLS isolation (three checks)

Per team-lead directive 2026-04-16, three checks (not two):

- **Check A (basic function):** FR tenant writes an entry, FR tenant reads it
  back. Must succeed.
- **Check B (Q2 invariance):** FR tenant writes an entry, apex tenant
  attempts to read it. MUST return zero rows.
- **Check C (Q1 RLS validation):** apex tenant writes an entry, FR tenant
  attempts to read it. MUST return zero rows.

From the operator workstation:

```bash
source /home/dev/mitselek-ai-teams/containers/xireactor-pilot/secrets/tenant-tokens.env

# Check A — FR writes, FR reads
curl -sS -X POST http://100.96.54.170:8010/entries \
  -H "Authorization: Bearer ${FR_TEAM_LEAD_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"title":"smoke-test-fr-A","body":"from FR, readable by FR"}'

curl -sS http://100.96.54.170:8010/entries?title=smoke-test-fr-A \
  -H "Authorization: Bearer ${FR_TEAM_LEAD_TOKEN}"
# MUST return the entry.

# Check B — FR entry invisible to apex
curl -sS http://100.96.54.170:8010/entries?title=smoke-test-fr-A \
  -H "Authorization: Bearer ${APEX_TEAM_LEAD_TOKEN}"
# MUST return empty array / zero rows.

# Check C — apex entry invisible to FR
curl -sS -X POST http://100.96.54.170:8010/entries \
  -H "Authorization: Bearer ${APEX_TEAM_LEAD_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d '{"title":"smoke-test-apex-C","body":"from apex, invisible to FR"}'

curl -sS http://100.96.54.170:8010/entries?title=smoke-test-apex-C \
  -H "Authorization: Bearer ${FR_TEAM_LEAD_TOKEN}"
# MUST return empty array / zero rows.
```

**Pass criteria:** A returns the entry; B and C return empty. Any other
result is a smoke-test FAIL.

**On FAIL — teardown, NOT patch** (§1.2 upstream discipline; accepted as
invariant by team-lead 2026-04-16 Blocker 3 resolution):

```bash
docker compose -f /home/dev/xireactor-brilliant/docker-compose.yml \
               -f docker-compose.override.yml \
               down -v
```

Then report to team-lead with the curl output showing the leak.

---

## 9. Bootstrap KB deploy log (Phase 2, after smoke passes)

Only run this step after the three smoke checks pass.

```bash
# Write a deploy log entry into the FR tenant's KB.
# Body content: paste the deploy log template from containers/xireactor-pilot/README.md
curl -sS -X POST http://100.96.54.170:8010/entries \
  -H "Authorization: Bearer ${FR_TEAM_LEAD_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d @deploy-log-bootstrap-entry.json
```

See README.md "Bootstrap KB entry" section for the canonical entry shape.

---

## 10. MCP stdio client config (consumer side)

Two snippets are checked into `mcp-client-snippets/`:

- `claude-code-framework-research.json` — FR tenant
- `claude-code-apex-research.json` — apex tenant

Each consumer merges the relevant snippet into their Claude Code MCP config
(typically `~/.claude/mcp.json` or an equivalent per-project config) and
replaces the `<FR_BEARER_TOKEN>` / `<APEX_BEARER_TOKEN>` placeholder with
the real token from `secrets/tenant-tokens.env`.

The upstream `xireactor_mcp.server` module ships with the v0.2.0 tag — consumers
install it via whatever Python venv their Claude Code session uses. Pip
install instructions live in xireactor-brilliant's README.

---

## 11. Record the deploy

On the operator workstation, append an entry to this repo's deploy log (the
FR wiki entry created in step 9) or to the team-lead's session notes:

- Deploy timestamp (UTC)
- Upstream commit SHA from step 2
- Smoke test results (A/B/C pass|fail)
- RLS lint result
- Port binding verified scope (`127.0.0.1`, `100.96.54.170`, or other)

Report back to team-lead via SendMessage.

---

## Teardown

```bash
cd /home/dev/mitselek-ai-teams/containers/xireactor-pilot

# Graceful stop, keep pgdata
docker compose -f /home/dev/xireactor-brilliant/docker-compose.yml \
               -f docker-compose.override.yml \
               down

# Destructive — loses all tenant data, audit reports, pgdata
docker compose -f /home/dev/xireactor-brilliant/docker-compose.yml \
               -f docker-compose.override.yml \
               down -v
```

Use the destructive form only when reverting a failed pilot.
