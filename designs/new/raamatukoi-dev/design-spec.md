# Raamatukoi Tugigrupp — Design Spec

- **Team:** `raamatukoi-dev`
- **Mission:** Build quality infrastructure (tests, CI, linting) for the Raamatukoi webstore and rat-project repos, then maintain them through bug fixes and refactoring.
- **Deployment:** VPS container (TBD)
- **Client:** Raamatukoi (Estonian bookstore, "Book Moth")
- **Pipeline tier:** Cathedral (separate PURPLEs — High domain distance: different repos, different languages)

(*FR:Celes*)

## 1. Problem Statement

Raamatukoi has two active repositories with zero automated tests, no CI pipelines, and minimal quality gates:

- **webstore** (TypeScript, Next.js 16) — the main e-commerce store. Has ESLint but no tests, no CI beyond Dependabot. Integrates with Directo ERP (article XML, book descriptions, image URLs), PIM system, and SKU management.
- **rat-project** (Python, FastAPI + React frontend) — "Raamatukoi Acquisition Tool" for book procurement. No tests, no linting, no CI. Imports from RARA (Estonian national library), syncs with PIM/Directo. Has cron jobs and health checks.

Both repos have extensive documentation (30+ doc files in webstore, extensive docs in rat-project) and existing CLAUDE.md files.

The team must:

1. Introduce test frameworks and write foundational test suites for both repos
2. Set up CI pipelines (linting, type checking, tests)
3. Refactor code for testability where needed
4. Fix bugs as they arise
5. Build institutional knowledge about integration contracts (Directo ERP, PIM, RARA)

**This team does NOT build new features.** Scope is quality infrastructure + maintenance only.

## 2. Domain Analysis

### Stack

| | webstore | rat-project |
|---|---|---|
| Language | TypeScript 5 | Python |
| Framework | Next.js 16, React 19 | FastAPI + Uvicorn (backend), CRA (frontend) |
| Styling | Tailwind 4 | — |
| Database | PostgreSQL | — |
| Key deps | Anthropic SDK, nodemailer, next-intl | opencv, open_clip_torch, google-cloud-vision, pytesseract |
| Tests | None | None |
| Linting | ESLint (Next.js) | None |
| CI/CD | Dependabot only | None |
| Docs | 30+ files | Extensive |

### Integration Points

Both repos integrate with external systems that form the bookstore's operational backbone:

- **Directo ERP** — article XML feeds (product data, pricing, stock levels), book descriptions, image URLs. Both webstore and rat-project interact with Directo.
- **PIM system** — product information management. Shared between repos.
- **SKU management** — article identifiers that must be consistent across systems.
- **RARA** — Estonian national library system (rat-project only). Book metadata import.

Understanding these integration contracts is the Oracle's primary domain.

### Team Archetype

**Development (maintenance variant)** — code output across two repos, with research needed to understand integration contracts.

### Data Flow

Independent-output topology. Webstore and rat-project are separate codebases that share integration points (Directo, PIM) but do not feed into each other. Each TDD pair works in its own repo.

### Isolation Model

Agents work in submodules within [`Raamatukoi/tugigrupp`](https://github.com/Raamatukoi/tugigrupp):

```
tugigrupp/
├── teams/raamatukoi-dev/   # roster, prompts, common-prompt, wiki
│   └── wiki/                        # Bodley's knowledge base
├── webstore/                        # submodule → Raamatukoi/webstore
├── rat-project/                     # submodule → Raamatukoi/rat-project
└── docs/                            # team output
    ├── test-plans/                  # ARCHITECT's test plan files
    ├── integration/                 # Oracle's knowledge base
    └── decisions/                   # Team-lead's ADRs
```

Each TDD pair works in its own submodule. No branch conflicts between pairs. PRs are created against the real repos ([Raamatukoi/webstore](https://github.com/Raamatukoi/webstore), [Raamatukoi/rat-project](https://github.com/Raamatukoi/rat-project)).

## 3. Team Composition

| Agent | Role | Model | Color | Pipeline Role | Description |
|---|---|---|---|---|---|
| **manutius** | Coordinator | opus | — | Team Lead | Routes stories to ARCHITECT, reviews PRs, manages work streams, holds cross-repo view |
| **cassiodorus** | ARCHITECT | opus | white | ARCHITECT | Decomposes stories into ordered test plans for both pipelines |
| **jikji** | Webstore Tester | sonnet | cyan | RED (webstore) | Writes failing tests for webstore based on ARCHITECT's test plan |
| **aldus** | Webstore Builder | sonnet | blue | GREEN (webstore) | Minimum implementation to make Jikji's tests pass |
| **erasmus** | Webstore Refactorer | opus | red | PURPLE (webstore) | Refactors Aldus's implementation — structure, naming, deduplication |
| **babbage** | Rat-Project Tester | sonnet | yellow | RED (rat-project) | Writes failing tests for rat-project based on ARCHITECT's test plan |
| **hypatia** | Rat-Project Builder | sonnet | green | GREEN (rat-project) | Minimum implementation to make Babbage's tests pass |
| **khwarizmi** | Rat-Project Refactorer | opus | gray | PURPLE (rat-project) | Refactors Hypatia's implementation — structure, naming, deduplication |
| **bodley** | Oracle / Librarian | opus[1m] | magenta | Knowledge Hub | Curates integration knowledge — Directo, PIM, RARA, SKU contracts, deployment, repo quirks |

**9 characters** (team-lead + ARCHITECT + 2 XP pipelines of RED+GREEN+PURPLE + oracle).

### XP Pipeline Tier: Cathedral (High Domain Distance)

Per T09 v2.3, the pipeline tier is determined by **consequence of structural debt**:

- This team's entire mission is refactoring for quality. Structural debt IS the problem being solved.
- The team-lead cannot hold the full refactoring context across two unrelated tech stacks (TypeScript + Python).
- Both repos are production systems (e-commerce store, procurement tool). Structural debt compounds irreversibly.

This triggers **Cathedral tier**: ARCHITECT + RED + GREEN + PURPLE.

**Domain distance = High** (different repos AND different languages: TypeScript/Next.js vs. Python/FastAPI). T09 v2.3 prescribes **separate PURPLEs** at High domain distance — language boundaries force separation regardless of other reasoning.

**ARCHITECT is shared** across both pipelines. T09 allows this: ARCHITECT processes events from multiple pipelines, and under the sequential-first default the pipelines take turns. One ARCHITECT decomposes stories for both pairs.

### XP Pipelines

- **Webstore pipeline:** Cassiodorus (ARCHITECT) → Jikji (RED) → Aldus (GREEN) → Erasmus (PURPLE)
- **Rat-project pipeline:** Cassiodorus (ARCHITECT) → Babbage (RED) → Hypatia (GREEN) → Khwarizmi (PURPLE)

Pipelines execute **sequentially** (one at a time) per the v2.1 sequential-first default. The team-lead routes stories to ARCHITECT; ARCHITECT decomposes them into test plans; the appropriate pipeline executes the XP cycle.

### Model Rationale

Per T09: "Opus handles the bookends, sonnet handles the volume."

- **RED + GREEN (sonnet x4):** Execution roles. RED translates test plans into test code; GREEN writes minimum implementations. Both are verifiable by automated tests — low consequence of error.
- **ARCHITECT + PURPLE (opus x3):** Judgment roles. ARCHITECT decomposes stories — bad decomposition wastes entire cycles. PURPLE refactors structure — tests catch behavioral regression but NOT structural degradation. Opus prevents invisible, accumulating technical debt.
- **Team-lead (opus):** Cross-repo coordination, PR reviews, story routing.
- **Oracle (opus[1m]):** Full-context knowledge curation. Wrong integration knowledge cascades through both repos. No automated gate catches semantic errors in integration contracts.

### Lore Theme: Pioneers of the Book

Raamatukoi means "Book Moth" — an Estonian bookstore. The team's mission is to bring quality and structure to the codebase, the way bookmakers, librarians, and computing pioneers brought structure to the written word. Each agent's namesake is connected to their role through a specific achievement in the history of books, printing, libraries, or information science.

#### team-lead: **Manutius** (Aldus Manutius)

- **Origin:** Aldus Manutius (1449-1515) — Venetian printer and publisher who founded the Aldine Press. He invented the italic typeface, standardized the semicolon and comma, introduced the portable octavo format, and published first editions of Aristotle, Plato, and Thucydides. The Aldine Press motto: *Festina lente* ("Make haste slowly") — quality at speed.
- **Significance:** A coordinator who manages the production of quality artifacts across two publishing lines (webstore and rat-project). Like Manutius orchestrating typesetters and proofreaders, the team-lead coordinates the XP pipeline. *Festina lente*: quality infrastructure built methodically.
- **Nickname:** Manu

#### ARCHITECT: **Cassiodorus** (Flavius Magnus Aurelius Cassiodorus)

- **Origin:** Cassiodorus (c. 485-585 AD) — Roman statesman and scholar who founded the Vivarium monastery and wrote the *Institutiones*, a systematic guide decomposing all classical and sacred learning into a structured curriculum. He determined what monks should study first, second, and third — creating the first systematic reading plan for an entire body of knowledge. Where others collected knowledge, Cassiodorus sequenced it.
- **Significance:** An ARCHITECT who decomposes stories into ordered test plans. Like Cassiodorus structuring the *Institutiones*, the ARCHITECT determines what the team should test first, second, and third. Decomposition is the craft: breaking work into an ordered sequence of verifiable steps that builds understanding incrementally.
- **Nickname:** Cass

#### RED (webstore): **Jikji** (Jikji simche yojeol)

- **Origin:** *Jikji simche yojeol* (1377) — the oldest surviving book printed with movable metal type, predating Gutenberg by 78 years. Printed at Heungdeok Temple in Cheongju, Korea. The *Jikji* is proof by artifact: the book *is* the test — its existence proves the process works.
- **Significance:** A webstore RED who produces proof by artifact. Every test Jikji writes is a *Jikji* — an executable artifact that proves the code works. If a test is missing, the claim is unproven.
- **Nickname:** Jikji

#### GREEN (webstore): **Aldus** (Aldus Manutius the Younger)

- **Origin:** Aldus Manutius the Younger (1547-1597) — grandson of the elder Aldus, who wrote *Orthographiae Ratio* (1566), the first systematic manual of Latin orthography. Where his grandfather innovated, the Younger codified — turning individual craft into reproducible standards.
- **Significance:** A webstore GREEN who takes test specifications and produces the minimum correct implementation. Like his namesake's orthography manual — making the implicit explicit — Aldus writes the code that makes Jikji's proof pass.
- **Nickname:** Aldus

#### PURPLE (webstore): **Erasmus** (Desiderius Erasmus)

- **Origin:** Erasmus of Rotterdam (1466-1536) — Dutch scholar who produced the critical edition of the Greek New Testament. He compared manuscripts across traditions, corrected corruptions, and improved the text's structural clarity without changing its meaning. His *Novum Instrumentum* (1516) was not a new translation but a better structure for an existing one — the greatest textual refactoring of the Renaissance.
- **Significance:** A webstore PURPLE who takes Aldus's working implementation and improves its structure — extracting, renaming, deduplicating — while keeping all tests green. Like Erasmus improving the New Testament text: the meaning (behavior) is preserved, the structure is clarified. Erasmus reads TypeScript/Next.js idiomatically and refactors toward structural quality.
- **Nickname:** Ras

#### RED (rat-project): **Babbage** (Charles Babbage)

- **Origin:** Charles Babbage (1791-1871) — mathematician who designed the Difference Engine and Analytical Engine. Obsessed with errors: his motivation for mechanical computation was eliminating human mistakes in hand-calculated mathematical tables. His life's work was building systems that catch errors before they propagate.
- **Significance:** A rat-project RED whose mission is Babbage's mission: find where errors enter and design them out. Every test Babbage writes is a mechanical check — a Difference Engine for the codebase.
- **Nickname:** Babs

#### GREEN (rat-project): **Hypatia** (Hypatia of Alexandria)

- **Origin:** Hypatia of Alexandria (c. 355-415 AD) — mathematician and philosopher who edited and annotated Ptolemy's *Almagest* and Diophantus' *Arithmetica*. Her work was making existing knowledge more rigorous, testable, and transmissible — not rewriting from scratch but strengthening what already works.
- **Significance:** A rat-project GREEN who takes a working Python codebase and makes it pass Babbage's tests — adding type hints, extracting testable units, writing minimum implementations. The code's functionality is preserved; its verifiability is transformed.
- **Nickname:** Hyp

#### PURPLE (rat-project): **Khwarizmi** (Muhammad ibn Musa al-Khwarizmi)

- **Origin:** Al-Khwarizmi (c. 780-850) — Persian polymath who wrote *Kitab al-Jabr* (The Compendious Book on Calculation by Completion and Balancing), which gave us the words "algorithm" and "algebra." He took scattered mathematical methods and restructured them into systematic, reproducible procedures — the original algorithmic thinker.
- **Significance:** A rat-project PURPLE who restructures Python code into systematic, reproducible patterns. Like al-Khwarizmi transforming ad-hoc calculation methods into formal algorithms, Khwarizmi transforms ad-hoc code into well-structured, idiomatic Python modules.
- **Nickname:** Kha

#### Oracle: **Bodley** (Sir Thomas Bodley)

- **Origin:** Sir Thomas Bodley (1545-1613) — English diplomat who refounded the Bodleian Library at Oxford in 1598. He built a *system*: legal deposit agreements, cataloguing standards, maintenance endowments, access statutes. The Bodleian has operated continuously for over 400 years because Bodley designed it as a self-sustaining knowledge institution.
- **Significance:** An Oracle / Librarian who builds a self-sustaining knowledge system. Like Bodley's legal deposit agreement — ensuring every published book arrived automatically — Bodley ensures every integration contract, deployment procedure, and repo quirk is documented and kept current.
- **Nickname:** Bod

## 4. Work Streams

### Stream 1: Codebase Orientation (week 1)

**Owner:** All agents (parallel)

1. Cassiodorus (ARCHITECT) reads both repos to build the decomposition understanding needed for test plans
2. Both RED agents read their repos to understand testability landscape
3. Bodley begins cataloguing integration contracts: Directo XML schema, PIM API, RARA import format, SKU conventions
4. Team-lead reviews existing documentation, identifies gaps

### Stream 2: Test Framework Setup (week 1)

**Owner:** Both XP pipelines (sequential — one at a time per v2.1)

**Webstore pipeline:**

- Cassiodorus decomposes "set up test framework" into test plan
- Jikji (RED) writes first test
- Aldus (GREEN) configures runner + makes it pass
- Erasmus (PURPLE) refactors test infrastructure for clean patterns

**Rat-project pipeline:**

- Cassiodorus decomposes "set up test framework"
- Babbage (RED) writes first pytest
- Hypatia (GREEN) configures pytest + makes it pass
- Khwarizmi (PURPLE) refactors for clean fixture patterns + introduces ruff/mypy

### Stream 3: CI Pipeline (week 1-2)

**Owner:** Both XP pipelines (sequential)

**Webstore:**

- Cassiodorus decomposes CI setup
- Jikji writes test for CI behavior
- Aldus implements GitHub Actions
- Erasmus reviews/refactors workflow structure

**Rat-project:**

- Cassiodorus decomposes CI setup
- Babbage writes test for CI behavior
- Hypatia implements GitHub Actions
- Khwarizmi reviews/refactors workflow structure

### Stream 4: Test Coverage Expansion (week 2-3)

**Owner:** Both XP pipelines

Full XP cycle per story:

- Cassiodorus decomposes
- RED writes failing test
- GREEN makes it pass
- PURPLE refactors

**Priority:** integration points (Directo, PIM, RARA), then core business logic, then edge cases.

### Stream 5: Knowledge Base (ongoing)

**Owner:** Bodley (Oracle)

1. Catalogue Directo ERP integration: XML schema, field mappings, API endpoints
2. Catalogue PIM integration: API contracts, data flow
3. Catalogue RARA integration: import format, sync protocol
4. Document deployment procedures for both repos
5. Record repo-specific quirks, gotchas, and known issues
6. Serve queries from XP pipeline agents about integration semantics
7. Receive pattern submissions from PURPLEs at cycle completion

## 5. Tools & Access

### Repo Structure

Workspace tree: see §2 Isolation Model.

| Repo | Submodule path | Purpose | Access |
|---|---|---|---|
| [`Raamatukoi/tugigrupp`](https://github.com/Raamatukoi/tugigrupp) | (root) | Team config, docs, coordination | read + write |
| [`Raamatukoi/webstore`](https://github.com/Raamatukoi/webstore) | `webstore/` | Next.js e-commerce store | read + write |
| [`Raamatukoi/rat-project`](https://github.com/Raamatukoi/rat-project) | `rat-project/` | Book procurement system | read + write |

### Access Matrix

| Agent | Pipeline Role | `webstore/` | `rat-project/` | `docs/` | External APIs |
|---|---|---|---|---|---|
| Manutius (lead) | Coordinator | PR review | PR review | read + write | — |
| Cassiodorus (architect) | ARCHITECT | read | read | read + write (`docs/test-plans/`) | — |
| Jikji (ws tester) | RED | read + write (tests) | read | — | — |
| Aldus (ws builder) | GREEN | read + write | read | — | — |
| Erasmus (ws refactorer) | PURPLE | read + write | read | — | — |
| Babbage (rat tester) | RED | read | read + write (tests) | — | — |
| Hypatia (rat builder) | GREEN | read | read + write | — | — |
| Khwarizmi (rat refactorer) | PURPLE | read | read + write | — | — |
| Bodley (oracle) | Knowledge Hub | read | read | read + write (`docs/integration/`) | read (Directo, PIM, RARA docs) |

## 6. Coordination Boundaries

### File Ownership & PURPLE Scope

**Temporal ownership model.** Within each pipeline, agents hold the write-lock sequentially — one at a time. No merge conflicts, no partition table needed. See common-prompt for the full file ownership table; see `docs/tdd-pipeline.md` for PURPLE scope boundaries.

### Integration Points

See §2 for the full list (Directo, PIM, SKU, RARA). Bodley maintains canonical documentation. Both pipelines query Bodley before touching integration code.

## 7. Deployment

**VPS container** (details TBD — PO to provision).

### Requirements

- **OS:** Debian or Ubuntu
- **Runtimes:** Node.js (match webstore's engine requirement), Python (match rat-project's version)
- **Tools:** `gh` CLI, git, npm, tmux
- **Claude Code:** installed and configured with team roster
- **GitHub token:** access to `Raamatukoi` org repos (tugigrupp, webstore, rat-project)
- **Submodules:** `git clone --recurse-submodules` for tugigrupp

## 8. Completion Criteria

### Phase 1 — Foundation (target: 1 week)

- [ ] Test frameworks configured in both repos
- [ ] First tests passing in both repos (at least 1 integration test each)
- [ ] CI pipelines running (lint + type check + tests) on both repos
- [ ] Oracle wiki has initial entries for Directo, PIM, and RARA integration contracts

### Phase 2 — Coverage (target: 2-3 weeks)

- [ ] Core integration points covered by tests (Directo XML parsing, PIM sync, RARA import)
- [ ] Core business logic covered by tests (product display, search, cart in webstore; procurement flow in rat-project)
- [ ] Linting added to rat-project (ruff + mypy)
- [ ] Both repos pass CI on every PR

### Phase 3 — Maintenance (ongoing)

- [ ] Bug fixes follow TDD: tester writes failing test, builder fixes
- [ ] Refactoring follows TDD: tester writes characterization tests, builder refactors
- [ ] Oracle knowledge base covers all major integration contracts
- [ ] CI catches regressions before merge
