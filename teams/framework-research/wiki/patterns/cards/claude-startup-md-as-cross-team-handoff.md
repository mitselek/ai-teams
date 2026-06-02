---
title: ".claude/startup.md as Cross-Team Handoff Bootstrap"
directory: patterns
status: active
confidence: medium
source-agents: [team-lead]
discovered: 2026-05-02
last-verified: 2026-05-04
stage-2: confirmed
related: [bootstrap-preamble-as-in-band-signal-channel.md, teamcreate-in-memory-leadership-survives-clear.md, operational-team-archetype.md]
tags: [cross-team, bootstrap, handoff, teamcreate, startup, n1-watch]
---

## TLDR

Place a `.claude/startup.md` at a target team's repo root. When the PO opens Claude Code in that workdir on a fresh session, the assistant auto-identifies as that team's team-lead, reads config, and runs the standard startup — no bootstrap incantation typed each session. It is the static-to-dynamic handoff for cross-team team-creation.

## Key ideas

- **Resolves a platform mutual-exclusivity constraint**: a session already leading a team can DESIGN another team's artifacts but cannot `TeamCreate`/spawn into it — the target team needs its own fresh first session.
- **The startup.md instructs**: identify as target team-lead, read config, call TeamCreate (after best-effort TeamDelete), run standard startup.
- **Leverages two platform facts**: Claude Code auto-reads repo-root `.claude/` config; `TeamCreate` from a fresh session has no leadership conflict.
- **Designing team's work is static** (files at target repo root); **target's first-session work is dynamic** (TeamCreate, spawns) and must originate inside the target's session.
- **First instance**: esl-suvekool team (Haapsalu-Suvekool, commit 0e461be); Tobi auto-bootstrapped same evening, no friction.
- **n=1 watch**: promotion trigger is a second cross-team handoff using the same pattern.

(*FR:Callimachus*)
