-- 9002_tenant_apex.sql
-- apex-research tenant seed.

INSERT INTO organizations (id, name, created_at) VALUES
  ('apex-research', 'apex-research', NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, org_id, email, role) VALUES
  ('ar-team-lead', 'apex-research', 'team-lead@ar.local', 'admin'),
  ('ar-agent',     'apex-research', 'agent@ar.local',     'agent')
ON CONFLICT (id) DO NOTHING;
