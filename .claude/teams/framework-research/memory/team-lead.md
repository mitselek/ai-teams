# Team-Lead Scratchpad (*FR:team-lead*)

## Session: 2026-03-19 (R9)

[CHECKPOINT] R9 startup: CLEAN. 10 inboxes restored. config.json immediate. All 7 agents spawned.

### Apex-research RFC #3 response
[DECISION] Posted comprehensive workflow guidance to Eesti-Raudtee/apex-migration-research#3. 7 specialists contributed.
[DECISION] Recommended: trunk-based + CI, TDD pair (Nightingale as RED), hybrid issues, frontmatter-authoritative spec lifecycle.
[LEARNED] Apex pushed back on worktree isolation — pipeline teams need directory ownership on trunk, not branch isolation. Field-validated pattern.

### New framework patterns (from apex pushback)
[DECISION] Pipeline vs independent-output isolation: two archetypes, two strategies. Written into T01 (Celes), T03 Protocol 5 (Herald), T06 (Volta).
[DECISION] T07 Safety & Guardrails rewritten by Monte + Finn: 121 → 662 lines. Permission architecture, 5-layer enforcement, circuit breakers, authority quick-reference template.

### Polyphony-dev team designed and deployed
[DECISION] Full team redesign: 8 agents with music-themed lore (Palestrina TL, Byrd, Josquin, Tallis, Bentham, Comenius, Victoria, Finn).
[DECISION] TL upgraded sonnet → opus. Polly renamed Victoria (requirements analyst, not PO). Arvo renamed Bentham (avoid Arvo Pärt confusion).
[DECISION] Standard directory structure: .claude/teams/polyphony-dev/ with roster.json, prompts/, memory/, inboxes/, docs/.
[DECISION] Container deployed on RC server (dev@100.96.54.170): port 2223 SSH, auto-tmux, dedicated key pair (id_ed25519_polyphony).
[LEARNED] WARP gotchas: network:host for build AND runtime, NODE_EXTRA_CA_CERTS for Claude, Playwright cache at /home/ai-teams/ not /root/.
[LEARNED] Runbook now 13 gotchas (§12 NODE_EXTRA_CA_CERTS, §13 statusline setup).

### Apex S8 audit
[DECISION] Full audit posted to Discussion #42. Data durability was the cross-cutting finding (6 artifacts missing from git). Re-audited after push — all resolved. Quality is high.
[DECISION] Monte approved their review methodology scoring (with blocking flag recommendation). ADR-008 rated excellent (regulatory compliance finding).

### Settings standardization
[DECISION] All 3 environments switched from bypassPermissions to default mode with broad allow-list: local machine, polyphony container, apex container.
[DECISION] Statusline created for polyphony container.

### Timezone fix
[DECISION] Apex container fixed to Europe/Tallinn (live + committed). Polyphony baked in from start.

### Monte naming mismatch
[GOTCHA] Monte registered as "monte" but Finn sent to "montesquieu" — messages landed in wrong inbox. Fix for next session: spawn as "montesquieu" or standardize.

## Previous session notes (R5–R8)
- R5 Grade B (best ever). Inbox durability validated.
- R6: relay RFC (#7), web frontend RFC (#8), Richelieu manager-agent (#10), Lovelace hire.
- R7: simplified startup protocol, removed COLD START anomaly.
- R8: apex-research designed+deployed, Monte hired, T01/T04/T05/T08 expanded, comms-dev roster.
