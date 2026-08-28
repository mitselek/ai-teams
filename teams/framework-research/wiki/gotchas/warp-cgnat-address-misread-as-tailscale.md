---
source-agents:
  - team-lead
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: high
source-files:
  - teams/framework-research/docs/joosep-container-design-2026-08-28.md
  - teams/framework-research/wiki/decisions/two-islands-by-design-hub-topology-follows-network-boundary.md
source-commits: []
source-issues:
  - 109
related:
  - ../patterns/scope-bound-identifier-used-as-globally-unique.md
  - warp-dns-vs-routing-asymmetry-rc-host.md
  - warp-host-sshd-2222-collision-with-apex-live.md
  - reverse-forward-carries-originating-host-warp-identity.md
  - file-state-claims-have-no-layer-dimension.md
  - singular-convention-plural-instances-enumerate-from-the-registry.md
  - ../patterns/discriminator-anchored-on-sub-canonical-source.md
  - ../patterns/documentation-vs-substrate-truth-divergence.md
  - ../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md
---

# A `100.64/10` Address Does Not Name Its Overlay -- EVR Is Cloudflare WARP, Not Tailscale

**Gotcha (team-wide, high confidence).** `100.64.0.0/10` is the RFC 6598 **shared CGNAT** range. Cloudflare WARP allocates from it and so does Tailscale. **The address does not identify the overlay.** Every EVR host reached at a `100.x` address is on **Cloudflare WARP**; agents have repeatedly read the range as a Tailscale tailnet and written that misreading into designs, registries and prerequisites.

**The discriminator is on the host, not in the address:** `warp-cli status` (Cloudflare WARP) or `tailscale status` (Tailscale). One read-only call each.

## What is actually true of the EVR fleet

| Host | Address | Overlay |
|---|---|---|
| RC | `100.96.54.170` | Cloudflare WARP (`CloudflareWARP` interface, `/32`) |
| shipyard | `100.103.189.3` | Cloudflare WARP |
| prod-llm | `10.100.136.162` | RFC 1918, **not CGNAT at all** |

**Substrate-verified 2026-08-28 (Hopper, RC host):** `tailscale` is **not installed**; `warp-cli status` returns Connected, Always-On, MASQUE, exclude-mode split tunnel. Recorded in [`joosep-container-design-2026-08-28.md`](../../docs/joosep-container-design-2026-08-28.md) §"Cloudflare WARP".

Note the third row. The EVR fleet is **mixed** -- prod-llm is `10.x`. So the inverse shortcut ("our hosts are the `100.x` ones") is wrong too, in the other direction. Neither range is a fleet identifier.

## The one place `tailnet` is correct

The PO's **personal island** (sagres, `100.102.133.125`) is a separate network on a separate overlay, and the PO's ruling on #108 is *"EVR will not join the tailnet"* -- a statement about **sagres's** overlay, not about any EVR address. Sentences of that form are records of the ruling and are **not** instances of this gotcha. See [`../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md`](../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md).

**Unverified, and flagged as such:** that sagres genuinely runs Tailscale is supported by three independent documents (the PO ruling's wording, the `(tailnet)` label in the hub registry table, and the po-team wiki's `tailnet-only-ports` / `tailscale-ssh-blocks-docker-port-publish` entries) but has **not** been probed with `tailscale status` on the box. Three documents agreeing is not a substrate probe -- that is the whole content of this entry. Anyone with shell on sagres should run it and submit the result back.

## Why this recurs -- and the class split

Two claims live in this entry, and they belong to different classes (per [`../process/within-entry-class-split-observed-genus-designed-mechanism.md`](../process/within-entry-class-split-observed-genus-designed-mechanism.md)):

- **Architectural fact (designed).** The range collision is deliberate on both sides: RFC 6598 reserves `100.64/10` precisely so that multiple carriers can reuse it, and both vendors took it up. **n+1 sightings do not raise this claim's confidence.** Revision trigger: a vendor changes its allocation range, or EVR adopts a second overlay.
- **Observed genus.** That readers keep making the inference anyway, across sessions and agents. That half accumulates instances.

The mechanism of the misread: **a range is a plausible-feeling discriminator that was never a discriminator.** This is [`../patterns/discriminator-anchored-on-sub-canonical-source.md`](../patterns/discriminator-anchored-on-sub-canonical-source.md) Sub-shape A.1 with an IP prefix as the identifier -- the author anchors on a remembered convention ("100.x means Tailscale") instead of the canonical source (what the host's own overlay client reports). **[CLASSIFICATION CORRECTED 2026-08-28, Brunel -- the first filing put this in the wrong family.]** It was originally listed as no-slot **form 7**, on the reading that *"the `100.x` address"* has no slot for which overlay. **That is wrong, and the reason matters.**

**Nothing here collides.** `100.96.54.170` is unambiguous -- exactly one host, exactly one overlay. Contrast the genuine scope-collision family, where `2230` really does name two different listening sockets and `:latest` really does name two different images, so the name alone is ambiguous and you must state the scope ([`../patterns/scope-bound-identifier-used-as-globally-unique.md`](../patterns/scope-bound-identifier-used-as-globally-unique.md)).

**What fails here is an inference from a property of the identifier.** The address sits in CGNAT space; CGNAT is used by WARP *and* Tailscale; **so the range is consistent with both and determines neither.** The identifier is fine -- the reasoning over it is invalid.

**Its actual sibling is [`authorized-keys-comment-is-not-evidence-of-ownership.md`](authorized-keys-comment-is-not-evidence-of-ownership.md)**, and the shape is exact: **an attribute that correlates with the answer but does not determine it, read as determinative.** A CGNAT range is consistent with any overlay; a key comment is consistent with any owner. **And in both, the truthful-looking instance is the trap** -- the label really was Joosep's, and this really is a CGNAT address. Being right this time is what earns the field the trust it has not deserved.

*(Recorded in the family note at [`file-state-claims-have-no-layer-dimension.md`](file-state-claims-have-no-layer-dimension.md); form 7's listing there is annotated rather than deleted, because the note is a record of what was thought as well as what is true.)*

## Instances

1. **`joosep-container-design-2026-08-28.md` v1, item `[PO-8]`** named Tailscale as a **hard prerequisite** for a new colleague's container. Corrected in v2 **only because Hopper read the host** -- not because anyone noticed the claim was odd. Had the host read not happened for an unrelated reason, the prerequisite would have shipped, and onboarding a real person would have blocked on enrolling him in a network that does not exist.
2. **Repo-wide, 2026-08-28:** `grep -riE 'tailscale|tailnet'` returns **110 occurrences across 38 files** (#109) -- registries, deployment docs, network plans, ops logs, scratchpads.
3. **Fossilised in an identifier.** The fleet SSH key filename `id_ed25519_tailnet` names a **WARP-reachable** host ([`joosep-container-design-2026-08-28.md`](../../docs/joosep-container-design-2026-08-28.md), key-inventory table). This is the worst case of the class: a misreading that has hardened into a **name** outlives its own correction, because renaming a live key file is a breaking change and correcting the prose does not touch it. Read it as an artifact label, never as a network description.

**Cost, in the PO's words (2026-08-28):** *"we are stumbling on this misinterpreting CF warp address issue again and again and again and it really hinders our sysops."* The cost is not the wrong word. It is that the wrong word names a **diagnostic** -- someone told "check the tailnet" on an EVR host runs `tailscale status`, gets nothing, and has no idea whether that means broken or absent (see [`negative-probe-result-underdetermined-absence-read-as-permanent.md`](negative-probe-result-underdetermined-absence-read-as-permanent.md)).

## Rule

1. **Never write "tailnet" or "Tailscale" about an EVR host.** EVR = Cloudflare WARP. Overlay name explicit, `warp-cli` as the diagnostic.
2. **Never infer an overlay from an address range.** `100.64/10` is shared. Ask the host: `warp-cli status` / `tailscale status`.
3. **Historical records get a bracketed correction, not a rewrite** (ops logs, closed-session scratchpads, quoted rulings) -- per the no-sweep-on-citations ruling and [`citation-orphaning-by-housekeeping-sweep.md`](citation-orphaning-by-housekeeping-sweep.md). Rewriting a quoted ruling to say what we now know falsifies the record of what was said.

## Wiki-side sweep -- result, 2026-08-28

Swept `wiki/` for `tailscale|tailnet`: **9 occurrences across 6 files, counted not estimated. Zero are instances of this gotcha.**

- **Seven** are the phrase *"EVR declines tailnet"* / *"EVR's tailnet decline"* (the two-islands decision entry x2, its card, the decisions cards INDEX, the singular-convention gotcha, its card, `index.md`). Each records the PO's #108 ruling *"EVR will not join the tailnet"* and refers to **sagres's** overlay. **Correct as written.** #109's scope list places `wiki/decisions/two-islands-*` in its class 1 (EVR-host references, must be rewritten to WARP); **on inspection it does not belong there.** Reported back rather than acted on -- a rewrite would have falsified a quoted PO ruling.
- **One** is a `tailnet` keyword in the two-islands card's `tags:` list -- neither class; it indexes the decision by the term the ruling used.
- **One** is the `(tailnet)` label on `sm@100.102.133.125:2222` in the singular-convention hub table -- sagres, #109's class 2 (verify before touching). Held pending a `tailscale status` on that box.

**No wiki file calls an EVR `100.x` address a tailnet address.** The remedy applied instead of a rewrite: a one-line overlay gloss added to the two-islands decision entry, naming that the two islands sit on *different overlays* (EVR = WARP, personal = Tailscale) -- the fact the phrase leaves implicit and that the misreading feeds on.

## Revision trigger

Substrate change, not a sighting: a vendor changes its CGNAT allocation, EVR adopts a second overlay, or a `tailscale status` on sagres contradicts the unverified claim above.

(*FR:Aen* submitted; *FR:Hopper* substrate probe; *FR:Callimachus* filed)
