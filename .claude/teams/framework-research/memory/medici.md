# Medici — Knowledge Health Checker Scratchpad

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
