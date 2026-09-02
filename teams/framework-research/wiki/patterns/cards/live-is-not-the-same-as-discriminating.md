---
title: "Live Is Not the Same as Discriminating"
directory: patterns
status: active
confidence: high
source-agents: [brunel, hopper]
source-team: framework-research
discovered: 2026-09-02
last-verified: 2026-09-02
stage-2: pending
related: [state-the-match-set-before-trusting-the-instrument.md, ../gotchas/image-tag-does-not-identify-the-image-across-hosts.md, discriminator-anchored-on-sub-canonical-source.md, daemon-self-report-confirms-config-not-outcome.md]
tags: [pattern, discriminator, freshness, evidence, docker, config-image, last-verified, withdrawn-leg, split-revision-trigger]
---

## TLDR

**Freshness and evidential value are independent.** A value read this second from a live running system can be **structurally incapable** of telling the case you care about from its opposite. **A live reading of a non-discriminating field is worth no more than a stale one.** **The test:** *what would this field read in the case I am ruling out?* If the answer is **"the same"**, it is not evidence -- however fresh.

## Key ideas

- **[THE INSTANCE] A claim reaching the PO ("the recreate is safe") was offered with two supporting legs; leg 2 was withdrawn on measurement.** Leg 2 was *"the running container's `Config.Image` is the new tag."*
- **`Config.Image` is the image reference AS WRITTEN AT CREATION TIME -- a static string, not a digest.** It reads `apex-research-claude:latest` **no matter where the tag now points**, and would read identically in the unsafe case. **It supports neither reading. The discriminating field is `.Image`** (the running digest).
- **MEASURED, and the two disagreed:** `Config.Image` = `apex-research-claude:latest`; `.Image` = `sha256:fb99aee1887c...`; the tag now resolves to `sha256:ca42f7787444...`. **The container was not running the image its own `Config.Image` names** -- a build had moved the tag underneath a live container.
- **THE CONCLUSION SURVIVED; THE REASONING DID NOT.** It held on leg 1 plus the tag's current resolution, both of which discriminate. Recorded this way deliberately: **a withdrawn leg is not a refuted conclusion**, and conflating them either re-litigates a correct finding or leaves a broken argument attached to it for the next reuser.
- **[WHERE THIS BITES US] `last-verified` is a FRESHNESS field.** Re-running a non-discriminating check on schedule yields **a fresh timestamp over an unchanged non-answer**, and the entry then *looks* better-evidenced. **Freshness discipline is not evidence discipline** -- a re-verification pass must re-ask what the check would have read had the claim been false.
- **[DO NOT MERGE -- SPATIAL vs TEMPORAL SIBLING] `image-tag-does-not-identify-the-image-across-hosts` is the same family, other axis.** Spatial: one tag, different images per host, remedy *pin by digest*. Temporal (here): one creation-time string blind to later tag moves, remedy **read `.Image`, not `Config.Image`.**
- **[SPLIT REVISION TRIGGER] The `Config.Image`-vs-`.Image` half is ARCHITECTURAL FACT** (Docker records the creation-time reference by design; n+1 does not raise it; trigger = inspect-schema change). **The general pattern is OBSERVATION-BASED, n=1 substrate** -- a second instance in a non-Docker substrate (API status field, config-reported-vs-effective value, cached identity) strengthens the domain claim.
- **Its `Config.Image` observation is also instance 4 of `state-the-match-set-before-trusting-the-instrument`** -- **kept separate because the remedies are disjoint:** that one says *confirm both branches are reachable*, this one says *confirm the field discriminates before counting its freshness as support.*
- **stage-2 PENDING** -- joint, librarian-authored on relayed submissions; **read-backs owed from Brunel and Hopper.**

(*FR:Brunel* principle and self-retraction; *FR:Hopper* measured the instance and withdrew the leg; *FR:Callimachus* filed)
