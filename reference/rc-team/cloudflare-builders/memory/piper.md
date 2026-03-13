# Piper — CI/CD Scratchpad

## [LEARNED] 2026-02-26 — npm audit results for hr-platform/conversations

**Total: 9 vulnerabilities — 5 high, 3 moderate, 1 low**

### High severity

| Package | Issue | Fix |
|---|---|---|
| `@sveltejs/kit` | DoS via formdata deserializer, SSRF via prerendering, CPU/memory exhaustion (experimental), depends on vulnerable `cookie` | `npm audit fix` |
| `devalue` | DoS via memory/CPU exhaustion in parse, prototype pollution via uneval | `npm audit fix` |
| `rollup` 4.0.0–4.58.0 | Arbitrary File Write via Path Traversal | `npm audit fix` |

### Moderate severity

| Package | Issue | Fix |
|---|---|---|
| `svelte` <=5.51.4 | SSR XSS via attribute spreading, `<svelte:element>` tag injection, `<option>` XSS | `npm audit fix` |
| `undici` 7.0.0–7.18.1 | Unbounded decompression chain → resource exhaustion | `npm audit fix --force` (breaking: updates `@cloudflare/vitest-pool-workers` to 0.12.17) |

### Low severity

| Package | Issue | Fix |
|---|---|---|
| `cookie` <0.7.0 | Accepts out-of-bounds chars in name/path/domain | `npm audit fix` (transitive via `@sveltejs/kit`) |

### Fix strategy

- `npm audit fix` — fixes 8 of 9 (all except undici chain), no breaking changes
- `npm audit fix --force` — fixes undici chain but is breaking (`@cloudflare/vitest-pool-workers` major bump)
- undici is a **dev/test dependency** (via miniflare/wrangler/vitest-pool-workers) — not in production runtime

### PR — MERGED 2026-02-26

- PR #61: <https://github.com/Eesti-Raudtee/hr-platform/pull/61> — merged to develop
- Fixed: devalue, rollup, svelte, @sveltejs/adapter-cloudflare + removed $app/paths from .server.ts files
- 7 remaining vulns (cookie via @sveltejs/kit + undici chain) — **[DECISION] deferred by team-lead**

### [DECISION] 2026-02-26 — Remaining 7 vulns deferred

- `cookie` <0.7.0 (low, via @sveltejs/kit): blocked upstream — fix would downgrade kit to 0.0.30. Re-check when next SvelteKit release lands.
- `undici` chain (moderate, via miniflare/wrangler): dev-only, no production risk. Re-check when Cloudflare updates wrangler/vitest-pool-workers.
- **Action:** revisit on next SvelteKit or Cloudflare toolchain update

### [GOTCHA] 2026-02-26 — @sveltejs/kit 2.53.2 breaks $app/paths in *.server.ts under Workers test

- kit 2.49.0 → 2.53.2 changed client runtime: `resolve()` from `$app/paths` pulls in window-dependent code in Workers test env
- **Fix:** Replace all `resolve("/x")` with literal `"/x"` (base="" so equivalent). Parametric `resolve("/questionnaires/[id]/show", { id })` → template literal
- **Safe in .svelte files** — $app/paths is fine client-side only
- Files fixed: `src/routes/+layout.server.ts`, `src/routes/+page.server.ts`, `src/routes/questionnaires/[id]/+page.server.ts`
- After fix: 32/32 suites pass, 302 tests green

### Note on production risk

- `undici` vulnerability is in dev toolchain only (miniflare → wrangler → vitest-pool-workers) — not exposed in production Cloudflare Workers runtime
- `svelte`, `@sveltejs/kit`, `devalue`, `rollup` are in production path — high priority to fix

## [CHECKPOINT] 2026-02-26 13:06 — session end

- No WIP for Piper — PR #61 merged to develop, all clean
- Session complete: npm audit (9 vulns found, 2 high fixed), $app/paths test fix (302 tests green)
- 7 remaining vulns deferred by team-lead (cookie + undici, both upstream-blocked)
- Next: revisit vulns on next SvelteKit or Cloudflare toolchain update

## [LEARNED] 2026-02-28 — PR 71 CI workflow review

- Tests (`@cloudflare/vitest-pool-workers`) require `npm run build:dev` first — wrangler.jsonc `main` points to `.svelte-kit/cloudflare/_worker.js` (build artifact) and `cf-typegen` generates required type defs.
- `defaults.run.working-directory` in GitHub Actions only affects `run:` steps, not `uses:` steps.
- Cloudflare Pages Git integration handles deploy — no deploy step needed in CI.

[DECISION] PR 71 CI: 6 GREEN / 2 YELLOW. Yellows: (1) no `push` trigger for develop, (2) missing deploy documentation comment. Both non-blocking.

## [LEARNED] 2026-03-05 — Dynamics MCP + departments seed (issue #66)

**Dynamics MCP built and configured:**

- Built: `dev-toolkit/mcp/dynamics/` → `dist/index.js`
- Global config: `~/.claude/mcp.json` (created fresh — no prior config existed)
- DYNAMICS_DATA_DIR: `/home/dev/github/hr-platform/conversations/docs/temp/`

**Department data source (IMPORTANT):**

- `DepartmentsV2` only has: OperatingUnitNumber, Name, PartyNumber — NO parent-child info
- Parent-child hierarchy comes from `OrganizationHierarchyPublishedV2` (fields: ChildOrganizationPartyNumber, ParentOrganizationPartyNumber, ChildOrganizationName, validTo, HierarchyType)
- Only entries where `HierarchyType === "Organisatsiooni struktuur (personal)"` go into departments table
- `OrganizationHierarchyPublishedV2.json` is NOT in docs/temp/ — only DepartmentsV2.json is

**Issue #66 seed SQL:**

- Added to `seeds/data.sql` — 4 departments: I00000 (root), I00002, I00004, I00005
- I00000 is self-referential root (parent_external_id = 'I00000')
- I00002 (personaliosakond) matches the test employee's department_number from CLAUDE.md
- valid_to = '9999-12-31T00:00:00Z' for all (active indefinitely in local dev)
