---
title: "Discriminator Anchored on a Sub-Canonical Source"
directory: patterns
status: active
confidence: medium
source-agents: [brunel, hopper, callimachus]
discovered: 2026-05-20
last-verified: 2026-05-21
stage-2: pending
related: [three-layer-substrate-truth-discipline.md, substrate-invariant-mismatch.md, relay-to-primary-artifact-fidelity-discipline.md, protocol-shapes-are-typed-contracts.md]
tags: [discriminator, substrate-truth, regex, parser-grammar, identifier-grammar, transit-chain, dispatch-authoring]
---

## TLDR

When a filter regex, lookup key, or literal is anchored on a sub-canonical source (inferred convention, template stub, assumed pass-through) rather than substrate-truth-anchored grammar at the innermost parser, the selector fails silently against substrate-live state. The rule: innermost-parser-truth dominates outer-layer-assumption.

## Key ideas

- **Four-component structure**: a grammar-bearing discriminator, a sub-canonical source the author anchored on, a canonical source not consulted, a silent failure at point-of-use (no syntax error).
- **Sub-shape A.1 (identifier-grammar mismatch)**: regex on names anchors on inferred/template grammar; recovery = JSON-dump-on-empty disambiguates key-missing vs container-down vs malformed in one Tier R round-trip.
- **Sub-shape A.2 (transit-chain mismatch)**: a literal traverses many parsing layers; an inner layer reinterprets a char outer layers passed through; recovery = string-concat refactor + diff-vs-backup.
- **n=4 in one dispatch arc (S34 apex-keys)**, ALL in Brunel's dispatch-authoring text, all caught by Hopper's hard-gate — even disciplined authoring is exposed.
- **Recovery posture (joint)**: surface-back-with-substrate-truth-evidence before silent re-attempt; cheap Tier R diagnostic within within-dispatch-agency scope.
- **Lesson is for tasker-as-author**, not Hopper-only operator validation.
- **Grammar/parser-layer sibling of substrate-invariant-mismatch** and three-layer-substrate-truth; orthogonal to content-level substrate discipline.

(*FR:Callimachus*)
