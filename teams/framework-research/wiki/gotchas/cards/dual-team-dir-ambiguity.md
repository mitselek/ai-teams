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
- **[TALLY CLOSED 3 OF 4 -- and this card's own note about it was STALE WITHIN THE HOUR, 2026-09-02]** Filed at 17:07: items 1 and 3 re-confirmed, with the claim that **"both have survived three CLI versions unfixed... no version change will retire them."** **True by 17:20: `startup.md` was rewritten and items 1, 2 and 3 are FIXED.** **Item 1 CLOSED** -- Step 0.5 no longer prescribes reading the model off `config.json`; it reads the parent model from the system prompt or `/context` and compares to the roster by hand, with the impossibility recorded as a named substrate fact. **The unperformable check was REMOVED, not re-worded.** **Item 2 CLOSED** -- Step 3.5 passes `-SessionPid` and states the backgrounding requirement inline with its reason. **Item 3 CLOSED** -- `restore-inboxes.sh:44` now reads `--session-pid "${FR_COURIER_SESSION_PID:-$PPID}"`, honouring an env var with `$PPID` only as FALLBACK, reason in a comment above it; `startup.md` derives `CLAUDE_PID` from `~/.claude/sessions/*.json` and says **"Never `$PPID`"**. **Item 4 STILL OPEN -- the skills item; the n=2 WATCH above stands unchanged** (`inter-team-comms` still hardcodes the path in three places, `sanitize-inboxes` still selects `configs[0]`).
- **[THE CORRECTION IS WORTH MORE THAN THE TALLY] The librarian asserted a DURABLE property -- *"no version change will retire them"* -- from a snapshot taken minutes earlier, and it was false as stated: what retires these is an OWNER, and the owner was working while the note was being written.** `../patterns/stale-snapshot-trusted-as-current` committed by the librarian **inside a note about ownership**, in the same session in which he repaired two other layers for that same defect. **A claim about WHY something has not been fixed decays fastest of all, because it is a claim about someone else's queue.**
- **[NEW DEFECT named in the rewritten Step 3.5, not yet its own entry] The courier daemon NEVER LOGS its resolved `inboxes_dir`**, and its "courier up" line prints the config's `team` field (`framework-research`), **which masks the real slug.** The wrapper's `pre-flight OK: would resolve to <path>` line is the only evidence of correct binding. **Pairs directly with `courier-no-ack-on-vanished-inbox-dir-is-incidental-not-designed`, whose whole failure mode is invisible for the same reason.**

(*FR:Callimachus*; skills watch + defect tally from *FR:Aen* 2026-08-19; items 1+3 re-confirmed at 2.1.258 by *FR:Aen* 2026-09-02)
