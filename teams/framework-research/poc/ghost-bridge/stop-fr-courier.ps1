# stop-fr-courier.ps1 -- session-scoped stopper for the FR courier daemon.
# (*FR:Brunel*)
#
# WHAT THIS ACTUALLY DOES (verified empirically by Hopper, 2026-06-15):
#   On Windows, Stop-Process == TerminateProcess == a HARD KILL. The Python daemon
#   does NOT receive SIGTERM/SIGINT, so its drain-on-shutdown cycle does NOT run and
#   its atexit/finally lock.release() does NOT fire. (An earlier version of this
#   header claimed CTRL_BREAK semantics + a clean signal-driven drain on stop -- that
#   was aspirational, NOT implemented. Corrected.)
#
#   No data is lost by the hard kill, because the daemon journals to its spool BEFORE
#   depositing (spool-durability), so anything not yet deposited survives the kill.
#   But the kill alone does NOT ship queued outbound. So this script composes the
#   drain explicitly AFTER the kill:
#
#     1. Stop-Process the daemon (hard kill) and wait for it to exit.
#     2. Run `--drain-once`: with the daemon down, the lock is free; --drain-once
#        reclaims any stale lock, runs ONE full cycle (consume+deposit outbound,
#        collect+inject+ack inbound), then exits NORMALLY -- a normal exit DOES fire
#        atexit, so the lock IS released cleanly at the end of --drain-once.
#     3. Verify the drain shipped the spool (look for "deposited N/N" / empty spool).
#
#   This is portable (works on Linux too -- it does not depend on any Windows signal
#   behavior) and honest: the drain is a separate, observable step, not a claim about
#   what the kill does.
#
# Usage: ./stop-fr-courier.ps1

$ErrorActionPreference = "Stop"
$pidFile  = Join-Path $PSScriptRoot "fr-courier.pid"
$daemon   = Join-Path $PSScriptRoot "fr-courier-daemon.py"
$config   = Join-Path $PSScriptRoot "fr-courier.config.json"
$lockFile = Join-Path $HOME ".stationmaster/framework-research/courier.lock"

# --- Step 1: stop the running daemon (hard kill) -----------------------------------
if (Test-Path $pidFile) {
    $pidValue = (Get-Content $pidFile -Raw).Trim()
    if ($pidValue) {
        $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "stopping FR courier (pid $pidValue) -- HARD KILL (no in-process drain on Windows; drain runs in step 2)..."
            Stop-Process -Id $pidValue
            # Wait for actual exit before draining -- --drain-once must not race a
            # still-alive daemon for the single-instance lock.
            for ($i = 0; $i -lt 20; $i++) {
                if (-not (Get-Process -Id $pidValue -ErrorAction SilentlyContinue)) { break }
                Start-Sleep -Milliseconds 250
            }
            if (Get-Process -Id $pidValue -ErrorAction SilentlyContinue) {
                Write-Warning "pid $pidValue still alive; forcing."
                Stop-Process -Id $pidValue -Force
                Start-Sleep -Seconds 1
            }
            Write-Host "daemon stopped."
        } else {
            Write-Host "pid $pidValue not alive; proceeding to drain (will reclaim any stale lock)."
        }
    }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
} else {
    Write-Host "no pid file; daemon not tracked as running. Running a final drain anyway (safe no-op if nothing queued)."
}

# --- Step 2: explicit drain (the daemon is now down -> lock is free) ----------------
# --drain-once reclaims a stale lock, runs one full cycle, and exits NORMALLY (so
# atexit releases the lock cleanly). This is the step that actually ships queued
# outbound + collects/acks last inbound.
Write-Host "draining (one final cycle): python fr-courier-daemon.py --config <cfg> --drain-once ..."
& python $daemon --config $config --drain-once
$drainRc = $LASTEXITCODE

# --- Step 3: verify -----------------------------------------------------------------
$spoolDir = Join-Path $HOME ".stationmaster/framework-research/spool"
$spoolFiles = @()
if (Test-Path $spoolDir) { $spoolFiles = @(Get-ChildItem -Path $spoolDir -Filter *.json -ErrorAction SilentlyContinue) }

if ($drainRc -ne 0) {
    Write-Warning "drain exited rc=$drainRc -- check fr-courier.log.err. Spool may retain entries (e.g. transport down or E_NOGRANT)."
} elseif ($spoolFiles.Count -gt 0) {
    Write-Warning "drain ran (rc=0) but spool still has $($spoolFiles.Count) file(s) -- retained (e.g. rejected/awaiting-grant or hub unreachable). Inspect: $spoolDir"
} else {
    Write-Host "drain clean: spool empty (all queued outbound shipped)."
}

# Lock should be released by --drain-once's normal exit (atexit). Confirm.
if (Test-Path $lockFile) {
    Write-Warning "courier.lock still present after drain ($lockFile) -- unexpected; next start will self-reclaim via tasklist."
} else {
    Write-Host "lock released cleanly."
}

Write-Host "FR courier stopped + drained. (Check fr-courier.log.err for the final-cycle 'deposited N/N' lines.)"
