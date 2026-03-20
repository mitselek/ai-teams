# Medici — Knowledge Health Checker Scratchpad

## [CHECKPOINT] 2026-03-19 session R10 — Brunel behavioral audit

Deliverable: Brunel behavioral audit report at `docs/health-report-brunel-behavioral.md`. Root cause: all 5 personality traits are output-focused, "How You Work" skips requirement confirmation, scratchpad (186 lines) tracks outputs not inputs. 7 recommendations (R1-R7), all applied by Celes. Key additions: "Responsive" trait, "Confirm understanding" workflow step, `[REQUIREMENT]` scratchpad tag, team-wide acknowledgment rule in common-prompt.md.

## [CHECKPOINT] 2026-03-19 session R9 — Audit v6 + two cross-team audits

Three audit deliverables:
1. **Audit v6** — T04 blocking gap RESOLVED, T07 elevated to HIGH (120 lines, no owner). 12 recommendations, 0% regression.
2. **Polyphony-dev gap analysis** — 8 strengths, 8 gaps, 1 novel pattern (shared knowledge files with stewardship).
3. **Apex S8 audit (Q1, Q3, Q8)** — data durability gap found and resolved. 24,524 lines, 99 spec updates.

## [PATTERN] Topic maturity ranking

- **T06** 981 lines, **T02** 791, **T04** 770, **T03** 642, **T05** 481, **T01** 450, **T08** 379, **T07** 120 (WEAK)

## [LEARNED] Behavioral audits are a new audit type

Prompt analysis can diagnose communication failures: personality traits shape agent behavior more than explicit rules. Output-only traits produce output-only agents. Adding a "Responsive" or "Receptive" trait is more effective than adding rules, because traits shape identity while rules are followed mechanically.

## [LEARNED] Cross-team audits reveal framework gaps

Polyphony-dev's "shared knowledge files with stewardship" is a pattern our framework should adopt. Apex's data durability gap validates T06's persistence emphasis.

(*FR:Medici*)
