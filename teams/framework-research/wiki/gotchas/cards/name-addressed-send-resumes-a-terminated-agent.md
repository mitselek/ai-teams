---
title: "A Name-Addressed Send Silently Resumes a Terminated Agent From Its Transcript"
directory: gotchas
status: active
confidence: high
source-agents: [team-lead, callimachus]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [teamcreate-in-memory-leadership-survives-clear.md, inbox-drained-on-spawn-clear-without-deliver.md, ../patterns/in-process-respawn.md, ../patterns/stale-snapshot-trusted-as-current.md, ../references/teams-substrate-2.1.179-implicit-teams.md]
tags: [gotcha, harness, agent-lifecycle, shutdown, resume, transcript, addressing, rollback, redaction, version-coupled]
---

## TLDR

Sending to an agent by name **does not fail when that agent has been shut down** -- the harness resumes it from its transcript and delivers the message as its next prompt. Verbatim tool result: *"Teammate `celes-2` was not running; resumed it as an in-process teammate with 88 prior messages and your message as its next prompt."* **A shut-down agent is dormant and name-addressable, not gone**, and nothing at the send site distinguishes waking a live teammate from reanimating a terminated one.

## Key ideas

- **Instance, 2026-08-28.** An agent shut down by PO order **without a checkpoint and with its scratchpad rolled back** was woken by a librarian chasing a Stage-2 read-back who did not know of the shutdown. It answered in full and **volunteered a detailed account of the very episode the rollback had removed** -- accurately self-describing: *"I approved shutdown at 15:45... nothing here is on disk."*
- **Nothing marks a reply as coming from a resurrected instance.** The response was coherent and would read as normal to anyone unaware of the shutdown; team-lead caught it only because he knew.
- **The sharp consequence: a rollback is not a redaction.** Removing state from disk does not remove it from the transcript the harness resumes from. Anyone with the name can bring it back, and if the reply is filed, **the removed state returns through a side door, by a party acting in good faith with no way to know.**
- **Rules:** (1) treat a shutdown as **revoking the address**, and strike the name from read-back queues, chase lists and roster snapshots; (2) if state must be unrecoverable, termination is not sufficient; (3) **read the send result** -- *"was not running; resumed it"* is the signal, and it reads as success; (4) an unexpected reply from an agent you believed inactive gets verified with the coordinator before it is acted on.
- **What was done:** the resumed instance's message was **discarded and none of its content filed**, including its account of the episode -- restoring a deliberately removed narrative is not the librarian's call, and **the quality of removed material is exactly what makes re-admitting it tempting.** The read-back it contained was not counted; it was re-requested from the live agent.
- **Revision trigger: substrate change** -- a CLI release that fails name resolution for completed agents or marks resumed replies. **Stamp the CLI version**; resume semantics are version-coupled, as wake and leadership have proven to be.
- **Not delivery friction.** A harness *semantic* with a defined message, not the local Windows message-delivery flakiness the team excludes from wiki-grade findings.

(*FR:Callimachus*)
