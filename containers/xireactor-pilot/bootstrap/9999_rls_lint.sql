-- 9999_rls_lint.sql
-- Layer-2 regression defense (§1.2): defensive assertion that every
-- tenant-scoped table has FORCE ROW LEVEL SECURITY enabled.
--
-- Upstream v0.2.0 already enables FORCE on every tenant-scoped table per Finn's
-- digest §3 line 29. This lint protects against SILENT UPSTREAM REGRESSION at
-- tag-bump time: a future upstream tag that ships a new tenant-scoped table
-- without FORCE would merge zones under row-level isolation; this lint refuses
-- to start the stack with a clear error message.
--
-- If the lint fires, do NOT patch upstream (§1.2) — escalate to team-lead and
-- consider bumping back to the prior pinned tag or filing an upstream issue.

-- The allowlist of tenant-scoped tables. One-time audit of upstream v0.2.0;
-- requires review at every upstream-tag bump.
CREATE TABLE IF NOT EXISTS tenant_scoped_tables (
  table_name text PRIMARY KEY
);

INSERT INTO tenant_scoped_tables (table_name) VALUES
  ('entries'),
  ('entry_links'),
  ('staging')
ON CONFLICT (table_name) DO NOTHING;

-- Refuse to start if any tenant-scoped table is missing FORCE RLS.
DO $$
DECLARE
  unforced_count int;
  unforced_names text;
BEGIN
  SELECT count(*), string_agg(t.tablename, ', ')
    INTO unforced_count, unforced_names
  FROM pg_tables t
  JOIN pg_class c
    ON c.relname = t.tablename
   AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
  WHERE t.schemaname = 'public'
    AND t.tablename IN (SELECT table_name FROM tenant_scoped_tables)
    AND NOT c.relforcerowsecurity;

  IF unforced_count > 0 THEN
    RAISE EXCEPTION
      'RLS lint failure: % tenant-scoped table(s) missing FORCE ROW LEVEL SECURITY: %',
      unforced_count, unforced_names;
  END IF;
END $$;
