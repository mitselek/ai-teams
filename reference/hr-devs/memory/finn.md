# Finn's Scratchpad

## [LEARNED] 2026-03-09 — SENDING status stuck bug (annual conversations)

Root cause: `management/finished/+page.server.ts` `send` action sets all conversations to SENDING (db.batch) BEFORE calling Dynamics API. If `saveAndCollectResponses` throws (Promise.all + reject) or worker times out, second db.batch never runs → conversations stuck in SENDING permanently. No recovery path in code. Fix: reset via D1 SQL, then code fix with Promise.allSettled + try/catch + batch size limits. Also: `employeeCanViewQuestionnaire` (helpers.ts:307) doesn't handle SENDING → employees see blank card.

## [LEARNED] 2026-03-06 — MCP servers assessment

**Do NOT adopt Cloudflare workers-bindings MCP.** d1_database_query has no read-only mode, hits production DB. Real incident: WHERE-less UPDATE = $5K. Svelte MCP (community) is Svelte 4, outdated. Stick with local miniflare + existing dynamics MCP only.

## [GOTCHA] Figma API — correct curl pattern and rate limit discipline

**Correct curl pattern** — MUST use `${FIGMA_PAT}` (braces), NOT `$FIGMA_PAT`:
```bash
source ~/.claude/.env && curl -s -H "X-Figma-Token: ${FIGMA_PAT}" "https://api.figma.com/v1/files/FILE_KEY?depth=2"
```
Without braces, the token gets mangled and returns 403 — but that 403 STILL COUNTS against the rate limit.

**How Figma rate limits actually work (researched 2026-03-09):**
- Algorithm: **leaky bucket** per user, per plan. Tracked per-user for PATs.
- 3 endpoint tiers. `/v1/files/:key` and `/v1/files/:key/images` = **Tier 1** (heaviest).
- Our seat: likely View/Collab on Pro plan = **6 requests/month** for Tier 1 (!). Dev/Full seat on Pro = 15/min.
- `X-Figma-Rate-Limit-Type: low` = View/Collab seat. `high` = Dev/Full seat.
- The 429 response SHOULD include `Retry-After` (seconds) and `X-Figma-Rate-Limit-Type` headers — always check and log them.
- Multi-day Retry-After (390000s = 4.5 days) is a known issue for "low" tier users on Pro plans (forum reports confirm).

**Operational rules:**
- **NEVER parallelize Figma calls** — always sequential with mandatory `sleep 30` between each response and the next call.
- NEVER retry after 429 — respect `Retry-After` header value exactly.
- Always log full response headers on 429 (`curl -D -`) to capture Retry-After.
- Plan all calls upfront. Budget: max 3 calls per research task.
- `/v1/me` is NOT a reliable readiness check for `/v1/files/` — different tier/bucket.
- If our seat is View/Collab (6/month Tier 1), we must be EXTREMELY conservative — every file fetch counts for the entire month.

## [LEARNED] Figma REST API is read-only for design content

Cannot create nodes/components. Only writes: dev_resources + comments. Plugin API needed for component creation.

## [GOTCHA] Python inline scripts in bash

Bash tool mangles `!=` to `\!=` in `-c` strings. Use heredoc + temp file instead.

## [LEARNED] hr-platform known bugs (confirmed present on develop 2026-03-10)

- `unblockExitConversation()` broken: sets exit_blocked=0 but leaves deleted_at set (Bug 3)
- `sendEmployeeCommentNotification` in `email.sender.ts:28` hardcodes `personal@evr.ee`, no `resolveRecipientEmail()` guard (Bug 4)
- SQL injection via template literals in `dynamics-api-service.ts:283–291` (Bug 2)
- NOTE: `pointsToScore()` entry removed — never verified as actual bug

## [LEARNED] VL Jira project structure

4 epics: VL-2 (Aastavestlus), VL-3 (Katseaja), VL-4 (Praktika), VL-5 (Lahkumis). 56/100 orphans. VL-179–198 = 20 PO questions (AK-1…AK-20). As of 2026-02-28: 99 open issues (count may be stale).

## [LEARNED] MCP server stdio patterns

Package: `@modelcontextprotocol/sdk` + `zod@3`; ESM. Never `console.log()` — corrupts JSON-RPC. Tool registration: `server.registerTool(name, {inputSchema}, handler)`. Config: `.mcp.json` at repo root.

## [LEARNED] 2026-03-10 — Routes architecture

All page routes (`+page.server.ts`) use direct repository imports → D1. Zero use `fetch()` → `/api/*`. API routes (`/api/management/*`) called externally from .svelte buttons or cron. 20 page routes + 5 API routes + 4 layout guards. Full unification plan: `/tmp/routes-unified-report.md` (dashboard: "Routes Unification Plan").

## [LEARNED] 2026-03-10 — Dynamics seed candidates (#155)

8 employees selected: HR (0913 Jaamul, 0019 Mazur-Nikolajev, 0240 Rand), managers (0597 Kalmus/KESKLADU, 0845 Kilin/TO1010), basic (0002 Štšedrin, 0028 Ivanov, 0039 Demidjuk). Dept KESKLADU/TO1010/TO3010 missing from seeds/data.sql.

## [LEARNED] 2026-03-10 — i18n research findings

~190 unique string keys in code (19/40 svelte files + 11 ts files). Question/option content DB-stored (~200+ strings, separate strategy). No existing i18n infrastructure. Recommendation: **Paraglide.js** (`@inlang/paraglide-sveltekit`) — compile-time, Cloudflare Workers compatible, tree-shakeable, full TS safety. Cookie-based locale (no URL prefix, avoids Story G clash). Effort: Large, 3 phases: Phase 1 UI strings (~2-3d), Phase 2 email templates (~1d), Phase 3 DB content (separate XL story). Report: `/tmp/i18n-research-report.md` (dashboard: "i18n Research Report").

## [LEARNED] 2026-03-11 — #148 reason_matrix per-row comments

- `ReasonMatrix.svelte` does NOT exist yet — `QuestionDispatcher.svelte` has no REASON_MATRIX case (falls to CommentBox)
- Q111: reason_matrix, sort_order=1, 7 rows × 3 cols (migration 0034)
- Answer stored as JSON in `answers` table via `collectAnswers` (no type-specific logic)
- `hr_question_comments` infrastructure is ready: `collectHrComments` handles 3-part key `hrComment:qId:rowIdx`, serializes per-row to JSON
- `loadHrComments` returns raw JSON for matrix questions — consumer must parse
- Template: `RatingMatrix.svelte` (60 lines, Svelte 5 `$props/$state/$derived/$effect`)
- Types: `ReasonMatrixMetadata { columns, rows }`, `ReasonMatrixAnswer { ratings, comments }` in `src/lib/types.ts:221,240`

## [LEARNED] 2026-03-11 — PR #208 migration 0040 (internship)

- Migration 0040: full table rebuild of `employees_questionnaires`, adds `related_employee_questionnaire_id INTEGER`
- Replaces inline UNIQUE with two partial indexes: `WHERE related_employee_questionnaire_id IS NULL` and `IS NOT NULL`
- No conflict with 0039. Manual migration (PRAGMA foreign_keys = OFF needed)
- Risk: `SOOVITAB_QUESTION_TEXT` constant in PR #208 — fragile text-based Q21 lookup
- `getInternshipOverviewData` already has `InternshipOverviewFilters { from?, to? }` + `buildDateFilter()`
- Intern EQ creation loses `ON CONFLICT` idempotency after table rebuild

## [LEARNED] 2026-03-11 — #132 perioodifilter scope

- `PeriodPicker.svelte`: form POST `/?/selectYear`, props `years/selectedYear`, annual-only; lives in `management/+layout.svelte`
- `selectYear` action: `src/routes/+page.server.ts:45–58`; cookie: `annual-questionnaire-selected-year` via `types.ts:122–132`
- 9 routes consume `getAnnualQuestionnaireGlobalParams()`: 5 management + 3 conversations + 1 layout
- Exit report (exit-report.repository.ts): zero date filtering on all 4 query functions
- Internship: PR #208 already has `InternshipOverviewFilters { from?, to? }` and `buildDateFilter()`
- Spec: presets (`all/current-month/past-month/current-year/past-year`), URL `?period=`, `resolvePeriod(type,value)`, remove cookie
- 4 sub-stories: A (period.ts lib + PeriodPicker rebuild, ~0.5d), B (annual 9 routes, ~1.5d), C (exit + report filtering, ~1.5d), D (internship, ~0.5d, depends PR #208)
- Story G URL unification sequencing risk for sub-story B
- Report: `/tmp/i132-research.md`
