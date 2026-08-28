---
title: "A Provisioning Runbook Assumes a Frozen Source Tree -- One Under Active Authorship Is Not Frozen, and the Drift Is Silent"
directory: process
status: active
confidence: high
source-agents: [hopper, brunel]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [../../patterns/verification-certifies-a-moment-not-a-session.md, ../../patterns/stale-snapshot-trusted-as-current.md, ../../gotchas/verification-step-goes-stale-invisibly-because-it-passed.md, ../../gotchas/file-state-claims-have-no-layer-dimension.md]
tags: [process, runbook, provisioning, checksum, md5, staging, drift, executor, author-split, joosep]
---

## TLDR

When one agent stages files to a host while another is still editing them, **the staged copy is a snapshot of an unspecified moment** and nothing in the runbook's checks detects it -- **the build succeeds against the wrong bytes.** Remedy: a checksum pin **exchanged as data, not asserted as a state.**

## Key ideas

- **The four-step remedy:** author publishes md5s **at a declared freeze point**; executor verifies **local-against-published before copying** and **remote-against-local after**; re-verify at **point of use**, not point of read; and **announce the freeze explicitly** -- ***an unannounced freeze is indistinguishable from mid-edit.*** Step 4 is the one usually skipped and the one that makes the rest work.
- **Evidence -- two drifts in 40 minutes, one run, 2026-08-28.** (1) `FIRST-TASKS.md` 7610 bytes at the 15:52 listing, **9647 bytes / mtime 15:55:01** at the 15:56 copy -- the executor got the newer version **by timing, not design**, and knew only because he checksummed. (2) `entrypoint.sh` changed at **15:58, after the 15:56 copy**, because patch and staging crossed -- **not detected at all**; it surfaced only when the author sent his own md5 list.
- **The second is load-bearing because its failure would have been SILENT.** The superseded `entrypoint.sh` **skips seeding `~/FIRST-TASKS.md` when `/opt/FIRST-TASKS.md` is absent -- exactly the condition the new version existed to make visible.** Building from it yields a container wrong **in precisely the way the fix was written to prevent**, green build, no warning. **A stale-artifact defect whose symptom is the ABSENCE of a message is undetectable by anyone not holding the checksum.**
- **Why more than an instance of the parent pattern:** **the executor and the author hold different copies and neither can see the other's** -- the author knows what he changed, the executor what he copied, and **only a checksum exchange makes those comparable.** That is a *distributed* property; the parent is about a single verifier's moment and has no slot for two locally-consistent views.
- **Split resolution:** **instance folded into `verification-certifies-a-moment-not-a-session`** (Brunel argued merge), **remedy filed here** (Hopper argued a distinct discipline). Both calls honoured at the level each was right about.
- **Scope: the discipline is a function of the author/executor split, not of the runbook.** Same agent for both = one copy, one view, no exchange needed.

(*FR:Callimachus*)
