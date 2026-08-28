---
title: "TCP Ports Are a Per-Host Namespace -- No Fleet Uniqueness Invariant, and Compounding on a Correction Is Worse Than the Original Misread"
directory: gotchas
status: active
confidence: high
source-agents: [brunel, hopper]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [image-tag-does-not-identify-the-image-across-hosts.md, singular-convention-plural-instances-enumerate-from-the-registry.md, warp-host-sshd-2222-collision-with-apex-live.md, holding-a-measurement-is-not-having-applied-it.md, ../patterns/documentation-vs-substrate-truth-divergence.md]
tags: [gotcha, ports, namespace, registry, rc-host, shipyard, prod-llm, no-slot, self-report, correction-discipline, po-ruling]
---

## TLDR

**TCP ports are a per-host namespace.** A port used on one host does not conflict with the same number on another, and **there is no fleet-wide uniqueness invariant to protect** -- prod-llm and RC both run something on 2226, legitimately. Importing a row scoped to host X into a port question about host Y and reading it as a collision is **a category error, not a collision.**

## Key ideas

- **The half worth leading with, and the reason it was submitted -- the author made it twice.** He claimed a 2230 collision (a shipyard row against an RC question); **when corrected he escalated to a "three-way divergence" rather than asking whether there was a claim at all.** → ***When corrected, re-derive from scratch before reframing. Compounding on a correction is worse than the original misread, because it launders a wrong premise into a more confident-sounding one.***
- **Why the second move is structurally worse:** reframing preserves the premise while changing its dress, and arrives with the authority of having survived a challenge. **A reader meets a version that looks MORE examined, not less.** Retraction preserved at `joosep-container-design-2026-08-28.md` §1.4b, **keeping both wrong versions visible** -- the only thing that makes a reframing legible later.
- **PO ruling 2026-08-28:** `/home/dev/allerk/docker-compose.yml`'s header table is the **ground-truth port registry for RC**; other records point at it. Rationale, earned empirically: ***the record lives where the claim is made*** -- a registry claimants never open does not get updated, and that comment did, for six containers, unprompted.
- **Three records, three answers:** `registry.json` (screenwerk shipyard:2230, mvox shipyard:2229) vs `~/bin/rc-deployments.json` (screenwerk-dev elsewhere:22, no mvox row) vs the host (2230 = allerk). `registry.json` had no row for uikit-dev (2228) or allerk (2230) and a stale `(reserved)` 2221.
- **Practical rule:** a port is unclaimed only if unclaimed **on the target host** *and* in every record claiming to describe it -- **check the compose header first, then register in all three.**
- **Family:** a no-slot form (*"2230 is taken"* has no slot for which host) and a same-day sibling of `image-tag-does-not-identify-the-image-across-hosts`. Both are *one name, N per-host instances* with a **per-command** rather than per-catalogue remedy, for the same reason: **the catalogue was wrong and the substrate was not.**

(*FR:Callimachus*)
