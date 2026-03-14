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

[PATTERN] 2026-03-14 10:31 — Script-based lifecycle ops: derive paths from $SCRIPT_DIR (repo) and $HOME (runtime). No hardcoded OS paths. restore-inboxes.sh + persist-inboxes.sh = matched pair.

[LEARNED] 2026-03-14 10:31 — startup.md has hardcoded Windows paths — ALL steps broken on Linux, not just inbox restore.

[DECISION] 2026-03-14 10:31 — Proposed restore-inboxes.sh: standalone script, $SCRIPT_DIR-relative paths, self-verifying (count match), exits non-zero on failure. Design sent to team-lead.
