---
title: "An `authorized_keys` Comment Is Not Evidence of Ownership -- Match by Fingerprint"
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [../patterns/discriminator-anchored-on-sub-canonical-source.md, verification-narrower-than-it-appears.md, nopasswd-glob-grant-dead-shell-expands-before-sudo.md, right-conclusion-does-not-certify-its-mechanism.md]
tags: [gotcha, ssh, authorized-keys, fingerprint, identity, attribution, rc-host, revocation, audit]
---

## TLDR

An `authorized_keys` comment is **unauthenticated free text written by whoever pasted the line.** Nothing validates it. Reading it as identity certifies a *neighbour* (what somebody typed), not the thing (who holds the private key). **Match by fingerprint: `ssh-keygen -lf` per line, against a fingerprint the claimed owner attests to.**

## Key ideas

- **Documented by the host's own maintainer.** allerk README: *"Key comments on this host do not identify their owner... Match by fingerprint, never by comment."* On RC the key labelled `hr-platform` is the PO's own Windows client key; `id_ed25519.pub` is labelled with a person and belongs to the shared account.
- **Live self-reported instance (Hopper, 2026-08-28):** saw the comment `joosep.madar@evr.ee`, reported *as fact* that Joosep holds a key on `dev`; **Brunel began writing a recommendation to REVOKE that key on the strength of it.** Withdrawn on reading the README; question reframed from *"revoke his key"* to *"fingerprint all four keys, then decide."* Resolved correctly two hours later by byte-matching a PO-supplied key -- **but right by luck; the evidence at the time was a text field.**
- **THE CONTRAST, filed separately on purpose.** vs `discriminator-anchored-on-sub-canonical-source` **Instance 1**: there the comment (`michelek`, a template stub) matched **no live key** -- a **stale anchor**; here the comment was **present, current and correct as a string**, it **matched**, and **the match certified nothing** -- an **authority-less field**. Same subject, opposite mechanism, different fixes (re-anchor on live data vs stop asking the field a question it cannot answer). Cross-linked, not merged.
- **Why it earns an entry:** the failure is **invisible in the safe direction.** A wrong comment on a key you merely keep costs nothing and is never detected; it bites only when someone **acts** on the attribution -- revocation, audit, blame. **The field accumulates errors silently and is trusted precisely when being wrong is most expensive**, and no accumulating signal would prompt anyone to adopt the rule in time.
- **SIBLING SHAPE (added 2026-08-28, Brunel): `warp-cgnat-address-misread-as-tailscale`.** ***An attribute that correlates with the answer but does not determine it, read as determinative.*** A key comment is consistent with any owner (and is usually written *by* the owner -- that is where the correlation comes from, and it binds to nothing); a CGNAT range is consistent with any overlay. **In both the truthful-looking instance is the trap**, and **being right this time is exactly what earns the field the trust it has not deserved** -- neither is fixable by "check more carefully", only by asking a source that *determines* the answer (`ssh-keygen -lf`; `warp-cli status`). **Cross-linked at n=2, not an umbrella; promote on a third instance in a different substrate.**
- **The defensible claim from a comment alone** is *"a key LABELLED x is installed"*, never *"x holds a key"* -- which turns a decision-about-a-known into an honest decision-about-an-unknown.

(*FR:Callimachus*)
