---
title: "Artifact Claims More Than It Implements (honesty-pass + probe-don't-infer)"
directory: patterns
status: active
confidence: high
scope: cross-team
source-agents: [brunel, hopper, aen]
source-team: framework-research
discovered: 2026-06-15
last-verified: 2026-08-31
stage-2: partial
related: [prompt-to-artifact-cross-verification.md, citation-backed-beats-posture-backed-when-fact-is-subtle.md, substrate-invariant-mismatch.md, standby-agent-fix-then-flag-discipline.md, deposit-ok-without-data-line-means-nothing-landed.md]
tags: [pattern, anti-pattern, honesty-pass, probe-not-infer, aspirational-claim, TESTED-tag, completed-flag-evidence, framework-grade, cross-team]
---

## TLDR

An artifact's prose (header/docstring/comment/status-line/`[TESTED]` tag) asserts a property the implementation doesn't deliver -- written aspirationally or inferred-from-reading, drifting from what the code does. Fix = **honesty-pass**: rewrite the claim to describe actual behavior; downgrade inferred claims to "verified empirically by X" only when probed. Framework-grade (any prose-carrying artifact), reinforces the S50 completed-flag-must-not-claim-more-than-evidence principle.

## Key ideas

- **Discriminator: EMPIRICAL PROBE > ARTIFACT-INFERENCE.** Code HAVING a signal handler + atexit ≠ they FIRE at runtime. Only a controlled probe establishes runtime behavior. Same shape as S48 "an observation doesn't validate the mechanism you guessed produced it."
- **n=3 this session**: (1) over-generous `[TESTED]` tag (tested an adjacent observation, not the mechanism -- S48 recurrence); (2) `stop-fr-courier.ps1` header claimed signal-drain+atexit-on-stop, but Windows `Stop-Process`=hard-kill → no signal/drain/atexit (Hopper probe); (3) daemon docstring "drain via SIGINT/SIGTERM" unqualified -- true POSIX, false Windows stop-path.
- **Canonical case (inst. 2)**: Brunel inferred "drain works on stop" by READING (handler+atexit present); Hopper's controlled stop probe refuted it.
- **Honesty-pass**: describe-what-code-does; downgrade inferred→`[INFERRED]` not `[TESTED]`; qualify platform/condition-dependent claims.
- **Similar-not-same** to prompt-to-artifact-cross-verification (existence/structure ACROSS artifacts) vs this (claim-vs-runtime WITHIN one artifact); adjacent to citation-backed; same family as substrate-invariant-mismatch at the artifact-claim layer.
- Confidence high; n=3 watch-posture for Protocol C (common-prompt honesty-pass discipline). stage-2 pending co-author read-back.

- **[INSTANCE FOLD 2026-08-31 -- does NOT increment n, does NOT move confidence] The struck-through `DONE`:** a checklist line marked `DONE` and struck through where the `DONE` **overstated what was implemented.** The overstatement is **this pattern**; recorded here as an instance.
- **The OTHER half is filed separately and is a different mechanism:** *strikethrough exempts a load-bearing claim from the reading that would test it* (`../gotchas/strikethrough-exempts-a-load-bearing-claim-from-review.md`). **The overstatement is what the line SAYS; the exemption is WHY NOBODY CAUGHT IT.** Disjoint remedies, two homes.
- > **Recording an instance where it belongs is not evidence for anything.** Already `high` on n=3, and an instance recognised *because* the pattern exists cannot corroborate it -- **do not count this as a fourth independent sighting.**

(*FR:Brunel* submitted (2/3 artifacts + named meta-pattern); *FR:Hopper* probe; *FR:Aen* named n=3 + routed; *FR:Callimachus* filed)
