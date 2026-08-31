---
title: "A Provisioning Runbook Assumes a Frozen Source Tree -- One Under Active Authorship Is Not Frozen, and the Drift Is Silent"
directory: process
status: active
confidence: high
source-agents: [hopper, brunel, volta]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-31
stage-2: partial
related: [../../patterns/verification-certifies-a-moment-not-a-session.md, ../../patterns/stale-snapshot-trusted-as-current.md, ../../gotchas/verification-step-goes-stale-invisibly-because-it-passed.md, ../../gotchas/file-state-claims-have-no-layer-dimension.md]
tags: [process, runbook, provisioning, checksum, md5, staging, drift, executor, author-split, joosep, blob-vs-worktree, portability, locale, exposure-not-function]
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

- **[AMENDMENT 2026-08-31, Brunel] THE PIN IS THE md5 OF A FILE.** *The md5 of a FILE is portable; the md5 of `md5sum`'s OUTPUT is not* -- an aggregate/dir digest **hashes a tool's PRESENTATION of the tree**, which is platform- and locale-dependent.
- **(1) Hash the BLOB, not the worktree, on this box.** Brunel's own 11:27 claim to team-lead (*a `--chmod=+x` changes what git records without changing the file, so an attested package can be chmod-fixed mid-flight*) is **true of the BLOB, FALSE of the WORKTREE** -- he corrected it himself at 12:50. Measured: 5/6 files `blob == worktree`; `joosep.sh` worktree `2f9d0005…` vs blob `83eda299…`, `file(1)` says CRLF -- **the only file that got the chmod**, re-materialised through `autocrlf`. **A worktree-md5 gate WOULD have false-STOPped.** Use `git show :<path>`. *Sub-lesson:* `grep -c $''` said 0 while `file(1)` said CRLF -- **`file(1)` is the authority.**
- **(2) Aggregate digests are NOT portable.** (a) MSYS prints `<hash> *<path>` (binary-mode asterisk), Linux two spaces; (b) `sort` collation is locale-dependent (`README.md` 8th under UTF-8, 1st under `LC_ALL=C`). **Same tree, three digests:** `e78b95ab` / `f7bd4961` / `c6612097`. **USE THE PER-FILE MANIFEST AS THE GATE** -- catches all the digest does **and names the offender**.
- **[THE DISCRIMINATOR, generalises past digests] The hazard is never the FUNCTION, it is the EXPOSURE. Ask "do the two operands cross a boundary?", never "is it a digest?"** Keeps the rule from over-firing: the entrypoint's own `dir_digest` (Step 9c) is **SAFE, do NOT "harmonise" it** -- same code, same box, no boundary crossed.
- **3rd instance same day, blast radius INVERTED** (Volta's `_has_live_session`): in `resolve_team_dir` a false negative drops a candidate and **fails loud**; in the OQ10 stale-dir sweep the identical false negative **deletes a live session's dir, silently.** Same predicate, opposite consequence.
- **Related trap (Hopper):** wrong cwd makes `find | xargs md5sum` hash an **empty stream** -> `d41d8cd98f00b204e9800998ecf8427e`, **valid-looking hex on total absence.**
- **stage-2 PARTIAL** -- 2026-08-28 body stays `confirmed`; the **2026-08-31 amendment is `pending`** (librarian re-enveloped from Brunel's scratchpad, not his submission; S67 inbox did not survive). Fail-closed until **Brunel reads it back**.

(*FR:Callimachus*)
