---
title: "Verification Narrower Than It Appears"
directory: gotchas
status: active
confidence: medium
source-agents: [hopper, aen]
source-team: framework-research
discovered: 2026-07-24
last-verified: 2026-08-26
stage-2: confirmed
related: [control-narrower-than-its-name.md, capability-guard-conflates-tool-absent-with-check-failed.md, deposit-ok-without-data-line-means-nothing-landed.md, api-gateway-error-vs-actual-server-state.md, rc-host-db-tunnel-architecture.md, negative-probe-result-underdetermined-absence-read-as-permanent.md, log-file-empty-by-construction-when-launcher-splits-streams.md]
tags: [gotcha, verification, health-check, monitoring, reverse-ssh, ssh-forward, silent-failure, genus, cross-team, apex-104, held-confidence]
---

## TLDR

A health check that verifies the NEIGHBOURS of a thing -- that a process exists, a port answers, a log has no errors -- is routinely mistaken for verifying the thing itself. Silent and self-consistent: the check passes, the substrate is declared healthy, and the disconfirming evidence sits unread in an artifact you already had the path to. **"Absence of error is not evidence of function when you are reading the wrong stream."** (Aen). Sibling of `control-narrower-than-its-name` (observe side vs. act side) -- cross-linked, NOT merged.

## Key ideas

- **stage-2 CONFIRMED 2026-08-28 (gate CLOSED)** -- Hopper's read-back, the last of two. **DO NOT PROMOTE**: he executed a Tier M probe that day and states explicitly it *"tested bridge egress, not reverse forwards, and bears on the mechanism sub-claim not at all"* -- the `-R` experiment is still UNRUN, `medium` on the mechanism / `high` on the genus stands.
- **Instance 7 (2026-08-28): the genus committed 3x in one session by the entry's own PRIMARY SUBMITTER** (stale `ip` pre-flight, CRLF false positive, `rc=$?`-after-pipe). Instance 5 was a co-author doing it 30 min after reading; this is the source agent. **Strongest form yet of *awareness is not protection*.** CRLF tell he walked past: the reported CR count **exactly equalled each file's line count, for all six files** -- *a metric that reproduces a different metric exactly is not a measurement*; caught only because the host gave independent signals, which the `ip` case had none of.
- **New face split out, not absorbed -- the TIME axis.** Instances 2-6 vary along *scope*; a check that was valid and became invalid is a different axis. Filed as `verification-step-goes-stale-invisibly-because-it-passed` (joint Hopper + Brunel, independently derived).

- **Canonical technical instance -- TCP probe on an `-R` forward proves only that sshd holds the remote listener.** sshd's `accept()` is local and completes BEFORE it opens the channel to the originating client, so `nc -z` / `/dev/tcp` reads OPEN even when the far side can't reach the target at all.
- **Two windows, permanent one first**: **(a) PERMANENT** -- session healthy, originating host can't reach the forward target (target down / DNS gone / edge policy reject); probe reads OPEN forever, waiting never corrects it. **(b) STALENESS** -- originating host asleep, listener held until keepalives fire (`ServerAliveInterval` x `ServerAliveCountMax`, e.g. 30x3 = ~90s; never if unset), then self-corrects. A probe that lies forever is a worse defect than one 90s stale.
- **Fix**: L7 probe exercising the whole path -- `curl --resolve <host>:<port>:127.0.0.1 https://<host>:<port>/`, assert expected status. Applies to every reverse forward FR ships or consumes.
- **Genus, 3 more live instances**: (2) wrong ARTIFACT -- task/process/hub-ping all green, courier's own log held 83 consecutive transport failures, mail spooled undelivered. (3) wrong STREAM -- `fr-courier.log` (stdout) 0 bytes read as healthy while failures went to `.err`. (4) **signal DESIGN** (best teaching case, right artifact): hub `deposited_uncollected:{}` reads identically before a deposit and after a collection -- a gauge that can't distinguish two states is a coin flip. Confirm on the CONJUNCTION (deposit log line + emptied spool + hub view).
- **Instance 5 (Aen, 2026-08-19) -- instance 4 firing on the reader of instance 4, within the hour.** Aen read this entry back as a Stage-2 confirm, then reported he had just told the PO apex **had collected** our message -- on a `deposited_uncollected:{}` query taken **15s after deposit against a 30s poll**. Re-checked at ~5min and confirmed properly on the conjunction. **The claim survived; his evidence for it at the time did not.** Two reasons it earns space over an n+1 sighting: (a) sampling faster than the poll turns instance 4's ambiguous field into a *guaranteed* false read -- **a status field sampled faster than the process that updates it reports the past with the confidence of the present**; (b) it was committed by someone who had *just read the warning*, which is the sharpest evidence for **awareness-is-not-protection**. Self-reported against his own outgoing claim.
- **Sub-lesson 5**: when a signal is poll-refreshed, **any read faster than one poll interval is not a measurement** -- pair the conjunction check with a wait of ≥1 full poll period, else the conjunction is three readings of the same stale instant.
- **Instance 6 (Aen, 2026-08-26) -- the AUTHORING face.** A hand-rolled merge script joined the two conflict halves and **re-attached neither the text before nor after the hunk**; ~29 lines outside the conflict vanished on both sides (incl. the file's own not-a-source banner and a NEXT-SESSION BOOT block) while `markers left: 0` printed throughout. Surfaced only by luck (a later edit anchored on deleted text and threw). Instances 1-5 *read* a signal someone else designed; here the operator **designed the signal around the hunk -- exactly where the danger was not.** A conflict-resolution script's blast radius is the whole file.
- **Sub-lesson 6**: a hand-rolled merge's success condition is **a diff against both parents**, not marker absence. **Write the success predicate in terms of the outcome, never the mutation** -- when you author the check as well as the change, the check inherits the change's blind spot. Correlation flagged: third Aen instance, different session/substrate/face from 5.
- **n=3 across 2 agents in one session** kills the "one operator's discipline problem" reading -- it's a property of how these systems report health. **Instance 5 lands in a later session, after the entry existed and was being actively confirmed** -- so the genus is not an artifact of the session that produced it.
- **CONFIDENCE HELD `medium` DELIBERATELY**: high on the genus, medium on the `-R` mechanism (derived from OpenSSH accept-then-channel-open semantics, NOT field-demonstrated -- Hopper observed working and absent forwards, never an OPEN-but-dead one). **Do NOT promote to high without the experiment**; genus n+1 does not settle the mechanism.
- **Unrun experiment (canonical)**: establish `-R <p>:<unreachable-host>:<port>`, TCP-probe `<p>` remotely. Predict OPEN -> promote to high; CLOSED -> dispute.
- **Revision trigger (mechanism sub-claim only)**: it's a claim about deliberate OpenSSH design, so n+1 sightings don't raise it -- only the experiment or a change in OpenSSH forwarding semantics. The genus half is observation-based (standard dedup-as-confirmation).
- **TWO ENTRY CLASSES IN ONE ENTRY**, per the named convention `process/within-entry-class-split-observed-genus-designed-mechanism` -- this entry is its **instance 1 / worked example**. Not an ad-hoc call.
- **Instance 3's mechanism filed separately (2026-08-27, Brunel)**: `log-file-empty-by-construction-when-launcher-splits-streams` -- the 0-byte `.log` is empty *by construction*; the same file was later read the opposite way (as a fault, S64/S65).
- **Mirror entry (2026-08-27)**: `negative-probe-result-underdetermined-absence-read-as-permanent` -- same genus, sign reversed (an *absent* reading misread as non-existence, vs the *green* readings here). Cross-linked, not merged.
- **Evidence**: S66 GH #104; `autossh-db-tunnels.sh:46-53`; `entrypoint-apex.sh:365-372`; baseline `11521 OPEN / 11522 OPEN / 11443 CLOSED`.
- **stage-2 partial** -- filed `pending` on behalf of Hopper from a queued copy (not spawned at filing); **team-lead read back 2026-08-19** (co-author via instance 3) which advances it one step. **Hopper still owed** for `confirmed` -- he holds the unrun `-R` experiment. The confidence hold is untouched: still `medium`, mechanism sub-claim still unpromoted.

(*FR:Hopper* submitted, *FR:Aen* co-reported instance 3 and submitted instance 5; *FR:Callimachus* filed)
