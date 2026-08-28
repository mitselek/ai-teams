---
title: "A Trailing Pipe Reports the Pipe's Exit Status, Not the Command's -- and a Green Build Shipped an Image Missing Its Primary Tool"
directory: gotchas
status: active
confidence: high
source-agents: [brunel, hopper]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [command-v-multi-operand-silent-false-negative.md, verification-narrower-than-it-appears.md, capability-guard-conflates-tool-absent-with-check-failed.md, ../patterns/daemon-self-report-confirms-config-not-outcome.md]
tags: [gotcha, shell, pipefail, exit-status, dockerfile, build, curl, tls, joosep, consumer-visibility, criterion-reversal]
---

## TLDR

`cmd | tail` reports **`tail`'s** exit status, and `tail` almost always succeeds -- so any `RUN`, `rc=$?`, or CI step ending in a pipe **reports success for a failed command.** Fix: `cmd; rc=$?` **before** any pipe, or `set -o pipefail`. **Better -- assert the outcome:** `RUN test -x ~/.local/bin/claude && claude --version`.

## Key ideas

- **THE DURABLE HALF -- this was DECLINED three hours earlier and the decline was reversed by a third instance.** The rule was *silent-wrong earns an entry, visible-wrong is a shell fact*; instance 1 looked visible-wrong (`rc=0` printed **directly beneath** `curl: (28)`). **The reversal shows the criterion was applied to the wrong consumer.** → ***Visibility is relative to whoever CONSUMES the signal, not to whoever reads the log.***
- **Instance 1 (bridge probe):** consumer is a **human reading a log** with both lines adjacent -- visible-wrong, cost a misleading annotation.
- **Instance 3 (Dockerfile):** `RUN curl --insecure ... | bash 2>&1 | tail -5` **printed a TLS cert error and reported `DONE 0.6s`.** Consumer is the **build system, which reads only the exit status** -- for it the failure is **completely invisible.** Cost: **a green build that shipped an image with no `claude` in it**, the container's primary tool, with nothing reporting a problem. **Same mechanism, classification flips entirely on who is reading.**
- **Second, compounding defect in the same line: `--insecure` applies to the OUTER transfer only** -- it does not reach the `curl` calls *inside* the script you piped into `bash`. The inner fetch hits TLS interception with default verification and fails. **The two defects mask each other: the inner failure is real, and the trailing pipe hides that it happened.** Either alone would likely have been caught.
- **Remedy in strength order:** (1) **assert the outcome, not the status** (`test -x <path> && <tool> --version`) -- catches it regardless of how the status was mangled *and* regardless of which defect caused it; `daemon-self-report-confirms-config-not-outcome` at the build layer, since **a layer's status is not the image's contents**; (2) `set -o pipefail` **at both levels** when a script is piped into a shell; (3) drop the trailing pipe -- `| tail` buys a shorter log and costs the exit status, a bad trade in any gating context.
- **Correlation flagged:** two evidenced instances, one author, one day. Mechanism is unaffected (a shell fact, checkable by inspection) but the **frequency claim rests on one vantage**; path = a second author or repo.
- **No revision trigger** -- POSIX behaviour, will not change; n+1 raises nothing about the mechanism.

(*FR:Callimachus*)
