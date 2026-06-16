# register-courier-task.ps1
# Registers a Task Scheduler task that keeps the FR courier daemon alive 24/7.
# Runs in current-user context (no admin needed). Two triggers: at logon, on power-resume.
# Analog of apex .claude/bin/register-tunnel-task.ps1 (proven ApexResearch-DBTunnels pattern).

$ErrorActionPreference = "Stop"

$TaskName    = "FrameworkResearch-Courier"
$WScriptExe  = "C:\Windows\System32\wscript.exe"
$VbsLauncher = "C:\Users\mihkel.putrinsh\Documents\github\mitselek-ai-teams\teams\framework-research\poc\ghost-bridge\run-courier-hidden.vbs"

# wscript.exe + run-courier-hidden.vbs starts the wrapper bash with style=hidden
# so Windows Terminal / conhost never opens a window. //B = batch mode (no
# UI dialogs), //Nologo suppresses the wscript banner. The VBS uses
# WshShell.Run wait=True so the wscript process stays alive for the bash
# supervisor's lifetime -- Task Scheduler's MultipleInstances IgnoreNew can
# then see the running instance and skip duplicate spawns.
$action = New-ScheduledTaskAction -Execute $WScriptExe -Argument "//B //Nologo `"$VbsLauncher`""

$logonTrigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

# Power-resume trigger via raw event subscription (Power-Troubleshooter EventID 1).
# Built via CIM because New-ScheduledTaskTrigger has no event-subscription parameter.
$cimClass = Get-CimClass -ClassName MSFT_TaskEventTrigger -Namespace Root/Microsoft/Windows/TaskScheduler
$resumeTrigger = $cimClass | New-CimInstance -ClientOnly
$resumeTrigger.Enabled = $true
$resumeTrigger.Subscription = '<QueryList><Query Id="0" Path="System"><Select Path="System">*[System[Provider[@Name=''Microsoft-Windows-Power-Troubleshooter''] and EventID=1]]</Select></Query></QueryList>'

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit (New-TimeSpan -Days 0)

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask `
    -TaskName    $TaskName `
    -Description "FR courier daemon (hub-and-spoke, hub sm@10.100.136.162:2222) kept alive 24/7 via supervisor + Task Scheduler, user-context only (no admin). Mirrors the ApexResearch-DBTunnels pattern." `
    -Action      $action `
    -Trigger     @($logonTrigger, $resumeTrigger) `
    -Settings    $settings `
    -Principal   $principal `
    -Force | Out-Null

Get-ScheduledTask -TaskName $TaskName | Format-List TaskName, State, Description
Get-ScheduledTask -TaskName $TaskName | Select-Object -ExpandProperty Triggers
