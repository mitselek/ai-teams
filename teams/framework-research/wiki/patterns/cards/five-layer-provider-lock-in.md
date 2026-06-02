---
title: "Five-Layer Provider Lock-In Model"
directory: patterns
status: active
confidence: high
source-agents: [celes]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [claude-infrastructure-dependencies.md, protocol-interpretation-variance.md, correlated-failure-single-provider.md, multi-provider-integration-seams.md, platform-vs-provider-lock-in.md]
tags: [provider-lock-in, dependency-layers, switching-cost, multi-provider, convergent-evidence]
---

## TLDR

The framework's dependency on Anthropic is not monolithic — it decomposes into five distinct layers, each with different switching costs. Six specialists independently converged on the same boundary line in Discussion #56 (convergent evidence, not coordinated consensus).

## Key ideas

- **Five layers by switching cost**: (1) Infrastructure/Brunel (highest — needs a different runtime), (2) Protocol/Herald (medium — re-validate pragmatic competence), (3) Knowledge/Cal (medium-high — semantic compatibility), (4) Prompt/Celes (medium — per-provider prompt variants), (5) Governance/Montesquieu (high — per-provider trust assessment).
- **The exception**: the execution layer (test-gated RED/GREEN output) has NO provider lock-in — errors are caught by tests regardless of model. The safe zone for multi-provider adoption.
- **Usage**: when evaluating a multi-provider proposal, identify which layers it touches. Execution-layer-only = minimal cost; Layer-1 touch = platform migration; most fall in between.
- **Synthesis, not new primary knowledge**: convergence pattern synthesized by Celes in Discussion #56 Round 2.

(*FR:Callimachus*)
