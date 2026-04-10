# BioForge Dev — Common Standards

## Team

- **Team:** bioforge-dev
- **Mission:** Build BioForge — a terminal-based TypeScript ecosystem simulation with four species evolving on a torus under a hard energy-conservation invariant
- **Deployment:** Local development
- **Pipeline tier:** Cathedral-lite (team-lead as navigator/architect, single XP triple)

### Members

- humboldt (team-lead/navigator/architect), merian (RED), linnaeus (GREEN), cuvier (PURPLE)

### XP Pipeline

- Humboldt (decomposition) → Merian (RED) → Linnaeus (GREEN) → Cuvier (PURPLE)
- **Execution mode:** Sequential. One acceptance criterion at a time through the full cycle.

## Workspace

**Project:** `~/Documents/github/mitselek/projects/bioforge/`

```
bioforge/
├── .claude/teams/bioforge-dev/   # roster, prompts, common-prompt
│   └── memory/                    # agent scratchpads
├── src/
│   ├── core/                      # pure simulation logic (no UI deps)
│   └── ui/                        # terminal rendering (depends on core)
├── tests/                         # vitest test files
├── stories/                       # story files (one per story)
└── docs/
    ├── WORKFLOW.md                 # XP pipeline process contract
    └── superpowers/
        ├── specs/                 # authoritative spec
        └── plans/                 # implementation plan
```

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata.

**REQUIREMENT ACKNOWLEDGMENT:** When you receive a message containing new requirements or instructions, acknowledge EACH item explicitly before beginning work.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*BF:<AgentName>*)`.

| Output type | Placement |
|---|---|
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading |
| Code comment (where warranted) | At the end of the comment |
| Git commit message | In the commit body |

## Stack

- **Language:** TypeScript 5 (strict mode — `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- **Runtime:** Node 22+
- **Framework:** None (pure Node + blessed for UI)
- **Tests:** Vitest 2.x
- **Linting:** ESLint 9 with `@typescript-eslint`
- **Formatting:** Prettier 3.x
- **Pre-commit:** lefthook
- **PRNG:** Seeded (no `Math.random` in `src/core/`)

### Type Discipline

- No `any` — anywhere
- No `!` non-null assertions
- No `@ts-ignore`
- `@ts-expect-error` only with a comment explaining why and how to remove it
- All "one of N kinds" types are discriminated unions, not string enums
- `switch-exhaustiveness-check` on all `Species`, `Opcode`, `EnergyPool`, `DeathCause` switches

### Architecture Boundary

- `src/core/` is **pure, headless, testable**. No imports from `src/ui/`.
- `src/ui/` depends on `src/core/`. This is the only allowed direction.
- ESLint `no-restricted-imports` enforces this at Layer 2.

## The Hard Invariant

**Total system energy is constant.** At every tick:

```
sum(living entities) + sum(corpses) + sum(poop) + sum(compost) + soilNutrients == TOTAL_ENERGY
```

This is the single most important rule in the codebase. All energy movement goes through `src/core/energy.ts` `transfer()`. No energy is ever created or destroyed.

When writing or reviewing code, ask: "Does this operation conserve energy?" If the answer is not obviously yes, something is wrong.

## XP Development Pipeline

### The Cycle

For each **story**, Humboldt decomposes into acceptance criteria, then runs:

```
Humboldt assigns AC to Merian
   |
   v
┌─────────────────┐
│  MERIAN (RED)   │  Write one failing test
│  sonnet         │
└────────┬────────┘
         v
┌──────────────────┐
│ LINNAEUS (GREEN)  │  Minimum code to pass
│  sonnet           │
└────────┬──────────┘
         │ GREEN_HANDOFF
         v
┌──────────────────┐
│ CUVIER (PURPLE)   │  Refactor with judgment
│  opus             │
└────────┬──────────┘
         │
         ├── ACCEPT → CYCLE_COMPLETE → next AC
         └── REJECT → back to GREEN
              (3 strikes → escalate to Humboldt)
```

### Message Types

#### TEST_SPEC (Humboldt → Merian)

```markdown
## Test Spec
- Story: <story-id>
- Test case: <N of M> — <one-line description>
- Preconditions: <what must be true before this test>
- Expected behavior: <what the test asserts>
- Constraints: <boundaries>

### Acceptance criteria
<specific, testable conditions>
```

#### GREEN_HANDOFF (Linnaeus → Cuvier)

```markdown
## Green Handoff
- Story: <story-id>
- Test case: <N of M>
- Files changed: <list>
- Test result: PASS (all tests green)
- Implementation notes: <shortcuts taken, what's ugly, what GREEN knows is suboptimal>
- Commit: <sha>
```

**Implementation notes are mandatory and must be honest.** Cuvier needs context.

#### PURPLE_VERDICT (Cuvier → Linnaeus or Humboldt)

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
<full rejection chain summary for Humboldt>
```

#### CYCLE_COMPLETE (Cuvier → Humboldt)

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
| `stories/` | Humboldt (Lead) | Story files and decomposition |
| `tests/` | Merian (RED) | Test files and vitest config |
| `src/` production code | Linnaeus (GREEN) → Cuvier (PURPLE) | Sequential handoff |
| `docs/` | Humboldt (Lead) | Spec, workflow, decisions |

## Quality Gates

### Layer 1 — Phase gates

Per `docs/WORKFLOW.md` §4. Enforced by the performing agent, verified by the next.

### Layer 2 — Pre-commit (lefthook)

1. `tsc --noEmit` — strict config, zero errors
2. `eslint` — zero warnings
3. `prettier --check` — formatting clean
4. Architecture: no `src/ui/` import from `src/core/`
5. Purity: no `Math.random` in `src/core/`
6. Type hygiene: no `any`

**`vitest run` is NOT a per-commit gate** — RED commits must contain failing tests.

### Layer 3 — Story acceptance

Before Humboldt hands a story to PO:

1. `npm run typecheck` — clean
2. `npm run lint` — exit 0
3. `npm run format:check` — exit 0
4. `npm run test` — all tests pass
5. `npm run test:coverage` — coverage thresholds met (`src/core/` >= 95% lines/functions/statements, >= 90% branches)
6. Every AC went RED -> GREEN -> PURPLE
7. Humboldt reviewed commits against spec
8. PO explicitly accepts

## Scope Restriction

**This team builds what the spec defines and nothing more.** If a task looks like a scope expansion beyond the spec, agents escalate to Humboldt. Humboldt escalates to PO.

## Client Communication

**PO-only.** Team may draft messages; PO sends them.

## Shutdown Protocol

1. Write in-progress state to your scratchpad at `.claude/teams/bioforge-dev/memory/<your-name>.md`
2. If you are PURPLE and mid-refactor: revert uncommitted changes and note what you were doing in scratchpad
3. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]`, `[UNADDRESSED]` (1 bullet each, max)
4. Approve shutdown

Team-lead shuts down last, commits memory files, pushes.

## On Startup

1. Read your personal scratchpad at `.claude/teams/bioforge-dev/memory/<your-name>.md` if it exists
2. Read `docs/WORKFLOW.md` — the XP cycle protocol
3. Read the spec at `docs/superpowers/specs/2026-04-10-bioforge-design.md` (at least the sections relevant to current work)
4. Send a brief intro message to `team-lead`

(*FR:Celes*)
