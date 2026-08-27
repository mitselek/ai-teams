---
title: "A Convention Described in the Singular Can Have N Deployed Instances -- and Every Per-Instance Document Reads True"
directory: gotchas
status: active
confidence: high
source-agents: [herald]
source-team: framework-research
discovered: 2026-08-27
last-verified: 2026-08-27
stage-2: confirmed
related: [../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md, ../decisions/stationmaster-post-office-model.md, at-least-once-without-age-alarm-hides-unbounded-latency.md, file-state-claims-have-no-layer-dimension.md, negative-probe-result-underdetermined-absence-read-as-permanent.md, ../patterns/stale-snapshot-trusted-as-current.md]
tags: [gotcha, stationmaster, hub, multi-instance, partition, registry, no-slot, singular, gh-108, cross-team, e-unknown-team]
---

## TLDR

"The hub" has no slot for *which*. There are **two stationmaster hubs with no link between them** -- prod-llm `sm@10.100.136.162:2222` (up since 2026-06-12; FR + apex) and sagres `sm@100.102.133.125:2222` (2026-07-15; po-team + mvox + passepartout). Every per-instance document is true of its own hub; the #108 proposal's §3 lists only sagres and says "every live route runs over the hub" -- **true per hub, false for the network.** The S49 card excludes relay (YAGNI), so this is **two mail networks sharing one name**; cross-hub addressing returns `E_UNKNOWN_TEAM`, **which reads as a typo, not a partition.**

## Key ideas

- **Evidence verified at source**: sagres in `po-team/setup-log.md:97`, `hub-on-sagres.md:7-8`, `mvox-courier-config.json:3`; prod-llm in FR's `fr-courier.config.auto.json` + `SKILL.md:31`; `registry` at 10:23Z -> `[alpha, apex-research, beta, fr-test, framework-research]`; `status` uptime 6552057 s back-computes to 2026-06-12 (consistent). Decision card: *"Relaying / multi-hop -- left out as YAGNI."*
- **NOT `stale-snapshot`** -- nothing aged. **The no-slot shape**, sibling of `file-state-claims-have-no-layer-dimension`: the singular article asserts a uniqueness nobody wrote down or checked, and each writer filled the missing slot with their own instance.
- **Falsifier = one read-only call**: `printf '{"v":1,"cmd":"registry"}' | ssh -T -i <key> -p 2222 sm@<hub>`. Team absent from the list => different network, not a misspelling.
- **Rule**: before adopting or documenting "the" shared service, **enumerate instances from the service's own registry, not from the docs of the instance you use** -- ask every hub you know of; treat expected-but-absent as a partition.
- **Corollary**: `E_UNKNOWN_TEAM` is a negative result underdetermined between "no such team" and "not on this hub" -- `negative-probe-result-underdetermined...` as a hazard.
- **#108 consequence -- RESOLVED same day (PO)**: **two networks with an honest name, by design** -- `decisions/two-islands-by-design-hub-topology-follows-network-boundary` (EVR declines tailnet; topology follows the network boundary; no federation; git repo = the inter-island bridge). This gotcha's rule survives unchanged: the plurality is legitimate, and documents still must say WHICH island's hub.
- **Confidence high** as submitted; registry/status output quoted as returned (ephemeral), file evidence re-verified.
- **stage-2 confirmed** -- author-is-filer (Herald's direct submission).

(*FR:Herald* submitted; *FR:Callimachus* verified and filed)
