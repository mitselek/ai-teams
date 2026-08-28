---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-08-03
filed-by: librarian
last-verified: 2026-08-28
status: active
source-files:
  - teams/framework-research/docs/operations-log-2026-08.md
source-commits: []
source-issues: []
migration-target: topics/11-deployment-lifecycle.md
related:
  - ../gotchas/verification-narrower-than-it-appears.md
  - ../gotchas/control-narrower-than-its-name.md
  - ../references/rc-host-db-tunnel-architecture.md
  - ../gotchas/warp-dns-vs-routing-asymmetry-rc-host.md
---

# A Non-Persistent Host Reached Over an Overlay Network Is Disqualified as a Shared Deployment Substrate

**Finding (pre-topic-file, cross-team, high confidence).** Migration target: **`topics/11-deployment-lifecycle.md`** (substrate-selection criteria).

**Claim.** A non-persistent host reached over an overlay network is disqualified as a shared deployment substrate -- not only because it can be powered off, but because it can **idle-suspend under active remote load via a power policy the obvious OS knobs do not govern**, presenting to every remote consumer as a repeating host outage. **The trap is that the fix *looks done*:** you disable the visible idle-suspend setting, the box keeps sleeping, and the diagnosis misroutes toward power hardware or network.

## Worked example -- RC host `100.96.54.170`

`paarisprogemis-fyysiline`, a physical Dell Pro Max Slim desktop carrying apex-research's container plus the reverse-SSH DB/GitLab tunnels. The host "kept shutting down." **Three hypotheses fell in sequence, each on evidence:**

1. **Power fault -- REJECTED.** Boot count unbroken, apex container `RestartCount=0`, host never rebooted during the drops. Not a power-cycle.
2. **Network/WARP flap -- REJECTED as the mechanism.** It looked right (host unreachable while the operator link was healthy), but the journal showed a multi-minute **total freeze**, not a live-but-unreachable box.
3. **s2idle SUSPEND -- CONFIRMED.** `/sys/power/suspend_stats/success` incremented live (3 -> 4 across the diagnosis) -- **the kernel's own counter** -- with `mem_sleep=[s2idle]`, a `suspend.target` systemd fingerprint at the drop timestamp, and RAM-preserved resume (a long-running interactive session inside the container survived mid-conversation).

## Root cause -- the precipitating change and the scope trap

The box's **monitors were removed recently; it now runs headless.** With no display, nobody logs into a graphical session, so the box sits at the **GDM greeter on `seat0`** while all real work arrives as **seatless SSH sessions**.

**The greeter judges "idle" on local seat input** -- which headless never provides, and which SSH/network activity does not reset. So the idle timer reliably runs to completion and suspends the box **under active remote load**.

**The scope trap:** the user-session GNOME setting an operator naturally checks --

```
org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type = nothing
```

-- does **not apply to the greeter**. Different scope. Disabling it looks like the fix and changes nothing.

## Fix -- block the mechanism, not the trigger

```
systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

Because the suspend routes through `suspend.target` (kernel-counted, systemd-mediated), masking the targets blocks it **regardless of which idle scope triggered it** -- you do not have to correctly name the trigger to end it. (Durable version also sets logind `IdleAction=ignore`. Rollback = `unmask`.)

**Verify by watching `/sys/power/suspend_stats/success` stop incrementing** -- i.e. confirm on the mechanism's own counter going quiet, not on the mask command returning success. Field result: counter held flat at 4 from 11:23 to 11:58 (35 min spanning 2-3 would-be cycles).

## Plausible-but-WRONG lead -- warn the next person off

**The dangling/removed display cable and EDID confusion.** The suspend is idle-timer-driven, **not** EDID-driven; chasing the cable or forcing an EDID wastes time.

## Consequence for framework design

Persistent shared workloads -- another team's container, a comms tunnel, a hub -- **must not be pinned to a host that:**

- **(a)** has a human power button and no auto-recovery, or
- **(b)** sits behind a flapping overlay, or
- **(c)** runs a desktop session stack that idle-suspends -- **especially headless**, where the idle timer sees no local input and the visible knob is the wrong scope.

**Shared deployment substrate belongs on an always-on server with no desktop power management and a stable network path.**

## Genus link

Same shape as the two S66/S67 genus entries, on the **availability axis**:

- **[`../gotchas/verification-narrower-than-it-appears.md`](../gotchas/verification-narrower-than-it-appears.md)** -- the *symptom* (unreachable) does not distinguish suspend from power-off from network drop. A signal read as a gauge that cannot separate two very different conditions.
- **[`../gotchas/control-narrower-than-its-name.md`](../gotchas/control-narrower-than-its-name.md)** -- the *fix* (disable GNOME idle-suspend) appears total but misses the greeter scope.

That both genera fire on the same incident is why this is filed as a finding rather than a third gotcha: the durable output is a **substrate-selection criterion for the deployment-lifecycle topic**, not another trap to avoid.

## Evidence

- `teams/framework-research/docs/operations-log-2026-08.md`, Task #2 entries (10:17 diagnosis, 10:59 live-reversal, 11:13 s2idle confirmation, plus fix/verify record).
- **Kernel counter:** `/sys/power/suspend_stats/success` = 3 then 4 across the diagnosis; `fail=0`; `mem_sleep=[s2idle]`.
- **Journal gap:** `journalctl --since 10:28 --until 10:33` = `-- No entries --` (5-minute freeze); `suspend.target` ActiveEnter = InactiveEnter = 10:58:56.
- **Seat topology:** `loginctl list-sessions` -> `Debian-gdm` greeter on `seat0`/tty1; all `dev` sessions seatless (SSH). Displays removed recently (PO).
- **No reboot:** single boot 0 (09:39), uptime unbroken; apex container `StartedAt` = 09:39, `RestartCount` = 0.

## Filing note

**Findings-directory rationale.** This is the first entry in `findings/`. It is filed here rather than in `gotchas/` because its durable form is a **framework design constraint with a named topic-file destination** (`topics/11-deployment-lifecycle.md`, substrate-selection criteria), not a trap for an agent to avoid at the keyboard. The `migration-target` frontmatter field names that destination explicitly, so the 3-session `[MIGRATION-STALE]` rule has something concrete to fire against rather than flagging a finding with nowhere to go.

The submitter noted this should land in `docs/findings.md` **and** the wiki. `docs/` is outside the Librarian's write scope; `wiki/findings/` is the wiki-side home and is the entry of record. Any `docs/` placement is team-lead's to make.

## Provenance note

**Filed on behalf of Hopper from a queued copy** -- Hopper was not spawned in the filing session (2026-08-03 batch). Full submission text was preserved by Hopper in a session scratch file and read from there rather than reconstructed. `stage-2: pending` -- filed-on-behalf, not author-is-filer; advances on his read-back.

(*FR:Hopper* submitted; *FR:Callimachus* filed)

## Stage-2 read-back -- 2026-08-28, Hopper: CONFIRM, with one field update that materially strengthens the entry (`pending` -> `confirmed`)

Accurate as filed. Confirmed correct in his words: the three-hypothesis sequence and its order (power fault -> network flap -> s2idle, each rejected on evidence); the scope trap (`sleep-inactive-ac-type=nothing` is the **user session**, not the greeter -- which is why the obvious knob looks like a fix and changes nothing); the fix rationale (**mask the mechanism, not the trigger**, because the suspend routes through `suspend.target` regardless of which idle scope fired it); the EDID/cable warn-off, which was a real time sink; and the genus links to both S66 entries.

**Durability update.** The entry recorded the field result as *"counter held flat at 4 from 11:23 to 11:58 -- 35 minutes spanning 2-3 would-be cycles"*, which was all the evidence available at filing. **Re-read 2026-08-28: `/sys/power/suspend_stats/success` is still `4`, across `up 25 days` of unbroken uptime**, on the same host with the same mask, **under continuous remote load throughout** (nine containers, active SSH sessions).

That takes the fix from *held across a couple of would-be cycles* to **held for weeks**, and `last-verified` moves to 2026-08-28 on that basis. **It also retires the carry-forward watch** the submitter had been holding: if the counter ever climbs past 4 the mask was bypassed (firmware modern-standby), and the escalation is a `mem_sleep` kernel parameter or a BIOS toggle. It has not.

The `docs/findings.md` placement note stands -- still team-lead's to make; the librarian cannot write there.

(*FR:Hopper* read-back; *FR:Callimachus* folded)
