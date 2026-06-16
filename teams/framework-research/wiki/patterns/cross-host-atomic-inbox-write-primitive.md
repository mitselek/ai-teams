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
  - patterns/read-flag-replication-discipline-for-external-cli.md
  - patterns/ghost-member-as-universal-integration-surface.md
  - references/inbox-file-write-as-wake-mechanism.md
  - references/inbox-slot-vs-members-validation-asymmetry.md
  - patterns/agenttype-vs-backendtype-separation.md
  - patterns/per-message-color-overrides-registered-default.md
---

# Cross-Host Atomic Inbox-Write Primitive: Single-SSH + Python + `fcntl.flock`

**Reusable transport primitive** (RFC #66 cross-host PoC, Brunel S31 2026-05-12, cross-implementation verified PowerShell + Python): a single `ssh` invocation with remote `python3 -c "..."` that reads the message body from stdin, acquires `fcntl.flock(LOCK_EX)` on the target inbox file, appends to the JSON array, releases the lock, and exits -- is **process-level atomic from the sender's perspective**. Reusable for any cross-host write into a known-shape JSON-array file on a substrate where `fcntl.flock` is available (POSIX systems -- the deployment-target family).

The primitive composes three substrate properties:

1. **Single-ssh round-trip** -- one network operation, one remote process; no half-finished state if the network drops mid-call.
2. **Remote `python3 -c`** -- no temp script files on remote; the entire write logic ships in-band on the ssh command line.
3. **`fcntl.flock(LOCK_EX)`** -- exclusive lock on the inbox file across the read-then-append-then-write critical section; concurrent writers serialize cleanly.

The combination is the contract: any one of the three alone is insufficient (multiple-ssh fragments lose atomicity; ssh + remote temp-script adds filesystem state; ssh + python without flock races on concurrent writers).

## Empirical basis -- cross-implementation parity

The primitive was implemented in two distinct client languages against the same remote substrate (apex-research Linux/Docker), both with identical observable semantics:

**Instance 1 -- PowerShell client** (`~/bin/ghost-chat.ps1.deprecated`, S31 first-iteration):

- PowerShell-host `ssh` invocation; remote `python3 -c "..."` reads stdin; flock + JSON-array append.
- Outbound latency: **657-687ms median** (within RFC #66's <3s budget).

**Instance 2 -- Python client** (`~/bin/ghost-chat.py`, S31 canonical rewrite):

- Python-host `subprocess.run` with ssh; remote `python3 -c "..."` reads stdin; flock + JSON-array append.
- Outbound latency: **741-854ms median** (PowerShell parity, both <RFC 3s budget).

**Both instances exercise the same remote primitive.** The client language is incidental; the *remote* `python3 -c "..."` + `fcntl.flock` is the substrate property. Cross-implementation parity validates that the primitive's atomicity is a property of the remote substrate, not of the local client.

This is the load-bearing structural move from Brunel's S31 16:51 [LEARNED-STRONG]: **cross-implementation verification of substrate findings moves a claim from "single-language-PoC-shows-X" to "substrate-property-of-deployment-harness-is-X."** Two independent implementations against the same substrate showing identical behavior is strong evidence the finding is a substrate property, not a client-language artifact.

## Substrate scope

**Verified on:** apex-research Linux/Docker (the deployment-target family per PO clarification 2026-05-12).

**Substrate requirements:**

- Remote system has `python3` available and `fcntl` module imports without error (Python on POSIX).
- SSH client on the local system; key-based auth typically; password-auth would degrade the single-round-trip property by adding interactive prompts.
- Remote filesystem supports POSIX advisory locking on the inbox file's underlying storage (this is true for standard ext4/xfs/zfs; not true for some NFS configurations without `lockd`).

**Untested-and-out-of-scope:** Windows hosts as remote-substrate target. Windows `fcntl` semantics differ; the analogous Windows primitive (`msvcrt.locking` or `LockFileEx`) does not compose cleanly with the same Python one-liner. Not a deployment target per PO 2026-05-12.

## What the primitive provides

1. **Sender-side atomic write.** From the local CLI's perspective, the inbox-file mutation either fully happens or the ssh call returns an error. No partial JSON state on remote.

2. **Concurrent-writer serialization.** Two senders calling the primitive simultaneously serialize via `LOCK_EX`; the second sender blocks until the first releases. JSON array order matches lock-acquisition order, not call-issuance order -- but no message is lost or corrupted.

3. **Network-failure visibility.** If the network drops before the ssh call returns success, the local CLI sees a non-zero exit; the remote either fully wrote or did not. The local CLI MUST treat non-zero exit as "write status unknown" and decide retry semantics (idempotency depends on the message-shape contract above this primitive -- if messages carry a unique ID, retry-with-dedup is possible).

4. **Substrate independence of message shape.** The primitive is JSON-array-append; the message shape inside the array is consumer-defined. Any JSON-array file on the remote with `fcntl.flock`-safe storage is a valid write target.

## What the primitive does NOT provide

- **Not a message-delivery guarantee at the harness layer.** Writing to an inbox file is necessary for the wake mechanism ([`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md)) to fire, but the recipient's consumption is a separate concern. See `inbox-drained-on-spawn-clear-without-deliver.md` for a substrate failure mode where the file-write succeeds but the harness drains without delivery.

- **Not read-side coverage.** The primitive is write-only. A separate primitive (or extension) is needed for the read-and-mark-read-atomically path that external CLIs reading from the inbox must follow -- see the upstream/downstream sibling pattern [`patterns/read-flag-replication-discipline-for-external-cli.md`](read-flag-replication-discipline-for-external-cli.md) for the consumer-side contract that rides on top of this primitive.

- **Not encryption or auth.** SSH provides transport-layer confidentiality and authentication; the primitive does not add application-layer encryption. The `members[]` ACL ([`references/inbox-slot-vs-members-validation-asymmetry.md`](../references/inbox-slot-vs-members-validation-asymmetry.md)) is the only application-layer authority check.

- **Not lossless under filesystem-substrate degradation.** If the remote storage layer corrupts the inbox file outside the locked region (e.g., container restart mid-write), the primitive cannot detect or recover; rely on inbox-file integrity-checks at the consumer side if this matters.

## Architectural-fact discipline

This is **architectural-fact at the primitive-composition level**. The three component substrates (ssh, python3, fcntl) are deliberate by-design choices; their composition is intentional. Per FR's architectural-fact convention:

**n+1 same-shape verifications do NOT strengthen this entry.** Cross-implementation parity at n=2 (PowerShell + Python) is sufficient evidence; additional same-substrate same-pattern verifications add no new substrate information.

**Revision triggers:**

- Anthropic harness adds a native cross-host message primitive that supersedes raw inbox-file writes → archive this entry; replace with fix-date reference pointing at the native primitive.
- The deployment target migrates off POSIX substrate (e.g., to Windows containers, or to a substrate without `fcntl.flock`) → archive or amend with substrate-scope revision.
- A different atomic-write primitive emerges that empirically outperforms (latency, reliability) the ssh + python3 + flock composition on the deployment substrate → file the new primitive as a sibling; cross-reference; do NOT archive this one immediately (legacy clients may still use it).

## Operational implications

1. **Reusable for any external-CLI joining a team.** Any new external CLI (ghost-bridge daemon, monitoring sidecar, audit hook, automation bot) that needs to write into a team's inbox files on the deployment substrate can adopt this primitive directly. The primitive is the substrate-correct integration path; building from scratch invites the bugs S31 PoC iterations surfaced (lock not held, race, partial JSON state).

2. **Latency-budget reference.** 657-854ms median across two implementations sets an empirical reference for "ssh + python3 + flock + single-message append" on the apex-research substrate. New clients can compare against this baseline; substantial regression (e.g., 3-5s) suggests substrate degradation (network path, remote load) rather than client bug.

3. **Library-team architecture composes cleanly.** Per S31 PO decision 2026-05-12 (library team specification), a central-library team's cross-team interface could adopt this primitive for any per-team Cal that writes to the library team's inbox -- same substrate, same primitive, no transport redesign.

## Promotion posture

**n=2 cross-implementation parity + substrate-property empirical basis** supports operational confidence. The primitive is filed at confidence: high and stands as the canonical cross-host atomic-inbox-write recipe for FR's deployment substrate.

**Common-prompt promotion candidate trigger (deferred):** if a third independent implementation (different language, e.g., Go or Rust, against the same substrate) reproduces identical observable semantics, that would be n=3 cross-language confirmation and a strong common-prompt promotion signal under the "third independent confirmation" rule from Cal's wiki-process discipline.

## Related

- [`patterns/read-flag-replication-discipline-for-external-cli.md`](read-flag-replication-discipline-for-external-cli.md) -- **upstream/downstream sibling.** This entry covers the write-side primitive; the sibling covers the consumer-side contract for marking messages as read. The two compose: writers use this primitive; readers use the sibling's discipline. Both are required for a substrate-correct external-CLI implementation.
- [`patterns/ghost-member-as-universal-integration-surface.md`](ghost-member-as-universal-integration-surface.md) -- the broader abstraction this primitive serves. Ghost-bridge daemons + external CLIs are the consumer set for this primitive.
- [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) -- substrate-property foundation. The wake mechanism fires on file-write; this primitive is one way to produce that file-write atomically from a remote host.
- [`references/inbox-slot-vs-members-validation-asymmetry.md`](../references/inbox-slot-vs-members-validation-asymmetry.md) -- ACL substrate property. This primitive writes to inbox files; the `members[]` ACL governs whether dispatch is valid in the first place. The primitive does not validate ACL; the calling daemon must.
- [`patterns/agenttype-vs-backendtype-separation.md`](agenttype-vs-backendtype-separation.md) -- S33+ sibling; substrate-shape finding from the same S31 PoC.
- [`patterns/per-message-color-overrides-registered-default.md`](per-message-color-overrides-registered-default.md) -- S33+ sibling; display-precedence finding from the same S31 PoC.

## Source

- Brunel S31 RFC #66 cross-host PoC, 2026-05-12. PoC artifacts `~/bin/ghost-chat.ps1.deprecated` + `~/bin/ghost-chat.py` (both **user-shipped per S31 16:53 PROVENANCE-CORRECTION** -- Brunel's role was coordinator/spec/diagnosis/substrate-property identification, NOT implementer). Cross-implementation parity argument is Brunel's S31 16:51 [LEARNED-STRONG] reusable pattern.
- Latency measurements: PowerShell 657-687ms, Python 741-854ms (S31 scratchpad CHECKPOINT 16:48 + DECISION 16:28).
- RFC #66 thread, <3s budget reference. <https://github.com/mitselek/ai-teams/issues/66>

(*FR:Callimachus*)
