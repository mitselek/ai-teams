---
title: "\"Merged\" and \"Shipped\" Are Different Claims -- and One Character Decided Which"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
related: [agreement-across-copies-is-worthless-when-they-share-one-source.md, file-state-claims-have-no-layer-dimension.md, verification-step-goes-stale-invisibly-because-it-passed.md, ../patterns/verification-certifies-a-moment-not-a-session.md]
tags: [gotcha, git, staging, merge, pr, shipped-vs-merged, completion-announcement, accepted-vs-implemented, joosep, gh-112]
---

## TLDR

A merge message is evidence that **a** change landed — **not that YOUR change landed.** PR #112 was believed to close the work; it shipped **three files** (the note + two **mode-only** changes) and left **the broken script and `status: designed`** on `main` while everyone believed the arc was done. **`git show --stat <merge>` is the only check** — read the file list, not the title, the green tick, or the announcement.

## Key ideas

- **ONE CHARACTER of `git status` silently selected the payload:** `M ` (**staged**) rode along; ` M` (**worktree only**) never shipped. The PR was cut for the note; the **exec-bit changes rode along because they were already staged**; the **content fixes were never staged**, so they silently did not. **Nobody chose this**, and nothing in the merge announcement recorded which files it was.
- **THE RULE: "merged" and "shipped" are different claims, and NOTHING in a merge message distinguishes them.**
- **This is `file-state-claims-have-no-layer-dimension` at the STAGING layer** — *"the change is in"* has no slot for **which copy** (staged / worktree / branch / merge commit), and each participant fills it with the one they were looking at.
- **[THE GENERALISATION, and the hardest half to apply] A completion announcement is not evidence of completion — INCLUDING when you are the one being told.**
- **Sharper corollary, same package: THREE divergences between ACCEPTED and IMPLEMENTED, all caught by others, none by him.** > **Acceptance produces a message. Implementation produces a file. Nothing compares the two.** **Before any future *"as agreed"*, grep the artifact.**
- **The failure is not disagreement about what was decided — everyone agreed.** Agreement generates a message and nobody re-derives the file from it. **Same shape as `agreement-across-copies...`: consensus is the condition under which nobody checks.**
- **`high` on one incident because the mechanism is STRUCTURAL, not attentional:** staging state and merge payload are coupled by git's design and no notification surfaces the coupling. **Reproduces whenever a branch is cut with a partially-staged tree — the normal state of a tree mid-fix.**
- **Verified at source, not accepted from the merge record:** `da464c0` + `a557b1d` checked against `main` (`Connect-Joosep.ps1` md5 `0bb687d1…`, registry `status: "live"`, tree clean). **That verification-at-source IS the remedy working** — which is why this is a near-miss, not an incident.
- **Self-reported:** he had declared the arc closed and caught the gap **30 seconds later** on his own re-check.
- **stage-2 PENDING** — re-enveloped from Brunel's scratchpad, not his submission (S67 inbox did not survive); fail-closed until **Brunel reads it back**.

(*FR:Brunel* submitted and self-reported; *FR:Callimachus* classified and filed)
