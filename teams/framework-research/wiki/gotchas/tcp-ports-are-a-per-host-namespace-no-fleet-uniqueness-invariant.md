---
source-agents:
  - brunel
  - hopper
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: high
source-files:
  - teams/framework-research/docs/joosep-container-design-2026-08-28.md
  - registry.json
source-commits: []
source-issues: []
related:
  - ../patterns/scope-bound-identifier-used-as-globally-unique.md
  - image-tag-does-not-identify-the-image-across-hosts.md
  - singular-convention-plural-instances-enumerate-from-the-registry.md
  - warp-host-sshd-2222-collision-with-apex-live.md
  - network-mode-host-gives-zero-isolation-from-sibling-containers.md
  - ../patterns/documentation-vs-substrate-truth-divergence.md
  - holding-a-measurement-is-not-having-applied-it.md
---

# TCP Ports Are a Per-Host Namespace -- There Is No Fleet Uniqueness Invariant, and Compounding on a Correction Is Worse Than the Original Misread

**Gotcha (team-wide, high confidence).** **TCP ports are a per-host namespace.** A port in use on one host does not conflict with the same number on another, and **there is no fleet-wide port-uniqueness invariant to protect.** Concretely: prod-llm and RC **both** run something on 2226, legitimately.

The failure mode is importing a row scoped to host X into a port question about host Y and reading it as a collision. **A "collision" between two hosts is not a collision; it is a category error.**

## The half worth leading with -- compounding on a correction

The submitter filed this **because he made the error twice, and the second time was worse.**

He claimed a 2230 collision -- a shipyard registry row read against an RC question. When corrected, he **escalated the claim to a "three-way divergence" rather than asking whether there was a claim at all.**

> **When corrected, re-derive from scratch before reframing. Compounding on a correction is worse than the original misread, because it launders a wrong premise into a more confident-sounding one.**

The first error is a lookup slip. The second is a **structural** move: reframing preserves the premise while changing its dress, and the new frame arrives with the authority of having survived a challenge. A reader meeting the "three-way divergence" version has no way to see that the underlying claim was never checked -- it looks *more* examined, not less.

The retraction is preserved in `docs/joosep-container-design-2026-08-28.md` §1.4b, which **keeps both wrong versions visible** rather than replacing them. That is the right shape: an audit trail of a reframing is the only thing that makes the reframing legible later.

## Where the truth actually lives on RC -- a PO ruling, and a principle that is filed elsewhere

**PO ruling, 2026-08-28:** `/home/dev/allerk/docker-compose.yml`'s header table is the **ground-truth port registry for RC**; other records point at it. This is why the repo `registry.json` had no row for uikit-dev (2228) or allerk (2230) and carried a stale `(reserved)` 2221, while the file the operators actually edit was correct.

**The generalisable half is NOT this entry's, and is filed separately at the submitter's argument:** [`../patterns/the-record-lives-where-the-claim-is-made.md`](../patterns/the-record-lives-where-the-claim-is-made.md). His objection to keeping it here, and he was right: leading with *"the authoritative record is neither registry"* makes this entry **a story about one host** -- the port fact is RC-specific and now a PO ruling, whereas the record-keeping principle *"has nothing to do with ports, and would be buried inside"* this entry. The ruling stays here as **evidence**; the principle lives there.

## Evidence -- three records, three answers

- `registry.json`: screenwerk shipyard:2230, mvox shipyard:2229.
- `~/bin/rc-deployments.json`: screenwerk-dev on a different host:22, **no mvox row.**
- The host itself: 2230 = allerk.
- RC live map (`ss -lnt`, Hopper 2026-08-28): 22, 2222 apex, 2223 polyphony, 2224 entu, 2226 backlog-triage, 2228 uikit, 2230 allerk. Loopback-only: 11434 Ollama, 11443/11521/11522.
- Hopper's correction 2026-08-28 13:40; retraction in `docs/joosep-container-design-2026-08-28.md` §1.4b.

**Practical rule for a new port:** it is only unclaimed if it is unclaimed **on the target host** *and* in every record that claims to describe that host -- register it in all three, and check the compose header first.

## Family placement

A no-slot form -- *"port 2230 is taken"* has no slot for **which host** -- and a sibling of [`image-tag-does-not-identify-the-image-across-hosts.md`](image-tag-does-not-identify-the-image-across-hosts.md), filed the same day from the same survey. Both are *one name, N per-host instances*; both have a per-command remedy rather than a per-catalogue one, for the same reason: **the catalogue was wrong and the substrate was not.**

(*FR:Brunel* submitted, including the self-report; *FR:Hopper* correction and live port map; *FR:Callimachus* filed)
