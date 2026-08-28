---
source-agents:
  - hopper
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
  - ../patterns/discriminator-anchored-on-sub-canonical-source.md
  - verification-narrower-than-it-appears.md
  - nopasswd-glob-grant-dead-shell-expands-before-sudo.md
  - negative-probe-result-underdetermined-absence-read-as-permanent.md
  - ai-teams-user-no-sudo-use-docker-exec-root.md
---

# An `authorized_keys` Comment Is Not Evidence of Ownership -- Match by Fingerprint

**Gotcha (cross-team, observation-based, high confidence).** The comment field on an `authorized_keys` line is **unauthenticated free text written by whoever pasted the line.** It travels with the key, nothing validates it, and it is trivially wrong. Reading it as identity is a verification that certifies a *neighbour* -- what somebody typed -- rather than the thing, which is who holds the private key.

**Match by fingerprint, always:** `ssh-keygen -lf` per line, compared against a key the claimed owner attests to.

## The contrast with Instance 1 of the discriminator pattern -- read both, they are opposites

This entry and Instance 1 of [`../patterns/discriminator-anchored-on-sub-canonical-source.md`](../patterns/discriminator-anchored-on-sub-canonical-source.md) are about the same field and are **not** the same claim. Filed separately at the submitter's explicit reasoning:

| | Instance 1 (2026-05-20) | This entry (2026-08-28) |
|---|---|---|
| The comment | `michelek`, from an `.env.example` template stub | `joosep.madar@evr.ee`, **present, current, correct as a string** |
| What happened | **No live key carried it.** The regex matched nothing. | **It matched.** The reader concluded ownership. |
| The defect | The **anchor was stale** relative to live data | The **field has no authority** to certify the property inferred from it |
| Shape | Discriminator fails to match because it is anchored on non-live data | Discriminator matches and **the match certifies nothing** |

Same subject, opposite mechanism. Merging them would collapse *stale anchor* into *authority-less field*, and those need different fixes -- re-anchor on live data versus stop asking the field a question it cannot answer.

## Evidence

**Documented by the substrate's own maintainer**, for this exact host. `allerk`'s README:

> *"Key comments on this host do not identify their owner. The user's own Windows client key sat in `/home/dev/.ssh/authorized_keys` labelled `hr-platform`, and `/home/dev/.ssh/id_ed25519.pub` is labelled `mihkel.putrinsh@evr.ee` although it belongs to the shared account. Match by fingerprint, never by comment."*

**Live instance, Hopper, 2026-08-28 -- self-reported.** Surveying `dev`'s `authorized_keys` he saw a comment reading `joosep.madar@evr.ee` and reported to team-lead and Brunel **as fact** that *"Joosep already holds a key on the host `dev` account."* Brunel began writing a `[PO-12]` recommendation to **revoke Joosep's key** on that basis. Hopper withdrew it on reading the README section and reframed the question from *"revoke his key"* to *"fingerprint all four keys, then decide."*

It resolved correctly two hours later -- the PO supplied the key out of band and Hopper byte-matched it (`SHA256:g9kExnzOJyjyMGgqfGbecWDwZpGR2g/e5DoR49jKY70`, key blobs identical). **But the conclusion was right by luck, and the evidence for it at the time was a text field.** See [`right-conclusion-does-not-certify-its-mechanism.md`](right-conclusion-does-not-certify-its-mechanism.md) -- the same session produced that genus twice.

## Why this is worth an entry beyond "do not do that"

**The failure is invisible in the safe direction.** A wrong comment on a key you merely *keep* costs nothing and is never detected. It only bites when someone **acts on the attribution** -- revocation, audit, or blame. So the field accumulates errors silently and is then trusted **precisely at the moment it matters most**, which is also the moment when being wrong is most expensive.

That asymmetry is why "match by fingerprint" has to be a standing rule rather than a caution: there is no accumulating signal that would prompt anyone to adopt it in time.

## Two additions from Brunel (independent agreement, 2026-08-28)

Asked the same deciding question separately, Brunel gave the same answer and sharpened the ground:

- **The claim is stronger than *"unreliable"*.** A key comment is **free text with no binding to the key material** -- nothing generates it from the key, nothing validates it, and **its truth is uncorrelated with anything.** It is not a discriminator that happens to be badly anchored; it is **a field with no evidentiary authority by construction.** That is what makes it a different claim from `discriminator-anchored-on-sub-canonical-source`, whose Instance 1 is about *choosing a poor source among real ones*.
- **The meta-point, and it is the one most likely to be lost:** the label **turned out to be truthful** in Joosep's case. **That is not evidence that labels can be trusted.** The check was cheap, and without it the decision would have been made about an unknown. A field that is right this time and unverifiable in principle has not earned anything.

## Remedy

Cheap, and available the whole time:

```
ssh-keygen -lf <(echo "<line from authorized_keys>")
```

per line, compared against a fingerprint the claimed owner attests to. **The defensible claim from a comment alone is *"a key LABELLED `x` is installed"*, never *"`x` holds a key"*** -- which turns a decision-about-a-known into an honest decision-about-an-unknown.

## Related

- [`../patterns/discriminator-anchored-on-sub-canonical-source.md`](../patterns/discriminator-anchored-on-sub-canonical-source.md) -- Instance 1 is the contrast case above.
- [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md) -- parent genus: the check certifies a neighbour (what was typed) rather than the thing (who holds the private key).
- [`nopasswd-glob-grant-dead-shell-expands-before-sudo.md`](nopasswd-glob-grant-dead-shell-expands-before-sudo.md) -- same host, same survey, same class of authorization artifact that reads as authoritative and is not.

(*FR:Hopper* submitted; *FR:Callimachus* filed)
