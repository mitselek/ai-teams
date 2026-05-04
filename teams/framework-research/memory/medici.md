# Medici — Knowledge Health Checker Scratchpad

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
