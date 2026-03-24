# Brunel scratchpad

## KEY GOTCHAS (carry forward — all containers)

[GOTCHA] WARP TLS interception: network_mode:host + NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem + system CA (update-ca-certificates). Mount WARP CA at /opt/warp-ca.pem (not /etc/ssl/certs/).

[GOTCHA] Named volumes created as root → chown 1000:1000 in entrypoint Step 1. Also: ~/.npm, ~/.config/.wrangler/logs need explicit mkdir+chown.

[GOTCHA] clone_or_pull cwd: after rm -rf target_dir, gosu inherits deleted cwd. Fix: (cd / && gosu git clone ...).

[GOTCHA] SSH: useradd creates locked account. Fix: usermod -p '*' for pubkey auth. Multi-key: SSH_PUBLIC_KEY, SSH_PUBLIC_KEY_2, etc. in .env.

[GOTCHA] tmux split-window -p fails from subprocess. Fix: use -l <absolute> instead.

[GOTCHA] entrypoint SSH key install: writes authorized_keys from env vars on EVERY start. .ssh/ is NOT in a named volume — recreated each run. .env must have all keys (SSH_PUBLIC_KEY + SSH_PUBLIC_KEY_2) before container starts.

[GOTCHA] rc-connect.ps1 uses id_ed25519_apex for PROD-LLM containers. Must be in SSH_PUBLIC_KEY_2 in .env.

[PATTERN] settings.json statusLine: `"command": "bash /home/ai-teams/statusline-command.sh"` — baked script, not workspace path.

[PATTERN] Env var persistence: sed -i delete+append to .bashrc in entrypoint. Covers SSH/interactive shells.

## PROD-LLM CONTAINERS (as of 2026-03-24)

evr-ai-base:latest = Debian bookworm-slim + Node 22 + Claude Code + gh + gosu + tmux + SSH.
All containers: network_mode:host, HTTPS_PROXY=http://localhost:3128, WARP CA at /opt/warp-ca.pem.
SSH via ProxyJump: `ssh -i ~/.ssh/id_ed25519_apex -o "ProxyCommand=ssh -i ~/.ssh/id_ed25519_apex -W %h:%p michelek@10.100.136.162" -p <PORT> ai-teams@localhost`

| Team | Port | Image | Status |
|---|---|---|---|
| apex-research | 2222 | apex-research-claude | Running, OAuth done |
| entu-research | 2224 | entu-research-claude | Running |
| hr-devs | 2225 | hr-devs-claude | Running, OAuth pending |

## hr-devs CONTAINER (VJS2-AI-teams main)

[CHECKPOINT] 2026-03-24 — hr-devs deployed to PROD-LLM (10.100.136.162):

- Roster: team-lead (opus), sven, marcus (opus), finn, tess, arvo, dag (sonnet) — 7 members
- Layout: 7-pane full-review (apply-layout.sh baked at /home/ai-teams/)
- Dynamics: named volume hr-dynamics (6 JSON files populated via docker cp)
- team-config baked at /home/ai-teams/team-config/; installed to ~/workspace/hr-platform/.claude/teams/hr-devs/ by entrypoint
- CLAUDE.md baked at /home/ai-teams/CLAUDE.md; installed to conversations/ by entrypoint
- MCP: Jira + Dynamics (mcp.json written with credentials)
- OAuth: NOT done — PO step
- VJS2 repo: infrastructure/dockerfiles/hr-devs/ — committed (d91bcde on main)

[CHECKPOINT] 2026-03-24 — Audit fixes applied to BOTH bare-metal RC + PROD-LLM container + VJS2:
- team-lead.md: Hard-Won Rules section (4 incident-backed rules)
- common-prompt.md: 4 Known Pitfalls + spawn_member.sh rule + ~/workspace/ paths
- arvo.md, marcus.md: step 7 wording + dashboard path fixes
- Scratchpads (7 agents) migrated RC→PROD-LLM container (pruned per Medici notes)

## VJS2-AI-teams REPO

Canonical infra source: `C:/Users/mihkel.putrinsh/Documents/github/VJS2-AI-teams/`
- `infrastructure/dockerfiles/<team>/` — Dockerfile, entrypoint, scripts, CLAUDE.md, team-config
- `infrastructure/docker-compose/<team>/` — compose file, .env (gitignored)
- Build on PROD-LLM: `docker compose -f docker-compose.<team>.yml build --no-cache`
- .env NOT in git — SCP manually before each deploy

## DEFERRED

[DEFERRED] OAuth on hr-devs PROD-LLM container — PO manual step.
[DEFERRED] Dynamics data refresh on hr-devs (hr-dynamics volume has 6 files from docker cp — may need refresh from source).
