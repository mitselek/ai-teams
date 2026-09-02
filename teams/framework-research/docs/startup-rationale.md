# Startup rationale, history and superseded gotchas (*FR:Volta*)

Companion to [`../startup.md`](../startup.md). The runbook carries only what you execute; this file carries **why** each step is shaped the way it is, the gotchas that no longer apply but explain the shape, the probe evidence, and the open defects.

**Split rationale (S71, 2026-09-02):** `startup.md` had reached 30,771 bytes / 279 lines -- past the Bash tool's 30 KB output cap, so the team-lead could not even `cat` the procedure he was supposed to execute. A runbook that cannot be read is not a runbook. Everything non-executable moved here verbatim in substance; nothing was deleted.

**On citing this material:** cite by **step name** (`Step 2'`, `Step 3.5`, `S4`) or by section heading, never by line number. Existing wiki entries cite `startup.md:142`, `:162`, `:193`; those line numbers are already wrong and will keep decaying with every edit. Some entries also cite an older numbering entirely (`"Step 5 of startup.md"` for inbox restore, `"Step 4 of startup.md Read Order"`) -- artefacts of the 2026-04-30 collapse. Step **names** are the stable identifiers and are deliberately frozen: `Step 0.5`, `1`, `2'`, `3`, `3.5`, `4`, and `S1`-`S4`.

## Implicit teams (CLI 2.1.178+) -- the load-bearing change

2.1.178 **removed `TeamCreate` and `TeamDelete`**. Teams became **implicit**: a lone authenticated session is already a one-member team with itself as `team-lead`, and `config.json` is written **eagerly** on session start, before any spawn. The on-disk dir name is a random `session-<id>` derived per session. The Agent tool's `team_name` parameter is a cosmetic chat label, ignored on disk.

Three consequences run through the whole runbook:

- **The team is not created or deleted -- it is discovered.** The old Step 2 (Clean + Create) collapsed to **Step 2' Discover**: look up which `session-<id>` dir is mine, verify it operational. Shutdown Step S5 (release leadership) was **deleted**.
- **Everything name-keyed must use the discovered slug**, not the literal `framework-research`. Inbox restore and persist target `~/.claude/teams/<slug>/inboxes/`. The repo-side durable copy stays keyed by **agent name** (`team-lead.json`, ...) so it survives a team name that rotates every session.
- **The host carries many team dirs, so discovery must disambiguate.** Brunel's WS1 finding (2026-06-18) counted 11 on this box; S71 counted 23, of which 2 were live.

Full design: [`lifecycle-rework-implicit-teams-2026-06-18.md`](lifecycle-rework-implicit-teams-2026-06-18.md) (Herald, WS2). Probe evidence: [`migration-validation-probe-findings-2026-06-18.md`](migration-validation-probe-findings-2026-06-18.md) (Hopper, V1-V5).

## Superseded gotchas -- kept because they explain the shape

### Gotcha #3 (HISTORICAL, pre-2.1.178): TeamCreate could return success with no config on disk

On the explicit-team CLI, `TeamCreate` could report success while `config.json` was not yet on disk -- hypothesis at the time was a lazy write. On 2.1.178+ this is **moot**: there is no `TeamCreate`, and `config.json` is written eagerly on session start (probe P3), before Step 2' runs. The verify-on-disk check survives, but with a different job: it is now Step 2's **discovery gate** (confirm the auto-created config is present and operational), not a defence against a missing `TeamCreate` write.

### Gotcha #4 (HISTORICAL, pre-2.1.178): stale in-memory leadership blocked the next TeamCreate

On the explicit-team CLI, in-memory team-leadership state survived `/clear`, so a bare `rm -rf $TEAM_DIR` left stale leadership behind and the next `TeamCreate` failed with "Already leading team". On 2.1.178+ this **no longer applies**: leadership is not a held token, it is the implicit property of a running session, and it ends when the process ends (probe P3 plus the absence of `TeamCreate`/`TeamDelete`). There is no acquire step for stale state to block; the next session derives a fresh `session-<id>` and ignores any leftover dir.

**The hazard inverted.** Leftover `session-<id>` dirs now **accumulate**, because nothing deletes them on exit. This is non-fatal -- the resolver's liveness filter skips dead dirs -- and it is handled out of band by an optional pid-guarded sweep, **not** by a mandatory lifecycle step. A failed sweep must never block a session. The sweep must exclude the live session's own dir and must key liveness on **process liveness**, not the `status` field: probe V3 showed dead sessions linger at `status:"idle"`, indistinguishable from live. See `topics/06-lifecycle.md` (Stale-dir hygiene) and the Callimachus gotcha `no-teamdelete-stale-session-dirs-accumulate`.

**Hard precondition on any sweep (S67):** background sessions' dirs are named from `leadSessionId`, not the registry `sessionId`, so a sweep must not run on a host carrying unaccountable live background sessions.

### Gotcha #5, now runbook substrate facts 2 and 3

`~/.claude/teams/` holds many dirs and always has -- on 2.1.178+ because stale `session-*/` dirs accumulate, and on the 2.1.177 bridge because every team that CLI ever created kept a dir. So a bare resolver call returns `ambiguous ... (live: [...])` and exits non-zero. That is the **expected** outcome of an undisambiguated call, not a fault to halt on; supply the disambiguator and re-run. Halt only when the *disambiguated* call fails. Never hardcode the runtime path; never guess on genuine ambiguity -- the resolver fails fast with the candidate list for a reason.

## The 2.1.177 bridge (retired)

During the 2.1.177 pin, team dirs were `TeamCreate`-named rather than `session-<id>`, so neither glob nor pid disambiguated a multi-dir box and the explicit override `--team-dir-name framework-research` was the only thing that resolved. The lifecycle scripts and the courier shared the env var `FR_COURIER_TEAM_DIR_NAME` for that override (Aen, 2026-06-18).

The bridge is retired -- the host has been on 2.1.178+ continuously since the 2.1.181 flip, and is on 2.1.258 today. **The env var outlived the bridge and is now the primary disambiguator for a different reason:** `$PPID` is 1 under the Bash tool, so the pid path was unusable until the fix below. Where old text says "set `FR_COURIER_TEAM_DIR_NAME=framework-research` on the bridge", read instead: set it to the **discovered slug**, on every call, always.

Rollback, if it were ever needed: reinstall 2.1.177, revert the tracked-files commit, and stop calling the courier restart wrapper (the explicit-config courier with its static path is the rollback baseline and is always safe to start).

## Step 0.5 -- why the check changed shape twice

**Original rationale (S38, 2026-05-28).** On Agent-tool teams, `roster.json`'s `model` field is documentation-only. The *parent session model* was stamped into runtime `config.json` regardless of roster intent, and all subsequently spawned specialists inherited it. S38 caught a parent running 4.7 stamping `"model": "claude-opus-4-7[1m]"` into `config.json` while the roster said 4.6 -- roughly a 40% context-cost differential per agent against the 4.6 baseline of S35-S37. The check was written to catch exactly that.

**First revision (2.1.178+).** The stamp moved to the eagerly-written auto-created `config.json` (probe P3), so the check read the already-present config's effective model rather than gating a `TeamCreate` stamp. Same model to verify, same fix, same place.

**Second revision (S70/S71, the current shape).** The premise itself is now false. Runtime `config.json` carries **no `model` key at all** for team-lead -- `has("model")` is false on every session dir, and `jq .model` printing `null` is the absent-key result, not a stored null. Spawned members do carry a value, but it is the **literal family string** the Agent tool was handed (`"opus"`), never a version. So:

- For the **team-lead seat** the pin is unenforceable **and unobservable**. The only available check is comparing the parent model as reported by the system prompt or `/context` against `roster members[0].model` by hand.
- For **member seats** it is unenforceable but observable. Reading `"model": "opus"` off a member is a valid diagnosis; the same diagnosis is unavailable for the lead, and a survey treating `null` there as "no override" is reading absence as evidence.
- The Agent tool's `model` enum at 2.1.258 is **`sonnet | opus | haiku | fable`**. A version pin cannot be expressed. Per-specialist pins in the roster are documentation, and saying so plainly in the runbook is the honest fix.

Both halves of this have now survived 2.1.235, 2.1.251 and 2.1.258 unfixed. Neither is version-coupled, so no version change will retire them. See the wiki gotcha `dual-team-dir-ambiguity` and the pattern `roster-drift-from-reference-capability-register`.

## Step 3.5 -- courier lifetime and the rotation fix

**Courier lifetime is CLI-version-split** (Direction #4 amendment, ratified S58 2026-06-18; Herald's rotation-teardown contract §3). The older property "the courier stays up between sessions, no stop step needed" was **2.1.177-only** and is **retired**, obsolete rather than broken: the static `inboxes_dir` it relied on stopped existing once the team dir became a per-session `session-<id>`.

On 2.1.178+ the courier is **per-session**. Step 3.5 is a full reap-then-restart: the stop wrapper kills, drains and releases the lock of the prior session's courier against the launched config, then the start wrapper re-resolves the live `session-<id>` and acquires. Making the explicit config session-aware was **rejected** -- it would duplicate the resolver.

**Two local configs, both gitignored infra, neither committed:** `fr-courier.config.json` is the explicit default and is always safe (a plain start can never crash), and `fr-courier.config.auto.json` is the `inboxes_dir:"auto"` variant. The wrapper's `-Config` defaults to the auto variant, and **only the wrapper ever loads auto**, behind its pre-flight dry-run guard. That is why the runbook step is one call with no config editing.

**Bug A and the ordering (S58).** Step 3.5 was originally Step 2.5 and ran *before* restore. The courier's `validate_startup` requires its resolved `inboxes_dir` to exist, and on a bare-fresh cold boot that dir is first created by `restore-inboxes.sh`. Running the courier first crashed it with `inboxes_dir does not exist`. Two fixes shipped, belt and suspenders: the reorder (Step 3 before Step 3.5), and the courier self-creating its resolved `inboxes_dir` in `validate_startup`, matching its sibling state, spool and inject dirs (Brunel, S58). Bonus of the reorder: inboxes are populated before the courier starts polling, so no live courier ever acts on a half-populated dir.

**The v1/v2 precondition, and how it failed.** The step used to say: while FR is the sole migrated team on the host, bare `"auto"` plus process-liveness narrows to the one live `session-<id>`, so omit the pid (option b); pass `-SessionPid` only once a second team migrates (option a). That trigger was written as a testable predicate at what was then `startup.md:193`. **The condition came true and nothing fired**, because nobody owned evaluating it. Finn's point at the time: the prose was not wrong, which is exactly why patching prose is the wrong corrective. The corrective is an owner and a moment -- which is why the healed runbook has **Step 0**, and why the v1/v2 branch is gone: the runbook now passes the pid unconditionally, because two live sessions is the measured norm on this box.

See the wiki gotchas `precondition-without-an-owner-is-no-precondition` and `courier-restart-needs-inboxes-dir-step25-before-step3`.

## Shutdown S5 -- deleted, not replaced

On the explicit-team CLI the parent held in-memory leadership state that survived `/clear`, and `TeamDelete` was the only primitive that released it, so S5 called `TeamDelete` on graceful exit. On 2.1.178+ all three clauses of that rationale evaporate: leadership is not a held token; it does not survive process exit, because **process exit is the release**; and there is no `TeamDelete` to call and nothing to release.

So the protocol went from five phases to four. The old symmetry argument (startup Phase 2 `TeamDelete` matched by shutdown Phase 5 `TeamDelete`) evaporates with it -- there is no create/delete pair to be symmetric about. The new symmetry: startup **discovers** the implicit team, shutdown **persists** durable state and exits. Both ends are about durable state in the repo, not about leadership tokens.

The residue is disk hygiene, covered under gotcha #4 above. It is not a shutdown step and not a per-shutdown blocker.

## Probe and evidence citations

| Ref | What it established |
|---|---|
| **P3** | `config.json` is written eagerly on session start, before any spawn -- the basis for "discover, do not create" and for retiring gotcha #3 |
| **P4** | `members[]` injection and SendMessage targeting work on 2.1.178+; restore rides the normal active-session inbox-read path |
| **P6** | idle-proactive-wake path, inconclusive on 2.1.181 -- restore correctness deliberately does not depend on proactive wake |
| **V3** | the resolver's liveness filter must key on process liveness, not `status`: dead sessions linger at `status:"idle"` |
| **V4** | the cold-start window -- `config.json` first, `sessions/<pid>.json` only at interactive-ready |
| **S57 halt** | a false negative produced by reading the cold-start window as failure; S58's boot live-validated 2.1.181 and overturned it. Any existence or liveness probe returning "nothing here" within ~25s of cold start must await and retry before reporting absence |

Sources: [`migration-validation-probe-findings-2026-06-18.md`](migration-validation-probe-findings-2026-06-18.md), [`migration-validation-probe-brief-2026-06-18.md`](migration-validation-probe-brief-2026-06-18.md), and the wiki gotcha `cold-start-discovery-false-negative-config-before-sessions-json`.

## Cutover notes from the 2.1.181 flip -- now closed

The three items flagged at the flip (S55, 2026-06-18) have all been resolved by measurement:

1. **`python3` versus `python` on Git Bash** -- both are on PATH via Scoop; `python3` is 3.14.3. The scripts' `python3` call is correct. Closed.
2. **`$PPID` inside a `bash script.sh` invocation** -- it resolves to **1**, not the Claude session pid. The cutover note guessed it "may not be the Claude process" and called the consequence non-fatal because liveness would narrow to FR's sole live session. **Both halves were wrong**: the pid is useless, and liveness does not narrow, because this box runs two or more live sessions. Closed by the fix below.
3. **Commit gating** -- the rewrite was held until the CLI flipped to 2.1.181. Long since done.

## Open defects (Volta's, recorded here)

1. **The lifecycle scripts ignored an explicit session-pid override.** `restore-inboxes.sh` and `persist-inboxes.sh` passed `--session-pid "$PPID"` unconditionally, and an explicit flag beats the resolver's `FR_COURIER_SESSION_PID` env fallback -- so with `$PPID` = 1 the env pid was silently ignored and the pid path could never work under the Bash tool. **Fixed in this commit**, one line per script: `--session-pid "${FR_COURIER_SESSION_PID:-$PPID}"`. Verified both ways on 2.1.258 -- with the env set the resolver returns the live slug, with it unset the behaviour is byte-identical to before. `FR_COURIER_TEAM_DIR_NAME` remains the runbook's primary disambiguator because it is version-independent and needs no working pid.
2. **The courier never logs its resolved `inboxes_dir`.** The daemon's "courier up" line prints the config's `team` field, which is the literal `framework-research`, masking the discovered slug. The only evidence that the courier bound to the right dir is the *wrapper's* `pre-flight OK: would resolve to <path>` line -- which means correct binding is unverifiable from the log alone, and unverifiable at all if the wrapper's output was not captured. **Not fixed** (the courier is Brunel's surface); the runbook works around it by making the pre-flight line the verify condition.
3. **The `sanitize-inboxes` skill picks `configs[0]`**, which is the wrong team on a multi-dir box. Both S70 and S71 ran the skill's logic by hand, pinned to the discovered slug. **Not fixed**; the skill is a user-level file, outside the repo.
4. **The user-level skill files are stale.** `~/.claude/skills/framework-research-startup/SKILL.md` still describes "Steps 1-5 (Sync, Diagnose, Clean, Create, Restore)", and the next-session skill still says "S1-S5". Both predate the 2.1.178 rework, let alone this heal. Outside the repo; team-lead owns the update.

(*FR:Volta*)
