---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: high
source-files:
  - designs/new/joosep/docker-compose.yml
  - designs/new/joosep/PROVISIONING-RUNBOOK.md
source-commits: []
source-issues: []
related:
  - network-mode-host-gives-zero-isolation-from-sibling-containers.md
  - docker-port-empty-under-network-mode-host.md
  - ../patterns/daemon-self-report-confirms-config-not-outcome.md
  - verification-narrower-than-it-appears.md
  - ../patterns/artifact-claims-more-than-it-implements.md
---

# `pids_limit` and `deploy.resources.limits.pids` Are the Same Compose Setting -- Declaring Both Refuses the Project

**Gotcha (team-wide, high confidence, live-verified).** `pids_limit` and `deploy.resources.limits.pids` are **one setting with two spellings.** Declaring both with distinct values makes Compose **refuse the project outright**:

```
can't set distinct values on 'pids_limit' and 'deploy.resources.limits.pids': invalid compose project
```

Verified on **Compose v5.1.0**, 2026-08-28.

**Put `pids: N` inside `deploy.resources.limits`. Never both.**

## Caught by a cheap parse gate on its first use

The Step-4b **pre-build** gate `docker compose config --quiet` caught this **the first time it ran** -- before an expensive image build, and before a deployment that would have failed at bring-up.

**The generalisable half: a cheap parse gate before an expensive build pays immediately.** It is worth stating because the gate looks like ceremony until the day it fires, and this is the day it fired. The author could not syntax-check the compose file locally, which is exactly why the gate was load-bearing rather than decorative.

## The OPEN half, deliberately on the entry's face

> **Is `deploy.resources.limits` actually ENFORCED under a plain `docker compose up`, or is it Swarm-decorative?**

**Unresolved, and the evidence so far does not settle it.** Compose *reconciling* the two spellings is evidence toward enforcement -- it proves Compose parses and unifies the field -- but **reconciliation is not enforcement.** A field can be validated, normalised, and then ignored at runtime by a non-Swarm engine, which is the historical behaviour of several `deploy.*` keys.

**Measurement, already written into the runbook (Step 6b):**

```
docker inspect <container> --format '{{json .HostConfig}}'   # read NanoCpus, Memory, PidsLimit
```

**The consequence, stated flatly because it is why this is not an academic question:** if those read `0`, **`allerk` has been running unbounded on a shared host since 2026-08-18** -- on a box with no ingress filtering and every container in the host network namespace (see [`network-mode-host-gives-zero-isolation-from-sibling-containers.md`](network-mode-host-gives-zero-isolation-from-sibling-containers.md)).

This is [`../patterns/daemon-self-report-confirms-config-not-outcome.md`](../patterns/daemon-self-report-confirms-config-not-outcome.md) in advance: the compose file's *setting* is not the container's *limit*, and only `HostConfig` says which.

## Revision trigger

**Two, split by class** (per [`../process/within-entry-class-split-observed-genus-designed-mechanism.md`](../process/within-entry-class-split-observed-genus-designed-mechanism.md)):

- **The collision is a designed mechanism** -- Compose's schema unification. Revision trigger: a Compose version that separates the two keys or changes the error. **n+1 sightings raise nothing.** Stamp the Compose version on any re-verification; this is v5.1.0.
- **The enforcement question is an open empirical claim.** It closes on the `docker inspect` measurement, not on argument. **Until it does, do not cite this entry as evidence that a pids limit is in force.**

(*FR:Brunel* submitted; *FR:Callimachus* filed)
