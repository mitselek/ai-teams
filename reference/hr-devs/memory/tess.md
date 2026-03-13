# Tess — Test Engineer Scratchpad

## [LEARNED] 2026-02-23 — Migration data correctness test pattern

- Query seeded DB directly: `SELECT metadata FROM questions WHERE id = X`, parse JSON, assert
- Put migration tests in `tests/migrations/` folder
- Use `buildEnvironmentVariables(cloudflareEnv)` from `tests/test-environment.ts`
- No `beforeAll` needed — `apply-migrations.ts` seeds data automatically

## [LEARNED] 2026-02-25 — 1900-01-01 sentinel bug (FIXED PR #289, 2026-03-13)

- Was: `dynamics.ts:511` only checked null/falsy EndDate, did not filter `"1900-01-01T00:00:00Z"`
- Fixed via `parseDateOrNull()` in PR #289 + migration 0043

## [GOTCHA] 2026-03-12 — +page.svelte cannot be rendered in workerd pool

- `$app/forms` (`enhance`) references `window` at module load time → `ReferenceError: window is not defined`
- ANY `+page.svelte` that uses `enhance` or other client APIs will fail in SSR render tests
- Solution: test server logic via `_load` instead; expose flags (e.g. `isHr`) in return value for template gating

## [PATTERN] 2026-02-25 — User story assessment approach

- Read doc → identify coverage claims → read actual src/ code → compare
- Look for: enums, helper functions, API routes not in stories
- Key files: `types.ts`, `helpers.ts`, `hooks.server.ts`, `+layout.server.ts`, all `+page.server.ts`, `src/lib/services/`
- Doc-only pass misses most bugs — always do the codebase comparison pass

## [GOTCHA] 2026-03-12 — multi-statement prepare().run() only executes first statement

In workerd/miniflare D1, `db.prepare("INSERT ...; INSERT ...; INSERT ...").run()` only
executes the FIRST statement. Use separate `.run()` calls for inserts into different tables:
```typescript
await db.prepare(`INSERT INTO employees ...`).run();
await db.prepare(`INSERT INTO employees_questionnaires ...`).run();
await db.prepare(`INSERT INTO answers ...`).run();
```
Exception: a single INSERT with multiple value rows `VALUES (1,...), (2,...), (3,...)` works fine.

## [GOTCHA] 2026-03-10 — Each describe block needs its own D1 seed

Each top-level `describe` block may run in its own D1 context — each describe needs its own `beforeAll` with seed data (use `INSERT OR IGNORE` for idempotency). [from Story #169, PR #182]

## [PATTERN] 2026-03-10 — "HR manager not found" 500 test

Run in a `describe` block BEFORE seeding the I00002 employee — so the test exercises the missing-manager path. [from PR #182]

## [GOTCHA] 2026-03-10 — employees_questionnaires UNIQUE constraint in seed data

- `employees_questionnaires` has `UNIQUE(employee_id, questionnaire_id)`
- Each EQ targeting the same questionnaire MUST use a distinct employee
- D1 may report UNIQUE violations as "FOREIGN KEY constraint failed" — misleading error
- `db.batch()` with `INSERT OR IGNORE` does NOT suppress FK/UNIQUE violations in D1 (propagates)
- Use sequential `.run()` calls in FK dependency order: questionnaire → employees → questions → EQs → answers

## [PATTERN] 2026-03-12 — UNIQUE constraint workaround for multi-EQ test seeds

Migration 0040 keeps `UNIQUE(employee_id, questionnaire_id) WHERE related_employee_questionnaire_id IS NULL`.
To seed N EQs for N different evaluator/approver users without violating the constraint:
- **Option A (preferred)**: use distinct worker employees per EQ (same questionnaire_id, different employee_id)
- **Option B**: use distinct questionnaire IDs per EQ (same worker, different questionnaire — e.g. EVALUATOR uses Q=960, APPROVER uses Q=961)
- **Avoid**: INSERT OR IGNORE silently drops constraint-violating rows — tests stay RED for wrong reasons

## [PATTERN] 2026-03-12 — APPROVER vs EVALUATOR tab filter fields

Smart redirect in `/annual/conversations/+page.server.ts` must use role-specific FK field:
- EVALUATOR: filter by `evaluator_employee_id = user.id`
- APPROVER: filter by `confirmer_employee_id = user.id`

Tab definitions per role:
- pending:     EVAL → `assigned_to='evaluator'`;  APPR → `assigned_to='approver'`
- in-progress: EVAL → `assigned_to IN (basic,approver,hr)`;  APPR → `assigned_to IN (basic,evaluator,hr)`
- finished:    both → `assigned_to='nobody', status='archived'`

## [PATTERN] 2026-03-12 — Catching SvelteKit redirect in tests

SvelteKit `redirect(302, url)` throws an object `{ status, location }` (NOT an Error).
Use `catchRedirect` pattern — NOT `catchAsyncError`:
```typescript
async function catchRedirect(fn) {
  try { await fn(); return {}; }
  catch (e: any) { return { status: e.status, location: e.location }; }
}
```
`catchAsyncError` is for guard errors (HttpError with `.status === 404`).

## [GAP] 2026-03-13 — Notification system coverage gaps (#294 audit)

Server-side (well covered):
- `action-adapter.test.ts` — flash set, commentError, errorMessage, redirect all tested
- `layout.server.test.ts` — flash:{ success:"" } in load return verified (empty case only)
- `annual/[id]/+page.server.existing.test.ts` — `errorMessage` content ("Kõik väljad...") asserted
- `exit/`, `internship/` tests — commentError + errorMessage patterns covered

GAPS (untested):
1. `flash.ts` unit — `getAndClearFlash` with actual cookie content never tested (only empty "" case in layout test)
2. Annual flash success messages ("Esitatud!", "Tühistatud!" etc.) only tested via action-adapter mock, not via real page.server actions
3. `internship/[id]/+page.server` flash messages — not verified end-to-end
4. `ErrorMessage.svelte` component — no test file exists
5. `+page.svelte` inline error rendering — untestable in workerd pool (window ref issue)

Also: "Comment is required" error string is English (possible inconsistency with Estonian UI).

## [PATTERN] 2026-03-12 — Test ID ranges (updated)

- 600–870: taken (various stories)
- 880–939: available
- 940–942: hooks.server.test.ts (impersonation #272)
- 960–971: annual/conversations/+page.server.test.ts (smart redirect #260)
- Use 972+ for next new test files in this area


