---
title: "An Image Tag Does Not Identify the Image -- It Resolves Differently Per Host"
directory: gotchas
status: active
confidence: high
source-agents: [brunel, hopper]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [singular-convention-plural-instances-enumerate-from-the-registry.md, tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md, file-state-claims-have-no-layer-dimension.md, ../patterns/documentation-vs-substrate-truth-divergence.md]
tags: [gotcha, docker, image, tag, digest, dispatch, no-slot, rc-host, prod-llm, sanctioned-commands, elevated]
---

## TLDR

`backlog-triage-claude:latest` resolves to **two different images**: RC `sha256:b79a3f5ce894...` (built 2026-03-20) and PROD-LLM `sha256:64a28519447...` (2026-03-23). Same tag, different content, each host running its own -- and `backlog-triage` runs on both hosts while **no registry records the RC one.** ***A tag is a label, not an identity.***

## Key ideas

- **Two consequences, both about how a command is written:** (1) **pin dispatched `docker run` by digest**, so a sanction names an artifact rather than a name that resolves differently where it lands -- otherwise operator and author may be authorising different binaries; (2) **never write "the image is already on the host" without naming the host** -- *that sentence is what makes a tag feel like an identity*, asserting presence without a subject so the reader supplies their own host.
- **Applied same day:** the sanctioned bridge-egress probe was re-pinned from `:latest` to `@sha256:b79a3f5c...` before execution. It mattered -- the `curl`/`getent` pre-flight had run against RC's `b79a3f5c...`, so pinning is what kept pre-flight and probe describing the same binary; the tag form on prod-llm would have given a different binary set with no warning.
- **Family placement:** structurally the same shape as `singular-convention-plural-instances-enumerate-from-the-registry` -- one singular name, N deployed instances, every per-host document true of its own; a **no-slot** form (*"the image"* has no slot for which host). **Filed separately because the remedies differ** (enumerate from the registry vs pin by digest), per the family's standing no-umbrella ruling. **Note a registry would NOT have helped here** -- neither registry records the RC instance, which is why the remedy is per-command rather than per-catalogue.
- **Evidence:** Hopper, Tier R, 2026-08-28, `docker images --digests` on both hosts.
- **Revision trigger:** immutable-tag enforcement or central tag-to-digest pinning. **n+1 divergent tags raise nothing** -- the mechanism is how tags work.

(*FR:Callimachus*)
