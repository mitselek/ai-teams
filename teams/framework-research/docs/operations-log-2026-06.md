# Operations Log — 2026-06 (*FR:Hopper*)

Append-only operations log per `teams/framework-research/prompts/hopper.md` (Provenance — Role-of-Record section). Each entry has all 8 required fields. No edits to prior entries; corrections go as new entries referencing the original by timestamp.

---

## 2026-06-12T16:51+03:00 — T6.a exclusive-create race-harness re-run on prod-llm (FIRST GATE, baseline phase)

**timestamp** — 2026-06-12T16:48+03:00 (dispatch claimed, Task #3 in_progress) through 2026-06-12T16:51+03:00 (baselines complete, evidence captured). UTC stamps in evidence: 2026-06-12T13:50–13:51Z.

**tasker** — Aen (team-lead). Task #3, S50 build-order item 3. PO authorized the full S50 build order incl. deploy + gate; authorization on record with Aen.

**dispatch summary** — Re-run the S48 T6.a exclusive-create race harness (TRUTHS.md:99-102; SPEC-v3 D11 step 3 line 225; courier-hints S4 step 3) on prod-llm (Debian 13). The claim under test: `open(path,"x")` (O_CREAT|O_EXCL) and bash `set -C` (noclobber) are atomic per-filesystem — 50 rounds of two concurrent processes exclusive-creating the same path → exactly one winner per round, zero anomalies, zero mixed content. Atomicity is per-filesystem; only Windows/NTFS-verified at S48. This entry covers the BASELINE phase (host-fs, Tier R); the in-container gate-of-record against the live `sm-state` volume is owed once Brunel's container (Task #1) is built and smoke-tested.

**tier classification + sanction status** — **Tier R (default-permitted, no per-task sanction required).** The harness operates in self-contained, self-cleaning temp/scratch dirs (`/tmp/t6a-*` and `~/t6a-gate/disk`); it creates and removes only its own round files; it mutates no FR-shipped substrate, no Docker volume, no container, no host config. Pure substrate-property measurement. SSH reachability check (uname/python/docker probe) also Tier R.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design-as-shipped):** `teams/framework-research/poc/ghost-bridge/stationmaster/Dockerfile:38-44` (VOLUME `/var/lib/stationmaster`, state on named volume); `stationmaster/docker-compose.yml:27-31,48-49` (named volume `sm-state` → `/var/lib/stationmaster`); `stationmaster/entrypoint.sh:13-19` (spool/grants/dedup dirs created under `$STATE_DIR` on the volume); `stationmaster-courier.py:773-785` (`_exclusive_create_json` = `open(path,"x")` + flush + fsync — the EXACT call site this gate protects), `:924-934` (startup same-volume validation, rename() atomicity per-volume). TRUTHS.md:99-102 (T6.a claim + S48 Windows evidence); SPEC-v3.md:225,228 (D11 step 3 + "owed: re-run on Ubuntu/Debian"); stationmaster-courier-hints.md:54,62 (same-filesystem spool placement + exclusive-create step).
- **Layer 2 (consumer-team operational on substrate host):** N/A at baseline phase — no operational compose dir exists yet; Brunel's Task #1 container is not yet deployed. Surfaced to Aen: the gate-of-record requires Brunel's volume to exist. Proceeded with host-fs baseline per §Graceful Degradation reasoning (Layer 2 not-yet-extant, not unreachable).
- **Layer 3 (running container state):** N/A at baseline phase — no stationmaster container running yet. Baseline targets the BACKING filesystem the volume will sit on instead (see substrate-truth finding below).
- **Audit-trail artifacts (this repo):** this ops-log entry; harness source committed at `teams/framework-research/poc/ghost-bridge/t6a-race-harness.py`; scratchpad `[DISPATCH]` entry. On-host evidence at `~/t6a-gate/evidence-t6a-prodllm-20260612.log`.

**commands executed** (verbatim) —
1. `ssh -i ~/.ssh/id_ed25519_apex -p 22 -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -T michelek@10.100.136.162 'echo PROD-LLM-REACHABLE; uname -a; cat /etc/debian_version; python3 --version; bash --version | head -1; docker --version; id'`
2. (local) `base64 -w0 t6a-race-harness.py` piped to `ssh ... michelek@10.100.136.162 'mkdir -p ~/t6a-gate && base64 -d > ~/t6a-gate/t6a-race-harness.py && wc -c ... && python3 -c "ast.parse(...)"'`  (base64-transit per PowerShell-quoting gotcha)
3. `ssh ... -T michelek@10.100.136.162 'cd ~/t6a-gate && python3 t6a-race-harness.py 50'`  (tmpfs `/tmp` baseline)
4. `ssh ... -T michelek@10.100.136.162 'df -T /var/lib/docker; df -T ~; mkdir -p ~/t6a-gate/disk && cd ~/t6a-gate && python3 t6a-race-harness.py 50 ~/t6a-gate/disk'`  (ext4-on-LVM backing-fs baseline)
5. `ssh ... -T michelek@10.100.136.162 'cd ~/t6a-gate && { ...both runs... } | tee ~/t6a-gate/evidence-t6a-prodllm-20260612.log'`  (evidence capture)

**outputs** —
- **Substrate fingerprint (version-stamped):** Debian 13.4, kernel `6.12.74+deb13+1-amd64`, Python 3.13.5, bash 5.2.37(1), Docker 29.3.0. michelek uid=1001, groups incl. sudo + docker.
- **tmpfs baseline (`/tmp`, type `tmpfs`):** Python `open('x')` 50/50 clean, 0 anomalies; bash `set -C` 50/50 clean, 0 anomalies. GATE PASS.
- **ext4-on-LVM baseline (`/home/michelek/t6a-gate/disk`, fs `/dev/mapper/ai--agenditiimide--tookeskkond--vg-root`, type `ext4`):** Python 50/50 clean, 0 anomalies; bash 50/50 clean, 0 anomalies. GATE PASS.
- **Load-bearing substrate-truth:** `/var/lib/docker` resolves to the SAME device `/dev/mapper/...-vg-root`, type **ext4**, as the home/disk baseline. The `sm-state` named volume will be created under `/var/lib/docker/volumes/` on this exact ext4 device. The ext4 baseline therefore exercises the gate-of-record's BACKING filesystem at the device + fs-type level.

**outcome** — **success (baseline phase).** Both exclusive-create primitives are atomic on prod-llm at both tmpfs and the ext4-on-LVM backing filesystem; the T6.a S48 Windows/NTFS result reproduces on the Debian 13 deployment substrate with zero anomalies across 200 total race rounds (50×2 primitives × 2 filesystems). **Residual gap surfaced to Aen, NOT closed by this entry:** the in-container view of the named-volume mount (overlay/bind-mount indirection) is not yet exercised because Brunel's container does not yet exist. O_EXCL/rename atomicity is a property of the backing fs (ext4, verified), and Docker named-volume mounts pass through to the backing fs without overlay translation — so the ext4 baseline is the authoritative substrate result; an in-container re-run once Task #1 lands is belt-and-suspenders confirmation, recommended before Task #4 flips green. Task #3 held in_progress pending that confirmation + Aen's call on whether the backing-fs result is sufficient to pass the gate.

**ADDENDUM 2026-06-12T17:00+03:00 — Aen [DECISION] re-adjudicated the T6.a gate scope (message ts 16:52, absorbed 16:57):** the host-fs run IS the gate-of-record because prod-llm IS the customer substrate for the first migration targets (hr-devs, comms-dev, backlog-triage); the hub does not depend on exclusive-create (coarse flock + tmp/fsync/rename per Brunel's design). The 2026-06-12T16:51 ext4-on-LVM host-fs run above is therefore the LOAD-BEARING gate-of-record evidence (PASS); the sm-state in-container run is now SUPPLEMENTARY (see Task #7 entry below, step 6). Task #3 closes on host-fs PASS + supplementary volume run.

---

## 2026-06-12T17:00+03:00 — Stationmaster hub deploy to prod-llm (Task #7): artifact transfer + build dry-run

**timestamp** — 2026-06-12T16:58+03:00 (artifact transfer) through 2026-06-12T17:00+03:00 (build complete EXIT 0). Continues below for up -d + smoke.

**tasker** — Aen (team-lead). Task #7, S50 build-order item 7. Deploy per runbook `docs/stationmaster-hub-deployment-runbook.md` §4-§5.

**dispatch summary** — Deploy the stationmaster hub to prod-llm in three steps: (1) `docker compose build` no-deploy dry-run (image assembly unverified — Brunel had no local Docker; report before proceeding); (2) `docker compose up -d` on clean build (PO-authorized, on record); (3) post-deploy `smoke-test.sh` acceptance over real ssh with two scratch keys. This entry covers the artifact-transfer (substrate gap resolution) + build dry-run.

**tier classification + sanction status** —
- **Artifact transfer** = Tier R-adjacent (write of source files into michelek's home; no service/state mutation). Substrate gap surfaced to Aen 16:56 (artifact not on prod-llm — runbook §4 assumes a deployed repo copy that did not exist); proceeded as within-dispatch agency under Aen's full-sequence GO (16:52) + 16:57 ack, flagged not hidden.
- **`docker compose build`** = Tier R-adjacent (image-store write; no running container, no volume, no port bind). Within-dispatch agency under the deploy dispatch.
- **`docker compose up -d`** (next entry) = **Tier D.** Sanction assessed COMPLETE from dispatch + runbook + Aen "PO-authorized, on record": (a) exact command `docker compose up -d` (runbook §4); (b) reason = deploy ratified stationmaster hub to prod-llm per S50 build order; (c) expected = healthcheck healthy <10s, sshd listening on 2222, sm-state volume created.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design-as-shipped):** runbook §3-§9; `stationmaster/Dockerfile`, `docker-compose.yml`, `entrypoint.sh`, `sm-shell`, `sm-register`, `sshd_config.stationmaster`, `.dockerignore`, `smoke-test.sh` (all read pre-transfer).
- **Layer 2 (consumer-team operational on substrate host):** probed 16:56 — clean slate (no image, no container, port 2222 free, no sm-state volume, NO artifact on host). Gap resolved by transfer to `~/stationmaster`.
- **Layer 3 (running container state):** N/A this entry (no container yet).
- **Audit-trail artifacts (this repo):** this ops-log entry; scratchpad Task #7 [DISPATCH]; transferred files sha256-verified against local (5 image files byte-identical).

**commands executed** (verbatim) —
1. (local) `tar -cf - -C stationmaster Dockerfile docker-compose.yml entrypoint.sh sm-shell sm-register sshd_config.stationmaster .dockerignore smoke-test.sh | base64 -w0 | ssh -i ~/.ssh/id_ed25519_apex -p 22 michelek@10.100.136.162 'mkdir -p ~/stationmaster && base64 -d | tar -xf - -C ~/stationmaster && ls -la && sha256sum <5 image files>'`
2. `ssh ... michelek@10.100.136.162 'cd ~/stationmaster && docker compose version && docker compose build; echo EXIT $?; docker images stationmaster:1.0.0'`

**outputs** —
- Transfer: 8 files present in `~/stationmaster`, exec bits preserved (entrypoint/sm-shell/sm-register/smoke-test 0755). 5 image-file sha256 hashes match local byte-for-byte (Dockerfile ae0a2f6b…, entrypoint 7c6c5190…, sm-shell d5b2fe40…, sm-register 87823246…, sshd_config 8bde374e…).
- Build: Docker Compose v5.1.1; `docker compose build` completed all 8 stages, **EXIT 0**; image `stationmaster:1.0.0` (manifest sha256 cc1417f0139b), 195MB disk / 48.2MB content. apt install of openssh-server + python3 + ca-certificates clean; sm user created uid 1000; all 4 COPY + CRLF-strip + chmod 0755 stages succeeded. (debconf "TERM not set" Readline frontend warnings are cosmetic non-interactive-build noise, not errors.)

**outcome** — **success (transfer + build phase).** Brunel's previously-unverified image assembly is now verified clean on the Debian deployment substrate. Reporting build result to Aen before the Tier-D `up -d`; clean build is the explicit go-condition per Aen's "clean build → up -d (PO-authorized, on record)." Continues in next entry.

---

## 2026-06-12T17:01+03:00 — Stationmaster hub `up -d` (Task #7 step 2): HARD-GATE STOP — container crash-loops on missing host key

**timestamp** — 2026-06-12T17:00+03:00 (`up -d`) through 2026-06-12T17:01+03:00 (crash-loop halted via `docker compose stop`).

**tasker** — Aen (team-lead). Task #7 step 2.

**dispatch summary** — `docker compose up -d` to bring the hub live on prod-llm. Up succeeded structurally (network + volume + container created, EXIT 0) but the container CRASH-LOOPS: sshd exits immediately because the entrypoint's generated host key is absent at the path sshd is pointed to. Expected-outcome (healthy <10s, sshd:2222 listening) NOT met → hard-gate STOP, surfaced to Brunel (artifact author) + Aen. Did NOT patch the artifact.

**tier classification + sanction status** —
- `docker compose up -d` = **Tier D**, sanction complete (logged prior entry): exact command per runbook §4; reason = deploy ratified hub per S50; expected = healthy <10s + sshd:2222 + sm-state volume.
- `docker compose stop` (crash-loop halt) = **Tier M** (designed lifecycle event; halts the `restart: unless-stopped` loop; leaves volume + image intact). Within-dispatch agency to stop a crash-looping container I just started under the dispatch — standard recovery posture, not scope expansion.
- Volume/host-key inspection = Tier R.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design):** `stationmaster/entrypoint.sh:24-34` (host-key generation + relocation block) and `:50-54` (sshd exec with `-o HostKey=$HK_DIR/ssh_host_ed25519_key`).
- **Layer 2 (operational on host):** `~/stationmaster` artifact (transferred this session).
- **Layer 3 (running container + volume):** `docker compose logs`; `docker inspect` State; `sudo ls -la /var/lib/docker/volumes/stationmaster_sm-state/_data/` + `ssh_host_keys/`.
- **Audit-trail (this repo):** this entry; prior transfer+build entry; scratchpad.

**commands executed** (verbatim) —
1. `ssh ... michelek@10.100.136.162 'cd ~/stationmaster && docker compose up -d; echo EXIT $?; sleep 12; docker compose ps; docker volume ls | grep sm-state; ss -tlnp | grep :2222; docker compose logs --tail=20'`
2. `ssh ... 'cd ~/stationmaster && docker compose logs --tail=40 --no-color; docker inspect stationmaster --format "ExitCode={{.State.ExitCode}} ... Restarts={{.RestartCount}}"'`
3. `ssh ... 'sudo ls -la /var/lib/docker/volumes/stationmaster_sm-state/_data/ ; sudo ls -la .../ssh_host_keys/ ; sudo ls -la .../etc/ssh/'`
4. `ssh ... 'cd ~/stationmaster && docker compose stop; echo EXIT $?; docker compose ps -a'`

**outputs** —
- `up -d` EXIT 0; network `stationmaster_default` + volume `stationmaster_sm-state` + container created/started.
- Container State: `ExitCode=1 Restarts=8 OOM=false`. Logs repeat: `stationmaster hub up: sshd :2222 ...` → `Unable to load host key: /var/lib/stationmaster/ssh_host_keys/ssh_host_ed25519_key` → `sshd: no hostkeys available -- exiting.`
- Port 2222 NOT listening.
- **Substrate-truth root cause (Layer 3):** `/var/lib/docker/volumes/stationmaster_sm-state/_data/ssh_host_keys/` is **EMPTY**; no `etc/ssh/` leftover under the volume. `entrypoint.sh:27` `ssh-keygen -A -f "$STATE_DIR"` produced zero keys under `$STATE_DIR`, so the relocation `mv "$STATE_DIR"/etc/ssh/ssh_host_* "$HK_DIR"/` (`:30`, `|| true`-suppressed) matched nothing. sshd is pointed at the empty `$HK_DIR` (`:52`) → no hostkeys → exit. **Likely mechanism: `ssh-keygen -A` ignores `-f <dir>` as a path-prefix (it writes to the compiled-in `/etc/ssh/` default and `-f` does not relocate `-A` output on this OpenSSH 9.2p1); the entrypoint assumes `-f` prefixes the output dir, which it does not.**
- `docker compose stop` EXIT 0; container `Exited (1)`, crash-loop halted; volume + image intact.

**outcome** — **aborted-mid-execution (hard-gate STOP).** Deploy did not reach healthy. Root cause is a defect in Brunel's entrypoint host-key generation, NOT a substrate problem. Per operator discipline (do not patch the artifact from own diagnostic judgment), surfaced to Brunel with substrate-truth evidence + Aen for role-of-record. Substrate left clean: container stopped, volume + image preserved for the fix. Re-deploy (re-`up`) pending Brunel's entrypoint fix.

---

## 2026-06-12T17:07+03:00 — Stationmaster re-transfer + rebuild at fixed HEAD f022fed (Task #7, recovery prep)

**timestamp** — 2026-06-12T17:07+03:00.

**tasker** — Aen (team-lead). Task #7 recovery, after Brunel's host-key fix.

**dispatch summary** — Brunel fixed the entrypoint host-key defect (commit f022fed, "ssh-keygen -A -f prefix never lands keys"), one commit after bfe3060 (same-filesystem startup assertion). Aen 17:00 version-skew alert named bfe3060 as new source-of-truth; HEAD is f022fed which supersedes it and carries both changes. Re-transferred the fixed artifact + rebuilt the image as non-mutating recovery prep; the Tier-D `up -d` remains gated on Aen's sm-state-volume reuse-vs-clear decision (the failed `up` created the volume → trips the greenfield STOP condition in Aen's standing sanction).

**tier classification + sanction status** —
- Re-transfer = Tier R-adjacent (home-dir source write; explicitly approved by Aen 16:58, source-of-truth f022fed). 
- `docker compose build` = Tier R-adjacent (image-store write; no service/volume/container mutation). Within-dispatch agency under clean-build standing go.
- `docker compose up -d` = **Tier D, HELD** — verbatim sanction on record (Aen 16:58) but NOT executed; gated on the volume decision per Aen's own "STOP if sm-state exists" condition.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design):** read current `entrypoint.sh` at HEAD f022fed — host-key gen now `ssh-keygen -t ed25519 -f "$HK_DIR/ssh_host_ed25519_key" -N ""` direct (`:48-50`); same-filesystem assertion `stat -c %d` across STATE_DIR/spool/dedup with FATAL-on-divergence (`:24-32`). `git log` confirms f022fed (host-key fix) > bfe3060 (fs-assertion) > 62bba75 (original).
- **Layer 2 (operational on host):** re-transferred `~/stationmaster` at f022fed; entrypoint.sh sha256 2c4afe11 (was the broken variant); sm-shell d5b2fe40 + Dockerfile ae0a2f6b unchanged across commits (only entrypoint moved).
- **Layer 3 (running container):** stopped container from failed `up` still present (Exited 1); volume `stationmaster_sm-state` present (empty/inert).
- **Audit-trail (this repo):** this entry; prior two Task #7 entries; scratchpad.

**commands executed** (verbatim) —
1. `git rev-parse --short HEAD` (f022fed); `git log --oneline -8` (confirmed f022fed host-key fix > bfe3060 fs-assertion).
2. (local) `tar -cf - -C stationmaster <8 files> | base64 -w0 | ssh ... 'rm -rf ~/stationmaster && mkdir -p ~/stationmaster && base64 -d | tar -xf - -C ~/stationmaster && sed -n 46,52p entrypoint.sh && grep -c "spans multiple filesystems" entrypoint.sh && sha256sum entrypoint.sh sm-shell Dockerfile'`
3. `ssh ... 'cd ~/stationmaster && docker compose build; echo EXIT; docker images stationmaster:1.0.0'`

**outputs** — re-transfer confirmed fixed entrypoint (direct ed25519 gen + fs-assertion present). Rebuild EXIT 0; new image manifest `b16179a77e98` (was `cc1417f0139b` — fixed entrypoint layer baked in), 195MB.

**outcome** — **success (recovery prep phase).** Fixed artifact deployed-to-host + rebuilt; crash blocker resolved at the image level. Re-`up` held for Aen's sm-state-volume decision (reuse recommended). On "reuse" → up -d (held sanction) → watch for FATAL-fs line (expect none) + healthy + sshd:2222 → 2 scratch keys + smoke-test → confirmatory in-container T6.a → close #7.

---

## 2026-06-12T17:10+03:00 — Stationmaster remediation up (Task #7): hub HEALTHY, but smoke-test HARD-GATE STOP (sm user nologin shell blocks forced command)

**timestamp** — 2026-06-12T17:09+03:00 (remediation up) through 2026-06-12T17:10+03:00 (smoke-test failure diagnosed).

**tasker** — Aen (team-lead). Task #7 remediation; Aen 17:02 SECOND version-skew alert extended the sanction verbatim to the remediation.

**dispatch summary** — Executed Aen's verbatim-sanctioned remediation `docker compose down && docker compose build && docker compose up -d` with the f022fed (fixed) entrypoint. Hub came up HEALTHY this time (host-key bug fixed). Proceeded to step D (register 2 scratch keys + smoke-test) — smoke-test FAILED at the protocol layer: the hub's sshd authenticates but the forced command never runs ("This account is currently not available"). Root cause: `sm` user shell is `/usr/sbin/nologin`, which refuses to exec the `command="sm-shell <team>"` forced command. SECOND artifact defect (distinct from the host-key bug). Hard-gate STOP; did NOT patch.

**tier classification + sanction status** —
- `docker compose down && docker compose build && docker compose up -d` = **Tier D**, sanction EXTENDED VERBATIM by Aen 17:02: exact command quoted; reason = "replace known-defective entrypoint pre-first-customer"; expected = "healthy <10s, sshd :2222, sm-state volume preserved (down does NOT remove named volumes)." Pre-state confirmed branch-2 (container Exited 1) before executing, matching Aen's described precondition.
- `sm-register` (×2) = **Tier M** (appends to operator-owned authorized_keys on volume; idempotent). Step D per dispatch §3.
- `smoke-test.sh` + diagnostic probes (direct ping, getent passwd, cat authorized_keys, sshd_config grep) = **Tier R**.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design):** `stationmaster/Dockerfile:22` (`useradd --shell /usr/sbin/nologin ... sm`); `sshd_config.stationmaster` (PermitTTY no); `smoke-test.sh` f022fed (Step 0 host-key-existence check added vs the version read earlier — now leads with `ssh-keyscan` ed25519 assertion).
- **Layer 2 (operational):** `~/stationmaster` at f022fed.
- **Layer 3 (running container):** healthy after remediation (Status=running, Health=healthy, Restarts=0); `getent passwd sm` → `/usr/sbin/nologin`; authorized_keys lines `restrict,command="sm-shell <team>"`; host key now present on volume (`ssh_host_ed25519_key` 17:09).
- **Audit-trail (this repo):** this entry + prior three Task #7 entries; scratchpad.

**commands executed** (verbatim) —
1. `ssh ... 'cd ~/stationmaster && docker compose ps -a; docker compose down; docker compose build; docker compose up -d; docker volume ls | grep sm-state'`
2. `ssh ... 'cd ~/stationmaster && sleep 14; docker compose ps; docker inspect stationmaster --format "...Health..."; docker compose logs --tail=15; ss -tlnp | grep :2222; sudo ls -la /var/lib/docker/volumes/stationmaster_sm-state/_data/ssh_host_keys/'`
3. `ssh ... 'cd ~/stationmaster && ssh-keygen -t ed25519 -f /tmp/sm_alpha -N ""; ssh-keygen -t ed25519 -f /tmp/sm_beta -N ""; docker compose exec -T stationmaster sm-register alpha "$(cat /tmp/sm_alpha.pub)"; ... beta ...; sm-register --list'`
4. `ssh ... 'cd ~/stationmaster && ./smoke-test.sh 127.0.0.1 2222 /tmp/sm_alpha alpha /tmp/sm_beta beta'`
5. `ssh ... 'printf ... ping ... | ssh -T -p 2222 -i /tmp/sm_alpha sm@127.0.0.1; docker compose exec -T stationmaster getent passwd sm; ... cat authorized_keys; ... grep sshd_config'`

**outputs** —
- Remediation: down EXIT 0 (container+network removed, **sm-state volume preserved**), build EXIT 0, up EXIT 0.
- Health: `Up (healthy)`, Restarts=0, sshd listening 0.0.0.0:2222 + [::]:2222, host key generated on volume. **Host-key bug FIXED — confirmed.** No FATAL-fs line (same-fs assertion passed).
- `sm-register alpha`/`beta`: both "registered ... live immediately"; `--list` shows alpha+beta.
- **smoke-test FAILED, EXIT 1:** passed Step 0 (host-key exists) then aborted (`set -e`) at first protocol call. Direct ping as alpha returns **`This account is currently not available.`** (ssh exit 1). **Substrate-truth root cause:** `sm` shell = `/usr/sbin/nologin`; sshd execs the forced command via the user's login shell; `nologin` refuses → `sm-shell` never runs.

**outcome** — **partial / aborted-mid-execution (hard-gate STOP).** Transport layer (sshd + host key + port + healthcheck) all GREEN; protocol layer BLOCKED by a second artifact defect — `sm` user `nologin` shell prevents forced-command execution. This is exactly Brunel dispatch §6 trigger 4 (forced-command behaves differently on Debian than Windows unit-smoke predicted — the Windows unit-smoke ran sm-shell directly, never through sshd's login-shell-exec path). NOT patched (Brunel's design — likely fix: give `sm` a real shell e.g. `/bin/sh`). Surfaced to Brunel + Aen. Substrate left running-but-non-functional-at-protocol (hub up, 2 scratch keys registered, no protocol conversation possible). Task #7 held; re-remediation pending Brunel's shell fix.

---

## 2026-06-12T17:24+03:00 — Stationmaster shell-fix remediation + acceptance + confirmatory T6.a (Task #7 CLOSE)

**timestamp** — 2026-06-12T17:23+03:00 (re-transfer 909bbe9 + down/build/up) through 2026-06-12T17:24+03:00 (in-container T6.a PASS). Single consolidated entry per Aen 17:22 session-limit constraint (no intermediate reports).

**tasker** — Aen (team-lead). Task #7 final cycle; Aen 17:22 GO with shell fix committed at 909bbe9 (HEAD 4fc499e = 909bbe9 + ops/wiki chore, no artifact change).

**dispatch summary** — Brunel's `sm` shell fix (nologin→/bin/sh, commit 909bbe9, freeze-exception bounded) replaces the second defect. Ran the final cycle: re-transfer fixed artifact → down → build → up → verify healthy → smoke-test (0667dd1 step-0 version) → confirmatory in-container T6.a → close #7. Task #4 (FR registration) DEFERRED to S51 per Aen — hub left running with 2 scratch keys.

**tier classification + sanction status** —
- `docker compose down && build && up -d` = **Tier D**, covered by Aen's existing remediation sanction (17:02, re-affirmed 17:22 "existing remediation sanction covers this iteration — same reason/expected, new defect being replaced"). Volume REUSE per Aen 17:05 [DECISION] (no Tier-D clear).
- smoke-test + in-container T6.a + diagnostic probes = **Tier R**.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design):** Dockerfile:32 now `useradd --shell /bin/sh` (verified local HEAD + on prod-llm); smoke-test.sh 0667dd1 step-0 ssh-keyscan; sm-shell deposit logic (`cmd_deposit` :383-435, `is_registered` :185-187, `touch_last_seen` :189-201).
- **Layer 2 (operational):** `~/stationmaster` re-transferred at HEAD; Dockerfile sm-shell line = /bin/sh confirmed; smoke-test step-0 present (grep ssh-keyscan = 2).
- **Layer 3 (running container):** healthy post-rebuild (Up healthy, Restarts=0); registry.json shows alpha+beta (lazy-populated on connect); in-container `df -T /var/lib/stationmaster` = ext4-on-LVM (sm-state mount).
- **Audit-trail (this repo):** this entry + 5 prior Task #3/#7 entries; scratchpad; t6a-race-harness.py.

**commands executed** (verbatim) —
1. `tar ... stationmaster/* | base64 | ssh ... 'rm -rf ~/stationmaster && ... tar -xf ...; grep useradd Dockerfile; grep -c ssh-keyscan smoke-test.sh; cd ~/stationmaster && docker compose down && docker compose build && docker compose up -d'`
2. `ssh ... 'sleep 13; docker compose ps; docker inspect ...Health...; sm-register --list; ./smoke-test.sh 127.0.0.1 2222 /tmp/sm_alpha alpha /tmp/sm_beta beta'`
3. diagnostic (Tier R): `cat registry.json`; `sed -n 380,440p sm-shell`; `sed -n 185,205p sm-shell`
4. `base64 t6a-race-harness.py | ssh ... 'docker cp ... stationmaster:/tmp/; docker compose exec -T stationmaster sh -c "mkdir -p /var/lib/stationmaster/.t6a-gate && python3 /tmp/t6a-race-harness.py 50 /var/lib/stationmaster/.t6a-gate; rm -rf ...; "'`

**outputs** —
- Remediation: down/build/up all clean. Dockerfile sm shell = /bin/sh confirmed on host. **Hub HEALTHY** (Up healthy, Restarts=0); sm-state volume REUSED (alpha+beta still registered).
- **smoke-test: 14 passed, 1 failed (EXIT 1).** PASS: host-key, ping+team+fingerprint, grant, deposit-after-grant→accepted, redeposit→duplicate, collect (non-destructive), ack (deletes + idempotent), status (grants_in/out), registry, E_VERSION. **The 1 FAIL is a SMOKE-TEST ORDERING ARTIFACT, not a hub defect:** check "deposit before grant → E_NOGRANT" got `E_UNKNOWN_TEAM "not registered"`. Substrate-truth: hub registry is LAZY-populated on a team's first *connection* (`touch_last_seen` :189-201), NOT at `sm-register` time. When alpha deposits to beta early in the test, beta has not yet connected → genuinely absent from registry → `E_UNKNOWN_TEAM` is the CORRECT hub behavior (deposit-check `is_registered` :187 precedes grant-check :416). The test assumes registering a key makes it a valid deposit target immediately; the hub requires first-connect. **Hub is MORE correct than the test** (distinguishes unknown-team from known-but-no-grant). Defect is in `smoke-test.sh` ordering/expected-code, flagged to Brunel.
- **Confirmatory in-container T6.a:** ran against `/var/lib/stationmaster/.t6a-gate`, `df -T` = `/dev/mapper/...-vg-root` ext4 (the sm-state named-volume mount, in-container view). **Python 50/50 + bash 50/50, 0 anomalies, GATE PASS.** Self-cleaned. Python 3.11.2 in-container (vs 3.13.5 host) — both pass.

**outcome** — **SUCCESS — Task #7 deploy COMPLETE.** Hub deployed + healthy + protocol-functional on prod-llm (Debian 13, ext4-on-LVM). Both Brunel artifact defects (host-key gen f022fed, sm shell 909bbe9) fixed + verified on substrate. T6.a gate fully closed: host-fs (load-bearing, 2026-06-12T16:51) + in-container sm-state-volume (confirmatory, this entry), both 50/50 both primitives. Smoke-test 14/15 with the 1 fail diagnosed as a test-script ordering artifact (lazy-registry vs eager-register assumption), NOT a hub or deploy defect — flagged to Brunel for a test fix. Task #4 (FR production-key registration) DEFERRED to S51 per Aen; hub left running with 2 inert scratch keys (alpha/beta) for S51 pickup. **Three layered-gate catches this deploy arc: structural-EXIT-0≠success (crash-loop), transport-green≠protocol-OK (nologin), and smoke-fail-triage (test-artifact-not-defect) — each surfaced with substrate-truth, none patched unilaterally.**

---

## 2026-06-12T17:28+03:00 — framework-research registered on the hub + real-ssh verify (Task #4, operator portion)

**timestamp** — 2026-06-12T17:28+03:00. Aen 17:28 LIFTED the session-limit constraint and REVERSED the Task #4 deferral — FR registration back ON this session.

**tasker** — Aen (team-lead). Task #4 (dogfood + end-to-end); operator portion = register FR + verify; Herald drives the courier round-trip.

**dispatch summary** — Generated the framework-research production keypair on the Windows dev box (the courier host, per onboarding §1 — private key stays where the courier runs), registered the public half on the live hub via `sm-register`, and verified end-to-end with a real-ssh ping from the Windows box directly to prod-llm:2222. This is the operator portion of Task #4; the courier deposit/collect/ack round-trip is Herald's.

**tier classification + sanction status** —
- FR keypair generation = local Windows dev-box action (courier key material; not an FR-shipped-substrate op). Per onboarding §1, the customer team generates its own key; FR is the customer, Herald's courier runs here.
- `sm-register framework-research <pubkey>` = **Tier M** (operator action; appends `restrict,command="sm-shell framework-research"` to operator-owned authorized_keys on the volume; idempotent). Aen 17:28 explicit GO ("DO register the FR production key via sm-register").
- Real-ssh ping verify = **Tier R**.

**deployed-artifacts-read declaration** —
- **Layer 1:** `stationmaster-onboarding.md` §1-§3 (key-gen + register + verify recipe); runbook §5.
- **Layer 2:** `~/stationmaster` on prod-llm (HEAD 909bbe9).
- **Layer 3:** hub running + healthy; `sm-register --list` now shows alpha, beta, framework-research.
- **Audit-trail:** this entry; prior Task #7 entries.

**commands executed** (verbatim) —
1. (local Windows) `ssh-keygen -t ed25519 -f ~/.ssh/sm_framework-research -N "" -C "framework-research"`
2. `PUB=$(cat ~/.ssh/sm_framework-research.pub); echo "$PUB" | base64 | ssh ... michelek@prod-llm "PUB=\$(base64 -d); docker compose exec -T stationmaster sm-register framework-research \"\$PUB\"; sm-register --list"`
3. (local Windows, real-ssh direct to hub) `printf '{"v":1,"cmd":"ping"}' | ssh -T -o BatchMode=yes -o StrictHostKeyChecking=accept-new -i ~/.ssh/sm_framework-research -p 2222 sm@10.100.136.162`

**outputs** —
- Keypair generated: `~/.ssh/sm_framework-research`(.pub) on the Windows dev box. Pubkey comment `framework-research`.
- `sm-register`: "registered team 'framework-research' (forced command: sm-shell framework-research) ... live immediately"; `--list` = alpha, beta, framework-research.
- **Real-ssh ping (the courier's exact path, Windows/Git-Bash → prod-llm:2222, no proxy):** `{"v":1,"ok":true,"cmd":"ping","ts":"2026-06-12T14:28:46Z"}` then `{"team":"framework-research","fingerprint":"SHA256:nkmhWNccqwpk5t4tQmLbrPOJoIcQZAr2jPomCegDpyQ","protocol":1}`. ssh EXIT 0. **The previously-untested real-ssh transport from the Windows dev box is CONFIRMED working** — port 2222 reachable over org network, forced-command lands as `framework-research`.

**outcome** — **SUCCESS — Task #4 operator portion COMPLETE.** framework-research registered + verified live over real ssh from the Windows dev box (the one untested transport path per Task #4). Hub now carries 3 keys (alpha, beta scratch + framework-research production). Herald's courier round-trip (deposit/collect/ack with local inject + ledger) is the remaining Task #4 acceptance — unblocked, his to drive. FR private key at `~/.ssh/sm_framework-research` on the Windows dev box (courier host).

---

## 2026-06-12T17:35+03:00 — apex-research registered (cross-team customer, PO-sanctioned)

**timestamp** — 2026-06-12T17:35+03:00.

**tasker** — Aen (team-lead), relaying PO sanction. The apex cross-team test is the PO's explicit S50 ask.

**dispatch summary** — apex-research accepted the second-customer invite and sent their pubkey over the ghost-bridge; Aen relayed it with PO sanction. Registered it as a second cross-team customer on the live hub.

**tier classification + sanction status** — `sm-register apex-research <pubkey>` = **Tier M** (operator action; appends `restrict,command="sm-shell apex-research"` to operator-owned authorized_keys; idempotent). PO-sanctioned via Aen 17:52 ("the apex cross-team test is the PO's explicit ask this session").

**deployed-artifacts-read declaration** — Layer 1: onboarding §2 (operator registers customer pubkey). Layer 3: hub running + healthy; `sm-register --list` post = alpha, beta, framework-research, apex-research. Audit-trail: this entry.

**commands executed** (verbatim) —
1. `PUB='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAfUQ3nKW1OvAycfiq2pqTz/64G1qY0HB9lnAClJm/y3 apex-research@stationmaster'; echo "$PUB" | base64 | ssh ... michelek@prod-llm "PUB=\$(base64 -d); docker compose exec -T stationmaster sm-register apex-research \"\$PUB\"; sm-register --list"`

**outputs** — "registered team 'apex-research' (forced command: sm-shell apex-research) ... live immediately"; `--list` = alpha, beta, framework-research, apex-research.

**outcome** — **SUCCESS.** apex-research registered as cross-team customer. **OPERATOR NOTE FOR NEXT OPERATOR (per Aen 17:52, PO-relayed):** apex-research's `~/.ssh` is EPHEMERAL (container overlay); their stated v1 policy is ROTATE-ON-RESTART — they will send a FRESH pubkey for re-registration after any container restart. This is ACCEPTED for v1: a rotation request = one more `sm-register apex-research <new-pubkey>` (normal Tier-M operator action), and the old key line is replaced (sm-register is idempotent / re-registering a team replaces its key). Do NOT be surprised by a re-registration request from apex. The sturdier infra-mount alternative (persistent apex-side key) is queued for the PO. Hub roster now: alpha, beta (scratch), framework-research (production, my key), apex-research (cross-team). **fr-test still PENDING** Herald's verbatim pubkey (Aen relayed only a fragment; awaiting full key — will be a 5th registration).

---

## 2026-06-12T17:37+03:00 — fr-test registered (Herald's key, per Aen intercept) — ALL registrations complete

**timestamp** — 2026-06-12T17:37+03:00.

**tasker** — Aen (team-lead). Task #4 counterpart; Aen 17:48 intercept + ruling.

**dispatch summary** — Herald sent his full pubkey (17:37) labeled team `framework-research`, believing it was FR production — but he was operating PRE-intercept (his send crossed my 17:35 correction + Aen's 17:48 ruling). Aen 17:48 intercept: register Herald's key (fragment `...BI1u`) as `fr-test`, NOT framework-research (FR production = my already-verified key; two keys under one team = sshd first-match-forced-command hazard). Registered as fr-test per the ruling.

**tier classification + sanction status** — `sm-register fr-test <pubkey>` = **Tier M** (operator action; idempotent; appends `restrict,command="sm-shell fr-test"`). Aen 17:48 ruling explicit.

**deployed-artifacts-read declaration** — Layer 3: hub running; `sm-register --list` post = alpha, beta, framework-research, apex-research, fr-test (5, as expected). Audit-trail: this entry; Aen 17:48 intercept.

**commands executed** (verbatim) —
1. Verified key bytes end in `BI1u` (matches Aen's relayed fragment).
2. `PUB='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBJXvU6hOp3vzBC8WKtGv93NmpCSpLC49fYMjeAyBI1u framework-research'; echo "$PUB" | base64 | ssh ... michelek@prod-llm "PUB=\$(base64 -d); docker compose exec -T stationmaster sm-register fr-test \"\$PUB\"; sm-register --list"`

**outputs** — "registered team 'fr-test' (forced command: sm-shell fr-test) ... live immediately"; `--list` = alpha, beta, framework-research, apex-research, fr-test.

**outcome** — **SUCCESS — ALL Task #4 operator registrations COMPLETE.** Hub roster (5): alpha + beta (scratch, my smoke-test), framework-research (production, MY key ~/.ssh/sm_framework-research), fr-test (Herald's key, counterpart for the FR courier round-trip), apex-research (cross-team, PO-sanctioned, ephemeral-rotate). **Note the key-vs-comment decoupling:** Herald's key carries comment `framework-research` but is registered as team `fr-test` — the forced command (`sm-shell fr-test`) sets the team identity, the .pub comment is cosmetic and does NOT affect routing. Each key appears exactly once in authorized_keys → clean sshd first-match. Herald's courier round-trip (deposit/collect/ack) remains his to drive; lazy-registry ordering note relayed. **Hopper operator work for S50: DONE.**

---

## 2026-06-12T17:40+03:00 — fr-test RE-registered with Herald's dedicated key (corrects the 17:37 entry above)

**timestamp** — 2026-06-12T17:40+03:00.

**tasker** — Aen Task #4 / Herald (key supply). Correction to the 2026-06-12T17:37 fr-test entry by reference (append-only; do not edit prior).

**dispatch summary** — The 17:37 fr-test registration used Herald's FIRST key (ends `BI1u`, comment `framework-research`, his private `~/.ssh/sm_framework_research`) as a stopgap per Aen's intercept. Herald 17:43 then supplied a DEDICATED fr-test keypair (ends `mrx7`, comment `fr-test`, his private `~/.ssh/sm_fr_test`) — this is the key his courier will actually dial for the fr-test identity. Re-registered fr-test with the `mrx7` key so the hub-registered key matches the private key Herald holds for that identity.

**tier classification + sanction status** — `sm-register fr-test <mrx7-key>` = **Tier M** (idempotent; re-registering a team REPLACES its key line). Within Task #4 registration scope.

**deployed-artifacts-read declaration** — Layer 3: post-register, grepped the fr-test authorized_keys line → carries `mrx7`, NOT `BI1u` (replacement confirmed); `--list` still 5 teams. Audit-trail: this entry + the 17:37 entry it corrects.

**commands executed** (verbatim) —
1. Verified new key ends `mrx7`.
2. `PUB='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK9ijoXMlSGB9MoGF3SY+Eo2lO0aOcA/BBo89jMNmrx7 fr-test'; echo "$PUB" | base64 | ssh ... 'docker compose exec -T stationmaster sm-register fr-test "$PUB"; grep "sm-shell fr-test" authorized_keys | grep -o mrx7\|BI1u; sm-register --list'`

**outputs** — "registered team 'fr-test' ... live immediately"; fr-test line now carries `mrx7`; `BI1u` no longer on the fr-test line; `--list` = 5 teams (alpha, beta, framework-research, apex-research, fr-test).

**outcome** — **SUCCESS — fr-test now bound to Herald's dedicated `mrx7` key.** The `BI1u` key (Herald's original framework-research-labeled key, the intercept stopgap) is now registered to NO team — correct, since FR production = my key. Herald's courier dials fr-test with `~/.ssh/sm_fr_test` (mrx7) and framework-research with my key. Final clean state: 5 teams, each one key. **Hopper operator work for S50: DONE (final).**

**CLARIFICATION 2026-06-12T18:10+03:00 (Herald audit-flag, append-only — corrects the byte-tail SHORTHAND in the entry above, NOT the key):** the entry above uses the 4-char shorthand `mrx7` for the fr-test key. The FULL base64 tail is `...BBo89jMNmrx7` (Herald references it as `MNmrx7`) — re-verified on the live hub authorized_keys this timestamp. The registered KEY was always correct (`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK9ijoXMlSGB9MoGF3SY+Eo2lO0aOcA/BBo89jMNmrx7`, Herald's `sm_fr_test`); only my log's abbreviation was shorter than the real tail, which could trip a future byte-tail match. Hub state + Herald's courier config both confirmed matching. Herald reports Task #4 round-trip DONE: 15/15 on the live hub + courier `--once` inject+ledger; all 3 rungs of Brunel's lazy-registry ladder (af722a8) demonstrated live (E_UNKNOWN_TEAM never-connected → E_NOGRANT known-ungranted → accepted post-grant). **LESSON: log full discriminating key-tails (≥8 base64 chars), not 4-char shorthands — a 4-char tail risks ambiguity in an audit byte-match.**

---
