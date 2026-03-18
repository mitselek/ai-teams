# Team-Lead Scratchpad (*FR:team-lead*)

## Session: 2026-03-17/18 (R8)

[CHECKPOINT] R8 startup: CLEAN (normal). 7 inboxes restored. config.json appeared immediately.
[CHECKPOINT] R8 agents spawned: celes, finn, volta, herald, brunel, montesquieu (new hire).

### Aeneas persona refinement
[DECISION] Celes polished Aeneas lore: "continuous evolution, not arrival." Anchises/Ascanius metaphor, "conditions for civilization" framing. Committed.
[DECISION] Prompt renamed team-lead.md → aeneas.md, duplicate team-lead-aeneas.md deleted.
[DECISION] roster.ts moved from .claude/teams/types/ to .claude/teams/, nickname field added to AgentLore interface.

### Agent naming research (Finn)
[DECISION] Keep name: "team-lead" for routing, persona in lore/prompt. Frameworks overwhelmingly favor role-based routing names.
[DECISION] GitHub issue #11 created for multi-team persona-based routing (future).

### apex-research team — designed and deployed
[DECISION] 5-agent team: Schliemann (TL/opus), Champollion (research/sonnet), Nightingale (analyst/sonnet), Berners-Lee (dashboard/sonnet), Hammurabi (specs/opus). No Medici — audits remotely from FR.
[DECISION] Dashboard-first approach: SvelteKit + TailwindCSS, API-based, local dev server.
[DECISION] Container: self-contained, no host bind mounts, 3 named volumes, network_mode: host (WARP).
[DECISION] Cluster-based specs (not per-app) for apps sharing >3 tables.
[DECISION] Spec status validated against TypeScript interface from YAML frontmatter.
[DECISION] Deployed on RC server (dev@100.96.54.170), container running, SSH on port 2222.
[LEARNED] WARP tunnel causes: Docker DNS failure, TLS interception, env vars not reaching sudo su shells.
[LEARNED] Brunel's deployment runbook captures 11 gotchas for future container deployments.
[CHECKPOINT] Apex team delivered in first day: 80 commits, 202K+ lines, 11 cluster specs, all 57 apps analyzed, dashboard with 7 views, migration readiness report.

### Montesquieu — new hire (Governance Architect)
[DECISION] Montesquieu hired for T04 (Hierarchy & Governance). Opus tier. Nick: "Monte". Color: white.
[DECISION] Phase 1 approved and delivered: 39-decision delegation matrix, 5 apex-research governance questions answered.
[DECISION] Phase 2 approved and delivered: manager agent role formalized, PO-to-manager handoff protocol, emergency authority protocol.
[LEARNED] Monte found the five-layer governance stack already existed de facto — just needed naming and codification.

### comms-dev roster completion
[DECISION] Marconi persona for comms-dev team-lead (Celes designed). Prompt renamed team-lead.md → marconi.md.
[DECISION] Lovelace added to comms-dev roster (was in prompts/ but missing from roster.json).

### Topic fan-out (R8)
[CHECKPOINT] T01 (Celes): 83 → 450 lines. Team archetypes, role taxonomy, model tiering, sizing.
[CHECKPOINT] T04 (Monte): 103 → ~640 lines. Delegation matrix, manager agent design, emergency authority.
[CHECKPOINT] T05 (Herald): 76 → 481 lines. 4-layer auth, credential passing, secrets management.
[CHECKPOINT] T08 (Volta): 113 → 290 lines. 3-layer observability, Medici formalization, alerting.
[CHECKPOINT] T03 (Herald): dispute handoff type + direct link lifecycle added.
[DEFERRED] T07 (Safety & Guardrails) — only light topic remaining at 121 lines.

### Container infrastructure
[LEARNED] Brunel produced deployment runbook: 11 gotchas from WARP/Docker deployment.
[LEARNED] tmux -u needed for UTF-8 rendering inside container.
[LEARNED] Compose env vars don't reach shells via sudo su — must persist to .bashrc.
[LEARNED] Locked user accounts (!) block all SSH auth including pubkey — use usermod -p '*'.
[LEARNED] OAuth credentials (.credentials.json) instead of API key on RC server.
[LEARNED] Project-level .mcp.json solved MCP server discovery (global mcp.json HOME path issue).

### IT ticket
[CHECKPOINT] IT ticket submitted 2026-03-17 for dedicated apex-research server (Ubuntu 24.04, 200GB SSD, Docker). Requested deadline 2026-04-01. SSH key: ~/.ssh/id_ed25519_apex, username: michelek.

## Previous session notes (R5–R7)
- R5 Grade B (best ever). Inbox durability validated.
- R6: relay RFC (#7), web frontend RFC (#8), Richelieu manager-agent (#10), Lovelace hire.
- R7: simplified startup protocol, removed COLD START anomaly.
