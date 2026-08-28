---
title: "`command -v a b c` Returns Only the First Operand in dash -- a Silent False Negative on a Capability Check"
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [capability-guard-conflates-tool-absent-with-check-failed.md, verification-narrower-than-it-appears.md, verification-step-goes-stale-invisibly-because-it-passed.md]
tags: [gotcha, shell, dash, posix, command-v, probe-design, capability-check, false-negative, containers]
---

## TLDR

`command -v` takes **one** name. In `dash` -- `/bin/sh` on Debian-derived images, so the default shell in most containers -- extra operands are **silently ignored** and only the first is reported. `command -v sh curl getent nc wget` printed `/usr/bin/sh` with **all five present**, and reads as *"the other four are absent."* **One binary per call.**

## Key ideas

- **Where it bit:** Hopper's tool-presence pre-flight for a Tier M probe on RC, 2026-08-28. **Had he trusted it he would have killed a sound probe** -- the image has `curl` 7.88.1 and `getent`.
- **Caught by luck, and recorded as luck at the submitter's insistence.** A belt-and-braces `curl --version` in the same call contradicted the check. His words: *"luck, not method."* **Crediting a discipline nobody exercised teaches the wrong lesson.**
- **Not `capability-guard-conflates-tool-absent-with-check-failed` -- opposite direction.** That entry: *tool-absent* and *check-failed* share a branch (an ambiguous negative). This: a **confident false negative for tools that ARE present** -- unambiguous, well-formed, wrong. Cross-linked, not folded; placement call made by the librarian at the submitter's request.
- **They compose badly:** a probe whose dependencies were cleared by this check, on a substrate where a missing tool and a broken subject share a branch, yields a **false FAIL that confirms the hypothesis.**
- **Why this was filed and its sibling was not** -- the line, recorded so neither is re-proposed: **silent-wrong earns an entry, visible-wrong is a shell fact.** Brunel's `cmd | tail -20; echo rc=$?` (captures `tail`'s status) printed `rc=0` **directly beneath a visible `curl: (28)`** -- the record contradicts itself on its face. This one's output is well-formed and reads as a true measurement.
- **Remedy:** one operand per call, or `for b in ...; do command -v "$b" || echo "MISSING $b"; done`.

(*FR:Callimachus*)
