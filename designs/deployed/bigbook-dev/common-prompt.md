# BigBook Dev — Common Standards

## Team

- **Team:** bigbook-dev
- **Mission:** Build the bigbook bilingual reader — an Astro + TypeScript web app that renders the AA Big Book (*Anonüümsed Alkohoolikud*, 4th edition) in English and Estonian side by side, lets GitHub-authenticated visitors edit the Estonian text and leave comments, and versions every change through commits against the bigbook repository.
- **Deployment:** Independent deployment target (not the existing GitHub Pages Jekyll site). Exact target chosen at the bootstrap story.
- **Pipeline tier:** Cathedral-lite (team-lead as navigator/architect, single XP triple)

### Members

- **plantin** (team-lead / navigator / architect), **montano** (RED), **granjon** (GREEN), **ortelius** (PURPLE)

### XP Pipeline

- Plantin (decomposition) → Montano (RED) → Granjon (GREEN) → Ortelius (PURPLE)
- **Execution mode:** Sequential. One acceptance criterion at a time through the full cycle.

## Workspace

**Project:** `~/Documents/github/bigbook/`

The web app lives as a subdirectory of the existing Jekyll repository. The team writes only inside `app/` and `.claude/teams/bigbook-dev/`. The existing Jekyll site (`_config.yml`, `peatykid/`, `kogemuslood/`, `lisad/`, `front_matter/`, `index.md`, `TOC.md`, `_layouts/`, `_includes/`, `_sass/`, `_source/`) is **off-limits** to the team. See "Coexistence Boundary" below.

```
bigbook/
├── _config.yml                     # Jekyll — OFF-LIMITS
├── peatykid/  kogemuslood/ ...     # Jekyll content — OFF-LIMITS
├── assets/
│   ├── AA-BigBook-4th-Edition.pdf         # EN authoritative source (read-only)
│   ├── BIGBOOK EST PRINT + crop marks.pdf # ET authoritative source (read-only)
│   └── css/                                # Jekyll CSS — OFF-LIMITS
├── app/                            # THE TEAM'S TERRITORY
│   ├── src/
│   │   ├── components/             # Astro/Svelte/JSX components
│   │   ├── content/                # Astro content collections
│   │   │   ├── en/                 # English chapters (populated by one-shot subagents + users)
│   │   │   └── et/                 # Estonian chapters (populated by one-shot subagents + users)
│   │   ├── lib/                    # Pure logic: alignment, github, auth, diff
│   │   ├── pages/                  # Astro routes
│   │   └── styles/
│   ├── tests/                      # Vitest test files
│   ├── stories/                    # Story files (one per story)
│   ├── docs/
│   │   ├── spec.md                 # Authoritative product + technical spec
│   │   ├── WORKFLOW.md             # XP pipeline process contract
│   │   └── decisions/              # ADRs
│   ├── public/                     # Static assets served by the app
│   ├── astro.config.mjs
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── eslint.config.js
│   ├── lefthook.yml
│   └── README.md
└── .claude/teams/bigbook-dev/      # roster, prompts, common-prompt
    └── memory/                     # agent scratchpads
```

## Coexistence Boundary

The bigbook repository contains **two independent products** that share a git history:

1. **The existing Jekyll site** (all top-level content directories, `_config.yml`, `_layouts/`, `_includes/`, `_sass/`, `_source/`, `assets/css/`). Serves the Estonian edition as static HTML at GitHub Pages under `/bigbook/`.
2. **The bilingual reader web app** (everything inside `app/`). Serves the bilingual side-by-side experience from a separate deployment.

**The team works exclusively inside `app/` and `.claude/teams/bigbook-dev/`.** The Jekyll site is not ours to edit, reformat, lint, or "improve while we're here." Any change that would alter the Jekyll site's rendered output — including touching `_config.yml`, moving files out of `peatykid/`, or modifying `assets/css/` — **requires explicit PO approval through Plantin**.

The two authoritative PDFs in `assets/` (`AA-BigBook-4th-Edition.pdf` and `BIGBOOK EST PRINT + crop marks.pdf`) are the source of truth for the book's text. They are **read-only** for the team. Content extraction and initial bilingual alignment are performed by one-shot anonymous subagents spawned by Plantin as needed — they are not the dev team's responsibility, and ongoing alignment maintenance after user edits is the end user's responsibility, not the team's.

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata.

**REQUIREMENT ACKNOWLEDGMENT:** When you receive a message containing new requirements or instructions, acknowledge EACH item explicitly before beginning work.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*BB:<AgentName>*)`.

| Output type | Placement |
|---|---|
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading |
| Code comment (where warranted) | At the end of the comment |
| Git commit message | In the commit body |

## Stack

- **Language:** TypeScript 5 (strict mode — `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Runtime:** Node 22+
- **Framework:** Astro 5 with Markdown content collections
- **UI components:** Astro components by default; an island framework (Svelte or solid-js) may be introduced for interactive islands only after explicit spec approval
- **Auth:** GitHub OAuth. Default: PKCE flow with client-side GitHub API calls (no dedicated backend). Alternative with server-side GitHub App is reserved for a scope decision if PKCE proves insufficient.
- **Tests:** Vitest 2.x with `@testing-library/*` for component tests
- **Linting:** ESLint 9 with `@typescript-eslint`
- **Formatting:** Prettier 3.x
- **Pre-commit:** lefthook
- **Deployment:** Independent from the Jekyll `/bigbook/` GH Pages deploy. Target chosen in the bootstrap story (Cloudflare Pages, Vercel, or Netlify are the expected shortlist).

### Type Discipline

- No `any` — anywhere
- No `!` non-null assertions
- No `@ts-ignore`
- `@ts-expect-error` only with a comment explaining why and how to remove it
- All "one of N kinds" types are discriminated unions, not string enums
- `switch-exhaustiveness-check` on all domain unions (e.g., `EditState`, `AuthState`, `ParagraphStatus`)

### Architecture Boundary

The app is organized in three concentric layers:

- **`app/src/lib/`** — pure, headless, testable domain logic: alignment, diff, GitHub API wrappers, auth state machines. **Must not** import from `components/`, `pages/`, or any UI runtime (`astro:*`, `svelte`, etc.).
- **`app/src/components/`** — UI components. Depend on `lib/`. Must not import from `pages/`.
- **`app/src/pages/`** — Astro routes. Depend on `components/` and `lib/`. Top of the dependency graph.

ESLint `no-restricted-imports` enforces this at Layer 2. Inner layers never import from outer layers.

## The Hard Invariant

**Bilingual alignment integrity.** Every paragraph in the English content collection has exactly one paired paragraph in the Estonian content collection, identified by a stable `para-id` of the form `<section>-<ordinal>` (e.g., `ch01-p007`, `appA-p003`). Edits may change text but must **never** break the mapping. The reader's scroll-sync, the edit UI, and the pink-background diff marker all depend on this invariant.

This is the single most important rule in the codebase. All paragraph-level operations — rendering, editing, committing, diffing, commenting — are keyed on `para-id`. No operation is allowed to orphan, duplicate, or renumber a `para-id`.

When writing or reviewing code, ask: *"Does this operation preserve alignment integrity? After this change, does every `para-id` in EN still have exactly one pair in ET, and vice versa?"* If the answer is not obviously yes, something is wrong.

A secondary invariant is derived from this one: **anonymous read-only**. Any code path that mutates content collections or calls the GitHub API must verify an authenticated session first. An unauthenticated visitor must never be able to produce a commit.

## XP Development Pipeline

### The Cycle

For each **story**, Plantin decomposes into acceptance criteria, then runs:

```
Plantin assigns AC to Montano
   |
   v
┌──────────────────┐
│  MONTANO (RED)   │  Write one failing test
│  sonnet          │
└────────┬─────────┘
         v
┌──────────────────┐
│ GRANJON (GREEN)  │  Minimum code to pass
│  sonnet          │
└────────┬─────────┘
         │ GREEN_HANDOFF
         v
┌─────────────────────┐
│ ORTELIUS (PURPLE)   │  Refactor with judgment
│  opus               │
└──────────┬──────────┘
         │
         ├── ACCEPT → CYCLE_COMPLETE → next AC
         └── REJECT → back to GREEN
              (3 strikes → escalate to Plantin)
```

### Message Types

#### TEST_SPEC (Plantin → Montano)

```markdown
## Test Spec
- Story: <story-id>
- Test case: <N of M> — <one-line description>
- Preconditions: <what must be true before this test>
- Expected behavior: <what the test asserts>
- Constraints: <boundaries>

### Acceptance criteria
<specific, testable conditions>

### Spec reference
<relevant section(s) from app/docs/spec.md>
```

#### GREEN_HANDOFF (Granjon → Ortelius)

```markdown
## Green Handoff
- Story: <story-id>
- Test case: <N of M>
- Files changed: <list>
- Test result: PASS (all tests green)
- Implementation notes: <shortcuts taken, what's ugly, what GREEN knows is suboptimal>
- Commit: <sha>
```

**Implementation notes are mandatory and must be honest.** Ortelius needs context. An empty notes field is a protocol violation and Ortelius will reject-with-guidance.

#### PURPLE_VERDICT (Ortelius → Granjon or Plantin)

```markdown
## Purple Verdict
- Story: <story-id>
- Test case: <N of M>
- Verdict: ACCEPT | REJECT
- Rejection count: <N>

### Changes made (if ACCEPT)
<list of refactoring actions taken>
<commit sha>

### Rejection reason (if REJECT)
<specific structural issue>

### Guidance for GREEN (if REJECT)
<concrete direction>

### Escalation (if rejection_count >= 3)
<full rejection chain summary for Plantin>
```

#### CYCLE_COMPLETE (Ortelius → Plantin)

```markdown
## Cycle Complete
- Story: <story-id>
- Test case: <N of M> — DONE
- Total cycles: <how many GREEN→PURPLE round-trips>
- Final commit: <sha>
- Quality notes: <structural observations>

### Ready for next test case: YES | NO (explain)
```

## File Ownership (Temporal Ownership Model)

Within the pipeline, agents hold the write-lock sequentially. No merge conflicts.

| Domain | Write-lock holder | Notes |
|---|---|---|
| `app/stories/` | Plantin (Lead) | Story files and decomposition |
| `app/tests/` | Montano (RED) | Test files, fixtures, vitest config |
| `app/src/` production code | Granjon (GREEN) → Ortelius (PURPLE) | Sequential handoff |
| `app/docs/` | Plantin (Lead) | Spec, workflow, ADRs |
| `app/src/content/en/` and `app/src/content/et/` | **Neither** | Populated by one-shot subagents (initial) and the web app's users (ongoing). Tests must use fixtures under `app/tests/fixtures/`, never touch real content. |
| Everything outside `app/` | **Neither** — off-limits (Coexistence Boundary) | Any change to Jekyll files or root configs requires explicit PO approval via Plantin. |

## Quality Gates

### Layer 1 — Phase gates

Per `app/docs/WORKFLOW.md`. Enforced by the performing agent, verified by the next.

### Layer 2 — Pre-commit (lefthook)

1. `tsc --noEmit` — strict config, zero errors
2. `eslint` — zero warnings
3. `prettier --check` — formatting clean
4. Architecture: no `components/` or `pages/` imports from `lib/`; no `pages/` imports from `components/`
5. Content guard: no commit under `app/src/content/en/` or `app/src/content/et/` from the dev team (enforced by a lefthook script that blocks staged diffs in those paths unless an explicit `CONTENT_BOOTSTRAP=1` env flag is set; the flag is only used by Plantin's one-shot bootstrap subagents)
6. Type hygiene: no `any`, no `!`, no `@ts-ignore`
7. Boundary guard: no staged diffs outside `app/` or `.claude/teams/bigbook-dev/` unless `JEKYLL_CROSSOVER=1` is set with PO approval recorded in the commit body

**`vitest run` is NOT a per-commit gate** — RED commits must contain failing tests by design.

### Layer 3 — Story acceptance

Before Plantin hands a story to PO:

1. `npm run typecheck` — clean
2. `npm run lint` — exit 0
3. `npm run format:check` — exit 0
4. `npm run test` — all tests pass
5. `npm run test:coverage` — coverage thresholds met (`app/src/lib/` ≥ 90% lines/functions/statements, ≥ 85% branches)
6. `npm run build` — Astro build succeeds with zero warnings
7. Every AC went RED → GREEN → PURPLE
8. Plantin reviewed commits against the spec
9. PO explicitly accepts

## Scope Restriction

**This team builds what the spec defines and nothing more.** If a task looks like a scope expansion beyond the spec, agents escalate to Plantin. Plantin escalates to PO.

"Scope expansion" explicitly includes:
- Touching any file outside `app/` or `.claude/teams/bigbook-dev/`
- Adding dependencies not in the stack contract
- Introducing a second UI framework
- Producing a dedicated backend when the PKCE client-side flow is still viable
- Rewriting paragraphs in `app/src/content/` (only one-shot subagents or end users do that)

## Client Communication

**PO-only.** Team may draft messages; PO sends them.

## Shutdown Protocol

1. Write in-progress state to your scratchpad at `.claude/teams/bigbook-dev/memory/<your-name>.md`
2. If you are PURPLE and mid-refactor: revert uncommitted changes and note what you were doing in scratchpad
3. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]`, `[UNADDRESSED]` (1 bullet each, max)
4. Approve shutdown

Team-lead shuts down last, commits memory files, pushes.

## On Startup

1. Read your personal scratchpad at `.claude/teams/bigbook-dev/memory/<your-name>.md` if it exists
2. Read `app/docs/WORKFLOW.md` — the XP cycle protocol
3. Read the spec at `app/docs/spec.md` (at least the sections relevant to current work)
4. Send a brief intro message to `team-lead`

(*FR:Celes*)
