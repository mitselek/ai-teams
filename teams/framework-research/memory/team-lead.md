# Team-Lead Scratchpad (*FR:team-lead*)

## SESSION 21 WRAP — 2026-04-30 (#62 patch shipped, new shutdown S5 dogfooded)

**#62 from apex-research/Schliemann** filed AS REFERENCE for FR — proposed startup/shutdown collapse based on apex session 23 in-memory-survives-`/clear` failure. Volta assessed; adopted with one modification (kept R4-3 operational gate as Step 2b — verify-on-disk is independently load-bearing, not just retry-loop scaffolding).

**Empirical confirmation (n=2 cross-team):** This session's startup hit the exact failure mode. `rm -rf "$TEAM_DIR"` ran clean, then `TeamCreate` returned "Already leading team. Use TeamDelete to end..." Recovery required `TeamDelete + TeamCreate` anyway. Same pathology Schliemann reported.

**Patch committed (`426194d`):** `teams/framework-research/startup.md`
- Steps 2 (Diagnose) + 3 (rm -rf Clean) + 4 (Create + retry block) → single Step 2 (Reset team state): `TeamDelete + TeamCreate + verify`. Recovery primitive hoisted to top of every startup instead of branched into on failure.
- Step 4b (operational gate) → Step 2b. The verify-on-disk check IS the gate.
- Steps 5/6 → 3/4.
- New Step S5 (Release team leadership): `TeamDelete()` after final `git push`. Nulls in-memory state on graceful exit; next session's `/clear` startup needs no recovery.
- Gotcha #3 updated (now references Step 2 verify, was Step 4).
- New gotcha #4 documents "in-memory team-leadership state survives `/clear`".
- Old R7 Note "S5 removed because runtime is ephemeral" replaced with corrected explanation: runtime *dir* IS ephemeral; parent CLI's in-memory leadership state is NOT.

**Cross-team:** Comment posted on mitselek/ai-teams#62 (`issuecomment-4350394024`) with FR-side confirmation, commit link, evidence correction (FR retry block was n=1, not n=0 — Restart 4 hit it).

**Volta's [LEARNED] — wiki promotion criterion:** "Cross-team gotcha promotion: when one team observes a failure mode and fixes it, second-team confirmation (n=2) is the trigger to elevate from team-local doc to wiki-level pattern. Schliemann's #62 + this session's startup is the canonical pair."

**Wiki candidate held (Cal Protocol A on next spawn):** "In-memory team-leadership state survives `/clear` independently of disk" — substrate-relevant, gotcha-shaped, n=2 cross-team. Cal not spawned this session.

**This shutdown is first to use new S5** — dogfooding the patch. Next session's startup runs 5 logical steps not 8, with no in-memory recovery branch.

## NEXT SESSION — clean slate

No urgent first-action. New startup procedure should be cleaner — TeamDelete from this S5 means no in-memory recovery needed at next start.

Possible directions, rough priority:

1. **Cal spawn (when next needed for wiki work)** — route the in-memory-survives-`/clear` candidate via Protocol A.
2. **T06 path-tree rewrite (Volta)** — now ALSO scoped to fix DO-NOT-TeamDelete contradictions (T06 lines 528 + 1025) that contradict new S5.
3. **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event.
4. **Ruth-team observability gap** — only on Ruth Q2/Q3 response.

If PO arrives with direction, that takes priority.

## NEXT-SESSION-CHOREs (still active)

- [ ] **T06 Path-tree rewrite (Volta).** `topics/06-lifecycle.md` Path 1/2/2.5/3 decision tree needs rewrite for Agent-tool spawn (post-#60). Herald's `agent-spawn-protocol.md` defines the shapes each path uses; Volta's rewrite references them. T03/T06 boundary named clearly (Herald session-19 [LEARNED]): "protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when." **Session 21 addition:** also audit T06 lines 528 + 1025 for "DO NOT TeamDelete" assertions that contradict new shutdown S5 (#62 patch).
- [ ] **Cal: route in-memory-survives-`/clear` wiki candidate** (#62-derived, n=2 apex+FR) on next Cal spawn via Protocol A. Volta's session-21 [LEARNED] is the source — promotion-grade.
- [x] ~~Finn scratchpad prune (~190 lines → target 100)~~ — DONE this session, 129→98 lines, pointer block preserved.
- [ ] **Brunel: fix stale port 2224 in ruth-team container doc.** `docs/ruth-team-container-design-2026-04-15.md` has port 2224 but `deployments.md` already allocates entu-research:2224. 1-line fix, assign to Brunel on next ruth-team task.
- [ ] **Brunel: `tmux-spawn-guide.md` retirement decision** — currently banner-gated; Brunel's call on whether to delete outright. Parked DEFERRED per session 19.
- [ ] **Eratosthenes symmetric prompt edits — tmux-direct to Schliemann.** WITHDRAWN if Schliemann's apex shutdown persists. Preserved here only because the pattern (multi-mode-defenses + bootstrap-preamble-as-cross-tenant-channel wiki candidates) is substrate-independent — if revived under a new pilot, the structure carries forward.
- [ ] **Brunel n=2 watch.** Two RC-infra gotchas at n=1 watch posture: (a) `gh` not installed on RC host (only inside containers), (b) CRLF/LF reflow noise on apex-migration-research files (need `git diff -w` to evaluate "is diff substantive"). Promote to wiki on second sighting of either.

## META-LEARNINGS — carry forward

[LEARNED — session 20] **Path-depth transcription discipline on cross-pollination relays.** When relaying a structural example (path templates, code snippets, frontmatter schemas) from another team's wiki to ours, copy verbatim or include the on-disk path so the librarian can verify against source. Never paraphrase example bodies. Hit this turn: my relay of apex's `wiki-cross-link-convention` table compressed `../../../../decisions/...` (4 dots) to `../../../decisions/...` (3 dots). Cal caught it by using apex's actual on-disk values rather than trusting prose. Fix is mine, not Cal's: the protocol-A-relayer's responsibility is to transmit faithfully, not to shorten.

[LEARNED — session 20] **Multi-edit Read-before-Edit constraint requires per-message serialization.** Cal hit it 4 times today — queueing several Edits in parallel within one message only the first lands; each Edit invalidates the file's tracked-read-state. Librarian-side operational rule for now (Cal's scratchpad), n=1 librarian. If a future librarian replication or batch-wiki-edit agent hits the same shape, promotion-grade. Symmetric rule for me: when amending wiki entries via Cal, scope the request to one entry per message OR explicitly flag "serial edits expected."

[LEARNED — session 20] **`autossh -M 0` is necessary but not sufficient for Windows persistent bridges.** autossh treats child ssh exit code 127 as fatal and gives up — unrecoverable without external supervision. Pattern fix: wrap autossh itself in a retry loop (`while true; do autossh ... || true; sleep 10; done`) inside the wrapper script. Filed as wiki #46 amendment (5→6 components) same day.

[LEARNED — session 20] **Long-running Task Scheduler actions need wscript+VBS hidden launchers.** Direct invocation of bash.exe (or any console binary) under Win11 Task Scheduler with Windows Terminal as default console host opens a visible window that lingers for the action's lifetime. Filed as wiki #46 component #6.

[LEARNED — SEVERE, user-flagged, preserve verbatim] **§10 oscillation was substrate-speculation dressed as reasoning.** User's framing: *"the oscillation between you two was self-inflicted and you ran in circles, Brunel had couple of your self-corrections all the time enqueued and he again self-corrected against your self-corrections. so actually we don't have a clue about which result is correct."* The honest state: 7 revisions traded framings without either specialist doing the empirical check. Meta-discipline became a thing we performed INSTEAD of thinking. Fix: when the landing oscillates, ask *"what new evidence would settle this?"* — if the answer is "source-code read," it's outcome (c), not a reasoning problem. See wiki #44 meta-trap section.

[LEARNED] **integration-not-relay pattern (wiki #44)** — team-lead's job is integration, not relay. n=4 in one session (Tier 3 endorsement, schema-per-tenant snapshot-cite, Protocol D phantom-acceptance, §10 framing ask). Four-check discipline: walk-history-forward, pending-confirmation-vs-accepted, integration-not-relay, what-would-change-the-landing. Specialist-side complement: pre-fold consistency check (Brunel). Bidirectional integration checking.

[LEARNED] **Outcome (c) generalized definition** (Herald's sharpening): *"Outcome (c) is not 'we've thought about it enough,' it's 'we've exhausted what the current evidence can tell us and need new evidence.' The test is 'what new input would change the landing?'"* — applies across evidence types.

## STANDING DECISIONS

[DECISION — session 21] **#62 startup/shutdown patches adopted.** Steps 2/3/4 collapse to single `TeamDelete + TeamCreate + verify`; new Step S5 `TeamDelete()` after `git push`. Gotcha #3 updated, #4 added. Source: apex-research/Schliemann's #62, FR session-21 startup empirical confirmation (n=2 cross-team). T06 amendment (lines 528 + 1025 contradict new S5) batched with path-tree-rewrite chore, not new task.

[DECISION — session 20] **Cross-team wiki cross-references use GitHub URL form**, not repo-relative paths. Within our wiki, relative paths preserved (existing). For cross-team `related` frontmatter and prose links to apex/comms-dev/etc: default `https://github.com/<org>/<repo>/blob/main/<path>`; switch to `/blob/<sha>/<path>` when freezing a cross-cite is load-bearing (e.g., apex amends their entry and we want our cross-cite to remain literal to what we read). Path-depth assumptions (4-levels-deep math) hold within a team's wiki layout but break across teams' layouts. First applied on entry #50.

[DECISION — session 20] **Slow organic compliance for wiki-cross-link-convention** (entry #50), not a big-bang retrofit sweep. Apply on amendments going forward. Bare-text references in our existing 49 entries are suboptimal but not broken; Brunel's bandwidth stays on container-infra. Revisit only if a real query failure surfaces (reader can't find a referenced artifact) — that's the trigger to rethink, not aesthetics.

[DECISION — session 20] **Four single-entry frontmatter/structural experiments active under Cal's curation, all n=1, watch posture.** None promoted yet. If a second case requests the same shape, surface for hoist decision:
1. Amendment-log body section on #46 (windows-user-context-persistent-bridge)
2. `source-team` frontmatter field on #50 (wiki-cross-link-convention)
3. `provenance-closed` frontmatter field on #48 (live-inject-plus-dockerfile-bake-dual-track)
4. `amendments` frontmatter list on #50 (introduced incidentally during cross-team link form rewrite)

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

[WIP — session 21] **Cal wiki candidate held:** "in-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team (apex session 23 + FR session 21). Promotion-grade per Volta's n=2 criterion. Route on Cal's next spawn via Protocol A.

[WIP — session 20] **Three apex-research cross-pollination candidates from Finn's 2026-04-29 comparative analysis.** Status:
- ✅ `wiki-cross-link-convention` → filed as #50 with cross-team link form policy decision baked in.
- ⏸️ `adr-accepted-pending-prereqs-status` (three-state ADR flow) — parked, our ADR cadence is too light to bind on this. Revisit if we ever spin up an ADR practice.
- ⏸️ `silence-gap-helpdesk-vs-jira` (two-track prioritization) — parked, no helpdesk surface. Revisit if one materializes.

[WIP — session 20] **Brunel n=1 watch on two RC-infra gotchas.** `gh` not on RC host (only inside containers); CRLF/LF noise on apex-migration-research files (use `git diff -w` to evaluate diff substantiveness). Promote to wiki on second sighting of either. Carry forward into NEXT-SESSION-CHOREs.

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

**2026-04-30 (session 21):** #62 from apex-research/Schliemann assessed by Volta, patched, committed (`426194d`). startup.md Steps 2-4 collapse to single `TeamDelete + TeamCreate + verify`; new shutdown S5 `TeamDelete()` after `git push`. Gotcha #4 added (in-memory state survives `/clear`). Cross-team comment on #62 (`issuecomment-4350394024`) with FR-side n=2 confirmation. Wiki candidate held for Cal: "in-memory state survives `/clear`" (n=2 apex+FR). T06 amendment (lines 528 + 1025) batched with existing path-tree-rewrite chore. This shutdown is first to use new S5 — dogfooding the patch.

**2026-04-29 (session 20):** #61 validation passed empirically (Cal). Tunnel persistence work in apex-migration-research repo (3 commits + 1 PR-merge): supervisor-of-supervisor loop (`183de33`), wscript hidden launcher (`8edc230`), Chromium runtime deps Dockerfile bake (`9ddfb10`), operator env-var PR #115 merged (`049f766e`). RC clone fresh-cloned (Brunel triage). Apex-research comparative analysis (Finn) → `docs/apex-research-comparison-2026-04-29.md`. Wiki 45→50: #46 windows-bridge (5→6 amend), #47 cross-msys-argv, #48 dual-track, #49 ai-teams-sudo, #50 wiki-cross-link-convention (first cross-pollination filing). Cross-team link form policy adopted. 4 single-entry frontmatter experiments active under Cal.

**2026-04-24 (session 19):** #60 + #61 closed, xireactor dropped. #60 retired tmux-pane spawn (Herald `agent-spawn-protocol.md` v2.0.0 + Brunel cross-repo gating). #61 moved `.claude/teams/` → `teams/` (commit `7e72771`, 258 files). Wiki #45→#47: warp-dns-vs-routing-asymmetry-rc-host (#46), rc-host-db-tunnel-architecture (#47, first `references/` entry). Cross-team unblock: apex-research DB tunnel via reverse SSH from Windows operator (script `c79b838` in apex repo).

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
