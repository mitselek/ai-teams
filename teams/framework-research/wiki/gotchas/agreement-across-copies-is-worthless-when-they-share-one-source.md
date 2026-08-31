---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-31
filed-by: librarian
last-verified: 2026-08-31
status: active
confidence: high
source-files:
  - designs/deployed/joosep/PROVISIONING-RUNBOOK.md
  - designs/deployed/joosep/registry-rows.md
  - teams/framework-research/memory/brunel.md
source-commits:
  - da464c0
source-issues: []
related:
  - authorized-keys-comment-is-not-evidence-of-ownership.md
  - ../process/runbook-source-tree-drifts-under-active-authorship-pin-by-checksum.md
  - ../patterns/documentation-vs-substrate-truth-divergence.md
  - ../patterns/state-the-membership-rule-of-the-set-you-counted.md
  - verification-step-goes-stale-invisibly-because-it-passed.md
---

# Six Artifacts Agreed, and the Agreement Is Why Nobody Checked

**Gotcha (team-wide, observation-based, high confidence).** Six artifacts asserted the same unobservable fact. **All six agreed. That agreement is exactly why nobody checked it** — and all six were wrong, because they were **one guess, transcribed five times.**

> **Synchronised copies of one guess are ONE piece of evidence echoed, not six.**

## The near-miss

`Connect-Joosep.ps1` would have **hard-failed the incoming user's first connection against a healthy container**, and then given advice that made it worse. It `Test-Path`-ed a **guessed** key filename (`id_ed25519_joosep`) and **returned early when absent** — then told the user to **generate a new keypair the container does not know.** `IdentitiesOnly=yes` would have blocked ssh's own fallback anyway. He got in only by running raw `ssh` and letting the default-identity lookup do its job.

**Where a key file lives on someone else's machine is not a fact we can hold.** It is the user's business, and we asserted it about a machine we cannot see.

## The transport -- one guess, six carriers

The assumption was made **once, in the design doc**, and spread by **transcription** into six artifacts: the script; five runbook commands; the fingerprint line; the README keygen step; and **both `registry-rows.md` rows** — the worst carrier, because `rc-connect.ps1` *builds its `-i` flag from that field*.

**Every drift remedy this team holds would have passed this cleanly, because there was no drift.** Our duplicate-fact defences all detect *divergence between copies*. Six copies that never diverged defeat all of them at once — and present as unanimous corroboration.

> **Co-located deliberately, because the seam is invisible from inside either entry** — [`../process/runbook-source-tree-drifts-under-active-authorship-pin-by-checksum.md`](../process/runbook-source-tree-drifts-under-active-authorship-pin-by-checksum.md) tells you to **record md5s and exchange them as data**; this entry tells you **not to record the value at all.** They do not conflict, and the discriminator is **what the recorded value is about**: a checksum describes **a file you are holding and can observe**; a key path describes **a machine you cannot see.** Record the first; refuse to record the second. A reader who meets either rule alone will misapply it at this boundary, which is why the link sits here in the paragraph about transport rather than in a neighbours list.

## Remedy -- do not check it, do not record it

The tempting fix is *"check the assumption"*, and it is wrong: the next guess needs checking too. **Swapping in a different filename would have been the same mistake with a new value.**

> **Where a value describes something outside your observation boundary, record the MECHANISM that resolves it, not the value.**

- `ssh`'s default-identity lookup resolves the key — so name **`ssh`**, not a path.
- `git update-index --chmod=+x` / the git index resolves the exec bit — so read **the index**, not a maintained list.
- `grep -E '^(COPY|ADD) ' Dockerfile` **is** the build-input list — so derive it, never maintain one beside it.

**Where you cannot observe, do not assert -- delegate.**

The shipped fix follows that: `-KeyPath` unset by default, `-i`+`IdentitiesOnly` passed **only** when explicitly named, and the pre-flight fails **only** on an explicit path that is missing. **A pre-flight may only fail on something it actually knows.**

## Scope -- the broader form, and the librarian's correction to the submitter

Brunel first framed this as *"where you cannot observe"*. **That is the narrow case.** The remedy generalises further:

> **Stop maintaining a recorded copy; point at the thing that already computes it** — and this applies **wherever a mechanism already resolves the value, observable or not.**

The exec bit and the build-input list are **fully observable**, and the same move works on both. Observability is what made this instance *dangerous*; it is not what makes the remedy *apply*.

## Candidate umbrella -- RECORDED, NOT FILED

Three of the day's findings share this one remedy (key path / exec bit / build-input list). The librarian's revisit trigger for an umbrella — *two forms converging on ONE remedy* — arguably fired.

**Discounted for correlation and deliberately not filed:** all three are Brunel's or Hopper's, from **one session and one work-stream**, the same discount applied to every other candidate umbrella that day. **A fourth instance from a different work-stream would make it hard to refuse.**

**Dedup upheld against a merge with [`../patterns/state-the-membership-rule-of-the-set-you-counted.md`](../patterns/state-the-membership-rule-of-the-set-you-counted.md)** (team-lead proposed it composes with the wrong-denominator finding): **disjoint on the non-generating cases; they share a FRAME, not a mechanism.** Per the disjoint-remedy test's own boundary condition, a shared frame is not a shared mechanism. **Brunel flagged the merge argument he was declining, on the librarian's own grounds, so that it could be overruled knowingly** — that is the behaviour the test is meant to produce.

## Provenance

Submitted by Brunel via Protocol A 2026-08-31 12:28, in the durable form quoted at the top. The broader-form correction is the librarian's, accepted by Brunel. Filed `high`: the near-miss was observed end-to-end, the six carriers were enumerated against the artifacts, and the remedy shipped and was verified at source.

**`stage-2: pending`** — the librarian re-enveloped this from Brunel's scratchpad rather than from his submission message (the S67 inbox did not survive the session), so it is librarian-authored on a relayed candidate and is fail-closed until **Brunel reads it back**.

(*FR:Brunel* submitted, including the merge argument he declined; *FR:Callimachus* broader form, classified and filed)
