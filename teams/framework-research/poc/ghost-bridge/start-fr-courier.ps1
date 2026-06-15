# start-fr-courier.ps1 -- session-scoped launcher for the FR courier daemon.
# (*FR:Brunel*)
#
# Gap B lifecycle, start side: launch fr-courier-daemon.py in the background, bound
# to THIS session. The daemon does an immediate cycle on startup, then polls every
# poll_interval_s. Stop it with stop-fr-courier.ps1 (sends CTRL/terminate -> the
# daemon drains once, then releases its lock and exits -- no detached zombie).
#
# This is the Windows dev box (FR's only host; dev-only by policy). The daemon's
# InstanceLock already enforces single-instance + reclaims a stale lock via tasklist,
# so a crashed prior run does not block a restart.
#
# Usage:
#   ./start-fr-courier.ps1                  # uses fr-courier.config.json beside this script
#   ./start-fr-courier.ps1 -Config path     # explicit config

param(
    [string]$Config = "$PSScriptRoot/fr-courier.config.json"
)

$ErrorActionPreference = "Stop"
$daemon  = Join-Path $PSScriptRoot "fr-courier-daemon.py"
$pidFile = Join-Path $PSScriptRoot "fr-courier.pid"
$logFile = Join-Path $PSScriptRoot "fr-courier.log"

if (-not (Test-Path $Config)) {
    Write-Error "config not found: $Config (copy fr-courier.config.example.json -> fr-courier.config.json and set ssh_target)"
}

# Refuse to double-start in THIS session: if the pid file points at a live process, stop.
if (Test-Path $pidFile) {
    $existing = (Get-Content $pidFile -Raw).Trim()
    if ($existing -and (Get-Process -Id $existing -ErrorAction SilentlyContinue)) {
        Write-Error "FR courier already running (pid $existing). Stop it first with stop-fr-courier.ps1."
    }
    # stale pid file -> the daemon's own lock will also reclaim; clear the convenience file.
    Remove-Item $pidFile -ErrorAction SilentlyContinue
}

# Launch detached-from-console but tracked by pid file. Append both streams to the log.
$proc = Start-Process -FilePath "python" `
    -ArgumentList @($daemon, "--config", $Config) `
    -RedirectStandardOutput $logFile `
    -RedirectStandardError "$logFile.err" `
    -NoNewWindow -PassThru

Set-Content -Path $pidFile -Value $proc.Id
Write-Host "FR courier started (pid $($proc.Id)). Log: $logFile  Stop: ./stop-fr-courier.ps1"
