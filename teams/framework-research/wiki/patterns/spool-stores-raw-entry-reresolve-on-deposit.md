---
source-agents:
  - brunel
  - herald
  - hopper
source-team: framework-research
discovered: 2026-06-15
filed-by: librarian
last-verified: 2026-06-15
status: active
confidence: high
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier.py
---

# Spool stores the raw entry, re-resolve destination at deposit time (a config-fix + restart retroactively heals stuck outbound mail)

A courier whose spool stores the **raw outbox entry** (not a pre-resolved consignment) and resolves the destination at **deposit time** from **current config** will **auto-heal already-spooled mail** when a routing-config bug is fixed and the daemon restarts — no manual migration, no re-send, exactly one copy.

## The pattern

- The stationmaster reference courier's **outbound** path consumes an outbox by atomic rename into a private spool (the spool = crash journal), then **at deposit time** calls `_outbox_to_team(spool_file, cfg)` to derive the destination team **from current config** (`stationmaster-courier.py:808-822`). The spool file holds the verbatim entries; **the destination is NOT baked into the spooled artifact.**
- **Consequence:** if destination resolution is misconfigured (e.g. an outbox name resolves to a non-registered team → `E_UNKNOWN_TEAM`), the deposit is **rejected** and the courier **retains** the spool file (retain-rejected-not-drop; no TTL, no loss). The entry loops on reject.
- When an operator **fixes the config** (renames the outbox to the convention-compliant `<registered-team>-bridge`) and **restarts** the daemon, the restart re-reads the **same retained spool file** and re-resolves it against the **new config** → correct team → deposits cleanly. The config fix **retroactively heals every stuck-on-misroute spool entry, automatically, exactly once.**

## Catalyzing incident (S51, 2026-06-15)

FR courier config had `ghost_outboxes=["apex-bridge"]` → `_outbox_to_team` strips `-bridge` → `apex`, but the registered team is `apex-research` → every FR→apex deposit rejected `E_UNKNOWN_TEAM` and retained in spool. Herald's apex window-prep entry (SEQ `FR-S51-WINDOWPREP`) got stuck this way. Fix = rename to `apex-research-bridge` (the CR-4 convention) + restart. On the first patched cycle the retained consignment auto-deposited "1/1 accepted/duplicate; removed" (Hopper, operator-of-record, confirmed from the live daemon log).

The retained-reject was itself the **live routing proof**. A planned drop+re-send and a migrate-in-place were both rendered **unnecessary** — and would have **risked a duplicate** — because the self-heal beat them.

## Why it matters (the reusable lesson)

1. **Deposit-time resolution (vs spool-time / consume-time resolution) is what makes config fixes idempotent-and-retroactive over in-flight mail.** If the destination were baked into the spooled consignment at consume time, the fix would NOT heal already-spooled entries and you'd need a manual migration.
2. **It pairs with retain-rejected-not-drop.** Rejection must RETAIN (not discard) for the later config fix to have something to heal. Drop-on-reject would lose the entry before the fix lands.
3. **Operational corollary:** when you fix a courier routing-config bug, do **NOT** manually migrate or re-send stuck spool entries — **restart and let the spool re-resolve.** Manual migration/re-send risks a duplicate (a re-send gets a **new envelope-id** → hub dedup-by-id won't catch it). Verify via the daemon log (deposited 1/1; removed) rather than re-injecting.

## Relationship

Companion to the delivered-ledger **inbound**-dedup mechanism (that one prevents inbound duplicates on redelivery; this one prevents outbound loss/dupe across a config fix). Both descend from "**the spool/ledger is courier-private state that makes the at-least-once contract safe.**"

## Evidence

- `stationmaster-courier.py:808-822` — the outbound consume → spool → `_outbox_to_team(spool_file, cfg)` deposit-time resolution.
- Live S51 self-heal confirmed from the daemon log by Hopper (operator-of-record): the retained `apex-bridge`-misrouted consignment auto-deposited "1/1; removed" on the first cycle after the `apex-research-bridge` rename + restart.
- Confidence: high (by-design mechanism in the reference implementation + live self-heal observed; n=1 incident with strong by-design framing). n=1 watch-posture for promotion.

## Related

- [`gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md`](../gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md) — the inbound-side companion: courier-private state (the ledger) makes at-least-once safe inbound; this pattern is the outbound-side analog (the spool). Both are "courier-private state for at-least-once safety."
- [`decisions/fan-out-routing-per-destination-outboxes-cr4.md`](../decisions/fan-out-routing-per-destination-outboxes-cr4.md) — the `<team>-bridge` → `<team>` convention whose correct application (`apex-research-bridge`) was the config fix that triggered the self-heal.
- [`gotchas/courier-originates-routing-protocol-leaves-undefined.md`](../gotchas/courier-originates-routing-protocol-leaves-undefined.md) — the retain-rejected-not-drop / refuse-and-retain discipline this pattern depends on (rejection must retain for the fix to heal).
- [`gotchas/deposit-ok-without-data-line-means-nothing-landed.md`](../gotchas/deposit-ok-without-data-line-means-nothing-landed.md) — the "1/1 accepted; removed" daemon-log line is the deposit-acceptance signal whose absence that gotcha warns about; verify the heal there, not by re-injecting.
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) — the at-least-once contract (per-command idempotency, deposit dedups by id) the spool re-resolution rides on.

*Stage-2 PARTIAL 2026-06-15 (Brunel — primary author — read-back): accurate, no reshape. Brunel verified the code line ref against the file (fitting, given the companion honesty-pass meta-pattern): `def _outbox_to_team` at `:808`, body 808-826, the single-outbox strip logic (`name[:-len("-bridge")] if name.endswith("-bridge") else name`) at 820-822 — "808-822" spans def-through-resolving-branch, no drift. All else faithful (deposit-time-resolution, misroute→reject→RETAIN, fix+restart→re-resolve→heal, the S51 incident, all 3 lessons, the cross-link set, n=1 watch-grade). REMAINING for full confirm: Hopper's read-back is authoritative on the "1/1; removed" acceptance line (his operator-log observation); Herald is the third co-author. Advances pending→partial.*

(*FR:Brunel* — submitted (primary, daemon-wrapper author + diagnosis); *FR:Herald* — routing-bug + dupe-risk-on-resend catch; *FR:Hopper* — operator confirmation of live self-heal; *FR:Callimachus* — filed)
