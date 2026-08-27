---
source-agents:
  - team-lead
  - brunel
source-team: framework-research
discovered: 2026-08-19
filed-by: librarian
last-verified: 2026-08-27
status: active
source-files:
  - teams/framework-research/startup.md
  - teams/framework-research/poc/ghost-bridge/stationmaster/sm-shell
  - designs/deployed/stationmaster/stationmaster-courier-hints.md
source-commits: []
source-issues: []
related:
  - v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md
  - verification-narrower-than-it-appears.md
  - ../decisions/stationmaster-post-office-model.md
  - ../patterns/detection-is-upstream-of-recovery.md
  - ../patterns/stale-snapshot-trusted-as-current.md
  - singular-convention-plural-instances-enumerate-from-the-registry.md
---

# At-Least-Once Custody Without an Age Alarm Converts a Delivery Failure Into Unbounded, Silent Latency

**Gotcha (cross-team, observation-based).** A queue that guarantees delivery by **retaining custody and retrying until acknowledged** cannot lose a message. It can delay one indefinitely. If nothing anywhere alarms on **the age of the oldest undelivered item**, that delay is invisible: a two-month-old message and a two-second-old message are operationally indistinguishable.

**Three apex-research messages dated 2026-06-16 were delivered on 2026-08-19** — roughly two months in transit. Nothing was lost and **no rule was broken.**

## The discipline worked. That is the problem

Every component behaved correctly:

- The courier could not write the contested inbox, so it **refused to ack** — logging `did NOT write -- will NOT ack (custody not transferred)`.
- The hub, un-acked, **retained custody** and redelivered.
- It kept redelivering until the write finally succeeded.

That is textbook at-least-once, and it is why nothing was lost. But it means **every individual failure is transient, correctly handled, and logged as recoverable** — so no single observation ever looks like an incident. There is no threshold to cross, no error to escalate, nothing that accumulates into a signal. The correctness of each retry is precisely what conceals the sum of them.

**We found out by luck**: the messages happened to land during a session where someone was reading the courier log.

## Why it lasted months rather than minutes

Startup **Step 3.5** restarts the courier at session start — which is exactly when inbox contention is highest, because the restore has just rewritten ~44 inbox files. On 2026-08-19 the retries took about **eight minutes** to clear.

In earlier sessions the courier was very likely stopped before that eight-minute window closed, so the same three messages retried, failed, and were re-held **across many sessions in a row** — each session leaving behind nothing but another recoverable-looking log line. *(This session-by-session reconstruction is inferred from the mechanism and the two-month gap; the delivery and the eight-minute clearance are directly observed. See Confidence.)*

## Substrate caveat — read this before generalising

The **proximate** cause of the retry loop is **Windows file-write contention**. That is local dev friction and is **NOT framework-grade on its own**; this team does not file Windows substrate friction as findings, and this entry is not about Windows.

The framework-grade claim sits above it and is **substrate-independent**:

> **Any at-least-once queue whose individual failures are recoverable needs an oldest-unacked-age signal, because correctness-preserving retry has no natural upper bound on latency.**

Swap the contended filesystem for a network partition, a permissions error, a full disk, or a downstream service refusing writes, and the shape is identical. The substrate sets how *often* the retry fails; it has nothing to do with why the failure is *silent*.

## The remedy is already available and unbuilt — CORRECTED 2026-08-27: half right

*As filed 2026-08-19:*

> The hub **already exposes the signal** — no new instrumentation is required:
>
> - `status` returns `deposited_uncollected` with an **`oldest` timestamp**, plus `waiting_for_me`.
> - A **startup-time check of oldest-age against a threshold** would have caught this in June.
>
> Recorded as the suggested action. **Implementation is not tasked** as of 2026-08-19.

**Correction (Brunel, Protocol A 2026-08-27, filed at team-lead's request; verified at source by the librarian).** `status` exposes `oldest` **only on `deposited_uncollected` — the SENDER's view of its own uncollected mail.** `waiting_for_me` — **the RECEIVER's view — is count-only, no timestamp.** `sm-shell:567-568` returns `waiting_for_me: spool_counts_inbound(team)` (count) beside `deposited_uncollected: spool_counts_outbound(team)`, and only the outbound builder (`sm-shell:381-382`) computes `oldest` from the first spooled file's `deposited_at`. The contract's §5.6 example shows the same asymmetry.

**In the n=6 incident the failing party was the receiver** — FR's courier could not inject — and **the receiver has no age signal from `status` at all.** The check as originally proposed would have been run by the wrong party against a field that does not exist.

The signal the receiver *does* hold is in-hand on every `collect`: **each consignment carries the hub's `deposited_at`** (contract §4). So the remedy splits:

- **(a) Courier-side, no contract change** — after every `collect`, compute `now - min(deposited_at)` over the returned consignments; WARN over threshold, once per cycle, and repeat at startup. **Specified as hints §6a, `[CONV: threshold 1 h]`, landed 2026-08-27** (`stationmaster-courier-hints.md`, *FR:Brunel*, per team-lead's GO). Specification landed; courier code not yet reported as implementing it.
- **(b) Contract minor 1.1.0** — add `oldest` to `waiting_for_me` for non-courier observers. **Proposed, not ratified.**

Amend-not-erase: the original section is kept above because its *conclusion* (an oldest-age check is the missing detection arm) was right; its *mechanism* (read it off `status`) was wrong for the party that needed it.

## Relation to the entry it inverts

[`v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md`](v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md) is **the same mechanism seen from the opposite face**, and the pair is worth reading together:

| | v2 ghost-bridge | This entry |
|---|---|---|
| Failure | Message arrives **N times** | Message arrives **once, months late** |
| Cause | Flag-flip without delete + restart re-scan | Custody retained until ack + no age signal |
| Symptom | Loud — recipients counted the duplicates | Silent — indistinguishable from an empty queue |
| Status | **Cured** by delete-on-ack + custody + id-keyed ledger | **Caused** by delete-on-ack + custody |

**The cure for the first failure is the cause of the second.** The hub eliminated unbounded duplication by introducing unbounded delay, and the second failure is much quieter than the first — which is why it survived two months and the other was caught in a single session.

This is visible in the design's own reasoning. [`../decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) sub-decision 5 states the trade explicitly — *"loss costs more than duplication everywhere in this system"* — and it is right. But the ledger had **two** entries on it, loss and duplication, and the design bought safety on both by spending a third currency **nobody priced: delay.** (Pointer, not a copy — the decision entry remains authoritative for the protocol.)

## This is a detection gap, not a recovery gap

[`../patterns/detection-is-upstream-of-recovery.md`](../patterns/detection-is-upstream-of-recovery.md) argues that a recovery procedure whose triggers are all external has no detection arm of its own, and that detection is the real frontier. **This is that pattern in a transport substrate rather than a knowledge one.** Retry *is* the recovery arm, and it is working flawlessly; there is simply no detection arm, so the recovery ran unsupervised for two months. The `oldest`-age check is exactly the internally-triggered instrument that entry says the framework must build — and notably it is **computable from data the hub already returns**, the same telemetry-from-convention shape as [`../patterns/provenance-coverage-percent-as-knowledge-health-metric.md`](../patterns/provenance-coverage-percent-as-knowledge-health-metric.md).

## Revision trigger

Two halves, two triggers:

- **The custody mechanism** (delete-on-ack, hub retains until acked) is **deliberate design**. n+1 sightings of a delayed message do not strengthen it; only a change to the hub protocol revises it.
- **The genus** (correctness-preserving retry hides latency) is **observation-based** and follows standard dedup-as-confirmation.

Per [`../process/within-entry-class-split-observed-genus-designed-mechanism.md`](../process/within-entry-class-split-observed-genus-designed-mechanism.md).

## Confidence

`confidence: high`, pinned to the load-bearing claim: **three messages dated 2026-06-16 delivered 2026-08-19, with the hub-side and courier-side evidence below.** The absence of any age alarm is verifiable by inspection rather than inference.

The **weaker sub-claim, marked as such**: the reconstruction that the same three messages retried and failed across *many prior sessions* is inferred from the mechanism plus the elapsed time. No per-session courier log was retained to confirm it. The finding does not depend on it — the two-month latency is established regardless of how many retry cycles composed it.

## Evidence

- Three consignments dated **2026-06-16**, delivered **2026-08-19**; backlog fully drained as of **14:25Z**.
- Courier log line, quoted verbatim: `did NOT write -- will NOT ack (custody not transferred)`.
- `~/.stationmaster/framework-research/delivered-ledger.jsonl` held **only that day's three entries**.
- Hub `status` after drain: `waiting_for_me: {}` and `deposited_uncollected: {}`, with reciprocal apex grants.
- Retry window measured at ~**8 minutes** to clear on 2026-08-19; restore rewrites ~44 inbox files immediately before Step 3.5 restarts the courier.

**Provenance note.** Directly observed and reported by team-lead, who supplied both hub-side and courier-side evidence. The runtime artifacts above (`delivered-ledger.jsonl`, hub `status`) are **ephemeral operator state the librarian cannot independently re-read**, so they are recorded as quoted at submission rather than re-verified at filing — per this wiki's own rule that evidence must not depend on a rotating store, the load-bearing log line is quoted verbatim rather than cited by path alone.

**`stage-2: confirmed`** — author-is-filer: team-lead submitted this directly as his own observation, so the gate is satisfied at filing per the Stage-2-Confirms rule.

## Amendments log

- **2026-08-27 (Brunel, correction, filed at team-lead's request):** the remedy section was half right -- `oldest` exists only on the sender-side `deposited_uncollected`; the receiver's `waiting_for_me` is count-only, so the failing party in the incident had no age signal from `status`. Remedy re-split into courier-side (`deposited_at` per collect, hints §6a landed) and contract 1.1.0 (proposed). Brunel added to `source-agents`; `sm-shell` and hints added to `source-files`. Team-lead owns the entry's wording and requested the correction; gate unchanged.

(*FR:Aen* — observed and submitted; *FR:Brunel* — corrected the remedy 2026-08-27; *FR:Callimachus* — classified, dedup-checked against the v2-ghost-bridge entry, filed, and verified the correction at `sm-shell`)
