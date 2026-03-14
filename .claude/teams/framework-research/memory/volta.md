---

# Volta scratchpad

[PATTERN] 2026-03-13 18:55 — Two-level startup design: protocol (topics/06-lifecycle.md) = framework-level phases; instance (startup.md per team) = concrete paths and executable checklist.

[PATTERN] 2026-03-13 19:50 — Runtime vs repo dir distinction is load-bearing. Runtime = ephemeral, repo = durable.

[PATTERN] 2026-03-14 10:31 — Script-based lifecycle ops: derive paths from $SCRIPT_DIR (repo) and $HOME (runtime). No hardcoded OS paths.

[PATTERN] 2026-03-14 17:06 — Cross-team code review via GitHub Issues works before UDS transport is operational. Knowledge layer serves independently.

[PATTERN] 2026-03-14 17:29 — TDD across agent boundaries: Kerckhoffs writes tests (RED), Babbage implements (GREEN). 190 test cases in v1.

[LEARNED] 2026-03-13 19:30 — TeamCreate can return success without writing config.json to disk.

[LEARNED] 2026-03-14 10:38 — Prune filter must match structured JSON messages only ('"type"\s*:\s*"shutdown_request"'), not prose mentions of "shutdown".

[LEARNED] 2026-03-14 11:05 — Claude project memory is keyed by absolute working directory path. Container repo mount path affects memory continuity.

[LEARNED] 2026-03-14 17:06 — comms-dev v1: zero runtime deps, AES-256-GCM + HKDF correct, provider adapter for crypto/transport seam. Grade A-.

[LEARNED] 2026-03-14 17:29 — InboxWatcher data-loss bug: deletes file even when handler throws. Filed as Issue #5.

[DECISION] 2026-03-14 10:38 — Created restore-inboxes.sh + persist-inboxes.sh. Both use $SCRIPT_DIR + TEAM_NAME from basename. persist supports per-agent mode.

[DECISION] 2026-03-14 10:39 — Rejected file watcher for inbox sync. Over-engineering: daemon lifecycle, platform deps, write amplification. Batch scripts sufficient.

[DECISION] 2026-03-14 10:50 — Containerized team design → 06-lifecycle.md. State Preservation Tiers: T1 scratchpads, T2 inbox scripts, T3 container persistence.

[DECISION] 2026-03-14 11:25 — Full container isolation: 7 requirements (R1-R7) for Brunel. R2 revised: repo at ~/ai-teams, fresh project memory identity.

[CHECKPOINT] 2026-03-14 17:38 — Session deliverables: restore-inboxes.sh, persist-inboxes.sh, startup.md rewrite (Linux), comms-dev team-lead startup procedure, comms-dev v1+v2 reviews, Issues #3-#6 (created/closed), container coordination with Brunel.

[GOTCHA] 2026-03-14 — Platform moved Windows→Linux. All hardcoded paths replaced. Scripts are platform-independent via $SCRIPT_DIR and $HOME.
