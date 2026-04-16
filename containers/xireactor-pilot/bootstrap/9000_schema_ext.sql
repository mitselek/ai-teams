-- 9000_schema_ext.sql
-- Monte v4 §3.2.1 governance column extension + §3.6.3 schema invariant.
--
-- Runs AFTER upstream's 21 migrations (/docker-entrypoint-initdb.d/ lexicographic
-- sort). Whether this file is a no-op or load-bearing depends on the §8.1
-- source-code walkthrough outcome — if upstream already has an `owned_by`-shaped
-- column with correct semantics, this file becomes a constraint-tightening file
-- only. If not, it adds the column + default + CHECK.
--
-- Invariant (Monte v4 §3.6.3): `owned_by` MUST be NOT NULL and MUST default to
-- the inserting session's single-tenant value (`fr` or `apex-research`), NEVER
-- to `co-owned`. `co-owned` is always the result of a deliberate §2.3 transfer
-- or §3.6 simultaneous-discovery, never a default.

-- --- Ensure `owned_by` column exists with strict default -------------------
-- `entries` is xireactor's primary tenant-scoped table. If upstream renames it,
-- update this file at tag-bump time.
ALTER TABLE IF EXISTS entries
  ADD COLUMN IF NOT EXISTS owned_by text NOT NULL
  DEFAULT current_setting('app.org_id');

-- CHECK constraint enforcing three-state domain. DROP-then-ADD for idempotency.
ALTER TABLE IF EXISTS entries
  DROP CONSTRAINT IF EXISTS entries_owned_by_domain;
ALTER TABLE IF EXISTS entries
  ADD CONSTRAINT entries_owned_by_domain
  CHECK (owned_by IN ('fr', 'apex-research', 'co-owned'));

-- --- Ensure `zone` column exists (Monte zone taxonomy) ---------------------
ALTER TABLE IF EXISTS entries
  ADD COLUMN IF NOT EXISTS zone text NOT NULL
  DEFAULT 'private';

ALTER TABLE IF EXISTS entries
  DROP CONSTRAINT IF EXISTS entries_zone_domain;
ALTER TABLE IF EXISTS entries
  ADD CONSTRAINT entries_zone_domain
  CHECK (zone IN ('private', 'shared-read', 'shared-write'));
