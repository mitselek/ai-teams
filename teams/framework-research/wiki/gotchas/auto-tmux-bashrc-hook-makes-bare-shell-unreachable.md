---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: high
source-files:
  - designs/new/backlog-triage/container/entrypoint-backlog-triage.sh
  - designs/deployed/apex-research/container/entrypoint-apex.sh
  - designs/new/joosep/entrypoint.sh
source-commits: []
source-issues: []
related:
  - tmux-pane-labels-decoupled-from-personas.md
  - entrypoint-writes-credentials-cleartext-into-login-user-bashrc.md
  - ../patterns/per-connection-forced-command-shell-over-resident-daemon.md
  - ../patterns/tmux-pane-border-format-for-teams.md
---

# A `.bashrc` Auto-tmux Hook Makes a Bare Shell Unreachable by Construction

**Gotcha (team-wide, high confidence, structural -- read from source).** Two mechanisms exist in the FR fleet for landing an SSH client inside a team's tmux session, and **they are mutually exclusive at the requirements level.**

**(A) `.bashrc` auto-tmux hook.** Guard `if [ -z "$TMUX" ] && [ -n "$SSH_CONNECTION" ]`, then create-layout / start claude / `exec tmux attach`. Because it runs from `.bashrc` and ends in `exec`, it **hijacks every interactive SSH login. A bare shell becomes unreachable.**

**(B) remote-command launcher.** A script in `/usr/local/bin` invoked as `ssh host <launcher>`. Bare `ssh` is untouched.

> **Any requirement of the form "sometimes a shell, sometimes the session" REQUIRES B and FORBIDS A.**

Adding B on top of A does not work: **A fires first and swallows the login.**

## Why it earns an entry -- it is a silent-defeat class

A team can ship the launcher, add the registry row, test the session mode (it works), and **never notice the bare mode is dead** -- because A produces a *successful-looking session*, not an error. There is nothing to debug and nothing that fails; the capability is simply gone, and only someone who needed a plain shell would ever find out.

That is what separates this from an ordinary configuration conflict: **the conflict is invisible from the side that works.**

## The switch already exists

`rc-connect` encodes the distinction as a config field (`tmux` present/absent) on the client side. So **a runtime shell-or-session switch is that field promoted to a parameter, not a new mechanism** -- the design work is already done and only needs to be honoured on the container side by choosing B.

## Evidence

- `designs/new/backlog-triage/container/entrypoint-backlog-triage.sh:286-299` -- mechanism A, verbatim guard.
- `designs/deployed/apex-research/container/entrypoint-apex.sh:428-432` -- mechanism B, `/usr/local/bin/tmux-apex`.
- `~/bin/rc-connect.ps1:162-165` -- the client half that appends the tmux command to `$sshArgs`.
- Applied in `designs/new/joosep/entrypoint.sh`, which **omits A deliberately, with a comment saying why** -- the design decision is recorded at the point of the omission, which is where a future copier will meet it.

## Revision trigger

A change in either entrypoint template's attach mechanism, or a third mechanism entering the fleet. **n+1 containers exhibiting A do not raise this entry's confidence** -- the claim is structural (`exec` from `.bashrc` cannot be layered under) and is checkable by inspection.

(*FR:Brunel* submitted; *FR:Callimachus* filed)
