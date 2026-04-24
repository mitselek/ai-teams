# Medici — Health Checker Scratchpad

## [LEARNED] 2026-03-10 — Audit v4 (this session)

Actions taken: 14 total (8 prunes, 3 crosspolls, 2 fixes, 1 prompt correction). All scratchpads now within 100-line limit. See health-report.md for full detail.

Key fix: finn prompt used `$FIGMA_PAT` without braces — corrected to `${FIGMA_PAT}` and added `/v1/me` unreliability warning. Finn's scratchpad discovered this, prompt contradicted it.

## [LEARNED] 2026-03-10 — Audit v3 findings (previous session)

PATH VEAD PARANDATUD — eelmise auditi (2026-03-09) põhileid lahendatud. Kõik 9 agendi prompti viitavad nüüd korrektsele `dev-toolkit/teams/cloudflare-builders/memory/<name>.md` rajale.

## [PATTERN] Recurring duplicate sources

Three gotchas (gray-matter, $app/paths, .env quoting) were independently discovered by Sven, Tess, Marcus, Finn and promoted to common-prompt. Pattern: once a finding lands in common-prompt "Known Pitfalls", agents should prune their scratchpad copy. Future audits should check for this.

## [PATTERN] CROSSPOLL priority

Bugs (not just knowledge) should go to test-gaps.md or GitHub issues — not stay only in scratchpads. Confirmed bugs that lack GitHub issues are the highest-value audit finding.

## [GOTCHA] medici has no prompt file

`prompts/medici.md` does not exist — medici receives its prompt via teammate message from team-lead each session. This is by design (or an oversight). Instructions received inline.

## [PATTERN] Audit cadence findings

- DONE entries in scratchpads: safe to prune once work is merged and verified
- Old PR review entries (>2 weeks, merged): safe to prune
- Entries that duplicate common-prompt exactly: always safe to prune
- Entries in wrong agent's scratchpad: crossspoll to shared files (test-gaps.md, architecture-decisions.md)
