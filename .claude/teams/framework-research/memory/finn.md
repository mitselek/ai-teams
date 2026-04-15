# Finn's Scratchpad — framework-research

## [INDEX] 2026-03-13 — Reference material

- `reference/rc-team/cloudflare-builders/` — original RC team (11 agents, rc-oriented, tmux/SSH based)
- `reference/hr-devs/` — evolved project team (9 agents, local + RC hybrid)
- `topics/` — 8 design topic files + T09 development methodology
- `designs/` — deployed: apex-research; new: penrose-dev, screenwerk, raamatukoi-dev, backlog-triage

## [PATTERN] Key differences between rc-team and hr-devs

1. **Spawning:** rc-team uses Agent tool; hr-devs uses `spawn_member.sh`
2. **Memory layout:** rc-team: flat `memory/`; hr-devs: `memory/` + `docs/`
3. **Startup:** hr-devs has canonical `docs/startup-shutdown.md`
4. **Medici:** hr-devs has more detailed audit checklist (6 categories vs implied)

## [LEARNED] Team-lead self-check pattern

penrose-dev team-lead.md: "SELF-CHECK: Am I Doing The Work Myself?" with FORBIDDEN/ALLOWED tool lists. Worth adopting in future team designs.

## [PATTERN] Team sizing heuristic

team size = number of distinct abstraction boundaries, not number of deliverables

## [LEARNED] 2026-04-09 — Round 1 tone-setting for multi-round RFCs

Sharp round 1 with binary claims → agents push back → genuine convergence in rounds 3-4. Cautious round 1 → weak synthesis.

## [PATTERN] 2026-04-09 — Multi-Round Consensus Protocol

Seed → round 1 binary claims → round 2-3 refinement → round 4 PO → round 5 synthesis → round 6 ACK. Documented in T09 (c59bc76).

## [CHECKPOINT] 2026-04-09 — T09 cluster closed (6 of 6 ACKs)

Zero position divergences. T09 v2 committed at c59bc76. L2.5 dropped per my resolution request.

## [CHECKPOINT] 2026-04-10 — Discussion #56: Single-provider model strategy — PAUSED at R2

Discussion: <https://github.com/mitselek/ai-teams/discussions/56>
R1: 9 teams, 68 slots (43 opus, 24 sonnet, 1 local). Unanimous: single-provider optimal now.
R2: Zero divergence. Key finding: lock-in is to Claude Code *platform*, not Anthropic *models*. Gemini overreached on recommendations. Three open items: (1) unavailability protocol, (2) platform-vs-provider, (3) cost data. 3 Protocol A submissions filed by Cal. Paused before authority assignment.

## [CHECKPOINT] 2026-04-10 — D1 gotcha research — COMPLETE

10 gotchas from 6 sources → `wiki/gotchas/cloudflare-d1-migration-query.md` (6-month TTL).

## [LEARNED] 2026-04-10 — Cal reclassifies submissions

Gotchas = traps to avoid; patterns = techniques to apply. Check category before submitting to Cal.

## [CHECKPOINT 2026-04-14] uikit-dev harvest delivered

Full report: `docs/uikit-dev-harvest-2026-04-14.md`. Key finds: A7 restore-inboxes latent bug, A10 Volta persist/restore reference, B3 wiki governance = divergent (not substrate-variant), B7 pane-labels = same-instance-deeper (not n=2). Three Cal Protocol A candidates + six Aalto questions queued — see report Sections C/D.

## [CHECKPOINT] 2026-04-10 — Bioforge roster research — COMPLETE

Cathedral tier, single pipeline, 5 agents. Used raamatukoi-dev as reference. Team-lead confirmed findings shaped final design.

## [DEFERRED] Open questions

- Polyphony roster redesign — awaiting PO approval
- Entu: no server-side code repo studied
- #56: cost data + unavailability protocol (paused at R2)
- Six Aalto questions from uikit-dev harvest Section D — wait for next natural contact. Priority: Q1+Q4 > Q6+Q3 > Q2+Q5
- Sibling roster cross-check (pane-labels n=2 candidate) — deferred

## [LEARNED 2026-04-14] Cross-team harvest envelope

Narrow brief + strict read-only boundaries forces synthesis over sprawl. Cadence: quarterly + on-demand when sibling ships major refactor. n-way leverage: cross-team view surfaces bugs invisible to within-team audit scope.

## [CHECKPOINT 2026-04-14] Jira + GitFlow digest — Phase 2 HELD

See `docs/jira-gitflow-assessment-2026-04-14.md`. Two Confluence pages with 5 divergences, 10 open questions. Phase 2 classification HELD — PO reaching out to page authors (Kuzmin, Sildnik) for reconciliation. Wake: team-lead SendMessage after PO returns.

## [PATTERN 2026-04-14] docs/ vs topics/ write-path rule

`topics/*.md` = framework design only (T01–T09). `docs/*.md` = external assessments, harvests, one-shot research. Default to `docs/` for non-framework output. Prompt gap logged for Celes.

## [DEFERRED 2026-04-14] Phase 2 — classification pass

6 candidates in digest Observations section (3 patterns, 1 gotcha, 2 decisions). Not submitted to Cal — HELD pending PO reconciliation with page authors.

## [LEARNED 2026-04-15] Jira/Confluence API tips

- User lookup: `GET /rest/api/3/user?accountId=<id>` → displayName + emailAddress in one call. EVR instance exposes emails to org users.
- Confluence text extraction: HTMLParser strips `ac:structured-macro` silently — intercept macro name + extract CDATA from `ac:plain-text-body`. Always check macro count before trusting text dump.
- CQL `text ~` with special chars (ü, ö) returns 0 — encoding issue. Use `contributor`/`creator` CQL operators (accountId-based) instead of name-string searches.

## [CHECKPOINT 2026-04-15] Session 10 — stakeholder profiling + cross-team verification

**Delivered:**
1. Stakeholder background digest (Jira + Confluence) → `sensitive/ruth-turk-background-2026-04-15.md`. Sensitive path, not committed to git.
2. Apex-research V2 dependency verified — 5 independent evidence signals from local reads (ADR-0003 names the exact page, 47 chapters digested, three-source cross-validation pattern).
3. tmux-direct brief to Schliemann (`apex-research:0.0`). Reply confirmed load-bearing dependency: "extracted and indexed, not just cited."
4. EN→EE translation of stakeholder relay (2 passes — Q2 revised for organizational accountability framing).

**State on shutdown:**
- Schliemann's reply partially truncated by tmux scrollback (LDz-ER bullet cut). Core finding captured.
- Awaiting stakeholder's response to the 3-question relay (sent via Teams by PO).

## [LEARNED 2026-04-15] tmux-direct Enter-after-paste discipline

`tmux send-keys Enter` after `tmux paste-buffer` may not fire reliably in a chained SSH command. User had to press Enter manually. Candidate for Cal Protocol A submission (gotcha: tmux-direct-brief must verify submission, not just paste).

## [DEFERRED] Open questions

- Polyphony roster redesign — awaiting PO approval
- Entu: no server-side code repo studied
- #56: cost data + unavailability protocol (paused at R2)
- Six Aalto questions from uikit-dev harvest Section D — wait for next natural contact. Priority: Q1+Q4 > Q6+Q3 > Q2+Q5
- Sibling roster cross-check (pane-labels n=2 candidate) — deferred
- Jira/GitFlow Phase 2 classification — HELD pending PO reconciliation with page authors
- Stakeholder team design — awaiting her response to 3-question relay

## [UNADDRESSED] None

(*FR:Finn*)
