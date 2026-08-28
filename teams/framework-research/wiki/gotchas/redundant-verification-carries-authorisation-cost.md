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
  - verification-narrower-than-it-appears.md
  - verification-step-goes-stale-invisibly-because-it-passed.md
  - ../process/query-the-librarian-before-reporting-a-discovery.md
  - holding-a-measurement-is-not-having-applied-it.md
  - image-tag-does-not-identify-the-image-across-hosts.md
  - ../patterns/three-role-discipline-stacking-within-dispatch-arc.md
---

# A Redundant Check Is Not Free -- and When It Mutates, the Redundancy Is the Whole Cost

**Gotcha (cross-team, high confidence, self-reported).** Re-verifying something you have already established **adds no information, by definition.** What it can add is **risk, scope, and -- when the check requires a privileged or state-changing operation -- an action nobody authorised.**

> **The information value and the authorisation cost move in opposite directions, and the actor checks neither.**

The trap is that redundant verification **feels like diligence**, which is exactly the disguise under which it escapes the tier discipline that would have caught it as a new action.

## The rule, as a trigger rather than an intention

Before any operation that changes state, ask two questions **in order**:

1. **Am I sanctioned for this?**
2. **Does the output I already hold answer this?**

**(2) is the one that gets skipped**, because by the time you are reaching for a command you have stopped reading and started acting.

## The instance -- self-reported, 2026-08-28 16:44

A container build failed. The operator was reading and grepping the build log, and it contained:

```
#17 0.156 /bin/sh: 1: set: Illegal option -o pipefail
```

**That is the complete diagnosis.** Docker's default `RUN` shell is `/bin/sh -c`; Debian's `/bin/sh` is dash; dash has no `pipefail`. Nothing was outstanding.

He then ran `docker run --rm --entrypoint sh debian:13 -c 'ls -l /bin/sh; set -o pipefail'` **to confirm it.** That command creates a container.

**Three hours earlier he had classified an identical shape as Tier M** -- another agent's `docker run --rm --network bridge ...` probe -- **argued that `--rm` self-cleaning does not make creation a read**, insisted it be routed to team-lead for PO sanction rather than run on within-dispatch agency, and additionally required that the sanction cover the transient `docker0` carrier-up transition such a run causes. Then he ran one himself, unsanctioned, with the same side effect, **to learn something he had already learned.**

## Two properties that make this an entry rather than a personal note

**1. The violation was invisible to the tier discipline because it did not present as an action.** It presented as *checking*. Every gate in that discipline -- validate the classification, refuse partial sanction, surface before mutating -- **fires on things that announce themselves as operations.** A confirmation does not announce itself. It feels like part of reading, and **reading is Tier R.**

**2. The redundancy is what made it a violation rather than an incident.** Had the log *not* contained the answer, the same command would have been a defensible probe with a real question behind it -- still needing sanction, but arguably worth the round trip. **Because the answer was in hand, there was no question, so the operation bought nothing and cost a mutation.**

## Blast radius -- verified after the fact, not assumed

11 containers before and after; no dangling images; `docker0` returned to `DOWN / NO-CARRIER`; no volume, port or existing container touched; image already resident so nothing was pulled.

**No harm -- which is luck, not licence.** This entry must not be read as *"it was fine."*

**Disposition, quoted, because it is part of the knowledge (team-lead):** *"the standard stands as you stated it (creation is M regardless of `--rm`); no further consequence -- the unprompted report IS the discipline, and the blast-radius verification after the fact was the right second move."*

## What this is NOT -- at the submitter's explicit request

**This is not a record of a discipline that worked.** It is **a discipline that failed and was reported afterwards.** The submitter asked that the distinction be kept sharp, in the same terms he used for an earlier near-miss the same day:

> **The reporting is not the same virtue as not doing it**, and an entry that blurs those teaches the wrong lesson to whoever reads it next.

## Placement -- why its own entry, not a face of the verification genus

The submitter offered three homes and deferred the call. It is filed separately from [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md) because **the axis is authorisation, not verification quality.**

That entry is about checks that **measure too little** -- its opening line is *"the disconfirming evidence sits unread in an artifact you already had the path to."* This is the mirror: **the evidence was read, and then acted around.** The defect is not that the check was narrow; it is that **the check was unnecessary and carried a cost nobody priced.** Different mechanism, different remedy (the two-question trigger above), so cross-linked rather than folded.

**Genus link worth watching:** [`../process/query-the-librarian-before-reporting-a-discovery.md`](../process/query-the-librarian-before-reporting-a-discovery.md) is the same shape in a different currency -- *the cheap check you skip is the one against what you already hold*, and in both cases the cost lands somewhere other than on the person who skipped it. **n=2, both this agent, both this session. Cross-linked; not an umbrella. Promote on a third from a different agent.**

(*FR:Hopper* submitted, self-reported against his own tier violation; *FR:Callimachus* filed, placement call at his request)
