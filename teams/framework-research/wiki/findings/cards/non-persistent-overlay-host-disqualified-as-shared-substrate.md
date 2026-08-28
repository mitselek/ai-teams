---
title: "A Non-Persistent Host Reached Over an Overlay Network Is Disqualified as a Shared Deployment Substrate"
directory: findings
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-08-03
last-verified: 2026-08-28
stage-2: confirmed
migration-target: topics/11-deployment-lifecycle.md
related: [../gotchas/verification-narrower-than-it-appears.md, ../gotchas/control-narrower-than-its-name.md, ../references/rc-host-db-tunnel-architecture.md, ../gotchas/warp-dns-vs-routing-asymmetry-rc-host.md]
tags: [finding, deployment-substrate, availability, s2idle, suspend, headless, gdm-greeter, systemd, scope-trap, rc-host, topic-11]
---

## TLDR

A non-persistent host reached over an overlay network is disqualified as a shared deployment substrate -- not only because it can be powered off, but because it can **idle-suspend under active remote load via a power policy the obvious OS knobs do not govern**, presenting to every remote consumer as a repeating host outage. **The trap: the fix looks done.** Disable the visible idle-suspend setting, the box keeps sleeping, and diagnosis misroutes toward power hardware or network.

## Key ideas

- **Three hypotheses fell in sequence, each on evidence** (RC host `100.96.54.170`, physical Dell desktop carrying apex's container + the reverse-SSH tunnels): (1) **power fault REJECTED** -- boot count unbroken, `RestartCount=0`, no reboot during drops; (2) **network/WARP flap REJECTED as mechanism** -- journal showed a multi-minute TOTAL FREEZE, not a live-but-unreachable box; (3) **s2idle SUSPEND CONFIRMED** -- `/sys/power/suspend_stats/success` incremented live 3 -> 4 (kernel's own counter), `mem_sleep=[s2idle]`, `suspend.target` fingerprint at the drop timestamp, RAM-preserved resume (container session survived mid-conversation).
- **Root cause = headless + greeter scope.** Monitors removed -> nobody logs into a graphical session -> box sits at the **GDM greeter on `seat0`** while all work arrives as **seatless SSH**. The greeter judges idle on **local seat input**, which headless never provides and SSH does not reset -> idle timer runs to completion and suspends **under active remote load**.
- **The scope trap**: `org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type = nothing` is the **user session**, NOT the greeter. Checking it looks like the fix and changes nothing.
- **Fix = block the mechanism, not the trigger**: `systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target`. Suspend routes through `suspend.target` (kernel-counted, systemd-mediated), so masking works **regardless of which idle scope triggered it** -- you needn't name the trigger correctly to end it. Rollback = `unmask`; durable version adds logind `IdleAction=ignore`.
- **Verify on the mechanism's own counter**, not on the mask command succeeding: `/sys/power/suspend_stats/success` held flat at 4 for 35 min (2-3 would-be cycles).
- **Plausible-but-WRONG lead**: the removed display cable / EDID. Suspend is idle-timer-driven, not EDID-driven -- chasing the cable wastes time.
- **Framework consequence**: never pin persistent shared workloads (another team's container, a comms tunnel, a hub) to a host that (a) has a human power button + no auto-recovery, (b) sits behind a flapping overlay, or (c) runs a desktop session stack that idle-suspends -- **especially headless**. Shared substrate belongs on an always-on server, no desktop power management, stable network path.
- **Genus link (availability axis)**: the *symptom* (unreachable) can't distinguish suspend / power-off / network drop = `verification-narrower-than-it-appears`; the *fix* (disable GNOME idle-suspend) appears total but misses greeter scope = `control-narrower-than-its-name`. **Both firing on one incident is why this is a FINDING, not a third gotcha** -- the durable output is a substrate-selection criterion for topic 11.
- **First entry in `findings/`.** `migration-target: topics/11-deployment-lifecycle.md` is named explicitly so the 3-session `[MIGRATION-STALE]` rule has a concrete destination to fire against.
- **stage-2 pending** -- filed on behalf of Hopper from a queued copy (not spawned at filing); full text read from his preserved scratch file, not reconstructed.

(*FR:Hopper* submitted; *FR:Callimachus* filed)
