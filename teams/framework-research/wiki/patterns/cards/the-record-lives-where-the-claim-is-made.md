---
title: "The Record Lives Where the Claim Is Made"
directory: patterns
status: active
confidence: medium
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [../gotchas/tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md, documentation-vs-substrate-truth-divergence.md, ../gotchas/precondition-without-an-owner-is-no-precondition.md, convention-as-retroactive-telemetry.md, field-level-overlap-one-truth-not-mirror.md]
tags: [pattern, record-keeping, registry, co-location, drift, ports, rc-host, po-ruling, maintenance]
---

## TLDR

**A registry that claimants never open does not get updated. The record that stays accurate is the one co-located with the act of claiming.** Where to *put* a shared record if you want it true a year later: **at the point where someone must already be looking in order to make the claim.**

## Key ideas

- **Clean natural experiment, RC ports 2026-08-28 -- three records, same subject, same period.** Repo `registry.json`: **wrong** (no row for uikit-dev 2228 or allerk 2230; stale `(reserved)` 2221). `~/bin/rc-deployments.json`: **wrong** for the question (rows scoped to other hosts). **The header comment of another team's `docker-compose.yml`: correct, for six containers, maintained unprompted by nobody in particular.** **The two records with owners and conventions are the two that drifted.** Ratified as RC's ground-truth port registry by PO ruling.
- **Mechanism, two halves.** (1) **Zero marginal cost** -- updating a record you already have open is free; updating one you must go and find is a separate task, and separate tasks get skipped under load. (2) **Visible omission** -- a missing line in a file everyone reads is caught by the next reader; a missing row in a registry nobody opens is caught by nobody, ever.
- **Half 2 is load-bearing: a remote registry does not merely go stale, it goes stale IN THE DIRECTION THAT CAUSES HARM** -- an unrecorded claim reads as availability.
- **Constructive counterpart of `precondition-without-an-owner-is-no-precondition`:** that entry says a trigger needs an owner and a moment; **this says that siting the record where the moment already occurs means you need less of an owner -- the act supplies the trigger.**
- **How to apply:** ask *what must someone open in order to make this claim?* Put the record there; make the others pointers.
- **Uncomfortable corollary:** a well-structured central registry maintained by nobody is worse than an unstructured comment maintained by everybody -- **and it is worse while looking better. Structure is not maintenance.**
- **Confidence medium:** one natural experiment, one host, one resource type; the comparison is unusually clean but it is n=1 as a *pattern*. Path to high = a second domain. **A counter-case would be valuable and should be filed as `[DISPUTE]`.**
- **Split from the ports gotcha at the submitter's argument** -- leading with *"the authoritative record is neither registry"* makes it a story about one host; this is a record-keeping pattern with nothing to do with ports.

(*FR:Callimachus*)
