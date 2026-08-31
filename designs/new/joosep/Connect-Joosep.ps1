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

    # Leave UNSET for ssh's own default identity lookup (~/.ssh/id_ed25519 and
    # friends, plus any key held by the agent). Set this only if your key lives
    # at a genuinely non-default path.
    #
    # CORRECTED 2026-08-31: this used to default to ~/.ssh/id_ed25519_joosep and
    # the pre-flight below REFUSED TO CONNECT when that file was absent. Joosep's
    # key is at the default name, so on his first run the script would have
    # stopped and told him to generate a NEW keypair -- which the container does
    # not know, so following the advice would have moved him further from working,
    # not closer. Guessing a filename is not a prerequisite check; ssh already
    # knows how to find a default identity, and it proved it at 9d.5.
    [string]$KeyPath
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

# ── Pre-flight: key ───────────────────────────────────────────────────────────
# Two cases, and only ONE of them is an error:
#
#   * You passed -KeyPath and the file is not there  -> hard stop. You named a
#     specific path; if it does not exist that is a mistake worth surfacing
#     rather than silently falling back to a different key.
#   * You passed nothing                             -> say nothing, connect.
#     ssh resolves ~/.ssh/id_ed25519 and friends by itself, and may also get the
#     key from the agent, where no file test of ours would find it.
#
# The old version tested a GUESSED filename and refused on failure, which turns
# a working default into a hard block. A pre-flight may only fail on something
# it actually knows.
$explicitKey = $PSBoundParameters.ContainsKey('KeyPath')

if ($explicitKey -and -not (Test-Path $KeyPath)) {
    Write-Host ""
    Write-Host "  -KeyPath was given as $KeyPath but no file is there." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Either fix the path, or omit -KeyPath entirely and let ssh find" -ForegroundColor Yellow
    Write-Host "  your default identity (this is what normally works)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  If you have no key at all yet, generate one and send the .pub" -ForegroundColor DarkGray
    Write-Host "  line -- it is safe to paste into chat or email:" -ForegroundColor DarkGray
    Write-Host "    ssh-keygen -t ed25519 -C `"joosep@evr`"" -ForegroundColor Cyan
    Write-Host "    Get-Content `"`$HOME\.ssh\id_ed25519.pub`"" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  The private key never leaves this machine." -ForegroundColor DarkGray
    Write-Host ""
    return
}

# ── Build the ssh invocation ──────────────────────────────────────────────────
# -i and IdentitiesOnly travel TOGETHER and only when a key was named.
#
# IdentitiesOnly=yes exists to stop a Windows ssh-agent offering every loaded key
# ahead of the right one and tripping the server's MaxAuthTries -- which is a
# real problem, but only when we already know which key is right. Setting it
# WITHOUT -i would do the opposite of the intent: it would refuse the agent's
# keys while naming no file to use instead. So when no key is named, pass
# neither, and let ssh's own resolution do the job it proved it can do.
$env:TERM = 'xterm-256color'
$mode = if ($Session) { 'session' } else { 'shell' }
$Host.UI.RawUI.WindowTitle = "joosep ($mode)"

$sshArgs = @('-p', "$Port")
if ($explicitKey) {
    $sshArgs += @('-i', $KeyPath, '-o', 'IdentitiesOnly=yes')
}

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
