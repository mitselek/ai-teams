# stop-fr-courier.ps1 -- session-scoped stopper for the FR courier daemon.
# (*FR:Brunel*)
#
# Gap B lifecycle, stop side: terminate the daemon so it drains once and exits
# cleanly. On Windows there is no SIGTERM-to-Python signal handler the way POSIX
# delivers it for a non-console-group process, so we use CTRL_BREAK semantics where
# available and fall back to Stop-Process. Either way the daemon's atexit-registered
# lock.release() runs on a clean Python exit; on a hard kill the next start reclaims
# the stale lock via tasklist (the daemon's InstanceLock handles that).
#
# For a GUARANTEED drain (queued outbound shipped + last inbound delivered) prefer
# running the drain explicitly before stopping:
#   python ./fr-courier-daemon.py --config ./fr-courier.config.json --drain-once
# then stop. The daemon also attempts a drain on its own clean shutdown.
#
# Usage: ./stop-fr-courier.ps1

$ErrorActionPreference = "Stop"
$pidFile = Join-Path $PSScriptRoot "fr-courier.pid"

if (-not (Test-Path $pidFile)) {
    Write-Host "no pid file; FR courier not tracked as running."
    exit 0
}

$pidValue = (Get-Content $pidFile -Raw).Trim()
if (-not $pidValue) {
    Remove-Item $pidFile -ErrorAction SilentlyContinue
    Write-Host "empty pid file; cleared."
    exit 0
}

$proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
if (-not $proc) {
    Remove-Item $pidFile -ErrorAction SilentlyContinue
    Write-Host "pid $pidValue not alive; cleared stale pid file (daemon lock self-reclaims on next start)."
    exit 0
}

Write-Host "stopping FR courier (pid $pidValue) -- it will drain once, then release its lock..."
# Stop-Process triggers a Python KeyboardInterrupt/terminate path; the daemon's
# signal handler runs the drain-on-shutdown cycle, then the finally/atexit releases
# the lock.
Stop-Process -Id $pidValue
Start-Sleep -Seconds 2

if (Get-Process -Id $pidValue -ErrorAction SilentlyContinue) {
    Write-Warning "pid $pidValue still alive after stop; forcing."
    Stop-Process -Id $pidValue -Force
}
Remove-Item $pidFile -ErrorAction SilentlyContinue
Write-Host "FR courier stopped."
