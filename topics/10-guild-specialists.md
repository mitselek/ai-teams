# Guild Specialists — Shared Expert Pool with Competency Backend

Specialist agent personas maintained as a shared resource across teams, dispatched on demand with verified competency backing and a self-correcting feedback loop.

## Problem statement

At 1-3 teams, every team can embed its own security reviewer, safety engineer, or architecture coherence checker. At 10+ teams, this doesn't scale — duplicating every specialist on every team multiplies maintenance cost, fragments competency quality, and produces inconsistent review standards. A team that needs Anderson-grade security review once a quarter shouldn't maintain its own Anderson year-round.

## Design

Four components, each with a distinct owner:

| Component | What it is | Who owns it |
|---|---|---|
| **Retainer repository** | Catalogue of specialist personas with defined competencies, synergy maps, and known gaps | Consultancy team |
| **Consultancy team** | Matchmaker that takes a client brief, selects the right specialist composition, re-engineers prompts for the engagement, and dispatches | Dedicated team (Celes-shaped role) |
| **Competency backend** | Documented source-of-truth backing for each persona's domain claims — MCP servers, indexed doc repos, ratified ADRs | Consultancy team maintains; domain owners populate |
| **Gap-detection feedback loop** | When a hired specialist must derive any prompt-claimed competency from training data: (a) flag it in the output artifact with `[GAP]`, (b) file an issue at the consultancy about the backing gap | Specialist executes; consultancy triages |

### How it works

```
Client team                    Consultancy                     Retainer pool
    │                              │                               │
    ├─ "Review these PRs" ────────>│                               │
    │                              ├─ Match problem to personas    │
    │                              ├─ Check competency backing     │
    │                              ├─ Re-engineer for engagement   │
    │                              ├─ Dispatch ───────────────────>│
    │                              │                               ├─ Read backing docs
    │                              │                               ├─ Review / deliver
    │                              │                               ├─ Flag [GAP]s
    │<─────────────── Deliverable ─┤<──────────── Report ──────────┤
    │                              ├─ Triage gap issues            │
    │                              ├─ Update competency profiles   │
    │                              │                               │
```

### The feedback loop in detail

The gap-detection loop is what makes this framework-grade rather than "a folder of prompts":

1. **Specialist encounters unbacked claim** — their prompt says they have security/safety/architecture expertise, but `search_docs` returns nothing for the specific standard, regulation, or pattern they need to cite.
2. **Specialist flags in output** — `[GAP] EN 50716:2023 source text is not available; I cannot cite specific clauses. The following is from training knowledge and must be verified.`
3. **Specialist files issue** — back at the consultancy/retainer repository: "Leveson persona claims EN 50716 expertise but source text is absent. Obtain and index."
4. **Consultancy triages** — either (a) obtain the backing doc and index it (MCP auto-picks it up), or (b) document it as a known gap in the persona's competency profile so future dispatches include the caveat.
5. **Next engagement** — the specialist's competency profile is more honest. If the doc was obtained, the gap is closed and citations are real. If not, the gap is documented and the flag fires automatically.

Over time, the retainer pool's competency claims converge toward truth — each engagement either validates or exposes gaps, and the feedback loop closes them or documents them.

## Relationship to team taxonomy

This is a **fourth team archetype** alongside the three defined in [01-team-taxonomy.md](01-team-taxonomy.md):

| Archetype | Primary output | Lifecycle | Members |
|---|---|---|---|
| Research | Design docs, frameworks | Persistent | Permanent roster |
| Development | Working software | Persistent or mission-scoped | Permanent roster |
| Hybrid | Research + internal tooling | Mission-scoped | Permanent roster |
| **Consultancy / Guild** | Reviews, audits, assessments delivered to client teams | **Persistent pool, per-engagement dispatch** | **Retainers (dormant until summoned)** |

Key differences from other archetypes:
- **No permanent team instances** — the guild is a pool, not a running team. Specialists are dormant between engagements.
- **Client-driven activation** — a client team requests expertise; the consultancy matches and dispatches. No standing work.
- **Cross-team by design** — retainers serve any team that needs their domain. Their competency backend is shared infrastructure.
- **Quality feedback is structural** — the gap-detection loop is built into the engagement protocol, not an afterthought.

## Evidence — S41 proof-of-concept

The framework-research team (S41) ran a controlled trial of this pattern:

- **Retainer repository:** [Eesti-Raudtee/Arhitecture `.claude/agents/`](https://github.com/Eesti-Raudtee/Arhitecture/tree/master/.claude/agents) — 13 personas
- **Consultancy role:** Celes (FR agent) — produced [synergy map](https://github.com/Eesti-Raudtee/Arhitecture/issues/3), selected 5 personas, re-engineered prompts with competency gates + synergy wiring
- **Competency backend:** [arch-docs MCP](https://arch-docs.dev.evr.ee) (498 indexed docs) + ratified ADRs in [Arhitecture](https://github.com/Eesti-Raudtee/Arhitecture) repo
- **Client engagement:** Review [dev-toolkit PR #45](https://github.com/Eesti-Raudtee/dev-toolkit/pull/45) and [PR #46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46)
- **Gap-detection results:** all 5 personas flagged `[GAP]` correctly (EN 50716, NIS2/ISO/KüTS, Workers failure modes, missing kata). Zero fabricated citations. 5 atomic issues filed ([#4](https://github.com/Eesti-Raudtee/Arhitecture/issues/4)–[#8](https://github.com/Eesti-Raudtee/Arhitecture/issues/8)) for persona improvements.
- **Synergy results:** designed pairings (Beck⟷Bach, Leveson⟷Anderson) produced consensus findings neither lens would reach alone. Full trial: [review gist](https://gist.github.com/mitselek/a20d0be7ae193c8266725880005aa4a6).

## Evidence — S42 round-2 re-review (the pattern validated) (*FR:Celes*)

S41 validated the *personas*; S42 round 2 validated the *pattern*. After the PR authors addressed the round-1 findings, the framework-research team re-reviewed [PR #45](https://github.com/Eesti-Raudtee/dev-toolkit/pull/45) and [PR #46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46) — but this time with a controlled change to isolate the key question.

**Hypothesis:** do **prompt-encoded** competency gates + synergy wiring (the persona improvements merged as [#4](https://github.com/Eesti-Raudtee/Arhitecture/issues/4)–[#8](https://github.com/Eesti-Raudtee/Arhitecture/issues/8)) produce review quality equivalent-or-better than **ad-hoc Celes briefing** — i.e. does the consultancy role have to intervene *per engagement*, or only *per setup*?

**Treatment difference (the experiment's whole point):** round 1 = one agent embodying all five personas in a single context, with consultancy-designer memory present, ad-hoc pairing briefs. Round 2 = **five independent fresh-context agents**, each reading only its merged retainer prompt + a thin dispatch brief (a contamination guard forbade reading any consultancy memory/docs), gates + synergy **prompt-encoded not briefed**, and the gap-reaction Action-2 delivered via the dispatch brief (not yet prompt-encoded). Full rubric + reviews: [gist](https://gist.github.com/mitselek/a20d0be7ae193c8266725880005aa4a6); scoring at `teams/framework-research/docs/2026-06-05-round2-retro-rubric.md`.

**Result: HYPOTHESIS CONFIRMED — the consultancy role is SETUP-ONLY, not per-engagement.**

- **All 5 reviewers APPROVE, with per-finding dispositions verified against the actual diffs** (resolved / partial / deferred, not rubber-stamps). Three reviewers went *deeper* than round 1 from the prompts alone.
- **Zero fabrication, 5/5 — including the two highest-fabrication-risk lenses** (Leveson on a regulated standard; Anderson, whose round-1 fabricated-URL failure originally motivated the competency-gate work). The regression test that mattered most passed.
- **Both designed consensus signals reproduced from genuinely independent contexts** (Beck⟷Bach "characterization tests pin bugs"; Leveson⟷Anderson `security_level`/`safety_related` conflation check) — not manufactured by a single embodying context.
- **Gap-reaction Action 2 fired behaviorally 4/4 where a gap existed** — the specialists really filed retainer-repo issues ([#10](https://github.com/Eesti-Raudtee/Arhitecture/issues/10)–[#13](https://github.com/Eesti-Raudtee/Arhitecture/issues/13)) the moment they hit unbacked claims, delivered purely through the dispatch brief. The self-correcting loop (design component 4) is now demonstrated end-to-end, not just specified.

### The synergy result is stronger than "designed pairings reproduced"

The design wired two pairings (Beck⟷Bach, Leveson⟷Anderson). Both reproduced. But a **third, *undesigned* pairing also emerged: Booch⟷Leveson.** Booch's structural lens (which explicitly *defers* safety content to Leveson) caught that the safety-evidence `if/then` lives inside a `scope` object that isn't schema-required — so omitting `scope` bypasses the very safety enforcement Leveson had verified as resolved. Neither reviewer was told to cover the other's axis; the cross-lens coverage emerged purely from prompt-encoded lens-discipline (each persona staying in its lane and flagging structurally-adjacent holes). This is the deeper claim for the pattern: **prompt-encoded specialization produces emergent cross-coverage, not just the coverage you wire.** It is also a caution — emergent crosses are not guaranteed, so the consultancy's setup still matters for the *predictable* pairings.

### Honest caveats (carried so the result isn't over-claimed)

- **Substrate uncontrolled:** round 2 ran on a newer model generation than round 1 (opus-4.8 vs 4.6-era). The *directional* verdict (prompt-encoded gates are sufficient; consultancy = setup-only) is robust to this, but we do **not** claim a precise round-over-round quality delta attributable to the prompts alone — model uplift is a confound.
- **Delivery substrate:** the spawned-agent→consultancy report vector showed high-variance delivery lag/stall (one report ~15 min late, four stalled in the on-disk inbox without surfacing). "Disk inbox file ≠ delivery truth." A guild at scale needs a reliable retainer→consultancy report channel; the git/worktree isolation that works for parallel *work* does not fix harness inbox cross-boundary *delivery*.

**Implication for the design:** the consultancy (Celes-shaped role) is a **per-setup** investment — build the retainer prompts with gates + synergy + the gap-reaction protocol once, and the pool dispatches without per-engagement re-engineering. This sharpens the "Retainer quality assurance" open question below: the high-value consultancy work is the one-time prompt engineering and the competency-backend curation, not babysitting each review.

## The competency gate is two mechanisms wearing one name — three-way taxonomy (*FR:Celes*)

The S43 reflexive exercise (#74) turned the competency methodology inward onto framework-research's own standing roster and produced the strongest generalization in the whole guild line of work. Full design + evidence: `teams/framework-research/docs/2026-06-05-competency-gap-analysis.md` (Celes) and `teams/framework-research/docs/health-report-competency-gap-2026-06-05.md` (Medici, the per-prompt audit).

**Lead with the convergence evidence, because it shows the taxonomy is discovered, not invented:** when Medici audited FR's 10 standing prompts for the gap-reaction loop, he found FR had **already re-derived that loop for its runtime-substrate roles (Brunel, Hopper) without ever calling it a "competency gate"** — it lives as the three-layer-substrate-truth-reading discipline. The mechanism the guild design centers on appeared independently in the team that designed the guild, attached to exactly the role-class that needed it. That convergence is what tells us the distinction below is real structure, not a post-hoc carving.

**The distinction:** the "competency gate" from the S41/S42 guild work is actually *two separable mechanisms*:

1. **Claim→backing mapping** (the audit table) — generalizes fully to any long-lived roster; cheap; owned by a health-checker.
2. **Runtime gap-reaction loop** (`[GAP]`-flag + file-issue) — does **not** generalize to roles that don't cite external authority; it is a feature of *citation-bearing review work*, not standing coordination/design work.

This resolves into a **three-way competency taxonomy**, each kind needing a different verification mechanism:

| Competency kind | Backed by | Verification mechanism | Role class |
|---|---|---|---|
| **Citation-backed** | An external source doc (standard, regulation) | Runtime gate — full Anderson pattern (query backend, cite real, flag+file) | Dispatch-time review personas (the guild) |
| **Substrate-backed** | A live deployed artifact / external substrate read at runtime | Substrate-truth-reading discipline (read your own shipped artifact; surface on absence) | Operator/architect roles (Hopper/Brunel class) |
| **Posture-backed** | Role definition + model capability, internally documented | Periodic audit only — claim→backing map, no embedded gate | Coordinator/design roles (most standing rosters) |

**Implication for this design:** topic 10's competency-gate is under-specified — it should name which of the three a given role is, because **only citation-backed roles need the runtime loop** that the guild design centers on. A standing team applying the guild competency idea to itself should reach for the audit (posture) or substrate-read (substrate) mechanism, not bolt the citation-runtime-gate onto roles that have nothing external to cite. For FR specifically, 0 of 10 roles are citation-backed — so the reflexive answer was whole-roster YAGNI on the internal-knowledge axis, plus a single proactive **orphan-claim scan** (a new `[ORPHAN-CLAIM]` audit category that flags any claim naming an external body-of-knowledge with no in-repo artifact to verify against — the one case a consistency-based coherence audit can't see, because there's nothing to be inconsistent *with*).

**Competency-backend-staleness, FR-native form:** the "Competency backend ownership at scale" open question below has an FR-internal analogue — FR's only drifting backing is the **frozen `reference/` snapshots** (rc-team, hr-devs), not external standards. Same staleness shape, internal surface.

## Persona anchor selection — the A/B instrumentation pattern

### The claims-need-backing meta-pattern

The competency gate and VEO-51's `nfr.yaml` convention are the same epistemic pattern at different substrates: **declarations need a verification layer, and the gap between declaration and verification is where failures live.** An `nfr.yaml` with `verification: "trust me"` passes CI — the schema validates shape, not truth. An agent persona that claims domain expertise produces confident output — but without a grounded competency index, the citations may be fabricated. Both are self-asserted claims pending evidence. The verification layer (CI schema-check for NFR; MCP + gap-detection for personas) is what separates a claims register from an assurance system. This is the genus of which the three-way taxonomy above is the species: "citation-backed roles need a runtime verification layer" is exactly this meta-pattern applied to one role class — the taxonomy carves *which* roles carry self-asserted domain claims and therefore need the layer, while posture-backed roles assert only capability the model already has. Cross-reference: [VEO-51 comment](https://eestiraudtee.atlassian.net/browse/VEO-51) (2026-06-08).

### Two anchor patterns

When casting a persona from training data, the figure's fame creates a design choice:

| | Pattern A — Method-famous | Pattern B — Domain-fact-famous |
|---|---|---|
| **The figure is famous for** | *How* they worked — a method, posture, craft | *What* they knew — the domain's actual content |
| **Examples** | Harrison (precision mechanism), Pérotin (layered polyphony), Phileas Fogg (systematic journeying) | Anderson (security engineering), Hamblin (RPN/stack evaluation) |
| **Model behavior** | Anchors on approach; no training-data invitation to "be the expert" | Rich domain engagement; training-data knowledge overlaps the task domain |
| **Fabrication risk** | Low — no domain-fact overlap to activate | High without gates — the persona's celebrity invites answers from training memory |
| **Verification burden** | Standard guardrail sufficient | Full gate stack required (MCP, gap-detection, `[UNVERIFIED]` tagging) |

### Three cases for anchor selection

Not every persona presents a real choice. The A/B question only arises in the middle case:

1. **Obviously method-only roles** — librarian, coordinator, lifecycle engineer. The role's job IS method/organization. No domain-fact overlap exists. Pattern A, no A/B needed. (Callimachus curating a wiki has zero fabrication surface — he claims organizational expertise, not domain-fact authority.)

2. **Field-expert personas where both anchors are viable** — the interesting case. A "linux security admin" could anchor on a famous security figure (domain-fact-famous) or a famous methodologist (method-famous). **Design both by default when a results-accumulation channel exists** (the twin's marginal cost is one extra `persona.md`); **otherwise pick method-famous and note the twin as deferred** — the discipline cost (opt-in dispatch wiring, contamination audit, a channel to collect comparison reports) is real, and without it the second variant is dead weight. See the instrumentation pattern below and open question on adoption rate.

3. **Domain-fact roles with full gates** — when the domain fame IS the point (Anderson reviewing security architecture), use Pattern B with the full competency gate stack. The gates are the price of the richer domain engagement.

### The A/B instrumentation pattern

When a field-expert persona admits both anchor types (case 2 above), design both variants as **twins**:

1. **Twin design.** Identical competency files, identical common prompt section, identical synergy wiring. Only `persona.md` differs — the anchored figure and its lore. The persona identity is the sole variable; everything else is held constant. The marginal cost is one extra `persona.md`; the return is a runnable controlled comparison.

2. **Contamination isolation.** Neither twin references the other. No "you are the domain-fact variant of..." in the prompt. No shared experiment framing. Each persona stands alone as a complete, self-contained identity. The A/B structure lives in the framework documentation and the dispatch layer, never in the persona prompt. If Hamblin's prompt mentions Harrison, the model has context about the hypothesis, which contaminates the behavior being measured.

3. **Opt-in dispatch.** The dispatch layer (not the persona) surfaces the twin to clients at dispatch time:
   > You are tasking Hamblin. We also have Harrison available for the same job. If you have spare tokens, consider tasking both independently and reporting the results to us for research purposes.
   This is a low-cost research contribution, not a mandate. Clients who just need a review done hire one; clients with budget run both and send back comparison data.

4. **Results accumulation.** Comparison reports flow back to the framework team. Each domain that instruments the twin pattern adds a data point. Over time: formula-engine, auth, schema, security, infrastructure — the framework accumulates cross-domain empirical evidence instead of relying on a single anecdote.

### What to measure in each comparison

Per the [Hamblin ∥ Harrison experiment design](../designs/new/entu-consultant-agents/formula-engine-EXPERIMENT.md):

- **Index-citation rate** — does each variant cite a competency-index claim + evidence ref for every domain assertion?
- **Fabrication / bypass** — does either answer a domain-specific particular from general training knowledge instead of the index? (The domain-fact-famous arm is the at-risk arm.)
- **`[GAP]` honesty** — when the index lacks a backing claim, does each variant flag the gap rather than fill it from fame?

If the standard guardrail holds equally for both anchors, that relaxes §2.4's "state the guardrail twice for a risky anchor" prescription — evidence that the verification burden does NOT scale with anchor type. (It would not change the anchor *preference* itself; method-famous stays the safe default.) If the domain-fact-famous arm shows more bypass, the verification-burden spectrum is confirmed and the full gate stack is load-bearing for Pattern B.

### Evidence

| Test | Anchor type | Gates | Result | n |
|---|---|---|---|---|
| Anderson S40 (rumba_sso_login) | Domain-fact-famous | None (pre-gate) | Fabricated regulatory URLs | 1 |
| Anderson S40 re-run | Domain-fact-famous | Full (gap-detection, no MCP) | Zero fabrication, loud caveats | 1 |
| Anderson AC4 S45 ([PR #46 comment](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46#issuecomment-4646001165)) | Domain-fact-famous | Full (MCP + gap-detection + `[UNVERIFIED]`) | Zero fabrication, 9 MCP sources cited, 2 `[GAP]` flags | 1 |
| Round 2 S42 (5 personas incl. Anderson) | Mixed (method + domain-fact) | Prompt-encoded gates + synergy | 5/5 zero fabrication | 1 per persona |
| Hamblin ∥ Harrison | Domain-fact vs method (controlled) | Standard guardrail (identical, NOT doubled) | **Not yet run** | — |

The four Anderson rows are a *within-persona* gate-progression (same anchor, gates added across S40→S45), not four independent anchors — cross-*persona* evidence on the anchor-type effect awaits the first twin run.

The Hamblin ∥ Harrison experiment is the missing empirical test — it isolates the persona anchor as the sole variable with the guardrail held constant. Instrumented at `designs/new/entu-consultant-agents/formula-engine-EXPERIMENT.md`; runnable when the competency index is populated. Either outcome is a real result for the framework.

## Open questions

- **Competency backend ownership at scale:** who pays the cost of obtaining and indexing external source docs (EN 50716, NIS2 directive text, ISO 27001 Annex A)? The domain owner? The consultancy? The client who needs the gap closed?
- ~~**Retainer quality assurance:** who reviews the retainer prompts themselves?~~ **RESOLVED (S43, #74 D5):** the **auditor owns the competency map, not the authoring role.** Marking-your-own-homework is avoided by separation: the role-sculptor (Celes) authors prompts, but a distinct health-checker (Medici) verifies their backing. Demonstrated reflexively — Celes authored 9 of 10 FR prompts; Medici audited them, including Celes's own.
- **Pricing / priority model:** when 3 teams want Anderson simultaneously, who queues? First-come or criticality-based?
- **Retainer independence vs team culture:** a retainer dispatched to different teams must adapt to different communication protocols, commit conventions, and quality bars. How much adaptation is the consultancy's job vs the retainer's?
- **Competency backend as shared infrastructure:** the MCP server pattern ([arch-docs.dev.evr.ee](https://arch-docs.dev.evr.ee)) works for one repo. At 10+ repos with 10+ retainers, is there one MCP per domain or a federated query layer?
- **Twin-pattern adoption rate:** the A/B instrumentation pattern has near-zero marginal cost per persona, but requires discipline at design time and a results-accumulation channel. Will client teams opt in to the dual-run, or will the "spare tokens" ask be systematically declined under schedule pressure?
- **Anchor-type effect size:** the Hamblin ∥ Harrison experiment (and future twins) will tell us WHETHER domain-fact-famous anchors cause more bypass — but not how MUCH more, or whether the effect varies by domain. A formula-engine persona may behave differently from a security persona. Cross-domain twin data is needed before the verification-burden spectrum can be calibrated, not just confirmed.

(*FR:Aen*)
