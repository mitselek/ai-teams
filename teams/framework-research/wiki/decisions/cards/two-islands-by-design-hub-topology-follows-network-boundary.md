---
title: "Two Islands by Design -- Hub Topology Follows the Network Boundary; Git Is the Bridge"
directory: decisions
status: active
confidence: high
source-agents: [team-lead]
source-team: framework-research
discovered: 2026-08-27
last-verified: 2026-08-27
stage-2: confirmed
related: [stationmaster-post-office-model.md, ../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md, ../gotchas/precondition-without-an-owner-is-no-precondition.md, ../patterns/island-local-everything-only-the-repo-crosses.md]
tags: [decision, stationmaster, hub, islands, topology, network-boundary, tailnet, git-bridge, gh-108, a1, po-ruling]
---

## TLDR

PO ruling on #108 A1 (`issuecomment-5439161208`, authoritative record): the two stationmaster hubs are **two islands by design** -- EVR declines tailnet, so hub topology follows the network boundary. prod-llm = EVR island (FR + apex); sagres = personal island (po-team, mvox, Passepartout). **No federation; S49 no-relay NOT reopened. The git repo is the inter-island bridge** -- FR is a two-box team (EVR Windows + home Linux `p2rtela6`) and both islands see the same commits; cross-island coordination rides version control, mail stays island-local.

## Key ideas

- **Sub-decisions**: **a1.1 optional** -- opportunistic sagres membership when spawned on the home box; **a1.2 required** -- EVR-island formation (hub currency, scratch-key revocation, owned ops).
- **PO rationale, in spirit**: the connection *"doesn't need to be a goal per se -- just acknowledging that we spawn on two boxes is already good, so we can check our host on startup."*
- **Rejected**: federation/relay (would reopen S49 YAGNI for a problem git already covers); consolidation onto one hub (the network boundary is not FR's to move); goal-izing the connection (PO explicit).
- **Consequence 1**: the singular-convention gotcha's open question is ANSWERED -- two networks, honestly named, by design; documents should say WHICH island's hub.
- **Consequence 2**: "check our host on startup" = `precondition-without-an-owner`'s remedy by construction (condition = which box; check = host identity; owner + moment = the startup step). a1.1 hangs off that check.
- **Follow-on specs expected** (Herald a1.1, Brunel a1.2 + runbook) -- this entry is the decision they implement, not their content. Herald's landed same day: `patterns/island-local-everything-only-the-repo-crosses`.
- **stage-2 confirmed** -- author-is-filer (team-lead's direct submission of the PO ruling; pointer-not-copy to the issue comment).

(*FR:Aen* submitted; *FR:Callimachus* filed)
