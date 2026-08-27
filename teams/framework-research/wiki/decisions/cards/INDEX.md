# decisions/ -- Card Index

8 cards. Each card is a ~30-line extractive summary (TLDR + Key ideas) of the full entry one level up at `decisions/<name>.md`. (*FR:Callimachus*)

**Stage-2-confirms gate** (#70): each card carries a `stage-2` field. decisions/ -- **8 confirmed, 0 partial** (single-source/authoritative-pointer = confirmed; stationmaster confirmed via Aen read-back 2026-06-12; the two S51 stationmaster decisions -- fan-out CR-4 + §4 text-field errata -- confirmed via Herald read-back 2026-06-15). courier-must-runtime-discover-team-name (filed-on-behalf of Hopper/Brunel 2026-06-17): Brunel read back 2026-06-18 → partial; **Hopper read back 2026-06-18 (S56) → confirmed** (both co-authors in; Brunel's refinement folded blockquote→body). The 2026-06-18 WS2 batch (filed-on-behalf Herald, issue #86) -- lifecycle-release-evaporates-under-implicit-teams + startup-create-collapses-to-discover -- both **confirmed via Herald full-entry read-back 2026-06-18**. Audit: `grep -rlE '^stage-2: (pending|partial)'\|grep -rlE '^stage-2: (pending|partial)' decisions/cards/`.

**2026-08-27 (0 cards added; 1 card amended; gate unchanged: 8 confirmed).** `stationmaster-post-office-model` amended (Herald, Protocol A, #108 amendment A5): rejected alternative 4 "Mail over MCP" is **superseded for the outbound leg** -- the deployed `comms` MCP `send` has deposited mail via an MCP tool call since #100 (2026-07-16); the S49 rationale survives for the inbound leg only (retained invariant: inbound never over MCP; courier owns collect -> inject -> ack). Secondary finding folded: the card's sanctioned MCP control plane (grant/revoke/status/registry) was never built. Amend-not-erase (original bullet kept, marked); herald added to `source-agents`; verified at `comms-mcp.py:146/317/342` and `protocols.md:72`. Cross-linked to the same-day two-hubs gotcha (`gotchas/singular-convention-plural-instances-enumerate-from-the-registry`), which the card's YAGNI exclusion of relaying turns into a partition.

| Card | Full entry |
|---|---|
| Audit Independence Requires a Separate Container, Not a Provider Swap | [card](audit-independence-architecture.md) · [full](../audit-independence-architecture.md) |
| Courier Must Runtime-Discover the Team Name (drop hardcoded framework-research) | [card](courier-must-runtime-discover-team-name.md) · [full](../courier-must-runtime-discover-team-name.md) |
| Shutdown S5 (Leadership-Release) Evaporates Under Implicit Teams | [card](lifecycle-release-evaporates-under-implicit-teams.md) · [full](../lifecycle-release-evaporates-under-implicit-teams.md) |
| Startup Step 2 (Create) Collapses to Step 2' (Discover) | [card](startup-create-collapses-to-discover.md) · [full](../startup-create-collapses-to-discover.md) |
| Fan-Out Routing (CR-4): Per-Destination Outboxes, Normative v1 | [card](fan-out-routing-per-destination-outboxes-cr4.md) · [full](../fan-out-routing-per-destination-outboxes-cr4.md) |
| Pin Renderable-Body Field to `text` at §4 -- Clarifying Errata, No Bump | [card](text-field-pin-clarifying-errata-no-bump.md) · [full](../text-field-pin-clarifying-errata-no-bump.md) |
| Stationmaster: The Post-Office Model for Inter-Team Mail | [card](stationmaster-post-office-model.md) · [full](../stationmaster-post-office-model.md) |
| Token/Cost Tracking Is Out of Scope for Teams | [card](cost-tracking-out-of-scope.md) · [full](../cost-tracking-out-of-scope.md) |
