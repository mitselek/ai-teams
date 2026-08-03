# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S61 CLOSED (started 2026-07-24, substrate date advanced to 2026-08-03 mid-session). Ran on **Opus 4.8** (parent config stamped `claude-opus-4-8[1m]`), NOT roster's fable-5 pin -- PO said "keep as is," roster left pinned. Host = Windows FR box. Cell = **Hopper only** (sole specialist all session).
- **S61 KEY RESULTS:** (1) **GH #104** -- added `11443 -> gitlab.evr.ee:443` reverse forward to apex's autossh bridge; live, L7-verified (302 through CF Access), durable through churn. Mechanism proven+scoped: WARP **device identity** carries through the ssh leg (NOT a CF-Access bypass); path availability bounded by the WARP-enrolled workstation. Apex reply + #104 comment delivered. (2) **RC host "keeps shutting down" DIAGNOSED + FIXED** -- it was **headless GDM-greeter s2idle suspend under remote load** (monitors removed -> box sits at greeter -> greeter idle-timer blind to SSH -> suspends ~15min). Fix = `systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target` (PO ran it); counter-verified (`suspend_stats/success` frozen at 4 across 64min). (3) **Task #3** -- all three apex tunnels (11521/11522 DB + 11443 GitLab) verified live end-to-end on the stable host; 11443 survived 4 suspend/respawn cycles.
- **Key decisions:** locate-before-touch held all session; every host mutation was a Tier-D dispatch the **PO ran** (sudo-in-his-hands, no NOPASSWD); FR specifies, PO/apex applies (never mutated apex's repo or the workstation directly).
- **STARTUP BUG FOUND (fix next session):** Step 3.5 courier restart run in **foreground** hit the 2-min Bash timeout -> orphaned the daemon (parent killed) -> every ssh spawn failed `STATUS_DLL_INIT_FAILED` for 45min. I mis-certified it green (read `fr-courier.log` = 0-byte stdout; real errors were in `fr-courier.log.err`). Fixed by **detached restart** (`run_in_background:true`). **Step 3.5 MUST run backgrounded** -- Volta's startup.md correction.
- **CARRY-FORWARD:** (1) **5 Cal submissions QUEUED, UNFILED** (Cal not spawned) -- in Hopper's scratchpad Cal-queue + scratch `cal-submission-5-framework-finding.md`. (2) **Brunel S60 items** pending PO: `network:host` base-compose one-liner (`docker-compose.yml` L37-40) + WARP-build-DNS gotcha. (3) **Type-2 historical cold reboots** (weekend/overnight genuine power-offs, distinct from today's suspends) UNEXPLAINED, SEL read deferred, no recurrence. (4) S60 **PENDING Mihkel batch** + **company-station lane PARKED** still open (see S60 block below).
- **WARNING (session lesson, n=4 across 2 agents):** the health-check-that-verifies-the-neighbours-not-the-thing failure -- I did it (empty stdout log read as "healthy"), Hopper x3 (pkill matched but respawn re-read nothing; Stop-ScheduledTask orphaned 7 procs; process-alive read as transport-works). Verify the mechanism's own counter/output, not its liveness. Also: `deposited_uncollected:{}` reads identically before-send and after-collect -- a signal that can't distinguish two states is not a gauge.

---
## S61 wrap (2026-07-24 -> 2026-08-03)

- Startup: SLUG=session-f2dff9d4; restore needed `FR_COURIER_TEAM_DIR_NAME` override ($PPID=1 inside script). 44 inboxes. Model mismatch (4.8 vs fable-5) -> PO "keep as is."
- #104 arc: Hopper located the mechanism (apex-owned autossh bridge, NOT stationmaster) -> specified the one-line diff -> PO applied via Task-Scheduler Stop/Start (Stop-ScheduledTask orphaned 7 procs, straggler-swept) -> L7 302 proved WARP-through-ssh. Oracle outage 5m43s (stated straight to apex). Found + reported apex `nc`-absent entrypoint defect (their 11521 probe is a silent no-op).
- Suspend arc: 3 wrong-then-right hypotheses (power-fault -> WARP-flap -> s2idle suspend), each killed by machine ground-truth (boot count, RestartCount, kernel suspend_stats). PO's "wake from power button, apex resumes mid-conversation" = the RAM-preserved-resume tell; "displays removed lately" = the headless precipitant. Fix mechanism-block (mask) robust to the unnamed greeter trigger.
- autossh `ssh exited 255` post-mask = benign `Address already in use` (redundant rebind fails while incumbent holds forwards) -- NOT churn; documented so restart-count 31 (lifetime) isn't misread.

### NEXT-SESSION BOOT (re-orient instructions for S62)

1. Read `startup.md` first (always). Steps 1-5 (Sync -> Discover -> Restore -> Courier -> Spawn-on-PO-direction).
2. **Pull `mitselek-ai-teams`** for external scratchpad updates.
3. **Step 3.5 courier restart: run it BACKGROUNDED (`run_in_background:true`).** Foreground = 2-min Bash timeout orphans the daemon -> `STATUS_DLL_INIT_FAILED` on every ssh spawn. Verify health by reading `fr-courier.log.err` (NOT the 0-byte `.log` stdout) for a *successful* collect/deposit, not just process-alive. This is a live bug until Volta patches startup.md.
4. **Don't pre-spawn any agent.** Wait for PO direction.
5. **If PO wants the Cal submissions filed:** spawn **Callimachus** -> he files the 5 queued Protocol-A entries from Hopper's scratchpad Cal-queue + `cal-submission-5-framework-finding.md`. Sub#1 verification-narrower-than-it-appears (n>=3, `-R` TCP probe canonical, medium-confidence w/ unrun experiment -- do NOT promote to high without it); Sub#4 control-narrower-than-its-name (n=2); Sub#5 framework finding (headless-greeter s2idle / non-persistent-host-on-overlay disqualified as shared substrate). Sub#1 and #4 are cross-linked, NOT merged (over-merge rationale recorded).
6. **If PO surfaces Brunel's S60 items:** spawn **Brunel** -> (a) `network:host` on base-compose x-team-base build block (`docker-compose.yml` L37-40, one line); (b) WARP-build-DNS gotcha to Cal.
7. **If PO raises the RC host going dark AGAIN (real power-off, box physically dark):** that's the unexplained **type-2** class, NOT today's suspend. Spawn Hopper -> Dell SupportAssist/BIOS SEL read (needs sudo password or desk access) + BIOS "Restore on AC Power Loss = Power On" so it auto-recovers.
8. **First operational item if Hopper-spawning:** tunnels are healthy as of close (all 3 live, mask holding) -- no action needed unless a new drop is reported.

### Standing watch items going into S62

- **Suspend regression** -- if apex/tunnels drop again AND `suspend_stats/success` climbed past 4, the mask was bypassed (firmware modern-standby path); go to kernel `mem_sleep` param / BIOS. Unlikely (mask held 64min) but the one regression signal.
- **11443 durability** -- confirmed surviving suspend/respawn this session; if a future full host *reboot* happens, re-confirm the autossh script edit persisted (it's on-disk in apex repo, should).
- **apex 5 dirty files** (`.dockerignore`/`.gitignore`/`Dockerfile.apex`/`docker-compose.yml`/`entrypoint-apex.sh`) -- someone's in-flight work in apex repo, flagged to apex via #104; not ours, watch it doesn't collide with the entrypoint `nc`-defect fix.

---
## S60 wrap (2026-07-14) -- carry-forwards STILL LIVE

- **PENDING Mihkel batch:** infra values x4 (host/port/key/tmux-session), GH issue-write scope x4, org-board y/n, priority labels y/n.
- **Company-station lane PARKED:** `designs/new/company-station/station-design.md` UNCOMMITTED behind PARKED banner -- do NOT commit/iterate until Mihkel commissions. Herald's parked doc = start; Brunel image + Hopper deploy = execution owners.
- PO-team package delivered (`designs/new/po-team/`, Sagres lore: Henry lead + Gama/Pacheco/Albuquerque/Magellan + Nunes). Channel = literal tmux driving; tmux=doorbell, GitHub=work-of-record; `ready` label = dispatch handshake.
- **S60 WARNINGS (wiki: control-signal-semantics-at-authority-boundaries):** musing != commission; stop != revert; control acts at boundaries, never race a working agent. Do NOT echo idle pings (one-word turns on routine pings; verify, don't narrate).

(*FR:Aen*)
