# Lifecycle Rework for Implicit Teams (no `TeamCreate`/`TeamDelete`)

*Design / spec -- WS2 of issue #86 (CLI unfreeze to 2.1.178+). (\*FR:Herald\*) -- 2026-06-18, S55.*

**Status:** DRAFT for team-lead (Aen) / Volta review. This doc DESIGNS the new lifecycle sequence; team-lead/Volta apply it to `startup.md` and the `topics/06-lifecycle.md` SEQUENCE sections (those surfaces are team-lead/Volta domain, not mine).

**Empirical ground truth:** the 2.1.179 probe (`docs/teams-migration-probe-findings-2026-06-17.md`, Hopper, commit b37b938) and its curated sheet (`wiki/references/teams-substrate-2.1.179-implicit-teams.md`). Every substrate claim below cites a probe result (P1-P6). Sibling WS1 design = Brunel's courier runtime name-discovery; this doc and his intersect at exactly one primitive (Section 3).

---

## 1. The problem in one paragraph

Startup Step 2 (`TeamDelete` + `TeamCreate`) and shutdown Step S5 (`TeamDelete` to release leadership) hard-depend on two primitives that **2.1.178 removed**. The whole rationale chain those steps were built on -- "the binding invariant is the parent CLI's in-memory team-leadership state, and the only primitive that releases it is `TeamDelete`" (topic-06 Phase 2 rationale) -- assumed an **explicit** team model: you *create* a team (acquiring leadership), you *delete* it (releasing leadership). On 2.1.178+ teams are **implicit**: a lone authenticated session is *already* a 1-member team with itself as `team-lead`, `config.json` written **eagerly** on session start, before any spawn (P3). There is nothing to create and nothing to release. The lifecycle's create/delete machinery does not need new primitives -- it needs to be **deleted**, because the substrate now does for free what those steps were hand-rolling.

## 2. What changed (substrate delta, 2.1.177 -> 2.1.178+)

| Concern | 2.1.177 (explicit teams) | 2.1.178+ (implicit teams) | Probe |
|---|---|---|---|
| Team existence | Created by `TeamCreate`; absent until called | **Auto-exists** -- lone session is a 1-member self-led team, `config.json` eager on session start | P3 |
| Team name | Caller-chosen literal (`framework-research`), stamped into `config.json .name` | **`session-<id>`** -- session-derived, random per session; Agent-tool `team_name` IGNORED on disk (cosmetic chat label only) | P1 |
| Leadership state | In-memory, held by parent CLI, **survives `/clear`**, released only by `TeamDelete` | Implicit property of the live session; **ends when the process ends**. No held-and-released token. | P3 + (absence of `TeamCreate`/`TeamDelete`) |
| Cleanup between sessions | `TeamDelete` (disk + in-memory); `rm -rf` was strictly weaker | Process exit releases the live session; on-disk `session-<id>` dirs are **inert leftovers**, not leadership state | derived |
| `members[]` injection | Honored | **Still honored** (P4) -- ghost-courier registration survives | P4 |
| Inbox-file-write delivery | Wakes + delivers | **Still works**, proactively wakes a bare idle session (P6) | P5/P6 |
| Inbox entry shape | `{from,text,summary,timestamp,read}` | adds `"type"` field | P5 |

**The single load-bearing consequence:** "the team" is no longer a thing you name, acquire, and surrender. It is a thing that already exists under a name you must **discover**. Lifecycle steps that *acquire* (Step 2 Create) or *surrender* (S5 Release) collapse into a step that *discovers* (which `session-<id>` dir is mine) -- or disappear entirely.

## 3. The shared primitive: runtime team-identity discovery (intersection with WS1 -- RESOLVED)

Both the lifecycle (this doc) and the courier (Brunel, WS1) must answer the same question at runtime: **"what is my team's on-disk dir name?"** They MUST use the same answer. **This is resolved: WS1 owns the resolver implementation (`resolve_team_dir` in `stationmaster-courier.py` + a `--resolve-team-dir` CLI shim); lifecycle CALLS it, does not reinvent it.** See Brunel's `docs/courier-runtime-team-name-discovery-design-2026-06-18.md` §5.

**The disambiguation hazard is real and lifecycle-introduced.** Under explicit teams, `TeamDelete` at shutdown (S5) removed the team dir, so the next session started against a clean `~/.claude/teams/`. With no `TeamDelete` (Section 5), **stale `session-<id>` dirs accumulate** -- every crashed or exited prior session leaves an inert dir behind. So `glob ~/.claude/teams/*/` can return N>1 dirs, and only one is *this live session's*.

**Canonical resolver (Brunel's WS1 design, adopted):** `resolve_team_dir(claude_home, *, session_pid=None, explicit_dir_name=None) -> Path`, resolving in order:

```
1. explicit_dir_name override (operator escape hatch) -- if set, use verbatim
2. glob ~/.claude/teams/*/config.json, read .name      -- CANONICAL discovery (probe path a)
   - exactly one candidate  -> use it (the FR common case)
3. multiple candidates -> disambiguate:
   a. pid tiebreaker  -- IF a session_pid is available, match session-<sessionId[:8]>
   b. liveness filter -- drop candidates with no live sessions/<pid>.json backing (kills stale dirs)
   c. still ambiguous -> FAIL FAST with the candidate list (never guess)
4. no candidate at all -> FAIL FAST (no hardcoded-name fallback -- that's the bug we're removing)
```

### The "canonical primitive" was a false conflict: ONE function, TWO vantage points (Aen, 2026-06-18)

My first framing argued pid-keyed-primary; Brunel argued glob-primary. **Aen resolved it: neither design has to abandon its path -- both are right, for different CALLERS.** The shared artifact is the *function* `resolve_team_dir(...)`, which encodes ONE decision rule; *which path fires* is caller-relative:

| Caller | Owns session pid? | Path that fires | Why canonical *for this caller* |
|---|---|---|---|
| **Lifecycle / CLI session** (this doc) | YES -- runs IN-session, `session_pid=os.getpid()` | pid tiebreaker (3a) fires first in the multi-dir case | O(1), unambiguous even amid stale leftovers -- the in-session caller should always pass its pid |
| **Courier daemon** (Brunel, WS1) | NO -- detached Scheduled Task, no session pid | glob (2) + liveness filter (3b); pid omitted | No pid plumbing to break; reads the authoritative `config.json .name`; liveness filter kills stale dirs without a pid |

The function's parameter `session_pid=None` IS this distinction: **pass the pid when you hold it, omit it when you don't.** Two robustness notes that make glob the safe *default* (when no pid is passed): (i) `.name`-glob reads the *authoritative* name the CLI wrote, whereas pid re-derives `session-<sessionId[:8]>` -- version-coupled slug-format (substrate sheet TTL 2026-09-17), so glob is robust to slug drift; (ii) the **liveness filter** (3b) kills stale dirs *without* needing our own pid. So the courier's no-pid path is fully safe, and lifecycle's with-pid path is an O(1) optimization on top of the same function. Both Section 3 here and Brunel's §5 finalize against this single function -- no path abandoned.

### Lifecycle's asymmetry vs. the courier (the one place we differ in CALL, not in resolver)

The resolver is one function; the two callers differ only in whether they pass `session_pid`:

- **Lifecycle (this doc) runs INSIDE the Claude session.** Startup steps and the bash scripts the session invokes can obtain the live session pid (`os.getppid()` from a script, or the session's own pid) and pass it as `session_pid=<live>`. So lifecycle gets the pid tiebreaker **for free** where the courier cannot. This does NOT invert the canonical order -- glob is still primary; lifecycle simply supplies the optional tiebreaker that makes 3a fire deterministically in the multi-dir case.
- **Courier runs DETACHED (Scheduled Task).** It calls `resolve_team_dir` with `session_pid=None` and relies on glob + liveness filter (3b).

Same resolver, same canonical glob, different optional arg. The lifecycle scripts call the **CLI shim** (`stationmaster-courier.py --resolve-team-dir`), capturing the bare slug from stdout (`SLUG=$(resolve-team-dir)`); exit 0 + slug on success, non-zero + stderr on no-resolve/ambiguity. Contract confirmed with Brunel (2026-06-18).

**Stale-dir hygiene** (the dirs the liveness filter must skip over) is a separate lifecycle concern -- the resolver only *avoids selecting* a stale dir; *removing* them is Section 6.

## 4. New STARTUP sequence

### 4.1 The collapse

Old Step 2 was **Clean (`TeamDelete`) + Create (`TeamCreate`) + verify-on-disk**. All three sub-actions lose their reason to exist:

| Old sub-action | Fate on 2.1.178+ | Why |
|---|---|---|
| `TeamDelete` (clean) | **DELETE** | Tool gone. Nothing to release -- leadership is not a held token (Section 2). |
| `TeamCreate` (create) | **DELETE** | Tool gone. Team auto-exists eagerly on session start (P3) -- the `config.json` is already on disk before this step would run. |
| verify `config.json` on disk | **KEEP, repurposed** | Still a valid operational gate -- but it now verifies the **auto-created** team is present and **discovers its name**, rather than verifying a `TeamCreate` write. |

Step 2 is **replaced** by **Step 2': Discover** -- not a create, a lookup. The team already exists; the session's job is to learn its own `session-<id>` name and confirm the team is operational.

### 4.2 Step 2' (replaces Step 2): Discover team identity

**Precondition:** Orient + Sync complete (Steps 0.5/1 unchanged -- see 4.4). The CLI session is live (it is, by definition, since it's running this step), so its team `config.json` already exists on disk (P3, eager).

**Action:**

```
1. Discover the live team dir via the Section-3 shared resolver. From a script:
   SLUG=$(stationmaster-courier.py --resolve-team-dir)   # glob-canonical; lifecycle MAY pass the live session_pid as tiebreaker
   (the resolver: explicit-override -> single-dir -> pid-tiebreaker -> liveness-filter -> fail-fast)
2. Verify ~/.claude/teams/<slug>/config.json exists and is readable,
   contains a members[] with this session as team-lead.
3. Record <slug> as TEAM_DIR_NAME for the rest of startup
   (Step 3 inbox-restore needs it; Step 4 spawn-gate reads its config.json).
```

**Verify:** `config.json` exists under the discovered `<slug>`; `.name == <slug>`; team-lead member present. This is the **operational gate** (old Step 2b's role survives verbatim -- do not spawn into a team you have not confirmed operational).

**Surface the discovered name (OQ4, Brunel rec):** startup should ECHO the discovered `<slug>` to the operator (e.g. `Team dir: session-d0cf4760`). The on-disk name is now a random `session-<id>`, not the friendly `framework-research`; an operator debugging "which dir is my team" benefits from seeing it. Cheap, one log line in Step 2'.

**Failure mode:** discovery returns no dir, or the `config.json` is absent. Unlike old Step 2 (where the recovery was "re-run `TeamDelete`+`TeamCreate`"), there is **no create primitive to retry**. If the auto-created team is genuinely missing, that is a substrate/platform fault -- STOP and report to the user (do not attempt to fabricate a team dir by hand; the harness owns that file). This is strictly rarer than the old retry case: the team is created by the same code path that started the session, so its absence means the session itself is broken.

**Write-order / pid-availability (V4 finding, WS3b probe 2.1.181 -- resolves OQ2-write-order):** the probe MEASURED the cold-start write order: **`config.json` is written FIRST (eager), and `sessions/<pid>.json` appears only when the session reaches interactive-ready (~10-25s later).** So there is a real startup window where the team dir exists but the session's pid entry does NOT yet. Consequence for Step 2': if Step 2' runs in that window, the **pid tiebreaker is not yet usable** -- but the single-dir glob path still resolves (no pid needed), which is the common case. Only the **multi-dir + pid-entry-not-yet-written** corner forces a choice: Step 2' should **wait briefly for the pid entry** if it intends to pass `session_pid`, OR accept single-dir-glob with **fail-fast-then-retry** in the rare multi-dir-cold-start case. Recommendation: for a lifecycle caller that holds its own pid, prefer a short wait-for-`sessions/<pid>.json` (bounded, e.g. the same ~25s interactive-ready window) before the discovery call, so the pid tiebreaker is reliably available. This is a one-line operational note for the `startup.md` Step 2' application (TL/Volta domain); the design choice is: **wait-for-pid (preferred for the in-session caller) over accept-fail-fast-retry.**

### 4.3 Step 3 (Restore inboxes): KEEP -- but now name-parameterized

**This step does NOT change in purpose, and is MORE load-bearing than before.** The runtime dir (`~/.claude/teams/<slug>/`) is platform-ephemeral by design (topic-06 Phase 4a; the two-dir model is unchanged). The durable copy lives in the repo (`teams/framework-research/inboxes/`). Step 3 still bridges them.

**The one change:** the restore target path is now `~/.claude/teams/<TEAM_DIR_NAME>/inboxes/` where `<TEAM_DIR_NAME>` is the **discovered** `session-<id>` from Step 2', not the literal `framework-research`. The restore-inboxes.sh script must take the discovered name as a parameter (or call the Section-3 primitive itself) instead of hardcoding the team name.

**A second consequence of name-randomness:** the repo-side inbox copy is keyed by **agent name** (`team-lead.json`, `herald.json`, ...), not by team name -- so the durable copy is portable across `session-<id>` rotations. Restore copies repo `inboxes/<agent>.json` -> runtime `teams/<discovered-slug>/inboxes/<agent>.json`. The agent-name keying is what makes the durable bridge survive a team name that changes every session. **This is the load-bearing reason inbox-restore still matters and gets easier, not harder, under implicit teams.**

**Bare-session caveat (P6) -- CAVEATED by WS3b, see below:** on a brand-fresh session, `inboxes/` does not exist until first activity. Restore must `mkdir -p` the `inboxes/` dir (already in topic-06 Phase 4 "Why `mkdir -p` is required"). On the S54 2.1.179 probe, P6 confirmed an external write *creates* `team-lead.json` and is delivered on the next activity cycle -- so restore writing the files is itself the activation, consistent with the existing script.

> **⚠ P6 re-test caveat (WS3b probe, 2.1.181, V5b):** the WS3b probe did **NOT** cleanly re-confirm P6 on the unpin-target version 2.1.181 -- an external inbox-write did NOT proactively wake a bare idle session within 35-90s (vs ~15s on S54/2.1.179). The result is **inconclusive-leaning-negative** with a **named confound**: the probe drove the session purely headless (`docker exec` + `tmux send-keys`, never an attached pane; `focus-events off`), and the proactive-wake may depend on a terminal-activity/focus signal a never-attached pane doesn't generate. **Impact on this step:** Step 3 restore's correctness does NOT depend on *proactive* wake -- restore runs *during* startup (the session is active, not idle-waiting), so `mkdir -p` + file-write + the existing restore script are unaffected. The P6 question bites the **steady-state inbound-while-idle** path (a courier writing to a quiescent session's inbox and expecting a proactive wake), which is the [teamless-courier RfC](rfc-teamless-courier-2026-06-17.md) headline, not this restore step. **Recommendation:** re-test P6 with an *attached* pane on 2.1.181 before any design (RfC async-proactive-wake default, or a courier relying on idle-session wake) leans on it; if it's a real 2.1.181 regression, the fallback is the courier's own poll loop. Restore (Step 3) is safe either way.

### 4.4 Steps unchanged

- **Step 0 (Orient):** unchanged -- read startup.md, roster, common-prompt, scratchpad. (Roster `model` is documentation-only on Agent-tool teams; that's a separate, still-true fact.)
- **Step 0.5 (parent-model check):** unchanged -- still verify parent CLI model matches roster team-lead model before spawning, since the parent model is stamped into the auto-created `config.json` and inherited by spawns. **Note:** this check now reads the *auto-created* `config.json`'s effective model rather than gating a `TeamCreate` stamp, but the intent and action are identical.
- **Step 1 (Sync):** unchanged -- `git pull`.
- **Step 4 (Spawn):** unchanged in mechanism -- ask which agents, duplicate-gate on `config.json`. P4 confirms `members[]` injection and SendMessage targeting still work, so the spawn + ghost-courier registration path is untouched. The only delta: the duplicate-gate reads `config.json` under the **discovered** `<slug>`, not `framework-research`.

### 4.5 Startup sequence, after rework

```
Step 0    Orient        (unchanged)
Step 0.5  Parent-model   (unchanged in intent; reads auto-created config)
Step 1    Sync           (unchanged: git pull)
Step 2'   DISCOVER       (REPLACES Step 2 Clean+Create: pid-keyed self-lookup +
                          verify config.json operational. No create, no delete.)
Step 3    Restore        (KEEP: name-parameterized by discovered <slug>;
                          repo->runtime inbox bridge, agent-name-keyed)
Step 4    Spawn          (unchanged: dup-gate on discovered config.json)
```

## 5. New SHUTDOWN sequence

### 5.1 Does leadership-release still exist as a concept?

**No. It evaporates.** This is the central shutdown finding.

S5's entire rationale (topic-06 Phase 5, startup.md S5, gotcha #4) was: *the parent CLI's in-memory team-leadership state is independent of disk, survives `/clear`, and `TeamDelete` is the only primitive that nulls it -- so call `TeamDelete` on graceful exit so the next `/clear` start needs no recovery.* Every clause of that rationale is **specific to the explicit-team model**:

- "in-memory leadership state held by the parent CLI" -- on 2.1.178+ leadership is not an acquired token; it is the implicit property of a running session. It is not *held*; it simply *is*, for as long as the process lives.
- "survives `/clear`" -- the failure this defended against was `TeamCreate` returning "Already leading team" because stale leadership outlived a `/clear`. **There is no `TeamCreate` to fail**, and there is no acquire-step that can be blocked by stale state. The implicit team is re-derived fresh from the live pid on the next session (Section 3). A leftover `session-<id>` dir on disk does not block anything -- the next session has a *different* `session-<id>` and ignores the old dir.
- "`TeamDelete` is the only primitive that releases it" -- the tool is gone, and there is nothing to release: **process exit is the release.** When the CLI process ends, the live session ends, and with it the implicit leadership. No explicit primitive is needed or available.

So S5 does not get *replaced* by a new release primitive. **S5 is deleted.** Leadership-release is no longer a lifecycle step because the substrate releases it for free on process exit.

### 5.2 What replaces S5: nothing (but stale-dir hygiene moves to a different home)

There is one *residue* of S5's old job. `TeamDelete` did double duty: it released in-memory leadership AND removed the on-disk team dir. The release half evaporates (5.1). The **dir-removal half** does not have a substrate equivalent -- on 2.1.178+ nothing removes the `session-<id>` dir on exit, so dirs accumulate (Section 3 hazard). That is **not a leadership concern and not a per-shutdown blocker** (the next session ignores leftovers). It is **disk hygiene**, handled out-of-band, not as a mandatory shutdown step. See Section 6.

### 5.3 Steps unchanged

S1-S4 are **entirely unaffected** -- none of them touch `TeamCreate`/`TeamDelete`:

- **S1 (Halt):** unchanged.
- **S2 (Own scratchpad + task snapshot + shutdown requests):** unchanged.
- **S3 (Collect -- wait for `teammate_terminated`):** unchanged. P2 confirms SendMessage/delivery survive, so the shutdown-request/response handshake is intact.
- **S4 (Persist inboxes + commit):** unchanged in purpose, name-parameterized like Step 3. `persist-inboxes.sh` reads from the **discovered** runtime `<slug>/inboxes/` and writes the agent-name-keyed durable copy to the repo. This is the durable half of the bridge -- still the only persistence mechanism, MORE central now (5.1 removed the only other "cleanup" step).

### 5.4 Shutdown sequence, after rework

```
S1   Halt        (unchanged)
S2   Notify      (unchanged: scratchpad, task snapshot, shutdown requests)
S3   Collect     (unchanged: wait for teammate_terminated)
S4   Persist     (KEEP: name-parameterized by discovered <slug>; runtime->repo
                  inbox bridge, agent-name-keyed. Last durable step.)
S5   Release     (DELETED: leadership-release evaporates -- process exit IS the
                  release; no TeamDelete to call, nothing to release.)
```

The shutdown protocol goes from 5 phases to **4**. The symmetry argument that justified S5 (startup Phase 2 `TeamDelete` <-> shutdown Phase 5 `TeamDelete`) **also evaporates** -- there is no longer a create/delete pair to be symmetric about. The new symmetry is simpler: startup **discovers** the implicit team; shutdown **persists** durable state and exits. Entry and exit are both about *durable state in the repo*, not about *leadership tokens*.

## 6. Stale `session-<id>` dir hygiene (new concern, was free under `TeamDelete`)

Under explicit teams, `TeamDelete` (S5 + startup Step 2) kept `~/.claude/teams/` to a single live dir. With both gone, every ungraceful (and even graceful) session exit leaves a `session-<id>` dir behind. Consequences and remediation:

- **Does it break anything? No.** The next session derives its own fresh `session-<id>` (Section 3 pid-keyed) and ignores leftovers. Discovery is pid-keyed precisely so leftovers are non-fatal.
- **Does it cost anything?** Disk (small JSON dirs) and a discovery-disambiguation burden (why the `.name`-glob is only a fallback). Unbounded accumulation over many sessions is untidy but not load-bearing.
- **Remediation (out-of-band, NOT a mandatory lifecycle step):** an optional startup-time or cron sweep that removes `~/.claude/teams/session-*/` dirs **not** matching the live pid's session. This is a *hygiene* convenience, deliberately kept OUT of the mandatory startup/shutdown sequence so that a failed sweep never blocks a session. **Hazard to encode:** a sweep MUST exclude the live session's own dir (pid-keyed check) and SHOULD be conservative -- only remove dirs whose `config.json` `leadSessionId` does not correspond to any live `sessions/<pid>.json`. Cataloging this as a gotcha is queued for Callimachus (Section 9).
- **This is platform-substrate territory** -- it touches the container/host filesystem lifecycle (Brunel's containerization domain) as much as the protocol. Recommend the sweep design be owned by Brunel/Volta as a follow-up, not blocking the unpin.

## 7. #62 supersession analysis (Requirement 3)

Issue #86 records that this work **supersedes #62**. #62 (filed during the explicit-team era, post-#60/#61) recommended consolidating onto `TeamDelete`/`TeamCreate`. The 2.1.178 migration **inverts the foundation** those recommendations stood on. Item-by-item:

| #62 recommendation | Fate under 2.1.178+ | Rationale |
|---|---|---|
| **Replace startup Steps 2-4 with `TeamDelete` + `TeamCreate` + verify** | **INVERTS** | The consolidation target (`TeamDelete`+`TeamCreate`) is exactly the pair that's gone. #62 wanted to lean *harder* on those primitives; the migration removes them. Replaced by Step 2' Discover (Section 4.2). The *verify-config.json* half **survives** (repurposed as the discovery gate). |
| **Retire `rm -rf "$TEAM_DIR"` (strictly weaker than `TeamDelete`)** | **SURVIVES (stronger)** | #62's reason to retire `rm -rf` was "`TeamDelete` does it better." That reason is gone, but the *conclusion* holds for a new reason: on 2.1.178+ you must NOT `rm -rf` your own live team dir -- the team auto-exists and the live session owns it; deleting it mid-session is self-sabotage. `rm -rf` stays retired, now because it's actively harmful, not merely redundant. (Stale-*other*-dir cleanup is Section 6, pid-guarded.) |
| **Retire Step 2 diagnostic ("STALE DIR -- will clean")** | **SURVIVES** | Gated nothing then; gates nothing now. The dir-state diagnostic is even less relevant -- there is no clean/dirty distinction to diagnose, only "discover my live dir." Stays retired. |
| **Retire Step 4 disk-write retry block (TeamDelete+TeamCreate retry on missing config.json)** | **INVERTS-then-SURVIVES** | The *mechanism* (retry via TeamDelete+TeamCreate) inverts -- those tools are gone, so the retry block can't exist as written. The *conclusion* (don't defend against an unobserved API-success-but-no-disk-write failure) survives: Step 2' has no retry, it STOPs on genuine absence (Section 4.2). Net: the block is removed, as #62 wanted, but because its primitives vanished, not because the failure mode was rare. |
| **Append `TeamDelete()` to shutdown S4 (release leadership on graceful exit)** | **INVERTS** | This is the most direct inversion. #62 wanted to *add* a `TeamDelete` at shutdown; the migration *removes* the `TeamDelete` primitive AND removes the need for it (leadership evaporates on process exit, Section 5.1). The recommendation is not just unimplementable -- its goal (null in-memory leadership so next `/clear` start needs no recovery) is **moot**: there is no acquire-step to be blocked. |
| **Make Step 7 dashboard launch idempotent (curl :5173, skip/kill stale vite)** | **SURVIVES (orthogonal)** | Nothing to do with team primitives -- apex-specific dashboard hygiene. Untouched by the migration. (Not an FR-startup.md concern; apex-research's own.) |
| **Retire `tmux-spawn-guide.md` (self-DEPRECATED) / `ar-respawn -- REMOVED` block / archive historical record** | **SURVIVES (orthogonal)** | Doc-hygiene cleanups, independent of team primitives. Untouched. |
| **KEEP inbox restore (Step 5) + inbox persist (S4)** | **SURVIVES + STRENGTHENS** | #62 correctly identified these as the only persistence bridge because the runtime dir is ephemeral. The migration makes them *more* central (Sections 4.3, 5.3): they are now the agent-name-keyed bridge that survives a team name that rotates every session, and (post-S5-deletion) the persist step is the last durable action at shutdown. |
| **KEEP `ar-remove-member` (mid-session single-teammate respawn)** | **SURVIVES** | `members[]`-edit honored mid-session (P4) -- removing/re-adding a member via config.json edit still works. `TeamDelete` was always too coarse for this; that's even more true now. |

**Summary of the supersession:** #62's **mechanical recommendations invert** (anything that *added* or *consolidated-onto* `TeamCreate`/`TeamDelete` is dead). #62's **hygiene/keep recommendations survive** (retire `rm -rf`, retire dead diagnostics/docs, keep the inbox bridge, keep mid-session member-edit) -- several survive with a *different rationale* than #62 gave. The clean way to close #62: mark it **superseded by #86**, port the still-valid hygiene items (the doc-archival + `rm -rf` retirement, now re-justified) into the #86 rework, and note that its central consolidation thesis is inverted by the substrate change it predates.

## 8. Failure-mode & scaling analysis

**Failure modes of the new sequence:**

| Failure | Cause | Recovery |
|---|---|---|
| Discovery returns no team dir | Session genuinely broken (the same code path that ran startup creates the team) | Resolver FAILs FAST (Section 3, case 4). STOP, report to user. No create-retry exists; no hardcoded-name fallback; fabricating a dir by hand is forbidden (harness owns it). |
| Discovery returns >1 dir, ambiguous | Stale `session-<id>` leftovers (Section 6) OR genuine multi-team host | Resolver disambiguates (Section 3): lifecycle passes the live `session_pid` (it runs in-session, so it has it) -> pid tiebreaker fires; if no pid, liveness filter drops stale dirs; else FAIL FAST with candidate list. Never guesses. |
| `sessions/<pid>.json` not yet written / lingers stale | Race: discovery before registry write; OR dead-session entry not GC'd | If glob returns a single dir, neither matters (single-dir path wins before any pid/liveness step). Multi-dir + missing-pid-record + stale-liveness -> FAIL FAST (operator sets `team_dir_name`). The liveness filter's correctness depends on `sessions/` GC behavior -- see OQ2. |
| Inbox restore writes to wrong `<slug>` | Discovered name stale/wrong | Restore is name-parameterized off the SAME resolver (CLI shim) as Step 2'/4 -- a single discovery feeds all touchpoints; no independent re-derivation that could drift. |
| Stale dirs accumulate unbounded | No `TeamDelete` cleanup | Out-of-band pid-guarded sweep (Section 6); non-fatal in the meantime (resolver skips them via liveness filter). |

**Scaling (Herald's standing lens -- behavior at 2, 5, 10 teams/sessions on one host):**

- **Discovery cost:** `.name`-glob is O(N-dirs) (read each `config.json`), and on a host with many stale leftovers the liveness filter adds an O(M-sessions) cross-ref. Both are tiny (small JSON reads) and bounded by the sweep (Section 6). Lifecycle's available `session_pid` short-circuits the multi-dir case to O(1)-after-glob via the pid tiebreaker -- an advantage the in-session caller has that the detached courier does not.
- **Stale-dir accumulation scales with session count, not team count.** A host that runs 50 sessions over a week has 50 leftover dirs absent a sweep. The sweep (Section 6) is the bound; it's pid-guarded so it scales safely (never touches a live session's dir).
- **No leadership-contention at scale.** Under explicit teams, "Already leading team" was a single-CLI-reuse hazard. Implicit teams have no acquire-step, so N concurrent sessions on a host each own their own `session-<id>` with zero contention -- the migration *improves* multi-session behavior.

## 9. Open questions

1. **[RESOLVED + FINAL 2026-06-18 -- Aen]** Discovery primitive. False conflict: ONE shared function `resolve_team_dir(...)`, TWO callers, path is caller-relative -- lifecycle owns its pid and passes it (pid tiebreaker, O(1)); the detached courier omits it (glob + liveness filter). Neither path abandoned. Section 3 FINAL against this framing; Brunel's §5 aligns. Lifecycle calls the `--resolve-team-dir` CLI shim.
2. **`sessions/<pid>.json` GC behavior (shared with Brunel's OQ3):** the liveness filter assumes a dead session's `sessions/<pid>.json` reads as dead (status, or absence). The probe captured the *shape* but not GC-on-exit. If a dead entry LINGERS with a stale live-looking status, the liveness filter can't drop the stale dir and the resolver fails fast (safe, but forces an operator override). One-line addition to the next probe: *does `sessions/<pid>.json` linger after the session exits, and with what status?* Flagged for Hopper/Aen. This is the one substrate-fact gap under the whole discovery design.
3. **Sweep ownership (Section 6):** confirm the stale-dir sweep is Brunel/Volta follow-up (platform-substrate), explicitly OUT of the mandatory sequence and NOT blocking the unpin.
4. **[RESOLVED 2026-06-18 -- Brunel]** Team name as user-visible string? For the courier's mechanism: path-component only (the `team` config field is cosmetic/logging). For lifecycle: Brunel recommends startup SURFACE the discovered `session-<id>` to the operator (it's a random slug now, not the friendly `framework-research`; an operator debugging "which dir is my team" benefits from seeing it echoed). Folded into Step 2' (the action already records `<slug>`; startup should echo it).
5. **`type` field (P5):** out of WS2 scope (courier JSON-shape, WS1/courier), noted for completeness -- the inbox-restore/persist scripts copy entries verbatim, so they tolerate the new field without change.

## 10. Knowledge to file (-> Callimachus, Protocol A)

- **DECISION** `decisions/lifecycle-release-evaporates-under-implicit-teams`: shutdown S5 (leadership-release) is DELETED not replaced -- on 2.1.178+ leadership is the implicit property of a live session, released by process exit; `TeamDelete` is gone and unneeded. Links [[courier-must-runtime-discover-team-name]], [[teams-substrate-2.1.179-implicit-teams]].
- **DECISION** `decisions/startup-create-collapses-to-discover`: startup Step 2 (Clean+Create) collapses to Step 2' Discover -- the team auto-exists (P3), so the session discovers its `session-<id>` via the shared `resolve_team_dir` (glob-canonical + liveness-filter, optional pid tiebreaker) and verifies operational, rather than creating. Links [[courier-must-runtime-discover-team-name]] (the courier-side sibling that owns the resolver).
- **GOTCHA** `gotchas/no-teamdelete-stale-session-dirs-accumulate`: with `TeamDelete` gone, `~/.claude/teams/session-*/` dirs accumulate on every exit; non-fatal (the resolver's liveness filter skips dead dirs) but needs a pid-guarded out-of-band sweep that MUST exclude the live session's own dir. Depends on `sessions/<pid>.json` GC behavior (OQ2).

*Filed to Callimachus when he's spawned / when routed; queued in herald.md.*

---

*Next step: team-lead/Volta review. Section 3 is FINALIZED against Brunel's WS1 resolver (OQ1, OQ4 resolved 2026-06-18). One substrate-fact gap remains (OQ2, `sessions/` GC -- shared with Brunel, flagged for the next probe), non-blocking for the design. Then Volta applies to `startup.md` + `topics/06-lifecycle.md` SEQUENCE sections. This doc is the design; the application to those two surfaces is team-lead/Volta domain.*

(\*FR:Herald\*)
