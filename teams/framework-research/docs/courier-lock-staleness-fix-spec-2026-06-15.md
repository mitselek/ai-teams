# Fix-Spec -- Courier InstanceLock stale-lock false-negative across container recreate

(*FR:Herald*)

**Status:** SPEC ONLY -- design staged, **NOT landed**. Team-lead HOLD (13:22): `stationmaster-courier.py` is shared across all couriers (apex, FR, others); landing the fix needs a PO scope decision (this-session vs follow-up) + careful test, not a spec-routed edit. This doc is the design; the diff below is staged, not applied.

**Bug found by:** Brunel (during apex hardening, Hopper's supervisor kill-test). **Owner of fix:** Herald (courier-reference owner). **Co-file:** Protocol-A gotcha, Brunel=finder + Herald=owner.

---

## 1. The bug (confirmed against code)

`InstanceLock` (`stationmaster-courier.py` §SINGLE-INSTANCE LOCK, ~L836-869) reclaims a stale lock by **PID-liveness only**:

- `_write_lock` (L858-861) records `{"pid": os.getpid(), "ts": _utc_stamp()}`. `ts` is written but **never read**.
- `_is_stale` (L863-869) reads `pid` and returns `not _pid_alive(pid)`.
- `_pid_alive` (L884) is `os.kill(pid, 0)` on POSIX.

**Failure:** a container recreate (`docker compose up -d --force-recreate`) resets the PID namespace -- pids restart at 1. A pid written by the courier in a PRIOR container can **alias** a live, unrelated process in the FRESH container. `os.kill(<old-pid>, 0)` succeeds → `_pid_alive`=True → `_is_stale`=False → courier **refuses to start** ("another courier instance is already running").

**Trigger condition (production, not test-only):** ANY ungraceful courier death (SIGKILL, OOM-kill, `docker kill`, hard crash) skips `release()`, leaving the lock on the **persistent** state_dir. On the next container start, pid-aliasing can false-negative the staleness check and block startup. Observed: apex courier SIGKILL'd (pid 1691) in container A; recreated to B; lock on `~/.claude` still records pid 1691; courier in B refused because pid 1691 aliased a live process in B's namespace. Defeats the apex supervisor's relaunch (ASK-1) after ungraceful death.

**Observed n=2 (Hopper ops-log-2026-06, relayed 13:33 + authoritative datapoints 13:44):** same stale-lock record, OPPOSITE outcomes across successive recreates -- the inconsistency IS the mechanism's signature, not noise. Lock record (both datapoints, unchanged): `{"pid": 1691, "ts": "20260615T101014057235"}`; pid 1691 = the courier `kill -9`'d at 13:10 (verify-2). All outcomes below are the SAME recorded pid 1691 across recreates.

- **DP1 (13:17, REFUSE):** container 13c94177 (fresh recreate; prior 78377bcb). Fresh courier refused: `RuntimeError: another courier instance is already running (lock ...courier.lock); refusing to start`.
- **DP2 (13:23 + 13:28 + 13:39, RECLAIM):** subsequent recreates reclaimed the same-shape lock: `WARN lock: reclaiming stale lock at ...courier.lock` → `courier up:`.

**Measured vs inferred (evidence-integrity, per Hopper 13:44):** what is DIRECTLY OBSERVED = same recorded pid 1691 + same lock record produced OPPOSITE outcomes (refuse vs reclaim) across recreates; and pid 1691 was confirmed DEAD by `ps -p 1691` at 13:21 (≈4 min after the 13:17 refuse). What is INFERRED, NOT measured = the value of `os.kill(1691,0)` AT the 13:17 refuse instant (the aliasing-alive condition). The alive-at-check-time variable was not independently captured at the refuse/reclaim moment; it is inferred from outcome. Do NOT cite it as measured.

Pid-liveness-only reclaim is a **deterministic mechanism with a nondeterministic outcome** -- whether the recorded prior-container pid happens to alias a live process in the new PID namespace at check time decides refuse (false-alive) vs reclaim (correctly dead). This is the **best explanation**, supported by (a) the directly-observed opposite-outcomes-same-pid pair and (b) Brunel's code read (`_pid_alive` = `os.kill(pid,0)` only; lock record `{pid,ts}` with no boot/container id; `ts` recorded-but-unused). The per-instant `os.kill` value is the single inferred-not-measured link. A confirmatory Tier-R probe to upgrade it to directly-measured (kill-9 → recreate → `os.kill`/`ps` the lock pid at boot BEFORE the courier's check) is available from Hopper on request -- see §6.4.

**Additional substrate fact (Hopper, load-bearing for the trigger condition):** NEITHER SIGKILL NOR a clean SIGTERM releases the courier lock on exit -- there is no self-cleanup on the exit path. So the stale lock is left by ANY unclean exit, not only SIGKILL. (FR's stop-script works around this by drain+release-on-stop, but the underlying `InstanceLock` reclaim logic is the shared gap this fix closes.) The fix makes both DP1 and DP2 deterministically reclaim: the prior-container epoch always differs from the current, so the lock is stale regardless of pid aliasing. (Evidence also folded into the co-filed gotcha; see §8.1 / the Protocol-A entry.)

## 2. Why `boot_id` (the first-proposed fix) is insufficient

Brunel's proposed discriminator was `/proc/sys/kernel/random/boot_id`. **Granularity bug:** `boot_id` is a UUID generated at **kernel boot** and is **HOST-scoped** -- containers share the host kernel, so every container on a host reads the **same** `boot_id` until the HOST reboots. `--force-recreate` does NOT change it.

So container A and container B recreated on the same live host carry **identical** `boot_id` → `_is_stale` still returns False → still refuses. `boot_id` only catches the host-reboot-between-lifetimes case, **not** the recreate-on-live-host case actually observed. Wrong granularity: we need container-instance, not host-boot.

## 3. The fix -- container-instance discriminator (PID-1 starttime)

Record a **container-instance epoch** in the lock alongside `pid`, and make a differing epoch ALWAYS stale (regardless of pid aliasing). Source: **PID-1 start time** from `/proc/1/stat` field 22 (`starttime`, clock ticks since system boot). PID 1 is the container's init; its starttime is effectively the container-instance birth-epoch and changes on every recreate.

`_is_stale` logic:
1. If recorded `cinstance` differs from current `cinstance` → **stale** (different container ⇒ stale, period). This is the new, decisive check.
2. Only if `cinstance` matches (same container instance) → fall back to pid-liveness (`not _pid_alive(pid)`) -- handles same-container crash+restart.
3. Unreadable/missing fields → stale (unchanged conservative default).

### Staged diff (against current L858-869 -- NOT applied)

```python
def _container_instance() -> str:
    # Container-instance epoch: PID-1 starttime (/proc/1/stat field 22), which
    # changes on every container recreate. Used so a lock written by a PRIOR
    # container is ALWAYS stale regardless of pid aliasing (PID namespace resets
    # on recreate -> a stale pid can alias a live unrelated process). NOT boot_id:
    # boot_id is host-kernel-scoped and identical across containers on one host.
    try:
        # field 22 is starttime; fields 2..3 (comm) may contain spaces+parens,
        # so split on the LAST ')' then index from there.
        stat = Path("/proc/1/stat").read_text(encoding="utf-8")
        after = stat[stat.rindex(")") + 1:].split()
        return after[19]  # field 22 overall == index 19 after the comm field
    except (OSError, ValueError, IndexError):
        return ""  # no /proc (non-Linux dev host) -> empty; see _is_stale degrade

def _write_lock(self) -> None:
    rec = json.dumps({
        "pid": os.getpid(),
        "ts": _utc_stamp(),
        "cinstance": _container_instance(),
    })
    with open(self.path, "x", encoding="utf-8") as fh:
        fh.write(rec)

def _is_stale(self) -> bool:
    try:
        rec = json.loads(self.path.read_text(encoding="utf-8"))
        pid = int(rec["pid"])
    except (OSError, json.JSONDecodeError, KeyError, ValueError):
        return True  # unreadable lock -> treat as stale
    cur = _container_instance()
    rec_inst = rec.get("cinstance", "")
    # Different container instance ⇒ stale, regardless of pid liveness.
    # Only compare when BOTH are non-empty (Linux); empty == no-/proc degrade.
    if cur and rec_inst and cur != rec_inst:
        return True
    return not _pid_alive(pid)
```

## 4. Degradation + compatibility

- **Non-Linux (Windows dev box):** `/proc/1/stat` absent → `_container_instance()` returns `""`. The `cur and rec_inst` guard means the epoch check is skipped and behavior falls back to the EXISTING pid-liveness path (Windows already conservative -- `tasklist`, assume-alive on uncertainty). Windows is dev-only (prod = Linux container), so this is correct: the fix activates exactly where it's needed.
- **Backward-compat with old locks:** an old lock record has no `cinstance` key → `rec.get("cinstance","")` is `""` → epoch check skipped → falls back to pid-liveness (current behavior). No crash on upgrade; the fix engages once a courier with the new code writes the first lock.
- **`ts` field:** left in place (still unused for staleness; harmless, useful for debugging). NOT repurposed -- a max-age on `ts` was considered and rejected (clock-dependent + arbitrary threshold; weaker than a hard identity compare).

## 5. Alternatives considered + rejected

| Discriminator | Verdict | Why |
|---|---|---|
| `/proc/sys/kernel/random/boot_id` | REJECT | Host-kernel-scoped; identical across containers on one host; misses recreate-on-live-host (the observed case). |
| Container hostname / `/etc/hostname` | REJECT | Defaults to short container ID but `--hostname` in compose can pin it → unreliable. |
| `/proc/self/cgroup` container-id | REJECT | cgroup-v1-vs-v2 dependent; messier parse; no gain over PID-1 starttime. |
| `ts` + max-age | REJECT (fallback only) | Clock-dependent + arbitrary age threshold; weaker than hard identity compare. |
| **PID-1 starttime (`/proc/1/stat` f22)** | **ADOPT** | Container-instance-scoped; changes per recreate; stdlib-only; graceful non-Linux degrade. |

## 6. Test plan (owed before landing -- for whoever lands it, per scope decision)

1. **Unit (Windows-runnable):** monkeypatch `_container_instance` to fixed values; assert (a) differing epoch ⇒ stale even when `_pid_alive`=True; (b) same epoch + dead pid ⇒ stale; (c) same epoch + live pid ⇒ NOT stale (refuse); (d) missing `cinstance` ⇒ pid-liveness fallback; (e) empty epoch (no /proc) ⇒ pid-liveness fallback.
2. **Container recreate (Linux, Hopper):** start courier in container A, SIGKILL it, `--force-recreate` to B, start courier → MUST reclaim (the bug repro flips to PASS). Then a genuine double-start within ONE container → MUST still refuse (no regression on the real-contention case the lock exists for).
3. **Cross-platform smoke:** confirm non-Linux start path unchanged (epoch empty → fallback).
4. **(Optional) Confirmatory mechanism probe -- upgrade the n=2 inferred link to measured (Hopper, Tier-R):** kill-9 a courier, `--force-recreate`, then `docker exec` `os.kill(<lockpid>,0)` / `ps -p <lockpid>` AT boot, BEFORE the courier's own staleness check, and capture the value at that instant. This directly measures the alive-at-check-time variable currently inferred from outcome (see §1 "Measured vs inferred"). Not required to LAND the fix (the fix makes the epoch-compare decisive regardless of the os.kill value), but it closes the one inferred link in the gotcha's evidence if a directly-measured n is wanted. Decision to spend the probe is the tasker's (touches apex during a window). **DECIDED 13:47 (Aen): DO NOT run against apex** -- it would perturb the verified-GREEN final image (f00ae758) and interrupt the in-flight round-trip; perturbing a green state for nice-to-have evidence is declined. The inferred-best-explanation framing (§1) stands. A future implementer MAY capture the measured n on a NON-apex Debian substrate (cheaper, no green-state risk) if a directly-measured datapoint is ever wanted.

## 7. Open questions -- CLOSED by Brunel substrate-check (2026-06-15 13:26)

- **OQ-1 [CLOSED]:** PID-1 starttime assumes the courier and the lock-writer see the SAME PID 1 (same PID namespace). Brunel confirms apex's entrypoint does `exec gosu ai-teams "$@"` → PID 1 IS the container init, the courier runs as ai-teams inside that same namespace → it sees its own PID 1. Per current topology the courier IS the supervised process. Flag only if topology changes (courier moved to a separate PID namespace from the lifetime-relevant process).
- **OQ-2 [CLOSED]:** `/proc/1/stat` readability + field-22 stability. Brunel confirms READABLE on apex's substrate: PID 1 is ai-teams-owned (via gosu), courier is same uid, NO `hidepid` mount on /proc (stock Debian/Ubuntu base, no such hardening). Residual risk = a future hardened runtime with `hidepid=2` → already covered by the §4 degrade path (unreadable → conservative `_pid_alive` fallback, no-worse-than-today). Field 22 (`starttime`) stable across proc(5) generations; §6.2 container-recreate test confirms empirically on the deployment substrate.
- **CONCURRENCE:** Brunel (finder) concurs PID-1-starttime over boot_id (13:26); agrees the boot_id-is-host-scoped trap is the load-bearing refinement of the gotcha, not a footnote. No open holes. Spec stands as-is for the implementation task.

## 8. Scope / hold note

Per team-lead 13:22: this fix touches the SHARED `stationmaster-courier.py` (apex's, FR's, future couriers). Blast radius is real. The apex hardening finish does NOT depend on it (Hopper one-time-clears the test-artifact lock to finish supervise() verification + round-trip independently), so it is a **durable follow-up**, not urgent -- the HOLD is correct and I am NOT requesting a fast-track. Land only after the PO scope call + the §6 test plan passes. Herald does not touch git.

### 8.1 Relationship to Brunel's apex-entrypoint lock-pre-clean (two complementary fixes)

Per team-lead 13:27: Brunel is adding an **apex-entrypoint lock-pre-clean** (apex-local, in-scope, lands NOW) that removes a stale lock at container boot, before the courier starts -- closing apex's restart-resilience case immediately. This **does NOT replace** the fix in this spec. The two are complementary, defense-in-depth:

| Fix | Where | When | Scope |
|---|---|---|---|
| Entrypoint lock-pre-clean (Brunel) | apex container entrypoint | boot, before courier launch | apex only; any courier whose container has such an entrypoint |
| **InstanceLock container-instance discriminator (this spec)** | shared `stationmaster-courier.py` | inside the courier's own startup | ALL couriers -- FR's, apex's, future -- incl. those with NO entrypoint pre-clean |

The entrypoint pre-clean is a per-deployment mitigation; this spec's fix makes the courier **itself** correct so it stops false-negating regardless of whether any external pre-clean runs. FR's courier (Windows dev box, no such entrypoint) and any future courier are protected only by the shared-reference fix. Land both; neither makes the other redundant.
