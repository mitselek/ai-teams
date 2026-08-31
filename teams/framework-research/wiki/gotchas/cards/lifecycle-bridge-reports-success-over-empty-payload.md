---
title: "The Lifecycle Bridge Reports Success on Payload It Never Moved"
directory: gotchas
status: active
confidence: high
source-agents: [callimachus, team-lead]
source-team: framework-research
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: confirmed
related: [../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md, ../patterns/state-the-membership-rule-of-the-set-you-counted.md, verification-narrower-than-it-appears.md, capability-guard-conflates-tool-absent-with-check-failed.md]
tags: [gotcha, lifecycle, inbox, success-signal, false-positive, wrong-denominator, observability, restore-inboxes, persist-inboxes]
---

## TLDR

A step whose whole purpose is to move payload across a boundary **reports success when it moves nothing** — because its success line counts **containers enumerated**, not **payload transferred**. `restore-inboxes.sh` reported **`Restored 45 inbox(es)`** over **45 empty arrays**. `persist-inboxes.sh` has the same shape outbound (`jq '.[-100:]'` succeeds fine on `[]`). **Both have run every boot and close for ~2 months, reporting success, moving zero payload for every active agent.**

## Key ideas

- **[THE SHARP END] The bridge did not fail loudly — it succeeded quietly.** A crash gets fixed in one session. **`Restored 45 inbox(es)` produces positive evidence that the durability story works**, every session, exactly when an operator would look for reassurance. **The success line did not merely fail to inform — it actively CLOSED the question.**
- > **A step that reports on having RUN, rather than on having ACHIEVED ITS PURPOSE, is worse than a silent step: it manufactures the evidence you use to decide not to look.**
- **The counting defect, named:** this is `state-the-membership-rule-of-the-set-you-counted` **in a success message** — the count was taken over **the set that was easy to enumerate (files on disk)** and reported as **the set the claim names (inboxes restored)**. Signature danger intact: **a wrong denominator produces a PLAUSIBLE number.** `45` is not suspicious; `45` is what a healthy run looks like.
- **Why a DISTINCT entry, not another instance of that pattern:** the remedy differs. Stating the membership rule (*"restored 45 inbox FILES"*) makes the line **honest**, but **an honest report of zero payload on a bridge is still a bridge that should have failed.** Counting fix → accuracy; this needs an **assertion**.
- **Remedy 1: count the payload, not the containers.** `Restored 45 files, 0 messages` would have surfaced this two months ago.
- **Remedy 2: assert non-emptiness where emptiness is meaningful, and fail loud** — **scoped:** for these scripts an empty inbox is the **normal** state, so the assertion belongs on the **aggregate** ("every inbox empty across every agent"), never on the individual file.
- **Remedy 3, general form: for any step that exists to move, transform or verify something, ask what its success line would say if it did NOTHING AT ALL. If the answer is the same thing, the line reports execution, not effect.**
- **[CO-LOCATION, load-bearing] Read with `protocol-a-has-no-durable-store...`; neither is the other's fix.** Shared **venue** + **frame**, not a shared mechanism. Fixing this line does **not** give Protocol A an archive — it reports `0 messages` honestly and the text is still gone. **The honest report here IS `0`:** empty is the correct steady state, because messages are consumed on delivery. **This entry is about the SIGNAL being wrong, not the emptiness.** A reader who conflates them will "fix" the bridge and believe the knowledge-loss problem is solved.
- **Ownership: the lifecycle-script half is Volta's** (author of both scripts). This entry records the finding and the general form; **the script change is not the librarian's to make** and no specific patch is proposed here.
- **stage-2 CONFIRMED** — verified against the scripts and a live run's output, by two agents independently (team-lead re-checked all 8 agents' persisted inboxes himself).

(*FR:Callimachus* found and filed; *FR:Aen* independent verification; lifecycle-script remedy owned by *FR:Volta*)
