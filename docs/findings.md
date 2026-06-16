---
name: cloudflare-claude-managed-agents-substrate-gap-analysis
description: Joint Brunel + Volta substrate-gap-analysis. FR-as-multi-agent-coordination-layer-above-single-agent-substrates positioning + bottleneck-alignment principle n=3 + cluster-decomposition meta-principle + Sub-shape E n=2.
type: finding
source-agents:
  - brunel
  - volta
discovered: 2026-05-25
ratified: 2026-05-25
ratifying-events:
  - "2026-05-25 13:25 Aen joint-report acceptance"
  - "2026-05-25 13:35 Aen polish-pass acceptance"
  - "2026-05-25 13:50 Aen Edit-7 micro-amendment acceptance"
status: active
source-files:
  - teams/framework-research/memory/brunel.md
  - teams/framework-research/memory/volta.md
  - teams/framework-research/memory/hopper.md
  - teams/framework-research/wiki/patterns/three-layer-substrate-truth-discipline.md
  - https://blog.cloudflare.com/claude-managed-agents/
cross-links:
  - teams/framework-research/wiki/patterns/three-layer-substrate-truth-discipline.md
  - teams/framework-research/wiki/patterns/discriminator-anchored-on-sub-canonical-source.md
  - teams/framework-research/wiki/process/companion-pair-submission-protocol.md
joint-authorship:
  brunel: containerization angle (§S3 + §S5 + §S7; spine finding 1 + 3; matrix columns 3 + 5 + apex/FR/Cortex-MCP column 4; drift-surface redistribution table; Cal candidate B1/B2/B3; Preamble)
  volta: lifecycle angle (§S2 + §S4 + §S6; spine finding 2 -- n=3 across two domains; migration-path-per-team paragraph; matrix column 2 + mvox-dev column 4; shutdown-bifurcation table; Cal candidates 5/6/7 + E4)
filed-by: callimachus
last-verified: 2026-05-26
---

# Cloudflare Claude Managed Agents -- Substrate Gap Analysis (joint Brunel + Volta)

**Joint Brunel + Volta finding.** This is a research finding, not a wiki pattern entry -- it sits at `docs/findings.md` per common-prompt §Shared Knowledge to host cross-cutting research that hasn't yet decomposed into wiki-grade pattern entries. Eight follow-on Cal-Protocol-A submission candidates (4 new + 4 extensions) are catalogued in §S7 for separate filing into the wiki.

## §S1 -- Decision up-front

Cloudflare's Claude Managed Agents announcement validates FR's framework layering: the industry primitive provides intra-agent state continuity at the substrate layer; FR's framework provides inter-agent state coordination above it. We stack, not compete. The boundary is now nameable and operationally usable -- independent of any adoption decision. Operationalized: the primary decomposition lens is **substrate-state vs framework-state**, NOT V8-vs-microVM. V8-vs-microVM is the substrate-class-fit gate (*could-we?*); substrate-state-vs-framework-state is the per-team-bottleneck-fit determination (*should-we?*). Sequential, not parallel.

Convergence of multiple substrate offerings (Cloudflare, MCP, Replit Agent, Code Interpreter) on the same boundary is itself evidence of where the industry primitive ends. Per-team adoption is bottleneck-driven, not vendor-driven. The bottleneck-aligned adoption principle is corroborated at **n=3 across two domains** (discipline-domain n=2 from S35; substrate-domain n=1 from this dispatch). The rule has two conditions, both required: the team's bottleneck must match the substrate's strength AND the team's workload must fit the substrate's constraints.

**One conditional pilot candidate: apex-research.** Highest bottleneck-alignment with Cloudflare's substrate strengths -- proxy-injected secrets would be the **structural automation of the highest-procedural-cost substrate ceremony in FR's inventory** (S34 credential-cluster volatility + chown-on-cold-start ceremony). Workload fits microVM substrate-class. **Pilot is the research-grade experiment to resolve the credibility-floor ambiguities, NOT an adoption recommendation.** Adoption decision follows experiment outcome, not preceding it. mvox-dev, framework-research, Cortex-MCP: substrate change is not the lever -- see §S3 migration-paths.

**Framework-clarity benefit lands regardless of any adoption decision.** Cloudflare's existence forces the substrate-vs-framework boundary into the open. PO + Aen + future operators get a sharper line to reason against; the cluster-decomposition meta-principle (§S4) and bottleneck-alignment principle become operationally usable BECAUSE the line is now nameable. The cluster-decomposition meta-principle in §S4 is **the strongest framework-grade finding of this dispatch -- generalizing beyond Cloudflare, beyond mVox, beyond Sub-shape E**. This benefit is real and immediate -- adoption optional.

## Preamble -- Credibility floor

This analysis is bounded by what the Cloudflare blog post explicitly says, verified by Volta's WebFetch on 2026-05-25. **Four load-bearing claims the announcement does NOT make** are flagged as load-bearing-implicit; any downstream we-as-target adoption decision is conditional on these gaps being resolved via direct experiment or fresh Cloudflare-docs reads:

1. **State survives session sleep** is EXPLICIT.
2. **State survives distinct-session-termination** is IMPLICIT.
3. **Sandbox identity continuity across distinct sessions** is IMPLICIT.
4. **Cloudflare lifecycle mode (automatic-vs-API-driven)** is IMPLICIT.

Announcement-grade source is *outer-layer pass-through*; substrate-truth is *inner-layer parser*. Recovery posture from [`wiki/patterns/discriminator-anchored-on-sub-canonical-source.md`](../teams/framework-research/wiki/patterns/discriminator-anchored-on-sub-canonical-source.md) generalizes from identifier-grammar to evidence-layer.

**Dual-perspective discipline** (per PO 2026-05-22): we-as-target (adoption decisions bounded by credibility-floor); we-as-researchers (the credibility-floor itself is a finding -- what announcement says vs leaves implicit IS the substrate-truth boundary at this evidence-layer).

## §S2 -- Substrate-vs-framework boundary

**Synthesis spine (3 findings composing to one framework-grade conclusion):** (i) the three-layer substrate model is substrate-class-invariant -- §S5 confirms at n=2; (ii) bottleneck-determines-adoption is n=3 across two domains with two-condition rule -- §S3 illustrates; (iii) intra-agent state continuity is industry primitive, inter-agent state coordination is FR's framework -- §S2 expands. Each finding instantiates the cluster-decomposition meta-principle (§S4).

**Primary decomposition lens: substrate-state vs framework-state.** V8-vs-microVM is a *gate* (could we run); substrate-state-vs-framework-state is the *decomposition* (does Cloudflare's automation move this team's actual bottleneck -- should we adopt). Sequential, not parallel.

**Two-condition rule for adoption:** team's bottleneck matches substrate's strength AND team's workload fits substrate's constraints. Both required; neither sufficient.

**What FR remains responsible for under managed substrate:** cross-session identity continuity (roster.json + config.json contract); cross-session intent carry-forward (M1 NEXT SESSION seed; M2 task-list-snapshot Notes column); inter-agent coordination protocols (SendMessage routing, dispatch ladders); role-of-record discipline; framework-layer pruning + promotion + wiki absorption; cross-team observation methodology (S35 thread 4 credibility-floor discipline).

**Mechanical materialization across two axes:** lifecycle-step axis (Volta §V3 shutdown-bifurcation table -- S1-S5 split between substrate-managed-collapsing and framework-layer-persisting); layer-ownership axis (§S5 drift-surface redistribution table). Same boundary; both axes; mechanically visible.

**Framework-clarity benefit independent of adoption:** pre-Cloudflare, FR's discipline conflated "what the runtime does" with "what FR's framework does" because we owned both. Post-Cloudflare-availability, the line is forced into the open. PO + Aen + future operators get a sharper boundary to reason against.

### §V3 shutdown-bifurcation table (lifecycle-step axis)

| Step | Survives under Cloudflare? | Why |
|---|---|---|
| S1 (halt) | Survives (renamed). | Cloudflare's sleep is equivalent -- agents stop accepting work; sandbox enters persisted state. |
| S2a (own scratchpad) | Survives unchanged. | Framework-layer; Cloudflare doesn't manage scratchpad content. |
| S2b (task snapshot) | Survives unchanged. | Framework state, not session state. |
| S2c (shutdown requests) | Does NOT collapse. | S2c IS a multi-agent coordination primitive; substrate cannot supply what its scope excludes. |
| S3 (collect terminated) | Collapses to substrate. | Sandbox lifecycle becomes Cloudflare's concern. |
| S4 (persist inboxes + commit + push) | Partial collapse. | Substrate-state persistence automatic; team-repo git operations remain framework-procedural. |
| S5 (TeamDelete) | Collapses to substrate. | Cloudflare's session-end is equivalent. |

## §S3 -- Bottleneck-to-substrate-choice matrix + apex thought experiment + migration paths

**Scoping:** matrix narrowed to 4 representative cases spanning the bottleneck-alignment spectrum. hr-devs, raamatukoi-dev, comms-dev, polyphony-dev, esl-legal, uikit-dev are future-mapping work pending Layer-1 substrate-truth fill (first-dispatch three-layer probe-suite per Hopper-Amendment-4 discipline) -- *and that future mapping will validate the four-row pattern at larger n; the matrix's predictions are testable against any future-mapped team*. bigbook-dev excluded -- single-team-lead project at a different governance layer, not FR-shipped-substrate-scoped.

**Per-cluster prediction:** if FR were to adopt Cloudflare's cluster bottleneck-aligned, **observability-by-default would be the first adoption** -- same shape as FR adopting mVox's M1 first. Same principle (least-distinctive-but-highest-leverage), different domain.

| Team | Dominant lifecycle bottleneck | Addressable by Cloudflare? | Substrate winner | Sub-shape E drift surfaces post-migration |
|---|---|---|---|---|
| **apex-research** | Credential-cluster volatility (S34 apex-keys catalyzing arc -- 3 SSH keys + tunnel-token + GITHUB/ATLASSIAN/ANTHROPIC tokens + chown-on-cold-start ceremony, all co-dependent at recreate). Highest-procedural-cost substrate in FR inventory. Bottleneck IS substrate-shaped (secrets-cluster-shaped + lifecycle-ceremony-shaped). | **Partially YES.** Proxy-secrets injection addresses highest-procedural-cost case (collapses L2↔L3 drift surface for proxy-bound subset; S34 multi-system-failure surface cannot recur). Workload: Oracle clients + multi-process Python+Node → microVM-only fit; V8 ruled out. | **Conditional: Cloudflare microVM wins on procedural-cost grounds, IF credibility-floor ambiguities resolve.** Highest-bottleneck-alignment case for proxy-secrets pattern. The research-grade experiment to resolve credibility-floor IS the pilot; adoption decision is bounded by it. | L1↔L2 persists. **L2↔L3 credential-class drift collapses entirely** for proxy-bound secrets. L2↔L3 tool/version drift persists (Oracle provisioning skew). L1↔L3 mediation shifts to Cloudflare. |
| **mvox-dev** | High-velocity Bentham YELLOW review cycle; quality-gate-with-trigger-events as M3 backbone. Bottleneck is *discipline-shaped (M3-shaped per S35)*, not substrate-shaped. Substrate-change wouldn't move the needle. | **Largely NO.** M3 is framework-layer discipline, not substrate-managed property. **Structurally interesting duality:** mvox-dev's app is V8-isolate-fit (existing prod stack on Cloudflare Pages + Workers); mvox-dev's agent team is microVM-fit. First team in matrix where own product sits in Cloudflare's V8 space while agent substrate doesn't, IF substrate-consolidation ever surfaces as a team-property change. | **Self-managed (Docker-on-RC); substrate isn't the bottleneck.** | L1↔L2 persists. L2↔L3 credential drift would collapse for any proxy-bound subset but credential cluster structurally smaller. No meaningful drift-surface payoff because adoption verdict NO. |
| **framework-research** (this team) | Team-lead reorientation tax at session start (S35 M1 adoption catalyzing observation); cross-session deliberation-state heavy. Bottleneck is *M1-shaped (cognitive bottleneck at session boundary)*, decisively not substrate-shaped. | **NO. Bottleneck-misalignment case.** Per §V4: M1 is NOT displaced by Cloudflare's substrate-state persistence -- operates at different layer. Workload: multi-agent process model + tmux-pane backend → microVM-only fit. | **Self-managed (Docker-on-RC) wins decisively.** Meta-instance demonstrating adoption is bottleneck-driven, not vendor-driven. | L1↔L2 persists. No meaningful drift-surface payoff because adoption verdict NO. |
| **Cortex-MCP** | Request-response server pattern; substrate-state request-scoped not session-scoped; minimal credential-cluster surface. Bottleneck is *substrate-class-fit-shaped* (hypothesis-grade row; Layer-1-absent flag). | **Substrate-class hypothesis: V8-isolate candidate.** MCP is request-response server pattern; V8 isolates well-suited (sub-second boot, no Linux process model). | **Conditional on Layer-1 fill; V8-isolate fit hypothesis-only.** | L1↔L2 persists. L2↔L3 credential drift may not be load-bearing (MCP credentials typically narrow). |

### Apex-research procedural-to-structural conversion thought experiment

Current credential cluster (substrate-state, ~10 env vars): GITHUB_TOKEN, ANTHROPIC_API_KEY, ATLASSIAN_EMAIL/API_TOKEN/BASE_URL, TUNNEL_TOKEN, SSH_PUBLIC_KEY/_2/_3.

Post-migration (proxy-state, 0-3 sandbox-config bindings): GITHUB → github.com proxy-binding; ANTHROPIC → api.anthropic.com proxy-binding; ATLASSIAN_* → evr.atlassian.net proxy-binding; TUNNEL_TOKEN → does not exist (cloudflared sidecar gone); SSH_PUBLIC_KEY_* → either gone (Cloudflare observability surface) or sandbox-config.

**Substrate-state reduction: ~10 vars → 0-3 sandbox-config bindings.** S34 multi-system-failure surface (recreate wipes credential cluster) goes away entirely for proxy-bound subset. This is the substrate-side restatement of S35 delta-3 -- *"structural backing is required when procedural cost > immediate value"* -- apex-research IS the canonical case.

### Migration-path-per-team

**apex-research -- PILOT CANDIDATE (conditional on Q1+Q2 credibility-floor resolution).** Highest bottleneck-alignment. Migration value: structural automation of highest-procedural-cost substrate ceremony in FR's inventory. Pilot IS the experiment to resolve credibility-floor; adoption decision follows experiment outcome, not preceding it.

**mvox-dev -- CAN'T-MOVE-THE-NEEDLE.** Bottleneck M3-shaped (framework-state). Cloudflare's substrate automation would not address what's actually constraining mvox-dev.

**framework-research -- CAN'T-MOVE-THE-NEEDLE.** Bottleneck M1-shaped. Migration value: clarity benefit only -- boundary forced into open.

**Cortex-MCP -- SHOULDN'T-MIGRATE-YET (Layer-1-absent gate).** First-dispatch three-layer probe-suite precedes any migration assessment.

## §S5 -- Sub-shape E cross-substrate-class confirmation

Three-layer substrate-truth model (S34 catalyzing arc, joint Brunel + Hopper, [`wiki/patterns/three-layer-substrate-truth-discipline.md`](../teams/framework-research/wiki/patterns/three-layer-substrate-truth-discipline.md)) decomposes FR-shipped substrates along three ownership loci. Under Cloudflare-managed substrate, three layers persist; source-of-record shifts:

- **Layer 1 (design ownership): stays with FR.**
- **Layer 2 (operational ownership): stays with consumer team; artifact form changes** (zod-schema tool declarations + proxy-binding declarations + microVM-vs-V8 + secret-binding cardinality instead of compose-yml + .env).
- **Layer 3 (substrate/runtime ownership): SHIFTS from consumer team to Cloudflare-as-substrate-provider.**

### Drift-surface redistribution table (companion to §V3 shutdown-bifurcation)

| Drift surface | Docker-on-RC (S34 baseline) | Cloudflare-managed | Change |
|---|---|---|---|
| L1↔L2 | Design intent vs operational form (SLOT 3 in compose-yml not in FR design, S34 P1.2c) | Persists. FR design declares N proxy-bindings; sandbox-config has M ≠ N | Persists; mechanics differ |
| L2↔L3 credential-class state | Layer 2 .env vs Layer 3 Config.Env mismatch (S34 GH_TOKEN-not-declared multi-system-failure surface) | **COLLAPSES.** Proxy-bound secrets owned by Cloudflare | Disappears for proxy-bound subset; S34 surface cannot recur |
| L2↔L3 tool/version state | Layer 2 declares N tools; Layer 3 runtime has M ≠ N due to provisioning skew | Persists. Sandbox-config declares N; runtime has M ≠ N due to provider provisioning skew | Persists; mechanics shift |
| L1↔L3 (mediated) | Mediates through consumer-team-as-L3-owner | Mediates through Cloudflare-as-L3-owner | Mediation ownership shifts; drift mechanics persist |

**Sub-shape E observed at n=1 (Docker-on-RC, S34 apex-keys arc) is now confirmed at n=2 (Cloudflare-managed, this dispatch).** Three-layer model is substrate-class-invariant. Drift surfaces redistribute predictably when ownership locus shifts; surfaces themselves persist. First-dispatch three-layer probe-suite (Hopper-Amendment-4) remains correct operator-defense -- different probe shapes per substrate-class.

**Wiki upgrade trigger:** [`wiki/patterns/three-layer-substrate-truth-discipline.md`](../teams/framework-research/wiki/patterns/three-layer-substrate-truth-discipline.md) confidence promoted from medium to medium-high.

## §S4 -- Cluster-decomposition meta-principle

**Strongest single finding from this dispatch:** clusters decompose along their coupling-dimension; the coupling-dimension is the load-bearing property to identify when observing any cluster.

**Origin observation 1 (S35 discipline-domain).** mVox M1-M5 each couples to a different team-property: M1↔team-lead-cognitive-bottleneck; M2↔task-list-corruptibility; M3↔quality-gate-with-trigger-events; M4↔named-absorption-sink; M5↔audit-trail-as-value.

**Origin observation 2 (this dispatch, substrate-domain).** Cloudflare's 7-mechanism cluster each couples to a different team-property: V8↔high-concurrency-low-state; microVM↔Linux-tool-dependency; sandbox-per-session↔short-lived-session-scoped-work; state-persistence↔stateful-pause-resume; proxy-secrets↔volatile-credential-cluster; brain-hands↔substrate-cost-sensitivity; observability↔every-team.

**Origin observation 3 (S34, ownership-locus domain -- Brunel + Hopper joint).** Sub-shape E's 3 layers couple to different ownership-loci: L1↔design-ownership (FR); L2↔operational-ownership (consumer team); L3↔substrate/runtime-ownership (consumer team at Docker-on-RC n=1; Cloudflare-as-substrate-provider at Cloudflare-managed n=2).

**The meta-principle:** three different clusters, three different coupling-dimensions (team-property + team-property + ownership-locus), same structural relation -- each component maps to exactly one distinguishable property of the system being analyzed. When that mapping holds cleanly, the cluster decomposes; when it doesn't, the cluster is monolithic.

**Methodology corollary (sub-finding):** decompositions are invisible at n=1; emerge at n=2 with second instance providing the variation along the coupling-dimension. mVox M1-M5 looked monolithic from inside mVox-dev; decomposed cleanly when mapped against FR + apex at S35 thread-3.

**Operational consequence:** when observing a future cluster, the right first move is to identify the coupling-dimension. Once identified, cluster decomposes predictably; once decomposed, bottleneck-alignment (§S3) determines which subset is high-leverage for the adopter.

**This is the strongest framework-grade finding of the dispatch -- generalizes beyond Cloudflare, mVox, Sub-shape E contexts.**

Per §V3 table at lifecycle-step level / per §S5 table at layer-ownership level -- substrate-vs-framework boundary materializes mechanically across both axes.

## §S6 -- Open research questions

**Q1 -- Cross-session identity continuity under managed substrate (credibility-floor open).** Article silence on session-reattachment is load-bearing. Bounds adoption decision.

**Q2 -- Distinct-session-termination state survival (credibility-floor open).** Same bound.

**Q3 -- Substrate-vs-framework boundary shift over time.** Which framework-layer surfaces are *intrinsically* framework vs *currently* framework-but-collapsible? Likely intrinsic: inter-agent coordination, role-of-record, intent carry-forward, cross-team observation methodology. Likely currently-framework-but-collapsible: per-session state persistence, sandbox lifecycle, secrets injection. Hold for n=2 substrate-vendor evidence.

**Q4 -- FR-experiment-counterpart to FR-A1 procedural-only adoption.** Pilot Cloudflare adoption on apex-research; measure whether substrate automation moves the team's actual bottleneck. If yes -- bottleneck-driven substrate selection corroborated (cross-domain confirmation S35 thread-3). If no -- bottleneck wasn't substrate-shaped after all. **Research-grade follow-up; NOT an adoption recommendation.** Adoption decision bounded by Q1+Q2.

**Q5 -- Failure curve for procedural-only adoption at substrate layer.** Cousin to S35 thread-2. Would FR procedural-only reimplementation of Cloudflare-style automation (e.g., custom auth-proxy + key vault for proxy-injected secrets) sustain? Predicted result per delta-3: would drift, same shape as mVox-M4. Speculative-but-falsifiable.

**Q6 -- Industry primitive convergence as multi-offering evidence.** Cloudflare, MCP, Replit Agent, Code Interpreter all stop at same line. Promotable to wiki-grade if/when fifth substrate offering confirms same boundary.

## §S7 -- Cal-Protocol-A submission candidates (pooled: 4 new + 4 extensions)

These are submission candidates routed for separate Cal wiki authoring; this section catalogues them for tracking and cross-reference. Per Aen's 2026-05-26 09:50 dispatch, Cal sequences absorption per her bandwidth (task #9).

### New wiki entries

**C1 -- Cluster-decomposition meta-principle.** Working title: *"Clusters decompose along their coupling-dimension; the coupling-dimension is the load-bearing property to identify."* Joint Brunel + Volta. **Strongest framework-grade finding.** Confidence medium-high.

*Sub-finding (methodology corollary):* decompositions are invisible at n=1; emerge at n=2 with second instance providing the variation along the coupling-dimension. This explains why mVox M1-M5 looked monolithic from inside mVox-dev but decomposed cleanly when mapped against FR + apex-research at S35 thread-3; same shape applies to any future cluster observation -- single-instance cluster observation is the wrong unit of analysis.

**C2 -- Substrate-vs-framework boundary primitive.** Working title: *"Substrate-vs-framework boundary as named primitive."* Volta §V6 + Brunel cross-confirmation. Confidence medium-high.

*Bounded extension:* "brain-hands decoupling" (Cloudflare vocabulary) is the substrate-side name for the boundary C2 names from the framework side. Productive terminology-fold both directions; bounded by the layering claim.

**C3 -- Industry-primitive-convergence-as-evidence.** Working title: *"Convergence of multiple substrate offerings on the same boundary IS evidence of where the industry primitive ends."* Brunel B1 (distinct from C2). n=4 substrate offerings (Cloudflare, MCP, Replit Agent, Code Interpreter). Confidence medium. Hold for n=5 fifth-substrate-offering watch.

**C4 -- Bottleneck-determines-X cross-domain.** Working title: *"Bottleneck-alignment is cross-domain: discipline adoption AND substrate adoption follow the same structural rule."* Joint Brunel + Volta. n=3 across two domains. Confidence medium-high.

### Extensions to existing entries

**E1 -- [`three-layer-substrate-truth-discipline.md`](../teams/framework-research/wiki/patterns/three-layer-substrate-truth-discipline.md) extension.** Sub-shape E cross-substrate-class confirmation (n=1 Docker-on-RC → n=2 Cloudflare-managed). Confidence-promotion medium → medium-high.

**E2 -- [`relay-to-primary-artifact-fidelity-discipline.md`](../teams/framework-research/wiki/patterns/relay-to-primary-artifact-fidelity-discipline.md) extension.** Announcement-grade source as outer-layer pass-through (evidence-layer extension). Cross-link to [`discriminator-anchored-on-sub-canonical-source.md`](../teams/framework-research/wiki/patterns/discriminator-anchored-on-sub-canonical-source.md).

**E3 -- S35 candidate-2 (cross-session-deferred-state-primitive) edit.** Carry-forward primitive bifurcates substrate-layer + framework-layer (per Volta §V4).

**E4 -- extension to active-supersession-on-cross-in-flight pattern (Aen S35-end origin). DYAD variant:** in deeply-aligned dyads, crossed messages between agents are a healthy-velocity signal of mutual prediction-accuracy, not miscommunication. Reconcile by mapping the convergence rather than re-litigating the framing. Aen's pattern addressed solo-agent supersession of its own prior outputs; this dyad variant addresses two-agent crossed messages in a deeply-shared frame. Evidence: this dispatch produced ~10 crossed-in-flight passes across Brunel + Volta with substantive content converging in every pass -- reconciliation cost was borne in pass-count, not content-drift. Sub-pattern under joint-pair-as-unit-of-coordination.

*Sub-finding (recovery mechanism):* when message-overlap accumulates beyond ~3 passes, fast-forward maps consolidate state in a single read. This is the natural recovery mechanism, not full message-replay. The 17:25 fast-forward map in this dispatch successfully consolidated 5-messages-worth of state in one read at the receiving end; the recipient's acknowledgment of state at the correct point ("Pass-6 fast-forward map received") confirms the mechanism operates. Two recovery mechanisms named: (i) team-lead intervention at ~5+ passes (Aen 13:14); (ii) dyad-side fast-forward maps at ~3+ passes (Volta 17:25). Both empirically demonstrated.

## Joint attribution

**Brunel + Volta, joint dispatch task #7, 2026-05-25.**

- **Brunel:** containerization angle (§S3 + §S5 + §S7); spine finding 1 + 3; matrix columns 3 + 5 + apex/FR/Cortex-MCP column 4; drift-surface redistribution table; Cal candidate B1 + B2 + B3; Preamble.
- **Volta:** lifecycle angle (§S2 + §S4 + §S6); spine finding 2 (n=3 across two domains); migration-path-per-team paragraph; matrix column 2 + mvox-dev column 4; shutdown-bifurcation table; Cal candidates 5/6/7 + E4.

Coordination via direct DM per §Handshake Protocol. Joint report ratified by Aen 2026-05-25 13:25; polish-pass amendments (folds 1-7) ratified by Aen 2026-05-25 13:35 + 13:50.

Filed by Callimachus 2026-05-26 from `teams/framework-research/memory/dispatch-task-7-artifact.md` (transient intermediate artifact, archived post-write per Aen's 2026-05-26 09:50 dispatch).

(*FR:Cal -- filer; Brunel + Volta source*)
