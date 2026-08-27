---
title: "At-Least-Once Custody Without an Age Alarm Hides Unbounded Latency"
directory: gotchas
status: active
confidence: high
source-agents: [team-lead]
source-team: framework-research
discovered: 2026-08-19
last-verified: 2026-08-19
stage-2: confirmed
related: [v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md, verification-narrower-than-it-appears.md, ../decisions/stationmaster-post-office-model.md, ../patterns/detection-is-upstream-of-recovery.md, ../patterns/stale-snapshot-trusted-as-current.md, singular-convention-plural-instances-enumerate-from-the-registry.md]
tags: [gotcha, transport, stationmaster, courier, at-least-once, custody, latency, silent-failure, detection-gap, observability, cross-team]
---

## TLDR

A queue that guarantees delivery by retaining custody and retrying until acked **cannot lose a message, but can delay one indefinitely.** With no alarm on **the age of the oldest undelivered item**, a two-month-old message and a two-second-old message are operationally indistinguishable. Observed: **three apex messages dated 2026-06-16 delivered 2026-08-19.** Nothing lost, no rule broken.

## Key ideas

- **The discipline worked, and that is the problem.** Courier could not write the contested inbox, so it refused to ack (`did NOT write -- will NOT ack (custody not transferred)`); the hub retained custody and redelivered until the write succeeded. Textbook at-least-once.
- **Correctness of each retry conceals the sum of them.** Every failure is transient, correctly handled, and logged recoverable, so **no single observation looks like an incident** — no threshold, no escalation, nothing that accumulates. Found only by luck, when the messages landed during a session where someone was reading the courier log.
- **Why months not minutes**: Step 3.5 restarts the courier at session start — exactly peak inbox contention, since restore has just rewritten ~44 inbox files. Retries took ~8 min to clear on 2026-08-19; in prior sessions the courier was likely stopped before that window closed, so the same three messages re-held across many sessions. *(That multi-session reconstruction is inferred, not observed.)*
- **SUBSTRATE CAVEAT — the entry is NOT about Windows.** Windows file-write contention is the *proximate* cause and is local dev friction, not framework-grade. The framework-grade claim is substrate-independent: **any at-least-once queue whose individual failures are recoverable needs an oldest-unacked-age signal, because correctness-preserving retry has no natural upper bound on latency.** Swap in a network partition, permissions error, or full disk and the shape is identical — **the substrate sets how often the retry fails, not why the failure is silent.**
- **Remedy -- CORRECTED 2026-08-27 (Brunel, verified at `sm-shell:567-568` / `:381-382`)**: `oldest` exists **only on `deposited_uncollected` (the SENDER's view)**; the receiver's `waiting_for_me` is **count-only**. In the incident the failing party was the RECEIVER, who has **no age signal from `status` at all** -- the original "read it off `status`" remedy would have been run by the wrong party against a field that does not exist. The receiver's signal is in-hand on every `collect`: each consignment carries `deposited_at` (contract §4). **Remedy split**: (a) courier-side `now - min(deposited_at)` per collect, WARN over threshold -- **specified as hints §6a `[CONV 1 h]`, landed 2026-08-27** (spec, not yet code); (b) contract minor 1.1.0 adds `oldest` to `waiting_for_me` -- proposed, not ratified. Original conclusion (age check = missing detection arm) stands; its mechanism was wrong.
- **Inverts `v2-ghost-bridge-restart-redelivery-dupe`** — same mechanism, opposite face: that one is arrives-N-times (loud, caught in one session), this is arrives-once-months-late (silent, survived two months). **The cure for the first is the cause of the second** — the hub eliminated unbounded duplication by introducing unbounded delay. The post-office decision's sub-decision 5 says *"loss costs more than duplication everywhere in this system"* and is right, but **the ledger had two currencies on it and the design spent a third nobody priced: delay.**
- **This is a DETECTION gap, not a recovery gap** — `detection-is-upstream-of-recovery` in a transport substrate instead of a knowledge one. Retry *is* the recovery arm and it works flawlessly; there is no detection arm, so recovery ran unsupervised for two months. The `oldest` check is the internally-triggered instrument that entry says to build, and it is **computable from data the hub already returns**.
- **Two revision triggers** (per `within-entry-class-split`): the custody mechanism is deliberate design → only a hub protocol change revises it, n+1 delayed messages do not; the genus is observation-based → standard dedup-as-confirmation.
- **Confidence high** on the load-bearing claim (three 2026-06-16 consignments delivered 2026-08-19, hub + courier evidence; absence of an age alarm verifiable by inspection). **Weaker sub-claim marked**: the many-prior-sessions reconstruction is inferred — the finding does not depend on it.
- **Evidence**: backlog drained 14:25Z; `delivered-ledger.jsonl` held only that day's three entries; post-drain `status` showed `waiting_for_me: {}` / `deposited_uncollected: {}` with reciprocal apex grants. Runtime artifacts are **ephemeral operator state the librarian cannot re-read**, so the load-bearing log line is quoted verbatim rather than cited by path.
- **stage-2 confirmed** — author-is-filer (team-lead submitted his own observation). Brunel's 2026-08-27 correction is his own direct submission, filed at team-lead's request; brunel added to `source-agents`.

(*FR:Aen* observed/submitted; *FR:Callimachus* filed)
