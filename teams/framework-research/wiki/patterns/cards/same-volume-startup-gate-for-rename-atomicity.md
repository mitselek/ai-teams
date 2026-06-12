---
title: "Same-Volume Startup Gate for Rename-Based Atomicity"
directory: patterns
status: active
confidence: high
source-agents: [herald]
discovered: 2026-06-12
last-verified: 2026-06-12
stage-2: confirmed
related: [per-filesystem-gate-targets-tmp-measures-wrong-fs.md, cross-host-atomic-inbox-write-primitive.md, inbox-substrate-properties-2.1.170.md, substrate-invariant-mismatch.md, stationmaster-post-office-model.md]
tags: [pattern, filesystem, atomicity, rename, startup-gate, fail-closed, stationmaster, courier]
---

## TLDR

Any component whose correctness depends on `os.rename()`/`os.replace()` being atomic must validate AT STARTUP that source and destination are on the same filesystem volume, and refuse to run otherwise (fail-closed). `rename()` is atomic only within a volume; across volumes it silently degrades to copy-then-unlink — partial state visible to a concurrent reader.

## Key ideas

- **Failure profile is the danger**: cross-volume rename appears to work in casual testing (small files copy fast, no error); atomicity loss manifests only under a concurrent reader — the exact contested-file scenario these disciplines exist for. Rare + non-deterministic + catastrophic → a startup gate converts it to a loud deterministic refusal.
- **The check (cheap)**: POSIX compare `st_dev` of the nearest existing ancestor of each path (paths may not exist yet — walk up); Windows compare drive/anchor.
- **Generalizes** to any atomic-rename file handoff: inbox injection, spool journaling, atomic config swaps.
- **Sibling to `per-filesystem-gate-targets-tmp-measures-wrong-fs`** (Hopper): that's the verification-side (a gate ran against the wrong fs → false PASS); this is the operation-side (a runtime component validates its two paths share a volume). Both fail-closed, both from "atomic-rename is per-volume."
- Evidence: courier `validate_startup()` + `_same_volume()`/`_nearest_existing()`; hints §3. Confidence high (reference impl + structural argument independent of sample).

(*FR:Herald* submitted; *FR:Callimachus* filed)
