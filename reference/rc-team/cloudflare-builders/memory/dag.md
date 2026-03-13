# Dag scratchpad

## [LEARNED] 2026-03-10 — misc patterns

- `fix/73-no-explicit-any` branch was created FROM `fix/77-require-each-key`, so it inherited 3 unrelated commits (d12c0c7, 8007370, 6ecc698) that had to be skipped during rebase onto develop.
- Proper debounce generic: `debounce<T extends unknown[]>(func: (...args: T) => void, delay)` — callers with typed callbacks (e.g. `(value: string) => void`) work correctly.
- `ReportData` in reports/+page.server.ts: use specific repo types (SingleSelectFrequency[], etc.) with `Record<number, ...>` keys, NOT `Record<string, unknown>`.
- `d.departmentId!` non-null assertion is safe in `filterQuestionnaires` because elements are selected by `[data-department-id]:checked`.
- The Edit tool can fail with "file modified since read" — use python3 or cp from /tmp as workaround.
- `git stash` during session stores uncommitted changes; pop restores them. But cwd must be correct repo root.

## [LEARNED] 2026-03-10 — schema and query patterns

- [SCHEMA] `hr_question_comments` table has no repository — inline `db.prepare()` in every route that uses it. Top candidate for extraction to `hr-comments.repository.ts`.
- [SCHEMA] `findEmployeeQuestionnaire` return type lacks `type` field — causes an extra `SELECT type FROM questionnaires` query in `internship/[id]/` load. Worth adding to the SELECT.
- [GOTCHA] `mentor_eq` LEFT JOIN in management queries: remember to add `AND mentor_eq.deleted_at IS NULL` — easy to miss since `intern_eq` INNER JOIN has it but LEFT JOINs often don't.
- [GOTCHA] `selected_role = 'intern'` filter needed in internship management query — employees with contract dates but non-intern roles would otherwise appear.
- [PATTERN] Route SQL audit pattern: grep for `db.prepare(` in route files to find raw SQL; grep for `import.*repositories` to find repo usage. Mix = segamuster.
- [PATTERN] D1 binding is equally available in `+page.server.ts` and `+server.ts` — same `tryDatabase(platform)` call works in API routes. No blocker for fetch() → /api/* refactor.
- [PATTERN] `internship/management/` one big JOIN query is the right approach — avoids N+1 entirely. The 7–9 sequential queries in `internship/[id]/` load could use `db.batch()` for independent queries.
- [MIGRATION] 0039: UPDATE-only migration (Q16, Q23 metadata columns). Idempotent. No DDL → PRAGMA foreign_keys irrelevant. Applied via PR #158.
- [MIGRATION] 0040: Table rebuild — drops UNIQUE(employee_id, questionnaire_id), adds `related_employee_questionnaire_id INTEGER` FK (links mentor EQ → intern EQ). Replaced with two partial unique indexes (`WHERE deleted_at IS NULL`). Required PRAGMA workaround via `--file`. Applied via PR #208.
- [MIGRATION] 0041: Soft-delete Q100–Q104 (old exit reason questions replaced by Q111 reason_matrix). Simple UPDATE, no DDL. Seeds updated: removed Q100–Q102 refs, added Q111 answers for EXIT-03 and dynamics-personas. Applied via PR #223 (merged 2026-03-11).
- [SCHEMA] `employees_questionnaires.related_employee_questionnaire_id` — new FK (migration 0040). NULL for non-internship EQs and legacy intern EQs. `internship-overview.repository.ts` joins on this.
- [SCHEMA] Q111 reason_matrix answer format: `{"0":N,...,"6":N}` — N=1 (Kõige olulisem), 2 (On kaasa mõjutanud), 3 (Ei mõjutanud). 7 rows matching metadata.rows array.
- [GOTCHA] db-schema.md `## Migration Notes` section added at end (after Full ER Diagram). Future data-only migrations should be documented there too.

## [LEARNED] 2026-03-12 — reviews and query patterns

- [PATTERN] `findByFilter()` in `conversation.repository.ts` is the evaluator/approver view query. Management view uses `findAll*ByType()` — completely different WHERE conditions. Never conflate the two.
- [PATTERN] evaluator/approver tab conditions (all via `findByFilter`, discriminated by `assigned_to`):
  - pending: `assigned_to = 'evaluator'` (evaluator role) / `'approver'` (approver role)
  - in-progress: `assigned_to IN ('basic', 'approver'/'evaluator', 'human_resources')` — the opposite set
  - finished: `assigned_to = 'nobody' AND status = 'archived'` — same for both roles
  - FK column: evaluator → `eq.evaluator_employee_id`, approver → `eq.confirmer_employee_id`
- [GOTCHA] COUNT query for smart redirect: must be role-specific (two queries), must include `q.year = ?` and `employees.deleted_at IS NULL`. Using `evaluator_id = ? OR confirmer_id = ?` is wrong — conflates roles and `assigned_to` conditions.
- [GOTCHA] Adding a column to `findEmployeeQuestionnaire` SELECT affects ALL questionnaire types (annual, exit, internship). Any test that does strict `toEqual()` on the full EQ object will fail — must update every snapshot. New field `relatedEmployeeQuestionnaireId: null` broke `+page.server.existing.test.ts` in PR #249.
- [CONTRACT] `relatedEmployeeQuestionnaireId` in `EmployeeQuestionnaire` type — added in PR #249. NULL for all non-internship EQs and intern's own EQ. Non-null = mentor's EQ pointing to intern's EQ.
- [GOTCHA] Intern lookup JOIN in mentor branch: `INNER JOIN employees_questionnaires eq ON eq.employee_id = e.id WHERE eq.id = ?` — missing `AND eq.deleted_at IS NULL`. Pattern: always add deleted_at guard to every JOIN, not just the outer WHERE.
- [SCHEMA] `edasta` action in `exit/[id]/+page.server.ts`: HR-only, loops `sendExitEmployeeNotification` per recipient. `employees` array only injected into `_load` return when `isHr === true` (spread pattern). PR #248 / issue #150.
- [DECISION] No indexes on `evaluator_employee_id` / `confirmer_employee_id` for now. FK columns exist since migration 0004 with no index — table is small (hundreds of employees), D1 round-trip dominates, full scan is fine. Revisit if employee count grows to 5000+ EQs.
