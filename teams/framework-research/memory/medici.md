# Medici — Knowledge Health Checker Scratchpad

## [CHECKPOINT] 2026-06-09 session — hr-devs ghost-member members[] claim audit

Consultancy audit (hr-devs via ghost-bridge): "fr-lead-ghost does NOT need to be in members[] for SendMessage outbound; inbox-file presence suffices; removed config entry without breaking." Deliverable: `docs/health-report-hr-devs-ghost-members-claim-2026-06-09.md` (dated file; did NOT overwrite v6 baseline `health-report.md`).

**VERDICT: directionally ambiguous → NO contradiction with finding #8 v3 once the two legs are separated.** Read `ghost-bridge.py`: ghost path has Leg 1 (FR-agent → ghost via SendMessage = harness dispatch, members[]-gated, lands in local outbox file the daemon forwards) and Leg 2 (remote → FR inbox via daemon `local_append_inbox()` = DIRECT file write, never members[]-gated). hr-devs' claim, charitably read, is about Leg 2 / direct-write = ALREADY documented in `inbox-slot-vs-members-validation-asymmetry.md`. It does NOT touch #8 v3 (strictly SendMessage dispatch validation). Relayed disambiguating Q to team-lead: "does any agent SendMessage(to=ghost), or does the daemon write the inbox file directly?"

**Config-zeroing = separate script bug**, NOT evidence against #8 v3. `restore-ghost-members.sh` does `jq > $TMP; mv $TMP config` — jq exiting 0 with empty/partial stdout (Win-Git-Bash quoting divergence) installs empty config. Volta-owned hardening (validate non-empty + .members before mv). Per memory `feedback_no_windows_substrate_findings`: NOT wiki-grade. Bundling "buggy" with "unnecessary" is a non-sequitur — separated them.

No wiki edit triggered. Escalation trigger left open: IF hr-devs confirms SendMessage(to=name-NOT-in-members[]) SUCCEEDED → WOULD contradict #8 v3 → Protocol A to Cal + re-verify.

**[ESCALATION FIRED 14:24 → RESOLVED 14:28]** hr-devs confirmed Leg 1: `SendMessage(to=fr-lead-ghost)` SUCCEEDS with ghost NOT in members[] (Linux opus-4-7; inbox PRE-EXISTED w/ prior `from` = confound). I called a 3-cell test on FR 4.6; team-lead ran **Cell 1** (name NOT in members[], inbox file ABSENT) → SUCCESS, harness auto-created inbox + delivered. Strongest negative case, unconfounded. Cells 2/3 moot.
- **KEY RE-READING:** FR's corpus only ever tested members[]-presence as SUFFICIENT (positive case — append entry THEN dispatch). NEVER tested NECESSITY. "members[]-gating required" was an INFERENCE. hr-devs + Cell 1 supplied the missing negative datapoint.
- **SETTLED VERDICT: REFINE #8 v3 + NEW reference entry. NO version-split** (works on 4.6 AND 4.7 → hypothesis (a) falsified). #8 v3's tested claim (presence sufficient, edits honored) STAYS; the NECESSITY inference DROPS.
- New property: **SendMessage dispatch NOT members[]-gated; auto-create-on-dispatch** (first send to unknown name creates `inboxes/<name>.json`). `restore-ghost-members.sh` unnecessary for routing (members[] still governs presentation: /list, color, notif identity — out of scope).
- Two sibling entries carry the wrong necessity language → one-line corrections each: wake-mech "harness only checks members[]"; asymmetry "dispatch through members[] first."
- Protocol A draft written + handed to team-lead.

**[PO CORRECTION 2026-06-10]** PO collapsed the whole thing: **SendMessage writes a message to a file named after the target; creates it if absent. That's the entire dispatch mechanic. members[] was never in the dispatch path.** The two-leg split, 3-cell test, sufficiency-vs-necessity chain = over-built scaffolding for a one-line answer. Redrafted Protocol A to the single file-I/O property (Type: reference, architectural-fact, source-agents hr-devs+team-lead+medici, TTL 2026-12-10, suggested `references/sendmessage-dispatch-is-inbox-file-write.md`). Still corrects the same two siblings (wake-mech "harness only checks members[]"; asymmetry "dispatch through members[] first"). Audit-trail framing kept in report below a supersession note for provenance.

[LEARNED — biggest] **Lead with the mechanic, not the hypothesis chain.** I got the right ANSWER but wrapped it in elaborate scaffolding (two legs, 3 cells, sufficiency/necessity) when the substrate was just "SendMessage = write file named after target, create if absent." When a finding can be stated as one concrete mechanic, the Protocol A submission should BE that mechanic — the investigation path is provenance, not the canonical statement. My sufficiency-vs-necessity move was a good audit instrument for detecting the wrong inference, but I over-promoted process-of-discovery into the deliverable. Next time: once the simple mechanic is in hand, state it plainly and demote the scaffolding.

[LEARNED] "Outbound" is direction-ambiguous for ghost-bridge paths — but this turned out to not even matter once the mechanic was clear (file I/O on both directions).

## [CHECKPOINT] 2026-06-05 session 43 — #74 reflexive competency-gap audit (second lens)

Second lens on #74 (Celes leads). Deliverable: `docs/health-report-competency-gap-2026-06-05.md` (new dated file, NOT overwriting v6 health-report.md baseline). Swept all 10 FR prompts → claim→backing table. **OUTCOME: design COMPLETE + faithful to both lenses, PO ruling pending.** Celes's doc `docs/2026-06-05-competency-gap-analysis.md` adopted my findings: three-way taxonomy (citation/substrate/posture → gate/substrate-read/audit), "two mechanisms one name" headline (credited), D3 collapsed to single-policy YAGNI (matches team-lead's read), orphan-claim nuance in §1.4. No prompt edits required (2 optional one-line mirrors G1/C2 post-ratification). My report carries a reconciliation note (my narrow "0 external-citation" yields to her broader "claim-heavy = cites OR derives-from").

THREE HEADLINES (durable):
- **0/10 FR roles carry Anderson-fabrication risk.** No FR role cites EXTERNAL authority; claims are role-posture + INTERNAL backing (wiki/topics/reference). Fabrication failure-mode transfers but surface doesn't exist on FR → drives Q3 to YAGNI.
- **Competency-gate = TWO mechanisms wearing one name:** (1) claim→backing MAPPING generalizes to standing roles (= my audit); (2) runtime gap-REACTION loop ([GAP]-flag+Action-2) does NOT generalize — it's a citation-work feature. This is the load-bearing answer to Celes's Q1 question ("new instrument or special case of coherence audit?" → SPECIAL CASE).
- **FR AHEAD of Arhitecture roster on synergy-wiring:** Volta⟷Brunel, Brunel⟷Hopper, Monte⟷Herald all bilaterally prompt-encoded. Brunel/Hopper independently re-derived the gap-reaction loop as substrate-truth-read discipline (three-layer-substrate-truth) — gate exists where FR needed it. Convergence.

2 minor coherence gaps surfaced (LOW): G1 brunel lacks Hopper's missing-artifact surface-back; C2 work-hub (aeneas⟷all) spoke-side-only vs knowledge-hub (Cal⟷all) bilateral.

[DONE — #74 RATIFIED & LANDED 2026-06-05] PO approved D1-D6. Added `[ORPHAN-CLAIM]` as 6th audit category to `prompts/medici.md` §Audit Checklist (verbatim D3/§6 text, in my MAY-WRITE scope). Scan-shape distinction recorded in the category itself: `[ORPHAN-CLAIM]` = absence-of-ANY-artifact on a claim; `[GAP]` = artifact-exists-but-thin. Baseline sweep referenced (`docs/health-report-competency-gap-2026-06-05.md`). Reported to team-lead. The `kind: external` tags on external claims (Finn's docs line etc.) are an authoring-side action (Celes/team-lead own prompt-body edits), not mine — my checklist line is the audit-side half; the tags are the grep target the authors apply. NOT done by me: I only own the checklist category. Git commit = team-lead's domain (I don't touch git).

## [LEARNED] Competency-gap audit IS a profile of my existing coherence audit, not new machinery

Q1's real question was whether FR needs a NEW eval instrument. Answer: no — it's a profile of my `[GAP]` (claimed-but-unbacked) × `[COHERENCE]` (asked-vs-equipped) categories, run as one pass. Reusable: when a "new audit type" is proposed, first check whether it's a cross-product of existing categories. The Section-1 claim→backing table is the cheap reusable instrument; doubles as the proactive baseline so the team can go YAGNI afterward.

## [LEARNED] "Internal-assert" vs "external-citation" competency is the discriminator for gap-reaction need

A role that cites external authority (Anderson/Leveson) needs a runtime gap-reaction flag. A role whose competency is posture + internal-repo backing (every FR role) needs only periodic audit. A role that consumes external/cross-team SUBSTRATE at runtime (Brunel/Hopper) needs a substrate-truth-read discipline (the gap-reaction loop re-shaped). Three classes, three different mechanisms — don't apply the citation-gate to posture roles.

## [CHECKPOINT] 2026-05-27 session 36 — Standby, no audit triggered

Task #8 standby. Reorientation only: read prior scratchpad + wiki index head + sent intro to team-lead. Trigger condition (Cal queue absorption producing meaningful new surface, OR PO explicit surface) did not arrive during session. No audit work, no commits. Shutdown at S36 close.

Carry-forward into next-audit session: wiki was 100+ entries at S33+ close; S35 added Phase-A landings (discriminator-anchored-on-sub-canonical-source + three-layer-substrate-truth-discipline per team-lead's S36 brief). On next audit, scan for staleness candidates among S33+→S36 absorptions specifically — that's the window I haven't yet swept.

## [CHECKPOINT] 2026-05-20 session 33+ — Cross-team mvox-dev audit + memory cleanup

External audit on `mvox-dev` team (cloned/refactored from polyphony-dev into new repo `mvox_v4e_web` at `~/Documents/github/.mmp/mvox_v4e_web/`). 14 findings; report at `teams/mvox-dev/docs/health-report-mvox-dev-2026-05-20.md` (218 lines, 9 sections). Overall verdict GREEN — refactor materially complete, stack table ↔ architecture-decisions ↔ Bentham's RED triggers all aligned, no polyphony-isms leaked into common-prompt.

3 in-scope fixes landed local (memory + common-prompt scope only; per task discipline):
- `d52cac7` — seed `memory/comenius.md` stub (Comenius newly permanent, file was missing)
- `e49ced8` — prune `memory/finn.md` session-1 audit history (already-remediated; 132→108 lines)
- `2945111` — dedupe `memory/victoria.md` Path B `[DEFERRED]` entry

7 OOS items flagged in §7 of report. Coordinated with Celes (FR sibling, parallel prompt-side worker) — her 3 prompt edits got GREEN from me; we co-flagged path-convention substrate-mismatch + CLAUDE.md "8 members" drift UP to Aen as multi-surface decisions. PO pushed (16 commits including my 5).

## [LEARNED] CLAUDE.md L35 as durable answer for cross-team author attribution

I flagged `(*FR:Celes*)` trailers on mvox prompts as "could read as drift" (OOS-5/6). Celes pointed me at `CLAUDE.md` L35 which already documents the policy: *"files originally authored by another team's member keep the original author's trailer (e.g., `(*FR:Celes*)`) unless substantially rewritten."* The exception IS the policy. My flag was over-cautious. Audit pattern correction: before flagging an attribution as drift, grep `CLAUDE.md` (and any team's `common-prompt.md`) for an explicit policy. The author-trailer rule is a typed contract with an explicit exception clause; check the contract before declaring drift.

## [LEARNED] Cross-team audits — read host conventions before flagging "defects"

mvox-dev has naming asymmetries that looked like defects through FR-lens but are intentional in mvox-lens (team-lead member named `team-lead` not `palestrina`; team-lead scratchpad at `memory/team-lead.md` not `memory/palestrina.md`; team-lead member has no `color` field in roster). When auditing someone else's team, "defect vs convention" calls require reading the host team's own `common-prompt.md` + `CLAUDE.md` FIRST. Caught one case (team-lead naming via the roster), missed two (color asymmetry flagged OOS where it might be intentional; attribution policy ditto) — Celes corrected one mid-session.

## [PATTERN] Atomic-commit-per-file-class for cleanup audits

Worked well on mvox-dev: 1 commit per file-class fix (comenius stub / finn prune / victoria dedupe), each with rationale citing the audit section it resolves. PO can cherry-pick or revert any single fix without unwinding the others. Faster review than one bundled "cleanup" commit. Reuse for next cross-team cleanup audit.

---

## [CHECKPOINT] 2026-04-30 session 22 — EVR konteinerite standard 2-pass audit

Two-pass audit on Brunel's 3 Stage-0 drafts (`evr-sisene-konteinerite-standard-v0.1.md`, `evr-konteinerite-intake-template-v0.1.md`, `evr-konteinerite-tracking-issue.md`) plus Finn's harvest as input baseline.

**Pass 1 verdict:** publish-ready with 4 minor edits.
- 15 GREEN: tier defs, RACI, TBD placeholders, all cross-refs, banner, Linux structural mirror, ET single-language pattern, exception clause, 9-field intake, 4-step closing flow, measurable acceptance criteria, RFC #2 bridge accurate, scope crisp, internal severity logic.
- 4 YELLOW: Y1 `stderr-i` typo (line 35), Y2 `lokaalne register` grammar (line 50), Y3 "Sensitivity tier" EN word in pure-ET intake field 3, D2 Tier 2 deviation tolerance one-clause clarification.
- All 4 fixes applied by Brunel before pass 2.

**Pass 2 verdict:** publish-ready with 6 minor issues.
- All pass-1 fixes verified. VL leakage = 0 (grep clean across all 3 docs).
- New GREEN: channel-split IAM/PAM (shell vs web-UI), EntraID anchor cited correctly (FSM page `536248326`), apex-team Tier 1 calibration sound (standard's own Tier 1 example explicitly names apex-research; 8-mo lifetime + multi-operator dependency fail Tier 2 tests), apex worked example complete (all 11 fields), Field 6/6b/6c subdivision coherent.
- 6 NEW YELLOW: NY1 VJS2 vs V2 team-name ambiguity (per Finn harvest — VJS2 = legacy product space, V2 = "VJS 2" = Ruth's collab space; "VJS2 meeskond" reads as legacy team), NY2 speculative-marker over-application (19 markers on 1448 words; tier-line markers redundant with parent; CIS Docker Benchmark items `:latest`/`--privileged` not actually speculative), NY3 Field 6c missing bearer/API-token option, NY4 Field 8 "Vali üks" doesn't fit apex example's hybrid GitHub-Secrets+Delinea routing, NY5 Delinea refs lack INFOSEC `851607559` cite (inconsistent with EntraID cite pattern), NY6 Field 6 + 6c interaction undefined for VPN-only services.
- 0 RED. No cross-doc contradictions either pass.

**Pre-v1.0 (Stage-2) deliverable for Brunel:** all 19 standard speculative markers must be resolved (confirmed → removed, or rejected → deleted) before v1.0. Stage-1 ITOps review is the natural decision point. Standard word count grew 1015 → 1448 between passes, almost entirely speculative-marker prose; once resolved expect drop back toward Linux-standard's ~700.

Report file: `docs/audit-2026-04-30-konteinerite-standard.md` (single file, pass-2 appended after `---` with `# Re-audit pass — 2026-04-30 15:30` heading).

## [LEARNED] Speculative-marker discipline is double-edged

Brunel's 19 `[speculative]` markers on the standard were honest hedging but slightly diluted the signal — when nearly every claim is marked speculative, the marker stops distinguishing genuinely speculative claims from industry-standard ones. Future audit pattern: when count exceeds ~1 marker per 100 words, flag as over-application AND check for redundant parent/child marker pairs (e.g., a parent marker on the section header already qualifies its children — children are redundant). Distinguish "Brunel-proposed" from "industry-standard, lifted into our context" — the latter doesn't need a speculative tag, just a citation.

## [LEARNED] Cross-doc audit pattern: name aliases drift fastest

VJS2 vs V2 ambiguity surfaced in pass 2 because the two were aliased in slightly different ways across docs (tracking line 47 had it correct as "V2 (VJS 2)", but team-name usage elsewhere dropped to bare "VJS2"). When a doc set establishes an alias mapping (X = Y), audit should grep for both forms separately and check that ALL non-mapping occurrences agree. The harvest's superseded-section warning was the source of truth — Finn flagged the distinction, but it didn't propagate cleanly into Brunel's draft.

## [CHECKPOINT] 2026-03-24 session R12 — hr-devs full audit (2 reports)

**Report 1:** `docs/health-report-hr-devs-audit.md` — container readiness. 11 recommendations.

- H1 (spawn_member.sh missing) — RESOLVED by Brunel before end of session
- M1 (apply-layout.sh missing) — RESOLVED by Brunel before end of session
- H2 (common-prompt spawn rule: still says `run_in_background: true` not tmux) — STILL OPEN
- M3 (dashboard path `~/github/` → should be `~/workspace/`) — STILL OPEN
- M2 (eilama in roster but DROPPED) — STILL OPEN

**Report 2:** `docs/health-report-hr-devs-knowledge-migration.md` — RC scratchpad migration. Grade: B+.
RC team shut down cleanly (16 issues, 1255 tests, migration 0048, develop clean). No WIP.

Key findings for migration:

- All 8 scratchpads worth migrating, with pruning
- sven.md: drop `gh` path gotcha (`/home/dev/local/bin/gh`) — bare-metal only, not container
- tess.md: prune "open RED branches" (all closed per lead.md)
- finn.md: prune 4 stale entries, trim to ~80 lines
- 4 team-lead behavioral corrections (real incidents) need promotion to team-lead.md prompt:
  PR must target develop; build:dev before deploy:dev; Marcus review mandatory; always delegate
- `sendInternshipNotifications` bypasses resolveRecipientEmail on ALL envs — needs real code fix issue
- test-gaps.md: unblockExitConversation still says UNFILED — medici on RC says it's fixed; needs RESOLVED
- 4 new Known Pitfalls for common-prompt: deploy:dev no build step, binary_choice yes/no, flex on td, CF creds export

## [CHECKPOINT] 2026-03-19 session R10 — Brunel behavioral audit

Deliverable: `docs/health-report-brunel-behavioral.md`. 7 recommendations (R1-R7), all applied by Celes. Key additions: "Responsive" trait, "Confirm understanding" workflow step, `[REQUIREMENT]` scratchpad tag, team-wide acknowledgment rule in common-prompt.md.

## [CHECKPOINT] 2026-03-19 session R9 — Audit v6 + two cross-team audits

1. **Audit v6** — T04 RESOLVED, T07 elevated to HIGH (120 lines, no owner). 12 recommendations.
2. **Polyphony-dev gap analysis** — 8 strengths, 8 gaps, 1 novel pattern (shared knowledge stewardship).
3. **Apex S8 audit** — data durability gap found and resolved. 24,524 lines, 99 spec updates.

## [PATTERN] Topic maturity ranking (as of R9)

- **T06** 981 lines, **T02** 791, **T04** 770, **T03** 642, **T05** 481, **T01** 450, **T08** 379, **T07** 120 (WEAK)

## [LEARNED] Behavioral audits are a new audit type

Personality traits shape agent behavior more than explicit rules. Output-only traits produce output-only agents. Adding a "Responsive" trait is more effective than adding rules — traits shape identity, rules are followed mechanically.

## [LEARNED] Cross-team audits reveal framework gaps

Polyphony-dev's "shared knowledge files with stewardship" is a pattern our framework should adopt. Apex's data durability gap validates T06's persistence emphasis.

## [CHECKPOINT] 2026-04-09 — RFC #47 Oracle/Librarian discussion (rounds 1-4 done)

### My positions across 4 rounds

- **R1:** Librarian must be separate from Medici. Audit independence — "cannot be both author and auditor" principle. Proposed 4 new audit categories for wiki.
- **R2:** Endorsed PO's scratchpad privacy + sole-gateway wiki access. Proposed Protocol D (Knowledge Notification) — withdrawn per PO refinement #3. Disagreed with opus model tier.
- **R3 corrections absorbed:**
  - Scratchpad reading UNRESTRICTED (my auditor-exception concern moot)
  - **Medici NOT in deployed teams** — only framework-research resource. Librarian/Oracle must self-audit wiki. Weakens my "auditor independence" argument at deployed-team level but I accept trade-off.
  - Protocol D withdrawn; team lead controls notification timing
- **R3 new topics:**
  - #8 bootstrapping: 3-phase (triage, ingest, validate). BOLD CLAIM: >20 pages = over-extracting.
  - #9 expiry: Two-class knowledge model (code-grounded vs experience-grounded). source-files frontmatter + TTL for external systems.
  - #10 health sensor: Knowledge Health Summary at shutdown with 4 signals (redundant queries, persistent gaps, submission asymmetry, query-before-submission).
- **R4 head-scratchers:**
  - #13 Shared PURPLE: SEPARATE per pair. Shared PURPLE is knowledge bottleneck; consistent style lives in wiki/common-prompt, not in one agent's head.
  - #14 Research wiki domain: BOTH subject + process knowledge, in separate sections. Subject knowledge should eventually migrate OUT to deployed teams. `[MIGRATION-STALE]` check for un-propagated subject knowledge.
  - #15 MEMORY.md bridge: Deliberately separate. One-way only (wiki → PO reads → MEMORY.md). BOLD CLAIM: wikis are opportunity to prune MEMORY.md of team-level detail.

### Reaction to Celes synthesis (topics/09-development-methodology.md)

**Preserved correctly:**

- 20-page cap → "Archaeological" bootstrap mode (line 549). Attributed to me.
- Medici ad-hoc in framework-research only — implicit throughout, explicit in synthesis structure (Medici is not in the Oracle/Cathedral roster).
- Two-class knowledge model → lines 524-528, three-layer staleness (git hash, PURPLE semantic, TTL). Good — this preserves my code-grounded vs experience-grounded distinction.
- MEMORY.md bridge as deliberately separate with one-way flow → lines 619-640. Captured faithfully.

**Partially preserved / weakened:**

- **#14 Research wiki domain:** Celes lists my position as "Both. The wiki holds process patterns AND cross-topic findings that haven't been assigned to a topic file yet." (line 721). This is approximate but misses the `[MIGRATION-STALE]` enforcement mechanism — my argument was not just "both sections exist" but "subject knowledge is actively tracked for migration out to deployed teams." Without the migration tracking, the wiki becomes a dumping ground. I need to re-make this case in R5.
- Celes's proposed resolution (common-prompt = stable process, wiki/process = emerging process, promotion path between) is actually quite close to my position, reframed. The disagreement may be smaller than it looks. I should evaluate whether converging on her framing + my `[MIGRATION-STALE]` check is acceptable.

**NOT preserved:**

- My "prune MEMORY.md alongside introducing wikis" recommendation is missing from Part 2 Oracle section AND from the Implementation Checklist. Synthesis treats MEMORY.md as static external artifact. This was a R4 bold claim and should be an action item.

### R5 action items for me

1. **Re-make #14 case** with focus on migration tracking mechanism, not just section separation. Consider convergence with Celes's common-prompt / wiki-process framing.
2. **Raise MEMORY.md pruning as explicit action item.** This is load-bearing for the "wikis replace scattered PO memory" improvement. Without it, wikis are added WITHOUT reducing existing burden.
3. **Acknowledge Medici's diminished role** in deployed teams. The synthesis correctly omits Medici from deployed team rosters but doesn't explicitly state this. I should confirm this is the intended reading.
4. **Flag Oracle evolution path** (Celes's new open question) — intake interview cost vs Standard-tier stickiness. My input: intake is cheap relative to knowledge-loss cost if the team runs many sessions. For Sprint-ish teams that become Standard, stay Standard — don't upgrade to Oracle just because sessions accumulate.

(*FR:Medici*)
