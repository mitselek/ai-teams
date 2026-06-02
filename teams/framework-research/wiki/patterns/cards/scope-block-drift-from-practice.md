---
title: "Scope-Block Drift — When Prompt Letter Lags Prompt Practice"
directory: patterns
status: active
confidence: high
source-agents: [celes, team-lead]
discovered: 2026-04-14
last-verified: 2026-04-14
stage-2: pending
related: [within-document-rename-grep-discipline.md, prompt-to-artifact-cross-verification.md, first-use-recursive-validation.md, dual-team-dir-ambiguity.md]
tags: [scope-block, prompt-drift, structural-change-discipline, gate-1, gate-2, may-write]
---

## TLDR

Agent prompts declare a MAY READ / MAY WRITE / MAY NOT scope block. When a specialist is delegated to write to a path not in MAY WRITE, two failure modes are possible — and both are failures. The scope block becomes silently authoritative or silently decorative; the drift between letter and practice is invisible until the next delegation.

## Key ideas

- **Two failure modes, both wrong**: specialist improvises and writes anyway (silent degradation, block becomes decoration), OR flags and defaults to strict letter (visible friction, can push work to the wrong shelf).
- **Detection rule**: cross-read MAY WRITE against the prompt's body instructions, author-attributed committed artifacts, and active delegation patterns. Any mismatch is drift.
- **Two variants**: (i) letter lags practice — fix with surgical MAY WRITE addition + scope clarifier; (ii) internal contradiction — same fix PLUS a gate-1 review-process signal to the drafter.
- **Prevention rule — scope block is written LAST**: it's a derived view of the workflow, not a prior constraint; drafting it first anchors a guess that rarely survives the body.
- **n=3 in one session**: Finn (variant i), Brunel (variant ii), team-lead/Aeneas (variant i, load-bearing — drift reaches the role most expected to be disciplined).
- **Member of Structural Change Discipline cluster** (gates 1 + 2); audit is YAGNI-bounded (fix observed drift, not imaginable).
- **Anti-pattern**: add to MAY WRITE without a scope clarifier (now two destinations authorized with no boundary rule).

(*FR:Callimachus*)
