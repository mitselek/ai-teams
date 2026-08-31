# Brunel scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S66 closed 2026-08-31 09:11. **Joosep container LIVE on RC** (`joosep`, port 2231, all Step 0-11 checks green, `-Session` verified on the sshd remote-command PATH). Design of record `docs/joosep-container-design-2026-08-28.md` **v3.6**, 19-row PO register. Package `designs/new/joosep/`. **A REBUILD IS PENDING AND HELD** -- runbook Step 14, waiting on Joosep's Step 9a-9c auth test. Hopper holds; container `Up 2 days`, RestartCount=0, ZERO connections so far.

## FROZEN TREE -- the rebuild depends on this list (recomputed 2026-08-31 09:11)

```
186781db879f521c178299bfcb4b5974  Dockerfile
cb8405a00b5ebae8931f2202fadea02b  entrypoint.sh
5375d9b8314adcc9642e290be0f636d9  docker-compose.yml
2c80186c3e6322b4338cd01f61d50a2a  .env.example
530329c2a04adf1dd0c4411e2439b06d  FIRST-TASKS.md
83eda2994bfcaf3a15ab95914c93a05e  joosep.sh
7b4474e7dfcd55681a216ab64f5bbd33  warp-ca.pem      <- HOST-sourced, NOT in the repo
e78b95ab74a7a233854ba097a909c9b2  teams/paunvere/  <- DIRECTORY digest, 10 files
```
Digest cmd: `find teams/paunvere -type f | sort | xargs md5sum | md5sum`. **Build-input list is DERIVED, never enumerated: `grep -E '^(COPY|ADD) ' Dockerfile`.** Host key that must NEVER change: **`SHA256:C8qVyjSQuyiSXPzEBcIOh2tfUwlk9EJtU2WxhAEbO3U`**.

- **Pending rebuild delivers (one operation, Step 14):** Estonian FIRST-TASKS + team-package seeding + `TEAM_NAME=paunvere` in `.env`. Pre-step: **`mv` (never `rm`) `~/FIRST-TASKS.md`**, gated on mtime == first boot. TEAM_NAME alone needs no rebuild (compose default, `.env` override, recreate only).
- **Closed by PO:** PO-1 allerk-base · PO-2 host-net (measured: bridged container cannot resolve DNS at all) · PO-3/4 container starts under-credentialled, PAT + EVR connector are the team's own first tasks · PO-10 `deploy.resources.limits` IS enforced · PO-12 revoke Joosep's `dev` key (Step 9d, **Tier D**, held until 9a-9c) · PO-15 permanent · PO-18 no provisioning-side connector step.
- **Open / routed elsewhere:** **PO-19 `allerk` has NO pid ceiling** (CPU+mem enforced, `PidsLimit` unset) -- one line in Lerko's compose, routed to Aen. PO-16 roster size. PO-17 (deferred) bridge via explicit `dns:`. PO-9 registry drift. Cal's entry restructure (permanence/causation sub-shapes) -- next session, needs a NON-author read-back.
- **[LEARNED] -- the session in one line:** six times I erred one line from a rule I had just written or filed. **The checks that caught things were the ones that did not depend on anyone being alert** -- a parse gate, a build assertion, an md5 pin, reading the artifact instead of the ack. **Awareness of a pattern is not protection against it.**
- **[LEARNED] Hopper's, the best structural fix here:** derive the staging list from the Dockerfile (`grep '^COPY'`), never maintain one beside it -- **two lists that must agree will eventually disagree.** That makes the failure unrepresentable rather than merely caught.
- **[LEARNED] "Proven working" can be an artifact of the mask.** I exempted the Node layer from change BECAUSE it was proven-working; it was the one broken line. A mask does not just hide a failure -- it manufactures the evidence you use to decide not to look.
- **[WARNING] Three divergences between ACCEPTED and IMPLEMENTED in this package, all caught by others, none by me.** Acceptance produces a message; implementation produces a file; nothing compares the two. Before any future "as agreed", grep the artifact.
- **[WARNING] Joosep has NOT connected yet (zero sshd attempts).** The `mv ~/FIRST-TASKS.md` gate is safe only while that holds. If 9a-9c slips past ~2 days, re-derive from md5 rather than from confidence.
- **[DEFERRED] `[PO-17]`** bridge-via-explicit-`dns:` -- Hopper's resolver-scoping hypothesis (embedded DNS 127.0.0.11 -> WARP DoH on 127.0.2.2/.3 = the CONTAINER's loopback inside a bridged netns). Exact 3-command test in design doc 2.4. Only if real isolation is ever wanted for a named reason.

---
## Session transcript (prune beyond line 100)

### 2026-08-28 S66 -- Joosep Madar container design (RC), infra track w/ Hopper
- Reference survey read end-to-end: apex lineage (`designs/deployed/apex-research/container/*`), backlog-triage lineage (`designs/new/backlog-triage/container/*` -- the closer analogue: read-and-report + Jira, debian-from-scratch), launch path (`~/bin/rc-connect.ps1` + `~/bin/rc-deployments.json`, skill at `~/.claude/skills/rc-connect/SKILL.md`), courier arming (onboarding Steps 1-6 + apex's build-secret/host-key-pin/supervise trio).
- Delivered `docs/joosep-container-design-2026-08-28.md`. Chose debian-from-scratch + native Claude installer; dropped Python/Playwright/2nd-sudo-user/courier-key/dashboard-port; ADDED cpu+mem+pids limits (fleet deviation, stated reason). Port 2231, menu char `j`, single user `ai-teams`.
- 10-row PO register; `[PO-1]` team name and `[PO-2]` network mode gate the build. Told Aen the build should WAIT on the research brief rather than run under a placeholder (volume names embed the team name).
- Role-split held: no host reads by me, no writes outside my doc + scratchpad, no git. Classified the bridge probe Tier M (it's `docker run`, creates a container) rather than calling it a read to ease approval.
- [LEARNED S66] I designed off the artifact the REQUEST named (apex) instead of asking what already exists on the host. Hopper's inventory found `allerk` -- a 10-day-old container that was already the answer. **Ask the executor "is there a closer precedent on the box?" before templating off the named one.** Cost: a full v1->v2 rewrite and one retracted section.
- [LEARNED S66, TWICE-WRONG -- my worst error this session] I claimed a "2230 collision" (v2), then when corrected **ESCALATED it to a three-way divergence (v2.1) instead of asking whether there was a claim at all**. There was none: **TCP ports are a PER-HOST namespace**, so screenwerk@shipyard:2230 and allerk@RC:2230 are both true. I had imported a shipyard row into an RC port question. **Compounding-on-correction is worse than the original mis-read** -- when corrected, re-derive from scratch before reframing. Also: **there is NO fleet-wide port-uniqueness invariant** (prod-llm AND RC both run :2226), so "claimed on another host" never disqualifies a port.
**[S66 gotchas -- FILED, read the wiki not this]** ~15 entries at wiki 214: auto-tmux-bare-shell, cleartext-creds-bashrc, host-net-zero-isolation, image-tag-not-identity, per-host-port-namespace, verification-step-goes-stale, trailing-pipe-exit-status, authorized-keys-comment-not-evidence, pids_limit-one-setting, record-lives-where-claim-is-made, scope-bound-identifier (umbrella), container-control-as-only-independent-check, warp-cgnat-misread, hub-fsync-false-accept, smoke-test-throwaway-identities. Plus `capability-guard` + `verification-certifies-a-moment` amendments.
[GOTCHA S66] apex's live `.env` is neither superset nor subset of what the container consumes: carries `TUNNEL_TOKEN` (no consumer, dead cloudflared-sidecar leftover) and OMITS `REPO_URL`/`SOURCE_REPO_URL`/`TEAM_NAME` (ride compose defaults). Never inherit a `.env.example`; derive it from the compose `environment:` block, which is the actual contract.
[FACT S66] RC has NO host ingress filtering -- `iptables -L` INPUT policy ACCEPT with **zero rules**, ufw/nftables/firewalld inactive. **Port choice is not a security control on this host.** Also: `ai-teams-claude:latest` IS on RC (07-22, 1.73GB); `allerk:latest` derives from nothing (773MB). Compose creates a `<name>_default` bridge even for `network_mode: host` services -- an artifact, not a misconfiguration.
[DECISION S66] WARP CA: prefer apex's **bind-mount** of the host cert over allerk's baked-in copy. A stale baked CA fails SILENTLY after rotation and reads as a network fault (needs rebuild); a moved host path fails LOUDLY at boot. Trade a silent failure for a loud one.

---
## STANDING DECISIONS (carry forward)

[DECISION] Single-provider default for agent runtime; multi-provider = sidecar, not peer (seams: peer/sidecar/MCP). `GatewayPorts yes` on RC NOT recommended -- loopback-only default; host-networking is the consent mechanism.
[PATTERN] `network_mode: host` simplification window: tunnels/sockets/local listeners free; tradeoff breaks E-deployment portability (Swarm cannot host-network). Plan b-host vs e-swarm profiles in compose from day one.
[PATTERN] Author attribution: bold `(*FR:Brunel*)` per common-prompt. Never italic.
[DECISION -- S50, Aen-ratified] Standby-agent hot-fix discipline. Fix-then-flag correct ONLY when ALL FOUR hold: (1) artifact in active deployment + time-pressure; (2) fix in MAY-WRITE, bounded, no protocol/design surface; (3) flag immediately w/ reasoning + verification; (4) explicitly on standby for that failure class. Remove any -> default reverts to surface-before-fix. Filed Cal `process/standby-agent-fix-then-flag-discipline`.
[DECISION -- S55/S56] Courier cutover = LAUNCH-OVERRIDE two-config: explicit fr-courier.config.json (gitignored, always-safe default, holds hub key) + fr-courier.config.auto.json (gitignored as of S56, loaded ONLY by restart-fr-courier-with-pid.ps1 -Config default, behind V4 dry-run guard). "auto" activates ONLY via the wrapper; rollback = stop calling wrapper (explicit untouched). Resolver liveness = PROCESS-based (os.kill + /proc field-22 procStart guard + null-pid guard), cross-platform _pid_alive (Windows tasklist / POSIX os.kill).

## CARRY-FORWARD GOTCHAS (all containers)

[GOTCHA -- S66, STRONG] TWO attach mechanisms exist in the fleet and they CONFLICT. (A) `.bashrc` auto-tmux hook (`entrypoint-backlog-triage.sh:286-299`, runbook §18) fires on `[ -z "$TMUX" ] && [ -n "$SSH_CONNECTION" ]` -> `exec tmux attach`: hijacks EVERY login, a bare shell is UNREACHABLE. (B) remote-command launcher (`/usr/local/bin/tmux-apex`, `entrypoint-apex.sh:428-432`) + rc-connect appending the tmux cmd to `$sshArgs` (`rc-connect.ps1:162-165`): bare ssh untouched. Any "shell OR session" requirement REQUIRES B and forbids A. rc-connect already encodes the distinction as the registry `tmux` field.
[PATTERN -- S66] **Person-shaped vs team-shaped container.** Team-shaped (apex) names volumes after the TEAM (`apex-research_apex-claude-home`) -> the team name is baked in, rename = volume migration losing OAuth + scratchpads. Person-shaped (`allerk`) names them after the PERSON (`allerk_home`, explicit `name:` keys) + whole-$HOME vol + separate `work` vol mounted OVER $HOME -> the team name lives only in a dir inside the home vol, rename = `mv`. **Pick person-shaped whenever the occupant is one human**; it decouples the container from whatever team runs inside it. (I asserted the bake-in as a blocking ordering constraint in v1, then had to retract it -- it is a property of the BASE, not of containers.)
[PATTERN -- S66] `authorized_keys` as a `:ro` BIND MOUNT re-read every start (allerk) beats `SSH_PUBLIC_KEY{,_2,_3}` env vars (apex): adding a key = edit file + restart, no recreate, no rebuild.
[GOTCHA -- S66] `-Session`-style flags run their launcher as an ssh REMOTE COMMAND = non-interactive non-login shell, never sources `.bashrc`. Native Claude lives in `~/.local/bin` -> `claude: command not found`, but ONLY over `ssh host <cmd>`. Fix = `SetEnv PATH=/home/<user>/.local/bin:...` in sshd_config (allerk does this).
[GOTCHA -- S66] A container is NOT a security boundary, and specifying it carefully does not make it one. Check the HOST's `authorized_keys` + `docker` group membership BEFORE writing any "must not reach" list: `docker` group == root-equivalent (`docker run -v /:/host`). Lerko's allerk README says it best: *"separates configuration, not privilege"*; the only real boundaries are **rootless Docker or separate Linux accounts**.
[DEFECT -- S66, unfixed, `[PO-9]`] apex registry row says `"tmux": "apex"` but `/usr/local/bin/tmux-apex` manages session `apex-research`. Two sessions can coexist; the menu can land in an empty one.

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

- V5b/P6 attached-pane proactive-wake re-test (RfC #9, only if latency shows); courier-side CLI re-validation (hub insensitive, courier sensitive); OAuth on hr-devs PROD-LLM (PO manual step)
- Hub container as standalone image; raamatukoi-dev VPS container; MCP pattern for visual QA; provider-outage behavior in containers; external audit container spec
- [S66] `[PO-17]` bridge-via-explicit-`dns:` (resolver-scoping hypothesis, exact test in joosep design §2.4); `[PO-9]` registry drift; allerk README's other ~35 sections (heading-map first, only on a named question)

## INFRA REFERENCE

- Stationmaster hub: `sm@10.100.136.162 -p 2222`; FR key `~/.ssh/sm_framework-research`; FORCED-COMMAND endpoint (structured JSON, not a shell). FR grants both ways with apex-research.
- FR courier runs LOCAL on this Windows dev box FROM this repo's working tree (`teams/framework-research/poc/ghost-bridge/`). Commits from this tree are immediately on-disk where the courier imports them -- NO git pull (that's the rc-host-clone pattern = apex/probe, DIFFERENT substrate).
- Two LOCAL configs (both gitignored as of S56): fr-courier.config.json (explicit, hub key, always-safe default) + fr-courier.config.auto.json (inboxes_dir:"auto", loaded only by the wrapper). Wrapper restart-fr-courier-with-pid.ps1: -Config defaults to .auto.json, -SessionPid optional (mode-a multi-team), V4 dry-run pre-flight guard.
- apex-research container: live exec route = ssh `dev@` the rc HOST then `docker exec apex-research`. Entrypoint `/entrypoint-apex.sh` (MY artifact). Compose `network_mode: host`, no cloudflared sidecar.
- Designs repo: `mitselek-ai-teams/designs/deployed/<team>/container/`.
