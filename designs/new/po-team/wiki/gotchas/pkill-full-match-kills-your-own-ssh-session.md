# pkill -f over ssh can kill your own ssh session

`ssh box 'pkill -f "claude"'` matches the remote shell's *own* command line (it
contains the word "claude") — pkill kills the shell running it, the connection drops
with exit 255, and any commands chained after the pkill never run.

**Do instead:** self-match-proof patterns (`pkill -f "[c]laude"` — the regex matches
`claude` but the argv string `[c]laude` doesn't match itself), or collect PIDs first
and `kill` by number.

Instance: mvox box sweep, 2026-07-15 — the sweep killed the claude processes and
itself; the dev-server kills silently never executed and had to be re-run by PID.
