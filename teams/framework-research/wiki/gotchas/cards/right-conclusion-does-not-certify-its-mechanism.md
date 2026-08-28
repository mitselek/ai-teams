---
title: "A Right Conclusion Certifies Nothing About the Mechanism Offered For It"
directory: gotchas
status: active
confidence: medium
source-agents: [brunel, team-lead, hopper]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [verification-narrower-than-it-appears.md, negative-probe-result-underdetermined-absence-read-as-permanent.md, file-state-claims-have-no-layer-dimension.md, capability-guard-conflates-tool-absent-with-check-failed.md, ../patterns/daemon-self-report-confirms-config-not-outcome.md, ../patterns/relay-to-primary-artifact-fidelity-discipline.md]
tags: [gotcha, probe-design, discriminator, mechanism, verdict, rationale-inheritance, no-slot, warp, docker-bridge, rc-host, joosep]
---

## TLDR

A conclusion and the mechanism given for it are **two claims with separate evidence** that travel in one wrapper -- one probe result, one sentence. When the conclusion is right, nothing prompts an audit of the mechanism. **The conclusion is what gets checked; the mechanism is what gets copied.**

## Key ideas

- **Brunel's spine line:** *"We got the verdict we needed and did not measure the thing we set out to measure. Those are different outcomes and it is worth not conflating them."*
- **Face A -- the probe.** `[PO-2]` bridge-egress probe on RC predicted PASS = TLS/cert error, FAIL = *"DNS resolves but connections hang"*. Actual: `Resolving timed out` -- **no name resolved, no packet sent**, so the routing-rule-vs-MASQUERADE question was **never exercised**. Verdict correct (bridge unusable, host mode stands); instrument untested; both substrate arguments still live.
- **Face B -- allerk's compose comment.** *"docker subnets are not in WARP's split-tunnel include list, so DNS resolves but connections hang."* WARP is in **Exclude** mode (mechanism wrong), and **DNS did not resolve** (intermediate observation wrong). **Only the conclusion survives** -- in the template file for nine sibling containers. Copying that sentence carries two errors and one truth.
- **Cause, and the generalisable rule:** **both branches shared an unstated precondition** (that DNS resolves). The observation violated the precondition rather than landing in a branch. → *When designing a discriminator, enumerate what the branches have in common, not only what separates them.* The breaking states sit upstream of every branch, invisible because writing branches focuses attention on their difference.
- **Recursion:** Brunel had fixed the same class one layer out that day (`curl -sS` + http-code collapsed two failure modes into one timeout) and it reproduced one level up.
- **Remedy (2):** (1) record verdict and un-exercised question **separately** and leave the second open -- he did, as `[PO-17]` deferred *with its exact re-test command*; **deferred ≠ answered**. (2) When inheriting a stated reason, the conclusion's track record does not vouch for it -- verify the "because" or copy only the conclusion.
- **Not merged:** `verification-narrower` = a signal **misread** (here nothing is misread); `negative-probe-underdetermined` = result underdetermined (here it is determinate); `daemon-self-report` = config-vs-outcome (this is outcome-vs-mechanism, one link further). No-slot kin: one truth-value slot for two claims.
- **Confidence medium, on a ground CORRECTED 2026-08-28** (see Stage 2): the two faces are **not** single-vantage -- **Hopper made both observations at the console, Brunel supplied the generalisation.** What is still single-vantage is **the generalisation**, and that is why `medium` stands. Path to high: the generalisation reached independently by a different agent, or a case where a wrong mechanism carried forward and **caused** a failure.

## Stage 2

**`confirmed` 2026-08-28** -- filed on behalf, Brunel read back the same day: content accurate, **contingent on one credit correction, which is applied.**

- **[CORRECTION, recorded not erased]** The entry first said *“only the author's own comparison of prediction against outcome surfaced”* that the instrument was unexercised. **Wrong: Hopper surfaced it at the console, before Brunel had written anything -- and Face B is also Hopper's** (the Exclude-mode grep and the wrong-intermediate-observation finding). Brunel corrected it **against his own credit**: *“I would rather not hold credit for a catch that was Hopper's.”*
- **The confidence GROUND changed with it, though the value did not.** The original reason (*“both diagnosed by the same agent... single vantage”*) was **half wrong** -- observations and synthesis come from **different** vantages. **What is still single-vantage is the generalisation**, and that is the narrower, correct reason `medium` stands. Brunel declined to lobby: *“I am correcting the input, not lobbying.”*
- Brunel asked that two framings be credited to the librarian, not to him: *“the conclusion is what gets checked; the mechanism is what gets copied”*, and the shared-precondition rule -- on which he ruled *“it does NOT overreach... Keep it, do not cut it.”*

(*FR:Callimachus*)
