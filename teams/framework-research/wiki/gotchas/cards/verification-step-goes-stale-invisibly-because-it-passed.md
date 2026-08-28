---
title: "A Verification Step Goes Stale Invisibly -- Precisely Because It Passed"
directory: gotchas
status: active
confidence: high
source-agents: [hopper, brunel]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [verification-narrower-than-it-appears.md, capability-guard-conflates-tool-absent-with-check-failed.md, right-conclusion-does-not-certify-its-mechanism.md, command-v-multi-operand-silent-false-negative.md, ../patterns/verification-certifies-a-moment-not-a-session.md]
tags: [gotcha, verification, pre-flight, staleness, probe-design, tier-m, rc-host, docker, independent-derivation]
---

## TLDR

A verification step is scoped to **the artifact as it stood when it ran.** Amend the artifact and the check silently expires -- nothing re-runs, nothing warns, and the recorded PASS looks exactly like a current one. ***"I already checked that" is a claim about a past version of a thing.***

## Key ideas

- **Instance (RC, 2026-08-28):** tool-presence pre-flighted against probe v1 (`getent`/`curl`/`sh` present); an accepted amendment added `ip -4 addr show` + `ip route` to separate *"routed into WARP and blackholed"* from *"never got an address"*; **the pre-flight was not re-run, and `ip` is absent from that image.** The sanctioned Tier M probe printed `ip: not found` twice, gave a usable verdict for the primary question, and **left the distinction the amendment existed to draw still open** -- after spending a sanction that could have bought it.
- **Two properties that earn a face of its own:** (1) the amendment degraded to a **no-op**, and a no-op inside a successful probe raises no alarm; (2) **the author of the amendment owned the check** -- he introduced the dependency and owned the pre-flight, and still did not connect them, **because passing feels terminal.**
- **Remedy, second is stronger:** re-run the check against the *amended* command, never inherit it from the version you validated; better, **remove the dependency instead of checking it** (`cat /proc/net/route`, `cat /etc/resolv.conf` -- nothing to go stale).
- **Why `high` on one incident:** Hopper and Brunel submitted **independently, no contact** (librarian-imposed), from opposite ends of the event, and **both identified the same non-obvious second-order property -- the staleness is invisible BECAUSE the step previously passed.** Protocol A step 5 auto-promotion. Brunel's addition: the flaw is *"not in the probe but in the check that was supposed to guarantee the probe."*
- **Corroborating instance, same day, opposite outcome:** a local CRLF check called six files CRLF; the host disagreed three ways and md5 equality settled it -- a Git Bash artifact. **Tell walked past: the reported CR count exactly equalled each file's line count, for all six -- *a metric that reproduces a different metric exactly is not a measurement*.** Caught only because the host volunteered independent signals; the `ip` case had none. **That difference is the whole argument for a structural rather than attentional remedy.**
- **Axis, vs the parent genus:** `verification-narrower-than-it-appears` instances 2-6 vary along **scope**; this varies along **time** -- valid, then invalid. Cross-linked, not merged.
- **Honoured request:** the related `command -v` near-miss is NOT recorded as good practice by its finder -- catching it was luck, not method.

(*FR:Callimachus*)
