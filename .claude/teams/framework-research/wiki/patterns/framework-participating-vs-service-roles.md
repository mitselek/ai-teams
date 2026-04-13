---
source-agents:
  - celes
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files:
  - topics/01-team-taxonomy.md
  - topics/06-lifecycle.md
source-commits: []
source-issues: []
---

# Framework-Participating Roles vs. Service Roles

The provider strategy boundary for any role is determined by its relationship to the framework's governance substrate, not by capability or cost.

## Two Categories

### Framework-Participating Roles (Claude-only)

Use SendMessage, follow shutdown protocol, submit to Librarian, exercise authority per T04, and must comply with prompt-level behavioral restrictions. The framework's enforcement mechanisms (E0-E4) are calibrated for Claude's behavioral characteristics.

**Examples:** All team-leads, ARCHITECT, PURPLE, Librarian, Medici, code reviewers.

**Why Claude-only:** These roles are inside the five-layer lock-in model (infrastructure, protocol, knowledge, prompt, governance). Replacing the model requires re-validating all five layers.

### Service Roles (Provider-Agnostic)

Receive structured input, produce structured output, verified by automated tests or schema validation. Do not participate in governance, do not submit to the Librarian, do not exercise authority.

**Examples:** Eilama (codellama daemon), and potentially RED/GREEN in the XP pipeline.

**Why provider-agnostic:** These roles are below all five lock-in layers. Their output is validated structurally (tests pass or fail), not behaviorally (did the agent follow its prompt correctly?).

## Key Corollary: Tool vs. Agent

"Adding a non-Claude model does not mean adding a non-Claude agent." A vision API called via MCP is a **tool**, not an agent — it does not change the team's provider composition in any framework-meaningful sense. The multi-provider discussion should focus on **agents** (framework participants), not **tools** (external services).

This prevents scope creep: calling a Gemini vision endpoint as an MCP tool is not "going multi-provider." It is using an external service, no different from calling the Jira API or the Cloudflare API.

## Decision Flowchart

```
Does the role use SendMessage?
  YES → Framework-participating → Claude-only
  NO  → Does it submit to the Librarian?
          YES → Framework-participating → Claude-only
          NO  → Is its output verified by automated tests/schema?
                  YES → Service role → Provider-agnostic
                  NO  → Requires case-by-case assessment
```

## Provenance

- Discussion #56, Rounds 1-2 (Celes): role classification analysis
- T01 § Agent Role Taxonomy: role definitions
- T06 § Eilama lifecycle: daemon agent precedent
- Discussion #56 Round 1 (Brunel): sidecar vs. peer distinction (infrastructure view of the same boundary)

## Related

- [`integration-seam-governance-impact.md`](integration-seam-governance-impact.md) — sidecar/peer maps to service/framework-participating at the governance level
- [`five-layer-provider-lock-in.md`](five-layer-provider-lock-in.md) — framework-participating roles are inside all five layers; service roles are below them
- [`contract-enforcement-gap-non-claude.md`](../gotchas/contract-enforcement-gap-non-claude.md) — the enforcement gap applies only to service roles that scale beyond Eilama-class simplicity
- [`knowledge-coherence-as-provider-constraint.md`](../observations/knowledge-coherence-as-provider-constraint.md) — Librarian submission is the knowledge-layer boundary in the decision flowchart

(*FR:Callimachus*)
