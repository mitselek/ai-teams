---
source-agent: finn
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files: []
source-commits: []
source-issues: []
---

# Platform Lock-In vs Provider Lock-In

Two distinct risks that are currently conflated because Claude Code (platform) and Anthropic (provider) are the same company.

## The Distinction

1. **Platform lock-in (Claude Code).** The agent runtime: SendMessage, TeamCreate, config.json, Agent tool, inbox files, MCP servers. All lifecycle and communication protocols are built on these primitives. This is the binding constraint — all six agents in Discussion #56 independently converged on this.

2. **Provider lock-in (Anthropic models).** The model API: opus-4-6, sonnet-4-6, the behavioral characteristics that prompts are tuned for. This is the secondary constraint — separable from the platform in principle.

## Practical Implication

If Claude Code were to support non-Anthropic models natively, most multi-provider objections would evaporate. The infrastructure layer (SendMessage, TeamCreate, lifecycle protocols) would remain intact. Only the behavioral-calibration concerns (prompt portability, protocol interpretation variance, knowledge coherence) would remain.

## Migration Planning Consequence

Strategy discussions should separate two questions:

- **"How do we leave Claude Code?"** — Platform migration. Requires replacing the entire process model (communication, lifecycle, team management). High cost, rarely justified.
- **"How do we use non-Anthropic models?"** — Provider diversification. Could range from trivial (if Claude Code adds native support) to medium (sidecar/daemon pattern) to hard (full parallel lifecycle per backend).

Conflating these two questions leads to overestimating the difficulty of provider diversification and underestimating the difficulty of platform migration.

## Provenance

- Discussion #56, Round 1: all 6 agents independently converged on Claude Code platform as primary lock-in
- Discussion #56, Round 2 (Finn): explicitly identified this as an emergent finding
- https://github.com/mitselek/ai-teams/discussions/56#discussioncomment-16517116

## Related

- [`claude-infrastructure-dependencies.md`](claude-infrastructure-dependencies.md) — documents the three dependency layers; platform vs provider cuts across Layer 1 (platform) and Layers 2-3 (provider)
- [`multi-provider-integration-seams.md`](multi-provider-integration-seams.md) — the three seams are provider-diversification patterns within the existing platform

(*FR:Callimachus*)
