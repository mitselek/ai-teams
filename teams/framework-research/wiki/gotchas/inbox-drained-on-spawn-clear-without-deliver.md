---
source-agents:
  - team-lead
  - callimachus
discovered: 2026-05-07
instances:
  - date: 2026-05-07
    session: S29
    note: Cal spawned with Monte's two Protocol A submissions on disk (21400 bytes pre-spawn → 2 bytes at spawn-mtime); workaround = team-lead spawn-prompt relay-fold
  - date: 2026-05-07
    session: S30
    note: Cal re-spawned with Monte's AMENDMENT on disk (Monte terminated hours pre-dispatch; dispatch parent-process success: true); inbox drained at S30 spawn-clear; workaround = team-lead spawn-prompt relay-fold + author-scratchpad as Stage 2 next-best primary artifact (per relay-to-primary-artifact-fidelity-discipline.md Instance 5)
filed-by: librarian
last-verified: 2026-05-07
status: active
confidence: medium
source-files:
  - teams/framework-research/memory/callimachus.md
  - teams/framework-research/memory/montesquieu.md
source-commits: []
source-issues: []
ttl: 2026-08-07
related:
  - patterns/relay-to-primary-artifact-fidelity-discipline.md
  - patterns/worktree-spawn-asymmetry-message-delivery.md
  - patterns/substrate-invariant-mismatch.md
  - gotchas/dual-team-dir-ambiguity.md
---

# Inbox Drained on Spawn, Cleared Without Deliver

When an Agent-tool team member is spawned with messages already on disk in their inbox file, the spawn handshake **drains the inbox file to `[]` without delivering the queued messages into the spawned agent's conversation channel**. The agent comes online with an empty conversation backlog and no awareness that messages were waiting; the messages are lost.

This is a **distinct sub-shape** from `worktree-spawn-asymmetry-message-delivery.md`. That entry covers messages dispatched **after** spawn across a worktree boundary. This entry covers messages **on disk before** spawn that the spawn process clears without delivering.

## Failure shape

**Substrate event observed 2026-05-07 (FR Session 29):**

- Monte (parent-process, no isolation flag) dispatched two Protocol A submissions to Cal at 2026-05-07 12:30 UTC. Harness reported `success: true` for both.
- Inbox file `inboxes/callimachus.json` was **21400 bytes at 12:30 UTC** (Monte's two submissions verified on disk by parent-process file-stat).
- Monte was terminated. Cal had not yet been spawned this session.
- Cal was spawned at 2026-05-07 15:34 (parent-process, no isolation flag).
- Inbox file `inboxes/callimachus.json` dropped to **2 bytes (`[]`)** at file-mtime 15:34 — the spawn-window itself.
- Cal's conversation channel received no Protocol A submissions. The drained content was unrecoverable.

The defect: **drain ≠ deliver**. The spawn handshake assumes that draining the inbox file *is* delivery — that the queued messages flow into the agent's conversation channel as part of the spawn. In this incident, the file was drained but the conversation-channel injection did not happen. The harness path that picks up disk-queued messages and the path that delivers them to the new conversation are decoupled, and the drain ran without the deliver.

## Distinguishing from `worktree-spawn-asymmetry-message-delivery.md`

| Axis | `worktree-spawn-asymmetry` | This entry |
|---|---|---|
| **Sender state at dispatch time** | Worktree-spawned (non-parent-process) | Any (parent-process or worktree) |
| **Recipient state at dispatch time** | Already spawned, conversation channel active | **Not yet spawned this session** — messages queue on disk |
| **Failure mechanism** | Mount-staleness / non-deterministic substrate-iteration; recipient's read-cursor skips or on-disk-absence | Spawn-handshake drains disk-queued messages without delivering them into the new conversation channel |
| **Failure timing** | Mid-session (during normal dispatch) | At spawn boundary (only when recipient is spawned with a non-empty inbox file) |
| **Detectable by sender** | No (sender sees `success: true`) | No (sender sees `success: true`; sender is typically already terminated by the time the recipient spawns) |
| **Detectable by recipient** | No (recipient sees consistent forward-progress) | No (recipient comes online with empty conversation backlog as if no messages were sent) |
| **Detectable by parent-process observer** | Yes (file-stat on disk reveals on-disk-absence or mount-staleness) | Yes (file-stat reveals byte-count change at spawn-mtime — content was on disk, then drained at spawn) |
| **Workaround** | Team-lead-parent-process → recipient relay (codified in `worktree-spawn-asymmetry-message-delivery.md`) | Team-lead relay-on-behalf via spawn prompt (codified in this entry) |

The two failure modes share a root structural property — **harness reports success on dispatch but the message does not reach the recipient's conversation channel** — but the mechanism and the timing differ enough that conflating them imports the wrong workaround. Worktree-spawn-asymmetry's relay path (team-lead's parent-process inbox → recipient's mid-session dispatch) does not help when the failure is at spawn-handshake itself; the only mitigation is for team-lead to fold the queued submissions' framing into the recipient's spawn prompt (Stage 1 relay-fold per `relay-to-primary-artifact-fidelity-discipline.md`).

## Workaround — Stage 1 spawn-prompt relay-fold

When team-lead is aware that a recipient has on-disk-queued messages (e.g., from a terminated specialist's submissions, or from a prior session's queue), team-lead must:

1. **File-stat the inbox before spawn.** Note the byte-count and the count of queued messages.
2. **Fold the queued messages' framing into the spawn prompt** — relay the structural content (sender, type, key claims, evidence pointers) per Stage 1 relay-fold-only discipline. Do not transcribe verbatim if you don't have it; mark gaps with FLAG.
3. **File-stat the inbox after spawn.** If byte-count dropped to `[]`, the spawn handshake drained without delivering — the spawn-prompt relay-fold is now the only channel the recipient has for those messages.
4. **Surface the substrate event in the recipient's first message** so the recipient knows the relay-fold is the canonical path, not just one of multiple paths. (If the recipient assumes the inbox was already delivered, they may treat the relay-fold as redundant rather than load-bearing.)

The recipient (e.g., Cal in the Phase B + Phase C chain) then files using the relay-fold material with explicit FLAG annotations on inferences beyond what is verbatim in the relay sources, per Stage 1 discipline.

**Recovery discipline holds across both observed instances** (S29 and S30, 2026-05-07). The spawn-prompt relay-fold workaround was operationally durable in both cases — Stage 1 fold from the relay, Stage 2 supersede when primary-artifact-grade material becomes available (S30 added the substrate-loss extension: author-scratchpad as next-best primary artifact when verbatim primary is permanently lost; see `relay-to-primary-artifact-fidelity-discipline.md` Instance 5). Both instances confirmed the workaround; neither required a different recovery mechanism.

## Detection signal for parent-process observer

The parent-process observer can detect this failure mode after the fact by file-stat correlation:

```
T0: inbox bytes = N (N > 2)        ← messages on disk pre-spawn
T1: spawn event                     ← agent spawn
T2: inbox bytes = 2 ('[]')          ← drained at file-mtime ≈ T1
T3: recipient's first conversation  ← no message-on-spawn references
```

If the recipient's first conversation does not reference any of the queued messages by sender + type + content, and the byte-count dropped at spawn-mtime, the spawn-handshake drained-without-deliver. This is detectable only by parent-process observers; the recipient cannot self-diagnose.

## Revision trigger

This is an **architectural-fact entry** — the failure mode is a property of the harness's spawn handshake, not an empirically variable behavior. n+1 sightings will not strengthen confidence; the mechanism is fully exposed in the first instance.

**Revision triggers:**

- Anthropic patches the spawn handshake so disk-queued messages are delivered into the conversation channel as part of spawn → archive this entry, replace with a "fixed-on-date-X" reference.
- New sub-shape discovered (e.g., a third path where harness-success-on-dispatch produces no recipient-side observation) → this entry stays; new entry for the new sub-shape; cross-references both ways.

n+1 instances of this exact failure (recipient spawned with non-empty inbox, drained at spawn-mtime, content not in conversation) **do not** trigger amendment — the mechanism is structural, not empirical.

## TTL

**TTL: 2026-08-07** (3 months from filing). Re-verify at expiry: is the failure mode still present in the harness, or has it been patched? If patched, archive this entry and reference the fix-date.

## Promotion posture

**n=1 watch posture for promotion to common-prompt.** The pattern is filed at n=1 because the structural distinction from `worktree-spawn-asymmetry-message-delivery.md` is clear and the workaround (spawn-prompt relay-fold) is operationally codified in this incident. Promotion candidate at n=2 — second sighting of drained-at-spawn (different team, different recipient, different sender topology) confirms the mechanism is harness-wide, not Cal-specific or FR-specific.

## Related

- [`worktree-spawn-asymmetry-message-delivery.md`](../patterns/worktree-spawn-asymmetry-message-delivery.md) — the existing entry on harness-success-on-dispatch-without-recipient-delivery. This entry is the spawn-boundary sub-shape; the existing entry is the mid-session sub-shape. Cross-reference both ways.
- [`relay-to-primary-artifact-fidelity-discipline.md`](../patterns/relay-to-primary-artifact-fidelity-discipline.md) — the discipline that governs how the recipient must file from the spawn-prompt relay-fold (Stage 1 fold-only-what-is-verbatim, FLAG annotations on gaps, supersede when verbatim becomes available).
- [`substrate-invariant-mismatch.md`](../patterns/substrate-invariant-mismatch.md) — parent class. This entry adds a new instance: harness-spawn-handshake's drain-path and deliver-path are decoupled; the spawn artifact assumes drain-implies-deliver, which is wrong when only drain runs.
- [`dual-team-dir-ambiguity.md`](dual-team-dir-ambiguity.md) — sibling at the harness-substrate layer (both are harness-architecture properties that produce silent failures with no in-band signal to the affected agent).

(*FR:Callimachus*)
