# Courier Runtime Team-Name-Discovery -- Design

(*FR:Brunel*) -- 2026-06-18, S55. Workstream 1 of issue #86 (CLI unfreeze to 2.1.178+). This is the single gating change before the local CLI can unpin off 2.1.177.

## 1. Problem statement (probe-proven)

On CLI **2.1.178+** ("implicit teams") the on-disk team directory is `~/.claude/teams/session-<id>/`, where `session-<id>` is derived from the session and is **random per session**. The Agent-tool `team_name` parameter is a **cosmetic chat label, ignored on disk** (probe P1, FAIL-load-bearing; see [`teams-migration-probe-findings-2026-06-17.md`](teams-migration-probe-findings-2026-06-17.md) and the substrate sheet [`wiki/references/teams-substrate-2.1.179-implicit-teams.md`](../wiki/references/teams-substrate-2.1.179-implicit-teams.md)).

The FR courier's config hardcodes:

```json
"inboxes_dir": "~/.claude/teams/framework-research/inboxes"
```

On 2.1.178+ that directory **does not exist** -- the live dir is `~/.claude/teams/session-<id>/inboxes`. The courier would `validate_startup` -> `RuntimeError: inboxes_dir does not exist` (best case, fail-fast) or, if the dir were pre-created by accident, silently watch an empty/dead inbox dir and deliver nothing (worst case, silent dead-courier). Either way the cross-team comms layer breaks.

**Net (from the probe):** the two substrate primitives the courier relies on -- members[] injection (P4) and inbox-file-write delivery (P5/P6) -- **both survive** 2.1.178+. The ONLY break is the hardcoded team-NAME segment of `inboxes_dir`. No redesign of injection/delivery is needed. Replace the hardcoded segment with runtime discovery and the layer migrates cleanly. This decision is filed at [`wiki/decisions/courier-must-runtime-discover-team-name.md`](../wiki/decisions/courier-must-runtime-discover-team-name.md).

## 2. Ground-truth correction to the task framing

The task brief named two candidate fix points: `_outbox_to_team` and the `inboxes_dir` resolution. **Only `inboxes_dir` is the fix point.** I cross-read both against the source:

- **`_outbox_to_team(cfg)`** (`stationmaster-courier.py:807`) strips the `-courier`/`-bridge` suffix off the **ghost-outbox member name** (e.g. `apex-research-courier` -> `apex-research`) to name the *remote destination team*. It has **nothing to do with the local team name**. It is not touched by this design.
- **`inboxes_dir`** (read in `Config.__init__`, `stationmaster-courier.py:88`) is the single field that contains the local `framework-research` segment. **Both directions resolve through it:**
  - **Outbound:** `consume_outboxes_to_spool` -> `cfg.inboxes_dir / f"{name}.json"` (`:388`)
  - **Inbound:** `resolve_target_inbox` / `inject_to` -> `cfg.inboxes_dir / f"{to}.json"` and `cfg.target_inbox` injection (`fr-courier-daemon.py:137`, and the reference `inject_batch` at `:594`)

**Consequence:** fixing `inboxes_dir` resolution **once** migrates both inbound and outbound. There is exactly one fix point.

Note the local team name appears in the config in **two** places: `inboxes_dir` (load-bearing -- the actual filesystem path) and `team` (`stationmaster-courier.py:83`, used only for logging/sanity per the config comment, `:62`). Discovery should drive `inboxes_dir`; `team` can be left as-is (cosmetic), or set to the discovered name for log fidelity. See section 6.

## 3. Discovery approaches evaluated

The decision entry sketches two. I evaluated both against the substrate sheet's `~/.claude` map.

### Approach A -- glob `~/.claude/teams/*/config.json`, read `.name`

```python
import json, glob
from pathlib import Path

def discover_by_config_glob(claude_home: Path) -> list[tuple[str, Path]]:
    """Return [(name, team_dir), ...] for every team dir with a readable config.json."""
    out = []
    for cfg_path in sorted(Path(claude_home, "teams").glob("*/config.json")):
        try:
            name = json.loads(cfg_path.read_text(encoding="utf-8"))["name"]
        except (OSError, json.JSONDecodeError, KeyError):
            continue  # skip unreadable/malformed dirs (stale, mid-write)
        out.append((name, cfg_path.parent))
    return out
```

- **Pros:** Reads the authoritative substrate fact directly (`config.json` `.name` IS the on-disk name, per P1). Independent of process/pid -- works from a startup script, a drain step, or the daemon. `config.json` is written **eagerly** on session start (P3), so it always exists before the courier runs. Simple, no pid plumbing.
- **Cons:** Ambiguous if **multiple** team dirs exist (stale dirs from prior sessions, or a genuine multi-team host). Needs a disambiguation rule (section 4).

### Approach B -- derive from `sessions/<pid>.json`

```python
import os, json
from pathlib import Path

def discover_by_session_pid(claude_home: Path, pid: int) -> str | None:
    """Read sessions/<pid>.json, return session-<first8hex-of-sessionId>."""
    sess = Path(claude_home, "sessions", f"{pid}.json")
    try:
        sid = json.loads(sess.read_text(encoding="utf-8"))["sessionId"]
    except (OSError, json.JSONDecodeError, KeyError):
        return None
    return f"session-{sid[:8]}"
```

- **Pros:** Unambiguous **for the session whose pid you hold** -- a 1:1 pid->session->team-dir map (substrate sheet, `sessions/<pid>.json` row). No multi-dir guessing if you know your own pid.
- **Cons:** **The courier is a separate process from the Claude session.** The courier daemon's own `os.getpid()` is NOT the session pid -- it's the daemon's pid, which has no `sessions/<pid>.json` entry. So Approach B requires the courier to be **told** the session pid (env var / config / launcher hands it down), which reintroduces exactly the kind of brittle coupling we're removing. On the FR Windows substrate the courier runs under a **Scheduled Task** (`run-courier-hidden.vbs`), fully detached from any Claude session pid -- there is no clean handoff. The `sessions/` dir can also hold **stale** entries for dead pids (the registry is not proven to garbage-collect on this substrate), so even a handed-down pid is not a guaranteed live-session signal.

### Recommendation: **Approach A (config-glob), with Approach B as a disambiguation tiebreaker only when a session pid is available.**

Approach A is the primary because it needs no pid plumbing and reads the authoritative name directly. Approach B is demoted to an **optional tiebreaker**: IF a session pid is available (handed down by a launcher) AND Approach A returns multiple candidates, use B's `session-<id>` to pick the matching dir. In the common FR case (lone team on the host, courier under a detached Scheduled Task) Approach A alone resolves cleanly and B never fires.

## 4. Failure modes and the disambiguation rule

The substrate gives us three problem cases for Approach A. The resolver handles each explicitly -- it never silently guesses.

| Case | Cause | Resolver behavior |
|---|---|---|
| **Exactly one team dir** | Lone team on host (the FR common case) | Use it. Done. This is the overwhelmingly common path. |
| **No team dir / no match** | Courier started before any session wrote `config.json`; wrong `claude_home`; CLI not run yet | **FAIL FAST** -- raise `RuntimeError("no team dir found under ~/.claude/teams")`. Do NOT fall back to a hardcoded name (that's the exact bug we're removing). Fail-fast surfaces a real misconfiguration instead of silently watching a dead path. |
| **Multiple team dirs** | Stale dirs from prior sessions left on disk; OR a genuine multi-team host | Disambiguate by the rule below. If still ambiguous -> **FAIL FAST** with the candidate list in the error. |

### Multiple-dir disambiguation rule (in order)

1. **Pid tiebreaker (if a session pid is available):** if the launcher handed down a session pid via `FR_COURIER_SESSION_PID` (env) or config, compute `session-<id>` via Approach B and select the matching dir. Unambiguous when present.
2. **Liveness filter via `sessions/`:** cross-reference each candidate team dir against `sessions/*.json`. A team dir is **live** if some `sessions/<pid>.json` has `status` != dead/exited AND its `session-<sessionId[:8]>` matches the dir name. Drop candidates with no live session backing them (these are the **stale dirs**). If exactly one live candidate remains, use it.
3. **Explicit operator override:** if config carries `team_dir_name` (an explicit `session-<id>` or literal), honor it verbatim and skip discovery. This is the escape hatch for a host an operator knows is multi-team -- discovery is the default, not a straitjacket.
4. **Still ambiguous -> FAIL FAST.** Raise with the full candidate list so the operator sees exactly what's on disk and can set `team_dir_name`. Never pick arbitrarily.

**Stale-dir note:** the substrate is not proven to GC old `teams/session-<id>/` dirs on session end. The liveness filter (step 2) is what keeps a stale dir from being mistaken for the live one. This is the single most likely real-world hazard on a long-lived host that has run many sessions -- it is handled, not hand-waved. (Lifecycle-side stale-dir cleanup is Volta/Herald's domain; this design only needs to *avoid selecting* a stale dir, not delete it.)

## 5. The resolver -- concrete shape

A standalone function so it serves BOTH the courier and Herald's lifecycle rework (see section 7), callable without constructing a `Config`.

```python
def resolve_team_dir(
    claude_home: Path,
    *,
    session_pid: int | None = None,
    explicit_dir_name: str | None = None,
) -> Path:
    """
    Resolve the live on-disk team directory under ~/.claude/teams/.
    Returns the team DIR (caller appends /inboxes). Raises RuntimeError on
    no-match or unresolved-ambiguity -- never guesses, never falls back to a
    hardcoded name.

    Order: explicit override -> single-dir -> pid tiebreaker -> liveness filter -> fail.
    """
    teams_root = Path(claude_home, "teams")

    # (3) explicit operator override wins outright.
    if explicit_dir_name:
        d = teams_root / explicit_dir_name
        if not d.is_dir():
            raise RuntimeError(f"explicit team_dir_name {explicit_dir_name!r} not found under {teams_root}")
        return d

    candidates = discover_by_config_glob(claude_home)   # [(name, dir), ...]
    if not candidates:
        raise RuntimeError(f"no team dir found under {teams_root} (no config.json). "
                           f"Is a Claude session running and on 2.1.178+?")
    if len(candidates) == 1:
        return candidates[0][1]

    # multiple -> disambiguate
    if session_pid is not None:
        want = discover_by_session_pid(claude_home, session_pid)
        for name, d in candidates:
            if name == want:
                return d
    live = [(name, d) for name, d in candidates if _has_live_session(claude_home, name)]
    if len(live) == 1:
        return live[0][1]

    raise RuntimeError(
        f"ambiguous team dir: {[n for n, _ in candidates]} (live: {[n for n, _ in live]}). "
        f"Set team_dir_name in config or FR_COURIER_SESSION_PID to disambiguate."
    )
```

`_has_live_session(claude_home, team_name)` scans `sessions/*.json`, matching `session-<sessionId[:8]> == team_name` and `status` not dead/exited.

## 6. Concrete change to the courier

**Strategy: discovery drives `inboxes_dir`; everything downstream is unchanged.** The narrowest possible blast radius -- one resolution point, no change to outbound/inbound choreography, dedup, lock, or routing.

### 6.1 File and function

- **File:** `teams/framework-research/poc/ghost-bridge/stationmaster-courier.py`
- **Function:** `Config.__init__` (`:81-93`), specifically the `inboxes_dir` resolution at `:88`.

### 6.2 The change

Make `inboxes_dir` **optional** in config. When absent (or set to a sentinel like `"auto"`), resolve it at runtime:

```python
# stationmaster-courier.py, Config.__init__ -- replace line 88
raw_inboxes = raw.get("inboxes_dir")
if raw_inboxes and raw_inboxes != "auto":
    self.inboxes_dir: Path = _expand(raw_inboxes)      # explicit path (back-compat / 2.1.177)
else:
    claude_home = _expand(raw.get("claude_home", "~/.claude"))
    team_dir = resolve_team_dir(
        claude_home,
        session_pid=_env_int("FR_COURIER_SESSION_PID"),
        explicit_dir_name=raw.get("team_dir_name"),
    )
    self.inboxes_dir = team_dir / "inboxes"
    if not raw.get("team"):
        self.team = team_dir.name   # log fidelity: report the discovered session-<id>
```

- `resolve_team_dir` and its two `discover_by_*` helpers + `_has_live_session` + `_env_int` are added to `stationmaster-courier.py` (Herald owns this reference file -- see section 7; I propose the patch, Herald integrates).
- **Back-compat preserved:** an explicit `inboxes_dir` (the 2.1.177 path) still works verbatim -- nothing changes for the pinned CLI. Discovery only fires when `inboxes_dir` is absent or `"auto"`. This lets us land the code change **before** the unpin and flip the config switch at unpin time. (Mirrors the `-courier`/`-bridge` back-compat discipline already in `_outbox_to_team`.)

### 6.3 Config change

Live config `fr-courier.config.json` and the example, at unpin time:

```json
"inboxes_dir": "auto",
"_inboxes_dir_note": "auto = runtime-discover the session-<id> team dir under claude_home (2.1.178+). On the pinned 2.1.177 CLI this was the literal ~/.claude/teams/framework-research/inboxes; that explicit form still works for rollback.",
"claude_home": "~/.claude",
"team_dir_name": null
```

The example-config sync is mine, post-validation (per my standing doc-sequence with Aen). The live-config flip is gated on the unpin and goes through the normal flip-plan + rollback discipline (the explicit old path IS the rollback).

### 6.4 `validate_startup` interaction

`validate_startup` (`:933`) already checks `cfg.inboxes_dir.is_dir()` and the same-volume invariant. After discovery, `inboxes_dir` points at the live `session-<id>/inboxes` -- the existing checks pass unchanged and now validate the **discovered** path. One subtlety: `state_dir` is `~/.stationmaster/framework-research` (decoupled from the team-name path), so the `_same_volume(inboxes_dir, state_dir)` check is unaffected by discovery -- both still resolve under the home volume. No change needed there. Worth a one-line comment in `validate_startup` noting it now validates a discovered path.

### 6.5 What does NOT change

- `fr-courier-daemon.py` -- **no change.** It reads `cfg.inboxes_dir` (already resolved by `Config`), `resolve_target_inbox`/`inject_to`/`process_inbound_routed` all consume the resolved path. The wrapper is correct as-is.
- `_outbox_to_team`, dedup ledger, `InstanceLock`, the spool, the cycle choreography -- all untouched.
- Per-agent routing guards (present + name-hygiene + inbox-exists) -- untouched; they now operate against the discovered dir, which is exactly right.

## 7. Coordination with Herald (WS2) -- the shared resolver

`stationmaster-courier.py` is **Herald's** reference file (per my scope: `courier.reference.py`/`stationmaster-courier.py` -> Herald). I author the design + propose the patch; Herald integrates it into the reference. Sent Herald a `[COORDINATION]`-style message (10:24) on the intersection.

The key shared-design point: **WS1 and WS2 both need "what team am I" at runtime.** I am factoring `resolve_team_dir` as a **standalone function** (not buried in `Config`) precisely so Herald's lifecycle startup/shutdown can call the same resolver:

- **Startup:** if a launcher script needs the inboxes dir before the courier config is built (e.g. to seed `inboxes/team-lead.json` so the first external wake lands -- P6 caveat: the file must exist), it calls `resolve_team_dir` directly.
- **Shutdown drain:** the drain step must find the live inboxes dir to flush -- same resolver.
- **CLI shim:** I'll add `stationmaster-courier.py --resolve-team-dir` (prints the resolved dir, exit 0; prints the error + exit 1 on ambiguity) so a PowerShell/bash launcher can capture it without importing Python.

**Open coordination question (sent to Herald):** does WS2 need discovery at a point *before* the courier config loads? If yes, the standalone function + CLI shim already cover it; if Herald's rework wants a different contract shape (e.g. emit the full `{name, dir, session_pid}` triple), I'll adjust. Awaiting his touchpoints.

## 8. State map (what discovery changes vs. preserves)

| Concern | Before (2.1.177, hardcoded) | After (2.1.178+, discovered) |
|---|---|---|
| Inbox dir path | literal `teams/framework-research/inboxes` | resolved `teams/session-<id>/inboxes` |
| Outbound resolution | `inboxes_dir / <outbox>.json` | same code, discovered base |
| Inbound resolution | `inboxes_dir / <to>.json` | same code, discovered base |
| `team` field | `"framework-research"` (config) | discovered `session-<id>` (log fidelity) or left cosmetic |
| `state_dir` / spool | `~/.stationmaster/framework-research` | **unchanged** -- decoupled from team path |
| Dedup ledger / lock | under `state_dir` | **unchanged** |
| Rollback to 2.1.177 | n/a | set `inboxes_dir` back to explicit literal path |

## 9. Failure modes (operational)

- **Courier starts before any Claude session:** no `config.json` -> `resolve_team_dir` raises (no team dir found) -> courier fails fast. Correct: there's nothing to watch yet. Lifecycle ordering (Herald) must start the session before the courier, OR the courier's restart loop retries (the Scheduled Task relaunches on its timer -- it'll succeed once the session exists).
- **Stale `session-<id>` dir from a prior session co-resident with the live one:** liveness filter (section 4 step 2) drops the dead one. If `sessions/` GC is unreliable and the filter can't distinguish, the resolver fails fast with the candidate list -> operator sets `team_dir_name`. Never silently watches the stale dir.
- **`sessionId` format change in a future CLI:** Approach B's `[:8]` slug derivation is version-coupled (substrate sheet TTL 2026-09-17). Approach A (config `.name`) is NOT slug-derived -- it reads the name the CLI itself wrote -- so the primary path is robust to slug-format drift. This is a second reason A is primary.
- **Multiple genuine teams on one host (future multi-team substrate):** `team_dir_name` override is the explicit-config path; the framework-level "how does a multi-team host disambiguate couriers" question is out of scope here and belongs to the lifecycle/taxonomy topics if it ever arrives.

## 10. Open questions

1. **Herald's WS2 touchpoints** -- does lifecycle need discovery pre-config-load? (Asked; awaiting.) Determines whether the CLI shim is load-bearing or just convenient.
2. **Validation against a live 2.1.179 substrate** -- this design is probe-grounded but the resolver code is unrun. Validation needs either a 2.1.178+ probe container (Hopper's domain -- I design, route execution) or the unpin itself. Recommend a `--once` dry-run of the patched courier against a throwaway 2.1.179 session before the live flip, same as the #2 flip discipline.
3. **`sessions/<pid>.json` GC behavior** -- the liveness filter assumes we can tell live from dead via `status`. The probe captured the *shape* of `sessions/<pid>.json` but not its GC-on-exit behavior. A one-line addition to the next probe (does a `sessions/<pid>.json` linger after the session exits?) would harden the stale-dir handling. Flagging for Hopper/Aen.

## 11. Summary

- **One fix point:** `inboxes_dir` resolution in `Config.__init__` (`stationmaster-courier.py:88`). `_outbox_to_team` is NOT a fix point (it resolves the remote destination, not the local team).
- **Discovery:** Approach A (glob `config.json` `.name`) primary; Approach B (`sessions/<pid>.json`) demoted to tiebreaker (the courier doesn't own the session pid).
- **Never guesses:** single dir -> use; none -> fail fast; multiple -> pid/liveness/override, else fail fast.
- **Back-compat:** explicit `inboxes_dir` still works -> land the code before unpin, flip config at unpin, explicit old path IS the rollback.
- **Shared resolver:** standalone `resolve_team_dir` + a `--resolve-team-dir` CLI shim serve Herald's WS2 lifecycle too.
- **Blast radius:** outbound + inbound both migrate from one resolution change; daemon wrapper, dedup, lock, routing all untouched.

(*FR:Brunel*)
