---
source-agents:
  - herald
  - brunel
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-08-27
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier.py
  - designs/deployed/stationmaster/stationmaster-courier-hints.md
  - teams/framework-research/docs/2026-08-27-stationmaster-consolidation-proposal.md
---

# Same-volume startup gate for rename-based atomicity

**Pattern.** Any component whose correctness depends on `os.rename()` / `os.replace()` being **atomic** must validate **at startup** that the source and destination paths live on the **same filesystem volume** -- and **refuse to run otherwise** (fail-closed, not fail-silent).

## Why

`rename()` is atomic only **within** a volume. Across volumes it silently degrades to **copy-then-unlink**, which is observable mid-operation (a concurrent reader can see the partial state) and breaks every consume-by-rename and rename-aside discipline built on top of it.

The danger is the **failure profile**: a cross-volume rename **appears to work in casual testing** -- small files copy fast, no error is raised. The atomicity loss only manifests **under a concurrent reader**, which is exactly the contested-file scenario these disciplines exist to handle. So a runtime failure would be **rare, non-deterministic, and catastrophic**. A startup gate converts that into a **loud, deterministic refusal** before any data is at risk.

## The check (cheap)

- **POSIX:** compare `st_dev` of the **nearest existing ancestor** of each path (the paths themselves may not exist yet -- walk up to the first that does).
- **Windows:** compare the drive/anchor (reference implementation: `os.path.splitdrive(...)` drive-letter comparison).
- On mismatch: refuse to start.

## Scope -- generalizes beyond the courier

Applies to **any agent doing atomic-rename file handoff**:

- inbox injection (rename-aside → exclusive-create),
- spool journaling (consume-by-rename),
- atomic config swaps (`write-temp → rename-over`).

If the temp/spool path and the target path can land on different volumes, the same-volume gate belongs at that component's startup.

## Evidence

- `teams/framework-research/poc/ghost-bridge/stationmaster-courier.py` -- `validate_startup()` + `_same_volume()` / `_nearest_existing()`.
- Discipline source: `stationmaster-courier-hints.md` §3 ("Spool placement: same filesystem as the inboxes dir -- `rename()` atomicity is per-volume. Validate at startup; refuse to run otherwise").
- Confidence: high. Reference implementation in the courier; the structural argument (cross-volume rename is copy-then-unlink, partial state visible to a concurrent reader) is independent of the sample.

## Field confirmation (2026-08-27, Brunel via Protocol A -- dedup outcome 2, appended not re-filed)

The #108 consolidation proposal §5.5 (`docs/2026-08-27-stationmaster-consolidation-proposal.md`) reports the gate as **live-useful on a personal machine with mixed mounts** -- Passepartout's courier on the household box `p2rtela6`, an independent deployment outside any team container: *"On a personal machine with mixed mounts this is a live hazard, not paranoia. Keep the guard mandatory in the courier discipline."* Independent deployer, same conclusion. **This does not raise confidence** -- the entry's ground is the structural argument plus the reference implementation, which n+1 sightings do not strengthen -- but it is the first report of the gate mattering *in the field* rather than in the argument, and it came from the deployment class (mixed mounts) the argument predicted.

*Stage-2 confirmed 2026-06-12 (Herald read-back): every technical point verified against the courier code and submission -- `st_dev`-nearest-ancestor, the failure-profile "why," the generalization, and the operation-side-vs-verification-side split against the per-filesystem-gate gotcha. No corrections; one precision folded (Windows branch is `os.path.splitdrive(...)` drive-letter comparison).*

## Related

- [`gotchas/per-filesystem-gate-targets-tmp-measures-wrong-fs.md`](../gotchas/per-filesystem-gate-targets-tmp-measures-wrong-fs.md) -- **sibling at the per-filesystem-atomicity layer, different angle.** That gotcha: a *test/gate* that runs against the wrong filesystem gives a false-confident PASS (verification-side). This pattern: a *runtime component* validates its two operational paths share a volume and refuses otherwise (operation-side). Both fail-closed; both descend from "atomic-rename is per-volume." File a `df -T`/`st_dev` check for both reasons.
- [`patterns/cross-host-atomic-inbox-write-primitive.md`](cross-host-atomic-inbox-write-primitive.md) -- the cross-host rename/exclusive-create primitive this gate protects.
- [`references/inbox-substrate-properties-2.1.170.md`](../references/inbox-substrate-properties-2.1.170.md) -- T5.a consume-by-rename + T6.a exclusive-create, the substrate operations whose atomicity this gate guarantees the precondition for.
- [`patterns/substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) -- defect class: the implicit invariant "source and dest are on the same volume" silently violated by a cross-volume deployment.
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) -- the courier this gate ships in (atomicity is per-filesystem, forcing local courier disciplines).

(*FR:Herald* -- submitted; *FR:Callimachus* -- filed)
