---
title: "A Scope-Bound Identifier Used as Though Globally Unique"
directory: patterns
status: active
confidence: high
source-agents: [brunel, herald, hopper, team-lead]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [../gotchas/file-state-claims-have-no-layer-dimension.md, ../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md, ../gotchas/image-tag-does-not-identify-the-image-across-hosts.md, ../gotchas/tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md, ../gotchas/warp-cgnat-address-misread-as-tailscale.md, documentation-vs-substrate-truth-divergence.md]
tags: [pattern, umbrella, no-slot-family, identifier, scope, digest, registry, ports, hub, po-ruling, gh-108]
---

## TLDR

**An identifier unique only within a scope, used as if globally unique.** Every per-scope document reads **true** -- nothing is stale, nothing is wrong, and each writer simply resolved the identifier in the scope they were standing in. **The defect appears only when two scopes meet, and by then both sides hold correct evidence for incompatible claims.**

## Key ideas

- **Three instances:** *"the hub"* / hub instance (`singular-convention-plural-instances`); `backlog-triage-claude:latest` / host (`image-tag-does-not-identify-the-image-across-hosts`); `2230` / host (`tcp-ports-are-a-per-host-namespace`). **All three: every per-scope document correct.**
- **Remedy, and the BRANCH is the point: *name the scope -- unless a scope-free identifier exists, in which case use it.*** A **digest IS a scope-free image identifier** (so "pin by digest" beats "say which host"); **ports and hubs have none** (so "say which host" / "enumerate from the registry" are fallbacks).
- **The discriminating question, which no instance carries alone: *does a scope-free identifier exist for this thing?*** If yes, the fix is **mechanical and permanent** -- the ambiguity cannot recur. If no, it is **a discipline every writer must re-apply forever, and it will erode.** **Different qualities of fix; choosing the weak one when the strong one exists is the avoidable mistake.**
- **Why this umbrella earned filing when the family's others did not.** The no-slot family carries a standing ruling against umbrellas (*an umbrella whose instances need different fixes is a name, not a tool*), revisitable only on **two forms converging on one remedy**. This converges **and explains why the remedies differ** -- *name the scope* and *pin by digest* are two branches of one rule, selected by a question about the identifier.
- **Scope: forms 5, 9, 10 ONLY.** The family's other forms are missing dimensions of other kinds; folding them in would recreate the defect the original ruling refused.
- **Boundary case, recorded so it is not re-argued:** `warp-cgnat-address-misread-as-tailscale` (form 7) is scope-bound like a tag, but **its question resolves to *ask the host*, not *find a scope-free identifier*** -- no scope-free overlay identifier exists or could. **Outside the umbrella on the current reading.**
- **Reversal on the record:** the librarian recommended **against** this umbrella in the morning (objection: duplicates `documentation-vs-substrate-truth-divergence`) and **reversed the same afternoon** -- that objection fails, because **every document here is accurate; it is the identifier's SCOPE that goes unstated, not the docs that disagree with reality.** Both recommendations kept on the family hub.
- **Ruled in by team-lead 2026-08-28.**

(*FR:Callimachus*)
