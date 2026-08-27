# Brunel scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S65 2026-08-27 13:31 -- #108 assessed; Aen posted consolidated AMEND-then-ADOPT to #108 (`issuecomment-5437728323`). GO items DONE: hints §4.5 `inject_patience_s` [CONV] + §6a stale-inbound age alarm + §9 fix; onboarding troubleshooting row; Protocol A x4 to Cal (A9 log trap, relocation-drift pattern, A3-ii correction, migration outcome instance) + both owed read-backs CONFIRMED (daemon-self-report, coordinator-supplied-material); A10 FR row handed to Herald. **PO GATE: A1 (two hubs) answer.**
- **Active items:** [HOLD until PO answers A1] §7 doc moves + MOVED stubs + fix-list; runbook rewrite (also fix stale "Deploy target: prod-llm" header in `stationmaster/docker-compose.yml:2`, verbatim in sagres copy); `max_rounds`/delay -> courier config (A4 code half); A5 design is input to Herald's protocol judgment. [OPEN] canonical home disagreement -- Herald `designs/deployed/stationmaster/` vs mine `teams/framework-research/docs/stationmaster/` -- settle in one exchange at move time, not ruled. Prior open: `network: host` in base compose x-team-base build block (awaiting Aen go/defer). RC data-root migration EXECUTED 2026-08-27 by Lerko, success (container-view confirms limb 2; host `df -hT /` still owed to close primary check).
- **Key decisions this session:** Docs move (protocol/onboarding/hints -> `docs/stationmaster/`), code STAYS in `poc/ghost-bridge/` (5 hard-path consumers + live pid + untracked configs + TRUTHS/SPEC-v3 provenance chain). NOT `designs/deployed/stationmaster/` (per-instance dir by §7's own logic). Leave stubs at old paths.
- **Carry-forward:**
  - [GOTCHA S65] TWO hubs exist: prod-llm `10.100.136.162:2222` (FR+apex) and sagres `100.102.133.125:2222` (po-team/mvox/Passepartout, live 2026-07-15). Disjoint; FR cannot mail po-team. #108 §3 lists only sagres. Convergence = operator decision; runbook rewrite gated on it.
  - [GOTCHA S65] `fr-courier.log` is 0 bytes BY CONSTRUCTION -- courier logs to stderr, `start-fr-courier.ps1:50-51` splits streams -> read `fr-courier.log.err`. Not a fault. Filed with Cal.
  - [GOTCHA S65] md5 across Windows/Linux checkouts lies (CRLF). Hub build files poc vs sagres = 0 real drift (`diff --strip-trailing-cr`); sagres vendored courier is 64 lines behind poc (missing #106).
  - [LEARNED S65] `waiting_for_me` is count-only (`sm-shell:567`); only outbound `deposited_uncollected` has `oldest`. Receiver-side age alarm needs contract minor 1.1.0 OR courier-computed age from `deposited_at` on collect (no contract change -- do this first).
  - [DONE 2026-08-26] Filed by Cal: `daemon-self-report-confirms-config-not-outcome`, `docker-port-empty-under-network-mode-host`, `nopasswd-glob-grant-dead-shell-expands-before-sudo`. Outcome-5 estimate correction = n=1 watch, don't re-submit.
  - [PATTERN] Config-file relocation (daemon.json `data-root`, containerd config.toml `root`) beats bind-mount/fstab for moving a service's storage root when the host has no existing systemd customization to fight -- avoids the boot-order race where the mount isn't up yet when the service starts and it silently repopulates an empty directory. Applies to any daemon with a config-file storage-root knob.
  - [DONE S58] #2/#3/#4 COMPLETED + validated (A(b) live-tested PASS; B Task-disabled+verified; C ratified). #6 F3/F4 CONFIRMED + indexed by Cal (kept SEPARATE, count 156).
  - [LEARNED S58] A negative control is what makes a fix-validation real: Hopper asserted the EXACT pre-fix predicate RAISES on the failure input, THEN the post-fix returns clean on the same input. Parse/compile PASS proves syntax, not behavior -- ask for the neg-control when a fix matters.
  - [PATTERN S58] Tier-D dispatch worked clean: I diagnose+author exact command+justification, Hopper validates against deployed artifacts independently (caught zero drift), Aen authorizes, Hopper executes+logs. Role-split held -- I never touched the operational command.
  - [DEFERRED -> RfC #9, NOT unpin] V5b/P6 attached-pane proactive-wake re-test (only if real recipient-wake latency shows post-unpin or teamless-courier RfC needs it).
  - [WARNING -- post-unpin watch] bare-liveness valid only WHILE FR is the SOLE migrated 2.1.178+ team. 2nd migrated team on this 12-team host -> MUST switch to mode-(a) `-SessionPid` (wrapper already supports it). The .auto.json _unpin_note + wrapper header both document this precondition.

---
## Session transcript (prune beyond line 100)

### 2026-08-27 S65 -- #108 stationmaster consolidation assessment (courier/resolver side)
- Read-only pass: proposal v1.0, contract/onboarding/hints/runbook/README, courier internals (inject_batch 674-753: patience = 50 x 0.2 s hardcoded), sm-shell status impl, comms-mcp.py tools (`send(to)` accepts `<agent>@<team>` -- addressing live while contract §9 defers it), repo-wide inbound-pointer inventory (64 refs / 37 files + `~/.claude/skills/inter-team-comms/SKILL.md` outside repo).
- Verdict to Aen: ADOPT w/ A1 two hubs omitted; A2 reference-impl ownership unnamed; A3 age-alarm backlog item (3 parts); A4 patience `[CONV]`; A5 courier-drains-when-no-live-harness over tmux nudge; A6 Passepartout watcher code not in repo; A7 contract-vs-impl drift; A8 spec-only shapes for MCP(2 layers)/REST(mTLS matrix)/agent-grants(v2 draft)/self-service(threat model + `register` verb); A9 0-byte log by construction; A10 FR node for §3.
- Role-split held: no remote reads, no git, no writes outside scratchpad.

### 2026-08-26 -- RC docker/containerd data-root migration survey (Tier R)
- PO wants `/var/lib/docker` off root LV (93% full, 3.9G free) onto `/home` LV (295G free) on the RC server. Task: survey+plan only, no host changes.
- Measured via SSH (`-T`, no interactive sudo available): disk layout confirms the problem; `docker system df` gives a ~40.7GB upper-bound footprint proxy (exact `du` blocked by TTY-less sudo); no bind mount anywhere references `/var/lib/docker` by path, so the move is transparent to all 9 containers; `network_mode: host` on the 3 named container teams (apex-research/polyphony-dev/entu-research) means `docker port` returns empty even when healthy.
- Team-lead review caught (from the survey's own evidence, not new measurement) that `driver-type: io.containerd.snapshotter.v1` means containerd -- a SEPARATE `containerd.io` systemd service, confirmed via `dpkg -S`, `Wants=/After=containerd.service`, own shim processes, `config.toml` root/state commented-out-defaults -- owns the actual image/container-layer bytes, not Docker's `data-root`. Verified structurally (couldn't get exact byte split, sudo blocked same as docker). Revised recommendation to a two-limb plan (daemon.json + containerd config.toml), with `df -hT /` promoted to primary verification.
- Mid-session scope change: PO runs this himself at the keyboard, not Hopper -- reshaped the whole execution section into a literal runbook (pre-flight measurements incl. `sudo du` on both dirs as step 1, literal commands with expected-output/stop-condition lines, dated do-not-delete gate, rollback as command blocks).
- Kept a pre-existing apex-research entrypoint crash-loop bug (my own artifact, PRs #182/#183) as a labeled triage note in verification/recovery per team-lead's explicit ruling -- distinguishes "press on, known bug" from "roll back, migration broke it" for whoever hits a bad outcome with nobody to ask.
- Published by Aen as artifact `99523dce-bbe6-440b-bbce-9d6687fe5133`. Two publisher-side correctness edits (snapshot/diff narrowed to ID+name since raw `docker ps -a` STATUS/uptime differs every restart; SSH probe placeholder filled from PO's own `deployments.md`, not invented) -- agreed, mirrored the diff fix into the `.md`.

---
## STANDING DECISIONS (carry forward)

[DECISION] Single-provider is correct default for agent runtime. Multi-provider = sidecar, not peer. Three integration seams: peer (Claude-only), sidecar/daemon, MCP server.
[DECISION] `GatewayPorts yes` on RC NOT recommended -- would expose ports to every bridge-networked container. Loopback-only binding default; host-networking is the consent mechanism.
[PATTERN] `network_mode: host` simplification window: tunnels/sockets/local listeners free; tradeoff breaks E-deployment portability (Swarm cannot host-network). Plan b-host vs e-swarm profiles in compose from day one.
[PATTERN] Author attribution: bold `(*FR:Brunel*)` per common-prompt. Never italic.
[DECISION -- S50, Aen-ratified] Standby-agent hot-fix discipline. Fix-then-flag correct ONLY when ALL FOUR hold: (1) artifact in active deployment + time-pressure; (2) fix in MAY-WRITE, bounded, no protocol/design surface; (3) flag immediately w/ reasoning + verification; (4) explicitly on standby for that failure class. Remove any -> default reverts to surface-before-fix. Filed Cal `process/standby-agent-fix-then-flag-discipline`.
[DECISION -- S55/S56] Courier cutover = LAUNCH-OVERRIDE two-config: explicit fr-courier.config.json (gitignored, always-safe default, holds hub key) + fr-courier.config.auto.json (gitignored as of S56, loaded ONLY by restart-fr-courier-with-pid.ps1 -Config default, behind V4 dry-run guard). "auto" activates ONLY via the wrapper; rollback = stop calling wrapper (explicit untouched). Resolver liveness = PROCESS-based (os.kill + /proc field-22 procStart guard + null-pid guard), cross-platform _pid_alive (Windows tasklist / POSIX os.kill).

## CARRY-FORWARD GOTCHAS (all containers)

[GOTCHA] PO edits live files in parallel during a Brunel pass. ALWAYS re-read before each Edit batch -- Edit tool's "File modified since read" catches it.
[GOTCHA -- S52] Rebuilt image w/ UNCHANGED compose config NOT adopted by plain `docker compose up -d`. MUST use `--force-recreate`.
[GOTCHA -- S52] Single-instance lockfile on PERSISTENT volume + pid-only staleness = false-refuse across container recreate (pid namespace resets, recorded pid aliases a live unrelated process). Needs CONTAINER-INSTANCE discriminator: PID-1 starttime (`/proc/1/stat` field 22, parse from last `)`), NOT boot_id (host-kernel-scoped, unchanged by recreate).
[GOTCHA -- S52, STRONG] `( while true; do svc; done ) &` restart-loop under `set -e` MUST `set +e` inside the subshell -- errexit inherited, first non-zero exit kills the loop before relaunch -> restart-on-exit silently fails (restart-on-boot still works, masking it). Reproduce the REAL env (set -e + terminal `exec`).
[GOTCHA -- S52] Test supervisor relaunch by killing ONLY the leaf service pid (`pkill -f <svc>`), NOT a group/subshell kill (takes the loop too = test artifact).
[GOTCHA -- S52] Keygen in a build flow MUST be generate-if-absent (`[ -f key ] || ssh-keygen`), else every rebuild regenerates -> pubkey churn -> forced re-register.
[GOTCHA -- S52, CORRECTED S53] Ephemeral-home paths don't survive rebuild: `~/.ssh` (courier key, known_hosts), `/etc/ssh` (host keys). Fix-split: KEYS -> generate-if-absent or build-secret-seed->copy-each-start on persistent path; STATEFUL CONFIG -> persistent volume + guarded `[ ! -f ]` create. Private keys ONLY on persistent vol, NEVER baked into a layer.
[CORRECTION -- S53] `~/.claude.json` ($HOME ROOT, ephemeral) = CONFIRMED NON-ISSUE (onboarding/trust state, regenerates). The real stateful files are `~/.claude/settings.json` + `~/.claude/mcp.json` + `~/.claude/.credentials.json` (under the persistent volume, guarded-create). One char of path = opposite persistence semantics.
[GOTCHA] WARP TLS interception: `network_mode:host` + `NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem` + system CA. WARP 2nd-container: bridge can't egress + host-net collides sibling ports (`ports:` remap no-op under host-net) -> host-net + docker-exec drive.
[GOTCHA] Named volumes created as root -> `chown 1000:1000` in entrypoint. ubuntu:24.04 ships stock `ubuntu`@uid1000 -> `useradd -u 1000` fails -> `userdel -r ubuntu` first.
[GOTCHA -- S50, OpenSSH 9.x] `ssh-keygen -A -f <prefix>` does NOT create `<prefix>/etc/ssh` and FAILS if absent. Fix: generate single ed25519 directly with explicit `-f <path>`. Smoke-test host-key assertion.
[GOTCHA -- courier S51] ghost_outbox name resolves to team by stripping `-bridge`; MUST be `<registered-team>-bridge` or deposit hits E_UNKNOWN_TEAM, consignment retain-loops. Spool re-resolves dest at DEPOSIT time -> config-fix+restart auto-heals stuck entries.
[GOTCHA -- Windows daemon stop, S51] PowerShell Stop-Process == hard kill; Python gets NO signal -> in-process drain + atexit don't fire. Drain must be external: stop->wait-exit->`--drain-once`. (POSIX delivers the signal; only Windows kill path affected.)
[GOTCHA -- S54, UPDATED S58] stop/start-fr-courier.ps1 manage the PID-FILE lifecycle; the FR courier = SCRIPT-PAIR-launched python.exe. The `FrameworkResearch-Courier` Scheduled Task is now DISABLED (S58, Hopper 16:06; was "Ready/dormant" but its logon+resume triggers DID fire across session boundaries -> orphan pid 38044 holding the lock = Bug B). Registration retained for 2.1.177 rollback (Enable-ScheduledTask). On 2.1.178+ the Task is HARMFUL (pins stale session-<id>, races the wrapper) -- the courier is per-session via the wrapper. LESSON: a dual launcher (script-pair + Task) with no shared pid tracking = the orphan-lock class; stop must reclaim by IDENTITY (CIM cmdline match), not just its own pidfile.
[GOTCHA] CRLF from Windows autocrlf breaks entrypoints. Fix: `sed -i 's/\r$//'` then rebuild.
[GOTCHA] Inbox files created at agent registration time. Specialist -> unregistered agent = message LOST. Spawn service-role agents BEFORE message senders.
[GOTCHA] Container reference-memory path: `~/.claude/projects/-home-ai-teams/memory/` ($HOME-dir-encoded), NOT `~/.claude/memory/`.

## DEFERRED (future surfaces)

- V5b/P6 attached-pane proactive-wake re-test (RfC #9, only if post-unpin latency shows or teamless-courier RfC needs it)
- courier-side CLI version re-validation (hub insensitive, courier sensitive)
- OAuth on hr-devs PROD-LLM container (PO manual step)
- Hub container as standalone Docker image; raamatukoi-dev VPS container; MCP server pattern for visual QA; provider outage behavior in containers; external audit container architecture spec

## INFRA REFERENCE

- Stationmaster hub: `sm@10.100.136.162 -p 2222`; FR key `~/.ssh/sm_framework-research`; FORCED-COMMAND endpoint (structured JSON, not a shell). FR grants both ways with apex-research.
- FR courier runs LOCAL on this Windows dev box FROM this repo's working tree (`teams/framework-research/poc/ghost-bridge/`). Commits from this tree are immediately on-disk where the courier imports them -- NO git pull (that's the rc-host-clone pattern = apex/probe, DIFFERENT substrate).
- Two LOCAL configs (both gitignored as of S56): fr-courier.config.json (explicit, hub key, always-safe default) + fr-courier.config.auto.json (inboxes_dir:"auto", loaded only by the wrapper). Wrapper restart-fr-courier-with-pid.ps1: -Config defaults to .auto.json, -SessionPid optional (mode-a multi-team), V4 dry-run pre-flight guard.
- apex-research container: live exec route = ssh `dev@` the rc HOST then `docker exec apex-research`. Entrypoint `/entrypoint-apex.sh` (MY artifact). Compose `network_mode: host`, no cloudflared sidecar.
- Designs repo: `mitselek-ai-teams/designs/deployed/<team>/container/`.
