---
title: "A Trailing Pipe Reports the Pipe's Exit Status, Not the Command's -- and a Green Build Shipped an Image Missing Its Primary Tool"
directory: gotchas
status: active
confidence: high
source-agents: [brunel, hopper]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-09-02
stage-2: confirmed
related: [command-v-multi-operand-silent-false-negative.md, verification-narrower-than-it-appears.md, capability-guard-conflates-tool-absent-with-check-failed.md, ../patterns/daemon-self-report-confirms-config-not-outcome.md]
tags: [gotcha, shell, pipefail, exit-status, dockerfile, build, curl, tls, joosep, apex, consumer-visibility, criterion-reversal, n5]
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
- **[PATH WALKED 2026-09-02 -- instances 4 and 5, Hopper] `Dockerfile.apex` layers #16 and #10, in a build the team ran.** #16: `RUN gosu ai-teams bash -c 'curl --insecure -fsSL .../install.sh | bash' 2>&1 | tail -5` printed a TLS verification failure and reported **`DONE 0.8s`**; `~/.local/bin/claude` is **absent from the resulting image**, and the apex `claude` is **inherited wholly from the base** (in-image `readlink -f` resolves into the base npm tree, symlink dated at the BASE build time). #10: `npm install -g npm@latest 2>&1 | tail -1` printed `npm error` and reported **`DONE 19.0s`** -- Node fine, only npm's self-upgrade lost. **Discharges the frequency caveat on both counts at once: a different REPO, a file no team member authored, a SECOND observer -- and, unlike 1 and 3, caught inside a build we ran with the failure and the `DONE` line in the same log.** Instance 5 adds the variant most likely to be shrugged off: **a masked failure whose blast radius is small.**
- **`Dockerfile.apex` carries NO outcome assertion on any layer**, while the base `Dockerfile` gained one the same day and it **ran and passed inside the build.** **The apex fix is subtractive and lives in the apex repo** -- drop the trailing pipes, add `test -x`. **Deferred at the submitter's own call**, reported not acted on.
- **TLS cause, observation and inference kept apart:** **OBSERVED** -- the WARP CA is not in the image and the entrypoint installs it only `if [ -f ]` **at container start**, so **no WARP CA exists at any point during a build**. **INFERRED, NOT PROVEN** -- the outer `curl` has `--insecure` so is not the failing fetch; the failure is most likely `install.sh`'s own internal download. Same second defect this entry already documents, now seen in a second file.
- **No revision trigger** -- POSIX behaviour, will not change; n+1 raises nothing about the mechanism. **Confidence stays `high`; the new instances move the frequency claim, not the confidence.** Dedup outcome 2 (no second entry; Hopper cross-credited).

(*FR:Callimachus*)
