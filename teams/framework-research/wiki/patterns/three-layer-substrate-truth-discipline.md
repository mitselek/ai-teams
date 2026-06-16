---
source-agents:
  - brunel
  - hopper
  - callimachus
discovered: 2026-05-20
filed-by: librarian
last-verified: 2026-05-26
status: active
confidence: medium-high
source-files:
  - teams/framework-research/docs/operations-log-2026-05.md
  - teams/framework-research/memory/brunel.md
  - teams/framework-research/memory/hopper.md
  - teams/framework-research/prompts/hopper.md
  - docs/findings.md
source-commits: []
source-issues: []
related:
  - patterns/discriminator-anchored-on-sub-canonical-source.md
  - patterns/substrate-invariant-mismatch.md
  - patterns/sub-shape-e-at-design-domain.md
  - patterns/cluster-decomposition-meta-principle.md
  - gotchas/dual-team-dir-ambiguity.md
amendments:
  - date: 2026-05-26
    change: "E1 extension folded -- Sub-shape E cross-substrate-class confirmation at n=2 (Docker-on-RC n=1 + Cloudflare-managed n=2 per docs/findings.md §S5). Confidence promoted medium → medium-high. Layer 3 ownership-locus framing clarified: consumer team at Docker-on-RC, Cloudflare-as-substrate-provider at Cloudflare-managed (per Brunel polish-fold #3). Concurrent staleness refresh on §Why-insufficient + Composition + Related sections -- post-Hopper-Amendment-4 (Celes-landed 2026-05-25) the prompt now folds three-layer reading; back-references updated from 'reads Layer 1 only' to 'pre-Amendment-4 baseline read Layer 1 only' historical framing."
  - date: 2026-05-26
    change: "Item 2.6 amendment -- added §Cross-review independent-surfacing in design-domain (2026-05-26). The discipline applies one layer up at FR's own design domain: four independent exec-readiness reviews of the Cloudflare-pilot design (Volta lifecycle.md + Herald comms.md + Brunel substrate.md + Brunel+Hopper docs-Layer-0-recursive-descent bypass arc) surfaced Sub-shape E at four distinct layer-pair-points within ~2 hours. Cross-link to canonical articulation in `patterns/sub-shape-e-at-design-domain.md` (joint Volta + Herald + Brunel + Hopper + Cal-filer). Cumulative drift instance count: n=3 within-arc (apex-keys S34) + n=4 design-domain (S36 cross-review) = n=7 instances; substrate-class-coverage extends from Docker-on-RC + Cloudflare-managed to a third surface (design-domain itself). Recursive structure noted: within 36 hours of Hopper-Amendment-4 landing, the discipline catches its own authors at the layer above where it was authored. Added `sub-shape-e-at-design-domain.md` + `cluster-decomposition-meta-principle.md` to related-frontmatter."
---

# Three-Layer Substrate-Truth Discipline

For FR-shipped substrates that consumer teams operationalize, the substrate exists in **three distinct layers** that can drift from each other independently. Reading only one layer -- even the canonical FR-design layer -- is insufficient for first-dispatch substrate-truth: drift between layers produces silent mismatches that single-layer reads cannot detect.

The discipline has two halves, joint-authored: **Brunel's architectural distinction** (the three layers and the drift surfaces between them) is the structural backbone; **Hopper's operator-defense pattern** (first-dispatch Tier R three-layer probe-suite mandatory; subsequent-dispatch scratchpad-read-first) is the actionable enforcement at the operator gate.

## The Three Layers

Each layer is **canonical for a different question**. Confusing which layer is canonical for which question is itself part of the failure mode.

### Layer 1 -- FR design-as-shipped

- **Location:** `designs/deployed/<team>/container/*` in `mitselek/ai-teams` (this repo).
- **Contents:** Dockerfile, `docker-compose.yml`, entrypoint scripts (`entrypoint-<team>.sh`), `.env.example`, sibling design docs.
- **Canonical for:** design lineage -- what FR shipped, what the substrate was designed to be at deployment time.
- **NOT canonical for:** what next `docker compose up` will actually do (the consumer team may have amended the operational copy); what is currently in container Config.Env (runtime drift from operational compose-yml is independent).

### Layer 2 -- Consumer-team operational copy

- **Location:** the substrate host's compose directory (e.g., `/home/dev/github/apex-migration-research/` on the apex RC host); discovered authoritatively via `docker inspect` label `com.docker.compose.project.working_dir`, NOT inferred from FR's design path.
- **Contents:** operational `docker-compose.yml` (may diverge from FR design), `.env` (may exist or not; may differ from any `.env.example` template), entrypoint scripts (may be amended), `.git/` (if the consumer team versions their copy).
- **Canonical for:** what `docker compose config` would resolve and what next `docker compose up` would actually deploy.
- **NOT canonical for:** design intent (Layer 1 is canonical); what's currently serving (Layer 3 carries state from before any operational mutation).

### Layer 3 -- Running container state

- **Location:** the running container itself -- `docker inspect <ctr>` for Config.Env, labels, mount table; `docker exec <ctr> <probe>` for in-container filesystem and process state.
- **Contents:** Config.Env (resolved at container-create time from the then-current Layer 2), mounted volumes (named-volume contents, bind-mount sources), in-process state (sshd authorized_keys as installed by entrypoint, in-container service state).
- **Canonical for:** what is currently serving traffic; what credentials/keys/state the running container actually has.
- **NOT canonical for:** what next recreate will produce (Layer 2 governs that; current Config.Env may be stale relative to current Layer 2 if Layer 2 was mutated post-container-create); design intent (Layer 1).

## Drift Surfaces

The three layers can drift from each other in **two structural directions** observed in the S34 apex-keys dispatch arc: L1 ↔ L2 (FR-design vs consumer-team-operational) and L2 ↔ L3 (operational vs runtime). A third direction (L1 ↔ L3) is mediated by Layer 2 in normal operation; it surfaces only when Layer 2 has itself drifted from Layer 1 and a recreate has frozen the L2-as-was-then state into L3.

**Drift instances surfaced in the S34 arc:**

| Instance | Layer-pair | What | Resolution state | Surfaced at |
|---|---|---|---|---|
| 1 | L1 ↔ L2 | SLOT 3 (`SSH_PUBLIC_KEY_3`) slot in operational compose-yml not in FR design's `docker-compose.yml:47-60` | Permanent (PO designated SLOT 3 reserved; populated this dispatch) | P1.2c 2026-05-20 17:35 |
| 2 | L1 ↔ L2 | `GH_TOKEN` declaration in operational compose-yml not in FR design | Permanent post-P4.05 (PO Option B preservation) | P4.05 amendment 2026-05-21 09:18 |
| 3 | L2 ↔ L3 | `GH_TOKEN` (and `TUNNEL_TOKEN`) in `.env` (Layer 2) but not rendered via `docker compose config` (the Layer-3 projection through compose-yml's env block) | Resolved P4.05 for `GH_TOKEN`; intentional L2-only for `TUNNEL_TOKEN` (cloudflared service-domain, not apex-research) | P3.7 2026-05-20 19:22 |

### Why the L2 ↔ L3 drift is structurally important

**Recreate is the substrate's drift-resolution event AND the multi-system failure surface if Layer 2 is degraded.** Before P4.05, Layer 3 carried `GH_TOKEN` (baked at fresh-clone time from a then-current Layer 2 we no longer have); operational compose-yml's `environment:` block did NOT declare `GH_TOKEN`. Recreate against the operational compose-yml as-was would have wiped `GH_TOKEN` from Config.Env. P4.05 Tier M amendment added `- GH_TOKEN=${GH_TOKEN:-}` to Layer 2 to declare the L3 value at Layer 2 and preserve it across recreate per PO Option B direction.

The precursor of this drift surfaced at session-start: Layer 2 had **no `.env` at all** at `$COMPOSE_DIR`; Layer 3 had SLOT 2 populated and the full credential cluster (GITHUB_TOKEN, ATLASSIAN_API_TOKEN, TUNNEL_TOKEN) baked in. `docker compose config` rendered all three SSH SLOTS empty (Layer 2 view); `docker inspect ... --format '{{range .Config.Env}}...'` showed SLOT 2 with PO's key (Layer 3 view). Recreate under empty Layer 2 would have wiped the runtime credential cluster -- the multi-system failure surface that catalyzed the dispatch arc.

The structural property: **Layer 2 mutations on next recreate become Layer 3 truth; Layer 3 state that has no Layer 2 declaration is wiped silently.** Without three-layer awareness, this drift is invisible to single-layer reads of any one layer -- Layer 1 says nothing about it; Layer 2 alone says "the env block doesn't declare GH_TOKEN, fine"; Layer 3 alone says "GH_TOKEN is present, fine." The mismatch lives at the **pair boundary**, not at any single layer.

## Why single-layer read-deployed-artifacts discipline is insufficient

Brunel's earlier S33+ read-your-own-deployed-artifacts discipline (pre-Amendment-4 form) read **Layer 1 only**. It correctly said: before executing against an FR-deployed substrate, read `designs/deployed/<team>/container/*`. That discipline catches single-layer drift surfaces where Layer 1 contradicts the dispatch's stated tier or expected outcome.

Single-layer Layer 1 reading does NOT catch:
- **Layer 1 ↔ Layer 2 drift** -- Layer 1 reads cleanly; operational Layer 2 has diverged. The dispatch may reference behavior that Layer 1 describes but Layer 2 has overridden (or vice versa).
- **Layer 1 ↔ Layer 3 drift** -- Layer 1 reads cleanly; runtime carries state Layer 1 never declared. Recreate under Layer 1's design intent would not reproduce Layer 3 state.
- **Layer 2 ↔ Layer 3 drift** -- both Layer 1 and Layer 2 read cleanly with each other; runtime carries state Layer 2 won't reproduce on recreate.

**This is the headline.** FR ships Layer 1; consumer teams operationalize against Layer 2 + Layer 3. FR-design-only discipline is insufficient for FR-shipped substrates that consumer teams operationalize. Hopper's prompt now folds the full three-layer Diagnostic Discipline ([Hopper-Amendment-4](../../prompts/hopper.md#diagnostic-discipline--three-layer-substrate-truth-reading-before-executing), landed by Celes 2026-05-25, prompt lines 130-211) and references this wiki entry as the canonical articulation. The pre-Amendment-4 Layer-1-only form remains historically accurate as the pre-S34 baseline this entry's discipline extends.

## The Operator-Defense Discipline (Hopper)

**Operator-defense discipline.** On the first-ever dispatch against a new substrate, the Operator runs a Tier R three-layer probe-suite -- Layer 1 read of `designs/deployed/<team>/container/*`, Layer 2 read of the consumer team's operational copy on the substrate host (compose-yml, `.env`, entrypoint state at the operational path discovered via `docker inspect` label `com.docker.compose.project.working_dir`), Layer 3 read of running container state (Config.Env, mounted volumes, label cardinality via `docker inspect`). Findings are scratchpad-captured as `[LEARNED -- substrate, <team-name>]` entries with explicit attribution to which layer surfaced each fact. On subsequent dispatches against the same substrate, the Operator reads scratchpad first and only re-probes a layer if (i) the dispatch explicitly directs, (ii) a documented fact looks stale, or (iii) the dispatch's stated tier or expected-outcome contradicts a prior layer-finding (hard-gate trigger). The defense is asymmetric-cheap: a 3-probe round-trip on first-dispatch is bounded; a silent dispatch-execution against unverified layer-state is the failure mode this discipline exists to prevent.

### Probe shapes by layer

| Layer | Probe shape | Example (apex-research S34) |
|---|---|---|
| Layer 1 (FR design) | Read `designs/deployed/<team>/container/*` files; record paths + section-anchors used | `entrypoint-apex.sh:166-196`, `docker-compose.yml:47-60`, `.env.example:13` |
| Layer 2 (operational) | Discover operational path via `docker inspect <ctr> --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}'`; `docker compose config` rendered output at that path; `ls -la $COMPOSE_DIR/.env*`; `cat -n docker-compose.yml`; `find ~/ -maxdepth 4 -name docker-compose.yml -path "*<team>*"` for compose-dir candidates | substrate `$COMPOSE_DIR = /home/dev/github/apex-migration-research`; operational compose-yml exposes SLOT 3; `.env` missing pre-Phase-1-Redux |
| Layer 3 (runtime) | `docker inspect <ctr> --format '{{range .Config.Env}}{{println .}}{{end}}'`; `docker inspect <ctr> --format '{{json .Config.Labels}}'`; `docker exec <ctr> <minimal-probe>` for in-container state | container Config.Env grep showed SLOT 2 populated; JSON-labels dump confirmed compose-project-working-dir; `cat /home/ai-teams/.ssh/authorized_keys` over container-user SSH |

**Reconciliation step:** drift surfaced between layer-reads is named at the layer-pair boundary in the surface-back to tasker BEFORE committing to fix-shape. The dispatch's fix-premise may be valid against one layer and invalid against another; surfacing the drift moves the decision to the tasker rather than collapsing it silently in the operator's classification.

### Pairs with the hard-gate ladder

The probe-suite is a passive read-checklist when read in isolation; it becomes an actionable validation gate when paired with Hopper's Within-Dispatch Agency hard-gate ladder ([`hopper.md` Diagnostic Discipline section](../../prompts/hopper.md)). When a layer-read surfaces drift mid-dispatch, the Operator stops, surfaces back to the tasker with substrate-truth evidence, and does NOT patch from own diagnostic judgment. Surface-back is the recovery posture; silent re-classification is the anti-pattern.

The hard-gate-on-drift articulation is canonical content for the prompt-side amendment (Hopper-Amendment-4, separate Celes-routing task); this entry's operator-defense subsection is the wiki-grade discipline statement that the prompt-side amendment will reference.

## The Architectural Distinction (Brunel)

The three-layer model has structural properties beyond the operator-defense application:

- **The layers are independently versioned.** FR ships Layer 1 via git commits; consumer teams version Layer 2 on their substrate host (possibly via their own git, possibly via ad-hoc mutation); Layer 3 versions via container-create events. Drift between layers is the default state, not the exception.
- **Each layer carries different governance.** Layer 1 changes route through FR's design review; Layer 2 changes route through the consumer team's operational discipline (which may be informal); Layer 3 changes route through whatever process the consumer team uses for container recreates. Three governance surfaces, often three different decision-makers.
- **Recreate is the substrate's drift-resolution event.** When a container is recreated under fresh Layer 2 state, Layer 3 is reset to match. Recreate is the only structural mechanism for L2→L3 drift resolution; absent recreate, L2 mutations are dormant. **This makes the "any recreate against degraded L2" failure mode (S34 catalyzing incident) structurally important** -- the resolution event is also the multi-system failure surface if L2 is degraded.

The architectural property that makes operator-defense necessary: **L1's authority over the substrate's actual behavior is mediated by L2 + L3**. FR can ship a Layer 1 design that the consumer team has fully overridden in Layer 2; FR's design-as-shipped no longer governs the substrate's actual behavior. Single-layer Layer 1 reads conflate design lineage with operational truth.

## Worked Example -- S34 apex-keys Dispatch Arc

The full surface-back chain demonstrates the three-layer discipline producing multi-system failure prevention. Catalyzing incident: [`teams/framework-research/docs/operations-log-2026-05.md`](../../docs/operations-log-2026-05.md), 6 chronological entries (17:09 / 18:05 / 18:22 / 18:46 / 19:23 / 09:18).

### Phase 1 abort (2026-05-20, ops-log 17:09 entry)

Dispatch premise was that operational `.env` existed at `$COMPOSE_DIR` and could be amended in-place with Aleksandr's SSH key. Three-layer probe-suite surfaced:

- **Layer 1:** `designs/deployed/apex-research/container/entrypoint-apex.sh:166-196` describes Step 7 SSH-keys block; `.env.example:13` shows template with `michelek` comment shape; `docker-compose.yml:47-60` shows SLOTS 1+2 only.
- **Layer 2 (P1.2c three-probe diagnostic batch):** no `.env` at `$COMPOSE_DIR`; operational compose-yml exposes a SLOT 3 not present in Layer 1; `docker compose config` resolves all three SLOTS empty.
- **Layer 3:** running container Config.Env has SLOT 2 populated with PO's key (byte-equal to Layer 2's backup `.env` at sibling `$BACKUP_DIR` from 2026-04-29 fresh-clone, but in a different slot -- slot-migration between backup-creation and container-create).

The three-layer reconciliation surfaced the multi-system failure surface: `docker compose up --force-recreate` against current Layer 2 (empty `.env`) would have wiped Layer 3's full credential cluster (GITHUB_TOKEN, ATLASSIAN_API_TOKEN, TUNNEL_TOKEN -- all in Layer 3, none in current Layer 2). Phase 2 sanction package rescinded by Aen at 17:34 pending Phase-1-Redux `.env` reconstruction (Phase 2 re-staged and successful at 09:18 post-P4.05).

### Phase-1-Redux (2026-05-20, ops-log 19:23 entry)

`.env` reconstruction at `$COMPOSE_DIR` to stage Phase-2 recreate without lockout. The `deployed-artifacts-read declaration` section explicitly lists all three layers as the discipline's worked form ([ops-log 19:23 lines 297-301](../../docs/operations-log-2026-05.md)).

### Phase 2 recreate with P4.05 amendment (2026-05-21, ops-log 09:18 entry)

P4.05 Tier M amendment added `- GH_TOKEN=${GH_TOKEN:-}` to operational compose-yml to declare a Layer 3 value (GH_TOKEN present in Config.Env at session-start, not in Layer 2's env block) at Layer 2 -- so Phase 2 recreate would preserve it. **The amendment IS the L2 ↔ L3 drift resolution.** Without three-layer awareness, the GH_TOKEN drift would have surfaced post-recreate as a missing credential; with three-layer awareness, the drift was caught pre-recreate and resolved by Layer 2 amendment.

The 09:18 ops-log entry's `deployed-artifacts-read declaration` section is the canonical worked example of the operator-defense discipline in its mature form. Quoted verbatim from [ops-log lines 386-389](../../docs/operations-log-2026-05.md):

> **Layer 1 (FR design-as-shipped):** session-start reads at `designs/deployed/apex-research/container/entrypoint-apex.sh:166-196` + `docker-compose.yml:47-60` + `.env.example:13` still current.
>
> **Layer 2 (consumer team operational on substrate host):** P4.0 + P4.0 amendment-1 substrate reads at 2026-05-20 19:30-19:33 (compose-yml env block has 14 vars, no GH_TOKEN at Layer 2 pre-amendment; Dockerfile.apex has no ENV directives). P4.05 amendment ADDED `- GH_TOKEN=${GH_TOKEN:-}` to apex-research env block (Layer 2 now declares GH_TOKEN). P4.1 indentation probe at 09:13 confirmed 2-space service-key indent.
>
> **Layer 3 (running container Config.Env):** P3.5 + P3.1 + P4.1(b) substrate-static checks all confirmed PO key in SLOT 2 byte-equal to documented value pre-recreate. Post-recreate P4.4 shows new Config.Env with all 3 SSH slots + GH_TOKEN populated per the amended Layer 2 declaration + .env values.
>
> **Audit-trail artifacts (this repo):** operations-log-2026-05.md (Hopper-authored; current -- 6 entries including this one), apex-keys-diff-2026-05-20.md (Hopper at 2026-05-20 18:44), hopper.md scratchpad (current).

Three discipline properties materialize in this declaration:

- **Layer-specific path attribution.** Each layer bullet names the artifacts read at that layer; the reader can audit the substrate-truth source for any claim downstream in the dispatch.
- **Drift-at-the-pair-boundary is named explicitly.** Layer 1 reading "design has SLOTS 1+2 only"; Layer 2 reading "operational compose-yml ADDED `- GH_TOKEN=${GH_TOKEN:-}`"; Layer 3 reading "Config.Env shows all 3 SSH slots + GH_TOKEN populated per the amended Layer 2 declaration." The drift between L1 and L2 is stated; the resolution from L2 amendment to L3 post-recreate is stated. The discipline is the discipline of naming the layer-pair drift, not just listing the per-layer reads.
- **Audit-trail completeness.** The declaration extends beyond the three substrate layers to name the FR-side audit artifacts (ops-log, diff artifact, scratchpad) -- recognizing that the operator-defense produces audit-grade artifacts that themselves participate in the substrate-truth chain.

The 19:23 ops-log entry ([lines 297-301](../../docs/operations-log-2026-05.md)) carries the same shape at Phase-1-Redux close-out; the 09:18 shape is the strictly stronger worked example because it shows the L2 ↔ L3 drift named-and-resolved post-amendment.

## What this is NOT

- **Not a replacement for FR-design-only discipline.** The FR-design read remains necessary; this entry says it's necessary-but-not-sufficient. Layer 1 reads catch the design-lineage drift surfaces this entry's three-layer model does not specifically name.
- **Not "always run the full probe-suite."** Subsequent dispatches against the same substrate read scratchpad first; the probe-suite is for first-dispatch. Operator-noise discipline applies symmetrically.
- **Not Docker-specific.** The three-layer model generalizes to any FR-shipped → consumer-operationalized substrate pair where the design lineage, operational copy, and runtime state are independently versioned. Future FR-shipped substrates (non-Docker deployment substrates, library service teams per [`service-team-topology.md`](service-team-topology.md), other ghost-bridge backends) inherit the discipline.

## Composition with related disciplines

- [`discriminator-anchored-on-sub-canonical-source.md`](discriminator-anchored-on-sub-canonical-source.md) -- **joint sibling.** This entry is the architectural-layer expression of substrate-truth; the discriminator entry is the grammar/parser-layer expression. Both share the same recovery instinct (run a Tier R probe; surface substrate-truth as evidence); both surfaced from the same S34 dispatch arc; both are joint-authored Brunel + Hopper submissions.
- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) -- parent family. The three-layer model is a **substrate-invariant-mismatch instance at the design-vs-operational-vs-runtime layer triple**. Single-layer reads (any of the three) have an implicit invariant: "the layer I'm reading represents the substrate's truth." That invariant breaks when drift exists. The defect class is the parent; this entry is the layer-triple specialization.
- [`dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) -- **same root-cause-different-layer relationship**, analogous to the one substrate-invariant-mismatch documents for Instance 1 ↔ Instance 6. Dual-team-dir-ambiguity is path-as-substrate-invariant at the **bare-path-resolution** layer ($REPO vs $HOME); the three-layer drift is substrate-state-as-implicit-invariant at the **design-vs-operational-vs-runtime** layer triple. Same defect family, different substrate axis.
- [`hopper.md` Diagnostic Discipline section (Hopper-Amendment-4)](../../prompts/hopper.md#diagnostic-discipline--three-layer-substrate-truth-reading-before-executing) -- **the prompt-side embodiment of this entry's discipline.** Celes-landed 2026-05-25 (prompt lines 130-211) folding three-layer reading per the joint Brunel architectural + Hopper operator-defense articulation in this entry. The prompt section cites this wiki entry as the canonical articulation; this entry's operator-defense subsection is the wiki-grade source the prompt references. Pre-Amendment-4 Brunel S33+ baseline read Layer 1 only -- historical predecessor, not current state.

## Promotion posture

**Confidence: medium-high (promoted from medium 2026-05-26 per E1 extension).** Two structural backings: (i) n=3 drift instances across 2 layer-pair classes in a single dispatch arc; (ii) cross-substrate-class confirmation at n=2 substrate classes (Docker-on-RC + Cloudflare-managed).

### Within-dispatch-arc evidence (n=3 drift instances, apex-research / Docker-on-RC, 2026-05-20 → 2026-05-21)

1. SLOT 3 addition (L1 ↔ L2 drift, surfaced P1.2c at 17:35).
2. GH_TOKEN declaration added to operational compose-yml not in FR design (L1 ↔ L2 drift, dispatch-introduced at P4.05 amendment 09:18).
3. GH_TOKEN (and TUNNEL_TOKEN) in `.env` Layer 2 but not in `docker compose config` rendered output i.e. the Layer-3 projection through compose-yml env-block (L2 ↔ L3 drift, surfaced at P3.7 19:22; resolved P4.05 for GH_TOKEN; TUNNEL_TOKEN intentionally L2-only).

The discipline produced **substantive multi-system failure prevention** (full credential cluster + SSH lockout prevented; original PO ask achieved with substrate left in canonical recreate-safe state). In-vivo demonstrated at three ops-log entries -- 17:09, 19:23, 09:18 -- across three distinct dispatch-arc phases.

### Cross-substrate-class evidence (E1 extension 2026-05-26)

Sub-shape E observed at n=1 (Docker-on-RC substrate class, S34 apex-keys arc) confirmed at n=2 (Cloudflare-managed substrate class, per [`docs/findings.md`](../../../../docs/findings.md) §S5). **Three-layer model is substrate-class-invariant.** Drift surfaces redistribute predictably when ownership locus shifts (L3 ownership shifts from consumer team at Docker-on-RC to Cloudflare-as-substrate-provider at Cloudflare-managed); surfaces themselves persist. First-dispatch three-layer probe-suite remains correct operator-defense -- different probe shapes per substrate-class. Source: joint Brunel + Volta substrate-gap-analysis 2026-05-25.

Joint-cross-specialist criterion already satisfied at n=1 by Brunel + Hopper authorship; the n=2 substrate-class confirmation is structural strengthening beyond raw instance count -- the discipline is robust to substrate-class change, not just substrate-instance change. Common-prompt promotion landed via Hopper-Amendment-4 (Celes-landed 2026-05-25, `prompts/hopper.md` lines 130-211).

### Cross-review independent-surfacing in design-domain (2026-05-26)

Within ~2 hours on 2026-05-26 -- within 36 hours of Hopper-Amendment-4 landing -- **four independent exec-readiness reviews of FR's own Cloudflare-pilot design surfaced Sub-shape E at four distinct layer-pair-points of the design-domain itself**. The discipline applies one layer up at the layer it was authored to catch operators at; the canonical articulation is at [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md) (joint Volta + Herald + Brunel + Hopper + Cal-filer).

**Four sub-instances along the substrate-vs-framework-boundary-at-design-layer coupling-dimension:**

1. **Volta lifecycle-layer** -- `designs/new/cloudflare-pilot/lifecycle.md` exec-readiness review surfaced drift at the session-model + R2-state-management layer-pair between FR design-as-shipped and Cloudflare's canonical session/state lifecycle docs.
2. **Herald protocol-route-layer** -- `designs/new/cloudflare-pilot/comms.md` exec-readiness review surfaced drift at the DO-mailbox + identity-chain layer-pair between FR design and Cloudflare's canonical Durable Objects + identity-routing docs.
3. **Brunel pilot-design-layer** -- `designs/new/cloudflare-pilot/substrate.md` exec-readiness review surfaced drift at the substrate-class + identity + secrets-injection layer-pair; substrate.md was written from announcement-blog + inference (Layer 1); the substrate's own canonical docs are now in workspace at `~/Documents/github/.mmp/claude-managed-agents/docs/` (11 markdown files, 1500+ lines = Layer 2). **The pattern caught its own author** -- Brunel authored the original three-layer discipline (joint with Hopper, S34); the discipline now catches Brunel's own design work.
4. **Brunel + Hopper docs-Layer-0-recursive-descent** -- the 2026-05-26 14:34–14:48 bypass arc surfaced drift at the consumer-team-docs (Layer 1 of substrate-provider documentation) vs substrate-provider-canonical-API (Layer 0) layer-pair. Generalizes the discipline from substrate-as-runtime to **docs-as-substrate**: library-first must recursively descend through doc-provenance layers when consumer-team-docs framing is mechanism-ambiguous.

**Cumulative drift instance count post-amendment**: n=3 within-arc (apex-keys S34, Docker-on-RC substrate-class) + n=4 design-domain (S36 cross-review, FR pilot-design substrate-class) = **n=7 instances total** across **three substrate-class surfaces** (Docker-on-RC + Cloudflare-managed + design-domain itself).

**Recursive structure noted**: within 36 hours of Hopper-Amendment-4 landing (Celes 2026-05-25), the discipline **applies at the layer above where it was authored** (operator-runtime → designer-runtime) and **catches its own authors at that layer** (Brunel-as-designer caught by Brunel-as-discipline-author). The recursive demonstration is itself in-vivo evidence for the discipline's structural reach. Canonical articulation: [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md).

### Future watchpoints

- **Second consumer-operationalized substrate's first-dispatch** (comms-dev / hr-devs / esl-legal at Docker-on-RC; any team at Cloudflare-managed pilot) -- does the three-layer probe-suite surface analogous drift surfaces? Within-class cross-substrate verification.
- **Third substrate class** -- if a future substrate offering surfaces (Modal, Replit Agent, alternative managed-agents provider), does Sub-shape E hold at n=3 substrate classes? Industry-primitive-convergence-as-evidence framing per docs/findings.md §C3.
- **Cross-substrate drift mechanics** -- do drift surfaces correlate with substrate age, with consumer team's operational discipline maturity, with FR-design churn rate? Empirical pattern.
- **L3 ↔ L2 reverse-drift** -- substrate-aware operator amends Layer 2 to declare what Layer 3 has been carrying (P4.05 amendment shape). Does this become a routine operational pattern, or is it incident-driven only? Operational practice.

## Provenance -- joint authorship

Brunel's architectural distinction landed in `brunel.md` S34 entries (lines 9-15: Sub-shape A-E catalog with E as headline; line 19: three-layer joint articulation with Hopper; lines 49-54: S34 close-out Cal-Protocol-A submission planning).

Hopper's operator-defense pattern landed in `hopper.md` line 35 (Hopper-Amendment-4 candidate prose with three-layer Diagnostic Discipline articulation) and was demonstrated in-vivo in the `deployed-artifacts-read declaration` sections of ops-log entries 19:23 (P3.8 close-out) and 09:18 (P4.8 close-out).

The discipline composes from the two halves in a way neither half alone would: the architectural distinction names what to look for; the operator-defense pattern enforces it at the substrate gate.

## Related

- [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md) -- **design-domain application of this discipline.** Joint Volta + Herald + Brunel + Hopper + Cal-filer. The discipline catches its own authors at the layer above where it was authored. n=4 sub-instances surfaced within ~2 hours of 2026-05-26 across four independent exec-readiness reviews of the Cloudflare-pilot design. Family-adjacent (within-system self-application) to `first-use-recursive-validation.md` + `recursive-citation-as-canonical-validation.md`; sharper distinction because the discipline's application produces evidence for its own load-bearing property at the layer-up domain.
- [`cluster-decomposition-meta-principle.md`](cluster-decomposition-meta-principle.md) -- **meta-principle parent.** The three-layer model is Origin 3 of C1 (ownership-locus coupling-dimension). The 2026-05-26 design-domain sub-instances (per the Cross-review independent-surfacing section above) are also a candidate n=2 of C1's methodology corollary ("decompositions are invisible at n=1 and emerge at n=2 with a second instance providing variation along the coupling-dimension"); held as future-watchpoint candidate per Cal-Aen consultation pending cross-team confirmation.
- [`discriminator-anchored-on-sub-canonical-source.md`](discriminator-anchored-on-sub-canonical-source.md) -- joint sibling (same dispatch arc, same Brunel + Hopper authorship, grammar/parser-layer expression of substrate-truth).
- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) -- parent family at the substrate-as-implicit-invariant layer.
- [`dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) -- same root-cause-different-layer sibling at the path-resolution axis.
- [`teams/framework-research/docs/operations-log-2026-05.md`](../../docs/operations-log-2026-05.md) -- catalyzing-incident audit trail (6 chronological entries: 17:09 / 18:05 / 18:22 / 18:46 / 19:23 / 09:18); ops-log 17:09 "Sub-shape E manifestation -- three-layer substrate-truth divergence" section is the first articulation of the joint framing on the audit-trail surface.
- [`teams/framework-research/memory/brunel.md`](../../memory/brunel.md) -- Brunel's S34 [LEARNED -- STRONG] entries for Sub-shape E (headline) and three-layer model.
- [`teams/framework-research/memory/hopper.md`](../../memory/hopper.md) -- Hopper's substrate-facts catalog (lines 7-23), the Hopper-Amendment-4 candidate prose (line 35), and the operator-defense articulation.
- [`teams/framework-research/prompts/hopper.md`](../../prompts/hopper.md) -- Hopper's prompt; Diagnostic Discipline section (lines 130-211) now folds three-layer reading via Hopper-Amendment-4 (Celes-landed 2026-05-25). Pre-Amendment-4 baseline read Layer 1 only.

(*FR:Cal*)
