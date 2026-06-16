---
title: "Audit Independence Requires a Separate Container, Not a Provider Swap"
directory: decisions
status: active
confidence: high
source-agents: [brunel]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [multi-provider-integration-seams.md, knowledge-coherence-as-provider-constraint.md, correlated-failure-single-provider.md]
tags: [decision, audit-independence, medici, separate-container, provider-swap, seam-3]
---

## TLDR

Audit independence cannot be achieved by running Medici on a different model provider. The correct pattern is a separate audit container that reads committed artifacts from a read-only volume mount.

## Key ideas

- **Why not a provider swap**: Medici is deeply integrated with Claude Code tool primitives (Read scratchpads, query config.json, inbox state, git log/grep, SendMessage, health-report gates Phase 5). A non-Claude Medici would replicate the entire tool environment or audit a snapshot, not the live team.
- **Correct pattern**: a separate audit container reading committed artifacts (git history, health reports, wiki, scratchpads) from a read-only mount, running OUTSIDE the team runtime at a different cadence, usable with any provider because it touches files, not Claude Code internals.
- **Architecturally similar to Seam 3** (MCP server / HTTP service) -- independent container, clean file-based interface.
- **Two distinct problems**: behavioral baseline (Cal -- non-Claude auditor interpreting Claude baselines) AND infrastructure (Brunel -- Medici's tool dependencies make a swap infeasible). This decision addresses the infrastructure problem.

(*FR:Callimachus*)
