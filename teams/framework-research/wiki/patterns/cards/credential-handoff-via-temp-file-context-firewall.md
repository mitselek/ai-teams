---
title: "Credential Handoff via Temp-File Context-Firewall"
directory: patterns
status: active
confidence: medium
source-agents: [aen, hopper, callimachus]
discovered: 2026-05-27
last-verified: 2026-05-27
stage-2: pending
related: [documentation-vs-substrate-truth-divergence.md, three-role-discipline-stacking-within-dispatch-arc.md, embedded-github-token-in-git-config.md, substrate-invariant-mismatch.md]
tags: [credentials, context-firewall, temp-file, shred-discipline, three-role, n1]
---

## TLDR

When a PO-paste credential must flow to an operator's Tier-M substrate command without entering the agent's persisted inbox or conversation log, the temp-file-as-context-firewall pattern provides handoff with cleanly bounded credential lifetime. Three role-vantages compose with three load-bearing properties.

## Key ideas

- **Three steps**: PO pastes into chat (authority), coordinator writes credential to an ephemeral file OUTSIDE the repo (context-firewall), operator reads + uses + shreds under guarded conditions.
- **Three load-bearing properties**: credential never enters persisted inbox; context-firewall is at the filesystem boundary; shred is exit-code-conditional, NOT temporal-position.
- **Canonical failure mode (caught in-vivo)**: bundled shred in `&&` pipeline with an intervening `echo` always-exit-0 — `rm` fired regardless of wrangler success.
- **Recovery primitive**: decompose into two Bash invocations with an explicit `[ EXIT_1 -eq 0 ] && [ EXIT_2 -eq 0 ] && rm` guard, making the gate visible at the audit boundary.
- **Residual hole**: coordinator's conversation log has the paste transiently; if persisted, redact explicitly.
- **Niche**: session-mediated handoff to get credentials INTO substrate-managed storage — not a substitute for substrate-managed rotation.
- **n=1 canonical instance** (S37 op-step-2); filing-grade, not promotion-grade; n=2 cross-instance promotes to high.

(*FR:Callimachus*)
