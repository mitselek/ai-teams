---
source-agents:
  - hopper
  - brunel
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: high
source-files:
  - teams/framework-research/docs/joosep-container-design-2026-08-28.md
source-commits: []
source-issues: []
related:
  - verification-narrower-than-it-appears.md
  - capability-guard-conflates-tool-absent-with-check-failed.md
  - right-conclusion-does-not-certify-its-mechanism.md
  - command-v-multi-operand-silent-false-negative.md
  - ../patterns/stale-snapshot-trusted-as-current.md
  - ../patterns/verification-certifies-a-moment-not-a-session.md
---

# A Verification Step Goes Stale Invisibly -- Precisely Because It Passed

**Gotcha (cross-team, observation-based, high confidence).** A verification step is scoped to **the artifact as it stood when the step ran.** Amend the artifact and the verification silently expires: nothing re-runs, nothing warns, and the recorded PASS stays on the record **looking exactly like a current one.**

> ***"I already checked that"* is a claim about a past version of a thing.**

There is no signal at the moment of expiry. That is the whole entry. The other members of this family are about a check *measuring the wrong thing*; this one is about a check that measured the right thing and then stopped being true, with no event marking the transition.

## The instance -- RC bridge-egress probe, 2026-08-28

1. Brunel proposed a bridged-container egress probe. Its first discriminator collapsed *"the tool is missing"* and *"the thing under test is broken"* into one branch -- the [`capability-guard`](capability-guard-conflates-tool-absent-with-check-failed.md) genus.
2. Hopper pre-flighted the probe's tool dependencies against the target image and cleared them: `getent`, `curl` 7.88.1, `sh` all present.
3. Brunel then **accepted an amendment Hopper proposed**, adding `ip -4 addr show eth0` and `ip route` -- there specifically to separate *"routed into WARP and blackholed"* from *"never got an address."*
4. **The pre-flight was not re-run against the amended command.** `ip` is absent from that image.
5. The sanctioned Tier M probe ran and printed `sh: 1: ip: not found` twice. It produced a usable verdict for the primary question, **so nothing failed loudly** -- and the distinction the amendment existed to draw is still open, after spending a sanction that could have bought it.

## Two properties that make this a face of its own, not an n+1

- **The failure is silent and asymmetric.** The amendment degraded to a **no-op**, and a no-op inside an otherwise-successful probe produces no alarm anywhere.
- **The author of the amendment owned the check.** Hopper introduced the new dependency *and* owned the pre-flight that would have caught it, and still did not connect them -- **because the check had already passed, and passing feels terminal.**

## Remedy -- two, and the second is stronger

1. **Re-run the check against the amended command.** Never inherit a pre-flight from the version you validated. *When a command changes, its pre-flight is void.*
2. **Better: remove the dependency instead of checking it.** `cat /proc/net/route` and `cat /etc/resolv.conf` need no binary, so there is nothing to go stale. **A check with no external dependency cannot expire.**

## Independent derivation -- why this is `high` on one incident

Hopper and Brunel submitted this **separately and without contact**, on the librarian's explicit instruction not to coordinate, from opposite ends of the same event -- Brunel authored and amended the probe, Hopper pre-flighted and executed it. **Both independently identified the same non-obvious second-order property: that the staleness is invisible *because the step previously passed*.** That is Protocol A step 5, two independent high-confidence submissions covering the same knowledge, and it is what carries the confidence here -- not the sighting count.

Hopper's framing was taken for the title. Brunel's addition, kept: this sits **one level above** the ordinary probe-design defect -- *"the flaw is not in the probe but in the check that was supposed to guarantee the probe."*

## Corroborating instance the same day, same shape, opposite outcome (Hopper)

Staging six files to the host, a local CRLF check reported all six as CRLF. The host disagreed three ways -- `file(1)` said LF, `grep -c` said 0, byte sizes matched -- and local-vs-remote md5 equality settled it: **the files were LF and the local check was a Git Bash artifact.**

The tell he walked past: **the reported "CR count" exactly equalled each file's line count, for all six files.** *A metric that reproduces a different metric exactly is not a measurement.*

**Why the pair matters:** the CRLF case was caught only because the host supplied independent signals. The `ip` case had none. **Whether the substrate happens to volunteer a second opinion is the only thing that separated the caught error from the uncaught one** -- which is precisely why the remedy has to be structural rather than attentional.

## Relation to the neighbours

- [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md) -- **parent genus, and the axis is why this is separate.** Its instances 2-6 vary along **scope**: wrong artifact, wrong stream, a signal that cannot distinguish two states, a signal sampled faster than its poll, a predicate authored around the mutation. This varies along **time**: correctly chosen, correctly run, correctly read -- then invalid. **None of the six turn on a check having been valid and becoming invalid.** Cross-linked, not merged.
- [`../patterns/verification-certifies-a-moment-not-a-session.md`](../patterns/verification-certifies-a-moment-not-a-session.md) -- the same insight as a positive discipline, from the wiki-consistency side. **This entry is that pattern's failure mode with a named trigger** (the artifact changed), where that one has only the passage of time.
- [`right-conclusion-does-not-certify-its-mechanism.md`](right-conclusion-does-not-certify-its-mechanism.md) -- **the same probe, the other defect.** Read together: the verdict was right, the instrument was never exercised, and the check that would have caught the instrument had silently expired.

## Provenance note

**Brunel stated the provenance plainly and it is kept:** the failure was Hopper's, on a probe Brunel authored and amended, and **Hopper volunteered it unprompted rather than letting it pass.**

Hopper separately asked that the related `command -v` near-miss **not** be filed as good practice on his part, because catching it was luck -- a belt-and-braces `curl --version` in the same call -- and not method. Honoured; see [`command-v-multi-operand-silent-false-negative.md`](command-v-multi-operand-silent-false-negative.md). *Crediting a discipline nobody exercised teaches the wrong lesson.*

(*FR:Hopper* and *FR:Brunel* -- independent simultaneous submissions; *FR:Callimachus* filed)
