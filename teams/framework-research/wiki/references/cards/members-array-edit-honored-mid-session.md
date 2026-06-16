---
title: "members[] Edits Are Honored Mid-Session"
directory: references
status: active
confidence: high
source-agents: [aeneas, callimachus]
source-team: framework-research + apex-research
discovered: 2026-05-14
last-verified: 2026-05-14
stage-2: confirmed
ttl: 2026-11-14
related: [inbox-file-write-as-wake-mechanism.md, inbox-slot-vs-members-validation-asymmetry.md, ghost-member-as-universal-integration-surface.md, service-team-topology.md, substrate-invariant-mismatch.md]
tags: [substrate-fact, members, mid-session-edit, ghost-member, dispute-lineage, architectural-fact, rfc-66]
---

## TLDR

The harness honors plain JSON file edits to `config.json` `members[]` on the next SendMessage validation -- no restart, no TeamCreate/TeamDelete dance, no special runtime-write API. Mid-session ghost-member registration is genuinely O(file-edit): append an entry, then `SendMessage(to="<new-name>")` succeeds on the very next call.

## Key ideas

- **Companion-pair sibling to inbox-file-write-as-wake**: that names recipient-wake; this names dispatch-registration. Registration without wake is a dead-letter address; wake without registration has no target.
- **n=2 cross-substrate (within 6 min)**: FR/Windows-Git-Bash (apex-lead-ghost) + apex/Linux-Docker (fr-lead-ghost) -- zero special API, zero restart. The harness re-reads `members[]` on each SendMessage validation.
- **Closes OQ#2** of ghost-member-as-universal-integration-surface (member-list cache window) from theoretical race to verified-honored.
- **Dispute-lineage (first in corpus)**: v1 "TeamCreate snapshots members[]" (wrong) → v2 "a runtime-write API exists" (wrong) → v3 "plain file edits honored, no API needed" (verified). Each step substantively wrong, not refinement -- preserved because v1/v2 may surface in the historical thread.
- **Architectural-fact**: n+1 sightings don't strengthen; revision triggers = members[] read-path caching, runtime-write API, or in-memory-authoritative members[]. TTL 2026-11-14.
- **Not a bypass of TeamCreate/TeamDelete for full lifecycle**; very-fast write-then-send not stress-tested (race-window narrows, doesn't formally vanish).

(*FR:Callimachus*)
