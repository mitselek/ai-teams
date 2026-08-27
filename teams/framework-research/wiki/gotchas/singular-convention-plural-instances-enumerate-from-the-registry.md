---
source-agents:
  - herald
source-team: framework-research
discovered: 2026-08-27
filed-by: librarian
last-verified: 2026-08-27
status: active
confidence: high
source-files:
  - teams/framework-research/docs/2026-08-27-stationmaster-consolidation-proposal.md
  - designs/deployed/po-team/setup-log.md
  - designs/deployed/po-team/wiki/references/hub-on-sagres.md
  - designs/deployed/po-team/container/shipyard/ai-teams/mvox-courier-config.json
  - teams/framework-research/wiki/decisions/stationmaster-post-office-model.md
source-commits: []
source-issues:
  - 108
related:
  - ../decisions/stationmaster-post-office-model.md
  - at-least-once-without-age-alarm-hides-unbounded-latency.md
  - file-state-claims-have-no-layer-dimension.md
  - negative-probe-result-underdetermined-absence-read-as-permanent.md
  - ../patterns/stale-snapshot-trusted-as-current.md
  - ../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md
---

# A Convention Described in the Singular Can Have N Deployed Instances -- and Every Per-Instance Document Reads True

**Gotcha (cross-team, observation-based, high confidence).** "The hub" is a singular noun with no slot for *which*. Today there are **two stationmaster hubs with no link between them**, every document about either is accurate about its own hub, and the consolidation proposal for "the" convention lists one of them.

## The two instances (verified 2026-08-27)

| | prod-llm hub | sagres hub |
|---|---|---|
| Address | `sm@10.100.136.162:2222` | `sm@100.102.133.125:2222` (tailnet) |
| Up since | 2026-06-12 (`status` `hub.uptime_s: 6552057` at 10:23Z -- 75.8 days, which back-computes to 2026-06-12: the two figures agree) | deployed 2026-07-15 |
| Registered | `{"teams":[alpha, apex-research, beta, fr-test, framework-research]}` | po-team, mvox, passepartout |
| Grants | FR <-> apex only; queues empty | (per po-team docs) |
| Cited by | FR `fr-courier.config.auto.json` `ssh_target sm@10.100.136.162` (local, gitignored); `~/.claude/skills/inter-team-comms/SKILL.md:31` | `designs/deployed/po-team/setup-log.md:97`; `po-team/wiki/references/hub-on-sagres.md:7-8`; `mvox-courier-config.json:3` |

**Neither knows the other exists.** The S49 decision card excludes relaying (*"Relaying / multi-hop -- left out as YAGNI"*, verified), so these are **two mail networks sharing one name.** A team on hub A addressing a team on hub B gets `E_UNKNOWN_TEAM` -- **which reads as a typo, not as a partition.**

## Why the documents are all true and the picture is still wrong

The #108 proposal §3 ("deployed reality") lists sagres, shipyard, p2rtela6 -- **only the sagres network** -- and §1 states *"every live route today runs over the hub."* **True per hub. False for the network.** No sentence in any per-instance document is stale or mistaken; the falsehood lives in the singular article, which asserts a uniqueness nobody wrote down and nobody checked.

This is therefore **not** an instance of [`../patterns/stale-snapshot-trusted-as-current.md`](../patterns/stale-snapshot-trusted-as-current.md) -- nothing aged. It is the **no-slot** shape: like [`file-state-claims-have-no-layer-dimension.md`](file-state-claims-have-no-layer-dimension.md) (*"the file says X"* with no slot for HEAD vs tree), *"the hub"* has no slot for **which hub**, and every writer filled the missing slot with their own instance without noticing there was a slot.

## The falsifier is one read-only call

`registry` -- read-only, one line, decisive:

```
printf '{"v":1,"cmd":"registry"}' | ssh -T -i <team key> -p 2222 sm@<hub>
```

If the team you expect is not in the list, you are on a different network, not misspelling a name.

## Rule

**Before adopting or documenting "the" shared service, enumerate its instances from the service's own registry -- not from the docs of the instance you happen to use.** The docs of one instance cannot tell you how many instances there are; only the service can, and only per instance you can reach -- so ask every hub you know of, and treat a team you expected but did not find as evidence of a *partition*, not a typo.

Corollary for error reading: `E_UNKNOWN_TEAM` is a **negative result underdetermined between "no such team" and "not on this hub"** -- the same asymmetry as [`negative-probe-result-underdetermined-absence-read-as-permanent.md`](negative-probe-result-underdetermined-absence-read-as-permanent.md), here as a hazard rather than an observed misread.

## Consequence for #108

The proposal's §3 needs the second hub, and the consolidation needs a decision it does not yet contain: one network (migrate one hub's teams onto the other, or add the relay the S49 card declined) or two networks with an honest name. Reported to team-lead as #108 amendment **A1** (Herald, 13:26) and gated to the PO.

**RESOLVED same day (PO, #108 `issuecomment-5439161208`): two networks with an honest name -- by design.** EVR declines tailnet, so the hub topology follows the network boundary; no federation, S49 no-relay unopened; **the git repo is the inter-island bridge.** Full record: [`../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md`](../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md). This gotcha's rule (enumerate instances from the registry; name which hub) survives the resolution unchanged -- the plurality is now legitimate, and documents still must say which island they mean.

## Confidence

**High, as submitted.** Both instances verified at source by the librarian (sagres: three deployed-config lines; prod-llm: FR's own courier config + skill); the registry and status output are quoted as returned at 10:23Z (ephemeral, not re-runnable by the librarian) and are internally consistent with the deployment date. The decision card's relay exclusion verified.

## Provenance

Submitted directly by Herald via Protocol A 2026-08-27 from the #108 assessment. **`stage-2: confirmed`** -- author-is-filer (direct submission; file evidence re-verified at filing).

(*FR:Herald* submitted; *FR:Callimachus* verified and filed)
