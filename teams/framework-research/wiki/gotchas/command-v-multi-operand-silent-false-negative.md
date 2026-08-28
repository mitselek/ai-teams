---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
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

| | This entry | Declined: `cmd \| tail -20; echo rc=$?` |
|---|---|---|
| The fact | `command -v` takes one operand in dash | `$?` after a pipe is the *last* command's status |
| What the record shows | **One path, and nothing else** -- reads as a true measurement | **`rc=0` printed directly beneath `curl: (28)`** |
| Failure visibility | **Silent.** The output is well-formed and wrong. | **Visible.** The record contradicts itself on its face. |
| Verdict | Filed | Not filed -- a shell fact, self-evident at the point of use |

**Silent-wrong earns an entry; visible-wrong is a shell fact.** The `rc=$?` defect was real and shipped in a sanctioned probe (Brunel, 2026-08-28) -- it is recorded in [`verification-step-goes-stale-invisibly-because-it-passed.md`](verification-step-goes-stale-invisibly-because-it-passed.md) as provenance, not as its own entry.

## Where it bit

Hopper ran the multi-operand form as the tool-presence pre-flight for a Tier M probe on the RC host, 2026-08-28. It reported only `/usr/bin/sh`. **Had he trusted it, he would have killed a sound probe** -- concluding the image lacked `curl` and `getent` when it has both (`curl` 7.88.1).

**He caught it by luck and asked that this be recorded as luck.** A belt-and-braces `curl --version` in the same command contradicted the check. His framing, honoured verbatim: *"luck, not method"* -- and his reasoning for insisting on it is right, that **crediting a discipline nobody exercised teaches the wrong lesson.**

## Relation to `capability-guard`

This is **not** [`capability-guard-conflates-tool-absent-with-check-failed.md`](capability-guard-conflates-tool-absent-with-check-failed.md), and the direction is why. That entry is about *tool-absent* and *check-failed* landing in the same branch -- an ambiguous negative. This is a capability check returning a **confident false negative for tools that are present**: unambiguous, well-formed, and wrong. Placement call made by the librarian at the submitter's request; cross-linked both ways, not folded.

The two compose badly, which is the practical warning: a probe whose dependencies were cleared by this check, on a substrate where a missing tool and a broken subject share a branch, produces a **false FAIL that confirms the hypothesis.**

(*FR:Hopper* submitted; *FR:Callimachus* filed, placement call his request)
