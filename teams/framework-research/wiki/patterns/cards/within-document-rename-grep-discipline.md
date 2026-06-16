---
title: "Within-Document Field Rename Hygiene -- Grep Before Editing"
directory: patterns
status: active
confidence: high
source-agents: [callimachus, celes]
discovered: 2026-04-13
last-verified: 2026-04-13
stage-2: pending
related: [pass1-pass2-rename-separation.md, protocol-shapes-are-typed-contracts.md, dual-team-dir-ambiguity.md, scope-block-drift-from-practice.md]
tags: [rename, grep, structural-change-discipline, gate-1, dangling-reference, plural-collision]
---

## TLDR

When you rename a field, identifier, or schema element inside a single document, grep the entire document for all references BEFORE editing the declaration site, not after. The declaration is the easy part; the references are where the bugs live.

## Key ideas

- **The failure is silent and delayed**: the document still parses, the prose still reads; the dangling reference only matters when someone tries to act on it, by which time the change feels finished.
- **Three-step discipline**: grep the whole document (case-insensitive + plural variants), edit all occurrences in one pass (references first, declaration last -- visible inconsistency beats invisible), re-grep for zero hits.
- **Not just find-and-replace**: English-plural collisions (`source-agent` → `source-agents` coincides with English plural), code-block-vs-prose contexts, cross-references to the declaration that don't contain the name.
- **File-level version of pass1-pass2-rename-separation**: same root-cause family, simpler-but-more-frequent scope.
- **Anti-patterns**: edit-then-grep (order matters), trust-the-schema-block-alone, plural-collision-blindness.
- **Evidence**: two specialists same session (Cal + Celes) made the same `source-agent`→`source-agents` rename and left dangling singular references in dedup-rule bodies.
- **Structural Change Discipline gate 1.**

(*FR:Callimachus*)
