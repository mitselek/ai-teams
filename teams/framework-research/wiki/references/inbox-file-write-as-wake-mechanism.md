---
source-agents:
  - callimachus
source-team: comms-dev
discovered: 2026-05-12
filed-by: librarian
last-verified: 2026-05-14
status: active
confidence: high
source-files: []
source-commits: []
source-issues:
  - "66"
ttl: 2026-11-12
related:
  - references/members-array-edit-honored-mid-session.md
  - references/inbox-slot-vs-members-validation-asymmetry.md
  - patterns/worktree-spawn-asymmetry-message-delivery.md
  - gotchas/inbox-drained-on-spawn-clear-without-deliver.md
  - patterns/substrate-invariant-mismatch.md
  - patterns/ghost-member-as-universal-integration-surface.md
  - patterns/service-team-topology.md
amendments:
  - date: 2026-05-14
    note: "Companion-pair sibling filed (`references/members-array-edit-honored-mid-session.md`); substrate scope strengthened by parallel n=2 verification on Linux/Docker (apex-research) confirming POSIX-equivalence in practice, not just by extrapolation."
  - date: 2026-05-19
    note: "Third-leg sibling filed (`references/inbox-slot-vs-members-validation-asymmetry.md`, Brunel S31 PoC). The companion-pair becomes a three-way substrate-property family: this entry (recipient-wake), members-array-edit (dispatch-validation), inbox-slot-vs-members (lifecycle-asymmetry)."
---

# Inbox-File-Write IS the Wake Mechanism

**Substrate fact** (canonical articulation from RFC #66, comms-dev sandbox experiments, 2026-05-12): the Claude Code multi-agent harness wakes a team member when their inbox file `~/.claude/teams/<team>/inboxes/<name>.json` is written. The wake mechanism is the file write itself -- there is no separate signal channel.

Two corollary properties:

1. **Member identity is `members[]` array membership, nothing more.** A team member is an entry in `config.json` `members[]`. SendMessage validates against that list and accepts dispatch to any named entry -- no live process required behind the name. The harness does NOT verify a process exists; it appends to the named inbox file with `read: false` and returns `success: true`.

2. **External processes are first-class team members.** Anything that can write JSON to an inbox file and read JSON from one can be a teammate. A ~150 LOC Python CLI demonstration (`chat.py` reference artifact) self-registered as a member, exchanged messages with a Claude agent, and the agent saw it as a normal teammate (name, color, idle notifications).

## Empirical basis (RFC #66 Findings 1-3)

The findings were established in a sandbox team `sendmessage-experiment` on macOS Darwin 25.4.0:

- **Finding 1** -- appending a `ghost-relay` entry to `members[]` (with `backendType: "ghost"`, `model: "none"`, no spawn) caused SendMessage dispatch to that name to land cleanly in `inboxes/ghost-relay.json`. No wake attempted. The harness only checks `members[]` array membership.
- **Finding 2** -- writing JSON directly into `inboxes/echo-1.json` (via Write tool, NOT via SendMessage) caused the recipient to wake within ~3 seconds, process the message normally, and reply. The wake IS the file write.
- **Finding 3** -- `chat.py` (Python CLI, no deps, ~150 LOC) self-registered, polled its own inbox at 500ms, wrote outbound atomically (tmp + rename), and joined the team without any harness modification.

Reference artifacts (RFC #66):

- chat.py: <https://gist.github.com/mitselek/bdc18e47fcdbf21b5ddd7922b077cc7b>
- Empirical session log: <https://gist.github.com/mitselek/afbc0909dfebcdcdc20cb5508d208456>

## Substrate scope

**Tested on:** macOS Darwin 25.4.0 (RFC #66 sandbox); Linux/Docker (apex-research 2026-05-14); Windows-Git-Bash (framework-research 2026-05-14).

**Expected to behave identically on:** Linux (POSIX-standard `atomic rename` + fsnotify-style watching). This is the deployment-target family -- production substrate is Linux/Ubuntu (with possibly lighter Linux variants for some components, per PO clarification 2026-05-12). The harness runs in Linux containers; agent-observed substrate semantics are POSIX.

**Linux substrate verified 2026-05-14**: parallel cross-substrate verification with [`members-array-edit-honored-mid-session.md`](members-array-edit-honored-mid-session.md) (n=2 cross-substrate) included observing wake-on-file-write on Linux/Docker in apex-research (ghost-bridge daemon side picked up an inbox-write and forwarded to FR). Wake mechanism on Linux is now empirically verified, not just POSIX-extrapolated.

**Untested-and-out-of-scope:** Windows. The RFC author flagged a gap at write-site (`os.rename` under NTFS + Windows change-notification model differ from POSIX), but Windows is NOT a deployment target in any production scenario -- only a local-dev environment that may persist for months but is temporary. The flag is curatorial-grade information about the RFC author's testing scope, not a framework-design correctness concern for FR.

## Why this entry exists

This entry collects the **canonical substrate invariant** that FR's existing failure-mode entries assume but never articulate in one place:

- [`patterns/worktree-spawn-asymmetry-message-delivery.md`](../patterns/worktree-spawn-asymmetry-message-delivery.md) -- failure mode WHERE the inbox-file-write invariant breaks under worktree-mount-decomposition (writer and reader see different filesystem objects).
- [`gotchas/inbox-drained-on-spawn-clear-without-deliver.md`](../gotchas/inbox-drained-on-spawn-clear-without-deliver.md) -- failure mode WHERE the inbox file is drained at spawn-handshake without the queued messages being delivered into the spawned agent's conversation channel (drain ≠ deliver).

Both failure-mode entries describe **violations** of the inbox-file-write-IS-wake property. This entry names the property they describe failures of, so future readers have one canonical articulation to consult.

The property is also the **substrate enabler** for the ghost-member pattern (RFC #66): the abstraction works precisely because the harness's wake mechanism is file-write, not process-state. See [`patterns/ghost-member-as-universal-integration-surface.md`](../patterns/ghost-member-as-universal-integration-surface.md).

## Architectural-fact discipline

This is an **architectural-fact entry** (per FR's `architectural-fact entries: confidence and revision triggers` convention). The substrate is deliberate harness design, not empirically discovered behavior whose intentionality is uncertain.

**n+1 sightings of the inbox-file-write wake mechanism do NOT strengthen this entry.** The mechanism is fully exposed in the RFC #66 findings; additional reproductions add no new substrate information.

**Revision triggers:**

- Anthropic changes the harness wake mechanism (e.g., signal-based wake instead of file-watch) → archive this entry; replace with a fix-date reference.
- A new wake mechanism is added alongside (e.g., a push-channel for external members) → this entry stays; new entry for the new mechanism; cross-references both ways.
- Linux-substrate test surfaces materially different behavior on the deployment-target distro (Ubuntu or selected lighter variant) → amend this entry with the substrate scope refinement. (Windows behavior is out-of-scope per deployment-substrate decision; it is not a revision trigger.)

## TTL

**TTL: 2026-11-12** (6 months from filing). Re-verify at expiry: is the wake mechanism still file-write-driven, or has the harness migrated to a different substrate? Re-verification is cheap (run a Write to an inbox file, observe whether recipient wakes); the TTL exists to force a periodic check rather than letting stale-substrate state poison future queries.

## What this is NOT

- **Not a recommendation to use the wake mechanism directly.** Direct file-writes bypass SendMessage's validation (member-name check, atomicity, JSON well-formedness). Use SendMessage for normal traffic. The direct-write path is a substrate-level integration seam, not an alternative IPC for routine messaging.
- **Not a substitute for the failure-mode entries.** The substrate property holding does NOT mean all delivery paths work in all configurations -- see the cross-referenced failure-mode entries for known violations (worktree-mount-decomposition, spawn-handshake drain-without-deliver).
- **Not a promise of delivery guarantees.** The wake mechanism fires on file-write; whether the recipient successfully processes the wake is a separate concern. Sender-side `success: true` reflects substrate write, not recipient consumption (see `substrate-invariant-mismatch.md` Instance 6).

## Related

- [`references/members-array-edit-honored-mid-session.md`](members-array-edit-honored-mid-session.md) -- **companion-pair sibling.** Names the dispatch-validation stage substrate property (mid-session edits to `members[]` honored on the next `SendMessage` call). This entry names the recipient-wake stage. Both together cover the substrate dependencies a ghost-pair carries. Bidirectional cross-link load-bearing: registration without wake is a dead-letter address; wake without registration has no addressable target.
- [`patterns/ghost-member-as-universal-integration-surface.md`](../patterns/ghost-member-as-universal-integration-surface.md) -- the abstraction this substrate enables: a teammate is name + inbox file, so anything that writes/reads those files can be a teammate.
- [`patterns/service-team-topology.md`](../patterns/service-team-topology.md) -- a team whose members are ghost representations of the teams it serves. Builds on this substrate property + the ghost-member abstraction.
- [`patterns/worktree-spawn-asymmetry-message-delivery.md`](../patterns/worktree-spawn-asymmetry-message-delivery.md) -- failure mode where the file-write invariant breaks under worktree-mount-decomposition.
- [`gotchas/inbox-drained-on-spawn-clear-without-deliver.md`](../gotchas/inbox-drained-on-spawn-clear-without-deliver.md) -- failure mode where the spawn handshake drains the inbox without delivering queued messages.
- [`patterns/substrate-invariant-mismatch.md`](../patterns/substrate-invariant-mismatch.md) -- Instance 6 names a harness-claim-vs-runtime-observation defect at the message-bus layer. The substrate property this entry articulates is what Instance 6's defect violates.

(*FR:Callimachus*)
