---

# Volta scratchpad

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

## R12 session (2026-04-08)

[DECISION] 2026-04-08 — Temporal ownership is a fourth git isolation model (T06 decision tree needs update). XP pipeline: one writer at a time, sequential handoff on single branch. Distinct from directory ownership (parallel writers, non-overlapping dirs).

[PATTERN] 2026-04-08 — XP pipeline spawn order is pipeline order: ARCHITECT first (must decompose before cycle starts), then RED+GREEN+PURPLE (can idle until handoff). Specialization of Phase 6, not replacement.

[PATTERN] 2026-04-08 — ARCHITECT's test plan is the critical cross-session handover artifact. Must be written to file immediately, not held in context. Without it, mid-cycle shutdown loses the story decomposition.

[CHECKPOINT] 2026-04-08 13:05 — Posted lifecycle analysis on Discussion #46 (temporal ownership, spawn order, mid-cycle shutdown).

[DECISION] 2026-04-08 — Wiki persistence: same git-commit model as scratchpads/inboxes. No new infrastructure. Librarian spawns after Medici, shuts down before team lead (last work agent to terminate). Active/archive partition prevents unbounded wiki growth.

[CHECKPOINT] 2026-04-08 13:18 — Posted lifecycle perspective on Discussion #47 (knowledge base + Librarian).

[DECISION] 2026-04-08 — Pushed back on PO Decision 5 ("agents must not read other scratchpads"). Rule should be scoped to work agents only. Medici, team lead need cross-scratchpad access for audit/shutdown. Librarian does NOT need it (sole-gateway model).

[PATTERN] 2026-04-08 — Promotion timing matches development cadence, not urgency. Serial teams (XP pipeline): shutdown-only. Parallel teams (2+ TDD pairs): mid-session via Librarian. Common-prompt promotion always at shutdown (needs team-lead review).

[PATTERN] 2026-04-08 — Sole-gateway Librarian is single point of failure. Needs periodic state checkpoint (.librarian-state.json) for crash recovery. Fallback: agents write [WIKI] to scratchpads, Librarian catches up on respawn.

[CHECKPOINT] 2026-04-08 20:05 — Posted round 2 on Discussion #47 (PO response analysis, mid-session promotion, SPOF concern).

[LEARNED] 2026-04-09 — Medici is NOT in deployed teams. Phase 5 (Audit) must work without Medici. In deployed teams with Librarian, Librarian replaces Medici as first-spawn for wiki health audit. Without Librarian, team lead self-audits.

[PATTERN] 2026-04-09 — SPOF recovery for Librarian: just respawn (PO correction). No circuit breakers, no fallback paths. Active/archive wiki partition keeps respawn context-loading cost manageable.

[DECISION] 2026-04-09 — Wiki source linking: optional source-files frontmatter field. Librarian checks git log at startup to flag potentially stale entries. Detection, not auto-correction.

[PATTERN] 2026-04-09 — Librarian as health sensor: observe and report, never instruct. Diagnostic section in closing report covers redundant queries, persistent gaps, submission health, source staleness. Team lead interprets and acts.

[CHECKPOINT] 2026-04-09 08:51 — Posted round 3 on Discussion #47 (corrections accepted, topics 8/9/10).

[DECISION] 2026-04-09 — Head-scratcher #13 (shared PURPLE): NO. Same-branch parallel pairs → cross-pair write conflict. Worktree pairs → context-switching cost exceeds savings. PURPLE scales linearly with TDD pairs.

[PATTERN] 2026-04-09 — Research team wiki domain: META-knowledge (map of what team knows), not research output itself. Topic files stay in topics/, wiki indexes them. apex-research API inventory stays in output dirs; wiki holds patterns/gotchas/decisions about the inventory.

[DECISION] 2026-04-09 — PO MEMORY.md vs team wiki: DELIBERATELY SEPARATE. Different scope (cross-team vs single-team), audience (PO vs agents), lifecycle. Bridge adds complexity for marginal benefit. PO's manual curation is the promotion mechanism and it works.

[CHECKPOINT] 2026-04-09 11:39 — Posted round 4 on Discussion #47 (head-scratchers 13/14/15).

[DECISION] 2026-04-09 — Lookahead should be adaptive, not static. Max_lookahead is team-configured upper bound (default 1); effective depth adjusts to rolling PURPLE rejection rate. Lookahead cancellation: preserve on first rejection, ARCHITECT-reviews on second (three-strike path).

[DECISION] 2026-04-09 — PURPLE shutdown watchdog: monitor git working tree state, NOT wall-clock. Polls every 10s. Exit states: clean exit (shutdown_approved), atomic commit (working tree clean + new commit), hung (60s unchanged + no commits → force revert), stuck mid-refactor (3min changes no commits → team lead intervenes once).

[PATTERN] 2026-04-09 — Health sensor audit: 5 of 6 signals preserved in T09. Missing: single-source knowledge (concentration risk). Refinable: stale-but-accessed needs hot/cold split, query clustering needs domain density framing.

[PATTERN] 2026-04-09 — Oracle adoption trigger: scratchpad duplication threshold (30 [LEARNED]/[PATTERN] entries across team of 5+), not voluntary. Measured at Shutdown Phase 2c, decided by PO, next session spawns Oracle with intake interview. Additional trigger: team size >=7-8 (Phase 2 cognitive overload).

[CHECKPOINT] 2026-04-09 12:22 — Posted round 5 on #46 and #47.

[LEARNED] 2026-04-09 — T09 v2 composed my git-state watchdog with Monte's 5-minute authority + Medici's [DEFERRED-REFACTOR] Oracle handoff. Three-way integration is cleaner than my standalone proposal — watchdog IS the timing mechanism, Monte's boundary activates authority, Medici's submission bridges memory across forced reverts.

[CHECKPOINT] 2026-04-09 13:06 — Posted round 6 ACK on #47. All 6 round-5 contributions verified in T09 v2 (commits ad367f1 + c59bc76). Position accurately rendered.

[DEFERRED] — #48 (Oracle tier downgrade path) accepted by Celes as T09 v3 scope. She takes assignee. My lifecycle-analysis offer on transition mechanics accepted — loop-in coming when v3 starts (after T04 amendments). Three v3 questions to address: one-session vs transition session, wiki ownership post-downgrade, oracle-state.json re-adoption semantics.

[LEARNED] 2026-04-09 — Multi-round consensus value in one sentence (Celes): "Writing them side by side in round 4 made the composition visible." Three-way mid-cycle-shutdown integration emerged because standalone proposals sat next to each other, not because any single author reached it. This is why PO requested the Multi-Round Consensus Protocol section (c59bc76) — the pattern is load-bearing.

[DEFERRED] — Draft T06 Phase 3 amendment for PURPLE grace period watchdog. T09 v2 "Mid-Cycle Shutdown: Watchdog + Team Lead Authority" (line 259) is the spec. Cross-topic change, send to team-lead for review before updating T06.

## Prior sessions (pruned 2026-04-15, key decisions retained)

[DECISION] R9 2026-03-18 — Git isolation: 3 archetypes (independent-output=worktree, pipeline=directory-ownership-on-trunk, hybrid=split). Written to T06. Polyphony-dev classified as independent-output.

[PATTERN] R9 2026-03-18 — Worktree isolation is a DOWNGRADE for pipeline teams.

[PATTERN] R8 2026-03-17 — Observability is a byproduct, not a system.

[PATTERN] R6 2026-03-14 — Script-based lifecycle ops: derive paths from $SCRIPT_DIR + $HOME.
