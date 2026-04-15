# Team-Lead Scratchpad (*FR:team-lead*)

## NEXT SESSION

**Context:** 2026-04-15 morning session closed clean. Three agents contributed: Finn (Jira/GitFlow Phase 1 digest + accountId→identity lookup), Celes (Finn + Brunel prompt-letter surgical fixes, n=3 scope-drift pattern surfaced, team-lead prompt deferred to design round), Callimachus (filed wiki #39 `patterns/scope-block-drift-from-practice.md`, cluster 6 members, first multi-gate entry). External deliverable: `Eesti-Raudtee/dev-toolkit#43` — issue with full digest + 10 questions for Kuzmin (Source 2 author) + Sildnik (Source 1 v3 editor), plus team-lead shift-assessment comment. **Next session topic is OPEN — PO brings the task at session start.**

[DECISION 2026-04-15 close] **Next session: task TBD from PO.** When task arrives, route by topic: (a) Phase 2 Jira/GitFlow resume if PO has answers from Kuzmin/Sildnik on dev-toolkit#43 — wake Finn for partial-or-full classification; (b) persist-coverage Fix/Design ship if pivot signal; (c) fresh task — spawn specialists per need. Do NOT self-wake any agent on parked items.

[PARKED — Phase 2 Jira/GitFlow classification] Held pending PO reconciliation via dev-toolkit#43. Candidates already listed in `docs/jira-gitflow-assessment-2026-04-14.md` Observations section (3 pattern, 1 gotcha, 2 decision, plus "two authoritative docs in one space silently diverge" meta-gotcha). Wake Finn with Q1/Q2/Q4 subset when answers arrive.

[NEXT-SESSION-CHORE] **Prune Finn's scratchpad** at spawn time — `memory/finn.md` is ~190 lines, target is 100. Session-8 uikit-dev harvest entries (around CHECKPOINT 2026-04-14 + the 30-line detail below) can collapse to a 3-line pointer to `docs/uikit-dev-harvest-2026-04-14.md`. Finn flagged this himself at shutdown — do it during the spawn brief, not as a separate task.

[DECISION 2026-04-14] **Pivot to uikit-dev continues in the background.** Harvest docs from today's session are `docs/persist-coverage-audit-2026-04-14.md` (Volta) and `docs/uikit-dev-harvest-2026-04-14.md` (Finn) — required reading IF Fix/Design session is triggered. Not required for the Jira pipeline assessment session.

[DECISION 2026-04-14] **6 Aalto open questions DEFERRED from routing.** Finn's Section D has 6 questions priority-ranked P1-P3. PO + team-lead agreed to defer all 6 — no tmux-direct this session. Re-evaluate at next natural uikit-dev contact point.

[DECISION] **Phase 1 Oracle→Librarian steal-back COMPLETE** — committed `04522c7` on main. Callimachus's prompt ported 10 lessons from the Eratosthenes replication plus Path Convention section (closes the deferred Path Convention patch from 2026-04-13 morning). Routing table dual-sourced into common-prompt.md. 4 Protocol A wiki entries filed (conv-as-retroactive-telemetry, rule-erosion-via-reasonable-exceptions, named-concepts-beat-descriptive-phrases, why-this-section-exists-incident-docs) — wiki now 28 entries.

[DECISION] **Phase 2 Oracle→Librarian machine identifier rename COMPLETE** — committed `ca0e56f` on main. roster.json agentType, callimachus.md + eratosthenes.md (snapshot) YAML templates + state.json refs, all 28 wiki frontmatters, types/t09-protocols.ts string literals, `git mv oracle-state.json librarian-state.json`. Grep-clean.

[DECISION] **Apex-research Phase 2 directive delivered to Schliemann via tmux-direct** at session close. Schliemann must mirror-apply: roster agentType, eratosthenes.md YAML + state refs, wiki filed-by frontmatters, git mv state file, restart Eratosthenes. Report back via whatever channel is available. Technique saved in auto-memory as `reference_tmux_direct_cross_team.md`.

[WIP] **Structural-discipline cluster Protocol C promotion.** 4 confirmed members (Pass 1/Pass 2, within-doc grep, protocol-shapes-typed-contracts, dual-team-dir-ambiguity) + 1 pending (Brunel's prompt-to-artifact cross-verification). This session qualifies as the ≥2-session calibration that Brunel was holding for, but no promotion was drafted — defer to a framework-research session once Brunel is spawned.

[WIP] Cross-pollination meta-pattern wiki entry (Cal background housekeeping).

[WIP] **Substrate-invariant-mismatch pattern candidate (n=2, supporting n=3)** — flagged by Cal 2026-04-14 after filing `persist-project-state-leaks-per-user-memory.md` (#38). Shape: "syntactically correct code, invariants don't hold on this substrate." Two primary instances now cross-referenced bidirectionally:
- `dual-team-dir-ambiguity.md` (path-ambiguity variant, Eratosthenes first boot)
- `persist-project-state-leaks-per-user-memory.md` (wrong-substrate variant, script mirror semantics this session)
Third supporting data point from Volta's 12:54 audit (Flag 1): v0.3 skill-integration patches reference `$TEAM_DIR` ambiguously — same root cause as dual-team-dir-ambiguity applied to a NEW consumer (skill files). Evidence the original gotcha has broad-consumer scope. n=2 qualifies for pattern promotion; Cal held back per delivery-window freeze. Candidate names: `substrate-invariant-mismatch` or `right-code-wrong-substrate`. Queue for next non-freeze framework-research session — Cal drafts, team-lead reviews.

[WIP] **Persist-coverage ship — SPLIT into two sessions (PO-approved 2026-04-14).** Sources: `docs/persist-coverage-audit-2026-04-14.md` (Volta) + `docs/uikit-dev-harvest-2026-04-14.md` (Finn). Rationale for split: the latent bug fix is small and surgical and doesn't need the design context; the design work needs a focused session. Don't block one on the other.

**Fix session (near-term, small surgical scope — can ship outside a full framework-research session):**
- **F1. `restore-inboxes.sh` jq filter extraction + semantic resolution.** Latent bug from Finn A7+B6. FR's existing `framework-research/restore-inboxes.sh` has inline shell-escaped jq filter (`"\"type\"\\s*:\\s*\"shutdown_request\""`). uikit-dev already broke and fixed this by extraction to a sibling `restore-filter.jq` file (their commit `1deb90e`). FR's filter ALSO has semantic divergence from theirs: ours uses structural JSON match, theirs uses free-string match. Empirically our structure-match seems to work (23-inbox restore this session didn't produce stale shutdown leaks) but that's not a proof of correctness. Task: (a) extract to sibling `restore-filter.jq` with existence-check, (b) test both patterns against real `inboxes/*.json` samples to pick the correct one, (c) update `persist-inboxes.sh` path-resolution if parallel fix needed, (d) ship as one surgical commit. Owner: Volta. Blocking on nothing; can ship anytime.
- **F2. Nomenclature rename "memory" → "auto-memory" for the runtime per-user path.** The word "memory" is overloaded between `.claude/teams/<team>/memory/` (team scratchpads, in-repo, durable) and `~/.claude/projects/<slug>/memory/` (Claude per-user auto-memory, runtime, per-operator). That overload is exactly why the persist-project-state leak was easy to introduce. Rename in-place across Volta's WIP scripts, design docs v0.1-v0.3, protocol-a draft, and Cal's gotcha (where appropriate). Grep-clean check post-edit. This is F-session because it's mechanical and unblocks the Design session from having to qualify "memory" in every prose paragraph. Owner: Volta + Cal (coordinated — Volta does scripts/docs, Cal updates gotcha with terminology). Can ship anytime after F1.

**Design session (future focused framework-research session, full team context):**
- **D1. Mitigation FIRST** — Option (c) target-dir refusal with `git check-ignore` opt-in, shared helper `_substrate-check.sh` sourced by both persist scripts. Not (a), not (b), not layered. Rationale: (c) detects the ground-truth invariant at the write site; opt-in inverts (b)'s fail-open into fail-closed with explicit team assertion.
- **D2. THEN** marker file `.project-dir-name` re-creation (Flag 3: order matters — re-creating marker without mitigation re-enables the exact defect Cal filed).
- **D3. Flag 1 fix:** v0.3 skill patches must declare Path Convention or anchor `$TEAM_DIR` to `$REPO`. Sibling fix to `dual-team-dir-ambiguity.md`.
- **D4. Script-level defects:** `persist-project-state.sh` atomic wipe-then-copy via trap; `persist-session-logs.sh` cross-operator tarball collision guard.
- **D5. Read uikit-dev MANIFEST as reference.** `Eesti-Raudtee/evr-ui-kit:develop:.claude/teams/uikit-dev/ephemeral-snapshot-2026-04-14/MANIFEST.md` documents what to preserve (config, inboxes, session PID, task highwatermark, tasks/.lock, per-user memory) and what NOT (conversation logs, tool-result cache, subagent transcripts — 21MB reconstructable). Uikit-dev's mode is one-shot pre-maintenance directory commit, not lifecycle automation — different cadence from Volta's scripts. Both patterns are valid, pick per-use-case.
- **D6. `protocol-a-submission-draft.md` disposition:** HOLD (not stale, don't delete). Pre-ship: add STATUS UPDATE annotation noting mitigation must be integrated into submission body. Post-ship: revision pass to incorporate substrate-hazard sibling. Route direct to Cal via dual-hub rule (no team-lead intermediate).
- **D7. Softer flags (non-blocking):** Flag 2 — strip absolute byte counts from protocol-a draft (replace with structural claims). Flag 4 — fix `<agent-name>` literal placeholder in v0.3 skill patch prose.

[WIP] **Cal post-freeze candidates (from Finn harvest 2026-04-14 13:35)** — three Protocol A submissions queued for post-delivery-window:
1. **Pane-labels gotcha addendum** — uikit-dev's `b47544b refactor(team): unify agent names — use codenames everywhere` revealed six decoupling sites (roster, inbox filenames, prompt filenames, pane labels, SendMessage targets, config.json members) — pane labels were the visible tip, the iceberg is structural. This is NOT n=2; it's root-cause confirmation of Cal's existing n=1 at a deeper layer. Update the gotcha with an addendum citing b47544b as cross-team cross-confirmation. True pattern-promotion n=2 would require a second TEAM with the same root cause — Finn suggests cheap follow-up check of `cloudflare-builders`, `raamatukoi-dev`, `screenwerk` rosters.
2. **Memory-as-load-gated-surface pattern candidate** — uikit-dev's `e4a5c86` + `2970bd6` + `e543109` together demonstrate that a full auto-memory layout (user/feedback/project/reference/scratchpad) can be collapsed to (feedback.md + scratchpads) with the rest migrated to wiki without loss, yielding cleaner load semantics. Memory becomes load-gated: auto-load only behavioral rules and scratchpads, everything else is read-on-demand wiki. Candidate pattern entry, source: uikit-dev develop commits.
3. **Wiki governance model split** — project-handbook (distributed writes, flat, cheap-to-update) vs methodology-kb (librarian-gated, taxonomic, dedup-disciplined). Load-bearing split: a project handbook needs update rate matching codebase change rate; a methodology KB needs dedup and cross-team consistency. Lower priority than (1) and (2) — wait for a third data point before filing as a pattern. NOT substrate-invariant-mismatch territory, do not wire into Cal's n=2 candidate.

[WIP] **Aalto open questions from harvest (Finn Section D)** — 6 questions queued for optional tmux-direct routing decision:
1. Is `memory/feedback.md` auto-loaded by platform or convention?
2. Issue #92 pruning vs Rams's in-flight `task/92-missing-tokens` branch — cadence consistency check.
3. Wiki flat-vs-taxonomic — explicit architectural choice or default?
4. Does uikit-dev have a librarian-equivalent role? (Roster has none — write discipline enforced how?)
5. Is `b47544b` the only rename or second in a series?
6. Did uikit-dev explicitly reject Protocol A/B or never consider it?
Priority-ranked by Finn: Q1 + Q4 highest (scaling evidence), Q6 + Q3 medium (design intent), Q2 + Q5 lower (validation). Decision deferred — team-lead routes subset via tmux-direct when next contact with Aalto is warranted.

[LEARNED 2026-04-14] **Cross-team harvest pass produces n-way gains that within-team audit cannot.** Finn's harvest caught: (a) latent bug invisible to Volta's audit because her scope was the NEW scripts, not the EXISTING ones — cross-team view naturally expands audit scope; (b) taxonomic rigor on n=1 vs n=2 that within-team synthesis can't force — only external evidence can distinguish "deeper view of same instance" from "second independent instance"; (c) architectural divergence framing that reframes design options from "convergence vs correction" to "load-bearing domain split." Repeat pattern: periodic cross-team harvest passes by Finn, independent of active joint work, are a high-leverage synthesis mechanism. Cadence TBD but "quarterly + on-demand when a sibling team ships a major refactor" is a reasonable starting point.

[LEARNED 2026-04-14] **Nomenclature overload is infrastructure debt.** Both FR and uikit-dev use the word "memory" for two distinct filesystem paths with two distinct substrate semantics: (1) `.claude/teams/<team>/memory/` (team scratchpads, in-repo, durable) and (2) `~/.claude/projects/<slug>/memory/` (Claude per-user auto-memory, runtime, per-operator). When Volta's script name is "persist-project-state.sh" and Cal's gotcha is "persist-project-state-leaks-per-user-memory.md", the "memory" in both refers to (2), NOT (1) — and that ambiguity is the exact reason the leak was easy to introduce and hard to notice. Worth fixing the nomenclature (e.g., call (2) "auto-memory" everywhere) before the ship session.

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

## Session: 2026-04-14 evening + 2026-04-15 morning — Jira/GitFlow assessment + prompt-letter audit + issue #43 hand-off

**Team:** Callimachus + Finn + Celes. Brunel/Monte/Volta/Herald/Medici not spawned.

**Rhythm:**

- Startup Steps 1-5 clean (git pulled, runtime clean, TeamCreate success, 23 inboxes restored).
- Cal spawned → health report (Phase 2 active, wiki 38 entries pre-session, WIP items noted), idle.
- Finn spawned for Phase 1 Jira/GitFlow read-and-digest of VJS2 Confluence pages 1163755527 + 1660518403. Confluence REST API v2 access via `~/.claude/.env` creds. Delivered `docs/jira-gitflow-assessment-2026-04-14.md` (5 divergences, 10 questions). Key finding: two pages architecturally incompatible — Source 1 (Kuzmin+Sildnik, v3 2026-02-09) names `production` branch and long-lived `release/*`; Source 2 (Kuzmin, v1 2026-04-13) is textbook 5-branch git-flow with short-lived `release/*` closed by `git flow release finish`. Working theory: Source 2 is a fresh "going forward" doc that may not have reconciled with Source 1.
- Finn write-path ambiguity: his prompt's CRITICAL section listed only `memory/` + `topics/*.md`, but uikit-dev harvest precedent had already established `docs/`. Finn flagged rather than improvising. Team-lead redirected to `docs/`, noted prompt-letter gap for Celes.
- Celes spawned for surgical prompt audit. Delivered Finn diff (3-line change — topics/ clarifier + docs/ bullet with negative boundary) AND cross-cutting check: found second latent gap in Brunel's prompt (internal contradiction — line 130 instructs promotion to `docs/` but MAY WRITE doesn't authorize). Volta/Herald latent, deferred per YAGNI.
- Celes Protocol A draft routed to Cal with n=3 team-lead addendum (`aeneas.md` has same letter-lags-practice shape — Edit/Write restricted but prompt edits routine, e.g. `04522c7`). Cal filed as `wiki/patterns/scope-block-drift-from-practice.md` (#39, 38→39), cross-credited celes + team-lead, framed team-lead instance as "load-bearing". Structural-discipline cluster now 6 members, first multi-gate entry flagged for cluster health monitoring.
- Finn + Brunel diffs both applied verbatim (Brunel got both Change 1 required + Change 2 tightening). Team-lead prompt revision deferred (Celes flagged coordinator-only-by-conviction identity makes mechanical fix unsafe — needs design round, not diff).
- User standing rule added to auto-memory: "when fixing prompts, always consider Cal Protocol A routing as option, not extra step" (see `feedback_prompt_fixes_consider_cal.md`).
- Phase 2 classification HELD: PO knows Source 2 author (Kuzmin), will reconcile two pages externally before wiki filing. Finn idled with full ack.
- **External deliverable:** GitHub issue `Eesti-Raudtee/dev-toolkit#43` created with full digest + 10 questions for the author(s). English kept (per PO). Unassigned. Finn side errand: resolved accountIds to Valeri Kuzmin (Source 2 sole + Source 1 originator, `valeri.kuzmin@evr.ee`) + Andres Sildnik (Source 1 v3 editor, `andres.sildnik@evr.ee`). Issue #43 updated: context paragraph + both Authors lines now link to Jira profiles by name instead of accountIds.
- Shift-assessment comment posted by team-lead to issue #43: wholesale adoption = major (git-flow CLI is ~80% of friction + Jira-as-source-of-truth reversal); selective adoption of process patterns (2-day cap, reverse-transition, bug-vs-rework, weekly cadence) = medium and worth doing; git-flow-only = high shift for low payoff.
- All three agents shut down at session close. Inboxes persisted, state committed.

[CHECKPOINT] Wiki 38 → 39 entries. Two prompts revised surgically (Finn, Brunel). One GitHub issue created (dev-toolkit#43) with 10-question hand-off to VJS2 author. Team-lead prompt + broader 12-prompt audit both on Celes queue pending PO greenlight. Phase 2 Jira/GitFlow classification parked.

[LEARNED 2026-04-15] **Scope-block drift is a three-instance pattern.** Celes's "read 2-3 more prompts" move after the Finn fix caught Brunel AND surfaced the team-lead variant via my own n=3 addendum. The audit-beyond-the-ticket discipline is a repeatable move worth codifying as a Celes workflow step rather than relying on her judgment each time.

[LEARNED 2026-04-15] **accountId → identity lookup is a one-call side errand.** Jira REST API v3 `/user?accountId=X` endpoint resolved both Kuzmin and Sildnik including emails (EVR Atlassian instance defaults to in-org email visibility). Cheap enough to include in any future multi-page Confluence harvest's provenance section as names-not-ids from the start.

[LEARNED 2026-04-15] **External-system assessment digests are high-leverage when paired with a GitHub issue hand-off.** The digest becomes PO-facing reconciliation material the moment it's lifted into an issue — author gets a clean question list, PO gets a structured conversation. Pattern worth repeating for future Confluence audits.

[LEARNED 2026-04-15] **Team-lead prompts resist mechanical fixes — "identity load-bearing" sections need design rounds.** Celes caught that the naive `prompts/` → ALLOWED Edit/Write addition would undermine coordinator-only-by-conviction discipline. Right fix is "allowed ONLY for applying specialist-proposed revisions, never originate" — a design, not a diff. Generalizable: any FORBIDDEN-section item that encodes identity (not just scope) needs review, not surgery.

[DEFERRED 2026-04-15] **Team-lead prompt revision.** Celes on queue for design round. Proposed shape in her scratchpad.

[DEFERRED 2026-04-15] **Broader 12-prompt scope-block audit.** Celes offered ~1h pass; not started this session.

---

## Session: 2026-04-14 (midday) — Cleanup + Volta audit + Finn uikit-dev harvest

**Team:** Callimachus + Volta + Finn. Brunel/Monte/Celes/Herald/Medici not spawned (not needed for this scope). Aalto contacted once via tmux-direct (login code paste, pre-harvest).

**Rhythm:**

- Startup Steps 1-5 executed cleanly (git pull, TeamCreate, 23 inboxes restored).
- Janitorial discovery: `project-memory/` (36 files, ~175KB of per-user auto-memory) + `.project-dir-name` marker found untracked in repo — output of a prior Volta `persist-project-state.sh` dry-run against workstation substrate. Team-lead deleted both before commit.
- Wiki batch committed (`441be40`) — 3 pending Cal entries (tmux pane labels/format + librarian growth curves) plus index and scratchpad updates.
- Cal spawned → filed `wiki/gotchas/persist-project-state-leaks-per-user-memory.md` (#38), committed `f8cb4e8`.
- Volta spawned → delivered `docs/persist-coverage-audit-2026-04-14.md`, committed `37a0833`. Mitigation chosen: Option (c) target-dir refusal with `git check-ignore` opt-in, shared helper. Four structural-discipline flags surfaced, two ship-session blockers (Flag 1, Flag 3).
- PO pivot mid-session: pull from `Eesti-Raudtee/evr-ui-kit`. Main updated (4 commits, 72 files, +207K lines Figma pipeline). Develop branch checked out locally, 15 commits touching `.claude/teams/uikit-dev/` since last cross-read.
- Finn spawned → harvested uikit-dev develop, delivered `docs/uikit-dev-harvest-2026-04-14.md`, committed `d805b5c`. Key finds: A7 latent bug in FR's own `restore-inboxes.sh` (inline jq), A10 ephemeral-snapshot MANIFEST as empirical reference for Volta's ship session, B3 wiki governance divergence framing, B7 pane-labels gotcha is root-cause confirmation not n=2.
- Ship-session split applied: Fix session (F1 jq extraction + F2 nomenclature rename, surgical, near-term) vs Design session (D1-D7 full persist-coverage ship, focused framework-research session). Committed `76c7820`.
- QoL fix: `core.safecrlf = false` set globally to silence LF/CRLF chatter.
- Side task: cloned `mitselek/bigbook` into `~/Documents/github/.mmp/bigbook` (unrelated to FR, delegated housekeeping).
- 5 commits pushed to origin/main: `441be40`, `f8cb4e8`, `37a0833`, `d805b5c`, `76c7820`.

[CHECKPOINT] Wiki 37 → 38 entries. Two new doc artifacts in `docs/`. Ship-session backlog split and indexed. Six Aalto questions queued and deferred. Scratchpad updated with F/D session split, two new [LEARNED] entries, 6-question Aalto deferral.

[LEARNED 2026-04-14] **Restraint compounds: when safety submissions produce pattern-candidate byproducts, flag them and move on — don't draft them same-session.** Cal's filing pattern this session (gotcha #38 + 3 Cal candidates queued for post-freeze) is the second time restraint during freeze yielded a cleaner pattern surface than an impatient draft would have. Generalizable: the discipline of "I see the pattern, I will not draft it now" is itself information-preserving.

[WARNING] **Team-lead coordinator-only discipline slipped early in the session.** Before Cal/Volta/Finn were spawned, team-lead did execution work (tmux-direct paste to Aalto, bigbook clone, initial clutter deletion, wiki batch commit, reading persist script headers). The scripts-reading specifically was Volta's territory; the user correctly flagged the slippage. Post-slippage the discipline held. Going forward: prefer spawn-before-act even for cheap one-offs during warmup.

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
