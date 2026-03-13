---

# Volta scratchpad

[PATTERN] 2026-03-13 18:55 — Two-level startup design: protocol (topics/06-lifecycle.md) = framework-level phases and failure modes; instance (startup.md per team) = concrete paths and executable checklist.

[PATTERN] 2026-03-13 18:51 — Front-load cheapest checks to prevent costliest failures. Phase 0 (Orient) = 5 file reads, prevents 73.5k token Explore waste.

[PATTERN] 2026-03-13 19:30 — Protocol maturity progression: R1 detection → R2 orientation → R4 recovery → R5 process gaps. Pattern: detect → orient → recover → polish.

[PATTERN] 2026-03-13 19:50 — Runtime vs repo dir distinction is load-bearing. Runtime = ephemeral, repo = durable.

[PATTERN] 2026-03-13 21:28 — Protocol grades: D(R2) → D(R4) → B(R5). Shifting from design gaps to infrastructure to process gaps.

[LEARNED] 2026-03-13 18:51 — Silent acceptance of anomalous state is a protocol failure.

[LEARNED] 2026-03-13 19:30 — $HOME on Windows/Git Bash is unreliable. Use absolute paths.

[LEARNED] 2026-03-13 19:30 — TeamCreate can return success without writing config.json to disk.

[LEARNED] 2026-03-13 21:28 — Inbox durability validated in R5. COLD START + repo restore = working.

[LEARNED] 2026-03-13 21:40 — R5-1 fix: Shutdown Phase 2a = team-lead writes own scratchpad FIRST.

[DECISION] 2026-03-13 19:04 — Created `docs/restart-scorecard.md`. Append-only log per restart.

[DECISION] 2026-03-13 19:50 — Inbox durability: Shutdown Phase 4a persists pruned inboxes to repo.

[DECISION] 2026-03-13 21:28 — R5 Grade B (0C/0H/1M/1L). Inbox durability validated.

[DECISION] 2026-03-13 21:40 — R5-1 fix: Shutdown Phase 2 = 2a scratchpad → 2b snapshot → 2c notify.

[CHECKPOINT] 2026-03-13 21:45 — R6 assessment questions prepared (12 questions, 4 categories). Primary test: R5-1 verification (team-lead scratchpad). Secondary: inbox durability regression, protocol adherence regression, Grade A readiness. Questions saved below.

## R6 Assessment Questions

### A. R5-1 verification (PRIMARY)

1. Does `memory/team-lead.md` exist in repo? If yes → R5-1 VERIFIED.
2. Was it written during Phase 2a? Should contain [DECISION], [WIP], etc. — not a stub.
3. Was ordering correct? S2a (scratchpad) before S2b (snapshot) before S2c (notify).

### B. Inbox durability (REGRESSION)

4. Inboxes persisted to repo during shutdown?
5. Inboxes restored from repo during startup?
6. No /tmp usage?

### C. Protocol adherence (REGRESSION)

7. Steps in correct order?
8. Anomaly detection fired (if COLD START)?
9. Operational gate checked?
10. No name-2 duplicates?

### D. Grade A readiness

11. Any issues at all?
12. Any new failure modes?
