---
source-agents:
  - hopper
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-06-12
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/t6a-race-harness.py
  - teams/framework-research/docs/operations-log-2026-06.md
  - designs/deployed/stationmaster/stationmaster-courier-hints.md
---

# A per-filesystem gate that targets the default temp dir silently measures the wrong filesystem

A substrate gate whose property is **per-filesystem** (atomic exclusive-create, atomic rename, fsync durability, hardlink behavior, case-sensitivity) measures **whatever filesystem its test path lands on** -- not necessarily the one the deployment data will land on. If the gate uses a default temp dir (`tempfile.mkdtemp()` → `/tmp`) and `/tmp` is **tmpfs** (an in-memory filesystem, the common default on modern Linux), the gate measures tmpfs's atomicity backing, **passes**, and that PASS says nothing about the disk-backed filesystem the deployment actually uses. A **false-confident PASS**.

## The instance

Re-running the T6.a exclusive-create race harness on prod-llm (Debian 13.4) for the stationmaster deployment gate:

- The harness's default `tempfile.mkdtemp()` resolved to `/tmp`, which on prod-llm is **tmpfs**. `df -T /tmp` → `tmpfs`.
- The gate PASSED on tmpfs -- but the Docker-named-volume deployment's data lands under `/var/lib/docker/volumes/`, on a different filesystem. `df -T /var/lib/docker` → `/dev/mapper/ai--agenditiimide--tookeskkond--vg-root`, type **ext4** (ext4-on-LVM).
- The **authoritative** re-run, on ext4, also passed 50/50 (both Python `open('x')` and bash `set -C`). That is the result that gates the deploy; the tmpfs run was uninformative.

## The fix / generalizable rule

Any per-filesystem substrate gate must **FIRST resolve where the deployment data actually lands**, then run on that filesystem:

1. `df -T <deployment-path>` to reveal the backing fs type and device. For a Docker named volume, the backing store is under `/var/lib/docker/volumes/`, so probe `df -T /var/lib/docker`.
2. Run the gate on a path on **that device** -- or, belt-and-suspenders, inside the running container against the volume mount.
3. **"Ran it on the host, it passed" is insufficient** if the host's `/tmp` is tmpfs and the data lives on ext4 -- or vice versa. The host-vs-target filesystem mismatch is the trap; `/tmp`-is-tmpfs is its common shape on modern Linux.

**Mitigation in the harness:** `t6a-race-harness.py` prints `df -T <target>` in its fingerprint header on every run, precisely so this trap is visible in the evidence of each run rather than hidden.

## Why this is observation-based, not architectural-fact

`/tmp` being tmpfs is a **distro/host configuration default**, not a deliberate immutable design -- it varies across distros, mount configs, and container runtimes. So this entry is observation-based: a second host where `/tmp` is disk-backed is a *different* substrate, not a contradiction. The trap (gate targets the wrong filesystem) generalizes; the specific "`/tmp` is tmpfs" detail is per-host and must be re-checked with `df -T`, never assumed.

## Closes an owed re-verification

This run **closes the T6.a Linux re-verification that was owed before deploy** (D10 substrate). The exclusive-create atomicity property recorded in [`references/inbox-substrate-properties-2.1.170.md`](../references/inbox-substrate-properties-2.1.170.md) (T6.a, previously "Git-Bash/NTFS only, Linux re-run owed") is now confirmed on prod-llm ext4 (50/50, both primitives). See that sheet's T6.a row.

## Evidence

- prod-llm (10.100.136.162, Debian 13.4): `df -T /tmp` → tmpfs; `df -T /var/lib/docker` → ext4-on-LVM.
- Host evidence file: `~/t6a-gate/evidence-t6a-prodllm-20260612.log` (both tmpfs + ext4 runs, 50/50 each).
- Ops-log: `teams/framework-research/docs/operations-log-2026-06.md`, 2026-06-12T16:51 entry ("Load-bearing substrate-truth" + "RESIDUAL gap" sections).
- Harness: `teams/framework-research/poc/ghost-bridge/t6a-race-harness.py`.

## Related

- [`patterns/three-layer-substrate-truth-discipline.md`](../patterns/three-layer-substrate-truth-discipline.md) -- adjacent: this is a Layer-3-running-state vs intended-deployment-target trap (the gate ran against the wrong Layer-3 surface).
- [`references/inbox-substrate-properties-2.1.170.md`](../references/inbox-substrate-properties-2.1.170.md) -- T6.a row; this run closes its owed Linux re-verification.
- [`patterns/cross-host-atomic-inbox-write-primitive.md`](../patterns/cross-host-atomic-inbox-write-primitive.md) -- flags NFS-without-`lockd` as a substrate-edge; same family of per-filesystem-property caveats.
- `designs/deployed/stationmaster/stationmaster-courier-hints.md:64` *(was `poc/ghost-bridge/...:54` before the 2026-08-27 canonical-home move; the line shifted with that day's §4.5/§6a additions -- re-verified at :64)* -- the same-filesystem spool rule (`rename()` atomicity is per-volume) is the courier-side counterpart of this gate-side discipline.
- [`patterns/substrate-invariant-mismatch.md`](../patterns/substrate-invariant-mismatch.md) -- defect class: the gate's implicit invariant ("the test path's fs == the deployment fs") is false on tmpfs-`/tmp` hosts.

(*FR:Hopper* -- submitted; *FR:Callimachus* -- filed)
