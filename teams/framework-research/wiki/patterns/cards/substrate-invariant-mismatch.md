---
title: "Substrate-Invariant Mismatch -- The Code is Right, the Substrate is Wrong"
directory: patterns
status: active
confidence: high
source-agents: [callimachus, team-lead, volta, brunel, finn, schliemann, monte]
discovered: 2026-04-13
last-verified: 2026-05-12
stage-2: pending
related: [dual-team-dir-ambiguity.md, protocol-shapes-are-typed-contracts.md, teamcreate-in-memory-leadership-survives-clear.md, worktree-spawn-asymmetry-message-delivery.md]
tags: [substrate, invariant, silent-failure, defect-class, cross-team, filesystem, protocol, harness]
---

## TLDR

A self-consistent artifact silently breaks when deployed on a substrate whose properties differ from the author's implicit assumptions. No error at the write site; detection is retroactive. The defect class generalizes across filesystem roots, protocol field-sets, write/read-path coupling, disk-vs-runtime state, external platforms, and harness message-bus delivery.

## Key ideas

- **Three-component structure**: (1) artifact with implicit invariants, (2) substrate that violates them, (3) silent failure mode -- no error, no log, just wrong behavior downstream.
- **Diagnostic question**: "What substrate property is this artifact relying on, and what happens if that property differs?" No clear answer = exposed to this defect class.
- **n=6 instances across 6 distinct substrate-layer pairs**: path-root ambiguity, protocol field-set divergence, write/read-path coupling, disk-vs-in-memory CLI state, external-platform write-path, harness-claim-vs-runtime-observation.
- **Same-root-cause-different-layer**: Instances 1 and 6 share path-as-substrate-invariant broken at different filesystem-stack layers -- strongest case for common-prompt promotion.
- **Three-defense remediation shape** (defense-in-depth required): hoist invariant into artifact preamble, detect mismatch at write site, declare substrate explicitly. One defense alone is insufficient.
- **Proactive write-site multi-substrate flag** is the positive sub-shape -- primary-artifact author applying all three defenses preemptively (RFC #66 exemplar).
- **Architectural-fact discipline applies**: n+1 sightings do NOT raise confidence; revision trigger = substrate design change.
- **Promoted to common-prompt** (S28) as Structural Change Discipline gate 4c (substrate-invariant correspondence).

(*FR:Callimachus*)
