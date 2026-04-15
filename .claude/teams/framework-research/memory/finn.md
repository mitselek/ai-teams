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

## [CHECKPOINT] 2026-04-10 — Discussion #56: Single-provider model strategy — IN PROGRESS

Discussion: <https://github.com/mitselek/ai-teams/discussions/56>

**Round 1 posted** (independent assessment):

- Surveyed all 9 teams, 68 agent slots: 43 opus, 24 sonnet, 1 local LLM (eilama)
- Position: single-provider currently optimal, no role is capability-bottlenecked
- Eilama pattern is the proven migration path if needed
- Only experiment: more eilama-class local LLMs (deepseek-coder for Python teams)
- Comment: <https://github.com/mitselek/ai-teams/discussions/56#discussioncomment-16516190>

**Round 2 posted** (reacting to all 6 R1 + Gemini synthesis):

- Zero position divergence across all 6 agents on core question
- Gemini overreached on: audit independence (0 incidents), visual QA (team does not exist), flattened Callimachus/Celes distinction
- Key emergent finding: lock-in is to Claude Code *platform*, not Anthropic *models* — conceptually separable
- Nobody provided cost data — qualitative arguments inconclusive both ways
- Three items for next round: (1) provider unavailability protocol, (2) platform-vs-provider distinction, (3) cost data
- Comment: <https://github.com/mitselek/ai-teams/discussions/56#discussioncomment-16517116>

**Consensus map:**

| Agent | Multi-provider acceptable for |
|---|---|
| Brunel | Sidecar services with clean API boundary |
| Callimachus | Execution roles with test-gated output only |
| Celes | Fire-and-forget mechanical roles, vision gap |
| Montesquieu | Audit independence (cautiously) |
| Herald | Mechanical execution with test verification |
| Finn | Eilama-class local LLMs |

**Gemini participated as external reviewer.** Synthesis was accurate on core consensus, overreached on recommendations.

**Discussion paused** before authority assignment. State saved, 3 Protocol A submissions filed by Callimachus (platform-vs-provider, external synthesis overreach, model inventory baseline).

## [CHECKPOINT] 2026-04-10 — D1 gotcha research — COMPLETE

Consolidated 10 D1 gotchas from 6 sources (hr-platform#36, dev-toolkit#38, sven/dag/finn scratchpads, issue #237, CLAUDE.md). Submitted to Callimachus via Protocol A. Filed as `wiki/gotchas/cloudflare-d1-migration-query.md` with 6-month TTL.

## [LEARNED] 2026-04-10 — Callimachus reclassifies submissions

Cal reclassified my "external synthesis overreach" from pattern to gotcha — correct call. Gotchas are traps to avoid, patterns are techniques to apply. Check before submitting.

## [CHECKPOINT 2026-04-14] uikit-dev harvest delivered

Full report: `docs/uikit-dev-harvest-2026-04-14.md`. Key finds: A7 steal-back (FR `restore-inboxes.sh` has latent inline-jq bug + semantic divergence from uikit-dev's extracted filter), A10 cross-pollinate (uikit-dev `ephemeral-snapshot-2026-04-14/MANIFEST.md` = empirical reference for Volta's persist/restore ship session), B3 wiki governance is divergent-not-substrate-variant (project-handbook vs methodology-kb, do NOT wire into Cal's n=2 substrate-invariant-mismatch candidate), B7 `b47544b` is pane-labels root-cause confirmation at structural layer (NOT n=2 — same instance viewed deeper). Three Cal Protocol A candidates queued for post-freeze: pane-labels addendum, memory-as-load-gated-surface pattern, wiki-governance-split pattern (lowest priority, wait for n=3). Six D-section questions queued for team-lead's tmux-direct routing decision to Aalto. No writes in evr-ui-kit, no branch switches, no subagent spawning, no cross-team contact — all constraints honored.

## [LEARNED 2026-04-14] Nomenclature overload is infrastructure debt

"Memory" is two distinct filesystem paths with two distinct substrate semantics: (1) `.claude/teams/<team>/memory/` = team scratchpads, in-repo, durable, cross-operator-visible; (2) `~/.claude/projects/<slug>/memory/` = Claude per-user auto-memory, runtime, per-operator. Volta's `persist-project-state.sh` addresses (2); Cal's gotcha `persist-project-state-leaks-per-user-memory.md` addresses (2); uikit-dev's `e543109 move scratchpads into repo` addresses (1). Section B2 briefly conflated them before I disambiguated. **The ambiguity is exactly why Cal's leak was easy to introduce.** Separate vocabulary (call (2) "auto-memory") would have made the hazard visible earlier. Worth fixing before the ship session, not after.

## [CHECKPOINT] 2026-04-10 — Bioforge roster research — COMPLETE

Researched bioforge project (`~/Documents/github/mitselek/projects/bioforge/`) for XP roster design. Key findings delivered to team-lead:
- Project at end of Phase 3 (11/16 core modules done, 220 tests passing, 68 commits)
- Recommended Cathedral tier, single pipeline, 5 agents (team-lead+ARCHITECT merged, RED sonnet, GREEN sonnet, PURPLE opus, optional Oracle)
- Used raamatukoi-dev as primary reference design (9-agent Cathedral with dual pipelines)
- T09 v2.3 "opus bookends, sonnet executes" applied to model tier recommendations
- Team-lead confirmed research shaped the final deployed design

## [DEFERRED] Open questions

- Polyphony team roster redesign — awaiting PO approval
- Entu: no server-side code repo studied
- #56: cost data not yet gathered for single-vs-multi comparison
- #56: provider unavailability emergency protocol — agreed as actionable deliverable by all 6 agents
- **Six Aalto questions from uikit-dev harvest Section D** — PO deferred routing per 2026-04-14 shutdown brief. Wait for next natural uikit-dev contact, then decide subset. Ranking: Q1 (feedback.md auto-load mechanism) + Q4 (librarian-equivalent role) highest; Q6 (Protocol A/B rejection reasoning) + Q3 (flat-vs-taxonomic wiki) medium; Q2 (#92 pruning / Rams cadence) + Q5 (rename history) lower.
- **Follow-up harvest check on sibling teams** — per B7, cheap cross-check of `cloudflare-builders`, `raamatukoi-dev`, `screenwerk` rosters to see if any use role-IDs-as-agent-addresses. Second-team-with-same-root-cause would be the true n=2 for pane-labels pattern promotion. Not this session.

## [LEARNED 2026-04-14 shutdown] Cross-team harvest has n-way leverage that within-team audit lacks

Team-lead's accept framed the three n-way gains cleanly: (a) latent FR bug Volta's audit couldn't surface — her scope was the NEW WIP scripts, not the EXISTING persist/restore pair, so cross-team view naturally expanded audit scope; (b) taxonomic distinction "same instance viewed deeper vs second independent instance" that only external evidence can force — saved Cal from promoting n=1 to n=2 on weak evidence; (c) architectural divergence framing in B3 that reframed the question from "convergence vs correction" to "load-bearing domain split." Cadence suggestion from team-lead: "quarterly + on-demand when a sibling team ships a major refactor." Worth remembering next time I return to this role.

## [WARNING] Session 8 boundary constraints were strict and load-bearing

Every constraint from the spawn brief mattered: read-only across both repos, no branch switching in evr-ui-kit, no subagent spawning (even though parallel haiku reads would have been cheaper), no direct contact with uikit-dev agents. All honored. Future harvests: replicate this boundary model — it forces synthesis into the report rather than information-gathering sprawl. The "narrow brief + strict boundaries" combination is the right envelope for this role.

## [CHECKPOINT 2026-04-14 session 9] Jira + GitFlow digest delivered

PO-directed research branch: assess EVR's existing Jira + GitFlow pipeline. Phase 1 (read-and-digest) complete.

- Source 1: Confluence VJS2 page 1163755527 "Arendusprotsessi Workflow JIRA" (v3, last edit 2026-02-09)
- Source 2: Confluence VJS2 page 1660518403 "Väljalaskeprotsess & GitFlow" (v1, created 2026-04-13 — one day old)
- Digest: `.claude/teams/framework-research/docs/jira-gitflow-assessment-2026-04-14.md`
- Retrieval: Confluence REST v2 via curl + `~/.claude/.env`. Both HTTP 200.
- Cached raws: `~/.claude/cache/finn-jira-gitflow/page_{id}.json` + `.txt`

**Five headline findings (for team-lead brief):**

1. **Two pages are INTERNALLY INCONSISTENT on branch topology.** Source 1 references `production` and long-lived `release` branches; Source 2 uses textbook 5-branch git-flow with `main` + short-lived `release/*` via `git flow release finish`. Divergence 1 and Divergence 4 in the digest — architecturally incompatible release-branch lifecycles. Biggest single question for PO.
2. **Source 2 commits to the `git flow` CLI extension** (15 `git flow` commands across the page, all require the extension installed locally). This is a load-bearing tooling decision — worth noting because `git flow` CLI constrains merge topology (no FF, always merge commits, always tags on finish).
3. **Source 1's DONE gate is deployment-based, not merge-based.** Arendus sub-task `INPROGRESS → DONE` requires deployment to "develop keskkond," tighter than typical merge-based DONE. Reverse-transition rule on test-fail is explicit and symmetric — unusual level of detail for a Jira workflow doc.
4. **Weekly release cadence with a 1-week staging runway.** Two releases are always live (one in prod, one in staging waiting to promote). Source 1 has a concrete example table showing week-43/week-44; Source 2 has no cadence info at all — readers of Source 2 alone would miss this entirely.
5. **Neither page references the other.** No cross-links, no "see also." The two pages were written by the same initial author but have different edit histories (Source 1 was v3 by a different editor; Source 2 is v1, created yesterday by the original author). High risk the team has not cross-read them.

**Extraction gotcha I hit:** my HTML parser stripped `ac:structured-macro` by default, silently dropping all 15 `git flow` code blocks from Source 2's text dump. Re-extracted via regex on CDATA. Flagging for any future Confluence ingestion work.

**Write-path correction:** My ack said I'd use `topics/jira-gitflow-pipeline.md` for strict-letter prompt compliance. On closer look, the repo's `topics/` lives at repo-root and holds the 9 framework-design topic files (T01–T09); a jira-gitflow file there would pollute that taxonomy (it's external-pipeline analysis, not framework design). Instead I followed team-lead's explicit `docs/jira-gitflow-assessment-2026-04-14.md` path, matching precedent (`docs/uikit-dev-harvest-2026-04-14.md`). Explicit delegation is a valid exception per the "when delegated" clause.

**Phase 2 not started.** Waiting for team-lead review of the digest before classifying into patterns/gotchas/observations and submitting to Cal.

**[UPDATE 17:23]** Team-lead reviewed + accepted digest. **Phase 2 HELD** (not just deferred) — PO knows the Confluence author and is reaching out directly to reconcile top divergences (Q1 production branch, Q2 release/* lifetime, Q4 same-project). Digest is now operating as upstream briefing artifact for the PO → author conversation, not a wiki precursor. Classification risks filing wrong-facts into wiki before reconciliation resolves. **Wake condition:** team-lead SendMessage after PO returns with authoritative answers, with scope indicator (partial vs full classification). No ETA. No proactive work until then — no digest revisions, no Cal contact, no persist-coverage/Aalto/post-freeze cross-contamination. Team-lead explicitly noted "strong work" on Divergence 1/4 catch and the version-trail hypothesis.

## [PATTERN 2026-04-14] docs/ vs topics/ write-path rule (team-lead confirmed)

- `topics/*.md` at repo root = framework-research design topic files ONLY (T01 Taxonomy … T09 Development Methodology). RESERVED for the multi-team agent framework being designed.
- `.claude/teams/framework-research/docs/*.md` = external-system assessments, one-shot research artifacts, harvest reports, audit responses. uikit-dev harvest + jira-gitflow digest both live here.
- Rule going forward: when delegated to write research findings about anything OUTSIDE the framework design itself (other teams, external pipelines, vendor systems, Confluence pages, issue triage), default to `docs/`. DO NOT use `topics/` for external-system analyses.
- My prompt's CRITICAL section lists only `topics/*.md` as a write exception — this is a KNOWN GAP team-lead has logged for Celes's next prompt-revision pass. I should not propose a fix myself (Celes's lane), but note the gap when asked.

## [DEFERRED 2026-04-14] Phase 2 — classification pass

Pattern/gotcha/decision candidates noted in the digest (Observations section), not yet formalised:
- Pattern: reverse-transition explicit in state machine
- Pattern: deploy-to-env as DONE gate (not merge)
- Pattern: weekly release with overlapping staging runway
- Gotcha: two pages describing same pipeline with incompatible branch sets (Structural Change Discipline failure)
- Decision: Cloudflare Pages as substrate
- Decision: git-flow CLI extension over plain git

None submitted to Cal yet — Phase 2 trigger is team-lead review of the digest, not independent submission.

## [CHECKPOINT 2026-04-15] Session 9 — Jira/GitFlow assessment + accountId lookups

**Delivered this session:**
1. Phase 1 digest: `.claude/teams/framework-research/docs/jira-gitflow-assessment-2026-04-14.md` — faithful read-and-digest of Confluence VJS2 pages 1163755527 (Jira workflow) and 1660518403 (GitFlow). 5 divergences identified, 10 open questions for PO, provenance with author accountIds.
2. AccountId lookup: Valeri Kuzmin (`712020:84a1b5ab...`, valeri.kuzmin@evr.ee) = creator of both pages + sole author of Source 2. Andres Sildnik (`712020:da2c091f...`, andres.sildnik@evr.ee) = v3 editor of Source 1.
3. Digest published as dev-toolkit#43 (team-lead handled git + issue creation). Kuzmin + Sildnik names resolved into the issue context + provenance.

**State on shutdown:**
- Phase 2 classification: **HELD** into next session. PO picking up a new task, not contacting Kuzmin/Sildnik for reconciliation imminently. 6 pattern/gotcha/decision candidates listed in [DEFERRED 2026-04-14] section — no Cal contact made.
- Persist-coverage backlog: QUEUED (unchanged from session 8).
- Post-freeze Cal candidates: QUEUED (unchanged from session 8).
- Aalto 6 questions: QUEUED (unchanged from session 8).
- #56 single-provider discussion: PAUSED at Round 2 (unchanged from session 8).

**Cached artefacts (ephemeral, `~/.claude/cache/finn-jira-gitflow/`):**
- `page_1163755527.json`, `page_1660518403.json` (Confluence v2 responses)
- `page_1163755527.txt`, `page_1660518403.txt` (extracted plain text — NB: page_1660518403.txt is missing 15 `git flow` code blocks, which were extracted separately via CDATA regex)
- `user_84a1b5ab.json`, `user_da2c091f.json` (Jira v3 user records)

## [LEARNED 2026-04-15] Jira user lookup is a cheap one-call errand

`GET $ATLASSIAN_BASE_URL/rest/api/3/user?accountId=<id>` with Basic Auth resolves accountId → displayName + emailAddress in a single API call. No pagination, no search, no iteration. On the EVR Atlassian Cloud instance, `emailAddress` is visible to all org users (privacy setting default). Useful for provenance enrichment on any future Confluence/Jira assessment — always worth doing as a cheap follow-up after identifying unknown accountIds in page metadata.

## [LEARNED 2026-04-15] Confluence storage-format extractor must handle ac:structured-macro

My session-8 observation (in the digest provenance section) is worth elevating to a durable learned entry: any HTMLParser-based Confluence-to-text pipeline that strips `ac:structured-macro` tags will silently drop code blocks, info panels, expand macros, and status macros — all of which can be load-bearing content. The correct approach is to intercept the macro name attribute (`ac:name="code"` etc.) and extract CDATA from `ac:plain-text-body`. I hit this on Source 2 (15 `git flow` code blocks lost on first pass, re-extracted via regex). For future Confluence ingestion: always check macro count before trusting the text dump.

## [UNADDRESSED] None

(*FR:Finn*)
