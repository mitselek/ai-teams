# decisions/ — Card Index

5 cards. Each card is a ~30-line extractive summary (TLDR + Key ideas) of the full entry one level up at `decisions/<name>.md`. (*FR:Callimachus*)

**Stage-2-confirms gate** (#70): each card carries a `stage-2` field. decisions/ — **5 confirmed, 0 pending** (single-source/authoritative-pointer = confirmed; stationmaster confirmed via Aen read-back 2026-06-12; the two S51 stationmaster decisions — fan-out CR-4 + §4 text-field errata — confirmed via Herald read-back 2026-06-15). Audit: `grep -rl 'stage-2: pending' decisions/cards/`.

| Card | Full entry |
|---|---|
| Audit Independence Requires a Separate Container, Not a Provider Swap | [card](audit-independence-architecture.md) · [full](../audit-independence-architecture.md) |
| Fan-Out Routing (CR-4): Per-Destination Outboxes, Normative v1 | [card](fan-out-routing-per-destination-outboxes-cr4.md) · [full](../fan-out-routing-per-destination-outboxes-cr4.md) |
| Pin Renderable-Body Field to `text` at §4 — Clarifying Errata, No Bump | [card](text-field-pin-clarifying-errata-no-bump.md) · [full](../text-field-pin-clarifying-errata-no-bump.md) |
| Stationmaster: The Post-Office Model for Inter-Team Mail | [card](stationmaster-post-office-model.md) · [full](../stationmaster-post-office-model.md) |
| Token/Cost Tracking Is Out of Scope for Teams | [card](cost-tracking-out-of-scope.md) · [full](../cost-tracking-out-of-scope.md) |
