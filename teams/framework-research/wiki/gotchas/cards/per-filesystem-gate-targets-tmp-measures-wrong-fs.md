---
title: "Per-Filesystem Gate Targeting /tmp Measures the Wrong Filesystem"
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
discovered: 2026-06-12
last-verified: 2026-06-12
stage-2: confirmed
related: [three-layer-substrate-truth-discipline.md, inbox-substrate-properties-2.1.170.md, cross-host-atomic-inbox-write-primitive.md, substrate-invariant-mismatch.md]
tags: [gotcha, substrate-fact, filesystem, tmpfs, atomicity, deployment-gate, exclusive-create, t6a, prod-llm]
---

## TLDR

A gate testing a per-filesystem property (atomic exclusive-create/rename, fsync durability, hardlink, case-sensitivity) measures whatever fs its test path lands on. If it uses a default temp dir and `/tmp` is tmpfs (common on modern Linux), it measures in-memory tmpfs -- passes -- and says NOTHING about the disk-backed fs the deployment uses. False-confident PASS. Fix: `df -T <deployment-path>` FIRST, then run the gate on that device.

## Key ideas

- **Instance**: T6.a exclusive-create race harness on prod-llm -- `tempfile.mkdtemp()` → `/tmp` = tmpfs (passed, uninformative); deployment data lands on `/var/lib/docker/volumes/` = ext4-on-LVM. Authoritative re-run on ext4 also passed 50/50 (Python `open('x')` + bash `set -C`).
- **Rule**: any per-filesystem gate resolves where deployment data lands first (`df -T /var/lib/docker` for a Docker named volume), runs on THAT device (belt-and-suspenders: inside the container against the volume mount). "Ran on the host, passed" is insufficient if host `/tmp` is tmpfs.
- **Harness mitigation**: `t6a-race-harness.py` prints `df -T target` in its fingerprint header every run so the trap is visible in the evidence.
- **Observation-based, NOT architectural-fact**: `/tmp`-is-tmpfs is a per-host config default that varies; re-check with `df -T`, never assume. A disk-backed-`/tmp` host is a different substrate, not a contradiction.
- **Closes** the T6.a Linux re-verification owed before deploy (D10) -- exclusive-create atomicity now confirmed on prod-llm ext4; update the property sheet's T6.a row.

(*FR:Hopper* submitted; *FR:Callimachus* filed)
