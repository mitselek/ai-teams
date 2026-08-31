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
  - designs/deployed/joosep/joosep.sh
source-commits: []
source-issues: []
related:
  - agreement-across-copies-is-worthless-when-they-share-one-source.md
  - ../patterns/state-the-membership-rule-of-the-set-you-counted.md
  - ../patterns/documentation-vs-substrate-truth-divergence.md
---

# The Exec Bit IS Tracked by Git -- and Two Working Clusters Are Not a "Mixed Convention"

**Gotcha (team-wide, observation-based, high confidence).**

## The fact, and the false claim that nearly shipped

**Git tracks the executable bit** as the file mode in the index and tree: `100755` (executable) vs `100644` (not). Brunel first wrote that the exec bit is *"not in git"* — **false**, and he corrected it himself. The consequence of the false version is the reason it matters: it **would have condemned every procedure we write to carrying a `chmod` step forever**, permanently, to work around a problem git already solves.

The files in question were not untracked-for-mode. They were simply **committed `100644`.**

**The fix is one command, and it changes the recorded mode without touching content:**

```
git update-index --chmod=+x <path>
```

> **Caveat that belongs with it** — see [`../process/runbook-source-tree-drifts-under-active-authorship-pin-by-checksum.md`](../process/runbook-source-tree-drifts-under-active-authorship-pin-by-checksum.md): this is true **of the blob**. On a box with `autocrlf`, the mode change can **re-materialise the working-tree file** and move its worktree md5 while the blob is unchanged. Verify against the blob.

## The measurement -- and its membership rule, stated

**Rule: every git-tracked `*.sh` under `designs/`, mode read from the INDEX.**

| Mode | Count |
|---|---|
| `100644` | 24 |
| `100755` | **6** |

**The six are not scattered. They are TWO DIRECTORY CLUSTERS** — `esl-legal/` (2) and `po-team/operator/` (4).

## Why the clustering inverts the reading -- this is the durable half

The weak reading is *"we have a mixed convention."* The correct one:

> **The correct practice exists here, twice, and did not propagate.**

And that is **worse**, not better:

> **Two deliberate clusters make the other 24 look like a considered choice. The working examples make the broken ones look deliberate.**

A uniformly-wrong corpus reads as an oversight someone will eventually fix. A corpus with **isolated islands of correctness** reads as a decision — the reader infers that if it mattered, it would have spread, and stops asking. **Partial adoption is not partial progress; it actively suppresses the question.**

## Second instance, armed right now

`smoke-test.sh` is mode `644` and is invoked as `./smoke-test.sh` by the a1.2 spec §7. It works **only** because §4 applies a blanket `chmod` first — **an accident, not a guard.** Anyone who removes §4's `chmod` as "redundant" breaks §7, and the failure will read as a §7 problem.

## Remedy

**Read the mechanism, do not maintain a record beside it.** The git index *is* the authority on the exec bit — `git ls-files --stage` answers it. Do not keep a list of which scripts are executable, and do not paper over the mode with a `chmod` in the procedure; **set the mode once in the index and let the index carry it.**

This is the same move as [`agreement-across-copies-is-worthless-when-they-share-one-source.md`](agreement-across-copies-is-worthless-when-they-share-one-source.md) — *stop maintaining a recorded copy; point at the thing that already computes it* — and it is one of the three findings that remedy unifies. **The umbrella over the three is recorded there and deliberately NOT filed, discounted for correlation.**

## Provenance

Submitted by Brunel via Protocol A 2026-08-31, including his own correction of the *"not in git"* claim. **The clustering reading is the librarian's sharpening of Brunel's "mixed convention"**, which Brunel accepted. The measurement is Brunel's, and it carries its membership rule inline — an instance of [`../patterns/state-the-membership-rule-of-the-set-you-counted.md`](../patterns/state-the-membership-rule-of-the-set-you-counted.md) applied correctly.

**`stage-2: pending`** — re-enveloped from Brunel's scratchpad rather than his submission message (the S67 inbox did not survive the session); fail-closed until **Brunel reads it back**.

(*FR:Brunel* submitted, measured, and self-corrected; *FR:Callimachus* clustering reading, classified and filed)
