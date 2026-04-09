# Team-Lead Scratchpad (*FR:team-lead*)

## Session: 2026-04-09 — Post-crash respawn pattern

[LEARNED] **Agent-tool respawn pattern for in-process teams.** The framework-research team is in-process (not tmux panes). After a team crash where the runtime dir (`~/.claude/teams/framework-research/`) is preserved, dormant agent entries in `config.json` persist and BLOCK name reuse. Spawning `name: "celes"` with a dormant `celes` entry present creates `celes-2` (and every subsequent spawn becomes `celes-N`).

[PATTERN] **hr-devs respawn adapted for in-process (no tmux).** Reference: `hr-platform/conversations/.claude/commands/respawn.md`. Hr-devs uses tmux; we translate:

1. **Shutdown** — SendMessage `{type: shutdown_request}` to the running instance (in-process equivalent of `/exit`). Wait for `teammate_terminated` (NOT `shutdown_approved` alone).
2. **jq remove from config.json** — the critical step. Delete BOTH any `-N` suffix entries AND the dormant original:
   ```bash
   jq 'del(.members[] | select(.name == "celes" or .name == "celes-2"))' ~/.claude/teams/framework-research/config.json > /tmp/new.json && mv /tmp/new.json ~/.claude/teams/framework-research/config.json
   ```
3. **Spawn via Agent tool** — `subagent_type: "general-purpose"`, `team_name: "framework-research"`, `name: "celes"`, `run_in_background: true`. The `name` parameter is critical — without it, the spawn is anonymous and lacks SendMessage tool access.

[LEARNED] **Tradeoff: identity metadata is lost.** The dormant entry holds the original purple color, roster-backed task prompt, model tier (`opus[1m]`), and correct `cwd`. Removing it via jq drops all of that. The Agent-tool spawn creates a minimal entry: `color: red`, `agentType: general-purpose`, `model: claude-opus-4-6` (no `[1m]` suffix), `cwd` points to workspace root instead of repo root. **All cosmetic/navigational — none block functionality.** Celes could still read files, run git commands, SendMessage, and do work with the degraded entry.

[LEARNED] **Agent-tool spawn does NOT read `roster.json`.** The `framework-research-startup` skill + `TeamCreate` is the "correct" mechanism that loads full roster identity. Agent-tool spawn is the lightweight path — produces functional agents, loses visual identity. Future: consider full skill-based respawn for visibility, but until then, accept the cosmetic loss.

[LEARNED] **Background always-running agents that were anonymous (no `name` parameter) have no SendMessage tool.** They can only deliver via task-output channel. Use `name` parameter in Agent tool every time — it promotes the spawn to a proper team member with messaging access.

[LEARNED] **`shutdown_approved` is NOT sufficient.** Always wait for `teammate_terminated` before jq-editing config.json. Early editing while the agent is mid-shutdown could create race conditions.

[LEARNED] **config.json backup before edit is cheap insurance.** Copy to `/tmp/config-backup-$(date +%s).json` before every jq mutation.

[DECISION] **Save this pattern in team-lead scratchpad until framework-research has a Librarian/Oracle.** Once the Oracle role is filled (T09 v2.2 spec exists but no team has one yet), this knowledge should be submitted as a `[PATTERN]` Knowledge Submission and live in the team wiki instead of a single scratchpad.

[WIP] Celes is respawned and idle as `celes@framework-research` with `color: red`. Monte and Volta still dormant in config.json — same pattern will apply when we respawn them. PO is validating the respawn flow before continuing.

---

## Session: 2026-03-19 (R10)

[CHECKPOINT] R10 startup: CLEAN. 12 inboxes restored. config.json immediate. 6 agents spawned (all except medici).

### Apex discussion #45 — Q&A + agent status patterns
[DECISION] Posted FR response to apex-migration-research discussion #45. Finn (patterns) + Herald (protocol) researched.
[DECISION] Apex is first team to build dashboard Q&A page — no cross-team precedent exists.
[DECISION] Herald identified new Protocol 6: External Stakeholder Q&A — to be codified in T03.
[DECISION] Finn found `dev-toolkit/agent-dashboard/` (built by Sven) — full monitoring with SVG arc context gauges, SSE, tmux integration. PO confirmed hr-devs have this live.
[LEARNED] "Context gauges" = Claude Code terminal statusline (polyphony) + SVG arc gauges in agent-dashboard (hr-devs). Two different implementations at different layers.
[WIP] PO asked hr-devs to share their context gauge knowhow directly on discussion #45.

### Per-team GitHub identity — plan saved
[DECISION] Monte + Herald analyzed per-team GitHub accounts. Both recommend moving from shared `mitselek` account.
[DECISION] Monte recommended GitHub Apps (one per team). Herald recommended machine user accounts (simpler operationally).
[DECISION] Key disagreement: Apps have auto-rotating tokens but need refresh sidecar infra. Machine users work today with zero new infra.
[DECISION] Plan saved as mitselek/ai-teams discussion #12: "Per-team GitHub identity: machine users now, GitHub Apps later."
[LEARNED] GitHub Apps: one installation per org limitation. Can't install same App per-team on one org — need separate Apps per team.
[LEARNED] GitHub Apps: no SSH git, 1-hour token expiry, `gh` CLI needs wrapper scripts. Machine users: native compatibility everywhere.

### Settings fix
[DECISION] Added `Bash(cd:*)` to user settings allow list — stops repeated prompts for `cd && git` compound commands. Takes effect next session.

### Monte naming
[DECISION] Spawned as "monte" (matching roster.json). No naming issues this session.

### Repo syncs
[DECISION] apex-migration-research: `git reset --hard origin/main` to resolve 50+ conflicts (apex team's work is authoritative).
[DECISION] hr-platform: pulled 49 files including full hr-devs team config (roster, prompts, memory, layouts, Eilama daemon).

## Idle agents at checkpoint
- finn, celes, volta, herald, brunel, monte — all idle, available

## Previous session notes (R5–R9)
- R5 Grade B (best ever). Inbox durability validated.
- R6: relay RFC (#7), web frontend RFC (#8), Richelieu manager-agent (#10), Lovelace hire.
- R7: simplified startup protocol, removed COLD START anomaly.
- R8: apex-research designed+deployed, Monte hired, T01/T04/T05/T08 expanded, comms-dev roster.
- R9: apex RFC #3 response, polyphony-dev deployed, T07 rewritten (662 lines), apex S8 audit, settings standardization.
