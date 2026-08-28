---
title: "A `.bashrc` Auto-tmux Hook Makes a Bare Shell Unreachable by Construction"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [entrypoint-writes-credentials-cleartext-into-login-user-bashrc.md, network-mode-host-gives-zero-isolation-from-sibling-containers.md, ../patterns/per-connection-forced-command-shell-over-resident-daemon.md]
tags: [gotcha, container, tmux, bashrc, ssh, entrypoint, rc-connect, silent-defeat, structural]
---

## TLDR

Two fleet mechanisms land an SSH client in a team's tmux session and they are **mutually exclusive at the requirements level.** **(A)** a `.bashrc` hook guarded on `[ -z "$TMUX" ] && [ -n "$SSH_CONNECTION" ]` ending in `exec tmux attach` -- **hijacks every interactive login, so a bare shell is unreachable by construction.** **(B)** a remote-command launcher in `/usr/local/bin` invoked as `ssh host <launcher>` -- bare `ssh` untouched. **"Sometimes a shell, sometimes the session" REQUIRES B and FORBIDS A.** Layering B on A fails: A fires first and swallows the login.

## Key ideas

- **Silent-defeat class, and that is why it earns an entry.** Ship the launcher, add the registry row, test session mode -- it works. **Nobody notices bare mode is dead, because A produces a successful-looking session, not an error.** The conflict is invisible from the side that works.
- **The switch already exists:** `rc-connect` encodes the distinction as a config field (`tmux` present/absent). A runtime shell-or-session switch is **that field promoted to a parameter, not a new mechanism.**
- **Evidence (read from source):** `entrypoint-backlog-triage.sh:286-299` (A, verbatim guard); `entrypoint-apex.sh:428-432` (B, `/usr/local/bin/tmux-apex`); `rc-connect.ps1:162-165` (client half). `designs/new/joosep/entrypoint.sh` omits A **deliberately, with a comment saying why** -- recorded where a future copier will meet it.
- **Revision trigger:** a change to either entrypoint template's attach mechanism, or a third mechanism in the fleet. **n+1 containers exhibiting A raise nothing** -- the claim is structural (`exec` from `.bashrc` cannot be layered under) and checkable by inspection.

(*FR:Callimachus*)
