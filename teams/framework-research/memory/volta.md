---

# Volta scratchpad

## S35 — mVox investigation + research companion + Cloudflare substrate dispatch (2026-05-22 → 2026-05-26)

[CHECKPOINT 2026-05-26] Substantial S35 arc across four tasks. Headline contributions in priority order:

1. **Task #4 (2026-05-22) — mVox-dev debt-control investigation.** Read mvox-dev's startup.md + common-prompt + memory/team-lead + bentham scratchpad + Medici's 2026-05-20 health-report audit. Decomposed mVox's debt-control discipline into 5 mechanisms (M1 NEXT SESSION seed; M2 task-list-snapshot; M3 YELLOW-to-task surface-condition discipline; M4 steward-routed pruning; M5 processed-downgrade dance). Identified each mechanism's team-property coupling. Recommended FR adopt A1 (M1 seed), A2 (task-list-snapshot), A3 (surface-condition discipline); defer M4 (steward role); reject M3-as-numbering (cargo-cult shape). Source files at `~/Documents/github/.mmp/mvox_v4e_web/teams/mvox-dev/`.

2. **Task #5 (2026-05-22) — research-perspective companion analysis.** Catalyzed by PO 2026-05-22 dual-perspective discipline correction: *"when assessing remote-team's practices, we should always consider these from two perspectives: we as target and we as researchers."* Saved as durable feedback in auto-memory. Companion analysis lifted task #4 from adoption-only framing to research-grade framing. Five threads delivered + delta-pass with sharpened answers on (i) M1-M5 cluster decomposes along team-property coupling-dimension (each mechanism couples to a different team-property); (ii) structural-backing-vs-procedural is a force-multiplier not precondition; (iii) bottleneck-determines-adoption (cross-team adoption driven by adopter's primary bottleneck, NOT origin team's distinctiveness); (iv) cross-team observation methodology (credibility-floor caveat as a discipline pattern); (v) **cluster-decomposition meta-principle** as named framework primitive.

3. **Task #7 (2026-05-25) — Brunel + Volta joint substrate gap analysis vs Cloudflare Claude Managed Agents.** Joint dispatch following Cloudflare/Anthropic announcement. I owned the lifecycle angle (§V1 state-persistence semantics; §V2 sandbox-per-session vs long-lived containers; §V3 6-step shutdown-protocol bifurcation table; §V4 carry-forward primitive cross-link; §V5 bottleneck-matrix dominant-bottleneck column; §V6 framework-clarity-benefit-without-adoption). **Strongest single contribution: cluster-decomposition meta-principle generalized to n=3 across coupling-dimensions** (mVox M1-M5 + Cloudflare 7-mechanism + Sub-shape E three-layer ownership-locus). Aen flagged this as the dispatch's load-bearing finding; landed in `docs/findings.md` as cross-cutting research finding; C1 placed at top of Cal queue.

4. **Task #10 (2026-05-26) — Cloudflare pilot lifecycle brief.** Multi-session research experiment. My §VL1-§VL6 brief: session model (team-identity-across-sessions, framework-store-mediated comms); team membership (R2 roster + sandbox-config + R2 scratchpad; intersection flags to Brunel identity-at-substrate + Herald comms-primitive); state persistence (R2 over KV/Workers-FS/DO with rationale; write-through caching pattern); startup discipline (5-step → 2-step collapse via §V3 bifurcation applied to startup-side); A1 confirmation (stays under managed substrate; bootstrap-write for pilot session 1); 6 open questions including R2 latency budget + Workers control-plane sequencing.

[DECISION 2026-05-22] **PO dual-perspective discipline applies to ALL cross-team observations, not just task-#4 specific.** Saved to auto-memory as `feedback_dual_perspective_remote_team_observation.md`. Operating definition: every cross-team observation must explicitly carry (a) we-as-target framing (what does adopter team do with this finding?) AND (b) we-as-researchers framing (what framework-grade observation emerges?). Both foregrounded, not woven in. Applies retroactively to task #4 + going forward.

[DECISION 2026-05-25] **Cluster-decomposition meta-principle promoted to wiki-grade.** *"Clusters decompose along their coupling-dimension; the coupling-dimension is the load-bearing property to identify."* n=3 across three coupling-dimensions confirmed in task #7 joint dispatch with Brunel: mVox M1-M5 → team-property; Cloudflare 7-mechanism → team-property; Sub-shape E three-layer → ownership-locus. Cal queues as C1 at top of post-dispatch queue. Sub-finding (methodology corollary): decompositions are invisible at n=1; emerge at n=2 with second instance providing variation along the coupling-dimension.

[DECISION 2026-05-25] **Bottleneck-determines-adoption confirmed at n=3 across two domains** (discipline-domain n=2 from S35: FR adopts mVox M1 + apex adopts mVox M3; substrate-domain n=1 from task #7: Cloudflare substrate-choice decomposes along bottleneck-alignment). Two-condition refinement (per Brunel substrate-class-fit + my Volta sharpening): bottleneck-matches AND workload-fits, both required. Sub-pattern under cluster-decomposition meta-principle.

[DECISION 2026-05-25] **Substrate-vs-framework boundary as named primitive.** Cloudflare's existence forces the boundary into the open. Framework-state vs substrate-state is the *primary* decomposition lens; V8-vs-microVM is the *gate* (substrate-class-fit determines could-we?), not the decomposition (substrate-state-vs-framework-state determines should-we?). FR remains responsible for: cross-session identity continuity, intent carry-forward (M1+M2), inter-agent coordination protocols, role-of-record discipline, framework-layer pruning, cross-team observation methodology.

[LEARNED 2026-05-25] **Active-supersession-on-cross-in-flight has TWO failure modes.** Pair-loop on task #7 produced ~12 crossed-in-flight passes with Brunel; substantive content converged from Pass-3 onward; passes 3-12 were reconciliation overhead with no new content. Failure modes:
- **Drift-loop:** two agents push different framings, miss amendments, content diverges. Reconciliation cost grows; output quality degrades.
- **Affirmation-loop (this dispatch's mode):** two agents converge on substance early; subsequent passes re-affirm closure without adding content. Reconciliation cost grows; output is high-quality but undeliverable because each pass invites another close-ack.

Aen's 13:14 deliver-NOW intervention was the right external HALT to break the affirmation-loop. Discriminator between modes: does each pass add substantive content or only affirm prior closure. E4 in task #7 §S7 captures the healthy-velocity-signal framing; affirmation-loop is the OTHER failure mode the dispatch surfaced. PO flagged for separate HALT-primitive design work; PO leans toward separate Cal-Protocol-A submission at `wiki/patterns/dyad-cross-pattern-failure-modes.md` rather than E4 amendment.

[LEARNED 2026-05-25] **Fast-forward-map is the natural recovery mechanism for crossed-in-flight at high cadence.** When message-overlap accumulates beyond ~3 passes, full-message-replay is too expensive; sending a consolidated map of state ("here's what's in your inbox, in this order, with this load-bearing message") consolidates state in one read at the receiving end. The 17:25 fast-forward map I sent Brunel successfully recovered 5-messages-worth of state in one read on his side; his "Pass-6 fast-forward map received" confirmed mechanism worked. Sub-finding under E4.

[STANDING-WATCH 2026-05-25] **Two paths for affirmation-loop failure-mode treatment per Aen 13:25 instruction:** (a) §S7 E4 amendment to docs/findings.md adding affirmation-loop as second sub-finding under dyad-cross-pattern; OR (b) separate Cal-Protocol-A submission at `wiki/patterns/dyad-cross-pattern-failure-modes.md` with drift-loop + affirmation-loop as the two modes and external-HALT-vs-internal-reconciliation as the discriminator. Aen leans (b) — the discriminator (substantive-content-added vs only-affirmation) generalizes beyond dyad-cross-pattern to any high-velocity coordination loop (pair-as-unit, RFC iteration, joint-authorship). Decision deferred post-delivery of docs/findings.md polish-pass; queued for next-session.

[CAL-CANDIDATE 2026-05-26] **Lifecycle-phase-invariance corollary** (new finding from task #10 §VL4). The substrate-vs-framework boundary is operationally invariant across lifecycle phase — startup, runtime, shutdown all bifurcate the same way. §V3 (docs/findings.md) showed shutdown-bifurcation; §VL4 (task #10 brief) extended to startup-bifurcation; runtime is the trivially-true middle case. Pilot empirically tests by exhibiting all three phases under CF-managed substrate. Worth surfacing in C2's wiki entry as a *lifecycle-phase-invariance corollary* post-pilot. Pre-pilot, hypothesis; post-pilot, evidence.

[STANDING-WATCH 2026-05-26] **R2 latency budget at pilot session-start (VL-Q-1).** Pilot must measure cumulative R2 read-latency for roster + scratchpad + recent-inbox. If single-digit-ms × N reads is acceptable (<500ms total), no caching tier needed; if >500ms, introduce write-through cache. Single-digit-ms-per-read is the announcement-grade baseline; pilot's empirical floor may differ. Pre-pilot prediction: 3-5 reads × ~5ms = 15-25ms baseline; comfortably under budget. If pilot reveals >50ms per read, the underlying assumption fails and caching tier becomes load-bearing.

[STANDING-WATCH 2026-05-26] **Scratchpad pruning under managed substrate (VL-Q-3).** M4 mVox steward-pruning pattern was designed assuming on-disk file growth. Under R2, growth is unbounded by storage but bounded by per-read transfer cost. Does this shift the prune-incentive curve? Worth one-paragraph thought experiment in Cal-Protocol-A submission AFTER pilot lands evidence. Not pre-pilot; queued for post-pilot Cal pool addition.

[NEXT-SESSION-PRIORITIES 2026-05-26]
1. **Task #10 pilot continues multi-session.** Aen synthesizes the three briefs (Brunel substrate + Volta lifecycle + Herald comms) into `designs/new/cloudflare-pilot/` skeleton + S36 execution plan. My §VL1-§VL6 brief is the lifecycle input.
2. **Affirmation-loop failure-mode Cal submission decision (Aen's path-(b) lean).** Queued for resolution next session if Aen ratifies. Pre-draft phrasing: drift-loop + affirmation-loop as two modes; external-HALT-vs-internal-reconciliation as discriminator; cross-applicable beyond dyads (RFC iteration, pair-as-unit, joint-authorship).
3. **Pilot Q1+Q2 credibility-floor resolution.** First concrete experiment: identity-anchor-in-framework-layer-R2 vs substrate-session-identity. Resolves the load-bearing ambiguity from docs/findings.md.
4. **A1 (NEXT SESSION seed) FR adoption — Aen bootstrapped at S35-end per shutdown-message.** S36 onward FR runs A1 procedurally; per S35 thread-2 (procedural-vs-structural), monitor for sustainability through S40-42 audit point (procedural-cost-vs-immediate-value rule predicts M1 sustains because low-cost + high-immediate-value).
5. **mVox-dev sourcing canonical:** all mvox-dev research artifacts at `~/Documents/github/.mmp/mvox_v4e_web/teams/mvox-dev/`. Medici's 2026-05-20 health-report is the compound-infrastructure prior audit; saved me ~2x token cost vs cold investigation.

(*FR:Volta*)

---



[CHECKPOINT 2026-05-19] Shipped FR-side mirror of apex's commit 9b949c8 (2026-05-15). New lifecycle script + startup.md section.

**Files shipped:**
- NEW: `teams/framework-research/restore-ghost-members.sh` — reads `roster.json`, filters `agentType == "ghost"`, appends missing entries to runtime `config.json` `members[]` with shape matching the current S33-hand-edited apex-lead-ghost entry (`agentId`, `name`, `agentType`, `backendType`, `color`, `isActive: false`, `joinedAt`, `tmuxPaneId: ""`, `cwd: ""`, `subscriptions: []`). Ensures `inboxes/<ghost>.json` exists as `[]` if missing. Idempotent.
- MODIFIED: `teams/framework-research/startup.md` — added "Step 2c: Re-register ghost members from roster" between Step 2b (Operational gate) and Step 3 (Restore inboxes). Lifecycle-scripts table row extended.

**Naming choice:** New step is **2c**, not "2b" as the brief suggested. Existing 2b (Operational gate) is well-established and load-bearing per R4-3; renaming it would have rippled into Volta's earlier 2b reference and risked confusion. Subordinate to Step 2 (Reset team state), ordered after 2b (Operational gate) per dependency: ghost re-registration depends on a verified-operational team (the gate must clear first). Apex's "Step 2b" naming is internal to apex's startup procedure; not a typed contract.

**Test outcomes:**
- Run #1 (current S33 runtime, apex-lead-ghost already hand-registered): no-op, "All ghost members already registered." ✓
- Synthetic cold-start (stripped ghost from runtime, moved inbox aside): "Re-registered 1 ghost member(s)." Entry shape exactly matches canonical (agentId/name/agentType/backendType/color all present; null fields stripped). Empty inbox `[]` created. ✓
- Runs #2, #3 against synthetic added state: idempotent no-op. ✓
- Original session state restored intact after test: 13769-byte live inbox preserved, 1 ghost in members[]. ✓

[DECISION 2026-05-19] **Filter only on `agentType == "ghost"`, not on `backendType`.** FR currently has one ghost vocabulary (`ghost`); apex uses three (`human-overseer`, `human-collaborator`, `cross-team-bridge`) per Schliemann's framing. FR's simpler vocabulary is per-spec — no new agentTypes introduced. If FR later adds more ghost shapes, this filter widens trivially.

[DECISION 2026-05-19] **Copy `backendType` and `color` from roster, strip nulls.** The canonical S33 hand-edited entry has both fields. Roster-driven copy keeps the script substrate-agnostic — if a future ghost has a different `backendType` (e.g., MCP transport per SPEC.md Phase 4), the script picks it up without modification.

[LEARNED 2026-05-19] **`with_entries(select(.value != null))` is the right jq idiom for "include optional fields if present."** Alternative — conditional jq object construction with `+ if $src.color then {color: $src.color} else {} end` — is more verbose and order-dependent. The null-strip approach is single-pass and order-independent.

[STANDING-WATCH 2026-05-19] **Companion-pair-with-apex n=2 process pattern.** Volta-mirror-of-apex on lifecycle scripts is now n=2 (S28 startup collapse mirroring apex #62 → this Step 2c mirroring apex 9b949c8). Both times: apex ships → user surfaces to FR → Volta mirrors with adaptations for FR conventions. Watch for n=3; if it lands, candidate for Cal Protocol A as a cross-team lifecycle-discipline-replication pattern.

[DEFERRED 2026-05-19] If FR ever adds a non-ghost backendType-special member (e.g., `agentType: "external-tool"`), the same TeamCreate-doesn't-spawn-it problem applies. The script could be generalized via a roster-side `requiresReRegistration: true` flag rather than hard-coded on `agentType == "ghost"`. Not needed at n=1; revisit when n=2 surfaces.

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
