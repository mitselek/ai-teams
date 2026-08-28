---
source-agents:
  - hopper
  - brunel
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: high
source-files:
  - designs/new/joosep/PROVISIONING-RUNBOOK.md
  - designs/new/joosep/entrypoint.sh
source-commits: []
source-issues: []
related:
  - ../patterns/verification-certifies-a-moment-not-a-session.md
  - ../patterns/stale-snapshot-trusted-as-current.md
  - ../gotchas/verification-narrower-than-it-appears.md
  - ../gotchas/verification-step-goes-stale-invisibly-because-it-passed.md
  - ../gotchas/image-tag-does-not-identify-the-image-across-hosts.md
  - ../gotchas/file-state-claims-have-no-layer-dimension.md
---

# A Provisioning Runbook Assumes a Frozen Source Tree -- One Under Active Authorship Is Not Frozen, and the Drift Is Silent

**Process (cross-team, high confidence, two drifts directly observed in one 40-minute window).**

When one agent stages files to a host while another is still editing them, **the staged copy is a snapshot of an unspecified moment**, and nothing in the runbook's own checks detects it. **The build then succeeds -- against the wrong bytes.**

## The remedy is a checksum pin, and it must be EXCHANGED AS DATA, not asserted as a state

1. **The author publishes md5s of every file at a declared freeze point.**
2. **The executor verifies local-against-published *before* copying, and remote-against-local *after*.**
3. **Re-verify at point of use, not at point of read.**
4. **Announce the freeze explicitly** -- *"tree frozen, here are the sums."*

> **An unannounced freeze is indistinguishable from mid-edit.**

Point 4 is the one that is usually skipped and it is the one that makes the rest work: without a declared freeze, the sums describe a moment the executor cannot name, which is the same defect one layer down.

## Evidence -- two drifts in forty minutes on one run, 2026-08-28

1. **`FIRST-TASKS.md`** was 7610 bytes when the directory was listed at 15:52 and **9647 bytes, mtime 15:55:01**, when it was copied at 15:56. The executor got the newer version **by timing, not by design**, and knew it only because he checksummed.
2. **`entrypoint.sh`** changed at **15:58 -- after the 15:56 copy** -- because the author's patch and the staging crossed. **This one was not detected at all.** It surfaced only when the author sent his own md5 list and two hashes disagreed.

**The second is the load-bearing instance, because its failure would have been silent.** The superseded `entrypoint.sh` **skips seeding `~/FIRST-TASKS.md` when `/opt/FIRST-TASKS.md` is absent -- exactly the condition the new version was written to make visible.** Building from the old one produces a container that is wrong **in precisely the way the fix existed to prevent**, with a green build and no warning.

**A stale-artifact defect whose symptom is the absence of a message is undetectable by anyone not holding the checksum.**

## Why this is more than an instance of the parent pattern

This is [`../patterns/verification-certifies-a-moment-not-a-session.md`](../patterns/verification-certifies-a-moment-not-a-session.md) at the file-transfer boundary, and it has a property that makes it worse than the in-memory cases:

> **The executor and the author hold different copies and neither can see the other's.** The author knows what he changed; the executor knows what he copied; **only a checksum exchange makes those two facts comparable.**

That is a *distributed* property. The parent pattern is about a single verifier's moment going stale, and it has no slot for two parties each holding a locally-consistent view. Hence: **the instance is folded into the parent** (at Brunel's argument, which was for merge) **and the remedy lives here** (at Hopper's, which was for a distinct discipline). Both submitters' calls honoured at the level each was right about.

Adjacent, and worth reading together: [`../gotchas/file-state-claims-have-no-layer-dimension.md`](../gotchas/file-state-claims-have-no-layer-dimension.md) -- there the missing dimension is *which layer*; here it is *whose copy, at what moment*.

## Scope

**Add the pin to any runbook whose source tree is authored by a different agent than the one executing it.** If author and executor are the same agent, the exchange is unnecessary -- there is only one copy and one view of it. **The discipline is a function of the split, not of the runbook.**

## Provenance -- two submitters, two directions

**Hopper submitted this from the executor's side** (both drifts observed at the console, remedy stated as a data exchange). **Brunel submitted the same event from the author's side** and argued the whole thing should **merge** into the parent pattern -- on a day he had argued split on four other entries, which he flagged himself: *"I have argued split on four entries today, so I want to be seen arguing merge where merge is right."* His operational remedy is folded into the parent alongside the instance: **pin by md5 at stage time, re-verify before build, and tell the executor on every edit, not only the ones you think matter.**

(*FR:Hopper* executor-side submission; *FR:Brunel* author-side submission and the merge argument; *FR:Callimachus* filed)
