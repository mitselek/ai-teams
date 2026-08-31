---
title: "Six Artifacts Agreed, and the Agreement Is Why Nobody Checked"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
related: [authorized-keys-comment-is-not-evidence-of-ownership.md, ../process/runbook-source-tree-drifts-under-active-authorship-pin-by-checksum.md, ../patterns/documentation-vs-substrate-truth-divergence.md, ../patterns/state-the-membership-rule-of-the-set-you-counted.md, verification-step-goes-stale-invisibly-because-it-passed.md]
tags: [gotcha, duplication, transcription, false-corroboration, observation-boundary, ssh, key-path, derive-dont-record, joosep, umbrella-candidate]
---

## TLDR

Six artifacts asserted the same **unobservable** fact. **All six agreed, and that agreement is exactly why nobody checked** — they were **one guess, transcribed five times.** **Synchronised copies of one guess are ONE piece of evidence echoed, not six.** Remedy is not *check the assumption* (the next guess needs checking too) but **do not record it: where a value describes something outside your observation boundary, record the MECHANISM that resolves it.** *Where you cannot observe, do not assert — delegate.*

## Key ideas

- **The near-miss:** `Connect-Joosep.ps1` would have **hard-failed the user's first connection against a HEALTHY container** and then made it worse — it `Test-Path`-ed a **guessed** key filename, **returned early when absent**, and told him to **generate a keypair the container does not know**. `IdentitiesOnly=yes` would have blocked ssh's own fallback anyway. He got in only via raw `ssh` + default-identity lookup.
- **Transport: one guess, six carriers.** Made **once in the design doc**, transcribed into script + 5 runbook commands + fingerprint line + README keygen + **both `registry-rows.md` rows** — worst carrier, since `rc-connect.ps1` **builds its `-i` flag from that field**.
- **[WHY EVERY DEFENCE WE HOLD FAILED] Our duplicate-fact remedies all detect DRIFT BETWEEN COPIES. There was none.** Six copies that never diverged defeat all of them at once **and present as unanimous corroboration.**
- **[SEAM, co-located on purpose — invisible from inside either entry] `runbook-source-tree-drifts...pin-by-checksum` says RECORD md5s and exchange them; this entry says DO NOT record the value.** No conflict. **Discriminator = what the recorded value is ABOUT:** a checksum describes **a file you hold and can observe**; a key path describes **a machine you cannot see.** Record the first, refuse the second. A reader meeting either rule alone misapplies it here.
- **Remedy, concretely — name the mechanism, not the value:** `ssh`'s default-identity lookup resolves the key; the **git index** resolves the exec bit; `grep -E '^(COPY|ADD) ' Dockerfile` **IS** the build-input list. Shipped fix: `-KeyPath` unset by default, `-i`+`IdentitiesOnly` only when explicitly named, pre-flight fails **only** on an explicit path that is missing. **A pre-flight may only fail on something it actually knows.**
- **[LIBRARIAN'S CORRECTION, accepted] "Where you cannot observe" is the NARROW case.** Broader form: **stop maintaining a recorded copy; point at the thing that already computes it** — applies **wherever a mechanism already resolves the value, observable or not.** Exec bit and build-input list are fully observable and the same move works. **Observability made this instance dangerous; it is not what makes the remedy apply.**
- **[CANDIDATE UMBRELLA — RECORDED, NOT FILED]** Three of the day's findings share this one remedy (key path / exec bit / build-input list); the revisit trigger arguably fired. **Discounted for correlation:** all three Brunel's or Hopper's, **one session, one work-stream.** **A 4th instance from a different work-stream would make it hard to refuse.**
- **Dedup UPHELD against merging with `state-the-membership-rule-of-the-set-you-counted`** (team-lead proposed it): **disjoint on non-generating cases; shared FRAME, not shared mechanism** — the disjoint-remedy test's own boundary condition. **Brunel flagged the merge argument he was declining, on the librarian's own grounds, so it could be overruled knowingly.**
- **Confidence `high`**: near-miss observed end-to-end, six carriers enumerated against the artifacts, remedy shipped and verified at source (`da464c0`).
- **stage-2 PENDING** — librarian re-enveloped from Brunel's scratchpad, not his submission (S67 inbox did not survive); fail-closed until **Brunel reads it back**.

(*FR:Brunel* submitted, including the merge argument he declined; *FR:Callimachus* broader form, classified and filed)
