<#
.SYNOPSIS
Connect to the joosep container on the RC host.

.DESCRIPTION
Two modes, one file:

  Connect-Joosep            a plain bash shell inside the container
  Connect-Joosep -Session   attached to the running Claude session

Detaching from the session (Ctrl-b d) or simply closing the terminal leaves
Claude running inside the container -- that is the point of the session mode.
Reconnect with -Session and the conversation is where you left it.

Prerequisites (one-time -- see the package README):
  1. Cloudflare WARP, enrolled. 100.96.54.170 is reachable only over the WARP
     overlay. Diagnostic: warp-cli status
  2. The Windows OpenSSH client (built in; this script checks).
  3. An ed25519 keypair whose PUBLIC half has been added to the container.

.EXAMPLE
PS> Connect-Joosep

.EXAMPLE
PS> Connect-Joosep -Session

.NOTES
(*FR:Brunel*) 2026-08-28. Emits the same ssh invocation as rc-connect.ps1's
direct-SSH branch, so this stays a degenerate case of the fleet tool rather
than a divergent one. The fleet menu carries the same target as row "j".
#>
[CmdletBinding()]
param(
    # Land inside the Claude tmux session instead of a plain shell.
    [switch]$Session,

    # Override only if your key lives somewhere non-default.
    [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519_joosep"
)

$RemoteHost = '100.96.54.170'   # RC, over the Cloudflare WARP overlay
$Port       = 2231
$User       = 'joosep'
$Launcher   = 'joosep-session'  # baked into the container at /usr/local/bin

# ── Pre-flight: OpenSSH client ────────────────────────────────────────────────
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "  OpenSSH client not found." -ForegroundColor Red
    Write-Host "  Install: Settings > System > Optional features > Add > OpenSSH Client" -ForegroundColor Yellow
    Write-Host ""
    return
}

# ── Pre-flight: key present ───────────────────────────────────────────────────
# Checked here so a missing key gives an actionable message rather than an
# opaque 'Permission denied (publickey)' from the far end.
if (-not (Test-Path $KeyPath)) {
    Write-Host ""
    Write-Host "  SSH key not found at $KeyPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Generate one, then send the .pub line (safe to paste in chat/email):" -ForegroundColor Yellow
    Write-Host "    ssh-keygen -t ed25519 -f `"$KeyPath`" -C `"joosep@evr`"" -ForegroundColor Cyan
    Write-Host "    Get-Content `"$KeyPath.pub`"" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  The private key never leaves this machine." -ForegroundColor DarkGray
    Write-Host ""
    return
}

# ── Build the ssh invocation ──────────────────────────────────────────────────
# -o IdentitiesOnly=yes: without it, a Windows ssh-agent offers every loaded key
# before the right one and can trip the server's MaxAuthTries.
$env:TERM = 'xterm-256color'
$mode = if ($Session) { 'session' } else { 'shell' }
$Host.UI.RawUI.WindowTitle = "joosep ($mode)"

$sshArgs = @('-i', $KeyPath, '-p', "$Port", '-o', 'IdentitiesOnly=yes')

if ($Session) {
    # -t forces a pty: tmux will not attach without one.
    # The launcher runs as a REMOTE COMMAND, i.e. a non-interactive shell that
    # never sources .bashrc -- which is why the container's sshd_config sets
    # SetEnv PATH with ~/.local/bin first. If this mode ever reports
    # 'claude: command not found' while a bare shell works, that setting is the
    # thing to check, not .bashrc.
    $sshArgs += '-t'
}

$sshArgs += "$User@$RemoteHost"

if ($Session) { $sshArgs += $Launcher }

Write-Host ""
Write-Host "  Connecting to joosep ($mode)..." -ForegroundColor Cyan
Write-Host "  ssh $($sshArgs -join ' ')" -ForegroundColor DarkGray
Write-Host ""

& ssh @sshArgs

$exit = $LASTEXITCODE

# Mark the tab as disconnected, mirroring rc-connect's behaviour.
$Host.UI.RawUI.WindowTitle = "- joosep ($mode)"

# ── Post-flight hints for the two failures worth explaining ───────────────────
if ($exit -ne 0) {
    Write-Host ""
    if ($exit -eq 255) {
        Write-Host "  Connection failed (ssh exit 255). Most likely, in order:" -ForegroundColor Yellow
        Write-Host "    1. Cloudflare WARP is not connected  -> warp-cli status" -ForegroundColor DarkGray
        Write-Host "    2. The container is stopped          -> ask Mihkel" -ForegroundColor DarkGray
        Write-Host "    3. Your key is not installed yet     -> send the .pub line" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "  If you saw REMOTE HOST IDENTIFICATION HAS CHANGED: stop and ask." -ForegroundColor Red
        Write-Host "  The container's host keys are persistent, so that warning should" -ForegroundColor DarkGray
        Write-Host "  never appear after your first connection. Do not clear known_hosts." -ForegroundColor DarkGray
    } else {
        Write-Host "  Session ended with exit code $exit." -ForegroundColor DarkGray
    }
    Write-Host ""
}
