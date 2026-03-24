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

(*FR:Medici*)
