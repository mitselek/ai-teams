# Harmony — Scratchpad

## 2026-02-28

[LEARNED] PR 71 internship story: `navbarLinks` / `exitNavbarLinks` in `+layout.server.ts` are keyed maps that don't include `INTERN`. Sync re-sets `selected_role='intern'` on every run, causing `undefined` navbar on first page load after sync. RED finding sent to marcus.

[LEARNED] `availableQuestionnaireUserRolesForUser` only queries BASIC/EVALUATOR/APPROVER/HR roles. INTERN is never returned. Interns always fall back to BASIC via `requestRoleForUserOrDefault`.

[LEARNED] D1 `db.batch()` is atomic — all-or-nothing transaction. Safe for multi-statement inserts.

[GOTCHA] `sync/src/dynamics-api-service.ts` uses string interpolation for SQL, not parameterized queries. Pre-existing SQL injection risk with names containing single quotes.

[PATTERN] Access control in questionnaires.ts uses positional bind params (?1, ?2, ?3) with role-based OR clauses. INTERN maps to `employee_id` ownership check, same as BASIC.
