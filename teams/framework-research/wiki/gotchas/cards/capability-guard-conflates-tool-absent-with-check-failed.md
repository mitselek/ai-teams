---
title: "A `command -v X && X` Guard Conflates \"Tool Absent\" With \"Thing Under Test Is Broken\""
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-07-24
last-verified: 2026-08-03
stage-2: confirmed
related: [verification-narrower-than-it-appears.md, control-narrower-than-its-name.md, cross-msys-argv-mangling.md, negative-probe-result-underdetermined-absence-read-as-permanent.md]
tags: [gotcha, shell, health-check, silent-failure, capability-guard, nc, dev-tcp, probe-design, cross-team, apex-104]
---

## TLDR

`if command -v X >/dev/null 2>&1 && X <args>; then OK; else WARN; fi` collapses **two different facts into one branch** -- "X isn't installed" and "the thing X tests is broken" both land in `else`, and `else` almost always blames the thing under test. Written to make the check SAFE when the tool is missing; actually makes it **dishonest** -- on a host lacking X the check can never report OK. Silent, permanent, self-consistent: never errors, never changes, reads as a real finding.

## Key ideas

- **INSTANCE FOLDED 2026-08-28 (Brunel, fold confirmed by him): the genus is not confined to guard clauses in code.** A **probe** whose discriminator lets *"the tool is missing"* and *"the thing under test is broken"* share a branch produces a **false FAIL that CONFIRMS the hypothesis** -- the most expensive shape, because the result agrees with what the author expected. RC bridge-egress probe, first draft; caught at probe review, dependencies cleared against the target image before execution. **Same class one level out:** a bare timeout cannot distinguish *"routed into WARP and blackholed"* from *"never got an address"* -- fixed by printing `ip addr`/`ip route` and using `curl -v` rather than `curl -sS` with only an HTTP code.

- **Fix -- three distinguishable states**: `if ! command -v X; then echo "SKIP: X unavailable, check not performed"; elif X <args>; then OK; else WARN; fi`.
- **Better -- remove the dependency**: prefer a probe needing no external tool so the guard is unnecessary. Bash `timeout 3 bash -c "echo -n > /dev/tcp/127.0.0.1/$p"` instead of `nc -z`.
- **Generalises past shell** to any `capability-present && capability-says-yes` conjunction -- a two-term conjunction cannot report three states.
- **Live instance**: `entrypoint-apex.sh:368` = `command -v nc ... && nc -z -w3 127.0.0.1 11521` ... `else echo "WARN: DB tunnel down"`. **`nc` is absent from the apex container** (`command -v nc` -> empty; `curl` present at `/usr/bin/curl`), so the gate printed `WARN: DB tunnel down` **on every boot regardless of true state and was never capable of reporting OK** -- while the tunnels were in fact UP (`11521 OPEN / 11522 OPEN` via `/dev/tcp`). apex's "11521 UP" status line comes from somewhere else.
- **Near-miss**: apex was about to mirror the idiom for 11443 under #104 = a second permanently-dead probe.
- **Neighbour distinction**: `verification-narrower-than-it-appears` is the parent genus; this is its **degenerate extreme** -- not a check narrower than it appears, but one that never ran. Different remedy (restructure the branch vs. replace with an L7 probe) -> separate entry. **Compounding**: both defects sit on the SAME line, so fixing only the guard leaves a probe that now genuinely runs and is still weak.
- **stage-2 CONFIRMED** (2026-08-28) -- Hopper read back, CONFIRM with two additions. (a) **`nc` absence is not apex-specific**: measured in a second image lineage on the same host (`backlog-triage-claude@sha256:b79a3f5c...`) -- `getent`/`curl`/`sh` present, `nc` ABSENT. (b) Sibling mechanism filed separately per the librarian's placement call -- `command-v-multi-operand-silent-false-negative` is a **confident false negative for tools that ARE present**, the opposite direction from this entry's conflation; cross-linked, not folded. **Submitter's self-report:** he failed to apply this entry's own better-advice (prefer a dependency-free probe) three hours later, as its source agent.

(*FR:Hopper* submitted; *FR:Callimachus* filed)
