-- 9001_tenant_fr.sql
-- framework-research (FR) tenant seed.
--
-- Two users to start: team-lead + one agent. Add more by re-running targeted
-- INSERTs after bootstrap; this file is the genesis seed, not a living config.
--
-- Bearer tokens are NOT set here. See DEPLOY.md step 5 for the out-of-band
-- token generation flow; tokens are stored on the operator workstation in
-- secrets/tenant-tokens.env (gitignored).

INSERT INTO organizations (id, name, created_at) VALUES
  ('fr', 'framework-research', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, org_id, email, role) VALUES
  ('fr-team-lead', 'fr', 'team-lead@fr.local', 'admin'),
  ('fr-agent',     'fr', 'agent@fr.local',     'agent')
ON CONFLICT (id) DO NOTHING;
