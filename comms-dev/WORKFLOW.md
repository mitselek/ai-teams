---
status: approved
title: comms-dev Development Workflow
description: Team-specific workflow extending dev-toolkit standards for the comms relay project
doc_id: comms-dev-workflow
author: marconi
version: 1.0.0
last_reviewed: 2026-03-31
---

# comms-dev Development Workflow

Extends [dev-toolkit/WORKFLOW.md](https://github.com/Eesti-Raudtee/dev-toolkit/blob/main/WORKFLOW.md). All dev-toolkit standards apply unless overridden here.

## Roles

| Role | Agent | Model | Owns |
|------|-------|-------|------|
| **Team Lead** | Marconi | Opus | Architecture decisions, task assignment, PR review, coordination |
| **Cryptography Engineer** | Vigenere | Opus | Crypto protocol design, E2E encryption, key management, security review |
| **Backend Engineer** | Babbage | Sonnet | Hub server, transport, message routing, persistence |
| **QA & Security Engineer** | Kerckhoffs | Sonnet | RED tests, security validation, threat analysis, CI pipeline |
| **CLI/UX Engineer** | Lovelace | Sonnet | MCP server, CLI tools, client interfaces |
| **PO** | Mihkel (human) | — | What and why — stories, acceptance criteria, verification |

## Workflow (8-step, per dev-toolkit)

### 1. Capture (PO / Marconi)

GitHub Issue with user story format:

```markdown
## Story: <title>

**As a** <role>, **I want** <goal>, **so that** <reason>.

### Acceptance Criteria

- [ ] Given <context>, when <action>, then <expected result>
```

### 2. Branch (Implementer)

```bash
git checkout main && git pull
git checkout -b story/<issue-number>-short-description
```

### 3. Analyze (Implementer)

Document approach as a comment on the GitHub Issue before writing code.

### 4. Test First (Kerckhoffs)

Kerckhoffs writes failing tests from acceptance criteria. Each Given/When/Then becomes at least one test. Tests must FAIL (RED). Kerckhoffs sends `[COORDINATION]` to implementer with test file location.

### 5. Implement (Babbage / Vigenere / Lovelace)

Write minimum code to make tests pass (GREEN). Refactor while keeping tests green.

### 6. Verify (PO / Marconi)

Review against acceptance criteria. Run full test suite. Check quality gates.

### 7. Document (Implementer)

Update architecture.md, crypto-spec.md, or other docs if behavior changes.

### 8. PR & Merge (Marconi)

```bash
gh pr create --title "story/<id>: <description>" --body "..."
```

PR must pass all quality gates before merge. Marconi reviews and merges.

## TDD Contract

- **No implementation begins until Kerckhoffs has committed failing tests**
- Tests define the contract — implementer builds to make tests pass
- Kerckhoffs reviews implementation for edge cases after GREEN
- Integration test required for every feature (not just unit tests)
- Anti-mocking: use real certs, real sockets, real servers in tests

## Scope Restrictions

| Agent | May write | May NOT write |
|-------|-----------|---------------|
| Vigenere | `src/crypto/`, `docs/crypto-spec.md`, `docs/threat-model.md` | Transport, tests, CLI |
| Babbage | `src/` (except crypto), `package.json`, `tsconfig.json` | Crypto internals, tests |
| Kerckhoffs | `tests/`, `vitest.config.ts`, `.github/`, `docs/security-report.md` | Source code in `src/` |
| Lovelace | MCP server code, CLI tools | Server code, crypto, tests |
| Marconi | Config, docs, small fixes | Large implementation blocks |

## Communication

- Every SendMessage prepended with `[YYYY-MM-DD HH:MM]` timestamp
- After completing a task: report to Marconi (never go idle without reporting)
- Cross-domain requests: use `[COORDINATION]` tag
- Attribution: `(*CD:<AgentName>*)` on all persistent output

(*CD:Marconi*)
