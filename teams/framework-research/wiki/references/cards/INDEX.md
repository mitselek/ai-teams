# references/ -- Card Index

12 cards. Each card is a ~30-line extractive summary (TLDR + Key ideas) of the full entry one level up at `references/<name>.md`. References point to live external systems or substrate facts; cards carry the `ttl` where the full entry does. (*FR:Callimachus*)

**Stage-2-confirms gate** (#70): each card carries a `stage-2` field. references/ -- **10 confirmed, 0 pending**. Reference + architectural-fact entries confirm via *substrate verification* (n=2 cross-substrate or authoritative cite), not co-author read-back; the substrate-verified ones are confirmed per their full entries. The drain-on-delivery-2.1.173 datapoint confirmed via Herald FR-side read-back 2026-06-15 (Schliemann = external apex-research observer, offline). The two 2026-06-17 sheets (teams-substrate-2.1.179 + hook-wake-primitives) confirm via the empirical teams-migration probe (Hopper Task #4, committed `b37b938`) + same-session hook proofs -- substrate-verified, not co-author read-back. Their TTL is the re-verification trigger (if a TTL lapses unverified, flag for re-check). Audit: `grep -rlE '^stage-2: pending' references/cards/`.

| Card | Full entry |
|---|---|
| Claude Code Hook Wake/Inject Primitives (CLI 2.1.178/2.1.179) | [card](claude-code-hook-wake-primitives.md) · [full](../claude-code-hook-wake-primitives.md) |
| Drain-on-Delivery Datapoint -- CLI 2.1.173 (customer #2) | [card](drain-on-delivery-datapoint-2.1.173.md) · [full](../drain-on-delivery-datapoint-2.1.173.md) |
| EVR's Actual SSO Is EntraID, Not WSO2 | [card](evr-sso-is-entraid-not-wso2.md) · [full](../evr-sso-is-entraid-not-wso2.md) |
| Inbox-File-Write IS the Wake Mechanism | [card](inbox-file-write-as-wake-mechanism.md) · [full](../inbox-file-write-as-wake-mechanism.md) |
| Inbox Substrate Properties -- Empirical Sheet (CLI 2.1.170) | [card](inbox-substrate-properties-2.1.170.md) · [full](../inbox-substrate-properties-2.1.170.md) |
| Inbox-Slot Acceptance Decoupled From members[] Validation | [card](inbox-slot-vs-members-validation-asymmetry.md) · [full](../inbox-slot-vs-members-validation-asymmetry.md) |
| members[] Edits Are Honored Mid-Session | [card](members-array-edit-honored-mid-session.md) · [full](../members-array-edit-honored-mid-session.md) |
| RC Host -- SSH Keys + DB Tunnel Architecture | [card](rc-host-db-tunnel-architecture.md) · [full](../rc-host-db-tunnel-architecture.md) |
| Teams Substrate -- Empirical Sheet (CLI 2.1.178/2.1.179, implicit teams) | [card](teams-substrate-2.1.179-implicit-teams.md) · [full](../teams-substrate-2.1.179-implicit-teams.md) |
| Cross-Team Model Inventory (re-surveyed 2026-08-19; reclassified here from patterns/) | [card](model-inventory-baseline.md) · [full](../model-inventory-baseline.md) |

| Drain-on-Delivery Datapoint -- CLI 2.1.251 | [card](drain-on-delivery-datapoint-2.1.251.md) · [full](../drain-on-delivery-datapoint-2.1.251.md) |
| Implicit-Teams Substrate Datapoint -- CLI 2.1.251 | [card](teams-substrate-2.1.251-implicit-teams.md) · [full](../teams-substrate-2.1.251-implicit-teams.md) |

> **[INDEX ROWS ADDED 2026-08-31]** 2 row(s) added for entries filed this session, and the header count corrected 10 -> 12. **Discipline reinforced by this session's own drift: entry -> card -> INDEX row, then the next entry.** Writing entry and card together but batching index rows to the end reproduces exactly the 2026-08-19 defect repaired above -- the index is the leg that drifts *because nobody re-reads it*. Counted here against files on disk, not against the previous header. (*FR:Callimachus*)
