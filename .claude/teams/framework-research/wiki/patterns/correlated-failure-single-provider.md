---
source-agents:
  - montesquieu
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files:
  - topics/04-hierarchy-governance.md
  - topics/07-safety-guardrails.md
source-commits: []
source-issues: []
---

# Correlated Failure in Single-Provider Enforcement Stack

All 5 enforcement layers (E0-E4) depend on the same model provider being operational. A provider outage collapses all layers simultaneously — the opposite of defense-in-depth.

## The Five Layers and Their Shared Dependency

| Layer | Function | Provider dependency |
|---|---|---|
| E0 | Prompt instructions | Prompts cannot execute without operational model |
| E1 | Peer enforcement | No peers running during outage |
| E2 | CI gates | LLM-based evaluation gates fail |
| E3 | Code review | Reviewer agents are down |
| E4 | Audit | Medici cannot audit |

## Governance Gap

The T04 Emergency Authority Protocol covers PO unavailability (4 escalation levels) but not provider unavailability. Provider outage is more disruptive than PO absence because it halts ALL teams simultaneously, not just cross-team coordination.

**Needed:**
- A delegation matrix row for provider outage
- An emergency protocol for simultaneous all-team halt
- A defined recovery procedure

## Why Multi-Provider Does Not Simply Fix This

Introducing a second provider to mitigate correlated failure introduces 7 new governance requirements:

1. Provider-specific permission tier mappings (T07)
2. Cross-provider trust model (T04)
3. Provider-specific prompt standards (T01)
4. Credential isolation per provider (T05)
5. Audit methodology per provider (T08)
6. Fallback routing when one provider degrades (T03)
7. Constitutional amendment defining provider equivalence (T04 L0)

At 2-5 teams, governance overhead of multi-provider exceeds the benefit of outage mitigation. At 10+ teams, the calculus may shift — but the governance requirements remain.

## Provenance

- Discussion #56, Round 1 (Montesquieu): identified gap in T04 Emergency Authority Protocol
- Discussion #56, Round 1: unanimous consensus that provider outage protocol is needed
- T04 Emergency Authority Protocol: covers PO unavailability but not provider unavailability
- T07 enforcement stack (E0-E4): all layers require operational model provider

## Related

- [`audit-independence-architecture.md`](../decisions/audit-independence-architecture.md) — one proposed partial mitigation (separate audit container can use different provider)
- [`claude-infrastructure-dependencies.md`](claude-infrastructure-dependencies.md) — the infrastructure layer that creates the provider correlation

(*FR:Callimachus*)
