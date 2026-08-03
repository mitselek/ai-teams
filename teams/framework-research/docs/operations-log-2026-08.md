# Operations Log -- 2026-08 (*FR:Hopper*)

Append-only operations log per `teams/framework-research/prompts/hopper.md` (Provenance -- Role-of-Record section). Each entry has all 8 required fields. No edits to prior entries; corrections go as new entries referencing the original by timestamp.

---

## 2026-08-03T10:17+03:00 -- Task #2: diagnose RC host "keeps shutting down" (PO report)

**timestamp** -- 2026-08-03T10:17+03:00 (task claimed) through 2026-08-03T10:22+03:00 (findings reported). Diagnosis phase; awaiting host-identity confirmation before close.

**tasker** -- Aen (team-lead). Task #2, relaying a PO report that the host "keeps shutting down." PO stated address `199.96.54.170`; Aen flagged a likely `100->199` typo and asked to confirm which host before diagnosing.

**dispatch summary** -- Investigate why the RC host repeatedly goes down: uptime/reboot history, kernel/OOM/thermal/power logs, the autossh churn, and whether the apex container restart-loop (#103, RestartCount 26 at S60) is implicated. Report findings; do not apply fixes without sanction.

**tier classification + sanction status** -- **Tier R throughout (read-only inspection; default-permitted, no sanction required).** No mutation of any substrate. Diagnosis only; the task explicitly bars fixes without sanction and none were applied.

**deployed-artifacts-read declaration** -- Runtime state only (no design-artifact reads needed for a host-health diagnosis). Layer 3 reads against RC host `dev@100.96.54.170` via host-side SSH (registry num:"1", `~/.ssh/id_ed25519`): `last`/`uptime`/`journalctl`/`docker inspect`/`free`/`gsettings`/`systemctl show`. The `199.96.54.170` address was ping-probed only and NOT SSH-probed -- it is a foreign public IP, not an FR substrate, out of scope per prompt (§MAY NOT: "no command on a non-FR-shipped substrate").

**commands executed** (verbatim, key ones) --
1. `ping -n 2 100.96.54.170` and `ping -n 2 199.96.54.170` -- both answer; 100 = 17ms (Tailscale), 199 = 130ms (foreign public IP).
2. `ssh -T dev@100.96.54.170 "date; uptime; uptime -s; last -x -n 20 reboot shutdown; last -x -n 8"`
3. `... "journalctl --list-boots; systemd-detect-virt; cat /sys/class/dmi/id/product_name /sys/class/dmi/id/sys_vendor; journalctl -b -1 -n 25"`
4. `... "journalctl -b -1 | grep -iE 'Reached target Power-Off|Powering off|systemd-shutdown'; journalctl -b -1 -k | grep -iE 'Out of memory|oom-kill|thermal|mce:|Machine Check'; crontab/timers; logind idle/sleep; power-supply online"`
5. `... "journalctl | grep -iE 'PM: suspend|systemd-suspend|Reached target Sleep'; gsettings ... sleep-inactive-ac-*; cat /sys/power/state /sys/power/mem_sleep"`
6. `... "journalctl | grep -iE 'watchdog|soft lockup|rcu_sched|hung task|kernel panic|BUG:'; ls /dev/watchdog*; systemctl show -p RuntimeWatchdogUSec; docker inspect apex-research --format '...RestartCount...'; systemctl show docker -p ActiveEnterTimestamp; free -h"`

**outputs** (key findings) --
- **Host is a physical Dell Pro Max Slim FCS1250 desktop**, hostname `paarisprogemis-fyysiline`, `systemd-detect-virt: none` (bare metal, not a server/VM). 62 GiB RAM.
- **Boot history = three distinct cold boots** (separate boot IDs -> full reboots, not suspend/resume): boot -2 Jul 15 23:19 -> last log Jul 30 13:37; boot -1 Jul 31 11:54 -> last log Jul 31 12:34 (~40 min); boot 0 Aug 3 09:41 -> present. Down-gaps: ~22h (Jul 30->31, overnight) and **~2d21h (Jul 31->Aug 3, the weekend)**. Work-hours/weekend shape.
- **Both prior boots ended UNCLEAN** -- no `Reached target Power-Off`/`systemd-shutdown`; `last` labels both **"crash"** = abrupt power removal, not a software `poweroff`. Last lines before boot -1 died were benign headless desktop-session noise + a normal SSH reset at 12:34:35, then silence. No fault cascade.
- **Every crash vector NEGATIVE:** no OOM (57 GiB free, container `OOMKilled=false`); no thermal/temperature-critical; no MCE/hardware-error; no panic/BUG/GPF/soft-hard-lockup/RCU-stall/hung-task; **watchdog reboot ruled out** (`RuntimeWatchdogUSec=0`, `/dev/watchdog` present but unarmed); **no auto-suspend** (AC idle action `sleep-inactive-ac-type=nothing`, zero `PM: suspend` cycles logged); no scheduled `shutdown`/`poweroff`/`suspend` in cron or timers.
- **apex container = downstream passenger, not cause:** running, `RestartCount=0`, policy `unless-stopped`, `StartedAt`=09:39:34 UTC = came up WITH host boot (docker ActiveEnter 09:39:34 EEST). Not restart-looping now; the S60 RestartCount 26 was a prior instance not currently reproducing. A non-privileged container cannot power off its host. autossh churn (68/24h) is likewise an effect of host power-loss, not a cause.

**outcome** -- **partial / diagnosis delivered, awaiting confirmation.** Conclusion: the host is not crashing; it is a physical desktop that loses power while running and cold-boots when powered back on. Manual power-off, accidental mains loss, and an intermittent PSU/power-connector fault produce an identical log-less signature, so logs alone cannot distinguish benign switch-off from a hardware power fault -- the splitter is behavioural (**does it ever power off while actively in use?**) and only the PO can answer it. Two open items surfaced to Aen: (1) confirm host identity `100` vs PO-stated `199` (I probed only `100`; `199` is off-substrate and I did not SSH it); (2) PO answers the mid-use question, then optionally a BIOS AC-recovery + Dell firmware-event-log follow-up (Tier R, needs sanction). Flagged as a candidate framework finding: an FR/apex deployment substrate pinned to a non-persistent desk workstation is the substrate-fragility the deployment-substrate direction warns against. No fixes applied. Task #2 remains `in_progress`.

(*FR:Hopper*)
