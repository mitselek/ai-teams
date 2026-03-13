# Marcus — Code Reviewer Scratchpad

## [DECISION] 2026-03-12 — Review-only, no merge

Team-lead handles all merges. Marcus reviews → reports verdict → stops. Do NOT merge PRs or delete branches.

## [REVIEW] 2026-03-12/13 — Session summary (22 reviews)

| PR/Branch | Verdict | Key finding |
|-----------|---------|-------------|
| #249 intern/mentor header fix | GREEN→GREEN | FK-based `relatedEmployeeQuestionnaireId` replaces fragile role+URL param branching |
| #242 exit detail UI gaps | YELLOW→GREEN | `isHr` missing from `_load` return type annotation |
| #251 remove load return types | GREEN | 6 files, mechanical `Promise<Result<...>>` removal |
| #253 logo test link on dev | GREEN | `isDevelopment \|\| isLocalDevelopment` → `/test` |
| #256 soovitabPercent SQL fix | GREEN | Denominator: `COUNT(eq.id)` → `COUNT(CASE WHEN a.answer IS NOT NULL)` |
| #236 root redirect by role | YELLOW | `selectRole` → `/conversations` vs `load()` → `/conversations/pending` mismatch |
| #257 load return types fix | YELLOW→GREEN | Unnecessary `!` assertions in exit/[id], fixed with explicit `_load` return type |
| #261 hr-guard + nav visibility | GREEN | `hasElevatedRights !== true` (Cloudflare Access) replaces role-based check |
| #262 annual management route | YELLOW→GREEN | 301 redirect dropped sub-path; old sub-route files were dead code |
| #265 internship auto-send | YELLOW→GREEN | Sequential await → `Promise.allSettled()`, added `notified` to return |
| #266 conversations route move | YELLOW→GREEN | New index redirect pointed to old path |
| #270 stale URL fixes | YELLOW→GREEN | Email link in `show/+page.server.ts` still used `/questionnaires/` |
| #272 impersonation elevated rights | YELLOW→GREEN | `\|\|` on `hasElevatedRights` applied in production — gated with `!isProduction()` |
| #274 test row clickable | GREEN | Dev-only `/test` page, `requestSubmit()` on row click |
| #260 F2+F9 card+nav fixes | GREEN | Block `<a>` wrapping card, `isTestPage` hides nav |
| #278 F3 rating heading spacing | GREEN | `px-3` on matrix headers/cells (created PR, merged) |
| #279 #231 seed upsert fix | GREEN | 27 `INSERT OR IGNORE` → upsert `selected_role` (created PR, merged) |
| F8 smart redirect | YELLOW→GREEN | Missing year filter in COUNT query; tab pages filter by year but redirect didn't |
| F10 seed re-apply | YELLOW→GREEN | Unconditional `?raw` import bundled 82KB seed in prod; moved to dynamic import |
| #282 rating matrix filter | YELLOW→GREEN | SQL fix correct; test was false green (questionnaire ID mismatch in assertions) |
| #283 department text filter | GREEN | `<select>` → `<input type="text">` with `.toLowerCase().includes()` |
| #126 internship sticky sections | GREEN | Migration 0042 sort_order shifts verified; frontend follows exit pattern exactly |
| #215 sentinel date filtering | GREEN | `parseDateOrNull` replaces 6 `.split("T")[0]` sites; fallback chain preserved |

## [LEARNED] 2026-03-12 — Route restructuring patterns

- `/management/*` → `/annual/management/*`, `/conversations/*` → `/annual/conversations/*`
- 301 redirect on old layout must preserve sub-path: `event.url.pathname.replace() + event.url.search`
- `isAnnualSection` derived progressively simplified as routes moved under `/annual`
- Always grep for stale URL strings in email templates — not just UI routes

## [LEARNED] 2026-03-12 — Security review patterns

- `hasElevatedRights` (Cloudflare Access group) is the correct guard for HR access — NOT `selectedQuestionnaireUserRole` (user-selectable DB column)
- Any `||` fallback on `hasElevatedRights` must be gated with `!isProduction()` to avoid bypassing Cloudflare Access in prod
- `requireHrRole` checks `hasElevatedRights !== true` — strict comparison handles false/undefined/null

## [LEARNED] 2026-03-13 — Test validation patterns

- **False green tests:** When test uses `_load` to get `questions` and `answers`, verify they come from the SAME questionnaire. `LIMIT 1` may return a different questionnaire than the one seeded by the test → ID mismatch → assertions pass trivially.
- **D1 multi-statement prepare():** In some workerd contexts, `db.prepare("stmt1; stmt2").run()` only executes the first statement. Split into separate `.run()` calls per statement.
- **Vite `?raw` imports:** Top-level `import ... from "...?raw"` bundles the file into ALL builds (including production). Use dynamic `await import("...?raw")` inside environment guards to avoid shipping test data to production.

## [DECISION] 2026-03-10 — SvelteKit export rules

SvelteKit `+page.server.ts` only allows exports: `load`, `actions`, `config`, `prerender`, `csr`, `ssr`, `trailingSlash`, `entries`, or `_`-prefixed. Named function exports cause build failures. Always extract to `$lib/` modules.

## [DECISION] 2026-03-10 — Complexity refactoring patterns

- **Per-question-type dispatch:** Replace monolithic switch/case with lookup table (`Partial<Record<QuestionType, handler>>`) + pure handler functions.
- **Phase decomposition:** For orchestrator functions, extract phases returning `Result<T, E>`.
- **`Number("")` returns 0, not NaN** — always guard with `if (!value)` before `Number(value)`.

## [LEARNED] 2026-02-23

- Always delegate codebase lookups to Finn before burning own tokens
- Review checklist for D1 migrations: (1) sequence numbering, (2) SQL safety, (3) Estonian text correctness, (4) test coverage, (5) `updated_at` set
