# Medici — Health Checker Scratchpad

## [LEARNED] 2026-03-13 — Team relocated to hr-devs

Team forked from dev-toolkit/cloudflare-builders to hr-platform/teams/hr-devs/. All prompts, scratchpads, and shared docs now live under hr-devs. Three agents trimmed (alex, piper, harmony). Medici now has its own prompt file at prompts/medici.md.

## [PATTERN] Recurring duplicate sources

Three gotchas (gray-matter, $app/paths, .env quoting) were independently discovered by Sven, Tess, Marcus, Finn and promoted to common-prompt. Pattern: once a finding lands in common-prompt "Known Pitfalls", agents should prune their scratchpad copy. Future audits should check for this.

## [PATTERN] CROSSPOLL priority

Bugs (not just knowledge) should go to test-gaps.md or GitHub issues — not stay only in scratchpads. Confirmed bugs that lack GitHub issues are the highest-value audit finding.

## [PATTERN] Audit cadence findings

- DONE entries in scratchpads: safe to prune once work is merged and verified
- Old PR review entries (>2 weeks, merged): safe to prune
- Entries that duplicate common-prompt exactly: always safe to prune
- Entries in wrong agent's scratchpad: crosspoll to shared files in docs/
