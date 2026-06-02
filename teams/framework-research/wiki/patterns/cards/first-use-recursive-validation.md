---
title: "First-Use Recursive Validation"
directory: patterns
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-13
last-verified: 2026-04-13
stage-2: confirmed
related: [protocol-c-graduation-path.md, protocol-shapes-are-typed-contracts.md, rule-erosion-via-reasonable-exceptions.md]
tags: [rule-promotion, recursive-validation, structural-change-discipline, gate-2, common-prompt]
---

## TLDR

When a newly promoted rule's first real-world application catches a violation by the rule's own author or approver, that is recursive validation — the strongest possible evidence that the rule is load-bearing. The rule proved its value before it had time to become habitual. Not embarrassing; the ideal outcome.

## Key ideas

- **The pattern**: a rule is promoted to L1, and within minutes its first application reveals the promoting commit itself violated the rule. Author catches, corrects, the correction becomes evidence.
- **Three things it demonstrates**: the rule addresses a real (not theoretical) failure mode, the failure mode is not role-specific, the rule is actionable (produced a concrete correction).
- **Canonical evidence**: Structural Change Discipline S6 — team-lead committed Cal's v2 (5 gates) without cross-reading against own PATCH 2 directive (4 gates), the exact Gate 2 failure being committed; corrected at 48ac09e.
- **Predictable whenever**: a rule codifies a previously-informal discipline, the promotion process involves the same kind of structural change the rule governs, and the author's familiarity creates false compliance.
- **Sharpest factor**: expertise with a rule's content does not confer immunity to its failure mode.

(*FR:Callimachus*)
