# XP Development Pipeline — raamatukoi-dev

The full RED → GREEN → REFACTOR pipeline protocol for this team. Every agent must read this on startup.

(*FR:Celes*)

## Pipeline Architecture

This team runs at **Cathedral tier** with **separate PURPLEs** (High domain distance: TypeScript vs Python, different repos).

**Two pipelines, one ARCHITECT:**

| Pipeline | ARCHITECT | RED | GREEN | PURPLE |
|---|---|---|---|---|
| Webstore | Cassiodorus | Jikji | Aldus | Erasmus |
| Rat-project | Cassiodorus | Babbage | Hypatia | Khwarizmi |

**Execution mode: Sequential (v2.1 default).** One pipeline runs at a time. Manutius decides which pipeline runs next.

**Isolation model: Temporal ownership.** One write-lock holder at a time. No partition table, no worktrees, no merge conflicts. The write-lock rotates through the pipeline stages.

---

## The Cycle

For each **story**, the pipeline runs the following cycle:

### Step 1: ARCHITECT Decomposes

Manutius sends a story to Cassiodorus. Cassiodorus:

1. Reads the relevant codebase to understand the affected code
2. Queries Bodley for integration contract details if applicable
3. Writes an ordered test plan to `docs/test-plans/<story-id>.md`
4. Sends the first TEST_SPEC to the appropriate RED

### Step 2: RED Writes Failing Test

RED (Jikji or Babbage) receives the TEST_SPEC:

1. Translates the spec into a failing test
2. Verifies the test fails for the right reason (not a syntax/import error)
3. Commits the test file
4. Sends the test to GREEN with: file path, what it asserts, what must change

### Step 3: GREEN Makes It Pass

GREEN (Aldus or Hypatia) receives the failing test:

1. Writes the **minimum** code to make the test pass — no optimization, no generalization
2. Runs **all** tests (not just the new one)
3. Commits the implementation
4. Sends GREEN_HANDOFF to PURPLE with honest implementation notes

### Step 4: PURPLE Refactors

PURPLE (Erasmus or Khwarizmi) receives the GREEN_HANDOFF:

1. Reads GREEN's implementation notes (the map of shortcuts)
2. Runs all tests — confirms they pass before starting
3. Refactors: extracts, renames, deduplicates, restructures
4. Runs all tests again — confirms they still pass
5. Sends PURPLE_VERDICT: ACCEPT or REJECT

**On ACCEPT:**

- Commits the refactoring
- Sends CYCLE_COMPLETE to Cassiodorus with quality notes
- Submits any refactoring patterns to Bodley (at cycle completion only)
- Pipeline advances to the next test case

**On REJECT:**

- Sends rejection with specific guidance to GREEN
- GREEN rewrites and sends a new GREEN_HANDOFF
- This loop continues until ACCEPT or three-strike escalation

### Step 5: Next Test Case or Story Complete

Cassiodorus receives CYCLE_COMPLETE:

1. Reads quality notes (informs future decompositions)
2. If more test cases remain: sends the next TEST_SPEC to RED
3. If all test cases done: story is complete, reports to Manutius

---

## Message Types

### TEST_SPEC (ARCHITECT → RED)

```markdown
## Test Spec
- Story: <story-id>
- Test case: <N of M> — <one-line description>
- Preconditions: <what must be true before this test>
- Expected behavior: <what the test asserts>
- Constraints: <boundaries — e.g., "do not modify existing API surface">

### Acceptance criteria
<specific, testable conditions from the story>
```

### GREEN_HANDOFF (GREEN → PURPLE)

```markdown
## Green Handoff
- Story: <story-id>
- Test case: <N of M>
- Files changed: <list>
- Test result: PASS (all tests green)
- Implementation notes: <shortcuts taken, what's ugly, what GREEN knows is suboptimal>
- Commit: <sha>
```

**Implementation notes are mandatory and must be honest.** "I duplicated the validation from X because extracting it would change the interface" is useful. An empty notes field is not acceptable — PURPLE needs context.

### PURPLE_VERDICT (PURPLE → GREEN or ARCHITECT)

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
<specific structural issue that cannot be refactored without reimplementation>

### Guidance for GREEN (if REJECT)
<concrete direction — not "make it better" but "extract the validation into a shared function at X, then call it from both Y and Z">

### Escalation (if rejection_count >= 3)
<full rejection chain summary for ARCHITECT>
<proposed resolution: rewrite test plan | split test case | accept with tech debt>
```

### CYCLE_COMPLETE (PURPLE → ARCHITECT)

```markdown
## Cycle Complete
- Story: <story-id>
- Test case: <N of M> — DONE
- Total cycles: <how many GREEN→PURPLE round-trips>
- Final commit: <sha>
- Quality notes: <structural observations for ARCHITECT — e.g., "growing coupling between modules X and Y across test cases 3-5">

### Ready for next test case: YES | NO (explain)
```

---

## The Three-Strike Rule

PURPLE has veto power over GREEN's implementation. Rejections escalate:

| Consecutive PURPLE rejections | Action |
|---|---|
| 1 | Normal — PURPLE sends rejection with specific guidance to GREEN |
| 2 | Warning — PURPLE includes summary of both rejections, asks GREEN to address the structural *pattern*, not just the symptom |
| 3 | Escalation — PURPLE sends full rejection chain to ARCHITECT (Cassiodorus). ARCHITECT decides: (a) rewrite test plan item, (b) split into smaller steps, or (c) override PURPLE and accept with documented tech debt marker |

Three strikes is not punishment — it is an authority boundary signal. It means the problem is beyond PURPLE's scope (structural improvement) and has entered ARCHITECT's scope (decomposition correctness).

---

## PURPLE Scope Boundaries

**PURPLE MAY:**

- Rename local variables, extract private functions, restructure internal control flow
- Eliminate duplication within a single module
- Improve type signatures that do not change the public interface

**PURPLE MAY NOT (must escalate to ARCHITECT):**

- Change public interfaces (API surfaces, exported function signatures, database schemas)
- Create new modules or files (structural decisions with cross-story implications)
- Modify test files (RED's domain)
- Delete code paths that are currently tested

**Cross-repo boundary (this team only):** Erasmus refactors webstore only. Khwarizmi refactors rat-project only. Cross-repo patterns are submitted to Bodley, not extracted by PURPLE.

---

## Write-Lock Rotation

At any moment, exactly **one agent** holds the write-lock:

```
ARCHITECT writes test plan → lock to RED
RED writes test file      → lock to GREEN
GREEN writes impl         → lock to PURPLE
PURPLE refactors          → lock back to ARCHITECT (or GREEN on reject)
```

No two agents write simultaneously. No merge conflicts possible. This is the **temporal ownership** isolation model.

---

## Mid-Cycle Shutdown

If shutdown arrives while PURPLE is mid-refactor:

1. **Can finish in 30 seconds?** → Finish and commit. Proceed with shutdown.
2. **Cannot finish?** → Submit `[DEFERRED-REFACTOR]` to Bodley (describe intent and progress). Revert uncommitted changes. Proceed with shutdown.
3. **No response after 60 seconds (watchdog)?** → Manutius forces `git reset --hard HEAD`. PURPLE is terminated.
4. **Still writing after 3 minutes?** → Manutius decides: extend once, or force-revert.

At the 5-minute boundary, Manutius has absolute termination authority. PURPLE cannot refuse.

Next session's PURPLE queries Bodley for `[DEFERRED-REFACTOR]` entries and picks up where the previous one left off.

---

## Oracle Integration

### During the Cycle

- **ARCHITECT** queries Bodley for integration contract details before writing test plans that touch external systems
- **RED** queries Bodley for contract details before writing test assertions for integration points
- **GREEN** submits integration quirks discovered during implementation to Bodley
- **PURPLE** submits refactoring patterns to Bodley **at cycle completion only** (never mid-refactor)

### Staleness Detection

When PURPLE refactors files that are referenced in Bodley's wiki entries (e.g., renamed a function that appears in `docs/integration/directo/field-mappings.md`), PURPLE flags the affected entry for Bodley to verify. This is a notification, not a demand — Bodley verifies and updates at its own pace.

---

## Phase 1 Adaptation

During Phase 1 (test framework setup, CI pipeline creation), the XP cycle adapts:

- **ARCHITECT** decomposes infrastructure stories: "set up test framework," "create CI pipeline," "add linting"
- **RED** writes the first test (framework selection is part of RED's Phase 1 scope)
- **GREEN** configures the runner, makes the test pass, creates CI workflow
- **PURPLE** refactors the infrastructure for clean patterns (test directory structure, CI workflow organization, fixture patterns)

This is the same cycle — ARCHITECT → RED → GREEN → PURPLE — applied to infrastructure instead of features. The XP discipline applies even when building the quality infrastructure itself.
