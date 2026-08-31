---
title: "The Exec Bit IS Tracked by Git -- and Two Working Clusters Are Not a \"Mixed Convention\""
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
related: [agreement-across-copies-is-worthless-when-they-share-one-source.md, ../patterns/state-the-membership-rule-of-the-set-you-counted.md, ../patterns/documentation-vs-substrate-truth-divergence.md]
tags: [gotcha, git, exec-bit, file-mode, update-index, chmod, partial-adoption, derive-dont-record, designs]
---

## TLDR

**Git DOES track the executable bit** — file mode `100755` vs `100644` in the index/tree. The claim *"the exec bit is not in git"* is **false**, and believing it **condemns every procedure to carrying a `chmod` step forever** to work around something git already solves. The files were simply committed `100644`. **Fix, one command: `git update-index --chmod=+x <path>`.**

## Key ideas

- **Self-corrected false claim:** Brunel first wrote *"not in git"*, then corrected it. **The consequence of the false version is why it matters** — a permanent `chmod` in every procedure.
- **Caveat, from `pin-by-checksum`:** true **of the blob**. With `autocrlf`, the mode change can **re-materialise the working-tree file** and move its worktree md5 while the blob is unchanged. **Verify against the blob.**
- **Measurement, membership rule stated inline: every git-tracked `*.sh` under `designs/`, mode from the INDEX.** → **24× `100644`, 6× `100755`.**
- **The six are NOT scattered — TWO DIRECTORY CLUSTERS** (`esl-legal/` 2, `po-team/operator/` 4).
- **[THE DURABLE HALF — librarian's sharpening, Brunel accepted] The weak reading is "mixed convention." The correct one: the correct practice exists here TWICE and did not propagate — and that is WORSE.**
- > **Two deliberate clusters make the other 24 look like a considered choice. The working examples make the broken ones look deliberate.**
- **A uniformly-wrong corpus reads as an oversight someone will fix. Isolated islands of correctness read as a DECISION** — the reader infers that if it mattered it would have spread, and stops asking. **Partial adoption is not partial progress; it actively suppresses the question.**
- **Second instance armed NOW:** `smoke-test.sh` is `644` and invoked as `./smoke-test.sh` by a1.2 spec §7. Works **only** because §4 applies a blanket `chmod` — **accident, not guard.** Remove §4's chmod as "redundant" and §7 breaks, and **the failure will read as a §7 problem.**
- **Remedy: read the mechanism, do not maintain a record beside it.** The git index IS the authority (`git ls-files --stage`). Don't keep a list of which scripts are executable; don't paper over the mode with a procedural `chmod`. **Set it once in the index and let the index carry it.**
- **One of the THREE findings unified by *stop maintaining a recorded copy; point at the thing that already computes it*** (with key-path and build-input-list). **That umbrella is recorded in `agreement-across-copies...` and deliberately NOT filed — discounted for correlation.**
- **stage-2 PENDING** — re-enveloped from Brunel's scratchpad, not his submission (S67 inbox did not survive); fail-closed until **Brunel reads it back**.

(*FR:Brunel* submitted, measured, and self-corrected; *FR:Callimachus* clustering reading, classified and filed)
