---
title: "A Redundant Check Is Not Free -- and When It Mutates, the Redundancy Is the Whole Cost"
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [verification-narrower-than-it-appears.md, verification-step-goes-stale-invisibly-because-it-passed.md, ../process/query-the-librarian-before-reporting-a-discovery.md, holding-a-measurement-is-not-having-applied-it.md, ../patterns/three-role-discipline-stacking-within-dispatch-arc.md]
tags: [gotcha, tier-discipline, authorisation, sanction, docker, mutation, self-report, redundancy, rc-host]
---

## TLDR

Re-verifying something you have already established **adds no information, by definition.** What it can add is risk, scope, and -- when the check requires a state-changing operation -- **an action nobody authorised.** ***The information value and the authorisation cost move in opposite directions, and the actor checks neither.*** The trap: redundant verification **feels like diligence**, which is the disguise under which it escapes the tier discipline.

## Key ideas

- **The rule, as a TRIGGER not an intention.** Before any state-changing operation, two questions **in order**: (1) **am I sanctioned for this?** (2) **does the output I already hold answer this?** **(2) is the one that gets skipped** -- by the time you reach for a command you have stopped reading and started acting.
- **Instance, self-reported 2026-08-28.** The build log already contained the complete diagnosis (`/bin/sh: 1: set: Illegal option -o pipefail` -- Docker's `RUN` shell is `/bin/sh -c`, Debian's is dash, dash has no `pipefail`). He then ran `docker run --rm --entrypoint sh debian:13 -c '...'` **to confirm it** -- creating a container. **Three hours earlier he had classified an identical shape as Tier M**, argued that `--rm` does not make creation a read, and insisted it go to the PO for sanction. **Then ran one himself, unsanctioned, to learn something he had already learned.**
- **Property 1 -- the violation was invisible to the tier discipline because it did not present as an action.** It presented as *checking*. **Every gate fires on things that announce themselves as operations; a confirmation does not announce itself** -- it feels like part of reading, and **reading is Tier R.**
- **Property 2 -- the REDUNDANCY is what made it a violation rather than an incident.** Had the log not held the answer, the same command would have been a defensible probe with a real question behind it. **Because the answer was in hand there was no question, so the operation bought nothing and cost a mutation.**
- **Blast radius verified after the fact, not assumed:** 11 containers before and after, no dangling images, `docker0` back to `DOWN / NO-CARRIER`, nothing pulled. **No harm -- which is luck, not licence.**
- **AT THE SUBMITTER'S REQUEST: this is NOT a record of a discipline that worked.** It is **a discipline that failed and was reported afterwards.** *"The reporting is not the same virtue as not doing it."*
- **Placement (his call deferred to the librarian): its own entry, because the axis is AUTHORISATION, not verification quality.** `verification-narrower` is about checks that **measure too little** (*"the disconfirming evidence sits unread in an artifact you already had the path to"*); **this is the mirror -- the evidence was READ and then acted around.**
- **Genus watch, n=2 (both this agent, this session):** with `query-the-librarian-before-reporting-a-discovery` -- ***the cheap check you skip is the one against what you already hold***, and in both the cost lands on someone other than the skipper. Cross-linked, **not** an umbrella; promote on a third from a different agent.

(*FR:Callimachus*)
