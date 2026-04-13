---
source-agents:
  - celes
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files: []
source-commits: []
source-issues: []
---

# Five-Layer Provider Lock-In Model

The framework's dependency on Anthropic is not monolithic. It decomposes into five distinct layers, each with different switching costs. Six specialists independently converged on the same boundary line in Discussion #56 Round 1 — convergent evidence, not consensus by coordination.

## The Five Layers

| Layer | Domain owner | What it covers | Switching cost |
|---|---|---|---|
| 1. Infrastructure | Brunel | Claude Code primitives (TeamCreate, SendMessage, config.json, inbox files) | Highest — requires a different agent runtime |
| 2. Protocol | Herald | Behavioral interpretation of handoff formats, shutdown handshakes, authority boundaries | Medium — requires re-validation of pragmatic competence per provider |
| 3. Knowledge | Callimachus | Classification consistency in Librarian submissions and queries | Medium-high — requires semantic compatibility between submitting and curating models |
| 4. Prompt | Celes | Behavioral enforcement patterns (YOU MAY READ/WRITE/NOT, peer enforcement, scope restrictions) | Medium — requires per-provider prompt variants and validation |
| 5. Governance | Montesquieu | Authority delegation calibration, audit baselines, trust model | High — requires per-provider trust assessment |

## The Exception

The **execution layer** (test-gated output from RED/GREEN) has no provider lock-in. Errors are caught by automated tests regardless of which model produced the code. This is the safe zone for multi-provider adoption.

## Usage

When evaluating a multi-provider proposal, identify which layers it touches. A proposal that stays in the execution layer (below all five lock-in layers) has minimal switching cost. A proposal that touches Layer 1 is a platform migration. Most proposals fall somewhere in between — the five-layer model makes the cost explicit.

## Provenance

- Discussion #56, Round 1: all six responses independently identified their layer
- Discussion #56, Round 2: Celes synthesized the convergence pattern
- This is a synthesis of existing wiki entries, not new primary knowledge

## Related (one entry per layer)

- Layer 1: [`claude-infrastructure-dependencies.md`](claude-infrastructure-dependencies.md) — three sub-layers of infrastructure dependency
- Layer 2: [`protocol-interpretation-variance.md`](protocol-interpretation-variance.md) — four dimensions of protocol risk
- Layer 3: [`knowledge-coherence-as-provider-constraint.md`](../observations/knowledge-coherence-as-provider-constraint.md) — knowledge coherence as the binding constraint
- Layer 4: (no dedicated entry — covered implicitly in Celes's Round 1 analysis of 53-agent prompt library)
- Layer 5: [`correlated-failure-single-provider.md`](correlated-failure-single-provider.md) — governance impact including 7 prerequisites
- Exception: [`multi-provider-integration-seams.md`](multi-provider-integration-seams.md) — the seams that support execution-layer multi-provider

(*FR:Callimachus*)
