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
ttl: 2026-11-19
related:
  - references/inbox-file-write-as-wake-mechanism.md
  - references/members-array-edit-honored-mid-session.md
  - patterns/ghost-member-as-universal-integration-surface.md
  - patterns/service-team-topology.md
---

# Inbox-Slot Acceptance Is Decoupled From `members[]` Validation

**Substrate fact** (RFC #66 cross-host PoC, Brunel S31 2026-05-12, Linux substrate apex-research): the read-path validation that gates `SendMessage` dispatch (sender-side `members[]` check) and the write-path that persists an inbox file on disk are **decoupled**. An inbox file at `~/.claude/teams/<team>/inboxes/<name>.json` can exist and be written-to even when `<name>` is NOT in the team's runtime `config.json` `members[]`. The ACL governing inbox-file presence is **one-sided at the write layer** -- the harness validates dispatch authority but does not garbage-collect inbox files when a member is removed.

This entry is the **third-leg sibling** to the existing companion pair:

- [`references/members-array-edit-honored-mid-session.md`](members-array-edit-honored-mid-session.md) -- names the **dispatch-validation** stage (mid-session `members[]` edits honored).
- [`references/inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md) -- names the **recipient-wake** stage (inbox file-write IS the wake).
- This entry -- names the **lifecycle-asymmetry** between members-list and inbox-file (writes pass through different validation than dispatch; inbox files persist past member-removal).

Together the three articulate the substrate's ACL semantics: dispatch is gated by `members[]` membership; inbox-file existence/persistence is not.

## Empirical basis

**Instance 1 -- apex-research, Linux substrate** (Brunel S31 substrate probe, 2026-05-12):

- Apex `~/.claude/teams/apex-research/config.json` shows 5 active `members[]` entries (team-lead + 4 dashboards: eratosthenes, champollion, nightingale, berners-lee).
- Directory `~/.claude/teams/apex-research/inboxes/` contains 6 inbox files -- the 5 active members PLUS a residual `hammurabi.json` orphan inbox (member previously removed from `members[]`, inbox file not cleaned up).
- Implication: inbox-file persistence outlives member-removal. The harness does not garbage-collect inbox files when a member exits `members[]`.

## Substrate scope

**Verified on:** Linux/Docker (apex-research production substrate; the deployment target per PO clarification 2026-05-12).

**Expected to behave identically on:** macOS (POSIX file-existence semantics; no automatic GC tied to membership). Windows is not a deployment target; not in scope.

## Relation to RFC #66 ACL-is-one-sided semantics

RFC #66 names ACL one-sidedness at the substrate level. This entry documents the **observable consequence** for inbox files specifically: the asymmetry between `members[]` (authoritative for dispatch) and `inboxes/*.json` (write-path persistent, not membership-gated for existence).

The dispatch-validation entry (`members-array-edit-honored-mid-session.md`) names the **enabling** half of this asymmetry: adding a `members[]` entry is sufficient for dispatch to validate. This entry names the **lingering** half: removing a `members[]` entry does NOT remove the inbox file. The two halves together describe a substrate where membership controls dispatch authority but not inbox-file lifecycle.

## Operational implications

1. **Orphan inbox files are normal substrate state.** A team's `inboxes/` directory may contain files for names not in current `members[]`. These are stale-but-harmless: nothing dispatches to them; nothing reads them. A reader should not treat orphan inbox presence as evidence of an active member.

2. **Re-adding a removed member surfaces stale messages.** If a name is removed from `members[]` while their inbox file still holds unread messages, re-adding the name (e.g., by `Edit` to `members[]` per the dispatch-validation entry) will expose those stale messages on the next read. Cleanup discipline for member-removal SHOULD include inbox-file deletion or rename if message hygiene matters across remove/re-add cycles.

3. **External-CLI consumers (ghost-bridge daemons, custom relays) must not infer member-active state from inbox-file presence.** The authoritative member-active signal is `members[]` in `config.json`, not inbox-file presence. Conflating the two on the consumer side is a substrate-invariant-mismatch defect (see [`patterns/substrate-invariant-mismatch.md`](../patterns/substrate-invariant-mismatch.md)).

## Architectural-fact discipline

This is an **architectural-fact entry** (per FR's `architectural-fact entries: confidence and revision triggers` convention). The decoupling is deliberate harness design -- there is no GC sweep on member-removal because the harness intentionally treats inbox-file lifecycle as orthogonal to dispatch-membership lifecycle.

**n+1 sightings of orphan inbox files do NOT strengthen this entry.** The mechanism is fully exposed at n=1; additional orphan observations add no new substrate information.

**Revision triggers:**

- Anthropic adds GC sweep on member-removal to the harness → archive this entry; replace with fix-date reference; downstream impact on cross-team-cleanup discipline.
- Anthropic adds dispatch-validation against inbox-file-existence (instead of `members[]`) → this entry becomes obsolete in its current form; new entry needed for the new validation regime.
- Substrate change that ties inbox-file existence to membership lifecycle in any direction → amend this entry with the new coupling discipline.

## TTL

**TTL: 2026-11-19** (6 months from filing). Re-verify at expiry: do removed members still leave inbox files behind on the deployment substrate? Re-verification is cheap (`ls inboxes/` against current `members[]`).

## What this is NOT

- **Not a security claim.** ACL one-sidedness at the write layer is not a security finding; the harness's security model assumes trusted local file-system access for any process with write capability to the team directory.
- **Not a recommendation to write to orphan inbox files.** Writing to an inbox file for a name not in `members[]` produces a dead-letter: the wake mechanism (`inbox-file-write-as-wake-mechanism.md`) fires nothing because no live process is associated with the name. Dispatch through `members[]` first, then the wake-on-write becomes effective.
- **Not a guarantee that orphan files are unbounded-persistent.** Substrate filesystem cleanup (tmpwatch, container rebuild, manual cleanup) may remove inbox files independent of harness behavior. Architectural-fact claim is about the harness -- not about every operator's filesystem policy.

## Related

- [`references/inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md) -- **three-way sibling.** Names the wake-on-write substrate property. This entry's "writing to an orphan inbox is dead-letter" implication composes with the wake-mechanism entry: wake requires both inbox-file-presence AND `members[]` entry for the addressable target to have an associated live process.
- [`references/members-array-edit-honored-mid-session.md`](members-array-edit-honored-mid-session.md) -- **three-way sibling.** Names the dispatch-validation property. The asymmetry between dispatch-validation (gated by `members[]`) and inbox-file-existence (not gated) is the substance of this entry.
- [`patterns/ghost-member-as-universal-integration-surface.md`](../patterns/ghost-member-as-universal-integration-surface.md) -- the integration abstraction this substrate enables; the three-way substrate-property family is the substrate-level foundation for the pattern.
- [`patterns/service-team-topology.md`](../patterns/service-team-topology.md) -- service-team designs that add/remove per-consumer ghosts at runtime should include inbox-file-cleanup discipline when removing ghosts, per Operational implication 2.
- [`patterns/substrate-invariant-mismatch.md`](../patterns/substrate-invariant-mismatch.md) -- consumers that infer member-active state from inbox-file presence exhibit a substrate-invariant-mismatch defect (Operational implication 3).

## Source

- Brunel S31 RFC #66 cross-host PoC, 2026-05-12. Substrate probe documented in `teams/framework-research/memory/brunel.md` line 51 (CHECKPOINT 15:09): "5 active members in config.json (team-lead + 4 dashboards) + 1 residual `hammurabi.json` orphan inbox (member removed, inbox not cleaned up -- consistent with RFC #66 ACL-is-one-sided semantics)."
- RFC #66 thread, comment ID 16893428. <https://github.com/mitselek/ai-teams/issues/66>

(*FR:Callimachus*)
