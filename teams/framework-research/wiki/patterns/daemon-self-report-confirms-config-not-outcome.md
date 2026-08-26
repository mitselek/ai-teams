---
source-agents:
  - brunel
  - team-lead
source-team: framework-research
discovered: 2026-08-26
filed-by: librarian
last-verified: 2026-08-26
status: active
source-files:
  - teams/framework-research/memory/brunel.md
  - teams/framework-research/memory/team-lead.md
source-commits:
  - 69f0d3c
  - e7f5b0a
source-issues: []
related:
  - ../gotchas/verification-narrower-than-it-appears.md
  - ../gotchas/control-narrower-than-its-name.md
  - ../gotchas/docker-port-empty-under-network-mode-host.md
  - ../gotchas/coordinator-supplied-material-anchors-the-delegation.md
  - documentation-vs-substrate-truth-divergence.md
---

# A Daemon's Self-Report Confirms the Config, Not the Outcome -- Make an Independent Outcome Check the Primary Pass/Fail

**Pattern (team-wide, observation-based with a structural mechanism).** A daemon's (or any service's) self-report of its own relocated configuration proves **the setting was applied** -- not that the intended outcome occurred. Any config-relocation migration therefore needs an **independent, outcome-level check as the PRIMARY pass/fail signal** -- not as a secondary confirmation alongside the self-reports. The self-reports will always match what you set, *by construction*, regardless of whether a **dependent system** was also reconfigured.

## The live case -- RC host docker/containerd data-root migration (2026-08-26, Tier R survey)

On the RC host, Docker runs the `io.containerd.snapshotter.v1` storage driver, and containerd is **not** Docker's private subprocess -- it is the system-wide `containerd.io` package, its own independently-`enabled` systemd unit with its own shim processes, which `dockerd` merely connects to as a client. Verified structurally in the survey (quoted from the briefing, whose raw output includes `dpkg -S`, `systemctl status`, and `stat`):

> `docker.service`'s dependency graph is `Wants=`/`After=containerd.service` -- docker depends on containerd, not the reverse. containerd is not a child of dockerd and is not managed via `--data-root`. [...] `/etc/containerd/config.toml` exists but has `root`/`state` **commented out** -- containerd runs on its built-in defaults, `root = "/var/lib/containerd"`.

So Docker and containerd are **separate daemons with separate, independently-configured storage roots** (`daemon.json` `data-root` vs. `config.toml` `root`). Relocating only Docker's moves `/var/lib/docker` (**22G, measured**) and leaves `/var/lib/containerd` (**21G, measured**) on the full root filesystem untouched -- root goes 93% -> ~52%, not the ~15% the two-limb move achieves.

**And every daemon-level check would have reported clean success in that half-done state**: `docker info` shows the new Docker Root Dir, `docker ps` / `docker images` work, containers restart cleanly. Quoted from the briefing (§3.1):

> Docker-level checks cannot detect this by construction -- they ask a daemon to report its own configuration, which will always match what you told it, regardless of whether the *other* daemon was also reconfigured.

The remedy shipped in the runbook: **`df -hT /` measured before and after is the primary pass/fail signal**; the daemon self-reports are demoted to confirming that the settings landed.

## The pattern, generalised

1. **A self-report is an identity check.** Asking a mutated system to re-assert its own settings tests `config == config`. It cannot see a dependent system that also needed the change.
2. **The outcome lives one level up.** The operator's goal was never "Docker's config points at `/home`" -- it was "root has ~40G free." Measure *that*, on an instrument the mutated system does not own (`df` is the kernel's view, not either daemon's).
3. **Primary, not secondary.** A `df` check listed as a footnote after five green self-reports gets read as a formality. Ordering is part of the design: the independent outcome check is the gate; self-reports are diagnostics for *why* if the gate fails.

Cross-substrate confirmation from the same day, different agent, different substrate: team-lead's hand-rolled merge script printed `markers left: 0` (a check on the thing the script mutated) while everything outside the conflict hunk was silently deleted -- now instance 6 of [`../gotchas/verification-narrower-than-it-appears.md`](../gotchas/verification-narrower-than-it-appears.md). Two agents, one day, two substrates, same shape: **the check inherited the mutation's blind spot.** This entry is the *design remedy* for that genus in migration contexts; the gotcha entry is the trap itself. Cross-linked, not merged.

Also adjacent, act-side: the single-limb plan is [`../gotchas/control-narrower-than-its-name.md`](../gotchas/control-narrower-than-its-name.md) in migration form -- "move Docker's storage" names a total move and performs a partial one, succeeding and reporting success.

## Sibling gotcha, same investigation

[`../gotchas/docker-port-empty-under-network-mode-host.md`](../gotchas/docker-port-empty-under-network-mode-host.md) -- `docker port` returns empty for `network_mode: host` containers even when healthy. Same root category (**the verification method must match the actual mechanism, not the most obvious command**) but a distinct, narrower architectural fact -- filed separately at the submitter's request, per dedup outcome 3.

## Confidence

**High, as submitted.** The two-daemon/two-roots mechanism is substrate-verified (structural evidence above, plus measured sizes), and the general form is supported cross-substrate by the same-day merge-script instance -- two agents, independently, before either had read the other's account. The catch itself came from team-lead's review question, not from the survey's first pass: the review process is part of the evidence that self-report checks alone would not have caught this.

## Provenance note

Submitted by Brunel via Protocol A 2026-08-26; team-lead co-credited as the reviewer whose question surfaced the containerd limb (Brunel then confirmed it structurally). The full writeup lives in a session-scratchpad briefing published to the PO as a Claude artifact -- **a prunable store, so the load-bearing lines are quoted above verbatim** rather than cited by path. Filed by the librarian: **`stage-2: pending`** -- Brunel's and team-lead's read-backs owed.

(*FR:Brunel* submitted; *FR:Aen* co-source via review catch; *FR:Callimachus* filed)
