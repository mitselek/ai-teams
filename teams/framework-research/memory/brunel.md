# Brunel scratchpad

## Summary (lines 1-15 — always read on startup)
- **Current state:** S51 (2026-06-15) CLOSED. Task #4 (session-scoped FR courier daemon) SHIPPED + LIVE (pid 3300, owns FR↔hub, 30s poll); Task #4 marked complete (commit 9982ff2). Task #5 (apex container hardening) = PLAN ONLY written + approved + HARD-GATED → S52 lead carry-forward. Stop-path defect fixed + Hopper-verified. 2 Cal patterns filed + my read-backs done.
- **Task #4 deliverables (poc/ghost-bridge/):** `fr-courier-daemon.py` (WRAPS canonical `stationmaster-courier.py` via importlib — Herald's ref UNTOUCHED; adds ONLY: resolve_target_inbox 3-guard router [entry.to present + name-hygiene + <agent>.json already-exists else default_inbox; NEVER creates ghost inbox], process_inbound_routed, session lifecycle [immediate run_once + 30s poll + SIGINT/SIGTERM drain + atexit lock release]); `fr-courier.config.json` LIVE (sm@10.100.136.162 -p 2222, key ~/.ssh/sm_framework-research, ghost_outboxes=["apex-research-bridge"], default_inbox=team-lead) + `.example.json`; `start-fr-courier.ps1` / `stop-fr-courier.ps1`; `.gitignore` covers the 4 runtime artifacts. Dedup INHERITED from ref (delivered-ledger; v2 4x/8x leak NOT reproduced — proven). OPS: daemon logs to STDERR → live log = fr-courier.log.err (stdout=0 bytes).
- **Key S51 decisions/outcomes:** (1) outbox MUST be `<registered-team>-bridge` — `apex-research-bridge`→apex-research (CR-4 rename, team-lead chose over my alias-map; `apex-bridge`→"apex"=E_UNKNOWN_TEAM trap). (2) STOP on Windows = hard kill (no signal→no in-process drain/atexit); stop-fr-courier.ps1 does stop→wait-exit→`--drain-once`→verify (portable, honest header). (3) Herald's stuck apex-Q (FR-S51-WINDOWPREP) SELF-HEALED on the routing-fix restart (spool re-resolves dest at deposit-time from current config) = exactly 1 copy, no manual migrate/re-send.
- **Carry-forward → S52:** [DEFERRED-GATED] **Task #5 apex hardening = S52 LEAD ITEM.** Plan: `docs/apex-container-hardening-plan-2026-06-15.md`. APPROVED design-only. HARD GATES before ANY execution: (a) explicit PO go + scheduled window; (b) CONFIRMED FR→apex docker-exec route at window-time (tailnet LOGGED OUT → rc/100.96.54.170 STALE, live IP 10.200.13.114 maybe unreachable w/o tailnet → apex tailscale re-login OR ssh-rc-host-then-local-docker-exec); (c) apex ONLINE. ASK1=pure-bash supervise() restart-loop baked into /entrypoint-apex.sh (bash stays PID1, mirror sshd Step7); ASK2(b)=generate keypair ONCE + BuildKit build-secret→image-FS seed→entrypoint copies seed→~/.ssh each start (~/.ssh is EPHEMERAL st_dev 78) + idempotent sm-register = non-churn+rebuild-durable. OQ: live courier.json path; network-mode/cloudflared status (Herald queuing to apex next session); apex offered to drop session-side launches (startup.md 4e+5) for single-owner.
- **Carry-forward → S52 (knowledge):** Cal filed both my S51 patterns (wiki 141): `spool-stores-raw-entry-reresolve-on-deposit` [brunel,herald,hopper] + `artifact-claims-more-than-it-implements` [brunel,hopper,aen]. MY read-backs DONE (Stage-2 advanced); Herald/Hopper read-backs still pending to FULLY clear Stage-2 (Hopper authoritative on "1/1; removed" + instance-2-probe lines).
- **[LESSON — STRONG, S51]** over-claim-artifact n=3 this session (over-generous TESTED tag + CTRL_BREAK stop-header + unqualified drain claim, 2 of 3 mine) → empirical-probe BEATS artifact-inference; an artifact's prose must describe what it DOES, not what it should do. Honesty-pass is the fix. (Now the `artifact-claims-more-than-it-implements` wiki entry.)
- **[LESSON — STRONG, S51]** relay-fidelity over tasker-framing when an instruction CROSSES a state change: through 6 crossed Herald flip-flops + team-lead's drop-then-reconcile on the stuck apex-Q, verifying live truth before executing prevented both a dupe and a loss. Don't blind-execute a drop/migrate/re-send whose premise was overtaken.
- **[LESSON]** S33+ read-your-own-deployed-artifacts before diagnosing (designs/deployed/<team>/container/* = Layer-1 lineage); Layer-2/3 runtime truth still needs live introspection (three-layer substrate-truth discipline).

---

## STANDING DECISIONS (carry forward)

[DECISION] Single-provider is correct default for agent runtime. Multi-provider = sidecar, not peer. Three integration seams: peer (Claude-only), sidecar/daemon, MCP server. Audit independence = external container reading committed git artifacts, NOT different-provider Medici.
[DECISION] `GatewayPorts yes` on RC NOT recommended even long-term — would expose ports to every bridge-networked container. Loopback-only binding is the default; host-networking is the consent mechanism.
[PATTERN] `network_mode: host` simplification window: tunnels, sockets, local listeners free for the container. Tradeoff: breaks E-deployment portability (Swarm cannot host-network). Plan `b-host` vs `e-swarm` profiles in compose from day one.
[PATTERN] Author attribution: bold `(*FR:Brunel*)` per common-prompt. Never italic.
[DECISION — S50, Aen-ratified Protocol-A-grade] Standby-agent hot-fix discipline. Fix-then-flag correct ONLY when ALL FOUR hold: (1) artifact in active deployment + known time-pressure; (2) fix in MAY-WRITE domain, bounded, no protocol/design surface; (3) flag immediately w/ reasoning + verification; (4) explicitly on standby for exactly this failure class. Remove any → default reverts to surface-before-fix. Filed Cal `process/standby-agent-fix-then-flag-discipline`.

## CARRY-FORWARD GOTCHAS (all containers)

[GOTCHA] PO edits live files in parallel during a Brunel pass. ALWAYS re-read before each Edit batch — Edit tool's "File modified since read" catches it. If read >1 message ago, re-read. (Fired repeatedly in S51 — my own scratchpad.)
[GOTCHA] WARP TLS interception: `network_mode:host` + `NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem` + system CA.
[GOTCHA] Named volumes created as root → `chown 1000:1000` in entrypoint.
[GOTCHA] SSH: useradd creates locked account. Fix: `usermod -p '*'` for pubkey auth.
[GOTCHA] Container rebuild regenerates SSH host keys → `ssh-keygen -R "[host]:port"` after rebuild. (Stationmaster persists host keys on the state volume to avoid this.)
[GOTCHA — S50, OpenSSH 9.x] `ssh-keygen -A -f <prefix>` does NOT create `<prefix>/etc/ssh` and FAILS if absent — keys silently don't land (hub would have no host key → sshd fails at `up`, not build). Fix: generate the single ed25519 key directly with explicit `-f <path>`. Committed f022fed. Defense: smoke-test.sh step-0 host-key assertion. LESSON: post-deploy acceptance must assert invariants that runtime-only failures violate.
[GOTCHA — courier, S51] ghost_outbox name resolves to team by stripping `-bridge`; the name MUST be `<registered-team>-bridge` or deposit hits E_UNKNOWN_TEAM and the consignment retains-loops in the spool (no loss, never delivered). Spool re-resolves dest at DEPOSIT time from current config → a config-fix+restart auto-heals stuck entries (filed Cal).
[GOTCHA — Windows daemon stop, S51] PowerShell Stop-Process == TerminateProcess == hard kill; Python gets NO SIGTERM/SIGINT, so in-process drain-on-shutdown + atexit do NOT fire on stop. Drain must be external: stop→wait-exit→`--drain-once`. (POSIX delivers the signal; only the Windows kill path is affected.)
[GOTCHA] CRLF from Windows git autocrlf breaks entrypoints. Fix: `sed -i 's/\r$//'` then rebuild.
[GOTCHA] Inbox files created at agent registration time. Specialist → unregistered agent = message LOST. Spawn order: service-role agents BEFORE message senders.
[GOTCHA] Base64-encode-via-SSH strips shell-escape backslashes. Use heredoc with single-quote delimiter for scripts with `\"` or `\s`.
[GOTCHA] Consecutive `**Bold:**` lines collapse on GitHub. Use `- **Bold:**` bullet lists.
[GOTCHA] Container reference-memory path: `~/.claude/projects/-home-ai-teams/memory/` ($HOME-dir-encoded), NOT `~/.claude/memory/`. Verify before citing.
[GOTCHA — S34] Edit tool with multi-hundred-line `old_string` is fragile. For large compress-passes use Write to rewrite the whole file after surgical read of head + tail. (Used again for this S51 shutdown prune.)

## DEFERRED (future surfaces)

- Task #5 apex hardening execution (S52 lead — see carry-forward; PO+window+route+apex-online gated)
- courier-side CLI 2.1.170→2.1.175 re-validation (hub insensitive, courier sensitive — S3 retention flip; apex image baked 2.1.162 / runtime 2.1.173 = version skew watch)
- OAuth on hr-devs PROD-LLM container (PO manual step)
- Hub container as standalone Docker image
- raamatukoi-dev VPS container deployment
- MCP server pattern for visual QA service
- Provider outage behavior in containers (what does Claude process do on API failure?)
- External audit container architecture spec

## INFRA REFERENCE

- Stationmaster hub: `sm@10.100.136.162 -p 2222`; FR key `~/.ssh/sm_framework-research`; host-key fp SHA256:CNcFjOxr...K13U. FR grants both ways with apex-research (in[fr-test,apex-research] out[apex-research,fr-test]).
- apex-research container (S51 live intel): hostname apex-research, IP 10.200.13.114 (IPv6 2a02:88:15:c80c::/64); tailscale LOGGED OUT → OLD 100.96.54.170 CGNAT STALE. Entrypoint `/entrypoint-apex.sh` (root:root 0775, MY artifact) + `/entrypoint.sh`; Dockerfile at repo `apex-migration-research`/`workspace/Dockerfile.apex`. Volumes (st_dev): PERSISTENT LVM ~/.claude,~/workspace,~/source-data; EPHEMERAL overlay /,/tmp,~/.ssh. apex identity SHA256:9cgJVaSOBAC95/hae73zNXfAOwCQTfrlFEF+aOHswro.
- apex access (rc-deployments.json): apex-research = hostAlias `rc` (→100.96.54.170, NOW STALE per tailnet-logout), port 2222, user ai-teams, key ~/.ssh/id_ed25519_apex. CONFIRM authoritative exec route w/ Hopper + live probe before S52 window.
- Cloudflared tunnel: `526a23d1-1f7f-472f-8df1-a9239bbe3fe4` → `apex-research.dev.evr.ee` → `http://apex-research:5173`. QUIC blocked → `--protocol http2`.
- evr-ai-base:latest = Debian bookworm-slim + Node 22 + Claude Code + gh + gosu + tmux + SSH.
- Designs repo: `mitselek-ai-teams/designs/deployed/<team>/container/`. Prism (active): `~/Documents/github/.mmp/prism` ↔ `mitselek/prism` (PRIVATE).
