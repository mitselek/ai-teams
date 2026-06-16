# Hopper (Deployment Operator) -- Design Spec

**Audience:** PO (review), Aen (team-lead review before deploy)
**Spec author:** Celes (Agent Resources Manager), framework-research
**Source spec:** `teams/framework-research/docs/operator-role-spec-2026-05-19.md` (Brunel, 2026-05-19)
**Package location:** `designs/new/operator-role/`
**Status:** ready for TL review; deploy on Aen-approval

---

## Why this team needs this role

The framework-research team designs and ships deployment substrates for sister teams (apex-research, hr-devs, comms-dev, polyphony-dev, entu-research, uikit-dev, BT-TRIAGE, screenwerk-dev, bigbook-dev, esl-legal). Brunel is the design specialist -- he writes the Dockerfiles, compose files, and entrypoint scripts that encode each substrate's intended posture.

Until now, **operational execution** against these shipped substrates (running `docker restart`, `ssh dev@RC`, container-side inspection, host-level recovery commands) has been routed through Brunel by Aen-relay. Two failure modes accumulated:

1. **Silent scope broadening.** Brunel's prompt scopes him as analyst/design specialist, not operator. The Aen-relay flattened the scope-question -- PO routed operational asks through Aen; Aen forwarded without surfacing the boundary; Brunel either declined (which read as reluctance) or stretched (which silently widened his scope). The pattern was invisible from inside the relay; surfacing required either explicit discipline or the relay itself going down.

2. **Substrate-respect failures.** When Brunel did execute operationally, his diagnostic mode (analyze symptoms → form hypothesis → propose fix) sometimes ran ahead of his design-history awareness -- *reading the deployed-artifacts FR itself shipped*. Session 33+ surfaced this directly: Brunel diagnosed apex's `git fetch` blocker as accidental damage (sloppy historical `docker exec` leaving root-owned files); the actual cause was Brunel's own entrypoint script enforcing read-only-by-design via deliberate `chown` + `chmod` (lines 117-121 of `designs/deployed/apex-research/container/entrypoint-apex.sh`). The substrate was working as designed; reading the entrypoint first would have caught this.

**Both failure modes have the same structural shape:** the analyst/design specialist's role is preserved when operational work is dispatched to a separate operator-role; the operator's discipline mandates reading the deployed-artifacts before executing; the team-lead's relay-visibility rule prevents silent scope-broadening from re-emerging through routing.

This package defines that role (Hopper, Deployment Operator) and the co-evolving Brunel + Aen prompt amendments that close the failure modes structurally.

---

## What this role does

**Purpose statement:** Hopper executes operational commands against FR-shipped deployed substrates. Brunel diagnoses and designs; Hopper executes. The pair is the framework-research team's deployment-side execution capability.

**Tasking model:** Tasked by Brunel (diagnosis-then-dispatch loop, the common case) OR Aen (operational urgency from PO, no Brunel diagnostic involvement needed). NOT PO-direct -- PO routes through Aen or Brunel.

**Tier discrimination model:** Three tiers of operational risk:
- **R** -- read-only inspection (default-permitted, no sanction)
- **M** -- designed-recovery mutations the substrate handles by design (single-line tasker acknowledgment)
- **D** -- destructive / non-designed mutations (explicit per-task PO sanction quoted verbatim: exact command + reason + expected outcome)

**Validation discipline:** The tasker classifies tier at dispatch time; Hopper validates the classification against her read of the deployed-artifacts. Disagreement → refuse + surface back. Hopper does not silently re-classify.

**Read-deployed-artifacts discipline:** Before executing against `<team>`, read `designs/deployed/<team>/container/*`. The substrate has design intent on disk; treating it as opaque is the first-pass error. Graceful degradation when artifacts are absent (surface the gap; do not refuse).

**Audit surface:** Operations log at `teams/framework-research/docs/operations-log-<YYYY-MM>.md`, append-only, 8 required fields per entry. The deployed-artifacts-read declaration field is load-bearing: it makes the Discovery-2 anti-pattern (acting against an FR-shipped substrate without reading the FR-shipped design intent) structurally detectable.

---

## How this role pairs with Brunel and Aen

| Routing pattern | Who initiates | Who classifies tier | Who validates | Who executes | Who reports |
|---|---|---|---|---|---|
| Diagnosis-then-execution (common case) | Brunel | Brunel (dispatch package) | Hopper (against artifacts) | Hopper | Hopper to Brunel + Aen |
| Operational urgency (PO → Aen direct) | Aen | Aen (dispatch package) | Hopper (against artifacts) | Hopper | Hopper to Aen (CC Brunel if diagnostic-relevant) |
| Brunel diagnoses, Aen forwards | Brunel → Aen | Brunel (carried in forward) | Hopper (against artifacts) | Hopper | Hopper to Aen + Brunel |
| PO-direct attempt | (rejected) | n/a | n/a | n/a | Hopper surfaces back to Aen |

**Brunel is not a layer of approval.** Aen can dispatch Hopper independently when the operation is small enough to skip a Brunel-spawn. The pair-as-unit is *common*-case, not *only*-case.

---

## Package contents

| File | Purpose | Who applies it |
|---|---|---|
| `prompts/hopper.md` | Full Operator prompt -- 11 required slots from spec | Move to `teams/framework-research/prompts/hopper.md` on deploy |
| `prompts/brunel-amendments.md` | Pass-1 prose diff for Brunel's prompt -- 3 amendments | Aen applies to `teams/framework-research/prompts/brunel.md` |
| `prompts/aeneas-amendment.md` | Pass-1 prose for Aen's relay-visibility rule | Aen decides whether to land in `teams/framework-research/prompts/aeneas.md` |
| `roster-entry.json` | Proposed Hopper roster entry | Aen merges into `teams/framework-research/roster.json` members[] array |
| `first-spawn-protocol.md` | First-spawn-shape documentation (no dry-run, standard FR intro) | Reference doc; no file move on deploy |
| `design-spec.md` | This file -- PO-review artifact | Reference doc; stays in `designs/deployed/operator-role/` post-deploy |

No `common-prompt-delta.md` is included. The role-split does not require team-wide convention additions -- the operations-log convention is Operator-specific and lives in the Hopper prompt; the dispatch-package shape lives in the Brunel amendment; the relay-visibility rule lives in the Aen amendment. None of these are team-wide enough to require common-prompt updates.

---

## Acceptance criteria -- walkthrough

The original spec listed 8 acceptance criteria. Each is addressed in the package:

1. **Operator prompt exists at `teams/framework-research/prompts/<operator-name>.md`** → `prompts/hopper.md` in this package, moves to target path on deploy.
2. **Brunel prompt amended per Part B; existing scope text preserved where not contradicted** → `prompts/brunel-amendments.md` provides Pass-1 prose diff for all 3 amendments; existing Brunel sections (Volta coordination, section ownership table, scratchpad discipline) are explicitly preserved.
3. **Aen prompt amended per Part C; relay-visibility rule landed** → `prompts/aeneas-amendment.md` provides Pass-1 prose for the relay-visibility rule. Aen owns his own prompt; the amendment is a proposal.
4. **`roster.json` entry for Operator added with Celes-decided model** → `roster-entry.json` provides the entry; model is `claude-opus-4-6[1m]` (opus-tier, matching every other FR specialist -- operational judgment is heavy, sanction discipline + tier validation are not haiku-parallelisable).
5. **Operator's first-spawn protocol is documented (whether or not it's a dry-run)** → `first-spawn-protocol.md` documents the decision (no dry-run) and the rationale.
6. **Common-prompt is updated if the role-split implies new team-wide conventions (Celes's call)** → No common-prompt update is needed; the new conventions are role-specific. Explicit rationale in the Package Contents section above.
7. **The Tier R / M / D discrimination is teachable from the Operator prompt alone** → The Hopper prompt's Tier Discrimination section defines each tier with general criteria, provides the host-side vs container-side example table, and articulates the asymmetry observation (most M lives host-side; most container-side mutations escalate to D). A future-Operator reading the prompt cold can classify a novel command by applying the framework, not by lookup.
8. **Brunel's "read your own deployed artifacts" discipline is articulated such that Brunel can apply it without re-deriving the lesson from session 33+ context** → Amendment 1 in `prompts/brunel-amendments.md` articulates the discipline structurally (substrate's design intent is on disk; treating as opaque is first-pass error; cross-read producer-against-consumer applied to the deployment layer). The S33+ catalyzing incident is cited in the rationale but not load-bearing for the prose; future-Brunel applies the discipline from the prompt directly.

---

## Independence model -- locked decisions

The spec's Part A defined three "levers" for the role's independence. The locked values:

- **Lever 1 -- Who can task:** Brunel OR Aen. NOT PO-direct.
- **Lever 2 -- Tiered operational risk:**
  - R: default-permitted (no sanction)
  - M: single-line tasker acknowledgment
  - D: explicit per-task PO sanction in dispatch (exact command + reason + expected outcome, verbatim)
- **Lever 3 -- Diagnostic agency within dispatch:** limited within-dispatch agency with a hard scope-expansion gate. Allowed: probe-output reading, retry-on-transient, wait-for-readiness. Hard-gate: stop and surface back on wrong dispatch, incomplete scope, tier-reclassification mid-probe, uninterpretable output, or deployed-artifacts disagreement with dispatch.

These are not negotiable at the prompt-design level; they were PO-locked at the spec's authoring time (2026-05-19, this session). The Hopper prompt encodes them verbatim.

---

## What this design does NOT include

- **No knowledge-curator companion role.** Operator submits patterns to Callimachus directly via Protocol A, same as every other specialist. If post-deployment we observe high volume of operational-pattern submissions (Phase-2-gate-equivalent: 15+ operations-pattern entries + 10+ operational queries), an apex-research-Eratosthenes-style operational-knowledge sibling can be proposed. Until then: Cal handles it. Same Phase-2 discipline applied to Gaius on esl-legal.
- **No first-spawn dry-run.** Documented decision; see `first-spawn-protocol.md`.
- **No substrate enumeration in the prompt.** The Hopper prompt names current substrates as documentation, not as a closed enumeration. The rule is generic: any deployment in `~/bin/rc-deployments.json` that FR ships through Brunel's design discipline. Graceful degradation when `designs/deployed/<team>/` artifacts are absent on disk.
- **No machine-identifier changes (Pass 2 work).** All amendments are Pass-1 prose. Brunel's `agentType: general-purpose` stays. Hopper joins as a new member with `agentType: general-purpose`. No filename renames, no field-name changes.

---

## Open questions for Aen at TL review

1. **Hopper's color:** PO sign-off specified "navy blue" tied to her actual rank. Volta already uses `blue` in the FR roster. The roster-entry.json proposes `"color": "navy"` (option 2 in the file's `__color_note`); fallback is `"blue"` with lore explanation. Aen's call at merge.
2. **Placement of Brunel's three amendments:** Each amendment proposes a placement (subsection under existing section, or new section parallel to Volta-coordination block). Aen may prefer different structural placements; the prose stands regardless.
3. **Aen amendment landing:** The relay-visibility rule is proposed; Aen owns his own prompt. Land or hold for further session-experience? Optional courtesy-message to PO at deploy-time (shape provided in `aeneas-amendment.md`) -- Aen's call.
4. **Color overlap with Brunel's tier-table notation:** Hopper prompt embeds Brunel's drafted Tier table verbatim. If Aen sees field-set divergence between Brunel's intended dispatch-package shape (in Brunel-Amendment 3) and Hopper's validation expectations (in Hopper's Sanction Discipline + Pairing sections), surface back -- this is a typed contract and the producer/consumer pair should match field-for-field.

---

## Deploy shape (post-TL-approval)

Following S32 pattern (`mv designs/new/<package>/ → designs/deployed/<package>/` after prompts ship into `teams/framework-research/prompts/`):

1. Aen reviews this package and accepts (or pushes back). Celes applies any corrections.
2. On accept: Aen applies `roster-entry.json` to roster.json, Brunel-Amendment-1+2+3 to brunel.md, Aeneas-Amendment to aeneas.md (if landing), and moves `prompts/hopper.md` to `teams/framework-research/prompts/hopper.md`.
3. Aen commits the changes with attribution.
4. Aen moves `designs/new/operator-role/` → `designs/deployed/operator-role/` (preserves `design-spec.md` and `first-spawn-protocol.md` as reference artifacts).
5. Optional: Aen sends the courtesy message to PO (shape in `aeneas-amendment.md`) so PO knows the new routing pattern at the next operational ask.

Hopper is spawnable in the next session after deploy. First dispatch from PO (via Aen) will exercise the boundary; the operations-log file `docs/operations-log-2026-05.md` will be created on Hopper's first dispatch of May 2026.

(*FR:Celes*)
