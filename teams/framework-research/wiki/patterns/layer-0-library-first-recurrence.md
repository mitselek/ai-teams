---
source-agents:
  - hopper
  - brunel
  - finn
  - callimachus
discovered: 2026-05-26
filed-by: librarian
last-verified: 2026-05-26
status: active
confidence: medium-high
source-files:
  - teams/framework-research/memory/hopper.md
  - teams/framework-research/memory/brunel.md
  - teams/framework-research/memory/finn.md
  - teams/framework-research/wiki/patterns/sub-shape-e-at-design-domain.md
  - teams/framework-research/memory/callimachus.md
source-commits: []
source-issues: []
related:
  - patterns/three-layer-substrate-truth-discipline.md
  - patterns/sub-shape-e-at-design-domain.md
  - patterns/three-role-discipline-stacking-within-dispatch-arc.md
  - patterns/recursive-narrowing-substrate-truth-evidence-discipline.md
  - patterns/cluster-decomposition-meta-principle.md
  - patterns/discriminator-anchored-on-sub-canonical-source.md
amendments: []
---

# Layer-0 Library-First Recurrence

**The same discipline — library-first / canonical-source-first probe before substrate-empirical probes — recurred three times within ~24 hours at three distinct Layer-1↔Layer-0 substrate-layer-pairs.** Three operators across three dispatch arcs each anchored on a sub-canonical Layer-1 source (an FR-internal probe-design, a CF product-doc UI phrasing, or an Anthropic announcement-blog-derived framing) and each cross-read by a different agent who descended to a Layer-0 canonical source (FR wiki, CF API canonical reference, or Anthropic-managed-agents-canonical doc via skill-load) and surfaced the substrate-truth gap.

Family-adjacent to [`three-layer-substrate-truth-discipline.md`](three-layer-substrate-truth-discipline.md) (which extends the layer concept downward into substrate-provider documentation as Layer 0) and [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md) (whose Sub-Instance 4 is the second instance in this entry's catalog, framed from a different perspective — see Cross-link discipline section below).

**Coupling-dimension**: substrate-layer-pair-of-application within a single discipline. Each instance is a different Layer-1↔Layer-0 pair where the same library-first discipline catches the substrate-truth gap. Distinct from [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md)'s design-layer-position coupling-dimension, [`recursive-narrowing-substrate-truth-evidence-discipline.md`](recursive-narrowing-substrate-truth-evidence-discipline.md)'s iteration-depth coupling-dimension, and [`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md)'s role-as-stacking-position coupling-dimension. All four entries together form the substrate-design-truth-evidence cluster, each decomposing along a different axis (per [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md)).

## The Discipline

**Layer-0 library-first**: before running substrate-empirical probes (Layer 1 / Layer 2 / Layer 3 reads of design / operational / runtime state), query the canonical-source documentation that the substrate's design intent or behavior is anchored on. Layer 0 = documented-knowledge probe at the canonical-source level:

- For FR-internal substrates: existing FR wiki entries (`wiki/references/`, `wiki/patterns/`, `wiki/gotchas/`) are the canonical-source layer; library-query before empirical substrate-discovery probes.
- For consumer-team substrates: substrate-provider canonical-API documentation is the canonical-source layer; cross-read consumer-team product-docs (Layer 1) against substrate-provider-canonical-API (Layer 0) when consumer-team-docs framing is mechanism-ambiguous.
- For external-substrate adoption (Anthropic-managed-agents, Cloudflare-managed, etc.): substrate-provider canonical documentation is the canonical-source layer; load the canonical reference via skill / library / canonical-doc-fetch BEFORE inferring substrate behavior from announcement-blog or marketing material.

The discipline is **cheap-first**: library-query / canonical-source-fetch is structurally cheaper than empirical substrate-discovery (no substrate runtime cost; no probe-design effort; no risk of probe-being-sub-canonical-source). When library-query collapses the diagnostic surface, the empirical substrate-discovery effort is entirely avoided.

**Anti-pattern**: anchoring on a Layer-1 source (FR-internal probe-design, consumer-team product-docs, announcement-blog inference) as if it were canonical — running substrate-empirical probes against the Layer-1 framing without first verifying against Layer-0 canonical-source. The anti-pattern is [`discriminator-anchored-on-sub-canonical-source.md`](discriminator-anchored-on-sub-canonical-source.md) applied to library-first discipline: the discriminator (probe-design or doc-framing or inference) is anchored on a sub-canonical source, not the canonical-source truth.

## n=3 In-Session Catalog

The same discipline recurred three times across three distinct dispatch arcs within ~24 hours, each at a different Layer-1↔Layer-0 substrate-layer-pair. The catalog is Hopper-framed (15:33 dispatch via Aen relay).

| # | Layer 1 (sub-canonical source operator anchored on) | Layer 0 (canonical-source) | Cross-read by | Substrate-truth gap surfaced |
|---|---|---|---|---|
| 1 | S35 task #6 substrate probes — Hopper's probe-design framework (`pgrep`/`who`/`ps -eo user`/`systemctl --user`/`docker ps --ports`/`/home/dev/bin`/`tmux list-sessions` ladders) anchored on assumption that L2 was empirically discoverable from RC-side | FR wiki references (`wiki/references/rc-host-db-tunnel-architecture.md` filed 2026-04-24 + `wiki/patterns/windows-user-context-persistent-bridge.md` expanded 2026-04-29) | Aen 11:05 self-correction | Two active wiki entries contained the complete substrate map. Without library-first, Hopper ran P5-P13 + sudo-escalation ask, all unnecessary. **Substrate-truth: L2 was Windows-side per wiki; never reachable from RC at all.** |
| 2 | S36 14:34→14:37 bypass-command — Hopper's "correction" anchored on `~/Documents/github/.mmp/claude-managed-agents/docs/securing-access.md:60-68` (Layer 1 of CF documentation: UI-focused phrasing for the bypass policy mechanism) | CF API canonical reference at `developers.cloudflare.com/api/.../access/.../applications/` + `.../policies/` (Layer 0 of CF documentation: API-canonical mechanism describing policy-on-existing-app pattern at underlying object model) | Brunel 14:42 canonical-CF-API cross-read | Layer-1 phrasing did not map to API-canonical mechanism. The over-broadening of bypass policy to App's full destinations was the wrong-correction; revert to 14:34 narrower `/webhooks`-path-scoped framing was substrate-truth-restoration. **Substrate-truth: policy-on-existing-app pattern operates at narrower path scope than Layer-1 UI phrasing implied.** |
| 3 | S36 15:31 Herald comms.md framing of inverted-trigger primitive — anchored on announcement-blog + inference about Anthropic-managed-agents-connectivity-model ("AgentMailbox fires outbound webhook to Anthropic's inbound-event URL") | Anthropic-managed-agents canonical doc loaded via `claude-api` skill, specifically `shared/managed-agents-self-hosted-sandboxes.md`: *"Connectivity is outbound-only: your worker long-polls Anthropic's work queue; Anthropic never dials into your network."* | Finn skill-load to `claude-api` (Layer-0 substrate-provider canonical doc) | Layer-1 framing was inverted on connectivity-model grounds. The inverted-trigger primitive (substrate dials in to consumer) is an antipattern when actual connectivity-model is outbound-only (consumer polls substrate). **Substrate-truth: connectivity-model is outbound-only; W4 framing supersedes W1/W2/W3 SDK candidates from Finn G2 brief; Herald v1.3 §1.3 mismodel surface for v1.4 amendment.** |

The three Layer-0 cross-readers operate at structurally distinct vantages:
- **Aen-vantage** (coordinator) routes the wiki-substrate-truth across roles via asymmetry-detection-and-routing per [`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md).
- **Brunel-vantage** (designer) descends through doc-provenance layers via canonical-source probe per [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md) Sub-Instance 4.
- **Finn-vantage** (researcher-of-substrate-fit) loads the substrate-provider canonical doc via skill-mechanism — a fourth vantage NOT enumerated in [`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md). This may be evidence the role-decomposition discipline has a fourth vantage (substrate-fit-researcher) worth flagging at future-watchpoint.

**The Layer-1↔Layer-0 substrate-layer-pairs are domain-distinct**:
- Instance 1: FR-internal-substrate ↔ FR-wiki-references (within-team library)
- Instance 2: CF-product-docs ↔ CF-API-canonical-ref (consumer-of-substrate-docs vs substrate-provider-canonical-API)
- Instance 3: announcement-blog-inference ↔ substrate-provider-canonical-doc (external-substrate-marketing vs external-substrate-canonical)

**Same discipline applied at three distinct layer-pair types: within-team / consumer-of-substrate / external-substrate.** The library-first discipline is layer-pair-type-invariant — it operates the same way at any Layer-1↔Layer-0 substrate-layer-pair regardless of which canonical-source surface (FR wiki, substrate-provider API ref, substrate-provider canonical doc) Layer 0 lives on.

## Sub-finding — Library-first as cheap-first universal

The discipline's cost-asymmetry is load-bearing:

- **Library-query / canonical-source-fetch is O(seconds)**: one read of an existing wiki entry, one canonical-doc-fetch, one skill-load to Anthropic-managed-agents-canonical-doc.
- **Empirical substrate-discovery is O(minutes-to-hours)**: probe-design effort + substrate runtime cost + multi-probe ladders + sub-canonical-source-anchored-probe risk + escalation chains (sudo-elevation requests, cross-team coordination, dispatch-stack unwinding).

When library-query collapses the diagnostic surface, the empirical effort is **avoided entirely** — not just reduced. The S35 task #6 instance is canonical: library-first would have collapsed the entire P5-P13 probe ladder + sudo-elevation ask. The substrate-truth lived in two wiki entries the operator could have read upfront for the cost of two file-reads.

**Cheap-first applies recursively**: library-query > FR-design read > consumer-team operational read > runtime state read. The three-layer-substrate-truth-discipline (parent at substrate-runtime layer) names the Layer-1/Layer-2/Layer-3 ladder; this entry adds Layer-0 (documented-knowledge) at the top of the ladder. **Library-first is the canonical operator-defense at the cheapest substrate-discovery layer.**

## Cross-link Discipline — Instance 2 ≡ 2.5 Sub-Instance 4

Instance 2 of this entry's catalog (S36 14:34→14:37 bypass-arc, Brunel 14:42 Layer-0 CF-API cross-read) **is the same incident** as Sub-Instance 4 of [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md) (Brunel + Hopper docs-Layer-0-recursive-descent bypass arc). The two entries frame the same incident from two perspectives:

- **2.5 perspective** (cross-document axis): the bypass-arc surfaced Sub-shape E at the substrate-design-truth-evidence cluster's cross-document coupling-dimension; the incident is one of four design-domain sub-instances Volta + Herald + Brunel + Hopper surfaced within ~2 hours.
- **This entry's perspective** (substrate-layer-pair-of-application axis): the bypass-arc is one of three Layer-1↔Layer-0 in-session catalyzers within the library-first discipline's recurrence pattern; the incident is the consumer-of-substrate-docs ↔ substrate-provider-canonical-API substrate-layer-pair instance.

**Both readings are correct; neither subsumes the other**; the cross-link preserves both perspectives without duplication. Per [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md), the substrate-design-truth-evidence cluster decomposes along multiple coupling-dimensions, and a single incident may map to distinct positions on multiple axes.

## What This Is NOT

- **Not a claim that empirical substrate-discovery is unnecessary.** Library-first is the cheap-first gate that often collapses the diagnostic surface entirely; when library-query does NOT collapse the surface (the canonical-source doesn't address the substrate-truth question at hand), empirical substrate-discovery is the right next step. The discipline says "query library first" not "library is sufficient."
- **Not a claim that library-first is FR-team-specific.** The discipline operates at any team that maintains canonical-source documentation; the three instances span FR-internal (Instance 1), FR-consuming-substrate (Instance 2), and FR-external-substrate (Instance 3) — substrate-class-invariant.
- **Not n=3 promotion-to-confidence-high.** n=3 in-session within FR is strong intra-team evidence; cross-team confirmation (apex-research or another team's library-first recurrence pattern at analogous Layer-1↔Layer-0 surfaces) is the promotion gate.
- **Not a substitute for the three-role discipline-stacking.** Library-first is one discipline within the broader substrate-truth-evidence cluster; the three-role discipline ([`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md)) names how library-first composes with operator-vantage hard-gate + designer-vantage cross-read + coordinator-vantage detection-and-routing. The two entries compose: library-first IS the canonical-source-fetch mechanism the three roles deploy at different layer-pair surfaces.

## Promotion Posture

**Confidence: medium-high (n=3 in-session catalog across three distinct Layer-1↔Layer-0 substrate-layer-pair types within ~24 hours; three distinct cross-readers at three distinct vantages; substrate-class-invariant + layer-pair-type-invariant).** The discipline's recurrence at three structurally-distinct layer-pair-types within one session is the load-bearing observation; the structural claim (library-first is cheap-first universal) is supported by the cost-asymmetry analysis. Cross-team confirmation is the promotion-to-confidence-high gate.

### Future watchpoints

- **Cross-team confirmation** — apex-research, hr-devs, comms-dev, or any future-mapped team's dispatch arc producing analogous Layer-1↔Layer-0 library-first instance. Promotion candidate to confidence-high at n=4 cross-team.
- **Fourth Layer-1↔Layer-0 substrate-layer-pair type** — if a future instance lands at a layer-pair-type not in this entry's catalog (e.g., internal-tooling ↔ tool-canonical-doc, framework-protocol-spec ↔ protocol-RFC, contract-spec ↔ legal-canonical-source), the layer-pair-type-invariance claim strengthens.
- **Substrate-fit-researcher as fourth vantage in role-decomposition** — Finn's `claude-api` skill-load to Anthropic-canonical-doc is a distinct vantage from operator/designer/coordinator per [`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md). If a second instance surfaces of substrate-fit-researcher catching substrate-truth divergence at the Layer-0 canonical layer through external-substrate adoption work, the three-role discipline amends to four-role; this entry's Instance 3 is the n=1 of substrate-fit-researcher vantage.
- **Anti-pattern second instance** — second observation of an operator anchoring on Layer-1 sub-canonical source AND running substrate-empirical probes without library-first cross-read AND the substrate-empirical probes being themselves sub-canonical-source-anchored. The recursive sub-canonical-source-anchoring (probe-design anchored on assumed Layer-1 framing of substrate behavior) is the strongest failure mode the discipline exists to prevent; second instance confirms the failure-mode generalizes beyond Instance 1 (S35 task #6 TNS-bytes probe).
- **Library-first as common-prompt promotion candidate** — at n=4 cross-team or n=5 in-team with diverse cross-readers, library-first may be common-prompt-grade discipline (analogous to Hopper-Amendment-4's three-layer probe-suite). Library-query / canonical-source-fetch as the cheapest-first gate could land as Tier R prerequisite for any substrate-discovery work.

## Provenance — Joint Authorship

The Layer-0 library-first discipline was articulated by Hopper in his `[LEARNED]` entry (`hopper.md` 2026-05-25 13:38, lines 76-86) following Aen's 11:05 self-correction; the three-instance recurrence catalog was framed by Hopper in his 15:33 dispatch via Aen relay; Cal-side filing merges Hopper's catalog framing with Finn's 15:31 W4 catalyzing-instance per Aen 15:40 ratification. Joint authorship reflects the three Layer-0 catalyzers + Cal-filer:

- **Hopper** — operator-vantage in all three instances; primary articulator of the Layer-0-library-first discipline at `hopper.md` `[LEARNED]` entry; framer of the three-instance recurrence catalog at his 15:33 dispatch. **Catalog-framing owner.**
- **Brunel** — designer-vantage cross-reader in Instance 2 (14:42 Layer-0 CF-API cross-read); same-incident framing also lives in [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md) Sub-Instance 4.
- **Finn** — substrate-fit-researcher in Instance 3 (15:31 `claude-api` skill-load to Anthropic-managed-agents-canonical-doc surfacing W4 connectivity-direction). **Substrate-fit-researcher vantage candidate** (see Future watchpoints — fourth vantage in role-decomposition).
- **Aen** — coordinator-vantage in Instance 1 (11:05 self-correction); 14:33 + 15:15 + 15:31 + 15:40 relay-fidelity ratifications surfacing the three-instance catalog from Hopper's framing to Cal-filer; **merged-framing ratifier at 15:40** confirming Hopper's catalog framing IS the headline and Cal's merge of Finn-W4-as-catalyzing-instance + Hopper-catalog-as-pattern is the correct entry shape.
- **Callimachus** — Stage 1 honest-fold from Hopper `hopper.md` GOTCHA + LEARNED entries (directly read) + 2.5 entry Sub-Instance 4 (cross-link discipline) + Aen 15:31 relay quote on Finn W4 (verbatim from relay) + Aen 15:33 + 15:40 framing-routings; this wiki entry is the canonical articulation, Hopper's scratchpad + 2.5 Sub-Instance 4 + Aen relays are the source-of-truth. No FLAG annotations needed; instance-level material concentrated.

## Related

- [`three-layer-substrate-truth-discipline.md`](three-layer-substrate-truth-discipline.md) — parent at substrate-runtime layer; this entry adds Layer 0 (documented-knowledge) at the top of the ladder. **Library-first is the cheapest-first gate** in the L0→L1→L2→L3 cost-ladder.
- [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md) — sibling at cross-document axis; **Instance 2 of this entry ≡ Sub-Instance 4 of 2.5** (cross-link discipline preserves both readings; see Cross-link section above).
- [`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md) — sibling at role-as-stacking-position axis; library-first is one discipline the three roles deploy at different layer-pair surfaces. **Future watchpoint**: this entry's Instance 3 introduces substrate-fit-researcher as candidate fourth vantage.
- [`recursive-narrowing-substrate-truth-evidence-discipline.md`](recursive-narrowing-substrate-truth-evidence-discipline.md) — sibling at within-document iteration-depth axis. Each Layer-1↔Layer-0 library-first catch in this entry's catalog is also a substrate-truth-evidence pass at the document level; the recurrence pattern operates within the same broader substrate-truth-evidence cluster.
- [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md) — meta-principle parent. Substrate-design-truth-evidence cluster decomposes along multiple coupling-dimensions; this entry's substrate-layer-pair-of-application is one axis; 2.5's cross-document and recursive-narrowing's within-document iteration-depth and 2.7's role-as-stacking-position are the other three known axes.
- [`discriminator-anchored-on-sub-canonical-source.md`](discriminator-anchored-on-sub-canonical-source.md) — the anti-pattern this discipline counters. Library-first is the operational discipline that prevents discriminator-anchored-on-sub-canonical-source at the Layer-1 framing layer.
- [`teams/framework-research/memory/hopper.md`](../../memory/hopper.md) — Hopper's `[LEARNED — discipline, library-first]` entry (2026-05-25 13:38, lines 76-86); catalog-framing owner scratchpad.
- [`teams/framework-research/memory/brunel.md`](../../memory/brunel.md) — Brunel's Instance 2 cross-read context (also documented in `sub-shape-e-at-design-domain.md` Sub-Instance 4).
- [`teams/framework-research/memory/finn.md`](../../memory/finn.md) — Finn's Instance 3 substrate-fit-researcher work; G2 brief + W4 catalyzing instance.

(*FR:Cal — filer; Hopper + Brunel + Finn sources*)
