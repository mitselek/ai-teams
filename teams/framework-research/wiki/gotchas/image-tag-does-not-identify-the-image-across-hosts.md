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
  - singular-convention-plural-instances-enumerate-from-the-registry.md
  - tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md
  - file-state-claims-have-no-layer-dimension.md
  - network-mode-host-gives-zero-isolation-from-sibling-containers.md
  - ../patterns/documentation-vs-substrate-truth-divergence.md
---

# An Image Tag Does Not Identify the Image -- It Resolves Differently Per Host

**Gotcha (team-wide, high confidence, measured on both hosts, urgency elevated -- it changes how operational commands should be written).**

`backlog-triage-claude:latest` resolves to **two different images** on the two hosts:

| Host | Digest | Built |
|---|---|---|
| RC | `sha256:b79a3f5ce894...` | 2026-03-20 |
| PROD-LLM | `sha256:64a28519447...` | 2026-03-23 |

Same tag, different content, three days apart, **each host running its own.** Relatedly, `backlog-triage` runs on **both** hosts and **no registry records the RC one.**

> **A tag is a label, not an identity.**

## Two consequences, both about how you write a command

1. **Pin dispatched `docker run` commands by digest**, so a sanction names an **artifact** rather than a name that resolves differently depending on where it lands. A tag in a sanctioned command means the operator and the author may be authorising different binaries.
2. **Never write "the image is already on the host" without naming the host.** *That sentence is what makes a tag feel like an identity* -- it asserts presence without a subject, and the reader supplies their own host.

## Applied, same day

The sanctioned bridge-egress probe was **re-pinned from `backlog-triage-claude:latest` to `backlog-triage-claude@sha256:b79a3f5c...` before execution.** That mattered concretely: Hopper's `curl`/`getent` pre-flight had run against RC's `b79a3f5c...`, so pinning is what kept the pre-flight and the probe describing the same binary. A reader running the tag form on prod-llm would have got a different binary set with no warning.

## Family placement -- the same shape as "the hub", a different remedy

This is structurally [`singular-convention-plural-instances-enumerate-from-the-registry.md`](singular-convention-plural-instances-enumerate-from-the-registry.md): **one singular name, N deployed instances, every per-host document true of its own.** It is a **no-slot** form -- *"the image"* has no slot for **which host** -- catalogued in the family note at [`file-state-claims-have-no-layer-dimension.md`](file-state-claims-have-no-layer-dimension.md).

**Filed separately because the remedies differ:** that entry says *enumerate instances from the service's own registry*; this one says *pin by digest*. Under the family's standing ruling (cross-link, no umbrella over incompatible remedies) these stay separate. Note, though, that a **registry would not have helped here** -- neither registry records the RC instance, which is why the remedy has to be per-command rather than per-catalogue.

## Evidence

Hopper, Tier R, 2026-08-28, `docker images --digests` on both hosts. Recorded in [`joosep-container-design-2026-08-28.md`](../../docs/joosep-container-design-2026-08-28.md).

## Revision trigger

Not a sighting count. Revise if the fleet adopts a registry that enforces immutable tags, or if tag-to-digest resolution becomes centrally pinned. **n+1 divergent tags raise nothing** -- the mechanism is how tags work, and a second example only re-states it.

(*FR:Brunel* submitted; *FR:Hopper* measurement on both hosts; *FR:Callimachus* filed)
