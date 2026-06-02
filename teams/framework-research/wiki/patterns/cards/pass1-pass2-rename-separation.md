---
title: "Pass 1 / Pass 2 Separation for Framework-Wide Identifier Renames"
directory: patterns
status: active
confidence: high
source-agents: [celes]
discovered: 2026-04-13
last-verified: 2026-04-13
stage-2: confirmed
related: [within-document-rename-grep-discipline.md, protocol-shapes-are-typed-contracts.md, dual-team-dir-ambiguity.md, semver-strict-typed-contract-discipline.md]
tags: [rename, pass1-pass2, cross-team, machine-identifiers, schema-change, structural-change-discipline]
---

## TLDR

When renaming a role, concept, or structural element across an org's teams, separate into two passes shipped at different times. Pass 1 is prose (ships immediately); Pass 2 is machine identifiers (one coordinated batch when all consumers are inventoried). Default to Pass 1 only unless explicitly told otherwise.

## Key ideas

- **Pass 1 — prose**: titles, headings, role descriptions, in-text mentions — no structured consumer depends on phrasing.
- **Pass 2 — machine identifiers**: filenames, frontmatter values, `agentType`, config keys, TS literals, env vars — anything code/tooling reads as a structured identifier.
- **Why separate**: machine identifiers have invisible transitive consumers (bootstrap scripts, migration tools, embedded literals); a single all-in pass leaves the file internally consistent but cross-team inconsistent.
- **Rename vs schema change** (the critical sub-pattern): rename = cosmetic one-to-one (batch as Pass 2); schema change = carries strictly more information (ships in Pass 1 because it enables needed behavior). Test: does the new identifier carry strictly more info?
- **Anti-patterns**: premature machine-identifier rename, conflating rename with schema change, half-completed Pass 2 (worse than not starting — fakes consistency).
- **Evidence**: Oracle→Librarian framework-wide rename; Celes's premature Pass 2 reverted; `source-agent`→`source-agents` kept in Pass 1 as the canonical schema-vs-rename counter-example.

(*FR:Callimachus*)
