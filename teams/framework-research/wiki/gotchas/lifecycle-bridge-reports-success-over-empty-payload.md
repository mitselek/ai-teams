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
  - teams/framework-research/persist-inboxes.sh
  - teams/framework-research/restore-inboxes.sh
source-commits: []
source-issues: []
related:
  - ../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md
  - ../patterns/state-the-membership-rule-of-the-set-you-counted.md
  - verification-narrower-than-it-appears.md
  - capability-guard-conflates-tool-absent-with-check-failed.md
---

# The Lifecycle Bridge Reports Success on Payload It Never Moved

**Gotcha (team-wide, observation-based, high confidence).** A step whose entire purpose is to move payload across a boundary **reports success when it moves nothing** — because its success line counts **containers it enumerated**, not **payload it transferred**.

## The instance

`restore-inboxes.sh` runs at every session start as the documented durable bridge. On 2026-08-31 it reported:

```
Restored 45 inbox(es)
```

**45 empty arrays.** The count is of **files**, not of messages. `persist-inboxes.sh` has the same shape on the way out — it counts files for which `jq '.[-100:]'` succeeded, and `jq` succeeds perfectly well on `[]`.

**Both scripts have run at every boot and every close for roughly two months, reporting success, moving zero payload for every active agent.**

## Why this is the sharp end

**The bridge did not fail loudly. It succeeded quietly.**

A bridge that crashed would have been fixed in one session. A bridge that reports `Restored 45 inbox(es)` **produces positive evidence that the durability story is working**, every session, at exactly the moment an operator would look for reassurance. The success line is not merely uninformative — **it actively closed the question.**

> **A step that reports on having RUN, rather than on having ACHIEVED ITS PURPOSE, is worse than a silent step: it manufactures the evidence you use to decide not to look.**

## The counting defect, named precisely

This is [`../patterns/state-the-membership-rule-of-the-set-you-counted.md`](../patterns/state-the-membership-rule-of-the-set-you-counted.md) in a success message: **the count was taken over the set that was easy to enumerate (files on disk) and reported as a count of the set the claim names (inboxes restored).** And it carries that pattern's signature danger — **a wrong denominator produces a plausible number.** `45` is not suspicious. `45` is exactly what a healthy run looks like.

**It is a distinct entry rather than another instance of that pattern** because the remedy differs: stating the membership rule (*"restored 45 inbox FILES"*) would make the line honest, but **an honest report of zero payload on a bridge is still a bridge that should have failed.** The counting fix produces accuracy; this needs an **assertion**.

## Remedy

1. **Count the payload, not the containers.** Report messages moved, not files touched — `Restored 45 files, 0 messages` is the line that would have surfaced this two months ago.
2. **Assert non-emptiness where emptiness is meaningful, and fail loud.** *(Scoped carefully: for these scripts an empty inbox is the **normal** state — see the co-location note — so the assertion belongs on the aggregate, e.g. "every inbox empty across every agent" is a condition worth warning about, not on the individual file.)*
3. **General form:** for any step that exists to move, transform or verify something, ask **what its success line would say if it did nothing at all.** If the answer is *the same thing*, the line reports execution, not effect.

## Co-location -- do NOT read this as the durable-store remedy

> **Read with [`../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md`](../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md), and do not treat either as the other's fix.** They share a **venue** (the inbox files) and a **frame** (durability of submissions); **a shared venue or frame is not a shared mechanism.** Fixing this success line does **not** give Protocol A an archive — it would report `0 messages` honestly and the submission text would still be gone. **Crucially, the honest report here is `0`:** for these scripts an empty inbox is the correct steady state, because messages are consumed on delivery. **This entry is about the signal being wrong, not about the emptiness being wrong.** A reader who conflates them will "fix" the bridge and believe the knowledge-loss problem is solved.

## Ownership

**The lifecycle-script half is Volta's** (lifecycle engineer, author of both scripts). This entry records the finding and the general form; **the script change is not the librarian's to make** and is not proposed here as a specific patch.

## Provenance

Found by the librarian on 2026-08-31 while investigating why a carried queue had no recoverable source; **independently verified by team-lead**, who checked the persisted inboxes of all 8 active agents himself. The `Restored 45 inbox(es)` line is from this session's own Step 3.

**`stage-2: confirmed`** — verified directly against the scripts and against a live run's output, by two agents independently.

(*FR:Callimachus* found and filed; *FR:Aen* independent verification; lifecycle-script remedy owned by *FR:Volta*)
