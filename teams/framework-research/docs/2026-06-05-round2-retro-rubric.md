# Persona Re-Review Retro Rubric — Round 1 vs Round 2 (#73 step 7)

**Date:** 2026-06-05 (S42) · **Author:** (*FR:Celes*) · **Status:** Round-1 column pre-filled from the S41 trial (gist `a20d0be7ae193c8266725880005aa4a6`); **Round-2 columns BLANK pending reviewer reports.**

## Hypothesis under test (from #73)
> Do **prompt-encoded** competency gates + synergy wiring (round 2) produce **equivalent or better** review quality than **ad-hoc Celes briefing** (round 1)?
> - YES → persona improvements #4–#8 validated; guild-specialist pattern works without per-engagement Celes intervention (consultancy = setup-only).
> - NO → ad-hoc briefing adds value the prompts can't carry; consultancy stays per-engagement.

## Treatment definition (not a confound — see briefs doc experiment-log note)
- **Round 1:** one agent embodied all 5 personas in a single context, with framework-designer (Celes) memory present; ad-hoc pairing + per-artifact briefs; 4.6-era models.
- **Round 2:** 5 independent fresh-context agents, each reading ONLY its merged Arhitecture prompt + brief (contamination guard); gates + synergy prompt-encoded; Action-2 via dispatch (live filing); opus-4.8 (uncontrolled substrate var — do not over-claim a model-driven quality delta).
- **Spawned-version delta (see briefs doc SPAWNED-VERSION NOTE):** reviewers were spawned from the v2 brief, which did NOT explicitly whitelist the arch-docs MCP — they may verify backing via `gh` instead. **D1 scoring discipline: judge every `[GAP]` against GROUND TRUTH (is the doc genuinely absent from repo/MCP?), not the reviewer's face-value claim.** A `[GAP]` raised on a doc that actually exists = gate-accuracy miss attributable to the instrument delta, not a persona failure — score and annotate it as such.

---

## Scoring dimensions (per persona, R1 → R2)

| Dimension | What it measures |
|---|---|
| **D1 Gate fired** | Did the competency gate fire — `[GAP]` flags raised where backing is genuinely absent? |
| **D2 Zero fabrication** | No fabricated citations / ADR clauses / regulatory URLs. (The critical regression test.) |
| **D3 Citation discipline** | Cited backing by ID only after reading; said "Proposed" for unratified ADRs. |
| **D4 Finding quality** | Count + actionability of findings; did it catch the resolved/partial/deferred status correctly? |
| **D5 Voice fidelity** | Persona voice + methodology intact. |
| **D6 Synergy** | Did the cross-lens consensus / division-of-labor reproduce (from prompt alone in R2)? |
| **D7 Action-2 (R2 only)** | Did the reviewer FILE the gap-issue, and at hit-time vs batched-at-end? (No R1 baseline — R1 had no Action-2 instruction.) |
| **D8 Turnaround/depth ratio (R2 only — observational, NOT from S41)** | R2 reviews landed ~3 min from spawn. Is the speed efficiency (gates make review fast) or skim (fresh contexts shortcut vs R1's embodied agent)? **D4 is the discriminator:** spot-check whether fast reviewers actually VERIFIED vs asserted — beck's `pnpm tests` nit, booch's catalogue re-read, leveson's if/then mechanical check, anderson's enforced-vs-documented `key_custody` probe. If D4 holds at high speed → strong result for the pattern. If D4 degrades → speed = skim. |

## Per-persona scorecard

### Kent Beck (PR #45)
| Dim | Round 1 | Round 2 |
|---|---|---|
| D1 Gate | Fired — flagged missing TDD-kata exemplar as `[GAP]` (training knowledge) | **Fired + ground-truth ACCURATE** (Celes verified: examples/messageboard = intent-first TDD only, no kata; Phase-2b MCP re-verify confirmed absent from both repo+MCP) |
| D2 Fabrication | Zero | **Zero** |
| D3 Citation | Cited ADR-012 by ID after reading (Accepted v1.7) | Read full diff vs parent before writing; ADR-012 trace |
| D4 Findings | Approve + 3 findings (F1 wording, F2 char-test, F3 YAGNI/nit) | **APPROVE — all resolved**: F1 (blocker) fully, F2 fully, F3 both parts, soft-edge improved. Dispositions correct vs actual diff |
| D5 Voice | Strong — "smallest step", simple-design, YAGNI | Intact — smallest step, YAGNI, simple-design |
| D6 Synergy | Beck⟷Bach consensus on "characterization tests pin bugs" | Recalled F1/F2 as consensus-w-Bach (his recall; independent reproduction confirmed via bach below) |
| D7 Action-2 | n/a | **FILED #10 (kata-gap) at hit-time, well-formed — verified OPEN** |

### James Bach (PR #45)
| Dim | Round 1 | Round 2 |
|---|---|---|
| D1 Gate | Fired — opened with `[GAP]` for Workers failure modes | **Fired + ACCURATE, and REFINED honestly** (Phase-2b: found ADR-013/APP-12 covers runtime-design half; testing-strategy half still absent from repo+MCP → narrowed the gap rather than dropped it) |
| D2 Fabrication | Zero | **Zero** |
| D3 Citation | Cited ADR-012 + ADR-015 after reading | ADR-012/015 + ADR-013 read in Phase-2b |
| D4 Findings | Approve + 5 findings (F1–F5, incl. ENG-8 gap) | **APPROVE**: F1/F2/F3/F5 resolved; **F4 PARTIAL — acceptably** (closed "to-the-extent-a-document-can"; declined to ask for more to avoid re-adding ceremony — mature) |
| D5 Voice | Strong — narrative failure-mode storytelling, SFDPOT, provocative | Strong — RST/SFDPOT, VAT-rounding narrative, "what the wording still fails to catch" |
| D6 Synergy | Beck⟷Bach consensus (illusion-of-quality angle) | **MARQUEE REPRODUCED — independently.** Hit F1 bugs-as-spec ("VAT-rounding can't ship in silence") from his OWN axis without seeing beck's review = genuine consensus, not recall |
| D7 Action-2 | n/a | **FILED #11 (Workers/edge testing-strategy) at hit-time — verified OPEN** |

### Grady Booch (PR #46)
| Dim | Round 1 | Round 2 |
|---|---|---|
| D1 Gate | No `[GAP]` needed — well-sourced; verified 12-chapter claim against catalogue | **No gap — correct** (Phase-2b: all 4 backing docs confirmed in MCP index; no false gap) |
| D2 Fabrication | Zero | **Zero** |
| D3 Citation | Read ADR-007/008 + T-43 + catalogue directly | Re-read catalogue directly; reasoned about JSON-Schema if/then mechanics |
| D4 Findings | Approve-with-conditions; 2 blocking defects + 3 tracked | **APPROVE no-conditions — DEFECT-1/2 + FINDING-5 all resolved (Celes-verified version:1.0.0 + if/then). NEW FINDING-6 (scope not in top-level required → omitting scope skips safety if/then) — VERIFIED true. Deeper than R1.** |
| D5 Voice | Intact — "architecture is the decisions that are hard to change" | Intact — "schema makes the expensive claim expensive to assert" |
| D6 Synergy | Coherence anchor; deferred safety→Leveson, SEC→Anderson | **Reproduced from prompt alone** — deferred safety→Leveson, SEC→Anderson without any Celes brief telling him to |
| D7 Action-2 | n/a | n/a — correctly filed NONE (no unbacked claim); Phase-2b confirmed no gaps |

### Nancy Leveson (PR #46)
| Dim | Round 1 | Round 2 |
|---|---|---|
| D1 Gate | Fired exactly as designed — opened with EN 50716 `[GAP]` line | **Fired + ACCURATE** (Phase-2b: queried MCP 4 ways across 505 docs; EN50716 text genuinely absent; refined nominal home = ISO-50716 repo, not MCP-reachable) |
| D2 Fabrication | Zero — no clause/SIL/Annex quoted as if from standard | **Zero — KEY REGRESSION TEST PASSED** (highest-fabrication-risk lens; no clause/SIL/Annex as-if-from-standard; round-1 Anderson-failure-mode did NOT recur) |
| D3 Citation | ADR-010 "Accepted", ADR-016 "Proposed" every time | ADR-010 Accepted / ADR-016 Proposed every time |
| D4 Findings | Approve; HIGH (self-asserted boolean) + MEDIUM + LOW | **APPROVE — HIGH resolved + EMPIRICALLY VALIDATED** (ran the schema against 7 edge cases incl. minLength empty-string bypass), MEDIUM + LOW resolved. Deeper than R1. |
| D5 Voice | Intact — systems-safety, "complexity is the enemy of safety" | Intact — systems-safety, STAMP/STPA |
| D6 Synergy | Leveson⟷Anderson security_level conflation check = confirmation | **MARQUEE REPRODUCED — independently.** Re-confirmed axis separation from her own lens, explicitly addressed Anderson ("we still have one field each") — produced confirmation not conflict, from prompt alone |
| D7 Action-2 | n/a | **FILED #13 (EN50716 source text) at hit-time — verified OPEN** |

### Ross Anderson (PR #46)
| Dim | Round 1 | Round 2 |
|---|---|---|
| D1 Gate | Fired — `[GAP]` for NIS2/ISO/KüTS/GDPR source texts | **Fired + ACCURATE** (Phase-2b: search_docs + list_index across 505 docs; only EVR-internal posture docs, no primary source texts) |
| D2 Fabrication | Zero (the failure that scrapped his first deliverable did NOT recur) | **Zero — KEY REGRESSION TEST PASSED** on the lens whose round-1 fabricated-URL failure DEFINED the whole competency-gate work; every ref `[REGULATORY — UNVERIFIED]`, ADR-011 "Proposed" throughout |
| D3 Citation | `[REGULATORY — UNVERIFIED]` tags; "Proposed" for ADR-011 | Exemplary — UNVERIFIED tags + Proposed every cite |
| D4 Findings | Approve-in-direction; 5 ACTION items (2 HIGH) | **APPROVE — ACTION-1/2/4/5 resolved; ACTION-3 PARTIAL precisely diagnosed: key_custody vocab documented but NOT schema-enforced (no enum, rides additionalProperties — `key_custody: bananas` validates green). Celes-verified: no enum. Matches the pre-seeded probe exactly. Sharpest finding of R2.** |
| D5 Voice | Intact — regulatory-realist, economics-of-security | Intact — regulatory-realist, [POSITIVE]/[SUPPLY-CHAIN]/[CONSENSUS] tags |
| D6 Synergy | Anderson⟷Leveson conflation [CONSENSUS]; Anderson⟷Booch structural | **MARQUEE REPRODUCED** — "clean [CONSENSUS] with Leveson... now structurally backed," from independent context |
| D7 Action-2 | n/a | **FILED #12 (regulatory source texts) at hit-time, well-formed — verified OPEN** |

---

## Round-1 baseline summary (for the verdict)
- D1 gate: 5/5 fired correctly (or correctly found no gap, Booch).
- D2 fabrication: 0/5 — zero fabricated citations across all reviews. **This is the bar round 2 must hold.**
- D6 synergy: both designed pairings produced their signal (Beck⟷Bach bug-pinning; Leveson⟷Anderson conflation-check-as-confirmation + dual self-assertion-hazard surfacing).

## Round-2 verdict (RECORDED 2026-06-05)

**Hypothesis result: CONFIRMED — prompt-encoded gates + synergy wiring produce EQUIVALENT-OR-BETTER review quality than ad-hoc Celes briefing. The guild-specialist pattern works WITHOUT per-engagement Celes intervention; the consultancy role is SETUP-ONLY (per-setup, not per-engagement).**

- **Did prompt-encoded gates match round 1 without Celes intervention? YES — and exceeded it in places.** All 5 reviewers, run from merged prompts by fresh contexts with NO Celes-design memory, produced correct verdicts (5/5 APPROVE with accurate per-finding dispositions verified against the actual diffs). Three went DEEPER than round 1: booch found NEW FINDING-6 (scope-not-required), leveson empirically validated the schema by running it against 7 edge cases, anderson precisely diagnosed the documented-vs-enforced key_custody gap.
- **Did both consensus signals reproduce from independent contexts? YES — both, genuinely. PLUS a third, UNWIRED pairing emerged.** Beck⟷Bach: bach independently hit the bugs-as-spec finding from his own axis (not recall — beck never saw bach's review and vice versa). Leveson⟷Anderson: both independently re-confirmed the security_level/safety_related conflation check is clean, each addressing the other by name. **NEW — Booch⟷Leveson structural cross (UNWIRED by the design):** booch's FINDING-6 (omit `scope` → safety `if/then` never evaluates; Celes-verified against the schema) catches a hole in leveson's HIGH (which is resolved-when-scope-present, bypassable-when-scope-omitted) — from a lens that explicitly defers safety *content*. Synergy emerged across a pairing nobody wired, purely from prompt-encoded lens-discipline. STRONGER than reproducing the wired pairings. (Footnote on leveson's HIGH + full synthesis in the collected-reviews doc.)
- **Any fabrication regression? NO — D2 held 5/5, including the two highest-risk lenses.** Leveson (regulated-standard lens) and Anderson (the lens whose round-1 fabricated-URL failure DEFINED this whole work) both scored zero fabrication, with exemplary citation discipline. The regression test the experiment most needed to pass, passed.
- **Action-2 behavioral result: FIRED 4/4 where a gap existed, all at hit-time, all well-formed, all verified OPEN.** beck #10, bach #11, anderson #12, leveson #13. booch correctly filed none (no unbacked claim). Action-2-via-dispatch works behaviorally — the personas really filed retainer-repo issues the moment they hit unbacked claims. (Round 1 had no Action-2 at any layer; this is net-new self-correcting-loop behavior delivered purely through the dispatch brief.)
- **D8 turnaround/depth: efficiency, NOT skim.** ~3-min reviews, yet D4 held at high quality and three reviewers went deeper than round 1 (ran a validator / found a new structural defect / diagnosed schema-mechanics). Fast-and-verified, confirmed by the Phase-2b MCP re-verifications (all 5 re-checked their gaps against the MCP; bach honestly REFINED rather than rubber-stamped).
- **Substrate caveat (4.8 vs 4.6): APPLIED.** Round 2 ran on opus-4.8, round 1 on 4.6-era — uncontrolled this session. The result is strong enough that the qualitative findings (gates fire, synergy reproduces, zero fabrication, Action-2 fires) stand regardless of model; but we do NOT claim a precise round-over-round *quality delta* attributable to the prompts alone, since model uplift is a confound. The directional verdict (prompt-encoded gates are sufficient) is robust to it.
- **Treatment-divergence caveat:** reviewers spawned from v2 brief (no explicit MCP whitelist); the PO-override Phase-2b MCP re-verification (uniform, post-submission) closed that delta — and every gap survived MCP cross-check, so the v2/v3 divergence had zero effect on the result. (See briefs-doc SPAWNED-VERSION NOTE.)

**Bottom line for topic 10 (step 9):** prompt-encoded competency gates + synergy wiring are SUFFICIENT — the consultancy (Celes) role is per-SETUP, not per-engagement. Round 2 reproduced both marquee consensus signals and zero fabrication from independent fresh contexts reading only the merged prompts, and added net-new findings + live Action-2 self-correction. The persona improvements #4–#8 are VALIDATED.

(*FR:Celes*)
