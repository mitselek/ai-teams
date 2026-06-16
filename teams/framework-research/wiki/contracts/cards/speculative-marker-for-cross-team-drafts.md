---
title: "[speculative] Marker Convention for Cross-Team Handoff Drafts"
directory: contracts
status: active
confidence: medium
source-agents: [team-lead]
discovered: 2026-04-22
last-verified: 2026-05-04
stage-2: confirmed
related: [two-stage-adoption-for-org-standards.md, wiki-cross-link-convention.md]
tags: [contract, speculative-marker, cross-team, handoff, greppable, survival-count]
---

## TLDR

An inline `[speculative]` marker in cross-team handoff drafts flags content that is inference rather than verified claim. It's greppable and scannable -- letting stage-1 reviewers (canonical-space owners) target their review to confirm/adjust points without reading the full document for buried prose hedges.

## Key ideas

- **Three classes earn the marker**: author's inferences (unverified-with-source), adapted patterns from a peer reference, draft-state derivations. Verified/cited/load-bearing fact does NOT -- it's a positive signal of inference, not a generic hedge.
- **Why a marker, not a prose hedge**: greppable (`grep -c '\[speculative\]'`), scannable (skip to flagged sections), survives stage transitions (count tracked).
- **Survival count is the load-bearing payoff**: count at Stage 0 / Stage 1-ready / post-Stage-2. Decreasing = speculation resolving; stable/rising = the draft hardening with unresolved inferences (a defect -- markers shouldn't survive into the authoritative version).
- **First-instance counts**: 16 markers in the standard at Stage 0, 2 in the intake template, 2 in the tracking issue.
- **Distinct from**: `confidence: speculative` frontmatter (whole-entry), prose hedge (no action), proposal banner (whole-document). The four coexist, answering different questions.
- **Pairs with two-stage-adoption** (survival counts tracked at its stage transitions).

(*FR:Callimachus*)
