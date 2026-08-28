---
source-agents:
  - team-lead
source-team: framework-research
discovered: 2026-08-27
filed-by: librarian
last-verified: 2026-08-27
status: active
source-files:
  - teams/framework-research/docs/2026-08-27-stationmaster-consolidation-proposal.md
  - teams/framework-research/wiki/decisions/stationmaster-post-office-model.md
source-commits: []
source-issues:
  - 108
related:
  - stationmaster-post-office-model.md
  - ../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md
  - ../gotchas/precondition-without-an-owner-is-no-precondition.md
  - ../patterns/island-local-everything-only-the-repo-crosses.md
---

# Two Islands by Design -- Hub Topology Follows the Network Boundary; Git Is the Bridge

**Decision (PO ruling on #108 amendment A1, 2026-08-27; posted as `issuecomment-5439161208` on mitselek/ai-teams#108 -- the authoritative record; this entry records the rationale and the rejected alternatives).**

## The decision

The two stationmaster hubs discovered in [`../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md`](../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md) are **not a defect to consolidate -- they are two islands by design, and the hub topology follows the network boundary that creates them**:

- **EVR declines tailnet.** That network boundary, not any mail-layer choice, partitions the fleet.
  **Overlay gloss (added 2026-08-28, #109 -- the phrase is the PO's and stands as recorded):** the two islands sit on **two different overlays**, not on one network that EVR opted out of. EVR hosts are on **Cloudflare WARP**; the personal island is on Tailscale. *"EVR will not join the tailnet"* names **sagres's** overlay, and is correct as written. Because both overlays allocate from the shared `100.64/10` CGNAT range, EVR `100.x` addresses are repeatedly misread as tailnet addresses -- see [`../gotchas/warp-cgnat-address-misread-as-tailscale.md`](../gotchas/warp-cgnat-address-misread-as-tailscale.md). *(*FR:Callimachus*)*
- **prod-llm hub = the EVR island** (framework-research + apex-research).
- **sagres hub = the personal island** (po-team, mvox, Passepartout).
- **No federation. The S49 no-relay exclusion is NOT reopened** -- [`stationmaster-post-office-model.md`](stationmaster-post-office-model.md) "Relaying / multi-hop -- left out as YAGNI" stands.

## The bridge is git, not mail

**The git repo is the inter-island bridge.** FR is a two-box team -- the EVR Windows box and the home Linux box `p2rtela6` -- and **both islands see the same commits.** Cross-island coordination rides version control (the work-of-record layer), not the mail layer; mail stays island-local.

PO's rationale, preserved in spirit as submitted: the connection *"doesn't need to be a goal per se -- just acknowledging that we spawn on two boxes is already good, so we can check our host on startup."*

## Sub-decisions

- **a1.1 (optional):** opportunistic sagres-island membership **when spawned on the home box** -- a capability to use when the network position allows it, not an obligation.
- **a1.2 (required):** proper **EVR-island formation** -- hub currency, revocation of scratch keys, owned operations. The EVR island stops running on survey-era leftovers.

## Rejected alternatives

- **Federation / relay between the hubs** -- rejected; would reopen S49's no-relay exclusion to solve a problem the git bridge already covers.
- **Consolidating onto one hub** -- rejected; the network boundary (EVR's tailnet decline) is not FR's to move, and a single hub would leave one side unreachable.
- **Making the inter-island connection a goal** -- rejected by the PO explicitly ("doesn't need to be a goal per se"); the acknowledgment plus a startup host-check is the whole requirement.

## Consequences

1. **"The hub" now has an honest plural name.** The singular-convention gotcha's open question ("one network or two with an honest name") is answered: **two, named, by design.** Documents should say *which island's hub* they mean.
2. **A startup host-check becomes the owned trigger.** "Check our host on startup" is [`../gotchas/precondition-without-an-owner-is-no-precondition.md`](../gotchas/precondition-without-an-owner-is-no-precondition.md)'s remedy applied by construction: condition = which box am I on; check = host identity; **owner and moment = the startup step itself.** a1.1's opportunistic membership hangs off that check.
3. **Expected follow-on specs** (Protocol A traffic anticipated): Herald -- a1.1 spec; Brunel -- a1.2 spec + runbook. This entry is the decision they implement; it does not pre-state their content. *Herald's landed same day:* [`../patterns/island-local-everything-only-the-repo-crosses.md`](../patterns/island-local-everything-only-the-repo-crosses.md) -- the operational discipline (island-local machinery; only the repo crosses; host-check owns courier arming).

## Provenance

PO decision on #108 A1, relayed and submitted by team-lead via Protocol A 2026-08-27 15:30; the issue comment is the authoritative record (pointer, not copy). The two-hub substrate facts are Herald's, already verified in the singular-convention gotcha. **`stage-2: confirmed`** -- author-is-filer (team-lead's direct submission of a decision he carried from the PO; his same-session read-back offer stands for the rendering).

(*FR:Aen* submitted; *FR:Callimachus* filed)
