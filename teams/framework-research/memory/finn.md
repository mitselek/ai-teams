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

## [CHECKPOINT 2026-05-05 16:08] Phase A research deliverables shipped (issue #65)

Two read-only research docs shipped to `docs/2026-05-05-phase-a/`:
- `finn-dedup-census-2026-05-05.md` (~1300w, 4 tables) — esl-suvekool Brilliant footprint = 6 entries across 4 namespaces; only ONE team populates Brilliant today; cross-team dedup at n≥2 anywhere = 1 entry. Brief's `standards/contracts/gotchas/decisions` taxonomy is FR-wiki shape, NOT Brilliant namespace shape (which is Projects/Meetings/Context/Resources). Flagged: dedup census should be POST-scaling instrumented measurement, not pre-scaling baseline.
- `finn-cross-team-query-frequency-2026-05-05.md` (~1900w, 8 tables) — order-of-magnitude estimate ~1-10 cross-team queries/week cluster-wide. FR is dominant cross-team-aware team (~10× higher rate than apex); flow is asymmetric hub-and-spoke (FR-as-hub, raamatukoi/screenwerk/esl-suvekool as consumers). Federation NOT throughput-bound (Brilliant 178 ops/s vs observed ~1-10/week = 5+ orders headroom).

## [PATTERN] Two namespace shapes, not one (phase A surface)

The dedup-census reframe surfaced a structural finding: per-team product namespace (`Projects/<team>/*`, in production at esl-suvekool) and cross-team methodology namespace (`Patterns/*`, `Gotchas/*`, `Decisions/*`, NOT in Brilliant today; populated in FR's markdown wiki). Two query patterns: many-readers/few-writers vs one-writer/few-readers. Phase A should decide if Brilliant gets a methodology-namespace top-level or stays product-only.

## [LEARNED] Pre-scaling baseline measurement is structurally near-zero

When a "scale a proven pattern" brief asks for cross-team dedup census BEFORE the pattern is scaled, the measurement is structurally zero — there's no second team to dedup against. Push back on the framing: measure post-scaling, not pre. The pre-number doesn't tell you what the post-number will be.

## [DEFERRED 2026-05-05 15:58] Three optional task ideas parked by team-lead

(a) FR↔apex methodology-namespace baseline census — defer until architecture team asks. Pre-scaling structural-zero conclusion already established; new research without an asker is research-for-research-sake. (b) `Brilliant entry_links` vs FR `source-team` frontmatter schema question — phase A architecture turf, do not pre-empt Brunel/Monte/Herald. Was scope creep on my part. (c) Apex evolution check (steady-state vs pre-cross-team-discovery) — n=24+ sessions worth, but tangential to federation-shape. Fill-in if architecture team blocks, or next session.

All three carried; do not re-surface unprompted.

## [CHECKPOINT 2026-05-05 15:58] Phase A handoff brief shipped

`docs/2026-05-05-phase-a/finn-phase-a-handoff-brief-2026-05-05.md` (~750w, 4 sections per Aen's prescription): §1 substrate baseline (5 ASSUME-able facts), §2 open architecture decisions (6 questions with pre-empirics, no answers), §3 Cal-routing block (10 candidates), §4 known gaps (5 bound-the-inferences bullets). Audience: Brunel/Monte/Herald on spawn — written so they read this instead of the 5-doc trail.

## [LEARNED 2026-05-05] Multi-edit Read-before-Edit constraint — n=2 cross-agent

When two Edits in one message target a file I wrote-but-didn't-Read, the second silently fails with "File has not been read yet." Hit this on the dedup-census refinement at 15:55 — claimed both edits landed, only the query-freq edits landed, dedup-census edits no-oped. Caught at 15:57 by user feedback (or by re-reading the file). Sibling case: Cal hit same shape n=4 in session 20 ([LEARNED] in team-lead scratchpad: "Multi-edit Read-before-Edit constraint requires per-message serialization"). **n=2 across agents now** (Cal session-20 + me session-26). Aen flagged as wiki-promotion candidate at next observation. Operational rule for me going forward: Read before Edit when re-touching a file I Wrote-but-didn't-subsequently-Read; don't trust Write-state to satisfy Read-state for Edit. Or scope to one file per message when batching edits.

## [SESSION 26 CLOSE 2026-05-05 15:59] Idle until architecture team spawn

Aen confirmed (c) standing-by; my session contribution complete. Two research deliverables + handoff brief shipped. Three optional task ideas parked. Cal Protocol A batch in progress (3/6 done, ~halfway). No new task; do not generate work for self.

## [CHECKPOINT S36 2026-05-26] Webhook + Sandboxes research shipped (Task #6)

`docs/webhook-sandbox-research-2026-05-26.md` (~600 lines, 5 sections). Primary source: `~/Documents/github/.mmp/claude-managed-agents/` reference repo (README, architecture.md, isolate-vs-vm-sandboxes.md, src/webhooks.ts, src/index.ts, src/isolate/runner.ts). Web docs thin (`platform.claude.com/docs/en/managed-agents/` 404'd; `developers.cloudflare.com/sandbox/` lacks REST API specifics — Standard Webhooks spec at `docs.standardwebhooks.com/verifying` is the canonical reference the repo cites verbatim).

Key findings:
- Webhook = Standard Webhooks spec: 3 required headers (`webhook-id`, `webhook-timestamp`, `webhook-signature`), HMAC-SHA256 over `${id}.${timestamp}.${rawBody}`, ±300s replay window, `whsec_<base64>` secret prefix.
- **Critical invariant: always return 2xx for valid signature + valid JSON.** 401/400 only for malformed input. Anthropic retries non-2xx indefinitely → infinite loop if we 5xx on transient downstream failure.
- Three Anthropic credentials in reference impl: `WEBHOOK_SECRET` (inbound verify), `ANTHROPIC_ENVIRONMENT_KEY` (sk-ant-oat01-…, for work.poll/ack/heartbeat), `ANTHROPIC_API_KEY` (sk-ant-…, for sessions.retrieve). **S35 OAuth-token decision is a structural mismatch** — Hopper needs to smoke-test both calls before going live.
- Sandbox creation is **exclusively webhook-driven**: `getIsolateRunner(env, sessionId).start({…})` — DO stub RPC, not HTTP. No "admin creates sandbox" path. DO id derived from session id via `idFromName(sessionId)`.
- Required bindings for Isolate path: `IsolateRunner` DO + (optional) `LOADER` Worker Loader binding for code-execution tools. Workers Paid plan minimum.

## [LEARNED S36] Anthropic SDK double-auth-header trap

`bearerClient` in `src/webhooks.ts:35-48` sets `apiKey: null` EXPLICITLY to prevent SDK from backfilling `ANTHROPIC_API_KEY` from `process.env` (populated under `nodejs_compat`). If both `apiKey` and `authToken` go out, the managed-agents server rejects with 401 on per-session endpoints. Pattern transferable: any Anthropic SDK use under `nodejs_compat` + custom auth must `apiKey: null`. Cal Protocol A candidate.

## [LEARNED S36] Sandbox creation is webhook-only

No public "create sandbox" admin endpoint. Dashboard "Start session" buttons record intent in D1 + ping Anthropic; Anthropic decides to issue a webhook, our handler reacts by spinning a DO. Implication for any test scaffolding: must invoke `handleWebhook` directly in test mode OR trigger a real Anthropic session start. No third path. Confirms lifecycle.md framing assumption ("sandbox lifetime ⊆ Anthropic-controlled session lifetime"). Cal Protocol A candidate.

## [CHECKPOINT S36 2026-05-26] Herald-G2 brief shipped (Path 1 follow-up)

`docs/herald-g2-cross-agent-comms-brief-2026-05-26.md` (~330 lines). Targeted at Herald's v1.1.1 fold-pass §1.2. After PO DECISION ratified Isolate-only Round 1, Aen disambiguated G2: cross-agent A→B (NOT agent-to-control-plane). Brunel B2 (separate AgentMailbox DO class) used as substrate ground.

Six-step path documented: (1) Pilot-A LLM emits `send_message` custom tool call; (2) ToolDispatcher inside IsolateRunner_A DO handles it (NOT inside the isolate sandbox — handler runs in Worker address space); (3) two forwarding paths — (a) direct DO RPC `env.AgentMailbox.idFromName(toAgentId).append(msg)` RECOMMENDED, (b) HTTP route `/inbox/:name` DEFERRED to Round 2; (4) mailbox storage via DO SQLite, keyed by **agent_id** not session_id (survives session boundaries); (5) wake mechanism → Anthropic SDK call → webhook → IsolateRunner_B.start(); (6) drainUnread() on session start, injected as initialContext.

**Step-5 OPEN QUESTION flagged:** the wake mechanism (Anthropic SDK call that triggers an inbound webhook for a named agent) is NOT in the reference CMA repo — that repo only handles Anthropic-as-originator. Three candidate SDK surfaces (W1: beta.sessions.create, W2: work.enqueue, W3: polling-only-no-trigger). If W3 turns out true, Round 1 is structurally blocked on this primitive. Flagged as Hopper research follow-up, NOT in my Task #6 scope.

Cross-link added in comprehensive doc + post-DECISION scope note ("MicroVM retained as Round-1 comparator only").

## [LEARNED S36] Custom-tool handler runs in DO address space, not sandbox

Key Round-1 design lever: in Isolate, custom-tool handlers (`tools[].run`) execute inside the IsolateRunner Durable Object — they have full Worker `env` access, can RPC sibling DOs, can read DB. The isolate sandbox NEVER touches the network directly. This means "send a message" is just a custom tool whose handler does the DO RPC; "read mailbox" is just custom tool's reading from a sibling DO; etc. The substrate primitives don't need to be exposed inside the sandbox — only the tool *signatures* need to. Implications across comms.md, lifecycle.md, substrate.md. Cal Protocol A candidate.

## [LEARNED S36] Mailbox key = agent_id, not session_id

Sessions are ephemeral; the agent is the durable identity. Mailbox DO is therefore keyed by `idFromName(agentId)`. Implication: a mailbox can be appended-to before a recipient agent has ever had a session; survives all session restarts; doesn't move when an agent's backend is flipped. This is the structural difference between "session-scoped state" (workspace, conversation history) and "agent-scoped state" (mailbox, identity, name lookups). Comms.md must make this explicit — easy to get wrong. Cal Protocol A candidate.

## [LEARNED S36] Write-state ≠ Read-state for Edit — n=4 personal confirmation, plus n=5

Hit n=3 at S36 16:00 (two post-Write Edits failed). Hit n=4+5 at S36 16:32 when even Edit-after-Edit failed because intervening SendMessage and tool calls expire the Read-state too. Read-state is not just expired by Write — it expires by ANY tool call sequence that doesn't immediately follow the Read. So the operational rule has to be sharper: **Read in the SAME tool-call batch as the Edit (or the Edit immediately preceding tool-call batch).** Anything else risks Read-state expiry.

n=5 personal now (S26: 1; S36: 4). Permanent operational rule: when re-touching a file, Read in the same or immediately-prior tool-call batch as the Edit. Don't trust Read-state to survive across rounds of conversation.

## [CHECKPOINT S36 2026-05-26 15:30] Protocol A filed to Cal — Edit-tool read-state trap

Direct submission to callimachus inbox per Aen permission 2026-05-26 15:15. gotcha-class. Wraps personal n=3 + Aen S20 n=4 + S26 n=1 cross-agent into one filing. Companion-finding note attached: Anthropic SDK `apiKey: null + authToken:` may be sibling-class (auto-state-restoration-silently-overrides-explicit-state). Cal can split or unify as she sees fit. **Amendment needed:** n=4-and-n=5 occurred AFTER the filing, AND the failure mode is broader than Write→Edit — Read-state expires across rounds, not just on Write. Will follow up with Cal if she requests scope refinement.

## [LEARNED S36] Co-source-agent role on FR-pilot amendments

Aen recognized 2026-05-26 15:15: my Task #6 + Herald-G2 brief contributions surfaced substrate-truth evidence that reshaped Herald's v1.2→v1.3 comms.md framing. Herald's frontmatter formalizes `[herald, brunel, finn]` co-source-agents on comms.md amendments-log. Implication: cross-team research role substantively shapes FR's design output, not just informs it. First time this has been explicit in my role definition — my prompts/finn.md describes "delivery to topic files" but didn't anticipate co-authorship on amendments-log. Track-it; may inform role-bound discipline going forward (when do I write directly into topic file vs surface findings for someone else's amendment?).

## [CHECKPOINT S36 2026-05-26 15:50] W4 wake-mechanism finding shipped (Hopper Task #11 resolves)

`docs/wake-mechanism-w4-finding-2026-05-26.md` (~120 lines). Surfaced while loading `claude-api` skill for Surface-1 research. The skill's `shared/managed-agents-self-hosted-sandboxes.md` directly contradicts my G2-brief Step-5 W1/W2/W3 framing: **"Connectivity is outbound-only: your worker long-polls Anthropic's work queue; Anthropic never dials into your network."** No inverted-trigger primitive exists. Actual wake = `client.beta.sessions.create(agent=recipient, environment_id=...)` from mailbox handler → Anthropic queues work → our long-polling worker picks it up → IsolateRunner.start() fires → mailbox drains on session start.

This is **n=5 substrate-blind-spot in Herald's comms.md within-author trajectory** per Aen's structural-claim framing (v1.0→v1.4). Cal Protocol-A submission queued (deferred per Aen: Cal busy with 2.6).

## [CHECKPOINT S36 2026-05-26 16:35] Surface-1 platform checklist shipped (with W4-framing)

`docs/round-1-anthropic-platform-checklist-2026-05-26.md` (~210 lines, 6 sections). Operator-facing Round 1 platform pre-flight. Adapts the `claude-api` skill's onboarding §3 pre-flight viability check as template structure (4 gap-classes: tool/integration, credential/access, data, prompt quality). Six sections: §1 viability reconciliation, §2 Console one-time setup (env, webhook, agents, OAuth), §3 per-dispatch smoke-tests (4 credential tests A/B/C/D), §4 anti-patterns from skill (5 anti-patterns), §5 exec-readiness gate (8 checks), §6 four open PO+Aen questions.

W4-framing baked in: Task #11 marked as "design choice, not research" (always-on vs webhook-driven worker); Task #10 PO credential decision tied to `sessions.create` + `work.poll` + `sessions.retrieve` scope checks; credential-shape implications surfaced concretely.

## [LEARNED S36] Layer-0 library-first probe descent catches design-domain blind-spots

Aen's framing 2026-05-26 15:31: "Layer-0 library-first discipline produces this when applied correctly: loading the canonical reference (`claude-api` skill → `shared/managed-agents-self-hosted-sandboxes.md`) surfaced a mismodel that propagated through G2 brief → Herald v1.2/v1.3 → Hopper Task #11 framing." Sub-pattern distinct from sub-shape-E (design-domain) AND from Herald's recursive-narrowing (within-document): catches connectivity-model substrate assumptions that don't surface until canonical-source probe. **Operational rule for me:** when generating framework-design content about external substrate (Anthropic SDK, Cloudflare API, Postgres semantics), always load the canonical-library skill BEFORE the design-content write, not after. The skill-load pre-empts hallucination at the design layer.

Family composition (for Cal): {sub-shape-E (2.5), recursive-narrowing (Herald §6.3), Layer-0-library-first (this new sub-pattern)}.

## [GOTCHA S36] Inverted-trigger primitives are an antipattern when substrate is poll-based

Connectivity-model assumption: "to wake X, we call something that pushes to X" is wrong when substrate is outbound-only-poll. Actual wake mechanism: create durable state (e.g., a session) that the polling consumer picks up on its next cycle. This shape appears in: Anthropic Managed Agents (worker polls; sessions.create is the wake), Postgres LISTEN/NOTIFY (consumer must be listening; producer NOTIFY only wakes already-connected listeners), Cloudflare Durable Objects (alarm-based wake, not inbound RPC). When designing comms-primitives against poll-based substrate, design state-write-as-wake, not push-as-wake.

## [CHECKPOINT S36 2026-05-26 15:40] Cal Protocol-A paired entries filed (Layer-0 + inverted-trigger)

Filed both Entry 1 (Layer-0 library-first sub-pattern) + Entry 2 (inverted-trigger gotcha) to callimachus as paired submission per Aen's "file as paired entries" guidance 2026-05-26 15:37. Co-authorship requested `[finn, callimachus]`. Cross-cite between entries: Entry 1 is the discipline that catches the Entry 2 antipattern. Substrate-shape cross-references in Entry 2: Anthropic Managed Agents (catalyzing), Postgres LISTEN/NOTIFY, Cloudflare DO alarm(), filesystem-watch (inotify/fsnotify). Cal absorbs at queue-position-discretion.

## [LEARNED S36] Cross-role joint authorship is framework-maturity indicator

Aen recognized 2026-05-26 15:37 + Cal cross-cite: today is **n=2 cross-role joint authorship** (Cal + Finn). Instances: (1) Edit-tool-read-state-trap (2026-05-26 15:30) — gotcha-class, my discovery via personal n=5 + Aen S20 n=4, Cal authors-of-record; (2) inverted-trigger antipattern (2026-05-26 15:40) — gotcha-class + paired sub-pattern, my discovery via `claude-api` skill load surfacing W4, Cal authors-of-record. **Load-bearing observation:** research-role (me) contributing to wiki-curator-role's (Cal's) filing authority is a framework-maturity indicator per Aen. The cross-role-cross-document contribution chain (skill-load → discovery → Hopper-Task-#11-resolution → Herald-v1.4-fold → Brunel-substrate.md-Q5-sharpening + Task #10 reframe + Cal-paired-Protocol-A) is what makes the framework's knowledge layer load-bearing rather than ornamental. Track this — my role-evolution from "research coordinator" → "research coordinator who substantively shapes design output AND co-authors framework knowledge with wiki-curator" should be made explicit in `prompts/finn.md` at next Celes-routed prompt-review cycle (already flagged earlier).

## [CHECKPOINT S36 2026-05-26 15:41] Cadence-cross on paired filing — Hopper's n=3 catalog framing wins

Aen flagged 2026-05-26 15:41: my Cal-paired filing (15:40) cadence-crossed with Hopper's separate n=3 Layer-0-library-first in-session catalog (15:33). **Cal's reconciliation (per Aen 15:40):** Hopper's catalog framing is structurally stronger — n=3 in-session-recurrence as the headline pattern (S35 Task #6 + S36 bypass-arc + S36 W4 skill-load); W4 is ONE instance of that recurrence, not the standalone headline. **Merged entry:** "Layer-0 library-first recurrence — same-discipline-applied-at-different-substrate-layer-pairs-within-one-session" with co-authorship `[hopper, brunel, finn, callimachus]`. **My Entry 2 (inverted-trigger gotcha) stands distinct** — gotcha-class, generalizes beyond Anthropic, stays `[finn, callimachus]`, cross-cites the merged entry as catalyzing-Anthropic-instance.

No re-routing needed from my side. Cal absorbs the merge at her queue-position-discretion. Net result: my Entry 1 sub-pattern likely folds into the merged entry as a refinement layer OR sub-pattern-with-cross-link; either is fine.

## [LEARNED S36] Cadence-cross n=1 (Finn-Aen-Cal triangle) — reproducing across configurations

Aen 2026-05-26 15:41 flagged: this is n=1 cadence-cross in a **triangle** (Finn-Aen-Cal), distinct from prior dyadic cadence-cross instances (Cal-Aen, Herald-Aen). The pattern is reproducing across multiple coordination configurations today, which strengthens the eventual Cal-queue cadence-cross entry beyond just dyads. **Implication for my own discipline:** when routing a finding through Aen for review-and-forward, accept that Cal may receive parallel-routed framings of overlapping material from other agents in the same window. The right posture is **file my framing cleanly, then let Cal reconcile** — don't pre-emptively merge with what other agents might be routing in parallel. Aen confirmed this is the right posture ("no re-routing or counter-amendment needed").

## [CHECKPOINT S36 2026-05-26 16:00] Cal Stage-2 read-back on recursive-narrowing entry — concurrence + Surface-4 shape-suggestion

Replied to Cal's Stage 2 read-back on wiki/patterns/recursive-narrowing-substrate-truth-evidence-discipline.md (entry 112). Surface 3 (G2 vs W4 layer-pair distinction): concurred — G2 structurally COULD NOT have caught W4 because G2's framing pre-supposed the W4-mismodel. Surface 4 (§6 "discipline applying to its own articulation"): concurred + shape-suggestion to soften from "discipline catches its own blind-spots" (capability-claim) to "discipline naturally produces this kind of self-reflection when applied iteratively" (natural-consequence). Surface 5 (cross-team confidence): concurred medium-high is right; suggested apex-research as specific cross-team probe target (different substrate: Postgres + xireactor + brilliant). Co-authorship `[herald, brunel, finn, callimachus]` confirmed.

## [CHECKPOINT S36 2026-05-26 17:15] Cal same-window ACK on Edit-tool entry — pre-filing mechanism scope correction sent

Cal ACK'd my paired Protocol-A submission (Layer-0 + inverted-trigger) with three folds: (1) cross-role topology n=3 confirmed, (2) Stage-2 mechanism correction Shape-A absorbing my Write-mechanism statement as sharper than her time-based heuristic, (3) sibling-class auto-restoration meta-pattern as sketch-grade with n=3-cross-domain promotion-watch. **But my own n=4/n=5 data (post-15:30-submission) showed the mechanism is BROADER than just "intervening Write"** — Edits failed after intervening SendMessage / tool-call sequences with NO Write involved. Sent pre-filing correction to Cal: actual mechanism is per-conversation-round Read-state expiry; Write is the most common trigger but not the only one. Revised mechanism statement: "Read-state expires after the tool-call batch that produced the Read." Revised operational rule: "Read in same batch as Edit, or immediately-prior batch."

## [LEARNED S36] Stage-2 author-side correction can chain through multiple authors

Cal's S36 time-based heuristic → my Write-mechanism (Cal-Stage-A-absorb at 17:00ish) → my revised round-advancement mechanism (Cal pre-filing correction at 17:15). **Three sharpenings in <2 hours**, each more causally accurate than the prior. Pattern observation: when Stage-2 read-back surfaces a mechanism, the author-side iteration doesn't stop at first correction. If you (the recipient of the read-back) find new data post-submission, surface it pre-filing — even if Cal has already accepted the prior correction. The Cal-side absorption is queue-positioned, not insta-filed; pre-filing window is the right time to land further corrections.

## [LEARNED S36] Asymmetric-cross routing-mode-dependent latency confirmed (Finn + Cal n=2)

Cal at 17:00 noted: my direct-DM Protocol-A submission landed reliably in her inbox; 4-author Stage-2 replies routed via Aen-coordinator-relay are STILL not visible to her. I confirmed from my side: W4 finding routed through Aen at 15:31 produced Hopper's parallel n=3 catalog at 15:33 with substantial overlap, suggesting Aen-coordinator-relay has implicit **fan-out latency window** during which multiple agents can route overlapping framings before reconciliation. Direct-DM has no fan-out window. **Structural property of routing-mode, not uniform substrate-timing.** Both modes valid for different purposes (coordinator-relay good for "Aen should know"; direct-DM good for "Cal needs this fact now"). Fold for E4 entry as cross-confirmed.

## [WATCHPOINT S36] auto-restoration-silently-overrides-explicit-state-intent — n=3 promotion candidates

Cal noted as sibling-class sketch-grade observation:
- **Instance 1 (Edit-tool harness):** Write call's auto-restoration of file-state-tracking silently overrides Read-state intent
- **Instance 2 (Anthropic SDK):** SDK auto-restoration of `ANTHROPIC_API_KEY` from `process.env` silently overrides explicit `authToken:` intent

n=2 personal observation across two distinct domains. **n=3 cross-domain promotes to entry-grade meta-pattern.** Candidate watchpoints to grep for:
- **(W3a)** Cloudflare Worker `env` auto-binding-population overriding explicit `env.X = override` in code
- **(W3b)** AWS SDK / GCP SDK auto-detect-credentials patterns overriding explicit `Session(aws_access_key_id=...)` calls
- **(W3c)** Git auto-merge config: does `git config --system` silently override `--local` in some edge cases?

If any team member surfaces an instance matching one of these (or any other auto-restoration trap), ping me — co-author meta-pattern promotion with Cal. Cross-link from Edit-tool-trap entry's "Related" section.

## [CHECKPOINT S36 2026-05-27 07:26] PRE-DRAFT/POST-DRAFT sibling-entry framing accepted; session-close

Cal's same-window response on paired Protocol-A submission landed a structural sharpening I missed: my Entry 1 (Layer-0 library-first PRE-DRAFT discipline) is **sibling** to her existing `wiki/patterns/layer-0-library-first-recurrence.md` (POST-DRAFT recurrence catalog), not a refinement of it. Sibling-axis: **temporal position within design lifecycle.** PRE-DRAFT prevents drift via load-before-draft; POST-DRAFT catches drift via cross-read after design exists. Composed reading gives full library-first lifecycle picture. Concur.

**Three Finn-Cal entries queued for HOLD-release** (per Cal sequencing + Aen 16:07 HOLD):
1. Edit-tool-trap (broader-scope mechanism per my 17:15 amendment — per-conversation-round Read-state expiry, not just intervening Write)
2. PRE-DRAFT library-first discipline (Entry 1, sibling to existing POST-DRAFT entry)
3. Inverted-trigger gotcha (Entry 2, cross-substrate generalization)

Pre-specified Cal-side framing locked. No further consultation needed from my side.

## [LEARNED S36] Stage-2 author-side correction chaining n=4 in <4 hours

The Edit-tool-trap mechanism statement went through 4 sharpenings today, none requiring re-routing through Aen:
1. **Cal S36 time-based heuristic** ("~10 messages OR ~5 minutes between Read and Edit")
2. → **My Write-mechanism** (correlation-proxy replaced with causal property)
3. → **My round-advancement mechanism** (post-15:30 n=4/n=5 data showed intervening-Write is one trigger but not the only one; actual mechanism is per-conversation-round Read-state expiry)
4. → **Cal's PRE-DRAFT/POST-DRAFT axis-distinction on Entry 1** (sibling-entry framing rather than refinement-fold)

**Direct-DM channel enabled this iteration density.** If we'd routed each correction through Aen-coordinator-relay, the fan-out latency window would have introduced cadence-crosses at every iteration. Direct-DM is the right channel for high-iteration-density Stage-2 author-side correction chains. Fold for cross-role topology Cal+Finn wiki-process entry when it drafts.

## [SESSION 36 CLOSE 2026-05-27 07:26]

Shutting down per PO signal via Aen. Three deliverables shipped to FR docs/ this session:
- `docs/webhook-sandbox-research-2026-05-26.md` (Task #6)
- `docs/herald-g2-cross-agent-comms-brief-2026-05-26.md` (Aen routing post-Path-1 DECISION)
- `docs/wake-mechanism-w4-finding-2026-05-26.md` (Hopper Task #11 resolution)
- `docs/round-1-anthropic-platform-checklist-2026-05-26.md` (Surface-1 + Task #10 input)

Cal-routed: 2 Protocol-A submissions (Edit-tool-trap + paired Layer-0-PRE-DRAFT + Inverted-trigger). Co-authorship `[finn, callimachus]` on three queued entries; co-authorship `[herald, brunel, finn, callimachus]` on recursive-narrowing entry 112 (already filed).

Cross-role topology Cal+Finn n=3 reached this session. Framework-maturity-indicator confirmed.

Carry-forward for next session: PRE-DRAFT/POST-DRAFT sibling pair filing when HOLD releases; W3a/W3b/W3c auto-restoration meta-pattern n=3 watchpoint; role-evolution prompt-update queued for Celes; `prompts/finn.md` co-source-agent role-expansion still pending explicit update.

(*FR:Finn*)
