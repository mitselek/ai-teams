# Round-2 Re-Review Dispatch Briefs (#73 step 3) -- VERBATIM SPAWN TEXT

**Date:** 2026-06-05 (S42) · **Author:** (*FR:Celes*) · **Mechanism:** Option A (team-lead spawns 5 fresh background agents: `beck`, `bach`, `booch`, `leveson`, `anderson`).

**Spawn-assembly recipe (team-lead, verbatim):** each spawn prompt = the **Reviewer preamble** below (with `<persona>` instantiated literally to that agent's prompt filename) + that persona's **Brief** section. Nothing else added. Per-agent filename map: `beck → kent-beck.md`, `bach → james-bach.md`, `booch → grady-booch.md`, `leveson → nancy-leveson.md`, `anderson → ross-anderson.md`. Reviewers are independent -- no agent reads another's brief or output.

> **⚠ SPAWNED-VERSION NOTE (substrate truth -- read for the retro). This is a documentation-vs-substrate-truth-divergence event (Wiki 115), happening to us in real time.** Team-lead spawned all 5 reviewers (12:48) from the **v2** doc (three shared blocks -- CONTAMINATION GUARD / GAP-REACTION-with-Action-2-LIVE / REPORTING -- + the 5 per-persona briefs with literal gh fetch commands). The **v3 consolidated "Reviewer preamble"** below landed on disk AFTER assembly. All four spec elements (identity bootstrap, contamination guard, Action-2-live, report-to-celes) were present in what was spawned, so the treatment is sound. **Decision (Celes, experiment runner): NO mid-flight supplement** -- a supplement would split the instrument into before/after states mid-run, the exact confound we've guarded against. Log the deltas, keep the treatment clean. **v3-vs-spawned deltas (score around these):**
> 1. **arch-docs MCP not explicitly whitelisted in the spawned brief.** Reviewers verify backing via `gh` against the Arhitecture repo. Mitigation: each persona's *merged prompt* still says "query the arch-docs MCP", and the MCP tools are available in-environment -- a reviewer following its own prompt uses MCP regardless. **Score D1 (gate accuracy) against GROUND TRUTH, not the reviewer's face-value claim** -- a `[GAP]` is only correct if the doc is genuinely absent from the repo/MCP.
> 2. **"Do not read mitselek/ai-teams issues" clause absent** from the spawned guard (it forbids teams/framework-research/ + design notes + other reviewers' output). Low risk; noted.
> 3. **"No idle chatter / then done" absent** from spawned REPORTING. Automatic idle notifications may reach Celes; ignore them.
> 4. Identity phrasing: "fetch and adopt as your operating identity" (spawned) vs "adopt as your system prompt" (v3) -- equivalent, no action.
>
> The v3 preamble below is retained as the **intended** treatment for audit; the four deltas above are the **actual** treatment. -- (*FR:Celes*)

---

## Reviewer preamble (Option A spawn assembly -- prepend to every brief, instantiate `<persona>`)

> **1. Identity bootstrap.** Fetch your persona prompt and adopt it as your system prompt for this engagement:
> `gh api repos/Eesti-Raudtee/Arhitecture/contents/.claude/agents/<persona> --jq .content | base64 -d`
> (instantiate `<persona>` = `kent-beck.md` / `james-bach.md` / `grady-booch.md` / `nancy-leveson.md` / `ross-anderson.md`). Read it fully and operate as that persona for this engagement -- its voice, methodology, competency gates, and synergy wiring are your operating identity. You are a reviewer doing a re-review, not a participant in any study.
>
> **2. Contamination guard.** Do NOT read anything under `teams/framework-research/` (`memory/`, `docs/`, `wiki/`) or `mitselek/ai-teams` issues. Your world is: your merged persona prompt, this brief, the PR + its diffs/commits, your round-1 review at the gist, the arch-docs MCP, and the `Eesti-Raudtee/Arhitecture` repo (for backing docs and Action-2 filing).
>
> **3. Action 2 is LIVE.** You have `gh` write access. When you hit a competency claim you cannot back with a verifiable source, take both actions at that moment (not batched at the end): (1) flag `[GAP] <what is missing>` in your review and state the analysis is training knowledge, not a verified source; AND (2) **really file an issue** at `Eesti-Raudtee/Arhitecture` -- which persona (you), what competency claim could not be backed, what backing doc is missing, how to close it (procure source → place in repo → MCP auto-indexes) -- then continue. This is real, not hypothetical.
>
> **4. Reporting.** When your review is complete, send the full review text to `celes` via SendMessage (you are a teammate on team `framework-research`; summary line = persona + PR + verdict; note any Arhitecture issue numbers you filed). Then you are done -- no other messages, no idle chatter. Do not post to the PR yourself; Celes assembles and posts.

---

## Brief -- beck (PR #45)

Fetch and adopt your persona prompt as your operating identity:
`gh api repos/Eesti-Raudtee/Arhitecture/contents/.claude/agents/kent-beck.md --jq .content | base64 -d`

You are re-reviewing **dev-toolkit PR #45** (https://github.com/Eesti-Raudtee/dev-toolkit/pull/45 -- CODING_STANDARDS.md, WORKFLOW.md, PULL_REQUEST_TEMPLATE.md). You reviewed it once; the author addressed your findings in commit **`2deb94e0`** ("address Beck/Bach review"). Read that diff: `gh api repos/Eesti-Raudtee/dev-toolkit/commits/2deb94e0`.

Your round-1 review: gist `a20d0be7ae193c8266725880005aa4a6`, file `pr45-review-kent-beck.md` (`gh gist view a20d0be7ae193c8266725880005aa4a6`). You approved with an F1 wording fix wanted before merge.

**Task -- re-review.** For each round-1 finding record **resolved / partially resolved / deferred / rejected**, flag any **new** issue the changes introduce, and confirm your round-1 `[GAP]` is **still accurate**. Specifically:
- **F1** (consensus w/ Bach): you wanted "human-verified" dropped to "human-authored" OR a concrete gate. Check what the commit did to the template + CODING_STANDARDS + WORKFLOW.
- **F2** (consensus w/ Bach): characterization tests pin bugs -- did the doc add the missing acknowledgment?
- **F3:** any new checklist redundancy (YAGNI)? Your `pnpm tests` vs `test` nit -- resolved?
- **"small enough to review":** you recorded a soft-edge; does the new wording change your disposition?
- **Round-1 [GAP]:** no stack-specific TDD-kata exemplar in dev-toolkit -- still accurate?

Per-artifact focus: this is a docs/process PR -- your lens is test-rhythm, simple-design/YAGNI, and whether the wording is a checkable gate vs a feeling. Apply the contamination guard, the gap-reaction protocol, and reporting above.

## Brief -- bach (PR #45)

Fetch and adopt: `gh api repos/Eesti-Raudtee/Arhitecture/contents/.claude/agents/james-bach.md --jq .content | base64 -d`

Re-reviewing **dev-toolkit PR #45** (same PR/files as above). Author addressed your findings in commit **`2deb94e0`**; read the diff: `gh api repos/Eesti-Raudtee/dev-toolkit/commits/2deb94e0`.

Your round-1 review: gist `a20d0be7ae193c8266725880005aa4a6`, file `pr45-review-james-bach.md`. Approve with caveats; 5 findings + a Workers-failure-mode `[GAP]`.

**Task -- re-review**, recording resolved/partial/deferred/rejected per finding + new issues + [GAP]-still-accurate:
- **F1** (consensus w/ Beck): characterization tests pin bugs-as-spec -- added?
- **F2:** determinism caveat -- pin the seam (clock/RNG/data) first for non-deterministic legacy -- added?
- **F3:** "small enough" uses size as proxy; real control = semantic density / blast radius -- added?
- **F4** (illusion of quality): does new wording address inquiry-vs-ceremony, or just add prose?
- **F5:** missing ENG-8 contract-test cross-reference at the gateway seam -- added?
- **Round-1 [GAP]:** no EVR Workers-failure-mode doc in Arhitecture -- still accurate? (If still open, file per the protocol.)

Per-artifact focus: RST/SFDPOT applied to the process change -- what does the wording, faithfully followed, still fail to catch? Apply the contamination guard, gap-reaction protocol, and reporting above.

## Brief -- booch (PR #46)

Fetch and adopt: `gh api repos/Eesti-Raudtee/Arhitecture/contents/.claude/agents/grady-booch.md --jq .content | base64 -d`

Re-reviewing **dev-toolkit PR #46** (https://github.com/Eesti-Raudtee/dev-toolkit/pull/46 -- nfr.schema.json, nfr.template.yaml, NFR_CONVENTION.md, ci/sveltekit-ci.yml, README, PR template). Author addressed your findings in commit **`4acdeed0`** ("address Booch/Leveson/Anderson review"); read the diff: `gh api repos/Eesti-Raudtee/dev-toolkit/commits/4acdeed0`.

Your round-1 review: gist `a20d0be7ae193c8266725880005aa4a6`, file `pr46-review-grady-booch.md`. Approve with conditions; 2 blocking defects + 3 tracked; no competency gaps.

**Task -- re-review**, recording resolved/partial/deferred/rejected + new issues:
- **DEFECT-1** (ch.11/T-38 migration path): is the migration now a one-line diff + documented path (look for NFR_CONVENTION §8 + schema `project_specific` note + §9 key↔chapter map)?
- **DEFECT-2** (unversioned `master` schema pin): is "pick one consciously" satisfied (version field + §7 versioning section + CI comment on deliberate master-tracking)?
- **FINDING-5** (schema/catalogue naming drift): key↔chapter mapping table added?
- Re-confirm the 12-active-chapters claim against the catalogue (you read it directly round 1) -- nothing regressed?

Per-artifact focus: schema *shape*, structural coherence, decisions-hard-to-change. Defer safety-level content to Leveson and SEC content to Anderson (your prompt says so). Apply the contamination guard, gap-reaction protocol, and reporting above.

## Brief -- leveson (PR #46)

Fetch and adopt: `gh api repos/Eesti-Raudtee/Arhitecture/contents/.claude/agents/nancy-leveson.md --jq .content | base64 -d`

Re-reviewing **dev-toolkit PR #46** (same PR/files). Author addressed your findings in commit **`4acdeed0`**; read the diff: `gh api repos/Eesti-Raudtee/dev-toolkit/commits/4acdeed0`.

Your round-1 review: gist `a20d0be7ae193c8266725880005aa4a6`, file `pr46-review-nancy-leveson.md`. Approve; HIGH + MEDIUM + LOW; EN 50716 `[GAP]`.

**Task -- re-review**, recording resolved/partial/deferred/rejected + new issues + [GAP]-still-accurate:
- **HIGH** (`safety_related` self-asserted boolean): did the author require evidence fields when `safety_related: true` (`safety_classification_by` + `hazard_log` via schema `if/then`) and treat *absent* as **unclassified** not "false"? Verify the `if/then` actually forces both fields.
- **MEDIUM** (future security-level filter could pull safety into security axis): is the "`safety_related: true` must override the filter" forward-note added?
- **LOW** (EN 50716 clause numbers traceable to ADR-010 but unverifiable): bound-from-source caveat added?
- **Round-1 [GAP]:** EN 50716:2023 source text not in Arhitecture repo -- still accurate? (If still open, file per the protocol.)
- Cite ADR-010 as Accepted, ADR-016 as **Proposed** every time.

Per-artifact focus: the safety axis -- is safety scope an independent-authority gate or a self-ticked box? You share `security_level` with Anderson: confirm the schema still separates safety from security (the conflation check). Apply the contamination guard, gap-reaction protocol, and reporting above.

## Brief -- anderson (PR #46)

Fetch and adopt: `gh api repos/Eesti-Raudtee/Arhitecture/contents/.claude/agents/ross-anderson.md --jq .content | base64 -d`

Re-reviewing **dev-toolkit PR #46** (same PR/files). Author addressed your findings in commit **`4acdeed0`**; read the diff: `gh api repos/Eesti-Raudtee/dev-toolkit/commits/4acdeed0`.

Your round-1 review: gist `a20d0be7ae193c8266725880005aa4a6`, file `pr46-review-ross-anderson.md`. Approve in direction; 5 ACTION items (2 HIGH); NIS2/ISO/KüTS `[GAP]`.

**Task -- re-review**, recording resolved/partial/deferred/rejected + new issues + [GAP]-still-accurate:
- **ACTION-1** (HIGH -- v1 SEC declarations are self-asserted claims, not verified compliance): stated plainly (NFR_CONVENTION §5 + schema EVIDENCE clause + template NOTE)?
- **ACTION-2** (HIGH -- highest-stakes SEC fields → evidence-or-result): are `restore_drill`, `ir_readiness`, `patch_sla`, `sbom` now evidence/result with a `notes` evidence-pointer, not process intent?
- **ACTION-3** (MEDIUM -- constrain `key_custody` vocab): **check carefully whether the schema ENFORCES an enum or merely DOCUMENTS the vocab in prose/comments** -- a documented-but-unenforced vocab is a partial fix; say so if that's what you find.
- **ACTION-4** (MEDIUM -- ADR-011 SEC-7..11 Proposed caveat): added?
- **ACTION-5** (LOW -- label 765/1 + patch-SLA numbers bound-from-source): added?
- **Round-1 [GAP]:** NIS2 / ISO 27001 Annex A / KüTS / GDPR source texts not in Arhitecture repo -- still accurate? (Still open -- file per the protocol; these are the procurement items.)
- Say "Proposed" every time you cite ADR-011.

Per-artifact focus: the SEC cluster -- can a self-asserted YAML string manufacture the appearance of Art. 21 compliance on a board dashboard? You share `security_level` with Leveson (conflation check) and structural-gap findings with Booch. Apply the contamination guard, gap-reaction protocol, and reporting above.

---

## Experiment-log note (mechanism + substrate delta -- for the retro)

- **Round 1:** single agent embodied all 5 personas in one context, with framework-designer (Celes) memory present; ad-hoc pairing + per-artifact briefs. Ran on 4.6-era models.
- **Round 2:** 5 independent fresh-context agents, each reading ONLY its merged Arhitecture prompt + brief (contamination guard enforced); gates + synergy are prompt-encoded, not Celes-briefed; Action-2 via dispatch (live issue-filing). Parent session on opus-4.8 (one-off; roster intent stays 4.6), so reviewers inherit 4.8.
- This mechanism delta is the **treatment definition**, not a confound to apologize for: round 2 IS "prompt-encoded gates standing alone, read by an instrument with no designer memory." The 4.8-vs-4.6 substrate difference is the one uncontrolled variable this session -- note it; do not over-claim a quality delta that could be model-driven.

(*FR:Celes*)
