# Team Health Report — 2026-03-10 (Audit v4)

(*RC-DEV:medici*)

## Summary

- **14 actions taken** — 8 prunes, 3 crosspolls, 2 fixes, 1 prompt correction
- All scratchpads within 100-line limit ✅
- Dag tag-format corrected ✅
- finn prompt corrected (braces + /v1/me warning) ✅

---

## Line counts after cleanup

| Scratchpad | Before | After | Status |
|---|---|---|---|
| tess.md | 136 | 95 | ✅ |
| marcus.md | 95 | 70 | ✅ |
| finn.md | 81 | 81 | ✅ |
| sven.md | 75 | 71 | ✅ |
| dag.md | 28 | 22 | ✅ |

---

## Changes Applied

### [PRUNED] tess.md

- Removed [LEARNED] PR #158 test coverage review (4 lines) — done work, low value
- Removed [LEARNED] 2026-02-28 PR 71 coverage gaps (6 lines) — old, superseded
- Removed [GOTCHA] SvelteKit exports (5 lines) — duplicate of Sven + Marcus entries
- Removed [DONE] Stories #202–205 RED tests (6 lines) — done
- Removed [DONE] ESLint _filterAndTransform (5 lines) — done
- [DONE] Story #169 compressed — extracted [GOTCHA]+[PATTERN] as standalone entries, removed branch/commit details
- Removed [GAP] PR #158 edge cases (8 lines) — crosspolled to test-gaps.md

### [PRUNED] marcus.md

- Removed [PATTERN] Dashboard docs — exact duplicate of common-prompt "Dashboard Docs" section
- Removed [CHECKPOINT] 2026-03-03 ESLint fix PRs #86–#96 — old history, all merged
- Removed [REVIEW] 2026-02-28 PR 71 — old, superseded by later internship work (PR #158)

### [PRUNED] sven.md

- Removed [GOTCHA] validateNpsSlider Empty String — same finding already in marcus.md [DECISION]

### [FORMAT FIXED] dag.md

- Converted `### LEARNED` / `### DEFERRED` headings to standard `[LEARNED]` tag format

### [CROSSPOLL] → test-gaps.md

Added 5 new entries:
- 1900-01-01 sentinel (dynamics-api-service.ts:237) — UNFILED bug, confirmed
- unblockExitConversation deleted_at — UNFILED bug, confirmed
- 3 internship edge-case test gaps from Tess PR #158 review

### [PROMPT FIX] finn prompt (prompts/finn.md)

- Changed `$FIGMA_PAT` → `${FIGMA_PAT}` in curl examples — without braces, token gets mangled → 403 that still counts against rate limit
- Added `/v1/me` unreliability warning — different bucket from Tier 1, not a valid readiness check
- Added `Retry-After` magnitude note (up to 4.5 days)

---

## Remaining Outstanding Items (not auto-fixed — need team-lead action)

| Item | Location | Why not auto-fixed |
|---|---|---|
| finn.md Figma section (~24 lines) | finn.md:11–33 | Prompt now has canonical rules; finn scratchpad has additional operational detail (leaky bucket, sequential sleep). Low risk to leave — it's unique content. |
| 1900-01-01 sentinel bug | test-gaps.md + finn.md | Needs GitHub issue. Story #166 covers email guard; this bug still unfiled. |
| `unblockExitConversation` bug | test-gaps.md + finn.md | Needs GitHub issue. |
| SQL injection in sync | harmony.md + finn.md | Needs GitHub issue. Different repo (sync, not conversations). |
| `personal@evr.ee` hardcode | marcus.md + finn.md | Story #166 in progress (Tess WIP) covers `sendEmployeeCommentNotification`. Marcus documents separately. Cross-referenced. |

---

## Previous Audit Findings — Status

| Finding | Previous status | Current status |
|---|---|---|
| Path vead in prompts | PARANDATUD ✅ | Still fixed ✅ |
| Finn scratchpad over 100 lines | OPEN | RESOLVED — 81 lines ✅ |
| Dag WIP PR #93 stale | OPEN | RESOLVED — dag.md cleaned ✅ |
| Dag tag format | OPEN | RESOLVED — converted to [TAG] ✅ |
| Gray-matter / $app/paths duplicates | OPEN | Already pruned by last session ✅ |
| Promote overflow-x:clip to common-prompt | OPEN | Already in common-prompt Known Pitfalls ✅ |
| Dashboard docs duplicate (marcus) | OPEN | RESOLVED — pruned ✅ |
| PR #158 edge cases in test-gaps | OPEN | RESOLVED — added ✅ |
| finn prompt $FIGMA_PAT braces | OPEN | RESOLVED — corrected ✅ |
