' run-courier-hidden.vbs
'
' Launches fr-courier-supervisor.sh under bash with no visible console window.
' Used as the Task Scheduler action (task FrameworkResearch-Courier) so the
' user-context task does not show a lingering bash window on screen.
' WshShell.Run with style 0 = hidden, wait = True so wscript stays alive for
' the lifetime of the supervisor -- which lets Task Scheduler's
' MultipleInstances IgnoreNew see the running instance and not spawn
' duplicates on subsequent triggers (logon / power-resume).
'
' Mirrors the proven apex run-tunnel-hidden.vbs analog.

Option Explicit
Dim WshShell
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "C:\Users\mihkel.putrinsh\AppData\Local\Programs\Git\usr\bin\bash.exe -l -c ""exec '/c/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams/teams/framework-research/poc/ghost-bridge/fr-courier-supervisor.sh'""", 0, True
