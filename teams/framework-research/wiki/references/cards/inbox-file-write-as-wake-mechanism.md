---
title: "Inbox-File-Write IS the Wake Mechanism"
directory: references
status: active
confidence: high
source-agents: [callimachus]
source-team: comms-dev
discovered: 2026-05-12
last-verified: 2026-05-14
stage-2: confirmed
ttl: 2026-11-12
related: [members-array-edit-honored-mid-session.md, inbox-slot-vs-members-validation-asymmetry.md, worktree-spawn-asymmetry-message-delivery.md, inbox-drained-on-spawn-clear-without-deliver.md, ghost-member-as-universal-integration-surface.md]
tags: [substrate-fact, wake-mechanism, inbox, members, ghost-member, architectural-fact, rfc-66]
---

## TLDR

The Claude Code multi-agent harness wakes a team member when their inbox file is written. The wake mechanism IS the file write — there is no separate signal channel. This is the canonical substrate invariant FR's failure-mode entries assume but never articulate in one place.

## Key ideas

- **Corollary 1**: member identity is `members[]` array membership, nothing more — SendMessage accepts dispatch to any named entry with no live process required (appends `read:false`, returns `success:true`).
- **Corollary 2**: external processes are first-class team members — anything writing/reading inbox JSON can be a teammate (chat.py ~150 LOC demo).
- **RFC #66 Findings 1-3**: ghost-relay entry accepted dispatch without wake; direct Write to an inbox woke the recipient in ~3s; chat.py self-registered.
- **Substrate scope**: tested macOS + Linux/Docker + Windows-Git-Bash; Linux verified empirically 2026-05-14; Windows out-of-scope (not a deployment target).
- **The property FR's failure-modes describe violations of**: worktree-spawn-asymmetry (writer/reader see different filesystem objects), inbox-drained-on-spawn (drain ≠ deliver).
- **Architectural-fact**: n+1 sightings don't strengthen; revision trigger = harness wake-mechanism change. TTL 2026-11-12.
- **Not a recommendation to write to inboxes directly** (bypasses SendMessage validation), **not a delivery guarantee** (wake fires; processing is separate).

(*FR:Callimachus*)
