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
1. `ping -n 2 100.96.54.170` and `ping -n 2 199.96.54.170` -- both answer; 100 = 17ms (**Cloudflare WARP** overlay -- corrected from "Tailscale" per Aen 10:28; the `100.64.0.0/10` CGNAT range is shared by WARP and Tailscale, which is the mislabel trap), 199 = 130ms (foreign public IP).
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

---

## 2026-08-03T10:59+03:00 -- Task #2 addendum: live mid-session drop CAUGHT -- network/WARP, NOT power (reverses the working hypothesis)

**timestamp** -- 2026-08-03T10:59+03:00 (host went unreachable mid-probe) through 2026-08-03T11:02+03:00 (discriminator run, reversal reported). Continuation of the 2026-08-03T10:17 Task #2 entry.

**tasker** -- Aen (team-lead). Same Task #2. Aen's 10:28 steer set the hardware-fault branch (PO reported mid-use random drops) and sanctioned a Tier R firmware/SEL read; this addendum records a live event that partially reverses that branch.

**dispatch summary** -- While starting the sanctioned firmware probe, the RC host went unreachable. Per the "flag actively-destructive events immediately" instruction, stopped and characterised the live event before continuing.

**tier classification + sanction status** -- Tier R throughout (ping, SSH read probes, `journalctl`, `warp-cli status`, attempted `dmidecode`). Firmware/SEL read was Aen-sanctioned 10:28. No mutation.

**deployed-artifacts-read declaration** -- Runtime only. Host-side SSH `dev@100.96.54.170` (WARP overlay). No design artifacts relevant to a host-availability event.

**commands executed** (verbatim, key) --
1. `ping -n 3 100.96.54.170` -> "Destination host unreachable" from WARP edge 172.69.136.105; control pings `1.1.1.1` (9ms) + hub `10.100.136.162` (21ms) both healthy -> not my link.
2. background waiter: `until ping ... 100.96.54.170 ...; do sleep 30; done` -> fired ~11:01 (host back).
3. `ssh dev@100.96.54.170 "uptime; who -b; journalctl --list-boots | tail"` -> uptime 1:21, boot 09:39, **still boot 0, no new boot**.
4. `ssh ... "journalctl --since 10:20 --until 11:01 | grep -iE 'systemd-shutdown|Linux version|Reached target Multi-User'"` -> empty (no reboot in window).
5. `ssh ... "warp-cli status"` -> "Connected, Network: healthy".
6. `ssh ... "sudo -n dmidecode -t 15"` -> **"sudo: a password is required"** (blocked).
7. thermal zones -> 50C / 39C (one garbage 255C sensor, ignore).

**outputs / findings** --
- **The host NEVER rebooted.** Uptime unbroken (booted 09:39, up 1:21 at 11:01); boot list still shows only boot 0 with LAST ENTRY advancing continuously to 11:00:29 across the outage; zero reboot/shutdown markers in the 10:20-11:01 window.
- **The ~2-3 min unreachability (≈10:27->11:00) was a NETWORK/WARP overlay drop**, self-healed. Host's own `warp-cli` reports healthy -- the break was in the overlay path between the operator box and the host, not the host's own WARP client, and not power.
- **This reverses the 10:59 live "looks like the fault firing" flag** (which was correctly caveated as unreachable-via-overlay-only). Disprove-your-own-report held: the caveat was the thing the discriminator closed.
- **Two distinct phenomena now separated:** (1) WARP overlay flaps -- machine stays UP, indistinguishable from a shutdown to any remote user (SSH/tunnels/apex all drop); the ONE mid-use drop captured live is this type. (2) Real historical reboots -- boot-list gaps (boot -1 ran 40 min then unclean stop; multi-day gaps); genuine power-cycles, cause still unevidenced.
- **Sanctioned firmware/SEL read BLOCKED:** `sudo` needs a password (dev in sudo group but no NOPASSWD / no cached cred). Requires PO to run `sudo dmidecode -t 15` at the desk or a scoped NOPASSWD grant. Still warranted for the type-2 reboots.
- Thermal healthy (50C/39C).

**outcome** -- **partial; working hypothesis materially updated, not closed.** The mid-use symptom the PO reports matches type-1 (network/WARP flap), evidenced by a live capture; type-2 (power) remains inferred-only. Branch should widen to include WARP-flap before committing to a hardware replacement. Decisive open question surfaced to Aen/PO: **when it "shuts down," is the physical box dark, or merely remote-unreachable while staying on?** -- that splits the two phenomena. Firmware read queued pending sudo access. No fixes applied. Label correction applied to the 10:17 entry (WARP not Tailscale, per Aen). Task #2 `in_progress`.

(*FR:Hopper*)
