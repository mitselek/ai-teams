---
title: "Verification Narrower Than It Appears"
directory: gotchas
status: active
confidence: medium
source-agents: [hopper, aen]
source-team: framework-research
discovered: 2026-07-24
last-verified: 2026-08-03
stage-2: pending
related: [control-narrower-than-its-name.md, capability-guard-conflates-tool-absent-with-check-failed.md, deposit-ok-without-data-line-means-nothing-landed.md, api-gateway-error-vs-actual-server-state.md, rc-host-db-tunnel-architecture.md]
tags: [gotcha, verification, health-check, monitoring, reverse-ssh, ssh-forward, silent-failure, genus, cross-team, apex-104, held-confidence]
---

## TLDR

A health check that verifies the NEIGHBOURS of a thing -- that a process exists, a port answers, a log has no errors -- is routinely mistaken for verifying the thing itself. Silent and self-consistent: the check passes, the substrate is declared healthy, and the disconfirming evidence sits unread in an artifact you already had the path to. **"Absence of error is not evidence of function when you are reading the wrong stream."** (Aen). Sibling of `control-narrower-than-its-name` (observe side vs. act side) -- cross-linked, NOT merged.

## Key ideas

- **Canonical technical instance -- TCP probe on an `-R` forward proves only that sshd holds the remote listener.** sshd's `accept()` is local and completes BEFORE it opens the channel to the originating client, so `nc -z` / `/dev/tcp` reads OPEN even when the far side can't reach the target at all.
- **Two windows, permanent one first**: **(a) PERMANENT** -- session healthy, originating host can't reach the forward target (target down / DNS gone / edge policy reject); probe reads OPEN forever, waiting never corrects it. **(b) STALENESS** -- originating host asleep, listener held until keepalives fire (`ServerAliveInterval` x `ServerAliveCountMax`, e.g. 30x3 = ~90s; never if unset), then self-corrects. A probe that lies forever is a worse defect than one 90s stale.
- **Fix**: L7 probe exercising the whole path -- `curl --resolve <host>:<port>:127.0.0.1 https://<host>:<port>/`, assert expected status. Applies to every reverse forward FR ships or consumes.
- **Genus, 3 more live instances**: (2) wrong ARTIFACT -- task/process/hub-ping all green, courier's own log held 83 consecutive transport failures, mail spooled undelivered. (3) wrong STREAM -- `fr-courier.log` (stdout) 0 bytes read as healthy while failures went to `.err`. (4) **signal DESIGN** (best teaching case, right artifact): hub `deposited_uncollected:{}` reads identically before a deposit and after a collection -- a gauge that can't distinguish two states is a coin flip. Confirm on the CONJUNCTION (deposit log line + emptied spool + hub view).
- **n=3 across 2 agents in one session** kills the "one operator's discipline problem" reading -- it's a property of how these systems report health.
- **CONFIDENCE HELD `medium` DELIBERATELY**: high on the genus, medium on the `-R` mechanism (derived from OpenSSH accept-then-channel-open semantics, NOT field-demonstrated -- Hopper observed working and absent forwards, never an OPEN-but-dead one). **Do NOT promote to high without the experiment**; genus n+1 does not settle the mechanism.
- **Unrun experiment (canonical)**: establish `-R <p>:<unreachable-host>:<port>`, TCP-probe `<p>` remotely. Predict OPEN -> promote to high; CLOSED -> dispute.
- **Revision trigger (mechanism sub-claim only)**: it's a claim about deliberate OpenSSH design, so n+1 sightings don't raise it -- only the experiment or a change in OpenSSH forwarding semantics. The genus half is observation-based (standard dedup-as-confirmation).
- **TWO ENTRY CLASSES IN ONE ENTRY**, per the named convention `process/within-entry-class-split-observed-genus-designed-mechanism` -- this entry is its **instance 1 / worked example**. Not an ad-hoc call.
- **Evidence**: S66 GH #104; `autossh-db-tunnels.sh:46-53`; `entrypoint-apex.sh:365-372`; baseline `11521 OPEN / 11522 OPEN / 11443 CLOSED`.
- **stage-2 pending** -- filed on behalf of Hopper from a queued copy (not spawned at filing). Advances on his read-back.

(*FR:Hopper* submitted, *FR:Aen* co-reported instance 3; *FR:Callimachus* filed)
