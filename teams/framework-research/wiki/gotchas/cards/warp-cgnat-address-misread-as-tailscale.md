---
title: "A `100.64/10` Address Does Not Name Its Overlay -- EVR Is Cloudflare WARP, Not Tailscale"
directory: gotchas
status: active
confidence: high
source-agents: [team-lead]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [warp-dns-vs-routing-asymmetry-rc-host.md, warp-host-sshd-2222-collision-with-apex-live.md, reverse-forward-carries-originating-host-warp-identity.md, file-state-claims-have-no-layer-dimension.md, singular-convention-plural-instances-enumerate-from-the-registry.md, ../patterns/discriminator-anchored-on-sub-canonical-source.md, ../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md]
tags: [gotcha, warp, cloudflare-warp, tailscale, tailnet, cgnat, rfc6598, evr, rc-host, shipyard, sagres, overlay, no-slot, architectural-fact, gh-109]
---

## TLDR

`100.64.0.0/10` is the RFC 6598 **shared CGNAT** range -- Cloudflare WARP allocates from it and so does Tailscale. **The address does not identify the overlay.** Every EVR `100.x` host is on Cloudflare WARP. Ask the host (`warp-cli status` / `tailscale status`), never the range.

## Key ideas

- **EVR fleet:** RC `100.96.54.170` and shipyard `100.103.189.3` are WARP; **prod-llm `10.100.136.162` is RFC 1918, not CGNAT at all.** The fleet is mixed, so *"our hosts are the 100.x ones"* is wrong in the other direction. Neither range is a fleet identifier.
- **Substrate-verified (Hopper, 2026-08-28, RC):** `tailscale` **not installed**; `warp-cli status` = Connected, Always-On, MASQUE, exclude-mode split tunnel.
- **Class split:** the range collision is an **architectural fact** (RFC 6598 is *designed* for reuse; both vendors took it up) -- **n+1 sightings do not raise it**; revision trigger is a vendor allocation change or EVR adopting a second overlay. That readers keep making the inference is the **observed genus** and does accumulate instances.
- **Mechanism:** `discriminator-anchored-on-sub-canonical-source` Sub-shape A.1 with an IP prefix as the identifier -- anchored on a remembered convention, not on what the host's own overlay client reports.
- **[CLASSIFICATION CORRECTED 2026-08-28, Brunel -- first filing had it in the wrong family.]** It was listed as no-slot **form 7**. **Wrong: nothing collides.** `100.96.54.170` is unambiguous -- one host, one overlay. Contrast the genuine scope-collision family, where `2230` names two real sockets and `:latest` two real images. **What fails here is an inference from a PROPERTY of the identifier** -- the range is CGNAT, CGNAT is used by both, so it is **consistent with both and determines neither.** The identifier is fine; the reasoning over it is invalid.
- **Its real sibling is `authorized-keys-comment-is-not-evidence-of-ownership`:** *an attribute that correlates with the answer but does not determine it, read as determinative.* A CGNAT range is consistent with any overlay; a key comment with any owner. **In both, the truthful-looking instance is the trap** -- the label really was Joosep's, this really is a CGNAT address, **and being right this time is what earns the field trust it has not deserved.** Cross-linked at n=2, not an umbrella.
- **Instances:** (1) joosep design v1 `[PO-8]` named Tailscale a **hard prerequisite** for a colleague's container -- caught in v2 only because Hopper happened to read the host; (2) 110 occurrences / 38 files repo-wide (#109); (3) **fossilised in an identifier** -- the key filename `id_ed25519_tailnet` names a WARP host, and a misreading hardened into a *name* outlives its own correction.
- **The one correct use:** the PO's ruling *"EVR will not join the tailnet"* is about **sagres's** overlay, not an EVR address. Those sentences are not instances. **Unverified and flagged:** sagres=Tailscale rests on three agreeing documents, never a `tailscale status` on the box -- which is exactly the failure this entry describes.
- **Rule:** never write tailnet/Tailscale about an EVR host; never infer an overlay from a range; historical records get a **bracketed correction, not a rewrite**.
- **Wiki sweep 2026-08-28:** 9 occurrences / 6 files, **zero instances** -- 7 are the quoted-ruling phrase, 1 a card tag, 1 the sagres address label. #109's placement of `wiki/decisions/two-islands-*` in its class 1 is **incorrect**; reported back, not acted on.

(*FR:Callimachus*)
