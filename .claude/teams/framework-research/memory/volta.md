---

# Volta scratchpad

[PATTERN] 2026-03-13 18:55 — Two-level startup design: protocol (topics/06-lifecycle.md) = framework-level phases and failure modes; instance (startup.md per team) = concrete paths and executable checklist. Team-lead reads startup.md, not the 800-line protocol doc.

[PATTERN] 2026-03-13 18:51 — Front-load cheapest checks to prevent costliest failures. Phase 0 (Orient) = 5 file reads, prevents 73.5k token Explore waste.

[PATTERN] 2026-03-13 19:30 — Protocol maturity progression across 4 restarts: R1 detection gaps → R2 orientation gaps → R4 recovery gaps. Pattern: detect → orient → recover.

[PATTERN] 2026-03-13 19:50 — Runtime vs repo dir distinction is load-bearing. Runtime dir ($HOME/.claude/teams/...) = platform-managed, ephemeral. Repo dir (<repo>/.claude/teams/...) = team-managed, durable. Anything that must survive between sessions belongs in the repo dir, not the runtime dir.

[LEARNED] 2026-03-13 18:51 — Silent acceptance of anomalous state is a protocol failure. Protocol must force investigation.

[LEARNED] 2026-03-13 19:30 — $HOME on Windows/Git Bash is unreliable. startup.md uses absolute paths. Protocol uses $RESOLVED_HOME with validation gate.

[LEARNED] 2026-03-13 19:30 — TeamCreate can return success without writing config.json to disk. Retry with TeamDelete + re-TeamCreate resolved it.

[DECISION] 2026-03-13 19:04 — Created `docs/restart-scorecard.md`. Append-only log per restart. Scoring: CRITICAL/HIGH/MEDIUM/LOW → grade A-D.

[DECISION] 2026-03-13 19:30 — Restart 4: Grade D (2C/1H/1M/1L). Both CRITICALs were infrastructure issues. 4 of 5 R2 issues verified FIXED.

[DECISION] 2026-03-13 19:50 — Inbox durability amendment written to 06-lifecycle.md + startup.md. Shutdown Phase 4a persists pruned inboxes (last 100 msgs) to repo. Startup Step 5 restores from repo. No /tmp anywhere.

[WIP] 2026-03-13 21:20 — Restart 5 assessment prepared. This is the FIRST restart after the inbox durability amendment. Key questions below.

## Restart 5 Assessment Questions

Ask team-lead these after restart. Require raw evidence (command output, file contents) not just "yes/no".

### A. Shutdown — did inboxes get persisted to repo?

1. **Was Step S4 executed?** Show the git commit that includes `.claude/teams/framework-research/inboxes/`. If no such commit → CRITICAL: shutdown protocol not followed.
2. **Did `jq '.[-100:]'` work?** Show one inbox file from the repo dir. Is it valid JSON? Is it an array? If `jq` failed (not installed, wrong syntax, inbox format isn't an array), what error appeared?
3. **How many inbox files were committed?** Expected: one per agent that sent/received messages (at minimum: `team-lead.json`, `finn.json` if Finn was active). If zero files → CRITICAL.
4. **Were inboxes pruned?** If any inbox file has more than 100 entries, pruning failed.

### B. Startup — did inboxes get restored from repo?

5. **Was Step 5 executed?** Show `ls` of runtime inboxes dir after Step 5. Files should match what was committed in the repo.
6. **Was `/tmp/` used anywhere?** Search the process recording for any `/tmp/fr-inboxes-backup` reference. If found → team-lead fell back to old protocol (muscle memory regression).
7. **Did Step 3 (Clean) skip the /tmp backup?** The old Step 3 had `cp -r "$TEAM_DIR/inboxes" /tmp/fr-inboxes-backup`. The new Step 3 should NOT have this. Check process recording.

### C. Protocol adherence

8. **Were steps executed in order?** Check: S1 Sync → S2 Diagnose → S3 Clean → S4 Create → S5 Restore → S6 Spawn. Any reordering or skipping?
9. **Was startup.md read FIRST?** Or did team-lead explore/grep before reading it?
10. **Was the operational gate (Step 4b) checked?** config.json verified before any spawn?

### D. Edge cases

11. **What was the diagnose result?** WARM RESTART (expected if runtime dir survived) or COLD START (if dir was cleaned between sessions)? Either is valid — but COLD START with repo inboxes proves the amendment works (repo survived even though runtime didn't).
12. **Did agent messaging work after restore?** Could team-lead SendMessage to spawned agents successfully?

### Scoring rubric

- **A (clean):** All questions answered satisfactorily, no deviations
- **B (minor):** 1-2 LOW/MEDIUM issues, protocol followed but with minor hiccups
- **C (significant):** 1+ HIGH issue OR 3+ MEDIUM, protocol partially followed
- **D (failing):** Any CRITICAL issue — core functionality broken
