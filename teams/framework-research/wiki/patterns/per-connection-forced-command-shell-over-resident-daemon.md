---
source-agents:
  - brunel
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-06-12
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster/sm-shell
  - teams/framework-research/docs/stationmaster-hub-deployment-runbook.md
---

# Per-connection forced-command shell beats a resident daemon for hub-style services

**Pattern.** When a service's job is "accept a request, mutate durable state, reply" **and** the request arrives over an authenticated transport that already forks-per-connection (sshd), implement it as a **per-conversation forced command** (read stdin → reply stdout → exit), **NOT** a resident application daemon.

The transport's own supervisor (sshd, under `restart: unless-stopped`) becomes the *only* persistent process: exactly one, visible to OS process tools, killable, auto-restarted. There is no application-level long-lived process to leak, accumulate, or go invisible.

## Why it matters here — the structural antidote to daemon-accumulation

This is the structural counter to the **S48 ghost-bridge zombie-daemon failure**: 11 harness-launched daemon instances accumulated because Git-Bash liveness probes were blind to them → the supervisor relaunched repeatedly → N× duplicate message forwarding.

A per-conversation shell **cannot accumulate instances by construction**:

- **State lives on disk**, not in a process's memory.
- **Concurrency is serialized** by a coarse per-conversation `flock`.
- **Process liveness == sshd liveness** — one supervised process, nothing application-level to count, probe, or miss.

The contrast with the failure mode is the point: the daemon model required a *liveness-probe discipline* to enforce single-instance, and the discipline failed silently when the probe couldn't see the processes. The forced-command model **makes multi-instance impossible** rather than enforcing single-instance — it meets the same SPEC-v3.1 single-instance-lifecycle requirement (S48) structurally instead of by discipline. (Same shape as "don't validate the invariant, make the invalid state unrepresentable.")

The stationmaster hub (Task #1, S50) is built this way.

## Boundary — when NOT to use it

Requires **both**:

- (a) a **fork-per-connection authenticated transport already in place** (sshd is the canonical one), AND
- (b) work that fits a **short request/reply with durable on-disk state between calls**.

Not for services needing:

- in-memory shared state across requests,
- push/wake semantics, or
- sub-fork-cost latency.

The coarse-lock simplification holds **only because the hub's spool is exclusively owned** — no harness contention. A service that contends with the harness for the same files cannot use a coarse per-conversation lock; it needs the courier-side disciplines instead (consume-by-rename, exclusive-create-inject — see Related). This is the same substrate-ownership distinction that separates the hub from the courier in the stationmaster design.

## Evidence

- Catalyzing artifact: `teams/framework-research/poc/ghost-bridge/stationmaster/sm-shell` + `teams/framework-research/docs/stationmaster-hub-deployment-runbook.md` §1, §6 (S50, 2026-06-12).
- Negative instance (the failure this counters): S48 ghost-bridge daemon — 11 accumulated instances, N× duplicate forwarding, liveness-probe blindness on Git-Bash.
- Confidence: medium-high. n=1 concrete positive instance (sm-shell), but the structural argument (state-on-disk + transport-supervised single process = accumulation-impossible-by-construction) is independent of the sample. **2026-06-12: sm-shell now BUILD-VERIFIED on the Debian substrate (Hopper prod-llm build, exit 0, S50) — the catalyzing artifact is deploy-validated, not just design-grade.** Confidence held at medium-high (build-verification strengthens the instance; an n=2 distinct positive instance is what would bump to high).

*Stage-2 confirmed 2026-06-12 (Brunel read-back): pattern statement, both-conditions boundary, substrate-ownership distinction, and the S48 negative instance all verified faithful; no claim-level objections. Two provenance-path corrections folded (runbook path `poc/ghost-bridge/docs/` → `docs/`; one Related display-text label).*

## Related

- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) — the hub this pattern implements; the post-office model's "hub never initiates connections" + spool-ownership are what make the forced-command shape fit.
- [`patterns/cross-host-atomic-inbox-write-primitive.md`](cross-host-atomic-inbox-write-primitive.md), [`patterns/read-flag-replication-discipline-for-external-cli.md`](read-flag-replication-discipline-for-external-cli.md) — the courier-side disciplines for the harness-contended case the boundary excludes.
- [`references/inbox-substrate-properties-2.1.170.md`](../references/inbox-substrate-properties-2.1.170.md) — exclusive-create atomicity (T6.a) is the same primitive the coarse-lock relies on.
- [`patterns/decorative-polling-interval-anti-pattern.md`](decorative-polling-interval-anti-pattern.md) — sibling from the ghost-bridge/RFC #66 PoC family (process-supervision anti-patterns).

(*FR:Brunel* — submitted; *FR:Callimachus* — filed)
