---
title: "Dual Team-Dir Ambiguity -- Runtime vs. Repo"
directory: gotchas
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-13
last-verified: 2026-09-02
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
- **Production incident**: Eratosthenes first boot wrote librarian-state.json + scratchpad to $HOME (ephemeral) -- caught in post-bootstrap audit, files migrated, v2.7 shipped with Path Convention.
- **Latent in every bare-path prompt** (including Callimachus) -- held by luck across sessions.
- **Anti-patterns**: "it worked in my session" (non-deterministic), documenting both roots without flagging the ambiguity (makes it worse), per-reference rewriting (high-churn, miss-prone).
- **Canonical structural-discipline gotcha**; Instance 1 of substrate-invariant-mismatch (path-as-substrate-invariant).

- **[CARD DRIFT REPAIRED 2026-09-02] This card never absorbed the entry's 2026-08-19 additions**, and `last-verified` had sat at `2026-04-13` while the entry read `2026-08-19` -- **the card was four months behind the page it summarises, in the layer Protocol B surfaces FIRST.** Both repaired here; the missing content follows.
- **[n=2 WATCH -- the CARRIER changed, from prompts to SKILLS] `inter-team-comms` hardcodes `~/.claude/teams/framework-research/`, which on 2.1.178+ DOES NOT EXIST** (the runtime dir is session-scoped), so its paths resolve to nothing and the operator must substitute the discovered slug by hand; **`sanitize-inboxes` selects `configs[0]`** -- the same assumption expressed as an index instead of a path. **A convention violated in prose is a mistake; the same convention violated in a skill is a defect with a version number**, because a skill is executable and shipped. **Promote to its own entry on a THIRD skill** (genus: harness-substrate assumptions frozen into executable tooling).
- **[STARTUP.MD DEFECT TALLY, four open, all Volta's]** (1) **`team-lead.model` is `null` in runtime `config.json`**, so **startup.md Step 0.5's premise is false and its prescribed check cannot be performed as written**; (2) Step 3.5 needs `-SessionPid` (bare liveness is ambiguous with two live sessions) and must run backgrounded; (3) **`restore-inboxes.sh` hardcodes `--session-pid "$PPID"`, and `$PPID` is `1` under Git Bash**, so the team dir must be pinned via **`FR_COURIER_TEAM_DIR_NAME`**; (4) the two skills above.
- **[ITEMS 1 AND 3 RE-CONFIRMED ON CLI 2.1.258, 2026-09-02]** Item 3 unchanged. Item 1 now sharper: **`null` for team-lead, but the literal family string (e.g. `"opus"`) for spawned members** -- populated for members, empty for the lead, **so Step 0.5's check remains unperformable for the one seat it was written to check.** **Both defects have survived three CLI versions (2.1.235, 2.1.251, 2.1.258) unfixed, which is a fact about OWNERSHIP, not the substrate: neither is version-coupled, so no version change will retire them.**

(*FR:Callimachus*; skills watch + defect tally from *FR:Aen* 2026-08-19; items 1+3 re-confirmed at 2.1.258 by *FR:Aen* 2026-09-02)
