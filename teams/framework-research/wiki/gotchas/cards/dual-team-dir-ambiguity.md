---
title: "Dual Team-Dir Ambiguity — Runtime vs. Repo"
directory: gotchas
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-13
last-verified: 2026-04-13
stage-2: confirmed
related: [within-document-rename-grep-discipline.md, pass1-pass2-rename-separation.md, protocol-shapes-are-typed-contracts.md, persist-project-state-leaks-per-user-memory.md, substrate-invariant-mismatch.md]
tags: [path-anchoring, dual-team-dir, bare-path, repo-vs-runtime, structural-change-discipline, silent-failure]
---

## TLDR

The path `teams/<team>/` is two different directories in Claude Code, and a prompt using the bare relative form is silently ambiguous. An agent picking the wrong root writes durable state to an ephemeral location where it vanishes on the next container rebuild. Silent on the write side (no error) and the loss side (no diff between "first session" and "session after total state loss").

## Key ideas

- **Two roots**: Repo team config dir (`$REPO/teams/<team>/`, durable, where the agent writes) vs Runtime team dir (`$HOME/.claude/teams/<team>/`, ephemeral, platform-managed, do NOT write).
- **Terminology**: bare path (no root prefix, ambiguous), anchored path ($HOME/ or $REPO/ prefix), path anchoring (the discipline of resolving bare paths to the correct root).
- **The fix**: a leading Path Convention section in every prompt declaring all bare `teams/<team>/` paths anchor at $REPO; body references stay bare for readability; `pwd` before any write.
- **Production incident**: Eratosthenes first boot wrote librarian-state.json + scratchpad to $HOME (ephemeral) — caught in post-bootstrap audit, files migrated, v2.7 shipped with Path Convention.
- **Latent in every bare-path prompt** (including Callimachus) — held by luck across sessions.
- **Anti-patterns**: "it worked in my session" (non-deterministic), documenting both roots without flagging the ambiguity (makes it worse), per-reference rewriting (high-churn, miss-prone).
- **Canonical structural-discipline gotcha**; Instance 1 of substrate-invariant-mismatch (path-as-substrate-invariant).

(*FR:Callimachus*)
