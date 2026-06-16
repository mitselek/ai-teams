---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-05-12
filed-by: librarian
last-verified: 2026-05-19
status: active
confidence: high
source-files: []
source-commits: []
source-issues:
  - "66"
related:
  - patterns/cross-host-atomic-inbox-write-primitive.md
  - patterns/ghost-member-as-universal-integration-surface.md
  - references/inbox-file-write-as-wake-mechanism.md
  - references/inbox-slot-vs-members-validation-asymmetry.md
  - patterns/agenttype-vs-backendtype-separation.md
  - patterns/per-message-color-overrides-registered-default.md
---

# Read-Flag-Replication Discipline for External-CLI Consumers

**Consumer-side contract** (RFC #66 cross-host PoC, Brunel S31 2026-05-12, Bug C identified by Aen): when an external CLI (i.e., not the native Claude Code harness) reads from an inbox file on disk, it MUST flip the per-message `read: false → true` flag back to the file **under the same `flock` as the read**. RFC #66 left this contract implicit; the substrate-correct discipline is that **any consumer of the inbox-as-disk-file participates in the same read-acknowledgment regime as the native harness**.

The discipline is upstream-symmetric with the write-side substrate primitive ([`patterns/cross-host-atomic-inbox-write-primitive.md`](cross-host-atomic-inbox-write-primitive.md)): writers use flock+atomic-append; readers must use flock+atomic-read-and-mark-read. Both halves are required for a substrate-correct external-CLI implementation.

## The contract

An external CLI reading from `~/.claude/teams/<team>/inboxes/<name>.json` MUST follow this discipline:

1. **Acquire `fcntl.flock(LOCK_EX)`** on the inbox file (NOT shared lock -- the read involves a write).
2. **Read the JSON array** from the locked file.
3. **Select messages with `read: false`** (the consumer's unread queue).
4. **Flip those messages' `read: false → true` in-place** in the parsed JSON.
5. **Write the modified JSON back** to the file (atomic-rename or O_TRUNC; both work under the lock).
6. **Release the lock**.

Step 4 is the load-bearing step. Skipping it is the Bug C class (decorative read-state -- the consumer sees messages but the harness display + future polls keep treating them as unread).

The native harness performs steps 1-6 atomically when it processes inbox writes via its own SendMessage/wake path. An external CLI participating in the same substrate MUST adopt the same discipline; the harness has no special-case for "external-but-trusted readers."

## Why the discipline is load-bearing

The `read: false → true` flag is the **only persistence signal** that distinguishes "message exists in inbox" from "message has been consumed by recipient." Three downstream consumers depend on the flag flipping correctly:

1. **The native harness display layer** uses `read: false` to render unread-message indicators. A consumer that reads-without-flipping leaves the harness showing unread state for messages the consumer has already processed -- *decorative read-state* on the harness side.

2. **The native harness's idle-detection / notification path** triggers re-notification when unread messages accumulate. A non-flipping consumer causes phantom re-notifications: messages it has already handled re-surface as new because no consumer claimed them.

3. **Concurrent consumers** (multiple external CLIs polling the same inbox; or a CLI + a native agent both connected to the same name in different lifecycle phases) coordinate via the `read` flag. Without the discipline, two consumers may both "consume" the same message and act on it twice.

The flag is the substrate-level synchronization primitive between any consumers of the inbox; it is NOT an internal harness flag that external code can ignore.

## Empirical basis

**Bug C surfaced 2026-05-12 ~15:54** during Brunel's S31 PowerShell PoC PoC (`~/bin/ghost-chat.ps1.deprecated`):

- The PowerShell CLI read messages from the apex inbox but did not flip `read: false → true` back to the file.
- Symptom: apex team-lead's display showed messages as unread after the CLI had processed them; subsequent polls re-surfaced the same messages; phantom re-notification fired.
- Diagnosis: the substrate contract (read-and-mark-read-atomically) was implicit in RFC #66; the CLI implementation skipped the write-back step under the assumption that "reading is read-only."

**Closed by-design in Python rewrite** (`~/bin/ghost-chat.py`, S31 16:42):

- Python CLI implements a `fetch-and-mark-read`-under-flock primitive: single ssh round-trip flips `read: false → true` while returning unread NDJSON to the caller.
- Architecturally distinct from "patch Bug C with a write-back call after read" -- the new primitive treats read-and-mark-read as one atomic operation, not as separate steps with a discipline boundary between them.
- **Cross-implementation parity** with the write-side primitive (see [`cross-host-atomic-inbox-write-primitive.md`](cross-host-atomic-inbox-write-primitive.md) §Cross-implementation parity): both PowerShell-host and Python-host clients exercise the same remote `python3 -c` + `fcntl.flock` substrate; the discipline holds at the remote-substrate layer regardless of client language.

## Load-bearing structural insight: by-design vs patch-after

The S31 16:28 decision to **rewrite in Python rather than patch Bug C in PowerShell** is the canonical example of *by-design closure* of a substrate-contract gap. Two paths existed:

1. **Patch path:** add a write-back call after read in the PowerShell CLI. The Bug C symptom would close; the substrate contract would still be implicit, and the next CLI rewrite or fork would re-encounter the same gap.

2. **By-design path (taken):** rewrite with `fetch-and-mark-read`-under-flock as a single primitive. The substrate contract becomes the operation's signature; the next consumer reading the Python CLI as a reference inherits the discipline structurally, not via a comment-warning.

This is a [`patterns/substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) defense-in-depth move at the consumer-side: the discipline is hoisted into the operation's name and surface, not buried in implementation detail.

## Substrate scope

**Verified on:** apex-research Linux/Docker (deployment-target substrate). Cross-implementation parity (PowerShell client + Python client) against the same remote substrate confirmed the discipline is a substrate-property requirement, not a client artifact.

**Required substrate property:** `fcntl.flock(LOCK_EX)` semantics holding across read + mark-read + write critical section. Same scope as the write-side primitive -- POSIX systems with standard local filesystem; NFS-without-`lockd` is an edge case that may break the discipline.

**Untested-and-out-of-scope:** Windows-as-remote-target (different fcntl semantics). Not a deployment target per PO 2026-05-12.

## What this discipline does NOT cover

- **Not a guarantee against double-processing across consumer restarts.** If a consumer reads + flips + crashes before acting on the message, the message is marked read but never acted upon. The discipline is at the substrate-synchronization layer; idempotency at the application layer is a separate concern (cite a unique message-ID-and-dedup-set on the consumer side if action durability matters).

- **Not authentication or ACL.** The discipline assumes the consumer has authority to read the inbox in the first place; that's governed by `members[]` membership and filesystem access. Reading + flipping without `members[]` membership is structurally possible (per [`references/inbox-slot-vs-members-validation-asymmetry.md`](../references/inbox-slot-vs-members-validation-asymmetry.md) -- read-path doesn't validate against members at the filesystem layer) but is a substrate-misuse case, not a normal-flow case.

- **Not a recommendation for read-only-without-flip access patterns.** A "peek" mode that intentionally does not mark-read (for audit logging, observation, etc.) is a valid use case but is NOT a consumer in the discipline's sense. Peek-consumers should be explicit about their non-participation in the read-flag-replication regime; mixing peek-mode and normal-consume-mode against the same inbox without clear boundaries reproduces Bug C symptoms.

- **Not a substitute for protocol-level dedup.** Substrate-layer read-flag-replication prevents *re-notification* of the same message to the same consumer; it does NOT prevent semantic duplicates produced by a sender re-emitting "the same" message. Protocol-level dedup (message IDs, idempotency keys) is the separate layer for that concern.

## Promotion posture

**n=1 implementation with by-design closure + n=1 anti-pattern catch (Bug C).** The empirical evidence base for the discipline is one PoC with both the failure mode (PowerShell pre-fix) and the corrected implementation (Python by-design) -- the same PoC contains both halves of the comparison. This is unusual: most disciplines have either a failure trail or a correct-implementation trail, not both in one session.

**Common-prompt promotion candidate trigger (deferred):** a second external-CLI implementation independently arrives at `fetch-and-mark-read`-under-flock without cross-pollination from this entry. Cross-team or cross-implementer arrival is the canonical Protocol C signal. Currently sketch-grade on n=1 (with the by-design framing as strong corroborative evidence); wiki entry is the canonical home for now.

## Architectural-fact discipline (qualified)

This entry sits at the boundary between **discipline** (consumer-side contract; teachable; can be violated) and **architectural-fact** (substrate property; observable; not subject to consumer choice). The split:

- The substrate property (the harness uses `read: false` as the consume-state signal) is architectural-fact -- verified by inspection of inbox-message JSON and by the failure mode of Bug C.
- The discipline (external CLIs MUST participate in flipping the flag) is consumer-contract, not substrate-fact. A non-compliant CLI is not architecturally prevented; it produces decorative read-state, not crash.

The architectural-fact half does not gain confidence from n+1 sightings. The discipline half DOES gain confidence from n+1 implementations adopting it correctly -- that is the promotion trigger above.

## Operational implications

1. **All external CLIs joining FR-deployed teams MUST adopt the discipline.** This includes ghost-bridge daemons, monitoring sidecars, audit hooks, library-team relay primitives, and any future external automation consuming inbox files. The substrate-correct integration is structural, not optional.

2. **Reference implementation:** `~/bin/ghost-chat.py` `fetch-and-mark-read` primitive is the canonical reference. Future external CLIs should compose against the same primitive shape (single round-trip read-and-mark-read) rather than separating read and write phases.

3. **Library-team architecture composes cleanly.** Per S31 PO decision 2026-05-12, a central-library team's inbox consumers (per-team Cal ghosts reading from the central library inbox, or the library team's own internal consumers) inherit the discipline as a substrate-correctness requirement. The discipline is transport-independent -- applies to ssh+python+flock primitive, applies equally to a future native cross-host primitive if one ships.

4. **Documentation discipline:** any spec or design doc that includes "read messages from inbox" as a step must reference this entry's contract. Otherwise the spec is at risk of the same RFC #66 implicit-contract gap that Bug C surfaced.

## Related

- [`patterns/cross-host-atomic-inbox-write-primitive.md`](cross-host-atomic-inbox-write-primitive.md) -- **upstream/downstream sibling.** Write-side primitive: this entry's reading-side discipline rides on top. Writers use atomic-append-under-flock; readers use atomic-read-and-mark-read-under-flock. Both required for substrate-correct external-CLI behavior.
- [`patterns/ghost-member-as-universal-integration-surface.md`](ghost-member-as-universal-integration-surface.md) -- the abstraction this discipline serves. Every ghost-bridge daemon and external CLI participating in inter-team comms is a consumer in this discipline's sense.
- [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) -- substrate-property foundation. The wake mechanism fires on file-write; read-flag-replication is the consumer-side complement.
- [`references/inbox-slot-vs-members-validation-asymmetry.md`](../references/inbox-slot-vs-members-validation-asymmetry.md) -- substrate-property sibling. Authorization to read is separate from authorization to write; both are governed by `members[]` at the dispatch layer but not at the filesystem layer.
- [`patterns/substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) -- the by-design-vs-patch-after choice (S31 16:28 decision) is a defense-in-depth move against substrate-invariant mismatch at the consumer-side. The discipline is hoisted into the operation's name (`fetch-and-mark-read`) rather than buried in implementation detail.
- [`patterns/agenttype-vs-backendtype-separation.md`](agenttype-vs-backendtype-separation.md) -- S33+ sibling; substrate-shape finding from the same S31 PoC.
- [`patterns/per-message-color-overrides-registered-default.md`](per-message-color-overrides-registered-default.md) -- S33+ sibling; display-precedence finding from the same S31 PoC.

## Source

- Brunel S31 RFC #66 cross-host PoC, 2026-05-12. Bug C surfaced ~15:54 (Aen identification); by-design closure in Python rewrite 16:42 (`~/bin/ghost-chat.py` `fetch-and-mark-read`-under-flock primitive). PoC artifacts user-shipped per S31 16:53 PROVENANCE-CORRECTION; Brunel's role coordinator/spec/diagnosis/substrate-property identification.
- Brunel scratchpad CHECKPOINT 16:42 + 16:48 (Bug C closure-by-design design rationale).
- RFC #66 thread, implicit-contract surface. <https://github.com/mitselek/ai-teams/issues/66>

(*FR:Callimachus*)
