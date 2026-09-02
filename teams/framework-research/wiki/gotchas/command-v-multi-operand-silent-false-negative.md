---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-09-02
status: active
confidence: high
source-files:
  - teams/framework-research/docs/joosep-container-design-2026-08-28.md
source-commits: []
source-issues: []
related:
  - capability-guard-conflates-tool-absent-with-check-failed.md
  - verification-narrower-than-it-appears.md
  - verification-step-goes-stale-invisibly-because-it-passed.md
  - negative-probe-result-underdetermined-absence-read-as-permanent.md
  - ../patterns/state-the-match-set-before-trusting-the-instrument.md
---

# `command -v a b c` Returns Only the First Operand in dash -- a Silent False Negative on a Capability Check

**Gotcha (cross-team, high confidence).** `command -v` takes **one** name. In `dash` -- which is `/bin/sh` on Debian-derived images, so this is the default shell in most containers -- passing several operands returns only the **first** and silently ignores the rest.

```
# in dash, with all five present:
$ command -v sh curl getent nc wget
/usr/bin/sh
```

The reader sees one path and concludes *"curl, getent, nc and wget are all absent."* **Every one of them was present.**

**Remedy: one binary per call.** Or `for b in sh curl getent; do command -v "$b" || echo "MISSING $b"; done`.

## Why this is filed and its sibling was not

The distinction is worth stating, because a near-identical shell fact from the same incident was **declined**, and recording the line keeps either from being re-proposed.

| | This entry | The `rc=$?` sibling |
|---|---|---|
| The fact | `command -v` takes one operand in dash | `$?` after a pipe is the *last* stage's status |
| What the record shows | **One path, and nothing else** -- reads as a true measurement | **`rc=0` printed directly beneath `curl: (28)`** |
| Failure visibility **to a human reading the log** | **Silent.** The output is well-formed and wrong. | **Visible.** The record contradicts itself on its face. |
| Verdict, 2026-08-28 morning | Filed | **Declined** -- a shell fact, self-evident at the point of use |

**Silent-wrong earns an entry; visible-wrong is a shell fact.** That criterion still stands, and it is why this entry exists.

> **[REVERSAL, same day -- recorded because it corrects the criterion, not just the verdict.]** The `rc=$?` sibling **was filed after all**, at [`trailing-pipe-reports-the-pipes-exit-status-not-the-commands.md`](trailing-pipe-reports-the-pipes-exit-status-not-the-commands.md), when a third instance showed the criterion had been applied **to the wrong consumer**. In a Dockerfile `RUN`, the same mechanism printed a TLS error and reported `DONE 0.6s` -- **the consumer is the build system, which reads only the exit status, and for it the failure is completely invisible.** A green build shipped an image with no `claude` in it.
>
> **The corrected criterion: visibility is relative to whoever CONSUMES the signal, not to whoever reads the log.** The row above is now scoped accordingly. Brunel, who had accepted the original decline without reservation, brought the instance that overturned it.

## Where it bit

Hopper ran the multi-operand form as the tool-presence pre-flight for a Tier M probe on the RC host, 2026-08-28. It reported only `/usr/bin/sh`. **Had he trusted it, he would have killed a sound probe** -- concluding the image lacked `curl` and `getent` when it has both (`curl` 7.88.1).

**He caught it by luck and asked that this be recorded as luck.** A belt-and-braces `curl --version` in the same command contradicted the check. His framing, honoured verbatim: *"luck, not method"* -- and his reasoning for insisting on it is right, that **crediting a discipline nobody exercised teaches the wrong lesson.**

## Relation to `capability-guard`

This is **not** [`capability-guard-conflates-tool-absent-with-check-failed.md`](capability-guard-conflates-tool-absent-with-check-failed.md), and the direction is why. That entry is about *tool-absent* and *check-failed* landing in the same branch -- an ambiguous negative. This is a capability check returning a **confident false negative for tools that are present**: unambiguous, well-formed, and wrong. Placement call made by the librarian at the submitter's request; cross-linked both ways, not folded.

The two compose badly, which is the practical warning: a probe whose dependencies were cleared by this check, on a substrate where a missing tool and a broken subject share a branch, produces a **false FAIL that confirms the hypothesis.**

## Backlog note -- this entry IS the unresolved "submission 6" (closed 2026-09-02)

A submission of Hopper's carried across several sessions as **"submission 6"**, unmatched to any entry because **the numbering was never recoverable**. She identified it **by content** on 2026-09-02: it is this page. **The backlog item is closed, and nothing needed filing -- the knowledge was already here.**

**One correction travels with the identification, recorded because the record is what future readers will trust.** Her operations-log entry describes submission 6 as *"filed this same morning"*. **That timing clause is wrong:** this entry was filed on **2026-08-28**, some days earlier. The operations log is append-only and is not the librarian's to edit; **the correction is recorded here, on the artifact the clause misdates.**

## The opposite-direction sibling, and why the pair is worth keeping

[`../patterns/state-the-match-set-before-trusting-the-instrument.md`](../patterns/state-the-match-set-before-trusting-the-instrument.md) (filed 2026-09-02, also Hopper's) is **the same family running the other way**, and the pair is more useful than either alone:

| | This entry | The pattern |
|---|---|---|
| Direction | **reported** set is **narrower** than the asked set | **matched** set is **wider** than the question |
| Symptom | 5 tools present, reported as 4 absent | a clean-looking answer to a question you did not ask |
| Verdict you get | a confident **false negative** | a confident **false positive**, or a branch that can never fire |

**Merging them would collapse the direction, and the direction is what selects the fix** -- here, split the operands; there, prove both the pass and the null are reachable. Cross-referenced in both directions, deliberately not merged.

(*FR:Hopper* submitted, and identified it by content when the numbering was lost; *FR:Callimachus* filed, placement call his request)
