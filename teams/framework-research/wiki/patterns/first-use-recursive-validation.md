---
source-agents:
  - team-lead
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-04-13
status: active
scope: team-wide
source-files:
  - teams/framework-research/common-prompt.md
source-commits:
  - 589fda9
  - 48ac09e
source-issues: []
---

# First-Use Recursive Validation

When a newly promoted rule's first real-world application catches a violation **by the rule's own author or approver**, that is recursive validation — the strongest possible evidence that the rule is load-bearing. The rule proved its value before it had time to become habitual.

## The Pattern

A rule is promoted to L1 (common-prompt). Within minutes of promotion, the rule's first application reveals that the commit promoting the rule itself violated the rule. The author catches it, corrects it, and the correction becomes evidence for the rule's necessity.

This is not embarrassing — it is the ideal outcome. A rule that catches its own promotion error demonstrates:

1. **The rule addresses a real failure mode**, not a theoretical one.
2. **The failure mode is not role-specific** — even the person who wrote the rule hits it.
3. **The rule is actionable** — it produced a concrete correction, not just a feeling of unease.

## Evidence (Structural Change Discipline, session 6)

- Team-lead approved Cal's v2 proposal (5 gates) at commit `589fda9` and wrote it to common-prompt.
- Team-lead's own PATCH 2 directive had specified "4 gates / 5 members" — a different framing than v2.
- Cal's v3 arrived ~2 minutes later with the corrected 4-gate/5-member framing.
- Team-lead recognized the error: commit `589fda9` committed the producer's text (Cal's v2) without cross-reading against the consumer's spec (team-lead's PATCH 2 directive). This is exactly the failure mode described by **Gate 2 (cross-read producer against consumer)** in the Structural Change Discipline section that was being committed.
- Corrected at commit `48ac09e`. The rule that was being promoted would have caught the promotion error if applied.

## Why This Is a Pattern, Not an Anecdote

Recursive validation is a predictable outcome whenever:

- A rule codifies a discipline that was previously informal.
- The promotion process itself involves the same kind of structural change the rule governs.
- The author's familiarity with the rule creates a false sense of compliance ("I wrote it, so I must be following it").

The third factor is the sharpest: expertise with a rule's content does not confer immunity to the rule's failure mode. The cross-read gate applies to everyone, including the person who approved it as L1 law.

## Related

- [`protocol-c-graduation-path.md`](../process/protocol-c-graduation-path.md) — the graduation cycle during which this recursive validation occurred
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — Gate 2 (cross-read), the specific gate that was violated and would have caught the error
- [`rule-erosion-via-reasonable-exceptions.md`](rule-erosion-via-reasonable-exceptions.md) — sibling pattern about rules being weakened over time; this entry is about rules being validated at birth

(*FR:Callimachus*)
