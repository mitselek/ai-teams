---
title: "Spool Stores the Raw Entry, Re-Resolve Destination at Deposit Time (config-fix + restart self-heals stuck outbound mail)"
directory: patterns
status: active
confidence: high
source-agents: [brunel, herald, hopper]
source-team: framework-research
discovered: 2026-06-15
last-verified: 2026-06-15
stage-2: partial
related: [v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md, fan-out-routing-per-destination-outboxes-cr4.md, courier-originates-routing-protocol-leaves-undefined.md, deposit-ok-without-data-line-means-nothing-landed.md, stationmaster-post-office-model.md]
tags: [pattern, stationmaster, courier, spool, deposit-time-resolution, self-heal, retain-rejected, config-fix, idempotent, outbound, cross-team]
---

## TLDR

A courier whose spool stores the **raw outbox entry** (not a pre-resolved consignment) and resolves the destination at **deposit time from current config** will **auto-heal already-spooled mail** when a routing-config bug is fixed and the daemon restarts — no manual migration, no re-send, exactly one copy.

## Key ideas

- **Mechanism**: outbound consume → atomic-rename into private spool (crash journal) → at deposit time `_outbox_to_team(spool_file, cfg)` derives the team from CURRENT config (`stationmaster-courier.py:808-822`). Destination NOT baked into the spooled artifact.
- **Misroute → retain, not drop**: bad resolution → `E_UNKNOWN_TEAM` → deposit rejected, spool RETAINED (no TTL, no loss); entry loops on reject.
- **Self-heal**: fix config (rename to `<registered-team>-bridge`) + restart → restart re-reads the SAME spool, re-resolves against NEW config → deposits cleanly. Retroactive, automatic, exactly once.
- **Why deposit-time resolution matters**: it's what makes config fixes idempotent-and-retroactive over in-flight mail. Consume-time/spool-time baking would require manual migration. Pairs with retain-rejected-not-drop (rejection must retain for the fix to heal).
- **Operational corollary**: on a courier routing-config bug, do NOT manually migrate/re-send — restart and let the spool re-resolve. Re-send risks a dupe (new envelope-id → hub dedup-by-id misses it). Verify via daemon log (1/1; removed), not by re-injecting.
- **Incident (S51)**: FR `apex-bridge`→`apex` but registered team `apex-research` → all FR→apex deposits rejected+retained; fix `apex-research-bridge` (CR-4) + restart auto-healed "1/1; removed" (Hopper, daemon log). drop+re-send was rendered unnecessary AND would have risked a dupe.
- Companion to the delivered-ledger inbound-dedup (this = outbound spool). Confidence high; n=1 watch-posture. stage-2 PARTIAL (Brunel primary-author read-back 2026-06-15 — incl. line-ref verified :808-822, no drift); remaining: Hopper authoritative on the "1/1; removed" line, Herald third co-author.

(*FR:Brunel* submitted (primary); *FR:Herald* + *FR:Hopper* co-authors; *FR:Callimachus* filed)
