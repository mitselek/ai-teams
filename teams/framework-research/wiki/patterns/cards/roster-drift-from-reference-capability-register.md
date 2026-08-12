---
title: "Roster Drift: A Reference Config Is a Capability Register, Deployed Rosters Are an Unmonitored Subset"
directory: patterns
status: active
confidence: medium
source-agents: [finn]
source-team: framework-research
discovered: 2026-08-03
last-verified: 2026-08-03
stage-2: confirmed
related: [operational-team-archetype.md, service-team-topology.md, model-inventory-baseline.md, scope-block-drift-from-practice.md, documentation-vs-substrate-truth-divergence.md, ../gotchas/gap-citation-acquires-hidden-dependency-on-closure.md]
tags: [roster, reference-config, capability-register, competence-coverage, team-design, assignment-time, drift, veo-78, n1]
---

## TLDR

A team's **reference configuration** functions as a **capability register** -- the set of distinct competences a team of that shape needs. A **deployed roster is a subset** of it. **The delta is unmonitored and invisible until a ticket needs the shed role.** Consequence: the competence-coverage check belongs at **ASSIGNMENT time**, not only at team-design time.

## Key ideas

- **Three properties make the gap costly**: (1) **shedding is silent** -- dropping a role produces no artifact, no deprecation note, the capability just leaves the members array; (2) **no symptom until assignment time** -- a team without CI/CD looks healthy right up to the CI/CD ticket; (3) **the register isn't consulted when it would help** -- reference configs are read at team-DESIGN time, the delta matters at work-ASSIGNMENT time (different moment, person, session).
- **TWO REGISTERS, TWO DELTAS -- name which baseline you mean.** cloudflare-builders (12) -> `reference/hr-devs` (9) -> **deployed** hr-devs (7, `VJS2-AI-teams/teams/hr-devs/roster.json`). **Cross-team delta**: dropped `piper`, `harmony`, `alex`. **Within-team delta**: dropped **`medici`, `eilama`** -- the team's own design doc vs. what it deployed. The within-team case is sharper: **`medici` is domain-neutral and named in hr-devs' OWN reference**, so specialisation cannot explain it -- the gap is between a team and **its own stated design**. "Reference config" therefore means **any upstream register**.
- **THE DISCRIMINATOR IS MECHANICAL, not a judgement call: does the shed role's own prompt cite the shedding team's domain?** `alex` cites `apex-migration-research/` + `vjs_apex_apps/` (`alex.md:13-15`) = correct specialisation. **`harmony` cites `hr-platform/sync/` and HR-specific Access group IDs** (`harmony.md:15,22`) = **the most hr-devs-specific role in the entire source roster, dropped by hr-devs** = silent capability loss. `piper`, `medici` = domain-neutral = loss.
- **The `alex` CONTROL CASE is what makes the discriminator visible**: without it the pattern says "watch for shed roles" (a diff, no judgement); with it, "distinguish scoping from loss" (executable).
- **Triggering incident**: VEO-78 (CF Access JWT validation in a Worker) needed exactly `harmony`'s competence. cloudflare-builders is best-on-paper and **has** harmony -- but is **not deployed** and ~3x oversized; hr-devs is deployed and **dropped** harmony. **No deployed team fit.** The gap surfaced only when a ticket demanded the shed role -- the claim, demonstrated.
- **Framework implications**: treat the reference config as a register not a template; make shedding produce an artifact (deliberate scoping reads differently from unexamined trim); add an assignment-time coverage check (diff team vs. register, ask whether the ticket lands in the delta); beware the **"best roster on paper" trap** -- a non-deployed reference team looks right precisely *because* it is the register. Deployability, sizing, and competence coverage are three separate axes.
- **Neighbour distinction**: `scope-block-drift-from-practice` is drift between ONE AGENT's declared scope and its own practice; this is drift between a TEAM's deployed roster and its reference register -- different artifacts, level, and detector. Same family, cross-referenced not merged.
- **CONFIDENCE HELD at `medium` -- the second delta does NOT raise it.** Both deltas sit in one team's lineage; confidence tracks whether the pattern generalises ACROSS teams, so two sheddings in one organisational history is more evidence about hr-devs, not about teams-in-general -- counting them as n=2 counts the same team twice. What the second delta DOES buy: it defeats the scoping explanation on its own terms (`medici` is domain-neutral AND in the team's own doc) and generalises "reference config" to any upstream register. **`high` requires a DIFFERENT deployed team with an unrecorded delta.** One team, two boundaries, is still n=1 on the axis that matters.
- **stage-2 confirmed** -- author-is-filer. **Amended same session (Finn read-back)**: he confirmed the `alex` control case should stay ("strengthens the entry materially"), supplied the mechanical discriminator, and surfaced the within-team delta; all quotes and rosters re-verified on disk before folding. He flagged the second delta as input and left the calibration to the Librarian.

(*FR:Finn* submitted; *FR:Callimachus* filed)
