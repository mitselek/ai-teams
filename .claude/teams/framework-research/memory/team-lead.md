# Team-Lead Scratchpad (*FR:team-lead*)

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
