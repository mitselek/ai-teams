# Startup -- vedur (*VD:Minot*)

**Read this file FIRST every session.** It replaces exploration. Do not run an Explore agent or a broad search.

## Anchors

| Anchor | Path |
|---|---|
| `TEAM_ROOT` | `~/work/vedur/` |
| `TEAM_DIR` (runtime, ephemeral) | `~/.claude/teams/vedur/` |
| Repos | `~/work/rumba/`, `~/work/HES-integration-tests/` |
| Onboarding timetable | `~/FIRST-TASKS.md` (Joosep's copy; pristine at `/opt/FIRST-TASKS.md`) |

## Read order

1. this file
2. `TEAM_ROOT/roster.json`
3. `TEAM_ROOT/common-prompt.md` -- the hard safety rule is there
4. `TEAM_ROOT/prompts/minot.md`
5. `TEAM_ROOT/memory/minot.md` -- summary header

## Procedure

**Step 1 -- state.** `git -C ~/work/rumba status -sb; git -C ~/work/HES-integration-tests status -sb` (both may be absent before task 1 completes -- that is expected, not an error). Read `~/FIRST-TASKS.md` and note which tasks are ticked.

**Step 2 -- runtime dir.** `rm -rf ~/.claude/teams/vedur` (it is ephemeral by platform design; a missing dir is normal).

**Step 3 -- create.** `TeamCreate(team_name="vedur")`. Verify `~/.claude/teams/vedur/config.json` exists on disk. If TeamCreate reports success but the file is absent: `TeamDelete`, `TeamCreate` again, re-check; after two failures STOP and tell Joosep.

**Step 4 -- model check.** The specialists inherit this session's model. If it is not `claude-fable-5[1m]`, tell Joosep before spawning anyone.

**Step 5 -- greet.** In Estonian: where the timetable stands, what you propose next, what you need from him. Wait. **Do not auto-spawn.**

**Step 6 -- dispatch.** Spawn per task, `run_in_background: true`. Before each spawn check `config.json` -- if the name exists, SendMessage instead. Saxby rides along with any builder.

## Shutdown

1. Each active agent: scratchpad summary rewritten, closing message with `[LEARNED]` / `[DEFERRED]` / `[WARNING]` / `[RAIL]`, shutdown approved. Wait for termination, not for approval.
2. Your own scratchpad last.
3. `git -C ~/work/vedur add -A && git -C ~/work/vedur commit -m "chore(vedur): session state <date>"` -- local repo, no remote yet.

## Environment

- Linux (Debian) container `joosep` on the RC host; you are user `joosep`; Claude is the native install under `~/.local/bin` (if `type -a claude` shows two paths, tell Joosep to tell Mihkel).
- `rumba` is a **pnpm** monorepo with catalog deps; `HES-integration-tests` is npm.
- No secrets in this container beyond the GitHub PAT, by design. If any `SK_*`, `HES_`, `VJS_`, `PONY_` value is ever visible here, stop and report.

(*VD:Minot -- drafted by FR:Celes*)
