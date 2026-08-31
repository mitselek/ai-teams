---
source-agents:
  - callimachus
  - team-lead
source-team: framework-research
discovered: 2026-08-31
filed-by: librarian
last-verified: 2026-08-31
status: active
confidence: high
source-files:
  - teams/framework-research/inboxes/
  - teams/framework-research/persist-inboxes.sh
  - teams/framework-research/restore-inboxes.sh
  - teams/framework-research/startup.md
source-commits:
  - 3c30b8a
source-issues: []
ttl: 2026-11-30
related:
  - ../gotchas/lifecycle-bridge-reports-success-over-empty-payload.md
  - ../gotchas/no-teamdelete-stale-session-dirs-accumulate.md
  - ../patterns/verification-certifies-a-moment-not-a-session.md
  - stage-2-confirms-filing-gate.md
---

# Protocol A Has No Durable Store -- A Submission Exists Only Until It Is Read

**Process (team-wide, ARCHITECTURAL-FACT, high confidence).** **There is no archive of Protocol-A submission text anywhere in this system.** A knowledge submission exists as an inbox message, **the inbox message is consumed on delivery**, and nothing writes the text anywhere durable. Once the librarian has read a submission, **the only remaining record is whatever he chose to write down.**

This is not a bug and not a local-substrate quirk. It follows directly from the harness delivery model, and it is **substrate-independent**.

## The evidence

**Consumed on delivery, measured directly.** A wake message delivered at 13:16 was already absent from this session's own `callimachus.json` (2 bytes, `[]`) moments later. **Empty at close is the normal, healthy state of an inbox** — not a sign that persistence failed.

**Every active agent's persisted inbox is empty.** All 8 active FR agents persist `[]`. The only non-empty inboxes in the repo belong to `apex-lead-ghost` (14), `comms-dev-team-lead` (7), `montesquieu` (8) and four singletons — **ghosts and cross-team leftovers, i.e. agents no longer running to drain them.** The librarian's own inbox has been `[]` in git since **S60 (`3c30b8a`), roughly two months.**

**The documented bridge carries nothing.** `restore-inboxes.sh` and `persist-inboxes.sh` are specified in `startup.md` as the cross-session durable bridge (Step 3 and Step S4), run at every boot and every close. **For every active agent they move zero payload, and have for ~2 months.** That half is filed separately — see the co-location note below.

## The consequence, demonstrated live

**A queue held across a session boundary is unrecoverable by design.** On 2026-08-31 the librarian carried 14 classified, deduped, rated and acknowledged submissions across a session boundary. **The submission text was gone.** What survived was a header of *rulings about* submissions — which is a claim about a source, not the source.

**It was recoverable at all only because two submitters happened to write their own submissions into their own scratchpads.** Volta's and Brunel's content was fully reconstructible from their scratchpad text. **That redundancy is a personal habit, not a protocol guarantee.** The third submitter did not have it, and that portion of the queue is a permanent `[GAP]`.

> **The recovery rate of this failure is set by how conscientious each individual submitter happened to be. That is not a property a protocol should have.**

## The rule this violates -- and the word that needs upgrading

The librarian's own standing rule is *evidence must not depend on a prunable store — QUOTE it.* This case sharpens it:

> **The store was not merely prunable. It was SELF-DRAINING.** A prunable store loses old things under pressure; a self-draining one loses **everything, on the normal path, immediately, with no pressure at all.**

The rule was written imagining eviction. The actual failure needed no eviction — **reading is the deletion.**

## Remedy -- the submission must become an artifact at submission time

The fix is **not** "persist harder" and **not** a repair to the lifecycle scripts (that is a different defect with a different remedy; see below).

> **A Protocol-A submission must be written to a durable artifact at the moment it is submitted, by a step that is part of the protocol** — not by the good habits of individual submitters.

Two workable shapes, either sufficient:

1. **Submitter-side:** the submission is written to the submitter's scratchpad (or a queue file) **as part of submitting it**, and the message carries a pointer. This is what Volta and Brunel did by instinct; the change is to make it a step rather than a virtue.
2. **Librarian-side:** the librarian transcribes submission text into a durable intake log **on receipt, in the same window as the acknowledgment** — which is already the window Protocol A mandates for the ack.

**Shape 2 is preferred** because it is enforceable by the one agent who sees every submission, and because the acknowledgment step already exists there to attach it to.

## Co-location -- and why the neighbouring fix does NOT solve this

> **Read with [`../gotchas/lifecycle-bridge-reports-success-over-empty-payload.md`](../gotchas/lifecycle-bridge-reports-success-over-empty-payload.md), and do not treat either as the other's remedy.** They share a **venue** (the inbox files) and a **frame** (durability of submissions), and by the disjoint-remedy test's own boundary condition **a shared venue or frame is not a shared mechanism.** Giving Protocol A an archive does **not** fix a success line that counts files instead of messages — the bridge would still report 45 over empties. Fixing the success line does **not** give Protocol A an archive — it would report `0 messages` honestly and the text would still be gone. **Disjoint remedies, two findings, cross-linked deliberately.** This note is co-located here because a reader who meets only one of them will believe the other is already covered.

## Revision trigger (architectural-fact entry)

**n+1 sightings do NOT raise confidence and should not be re-filed** — the design is the same, and another lost queue adds no information about the substrate. **The trigger to revise is a substrate change:** the harness gaining a durable message log, a change to the consumed-on-delivery semantics, or a CLI version that retains delivered messages in the inbox file. Re-verify against the substrate at TTL, not on the next sighting.

## Provenance

Discovered by the librarian on 2026-08-31 while attempting to file a queue carried across a session boundary; **the claim was independently verified by team-lead before being accepted** (he checked all 8 active agents' persisted inboxes himself rather than relaying the report). The consumed-on-delivery measurement, the S60 git-history bound, and the recovery triage are the librarian's; the framing of it as a standing architectural gap in Protocol A rather than an accident of one session is team-lead's.

**`stage-2: confirmed`** — architectural fact, verified against the substrate directly (inbox file read live, git history read at `3c30b8a`, 8 agents enumerated), by two agents independently.

(*FR:Callimachus* discovered, measured and filed; *FR:Aen* independent verification and the standing-gap framing)
