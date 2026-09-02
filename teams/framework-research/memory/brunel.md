# Brunel scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S70 2026-09-02 15:30, shut down mid-task on PO decision. **[WIP] apex CLI upgrade plan DRAFTED (below), NOTHING EXECUTED, NO dispatch sent to Hopper, no Hopper recon received.** Live fact from the PO's own terminal at ~15:25: `ai-teams@apex-research:~$ claude --version` -> **`2.1.217 (Claude Code)`**. Target = **2.1.258** (npm `latest`, host CLI; `stable` dist-tag is 2.1.236, do not let the native installer default to a channel).
- **[CORRECTION S70 to my S69 header, both halves] (1) "apex inherits the base's claude-code, #113 is their only lever" is HALF WRONG.** apex has TWO claudes: `/usr/local/bin/claude` (base npm-global, root-owned -> cannot self-update, = base ARG, 2.1.217 since S60 base `a983e663`) and `~/.local/bin/claude` (native, `Dockerfile.apex:116`, UNPINNED latest-at-build, autoupdater; lives on the container OVERLAY -> recreate resets it to the baked version). The ai-teams login shell puts `~/.local/bin` FIRST (`entrypoint-apex.sh:397`), so the team runs the NATIVE one; #113 governs only the npm decoy that satisfies the entrypoint's root-PATH `command -v claude` gate (`:345`). S60 recorded BOTH at 2.1.217; still 2.1.217 today => **the native autoupdater has not moved in 6 weeks** (or the 07-22 `--force-recreate` reset it and updates fail since). **(2) The Node-18 GOTCHA is DOWNGRADED:** official docs -- since 2.1.198 the npm package is a wrapper that downloads the same native binary; Node <22 gives an `EBADENGINE` WARNING, install completes, `claude` runs without Node. Not a broken CLI. The trailing-pipe swallow at base `:53` still hides an unresolvable version.
- **[WIP] PLAN, two options, recon FIRST (Tier R, Hopper):** `docker exec -u ai-teams apex-research bash -lc 'type -a claude; readlink -f ~/.local/bin/claude; ls ~/.local/share/claude/versions/; claude doctor; grep -E "autoUpdates|minimumVersion|DISABLE" ~/.claude/settings.json'` + `docker exec apex-research bash -c 'type -a claude; node --version'` + `for p in $(docker exec apex-research pgrep -f claude); do docker exec apex-research readlink /proc/$p/exe; done` (the running processes' exe = which binary the LIVE team is on; two binaries means version equality is not identity). Also `md5sum /home/dev/github/apex-migration-research/Dockerfile.apex` vs our mirror `af379fd3…` (my stale local apex clone is `f48c7a01…` -- the mirror DRIFTS; **the real build source is the apex repo root on RC, editing our mirror changes nothing that RC builds**).
- **Option A -- fast, no rebuild, satisfies the PO ask in minutes:** `docker exec -u ai-teams apex-research bash -lc 'claude install 2.1.258 && claude --version'` (designed autoupdate path => Tier M-arguable; Hopper validates). Takes effect on next `claude` start -> apex must cycle sessions (quiescent shutdown via hub). Survives `docker restart`; does NOT survive `--force-recreate`/rebuild (overlay). Rollback: `claude install 2.1.217` (old binary stays in `versions/`). `claude doctor` first = the autoupdate-failure diagnosis for free (suspect: updater fetch to `downloads.claude.ai` under WARP; `NODE_EXTRA_CA_CERTS` is only in `.bashrc`).
- **Option B -- durable, rebuild path, needs the Dockerfile.apex PR FIRST (against the APEX repo, mirror synced after):** `ARG CLAUDE_VERSION=2.1.258`; `:116` -> `RUN gosu ai-teams bash -c 'set -o pipefail; curl -fsSL https://claude.ai/install.sh | bash -s ${CLAUDE_VERSION}'` then `RUN test -x /home/ai-teams/.local/bin/claude && [ "$(gosu ai-teams /home/ai-teams/.local/bin/claude --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')" = "$CLAUDE_VERSION" ]` (joosep `Dockerfile:225-228` shape; NO outer `set -o pipefail` -- dash); **DELETE `:34` `npm install -g npm@latest | tail -1`** (joosep-measured: npm 12 needs node ^22.22.2, apex pins 22.14.0 -> it FAILS silently today; unmask without deleting and the build breaks); `--insecure` on the outer curl does NOT reach install.sh's inner curl (wiki `trailing-pipe…` instance 3) -> `COPY warp-ca.pem /usr/local/share/ca-certificates/warp-ca.crt && update-ca-certificates` as joosep `:77-78` = NEW build input (Hopper derives from `grep ^COPY`). Then base rebuild (root compose, `--network=host` S60, gate `docker run --rm ai-teams-claude:latest claude --version` == 2.1.258, base `:53` fixed same shape) -> apex `DOCKER_BUILDKIT=1 docker compose build` -> `up -d --force-recreate` = **Tier D** (kills live sessions; apex quiescent first; seed `~/.claude/backups/.claude.json.backup.*` before recreate, S60 OP NOTE). Survives: `~/.claude` vol (OAuth, teams, memory, ssh-host-keys), workspace, source-data. Re-seeded: `~/.ssh` (7b), `~/.local`, venv. `:latest` floating -> base rebuild silently changes what ANY later apex build inherits.
- **Recommendation:** A now, B as the durable follow-up; both gated on the recon. Verification for either: `docker exec -u ai-teams apex-research bash -lc 'claude --version; readlink -f "$(command -v claude)"'` prints `2.1.258 (Claude Code)` AND a `~/.local/share/claude/versions/2.1.258` path.
- **Aen's line-53 sanction: base `:53` is NOT on apex's runtime path; `Dockerfile.apex:116`/`:34` are.** Not written -- the on-path file lives in the apex repo, not ours, and the shutdown came first.
- **Carry-forward:** [DEFERRED] read-back of Cal's 5 `stage-2: pending` entries (PO-deferred from S69). `joosep_sshd` has no backup (PO keyboard). `[PO-9]` apex registry `tmux` drift. `[PO-17]` bridge `dns:`. `[PO-19]` allerk no pid limit.

---
## Session transcript (prune beyond line 100)

### S69/S67 -- FILED, read the wiki not this
- S69: PR #113 GREEN + merged `446251f`; base image NOT rebuilt. [LEARNED] "aligns X with the host" is not a risk argument unless host and X differ ONLY in the aligned thing.
- S67: Joosep/paunvere arc DONE; package at `designs/deployed/joosep/`. Lessons filed: `M `/` M` one char decided what shipped (`git show --stat <merge>` is the only check); six agreeing copies of one guess = one datapoint (record the MECHANISM, not the value); exec bit IS tracked (`git update-index --chmod=+x`), two correct clusters make 24 wrong ones look deliberate; dir digests are NOT portable (MSYS `*` + locale sort) -- per-file manifest is the gate; verify against the BLOB not the worktree on this box (`file(1)` is the authority, not `grep -c $'\r'`); a verification step cannot notice its subject GREW -- re-derive EXPECTs from the artifact; a seam between two correct entries is visible from neither -- co-locate. **8 instances: I err one line from a rule I just wrote. Checks that do not depend on alertness are the ones that catch things.**
- S66: apex live `.env` neither superset nor subset of compose `environment:` (dead `TUNNEL_TOKEN`) -- derive `.env` from the compose block. RC has NO ingress filtering. WARP CA: bind-mount (loud) beats baked (silent). Ask the executor "is there a closer precedent on the box?" before designing. TCP ports are per-host.

---
## STANDING DECISIONS (carry forward)

[DECISION] Single-provider default for agent runtime; multi-provider = sidecar, not peer. `GatewayPorts yes` on RC NOT recommended.
[PATTERN] `network_mode: host` window: tunnels/sockets free; breaks Swarm portability. Plan b-host vs e-swarm profiles from day one.
[PATTERN] Author attribution: bold `(*FR:Brunel*)`. Never italic.
[DECISION -- S50] Standby hot-fix ONLY when all four hold: active deployment + time-pressure; fix in MAY-WRITE, bounded; flag immediately; explicitly on standby for that class.
[DECISION -- S55/S56] Courier cutover = LAUNCH-OVERRIDE two-config (explicit `fr-courier.config.json` + `.auto.json` via wrapper only). Liveness = PROCESS-based.

## CARRY-FORWARD GOTCHAS (all containers)

[GOTCHA -- S70] **Two claudes on one PATH = which version you get depends on how you logged in** (allerk hit it too, joosep `Dockerfile:194-200`). Diagnostic: `type -a claude` + `readlink /proc/<pid>/exe`. Never install both npm-global and native in one image; if the base forces npm, the derived image's gate must check the path the TEAM runs, not root's.
[GOTCHA -- S70] **Native install is on the container OVERLAY, not a volume: the CLI version is EPHEMERAL state.** Recreate = back to the baked version. Pin at build (`bash -s <ver>`) + assert, or accept drift.
[GOTCHA -- S66, STRONG] TWO attach mechanisms conflict: `.bashrc` auto-tmux hook hijacks every login (bare shell unreachable) vs remote-command launcher (`tmux-apex`) + rc-connect `tmux` field. "shell OR session" REQUIRES the latter.
[PATTERN -- S66] Person-shaped (volumes named after the PERSON, whole-$HOME vol) vs team-shaped (apex: team name baked into volume names, rename = migration). Pick person-shaped for one human.
[PATTERN -- S66] `authorized_keys` as `:ro` bind mount re-read every start beats `SSH_PUBLIC_KEY*` env vars.
[GOTCHA -- S66] ssh REMOTE COMMAND = non-login shell, never sources `.bashrc`; native claude in `~/.local/bin` -> not found ONLY over `ssh host <cmd>`. Fix `SetEnv PATH=` in sshd_config.
[GOTCHA -- S66] A container is NOT a security boundary; `docker` group == root. Only rootless Docker or separate Linux accounts are.
[DEFECT -- S66, `[PO-9]`] apex registry `"tmux": "apex"` vs launcher session `apex-research`.
[GOTCHA] PO edits live files in parallel -- re-read before each Edit batch.
[GOTCHA -- S52] Rebuilt image + unchanged compose = NOT adopted by `up -d`; MUST `--force-recreate`. Test supervisor relaunch by killing the leaf pid only.
[GOTCHA -- S52] Lockfile on persistent volume + pid-only staleness = false-refuse across recreate; discriminator = PID-1 starttime (`/proc/1/stat` f22), not boot_id.
[GOTCHA -- S52, STRONG] `( while true; do svc; done ) &` under `set -e` MUST `set +e` inside the subshell.
[GOTCHA -- S52] Keygen in build MUST be generate-if-absent. Ephemeral-home paths (`~/.ssh`, `/etc/ssh`) don't survive rebuild: keys -> seed+copy-each-start; stateful config -> volume + guarded create. Private keys NEVER in a layer.
[CORRECTION -- S53] `~/.claude.json` ($HOME root, ephemeral) regenerates; apex Step 9d2 backs it up anyway. Stateful: `~/.claude/{settings,mcp,.credentials}.json` on the volume.
[GOTCHA] WARP TLS: `network_mode:host` + `NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem`. Base `docker build` on WARP needs `--network=host` (S60; hidden by layer cache).
[GOTCHA] Named volumes created as root -> `chown 1000:1000` in entrypoint. ubuntu:24.04 ships `ubuntu`@1000 -> rename/delete first.
[GOTCHA -- OpenSSH 9.x] `ssh-keygen -A -f <prefix>` fails if `<prefix>/etc/ssh` absent; generate ed25519 with explicit `-f`.
[GOTCHA -- courier] ghost_outbox must be `<registered-team>-bridge`; deposit re-resolves dest. Windows `Stop-Process` = hard kill, drain must be external. `FrameworkResearch-Courier` Scheduled Task DISABLED (S58), kept for rollback only.
[GOTCHA] CRLF from autocrlf breaks entrypoints: `sed -i 's/\r$//'`. Inbox files exist only after registration: spawn service roles BEFORE senders. Container memory path is `~/.claude/projects/-home-ai-teams/memory/`.

## DEFERRED (future surfaces)

- V5b/P6 attached-pane wake re-test; courier-side CLI re-validation; OAuth on hr-devs PROD-LLM; hub as standalone image; raamatukoi VPS container; MCP visual-QA pattern; provider-outage behaviour; external-audit container spec.
- `[PO-17]` bridge via explicit `dns:` (3-command test in joosep design 2.4); `[PO-9]`; allerk README remaining ~35 sections only on a named question.
- Cal's entry restructure (permanence/causation sub-shapes) needs a NON-author read-back. `joosep_sshd` + `sm-state` have ZERO backups (one `docker run --rm -v <vol>:/state:ro … tar czf`).
- Base compose `x-team-base` build block still lacks `network: host` (S60 durable TODO).

## INFRA REFERENCE

- Stationmaster hub: `sm@10.100.136.162 -p 2222`; FR key `~/.ssh/sm_framework-research`; forced-command JSON endpoint.
- FR courier runs LOCAL on this Windows box from this repo's working tree (`teams/framework-research/poc/ghost-bridge/`); two gitignored configs (explicit + `.auto.json` via `restart-fr-courier-with-pid.ps1`).
- apex-research: RC `100.96.54.170`, ssh `ai-teams@ -p 2222` (registry row 2), exec route = `ssh dev@RC` then `docker exec apex-research`. Real build source = RC clone `/home/dev/github/apex-migration-research` (repo root `Dockerfile.apex`, `entrypoint-apex.sh`); `designs/deployed/apex-research/container/` is a MIRROR that drifts. Compose `network_mode: host`; image `apex-research-claude:latest` FROM `ai-teams-claude:latest`; volumes `apex-research_apex-{claude-home,research-repo,source-data}`.
- This box has NO docker. Any build/exec is RC = Hopper/PO.
