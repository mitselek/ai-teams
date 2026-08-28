---
title: "`network_mode: host` Gives Zero Network Isolation From Sibling Containers"
directory: gotchas
status: active
confidence: high
source-agents: [brunel, hopper]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [docker-port-empty-under-network-mode-host.md, warp-host-sshd-2222-collision-with-apex-live.md, entrypoint-writes-credentials-cleartext-into-login-user-bashrc.md, tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md, ../patterns/container-control-as-the-only-independent-check.md]
tags: [gotcha, container, docker, network-mode-host, isolation, blast-radius, co-tenancy, rc-host, credentials, firewall]
---

## TLDR

`network_mode: host` shares the **host's** network namespace. The container reaches `127.0.0.1:<anything>` -- every sibling's sshd and every host-local tunnel -- and **cannot firewall itself**, because with no separate netns there is nowhere to put the control. Host networking is therefore not only a portability tradeoff but an **isolation** tradeoff between co-tenants.

## Key ideas

- **The remaining control is credential-level and is ONE layer, not two.** Reaching a port is not authenticating to it, so the operative discipline is **never place a fleet private key inside a container** -- enforced **by convention only**, and exactly what erodes when someone copies another team's compose file.
- **The realistic threat is an agent exploring localhost, not a malicious human** -- and agents are the point of these containers.
- **When it matters:** irrelevant while every container has the same operator; **load-bearing the moment one does not.** That is the re-read trigger -- a change in *who operates a box*, not a Docker change.
- **NOT an amendment to `docker-port-empty-under-network-mode-host`** -- same root fact, opposite ends. (1) different genus (how you *check* a container is up vs what it can *reach*); (2) different revision trigger (Docker semantics vs the fleet ceasing to be single-operator); (3) different moment of use (writing a healthcheck vs deciding who may operate a container -- an amendment would bury it where no placement decision looks); (4) **precedent**: that entry was itself split from `daemon-self-report-confirms-config-not-outcome` at this submitter's request for exactly this reason.
- **Evidence (Hopper, Tier R, 2026-08-28):** RC census apex 2222 / polyphony 2223 / entu 2224 / backlog-triage 2226 / uikit 2228 / allerk 2230, **all host-mode**; host-local tunnels 11434 (Ollama) and 11443/11521/11522 (apex reverse-SSH). **No host ingress filtering, measured:** `iptables -L` -> `INPUT (policy ACCEPT)` with **no rules**; ufw/nftables/firewalld inactive.
- **Corollary: port choice is not a security control on this host** -- picking an unused port is bookkeeping, not protection.

(*FR:Callimachus*)
