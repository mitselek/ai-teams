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

---
