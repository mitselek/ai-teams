---
source-agents:
  - brunel
  - hopper
source-team: framework-research
discovered: 2026-09-02
filed-by: librarian
last-verified: 2026-09-02
status: active
confidence: high
source-files:
  - teams/framework-research/docs/operations-log-2026-09.md
source-commits: []
source-issues: []
related:
  - state-the-match-set-before-trusting-the-instrument.md
  - ../gotchas/image-tag-does-not-identify-the-image-across-hosts.md
  - discriminator-anchored-on-sub-canonical-source.md
  - daemon-self-report-confirms-config-not-outcome.md
---

# Live Is Not the Same as Discriminating

**Pattern (team-wide, high confidence).** **Freshness and evidential value are independent properties of a reading.** A value read this second from a live running system can still be **structurally incapable** of telling the case you care about from its opposite.

> **A live reading of a non-discriminating field is worth no more than a stale one.**

**The test, before you count a reading as support:** *what would this field read in the case I am ruling out?* If the answer is **"the same"**, the reading is not evidence -- however fresh, however authoritative the source, however much trouble it was to obtain.

## The instance -- Docker `Config.Image`

A claim was going to the PO: *the apex container is safe under every lifecycle event, so the pending recreate is completing rather than protective.* It was offered with **two independent supporting observations**:

1. The apex image build produced the tag the operational compose names.
2. The running container's `Config.Image` **is** that same tag.

**Leg 2 is not evidence for the conclusion, and was withdrawn on measurement.**

`Config.Image` is **the image reference as written at container-creation time** -- a static string, not a digest. It reads `apex-research-claude:latest` **regardless of where that tag currently points.** It would read exactly the same if the tag still pointed at the old image, or at a different image, or at nothing at all. It therefore supports neither the safe reading nor the unsafe one.

**The discriminating field is `.Image`** -- the digest of the image the container is actually running.

**Measured, and the two disagreed:**

| Field | Value |
|---|---|
| `Config.Image` | `apex-research-claude:latest` |
| `.Image` (running digest) | `sha256:fb99aee1887c...` |
| what the tag `apex-research-claude:latest` resolves to now | `sha256:ca42f7787444...` |

**The container was not running the image its own `Config.Image` names.** A build had moved the tag underneath a live container. Anyone reading `Config.Image` would have concluded it ran `ca42f778`; it ran `fb99aee1`.

## The conclusion survived; the reasoning did not

**This is a correction to the support, not to the result.** The claim held on leg 1 plus the tag's current resolution, both of which discriminate. Recorded this way on purpose: **a withdrawn leg is not a refuted conclusion**, and conflating the two is how a correct finding gets re-litigated or, worse, how a correct finding keeps a broken argument attached to it for the next person to reuse.

## Where this bites us specifically

**The wiki's own `last-verified` is a freshness field.** Re-running a non-discriminating check on schedule produces a **fresh timestamp over an unchanged non-answer**, and the entry then looks better-evidenced than it did before. **Freshness discipline is not evidence discipline.** A re-verification pass should re-ask what the check would have read had the claim been false, not merely re-run it.

The same shape sits under [`daemon-self-report-confirms-config-not-outcome.md`](daemon-self-report-confirms-config-not-outcome.md): a live self-report, freshly obtained, that reports the daemon's configuration rather than its effect.

## Do not merge with the spatial sibling

[`../gotchas/image-tag-does-not-identify-the-image-across-hosts.md`](../gotchas/image-tag-does-not-identify-the-image-across-hosts.md) is **the same family, the other axis**, and the remedies differ:

| | That entry | This one |
|---|---|---|
| Axis | **Spatial** -- one tag, different images on different hosts | **Temporal** -- one creation-time string, blind to later tag moves |
| Failure | you read the right field on the wrong host | you read a field that never carried the answer |
| Remedy | pin by digest in cross-host commands | **read `.Image`, not `Config.Image`** |

Cross-referenced in both directions, deliberately not merged.

## Revision trigger -- split by class

- **The `Config.Image`-vs-`.Image` half is an architectural fact.** Docker's inspect schema records the creation-time reference by design. **n+1 sightings do not raise its confidence**; the trigger is a change to Docker's inspect schema.
- **The general pattern is observation-based.** n=1 substrate so far. **A second instance in a non-Docker substrate would strengthen the domain claim** -- an API status field, a config-reported-vs-effective value, a cached identity.

## Provenance

Submitted by Brunel as the principle, after retracting a warning he had issued three times on the strength of the withdrawn leg. Measured rather than relayed by Hopper -- *a claim that changes the PO's risk picture does not enter the record on someone's word* -- and recorded in `docs/operations-log-2026-09.md` entry `T16:33`. The same `Config.Image` observation is instance 4 of [`state-the-match-set-before-trusting-the-instrument.md`](state-the-match-set-before-trusting-the-instrument.md); the two are **kept separate because their remedies are disjoint** -- that one says check both branches are reachable, this one says check the field discriminates before counting its freshness as support.

**`stage-2: pending`** -- joint entry, librarian-authored on relayed submissions. **Read-backs owed from both Brunel and Hopper**; first advances to `partial`, second to `confirmed`.

(*FR:Brunel* principle and self-retraction; *FR:Hopper* measured the instance and withdrew the leg; *FR:Callimachus* filed)
