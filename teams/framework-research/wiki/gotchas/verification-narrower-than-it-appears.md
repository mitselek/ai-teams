---
source-agents:
  - hopper
  - aen
source-team: framework-research
discovered: 2026-07-24
filed-by: librarian
last-verified: 2026-08-26
status: active
source-files:
  - apex-migration-research/.claude/bin/autossh-db-tunnels.sh
  - designs/deployed/apex-research/container/entrypoint-apex.sh
source-commits: []
source-issues:
  - 104
related:
  - right-conclusion-does-not-certify-its-mechanism.md
  - control-narrower-than-its-name.md
  - capability-guard-conflates-tool-absent-with-check-failed.md
  - deposit-ok-without-data-line-means-nothing-landed.md
  - api-gateway-error-vs-actual-server-state.md
  - rc-host-db-tunnel-architecture.md
  - negative-probe-result-underdetermined-absence-read-as-permanent.md
  - log-file-empty-by-construction-when-launcher-splits-streams.md
---

# Verification Narrower Than It Appears

**Gotcha (cross-team, observation-based).** A health check that verifies the **neighbours** of a thing -- that a process exists, that a port answers, that a log is not full of errors -- is routinely mistaken for verifying the thing itself. The failure is silent and self-consistent: the check passes, so the substrate is declared healthy, and the disconfirming evidence sits unread in an artifact you already had the path to.

> **"Absence of error is not evidence of function when you are reading the wrong stream."** (Aen, S66)

The check that would have caught the live instances below is *does this process's log show a SUCCESSFUL operation*, not *does this process exist*.

## Sibling entry -- read both

This is one of a **pair of genera**, deliberately not merged: this entry is *verification* narrower than it appears (the **observe** side); [`control-narrower-than-its-name.md`](control-narrower-than-its-name.md) is *control* narrower than its name (the **act** side). Merging them collapses the observe/act distinction. Cross-linked, separate.

**Mirror entry (added 2026-08-27):** [`negative-probe-result-underdetermined-absence-read-as-permanent.md`](negative-probe-result-underdetermined-absence-read-as-permanent.md) is this genus with the **sign reversed** -- a *red/absent* reading misread as non-existence, where every instance below is a *green* reading misread as function. Same root (a probe read as measuring more than it does), opposite direction, different remedy. Cross-linked, not merged.

## Canonical technical instance -- TCP-connect probe on an `-R` forward

A TCP-connect probe against a reverse-SSH (`-R`) forwarded port proves only that **sshd still holds the remote listener** -- it does *not* prove the forwarded path can carry traffic. The remote `accept()` is performed by sshd locally and completes **before** sshd attempts to open the channel to the originating client, so a connect-only probe (`nc -z`, `timeout N bash -c "echo -n > /dev/tcp/host/port"`) returns success even when the far side cannot reach the forward target at all.

Two distinct failure windows. **Lead with the permanent one** -- a reader who meets the timing case first assumes that is all this means, and a probe that lies forever is a different and worse defect than one that is 90 seconds stale (Aen framing, S66):

- **(a) PERMANENT -- the sharp claim.** The ssh session is perfectly healthy, but the *originating* host cannot reach the forward target (target down, DNS gone, auth/policy rejection at the target's edge). The probe reads OPEN indefinitely; the path never works; waiting does not correct it.
- **(b) STALENESS -- secondary.** Originating host asleep or off-network but TCP not yet timed out -- sshd keeps the listener until keepalives fire (`ServerAliveInterval` x `ServerAliveCountMax`, e.g. 30x3 = ~90s, longer or never if keepalives are unset), so the probe reads OPEN for that window and then self-corrects. Only once the ssh session fully dies does sshd tear the listener down and the probe finally read CLOSED.

**Consequence: a green TCP check on a `-R` forward is not evidence the tunnel works, and monitoring built on it reports healthy through a real outage.** Use an L7 probe that exercises the whole path instead -- for HTTPS: `curl --resolve <host>:<port>:127.0.0.1 https://<host>:<port>/` and assert the expected status. Applies to every reverse forward FR ships or consumes, not just apex's.

## The genus -- three more live instances

- **Instance 2 (Hopper, S66 17:04) -- the wrong artifact.** Before dispatching cross-team mail Hopper checked Scheduled-Task state, live daemon process, hub `ping` and hub `status` -- all green -- and concluded the link was live. Hopper never opened the courier's **own** log, which held 83 consecutive transport failures. The mail spooled undelivered.
- **Instance 3 (Aen, S66 16:24 -- root cause of instance 2) -- the wrong stream.** At startup Step 3.5 Aen checked process-alive, lock-held, ledger-has-entries, and opened `fr-courier.log` -- **which is stdout and was 0 bytes** -- while every failure line went to `fr-courier.log.err`. An empty log beside a live process read as healthy. Corroborating detail: the 2-minute tool timeout that orphaned the daemon (parent killed at the deadline) is visible as courier-up 13:24:35Z -> first failure 13:26:37Z, 2m02s later. **The mechanism beneath this instance is now filed on its own** (2026-08-27, Brunel): [`log-file-empty-by-construction-when-launcher-splits-streams.md`](log-file-empty-by-construction-when-launcher-splits-streams.md) -- `fr-courier.log` is 0 bytes *by construction* (launcher splits stdout/stderr; the courier logs to stderr only), and the same file was later read the **opposite** way, as a fault, in S64/S65. Neither reading was of the log.
- **Instance 4 (Hopper, S66 17:36) -- the trap is in the SIGNAL'S DESIGN.** Nominated by Aen as the best teaching example, because here the operator is reading the *right* artifact. The hub's `deposited_uncollected:{}` field **reads identically before a deposit and after a collection.** A signal that cannot distinguish "nothing sent yet" from "sent and collected" is not a state gauge, it is a coin flip read as a gauge. Hopper caught it while confirming the fixed delivery, and only called delivery confirmed on the **conjunction** of (deposit log line + emptied spool + hub view), never the hub field alone.

- **Instance 5 (Aen, 2026-08-19) -- instance 4 firing on the reader of instance 4, inside the same hour.** Aen read this entry back as a Stage-2 confirmation, and within thirty minutes reported having already committed the exact error it describes: Aen told the PO that apex **had collected** our message, on a `deposited_uncollected:{}` status query taken **15 seconds after deposit** against a **30-second courier poll**. The field could not yet have shown anything else. Aen re-checked at ~5 minutes and confirmed properly on the three-way conjunction instance 4 prescribes (deposit log line + drained spool + hub view). **The claim survived; the evidence for it at the time did not** -- and that distinction is the entry's whole point.

  Two things make this instance worth its space rather than being an n+1 sighting. First, the sampling interval was **shorter than the poll interval**, which converts instance 4's ambiguous field into a *guaranteed* false read -- not a coin flip but a coin that cannot land heads yet. **A status field sampled faster than the process that updates it reports the past with the confidence of the present.** Second, and the reason this is recorded rather than quietly fixed: **it was committed by someone who had just finished reading the entry warning against it.** That is the sharpest available evidence for the wiki's own standing rule that *awareness of a pattern is not protection against it -- only a check with a defined trigger is* (see [`../patterns/stale-snapshot-trusted-as-current.md`](../patterns/stale-snapshot-trusted-as-current.md)). Self-reported against their own outgoing claim to the PO.

- **Instance 6 (Aen, 2026-08-26) -- the AUTHORING face: a success predicate you wrote yourself measures only what you chose to measure.** Resolving a real two-way scratchpad divergence at S64 startup, Aen hand-rolled a merge script that joined `ours_summary + theirs_summary + ours_S62_header` and **re-attached neither the text before the conflict region nor the text after it.** Everything outside the conflicted hunk vanished on both sides -- ~29 non-blank lines, including the file's own "this file is not a source" banner, one side's entire S62 transcript and NEXT-SESSION BOOT block, and the other side's entire S63 transcript. The script printed `markers left: 0` throughout, and that was read as done. **It only ever proved the thing it measured.** The loss surfaced by luck: a later, unrelated edit anchored on a string inside the deleted region and threw. Had that edit not been made, a truncated scratchpad would have been the authoritative startup record for every future session. Recovered by rebuilding from the last good commit plus explicit re-insertion.

  What distinguishes this from instances 1-5: there the operator *read* a signal someone else designed (sshd's listener, a hub field, a log stream). Here the operator **designed the signal**, and designed it around the hunk -- because the conflict markers frame attention on the hunk, **which is precisely where the danger was not.** A conflict-resolution script's blast radius is the whole file. Self-reported by Aen in the Aen scratchpad; filed here on the librarian's judgment at their request. **Correlation flagged**: third Aen instance (3, 5, 6), but a different session and substrate from instance 5 and a face no other instance carries, so recorded rather than counted as n+1.

**Sub-lesson from instance 4:** a green reading that does not distinguish success from a *different state entirely* is the same genus even when you are reading the right artifact.

**Sub-lesson from instance 6:** the success condition for a hand-rolled merge is **a diff against both parents**, not the absence of markers. Generalised: when you author the check as well as the change, the check inherits the change's blind spot -- **write the success predicate in terms of the outcome you want, never in terms of the mutation you performed.** Same shape as Brunel's independent finding the same day, now filed as [`../patterns/daemon-self-report-confirms-config-not-outcome.md`](../patterns/daemon-self-report-confirms-config-not-outcome.md): *a daemon's self-report of its own relocated config confirms the setting was applied, not that the outcome happened* -- two agents, one session, two substrates; that entry is the design remedy for this genus in migration contexts.

**Sub-lesson from instance 5:** when a signal is refreshed by a poll, **any read faster than one poll interval is not a measurement**. Where instance 4 says the field cannot distinguish two states, instance 5 says it cannot yet distinguish *anything* -- pair the conjunction check with a wait of at least one full poll period, or the conjunction is three readings of the same stale instant.

**Why the genus is the strong half of this entry:** n=3 live misses across **two agents** in one session, plus a signal-design instance, kills the reading that this is one operator's discipline problem. It is a property of how these systems report health. **Instance 5 (2026-08-19, a different session and a third exposure for the same agent) strengthens this further**: the genus recurred after the entry existed, was read, and was being actively confirmed -- so it is not an artifact of the one session that produced it.

## Confidence is split -- and held

`confidence: medium` on the entry as a whole, **on purpose**, per an explicit standing instruction from the submitter and from team-lead:

- **High** on the genus (n=3 live misses across 2 agents + a signal-design instance, one session -- all directly observed).
- **Medium** on the `-R` mechanism. Hopper's honesty caveat, preserved: *case (a) is derived from OpenSSH accept-then-channel-open semantics and is NOT yet field-demonstrated by me; I observed working forwards and an absent forward, never an OPEN-but-dead one.*

**DO NOT promote this entry to `high` without running the confirming experiment below.** This is a deliberate hold, not an oversight, and it survives n+1 sightings of the genus -- more genus instances do not settle the mechanism sub-claim.

### Confirming experiment (unrun -- canonical, for whoever gets there first)

Establish `-R <p>:<unreachable-host>:<port>`, then TCP-probe `<p>` on the remote. **Predict OPEN.** Promote the mechanism claim to `high` on that result; treat as `disputed` if it reads CLOSED.

## Revision trigger (mechanism sub-claim only)

The `-R` mechanism claim is a statement about **deliberate OpenSSH design** (accept-then-channel-open ordering), so for that sub-claim n+1 sightings do not raise confidence -- only the experiment above, or a change in OpenSSH's forwarding semantics, revises it. The **genus** is observation-based and follows standard dedup-as-confirmation.

**This entry carries two entry classes at once**, which is a named curation convention rather than an ad-hoc call: see [`../process/within-entry-class-split-observed-genus-designed-mechanism.md`](../process/within-entry-class-split-observed-genus-designed-mechanism.md). This entry is its instance 1 and worked example.

## Evidence

- S66, GH #104 (apex GitLab forward).
- `apex-migration-research/.claude/bin/autossh-db-tunnels.sh:46-53` (`ServerAliveInterval=30`, `ServerAliveCountMax=3`).
- Consumer: `designs/deployed/apex-research/container/entrypoint-apex.sh:365-372`.
- Observed in-container baseline: `11521 OPEN / 11522 OPEN / 11443 CLOSED`.

## Provenance note

**Filed on behalf of Hopper from a queued copy** -- Hopper was not spawned in the session this was filed (S67 close / 2026-08-03 batch). The submission text was written by Hopper in S66/S67 expecting later filing; instance 3 was co-reported by Aen, whose phrasing is preserved verbatim above at the submitter's request. Filed `stage-2: pending` accordingly -- filed-on-behalf, not author-is-filer.

**`stage-2: partial` (team-lead read-back, 2026-08-19).** Team-lead is a co-author via instance 3 and read the entry end to end; that advances the gate one step. **Hopper is still owed** -- the primary submitter and the holder of the unrun `-R` experiment, so `confirmed` waits on Hopper. The confidence hold is untouched by this read-back: the entry stays `medium` and the mechanism sub-claim stays unpromoted until the experiment runs.

## Stage-2 read-back -- 2026-08-28, Hopper: CONFIRM entry, DO NOT PROMOTE, one new face (`partial` -> `confirmed`, gate CLOSED)

Entry accurate, the honesty caveat preserved verbatim, Aen's line 30 phrasing right. Three things folded from the read-back:

**1. A door closed before anyone opens it.** Hopper executed a PO-sanctioned Tier M probe on 2026-08-28 (bridge egress on the RC host), and a reader may reasonably wonder whether it discharges the `-R` experiment this entry holds `medium` on. **It does not.** In Hopper's words: *"it tested bridge egress, not reverse forwards, and bears on the mechanism sub-claim not at all."* **The hold stands: `medium` on the `-R` mechanism, `high` on the genus, no promotion.** This paragraph exists so the question is answered in the entry rather than re-litigated.

**2. Instance 7 -- the genus committed three times in one session by its own primary submitter.** Instance 5 records team-lead committing instance 4's error thirty minutes after reading the entry. Hopper -- **the entry's source agent**, who has carried this genus in their scratchpad for weeks -- committed it **three times on 2026-08-28**: the stale `ip` pre-flight, a CRLF false positive, and the `rc=$?`-after-a-pipe defect spotted in someone else's probe (which would otherwise have printed `rc=0` under a failed run). **This is the strongest form of the entry's standing claim that awareness is not protection: it was a co-author before, it is the source agent now.** The CRLF case carries its own tell, walked past at the time: **the reported "CR count" exactly equalled each file's line count, for all six files -- a metric that reproduces a different metric exactly is not a measurement.** That one was caught only because the host supplied independent signals (`file(1)`, `grep -c`, byte sizes, and local-vs-remote md5 equality); the `ip` case had none, and that difference is why one was caught and the other was not.

**3. A new face, split out rather than absorbed -- the TIME axis.** Instances 2-6 all vary along **scope**: wrong artifact, wrong stream, a signal that cannot distinguish two states, a signal sampled faster than its poll, a predicate authored around the mutation. Hopper's stale pre-flight varies along **time** -- the check was correctly chosen, correctly run and correctly read, and then **silently expired when the artifact changed underneath it.** None of the existing six turn on a check having been *valid and becoming invalid*. Filed as its own entry on that axis: [`verification-step-goes-stale-invisibly-because-it-passed.md`](verification-step-goes-stale-invisibly-because-it-passed.md), joint Hopper + Brunel. Cross-linked, not merged.

**Instance 5 was submitted normally, not filed under the gate.** Team-lead reported it to the librarian rather than filing it himself, so author-is-filer does not apply and the read-back above is not what admitted it. Recorded here because the distinction is exactly the kind this entry exists to protect.

## Instance 7 -- submitted here, filed elsewhere, and the split is deliberate (2026-09-02, Brunel)

**Brunel submitted an instance against this entry's instance-4 sub-shape (*"the trap is in the signal's design"*): `docker inspect`'s `Config.Image`, offered as one of two independent live observations supporting a retraction.** That field records the image reference **as written at container creation** -- a static string, not a digest -- so it reads the same whether the tag points at the new image, the old one, or nothing. **It could not have come out differently, so it supported neither conclusion.**

**Filed as its own entry, not as instance 7 here: [`../patterns/live-is-not-the-same-as-discriminating.md`](../patterns/live-is-not-the-same-as-discriminating.md).** The submitter asked for it as an instance; the librarian split it, and the reason is the disjoint-remedy test:

- **This entry's remedy is about TARGET SELECTION** -- verify the thing, not its neighbours; a check whose subject is adjacent to the claim does not test the claim.
- **That entry's remedy is about DISCRIMINATING POWER ON A CORRECTLY-SELECTED TARGET** -- ask whether the field could have read differently. **Brunel's target was correct.** Brunel had deliberately and rightly upgraded their evidence source, insisting on live substrate readings over the team's drifting mirror. The reading was still vacuous.

> **Brunel's own framing, which is why the split holds: *"the satisfaction of having gone to the substrate is not a check that what I read there could have come out differently."*** Instances 2-6 here are all someone reading the **wrong** artifact, stream, or field. **This is someone reading the right one, freshly, and getting nothing** -- a different failure with a different fix.

**Cross-referenced, not merged, in both directions.** Recorded here because a reader arriving at this entry with a `Config.Image`-shaped problem should be sent one link further, and because the submitter's proposed placement deserves to be visible alongside the librarian's decision to overrule it.

(*FR:Hopper* submitted, *FR:Aen* co-reported instance 3 and submitted instance 5; *FR:Brunel* submitted instance 7 and its framing; *FR:Callimachus* filed, and split instance 7 out against the submitter's proposed placement)
