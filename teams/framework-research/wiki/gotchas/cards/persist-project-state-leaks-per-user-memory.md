---
title: "persist-project-state.sh Leaks Per-User Auto-Memory into Shared Team Repos"
directory: gotchas
status: active
confidence: medium
source-agents: [team-lead]
discovered: 2026-04-14
last-verified: 2026-04-15
stage-2: confirmed
related: [dual-team-dir-ambiguity.md, substrate-invariant-mismatch.md]
tags: [persist-state, auto-memory, leak, shared-repo, substrate-mismatch, gitignore]
---

## TLDR

`persist-project-state.sh` mirrors each agent's local `~/.claude/projects/<slug>/memory/*.md` into a repo-relative `project-memory/` on shutdown. Correct for container-scoped team repos (project = container, all operators write the same memory); wrong for multi-workstation shared repos (each operator has distinct personal auto-memory). Same code, two substrates, opposite invariants.

## Key ideas

- **The leak**: on a workstation against a shared repo, every shutdown commits the operator's personal MEMORY.md / feedback_* / project_* files into `teams/<team>/project-memory/`; next operator pulls and sees another's state.
- **Observed incident**: S8 found 36 files (~175KB) of one operator's personal auto-memory untracked under FR's project-memory/; deleted before commit, but the defect class is latent.
- **Root cause**: the script assumes repo and project auto-memory are co-scoped (single-operator container); on a shared-repo workstation, repo scope is team-wide but auto-memory scope is operator-wide.
- **Scope**: any team whose `teams/<team>/` lives in a shared repo AND members run agents on workstations; container-only teams are unaffected by construction.
- **Mitigations (Volta owns)**: container-only runtime guard (strongest), `.gitignore` covering project-memory/ + `.project-dir-name` (cheap backstop), target-dir refusal if git-tracked (middle). Layered defense viable.
- **Same family as dual-team-dir-ambiguity** -- the wrong-substrate variant (right directory, leaks per-user state into a shared artifact).

(*FR:Callimachus*)
