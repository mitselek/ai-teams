---
title: "State the Match Set Before Trusting the Instrument -- Confirm Both the Pass and the Null Are Reachable"
directory: patterns
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-09-02
last-verified: 2026-09-02
stage-2: pending
related: [../gotchas/command-v-multi-operand-silent-false-negative.md, ../gotchas/capability-guard-conflates-tool-absent-with-check-failed.md, ../gotchas/verification-narrower-than-it-appears.md, ../gotchas/right-conclusion-does-not-certify-its-mechanism.md, discriminator-anchored-on-sub-canonical-source.md, live-is-not-the-same-as-discriminating.md]
tags: [pattern, instrument, match-set, unreachable-null, unreachable-pass, control, discriminator, false-negative, verification, n4]
---

## TLDR

An instrument's **match set** is the set of substrate states producing a given verdict. **When the match set is wider than the question, the instrument returns a clean-looking answer to a question it did not ask.** Rule: **establish that BOTH the PASS and the NULL are reachable on the substrate the check will run against**, before trusting it. Extends the standing one-sided rule (*"every probe carries what its null would mean"*): **a gate that cannot pass is worse than one that cannot fail informatively**, because it invites the opposite remedy.

## Key ideas

- **n=4, all 2026-09-02 (S71), all Hopper's -- three in instruments she was handed, one in her own.**
- **[1 -- UNREACHABLE NULL] `pgrep -af claude || echo NO_CLAUDE_PROCESS`** matches **its own wrapper** (the wrapper's command line contains `claude`), so pgrep always exits 0 and the null branch **can never fire**. Answered instead three independent ways: `pgrep -x` exits 1, `/proc/*/exe` scan empty, full `ps` empty.
- **[2 -- MERGED PATTERN REPORTS THE UNION] one `grep -c` combining auth AND transport signatures returned `86`**, reading as "86 authentication failures" — enough to stop the rebuild. It is **0 auth**; the 86 are `rc=255` transport (`No route to host` 81 / `Network is unreachable` 3 / `Connection refused` 1 / `Connection closed` 1). Caught because **the sample lines printed beside the count contradicted what the count implied.**
- **[3 -- UNREACHABLE PASS] `docker run --rm <img> claude --version`** asked "does this ship 2.1.258?" and covered "does this image have an ENTRYPOINT that validates env first?" — **every** image in the family errors. **The CONTROL is the whole finding:** the same command against the known-good pre-build image returned the same error. Same verdict for good and bad inputs = no discrimination. Failure here invites *restore*, which **would have destroyed a correct build.**
- **[4 -- A DATA FIELD, NOT A COMMAND] `docker inspect ... Config.Image`** reads like "what is this container running" and answers "what string was typed when it was created". Carried here because it shows **the genus is not confined to instruments you invoke** — a field you read is an instrument, and its match set is equally unstated. Its own remedy is disjoint, so it is filed separately as [`live-is-not-the-same-as-discriminating`](live-is-not-the-same-as-discriminating.md).
- **THE CONTROL IS THE GENERAL FORM** (answers 1, 3 and 4): run the instrument against an input whose verdict you already know and **require the two verdicts to differ.** The corrected gate returned `2.1.258` vs `2.1.217` — two different strings, which the original could not produce for any input.
- **[SPECIFIC RULE, PROCESS CHECKS] EXCLUDE THE CHECKER** — `pgrep -x`, `/proc/*/exe`, or `grep -v grep`. Self-matching by construction is the commonest instance.
- **[DO NOT MERGE] `command-v-multi-operand-silent-false-negative` is the OPPOSITE DIRECTION** — reported set *narrower* than asked (5 present reads as 4 absent). Same family, opposite sign; the direction is what tells you which fix applies. `capability-guard-conflates-tool-absent-with-check-failed` is instance 3's shape one layer down.
- **[REVISION TRIGGER] Observation-based; n+1 does not change the mechanism.** All four instances are shell commands or Docker fields, one agent, one day — **a fifth instance in a different substrate class (API field, test assertion, type predicate) broadens the domain claim** and belongs here as an instance, not as a new entry.
- **stage-2 PENDING** — librarian-authored from a relayed submission + scratchpad; **Hopper's read-back is owed.**

(*FR:Hopper* observed, grouped and submitted; *FR:Callimachus* filed)
