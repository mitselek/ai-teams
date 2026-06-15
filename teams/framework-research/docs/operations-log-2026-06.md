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

## 2026-06-15T12:11+03:00 — apex-research host-side route probe (S52, Task #5 §1(b) gate)

**timestamp** — 2026-06-15T12:11+03:00

**tasker** — Aen (team-lead)

**dispatch summary** — READ-ONLY host route probe for the apex-container-hardening plan's §1(b) execution gate. Confirm whether a host-side `docker exec` path to the apex container exists, since apex's *container-side* tailscale is logged out (stale CGNAT 100.96.54.170 container path / live container addressing 10.200.13.114 unreachable without the tailnet). Establish the §1(b)(ii) alternate route: SSH to the `rc` HOST as `dev@`, run `docker` locally on the host. DO NOT touch the apex container; DO NOT restart anything. The whole hardening remains hard-gated.

**tier classification** — **Tier R** (read-only inspection throughout). Sanction: **default-permitted, no per-task sanction required.** All commands run are in the prompt's Tier R host-side examples (`docker ps`, `docker inspect`) plus `docker exec apex-research id` (in-container read-only identity probe, zero mutation). The hardening hard gate (no restart/rebuild/state-change) is untouched by this probe.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design-as-shipped):** `designs/deployed/apex-research/container/*` previously read this dispatch arc (entrypoint Step 7 sshd precedent, F3/F4 root-owned entrypoint); design network shape = bridge + cloudflared sidecar per Brunel's plan §5/F10. Not re-read this probe (subsequent-dispatch; scratchpad-current).
- **Layer 2 (operational on substrate host):** not probed this round (route-confirmation scope only; `$COMPOSE_DIR=/home/dev/github/apex-migration-research` carried from scratchpad). NOT required for a route probe.
- **Layer 3 (running container state):** PROBED. `docker ps` (host-side, dev@) → `apex-research` Up 3 weeks. `docker inspect apex-research --format {{.HostConfig.NetworkMode}}` → **`host`**. `docker exec apex-research id` → `uid=0(root)`. Per-container NetworkSettings IP → empty ("invalid IP"), consistent with host-network mode (no per-container netns IP).
- **Audit-trail artifacts (this repo):** `~/bin/rc-deployments.json` (hosts.rc=100.96.54.170; entry num:"1" "RC server" rc:22 user:dev key:null = the host-side route; num:"2" apex-research rc:2222 ai-teams = the tailnet container path that is down). Scratchpad `teams/framework-research/memory/hopper.md` apex substrate facts.

**commands executed** (verbatim) —
- `ssh -T -o ConnectTimeout=15 -o BatchMode=yes -o StrictHostKeyChecking=accept-new dev@100.96.54.170 'echo "[host-route OK] uname: $(uname -n)"; docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'`
- `ssh -T -o ConnectTimeout=15 -o BatchMode=yes dev@100.96.54.170 'docker inspect apex-research --format "{{range .NetworkSettings.Networks}}{{.IPAddress}} {{end}}"; docker inspect apex-research --format "{{.HostConfig.NetworkMode}}"; docker exec apex-research id'`

**outputs** —
- Host reachable: `uname -n` = `paarisprogemis-fyysiline` (RC bare-metal box). SSH exit 0.
- `docker ps`: `apex-research  Up 3 weeks` (running). Also cortex-{mcp,api,db}, uikit-dev, backlog-triage, entu-research, polyphony-dev all Up.
- `docker exec apex-research id` → `uid=0(root) gid=0(root) groups=0(root)` — **exec route live, lands as root** (matches F4: root needed to edit root-owned `/entrypoint-apex.sh`).
- Network mode = **`host`** (NOT bridge). Per-container IP empty (expected under host networking).

**outcome** — **SUCCESS. Host-side docker-exec route to apex CONFIRMED LIVE.** `dev@100.96.54.170:22` → `docker exec apex-research` works and lands as root, fully bypassing the apex container's logged-out tailscale. This is the §1(b)(ii) route the plan required; gate (b) satisfiable via this path. **DRIFT SURFACED (not patched):** live network mode = `host`, contradicting FR-design Layer-1 bridge+cloudflared shape — closes plan GAP F10 / partially OQ-5 as an L1↔L3 drift; surfaced to team-lead per three-layer discipline, NOT resolved by me. NOTHING mutated; hardening hard gate intact (still needs PO go + scheduled window + apex online).

(*FR:Hopper*)

## 2026-06-15T12:14+03:00 — apex OQ-1 resolution: live courier.json path + stationmaster layout (S52, Tier R, inside hard gate)

**timestamp** — 2026-06-15T12:14+03:00

**tasker** — Aen (team-lead), part 3 of his 12:13 ACK

**dispatch summary** — Using the confirmed read-only host-side exec route (12:11 probe), resolve plan OQ-1: the LIVE courier.json path + stationmaster dir layout inside the running apex container, so Brunel's §3 supervisor `--config` arg and §4 key-bake target real in-container truth, not the stale local checkout. STRICT BOUNDS per dispatch: read-only only (`cat`/`ls`/`find`), no writes/edits/process-changes/restart.

**tier classification** — **Tier R** (read-only container-side inspection: `ls -la`, `find`, `cat` — all in the prompt's Tier R container-side examples). Default-permitted. Hardening hard gate (no restart/rebuild/mutation) untouched. Exec ran as `-u ai-teams` (the service-owning user) for read fidelity; pure reads.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design):** plan §2 F8 (courier script path) + F5 (ephemeral `~/.ssh` vs persistent `~/.claude`) + scratchpad apex facts carried; OQ-1 is explicitly an unresolved-at-L1 item (plan says only script path known, not config path) → this read is the L3 truth-gather the discipline prescribes.
- **Layer 2 (operational):** not separately probed; the in-container file IS the operational truth here (config lives on the persistent `~/.claude`-adjacent workspace mount, read directly at L3).
- **Layer 3 (running container):** PROBED read-only. Dir listing, find-sweep, cat of courier.json — outputs below.
- **Audit-trail (this repo):** prior 12:11 route-probe entry (same route reused); scratchpad apex substrate facts.

**commands executed** (verbatim) —
- `ssh -T dev@100.96.54.170 'docker exec -u ai-teams apex-research bash -lc "ls -la /home/ai-teams/workspace/teams/apex-research/stationmaster/; find /home/ai-teams/workspace -name courier*.json -type f; find /home/ai-teams/workspace -name stationmaster-courier*.py -type f"'`
- `ssh -T dev@100.96.54.170 'docker exec -u ai-teams apex-research cat /home/ai-teams/workspace/teams/apex-research/stationmaster/courier.json'`

**outputs** —
- **Single courier.json**, path `/home/ai-teams/workspace/teams/apex-research/stationmaster/courier.json` (582 bytes, mtime Jun 15 10:48). No alternate locations (find sweep clean).
- Launcher confirms F8: `.../stationmaster/stationmaster-courier.reference.py` (46308 bytes).
- courier.json shape: `team=apex-research`, `ssh_target=sm@10.100.136.162` (FR hub), `ssh_key=~/.ssh/stationmaster_apex`, `ssh_opts=[-p 2222 ...StrictHostKeyChecking=yes IdentitiesOnly=yes BatchMode=yes]`, `inboxes_dir=/home/ai-teams/.claude/teams/apex-research/inboxes`, `ghost_outboxes=[framework-research-bridge]`, `target_inbox=team-lead`, `state_dir=/home/ai-teams/.claude/teams/apex-research/stationmaster-state`, `poll_interval_s=30`, `collect_limit=100`.

**outcome** — **SUCCESS — OQ-1 resolved.** Supervisor `--config` arg = `/home/ai-teams/workspace/teams/apex-research/stationmaster/courier.json` (single, canonical). **TWO findings for Brunel's ASK 2 design, surfaced not patched:** (1) the courier's configured `ssh_key` is `~/.ssh/stationmaster_apex` — NOT the `sm_apex-research` name the plan §4 step-3 entrypoint snippet assumes; the bake must target `stationmaster_apex` (or courier.json + bake must be reconciled to one name). (2) `ssh_key` is under `~/.ssh/` = ephemeral overlay (F5) → EMPIRICALLY confirms the rebuild-loses-key problem ASK 2 solves; whereas `inboxes_dir`+`state_dir` are under `~/.claude/` = persistent, so courier STATE survives rebuild, only the KEY doesn't. Clean F5/F6 confirmation. Nothing mutated; hard gate intact.

(*FR:Hopper*)

## 2026-06-15T12:34+03:00 — apex hardening rebuild — ABORTED PRE-EXECUTION (hard-gate-on-drift, S52)

**timestamp** — 2026-06-15T12:34+03:00

**tasker** — Brunel (dispatch package 12:33; PO greenlight via Aen 12:21; key-name reconcile confirmed via Aen 12:25)

**dispatch summary** — Tier D dispatch: apex-research container hardening rebuild during quiescence. 4 commands on the rc host in the apex build-source repo: (1) `ssh-keygen` courier keypair in build context, (2) `DOCKER_BUILDKIT=1 docker compose build` (BuildKit secret seeds key to image FS + bakes supervisor/entrypoint edits), (3) `docker compose up -d` recreate (volumes preserved), (4) `cat stationmaster_apex.pub` for hub registration. Full sanction package present (exact cmds + reason + expected outcome).

**tier classification** — **Tier D** (concur with dispatch — rebuild+recreate, image-replacing). Sanction COMPLETE in dispatch: exact commands quoted, reason stated (asks undeliverable without rebuild; entrypoint is COPY'd so hot-patch non-durable), expected outcome + 4-point verification stated. Sanction was NOT the blocker — the substrate-state pre-flight was.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design):** `designs/deployed/apex-research/container/*` re-synced by Brunel this session (per his rebuild-steps doc §0); + `teams/framework-research/docs/apex-hardening-rebuild-steps-2026-06-15.md` (full as-applied detail) read in full.
- **Layer 2 (operational / build source on rc host):** PROBED. `/home/dev/github/apex-migration-research` on rc host (NOT the Windows `~/Documents/github/...` path Brunel's doc cites — that's the local-workspace authoring path). Build-source compose `network_mode: host` line 35 (pre-existing, correct). git: last commit `d9074bb` "session 21 wrap"; only stale ` M docker-compose.yml` + a 2026-05-21 backup; branch main. origin/main = `257654d`.
- **Layer 3 (running container):** `docker ps` → apex-research Up 3 weeks (quiescent, present).
- **Audit-trail (this repo):** 12:11 route probe, 12:14 OQ-1 entries (same route reused); Brunel dispatch 12:33; rebuild-steps doc.

**commands executed** (verbatim — ALL Tier R pre-flight; NO mutating command ran) —
- `ssh -T dev@100.96.54.170 'docker ps --filter name=apex-research ...; ls -d /home/dev/github/apex-migration-research; grep -c "^supervise()" .../entrypoint-apex.sh; grep -c "ssh-seed/stationmaster_apex" .../entrypoint-apex.sh; head -1 .../Dockerfile.apex; grep -c "id=courier_key" .../Dockerfile.apex; grep -c courier_key .../docker-compose.yml; grep -n network_mode .../docker-compose.yml; git status --short; git branch --show-current'`
- `ssh -T dev@100.96.54.170 'cd .../apex-migration-research; git log -1 --oneline; git remote -v; git ls-remote --heads origin main'`
- (local) `grep -c "^supervise()" ~/Documents/github/apex-migration-research/entrypoint-apex.sh; git status --short` in local checkout.

**outputs** —
- rc-host build source: `supervise()` = **0**, Step-7b seed-copy = **0**, Dockerfile line1 = old header (NOT `# syntax=dockerfile:1.4`), `id=courier_key` = **0**, compose `courier_key` = **0**. NONE of Brunel's hardening edits present on the rc host.
- rc-host git: last commit `d9074bb` (session-21 wrap); hardening not committed; origin/main `257654d` (not the hardening commit either).
- LOCAL Windows checkout `~/Documents/github/apex-migration-research/`: `supervise()` = **1**; 5 files ` M` modified-uncommitted (.dockerignore, .gitignore, Dockerfile.apex, docker-compose.yml, entrypoint-apex.sh). **The edits live ONLY here, uncommitted.**

**outcome** — **ABORTED PRE-EXECUTION (hard-gate-on-drift, L1↔L2 transit gap).** Brunel's hardening diff exists ONLY as uncommitted working-tree edits in the LOCAL Windows-workspace checkout; the image builds on the rc host from `/home/dev/github/apex-migration-research`, which does NOT carry the edits (not committed, not pushed, not transited). Running step 2 `docker compose build` now would produce a GREEN build of the OLD entrypoint/Dockerfile — zero supervisor, zero seed-copy, zero build-secret wiring — i.e. a clean build delivering NONE of the ask, plus the keypair-secret mount would have no consuming RUN. Per Tier D discipline I STOPPED, ran no mutating command, did NOT improvise the transit (git push = Aen's domain; scp = silent-broadening). Surfaced back to Brunel + Aen with substrate-truth evidence at the L1↔L2 boundary. Resolution belongs to tasker: commit+push+rc-pull OR an explicit file-transit step must land the edits on the rc-host build source BEFORE the build command can be dispatched.

(*FR:Hopper*)

## 2026-06-15T12:47+03:00 — apex hardening rebuild RE-DISPATCH — STOPPED at clean-tree gate + GH_TOKEN regression (S52)

**timestamp** — 2026-06-15T12:47+03:00

**tasker** — Aen (re-dispatch 12:45, transit resolved via branch `fr/apex-container-hardening-s52` commit `0602f686`, PR #165) executing Brunel's suspended Tier D dispatch

**dispatch summary** — Transit resolved (branch pushed to origin); re-dispatch = (step1) confirm rc working tree clean, STOP if dirty; (step2) `git fetch origin && git checkout fr/apex-container-hardening-s52`; (step3) re-run 5-marker grep gate; (step4) proceed keygen→build→up -d --force-recreate→verify. Build==reviewed (PR #165) invariant.

**tier classification** — **Tier D** (rebuild+recreate; checkout advances build source). Sanction complete. STOPPED at step 1 (clean-tree gate) per Aen's own instruction; never reached the mutating commands.

**deployed-artifacts-read declaration** —
- **Layer 1 (FR design / branch):** PR #165 branch `fr/apex-container-hardening-s52` compose read via `git show origin/fr/...:docker-compose.yml`.
- **Layer 2 (operational rc working tree):** PROBED. rc `/home/dev/github/apex-migration-research` `git status --short` → ` M docker-compose.yml` + untracked `docker-compose.yml.bak.20260521-091347`. `git diff` of the working-tree compose isolates the single uncommitted line.
- **Layer 3 (running container):** prior probes (apex-research Up, NetworkMode=host) carried; not re-read (no new L3 question this step).
- **Audit-trail (this repo):** scratchpad apex-research substrate facts (P4.05 GH_TOKEN amendment 2026-05-21T09:18, S34 dispatch); ops-log-2026-05 P4.05 entry; this month's 12:11/12:14/12:34 entries.

**commands executed** (verbatim — ALL Tier R; NO mutating/git-state-changing command on rc) —
- `ssh -T dev@100.96.54.170 'cd .../apex-migration-research; git status --short; git log -1 --oneline; git branch --show-current; git ls-remote --heads origin fr/apex-container-hardening-s52'`
- `ssh -T dev@100.96.54.170 'cd ...; git diff -- docker-compose.yml; ls -l --time-style=long-iso docker-compose.yml docker-compose.yml.bak.20260521-091347'`
- (local, read-only) `git fetch origin fr/apex-container-hardening-s52; git show origin/fr/apex-container-hardening-s52:docker-compose.yml | grep GH_TOKEN/...`; `git show origin/main:docker-compose.yml | grep GH_TOKEN`; `git show d9074bb:docker-compose.yml | grep GH_TOKEN`.

**outputs** —
- rc working tree DIRTY: ` M docker-compose.yml` (mtime 2026-05-21 09:18) + untracked `.bak.20260521-091347`.
- The uncommitted diff is EXACTLY one line: `+ - GH_TOKEN=${GH_TOKEN:-}` inserted after `GITHUB_TOKEN` in the apex-research env block. = my S34 P4.05 amendment (PO Option B, GH_TOKEN-preserve-through-recreate).
- GH_TOKEN provenance: NOT in branch compose (grep shows GITHUB_TOKEN + courier_key secret, NO GH_TOKEN), NOT in origin/main, NOT in d9074bb committed. The line was NEVER committed — operational working-tree-only on rc since 2026-05-21.

**outcome** — **STOPPED PRE-CHECKOUT (clean-tree gate, Aen step-1) + GH_TOKEN-REGRESSION hard-gate-on-drift (L2↔branch).** Two blockers: (1) rc tree dirty on docker-compose.yml → per Aen's instruction, STOP + report, do not force-checkout. (2) SUBSTANTIVE: the dirty line is the S34 GH_TOKEN-preservation amendment, and the hardening branch's compose does NOT carry `GH_TOKEN=${GH_TOKEN:-}`. A `checkout fr/... && up -d --force-recreate` would DROP GH_TOKEN from apex's container env — a credential regression silently undoing S34 P4.05 (the multi-system-loss class the three-layer discipline exists to catch). Ran no mutating cmd; did NOT force-checkout, stash, or discard the GH_TOKEN line (improvising the resolution = silent-broadening). Surfaced to Aen + Brunel with evidence. Resolution belongs to tasker: the hardening branch's compose should ADD `GH_TOKEN=${GH_TOKEN:-}` (one line, after GITHUB_TOKEN) so build==reviewed AND GH_TOKEN preserved; then re-confirm + I re-run clean-tree + 5-marker gate. (Also flag: rc base d9074bb→branch advances 716 apex commits — Aen pre-cleared as expected; no deliberate-pin reason known to me.)

(*FR:Hopper*)

## 2026-06-15T12:58+03:00 — apex hardening rebuild EXECUTED — build+recreate SUCCESS; courier blocked on inboxes_dir (S52, Tier D)

**timestamp** — 2026-06-15T12:58+03:00

**tasker** — Aen (re-dispatch 12:52, GH_TOKEN committed to branch 30749c85) executing Brunel's Tier D dispatch (12:33 + corrections 12:35/12:38)

**dispatch summary** — Execute the apex hardening rebuild during quiescence: stash rc dirty line → checkout branch fr/apex-container-hardening-s52 → 6-marker grep gate → keygen-if-absent → BuildKit build → up -d --force-recreate → 4-point verify. PO greenlit, apex DOWN throughout.

**tier classification** — **Tier D** (rebuild+recreate). Full sanction present + all corrections folded. Executed with per-command state-expected-outcome discipline.

**deployed-artifacts-read declaration** —
- **Layer 1 (branch):** `origin/fr/apex-container-hardening-s52` (tip 30749c85) Dockerfile.apex/entrypoint-apex.sh/docker-compose.yml; rebuild-steps doc.
- **Layer 2 (operational rc):** build source `/home/dev/github/apex-migration-research` post-checkout; compose-dir `.env` (declares GH_TOKEN+GITHUB_TOKEN+ANTHROPIC+ATLASSIAN*+SSH_PUBLIC_KEY1/2/3+TUNNEL_TOKEN non-empty — S34 Phase-1-Redux canonical .env, mtime 2026-05-20 19:17); `docker compose config` resolved GH_TOKEN non-empty.
- **Layer 3 (running):** pre-recreate container 67d68952 (created 2026-05-21); post-recreate fb585258 (created 2026-06-15T09:56:33Z, running). ~/.claude st_dev=65024 (persistent, intact); ~/.ssh st_dev=78 (ephemeral).
- **Audit-trail:** 12:11/12:14/12:34/12:47 entries; scratchpad apex facts.

**commands executed** (verbatim) —
- `git stash push -- docker-compose.yml` (stash@{0}, recoverable; rc GH_TOKEN line subsumed by branch 30749c85)
- `git fetch origin && git checkout fr/apex-container-hardening-s52` (HEAD→30749c8)
- 6-marker grep gate (Tier R): supervise()=1, seed-copy=2, Dockerfile `# syntax=docker/dockerfile:1.4`, id=courier_key=2, compose courier_key=3, stationmaster_apex=4 + 0 stragglers, GH_TOKEN line@58; entrypoint bash -n CLEAN. ALL PASS.
- `[ -f ./stationmaster_apex ] || ssh-keygen -t ed25519 -f ./stationmaster_apex -N "" -C "apex-research"` → GENERATED-NEW. pubkey `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINyQQocUhNh5S3QHREtoASiSnWz8e8MTUDaoLCcRNiHC apex-research`, fp SHA256:NBq5a/r3GsTuIGME1BzsklC9Sr+6VrltsxoSfW4QsaE → relayed to Brunel for sm-register. .gitignore/.dockerignore confirmed excluding key BEFORE keygen.
- `DOCKER_BUILDKIT=1 docker compose build` → exit 0, image apex-research-claude:latest. Verified: seed at /home/ai-teams/.ssh-seed/stationmaster_apex (600 ai-teams) on image FS; NO key material in `docker history` (BuildKit secret = no layer leak; only the RUN instruction text shows).
- `docker compose up -d --force-recreate` → exit 0; container 67d68952→fb585258, running; named volumes preserved.

**outputs / 4-point verify** —
- VERIFY1 dashboard `:5173` → **HTTP 200** (host-net). ASK-1 dashboard half GREEN.
- VERIFY2 supervisor — dashboard supervised (loop pid 1716); courier supervised (loop pid 1717). Supervisor mechanism present. Deliberate-kill relaunch test NOT yet run (courier not stably up — see below).
- VERIFY3a seed-copy — `~/.ssh/stationmaster_apex` present 0600; fingerprint MATCHES seed + matches the registered pubkey. ASK-2 seed→copy→~/.ssh GREEN end-to-end.
- VERIFY3b GH_TOKEN (Aen step-5) — `GH_TOKEN=<set,non-empty>` in recreated container Config.Env (source = .env). GITHUB_TOKEN also non-empty. **Regression AVERTED, GH_TOKEN preserved.**
- VERIFY3c round-trip — **BLOCKED.** Courier fails `validate_startup`: `RuntimeError: inboxes_dir does not exist: /home/ai-teams/.claude/teams/apex-research/inboxes`. The persistent ~/.claude volume is INTACT (st_dev=65024, full history; state_dir `.../stationmaster-state/spool` present) — NOT a recreate regression. The `inboxes` subdir was never created: it's normally made by apex's AGENT SESSION, which is DOWN (quiescence). The supervised courier now launches at container-BOOT (before any session), hitting validate_startup before the inbox dir exists. Boot-ordering interaction the supervisor design introduced.

**outcome** — **PARTIAL SUCCESS — build + recreate + 3 of 4 verify GREEN (dashboard, seed-key/ASK-2, GH_TOKEN-preserved); courier (ASK-1 second service + round-trip) BLOCKED on a design interaction.** The hardening image is built, recreated, volumes preserved, GH_TOKEN safe, courier key seeded+copied+fingerprint-matched. The one open item: supervised-courier-at-boot vs inboxes_dir-created-by-session ordering. Did NOT improvise (no mkdir of inbox dir — that's a substrate-state change + masks the design question). Surfaced to Brunel + Aen for the design decision (entrypoint should create inboxes_dir / courier should mkdir-p / or accept courier-down-until-first-session). Container is healthy + serving dashboard; courier supervisor retrying harmlessly (no data loss — courier hasn't collected anything). Stash recoverable; rollback = checkout d9074bb + rebuild if ever needed (not needed — state is good, just the courier ordering).

(*FR:Hopper*)

## 2026-06-15T13:06+03:00 — apex-research courier pubkey REGISTERED hub-side (S52, Tier M / standing PO exception)

**timestamp** — 2026-06-15T13:06+03:00

**tasker** — Herald (protocol owner; register-request shape relayed 13:03) — gate A of the round-trip double-gate; ASK-2 hub-side completion

**dispatch summary** — Register the new build-time-seeded apex-research courier pubkey (generated this session, fp NBq5a/...QsaE) on the FR stationmaster hub via `sm-register` — idempotent replace of the stale S51 ephemeral-key binding. Hub-side ONLY; does NOT touch apex's container (apex hard gate clear).

**tier classification** — **Tier M-equivalent (designed hub operation), covered by standing PO exception** (S51 scratchpad line: "hub-side sm-register apex-research <new-key>, no apex-container restart, is permitted"). sm-register is the designed registration path; idempotent replace. Per Herald + protocol §2 line 23 + runbook §5 this is the operator inside-container path (FR hub key is forced-command-locked to sm-shell framework-research, cannot itself run sm-register).

**deployed-artifacts-read declaration** —
- **Layer 1/2 (hub):** prod-llm `/home/michelek/stationmaster` (compose project dir, confirmed via container label); stationmaster container Up 2 days (healthy). Matches S51 hub-health-check.
- **Layer 3 (hub running):** sm-register --list pre + post; /home/sm/.ssh/authorized_keys line 5 (the registered apex-research forced-command binding).
- **rc-side cross-check:** live stationmaster_apex.pub on rc host reconciled byte-identical to Herald's relayed key.
- **Audit-trail:** S51 hub-health entry; this session's 12:54 keygen + 12:58 rebuild entries.

**commands executed** (verbatim) —
- access: `ssh -T -i ~/.ssh/id_ed25519_apex michelek@10.100.136.162` (registry num:"9"; default-key attempt FAILED Permission denied → registry key required — noted).
- pre-state: `docker compose exec -T stationmaster sm-register --list` → apex-research already present (stale S51 ephemeral; confirms idempotent-replace path).
- register: `docker compose exec -T stationmaster sm-register apex-research 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINyQQocUhNh5S3QHREtoASiSnWz8e8MTUDaoLCcRNiHC apex-research'`
- verify: `--list` (post); fingerprint readback of the registered line via base64-transit (quoting-layer dodge per local-dev gotcha).

**outputs (Herald's 3 verify points)** —
1. register output: `registered team 'apex-research' (forced command: sm-shell apex-research)` + `live immediately -- next ssh from this key lands as team 'apex-research'`. PASS.
2. `--list` post: alpha, beta, framework-research, fr-test, apex-research — apex-research present. PASS.
3. fingerprint of the registered hub key = `SHA256:NBq5a/r3GsTuIGME1BzsklC9Sr+6VrltsxoSfW4QsaE apex-research (ED25519)` == expected. PASS. (End-to-end key identity verified: build-secret seed → entrypoint copy → ~/.ssh → hub registration, all same fp.)

**outcome** — **SUCCESS — apex-research courier pubkey registered hub-side; all 3 Herald verify points PASS. Round-trip GATE A (registration/auth) now CLEAR.** ASK-2 is hub-side complete: the rebuilt container's seeded key is the registered key. Round-trip 3c still gated on GATE B (courier validate_startup / inboxes_dir bake — Brunel's fix awaiting Aen's 3rd commit) — the courier exits at startup before it dials, so registration alone doesn't green 3c, but auth is now ready for when the courier runs. No apex-container touch; apex hard gate intact. Reported 3 verify outputs to Herald (he closes loop to team-lead).

(*FR:Hopper*)

## 2026-06-15T13:11+03:00 — apex hardening REBUILD #2 (inbox-dir bake) — courier UP; but supervisor-relaunch DEFECT found (S52, Tier D)

**timestamp** — 2026-06-15T13:11+03:00

**tasker** — Aen (re-dispatch 13:06, Brunel's inbox-dir fix committed 4d923ae5) — rebuild #2 during quiescence

**dispatch summary** — Advance checkout to branch tip 4d923ae5 (inbox-dir bake) → 7-marker gate → rebuild → recreate → verify courier starts + run deferred deliberate-kill relaunch test + (registration now done) round-trip.

**tier classification** — Tier D (rebuild+recreate). Full sanction; executed per-step.

**deployed-artifacts-read declaration** — L1/L2 branch 4d923ae5 (ff from 30749c8; delta = entrypoint +12 inbox-dir bake + compose +3 GH_TOKEN-provenance COMMENT only, verified via git diff — no functional compose change). L3 post-recreate container 78377bcb (from fb585258), running. inbox dir confirmed created at boot. supervise() as-built read in-container.

**commands executed** (verbatim) —
- `git fetch origin && git pull --ff-only origin fr/apex-container-hardening-s52` → 30749c8..4d923ae ff (15 insertions).
- 7-marker grep gate: M1-M7 ALL present (supervise=1, seed=2, syntax-hdr, id=courier_key=2, compose courier_key=3, stationmaster_apex=4/0-stragglers, GH_TOKEN=1, COURIER_INBOXES_DIR=2+install-d=1); bash -n CLEAN.
- keygen-if-absent → REUSED (fp SHA256:NBq5a/...QsaE unchanged; NO re-register — hub reg from 13:06 stays valid).
- `DOCKER_BUILDKIT=1 docker compose build` exit0; `docker compose up -d --force-recreate` exit0 (fb585258→78377bcb).
- verify probes (Tier R): inbox dir, courier log, process tree, kill-relaunch test, dashboard curl.

**outputs** —
- INBOX DIR FIX WORKS: `/home/ai-teams/.claude/teams/apex-research/inboxes` created at boot (ai-teams-owned). Courier now passes validate_startup: log `courier up: team=apex-research target=sm@10.100.136.162 interval=30.0s outboxes=['framework-research-bridge'] inject->team-lead`. Courier process running (pid 1691). Dashboard HTTP 200.
- **SUPERVISOR-RELAUNCH DEFECT (verify-2 FAIL):** deliberate kill -9 of courier pid 1691 → NO relaunch after 17s. The supervise() `while true` loop subshell (pid 1689) is GONE; courier NOT restarted. Process tree shows BOTH services (vite 1684/1719/1720; courier was 1691) reparented to PID 1 with NO surviving `while true` loop process for either. The supervise() loops did NOT persist as long-lived restarters. as-built supervise() is the spec'd `( while true; gosu bash -lc "$*"; sleep 5; done ) &` then entrypoint `exec gosu ... "$@"`. The backgrounded loop subshells are not staying alive past the entrypoint's final `exec` → restart-on-exit (ASK-1's core acceptance) does NOT work. Services RUN but are NOT auto-restart-protected.

**outcome** — **PARTIAL — inbox-dir fix VERIFIED WORKING (courier now starts clean, ASK-2 + courier-startup green); but ASK-1 supervisor restart-on-exit is DEFECTIVE (kill test fails, no loop persists).** Surfaced to Brunel (supervise() design — his domain) + Aen; did NOT patch. Likely cause: backgrounded subshell loops don't survive the entrypoint's terminal `exec` into CMD (job-control/reparenting). Container HEALTHY (dashboard 200, courier up + authenticatable now reg is done) — just no auto-relaunch. Round-trip 3c auth-half is ready (courier dials hub on its 30s poll); deposit-collect round-trip pending — will run once supervisor defect is understood (don't want to test round-trip against a courier that won't survive). apex stayed DOWN. stash@{0} still recoverable; key reused (no churn).

(*FR:Hopper*)

## 2026-06-15T13:17+03:00 — apex supervisor re-test → STALE-LOCK finding (S52, verify-2 re-test, Tier M recreate + Tier R)

**timestamp** — 2026-06-15T13:17+03:00

**tasker** — Aen (re-test diagnostic method, 13:15) + Brunel (recreate+re-test authorization, 13:13 (a)) — to disambiguate supervisor relaunch artifact-vs-defect

**dispatch summary** — Recreate to restore the courier (killed for prior verify-2), then re-run the relaunch test with a SINGLE-PID kill (not group/pkill) per Aen's smoking-gun method: capture loop pid, SIGTERM just the python, watch for `courier exited; restarting` echo + loop-pid-alive + relaunch.

**tier classification** — Tier M (recreate, already sanctioned this session) + Tier R (diagnostic probes). apex DOWN.

**deployed-artifacts-read declaration** — L3: post-recreate container 13c94177 (3rd recreate this session, from 78377bcb); courier.lock on persistent state_dir (~/.claude, st_dev 65024); courier log this boot; supervise() loop-pid line. L1: courier reference validate_startup single-instance-lock behavior (refuses on existing lock).

**commands executed** (verbatim) —
- `docker compose up -d --force-recreate` (78377bcb→13c94177) — to restore courier.
- Tier R: `docker logs` courier lines; `pgrep -fa stationmaster-courier`; `ps -eo pid,ppid,pgid`; `cat courier.lock`; pid-liveness check; container-id confirm.

**outputs** —
- Recreate OK (13c94177 running). Supervisor logged `[supervisor] courier supervised (loop pid 1689)` + `starting courier`, then courier FAILED: `RuntimeError: another courier instance is already running (lock /home/ai-teams/.claude/teams/apex-research/stationmaster-state/courier.lock); refusing to start`.
- courier.lock contents: `{"pid": 1691, "ts": "20260615T101014057235"}` — **pid 1691 = the courier I kill-9'd during the 13:10 verify-2 test.** pid 1691 NOT alive; current container 13c94177 is fresh (prior was 78377bcb). UNAMBIGUOUSLY STALE.
- loop pid 1689 again absent; no courier process; no while-loop process.

**outcome** — **STALE-LOCK finding (Aen diagnostic BRANCH 3 confirmed): the supervisor "relaunch failure" is confounded by a stale courier.lock left by my kill -9.** SIGKILL skips the courier's lock cleanup → lock persists on the persistent state_dir → survives recreate → the courier's single-instance guard refuses to start (correctly, by its own design — it can't tell my kill-9'd pid is dead vs a live instance). This is NOT (yet) a proven supervise() defect — the supervise()-loop-survival question (Aen branch 1 vs 2) CANNOT be tested until the lock clears, because the courier can't start at all. Did NOT remove the lockfile (persistent-volume state; stale-lock-handling is courier-design behavior Brunel/Herald own — whether the fix is "courier reclaims a stale lock whose pid is dead+from-a-prior-container" or "operator one-time-clears my test artifact" is their call). Two intertwined items for Brunel: (1) stale-lock-reclaim behavior (my S51 FR-courier work hit the same class — SIGKILL leaves stale lock, next start should reclaim-if-pid-dead); (2) the still-untested supervise() loop survival. Container healthy otherwise (dashboard, key, GH_TOKEN all green from rebuild #2). apex DOWN. Surfaced to Brunel + Aen.

(*FR:Hopper*)

## 2026-06-15T13:23+03:00 — apex supervise() VERDICT: restart-on-exit DEFECT confirmed (S52, narrow re-test, Aen-authorized lock-clear)

**timestamp** — 2026-06-15T13:23+03:00

**tasker** — Aen (option-(a) authorized 13:20: clear my stale-lock test-artifact + narrow re-test to settle supervise(); lock-reclaim scoped OUT as separate finding)

**dispatch summary** — Clear the stale courier.lock (my kill-9 artifact, Aen-authorized w/ 3 conditions), recreate, then run the NARROW single-PID SIGTERM kill test (Aen's smoking-gun method) to settle supervise() restart-on-exit: artifact (branch 1) vs defect (branch 2).

**tier classification** — Tier R (confirmations) + Aen-sanctioned lock rm (exact target + reason=my-test-artifact/dead-pid-reclaim-equiv + expected=lock-gone-courier-starts, all in dispatch) + Tier M recreates. apex DOWN.

**deployed-artifacts-read declaration** — L3 throughout: containers 13c94177→(recreate)→fresh→(recreate)→fresh; courier.lock contents at each stage; process tree PPIDs (the decisive evidence); supervise() as-built (read earlier 13:11). L1: courier reference single-instance-lock + reclaim behavior.

**commands executed** (verbatim) —
- COND-1 (Tier R): confirmed pid 1691 DEAD + no live courier before rm.
- rm: `docker exec -u ai-teams apex-research rm -v .../stationmaster-state/courier.lock` (ONLY that file; spool/ + inject-tmp/ untouched).
- recreate → courier UP (fresh lock pid 1688, `courier up:` logged).
- NARROW KILL: confirmed loop pid 1686 alive (= `bash /entrypoint-apex.sh bash`, PPID 1); courier 1688 PPID=**1686**; `docker exec apex-research kill -TERM 1688` (single pid, NOT group, NOT pkill); waited 8s.
- restore: recreate → courier reclaimed stale lock + UP (pid 1685); dashboard 200.

**outputs** —
- **SUPERVISE() VERDICT = BRANCH 2 (genuine defect), NOT artifact.** Single-PID SIGTERM of courier 1688 → loop pid 1686 DIED, NO relaunch, NO `[supervisor] courier exited; restarting in 5s` echo. The clean signal (not my earlier kill -9) still killed the supervising context. PPID evidence: courier 1688's parent WAS 1686 = the entrypoint process itself (`bash /entrypoint-apex.sh bash`), NOT a separate persistent `( while true )&` subshell. The backgrounded supervise() loop does not survive as a resilient restarter — when its child exits, the supervising shell context dies rather than looping. ASK-1 restart-ON-EXIT is DEFECTIVE.
- **LOCK-RECLAIM nuance (separate finding, scoped OUT per Aen):** my SIGTERM did NOT release the lock (lock still {"pid":1688} after) — neither clean-signal nor SIGKILL releases it (courier doesn't clean up its lock on exit). BUT the subsequent RECREATE *did* reclaim: `WARN lock: reclaiming stale lock ... courier up`. So the courier DOES reclaim-on-fresh-start (contradicting the 13:17 refusal — the 13:17 refuse-vs-13:23 reclaim difference is unexplained, possibly pid-liveness-check timing/namespace; flag-not-conclude). Net: lock-reclaim is INCONSISTENT (refused once, reclaimed once) — a separate robustness finding for Herald's courier reference, NOT this rebuild's scope.

**outcome** — **VERDICT DELIVERED: ASK-1 restart-on-CONTAINER-restart WORKS (recreate brings both svcs up, proven 4×); restart-ON-EXIT is DEFECTIVE (supervise() loop doesn't persist — confirmed via clean narrow kill, branch 2).** Container left HEALTHY (courier up via reclaim pid 1685, dashboard 200, key+GH_TOKEN green). Did NOT patch supervise() — Brunel's design fix (a supervise() restructure → branch commit → rebuild #3). Separate finding filed: lock-reclaim inconsistency (route Aen + Callimachus). Round-trip 3c auth-ready (reg done) + courier now UP — CAN run once supervise() fix lands OR now if Aen wants the round-trip independent of the supervise() fix. apex DOWN throughout. stash@{0} recoverable.

(*FR:Hopper*)

## 2026-06-15T13:28+03:00 — apex supervise() RECONCILE re-test (Brunel says SOUND) — DEFECT STANDS w/ rigorous attribution (S52)

**timestamp** — 2026-06-15T13:28+03:00

**tasker** — Brunel (13:14 design call: supervisor SOUND, re-test narrow; his local repro showed loop survives single-pid kill) — reconcile against my 13:23 defect verdict

**dispatch summary** — Brunel's local repro of supervise() structure (`( while true; bash -lc "$cmd"; sleep; done )&` with `sleep 600` fake svc) showed a single-pid kill -9 of the leaf → loop survives + relaunches (rc=137 caught). He attributes my 13:23 failure to a process-GROUP kill. Re-test with rigorous pid attribution to reconcile.

**tier classification** — Tier R (probes) + single-PID SIGTERM (the test) + Tier M recreate (restore). apex DOWN.

**deployed-artifacts-read declaration** — L3: full process tree (pid/ppid/pgid/sid) before kill; supervise() loop-pid from log; before/after pid liveness. CORRECTS my 13:23 misattribution (see below).

**commands executed** (verbatim) —
- Tier R: `ps -eo pid,ppid,pgid,sid,args` full tree; `pgrep -f stationmaster-courier.reference.py`; log `courier supervised` loop-pid line.
- TEST: confirmed courier python 1685's PPID = **1684** (the loop subshell, per log `[supervisor] courier supervised (loop pid 1684)`); `kill -TERM 1685` (ONLY the python leaf, NOT 1684, NOT -pgid); waited 9s.
- restore: recreate → courier reclaimed lock + up (pid 1691); dashboard 200.

**outputs** —
- **CORRECTION to my 13:23 attribution:** at 13:23 I wrote "courier PPID = entrypoint process, NOT a separate subshell." WRONG — the loop subshell DOES exist as a distinct process; it just carries the SAME argv `bash /entrypoint-apex.sh bash` as the entrypoint that forked it (subshell inherits argv), which misled me. Corrected tree: PID1 bash; 1684 = courier loop subshell (PPID 1, args `bash /entrypoint-apex.sh bash`); 1685 = courier python (PPID 1684). So there IS a distinct loop subshell — Brunel right on that point.
- **BUT THE DEFECT STILL STANDS, clean attribution:** killed ONLY python leaf 1685 (single-PID SIGTERM, verified PPID=1684, did NOT touch 1684 or the pgid). Result: **loop subshell 1684 DIED**, NO new courier python, NO `[supervisor] courier exited; restarting` echo. A single-leaf kill took the loop in the LIVE container — which Brunel's local `sleep 600` repro says shouldn't happen.
- **WHY THE REPRO DIFFERS (hypothesis for Brunel):** the live courier runs under `gosu "${CONTAINER_USER}" bash -lc "python3 ..."` — an extra gosu+bash-lc layer Brunel's `bash -lc "sleep 600"` repro lacks. SIGTERM to the python may propagate through / collapse the gosu+bash-lc wrapper AND the subshell (signal-forwarding or shared foreground pgroup under TTY-less docker exec). The gosu layer is the prime suspect for the repro gap.

**outcome** — **DEFECT STANDS: supervise() restart-on-EXIT does NOT work in the LIVE apex container, even with a clean single-leaf SIGTERM + rigorous attribution. Brunel's local repro (no gosu layer) does not reproduce the live behavior — likely the gosu+bash-lc wrapper.** Corrected my own 13:23 misattribution honestly (loop subshell exists; I mislabeled it). restart-on-CONTAINER-restart still WORKS (5× recreates). Did NOT patch. Handing Brunel: exact pids (killed 1685-only, loop 1684 died), the gosu-layer hypothesis, and a suggested repro fix (add `gosu <user> bash -lc` around the fake svc in his local test). Container healthy (courier pid 1691, dashboard 200). apex DOWN.

(*FR:Hopper*)

## 2026-06-15T13:39+03:00 — apex hardening REBUILD #3 (final image) — ASK-1 restart-on-exit GREEN (set+e fix verified); round-trip pending deposit-shape (S52, Tier D)

**timestamp** — 2026-06-15T13:39+03:00

**tasker** — Aen (13:36 BRANCH TIP FINAL = 26e5a7ed, GO rebuild #3)

**dispatch summary** — Rebuild #3 on final branch tip 26e5a7ed (4 commits: hardening + GH_TOKEN + inbox-dir + supervise()set+e-fix & lock-pre-clean). ff checkout → 9-marker gate → keygen-reuse → build → recreate → verify 5a-d incl the narrow SIGTERM relaunch re-test (the set+e fix check) + round-trip 3c.

**tier classification** — Tier D (rebuild+recreate). Full sanction. Final close-out image.

**deployed-artifacts-read declaration** — L1/L2: branch 26e5a7e; the 4th-commit delta read in full (git diff 4d923ae..26e5a7e = entrypoint +21: `set +e` in supervise subshell w/ comment "verified restart-on-exit silently fails with set -e" + boot lock-pre-clean `rm -f COURIER_LOCK` w/ boot-invariant-safety comment; nothing else). L3: container e9bed029→f00ae758 (running). Key fp readback. 9-marker grep gate.

**commands executed** (verbatim) —
- `git fetch origin && git pull --ff-only origin fr/apex-container-hardening-s52` → 4d923ae..26e5a7e ff (entrypoint +21).
- 9-marker grep gate: M1-M9 ALL present (incl M8 `set +e`, M9 COURIER_LOCK rm); 0 sm_apex-research stragglers; bash -n CLEAN.
- keygen-if-absent → REUSED (fp unchanged; no re-register).
- `DOCKER_BUILDKIT=1 docker compose build` exit0; `docker compose up -d --force-recreate` exit0 (e9bed029→f00ae758).
- VERIFY 5b narrow kill: confirmed loop subshell 1693 (PPID1) + python 1694 (PPID 1693); `kill -TERM 1694` (ONLY leaf, not 1693/pgid/pkill); waited 9s.
- restore not needed — relaunch worked (courier auto-relaunched to 1846).

**outputs / VERIFY** —
- 5a courier up: `courier up: team=apex-research...` logged, NO "reclaiming stale lock" WARN (lock-pre-clean → clean start, not reclaim). inbox dir present. GREEN.
- 5c GH_TOKEN=<set,non-empty>; key fp `SHA256:NBq5a/r3GsTuIGME1BzsklC9Sr+6VrltsxoSfW4QsaE` == registered (reuse, no churn). Dashboard HTTP 200. GREEN.
- **5b NARROW RELAUNCH RE-TEST — GREEN (the set+e fix WORKS):** killed ONLY python leaf 1694 (airtight, verified PPID=1693) → **loop subshell 1693 SURVIVED** (PPID1, still alive — exact opposite of the pre-fix 13:23/13:28 result) + NEW courier python 1846 relaunched + log echo `[supervisor] courier exited (rc=143); restarting in 5s` → `courier up:`. The same airtight kill that failed 2× on the unfixed image now PASSES. **ASK-1 restart-on-EXIT confirmed GREEN.** Confirms both my diagnosis (loop died on child's non-zero exit under inherited set -e) AND Brunel's set+e fix.
- 5d round-trip: PENDING Herald's deposit-request shape (requested 13:35, prep; send-then-verify is the last step).

**outcome** — **CLOSE-OUT NEAR-COMPLETE: ASK-1 (BOTH halves: container-restart + restart-on-exit) GREEN; ASK-2 GREEN; inbox-fix GREEN; GH_TOKEN preserved; dashboard GREEN; lock-pre-clean GREEN (clean start). The set+e fix verified the supervise() defect is RESOLVED.** Only verify-5d round-trip remains, gated on Herald's deposit-shape (prep requested). Final image = container f00ae758 on branch 26e5a7ed (PR#165, 4 commits). apex DOWN throughout. stash@{0} recoverable. Reported to Aen.

(*FR:Hopper*)

## 2026-06-15T13:48+03:00 — apex round-trip (verify-5d): deposit ACCEPTED, COLLECT BLOCKED on missing hub host-key (S52)

**timestamp** — 2026-06-15T13:48+03:00

**tasker** — Aen (13:45 fire-5d-on-Herald-shape) + Herald (13:36 deposit-request shape delivered)

**dispatch summary** — Fire the FR→apex round-trip: deposit `[FR-S52-ROUNDTRIP-TEST]` via FR key (Herald's exact deposit-request), verify apex's supervised courier collects it into the persistent ~/.claude inbox (read-only). Closes verify-5d.

**tier classification** — Deposit = sanctioned hub-side protocol op (Aen-directed, Herald-shaped, grant-checked). Diagnosis probes = Tier R. apex DOWN.

**deployed-artifacts-read declaration** — L3: hub deposit response (data line); apex courier collect-log; courier.json ssh_opts; container known_hosts state. L1: Herald's deposit-request shape (protocol §3/§4/§5.2); courier.json from OQ-1 (ssh_opts had StrictHostKeyChecking=yes + UserKnownHostsFile noted at 12:14).

**commands executed** (verbatim) —
- grant re-check: `printf '{"v":1,"cmd":"status"}' | ssh -i ~/.ssh/sm_framework-research -p 2222 sm@10.100.136.162` → grants_out has apex-research = True.
- DEPOSIT (ts bumped 10:46:51Z): `printf '%s\n%s\n' '{"v":1,"cmd":"deposit"}' '{"to":"apex-research","entry":{"from":"framework-research","type":"teammate-message","summary":"[FR-S52-ROUNDTRIP-TEST]...","text":"[FR-S52-ROUNDTRIP-TEST]...","timestamp":"2026-06-15T10:46:51Z","read":false}}' | ssh -i ~/.ssh/sm_framework-research -p 2222 sm@10.100.136.162`
- collect verify (Tier R): docker logs courier; ls inbox dir; grep marker; courier.json ssh_opts; known_hosts state.

**outputs** —
- **DEPOSIT ACCEPTED (hub side GREEN):** envelope `{"v":1,"ok":true,"cmd":"deposit"}` + DATA LINE `{"id":"a55da2736257086c","to":"apex-research","status":"accepted"}` — durable (fsync'd to spool). Herald's success criterion met (data line, not bare ok:true). Deposit leg works.
- **COLLECT BLOCKED:** apex courier log (every 30s poll): `WARN collect: transport failure (no response envelope (ssh rc=255); stderr: No ED25519 host key is known for [10.100.136.162]:2222 and you have requested strict checking.` Inbox dir EMPTY (marker not collected).
- ROOT CAUSE: courier.json `ssh_opts` = `StrictHostKeyChecking=yes` + `UserKnownHostsFile=/home/ai-teams/.ssh/stationmaster_known_hosts`, but that known_hosts file is ABSENT (No such file or directory). The hub's ED25519 host key was NEVER provisioned into the container's known_hosts. `~/.ssh` is ephemeral (F5) → even a prior-session known_hosts dies on rebuild. The build-time provisioning seeds the courier PRIVATE key (ASK-2, working) but NOT the hub HOST key for strict-checking. New provisioning gap, analogous class.

**outcome** — **verify-5d PARTIAL: deposit leg GREEN (accepted, durable, id a55da27); COLLECT leg BLOCKED on a NEW finding — missing hub host-key in the courier's known_hosts (StrictHostKeyChecking=yes + absent stationmaster_known_hosts).** Distinct from all prior findings (not registration/supervise/lock). Did NOT improvise (no ssh-keyscan>>known_hosts, no flipping StrictHostKeyChecking — security-posture/provisioning decision for Brunel/Herald, analogous to how the private key is build-seeded). The hub-deposited consignment (id a55da27) + the pre-existing 08:15 one are SAFE on the hub spool (durable, will collect once the host-key gap is fixed — no data loss). Surfaced to Aen + Brunel. apex DOWN. ASK-1 + ASK-2 (as scoped) remain GREEN; this is a round-trip-collect-leg provisioning gap exposed by actually exercising the round-trip.

(*FR:Hopper*)

## 2026-06-15T14:01+03:00 — apex REBUILD #4 (host-key pin): COLLECT TRANSPORT FIXED; but inject-CAS-exhaustion blocks the test consignment (S52)

**timestamp** — 2026-06-15T14:01+03:00

**tasker** — Aen (13:56 BRANCH TIP FINAL = 22a3a320, GO rebuild #4)

**dispatch summary** — Rebuild #4 on final tip 22a3a320 (5th commit = Step-7c hub-host-key pin). ff → 10-marker gate → keygen-reuse → build → recreate → verify the COLLECT leg (courier trusts hub, collects both queued consignments → round-trip GREEN).

**tier classification** — Tier D (rebuild+recreate). Full sanction. apex DOWN.

**deployed-artifacts-read declaration** — L1/L2: 22a3a32 Step-7c delta read (entrypoint +20, host-key pin only; pinned fp matches authoritative). L3: container f00ae758→e7b9de88; known_hosts post-boot; courier log; inbox team-lead.json; process tree (single courier confirmed); hub status deposited_uncollected.

**commands executed** (verbatim) —
- `git pull --ff-only` → 26e5a7e..22a3a32 (entrypoint +20). 10-marker gate ALL pass (M10 HUB_HOSTKEY/known_hosts=5; pinned fp = SHA256:CNcFj...K13U authoritative); bash -n CLEAN.
- keygen REUSED; `DOCKER_BUILDKIT=1 docker compose build` exit0; `docker compose up -d --force-recreate` (f00ae758→e7b9de88).
- collect verify (Tier R): known_hosts present+pinned; courier logs; inbox ls + marker grep; hub status; process-tree contention diagnosis.

**outputs** —
- HOST-KEY PIN WORKS: `[entrypoint] hub host key pinned into ...stationmaster_known_hosts` (103B, hub entry present). NO MORE rc=255/"No ED25519 host key" — the collect-transport blocker (rebuild #4's purpose) is FIXED.
- COLLECT TRANSPORT PROVEN: courier collected the PRE-EXISTING 08:15 consignment (Herald S51 WINDOWPREP, from framework-research-ghost) → landed in inbox team-lead.json (1876B); log `inbound: injected+acked 1 consignment(s)`. Hub deposited_uncollected dropped the 08:15.
- **NEW BLOCKER (4th distinct issue) — my test a55da27 fails INJECT:** `ERROR inject failed for a55da2736257086c: inject: exhausted 50 rounds against contested inbox team-lead.json; did NOT write -- will NOT ack (custody not transferred); hub will redeliver`. Repeats every poll. Hub deposited_uncollected still {apex-research: count=1, oldest=10:47:09Z = a55da27}.
- CONTENTION DIAGNOSIS: NOT multi-writer — exactly ONE courier (pid 1698, supervised once, count=1); no 2nd courier; no lock/tmp artifact (inject-tmp empty); team-lead.json a normal file, not held open. So the inject's atomic-CAS retry exhausts 50 rounds against an UNCONTENDED file = a courier.reference.py inject-path internals issue (CAS never succeeds — possibly the existing file content/shape doesn't match what inject's compare-and-swap expects after the 08:15 write), NOT external contention.

**outcome** — **REBUILD #4 ACHIEVED ITS GOAL: host-key pin GREEN → collect TRANSPORT works (08:15 consignment drained, proving courier now trusts the hub).** verify-5d collect-transport = GREEN. BUT a 4th distinct issue surfaced downstream: the test consignment a55da27 collects from the hub but the courier's INJECT into team-lead.json exhausts 50 CAS-retry rounds + refuses to ack (correct safety — no custody transfer w/o write; hub redelivers). Single-writer confirmed, so it's a courier-internals inject-CAS issue, NOT external contention — Herald/Brunel courier.reference.py domain. Did NOT hand-edit the inbox (would corrupt + mask). NO DATA LOSS: a55da27 durable on hub spool, redelivered each poll. Surfaced to Aen + Herald/Brunel. apex DOWN. ASK-1 + ASK-2 + host-key-collect-transport all GREEN; the inject-CAS exhaustion is the remaining round-trip-completion blocker.

(*FR:Hopper*)

## 2026-06-15T14:15+03:00 — apex container sshd host-key fp verification (PO host-key-changed) — MATCH, no MITM; 5th gap (S52, Tier R)

**timestamp** — 2026-06-15T14:15+03:00

**tasker** — Aen (14:14) — PO hit `REMOTE HOST IDENTIFICATION HAS CHANGED` SSHing to apex container after our 4 rebuilds; verify the new fp before PO trusts it (no blind accept).

**tier classification** — Tier R (read-only in-container inspection via host-side docker-exec; NOT via the suspect container sshd). Default-permitted. Does NOT wake apex (agent stays DOWN).

**deployed-artifacts-read declaration** — L3: container e7b9de88 /etc/ssh host keys (fp + path + st_dev). The trusted read-path is `dev@`→`docker exec` (host-side), deliberately NOT the container's sshd (the artifact under question).

**commands executed** (verbatim) —
- `ssh -T dev@100.96.54.170 'docker exec apex-research ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub; docker exec apex-research ls -la /etc/ssh/ssh_host_*key*; docker exec apex-research bash -lc "stat -c \"%n st_dev=%d\" /etc/ssh/ssh_host_ed25519_key /etc/ssh / /home/ai-teams/.claude"'`

**outputs** —
- Container sshd ed25519 host-key fp = `SHA256:y9aFy3aDklEvABU2n8egtj0MBY06DWAqUqoAbOVqNTA root@buildkitsandbox (ED25519)`.
- PO's SSH-prompt fp = `SHA256:y9aFy3aDklEvABU2n8egtj0MBY06DWAqUqoAbOVqNTA`. **EXACT MATCH.**
- Key comment `root@buildkitsandbox` = generated in a Docker BuildKit build (our rebuilds). All 6 /etc/ssh host keys mtime Jun 15 12:55 (rebuild #2 build).
- st_dev: /etc/ssh/ssh_host_ed25519_key = 78 (EPHEMERAL overlay, = / and /etc/ssh); ~/.claude = 65024 (persistent). Host key is EPHEMERAL.

**outcome** — **VERIFIED MATCH — no MITM; PO safe to update known_hosts (drop stale line 38 + accept new key).** The fp the PO saw IS the legitimate rebuilt-container sshd key, confirmed by reading the actual in-container key via the trusted host-side docker-exec route (verified-not-TOFU). **5th provisioning-symmetry gap CONFIRMED + flagged (Brunel follow-up):** the container's OWN sshd host key is on the ephemeral overlay → regenerates every image rebuild → breaks incoming-SSH known_hosts for PO/operators each rebuild (this is what bit the PO). Same class as courier-private-key + hub-host-key ephemeral gaps. Fix (NOT this moment): persist /etc/ssh host keys across rebuilds (volume-mount or bake fixed). Read-only throughout; did NOT touch the container's sshd; apex agent stays DOWN (docker-exec doesn't wake it). Reported to Aen for the PO.

(*FR:Hopper*)

## 2026-06-15T14:31+03:00 — apex REBUILD #5 (Step-6c persist sshd host keys) — 5th gap CLOSED; new permanent fp + stability proven (S52)

**timestamp** — 2026-06-15T14:31+03:00

**tasker** — Aen (14:28 BRANCH TIP FINAL = c0fb2bac, GO rebuild #5)

**dispatch summary** — Rebuild #5 on tip c0fb2bac (6th commit = Step-6c: persist the container's OWN sshd host keys on ~/.claude/ssh-host-keys, generate-if-absent, restore to /etc/ssh before sshd). Closes the 5th provisioning gap (ephemeral sshd host key → known_hosts churn for inbound SSH). Verify new permanent fp + persistence + stability.

**tier classification** — Tier D (rebuild+recreate). Full sanction. apex DOWN.

**deployed-artifacts-read declaration** — L1/L2: c0fb2ba Step-6c delta read (entrypoint +26, host-key persist only; private keys volume-only never baked, root:root 700). L3: container e7b9de88→862c799f; /etc/ssh + ~/.claude/ssh-host-keys fp + st_dev; 2nd-recreate stability; regression probes. 11-marker gate.

**commands executed** (verbatim) —
- `git pull --ff-only` → 22a3a32..c0fb2ba (entrypoint +26). 11-marker gate ALL pass (M11 HOSTKEY_DIR/ssh-host-keys=7); bash -n CLEAN.
- keygen REUSED (courier key unaffected); `DOCKER_BUILDKIT=1 docker compose build` exit0; `docker compose up -d --force-recreate` (e7b9de88→862c799f).
- verify: `docker exec apex-research ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`; stat st_dev/perms/owner of ~/.claude/ssh-host-keys; 2nd `--force-recreate` + re-read fp (stability); regression (courier/dashboard/GH_TOKEN/keys).

**outputs** —
- Step-6c log: generated persistent ed25519/rsa/ecdsa host keys (first boot) + `sshd host keys restored from persistent volume`.
- **NEW PERMANENT ed25519 fp = `SHA256:z1/fXAE8gRCfUrKnIJ8PM5bcO/pBhAMrZESNHbmh4vA root@apex-research`** (comment root@apex-research = entrypoint-generated on the volume, NOT buildkitsandbox). THIS is the key the PO clears-and-accepts.
- PERSISTENCE: ~/.claude/ssh-host-keys st_dev=**65024** (PERSISTENT), dir root:root 700, key root:root 600. /etc/ssh copy st_dev=78 (ephemeral) carries the SAME fp = correctly restored-from-persistent.
- **STABILITY PROVEN: 2nd --force-recreate → Step-6c log shows ONLY "restored" (NO regen) → fp UNCHANGED** (z1/fXAE...4vA before == after). The churn is fixed permanently — future rebuilds keep this fp.
- REGRESSION all GREEN: courier up (pid 1701), hub host-key pinned, no rc=255; dashboard HTTP 200; GH_TOKEN non-empty; courier private key fp SHA256:NBq5a/...QsaE unchanged; hub known_hosts entry present.

**outcome** — **5th GAP CLOSED — container sshd host key now PERSISTENT + STABLE across rebuilds (proven via 2nd-recreate fp-unchanged).** New permanent fp `SHA256:z1/fXAE8gRCfUrKnIJ8PM5bcO/pBhAMrZESNHbmh4vA` reported to Aen for the PO's one-time `ssh-keygen -R '[100.96.54.170]:2222'` + accept = inbound-SSH identity churn fixed forever. Private keys volume-only (never baked), root-owned 700 (agent can't read) = secure. All prior hardening (ASK-1/ASK-2/inbox/GH_TOKEN/dashboard/lock-pre-clean/host-key-collect-transport) regression-GREEN on the new image 862c799f. apex DOWN throughout (read-only verify via docker-exec; recreates don't wake the agent). PR #165 now 6 commits.

(*FR:Hopper*)
