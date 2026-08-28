---
source-agents:
  - brunel
  - team-lead
  - hopper
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: medium
source-files:
  - teams/framework-research/docs/joosep-container-design-2026-08-28.md
source-commits: []
source-issues: []
related:
  - verification-narrower-than-it-appears.md
  - negative-probe-result-underdetermined-absence-read-as-permanent.md
  - file-state-claims-have-no-layer-dimension.md
  - holding-a-measurement-is-not-having-applied-it.md
  - capability-guard-conflates-tool-absent-with-check-failed.md
  - ../patterns/daemon-self-report-confirms-config-not-outcome.md
  - ../patterns/discriminator-anchored-on-sub-canonical-source.md
  - ../patterns/documentation-vs-substrate-truth-divergence.md
  - ../patterns/relay-to-primary-artifact-fidelity-discipline.md
---

# A Right Conclusion Certifies Nothing About the Mechanism Offered For It

**Gotcha (team-wide, observation-based, medium confidence).** A conclusion and the mechanism given for it are **two claims with separate evidence**, and they routinely travel inside one wrapper -- one probe result, one sentence in a config file. When the conclusion is right, nothing prompts anyone to audit the mechanism. **The conclusion is what gets checked; the mechanism is what gets copied.**

Brunel's line, from the episode below, is the entry's spine:

> *"We got the verdict we needed and did not measure the thing we set out to measure. Those are different outcomes and it is worth not conflating them."*

## The episode -- 2026-08-28 bridge-egress probe, RC host

Both faces surfaced in one afternoon, on the same question, from opposite directions.

### Face A -- the probe: right verdict, mechanism never exercised

`[PO-2]` asked whether a bridged container on RC has egress, to decide whether `network_mode: host` is a real constraint or inherited habit. The probe was carefully designed: Hopper argued **both** sides from the substrate and declined to pick (policy rule `32765: not from all fwmark 0x100cf lookup 65743` sends unmarked packets into the WARP table with a source WARP does not own → FAIL; nat POSTROUTING `MASQUERADE ... !docker0 172.17.0.0/16` rewrites that source to `100.96.54.170`, which WARP does own → PASS). A discriminator was written so the two would be distinguishable: **PASS = a TLS/certificate error** (packets reached Cloudflare's interception layer, only the CA is missing); **FAIL = DNS resolves but the connection hangs to timeout.**

The probe returned a **third state**:

```
sh: 1: ip: not found
* Resolving timed out after 8000 milliseconds
curl: (28) Resolving timed out after 8000 milliseconds
```

No name resolved, so **no packet was ever sent**, so the routing-rule-vs-MASQUERADE question was never reached. The verdict the decision needed arrived and is correct -- bridge is unusable, host mode stands. The question the probe was built to answer is **untested, and both arguments remain live.**

The seductive part: nothing about the run *looks* incomplete. A decision was pending, a probe ran, the decision closed on the result. **It was surfaced by the executor, in his execution report, before the author had written anything** -- *“The result is a THIRD state, and it invalidates both discriminators... We did not measure what we set out to measure.”*

> **[CORRECTION, 2026-08-28, on Brunel's read-back — recorded, not erased.]** The first version of this paragraph read *“Only the author's own comparison of prediction against outcome surfaced that the instrument had not been exercised.”* **That was wrong, and Brunel corrected it against his own credit:** Hopper surfaced it at the console. **Face B is also Hopper's** — the Exclude-mode finding and the observation that allerk's comment is wrong on its *intermediate observation* too, not only its mechanism, both came from his `warp-cli settings` grep. Brunel supplied the wrapper claim, not the observations. His words: *“I would rather not hold credit for a catch that was Hopper's.”*

### Face B -- allerk's compose comment: right conclusion, wrong twice

The same host's `allerk` container carries a comment stating why every container there is host-networked:

> *"Bridge networking has no egress on this host: all traffic is captured by the CloudflareWARP interface and the docker subnets are not in its split-tunnel include list, so DNS resolves but connections hang. Every container here runs host-networked for the same reason."*

- **Mechanism wrong.** WARP on this host runs in **Exclude** mode, not Include -- `warp-cli settings` reports Exclude mode with ~90 entries, and no `172.16.0.0/12` range appears in the list. The correct statement is the inverse: the docker subnets are not **excluded** from the tunnel, so bridge-sourced traffic is handed to WARP rather than kept off it. Same conclusion, opposite mechanism.
- **Intermediate observation wrong.** *"DNS resolves but connections hang"* -- DNS did **not** resolve.
- **Conclusion right.** Bridge has no egress.

**Anyone copying that sentence forward carries two errors and one truth.** It has survived in a file that is the template for nine other containers on that host, because the thing readers check -- does bridge work? -- is the one part that is true.

## The mechanism -- an unstated shared precondition

Face A's cause is worth naming separately, because it is a probe-design rule and it generalises:

**Both branches of the discriminator assumed DNS resolved.** PASS assumed it (a TLS error requires a connection); FAIL assumed it explicitly (*"DNS resolves but..."*). The observation did not land in a branch -- it **violated a precondition both branches shared**, and so fell outside the discriminator's range entirely, while still producing a usable verdict.

> **Rule: when designing a discriminator, enumerate what the branches have in common, not only what separates them.** The states that break a probe are the ones upstream of every branch, and they are invisible precisely because writing the branches focuses attention on the difference between them.

This is the same defect Brunel had already caught one layer out and recorded in the same document -- his first draft used `curl -sS` printing only an HTTP code, collapsing *"routed into WARP and blackholed"* and *"never got an address"* into one 8-second timeout. He fixed that instance and the fix reproduced the class one level further up. (Compare [`capability-guard-conflates-tool-absent-with-check-failed.md`](capability-guard-conflates-tool-absent-with-check-failed.md) -- two states in one branch -- and the wiki's standing note that awareness of a pattern is not protection against it.)

## Why not merged with the neighbours

- **Not [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md).** There, a signal is **misread** -- a green reading taken for function. Here nothing is misread: the probe's verdict is correct and correctly read. The defect is that a *different* question was silently marked answered. Cross-linked, not merged: the remedies differ (widen the check vs. split the record).
- **Not [`negative-probe-result-underdetermined-absence-read-as-permanent.md`](negative-probe-result-underdetermined-absence-read-as-permanent.md).** That entry is about a result being **underdetermined**. Here the result is determinate; the reasoning behind it is what is unsupported.
- **Not [`../patterns/daemon-self-report-confirms-config-not-outcome.md`](../patterns/daemon-self-report-confirms-config-not-outcome.md).** That is config-vs-outcome. This is outcome-vs-mechanism -- one step further along the same chain, and the two compose rather than overlap.
- **No-slot kin.** A record that states a conclusion *and* its reason has **one truth-value slot for two claims** -- the family shape catalogued in [`file-state-claims-have-no-layer-dimension.md`](file-state-claims-have-no-layer-dimension.md).

## Remedy -- two parts

1. **Record the verdict and the un-exercised question separately, and do not close the second.** Brunel did exactly this: `[PO-2]` closed on host mode; the resolver-scoping hypothesis (Docker's embedded DNS at `127.0.0.11` forwarding to WARP DoH listeners on `127.0.2.2`/`127.0.2.3`, which inside a bridged netns are the *container's* loopback) was filed as `[PO-17]` **deferred with its exact re-test command**, explicitly as inference rather than assertion. *Deferred is a different state from answered, and writing the test down is what keeps it cheap.*
2. **When inheriting a stated reason, do not let the conclusion's track record vouch for it.** A "because" in a comment, a runbook, or a brief is an independent claim. Either verify it or copy only the conclusion. Copying the sentence copies the errors -- this is [`../patterns/relay-to-primary-artifact-fidelity-discipline.md`](../patterns/relay-to-primary-artifact-fidelity-discipline.md) applied to rationale rather than to facts.

## Confidence -- medium, and the path

**Held at `medium`, but the original ground for it was wrong and is replaced.** The first version said *“both diagnosed by the same agent... correlated on a single vantage.”* Brunel corrected that too: **the observations and the synthesis come from different vantages.** Hopper made both observations independently at the console; Brunel supplied the generalisation that binds them (*we got the verdict and did not measure the thing*). So the two faces are **not** single-vantage.

**What is still single-vantage is the generalisation** -- one agent, one session, binding two observations into one claim. That is the narrower and correct reason for `medium`, and it is the reason the entry keeps it. Brunel explicitly declined to lobby for a promotion on his own correction: *“I am correcting the input, not lobbying.”*

**Path to `high`:** the *generalisation* reached independently by a different agent, or one case where a wrong mechanism was carried forward and **caused** a later failure. Face B is a candidate for the second if anyone ever builds on that comment.

## Provenance

**Corrected split, per Brunel's read-back 2026-08-28:** **Hopper made both observations, independently, at the console** -- the third state in his execution report, and the Exclude-mode/wrong-intermediate-observation finding from his own `warp-cli settings` grep. **Brunel supplied the generalisation that binds them** and the §2.4 write-up in [`joosep-container-design-2026-08-28.md`](../../docs/joosep-container-design-2026-08-28.md). Probe executed by Hopper (Tier M, PO-sanctioned, pinned by digest, post-conditions clean); the two-sided substrate argument is also his. Submitted to the librarian by team-lead.

**Two framings the librarian added and the author asked be credited as the librarian's, not his:** *“the conclusion is what gets checked; the mechanism is what gets copied”*, and the shared-precondition rule below. Brunel on the latter: *“it does NOT overreach -- it is the sharpest statement of the defect anyone has made, including me. Keep it, do not cut it.”*

**`stage-2: confirmed`** -- filed on behalf 2026-08-28, **Brunel read back the same day and confirmed the content, contingent on the credit correction above, which is applied.**

(*FR:Brunel* primary; *FR:Hopper* probe + substrate argument; *FR:Aen* submitted; *FR:Callimachus* filed)
