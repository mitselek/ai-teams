---
source-agents:
  - team-lead
discovered: 2026-06-10
filed-by: librarian
last-verified: 2026-06-10
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/TRUTHS.md
  - teams/framework-research/poc/ghost-bridge/evidence-probe-1b-watch.log
  - teams/framework-research/poc/ghost-bridge/evidence-probe-3-watch.log
ttl: 2026-09-10
---

# Inbox file is a pending-only queue, not an accumulating log (CLI 2.1.170)

**Version-stamped: empirically verified against Claude Code CLI `2.1.170` (released 2026-06-09). The local CLI is now 2.1.175 — this entry does NOT claim current validity; re-validate before trusting it on any version other than 2.1.170. See Revision trigger.**

## The flip

On CLI `2.1.170`, a live member's inbox file (`~/.claude/teams/<team>/inboxes/<name>.json`) is a **pending-only queue**: a message is transiently written with `read: false`, then **REMOVED** from the file on harness pickup (drained to `[]`). The file holds only *undelivered backlog*, never a record of what was delivered.

This is a **flip** from the S30–S47 substrate, where the model was inbox-as-accumulating-log: delivered messages retained in the file with `read: true`. The change shipped **unannounced** — no CHANGELOG entry, docs note, or release note on inbox retention semantics through 2.1.170 (checked 2026-06-10: CHANGELOG, agent-teams docs, GitHub releases/issues, web). The exact version of the old behavior is unknown; nearest candidate vehicles are 2.1.166/2.1.169 "hardened cross-session messaging" (plausible, unevidenced). The flip is therefore *bracketed* between the S47 substrate and 2.1.170, not pinned.

## Evidence

- **T1.b** (probe-1b, clean scratch team, 0.1s content-polling watcher): 3 self-sends; watcher caught messages 2 and 3 sitting as single-element arrays with `read: false`, each rewritten to `[]` within **<0.7s** of appearing. `evidence-probe-1b-watch.log`.
- **Replication** (apex-research team, second host, PO-relayed): after a healthy round-trip, BOTH inbox files = 2 bytes (`[]`). Confirms drained-end-state for live-teammate messaging, not just self-send. Caveat: endpoint observation only; apex CLI version not captured.
- Drain is **eager (mid-turn)** but presentation is **at the turn boundary** — messages drained from disk while the session is mid-turn, then delivered batched into the next incoming turn, in send order, content intact (T1.c, T1.d, T1.e).

## Casualties — prior assumptions and infrastructure invalidated (TRUTHS.md I-1)

The entire retention-based infrastructure assumed inbox-as-accumulating-log. On 2.1.170 it captures only residue:

- `persist-inboxes.sh` (last-100 pruning), `sanitize-inboxes` (mark-read), inbox-restore-as-context-carrier — all now capture only undelivered backlog, not conversation history.
- ghost-bridge v1/v2 `read`-flag-based dedup — the flag the dedup keyed on no longer survives delivery.
- Any wiki entry asserting inbox retention.

**Survivors:** ghost outboxes still accumulate — a message to a session-less name is never drained because no live consumer picks it up (T3.a). The ghost leg survives **by accident, not by design**.

## Revision trigger

Architectural-fact at the harness-substrate layer, but **observation-based on a specific CLI version** — unlike the version-stable substrate-property family, this entry IS version-coupled because the behavior demonstrably flips between adjacent versions unannounced. The trigger to revise is a **CLI version change**: on any version ≠ 2.1.170, re-run probe-1b (or at minimum confirm whether delivered messages are removed vs retained) before trusting any claim that depends on inbox retention. n+1 sightings on 2.1.170 do not strengthen; a sighting on a *different* version is a new datapoint that must be captured.

## Related

- [`references/inbox-substrate-properties-2.1.170.md`](../references/inbox-substrate-properties-2.1.170.md) — the version-stamped property sheet this gotcha anchors; sibling drawn from the same TRUTHS.md probe set.
- [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) — canonical wake-stage substrate property; wake-on-write re-confirmed on 2.1.170 (T4.a).
- [`gotchas/inbox-drained-on-spawn-clear-without-deliver.md`](inbox-drained-on-spawn-clear-without-deliver.md) — spawn-handshake drain-without-deliver; same drain mechanism, distinct decoupling.
- [`patterns/read-flag-replication-discipline-for-external-cli.md`](../patterns/read-flag-replication-discipline-for-external-cli.md) — the read-flag discipline whose substrate premise this flip undercuts.
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) — the redesign that proceeds from this substrate (replication unit = entry, never file state).

(*FR:Callimachus*)
