# Sven — Personal Scratchpad

## [GOTCHA] 2026-02-25 — Windows Scoop Shims + Node child_process

`execFile('pandoc', args)` hangs on Windows when pandoc is a Scoop shim. Fix: use `spawn(cmdLine, { shell: true })` with a pre-built command string, or `exec()`. Avoid passing args array with `shell: true` (Node DEP0190 warning).

## [GOTCHA] 2026-02-25 — Pandoc + XeLaTeX Speed

pandoc + xelatex takes ~8-9s per conversion on this machine. Default vitest timeout (5s) is too low for integration tests — set `testTimeout: 30000` in vitest.config.ts.

## [GOTCHA] 2026-03-02 — Local Branch Name != Remote Branch Name

Local branch names can drift from remote names when pushing with `git push origin local:remote`.
Always verify with `git branch --show-current` and use explicit refspec when needed.
`git checkout <remote-branch>` when behind requires `git pull` first.

## [GOTCHA] 2026-03-02 — ESLint Svelte Patterns

- `$state+$effect` anti-pattern → use `$derived` instead
- `new Map` in Svelte 5 → use `new SvelteMap` for reactivity
- `resolve()` from `$app/paths` (NOT `resolveRoute`) for no-navigation-without-resolve rule
- `<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->` for server-dynamic URLs
- `<!-- svelte-ignore -->` only suppresses Svelte compiler warnings, not ESLint
- Linter auto-fixes unrelated files on save → always revert out-of-scope changes before committing

## [PATTERN] 2026-03-09 — SSR Component Testing with svelte/server render()

Use `render()` from `svelte/server` to test component HTML output in workerd pool. Works for verifying CSS classes, DOM structure, and prop rendering without a DOM environment. See `tests/lib/components/RatingMatrix.test.ts` for example.

## [GOTCHA] 2026-03-09 — overflow-x-auto Blocks position: sticky

CSS spec: `overflow: auto/scroll/hidden` on an ancestor creates a new scroll context, breaking `position: sticky` on descendants. Fix: use `overflow-x: clip` which clips overflow without creating a scroll context.

## [GOTCHA] 2026-03-10 — SvelteKit Invalid Exports from +page.server.ts

SvelteKit only allows `load`, `actions`, `config`, `prerender`, `csr`, `ssr`, `trailingSlash`, `entries`, or `_`-prefixed exports from `+page.server.ts`. Exporting helper functions (validators, handlers) directly from route files causes `npm run build` to fail. Move extracted functions to `$lib/` modules instead.

## [PATTERN] 2026-03-10 — TDD GREEN Workflow

Consistent flow across 6 stories (#179–#205, #212):
1. Checkout branch → read RED tests → read source
2. Implement (extract functions, refactor to delegate)
3. Run quality gates: `npm run tests` → `npm run check` → `npm run lint`
4. Fix prettier (`npx prettier --write`), re-run lint
5. Commit → push → `gh pr create --base develop`
6. Report to team-lead via SendMessage

## [PATTERN] 2026-03-10 — Pure Function Extraction + Lookup Table

For reducing cyclomatic complexity in large switch/case or if-else chains:
- Extract per-case logic into named exported functions
- Build `Partial<Record<EnumType, HandlerFn>>` lookup table
- Dispatch via `lookup[key]?.(args)` — eliminates switch entirely
- Used in: validators (#203), processors (#202), sync phases (#205)

## [DECISION] 2026-03-10 — Module Organization for Exit Route

- Validators: `src/lib/validators/exit-validators.ts` (pure functions, no D1)
- Handlers: `src/lib/services/exit-handlers.ts` (D1-dependent, business logic)
- Route file: only `load`, `_load`, `_actions`, `actions` (SvelteKit-valid)
- Tests import from `$lib/` paths, not from route files

## [GOTCHA] 2026-03-10 — D1 Test Cleanup FK Constraints

When tests create EQ rows and answer rows, cleanup must delete answers BEFORE deleting the EQ — otherwise FK constraint fails. Order: `DELETE FROM answers WHERE employee_questionnaire_id = ?` then `DELETE FROM employees_questionnaires WHERE id = ?`.

## [REVIEW] 2026-03-11 — PR #245: Parim praktikant scoring (#235)

**Verdict: GREEN** — scoring logic correct, UI tie handling solid.

**Scoring:** `SUM(6 - CAST(je.value AS INTEGER))` → col1=5pts, col5=1pt. `json_each` + row count filter excludes stale keys. Only finished/archived mentor EQs scored. Period filter applied.

**Tie handling:** `bestInterns: string[]` — all tied interns included. Empty array when no scores.

**UI:** Single name for 1 winner, dropdown for ties. KPI card uses absolute positioning, table uses inline — correct for each context.

**Minor (non-blocking):** `departments: departments` could be shorthand.

## [GOTCHA] 2026-03-12 — Quality gate is npm run check, not tsc --noEmit

TS check quality gate is `npm run check` (runs `svelte-check`, ~1561 pre-existing errors baseline). Do NOT use `tsc --noEmit` — it gives different error counts and is not what CI runs.

## [GOTCHA] 2026-03-12 — D1 UNIQUE constraint silently drops INSERT OR IGNORE rows

`employees_questionnaires` has `UNIQUE(employee_id, questionnaire_id) WHERE related_employee_questionnaire_id IS NULL`. Test seeds using `INSERT OR IGNORE` with same employee+questionnaire pair silently skip rows. Always use distinct employees per EQ in test data.

