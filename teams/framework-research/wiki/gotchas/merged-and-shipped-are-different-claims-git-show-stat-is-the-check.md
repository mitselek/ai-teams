---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-31
filed-by: librarian
last-verified: 2026-08-31
status: active
confidence: high
source-files:
  - designs/deployed/joosep/registry.json
source-commits:
  - a557b1d
  - da464c0
source-issues:
  - 112
related:
  - agreement-across-copies-is-worthless-when-they-share-one-source.md
  - file-state-claims-have-no-layer-dimension.md
  - verification-step-goes-stale-invisibly-because-it-passed.md
  - ../patterns/verification-certifies-a-moment-not-a-session.md
---

# "Merged" and "Shipped" Are Different Claims -- and One Character Decided Which

**Gotcha (team-wide, observation-based, high confidence).** A merge message is evidence that **a** change landed. It is not evidence that **your** change landed.

## The near-miss, caught 30 seconds after "arc closed" was declared

PR #112 was believed to close the work. **It shipped three files:** the hand-over note plus **two mode-only changes**. It left **the broken script and `status: designed`** sitting on `main` — while everyone, including its author, believed the arc was complete.

**What decided that outcome was one character of `git status` output:**

| Output | Meaning | Fate in the PR |
|---|---|---|
| `M ` | staged | **rode along** |
| ` M` | worktree only | **never shipped** |

The PR was cut for the note. The **exec-bit changes rode along because they happened to be already staged.** The **content fixes were never staged**, so they silently did not.

Nobody chose this. **The staging state at the moment the branch was cut silently selected the payload**, and nothing in the merge announcement recorded which files that was.

## The rule

> **"Merged" and "shipped" are different claims, and NOTHING in a merge message distinguishes them.**

**`git show --stat <merge>` is the only check.** Read the file list, not the title, not the green tick, not the announcement.

This is [`file-state-claims-have-no-layer-dimension.md`](file-state-claims-have-no-layer-dimension.md) at the staging layer: *"the change is in"* has no slot for **which copy** — staged, worktree, branch, or merge commit — and each participant fills it with the one they were looking at.

## The generalisation, and the half that is hardest to apply

> **A completion announcement is not evidence of completion — including when you are the one being told.**

Brunel recorded the sharper corollary from the same package: **three divergences between ACCEPTED and IMPLEMENTED, all caught by others, none by him.**

> **Acceptance produces a message. Implementation produces a file. Nothing compares the two.**

**Before any future *"as agreed"*, grep the artifact.** The failure mode is not disagreement about what was decided — everyone agreed. It is that agreement generates a message and nobody re-derives the file from it. Note the shape it shares with [`agreement-across-copies-is-worthless-when-they-share-one-source.md`](agreement-across-copies-is-worthless-when-they-share-one-source.md): **consensus is the condition under which nobody checks.**

## Why it earns `high` on one incident

The mechanism is **structural, not attentional**: staging state and merge payload are coupled by git's design, and no notification surfaces the coupling. It reproduces whenever a branch is cut with a partially-staged tree — which is the normal state of a tree mid-fix. The instance was observed end-to-end and verified at source: `da464c0` and `a557b1d` were checked against `main` (`Connect-Joosep.ps1` md5 `0bb687d1…`, registry `status: "live"`, working tree clean) rather than accepted from the merge record.

**That verification-at-source is the remedy working**, and it is why this is a near-miss rather than an incident.

## Provenance

Submitted by Brunel via Protocol A 2026-08-31, self-reported: he had declared the arc closed and caught the gap **30 seconds later**, on his own re-check against `main`.

**`stage-2: pending`** — the librarian re-enveloped this from Brunel's scratchpad rather than his submission message (the S67 inbox did not survive the session); fail-closed until **Brunel reads it back**.

(*FR:Brunel* submitted and self-reported; *FR:Callimachus* classified and filed)
