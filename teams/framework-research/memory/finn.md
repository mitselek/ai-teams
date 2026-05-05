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

## [CHECKPOINT 2026-04-30] Hello-world corp pipeline harvest

`docs/hello-world-corp-pipeline-harvest-2026-04-30.md` (92 lines, pruned from 240). Provenance for EVR konteinerite standard. RFC #2 = `Eesti-Raudtee/hello-world-container` PR #2 (NOT mitselek/ai-teams#2 — name collision trap). PO confirmed: ITOps space `I` Stage-2 home, TPS Jira, "EVR sisene konteinerite standard" title, V2 top-level Stage-0, mirror = Linux standard (page 1335984130). Brunel shipped 3 drafts: standard v0.1, intake template, tracking issue.

## [LEARNED] Provenance-doc lifecycle (harvest → drafts → prune)

When a harvest doc seeds downstream drafts, it doesn't become redundant — it becomes provenance for "why these decisions" questions Stage-2 reviewers will ask. Drafts encode output, harvest encodes justification. Prune ruthlessly to provenance-only when convergences land: drop tradeoffs (PO chose), drop "recommendations" (now confirmed), drop superseded addenda entirely (one-line disambig note suffices). Outcomes table at top mapping each PO confirm → its source section is the highest-ROI structure.

## [GOTCHA] V2 ≠ VJS2 (Confluence space disambiguation)

VJS2 (`84180996`, global, legacy product space, 3 product-card top level) is NOT V2 (`1115095052`, collaboration, project space owned by Ruth Türk, 8 top level). Names confusingly close. Stage-0 publish home is V2. Always verify by space `key` (V2 vs VJS2), not by name "VJS 2" / "VJS (Vedude Jälgimise Süsteem)".

## [LEARNED] CQL gotcha: `parent is empty` rejected

`space = X AND parent is empty` returns 400 Bad Request from Confluence CQL parser. Use `getConfluencePageDescendants` against homepage with `depth=1` (numbers must be JSON numbers not strings) OR `parent = "<homepage_id>"`. The descendants tool with numeric params is the cleanest path to top-level-of-space.

## [DEFERRED] Open questions (consolidated)

- Polyphony roster redesign — awaiting PO approval
- Entu: no server-side code repo studied
- #56: cost data + unavailability protocol (paused at R2)
- 6 Aalto questions from uikit-dev harvest §D — wait for next natural contact. Priority: Q1+Q4 > Q6+Q3 > Q2+Q5
- Sibling roster cross-check (pane-labels n=2 candidate)
- Jira/GitFlow Phase 2 classification — HELD pending PO reconciliation
- Stakeholder team design — awaiting her response to 3-question relay
- Cal Protocol A on `wiki-cross-link-convention` from apex — flagged in 2026-04-29 deliverable; team-lead's call

## [CHECKPOINT 2026-05-05] xireactor-brilliant deep-read (issue #64 C-phase Finn-half)

`docs/2026-05-05-postgres-library-discovery/finn-brilliant-deepread.md` (1274 words). Repo @ `eb1d1bf` 2026-05-01, 32 migrations, v0.5.1. Borrow: staging-pipeline shape, typed `entry_links` + recursive CTEs, write-path derived-data sync (n=4 confirm), forced-RLS + `SET LOCAL ROLE` discipline, density manifest at session-init, AI-reviewer 0.7 confidence floor. Idiosyncratic: single-owner-first, Render-first, Anthropic-hardcoded, `org_id` = tenant boundary not team. Gaps: librarian-replication, Protocol A/B/C, markdown round-trip, git-blame-equivalent surface, team-level sensitivity ceiling. Quality: high — schema matches docs, recursion bug found+fixed in 019. WARNING: active development cadence (0.5.0/0.5.1 breaking changes recent) reinforces independence posture.

## [LEARNED] Substrate-invariant-mismatch n=4 confirmation

Brilliant write-path sync of `entry_links` from `[[wiki-link]]` matches the n=3 pattern from xireactor §4(d). Same shape: derived-data-read-at-render-time MUST be written on the write path, never backfilled async. Strong signal this is a substrate primitive, not a one-off. Cal Protocol A submission warranted.

## [CHECKPOINT 2026-05-05 13:58] Brilliant staging-review code path deep-read (issue #64 follow-up)

`docs/2026-05-05-postgres-library-discovery/finn-staging-review-deepread.md` (970 words). 7 questions answered. Verdict on Q7: **replacement, not extension**. Tier 3 reviewer = single-shot stateless Anthropic call at `staging.py:889`, single call site, zero hooks/events/plugins/queue/multi-reviewer (grep confirmed). Reviewer sees only staging row + ≤5 path-prefix/tag-overlap related entries; no search/graph/history/audit access. Tier 1/2 = inline SQL checks. Tier 4 = no UI, no notifications, just session_init preamble + admin approve/reject endpoints. Data-model reuse high (`staging` table, `_promote_staging_item`, audit_log); orchestration code (`services/ai_reviewer.py` + Tier 3 branch in `process_staging`) needs full replacement for team-of-curators ambition.

## [PATTERN] OSS thin-integration anti-extension signal

When an OSS integration is a single function call to an external API with no Reviewer/Strategy interface, no event bus, no queue worker abstraction — that's a hard "replacement" signal. Watch for: zero hooks/events grep, single call site, schema with single-reviewer fields. Data model can survive; orchestration cannot be plugged into. Cal Protocol A candidate.

## [CHECKPOINT 2026-05-05 14:02] Q8+Q9 amendment — event-driven hooks + throughput

Memo extended (1715 words). Q8: Brilliant has zero push surface (no pg_notify/LISTEN/WebSocket/SSE; deps confirm no Redis/Celery/Kafka). Three poll-only tables: `request_log` (every req, fire-and-forget middleware), `entry_access_log` (every read returning entry IDs, batched INSERT), `audit_log` (writes only, allowlisted verbs). Recommended integration: **sidecar polling with cursor**, no fork no NOTIFYs. Q9: Brilliant published 178 ops/s flat at 20-120 concurrent clients (pool max=10); SPECULATIVE 1-10 reads/sec sustained for 10-team cluster well within headroom. Cascade plausible only via **derived-signal aggregation** in sidecar — raw firehose drowns orchestrator. **Q7 revised verdict: replacement-of-reviewer + sidecar-for-events**.

## [PATTERN] Poll-only-substrate + sidecar-derivation as event-driven shape

When OSS substrate has no push events but rich poll-able append-only tables, the pattern is: sidecar polls with sequence-cursor → applies rule-based derivation → emits *derived* events (heat, collision, gap, anomaly) only. Independence-preserving (no fork, no migrations), bounded cost (derivation rate << raw rate), forensic-queryable raw firehose stays in source DB. Phase-A candidate.

## [CHECKPOINT 2026-05-05 14:08] Q7 framing softened — substrate-map not architecture-pick

PO walked back "every read/write triggers" to allow time-based-cron as valid shape. Memo softened (1874 words) — Q7 restated as substrate-map of four extension shapes (brilliant-as-shipped + time-based maintenance + sidecar-event-bus + hybrid + curator-team-replaces-reviewer overlay). Removed prescriptive "recommended sidecar polling" language; kept descriptive cost-against-surface analysis. Phase A picks architecture; today's job is surface map only.

## [LEARNED] Soft-verdict discipline on substrate-mapping briefs

When PO framing is in-flight and the team-lead asks for surface map (not architecture pick), the right shape is a **table of N options × {accommodates / additive / replacement}** with concrete code-cost notation per cell, not a "recommended" verdict. Saves rework when PO reframes mid-stream (this brief reframed twice in 15 minutes).

## [CHECKPOINT 2026-05-05 14:19] Polyphony glance — negative finding

`docs/2026-05-05-postgres-library-discovery/finn-polyphony-dev-glance.md` (811 words). **Zero matches for `brilliant`/`xireactor` anywhere in `mvox-dev/polyphony`.** Polyphony's "federation" is product-domain (choir-to-choir score sharing via Handshake), not AI-team-KB federation. P2P federation is **explicitly deferred** with no design (GLOSSARY/ROADMAP/CONCERNS all flag it). The `Registry + Vault` shape (zero-storage discovery layer + single-deployment data store) IS shipped and could transfer as **federation gateway pattern** if abstracted past the domain. PO citation "battle-proof for Topology B" likely refers to the Registry+Vault discovery shape, NOT to a P2P federation layer that doesn't exist there. **Flag in report**: PO should confirm what the citation referred to; phase A cannot lift a federation architecture that hasn't been designed.

## [PATTERN] Cross-repo glance: confirm the citation before assuming inheritance

When PO cites repo X as "battle-proof for pattern Y", glance the repo before assuming the pattern is implemented there. Domain-language collisions are common (federation = legal trust contract in choral-music app vs. data-replication contract in AI-KB design). The shipped subset usually doesn't match the cited pattern — only the deferred-but-named subset does, which means it's not battle-proof.

## [CHECKPOINT 2026-05-05 15:07] Haapsalu-Suvekool glance — strong positive

`docs/2026-05-05-postgres-library-discovery/finn-haapsalu-suvekool-glance.md` (802 words). **Inverted result vs polyphony.** Brilliant in active production use as cross-session knowledge layer — 20+ refs across `teams/esl-suvekool/{startup,common-prompt,design-spec}.md`, scratchpads, docs. Integration via `mcp__brilliant__*` MCP tools (search_entries, update_entry routes through staging per Brilliant governance). Path-namespace as team-shard primitive: `Projects/esl/`, `Meetings/esl/<date>/`, `Context/esl/*`, `Resources/esl/*`. **`Brilliant pulse`** ritual at session-start = operational session_init pattern. **Roadwarrior-sync skill** = second-consumer (claude.ai Project that can't query Brilliant) bridged via copy-paste `[SYNC BRIEF]` ↔ `[SYNC: YYYY-MM-DD]` handshake with `.last-sync` anchor. Clean precedent.

## [PATTERN] Path-namespace as federation primitive

In production esl-suvekool integration, "federation" is implemented operationally as **path-namespace per team** in a shared central Brilliant. `Projects/esl/*` is esl-suvekool's shard; cross-team queries are URL-shaped (`logical_path="Meetings/esl/..."`). No formal federation contract — namespace convention IS the contract. Quality floor: "stable, non-obvious, saves-future-me-5min" decides what gets promoted from scratchpad to Brilliant. Confirmed transferable to phase-A federation design.

## [PATTERN] Two-consumer pattern: direct-MCP vs synthesized-snapshot

esl-suvekool runs two Brilliant consumers: (1) local team via MCP (read+staged-write); (2) road-warrior claude.ai Project via copy-paste handshake (synthesized snapshot only, can't query). The handshake (`[SYNC BRIEF]` from local → RW echoes `[SYNC: YYYY-MM-DD]`, `.last-sync` anchor) closes both gaps: what's new locally that RW needs, AND what RW has done since previous sync. Architecturally: a substrate that's MCP-accessible AND copy-paste-summarisable for non-MCP consumers. Pattern A candidate.

## [UNADDRESSED] None

(*FR:Finn*)
