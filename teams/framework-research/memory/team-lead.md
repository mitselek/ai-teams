# Team-Lead Scratchpad (*FR:team-lead*)

## SESSION 19 WRAP — 2026-04-24 (issues #60 + #61 closed, xireactor dropped)

**Closed this session:**

- **#60 — Retire tmux-pane spawn.** Shipped framework-level `docs/agent-spawn-protocol.md` v2.0.0 (Herald, renamed from `subagent-fallback-protocol.md`; commit `8397ee9` → `4a63b90`). Brunel Task A: 5× `spawn_member.sh` copies gated with hard `exit 1` + deprecation header; `tmux-spawn-guide.md` banner; container Dockerfiles/entrypoints annotate tmux as human-SSH scaffolding only (commit `49bdedc`). `startup.md`/`SKILL.md` audited — no edits needed. Cross-repo `aliases.sh` rewrite handed to Schliemann via issue-comment (apex-research winding down).
- **#61 — Move `.claude/teams/` → `teams/` at repo root.** Single commit `7e72771`: 258 files changed (168 content rewrites + 90 pure moves). Runtime paths (`$HOME/.claude/teams/`, `~/.claude/teams/`, `/home/*/.claude/teams/`) preserved intact; only repo-relative refs rewritten. Same move applied to `designs/deployed/apex-research/teams/` and `designs/new/hr-devs/teams/` (scaffold consistency). Cross-repo handoff for apex via issue-comment with the exact Python contextual-replace script. Auto-memory + external skills updated: `framework-research-startup/SKILL.md` Step 1 pointer, `shutdown-agent-tool-team/SKILL.md` template (no fallback — single source of truth), `MEMORY.md`, `project_ai_teams_framework.md`, `project_celes_agent_hr.md`, `project_prod_llm_server.md`.

**Root-cause update on #60.** Post-ship we identified the session-17 crash class as a **Claude Code + tmux interaction bug**, not a general tmux problem. Agent-tool spawn still preferable for lifecycle reasons but crash-prevention urgency is gone. Note retained on #60 close comment.

**xireactor direction DROPPED entirely by PO (2026-04-24).** Orphaned infra removed in commit `6923a12` (`containers/xireactor-pilot/` — 15 files). Preserved as institutional record: 5 specialist design docs in `docs/xireactor-*-2026-04-15.md` + 1 memory state file + 4 wiki patterns that generalized beyond xireactor (`substrate-invariant-mismatch`, `integration-not-relay`, `bootstrap-preamble-as-in-band-signal-channel`, `governance-staging-for-agent-writes`). All prior NEXT-SESSION items tied to xireactor (pilot thesis reshape, PO-BRIEF 6 items, Cal §11.5 edits, Finn source walkthrough, §10 natural-experiment) are WITHDRAWN.

**Wiki adds this session:**
- `wiki/gotchas/warp-dns-vs-routing-asymmetry-rc-host.md` (#46, Cal)
- `wiki/references/rc-host-db-tunnel-architecture.md` (#47, first `references/` entry, TTL 2026-10-24)

**Cross-team unblock:** apex-research DB access via reverse SSH from Windows operator → RC host loopback → apex container. Script at `apex-migration-research/.claude/bin/open-db-tunnels.sh` (commit `c79b838` in that repo). Operator-run, session-bounded. `entrypoint-apex.sh` WARN on tunnel down (commit `24cca0d`).

## NEXT SESSION — validation priority

**FIRST ACTION on restart: validate the #61 refactoring.** The skill → startup → team spawn chain must work end-to-end with all paths pointing to `teams/framework-research/`. If anything references `.claude/teams/framework-research/` and fails, it's a miss from this session's rewrite sweep and needs to be caught immediately.

Validation checklist:

1. `framework-research-startup` skill triggers and reads `~/Documents/github/mitselek-ai-teams/teams/framework-research/startup.md` cleanly.
2. `startup.md` Steps 1–5 execute without path errors — especially `restore-inboxes.sh` / `persist-inboxes.sh` (repo-side, moved) and `TeamCreate` (runtime-side, unchanged).
3. Spawn at least one agent (Cal recommended — smallest surface, no xireactor tail). Verify:
   - Prompt reads from `teams/framework-research/prompts/callimachus.md` ✓
   - Scratchpad read from `teams/framework-research/memory/callimachus.md` ✓
   - Inbox restore from `teams/framework-research/inboxes/callimachus.json` → `$HOME/.claude/teams/framework-research/inboxes/` ✓
4. Confirm Cal can write to `teams/framework-research/wiki/**` with **no permission prompt** — this is the empirical verification that #61 solved the root problem.

If any step fails: grep `.claude/teams/` in the affected surface, patch, recommit.

## NEXT-SESSION-CHOREs (non-xireactor, still active)

- [ ] **T06 Path-tree rewrite (Volta).** `topics/06-lifecycle.md` Path 1/2/2.5/3 decision tree needs rewrite for Agent-tool spawn (post-#60). Herald's `agent-spawn-protocol.md` defines the shapes each path uses; Volta's rewrite references them. T03/T06 boundary named clearly (Herald session-19 [LEARNED]): "protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when."
- [ ] **Finn scratchpad prune** at spawn (~190 lines → target 100). Session-8 uikit-dev harvest entries collapse to pointer to `docs/uikit-dev-harvest-2026-04-14.md`.
- [ ] **Brunel: fix stale port 2224 in ruth-team container doc.** `docs/ruth-team-container-design-2026-04-15.md` has port 2224 but `deployments.md` already allocates entu-research:2224. 1-line fix, assign to Brunel on next ruth-team task.
- [ ] **Brunel: `tmux-spawn-guide.md` retirement decision** — currently banner-gated; Brunel's call on whether to delete outright. Parked DEFERRED per session 19.
- [ ] **Eratosthenes symmetric prompt edits — tmux-direct to Schliemann.** WITHDRAWN if Schliemann's apex shutdown persists. Preserved here only because the pattern (multi-mode-defenses + bootstrap-preamble-as-cross-tenant-channel wiki candidates) is substrate-independent — if revived under a new pilot, the structure carries forward.

## META-LEARNINGS — carry forward

[LEARNED — SEVERE, user-flagged, preserve verbatim] **§10 oscillation was substrate-speculation dressed as reasoning.** User's framing: *"the oscillation between you two was self-inflicted and you ran in circles, Brunel had couple of your self-corrections all the time enqueued and he again self-corrected against your self-corrections. so actually we don't have a clue about which result is correct."* The honest state: 7 revisions traded framings without either specialist doing the empirical check. Meta-discipline became a thing we performed INSTEAD of thinking. Fix: when the landing oscillates, ask *"what new evidence would settle this?"* — if the answer is "source-code read," it's outcome (c), not a reasoning problem. See wiki #44 meta-trap section.

[LEARNED] **integration-not-relay pattern (wiki #44)** — team-lead's job is integration, not relay. n=4 in one session (Tier 3 endorsement, schema-per-tenant snapshot-cite, Protocol D phantom-acceptance, §10 framing ask). Four-check discipline: walk-history-forward, pending-confirmation-vs-accepted, integration-not-relay, what-would-change-the-landing. Specialist-side complement: pre-fold consistency check (Brunel). Bidirectional integration checking.

[LEARNED] **Outcome (c) generalized definition** (Herald's sharpening): *"Outcome (c) is not 'we've thought about it enough,' it's 'we've exhausted what the current evidence can tell us and need new evidence.' The test is 'what new input would change the landing?'"* — applies across evidence types.

## STANDING DECISIONS

[DECISION] **xireactor-as-shared-KB (#59) parked standalone.** Counter-option preserved: Finn-style quarterly cross-team harvest passes (same info flow, markdown preserved). Pilot-eval proposal: 2 tenants (FR + apex-research) for 1 month cross-team traffic. Fits E-deployment pattern. Full team needed for ecosystem-integration session.

[DECISION] **E-deployment pattern** (CF Tunnel / hello-world-container) adopted as future target for ALL team deployments including migration. Near-term ruth-team = (B) co-located on `100.96.54.170`. Migration B→E is explicit future work — no dates. Ruth-team container MUST be portable.

[DECISION] **Sensitivity boundary** for ruth-team: `.gitignore` excludes `teams/*/sensitive/`. Patterns flow via Protocol A but generalize heavily — no direct quotes, no Jira tickets, Confluence titles, budget figures, or colleague names. Codename `ruth-team` acceptable inside FR only.

[DECISION] **Ruth-team: Brunel v1.0 accepted** at `docs/ruth-team-container-design-2026-04-15.md`. Build blocked on Monte §4.3 + Herald §5.3 open questions. Near-term channel = SSH + tmux pane.

[DECISION] **Protocol D naming ACCEPTED.** Herald v1.2.1 rename pass next session: (i) §2.2 introduce Protocol D, (ii) §5 mapping + §7 cross-refs, (iii) frontmatter note citing Monte Argument 1 (canonical taxonomy slot), (iv) `types/t09-protocols.ts` interface comments.

[DECISION] **Herald Q1/Q2 preconditions at outcome (c)/(c).** Both digest-silent, resolve via Finn source-code walkthrough only. Monte v3 §7.2 reclassification needs rework (built on retracted Herald v1.1 §A evidence). Compressed state: two design preconditions are empirical questions not yet answered; pilot-readiness honest-story = "two source-code walkthroughs + one deliverable."

## OPEN DESIGN QUESTIONS

- Cross-tenant URGENT-KNOWLEDGE routing authority (Monte/Herald future pass)
- MCP tool availability fallback: fail-closed (team-lead + Herald + Cal converged)
- §9.2 design probes: Tier 3 bounce-vs-escalate rejection format, structured-vs-free-text

## ACTIVE WIP

[WIP] **Persist-coverage F/D split** (PO-approved 2026-04-14). Fix session: F1 jq filter extraction (Volta), F2 "memory"→"auto-memory" rename (Volta+Cal). Design session: D1-D7 full persist-coverage ship. Sources: `docs/persist-coverage-audit-2026-04-14.md` + `docs/uikit-dev-harvest-2026-04-14.md`.

[WIP] **Structural-discipline cluster Protocol C promotion.** 4 confirmed + 1 pending (Brunel's prompt-to-artifact cross-verification). Defer to session with Brunel spawned.

[WIP] **Cal wiki queue — 12 n=1 candidates held.** Full list in `memory/callimachus.md` session 14 [DECISION] block. Highest-watch: multi-mode-failure-multi-mechanism-defenses (possible n=2 with Volta's persist/restore), Bootstrap-preamble as cross-tenant channel (n=2 with existing #43, possible amendment not separate entry).

[WIP] **Cal post-freeze candidates from Finn harvest:** (1) Pane-labels gotcha addendum (root-cause confirmation, not n=2), (2) Memory-as-load-gated-surface pattern, (3) Wiki governance model split (project-handbook vs methodology-kb).

[WIP] **Aalto open questions** — 6 questions deferred (Finn Section D). Priority: Q1+Q4 highest (scaling evidence), Q6+Q3 medium, Q2+Q5 lower. Route subset via tmux-direct when next uikit-dev contact warranted.

[WIP] **Ruth-team observability gap.** Brunel's v1.0 is purely operational; dual-track (operational + research probe) needs Volta's §6.5 observability addendum. Gated on Ruth's Q2/Q3 answers — her answer reshapes telemetry surface ("weekly digest" ≠ "live interaction"). Do NOT wake Volta before Ruth responds.

[WIP] **Ruth-team: path (a) partial state.** Ruth received Teams relay, responded with one clarifier ("what is OKR?"), operator answered. Q1 (opt-in), Q2, Q3 still pending. Do NOT wake Celes/Volta speculatively — only after Q1 answer arrives.

## DEFERRED

- **Phase 2 Jira/GitFlow classification** — held pending PO reconciliation via dev-toolkit#43.
- **Discussion #56 actionable items:** Provider outage protocol (Monte, T04); Sidecar/peer framework (Brunel+Monte, T06); Contract enforcement (Herald); Platform/provider separation (Finn, T02).
- **Pass 2 filename rename** for `wiki/gotchas/persist-project-state-leaks-per-user-memory.md` — Cal inventoried 7 back-refs; ship as coordinated batch when warranted.
- **uikit-dev cross-team debt** — their `1deb90e` uses defective free-string jq pattern. Tmux-direct relay to Aalto deferred; bundle with Finn Section D questions.
- **MS Teams integration** (#57) + **Anthropic `/routines`** (#58) — ecosystem-integration bundle.
- **Timestamping convention** — promote to T03 + investigate cheaper implementation (auto-injection vs cached timestamp).
- **Team-lead prompt revision** — Celes design round (coordinator-only-by-conviction identity makes mechanical fix unsafe).
- **12-prompt broader scope-block audit** — Celes offered ~1h pass; not started.
- **Finn model inventory re-survey** (uikit-dev missing from baseline).
- **Celes assessment of Cal's first-day performance** (carried).

## CARRYOVERS

[DECISION] **Bioforge-dev team:** 4-character Cathedral-lite — Humboldt (TL/opus), Merian (RED/sonnet), Linnaeus (GREEN/sonnet), Cuvier (PURPLE/opus). Designed by Celes.
[DECISION] **"Cathedral-lite"** = Cathedral tier with ARCHITECT merged into team-lead. Valid for single-repo, single-language, single-pipeline projects.

## SESSION HISTORY (compressed)

**2026-04-15 late-eve:** Xireactor pilot design pass. 4 agents (Brunel+Monte+Herald+Cal). 4 design docs shipped. Three-specialist convergence on asymmetric cross-tenant-only shape. Wiki 43→45 (#44 integration-not-relay at n=6+, #45 substrate-invariant-mismatch at n=3). Protocol D naming accepted. Frozen design state at `memory/xireactor-pilot-design-state-2026-04-15.md`.

**2026-04-15 afternoon:** Ruth-team genesis. Brunel v1.0 accepted. #57+#58 filed. Sensitivity boundary adopted. Ruth relay sent via Teams. Key LEARNEDs: thin-digital-footprint ≠ low-output, implicit-cross-team-contracts, sensitivity-boundary-via-gitignore.

**2026-04-14 eve + 2026-04-15 morning:** Jira/GitFlow assessment. Wiki 38→39 (#39 scope-block-drift). dev-toolkit#43 issue filed. Finn+Brunel prompts fixed by Celes. Team-lead prompt revision deferred.

**2026-04-14 midday:** Cleanup + Volta audit + Finn uikit-dev harvest. Wiki 37→38. Persist-coverage F/D split. [WARNING] team-lead coordinator-only discipline slipped pre-spawn — spawn-before-act even for cheap one-offs.

**2026-04-13 afternoon:** Oracle→Librarian Phase 1+2. Wiki 20→28. Commits `04522c7`+`ca0e56f`. Eratosthenes v2.7.1 live on apex-research. Phase 2 directive tmux-direct to Schliemann.

**Prior (2026-04-09 through 2026-04-10):** Cal bootstrap, raamatukoi-dev designed+deployed, bioforge-dev Cathedral-lite roster, Discussion #56 (wiki 4→20).

## SCRATCHPAD HYGIENE (adopted 2026-04-16 on Cal's advisory)

1. **Active vs frozen:** frozen design state → sibling archive files; scratchpad = active state only.
2. **Strike-through vN-1:** when specialist ships vN, strike prior vN-1 refs in-place rather than appending both.
3. **Wiki-candidate routing collapses sources:** when sending candidate to Cal at n=X, collapse source instances in scratchpad in same batch.
4. **[DECISION] vs [LEARNED] retention:** DECISIONs stay (standing rules). LEARNEDs collapse after wiki promotion.
5. **CHOREs top-of-file:** all NEXT-SESSION-CHOREs in dedicated block under NEXT SESSION, not buried inline.
6. **Tree-form tags, not session-log prose:** `[TAG] claim + why + applies-to-future`, not "and then we did X."
7. **2-session staleness check on n=1 wiki candidates:** if LEARNED hasn't reached promotion in 2 sessions, re-evaluate pattern reality.
