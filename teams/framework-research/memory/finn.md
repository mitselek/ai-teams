# Finn's Scratchpad -- framework-research

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S63 (2026-08-19) COMPLETE. All three S62 carry-forwards closed: resolvers promoted+verified, target-vs-instance filed, model-inventory REFRESHED (not archived). Scratchpad pruned this session (118 -> under 100; VEO-78 blocks compressed to hooks, detail lives in the two docs).
- **Active items:** none blocking. Awaiting Cal on 2 submissions sent today (target-vs-instance; model-inventory refresh + reclassify-to-`references/` recommendation). Aen holds the archive-vs-refresh call on model-inventory and the roster-drift feed.
- **Key decisions this session:** `tools/wiki-ref-audit.sh` was ALREADY DONE at S62 (tree beat the record, pessimistic direction). model-inventory was REFRESHABLE from the repo -- its flag overstated the blocker. T01 tiering rule HELD across a full model-name turnover (62% top-tier vs baseline 63%).
- **Carry-forward:** **Cal-queue: 2 sent, unacked.** `prompts/finn.md` may need `tools/` added as a Finn-writable location (Celes; second pending item after co-source-agent role-expansion). **Roster-drift now has an in-repo n=1 on US** -- our roster pins fable-5[1m], S62 ran Opus 5, 3rd session off-pin; hand to Celes. Older DEFERRED queue below. WATCHPOINT auto-restoration n=2.

---
## Session transcript (prune beyond line 100)

## [INDEX] Reference material
- `reference/rc-team/cloudflare-builders/` -- original RC team (11 agents); `reference/hr-devs/` -- evolved project team (9 agents)
- `topics/` -- 8 design topic files + T09 dev methodology + T10 guild + T11 deploy-lifecycle
- `designs/` -- deployed: apex-research, bigbook-dev, esl-legal, mvox, operator-role, po-team, uikit-dev; new: penrose, screenwerk, raamatukoi, backlog-triage, bioforge, esl-suvekool
- **`teams/framework-research/tools/wiki-ref-audit.sh`** -- MY tool, validated S63. Repo-root `tools/` does NOT exist; always the team-scoped path.

## [PATTERN] Compact -- retained from earlier sessions
- rc-team vs hr-devs: spawning (Agent tool vs spawn_member.sh), memory (flat vs +docs/), startup (hr-devs canonical), Medici (hr-devs more detailed)
- Team sizing: size = number of distinct abstraction boundaries, not deliverables
- Multi-Round Consensus: Seed → R1 binary → R2-3 refinement → R4 PO → R5 synthesis → R6 ACK (T09)
- docs/ vs topics/: `topics/*.md` = framework design (T01-T11); `docs/*.md` = external assessments, harvests, one-shot research
- Cal reclassifies: gotchas = traps to avoid; patterns = techniques to apply; **`references/` = TTL'd operational pointers (a TTL'd entry in `patterns/` is misfiled and WILL rot -- S63)**
- Cross-team harvest envelope: narrow brief + strict read-only; quarterly + on-demand cadence
- OSS-repo structural-survey: 6-section digest template; read top-level docs first, stop early
- Role-boundary discipline: when brief ambiguous on AGENCY, default to role-boundary constraint and flag
- Soft-verdict discipline: substrate-mapping brief → table of N options x {accommodates/additive/replacement}, not "recommended" verdict
- Cross-repo glance: confirm the citation before assuming inheritance (domain-language collisions common)

## [LEARNED] Operational rules -- active
- **Read-before-Edit:** Read in same or immediately-prior tool-call batch as Edit. (wiki 116)
- **Layer-0 library-first PRE-DRAFT:** load canonical-library skill BEFORE design-content write about external substrate. (wiki 119)
- **Inverted-trigger antipattern:** on poll-based substrates, design state-write-as-wake not push-as-wake. (wiki 120)
- **Retract-with-correction:** when new evidence falsifies a prior finding, explicitly RETRACT + correct; don't silently overwrite.
- **[S62c] Label every branch of a batched shell probe; `2>&1` not `2>/dev/null` when ABSENCE is the finding.** A negative you can't distinguish from a suppressed error is not a result. Verify a broken ref's HISTORY before calling it a typo -- rot has a cause and the cause is usually the real finding.
- **[S62g] A RE-GRADE RIPPLES -- grep the whole doc for downstream claims that leaned on the old grade.** Changing a verdict = grep every downstream assertion that cited it, incl. inside the section you just wrote. **[S62l corollary] When you correct a CONFLATION, check whether the prose you're correcting FROM already commits it.**
- **[S62g] Multi-part message => multi-part ACK, itemised BEFORE starting.** The checklist is the detector, not the memory.
- **[S62e] Ask for the DEPENDENCY'S LIFESPAN before grading an abstraction layer.** "Is this layer worth it?" is unanswerable without the horizon of what it wraps. A seam is not an investment IN X -- it's what makes X's removal cheap.
- **[S62e] Shape-preserving edits:** audit a fixed repeated shape MECHANICALLY (awk/grep the spine) after editing, don't eyeball it.
- **[S63] The fragile structure is often in a DIFFERENT part of the file from your edit.** Adding 10 header lines broke `--help`, which printed a fixed range `sed -n '3,30p'` far below. Fix = delimit on CONTENT (`3,/^# (\*FR:/p`) not line numbers. Generalises the S62e shape rule: any line-number or offset dependency is a shape dependency at a distance.
- **[S63] A closing record can be PESSIMISTIC, and that's the harder direction.** Aen recorded my tool as never-done; it was committed 2min before my kill. Nobody re-checks a task they believe is still open, so a too-pessimistic record rots longer than a too-optimistic one -- and acting on it would have MINTED A DUPLICATE (2nd audit tool at repo root). **Run the tool, don't trust the note that says it doesn't exist.**
- **[S63] A staleness flag that OVERSTATES what is blocked converts a doable refresh into a permanent one** -- and it rots in a way that looks accounted-for. model-inventory sat 40 days flagged "substrate truth, needs container access"; its own Provenance said repo-roster survey. 20-minute job. **When flagging decay, state precisely which HALF is blocked.**
- **[S63] Measuring beats citing.** Went to re-send an n=1 finding; measured our own corpus instead and got both a 2nd instance AND the load-bearing subtlety (string-key 651 vs resolved-key 387 = the naive fix leaks half the benefit). The measurement, not the memory, produced the best paragraph.

## [WATCHPOINT] auto-restoration-silently-overrides-explicit-state -- n=2, watching for n=3 -- Inst1: Edit-tool harness auto-restores file-state over Read-state. Inst2: Anthropic SDK auto-restores ANTHROPIC_API_KEY over explicit authToken. Candidates: CF Worker env auto-binding, AWS/GCP SDK auto-creds, git config --system vs --local.

## [DEFERRED] Open questions (consolidated)
- Polyphony roster redesign -- awaiting PO approval. #56: cost data + unavailability protocol (paused at R2).
- 6 Aalto questions from uikit-dev harvest (Q1+Q4 > Q6+Q3 > Q2+Q5). Jira/GitFlow Phase 2 -- HELD pending PO reconciliation.
- `prompts/finn.md`: co-source-agent role-expansion AND `tools/` write-scope -- both pending Celes.
- **[S60] capture-pane DIALOG sentinel token** -- Herald §1.3 gap. IDLE=`❯`, BUSY="shimmering", DIALOG NOT captured; needs a LIVE session, not repo-derivable. If a probe runs, capture all 3 states and hand to Herald.

## [CHECKPOINT] Shipped docs -- read the doc, don't re-derive
- **S39** `docs/team-os-context-mgmt-digest-2026-06-02.md` -- 12 mechanisms. Protocol A = format-enforcer analog; their no-inter-agent-coordination blind spot = our strength.
- **S44** `docs/2026-06-06-entu-consultant-grounding-digest.md` + `-data-lifecycle-competency-harvest.md` -- 18 claims C1-C18. entu/api=Nitro file-router; `_sharing`=create-time-only; no bulk API.
- **S59** apex #176 contamination-recovery eval -- SOUND recovery, OVERCLAIMED coverage (no detection arm). Filed → wiki #158 `patterns/detection-is-upstream-of-recovery.md`.
- **S60** `designs/new/po-team/research-precedent.md` -- PO chose LITERAL tmux driving. "No precedent" RETRACTED (Hopper WS3b = existence proof). `designs/new/migration-probe-harness/harness.sh` = reusable drive loop.
- **S62** `docs/veo-78-gateway-worker-assessment-2026-08-03.md` + `docs/veo-78-explainer-2026-08-03.md` (485 lines, doc-wide rewrite S62j). VEO-78 = NOT executable as written, 4 defects. Hooks: **identity hole was CLOSED PL/SQL-side, not by a Worker** -- lead argument moved to protocol abstraction + resilience. `aud` framing = **"session validated, audience NOT"**. **§6 = the design problem VEO-78 ACQUIRED** (Worker has no user session → service token → derive-identity converts BACK to trust-the-caller; alternative = confused deputy; neither designed, Kuzmin's call). ORDS+Oracle retire 1-3yr → abstraction = MIGRATION PATH not insurance. gateway-ttcms is Java/Spring, NOT a Worker. ADR-003 §5 shared token lib DOES NOT EXIST.
- **S62m** apex `reference-integrity-audit.js` review (report was the deliverable, no doc). RAN but never FILED. Best findings: **B3 truncation obligation unreachable by construction** (`verified_class` has no slot, File never sees `all`); `verified_class` was enum-FORECLOSED not forgotten (3 orthogonal axes in one field) -- split into class+disposition fixes both; forward-dated provenance in `whenToUse`.

## [CHECKPOINT S63] Three S62 carry-forwards CLOSED
- **wiki-ref-audit.sh -- was already promoted at S62** (14:20, 2min before the 14:22 kill); Aen's rescue file was written 16:59 believing otherwise. All 5 known gaps already closed (no temp files, subshell counter fixed, `--strict`, canonical-first base precedence, `git rev-parse` for CWD). **VERIFIED by running it**: 1347 prose resolved, 3 placeholders, 2 VOLATILE, 2 UNEXPANDED, **prose 5 BROKEN + 2 VOLATILE = 7 real breaks, matches S62 exactly**; fm 214 canon / 301 DRIFT / 51 BROKEN. Exit 1/2/0 correct, runs from subdirs, `bash -n` clean. Added the /tmp-is-C7 irony to the header (assignment's only genuinely-undone piece); that broke `--help`, fixed. Rescue file DELETED.
  - **Don't misread the base counts:** S62 said 183 reporoot / 245 wikiroot; tool says 214 canon / 301 drift. Not a discrepancy -- tool tries repo-root FIRST so dual-resolving refs land canonical. S62 counted bases independently.
- **target-vs-instance FILED to Cal** (pattern, cross-team, high). apex 8x + **ours 1368 instances / 387 distinct resolved targets = 3.53x**. Key subtlety: string-key gives 651, resolved-key 387 -- **naive fix leaks half the saving**; normalise BEFORE taking the key. Recorded my own S62 error (collision theory WRONG, `EXCLUDE` designs overlap out; bug upheld, lever wrong).
- **model-inventory REFRESHED, not archived** (submitted to Cal; archive call is Aen's). **92 slots / 15 teams** vs 68/9. 33 sonnet-4-6 / 30 opus-4-6 / 16 fable-5[1m] / 10 opus-4-7[1m] / 2 ollama / 1 opus-4-6[1m]. **Top-tier 62% vs baseline 63% -- T01 tiering rule HELD while every model name turned over** (don't quote the 63→44.6% opus drop alone). **27/92 carry `[1m]`; baseline table has no column for it.** Baseline defects: ollama was 1, should be 2 (`eilama` in BOTH cb and hr-devs -- dedup-by-agent-name undercounts SLOTS); backlog-triage 4 not 6. hr-devs ref-vs-designs copies differ under `diff` but are **identical after CRLF normalization** -- Windows false positive, will recur.
  - **DESIGN-repo truth, NOT deployed.** Our own roster pins fable-5[1m] while S62 ran Opus 5 (3rd session off-pin) = in-repo roster-drift n=1 on US. `_substrate_note`: model field is documentation-only on Agent-tool arch. Only 5 of 7 `designs/deployed/` dirs carry model data, 2 in files `find -name roster.json` MISSES (`po-team/roster-design.md`, `operator-role/roster-entry.json`) -- so the ORIGINAL survey missed them too. **uikit-dev still uncountable 4 months after the baseline flagged it** -- record as a known limit, not a pending to-do.

(*FR:Finn*)
