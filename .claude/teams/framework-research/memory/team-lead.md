# Team-Lead Scratchpad (*FR:team-lead*)

## NEXT SESSION

**Context:** Phase 1 and Phase 2 of Oracle→Librarian rename both COMPLETE (2026-04-13 afternoon). Next mission diverts to a different team at `evr-ui-ki` — framework-research stays idle between sessions, no in-flight work expected here.

[DECISION] **Next session pivot: `evr-ui-ki` team.** Per PO direction at session close: next-mission focus shifts to maintaining an existing team at `evr-ui-ki` (likely EVR UI kit project — verify on next session start). Framework-research is not the active team for the next session; continue as background/on-demand only.

[DECISION] **Phase 1 Oracle→Librarian steal-back COMPLETE** — committed `04522c7` on main. Callimachus's prompt ported 10 lessons from the Eratosthenes replication plus Path Convention section (closes the deferred Path Convention patch from 2026-04-13 morning). Routing table dual-sourced into common-prompt.md. 4 Protocol A wiki entries filed (conv-as-retroactive-telemetry, rule-erosion-via-reasonable-exceptions, named-concepts-beat-descriptive-phrases, why-this-section-exists-incident-docs) — wiki now 28 entries.

[DECISION] **Phase 2 Oracle→Librarian machine identifier rename COMPLETE** — committed `ca0e56f` on main. roster.json agentType, callimachus.md + eratosthenes.md (snapshot) YAML templates + state.json refs, all 28 wiki frontmatters, types/t09-protocols.ts string literals, `git mv oracle-state.json librarian-state.json`. Grep-clean.

[DECISION] **Apex-research Phase 2 directive delivered to Schliemann via tmux-direct** at session close. Schliemann must mirror-apply: roster agentType, eratosthenes.md YAML + state refs, wiki filed-by frontmatters, git mv state file, restart Eratosthenes. Report back via whatever channel is available. Technique saved in auto-memory as `reference_tmux_direct_cross_team.md`.

[WIP] **Structural-discipline cluster Protocol C promotion.** 4 confirmed members (Pass 1/Pass 2, within-doc grep, protocol-shapes-typed-contracts, dual-team-dir-ambiguity) + 1 pending (Brunel's prompt-to-artifact cross-verification). This session qualifies as the ≥2-session calibration that Brunel was holding for, but no promotion was drafted — defer to a framework-research session once Brunel is spawned.

[WIP] Cross-pollination meta-pattern wiki entry (Cal background housekeeping).

[WIP] **Substrate-invariant-mismatch pattern candidate (n=2, supporting n=3)** — flagged by Cal 2026-04-14 after filing `persist-project-state-leaks-per-user-memory.md` (#38). Shape: "syntactically correct code, invariants don't hold on this substrate." Two primary instances now cross-referenced bidirectionally:
- `dual-team-dir-ambiguity.md` (path-ambiguity variant, Eratosthenes first boot)
- `persist-project-state-leaks-per-user-memory.md` (wrong-substrate variant, script mirror semantics this session)
Third supporting data point from Volta's 12:54 audit (Flag 1): v0.3 skill-integration patches reference `$TEAM_DIR` ambiguously — same root cause as dual-team-dir-ambiguity applied to a NEW consumer (skill files). Evidence the original gotcha has broad-consumer scope. n=2 qualifies for pattern promotion; Cal held back per delivery-window freeze. Candidate names: `substrate-invariant-mismatch` or `right-code-wrong-substrate`. Queue for next non-freeze framework-research session — Cal drafts, team-lead reviews.

[WIP] **Persist-coverage ship session blockers (from Volta audit 2026-04-14 12:54)** — see `docs/persist-coverage-audit-2026-04-14.md` (Volta to save). Ship session must land these in order:
1. **Mitigation FIRST** — Option (c) target-dir refusal with `git check-ignore` opt-in, shared helper `_substrate-check.sh` sourced by both persist scripts. Not (a), not (b), not layered. Rationale: (c) detects the ground-truth invariant at the write site; opt-in inverts (b)'s fail-open into fail-closed with explicit team assertion.
2. **THEN** marker file `.project-dir-name` re-creation (Flag 3: order matters — re-creating marker without mitigation re-enables the exact defect Cal filed).
3. **Flag 1 fix:** v0.3 skill patches must declare Path Convention or anchor `$TEAM_DIR` to `$REPO`. Sibling fix to `dual-team-dir-ambiguity.md`.
4. **Script-level defects:** `persist-project-state.sh` atomic wipe-then-copy via trap; `persist-session-logs.sh` cross-operator tarball collision guard.
5. **`protocol-a-submission-draft.md` disposition:** HOLD (not stale, don't delete). Pre-ship: add STATUS UPDATE annotation noting mitigation must be integrated into submission body. Post-ship: revision pass to incorporate substrate-hazard sibling. Route direct to Cal via dual-hub rule (no team-lead intermediate).
6. **Softer flags (non-blocking):** Flag 2 — strip absolute byte counts from protocol-a draft (replace with structural claims). Flag 4 — fix `<agent-name>` literal placeholder in v0.3 skill patch prose.

[LEARNED 2026-04-14] **(c) over (a) over (b) for substrate-mismatch defect class** — Volta's reasoning: (a) container-only guard requires unenforceable cross-team invariant (every container entrypoint must plant sentinel, every workstation must not); (b) .gitignore entry suppresses at git layer not write site, fails-open; (c) detects the actual invariant via `git check-ignore` with opt-in escape hatch. The `check-ignore` opt-in is the key innovation — it inverts (b)'s fail-open into fail-closed with explicit team assertion, letting container teams opt in via team-local `.gitignore` while workstation operators get hard refusal. Generalizable to any "correct code, wrong substrate" defect class where the write site can detect the invariant directly.

[DEFERRED] **Discussion #56 actionable items** (carried from prior session, still unassigned):

- Provider outage emergency protocol (Monte, T04)
- Sidecar/peer framework in T06 (Brunel+Monte)
- Contract enforcement mechanism (Herald)
- Platform/provider separation in T02 (Finn)

[DEFERRED] Finn model inventory re-survey (uikit-dev missing from baseline count).

[DEFERRED] **Timestamping convention — promote to T03 + investigate cheaper implementation** (see prior-sessions section for rationale).

[LEARNED] **tmux-direct is a real option for cross-team coordination.** When hub path is unproven and PR-mediated isn't the right sync target, SSH + load-buffer/paste-buffer/Enter works cleanly for one-shot briefs. Procedure saved to auto-memory. Don't rathole on hub onboarding for one-off coordination — tmux-direct is 3 minutes of work and has no infrastructure cost.

[LEARNED] **Two-commit phase separation keeps git history legible.** Phase 1 (design change: steal-back patch) and Phase 2 (mechanical rename) as separate commits made the log bisectable and the commit messages focused. Generalize: when a multi-artifact change has a "thematic" half and a "mechanical" half, split them.

---

## Session: 2026-04-13 (afternoon) — Phase 1 steal-back + Phase 2 machine-id rename

**Team:** Callimachus + Celes + Herald. Brunel/Monte/Finn/Volta/Medici not spawned (not needed for this scope).

**Rhythm:**

- Cal prepared 377-line steal-back inventory (12 patterns, 10 patches after consolidation)
- Celes drafted coordinated patch for Cal's prompt
- Cross-read gate with Cal caught 2 bugs (Protocol A step ordering + Batch Intake heading depth)
- Phase 1 committed `04522c7`, pushed
- Herald surveyed `types/t09-protocols.ts` → 2 string-literal changes, no programmatic consumers → clean proposal
- Celes + Cal split Phase 2 work: Celes on prompt+roster, Cal on 28 wiki frontmatters (sed batch)
- Team-lead did `git mv` for state file
- Phase 2 committed `ca0e56f`, pushed
- Schliemann briefed via tmux-direct at session close

[CHECKPOINT] Wiki: 24 → 28 entries. Cal's prompt ported 10 steal-back patterns + Path Convention. Common-prompt has routing table mirror. Types file renamed. All `oracle`/`Oracle` occurrences in Cal/Erato prompts, wiki, roster, types are either renamed or intentionally preserved (literary lore, Oracle APEX platform references).

[LEARNED] **"Sole writer" rules make batch operations trivially safe.** Cal's wiki is sole-writer, so a single `sed` pass across 28 files is verifiable by grep with no coordination overhead. Prompts + roster took cross-read gates because multiple agents could interpret rename scope differently.

[LEARNED] **Scratchpad Protocol A sweep is worth 15 minutes.** Celes's self-review of her own scratchpad yielded 4 submissions Cal immediately filed. The lever is the individual agent's judgment, not the librarian's — the librarian doesn't mine, the agent harvests. Future pattern: at session end, each agent does a quick scratchpad sweep before shutdown.

---

## Previous session — 2026-04-13 morning — Phase 1 Oracle→Librarian design work + Eratosthenes deployment

**Team:** Brunel + Callimachus + Celes. Finn/Herald/Monte/Volta/Medici not spawned.

[CHECKPOINT] Wiki: 20 → 24 entries (4 new in structural-discipline cluster). Framework-research commit 86e5e98. apex-research PRs #57 (initial deployment) + #58 (Path Convention fix) merged. Eratosthenes v2.7.1 live.

[LEARNED] **First-boot of any new Librarian is a de-facto QA pass for the prompt.** Eratosthenes hit the path-ambiguity bug within hours of PR #57 merge. Latent equivalents exist in Callimachus but stayed dormant because his container never triggered them. Next Librarian replication: budget first-boot debugging time AND audit BOTH new and source prompts for latent path/reference issues. Plan for it as a deliberate gate.

[LEARNED] **Credit the gate, not the gate-runner** (Celes via Brunel). Pre-merge cross-read gate caught the Protocol A/B field-set bug that would have shipped silently broken. Structural gates > individual heroism. Reproducible at scale; heroism isn't.

[LEARNED] **Re-implementation as design forcing function.** Eratosthenes wasn't just "a second Cal" — re-implementing Cal's design in a different context surfaced 11 stealback patterns flowing BACK to Callimachus plus latent bugs that were invisible in Cal's deployed prompt. The mechanism: re-implementation forces re-justification of implicit decisions, exposing assumptions. Repeatable for any multi-agent role, not just Librarians. Budget for bidirectional lesson flow from day one.

[LEARNED] **Synthesis observations are byproducts of execution discipline, not outputs of synthesis effort** (Cal). The session's highest-value insight (gate-mapping for structural-discipline cluster) was NOT an intentional goal. It emerged from the discipline of writing tight cross-references across 4 wiki entries. The discipline produced the insight; the insight would not have produced the discipline. Generalizable: value accumulates from disciplined consistency, not targeted optimization.

[LEARNED] **Fields are operational, not decorative** (Celes). Surfaced twice in one session as the same root-cause family: `source-agent` → `source-agents` schema vs rename distinction + Protocol A/B shape lift bug. Both errors treated typed-contract fields as cosmetic when they were load-bearing inputs to specific behaviors. Rule: when you see a numbered list of fields in a protocol shape, assume each field is wired to a specific behavior; ask "what fails if this field is missing?" before trimming/renaming.

[LEARNED] **Prudent pause beats permission grant** (Cal). Rule-erosion failure mode: granting yourself a reasonable exception to a discipline. Permission grant removes one blocker, not all of them. Even after authorization is granted, check if direction is in flight before acting. 3 data points on 2026-04-13 (1 negative self-catch, 2 positive holds).

[LEARNED] **Batch-acknowledge convention is infrastructure, not politeness.** Leading every report with explicit directive acknowledgments lets crossed async messages resolve within one round-trip. Worth codifying framework-wide.

[PATTERN] **Dual-sourcing defends against DRY erosion.** The "What goes to X vs Y" routing table lives in BOTH common-prompt.md and eratosthenes.md by design — different audiences, different context, same content. Active defense paragraph prevents future maintainers from "fixing" the duplication. DRY is a code principle, not a prompt-engineering principle.

[PATTERN] **Three-source convergence signals real pattern families.** Pass 1/Pass 2, within-doc rename grep, protocol-shapes-typed-contracts — three independent observers, three different scopes, one root cause (silent structural drift at typed-contract level). Stronger than two-source signal; candidate for Protocol C promotion.

[GOTCHA] **Dual `.claude/teams/<team>/` dirs** — runtime (ephemeral, $HOME) vs repo (durable, $REPO). Prompts must anchor paths to avoid silent Write-to-runtime failures. Filed as wiki gotcha entry. Eratosthenes hit this live; Cal is latent.

[WARNING] **Path bug rediscovery risk.** Eratosthenes's scratchpad has the [LEARNED 2026-04-13] about paths, but on next session restart he re-reads his (now v2.7.1) prompt which has the Path Convention section baked in. Verify both on next apex-research session start.

---

## Carryovers from prior sessions

[DECISION] Bioforge-dev team: 4-character Cathedral-lite — Humboldt (TL/opus), Merian (RED/sonnet), Linnaeus (GREEN/sonnet), Cuvier (PURPLE/opus). Naturalists of the Enlightenment lore. Designed by Celes, research by Finn.
[DECISION] "Cathedral-lite" = Cathedral tier with ARCHITECT merged into team-lead. Valid for single-repo, single-language, single-pipeline projects.
[WIP] Discussion #56 actionable items not yet assigned as tasks:

- Provider outage emergency protocol (Monte, T04)
- Sidecar/peer framework in T06 (Brunel+Monte)
- Contract enforcement mechanism (Herald)
- Platform/provider separation in T02 (Finn)
[WIP] Celes assessment of Cal's first-day performance (carried from last session)
[DEFERRED] Finn model inventory re-survey (uikit-dev missing from baseline count)
[DEFERRED] **Timestamping convention — promote to T03 + investigate cheaper implementation.** Session 2026-04-13: the `[YYYY-MM-DD HH:MM]` prefix convention (currently per-team in common-prompt) proved load-bearing for tracking crossed messages, ordering sub-second dispatches, and debugging coordination. Two actions: (1) propose promotion to framework-wide rule in T03 (Communication) so cross-team threads stay legible; (2) investigate cheaper timestamping — current agent workflow requires `date '+%Y-%m-%d %H:%M'` bash call before every SendMessage, which takes noticeable time per message. Options to explore: auto-injection at message send (framework-level, zero agent cost), cached timestamp with staleness check, or lighter format (HH:MM only for intra-session, full only when crossing date boundaries). Discuss with Herald (protocol) and Brunel (infrastructure).

---

## Session: 2026-04-10 (evening) — Bioforge-dev roster design

[LEARNED] **Crashed session recovery is possible.** Bioforge session (4dd471b6) with 175 anonymous subagents was recoverable — session files preserved at /tmp/bioforge-session-backup/. The session was started from /home/michelek (not project dir), which placed files under -home-michelek project context.

[LEARNED] **Celes designs fast when reference material exists.** Raamatukoi-dev XP design served as structural template — Celes adapted it to bioforge in one pass. Having prior art accelerates roster design significantly.

[PATTERN] **Cathedral-lite for single-pipeline projects:** When domain distance is Low (single repo, single language), ARCHITECT merges into team-lead with no parallelism loss. Team size drops from 9 (raamatukoi) to 4. Reusable pattern.

[CHECKPOINT] Bioforge-dev roster committed to: ai-teams (9b904f1) + bioforge repo (bdb0643). Team files at .claude/teams/bioforge-dev/. Humboldt session already running from recovered bioforge session.

## Previous session notes

- 2026-04-10 (day): Discussion #56 complete, wiki 4→20, Cal proved as synthesis authority
- 2026-04-09: Raamatukoi-dev designed+deployed, Cal bootstrapped, post-crash respawn pattern
