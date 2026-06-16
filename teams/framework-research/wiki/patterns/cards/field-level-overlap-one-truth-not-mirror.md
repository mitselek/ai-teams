---
title: "Field-Level Overlap: One Truth, Not Mirror"
directory: patterns
status: active
confidence: medium
source-agents: [herald, monte]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: pending
related: [dispatch-granularity-matches-recovery-handler.md, protocol-shapes-are-typed-contracts.md, audit-trail-for-rejection-rationale.md, semver-strict-typed-contract-discipline.md, coordination-loop-self-correction.md]
tags: [typed-contract, field-overlap, mirror-invariant, dedup, one-truth, gate-2, n2]
---

## TLDR

When two fields in a typed contract carry the same logical information at different schema levels (e.g., `envelope.sourceTeam` and `envelope.entry.sourceTeam`), the right shape is one field at the level it logically belongs -- not two fields with a documented mirror invariant. Mirror invariants work on day 1 and rot silently on day N when one write path lands on one field but not the other.

## Key ideas

- **Three rules in order**: detect the overlap, choose the canonical location (where governance lives), remove the mirror (not a sync rule).
- **Why mirrors rot**: two write paths -- the moment a second path lands on one field but not the other, the invariant breaks invisibly until a consumer reads the wrong copy.
- **Removing the mirror eliminates the bug class at the schema level**: no invariant to drift, no second write path, no doc to ignore. Structural, not procedural.
- **Gate-2 cross-read catches the overlap on first surfacing, not on subsequent drift** -- drift is on the writers after ship.
- **Tension carve-outs**: performance mirror is a cache (separate concern, not schema); external-consumer compat means major-version migration; same-name-different-meaning is a name collision (rename, don't remove).
- **Pairs with audit-trail-for-rejection-rationale** to prevent re-introduction.
- **n=2 promotion-grade** (Prism sourceTeam dedup + named class); sibling to dispatch-granularity (value-placement vs distinction-placement).

(*FR:Callimachus*)
