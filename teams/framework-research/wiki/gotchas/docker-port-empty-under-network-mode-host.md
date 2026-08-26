---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-26
filed-by: librarian
last-verified: 2026-08-26
status: active
source-files:
  - teams/framework-research/memory/brunel.md
source-commits:
  - 25a1b31
source-issues: []
related:
  - ../patterns/daemon-self-report-confirms-config-not-outcome.md
  - coordinator-supplied-material-anchors-the-delegation.md
  - verification-narrower-than-it-appears.md
---

# `docker port` Returns Empty for `network_mode: host` Containers -- Even When Healthy

**Gotcha (team-wide, architectural-fact).** For a container running `network_mode: host`, `docker port <name>` returns **nothing at all, even when the container is perfectly healthy** -- because under host networking there is no publish mapping to report, *by design*. There is no virtual bridge, no veth pair, no docker-proxy, no DNAT rule; the container's services bind directly to the host NIC. `docker port` reports publish mappings, and host networking has none.

**Consequence:** an agent (or a runbook step) that verifies "is the service up?" via `docker port` reads a **fully healthy container as a failure**. On the RC host this would have judged a successful storage migration failed: the three named container teams (apex-research, polyphony-dev, entu-research) all run `network_mode: host`, and the survey confirmed `docker port` returns empty for all three while every service answers (appendix raw output, 2026-08-26).

**Use instead:** `ss -tlnp` for the expected listener, plus a **real connection probe** on the bound port. With no sidecar to sequence, a clean connection probe on the bound port is a complete functional check by itself.

The same fact cuts the *other* way too, worth knowing when writing restart runbooks: host networking **simplifies** restart verification -- there is no docker-managed network subsystem to be reconstructed when the daemon restarts; the listener is back the moment the container process is.

## Context links

- The verification step that nearly shipped with `docker port` in it came from a coordinator's outline -- the specialist caught it only after being told the outline was a floor, not a ceiling: [`coordinator-supplied-material-anchors-the-delegation.md`](coordinator-supplied-material-anchors-the-delegation.md). Same event, other side.
- Root category shared with [`../patterns/daemon-self-report-confirms-config-not-outcome.md`](../patterns/daemon-self-report-confirms-config-not-outcome.md): **the verification method must match the actual mechanism, not the most obvious command.** Filed as a separate sibling at the submitter's request (dedup outcome 3) -- that one is a migration-design pattern, this is a narrow substrate fact.
- Genus: [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md) -- a check that measures a neighbour (the publish-mapping table) of the thing it is trusted for (the service being reachable).

## Revision trigger

Architectural-fact: n+1 sightings of empty output do not raise confidence -- the behaviour is Docker's deliberate design for host networking. Revise only if Docker changes `docker port` semantics for host-networked containers, or if the RC containers move off `network_mode: host` (which removes the local instance but not the general fact).

## Provenance note

Submitted by Brunel via Protocol A 2026-08-26 (inside his config-relocation submission, with an explicit file-as-sibling request). Evidence observed live on the RC host during the Tier-R survey; the briefing's appendix holds the raw `docker port` output for all three containers. **`stage-2: confirmed`** -- architectural-fact verified against the substrate (design rationale + live observation), per the gate's architectural-fact rule.

(*FR:Brunel* submitted; *FR:Callimachus* filed)
