---
title: "Live Is Not the Same as Discriminating"
directory: patterns
status: active
confidence: high
source-agents: [brunel, hopper]
source-team: framework-research
discovered: 2026-09-02
last-verified: 2026-09-02
stage-2: partial
related: [state-the-match-set-before-trusting-the-instrument.md, ../gotchas/image-tag-does-not-identify-the-image-across-hosts.md, discriminator-anchored-on-sub-canonical-source.md, daemon-self-report-confirms-config-not-outcome.md]
tags: [pattern, discriminator, freshness, evidence, docker, config-image, last-verified, withdrawn-leg, split-revision-trigger, dual-submission]
---

## TLDR

**Freshness and evidential value are independent.** A value read this second from a live running system can be **structurally incapable** of telling the case you care about from its opposite. **A live reading of a non-discriminating field is worth no more than a stale one.** **The test:** *what would this field read in the case I am ruling out?* If the answer is **"the same"**, it is not evidence -- however fresh.

## Key ideas

- **[THE INSTANCE] A claim reaching the PO ("the recreate is safe") was offered with two supporting legs; leg 2 was withdrawn on measurement.** Leg 2 was *"the running container's `Config.Image` is the new tag."*
- **`Config.Image` is the image reference AS WRITTEN AT CREATION TIME -- a static string, not a digest.** It reads `apex-research-claude:latest` **no matter where the tag now points**, and would read identically in the unsafe case. **It supports neither reading. The discriminating field is `.Image`** (the running digest).
- **MEASURED, and the two disagreed:** `Config.Image` = `apex-research-claude:latest`; `.Image` = `sha256:fb99aee1887c...`; the tag now resolves to `sha256:ca42f7787444...`. **The container was not running the image its own `Config.Image` names** -- a build had moved the tag underneath a live container.
- **THE CONCLUSION SURVIVED; THE REASONING DID NOT.** It held on leg 1 plus the tag's current resolution, both of which discriminate. Recorded this way deliberately: **a withdrawn leg is not a refuted conclusion**, and conflating them either re-litigates a correct finding or leaves a broken argument attached to it for the next reuser.
- **[WHY THIS IS NOT SIMPLY "HE CHECKED THE WRONG THING" -- and it is the whole point] HIS TARGET WAS CORRECT.** He had **deliberately and rightly upgraded his evidence source** (the team's mirror of the apex compose file is known to drift, so he insisted on live substrate readings) **and said so with some satisfaction. One of the two live readings was still vacuous.** ***"The satisfaction of having gone to the substrate is not a check that what I read there could have come out differently."*** *"I went and looked at the real thing"* answers **is this current**; it does not answer **could this have said anything else**. **The two feel like the same act of diligence and are not**, which is why effort spent on the first reads as evidence for the second.
- **[THAT IS WHY IT IS NOT `../gotchas/verification-narrower-than-it-appears`, WHERE IT WAS SUBMITTED]** That entry's instances are all someone reading the **WRONG** artifact, stream or field, and its remedy is **target selection**. **Here the target is right, the reading is fresh, and the field still carries no answer** -- discriminating power on a correctly-selected target, a different failure with a different fix. **Cross-referenced there as instance 7, filed here, AGAINST the submitter's own proposed placement**, and recorded as such in both entries.
- **[WHERE THIS BITES US] `last-verified` is a FRESHNESS field.** Re-running a non-discriminating check on schedule yields **a fresh timestamp over an unchanged non-answer**, and the entry then *looks* better-evidenced. **Freshness discipline is not evidence discipline** -- a re-verification pass must re-ask what the check would have read had the claim been false.
- **[DO NOT MERGE -- SPATIAL vs TEMPORAL SIBLING] `image-tag-does-not-identify-the-image-across-hosts` is the same family, other axis.** Spatial: one tag, different images per host, remedy *pin by digest*. Temporal (here): one creation-time string blind to later tag moves, remedy **read `.Image`, not `Config.Image`.**
- **[SPLIT REVISION TRIGGER] The `Config.Image`-vs-`.Image` half is ARCHITECTURAL FACT** (Docker records the creation-time reference by design; n+1 does not raise it; trigger = inspect-schema change). **The general pattern is OBSERVATION-BASED, n=1 substrate** -- a second instance in a non-Docker substrate (API status field, config-reported-vs-effective value, cached identity) strengthens the domain claim.
- **Its `Config.Image` observation is also instance 4 of `state-the-match-set-before-trusting-the-instrument`** -- **kept separate because the remedies are disjoint:** that one says *confirm both branches are reachable*, this one says *confirm the field discriminates before counting its freshness as support.*
- **[SUBMITTED TWICE, INDEPENDENTLY, deliberately not coordinated]** Hopper at 16:48 (*"reads like an answer to 'what is this container running', answers 'what was typed when it was created'"*); Brunel at 16:53 as the freshness-versus-discrimination principle, with an explicit **merge and credit both, do not file twice**. Both framings kept: **hers names what the field SAYS, his names why GOING TO LOOK felt like enough.**
- **[NOT SUBMITTED BY EITHER AGENT] The `last-verified` consequence is the librarian's**, and Hopper flagged on read-back that it should reach whoever owns re-verification passes: **a freshness sweep can raise an entry's apparent evidence without adding any.**
- **stage-2 PARTIAL** -- advanced from `pending` on **Hopper's read-back 2026-09-02**, which confirmed the entry accurate and **endorsed the split from the match-set pattern as better than her own single-submission framing.** **Brunel's read-back still owed** and advances it to `confirmed`.

(*FR:Brunel* principle, self-retraction, and the "satisfaction of having gone to the substrate" framing; *FR:Hopper* measured the instance, withdrew the leg, and independently submitted the same observation; *FR:Callimachus* filed, split it from both proposed homes, and added the `last-verified` consequence)
