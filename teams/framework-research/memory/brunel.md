# Brunel scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S56 CLOSED 2026-06-18 -- THE UNPIN HAPPENED. Team briefed once on the 8 FINAL decided directions (no reopen), then cut over 2.1.177 -> 2.1.181. My S56 role = courier-substrate verifier on runbook step-b + one bounded .gitignore edit. All my work confirmed; nothing left open on my side.
- **Active items:** none. Idle-ready at next boot until team-lead assigns.
- **Key decisions this session:** all 8 directions are FINAL (target 2.1.181; process-liveness resolver merged+validated; mode-(b) bare restart v1 / mode-(a) pid v2; LAUNCH-OVERRIDE two-config; V5b/P6 non-blocking; env FR_COURIER_TEAM_DIR_NAME kept; Volta WS2 flip-ready; 4 documented constraints). I did NOT reopen any.
- **Carry-forward:**
  - [DONE S56] Step-b verify: (a) both configs on disk + valid JSON, explicit PURE; (b) live courier pid 38044 on EXPLICIT config (verified via Win32_Process CommandLine, not claimed), stays UP through flip; (c) wrapper -Config defaults to .auto.json behind V4 dry-run guard. All PASS.
  - [DONE S56] Finding (d): fr-courier.config.auto.json was COMMITTED (0882b86) + NOT gitignored -- contradicted Direction #4. Team-lead approved option 1. I added `fr-courier.config.auto.json` to ghost-bridge/.gitignore (L11, under the explicit-config block, with comment). Verified pattern matches via `git check-ignore -v --no-index`. Team-lead ran `git rm --cached` + commit (his domain; I never touched git tracking).
  - [LEARNED S56] `git check-ignore` (plain) stays SILENT for an already-TRACKED file even when a matching .gitignore rule exists -- tracking shadows the ignore rule. To verify the PATTERN itself, use `git check-ignore -v --no-index <file>` (bypasses the index). Don't read plain-check-ignore-silence as "rule missing."
  - [LEARNED S56] cross-agent independent finding = strong signal: Volta + I both flagged the .auto.json git-state mismatch independently. Reconciled framing directly (his secret-free observation sharpened mine: explicit config is gitignored for the HUB KEY, .auto.json carries no secret -> mismatch is intent-conformance, not security). Two consistent reports > two divergent ones; reconcile peer-to-peer before leaving team-lead with both.
  - [DEFERRED -> RfC #9, NOT unpin] V5b/P6 attached-pane proactive-wake re-test (only if real recipient-wake latency shows post-unpin or teamless-courier RfC needs it).
  - [WARNING -- post-unpin watch] bare-liveness valid only WHILE FR is the SOLE migrated 2.1.178+ team. 2nd migrated team on this 12-team host -> MUST switch to mode-(a) `-SessionPid` (wrapper already supports it). The .auto.json _unpin_note + wrapper header both document this precondition.

---
## Session transcript (prune beyond line 100)

### S56 (2026-06-18) -- UNPIN executed; my role = courier-substrate verify + gitignore hygiene
- Briefed on 8 FINAL directions (team-lead.md L10-20). Absorbed, did NOT reopen.
- Step-b verify (verify-only): a/b/c PASS, found (d). Reported to team-lead. Live courier = pid 38044, `python fr-courier-daemon.py --config fr-courier.config.json` (explicit). pid file absent (script-pair mechanism, not pidfile-tracked) -- live daemon confirmed by process CommandLine.
- (d) closed via the one .gitignore edit. Team-lead did git rm --cached + commit.

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
[GOTCHA -- S54] stop/start-fr-courier.ps1 manage the PID-FILE lifecycle; on the live box the FR courier = SCRIPT-PAIR-launched python.exe, the `FrameworkResearch-Courier` Scheduled Task is DORMANT (Ready, not the live launcher). Restart via the script pair, not the Task.
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
