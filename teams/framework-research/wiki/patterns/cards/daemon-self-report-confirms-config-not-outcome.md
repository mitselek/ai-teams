---
title: "A Daemon's Self-Report Confirms the Config, Not the Outcome -- Make an Independent Outcome Check the Primary Pass/Fail"
directory: patterns
status: active
confidence: high
source-agents: [brunel, team-lead]
source-team: framework-research
discovered: 2026-08-26
last-verified: 2026-08-26
stage-2: partial
related: [../gotchas/verification-narrower-than-it-appears.md, ../gotchas/control-narrower-than-its-name.md, ../gotchas/docker-port-empty-under-network-mode-host.md, ../gotchas/coordinator-supplied-material-anchors-the-delegation.md, documentation-vs-substrate-truth-divergence.md, ../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md]
tags: [pattern, verification, migration, config-relocation, docker, containerd, data-root, self-report, outcome-check, silent-partial-success, rc-host]
---

## TLDR

A daemon's self-report of its own relocated config proves **the setting was applied, not that the outcome happened** -- it tests `config == config` and cannot see a dependent system that also needed the change. Any config-relocation migration needs an **INDEPENDENT outcome-level check as the PRIMARY pass/fail signal** (RC case: `df -hT /` before/after), with daemon self-reports demoted to diagnostics. Live case: Docker + containerd are **separate daemons with separate storage roots** (`daemon.json` `data-root` vs `config.toml` `root`); a `data-root`-only move relocates 22G, leaves 21G on root, and **every Docker-level check reports clean success in that half-done state, by construction.**

## Key ideas

- **RC substrate (verified structurally)**: `io.containerd.snapshotter.v1` driver means the system `containerd.io` unit -- own systemd service, own shims, `Wants=`/`After=` dependency, `config.toml` `root`/`state` commented out (built-in default `/var/lib/containerd`) -- owns image/container-layer content; `dockerd` is its client. Measured: docker 22G, containerd 21G. Single-limb move: root 93% -> ~52%, not the ~15% two limbs achieve. **A silent partial success.**
- **Why the checks can't catch it**: `docker info` / `docker ps` / `docker images` / clean restarts all ask a system to report its own configuration -- which always matches what you set, regardless of whether the *other* daemon was reconfigured.
- **Design rule, three parts**: (1) self-report = identity check; (2) the outcome lives one level up, on an instrument the mutated system does not own (`df` is the kernel's view); (3) **ordering is part of the design** -- the outcome check is the gate, self-reports explain failures.
- **Cross-substrate confirmation, same day, different agent**: team-lead's merge script printed `markers left: 0` while deleting everything outside the hunk -- VNTIA instance 6. Two agents, two substrates, one shape: **the check inherits the mutation's blind spot.** This entry is the design remedy; the gotcha genus is the trap.
- **Act-side sibling**: the single-limb plan is `control-narrower-than-its-name` in migration form (named a total move, performed a partial one, reported success).
- **Sibling gotcha filed separately at submitter's request**: `docker-port-empty-under-network-mode-host` -- same root category (verification method must match the actual mechanism, not the most obvious command), narrower fact.
- **Catch provenance**: surfaced by team-lead's review question, confirmed structurally by Brunel -- the review itself is evidence self-reports alone wouldn't have caught it. Evidence quoted verbatim in the entry (the briefing lives in a prunable session scratchpad + PO artifact).
- **Confidence high**: mechanism substrate-verified + measured sizes + independent cross-substrate instance.
- **stage-2 partial** -- filed pending (filed-on-behalf); **team-lead read back 2026-08-26 17:33, CONFIRMED no corrections**. **Brunel still owed.** ~~Read-back also confirmed the quote-not-cite call the hard way: the PO deleted (parked) the briefing artifact minutes later -- the verbatim quotes in the entry are now the only durable copy.~~ **[CORRECTED 2026-08-27 -- the struck sentence is FALSE.]** The artifact was never deleted or parked: team-lead's watch ended "artifact not found" because **his own auth token had expired**; `/login` the next morning restored it, and the artifact (`https://claude.ai/code/artifact/99523dce-bbe6-440b-bbce-9d6687fe5133`) is live, org-shared, current, with a third party (A.Lerko) planning to apply it. Team-lead generalised a transient absence into a deliberate act by the PO and relayed it; the librarian wrote it here **without an independent check**, and as *evidence for* the quote-not-cite call. **That call stands on its own ground** (a session-scratchpad artifact is a prunable store as a class) and never needed the event. The error's shape is filed as [`../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md`](../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md), instance 2 (instance 1 = the S57 cold-start false negative). Struck, not erased.

(*FR:Brunel* submitted; *FR:Aen* co-source via review catch; *FR:Callimachus* filed)
