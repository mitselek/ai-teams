---

# Volta scratchpad

## All three S28 tasks closed end-to-end (2026-05-07)

[CHECKPOINT 2026-05-07] Per Aen's 11:22 message — all three NEXT-SESSION-CHOREs closed via PO-greenlit team-lead override:

- **Task #1 (T06 path-tree rewrite):** my direct edit 2026-05-06, +122/-99
- **Task #2 (T04 path-tree audit):** A2 + B2 applied 2026-05-06 via team-lead override, +4/-2 (Row 2 description clarified, §Row 2 vs. session-boundary `TeamDelete` subsection inserted with `_FR:Volta_` attribution, Row 5 description extended)
- **Task #3 (T09 micro-fix):** verbatim insertion line applied 2026-05-07 via team-lead override, +1 (canonical schema position between `source-issues` and `ttl`)

All session diffs uncommitted pending Step S4 commit at shutdown. Monte not spawned this session; PO authorized team-lead override since A2/B2 are mechanical applications of my proposed verbatim text. Attribution preserved.

[STANDING-DATA 2026-05-07] Today's T04+T09 micro-fixes are n=2 of `cross-document-prose-procedure-drift` (the gotcha Cal filed yesterday). The Protocol-C-extension trigger I documented in this scratchpad has one of its three conditions partially met: `(a) second incident of cross-document drift n=2`. Strict reading: my [LEARNED] phrasing referenced "if a third lands soon" — n=2 alone is *progress toward* trigger (a), not satisfaction. Hold for n=3 or a cleanly-shaped third instance before drafting Protocol C.

## T04 path-tree audit (2026-05-06)

[CHECKPOINT 2026-05-06] Task #2 — T04 path-tree audit COMPLETE.

**Verdict on team-lead's S27 reference:** "lines 528 + 1025" was a TYPO for T06 (already reconciled in Task #1). T04 is only 928 lines total; line 1025 cannot exist there. T04 line 528 = governance matrix prose about competing requests, unrelated to lifecycle.

**T04's own concerning lines (2 found):**

1. **Concern A (genuine, latent):** Row 2 "Dissolve a team" (line 146) is a PO-D decision. Step S5 (Shutdown) and Phase 2 (Startup) both have team-lead call `TeamDelete()` operationally. T04 doesn't currently distinguish *dissolution* (permanent team end) from *session-boundary leadership-state release* (every session). A future federation-scale audit detector or agent could read "all `TeamDelete()` calls are dissolution" → conclude team-lead Step S5 calls violate PO authority. Same shape of misreading as the old "DO NOT TeamDelete" T06 confusion. NOT a current factual contradiction; latent interpretive trap.

2. **Concern B (borderline, low severity):** Row 5 "Shut down an agent (session end)" (line 149) authorizes individual-agent shutdown. Doesn't explicitly cover team-shutdown procedure (T06 Phases 1–5). Implicit authority is operationally well-established but not explicitly granted in T04.

**Diff proposals delivered to team-lead** — A2 (extend Row 2 + add §Row 2 vs. session-boundary `TeamDelete` subsection) and B2 (broaden Row 5 description). Recommended Montesquieu as the wordsmith author since T04 is his domain. I cannot apply directly per scope restrictions.

[CAL-CANDIDATE 2026-05-06] Pattern fragment: governance-matrix rows benefit from explicit semantic-scope notes when an operation has both an *administrative* meaning (PO authority) and a *runtime/session-boundary* meaning (team-lead operational authority). Row 2 "Dissolve" is the n=1 instance; same shape applies to any matrix row where a primitive is authoritative-at-creation/destruction but operational-at-session-edges. Below threshold for Cal submission (n=1, no clear cross-team analog yet) — hold for a second instance.

## T06 path-tree rewrite (2026-05-06)

[CHECKPOINT 2026-05-06] Task #1 — T06 path-tree rewrite COMPLETE. Edits applied to topics/06-lifecycle.md:
1. Phase 2 (Clean) — collapsed 4 substeps to single `TeamDelete()` primitive; rationale table for each obsoleted substep
2. Phase 2.0a/b (Diagnose, $HOME validate) — replaced; `$HOME` validation moved to scoped subsection ("$HOME reliability and runtime-path notes")
3. Phase 3 (Create) — precondition rewritten; retry rationale aligned with Phase 2's TeamDelete-first model
4. Shutdown Rationale — rewritten with two-invariant frame (durable state to repo + in-memory release)
5. Shutdown 4-phase → 5-phase header + decision line
6. Phase 4 R7 "TeamDelete pointless" note — marked superseded with pointer to new Phase 5
7. NEW Phase 5 (Release) — full section with rationale, ordering invariant, symmetry table, failure modes
8. Stale-Team Recovery table — rewritten with 6 scenarios mapped to S5-aware idempotent primitives + new key insight
9. "Reference Teams Shutdown" section (formerly "no TeamDelete") — rewritten with canonical post-S5 sequence + historical note
10. Phase 4 reference-impl scripts — fixed runtime-path bug (`$RESOLVED_HOME/teams/...` → `$RESOLVED_HOME/.claude/teams/...`); added pointer to $HOME validation pattern
11. Open Questions resolved — two entries reframed (anomaly detection, $HOME reliability) to point to new Phase 2 subsection
12. Top-level Rationale — updated to reflect post-S5 simplification

[BRUNEL-COORDINATION 2026-05-06] DO NOT EDIT — message Brunel next session. Container Lifecycle section (lines 1135, 1182) references "Phase 2.0a" by name. With Phase 2 now collapsed and the $HOME-validation subsection renamed, the container references are stale prose. Suggested rewrite for Brunel: replace "Phase 2.0a" with "Phase 2 ($HOME reliability subsection)" or "the $HOME validation pattern documented in Phase 2." The semantics are unchanged; Brunel's container architecture conclusions still hold (Phase 2.0a was a no-op in container; the new pattern is also a no-op in container). Send via [COORDINATION] message when Brunel spawns.

[DEFERRED 2026-05-06] Phase 0 read-order row 0e (`docs/health-report.md`) — Medici no longer auto-spawned in framework-research. Out of scope for this rewrite. Flag for next-session attention if the read-order ever ships externally.

[CAL-FILED 2026-05-06] Pattern: `wiki/patterns/repo-as-durable-store-teamdelete-as-release-primitive.md` — Cal pulled per PO override of his (b) defer recommendation. Filed framing verified by me: cross-platform generalization (Cal's point 3) is sound, not overreach — three-condition trigger (substrate split + no auto-sync + lifecycle crosses both) is genuinely platform-agnostic. Confidence-split (combined=n=1, mitigation=n=3) preserves information correctly. No amendments.

[CAL-FILED 2026-05-06] Gotcha: `wiki/gotchas/cross-document-prose-procedure-drift.md` — Cal pulled. Architectural-fact entry; revision-trigger correctly bound to tooling-or-consolidation, not n>1. Cal's three-row gate-1-family scope table (one document / one repo / N teams) is sharper than my scratchpad framing — I concur. No amendments.

[FOLLOW-UP DEFERRED 2026-05-06] Protocol C candidate: extend common-prompt Structural Change Discipline gate 1 from within-document grep to within-repo `grep -r` for prose-vs-procedure-drift defense. Cal correctly deferred this decision to me — submitting Protocol C is a separate action. Triggers for submission: (a) second incident of cross-document drift n=2, (b) team-lead expresses interest in pre-emptive promotion, (c) tooling-revision-trigger looks unrealistic and discipline is the only viable defense. Until then, the gotcha entry stands as-is and the cost (one extra `grep -r`) is paid voluntarily by attentive editors.

## Startup/shutdown collapse (2026-04-30)

[CHECKPOINT 2026-04-30] Task #1 — assessed apex-research #62, drafted patch to `startup.md` collapsing Steps 2/3/4 (diagnose/clean/create) into single Step 2 (Reset team state: `TeamDelete` best-effort + `TeamCreate` + verify). Step 4b (operational gate) preserved as Step 2b. Added Step S5 (TeamDelete on graceful exit) to shutdown. Added gotcha #4 documenting the in-memory-survives-`/clear` pathology. **Aen committed `426194d` (mitselek/ai-teams), pushed, and posted cross-team comment on #62 (issuecomment-4350394024) crediting our assessment + correcting Schliemann's n=0 → n=1.** S5 ordering (after `git push`) confirmed.

[GOTCHA 2026-04-30] In-memory team-leadership state survives `/clear` independently of disk. `rm -rf $TEAM_DIR` is strictly weaker than `TeamDelete`. **Cal Protocol A candidate** — substrate-relevant, gotcha-shaped, mirrors apex-research evidence (cross-team pattern n=2). Aen will route to Cal on his next spawn.

[DEFERRED 2026-04-30] T06 amendment FOLDED INTO the existing standing chore "T06 Path-tree rewrite" (NEXT-SESSION-CHOREs, post-#60). When that rewrite happens, audit T06 lines 528 + 1025 (and any other "DO NOT TeamDelete" assertions) for contradictions with new Step S5. No urgency — stays NEXT-SESSION until bandwidth. `docs/restart-test.md` + `docs/restart-scorecard.md` left as-is per Aen (historical scorecards; commit history covers R4 vs R8 cross-reference).

[LEARNED 2026-04-30] Schliemann's #62 reasoning is sound on FR side too. Step 4 retry-loop defended an n=1 failure mode (Restart 4 config.json absent). The collapse preserves the recovery primitive (`TeamDelete + TeamCreate`) at the *top* of every startup, eliminating the separate retry branch without losing defense. n=1 verify-on-disk failure becomes n=1 retry, not zero coverage.

## Fix session (2026-04-15)

[CHECKPOINT 2026-04-15] F1 shipped: commit `88ced06`. Extracted inline jq filter to `restore-filter.jq` sibling. Script fail-closed on missing filter. FR structural pattern kept over uikit-dev free-string.

[CHECKPOINT 2026-04-15] F2 shipped: commit `5eb7f67`. "memory" → "auto-memory" rename in prose across 9 files (audit doc, design v0.1-v0.3, protocol-a draft, 4 scripts, session-logs MANIFEST). Filesystem paths and variable names unchanged (platform-owned).

[PATTERN 2026-04-15] Structural JSON match beats free-string for protocol-field filters in inbox messages. Free-string `shutdown_request` false-positives on legitimate messages that discuss the protocol in prose (empirical: Finn's T07 safety report in montesquieu.json mentions "shutdown_request" as documentation, not as a protocol message). FR's `"type"\s*:\s*"shutdown_request"` correctly distinguishes actual JSON protocol messages from prose about them. **Cal Protocol A candidate post-Cal spawn.**

[GOTCHA 2026-04-15] uikit-dev's `1deb90e` free-string pattern is defective — produces false positives. Cross-team debt, DEFERRED per team-lead (not this session's scope). Counter-example: montesquieu.json message from Finn discussing MEMORY.md rules. Aalto routing decision sits with team-lead.

[GOTCHA 2026-04-15] jq file parser vs command-line parser escape divergence. `\s` in a `.jq` file is an invalid escape; same `\s` via bash single-quoted command-line arg works because bash passes `\\s` to jq's arg parser which interprets `\\` → `\` then `\s` as regex. Extraction to `.jq` file requires `\\s` in the file content. uikit-dev's simpler filter (no `\s`) masked this portability bug.

## R-audit session (2026-04-14)

[CHECKPOINT 2026-04-14] Persist-coverage audit delivered. Full report: `docs/persist-coverage-audit-2026-04-14.md`. Mitigation: option (c) target-dir refusal + git check-ignore opt-in, shared helper. Ship-blockers: Flag 1 (`$TEAM_DIR` in skill patches) + Flag 3 (marker file before mitigation order). Draft persistence work on hold pending ship session.

[LEARNED 2026-04-14] Mitigation ranking (c) > (a) > (b) for substrate-guarding persist scripts, when the options are (a) container-runtime-guard, (b) `.gitignore` suppression, (c) target-dir refusal. (c) wins because it detects the ground-truth invariant ("is target git-tracked?") instead of a proxy — no cross-team coordination tax like (a), no fail-open hole like (b). `git check-ignore` provides the opt-in escape hatch for legitimate container-mirror substrate, inverting (b)'s fail-open into fail-closed-with-explicit-opt-in. Same reasoning lens I used for rejecting env-var cwd discovery in v0.1: unenforceable cross-team invariants are worse than no check.

[DEFERRED 2026-04-14] Ship-session invariants to preserve: (1) mitigation lands BEFORE marker file re-creation (order reversal re-enables Cal's gotcha); (2) shared helper comment must warn opt-in is team-local `.gitignore`, NOT repo-root (team-lead 12:54 footgun flag); (3) helper should defensively verify `check-ignore` hit did not come from git-toplevel-level `.gitignore`.

[DEFERRED 2026-04-14] Flag 1 (`$TEAM_DIR` ambiguity in v0.3 skill patches) escalated to Cal by team-lead as supporting evidence for substrate-invariant-mismatch pattern promotion (n=3). Volta does NOT submit — team-lead relays on pattern drafting session.

[DEFERRED 2026-04-14] Ship-session backlog SPLIT per PO (team-lead shutdown msg). F1 (jq extraction + semantic decision for `restore-inboxes.sh` — Finn's A7/B6 finding) → near-term Fix session. D1-D7 (full persist-coverage mitigation + script defects from the audit report) → future Design session. Audit report commit: 37a0833.

[LEARNED 2026-04-14] uikit-dev-harvest read deferred from R-audit → completed in Fix session (2026-04-15). F1 fix applied.

[WARNING 2026-04-14] Four persist/restore scripts committed but NOT runnable — marker file `.project-dir-name` absent, Section 2 mitigation not implemented. Do NOT invoke until Design session lands.

## R12 session (2026-04-08/09, pruned 2026-05-07 — codified entries removed)

[LEARNED] 2026-04-09 — Multi-round consensus value: "writing standalone proposals side by side made the composition visible." Three-way mid-cycle-shutdown integration emerged because Volta's git-state watchdog + Monte's 5-minute boundary + Medici's [DEFERRED-REFACTOR] handoff sat next to each other, not because any single author reached it. PO requested the Multi-Round Consensus Protocol section (c59bc76) on this basis — the pattern is load-bearing for any future round-based design work.

[PATTERN] 2026-04-09 — Oracle adoption trigger: scratchpad duplication threshold (30 [LEARNED]/[PATTERN] entries across team of 5+), measured at Shutdown Phase 2c, decided by PO. Additional trigger: team size ≥ 7–8 (Phase 2 cognitive overload). Not codified in T09 yet — held as standing trigger spec.

[DEFERRED] — Issue #48 (Oracle tier downgrade path) accepted by Celes as T09 v3 scope. My lifecycle-analysis loop-in coming when v3 starts (after T04 amendments). Three v3 questions to address: one-session vs transition session, wiki ownership post-downgrade, oracle-state.json re-adoption semantics. Status as of S28: dormant; no v3 work this session.

(R12 entries on temporal ownership, XP pipeline spawn order, ARCHITECT test-plan handover, wiki persistence, Librarian SPOF, Medici-not-in-deployed-teams, head-scratcher #13, research-team wiki META-domain, lookahead adaptivity, PURPLE git-state watchdog spec, health-sensor signals, multi-round-consensus per se — all codified in T06 / T09 v2 / common-prompt / wiki and pruned. The files are the durable artifact.)

## Prior sessions (pruned 2026-04-15, key decisions retained)

[DECISION] R9 2026-03-18 — Git isolation: 3 archetypes (independent-output=worktree, pipeline=directory-ownership-on-trunk, hybrid=split). Written to T06. Polyphony-dev classified as independent-output.

[PATTERN] R9 2026-03-18 — Worktree isolation is a DOWNGRADE for pipeline teams.

[PATTERN] R8 2026-03-17 — Observability is a byproduct, not a system.

[PATTERN] R6 2026-03-14 — Script-based lifecycle ops: derive paths from $SCRIPT_DIR + $HOME.
