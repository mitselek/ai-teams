---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-08-31
filed-by: librarian
last-verified: 2026-08-31
status: active
confidence: high
source-files:
  - teams/framework-research/docs/operations-log-2026-08.md
source-commits: []
source-issues: []
ttl: 2026-11-30
related:
  - drain-on-delivery-datapoint-2.1.173.md
  - inbox-substrate-properties-2.1.170.md
  - teams-substrate-2.1.251-implicit-teams.md
  - ../gotchas/inbox-drained-on-spawn-clear-without-deliver.md
---

# Drain-on-Delivery Datapoint -- CLI 2.1.251

**Reference (version-stamped datapoint, high confidence).** New datapoint in the drain lineage, forwarding from [`drain-on-delivery-datapoint-2.1.173.md`](drain-on-delivery-datapoint-2.1.173.md). **Filed as a new datapoint rather than folded into the older sheet**, per the lineage's own retire-and-forward discipline.

## Result

> **The Drain row HOLDS on 2.1.251. A delivered message is REMOVED, not retained.**

**Unchanged 81 versions past the 2.1.170 probe.** The pending-only-queue model of T1.b stands.

## Measurements -- three complete enqueue-to-drain cycles

Observed on the live `team-lead.json`:

```
09:46:59.934  size=4516  read_false=1   ->  09:47:01.245  size=2   (1.31s)
09:49:00.864  size=4186  read_false=1   ->  09:49:02.381  size=2   (1.52s)
09:49:55.401  size=5119                 ->  09:49:56.927  size=2   (1.53s)
```

`read_true` never left 0 in any sample.

**Control from the same window:** the observer's own `hopper.json` climbed `read_false` 5→6→7→8 **with no drain**, because that session stayed mid-turn and never reached a turn boundary.

> **Pending accumulates; delivered is removed.** The control is what makes this a measurement of *delivery* rather than of elapsed time.

**Method note:** live-substrate watching was chosen over reconstructing probe-1b on a scratch team — it exercises the real delivery path with a real consumer. **Zero writes to any watched path.**

## Instrument caveat -- recorded rather than glossed

The watcher's signature counted the **literal `"read": false`** (with a space). **Cycle 3 shows `size=5119` with `read_false=0`**, so at least one delivered entry used different JSON spacing and was not counted.

- **The size transition (`2` → content → `2`) is the load-bearing observable and is unaffected.**
- **The read-flag counter under-counts some shapes and must NOT be quoted as a census.**

## Seven apparent counterexamples that are not

Seven live inbox files **do** contain `"read": true`. They are **not** counterexamples: all seven have mtime 09:22–09:23 (this session's Step-3 restore), carry **March/April 2026** traffic, and **lack the `type:"message"` field** that 2.1.179+ delivery writes. They are **archival residue and dead ghost inboxes with no live consumer** — never delivered by the current harness.

## Consequence

The Drain row holds, all three G1 entries stand, and **the courier's inbound verify-empty → exclusive-create design rests on solid ground.**

## Provenance

Measured and submitted by Hopper via Protocol A 2026-08-31 (G1 TTL batch), as one consolidated 2.1.251 datapoint for this lineage. **The submission text did not survive the session** ([`../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md`](../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md)); this entry is **reconstructed from the operations log**, with every measurement quoted rather than restated.

**`stage-2: pending`** — librarian-authored on a reconstructed candidate. Fail-closed until **Hopper reads it back**; an author-submitted confirmation lands on top without a rewrite.

(*FR:Hopper* measured and submitted; *FR:Callimachus* reconstructed and filed)
