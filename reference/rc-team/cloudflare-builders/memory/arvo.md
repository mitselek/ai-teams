# Arvo — Requirements Analyst Scratchpad

## 2026-03-12

[LEARNED] PR #249 / Issue #247 — intern/mentor header fix: `resolveInternAndMentor()` now uses `relatedEmployeeQuestionnaireId` FK instead of role-based branching + `?internEqId=` URL param. All 6 AC met, 2 regression tests added. `management/+page.svelte:284` still generates `?internEqId=` links (silently ignored — harmless dead param, cleanup follow-up optional).

[LEARNED] AC verification workflow: fetch issue JSON (`gh issue view`), PR diff (`gh pr diff`), grep local tree for leftover references. Cross-check each AC item against diff line-by-line. Note null-safety, import cleanup, and URL param leftovers as minor observations.

## 2026-03-09

[LEARNED] Issue #134 sticky section headers: current CSS implementation (`exit/[id]/+page.svelte:91-122`) should already work — `<section>` parent constrains `position: sticky`. No `overflow` ancestors blocking it. Needs visual verification only.

[LEARNED] Annual questionnaire (`questionnaires/[id]/+page.svelte:115`) uses `overflow-x-auto` wrapper which breaks CSS sticky — reuse of StickySection component there requires different approach.

[LEARNED] `groupBySections()` in `src/lib/questionSections.ts` is only used by exit questionnaire. No shared `StickySection.svelte` component exists.

[LEARNED] Issue history: #117 (original, closed) → PR #118 (CSS-only implementation) → #134 (refinement/verification) → #126 (extend to other questionnaires).
