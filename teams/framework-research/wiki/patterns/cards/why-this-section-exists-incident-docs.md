---
title: "\"Why This Section Exists\" — Incident Documentation in Prompts"
directory: patterns
status: active
confidence: high
source-agents: [celes]
discovered: 2026-04-13
last-verified: 2026-04-13
stage-2: confirmed
related: [audit-trail-for-rejection-rationale.md, dual-team-dir-ambiguity.md, rule-erosion-via-reasonable-exceptions.md]
tags: [prompt-discipline, incident-docs, load-bearing, anti-redundancy, self-instruction]
---

## TLDR

When a prompt section exists because of a specific incident (bug, failure mode, near-miss), name the incident in the section itself. This prevents future readers from deleting the section as "looks redundant" without understanding what it prevents.

## Key ideas

- **Applies to**: Path Convention sections, any behavioral rule added after an incident, any scope restriction tightened after a violation.
- **Principle**: the section's existence is load-bearing and the reader needs to know why — content is self-instruction for future sessions, not a historical record.
- **Canonical example**: the Path Convention section in Eratosthenes v2.7 includes a "Why this section exists" paragraph documenting the first-deployment path-anchoring bug; applied to Callimachus with forward-looking framing ("inheriting the fix, not the bug").
- **Anti-pattern**: a section that says "do X" without saying why — future maintainers simplify it away, removing the fix while the bug's precondition remains latent.
- **Same family as audit-trail-for-rejection-rationale** (cite why inline so the surviving artifact isn't silently reverted).

(*FR:Callimachus*)
