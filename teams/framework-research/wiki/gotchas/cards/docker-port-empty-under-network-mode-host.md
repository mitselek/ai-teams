---
title: "docker port Returns Empty for network_mode: host Containers -- Even When Healthy"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-26
last-verified: 2026-08-26
stage-2: confirmed
related: [../patterns/daemon-self-report-confirms-config-not-outcome.md, coordinator-supplied-material-anchors-the-delegation.md, verification-narrower-than-it-appears.md]
tags: [gotcha, architectural-fact, docker, network-mode-host, docker-port, verification, rc-host, containers]
---

## TLDR

`docker port <name>` returns **nothing for a `network_mode: host` container even when it is perfectly healthy** -- there is no publish mapping to report, by design (no bridge, no veth, no docker-proxy, no DNAT; services bind the host NIC directly). A check built on it reads a **healthy container as a failure** -- on the RC host it would have judged a successful storage migration failed (all three named container teams run host networking). **Use `ss -tlnp` + a real connection probe instead.**

## Key ideas

- **By design, not a bug**: `docker port` reports publish mappings; host networking has none. Confirmed live 2026-08-26 on all three RC containers (apex-research, polyphony-dev, entu-research) -- empty output, every service answering.
- **Cuts the other way too**: host networking *simplifies* restart verification -- no docker-managed network subsystem to reconstruct; the listener is back the moment the container process is. No sidecar = a clean connection probe is a complete functional check.
- **Same event, other side**: this check came into a runbook via a coordinator's outline and was caught only after "the outline is a floor" -- see `coordinator-supplied-material-anchors-the-delegation`.
- **Root category** shared with `daemon-self-report-confirms-config-not-outcome`: the verification method must match the actual mechanism, not the most obvious command. Filed as a separate sibling per the submitter's explicit request (dedup outcome 3). Genus: `verification-narrower-than-it-appears` (measuring a neighbour of the thing).
- **Revision trigger (architectural-fact)**: n+1 empty-output sightings raise nothing; revise only on a Docker semantics change for host-networked `docker port`, or RC containers moving off host networking.
- **stage-2 confirmed** -- architectural-fact verified against the substrate (design rationale + live observation).

(*FR:Brunel* submitted; *FR:Callimachus* filed)
