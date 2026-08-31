# Startup -- paunvere (*VD:Minot*)

**Read this file FIRST every session.** It replaces exploration. Do not run an Explore agent or a broad search.

## Anchors

| Anchor | Path |
|---|---|
| `TEAM_ROOT` | `~/work/paunvere/` |
| `TEAM_DIR` (runtime, ephemeral) | `~/.claude/teams/session-<id>/` -- **discovered, not created**; see Step 3 |
| Repos | `~/work/rumba/`, `~/work/HES-integration-tests/` |
| Onboarding timetable | `~/FIRST-TASKS.md` (Joosep's copy; pristine at `/opt/FIRST-TASKS.md`) |

## Implicit teams -- how this CLI works

This container installs CLI 2.1.250 (2.1.178+): **there is no `TeamCreate` and no `TeamDelete`.** A lone session is already a 1-member team with itself as team-lead; its `config.json` is written **eagerly on session start** into a runtime dir named `session-<id>` (random, per session -- the team name `paunvere` never appears on disk there). The team is **discovered, not created**, and leadership evaporates on process exit -- there is nothing to clean and nothing to release.

## Read order

1. this file
2. `TEAM_ROOT/roster.json`
3. `TEAM_ROOT/common-prompt.md` -- the hard safety rule is there
4. `TEAM_ROOT/prompts/minot.md`
5. `TEAM_ROOT/memory/minot.md` -- summary header

## Procedure

**Step 1 -- state.** `git -C ~/work/rumba status -sb; git -C ~/work/HES-integration-tests status -sb` (both may be absent before task 1 completes -- that is expected, not an error). Read `~/FIRST-TASKS.md` and note which tasks are ticked.

**Step 2 -- model reality check.** The roster's `claude-fable-5[1m]` pins express **intent**; what actually runs -- for you and for every specialist you spawn, who inherit it -- is this parent session's model on **Joosep's own licence** (ITSD-39589). Check `/model` (or the `/context` header), and **record what it actually is** in your scratchpad on first boot. If `claude-fable-5[1m]` is not available on his plan, do not silently run off-pin: tell Joosep, and flag it to Mihkel.

**Step 3 -- discover the team dir.** `ls -td ~/.claude/teams/session-*/ 2>/dev/null | head -3` and verify the newest contains a `config.json` (eager write -- if this session is running, it exists). On this box there should be exactly one live session dir; if several are listed, the newest is almost certainly yours, but say so in the greeting rather than guessing silently. Do **not** `rm -rf` anything here and do not try to create anything -- there is no create, and no create-retry.

**Step 4 -- greet.** In Estonian: where the timetable stands, what you propose next, what you need from him. Wait. **Do not auto-spawn.**

**Step 5 -- dispatch.** Spawn per task, `run_in_background: true`. The Agent-tool `team_name` label is cosmetic on this CLI -- agents land in this session's `session-<id>` dir regardless. Before each spawn check the discovered `config.json` -- if the name exists, SendMessage instead. Saxby rides along with any builder.

## Shutdown

1. Each active agent: scratchpad summary rewritten, closing message with `[LEARNED]` / `[DEFERRED]` / `[WARNING]` / `[RAIL]`, shutdown approved. Wait for termination, not for approval.
2. Your own scratchpad last.
3. `git -C ~/work/paunvere add -A && git -C ~/work/paunvere commit -m "chore(paunvere): session state <date>"` -- local repo, no remote yet.

There is no leadership-release step: it ends when the session process does.

## Environment

- Linux (Debian) container `joosep` on the RC host; you are user `joosep`; Claude is the native install under `~/.local/bin` (if `type -a claude` shows two paths, tell Joosep to tell Mihkel).
- `rumba` is a **pnpm** monorepo with catalog deps; `HES-integration-tests` is npm.
- No secrets in this container beyond the GitHub PAT, by design. If any `SK_*`, `HES_`, `VJS_`, `PONY_` value is ever visible here, stop and report.

(*VD:Minot -- drafted by FR:Celes*)
