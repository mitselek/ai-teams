---
title: "Drain-on-Delivery Datapoint -- CLI 2.1.251"
directory: references
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
ttl: 2026-11-30
related: [drain-on-delivery-datapoint-2.1.173.md, inbox-substrate-properties-2.1.170.md, teams-substrate-2.1.251-implicit-teams.md, ../gotchas/inbox-drained-on-spawn-clear-without-deliver.md]
tags: [reference, datapoint, 2.1.251, drain, inbox, delivery, t1b, retire-and-forward, courier-inbound]
---

## TLDR

**The Drain row HOLDS on 2.1.251: a delivered message is REMOVED, not retained** — unchanged **81 versions** past the 2.1.170 probe. The pending-only-queue model of T1.b stands. **New datapoint forwarding from `drain-on-delivery-datapoint-2.1.173`, not folded into it**, per the lineage's retire-and-forward discipline.

## Key ideas

- **Three complete enqueue-to-drain cycles on live `team-lead.json`:** `4516→2` in **1.31s**; `4186→2` in **1.52s**; `5119→2` in **1.53s**. `read_true` **never left 0** in any sample.
- **[THE CONTROL, and it is what makes this a delivery measurement] The observer's own `hopper.json` climbed `read_false` 5→6→7→8 with NO drain** — that session stayed mid-turn and never reached a turn boundary. > **Pending accumulates; delivered is removed.**
- **Method:** live-substrate watching chosen over reconstructing probe-1b on a scratch team — exercises the real delivery path with a real consumer. **Zero writes to any watched path.**
- **[INSTRUMENT CAVEAT, must travel with the datapoint] The watcher counted the LITERAL `"read": false` (with space).** Cycle 3 shows `size=5119` with `read_false=0`, so **at least one delivered entry used different JSON spacing and was not counted.** **The size transition (`2`→content→`2`) is load-bearing and unaffected; the read-flag counter under-counts some shapes and MUST NOT be quoted as a census.**
- **Seven live inbox files contain `"read": true` and are NOT counterexamples:** all seven mtime 09:22–09:23 (this session's Step-3 restore), carrying **March/April 2026** traffic, and **lacking the `type:"message"` field** that 2.1.179+ delivery writes. **Archival residue + dead ghost inboxes with no live consumer** — never delivered by the current harness.
- **Consequence: all three G1 entries stand, and the courier's inbound verify-empty → exclusive-create design rests on solid ground.**
- **stage-2 PENDING** — submission text did not survive the session (see `protocol-a-has-no-durable-store...`); **reconstructed from the ops log with measurements quoted, not restated.** Fail-closed until **Hopper reads it back**.

(*FR:Hopper* measured and submitted; *FR:Callimachus* reconstructed and filed)
