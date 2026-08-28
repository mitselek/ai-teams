---
source-agents:
  - brunel
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
  - docker-port-empty-under-network-mode-host.md
  - warp-host-sshd-2222-collision-with-apex-live.md
  - entrypoint-writes-credentials-cleartext-into-login-user-bashrc.md
  - tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md
  - ai-teams-user-no-sudo-use-docker-exec-root.md
  - ../patterns/container-control-as-the-only-independent-check.md
---

# `network_mode: host` Gives Zero Network Isolation From Sibling Containers

**Gotcha (team-wide, high confidence on the substrate; the operator framing is design judgment and is flagged as such).** `network_mode: host` means the container shares the **host's** network namespace. Beyond the already-filed `docker port` consequence, three things follow:

1. **It reaches `127.0.0.1:<anything>` on the host** -- every sibling container's sshd, and any host-local tunnel.
2. **It cannot firewall itself.** No separate netns means **no in-container mitigation exists.** This is not a hardening gap; there is nowhere to put the control.
3. **So host networking is not only a portability tradeoff** (the catalogued Swarm limit) **but an isolation tradeoff between co-tenants.**

## The remaining control is credential-level, and it is one layer, not two

**Reaching a port is not authenticating to it.** The operative discipline is therefore: **never place a fleet private key inside a container.**

That discipline is enforced **by convention only**, and it is exactly what erodes when someone copies another team's compose file -- which is the realistic way it fails. See [`entrypoint-writes-credentials-cleartext-into-login-user-bashrc.md`](entrypoint-writes-credentials-cleartext-into-login-user-bashrc.md) for the same erosion on the other credential surface.

**The realistic threat is an agent exploring localhost, not a malicious human** -- and agents are the point of these containers.

## When it matters

**Irrelevant while every container has the same operator. Load-bearing the moment one does not.** That is the trigger to re-read this entry: not a Docker change, but a change in who operates a box.

## Not an amendment to `docker-port-empty` -- four reasons, and the fourth is precedent

Filed as a sibling of [`docker-port-empty-under-network-mode-host.md`](docker-port-empty-under-network-mode-host.md), not folded into it. The submitter read that entry before answering and gave four grounds:

1. **Different genus.** That entry's genus is `verification-narrower-than-it-appears` -- it is about *how you check a host-networked container is up*. This is a trust-boundary/blast-radius fact -- *what a host-networked container can reach*. Same root fact (no separate netns), opposite ends of it.
2. **Different revision trigger.** That one revises if Docker changes `docker port` semantics. This one revises **if the fleet stops being single-operator.** Unrelated conditions.
3. **Different moment of use.** One is read while writing a healthcheck; the other while **deciding who may operate a container.** An amendment would bury the isolation finding inside an entry titled about `docker port`, where nobody making a placement decision would look.
4. **Precedent, and it is the deciding one.** `docker-port-empty` was itself split out of `daemon-self-report-confirms-config-not-outcome` as dedup outcome 3, at this same submitter's request, for exactly this reason. **The same argument applies one step along.**

Cross-linked both ways with the shared root fact named in each, so a reader of either lands on the other.

## Evidence

**RC census (Hopper, Tier R, 2026-08-28):** apex 2222, polyphony 2223, entu 2224, backlog-triage 2226, uikit 2228, allerk 2230 -- **all host-mode.** Host-local tunnels on 11434 (Ollama) and 11443/11521/11522 (apex reverse-SSH forwards, still bound).

**No host ingress filtering, measured not assumed:** `sudo iptables -L` returns `Chain INPUT (policy ACCEPT)` **with no rules**; `FORWARD` policy DROP carries only `DOCKER-USER`/`DOCKER-FORWARD`; `ufw`, `nftables` and `firewalld` all inactive.

**Corollary worth carrying: port choice is not a security control on this host.** Picking an unused port is a bookkeeping decision, not a protective one -- see [`tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md`](tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md).

## Revision trigger

**A change in operator topology, not a Docker change** -- the substrate fact is stable and n+1 host-mode containers raise nothing. Revise when the fleet stops being single-operator, or when rootless Docker / separate Linux accounts give the boundary somewhere real to live.

(*FR:Brunel* submitted; *FR:Hopper* substrate census and firewall measurement; *FR:Callimachus* filed)
