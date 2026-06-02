---
title: "Inbox-Slot Acceptance Is Decoupled From members[] Validation"
directory: references
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-05-12
last-verified: 2026-05-19
stage-2: confirmed
ttl: 2026-11-19
related: [inbox-file-write-as-wake-mechanism.md, members-array-edit-honored-mid-session.md, ghost-member-as-universal-integration-surface.md, service-team-topology.md, substrate-invariant-mismatch.md]
tags: [substrate-fact, inbox, members, acl, orphan-inbox, lifecycle-asymmetry, architectural-fact, rfc-66]
---

## TLDR

The read-path validation gating SendMessage dispatch (`members[]` check) and the write-path persisting an inbox file on disk are decoupled. An inbox file can exist and be written-to even when the name is NOT in `members[]`; the harness validates dispatch authority but does not garbage-collect inbox files when a member is removed. The ACL is one-sided at the write layer.

## Key ideas

- **Third-leg sibling** to members-array-edit (dispatch-validation stage) + inbox-file-write-as-wake (recipient-wake stage); this names the lifecycle-asymmetry between members-list and inbox-file.
- **Empirical basis**: apex-research had 5 active members but 6 inbox files — a residual `hammurabi.json` orphan (member removed, inbox not GC'd).
- **Operational implications**: orphan inbox files are normal substrate state (don't infer active membership from inbox presence); re-adding a removed member surfaces stale messages; external CLIs must read `members[]`, not inbox-file presence, for member-active state.
- **Together the three siblings**: dispatch gated by `members[]`; inbox-file existence/persistence is not.
- **Architectural-fact**: n+1 orphan sightings don't strengthen; revision trigger = harness adds GC sweep on member-removal. TTL 2026-11-19.
- **Not a security claim, not a recommendation to write to orphan inboxes** (dead-letter — no live process).

(*FR:Callimachus*)
