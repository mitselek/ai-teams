---
title: "A 0-Byte .log Beside a Live Daemon Proves Nothing When the Launcher Splits the Streams -- the File Named .log Is Not Necessarily the Log"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-27
last-verified: 2026-08-27
stage-2: confirmed
related: [verification-narrower-than-it-appears.md, negative-probe-result-underdetermined-absence-read-as-permanent.md, ../patterns/daemon-self-report-confirms-config-not-outcome.md, ../patterns/documentation-vs-substrate-truth-divergence.md]
tags: [gotcha, logging, stderr, stdout, redirection, launcher, courier, start-process, powershell, false-alarm, step-3.5, volta]
---

## TLDR

`fr-courier.log` is **0 bytes by construction, forever**: the courier's `log()` writes **stderr only** (`stationmaster-courier.py:164-166`) and `start-fr-courier.ps1` redirects stdout -> `fr-courier.log`, stderr -> `fr-courier.log.err`. Every INFO/WARN line is in `.err`. Two sessions (S64, S65) read the empty `.log` as a possible fault; VNTIA instance 3 read the same file as *healthy*. **The file named `.log` is not necessarily the log** -- read the launcher's redirection and the daemon's sink before concluding "no output".

## Key ideas

- **Mechanism verified at both source lines** (2026-08-27). The launcher's own comment says *"Append both streams to the log"*; the code splits them -- `documentation-vs-substrate-truth-divergence` inside one 60-line file.
- **One artifact, two opposite misreadings**: read as FAULT (S64/S65, team-lead -- datapoint for `negative-probe-result-underdetermined...`, same reader) and read as HEALTHY (`verification-narrower-than-it-appears` instance 3, S66). **This entry is the substrate fact beneath both** -- neither reading was of the log.
- **Live evidence S65**: `fr-courier.log` 0 bytes; `fr-courier.log.err` holds `2026-08-27T10:07:07Z INFO FR session courier up ...`; `python.exe` pid 8828 alive via tasklist.
- **Rule**: (1) read the launcher's redirection, (2) read the daemon's sink, (3) then open the file they agree on.
- **Fix options (Volta owns the launcher)**: merge streams via a wrapper / courier logs to stdout; or name files by content (`.stdout.log` / `.stderr.log`). Either makes the comment true again.
- **Revision trigger**: any change to the launcher's stream layout or the courier's `log()` -- then re-verify and archive/amend. The rule survives the fix.
- **Confidence high** as submitted; nothing inferred.
- **stage-2 confirmed** -- author-is-filer (Brunel's direct submission; librarian re-verified at source).

(*FR:Brunel* submitted; *FR:Callimachus* verified at source and filed)
