---
source-agents:
  - aen
  - hopper
  - callimachus
discovered: 2026-05-27
filed-by: librarian
last-verified: 2026-06-02
status: active
confidence: medium-high
source-files:
  - teams/framework-research/docs/operations-log-2026-05.md
  - teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md
  - teams/framework-research/memory/hopper.md
  - teams/framework-research/memory/callimachus.md
  - teams/framework-research/roster.json
source-commits: []
source-issues: []
related:
  - patterns/three-layer-substrate-truth-discipline.md
  - patterns/three-role-discipline-stacking-within-dispatch-arc.md
  - patterns/recursive-narrowing-substrate-truth-evidence-discipline.md
  - patterns/sub-shape-e-at-design-domain.md
  - patterns/layer-0-library-first-recurrence.md
  - patterns/discriminator-anchored-on-sub-canonical-source.md
  - patterns/substrate-invariant-mismatch.md
  - patterns/relay-to-primary-artifact-fidelity-discipline.md
  - patterns/substrate-vs-framework-boundary-primitive.md
amendments:
  - date: 2026-06-02
    description: "Instance 4 added (roster.model non-load-bearing on Agent-tool teams); first cross-domain instance beyond cloudflare-pilot; n=3→n=4; fourth disambiguator-class (architecture-enforcement-mechanism). Source co-authors Aen + PO (S38 discovery); cross-substrate contrast with tmux-pane teams."
---

# Documentation-vs-Substrate-Truth Divergence at the Authoring Tier

Substrate-truth-evidence disciplines previously cataloged in the cluster (three-layer, recursive-narrowing, three-role-stacking, design-domain) all describe failure-modes at the **operator-tier** or the **designer-tier-reading-a-design-against-substrate**. This entry names the **authoring-tier complement**: when a *task-author* (dispatch writer, status-doc author, runbook author) captures an inferred-but-substrate-wrong property in the artifact they ship, and the operator catches it at execution time via Tier-R or Tier-M verification probes.

The failure-mode lives at the layer where the artifact was **written**, not at the layer where it was **read**. Correcting the artifact is local; the discipline gap is in the authoring practice.

## The Pattern Shape

Authoring an artifact (dispatch text, status doc, runbook, expected-outcome marker) that captures **inferred substrate properties** — plausible-sounding mechanisms, label names, control-plane verifiability, sequencing assumptions — that are **substrate-wrong** when checked against canonical substrate-truth. The artifact is internally self-consistent; only substrate-empirical or canonical-source-empirical verification surfaces the divergence.

Three load-bearing properties:

1. **Authoring-tier failure-mode** — the defect is in the artifact's authorship, not in the operator's reading of it. The operator's correct reading would still operate on the wrong inferred substrate-property if the operator did not verify against substrate-truth.
2. **Plausible-but-substrate-wrong** — the inferred property is the kind of statement that *could* be correct on some substrate, or on the substrate at a different control-plane endpoint, or on a confusably-similar substrate-mechanism. Plausibility is what gets it past the authoring review; substrate-truth is what catches it at execution.
3. **Caught at operator-tier verification** — the canonical detection site is operator-tier substrate-probe (Tier-R inventory, Tier-M post-write verification, `modified_on` delta check, canonical-source library probe). Once surfaced, correction is local to the artifact; the authoring-tier discipline gap is the residue worth naming.

## Instances 1-3: S37 (2026-05-27) — Cloudflare-Pilot Domain

Instances 1-3 surfaced within one operator dispatch arc (op-step-2: Round-1 credential split on Worker `secret_text` bindings) in single session, all in the cloudflare-pilot domain.

### Instance 1 — Mechanism-misattribution: KV `SECRETS` vs Worker `secret_text` bindings

| Aspect | Value |
|---|---|
| Artifact | `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §1.3 |
| Inferred substrate-property | Four secrets "wired into KV `SECRETS` namespace" |
| Substrate-truth | Four secrets live as worker-script `secret_text` bindings (write-only via `wrangler secret put`); KV `SECRETS` namespace is empty |
| Catch site | Hopper Tier-R inventory dispatch 12:06 — KV-keys-listing returned 0 keys; Tier-R disambiguator probes (sister KV + worker `/settings` endpoint) surfaced the actual `secret_text` bindings |
| Verbatim ops-log finding | "S35's '4 secrets to KV SECRETS' was actually 4 worker-script `secret_text` bindings via `wrangler secret put`. cf-pilot-status §1.3 column header is wrong." (operations-log-2026-05.md L822) |
| Disambiguator | Two mechanisms with confusably-similar names — KV `SECRETS` (runtime-readable secret material per egress-policy header-injection design) and Worker `secret_text` (write-only secret bindings via `wrangler secret put`). The S35 doc captured the wrong mechanism, then was carried forward into op-step-2 dispatch by implication |

### Instance 2 — Inferred-positive-control: `modified_on` delta vs `wrangler secret put` control-plane endpoint

| Aspect | Value |
|---|---|
| Artifact | Aen dispatch 12:11 sanction package (expected-outcome text) |
| Inferred substrate-property | "Worker auto-redeploys" — verifiable by `modified_on` field delta |
| Substrate-truth | `wrangler secret put` updates secret bindings via a *separate control-plane endpoint* that does NOT bump the script's `modified_on`. Secrets are live (wrangler success-confirmation is authoritative; CF API binding-inventory confirms presence) — but the Worker did not "re-deploy" in the script-bundle sense |
| Catch site | Hopper post-write Tier-R verification 13:01 — `modified_on_BEFORE == modified_on_AFTER == 2026-05-26T10:08:32.237277Z` |
| Verbatim ops-log finding | "`modified_on` reflects script-bundle deploy timestamp, not secret-binding-rotation timestamp." (operations-log-2026-05.md L838) |
| Disambiguator | `modified_on` is the *wrong positive control* for secret-binding rotation. The dispatch's positive control was inferred from script-deploy semantics; secret-binding rotation operates on a different control-plane endpoint with no script-bundle side effect |

### Instance 3 — Discipline-gap-as-substrate-property: bundled-shred temporal-position vs exit-code-conditional

| Aspect | Value |
|---|---|
| Artifact | Aen dispatch 12:11 bundled-shred sanction language ("Shred the ephemeral file after both commands succeed") |
| Inferred substrate-property | Operator-tier reading: "shred after success" interpretable as **temporal-position-in-pipeline** (`&&` chain ordering) rather than **exit-code-conditional** (gate on actual exit codes) |
| Substrate-truth | Bash `&&` chains gate on the immediately-prior command's exit code, NOT on a transitive product of all prior commands. An intervening `echo "EXIT_N=$N"` evaluates exit-0 and lets the `&&` chain continue to `rm -f` regardless of wrangler exit codes |
| Catch site | Hopper first attempt 12:15 — wrangler returned exit 1 (ambiguous-account); the `&&` chain executed `rm -f` anyway because the intervening `echo` succeeded. Hopper self-surfaced the discipline gap + proposed the structural fix |
| Verbatim ops-log finding | "Operator shredded ephemeral creds file in same atomic bash pipeline; `&&` chain guarded on intervening `echo \"EXIT_N=$N\"` (always exit-0) rather than on the wrangler exit codes. 'Shred after success' misinterpreted as syntactic-temporal-position rather than conditional-on-success." (operations-log-2026-05.md L824) |
| Disambiguator | The discipline language ("after both succeed") is correct in intent but under-specified in *which substrate-mechanism* enforces "after"; bash-syntactic-temporal `&&` is not equivalent to conditional-on-exit-code-zero when an intervening statement returns 0 |

## Instance 4: S38 (2026-05-28) — Agent-Tool Team Architecture Domain

First instance beyond cloudflare-pilot domain. Surfaces the same authoring-tier divergence pattern at the **team-infrastructure configuration layer** rather than the operator-dispatch layer.

### Instance 4 — Architecture-enforcement-mechanism: roster.json `model` field non-load-bearing on Agent-tool teams

| Aspect | Value |
|---|---|
| Artifact | `teams/framework-research/roster.json` line 10 — `"model": "claude-opus-4-6[1m]"` for all team members |
| Inferred substrate-property | Team members run on the model specified in roster.json (`claude-opus-4-6[1m]`); roster.json `model` field controls which model agents use at runtime |
| Substrate-truth | On Agent-tool team architecture, `TeamCreate` stamps the **parent CLI session's model** into runtime `config.json` regardless of roster.json intent. The Agent tool's spawn `model` parameter accepts only **family-level overrides** (`opus`/`sonnet`/`haiku`), not specific version pins. If the parent CLI runs on `claude-opus-4-7[1m]`, all spawned agents land on 4.7 despite roster.json specifying 4.6 |
| Catch site | S38 session boot — config.json line 11 showed `"model": "claude-opus-4-7[1m]"` despite roster.json line 10 saying `"model": "claude-opus-4-6[1m]"`. Agent tool spec (ToolSearch fetch): `model` param accepts only `opus`/`sonnet`/`haiku` |
| Evidence | Config.json line 11 = `"model": "claude-opus-4-7[1m]"` for fresh S38 team. Roster.json line 10 = `"model": "claude-opus-4-6[1m]"`. Spawn inheritance default = parent model when no explicit family-level override |
| Disambiguator | **Two team-architecture substrates, same data field, two enforcement semantics.** On **tmux-pane-based teams** (e.g., apex-research), launcher scripts consume roster.json `model` field directly via `claude --model claude-opus-4-6[1m]` at spawn time — the field IS load-bearing. On **Agent-tool teams** (e.g., framework-research), the field is **non-load-bearing** — parent CLI model propagates via TeamCreate regardless. A reader of roster.json infers model-enforcement; substrate-truth is parent-determined. The authoring of roster.json with specific version pins captures a plausible-but-substrate-wrong property: the configuration *looks* like it controls model selection, but the enforcement mechanism on Agent-tool architecture ignores it |

**Cross-substrate contrast is the structural contribution:** the same data field (`model` in roster.json) is load-bearing on one team-architecture substrate (tmux-pane) and non-load-bearing on another (Agent-tool). This is the pattern's substrate-adjacency shape at the architecture-enforcement layer — the inferred property ("this field controls model selection") is correct on an adjacent substrate, wrong on the actual deployment substrate.

**Mitigation shipped S38:** startup.md Step 0.5 procedural gate (verify parent model matches roster intent before TeamCreate) + roster.json `_substrate_note` top-level field documenting the gap. Mitigation is operational-procedural, not substrate-fix — the gap persists until Anthropic adds version-pin support to the Agent tool's `model` parameter.

**Cost context (PO-sourced S38):** 40% context-cost differential between 4.6 and 4.7 from apex-research experiment; the non-load-bearing field has material cost implications when the parent CLI silently runs a different model than intended.

## Cross-Instance Pattern

All four share the same authoring-tier shape:

| Instance | Inferred substrate-property | Actual substrate-mechanism | Caught at | Domain |
|---|---|---|---|---|
| 1 | KV `SECRETS` is where the four secrets live | Worker `secret_text` bindings | Tier-R KV-keys inventory | cloudflare-pilot |
| 2 | `modified_on` delta is the auto-redeploy positive-control | Separate secret-binding control-plane endpoint | Tier-R post-write `modified_on` re-read | cloudflare-pilot |
| 3 | Bash `&&` chain enforces "after both succeed" | Intervening `echo` lets chain continue regardless | Tier-M first-attempt-failure observation | cloudflare-pilot |
| 4 | roster.json `model` field controls agent model selection | Parent CLI model propagates via TeamCreate; Agent tool accepts only family-level overrides | S38 boot config.json vs roster.json comparison | agent-tool-architecture |

In each case, the authoring artifact captured an inferred substrate-property that is plausible-but-substrate-wrong; verification surfaced the divergence; correction was local to the artifact, but the discipline gap is in the authoring practice — **relying on inferred properties without substrate-truth grounding at authoring time**. Instance 4 extends this from operator-dispatch artifacts to **team-infrastructure configuration artifacts** and from cloudflare-pilot to **agent-tool team architecture** — the first cross-domain instance, confirming the pattern is not domain-specific.

## Sub-Finding (Promotion-Grade): Disambiguator-Class is Substrate-Adjacency

The four instances differ in *what kind* of substrate-property was inferred wrongly, and the disambiguator pattern across them suggests a structural categorization:

- **Instance 1 = mechanism-name disambiguator** (two substrate-mechanisms with confusably-similar names; the author selected one based on name without verifying the actual operational mechanism)
- **Instance 2 = control-plane disambiguator** (one substrate-operation reads as if it bumps a particular field; the actual mechanism operates on a different endpoint with different side effects)
- **Instance 3 = enforcement-mechanism disambiguator** (a discipline phrase ("after success") under-specifies which substrate-mechanism enforces the temporal relation)
- **Instance 4 = architecture-enforcement-mechanism disambiguator** (a configuration field that is load-bearing on one team-architecture substrate but non-load-bearing on another; the field's authoring infers enforcement from the adjacent substrate's semantics)

Each instance failed by **substrate-adjacency**: the inferred property was correct at a neighboring substrate or at a neighboring control-plane endpoint or at a neighboring syntactic interpretation or at a neighboring architecture substrate. Authoring-tier discipline must therefore explicitly disambiguate against substrate-adjacency: when writing an inferred property, name the substrate-mechanism precisely and verify the disambiguator against canonical substrate-truth before shipping the artifact.

## Composition With the Substrate-Truth-Evidence Cluster

This entry completes the cluster's authoring-tier decomposition axis:

| Cluster entry | Decomposition axis | Discipline-locus |
|---|---|---|
| [`three-layer-substrate-truth-discipline.md`](three-layer-substrate-truth-discipline.md) | Layer-decomposition (L1/L2/L3) | Operator-tier reading-against-substrate |
| [`recursive-narrowing-substrate-truth-evidence-discipline.md`](recursive-narrowing-substrate-truth-evidence-discipline.md) | Iteration-depth (within-document v1→v2→v3) | Designer-tier across iteration |
| [`sub-shape-e-at-design-domain.md`](sub-shape-e-at-design-domain.md) | Cross-document axis (lifecycle/comms/substrate/docs) | Cross-author cross-document review |
| [`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md) | Role-decomposition (operator+designer+coordinator) | Within-arc role-stacking |
| [`layer-0-library-first-recurrence.md`](layer-0-library-first-recurrence.md) | Substrate-layer-pair-of-application (L1↔L0) | Library-first canonical-source probe |
| **This entry** | **Authoring-tier (artifact-author writes inferred-substrate-wrong)** | **Task-author / dispatch-writer / runbook-author** |

The cluster has been approaching the discipline from operator-side and designer-side reading angles. This entry names the **authoring-side writing failure-mode**: the producer-side complement to the consumer-side disciplines already cataloged. Where the three-role stack catches divergence within an arc, this entry names what happens *before* the arc begins — at the artifact-authoring window.

**Anti-pattern counter to [`discriminator-anchored-on-sub-canonical-source.md`](discriminator-anchored-on-sub-canonical-source.md):** that entry catalogues discriminators (regex, lookup key, literal in transit) anchored on sub-canonical sources at the parser-or-transit layer; this entry generalizes the family to artifact-authoring anchored on sub-canonical inferences at the substrate-mechanism-naming layer. Same family (sub-canonical anchoring); different layer (parser vs authoring-tier).

**Substrate-invariant-mismatch sibling** ([`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md)): the discipline answers "what substrate property is this artifact relying on, and what happens if that property differs?" at authoring time, not detection time. The defenses (hoist invariant into preamble; detect at write site; declare substrate explicitly) apply directly at the authoring window — preventing the divergence rather than catching it downstream.

## Disciplines That Catch This Class

Three operator-tier disciplines already in the cluster catch instances of this class downstream:

1. **Tier-R substrate-probe before Tier-M operation** — Hopper's discipline of inventorying actual substrate state before mutation surfaces mechanism-misattributions (Instance 1).
2. **Tier-R post-mutation re-probe with explicit positive control** — surfaces inferred-positive-control failures (Instance 2). The discipline of re-reading the *correct* field after a mutation; the canonical positive control depends on which substrate-mechanism actually fires.
3. **First-attempt-failure self-catch via observed substrate-behavior** — Hopper's structural fix on Instance 3 (decompose into two Bash-tool invocations; conditional gate at human/audit boundary) is the operator-tier defense against authoring-tier under-specification of enforcement-mechanism.

The authoring-tier discipline that *prevents* this class:

- **Substrate-mechanism-precise naming at authoring time** — when capturing an inferred property in a dispatch text, status doc, or expected-outcome marker, name the substrate-mechanism explicitly (not just the substrate label) and verify the disambiguator against canonical substrate-truth before shipping.
- **Layer-0 library-first probe at authoring time** — [`layer-0-library-first-recurrence.md`](layer-0-library-first-recurrence.md) extension: the canonical-source probe is cheap; before shipping an inferred substrate-property, query the canonical documentation (Layer 0) to disambiguate.
- **Adjacent-mechanism scan** — when an inferred property could be correct at a neighboring substrate or control-plane endpoint, name the disambiguator explicitly in the artifact (e.g., "secrets live in `secret_text` bindings, NOT in KV `SECRETS` namespace which holds runtime-readable material for egress-policy header-injection").

## Promotion-Posture

**Confidence medium-high** — n=4 across two substrate domains (cloudflare-pilot + agent-tool-architecture); four structurally distinct disambiguator-classes (mechanism-name / control-plane / enforcement-mechanism / architecture-enforcement-mechanism). Instance 4 is the first cross-domain instance, confirming the pattern is not cloudflare-pilot-specific.

**Cross-team confirmation promotes to confidence-high.** Candidate cross-team sites: apex-research (when Schliemann/Aen-apex authors against unfamiliar substrate); any team adopting Cloudflare-managed-agents substrate (mechanism-name disambiguators predicted to recur given the substrate's confusably-similar mechanism-names); any team transitioning between tmux-pane and Agent-tool architectures (Instance 4 disambiguation surface predicted to recur).

**Cross-org confirmation distinguishes EVR-discipline-culture vs org-invariant** per [`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md) cross-org-vs-within-org refinement.

**Operational falsifiability:** the next substrate-probe on a fresh artifact against a substrate-mechanism the author has not personally verified is the next data point. Instance 4 demonstrates that the pattern extends beyond operator-dispatch artifacts to configuration artifacts — future falsifiability applies across both artifact classes.

**Watchpoint candidates**:
- Substrate-fit-researcher (Finn-vantage) acting at authoring time — does library-load discipline at authoring time catch this class before shipping? [`layer-0-library-first-recurrence.md`](layer-0-library-first-recurrence.md) Instance 3 (Finn W4 catch) operated against an already-shipped artifact (Herald v1.3); Instance 3 there was retroactive. Forward-watch: does the same discipline applied at authoring time prevent the same class of authoring-tier failure?
- Instance 4 cross-architecture-substrate extension — does the pattern recur for other configuration fields that have different enforcement semantics across team-architecture substrates? Candidate: `agentType` field in roster.json (does Agent-tool architecture honor it vs tmux-pane launcher?). If yes, strengthens Instance 4's architecture-enforcement-mechanism disambiguator-class.

## What This Is NOT

- **Not "documentation gets stale"** — the divergence is at authoring time, not via stale-after-edit. The artifact was substrate-wrong when it was written, not because the substrate later drifted.
- **Not "the operator's read was wrong"** — the operator's substrate-truth-anchored verification was the catch site. The defect is in the artifact.
- **Not a single substrate-layer phenomenon** — the four instances span design-doc text (Instance 1), dispatch sanction text (Instance 2), discipline-phrase language (Instance 3), and team-infrastructure configuration (Instance 4). Authoring-tier failure-modes are substrate-layer-invariant within the substrate-mechanism-precise-naming discipline.
- **Not redundant with `discriminator-anchored-on-sub-canonical-source.md`** — that entry catches discriminators (parser / transit-chain artifacts) anchored on sub-canonical sources at the runtime-mechanism layer. This entry catches authoring-tier inferences at the substrate-mechanism-naming layer. Same family (sub-canonical anchoring); different layer (parser vs authoring).
- **Not solely cloudflare-pilot domain** — Instances 1-3 all occurred in cloudflare-pilot; Instance 4 (S38) is the first cross-domain instance in agent-tool team architecture, confirming that the pattern shape is substrate-domain-invariant.
- **Not "config field is broken"** — Instance 4's roster.json `model` field works correctly on tmux-pane teams. The failure is that the authoring inferred enforcement from the adjacent substrate's semantics without verifying enforcement on the actual deployment substrate (Agent-tool architecture).

(*FR:Callimachus*)
