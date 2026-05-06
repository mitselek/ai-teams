---
source-agents:
  - finn
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-05
status: active
confidence: medium
source-files:
  - docs/2026-05-05-postgres-library-discovery/finn-staging-review-deepread.md
  - docs/2026-05-05-postgres-library-discovery-brief.md
source-commits: []
source-issues:
  - "#64"
related: []
---

# Poll-Only Substrate + Sidecar Derivation as Event-Driven Shape

When an OSS substrate has **no push events** (no `pg_notify` / `LISTEN`, no WebSocket, no SSE, no message queue) but exposes **rich poll-able append-only tables** that capture the full read+write surface, the right architecture for an event-driven downstream consumer is:

1. **Sidecar polling** of the substrate's append-only logs with a sequence-cursor.
2. **Rule-based derivation** of higher-level signals (heat, collision, gap) from the firehose.
3. **Emit derived events only** — never the raw firehose — to downstream consumers.

This is preferable to "fork the substrate to add `pg_notify`" or "wrap every write in a coordinator call" for three reasons:

- **Cost bounds at derivation-rate, not raw-rate.** Spawning a specialist per raw read is N×M expensive and saturates both the orchestrator and the team. Deriving signals (`"entry X read 5x/hour by 3 agents"`) before emitting cuts the rate by orders of magnitude.
- **Independence-preserving.** No fork. No schema migration. No upstream dependency on substrate's roadmap. The substrate stays as it is; the sidecar is the team's code.
- **Forensic-queryable raw firehose stays in the source DB.** Anything the derivation rules miss is recoverable by querying the raw logs after the fact. Push systems lose the firehose unless you also persist it; this shape keeps it free.

## When this pattern applies

All three conditions:

1. The substrate's **read+write surface is captured in append-only tables** the substrate itself populates synchronously (request log, audit log, access log, etc.).
2. The substrate **emits zero push events** — `pg_notify`, `LISTEN`, WebSocket, SSE, queue middleware all confirmed absent.
3. The downstream consumer's **latency budget is seconds, not milliseconds.** Polling at 1-10s introduces 1-10s lag; that is acceptable for human/agent reactivity, not for sub-second hard-real-time use cases.

## When it does not apply

- **Latency budgets in the milliseconds.** Use `pg_notify` triggers or fork to add WebSocket/SSE.
- **The substrate's logs are sparse or sampled.** If the firehose is incomplete, derivation rules will miss signals; need to add capture before adding derivation.
- **The cost of polling exceeds the cost of forking.** Rare; polling 3 SELECTs at 5s intervals is sub-1 ops/s overhead.

## What to log on the sidecar

The sidecar's own state is the sequence-cursor (last-processed `(table, seq_id)` tuple). This is the only persistent state required — it lets the sidecar resume after restart without replaying the full log or losing events. Everything else is derivation rules + transient working memory.

## Promotion from poll-derived to push-trigger

When polling latency becomes a measurable constraint, promote *specific* derived signals to `pg_notify` triggers in the substrate. This is a targeted upgrade — not "switch from poll to push wholesale." The substrate keeps its append-only logs (still useful for forensics + new derivation rules); the few hot signals get push paths.

## First instance — Brilliant request_log + entry_access_log + audit_log

Observed: `thejeremyhodge/xireactor-brilliant @eb1d1bf` v0.5.1, FastAPI + psycopg + Anthropic. Read by Finn 2026-05-05 (`finn-staging-review-deepread.md` §8).

| Substrate property | Brilliant evidence |
|---|---|
| Append-only logs capture full read+write | `request_log` (every read+write, indexed `(org_id, ts DESC)`), `entry_access_log` (every read returning entry IDs), `audit_log` (writes only, allowlisted verbs) |
| Zero push events | Zero matches for `pg_notify \| LISTEN \| NOTIFY \| WebSocket \| SSE \| StreamingResponse \| EventSourceResponse`. Bare deps: `fastapi, uvicorn, psycopg, bcrypt, anthropic, boto3, pypdf, PyYAML` — no Redis, Celery, Kafka, NATS |
| Latency budget tolerable for poll | Curator-team orchestration is human/agent-paced; 1-10s sidecar polling well under reactivity floor |

**Architecture verdict (Finn's Q8):** sidecar polling with sequence-cursor on the three tables → rule-based derivation (heat thresholds, collision detection on overlapping pending stages, gap signals on empty searches) → emit derived events to curator-team orchestrator. Brilliant's own `get_usage_stats` rollups (`top-entries`, `session-depth`, 15-min windows) make the same call: reads are listenable by querying, just not by subscribing.

**Throughput cost (Finn's Q9):** Brilliant's published concurrency stress is ~178 ops/s flat at 20-120 concurrent clients on Postgres-Basic-256mb. Speculative FR-style volume (7-agent team × 4-8 sessions × 20-50 queries) is ~600-2,800 reads/day/team; 10 teams ~6K-30K reads/day cluster-wide; sustained ~1-10 reads/s, peaks ~30-50/s. **Well inside Brilliant's measured headroom.** Polling sidecar overhead (3 SELECTs / 5s = 0.6 ops/s) is negligible.

## Promotion posture

n=1. **Watch for second instance** before promotion to common-prompt or topic-file. The cost-bounding insight (deriving signals before spawning, not per raw event) is the load-bearing claim — a second instance would establish that the polling+derivation shape generalizes outside Brilliant. Until then, treat as a candidate architecture for poll-only substrates.

## Related

- [`oss-thin-integration-anti-extension-signal.md`](oss-thin-integration-anti-extension-signal.md) — sibling finding from the same Brilliant deep-read. The thin-integration signal applies to the substrate's *orchestration* (cannot be plugged into); this poll-only pattern applies to the substrate's *event surface* (no push events, but rich logs). Two different layers, both observed in the same project.
- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) — adjacent: deriving data on the read path that should have been written on the write path is the substrate-invariant-mismatch failure mode. The sidecar-derivation shape avoids this by *not* claiming to be authoritative — derived events are signals to spawn, not facts to store.

(*FR:Cal*)
