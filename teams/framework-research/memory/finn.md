# Finn's Scratchpad — framework-research

## [INDEX] Reference material

- `reference/rc-team/cloudflare-builders/` — original RC team (11 agents)
- `reference/hr-devs/` — evolved project team (9 agents)
- `topics/` — 8 design topic files + T09 development methodology
- `designs/` — deployed: apex-research; new: penrose-dev, screenwerk, raamatukoi-dev, backlog-triage

## [PATTERN] rc-team vs hr-devs deltas (older harvest)

1. Spawning: rc-team Agent tool; hr-devs `spawn_member.sh`
2. Memory layout: rc-team flat `memory/`; hr-devs `memory/` + `docs/`
3. Startup: hr-devs canonical `docs/startup-shutdown.md`
4. Medici: hr-devs more detailed audit checklist

## [LEARNED] Team-lead self-check pattern

penrose-dev `team-lead.md`: "SELF-CHECK: Am I Doing The Work Myself?" with FORBIDDEN/ALLOWED tool lists.

## [PATTERN] Team sizing heuristic

team size = number of distinct abstraction boundaries, not deliverables.

## [PATTERN] Multi-Round Consensus Protocol

Seed → R1 binary claims → R2-3 refinement → R4 PO → R5 synthesis → R6 ACK. Documented in T09 (c59bc76).

## [CHECKPOINT] T09 cluster — closed (6 of 6 ACKs, c59bc76, L2.5 dropped)

## [CHECKPOINT] Discussion #56 — single-provider strategy — PAUSED at R2

R1: 9 teams, 68 slots (43 opus, 24 sonnet, 1 local). Unanimous: single-provider optimal now. R2: zero divergence; key finding: lock-in is to Claude Code *platform*, not Anthropic *models*. 3 Protocol A submissions filed by Cal. Three open items: unavailability protocol, platform-vs-provider, cost data.

## [LEARNED] Cal reclassifies submissions

Gotchas = traps to avoid; patterns = techniques to apply. Check category before submitting to Cal.

## [LEARNED] Cross-team harvest envelope

Narrow brief + strict read-only boundaries forces synthesis over sprawl. Cadence: quarterly + on-demand when sibling ships major refactor. n-way leverage: cross-team view surfaces bugs invisible to within-team audit scope.

## [PATTERN] docs/ vs topics/ write-path rule

`topics/*.md` = framework design only (T01-T09). `docs/*.md` = external assessments, harvests, one-shot research. Default to `docs/` for non-framework output.

## [POINTER] uikit-dev harvest (session 8, 2026-04-14)

Full digest: `docs/uikit-dev-harvest-2026-04-14.md`. Sections C/D = Cal candidates + 6 Aalto questions (priority Q1+Q4 > Q6+Q3 > Q2+Q5). Cadence rule + harvest envelope learnings retained above.

## [DEFERRED] Phase 2 Jira/GitFlow classification

6 candidates in digest Observations section (3 patterns, 1 gotcha, 2 decisions). HELD pending PO reconciliation with Kuzmin/Sildnik. See `docs/jira-gitflow-assessment-2026-04-14.md`.

## [LEARNED] Jira/Confluence API tips

- User lookup: `GET /rest/api/3/user?accountId=<id>` returns displayName + emailAddress.
- Confluence text extraction: HTMLParser strips `ac:structured-macro` silently — intercept macro name + extract CDATA from `ac:plain-text-body`.
- CQL `text ~` with special chars (ü, ö) returns 0 — encoding issue. Use `contributor`/`creator` (accountId-based) instead.

## [CHECKPOINT] Stakeholder profiling + apex-research V2 dependency verification

Delivered (1) sensitive stakeholder digest (path: `sensitive/ruth-turk-background-2026-04-15.md`, not committed), (2) apex-research V2 dependency verified — 5 independent evidence signals, (3) tmux-direct brief to Schliemann at apex-research:0.0, (4) EN→EE relay translation. Awaiting stakeholder's response to 3-question relay.

## [LEARNED] tmux-direct Enter-after-paste discipline

`tmux send-keys Enter` after `tmux paste-buffer` may not fire reliably in chained SSH command. Candidate Cal Protocol A gotcha: tmux-direct-brief must verify submission, not just paste.

## [PATTERN] OSS-repo structural-survey template (six-section digest)

Reusable shape for external-repo surveys: §1 what is it / §2 mechanisms exposed / §3 architectural shape / §4 framework-research relevance with HIGH/MEDIUM/LOW veins / §5 cadence signals / §6 open questions. Read top-level docs first, stop early when later files don't add signal, never read source files unless dir listing isn't enough. xireactor-brilliant survey: 7 file reads / 10 tool uses (≤12 budget).

## [LEARNED] Role-boundary discipline on ambiguous briefs

When a team-lead brief is ambiguous on AGENCY (who runs vs prepares), default to role-boundary constraint and flag — never infer authorization. Structural-discipline rule 2 applied to cross-agent briefs.

## [LEARNED] Substrate-invariant-mismatch n=3 — render-time/write-path

Derived data read at render time must be written on the write path, not backfilled async. xireactor §4(d): `[[wiki-link]]` references re-derived on POST/PUT into `entry_links`. Same shape likely in our inbox→scratchpad flows. Cal queued formal Protocol A draft.

## [CHECKPOINT 2026-04-29] Apex-research comparison delivered

`docs/apex-research-comparison-2026-04-29.md`. Q1: apex adopted #61 in 1 commit (239e35e), zero stale paths, lifecycle in inline `startup.md` blocks not separate scripts. Q2: apex 64 entries / 4 canonical dirs only / 28% multi-agent corroboration / wiki-cross-link-convention is highest-ROI cross-pollination candidate (no analog ours). Only 1 true co-discovery: `dual-team-dir-ambiguity` (already cross-cited).

## [DEFERRED] Open questions (consolidated)

- Polyphony roster redesign — awaiting PO approval
- Entu: no server-side code repo studied
- #56: cost data + unavailability protocol (paused at R2)
- 6 Aalto questions from uikit-dev harvest §D — wait for next natural contact. Priority: Q1+Q4 > Q6+Q3 > Q2+Q5
- Sibling roster cross-check (pane-labels n=2 candidate)
- Jira/GitFlow Phase 2 classification — HELD pending PO reconciliation
- Stakeholder team design — awaiting her response to 3-question relay
- Cal Protocol A on `wiki-cross-link-convention` from apex — flagged in 2026-04-29 deliverable; team-lead's call

## [UNADDRESSED] None

(*FR:Finn*)
