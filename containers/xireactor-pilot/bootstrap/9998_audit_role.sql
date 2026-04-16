-- 9998_audit_role.sql
-- Audit role with BYPASSRLS for the audit_sidecar container (§3.5).
--
-- Security implications (§3.5.1): `audit_role` is cross-tenant-privileged.
-- Password lives in .env on B, Docker Swarm secret on E. Same rotation cadence
-- as the pg superuser (quarterly or on suspicion).
--
-- Psql variable :'audit_password' is set by the init.d entrypoint via
-- AUDIT_ROLE_PASSWORD env var. If this file runs standalone outside of init.d,
-- pass the password with `-v audit_password=...`.

\set audit_password `echo ${AUDIT_ROLE_PASSWORD:-CHANGE_ME}`

-- Idempotent role creation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'audit_role') THEN
    EXECUTE format(
      'CREATE ROLE audit_role WITH LOGIN PASSWORD %L BYPASSRLS',
      :'audit_password'
    );
  ELSE
    EXECUTE format(
      'ALTER ROLE audit_role WITH LOGIN PASSWORD %L BYPASSRLS',
      :'audit_password'
    );
  END IF;
END $$;

GRANT CONNECT ON DATABASE xireactor TO audit_role;
GRANT USAGE ON SCHEMA public TO audit_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO audit_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO audit_role;

-- Defense-in-depth: force read-only at the session level too.
ALTER ROLE audit_role SET default_transaction_read_only = on;
