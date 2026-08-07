# operator tooling

Mihkel's Mac operator tooling. stdlib-only `python3` (3.9-compatible, launchd
runs `/usr/bin/python3`), loud failures, no silent data loss, atomic-ish
appends, env overrides for testing. Canonical copies live here; the copies the
launchd agents actually run live in `~/.local/bin` (launchd has no TCC grant
for `~/Documents`).

- **`smc`** — stationmaster message centre (inbox/read/ack/send/log/teams/check).
  See `boxes-and-access.md` for the mail story.
- **Claude usage-limit recorder** — `usage-snapshot` + `usage-log`, below.

---

## Claude usage-limit recorder

Scheduled snapshotter of the same rate-limit data the Claude Code `/usage`
command shows, plus a viewer. Personal monitoring of Mihkel's OWN account via
the same OAuth token Claude Code already uses.

### What it does

Every 30 minutes a launchd agent runs `usage-snapshot --quiet`, which fetches
the current usage/rate-limit state and appends it to two files under
`~/.claude-usage/`:

- **`usage.jsonl`** — one JSON object per run (the machine log):
  `{ts_utc, ok, limits:[{kind,group,percent,severity,resets_at,model}],
  five_hour_pct, seven_day_pct, subscription, error?}`. A failed run is a
  visible `ok:false` row (with `error`), never a silent gap — so you can tell
  "fetch failed" apart from "the scheduler never ran".
- **`usage.csv`** — one row per limit per run
  (`ts_utc,kind,model,percent,resets_at`), easy to plot/grep.

`limits[]` is recorded **generically** — whatever `kind`/`group`/`scope.model`
the endpoint returns. The per-model scope name changes over time (Fable today,
could be Opus/Sonnet); nothing hardcodes a model name.

### The endpoint (undocumented)

`GET https://api.anthropic.com/api/oauth/usage`, headers `Authorization: Bearer
<token>`, `anthropic-beta: oauth-2025-04-20`, `User-Agent: claude-cli/...`.
This is an **UNDOCUMENTED** endpoint used internally by the Claude Code CLI; its
response shape may change between CLI versions. Treat shape drift as expected —
the parser tolerates missing/null fields and fails soft rather than crashing.

### Token & expiry behaviour

The OAuth access token is read **fresh from the macOS login keychain every run**
(item `Claude Code-credentials`, field `.claudeAiOauth.accessToken`) — never
cached in the script or config. Claude Code refreshes this token in the keychain
during normal use.

If the token is stale the endpoint returns **401**. This tool does **not** do
OAuth refresh itself (out of scope). A 401:
- in `--quiet` (scheduled) mode → soft-fail, exit 0, an `ok:false` row + a line
  in `~/.claude-usage/snapshot.err`;
- in interactive mode → loud, nonzero exit.

A stale token **self-heals** the next time Mihkel uses Claude Code (the CLI
refreshes the keychain), so the next snapshot succeeds again.

### launchd vs cron (keychain / TCC)

The scheduler is **launchd** (`com.mitselek.claude-usage`), consistent with the
other operator agents. It is loaded into the `gui/<uid>` domain so it runs
inside the logged-in GUI session and CAN reach the login keychain.

**Verified live (2026-08-07):** kickstarting the agent produced a fresh
`ok:true` data row written entirely from the scheduled context — the
keychain-from-launchd proof. Two caveats that were found the hard way:

1. The agent MUST run the `~/.local/bin/usage-snapshot` copy, **not** the
   `~/Documents/.../operator/usage-snapshot` repo copy — launchd has no TCC
   grant for `~/Documents` and fails with `Operation not permitted` before the
   script even starts. (This is why `smc`'s agent also runs `~/.local/bin/smc`.)
2. `crontab` is documented in `crontab-line.txt` as a fallback only. On modern
   macOS the classic cron daemon runs outside the GUI session and commonly
   cannot unlock the login keychain (or triggers an unanswerable TCC prompt), so
   keychain access under cron is **not guaranteed**. Prefer launchd.

### Install

```sh
# from designs/deployed/po-team/operator/
cp usage-snapshot usage-log ~/.local/bin/ && chmod +x ~/.local/bin/usage-{snapshot,log}
cp com.mitselek.claude-usage.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.mitselek.claude-usage.plist
launchctl kickstart -k gui/$(id -u)/com.mitselek.claude-usage   # prove it now
usage-log                                                        # see the row
```

To update after editing: re-copy to `~/.local/bin`, then
`launchctl bootout gui/$(id -u)/com.mitselek.claude-usage` and bootstrap again.

### Viewer

```
usage-log               pretty-print the latest snapshot (session/weekly/
                        per-model bars like /usage, reset times in local tz)
usage-log history [N]   last N snapshots as a compact table (ts + 5h% + 7d%)
usage-log csv           print the path to the flat csv
```

`usage-log` handles an empty/missing log gracefully, and if the latest snapshot
is an `ok:false` failure it says so and falls back to the last good snapshot.

### Modes & env overrides

`usage-snapshot` (interactive) is loud and exits nonzero on failure;
`usage-snapshot --quiet` (scheduled) soft-fails, exits 0, and records the
failure as an `ok:false` row. Testing overrides: `USAGE_TOKEN` (skip keychain),
`USAGE_ENDPOINT` (point at a fake), `USAGE_STATE_DIR` (relocate the log dir).

### Tests

`./test-usage.sh` runs both scripts against a local fake HTTP endpoint (canned
JSON incl. a 401 and a malformed case). It proves: append on success, soft-fail
+ `ok:false` on 401 `--quiet`, loud nonzero on 401 interactive, generic
`limits[]` parsing (the fixture renames Fable→Opus and it still records), csv +
jsonl both written, and the viewer renders. Run it green:

```sh
./test-usage.sh    # -> ALL GREEN
```

### Files

| file | role |
|------|------|
| `usage-snapshot` | one run = fetch + append one record (jsonl + csv) |
| `usage-log` | viewer (latest / history / csv) |
| `com.mitselek.claude-usage.plist` | launchd agent, every 30 min, `--quiet` |
| `crontab-line.txt` | cron equivalent + why launchd is preferred |
| `test-usage.sh` | fake-endpoint test harness |
| `~/.claude-usage/usage.jsonl` | machine log (one row per run) |
| `~/.claude-usage/usage.csv` | flat log (one row per limit) |
| `~/.claude-usage/snapshot.err` | scheduled-run stderr / failure reasons |
