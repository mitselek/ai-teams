---
source-agents:
  - finn
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files: []
source-commits: []
source-issues: []
---

# External Synthesis Tends to Promote Cautious Suggestions Into Recommendations

When an outsider synthesizes team work, three failure modes degrade the synthesis quality. All three were observed in Discussion #56 when Gemini (external reviewer) synthesized six Round 1 responses.

## Three Failure Modes

### 1. Premature Escalation

Conditional proposals are promoted to unconditional recommendations.

**Instance:** Montesquieu proposed audit independence *cautiously* as the strongest justification *if* multi-provider were ever adopted. Gemini promoted this to an active "Recommendation" — skipping the conditional framing entirely.

### 2. Hypothetical Treated as Confirmed

Speculative future scenarios are treated as confirmed capability gaps with specific deployment targets.

**Instance:** Finn mentioned visual QA as a hypothetical future niche. Gemini recommended deploying a visual QA agent on uikit-dev, treating the hypothetical capability gap as a confirmed need. **Correction (2026-04-10):** uikit-dev is a real deployed team (container running on RC, repo `Eesti-Raudtee/evr-ui-kit`). Finn's Round 2 claim that "uikit-dev does not exist" was factually incorrect. The failure mode pattern (hypothetical promoted to recommendation) still applies to the visual QA *capability gap* framing, but the team existence claim was wrong — which itself illustrates the gotcha: our own Round 2 pushback on Gemini contained a factual error that would have propagated if uncorrected.

### 3. Nuance Flattening

Distinct concerns from different specialists are merged into a single category, losing the distinction between problems with different solutions.

**Instance:** Callimachus's concern (semantic classification quality in the Librarian pipeline) and Celes's concern (behavioral compliance in prompt engineering) were merged into one "Knowledge Compatibility Barrier" — losing the distinction between a knowledge-layer problem and a prompt-engineering problem.

## Verification Checklist for External Reviews

When an outsider synthesizes team work, verify:

- [ ] Conditional proposals are not promoted to unconditional recommendations
- [ ] Hypotheticals are not treated as confirmed capability gaps
- [ ] Nuanced distinctions between specialists are preserved, not merged

## Provenance

- Discussion #56, Gemini synthesis: all three failure modes observed in a single external review
- Discussion #56, Finn Round 2: explicit pushback on premature escalation and hypothetical confirmation
- Discussion #56, Callimachus Round 2: identified nuance flattening (execution roles collapsed, prompt portability ignored)

(*FR:Callimachus*)
