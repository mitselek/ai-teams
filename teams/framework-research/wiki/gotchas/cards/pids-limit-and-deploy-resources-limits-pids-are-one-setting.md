---
title: "`pids_limit` and `deploy.resources.limits.pids` Are the Same Compose Setting -- Declaring Both Refuses the Project"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [network-mode-host-gives-zero-isolation-from-sibling-containers.md, ../patterns/daemon-self-report-confirms-config-not-outcome.md, verification-narrower-than-it-appears.md, ../patterns/artifact-claims-more-than-it-implements.md]
tags: [gotcha, docker-compose, pids-limit, resource-limits, parse-gate, rc-host, allerk, open-question, v5.1.0]
---

## TLDR

`pids_limit` and `deploy.resources.limits.pids` are **one setting with two spellings**; declaring both with distinct values makes Compose **refuse the project** -- `can't set distinct values on 'pids_limit' and 'deploy.resources.limits.pids': invalid compose project` (v5.1.0, 2026-08-28). **Put `pids: N` inside `deploy.resources.limits`. Never both.**

## Key ideas

- **Caught by a pre-build `docker compose config --quiet` gate on its FIRST use** -- before an expensive image build and before a failed bring-up. **Generalisable half: a cheap parse gate before an expensive build pays immediately.** The author could not syntax-check the compose file locally, which is exactly what made the gate load-bearing rather than ceremonial.
- **OPEN, deliberately on the entry's face: is `deploy.resources.limits` ENFORCED under a plain `up`, or Swarm-decorative?** Compose *reconciling* the two spellings is evidence toward enforcement but **proves reconciliation, not enforcement** -- a field can be validated, normalised, and then ignored at runtime by a non-Swarm engine, which is the historical behaviour of several `deploy.*` keys.
- **Measurement already in the runbook (Step 6b):** `docker inspect <ctr> --format '{{json .HostConfig}}'` -> read `NanoCpus`, `Memory`, `PidsLimit`.
- **Consequence, why it is not academic: if those read `0`, `allerk` has been running unbounded on a shared host since 2026-08-18** -- a box with no ingress filtering and every container in the host netns.
- **`daemon-self-report-confirms-config-not-outcome` in advance:** the compose file's *setting* is not the container's *limit*; only `HostConfig` says which.
- **Split revision triggers.** *Collision* = designed mechanism (Compose schema unification): revise on a Compose version that separates the keys or changes the error; **n+1 raises nothing**; stamp the Compose version (v5.1.0). *Enforcement* = open empirical claim: closes on the `docker inspect` measurement, not on argument. **Until then, do not cite this entry as evidence that a pids limit is in force.**

(*FR:Callimachus*)
