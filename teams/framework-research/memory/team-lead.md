# Team-Lead Scratchpad (*FR:team-lead*)

## SESSION 20 WRAP — 2026-04-29 (#61 validated, tunnel persistence shipped, apex-research comparison)

**#61 validation passed empirically.** Cal spawned cleanly, all four path checks green, wiki write with no permission prompt confirmed end-to-end. Validation block from session 19 fully discharged. The `.claude/teams/` → `teams/` refactor is verified as operationally portable.

**Tunnel persistence work (apex-migration-research repo, not this one):**

Three commits hardened the operator-side reverse SSH tunnel from Windows machine → RC host loopback → apex container (Oracle DEV/TEST DB access on `127.0.0.1:11521/11522`):
- `183de33` — wrapper now loops autossh (`while true; ... sleep 10`); autossh's special-case fatal-exit-on-127 took the bridge silently down at 02:04 with no scheduler trigger to revive it. Supervisor-of-supervisor pattern.
- `8edc230` — wscript+VBS hidden launcher replaces direct bash invocation in the Task Scheduler action; the supervisor loop kept a Windows Terminal window alive forever.
- `9ddfb10` — Chromium runtime deps baked into `Dockerfile.apex` (live-injected via `docker exec -u root` first, no container restart, agent sessions preserved).
- `049f766e` — PR #115 merged: 2 container-internal env vars (`TERM=xterm-256color`, `CLAUDE_CODE_NO_FLICKER=1`) preserved from RC operator tinkering.

**RC clone of apex-migration-research was diverged 13 ahead / 469 behind with three uncommitted operator edits.** Brunel triaged read-only: 12 of 13 ahead were stale-SHA versions of work already on origin (rebased upstream); 1 was truly local (cloudflared sidecar — operator already reverting it). Fresh-clone executed; stale clone preserved at `/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29`. Two operator env vars promoted via PR; three other ad-hoc edits discarded.

**Apex-research comparative analysis delivered** (Finn): `docs/apex-research-comparison-2026-04-29.md`. Two findings:
- Path migration adoption: apex did #61 in one commit (`239e35e`, 2026-04-27) explicitly citing our SHA `7e72771`. 20 files vs our 168. Zero stale paths. Bidirectional flow confirmed: their 2026-04-13 dual-team-dir incident produced our `gotchas/dual-team-dir-ambiguity.md`; our #61 produced their later relocation commit.
- Wiki state: apex 64 entries vs our 47. Eratosthenes did NOT evolve `process/`/`observations/`/`findings/` subdirs (different domain). Only 1 true cross-team co-discovery (already cross-cited). Apex pipeline intrinsically multi-agent → 28% multi-agent corroboration vs our 15%; our outliers are denser (two n=5 patterns).

**Wiki: 45 → 50 entries this session (+5, plus 1 amendment).**

| # | Title | Type | Filer | Notes |
|---|---|---|---|---|
| #46 | windows-user-context-persistent-bridge | pattern | Cal | filed 5-component, **amended same-day to 6-component** when supervisor-loop + hidden-launcher refinements landed; first wiki entry to receive a structural amendment under Cal's shift |
| #47 | cross-msys-argv-mangling | gotcha | Cal | high confidence on failure mode, n=1 on broader "pin Windows-side children to native equivalents" rule |
| #48 | live-inject-plus-dockerfile-bake-dual-track | pattern | Cal (Brunel-source) | dual-track delivery for live-container fixes |
| #49 | ai-teams-user-no-sudo-use-docker-exec-root | gotcha | Cal (Brunel-source) | container-side missing NOPASSWD sudoers → use `docker exec -u root` from RC host |
| #50 | wiki-cross-link-convention | pattern | Cal (apex-source via Finn) | **first cross-pollination filing**, mature-wiki milestone |

**Cross-team link form policy adopted (this session):** within our wiki → relative paths (existing); cross-team to apex/comms-dev/etc → GitHub URL form (`/blob/main/...` default, `/blob/<sha>/...` for frozen cross-cite). Path-depth assumptions don't hold across teams' layouts. See [DECISION] block below.

**Auto-memory updated:** `reference_dev_db_tunnels.md` carries the full persistence stack (autossh + Task Scheduler + wscript hidden + supervisor loop + AUTOSSH_PATH=Windows-native).

## NEXT SESSION — open carryovers, no validation priority this time

Session 19's validation priority is fully discharged. No urgent first-action on restart.

Possible directions, in rough priority order:

1. **Aalto/uikit-dev cross-team debt** — 6 deferred Q's from Finn's Section D harvest, plus uikit-dev `1deb90e` defective free-string jq pattern. Tmux-direct relay to Aalto bundled with the Q's. Only triggered by a uikit-dev contact event.
2. **Ruth-team observability gap** — Brunel's v1.0 + Volta §6.5 addendum still gated on Ruth's Q2/Q3. Do NOT wake Volta/Celes speculatively — only on Ruth response.
3. **T06 path-tree rewrite** (Volta) — `topics/06-lifecycle.md` Path 1/2/2.5/3 decision tree needs Agent-tool-spawn rewrite. Herald `agent-spawn-protocol.md` defines path shapes. Carryover from session 19 chore list.
4. **Finn scratchpad** — already pruned this session 129→98 lines (Finn's own initiative + my carry-forward direction). No further pruning needed.

If PO arrives with direction, that takes priority over the above.

## NEXT-SESSION-CHOREs (still active)

- [ ] **T06 Path-tree rewrite (Volta).** `topics/06-lifecycle.md` Path 1/2/2.5/3 decision tree needs rewrite for Agent-tool spawn (post-#60). Herald's `agent-spawn-protocol.md` defines the shapes each path uses; Volta's rewrite references them. T03/T06 boundary named clearly (Herald session-19 [LEARNED]): "protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when."
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
