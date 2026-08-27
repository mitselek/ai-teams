---
source-agents:
  - herald
source-team: framework-research
discovered: 2026-08-27
filed-by: librarian
last-verified: 2026-08-27
status: active
confidence: high
source-files:
  - teams/framework-research/wiki/decisions/two-islands-by-design-hub-topology-follows-network-boundary.md
  - designs/deployed/stationmaster/fr-dual-homing-spec.md
  - teams/framework-research/poc/ghost-bridge/restart-fr-courier-with-pid.ps1
  - teams/framework-research/docs/2026-08-27-stationmaster-consolidation-proposal.md
source-commits: []
source-issues:
  - 108
related:
  - ../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md
  - ../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md
  - ../gotchas/precondition-without-an-owner-is-no-precondition.md
  - ../gotchas/at-least-once-without-age-alarm-hides-unbounded-latency.md
  - ../gotchas/explicit-courier-config-hardcoded-path-stale-on-2.1.181.md
---

# Island-Local Everything -- Only the Repo Crosses

**Pattern (cross-team, designed discipline -- the operational *how* beside the two-islands decision's *what and why*).** When one logical team operates on N disconnected islands, **every piece of comms machinery is island-local and never travels. Exactly one artifact crosses islands: the git repo.**

## The discipline

Island-local, per host or per island, never committed and never shared across the boundary:

- **Key material** -- same *path convention* on every host, **distinct keys** per host: loss or rotation on one island never touches the other. (Precedent: apex's rotate-on-restart posture, onboarding Step 1 / CR-3.)
- **Courier instance** -- per host, in the substrate's native idiom: the PowerShell pair on Windows (`restart-fr-courier-with-pid.ps1`), a systemd user unit + `loginctl enable-linger` on Linux (#108 proposal §5.3).
- **Config** -- per host, **gitignored**. The anti-instance is already on record as a watch: a *committed* courier config would carry one island's facts into the other box's checkout -- the drift class of [`../gotchas/explicit-courier-config-hardcoded-path-stale-on-2.1.181.md`](../gotchas/explicit-courier-config-hardcoded-path-stale-on-2.1.181.md).
- **Route table** -- per island, compiled from that island's grants.

## The normative corollary

**Anything that must cross islands is not mail.** It is a **git commit** (state) or a **human** (decision). Concretely:

- **A failed ping to your island's hub is reported, never silently failed over to the other hub.** Cross-island fallback would violate the partition *invisibly* -- mail would appear to work while quietly crossing a boundary the design says nothing crosses, and the singular-article confusion the two-hub gotcha documents would return wearing a success face.
- **Which island you are on is decided explicitly** -- hostname/OS check at startup Step 1, **fail-closed on unknown hosts** -- **never inferred from reachability.** Reachability is a probe result; [`../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md`](../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md) is why it cannot carry an identity decision. The host check is an **owned precondition with a named moment** -- the remedy form of [`../gotchas/precondition-without-an-owner-is-no-precondition.md`](../gotchas/precondition-without-an-owner-is-no-precondition.md), applied by construction -- and (per team-lead's §8 ruling iii on the spec) **the host-check owns courier arming**.

## Anti-instances already observed

Both halves of this pattern have their failure mode on file, which is what earns the "high":

1. **The committed-config drift** (above) -- one island's facts in the other's checkout.
2. **The unnamed island** -- [`../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md`](../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md): what the singular article does when nobody names which island a document means.

## Class and revision trigger

**Designed discipline, not observed behavior**: it exists by ratification (the PO's two-islands ruling, #108 `issuecomment-5439161208`, and Herald's dual-homing spec v0.1, delivered to team-lead 15:33 and **ACCEPTED 15:36** with §8 rulings -- i accepted, ii deferred, iii host-check owns courier arming; the spec lands as a doc beside the runbook at the settled canonical home). **n+1 sightings do not strengthen it; the revision trigger is a design change** -- the PO ruling revisited, the spec superseded, or an island added/removed. The anti-instances are the observed half and follow normal dedup.

## Confidence

**High, as submitted** -- the discipline is design-ratified (decision + accepted spec) and both anti-instances are independently on file. The spec-acceptance details (15:33/15:36, §8 rulings) are recorded as submitted by the spec's author. *(Update, same hour: the spec landed at `designs/deployed/stationmaster/fr-dual-homing-spec.md` in the 15:41 move batch -- byte-identical accepted v0.1 with the §8 rulings appended, per its own provenance line; verified present and added to `source-files`.)*

## Provenance

Submitted directly by Herald via Protocol A 2026-08-27 15:35, as the a1.1 follow-on the two-islands decision anticipated. **`stage-2: confirmed`** -- author-is-filer (direct submission; cross-link targets and the Windows/Linux idiom artifacts verified present at filing).

(*FR:Herald* submitted; *FR:Callimachus* filed)
