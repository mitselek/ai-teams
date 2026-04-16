#!/usr/bin/env bash
# audit-run.sh — cross-tenant boundary report generator (§3.5.2)
#
# Runs as audit_role (BYPASSRLS, read-only session).
# Emits one markdown report per run into /reports, timestamped.
#
# Env inputs (from compose):
#   PGHOST, PGUSER, PGPASSWORD, PGDATABASE — supplied by compose env

set -euo pipefail

: "${PGHOST:?required}"
: "${PGUSER:?required}"
: "${PGPASSWORD:?required}"
: "${PGDATABASE:?required}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="/reports/audit-${STAMP}.md"

mkdir -p /reports

{
  echo "# Tenant boundary report — ${STAMP}"
  echo
  echo "**Host:** \`${PGHOST}\`  "
  echo "**Role:** \`${PGUSER}\` (BYPASSRLS, read-only session)"
  echo
  echo "## Entry counts by (org_id, owned_by)"
  echo
  echo '```'
  psql -At -F $'\t' -c "
    SELECT org_id, owned_by, zone, count(*)
      FROM entries
     GROUP BY 1, 2, 3
     ORDER BY 1, 2, 3;
  "
  echo '```'
  echo
  echo "## Co-owned entries (cross-tenant writes)"
  echo
  echo '```'
  psql -At -F $'\t' -c "
    SELECT id, org_id, owned_by, zone, created_at
      FROM entries
     WHERE owned_by = 'co-owned'
     ORDER BY created_at DESC
     LIMIT 50;
  "
  echo '```'
  echo
  echo "## RLS invariant check"
  echo
  echo '```'
  psql -At -c "
    SELECT t.tablename,
           c.relforcerowsecurity AS force_rls
      FROM pg_tables t
      JOIN pg_class c
        ON c.relname = t.tablename
       AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
     WHERE t.schemaname = 'public'
       AND t.tablename IN (SELECT table_name FROM tenant_scoped_tables)
     ORDER BY 1;
  "
  echo '```'
} > "${OUT}"

echo "[audit-run] wrote ${OUT}"
