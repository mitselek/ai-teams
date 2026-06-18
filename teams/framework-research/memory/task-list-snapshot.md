# Task List Snapshot -- S58 close (2026-06-18) (*FR:Aen*)

Snapshot at session-end per shutdown procedure S2b. Supersedes S54 snapshot.

All S58 tasks complete. Migration to CLI 2.1.181 validated end-to-end; #86 closed.

| # | Task | Status | Owner |
|---|---|---|---|
| 1 | Bug A: startup.md reorder (Step 3 before 3.5) + topics/06 note | ✅ completed | volta |
| 2 | Bug A(b): courier self-mkdir inboxes_dir in validate_startup | ✅ completed | brunel (volta co-sign) |
| 3 | Bug B: identity-based stop sweep + disable Scheduled Task | ✅ completed | brunel + hopper |
| 4 | Bug C: retire explicit-fallback-between-sessions; drain fix; Direction #4 amendment | ✅ completed | brunel |
| 5 | Docs: Step 2' cold-start sentence + rotation-teardown contract + Bug-C at-scale OPEN | ✅ completed | herald + volta |
| 6 | Catalog 4 S58 gotchas (Stage-2 gated) | ✅ completed | callimachus |
| 7 | Validate fixes + execute Task-disable; gate #86 closure | ✅ completed | hopper + team-lead |
| 8 | Cross-team courier round-trip test with apex-research | ✅ completed | team-lead |

## Carry-forward (NOT tasks this session -- see NEXT-SESSION BOOT in team-lead.md)
- **inter-team-comms skill update** (stale post-S58: hardcodes static framework-research paths + disabled Task) -- TOP queued follow-up.
- Bug-B orphan-sweep live test -- optional defense-in-depth (Task source disabled).
- Bug-C at-scale OPEN (lifecycle-rework OQ#6) -- v2/RfC, only when a 2nd team migrates.
