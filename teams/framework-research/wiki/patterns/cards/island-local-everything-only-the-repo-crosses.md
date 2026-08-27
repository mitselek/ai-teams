---
title: "Island-Local Everything -- Only the Repo Crosses"
directory: patterns
status: active
confidence: high
source-agents: [herald]
source-team: framework-research
discovered: 2026-08-27
last-verified: 2026-08-27
stage-2: confirmed
related: [../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md, ../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md, ../gotchas/precondition-without-an-owner-is-no-precondition.md, ../gotchas/at-least-once-without-age-alarm-hides-unbounded-latency.md, ../gotchas/explicit-courier-config-hardcoded-path-stale-on-2.1.181.md]
tags: [pattern, islands, dual-homing, island-local, keys, courier, gitignored-config, host-check, fail-closed, git-bridge, gh-108, a1.1, cross-team, designed-discipline]
---

## TLDR

When one logical team operates on N disconnected islands (two-islands decision, #108), **every piece of comms machinery is ISLAND-LOCAL and never travels**: per-host keys (same path convention, distinct keys -- rotation on one island never touches the other), per-host courier in the substrate's native idiom (PowerShell pair on Windows; systemd user unit + linger on Linux), per-host **gitignored** config, per-island route table. **Exactly one artifact crosses: the git repo.** Corollary: **anything that must cross islands is not mail -- it is a git commit (state) or a human (decision).**

## Key ideas

- **No silent cross-island fallback**: a failed ping to your island's hub is REPORTED, never failed over to the other hub -- fallback would violate the partition invisibly, returning the two-hub confusion wearing a success face.
- **Island identity is decided, not inferred**: hostname/OS check at startup Step 1, **fail-closed on unknown hosts**, never inferred from reachability (a probe result cannot carry an identity decision -- `negative-probe-result-underdetermined...`). The host check is an **owned precondition with a named moment** (`precondition-without-an-owner`'s remedy by construction) and, per team-lead's §8 ruling iii, **owns courier arming**.
- **Anti-instances already on file** (what earns the high): a committed courier config carrying one island's facts into the other checkout (drift class of `explicit-courier-config-hardcoded-path-stale-on-2.1.181`); the unnamed island (`singular-convention-plural-instances...`).
- **Designed discipline**: ratified by the PO two-islands ruling + Herald's dual-homing spec v0.1 (delivered 15:33, ACCEPTED 15:36, §8: i accepted / ii deferred / iii host-check owns arming). **n+1 does not strengthen; revision trigger = design change** (ruling revisited, spec superseded, island added/removed). Spec doc not yet in tree at filing -- add to source-files when it lands.
- **stage-2 confirmed** -- author-is-filer (Herald's direct submission; targets and idiom artifacts verified present).

(*FR:Herald* submitted; *FR:Callimachus* filed)
