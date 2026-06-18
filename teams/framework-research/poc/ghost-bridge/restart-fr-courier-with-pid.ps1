# restart-fr-courier-with-pid.ps1 -- at-unpin (2.1.178+) courier restart bound to the live session.
# (*FR:Brunel*)
#
# WHY THIS EXISTS (WS3 #86, 2026-06-18): on 2.1.178+ FR's on-disk team dir is `session-<id>`,
# RANDOM PER SESSION (probe P1). The courier resolves its inboxes_dir ONCE at Config-load from
# `inboxes_dir:"auto"` -> so it must be RESTARTED at each FR session start, bound to THIS session's
# pid, or it tracks a stale (prior-session) team dir. Setting FR_COURIER_SESSION_PID makes the
# resolver pick the live `session-<id>` via the pid tiebreaker -- which ALSO disambiguates a
# multi-team host (the pid points at FR's dir among the others). Volta's startup.md (Step 2'+)
# calls this; it is the integration that makes the migration hold across session rotation.
#
# THE PID (read carefully): pass the CLAUDE SESSION's pid -- the one with a
# `~/.claude/sessions/<pid>.json` entry (the resolver keys discover_by_session_pid on it). NOT the
# PowerShell launcher's $PID, NOT this script's pid. Volta's Step 2' Discover already finds the live
# session; have it emit that pid and pass it here (single source of truth -- do not re-derive).
#
# RESTART MECHANISM (Hopper-verified 2026-06-18): the live FR courier is launched by the
# stop/start-fr-courier.ps1 SCRIPT PAIR, NOT the dormant `FrameworkResearch-Courier` Scheduled Task
# (which sits State=Ready/idle and is not the live launcher). So this wrapper uses the script pair.
#
# ENV INHERITANCE (gotcha): Start-Process (inside start-fr-courier.ps1) does NOT take a
# per-invocation env var -- the child python inherits THIS PowerShell session's env. So we set
# $env:FR_COURIER_SESSION_PID HERE, before calling start-fr-courier.ps1, and the daemon inherits it.
#
# PRE-2.1.178 NOTE: on 2.1.177 the courier stays on the EXPLICIT inboxes_dir path (no "auto"); this
# wrapper is for the at-unpin cutover onward, when the config is flipped to "auto". Calling it while
# the config is still explicit-path is harmless (the env var is simply ignored by the explicit
# branch) but pointless -- it's a 2.1.178+ step.
#
# Usage (from Volta's startup, after Step 2' Discover):
#   ./restart-fr-courier-with-pid.ps1 -SessionPid <claude-session-pid>
#   ./restart-fr-courier-with-pid.ps1 -SessionPid <pid> -Config <path>   # explicit config

# -SessionPid is OPTIONAL (the team-lead a/b choice, #11):
#   (a) SUPPLIED -> bind FR_COURIER_SESSION_PID -> resolver pid-tiebreaker picks FR's session-<id>
#       even on a MULTI-TEAM host (the robust, future-proof path -- needed once a 2nd team migrates).
#   (b) OMITTED -> bare "auto"+liveness. VALID WHILE FR IS THE SOLE MIGRATED 2.1.178+ TEAM on the host:
#       after this restart, Config-load globs the dirs and liveness narrows to the ONE live session-<id>
#       (FR's), whose slug matches its own dir. Rotation is still handled because we RESTART at each
#       session start (the courier re-resolves the current live session-<id> each time). No pid needed.
# Either way the rotation problem is solved by restart-at-session-start; the pid only adds multi-team
# disambiguation. Pass it when Step 2' can cleanly emit the Claude-session pid; omit it otherwise.
param(
    [int]$SessionPid = 0,
    # DEFAULTS to the "auto" config (fr-courier.config.auto.json), NOT the explicit default
    # fr-courier.config.json. LAUNCH-OVERRIDE (team-lead-approved 2026-06-18): the committed/local
    # default config stays EXPLICIT + always-safe on 2.1.177; the at-unpin Step 2.5 restart loads the
    # "auto" config via THIS path -- a config-FILE swap at launch, never an in-place edit. So "auto"
    # ONLY activates when THIS wrapper runs (the 2.1.178+ cutover), never on a between-session 2.1.177
    # restart (plain start-fr-courier.ps1 defaults to the explicit config). The courier stays UP
    # between sessions (mail flows). Rollback = stop calling this wrapper; the explicit default is
    # untouched. Both configs are LOCAL machine-only infra (gitignored), present on disk.
    [string]$Config = "$PSScriptRoot/fr-courier.config.auto.json"
)

$ErrorActionPreference = "Stop"

if ($SessionPid -gt 0) {
    # (a) Fail-closed pid check: a supplied pid MUST have a sessions/<pid>.json, else the resolver
    # can't derive its slug and would fall back to bare glob -> fail-fast on a multi-team host.
    # Surface it HERE rather than letting the courier crash at Config-load.
    $sessFile = Join-Path $HOME ".claude/sessions/$SessionPid.json"
    if (-not (Test-Path $sessFile)) {
        Write-Error "restart-fr-courier-with-pid: -SessionPid $SessionPid given but no ~/.claude/sessions/$SessionPid.json -- is it the live CLAUDE session pid? (NOT the launcher/script pid). Refusing to bind the courier to an unresolvable session. (Omit -SessionPid to use bare auto+liveness while FR is the sole migrated team.)"
    }
    $env:FR_COURIER_SESSION_PID = "$SessionPid"
    Write-Host "[restart-fr-courier-with-pid] (a) binding courier to session pid $SessionPid (sessions/$SessionPid.json present) -- multi-team-safe."
} else {
    # (b) No pid -> ensure no stale env leaks in -> bare auto+liveness resolves FR's sole live session-<id>.
    Remove-Item Env:\FR_COURIER_SESSION_PID -ErrorAction SilentlyContinue
    Write-Host "[restart-fr-courier-with-pid] (b) no -SessionPid -- bare auto+liveness (valid while FR is the SOLE migrated 2.1.178+ team). Restart re-resolves the live session-<id>."
}

# PRE-FLIGHT DRY-RUN (honors the V4 cold-start window DEFENSIVELY, team-lead 2026-06-18): before
# touching the RUNNING courier, run the SAME resolution it will do at Config-load -- with the env/pid
# set above -- via the read-only --resolve-team-dir shim. If it can't resolve (e.g. restart placed
# too early, before sessions/<pid>.json exists -> liveness [] -> fail-fast), ABORT here and leave the
# live courier UNTOUCHED. This makes the wrapper self-protecting regardless of where Volta's startup
# places it -- a mis-timed restart can't take FR comms down; it just refuses and tells you to retry
# later. Only meaningful when inboxes_dir:"auto"; on the 2.1.177 explicit-path config it's skipped.
$courier  = Join-Path $PSScriptRoot "stationmaster-courier.py"
$inboxCfg = (Get-Content $Config -Raw | ConvertFrom-Json).inboxes_dir
if ($inboxCfg -eq "auto") {
    $resolved = & python $courier --resolve-team-dir 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "restart-fr-courier-with-pid: PRE-FLIGHT FAILED -- --resolve-team-dir could not resolve the live team dir (exit $LASTEXITCODE): $resolved`nNOT restarting (live courier left running). Likely the V4 cold-start window: sessions/<pid>.json not written yet. Place the restart LATER in startup (post-interactive-ready) or supply -SessionPid, then retry."
    }
    Write-Host "[restart-fr-courier-with-pid] pre-flight OK: would resolve to $resolved -- safe to restart."
} else {
    Write-Host "[restart-fr-courier-with-pid] config inboxes_dir is explicit ('$inboxCfg'), not 'auto' -- pre-flight resolve skipped (explicit path needs no discovery)."
}

# Stop (Windows-correct: hard-kill + external --drain-once + lock release) then start fresh on the
# now-current config. Both scripts sit beside this one. The child python inherits the env set above.
& "$PSScriptRoot/stop-fr-courier.ps1"
& "$PSScriptRoot/start-fr-courier.ps1" -Config $Config

$mode = if ($SessionPid -gt 0) { "pid-bound ($SessionPid)" } else { "bare auto+liveness" }
Write-Host "[restart-fr-courier-with-pid] courier restarted ($mode). Verify the log shows inboxes_dir resolved to ~/.claude/teams/session-<id>/inboxes (the live session's dir)."
