---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: medium
source-files:
  - registry.json
  - teams/framework-research/docs/joosep-container-design-2026-08-28.md
source-commits: []
source-issues: []
related:
  - ../gotchas/tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md
  - documentation-vs-substrate-truth-divergence.md
  - ../gotchas/roster-drift-from-reference-capability-register.md
  - convention-as-retroactive-telemetry.md
  - ../gotchas/precondition-without-an-owner-is-no-precondition.md
  - field-level-overlap-one-truth-not-mirror.md
---

# The Record Lives Where the Claim Is Made

**Pattern (team-wide, medium confidence).**

> **A registry that claimants never open does not get updated. The record that stays accurate is the one co-located with the act of claiming.**

This is a record-keeping design pattern, not a fact about any one resource. It says where to *put* a shared record if you want it to be true a year later: **at the point where someone must already be looking in order to make the claim.**

## The evidence, and it is a clean natural experiment

Three records purported to describe RC-host port allocations on 2026-08-28:

| Record | Maintained by | Accuracy |
|---|---|---|
| repo `registry.json` | claimants, in principle | **wrong** -- no row for uikit-dev (2228) or allerk (2230); a stale `(reserved)` 2221 |
| `~/bin/rc-deployments.json` | claimants, in principle | **wrong** for this question -- rows scoped to other hosts |
| the header comment of `/home/dev/allerk/docker-compose.yml` | nobody, formally | **correct, for six containers** |

**The accurate one is a comment in another team's compose file, maintained unprompted.** It was not designed as a registry, has no owner, and no process points at it. It is right because **a person claiming a port on that host has to open that file anyway** -- and while they are there, adding a line costs nothing and omitting it is conspicuous.

The two JSON registries are the ones with owners and conventions, and they are the ones that drifted. **Ratified as the ground-truth port registry for RC by PO ruling, 2026-08-28** -- the rest now point at it.

## Why it works -- the mechanism, not the anecdote

The pattern is about **co-location of the record with the act**, and it has two halves:

1. **Zero marginal cost.** Updating a record you already have open is free. Updating a record you must go and find is a separate task, and separate tasks are the ones that get skipped under load.
2. **Visible omission.** A missing line in a file everyone reads is noticed by the next reader. A missing row in a registry nobody opens is noticed by nobody, ever -- and its absence is indistinguishable from the resource being free.

Half 2 is the load-bearing one. A remote registry does not merely go stale; **it goes stale in the direction that causes harm**, because the failure mode -- an unrecorded claim -- reads as availability.

This is the constructive counterpart of [`../gotchas/precondition-without-an-owner-is-no-precondition.md`](../gotchas/precondition-without-an-owner-is-no-precondition.md): that entry says a trigger needs an owner and a moment. **This one says that if you can site the record where the moment already occurs, you need less of an owner** -- the act supplies the trigger.

## How to apply it

When designing or relocating a shared record, ask: **what does someone have to open in order to make the claim this record tracks?** Put the record there, and make the other records pointers to it.

**Corollary, and it is the uncomfortable half:** a well-structured central registry maintained by nobody is worse than an unstructured comment maintained by everybody, and it is worse *while looking better*. Structure is not maintenance.

## Confidence -- medium, and what would move it

**One natural experiment, one host, one resource type.** The mechanism is general and the comparison is unusually clean -- three records, same subject, same period, two owned and wrong, one unowned and right -- but it is still n=1 as a *pattern*.

**Path to `high`:** a second case where a co-located record outlives an owned one, in a different resource domain (not ports, not one host). **A counter-case would be valuable too:** a co-located record that drifted while a central registry stayed accurate would bound the pattern, and it should be filed as a `[DISPUTE]` if anyone finds one.

## Filing note

**Split from [`../gotchas/tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md`](../gotchas/tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md) at the submitter's argument, and he was right.** The librarian first filed it inside that gotcha; Brunel objected that leading with *"the authoritative record is neither registry"* makes the entry **a story about one host** -- the port fact is RC-specific and now a PO ruling, whereas this is *"a record-keeping design pattern with nothing to do with ports, and it would be buried inside (a)."* The ports gotcha keeps the ruling as evidence and points here for the principle.

(*FR:Brunel* submitted and argued the split; *FR:Callimachus* filed)
