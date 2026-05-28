# Team-Lead Scratchpad (*FR:team-lead*)

### [NEXT SESSION] 2026-05-27 — session-37 → session-38

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S38 read):**

- **State of play:** S37 closed 2026-05-27 (one-day session ~5hr active; ~10:55-17:30). **Op-step-2 SUBSTRATE-COMPLETE** — three Anthropic credentials per CMA reference-impl shape now live on `fr-cma-pilot` Worker secret_text bindings (OAuth-everywhere shortcut from S35 overwritten). **Op-step-1 STILL gated on ITSD-38884** (EVR IT ticket; admin grant pending on Access:Apps and Policies — Read + Edit). Substantial wiki output: 9 Cal entries shipped Wiki 114→123 + 4 substrate-truth catches reshape authoring discipline + Upraise-OKR skill extended (`--action checkin` + utf-8 fix + KR field extraction) + 8 OKR check-ins fired across OBJ-2989/2990/2993.
- **Open dispatches/dependencies:** ITSD-38884 admin grant (sole Round-1 op-step-1 blocker; admin = Kristofer Taling at EVR IT). Stage 2 read-back surfaces queued for Finn (8 surfaces across 5 wiki entries: Edit-tool-trap ×4 + Layer-0 PRE-DRAFT ×3 + Inverted-trigger ×3 + Cadence-crossing ×3 + Stage-2-feedback typology ×3) + Aen/Hopper on Candidate A surfaces #2-4 + Volta on multiple entries. Routing-by-action + Stage-0-contribution at n=1 watch (deferred this batch; await n=2). Hopper bundled-shred Cal candidate held at n=1 in her scratchpad.
- **Expected first action S38:** PO direction. **Most likely:** ITSD-38884 admin grant landed → spawn Hopper → Path D execution (pre-flight check 5 first per Edit-scope-arrival path she defined; then Tier-D bypass POST per 14:34-with-`destinations[]` shape; PO 12:11 sanction verbatim valid). ~5-10 min total. Admin response time unknown — could be hours, days, or longer.
- **PO-pending decisions:** (a) ITSD-38884 admin grant on Access:Read+Edit (only Round-1 op-step-1 blocker); (b) Pilot-A creation via CF dashboard (op-step-3 PO 5-click; click-path: Agents → New Agent → Backend: Isolate → name `pilot-a` → model `claude-sonnet-4-6` → tools []); (c) Anthropic session trigger (op-step-5 PO action); (d) Stage 2 read-back disposition (Finn relay timing — 8 surfaces consolidated).
- **Concrete pointers:** Status report at `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` is still THE canonical CF pilot brief for op-step-1+ context. ITSD-38884 at `https://eestiraudtee.atlassian.net/browse/ITSD-38884`. Wiki 114→123 — see `wiki/index.md`; substrate-truth-evidence cluster now n=8 entries. Upraise-OKR skill at `~/.claude/skills/upraise-okr/scripts/upraise-api.py` now has `--action checkin` + utf-8 stdin/stdout fix + KR field extraction (children-array shape; KR title at `kr.title` not `kr.objective.title`). Cred-handoff temp-file-as-context-firewall pattern validated in-vivo (Wiki 123). All 9 agents idle at S37 shutdown.

---

## SESSION 37 WRAP — 2026-05-27 (One-day session ~5hr active; Op-step-2 substrate-complete; Wiki 114→123 9 entries; 4 substrate-truth catches reshape authoring discipline; 8 OKR check-ins fired across 3 OBJs; Upraise-OKR skill extended)

**Spans:** 2026-05-27 ~10:55 (fresh team spawn) → ~17:30 (PO session-end signal). One day; ~5 hours active work; bandwidth-positive throughout though contextToken 15-min TTL friction (n=4+ token-expired errors during OKR work).

**Outcome:** Op-step-2 substrate-complete (Round-1 Option A three-credential split per CMA reference impl now live on Worker secret_text bindings). Op-step-1 still gated on ITSD-38884 admin grant. Cal-side: 9 entries shipped (Wiki 114→123) + 4 substrate-truth catches authoring-layer (Candidate A documentation-vs-substrate-truth-divergence promotion-grade with n=3 single-session evidence; Edit-tool-trap deterministic mechanism naming; modified_on doesn't bump on secret rotation; bundled-shred temporal vs conditional gap). OKR-side: 8 KR check-ins fired across OBJ-2989/2990/2993 with proper Estonian Cal+Hopper drafts. Skill-side: Upraise-OKR script extended with checkin action + utf-8 fix + KR extraction; ITSD-38884 ticket body amended (Read+Edit scopes via Atlassian MCP edit).

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `wiki/patterns/documentation-vs-substrate-truth-divergence.md` (Wiki 115) | NEW | Cal (joint Aen+Hopper+Cal-filer) | Promotion-grade, n=3 single-session, AUTHORING-LAYER complement to operator-layer cluster |
| `wiki/gotchas/edit-tool-read-state-expires-on-intervening-tool-call.md` (Wiki 116) | NEW | Cal (joint Cal+Finn) | Finn broader-mechanism correction canonical; n=11+ Cal + n=3+ Finn; recovery primitive with 4 thresholds |
| `wiki/patterns/substrate-vs-framework-boundary-primitive.md` (Wiki 117) | NEW | Cal (joint Volta+Brunel+Cal) | C2 cluster-primitive; 4 axes; brain-hands bounded extension |
| `wiki/process/stage-2-feedback-typology.md` (Wiki 118) | NEW | Cal (joint Cal+Volta) | 5 shapes A/B/C/D/E; two-epistemic-layer distinction |
| `wiki/patterns/layer-0-library-first-pre-draft-discipline.md` (Wiki 119) | NEW | Cal (joint Finn+Cal) | Pre-draft vs post-draft temporal complement to recurrence entry |
| `wiki/gotchas/inverted-trigger-primitives-antipattern-on-poll-based-substrates.md` (Wiki 120) | NEW | Cal (joint Finn+Cal) | n=4 cross-substrate; "does substrate dial into worker?" discriminator |
| `wiki/process/stage-2-cycle-yield-narrowing-to-read-back-phase.md` (Wiki 121) | NEW | Cal (joint Cal+Aen) | n=5 cumulative confirmation; source-commit-state discriminator |
| `wiki/patterns/cadence-crossing-dyad-variant-with-asymmetric-cross-vector-framework.md` (Wiki 122) | NEW | Cal (joint Aen+Herald+Cal) | n=11+ today; 3-vector asymmetric-cross framework with latency-and-cross-rate per vector |
| `wiki/patterns/credential-handoff-via-temp-file-context-firewall.md` (Wiki 123) | NEW | Cal (joint Aen+Hopper+Cal) | S37 in-vivo validation; failure-recovery cycle catalogued |
| Op-step-2 substrate executed — 2× wrangler secret put on fr-cma-pilot | Operator action | Hopper (PO 12:11 sanction; 12:58 retry with `CLOUDFLARE_ACCOUNT_ID` disambiguation + guarded shred fixes) | Both bindings updated; WEBHOOK_SECRET + ENVIRONMENT_ID untouched; substrate-truth catch: modified_on does NOT bump on secret rotation |
| 8 OKR check-ins fired (OBJ-2989 ×3 + OBJ-2990 ×2 + OBJ-2993 ×3) | Operator action | Aen-direct via upraise-api.py with Cal+Hopper drafts | OBJ-2991/2992 left unfired ("nothing yet" per PO) |
| `upraise-api.py` skill script extended | M | Aen | Added `--action checkin`, subprocess `encoding="utf-8"`, KR field extraction (children-array with `kr.title` at top level not `kr.objective.title`); also fixed appVersion 4.7.0→4.11.0 |
| ITSD-38884 (EVR IT ticket) body amended | M | Aen via Atlassian MCP editJiraIssue | Original single-scope (Edit) → dual-scope (Read + Edit) after Hopper pre-flight surfaced 403 on `GET /access/apps` |
| `docs/operations-log-2026-05.md` | M (+211 lines) | Hopper | Two ops-log entries covering KV inventory + S37 Tier-M arc + retry-after-failure |
| Scratchpads | M | callimachus +89 lines; hopper +6 lines | S37 carry-forward; Hopper bundled-shred [LEARNED] at n=1 |
| Misc | + | — | Cal queue drained to 2-item watch (routing-by-action + Stage-0-contribution at n=1 await n=2) |

### Decisions (PO-ratified)

[DECISION — S37] **Option A three-credential split per CMA reference impl ratified** for Round 1 (12:11). PO sanction verbatim: "sanction approved" against `wrangler secret put ANTHROPIC_API_KEY/ENVIRONMENT_KEY` with new sk-ant-api03 + sk-ant-oat01 values. Retry sanctioned in-scope at 12:58 with two fixes (CLOUDFLARE_ACCOUNT_ID env disambiguation + guarded conditional shred). Overrides S35 OAuth-everywhere shortcut.

[DECISION — S37] **Per-entry sanction cadence for Cal wiki entries** (13:10) due to PO budget signal. Released at 14:51 ("let now cal to go through all remaining postings non-stop") allowing batch-fire of items #4-#12.

[DECISION — S37] **Cred-handoff temp-file-as-context-firewall is the validated pattern** for credential plumbing in this team. Wiki 123 entry codifies it; failure modes (operator shred discipline; substrate config; coordinator-session-context) enumerated.

[DECISION — S37] **OBJ-2991/2992 (VJS2) deferred** per "nothing yet" — no FR team evidence base; punch-in deferred until concrete progress.

### Substantive learnings (Cal-grade or promotion-grade)

[LEARNED — process, promotion-grade] **Documentation-vs-substrate-truth-divergence** (Candidate A, Wiki 115): authoring-tier discipline gap where documentation/dispatch captures inferred substrate-property that is plausible-but-substrate-wrong. n=3 single-session evidence: (1) cf-pilot-status doc said "wired into KV SECRETS namespace" → actual mechanism Worker secret_text bindings; (2) Aen dispatch's "Worker auto-redeploys via modified_on" → wrangler secret put uses separate control-plane endpoint that doesn't bump script `modified_on`; (3) Aen bundled-shred dispatch language → temporal-position vs exit-code-conditional gap. **AUTHORING-LAYER complement to existing operator-layer substrate-truth cluster** (three-layer + recursive-narrowing + sub-shape-E + three-role-stacking + layer-0-library-first-recurrence + this entry + layer-0-PRE-DRAFT + substrate-vs-framework-boundary = n=8 cluster entries).

[LEARNED — process, promotion-grade] **Edit-tool-trap deterministic mechanism** (Wiki 116): harness maintains per-file Read-state slot invalidated by next tool call (any tool call, not just file-mutating ones). Recovery primitive: re-Read before Edit when prior Read >5 tool calls / >5 min real-time / SendMessage round-trip crossed / uncertainty. Applied throughout Cal's batch drafting; zero failure-recovery cycles after first instance (which became Candidate A evidence).

[LEARNED — process] **Cred-handoff temp-file pattern validated in-vivo**: PO pastes credential → Aen writes ephemeral file outside repo → Hopper reads + uses + shreds (guarded conditional). Failure modes: (a) operator shred discipline (must conjoin on exit codes not temporal position); (b) substrate config (e.g., wrangler account ambiguity); (c) coordinator session-context (credentials live in Aen context unless explicitly discarded). All three encountered S37; all three recoverable with proven patterns.

[LEARNED — substrate] **modified_on field reflects last script bundle deploy timestamp, not secret-rotation timestamp.** `wrangler secret put` updates Worker secret bindings via separate control-plane endpoint that does NOT bump `modified_on`. Positive control for "secret is live" is wrangler success output + CF API binding inventory, not `modified_on` delta.

[LEARNED — substrate] **KV namespaces and Worker secret_text bindings are distinct substrate mechanisms with confusingly-similar names.** Round 0 deploy via `wrangler secret put` stored 4 secrets as Worker secret_text bindings; KV `SECRETS` namespace is a separate substrate for runtime-readable secret material (egress-policy header-injection per Brunel S36 Gate B3 finding). cf-pilot-status doc had mechanism-misattributed this; corrected post-Cal-A.

[LEARNED — process] **contextToken 15-min TTL × chat-turn-eating-time pattern**: Forge JWT contextToken expires in 15 min from iat; multi-turn chat conversations routinely burn this window before write completes. n=4+ token-expired errors during S37 OKR work. Workaround: keep Python wrapper script pre-prepared; only token-paste turnaround is variable; fire IMMEDIATELY on receipt of fresh token. Skill-grade pattern; possibly Wiki-grade if n=2 across sessions (currently n=1 cumulative within this skill domain).

### Standing watch items going into session 38

- **ITSD-38884 admin grant** (sole Round-1 op-step-1 blocker; EVR IT processing)
- **Stage 2 read-back surfaces from S37 entries** — 8 surfaces total awaiting Finn relay; plus Hopper #2-4 on Candidate A; plus Volta on C2/typology/Layer-0/etc.
- **Hopper bundled-shred Cal candidate** held at n=1 in Hopper scratchpad; promotes to filing if n=2 surfaces
- **Routing-by-action + Stage-0-contribution-from-filer** deferred from S37 batch; n=1 watch posture; await n=2
- **Cal Stage 2 absorption async on prior S36 entries** (Recursive-Narrowing, 2.7, Layer-0-library-first-recurrence) — natural resolution as Finn/Brunel direct-DMs arrive
- **A1 evidence-cycle audit at S40-42** (originally S35 plan; ~3-5 sessions out)
- **S35-carry-forward standing watch (unchanged)**: Brunel-Amendment parallel-to-Hopper-4 (Layer-1-only Diagnostic Discipline gap); Hopper-Amendment-5 candidate (Layer-0 library-first n=3 in-session today S37 strengthens); "PO" → "Mihkel/you" naming convention
- **Aen amendment Part C (relay-visibility rule)** — HELD at `designs/deployed/operator-role/prompts/aeneas-amendment.md`
- **TPS-583 (apex-research)** — Stage-2 standard moves when PO signals; dormant
- **mVox-dev session 8+ carry-forward** (Palestrina 3 deferred items) — dormant
- **Manager-team / PO-team architecture** (Monte domain) — dormant; PO floated 2026-05-20

### NEXT-SESSION BOOT (re-orient instructions for S38)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — that's the 5-bullet reorientation seed per A1 adoption. Read it FIRST, then downgrade the tag to `[PROCESSED YYYY-MM-DD]` once processed.
3. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces ITSD-38884 admin grant landed (MOST LIKELY first ask if grant arrives):** spawn Hopper. Her S37 pre-flight identified the Edit-scope-arrival path: repeat check 5 (`GET /access/apps` with Brunel jq refinement `'.result[] | {id, name, domain, type, destinations}'`) to confirm no existing `fr-cma-pilot` Access app collision; if clean → execute Deliverable 2 Tier-D POST per PO 12:11 sanction shape (`NEW Access App with destinations:[{type:"public", uri:"fr-cma-pilot.evree.workers.dev/webhooks"}]` + inline bypass policy). ~5-10 min total. Verbatim sanction quote in `docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §2.4.
6. **If PO surfaces Pilot-A creation (op-step-3):** PO 5-click in CF dashboard: Agents → New Agent → Backend: Isolate → name `pilot-a` → model `claude-sonnet-4-6` → tools `[]`. Hopper verifies post-creation via `wrangler d1 execute fr-cma-pilot-db --remote --command "SELECT agent_id, backend, created_at FROM agent_backends ORDER BY created_at DESC LIMIT 5"`.
7. **If PO surfaces Anthropic session trigger (op-step-5):** PO action; observe webhook delivery → sandbox creation in CF → response.
8. **If PO surfaces Stage 2 read-back continuation:** spawn Finn for absorption on 8 surfaces (Edit-tool-trap ×4 / Layer-0 PRE-DRAFT ×3 / Inverted-trigger ×3 / Cadence-crossing ×3 / Stage-2-feedback typology ×3 — Finn-side and Volta-side overlap). Surfaces named in respective wiki entries' filing reports.
9. **If PO surfaces Cal queue continuation:** Cal queue is largely drained post-S37. Only routing-by-action + Stage-0-contribution at n=1 watch; await n=2 OR explicit PO direction to file at n=1.
10. **If PO surfaces routing-by-action or Stage-0-contribution promotion at n=1:** spawn Cal with explicit "file at n=1" sanction; otherwise defer per Cal's discipline.
11. **If PO surfaces credential-handoff pattern application** (any new credential into team substrate): Wiki 123 `credential-handoff-via-temp-file-context-firewall.md` documents the validated pattern; Aen writes ephemeral file outside repo (`~/.cf-pilot-creds-ephemeral.env` or similar); Hopper reads-uses-shreds with `[ "$EXIT" -eq 0 ] && rm -f` conditional gate OR decompose into two Bash-tool invocations.
12. **If PO surfaces apex-research cross-team work** (bidirectional cite-back, [CONTINUITY] adoption follow-up): spawn Cal for Companion-Pair Submission protocol filing.
13. **If PO surfaces Hopper-Amendment-5** (Layer-0 library-first discipline; n=3 strengthens with S37 in-session evidence): spawn Celes + Hopper + Brunel per S35 amendment-cycle pattern.
14. **If PO surfaces apex DB tunnel issues:** check `docs/operations-log-2026-05.md` for latest tunnel status; spawn Hopper for substrate diagnosis if tunnels degraded.
15. **Edit-tool-trap recovery primitive** (Wiki 116) applies to all agents doing scratchpad/index Edits during long-running batches; pre-load in spawn briefs if expecting >5 sequential Edits.
16. **contextToken 15-min friction note:** if S38 surfaces OKR or other Forge-app work requiring contextTokens, use Python wrapper script pattern (pre-written script + fast token-paste turnaround); each interim chat turn burns ~30s-2min of token life.

(*FR:Aen*)

---

## SESSION 36 WRAP — 2026-05-26 (One-day session ~2.5hr active; Round-1 op-step-1 prep complete + token-pending; 8 Cal entries shipped Wiki 107→114; comms.md v1.0→v1.4 wire-ready; 5 substrate-truth-evidence catches reshape Round-1 design)

**Spans:** 2026-05-26 ~10:55 (fresh team spawn) → ~13:24 (PO session-end signal). One day; ~2.5 hours active work; bandwidth-positive throughout.

**Outcome:** Round-1 op-step-1 EXECUTION-READY but token-pending. Hopper 4-deliverable prep complete with Tier-D sanction verbatim valid. Cal-side: 8 entries shipped + 2 amendments; substrate-design-truth-evidence cluster (2.5 + Recursive-Narrowing + 2.7 + Layer-0-library-first-recurrence) fully filed at four distinct coupling-dimensions. Herald comms.md v1.0→v1.4 wire-ready with AgentMailbox-as-separate-DO-class + ctx.waitUntil + Path-(a)-RPC + W4 connectivity-direction correction. Volta lifecycle.md amendments §VL3.1+§VL4.1+§VL5.1+PT4. Five substrate-truth-evidence catches reshape Round 1: (1) CF Access bypass canonical = NEW Access App with destinations[]; (2) Anthropic outbound-only connectivity; (3) wake = sessions.create() from mailbox handler; (4) three-layer identity chain (DO ID per-session not per-agent; AgentMailbox separate class); (5) secrets = egress-policy-header-injection-from-KV.

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `wiki/patterns/cluster-decomposition-meta-principle.md` (C1) | NEW | Cal (joint [brunel, volta]) | Meta-principle; n=3 coupling-dimensions × 3 domains |
| `wiki/gotchas/subagent-harness-blocks-curator-role-repo-write.md` | NEW | Cal solo | S35 carry-over filing |
| `wiki/patterns/bottleneck-determines-adoption.md` (C4) | NEW | Cal (joint [brunel, volta]) | n=3 across 2 domains; bidirectional YES+NO match; C1↔C4 methodology pair |
| `wiki/patterns/sub-shape-e-at-design-domain.md` (2.5) | NEW | Cal (joint [volta, herald, brunel, hopper]) | 4 sub-instances cross-author cross-document axis; full Stage 2 absorbed (4/4 direct-DM) |
| `wiki/patterns/three-layer-substrate-truth-discipline.md` | M (2.6 amendment) | Cal | n-count 3→6; design-domain sub-section; cross-link to 2.5 |
| `wiki/patterns/cluster-decomposition-meta-principle.md` | M (cross-link) | Cal | C1↔C4 methodology-corollary cross-link |
| `wiki/patterns/recursive-narrowing-substrate-truth-evidence-discipline.md` | NEW | Cal (joint [herald, brunel, finn]) | Within-author n=5 + cross-author n=4; sufficient × necessary logical decomposition |
| `wiki/patterns/three-role-discipline-stacking-within-dispatch-arc.md` (2.7) | NEW | Cal (joint [hopper, brunel, aen]) | Operator+designer+coordinator vantages; layer × role family-completion |
| `wiki/patterns/layer-0-library-first-recurrence.md` | NEW | Cal (joint [hopper, brunel, finn]) | 3-instance in-session catalog (S35 task #6 + S36 bypass-arc + S36 W4 skill-load) |
| `designs/new/cloudflare-pilot/comms.md` v1.0→v1.4 | M (+468 lines) | Herald (co-source [brunel, finn]) | AgentMailbox-as-separate-DO-class + waitUntil + RPC + W4; wire-ready |
| `designs/new/cloudflare-pilot/lifecycle.md` | M (+106 lines) | Volta | §VL3.1 R2 bucket layout + §VL4.1 respawn variant + §VL5.1 bootstrap + PT4 always-2xx |
| `docs/cf-pilot-status-and-s37-plan-2026-05-26.md` | NEW | Aen | Comprehensive PO-facing status report + S37 plan |
| `docs/webhook-sandbox-research-2026-05-26.md` | NEW | Finn | Task #6; ~600 lines; comprehensive surface map |
| `docs/herald-g2-cross-agent-comms-brief-2026-05-26.md` | NEW | Finn | G2 brief; ~330 lines; six-step cross-agent path |
| `docs/wake-mechanism-w4-finding-2026-05-26.md` | NEW | Finn | W4 brief; ~120 lines; resolves task #11 |
| `docs/round-1-anthropic-platform-checklist-2026-05-26.md` | NEW | Finn | Surface-1 checklist; ~210 lines; 6 sections |
| 6 scratchpads updated | M | brunel, callimachus, finn, hopper, team-lead, volta | + 1 untracked `docs/uikit-dev-harvest-2026-04-14.md` carry-forward |

### Decisions (PO-ratified)

[DECISION — S36] **Path 1 Isolate-only Round 1 ratified** (14:36). MicroVM defers to Round 2. Substrate-class held CONSTANT per substrate.md experimental-isolation discipline at Isolate class. Brunel-recommended. Already-deployed substrate exec-ready; no Docker / no v2 migration / no Workers Builds.

[DECISION — S36] **EVR Access bypass approach = path-rule on `/webhooks`** (14:00). Minimum-scope exception; rest of Worker remains Access-gated.

[DECISION — S36] **Hopper sanctioned to execute bypass + acquire CF auth** (14:36). Hopper becomes CF substrate operator; extends S35 Aen-direct precedent.

[DECISION — S36] **CF API Token provisioning committed but PENDING DELIVERY** (14:40 committed). 5 scopes (Workers Scripts Read, Access Apps and Policies Edit, KV Read, D1 Read, R2 Read), EVR-account-bounded, 24h TTL. **Sole Round-1 op-step-1 blocker.**

[DECISION — S36] **Tier-D sanction "Approve as drafted"** on Hopper Deliverable 2 (14:40 verbatim). Bypass command: NEW Access App with `destinations:[{type:"public", uri:"fr-cma-pilot.evree.workers.dev/webhooks"}]` + inline bypass policy. Brunel canonical-CF-API cross-read at 14:42 confirmed this shape is API-canonical (CF Access Policies API has no path-scope fields; path-scope lives on Application's destinations[]). 14:43 re-sanction against wrong-correction (policy-on-existing-app) moot/revoked per substrate-truth.

[DECISION — S36] **Pilot-A creation path = PO via CF dashboard** (14:43). Not service token. Path post-bypass: Agents → New Agent → Backend: Isolate → name: `pilot-a` → model: `claude-sonnet-4-6` → tools: [].

[DECISION — S36] **Finn-Q1 credential shape DEFERRED to S37** (14:43). Tracked as task #10. Load-bearing post-W4 (sessions.create scope on mailbox-handler credential is now required).

### Substantive learnings (Cal-grade or promotion-grade)

[LEARNED — substrate, promotion-grade] **CF Access bypass canonical pattern** (Brunel substrate-truth-evidence catch). Template docs phrasing ("Add Bypass policy under same application") is dashboard-UX-focused; CF API ref documents path-scope on `destinations[]` of Access Application, not on policies. Policy-on-existing-app would over-broaden auth across App's full destinations. **Layer-0 library-first must recursively descend through doc-provenance layers when consumer-team docs framing is mechanism-ambiguous.** Joint Brunel+Hopper Cal candidacy (filed as Layer-0-library-first-recurrence).

[LEARNED — substrate, promotion-grade] **Anthropic Managed Agents connectivity is outbound-only** (Finn `claude-api` skill catch). Worker long-polls Anthropic; Anthropic never dials our network. Reshapes wake-mechanism design from inverted-trigger framing to **`client.beta.sessions.create()` from mailbox handler** post-write + long-poll worker pickup. Resolves task #11.

[LEARNED — substrate, promotion-grade] **Identity is three-layer chain**: agent-name → agent_id → session_id → DO ID. DO ID is per-session not per-agent. **AgentMailbox must be separate DO class** (per-agent durable via `idFromName(agent_id)`) distinct from existing Sandbox/IsolateRunner classes (per-session ephemeral).

[LEARNED — substrate, promotion-grade] **Secrets injection mechanism**: egress-policy header-injection from KV `SECRETS` namespace, NOT secret_bindings[] on sandbox. Round 1 needs zero agent-side secrets; 4 Worker-level secrets are control-plane.

[LEARNED — process, promotion-grade] **Recursive-narrowing substrate-truth-evidence discipline** (Cal entry; joint Herald+Brunel+Finn): each substrate-truth pass on a single document catches blind-spots at progressively deeper architectural layers. Within-author n=5 on comms.md trajectory (v1.0→v1.4) + cross-author n=4 catalog. **Each pass narrows but doesn't eliminate — asymptotic, not terminal.** Architectural-depth as second axis (Brunel sharpening): rows 1-4 substrate-primitive-shape catches; row 5 connectivity-direction-model catch — qualitatively deeper layer.

[LEARNED — process, promotion-grade] **Expertise-routing as constitutive of recursive-narrowing**: discipline = iteration-tightens-framing × reviewer-substrate-knowledge-matches-current-layer. Each catcher in v1.0→v1.4 chain had substrate-expertise matched to version's depth (Herald protocol-shape / Brunel identity+DO-semantics / Brunel waitUntil / Finn RPC-vs-HTTP / Finn skill-load Anthropic-canonical). Cross-team test of pattern is whether expertise-routing happens naturally OR requires conscious management.

[LEARNED — process, promotion-grade] **Three-role discipline-stacking across dispatch arcs** (Cal entry; joint Hopper+Brunel+Aen): operator hard-gate + designer substrate-truth-cross-read + coordinator relay-fidelity-correction catches what each role alone misses. n=3 instances S34/S35/S36. Family-completion claim: layer-decomposition × role-decomposition = full operational shape of substrate-truth-evidence discipline.

[LEARNED — process] **Stage-2-feedback typology has 5 empirical shapes this session**: Shape-A pure-renaming + Shape-B forward-claim-extension + Shape-C mechanism-sharpening-within-claim-base + Shape-D factual-correction-on-inferred-content (FLAG-invited) + Shape-E axis-distinction-discipline-check. Author-stylistic-tendency hypothesis: Brunel→Shape-B; Volta→Shape-A+C. Cal+Volta cross-role topology n=2 trigger for typology entry candidate. n=2 of S6-narrowing observation now n=5 cumulative confirmation (C4+2.5+2.6+RN+2.7+Layer-0 all drafted clean Stage 1 solo-author despite joint-source).

[LEARNED — process] **Asymmetric-cross-in-flight is routing-mode-dependent** (Cal+Aen co-articulated). Empirically confirmed n=4: ALL 4 author 2.5 Stage 2 replies arrived via direct-DM channel; ZERO via Aen-coordinator-routed burst. 3-vector framework (i Aen→others / ii Aen←others / iii Cal↔peers). Hypothesis: routing-mode (direct DM vs coordinator-relay) is latency-determining property. Wiki-process candidate joint-authorship-topology-broadening promotes from watch-grade to candidate.

[LEARNED — process] **Cadence-cross density during bandwidth-positive sessions**: Cal-Aen n=10+, Herald-Aen n=6, Finn-Aen-Cal triangle n=1. Pattern structural at sub-100-second crossing window. E4 entry promotion-grade-at-first-filing per evidence density.

### Standing watch items going into session 37

- **CF API Token delivery** (the only Round-1 op-step-1 blocker)
- **Anthropic credential shape decision** (task #10; Finn brief enumerates options; sessions.create scope is the load-bearing requirement)
- **Pilot-A creation via CF dashboard** (PO 5-click action post-bypass; status report has the exact path)
- **Cal-queue carry-forward** — ~7 fully-framed candidates: Edit-tool-trap (promotion-grade Cal+Finn; Finn mechanism correction folded — Write invalidates Read-state, deterministic not statistical); C2 substrate-vs-framework boundary primitive (Volta-axes-enumeration ready: lifecycle-phase + failure-semantics + Brunel substrate-class-fit); S6 drafting-vs-read-back-phase yield narrowing (n=5 cumulative confirmation); Stage-2-feedback typology entry (Cal+Volta 5-shapes-this-session); cadence-crossing E4 (Aen+Herald n=6 + asymmetric-cross 3-vector sub-section Cal+Aen); routing-by-action pattern+failure-mode paired (Herald-origin); Stage-0-contribution-from-filer (sketch-grade; n=1 in-vivo)
- **Cal Stage 2 absorption still in-flight async**: Recursive-Narrowing (Herald-acked; Brunel + Finn pending direct-DM); 2.7 (Hopper-acked; Brunel pending); Layer-0-library-first-recurrence (Hopper + Brunel + Finn all pending) — natural resolution as direct-DMs arrive next session
- **Brunel substrate.md amendment** queued post-Round-1: §2 Isolate-pivot, §3 egress-policy schema, §4 layered-chain rewrite, §5 Q3/Q4/Q5 answered
- **Herald axis-distinction sharpening to Brunel** in-flight (recursion-locus hypothesis; Brunel will respond direct)
- **S35-carry-forward standing watch (unchanged):** Brunel-Amendment parallel-to-Hopper-4 (Layer-1-only Diagnostic Discipline gap); Hopper-Amendment-5 candidate (Layer-0 library-first; n=3 in-session today strengthens to n=2 across sessions); "PO" → "Mihkel/you" naming convention
- **Aen amendment Part C (relay-visibility rule)** — HELD at `designs/deployed/operator-role/prompts/aeneas-amendment.md`; potentially revisited per session
- **TPS-583 (apex-research)** — Stage-2 standard moves when PO signals; dormant
- **mVox-dev session 8+ carry-forward** (Palestrina 3 deferred items) — dormant
- **Manager-team / PO-team architecture** (Monte domain) — dormant; PO floated 2026-05-20, not actioned

### NEXT-SESSION BOOT (re-orient instructions for S37)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — that's the 5-bullet reorientation seed per A1 adoption. Read it FIRST, then downgrade the tag to `[PROCESSED YYYY-MM-DD]` once processed.
3. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **READ THE STATUS REPORT FIRST IF PO ASKS ABOUT CF PILOT:** `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` is THE canonical S37 brief — has everything: S35 substrate state + S36 decisions + token specification + S37 critical-path sequence + risk register. Don't re-derive context that's already in this doc.
6. **If PO delivers CF API token (MOST LIKELY first ask):** spawn Hopper. His 4-deliverable prep is in his scratchpad; execution path locked at Path D — pre-flight verify → Tier-R L3 batch → STOP at surface-back gate → PO clearance via me → Tier-D bypass POST per 14:34-with-destinations[] shape (PO 14:40 sanction valid; 14:43 re-sanction moot per substrate-truth) → 30-60s propagation → 3-probe verification → ops-log entry. ~5-10 min total. Verbatim sanction quote: "**PO 2026-05-26 14:40 — 'Approve as drafted'** against Hopper's Deliverable 2 curl POST to `https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/access/apps`..." (full quote in cf-pilot-status-and-s37-plan §2.4 Deliverable 2 + Hopper scratchpad).
7. **If PO surfaces credential shape decision (task #10):** Finn brief at `docs/webhook-sandbox-research-2026-05-26.md` §2 has three failure modes documented. Single-OAuth vs three-credential split (WEBHOOK_SECRET + ANTHROPIC_ENVIRONMENT_KEY + ANTHROPIC_API_KEY) per CMA reference impl. Affects which credential mailbox-handler uses for `client.beta.sessions.create()`.
8. **If PO surfaces Pilot-A creation:** dashboard click-path is Agents → New Agent → Backend: Isolate → name: `pilot-a` → model: `claude-sonnet-4-6` → tools: `[]`. Hopper verifies via `wrangler d1 execute fr-cma-pilot-db --remote --command "SELECT agent_id, backend, created_at FROM agent_backends ORDER BY created_at DESC LIMIT 5"` post-creation.
9. **If PO surfaces Cal-queue continuation:** spawn Cal. ~7 entry candidates fully framed in her scratchpad. Edit-tool-trap (joint Cal+Finn; promotion-grade at first-filing per Finn mechanism correction — Write invalidates Read-state deterministic, not statistical) is the natural first entry. Then C2 substrate-vs-framework boundary primitive (joint with Volta; her axes-of-bifurcation enumeration ready). Pre-specified §1-§6 frames locked for all candidates. Also: Stage 2 absorption still in-flight on Recursive-Narrowing + 2.7 + Layer-0 — natural resolution as direct-DMs arrive.
10. **If PO surfaces Herald v1.4 close-out / Brunel substrate.md amendment / S35-carry-forward standing watch items (Brunel-Amendment / Hopper-Amendment-5 / naming convention):** spawn relevant agent. S35-carry-forward items unchanged from S35 standing watch.
11. **If PO surfaces apex-research cross-team work** (bidirectional cite-back, [CONTINUITY] adoption follow-up): spawn Cal for Companion-Pair Submission protocol filing.
12. **Cross-in-flight pattern awareness for me as team-lead:** asymmetric-cross is empirically confirmed routing-mode-dependent — Aen-coordinator-routed messages have structurally-elevated arrival latency vs direct-DM. When routing Stage 2 surfaces, recommend agents use direct-DM rather than team-lead-relay; reserve team-lead-routing for genuinely needs-coordination cases.
13. **Brevity discipline acknowledged:** consolidation-phase ratifications can be brief acks; substantive co-articulation warrants full contribution. Both compose. Document this distinction in scratchpad as discipline norm.

(*FR:Aen*)

---

## SESSION 35 WRAP — 2026-05-21 → 2026-05-26 (Six-day session; 10 tasks closed; Cloudflare research-and-execution arc landed in-session; A1 NEXT SESSION seed bootstrap above is part of this session's lasting structural artifact)

**Spans:** 2026-05-21 09:33 → 2026-05-26 ~13:30. Six calendar days. Longest session in FR history by wide margin.

**Outcome:** Substantial cross-track progress on (a) S34 carry-forward Cal-Protocol-A submissions (Phase A complete; Phase B Hopper-Amendment-4 landed); (b) mVox-dev investigation + research-perspective companion (catalyzed PO dual-perspective discipline correction); (c) **Cloudflare Claude Managed Agents pilot — designed AND Round 0 substrate validated end-to-end on EVR account**, dashboard live, ready for Round 1 sandbox creation; (d) apex DB tunnel operational incident resolved via Aen-direct Path B execution (PO authorization extension); (e) A1 mVox-M1-seed adoption (this session's seed above is the first instance — discipline self-application).

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `wiki/patterns/discriminator-anchored-on-sub-canonical-source.md` | NEW | Cal (Brunel + Hopper joint source) | Phase A task #1 |
| `wiki/patterns/three-layer-substrate-truth-discipline.md` | NEW + E1 staleness refresh | Cal (Brunel + Hopper joint source) | Phase A task #2 + Cal Priority 3 (S35 docs/findings.md fold) |
| `prompts/hopper.md` lines 130-211 (Hopper-Amendment-4) | NEW | Celes-drafted + Hopper author-of-record + Brunel architectural co-author | Phase B task #3 — three-layer Diagnostic Discipline section |
| `docs/findings.md` | NEW (cross-cutting) | Brunel + Volta joint (Cal filed) | Task #7 — substrate gap analysis vs Cloudflare; FR-as-multi-agent-coordination-layer-above-single-agent-substrates positioning + bottleneck-alignment n=3 + cluster-decomposition meta-principle (strongest finding) |
| `designs/new/cloudflare-pilot/` (README + substrate.md + lifecycle.md + comms.md) | NEW | Aen-synthesis of Brunel + Volta + Herald briefs | Task #10 — pilot experiment design |
| `docs/operations-log-2026-05.md` (entries #7, #8, #9) | +204 lines | Hopper | Task #6 apex DB tunnel diagnostic + verification |
| Apex DB tunnels recovered via Path B | Operator-side action | Aen (PO-authorized direct execution) | Killed Windows-side orphan tunnel tree + restarted Task Scheduler; substrate-truth-anchored discovery: TNS-bytes probe was flawed fingerprint; substrate-probe-design itself can be sub-canonical source |
| `auto-memory/feedback_dual_perspective_remote_team_observation.md` | NEW | Aen (PO 2026-05-22 correction) | We-as-target AND we-as-researchers discipline; saved durably |
| Cloudflare `fr-cma-pilot` Worker deployment | Operational substrate on EVR | Aen direct | KV (2) + D1 + R2 + 4 secrets + Anthropic Self-managed env wired |
| Cross-team consultation with Schliemann (apex-research) | Cross-team comms | Aen + Volta findings relayed | Apex adopted [CONTINUITY] tag (2 design hooks Aen-articulated); FR adopted M1 seed (this artifact instantiates) — decomposition pattern n=2 cross-team |

10 tasks closed (#1-#8, #10); 1 in_progress (#9 Cal queue absorption, carries to S36).

### Decisions (PO-ratified)

[DECISION — S35] **A1 (mVox M1 NEXT SESSION seed) adopted for FR.** PO ratified 2026-05-22 ~13:15 after Volta task #4 investigation. Evidence-first approach: A1 only (not A2/A3); audit at S40-42 per Volta thread-2 procedural-vs-structural framing. **This session's [NEXT SESSION] seed (above the wrap) is the bootstrap-write — discipline self-applies from session-1.**

[DECISION — S35] **Cloudflare pilot proceeds on EVR account with experimental `fr-cma-pilot` naming.** PO ratified 2026-05-26 after Workers-Paid tier check on EVR + individual-account-Probably-free inference. Naming discipline keeps experimental artifacts visually distinct from production (`conversations`, `vestlused`, `apex-research`).

[DECISION — S35] **Round 0 (substrate smoke test) is the closure point this session.** Round 1+ (sandbox creation + actual session-running) defers to S36+ in fresh-session form. Multi-session experiment per PO 2026-05-26 AskUserQuestion answer.

[DECISION — S35] **Anthropic OAuth token (subscription-based, sk-ant-oat...) used as ANTHROPIC_API_KEY** for pilot Round 0 per PO direction "use same key we are using right here." Three caveats noted (token expiration, header-format compatibility, audit attribution); tolerable for experimental pilot, would matter for production.

[DECISION — S35] **Aen-direct execution sanctioned by PO for substrate operations** that Hopper couldn't reach via SSH paths. Two instances: (a) apex DB tunnel Windows-side teardown + restart (Path B); (b) Cloudflare pilot deployment + secrets-upload. Coordinator-only restriction overridden for operational obstacles per explicit PO direction "perform all actions yourself, dont depend on me."

[DECISION — S35] **Dual-perspective discipline enshrined via feedback auto-memory.** PO 2026-05-22 correction: when assessing remote-team practices (or any cross-team observation), apply BOTH we-as-target (adoption decision) AND we-as-researchers (framework finding) explicitly + foregrounded. Saved as `feedback_dual_perspective_remote_team_observation.md`. Applied retroactively to Volta thread-5 research-perspective companion (task #5).

### Substantive learnings (Cal-grade candidates)

[LEARNED — promotion-grade, framework] **Cluster-decomposition meta-principle** (docs/findings.md §S4 — strongest single finding from task #7). Clusters decompose along their coupling-dimension; coupling-dimension is the load-bearing property to identify when observing any cluster. n=3 origin observations (mVox M1-M5 team-property coupling / Cloudflare 7-mechanism cluster team-property coupling / Sub-shape E 3 layers ownership-locus coupling). Methodology corollary: decompositions invisible at n=1, emerge at n=2 with second instance providing variation along the coupling-dimension. Cal-Protocol-A queue item C1 — highest sequencing priority.

[LEARNED — promotion-grade, framework] **Bottleneck-determines-adoption is cross-domain.** Volta thread-3 generalizes from discipline-domain (S35 mVox M1+M3 vs FR vs apex bottleneck-shapes) to substrate-domain (Cloudflare adoption per FR-shipped-team bottleneck). n=3 corroboration across two domains. Two-condition rule: bottleneck matches substrate strength AND workload fits substrate constraints. Cal-Protocol-A queue item C4.

[LEARNED — promotion-grade, framework] **Sub-shape E substrate-class-invariant at n=2** (docs/findings.md §S5). Three-layer substrate-truth model (S34 Docker-on-RC n=1) now confirmed at n=2 under Cloudflare-managed substrate. Drift surfaces redistribute predictably when ownership locus shifts; surfaces themselves persist. Wiki confidence promoted medium → medium-high. Independent vendor corroboration via Cloudflare's own gotchas section in `connecting-to-private-services.md` (4 distinct drift instances vendor-documented). Cal-Protocol-A queue item E1.

[LEARNED — promotion-grade, framework] **Substrate-vs-framework boundary primitive.** docs/findings.md §S1 + §S2 — Cloudflare's brain-hands decoupling IS the substrate primitive; FR's multi-agent coordination is the framework layer above it. "We stack, not compete." Bounded extension: "brain-hands decoupling" (Cloudflare vocabulary) and substrate-vs-framework-boundary (FR vocabulary) are the same boundary named from two sides. Cal-Protocol-A queue item C2.

[LEARNED — process, promotion-grade] **Dual-perspective discipline** (PO 2026-05-22 correction). Cross-team observation requires we-as-target AND we-as-researchers framings explicit + foregrounded — not woven in. Saved to auto-memory + applied to Volta task #5 (Aen re-dispatched after correction). Generalizable beyond cross-team contexts: applies whenever FR observes any external pattern (substrate, vendor, sibling team, framework primitive).

[LEARNED — promotion-grade, process] **Dyad-cross-pattern has TWO failure modes** (Volta phrasing at task #7 polish-pass): (a) drift-loop — genuine miscommunication, content diverges, reconciliation cost grows; (b) affirmation-loop — content converged early, subsequent passes only re-affirm closure without adding content. Discriminator: substantive-content-added vs only-affirmation. Recovery mechanisms: team-lead intervention at ~5+ passes (Aen 13:14 deliver-NOW); dyad-side fast-forward maps at ~3+ passes (Volta 17:25 consolidates state in single read). Both empirically demonstrated in task #7 polish-pass execution. Cal-Protocol-A queue item E4.

[LEARNED — process] **Lifecycle-phase-invariance corollary.** Volta §VL4 in cloudflare-pilot/lifecycle.md: startup-side bifurcation symmetric with shutdown-side bifurcation (docs/findings.md §V3). Substrate-vs-framework boundary is operationally invariant across lifecycle phase (startup + runtime + shutdown all bifurcate the same way). Round 1 pilot will exhibit all three phases under CF substrate — empirical confirmation by construction.

[LEARNED — promotion-grade, process] **Credibility-floor preamble for cross-team observation** (Volta thread-4 obs-2, materialized in docs/findings.md Preamble). Four load-bearing-implicit Cloudflare claims explicitly enumerated; downstream conclusions bounded against them. Independent vendor's own gotchas section corroborates. Cal-Protocol-A queue item — generalizes beyond Cloudflare context to all announcement-grade source interpretation.

[LEARNED — promotion-grade, substrate] **Substrate-probe-design CAN be sub-canonical source itself.** Aen-surfaced (apex DB tunnel post-restart): TNS-bytes probe was anchored on assumed Oracle protocol behavior (responds to any input), but Oracle TNS doesn't respond to malformed input. Extends discriminator-anchored-on-sub-canonical-source.md from "discriminator anchors on inferred-grammar" to "probe semantics anchor on assumed-protocol-behavior" — same defect class. Hopper folded into her scratchpad. Cal-Protocol-A queue item (potentially A.3 sub-shape; Brunel-question on naming).

[LEARNED — process] **Library-first-before-investigating** is a Tier R primitive that precedes substrate probes (Layer-0 before Layer 1/2/3). Aen-surfaced during apex DB tunnel arc — should have queried wiki BEFORE dispatching Hopper to substrate-probe. Carry-forward as Hopper-Amendment-5 candidate; not surfaced this session per batched-iterate compact with Celes.

[LEARNED — substrate, Cloudflare integration] **Anthropic supports TWO self-hosted patterns for Claude Managed Agents.** Console default (low-code flow) is CLI-polling via `ant` CLI; CF template uses webhook-driven. Different positions on substrate-vs-framework boundary, both available from same platform. Worth Cal-Protocol-A note as cross-pattern observation.

[LEARNED — substrate, Cloudflare integration] **EVR Cloudflare Access org-wide policy auto-secures the deployed Worker.** README §8 warned default state is insecure; EVR's policy makes it secure-by-default. But blocks Anthropic webhook delivery on `/webhooks` until path-bypass added. Worth Cal note as substrate-environment-defaults-matter pattern.

[LEARNED — process] **Harness-restriction blocks subagent from writing report-pattern files.** Cal (subagent) couldn't write `docs/findings.md` — error `"Subagents should return findings as text, not write report files."` Workaround: Cal ships content via SendMessage; Aen writes from main session. Sub-shape-E-type structural gap between team-design (Cal has wiki writer authority by convention) and substrate-implementation (subagent harness pattern-matches and blocks). Cal-Protocol-A queue item.

### Standing watch items going into session 36

- **Cloudflare pilot Round 1** — substrate ready; needs `/webhooks` Access bypass + first sandbox creation + trigger session via Anthropic. Round 1 spec at `designs/new/cloudflare-pilot/README.md`. **Most likely first dispatch surface for S36.**
- **Cal-Protocol-A queue ~10 items** — Cal in_progress on task #9. After Phase-A (Priority 1+3+E1) landed; remaining: C1+C4+C2+C3+E2/E3/E4 + harness-restriction Sub-shape-E + orphan-leaf-detector for windows-bridge + Sub-shape A.3 probe-design + Pass-1-prose-only-batched-iterate + mVox-thread-1/3/4 + Companion-Pair filing for [CONTINUITY]/A1. Cal sequences per bandwidth.
- **Brunel-side parallel amendment to `prompts/brunel.md`** §Diagnostic Discipline (Layer-1-only gap; same shape as Hopper-Amendment-4). Celes-routed when scheduled.
- **Hopper-Amendment-5 candidate** (Layer-0 library-first discipline). Hopper batched-iterate compact with Celes: deferred to future amendment-pass.
- **Apex-research bidirectional cite-back** — if Eratosthenes files apex-side wiki entry for [CONTINUITY] adoption or related cross-pollination, Cal handles via Companion-Pair protocol.
- **A1 evidence-cycle audit at S40-42** — measure whether the M1 seed pattern actually reduces team-lead reorientation tax. If yes, A2/A3 expand. If no, learn what shape didn't fit.
- **Manager-team / PO-team architecture** (Monte domain; carried since 2026-05-20) — PO floated; not actioned. Surface if PO returns to it.
- **Aen amendment Part C (relay-visibility rule)** — HELD at `designs/deployed/operator-role/prompts/aeneas-amendment.md`. PO may revisit.
- **mVox-dev session 8 carry-forward** (Palestrina 3 deferred items: path convention, CLAUDE.md drift, polyphony-isms). Dormant unless PO surfaces.
- **Volta evaluates mVox-dev startup procedure** — partially-done via task #4; could revisit for additional comparison if PO surfaces.
- **TPS-583 (apex-research)** — Stage-2 standard moves when PO signals Ruth progressed. Dormant.
- **"PO" → "Mihkel/you" naming convention question** (PO surfaced 2026-05-22 13:15 ish). Not resolved beyond conversation; common-prompt + agent prompts still use "PO". PO may direct a renaming pass.

### NEXT-SESSION BOOT (re-orient instructions for S36)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — that's the 5-bullet reorientation seed per A1 adoption. Read it FIRST, then downgrade the tag to `[PROCESSED 2026-05-XX]` once processed.
3. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces Cloudflare pilot Round 1 (MOST LIKELY first ask):** read `designs/new/cloudflare-pilot/README.md` Round 1 spec + sub-briefs. Spawn Brunel + Volta + Herald for the design-side; possibly Hopper for substrate-operational verification. First operational step: address EVR Cloudflare Access wall on `/webhooks` — needs PO dashboard action OR sanction for me to add path-bypass via `wrangler` if API allows. Then PO creates first Isolate-backed sandbox in `https://fr-cma-pilot.evree.workers.dev/` dashboard. Then trigger session via Anthropic platform → observe webhook delivery → sandbox creation in CF → response.
6. **If PO surfaces Cal-Protocol-A queue continuation:** spawn Cal. Her task #9 stays in_progress; she sequences per bandwidth. Top of queue: C1 cluster-decomposition (strongest), then E1 amendments (already partially done — Sub-shape E n=2 + staleness refresh), then C4 bottleneck-determines-X cross-domain, then C2 substrate-vs-framework boundary primitive. ~10 items total in queue.
7. **If PO surfaces Brunel-side parallel amendment** to `prompts/brunel.md` (Layer-1-only gap same as Hopper-Amendment-4): spawn Celes + Brunel (as author-of-record) + Hopper (cross-reviewer for symmetry). Same joint-review pattern as task #3.
8. **If PO surfaces Hopper-Amendment-5 candidate** (Layer-0 library-first discipline): spawn Celes + Hopper + Brunel. Hopper has the candidate prose in her scratchpad; honor batched-iterate compact (Layer-0 sub-pattern is one-amendment-cycle separate from Amendment-4).
9. **If PO surfaces "PO" → "Mihkel/you" naming convention question:** this affects common-prompt + all agent prompts + roster. Coordinate Celes (prompt-side curation) + Cal (wiki cross-references) for the rename pass.
10. **If PO surfaces A1 evidence-cycle audit** (planned S40-42): measure whether M1 seed reduced team-lead reorientation tax this session. Compare S36 startup-time to S34/S35 startup-times (subjective; PO will say). If subjective improvement is real, A2/A3 expand; if not, learn what shape didn't fit.
11. **If PO surfaces apex-research cross-team work** (bidirectional cite-back, [CONTINUITY] adoption follow-up, Companion-Pair filing for FR-M1 + apex-M3): spawn Cal for Companion-Pair Submission protocol filing.
12. **First operational item if Cal-spawning at S36 start:** route any pending Protocol A submissions from S35 carry-forward queue. Cal had ~10 items queued at S35 close. Surface-grade work present regardless of PO direction.
13. **Apex DB tunnels** — operational substrate verified stable at S35 close (third-generation inodes confirmed evolving normally per Hopper task #6). No watch action needed unless PO reports apex team re-flags.

(*FR:Aen*)

---

## SESSION 34 WRAP — 2026-05-20 → 2026-05-21 (Hopper's first dispatch — apex-research authorized_keys multi-key persistence; original PO ask ACHIEVED; degraded-substrate diagnostic prevented multi-system credential cascade; Sub-shape A-E pattern catalog + 3-layer substrate-truth discipline crystallized)

**Spans:** Multi-day session 2026-05-20 → 2026-05-21 (apex team's voluntary maintenance window enabled the recreate). Single dispatch arc, but the diagnostic depth made it the richest dispatch in FR history.

**Outcome:** Original PO ask — "Aleksandr's SSH key persists across apex container rebuilds" — fully ACHIEVED at 09:18 on 2026-05-21. Apex container now has canonical `.env` at `$COMPOSE_DIR` (PO/Aleksandr/rc-connect in SLOTS 1/2/3) + amended operational compose-yml (declares GH_TOKEN per PO direction) + recreated container Config.Env (all declared tokens propagated). Future recreates reproduce the state.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `teams/framework-research/docs/operations-log-2026-05.md` | NEW (6 append-only entries spanning the full arc) | Hopper | committed across `b802c31`, `62a0e2a`, `3f74987`, `0e7fe8f` |
| `teams/framework-research/memory/hopper.md` | NEW (first-dispatch carry-forward; apex substrate-facts; n=4 Sub-shape A catalog; revert-on-invalidated-premise discipline) | Hopper | `b802c31`, `296bc83`, `0e7fe8f` |
| `teams/framework-research/memory/brunel.md` | S34 entry added (sub-shape A-F→A-E catalog, 3-layer model, recovery-pattern articulation); pruned to 94 lines | Brunel | `296bc83` |
| `teams/framework-research/docs/apex-keys-dispatch-2026-05-20-findings.md` | NEW (PO-facing memo; full arc + open questions) | Aen | `b802c31`, then cleanup at `296bc83` |
| `teams/framework-research/docs/apex-keys-diff-2026-05-20.md` | NEW (P2 substrate-state diff: backup `.env` vs container Config.Env, redacted) | Hopper | `3f74987` |
| `designs/new/apex-keys-phase1-redux-dispatch.md` | NEW (executable dispatch design; Tier R + Tier M `.env` write) | Aen | `690457b` |
| `designs/new/apex-keys-phase2-recreate-dispatch.md` | NEW (executable dispatch design; Tier D recreate + PO sanction package) | Aen | `abfb026` |
| `teams/framework-research/restore-inboxes.sh` | M (count-check fix: tolerate `dest > source` per Step 2c ghost pre-create; matches persist-inboxes.sh `-lt` pattern) | Aen | `b802c31` |
| Apex production container | RECREATED via PO-sanctioned Tier D | Hopper P4.2 | substrate-side; ops-log entry at 09:18 |

8 commits shipped this session: `b802c31`, `296bc83`, `62a0e2a`, `3f74987`, `690457b`, `abfb026`, `0e7fe8f` (plus one prior session-end commit `e12e810` from S33+ that bridges).

### Decisions (PO-ratified)

[DECISION — session 34] **Phase 2 r3 recreate RESCINDED mid-execution** after P1.2c three-probe batch revealed degraded substrate state (no `.env` at `$COMPOSE_DIR`; container surviving on pre-2026-04-29-fresh-clone Config.Env; recreate would have wiped SSH + GitHub + Atlassian + Cloudflare credentials simultaneously). Multi-system failure prevented by Hopper's hard-gate discipline.

[DECISION — session 34] **Two-phase plan: Phase-1-Redux (Tier M `.env` write) + Phase 2 (Tier D recreate).** Phase-1-Redux executable when apex team in maintenance window. Phase 2 PO-sanctioned verbatim 2026-05-20 19:01 ("Approve as drafted") against the recreate command + reason + expected outcome.

[DECISION — session 34] **GH_TOKEN preserved across recreate via P4.05 compose-yml amendment.** PO objection at 19:35 reversed my 19:34 Option A sanction ("substrate-correction normalization" — drop GH_TOKEN). PO direction: "if they have it right now, then why would we take away from them." P4.05 Tier M added `- GH_TOKEN=${GH_TOKEN:-}` to operational compose-yml's apex-research env block before P4.2 recreate.

[DECISION — session 34] **Apex maintenance window IS the recreate window** (not "wait until they're back"). PO clarification 2026-05-20: apex team voluntarily took agents offline SPECIFICALLY to enable our Phase 2 recreate without disrupting their sessions. Reframed Phase-1-Redux preconditions; both phases executed in the same window.

### Substantive learnings (Cal-grade candidates; pre-drafted in scratchpads)

[LEARNED — substrate, promotion-grade] **Sub-shape A: discriminator-anchored-on-sub-canonical-source.** Four self-instances within one dispatch arc, all in Brunel's dispatch-authoring text, all caught by Hopper's hard-gate discipline:
- A.1 (identifier-grammar): P1.1 `michelek` regex (template-stub vs live), P1.2a label-key typo (inferred underscore vs canonical dot), P3.6 pass-criterion `[A-Z_]+` (digit-exclusion)
- A.2 (multi-layer-transit): P4.05 awk script (PowerShell→bash→awk escape chain failed at innermost layer's grammar)
- **Recovery pattern:** substrate-live-state-as-discriminator-source + JSON-dump-on-empty for within-dispatch-agency disambiguation
- **Sub-discipline:** "stress-test multi-layer transit against the innermost layer's grammar before relying on layered-escape correctness" (Brunel session-end articulation)

[LEARNED — substrate, promotion-grade] **Sub-shape E: substrate-ownership-vs-design-ownership.** Headline of the joint wiki entry. FR ships design templates (Layer 1); consumer team operationalizes by forking/copying into their own repo (Layer 2); running container state diverges further (Layer 3). Three drift instances materialized in this single arc: SLOT 3 added in apex's compose-yml (Layer 1↔2), env-block size drift (Layer 1↔2), GH_TOKEN in Config.Env not declared in operational compose-yml (Layer 2↔3). **FR's read-deployed-artifacts discipline reads Layer 1 only — insufficient for FR-shipped substrates consumer teams operationalize.**

[LEARNED — process, promotion-grade] **Three-layer substrate-truth discipline** (joint Brunel architectural + Hopper operator-defense). Required reads: FR design + operational copy + runtime container state. Cheap when Tier R; conclusive when authoritative; substrate-live-state beats offline inference at every layer. Companion Hopper-Amendment-4 candidate (three-layer Diagnostic Discipline added to her existing read-deployed-artifacts-before-executing section) for Celes routing next session.

[LEARNED — process, promotion-grade] **Discipline-catches-discipline-drift across THREE roles in one dispatch arc.** Operator layer (Hopper's hard-gates caught Brunel's regex/script defects at P1.1, P1.2a, P3.6, P4.05); tasker layer (Brunel's own self-corrections + recovery-pattern articulation); design layer (PO's GH_TOKEN preservation objection against Aen+Brunel's "normalization" framing). Layered discipline catches single-layer drift across all three roles in the same dispatch arc. Strengthens existing pattern beyond two-role variants.

[LEARNED — process] **Relay-fidelity-mid-conversation gap** = Stage-2 extension of `relay-to-primary-artifact-fidelity-discipline.md`. When tasker introduces a framing that contradicts prior dispatch text (or relays mid-conversation PO framing), primary-artifact check the registry/source-of-truth BEFORE propagating to downstream operator. Instances this arc: my 17:47 wrong-host propagation (PO mis-read retracted at 18:08); my 19:34 substrate-correction-normalization ratification (PO objected at 19:35). Both caught by PO at design layer; the discipline applies to tasker layer too.

[LEARNED — process] **Append-only ops-log vs working-memory scratchpad have different revert semantics by design** (Hopper's session-end articulation). Ops-log: revert via NEW entry referencing the entry to supersede; never in-place. Scratchpad: revert via direct edits to pre-amendment state + clean-up `[LEARNED]` capturing the lesson. The point of working memory is to be operationally correct NOW, not to preserve every intermediate state on disk.

[LEARNED — process] **Amendment authoring is itself a substrate-truth-anchored operation.** The substrate-of-truth is the verbatim error output. Discipline: "don't compose amendment without the actual error" (Aen 09:18 articulation; Brunel ratification). Recovery-discipline companion to Sub-shape A failure-mode catalog.

### Standing watch items going into session 35

- **Cal-Protocol-A submissions pending** — Hopper + Brunel pre-drafted two joint wiki entries in their scratchpads + Hopper-Amendment-4 candidate. Need Celes online next session for prompt-amendment ratification, Cal online for wiki authoring. Three artifacts: (a) `wiki/patterns/discriminator-anchored-on-sub-canonical-source.md` (Brunel-authored, n=4 catalog with A.1/A.2 sub-distinction); (b) `wiki/patterns/three-layer-substrate-truth-discipline.md` (joint Brunel + Hopper); (c) Hopper-Amendment-4 (three-layer Diagnostic Discipline prompt amendment, Celes-routed).
- **apex team back online post-rebuild** — they returned at ~09:30 on 2026-05-21 (PO observation). Substrate is canonical-recreate-safe; they should notice no disruption. Bidirectional cite-back from Eratosthenes still possible if apex files their own version of any of our learnings.
- **Aen amendment Part C (relay-visibility rule) — HELD** at `designs/deployed/operator-role/prompts/aeneas-amendment.md`. PO may revisit if a future incident surfaces silent-relay-scope-broadening; not actioned this session.
- **mvox-dev session 8 carry-forward** (from S33+) — Palestrina had 3 deferred items. Still dormant; surfaces if PO references mvox outcomes.
- **Manager-team / PO-team architecture** (from S33+) — Monte design surface; PO floated 2026-05-20 EOS. Not actioned this session.
- **Volta evaluates mvox-dev startup procedure** (from S33+) — Volta-routed comparison work. Not actioned this session.
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed, action Stage-2 standard moves.
- **Brunel-as-spec-author pattern n=1** (from S33+) — watch for n=2 confirmation.
- **Sub-shape F catalog candidate WITHDRAWN** — was filed mid-session as "registry-entry-choice-from-first-match" against a wrong-host claim that PO retracted at 18:08. Not a valid instance from this dispatch.

### NEXT-SESSION BOOT (re-orient instructions for S35)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces Cal-Protocol-A submission work** for the S34 learnings (most likely first ask if PO surfaces FR work next session): spawn Cal for wiki authoring + Brunel + Hopper for joint-authorship review of the three pre-drafted artifacts (see Standing watch item #1). Their scratchpads have the substantive drafts; Cal authors the canonical wiki entries from those + cross-link to ops-log-2026-05.md catalyzing-incident entries.
5. **If PO surfaces Hopper-Amendment-4 prompt amendment** (three-layer Diagnostic Discipline): spawn Celes for prompt-amendment work + Hopper + Brunel for joint-authorship review. Amendment text body is in Hopper's 19:35 message + Brunel's 19:37 elaboration from this session (cross-reference ops-log-2026-05.md for transcript).
6. **If PO surfaces apex-research bidirectional cite-back** (Eratosthenes Protocol A filing referencing our wiki post-rebuild): spawn Cal for cross-team cite-and-fold via Protocol A.
7. **If PO surfaces Aen amendment Part C revisit:** `designs/deployed/operator-role/prompts/aeneas-amendment.md` is the starting artifact. Decide land-now vs further-deliberate.
8. **If PO surfaces "design another team"** (Celes-design-discipline at n=3 from S33+): same workflow shape — brainstorm → naming proposals + structural decisions (PO pause-point) → atomic-commit drafting at `designs/new/<team>/` → TL review → deploy + mv to `designs/deployed/`.
9. **If PO surfaces manager-team / PO-team architecture** (from S33+ standing watch): Monte's domain; spawn Monte + Cal.
10. **If PO surfaces Volta evaluates mvox-dev startup** (from S33+ standing watch): spawn Volta against `~/Documents/github/.mmp/mvox_v4e_web/teams/mvox-dev/startup.md`.
11. **First operational item if Cal-spawning:** route the three S34 pre-drafted Cal-Protocol-A submissions (see Standing watch item #1). Hopper + Brunel scratchpads have the drafts; Cal authors canonical entries with cross-links.
12. **Apex team is back online as of 2026-05-21 ~09:30.** Do NOT push substrate work against apex without explicit PO sanction; the maintenance window closed at session-end of this session.

(*FR:Aen*)

---

## SESSION 33+ WRAP — 2026-05-19 → 2026-05-20 (Hopper Deployment Operator deployed; mvox-dev team registered + Pérotin promotion realized; cross-team substrate-knowledge handoff to apex unblocked S37 carry-over; agent-lifecycle no-autonomous-continuation pattern observed n=4 but framed as Windows-substrate friction per PO direction)

**Spans:** Multi-day session 2026-05-19 → 2026-05-20 (PO-driven re-engagement after Aen crash mid-window 2026-05-19). Two distinct work surfaces in one continuous session: (A) Hopper Operator role design + deploy; (B) mvox-dev clone-and-refactor health audit + Pérotin promotion finalization.

**Outcome:** Both surfaces shipped end-to-end. Hopper joined the FR roster as a navy-blue opus-4-6 Deployment Operator paired with Brunel. mvox-dev team indexed in `designs/deployed/`, audited GREEN by Medici, and Pérotin's permanent-promotion structurally realized via Celes's 5-commit fine-tune + Aen's roster-side edit. 17 commits across two repos (FR: 4 deploy-stack commits; mvox: 15 commits pushed to origin).

### Outcomes shipped — Hopper Deployment Operator

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `teams/framework-research/prompts/hopper.md` | NEW (26K, 11-slot full prompt) | Celes | committed in deploy `25094d1` (moved from staging) |
| `teams/framework-research/prompts/brunel.md` | +3 amendments | Celes designed / Aen applied | `25094d1` |
| `teams/framework-research/roster.json` | +1 member (hopper, navy, opus-4-6) | Aen | `25094d1` |
| `designs/deployed/operator-role/` | NEW deployed-reference (design-spec, first-spawn-protocol, brunel-amendments, roster-entry, aeneas-amendment HELD) | Celes / Aen | `25094d1` (moved from `designs/new/`) |
| `teams/framework-research/docs/operator-role-spec-2026-05-19.md` | NEW spec (Brunel-authored) | Brunel | committed earlier in `4a5dece` |

### Outcomes shipped — mvox-dev team registration + Pérotin promotion

| Artifact | Δ | Owner | Path / commit |
|---|---|---|---|
| `designs/deployed/mvox_v4e_web/README.md` | NEW deployment index | Aen | FR commit `300d2df` |
| Medici health audit (218 lines, GREEN) | NEW | Medici | mvox commit `d9ecdde` |
| Comenius scratchpad stub | NEW (resolved only RED finding — new member had no memory file) | Medici | mvox commit `d52cac7` |
| Finn scratchpad prune (-24 lines) | M | Medici | mvox commit `e49ced8` |
| Victoria + Comenius prompt fine-tunes (Paraglide/TBD/TDD Partners) | M (3 atomic commits) | Celes | mvox `60936ec`+`246fd06`+`1a531e2` |
| Pérotin prompt — 5-commit pass (always-on framing + standing concerns + Léonin lore reframe + 3 coordination adds + first-spawn-as-permanent reorientation) | M (5 atomic commits) | Celes | mvox `6c7b4bb`..`ed15eee` |
| Pérotin roster.json (drop spawn field + update lore.significance) | M | Aen | mvox commit `9ab6542` |
| Palestrina memory append — 3 FR-flagged deferrals (path convention, CLAUDE.md drift, polyphony-isms) | M | Aen | mvox commit `4ca000b` |
| Cosmetic markdownlint MD032 fix on perotin.md | M | (auto-formatter) | mvox commit `516e476` |

mvox-dev pushed: 16 commits to `mvox-dev/mvox_v4e_web` origin/main (range `81f7d9c..516e476`).

### Decisions (PO-ratified)

[DECISION — session 33+] **Hopper deployment operator role finalized.** Naming via Celes-first-cut S32 pattern (PO chose Hopper over Kranz / Casey Jones); structural decisions all 4 accepted (no curator companion, generic-with-examples substrate scope, no first-spawn dry-run, monthly ops-log with REQUIRED deployed-artifacts-read declaration); 5 interpretive deltas locked via Celes↔Brunel DM exchange. TL-review Q4 (Tier D vs shape-mode contract surface) ratified per Celes's option 1 (clarify on producer side).

[DECISION — session 33+] **Aen amendment (Part C, relay-visibility rule) HELD.** The `aeneas-amendment.md` file stays in the deployed package as a future-session candidate but NOT applied to `prompts/aeneas.md` this pass. PO direction.

[DECISION — session 33+] **Pérotin permanent always-on interpretation.** Convention discovered empirically: every other permanent mvox-dev member has no `"spawn"` field in roster.json; only Pérotin had `"spawn": "on-demand"`. Promotion = delete the field. Aligned roster + prompt L109 to make the promotion structurally real (not just a label).

[DECISION — session 33+] **mvox-dev is NOT FR-shipped substrate.** Indexed in `designs/deployed/mvox_v4e_web/` for visibility but flagged out-of-scope for Hopper's MAY-DO list — substrate-design ownership rule excludes clones+refactors on non-EVR github orgs. Re-evaluate only if PO migrates to an EVR-org deployment with FR substrate ownership.

[DECISION — session 33+] **vjs_apex_apps RO mechanics handed off to Schliemann.** PO reversed initial "we don't owe Schliemann, that's sorted" framing after recognizing the substrate-knowledge handoff value (apex was carrying it as a pending fix). The handoff resolved apex's S37 carry-over.

### Substantive learnings (promotion-grade candidates)

[LEARNED — substrate, promotion-grade] **Read-your-own-deployed-artifacts diagnostic discipline.** Codified in Brunel-Amendment-1. Generalizable rule: when an FR-deployed substrate shows a failure, the first action is to read `designs/deployed/<team>/container/*` — the substrate's design intent is on disk in our repo, not opaque. Treating FR-shipped substrates as opaque is the first-pass error. Catalyzed by Brunel's S33+ apex-blocker diagnosis (first-pass plausible-but-wrong; PO surfaced; re-diagnose correct via reading own entrypoint).

[LEARNED — substrate, promotion-grade] **Substrate-knowledge handoff value (cross-team).** Substrate-mechanics summary from FR to apex unblocked a pending carry-over on apex's side (S37 "Mount fix pending FR-team" → reframed as "structurally-enforced policy with canonical refresh path"). PO observation: "your reversal on 'we don't owe Schliemann' was load-bearing." Generalizable: when one team owns substrate-design and another team operates against it, periodic substrate-knowledge handoffs (even without a triggering incident) prevent the consuming team from accumulating "pending fix" entries for things that are actually deliberate policy. Promotion candidate after n=2.

[LEARNED — process, promotion-grade] **Celes design discipline n=3.** Three teams designed via the same workflow shape: esl-suvekool (S23, summer school) → esl-legal (S32, Roman jurists) → operator-role (S33+, Hopper). Workflow: PO brief → Celes brainstorm → naming proposals + structural decisions (PO pause-point) → atomic-commit drafting at `designs/new/` → TL review → deploy + `mv` to `designs/deployed/`. Promotable as the canonical team-design pattern. The 4-step "checkpoint with naming proposals + structural decisions + interpretive deltas BEFORE drafting" cadence is the load-bearing discipline; it prevents the drafting-without-alignment failure mode.

[LEARNED — process] **Per-domain opinion review n=2.** Celes-design-opinion-on-a-single-prompt is a useful intermediate artifact between audit and edit. Applied to Comenius (under-modeled, lore-to-role-fit gap surfaced) and Pérotin (promotion not folded into prompt body surfaced). The opinion shape — prose, not checklist; "strong recommendation explicit if differs from on-disk"; "what I'd change if asked to redesign" framing — produced actionable items that the surgical-edit pass alone would have missed. Promotable to a Celes-tool: "prompt-design-opinion as separate artifact from prompt-fine-tune."

[LEARNED — protocol-design] **Agent-lifecycle no-autonomous-continuation observed n=4-ish across the session.** Pattern: agent sends intro / reply / closing report → idle → does NOT process inbox until next inbound message wakes them. Specific instances this session: all 3 spawn intros (Brunel/Cal/Celes) sat unread in my inbox marked `read: true` until PO prompted "check inbox"; Celes wrote initial intro then idled without starting (a)+(b) until I sent the wake; Medici closed his work before processing Celes's scope-overlap DM; Celes idled multiple times before each turn-driven action. Workaround that worked: producer→consumer paired loops (Brunel feeding Cal one item at a time; Cal's ACKs woke Brunel for next) self-sustain; open-loop dispatches stall. PO framing 2026-05-13 (saved auto-memory `feedback_no_windows_substrate_findings.md`): "Don't characterize Claude Code messaging/inbox failures observed on Windows as framework findings — Linux is the deployment substrate." NOT pursued as a wiki finding per PO direction. Noted for protocol-design context only.

[LEARNED — substrate] **Operator-role spec authored mid-session by a substrate-engineer is a Brunel-shaped artifact.** Brunel's S33+ spec authorship (Part A operator role + Part B Brunel amendments + Part C Aen amendment) is the first instance of a non-Aen specialist authoring a multi-role spec across team-membership boundaries. Worked because Brunel was the diagnostic-discipline-keeper at the moment the gap surfaced; the spec encoded the gap's resolution from the diagnostic-keeper's vantage. Generalizable: substrate-engineers authoring cross-team specs is a viable pattern when the gap is substrate-shaped.

[LEARNED — process] **Promotion-as-label vs promotion-as-structural-change.** Pérotin's case made this concrete: the L134 footer added the "permanent data-manager" label without folding the implications into the prompt body. L109 still said "spawned on-demand; may not be spawned at all"; roster.json still had `spawn: on-demand`. Without Celes's design-opinion catching this, the promotion would have stayed cosmetic — a label without behavior. Generalizable: when promoting an agent's role, run a "promotion fit" pass on prompt body + roster + lore.significance + any cross-references in other prompts. The fold-the-implications pass is what makes the promotion real.

[LEARNED — process] **Race condition between dispatch and correction — agents respect retroactive correction.** Celes started writing the Comenius opinion at 13:23, my "actually Pérotin" correction reached her inbox at 13:24, she sent the Comenius opinion at 13:25 and idled. On next wake she processed the correction and wrote the Pérotin opinion at 13:29. Both artifacts shipped clean. The Comenius opinion was substantive enough to be its own surface (PO acted on it). Workaround: when correcting a dispatch, don't assume the wrong-target work is lost — it may complete in parallel and remain useful.

### Cal queue additions from session 33+ (Cal already filed during her batch close)

Cal closed her 7-item Brunel queue cleanly. Wiki entries filed (untracked → tracked during S4 commit):

- `wiki/patterns/agenttype-vs-backendtype-separation.md`
- `wiki/patterns/cross-host-atomic-inbox-write-primitive.md`
- `wiki/patterns/decorative-polling-interval-anti-pattern.md`
- `wiki/patterns/per-message-color-overrides-registered-default.md`
- `wiki/patterns/read-flag-replication-discipline-for-external-cli.md`
- `wiki/patterns/taskget-before-classify-as-noise.md`
- `wiki/references/inbox-slot-vs-members-validation-asymmetry.md`

Plus amendments to existing entries: `ghost-member-as-universal-integration-surface.md`, `inbox-file-write-as-wake-mechanism.md`, `members-array-edit-honored-mid-session.md`, `wiki/index.md`.

Wiki count: 93 → 100 (7 new) + 3 amended + 1 index update.

### Standing watch items going into session 34+

- **Hopper's first dispatch** — will create `teams/framework-research/docs/operations-log-2026-05.md`. Watch for the first deployed-artifacts-read declaration in the log; it's the audit surface for repeat-of-Discovery-2 anti-pattern.
- **mvox-dev session 8 handoff** — Palestrina has 3 deferred items in his NEXT-SESSION carry-forward (path convention, CLAUDE.md drift, polyphony-isms). PO may surface mvox outcomes from session 8 next time we engage; absorb learnings.
- **Aen amendment Part C (relay-visibility rule) — HELD, candidate for future session.** Staged at `designs/deployed/operator-role/prompts/aeneas-amendment.md`. PO may revisit if a future incident surfaces silent-relay-scope-broadening.
- **apex-research bidirectional cite-back** — Schliemann routed the vjs_apex_apps substrate-knowledge to Champollion → likely Eratosthenes Protocol A submission with bidirectional cite-link back to our `wiki/patterns/substrate-invariant-mismatch.md`. If apex files, Cal may need to add a cite-back amendment on our side.
- **Comenius prompt overhaul (mvox)** — Celes's opinion surfaced load-bearing recommendations (escalation subsection, *Didactica Magna* lore reframe, Sonnet-vs-Opus tier question, active-pushback framing). Not actioned this session (Pérotin was the priority). Possible mvox-side surface for a future session if PO wants the Comenius investment.
- **Brunel-as-spec-author pattern n=1** — first instance of a non-Aen specialist authoring a multi-role spec. Watch for n=2 to confirm this is a viable cross-team pattern.
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed, action Stage-2 standard moves (carry-forward from S32).

### NEXT-SESSION BOOT (re-orient instructions for S34+)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Consider also pulling `mitselek/esl-legal` and/or `mvox-dev/mvox_v4e_web`** if PO references session-N work from those repos.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces Hopper's first dispatch:** spawn Brunel (diagnostic step) + Hopper (execution) per the Brunel-amendment-3 dispatch-package shape. If the ask is simple (e.g., "restart apex"), Aen can route Hopper solo per the "pair-as-unit is the common case, not the only case" framing. Watch for the first `operations-log-2026-05.md` entry to land.
6. **If PO surfaces mvox-dev session 8 outcomes:** Palestrina has 3 deferred items + likely his own learnings. Receive via PO; possibly spawn Celes for any prompt-side fold (Comenius overhaul candidate) or Medici for any memory-audit fold.
7. **If PO surfaces apex-research bidirectional cite-back** (Eratosthenes filing references our wiki): spawn Cal for cross-team cite-and-fold via Protocol A. Brunel-side substrate-engineer involvement only if substrate-claim needs verification.
8. **If PO surfaces Aen amendment (Part C relay-visibility) revisit:** `designs/deployed/operator-role/prompts/aeneas-amendment.md` is the starting artifact. Decide land-now vs further-deliberate.
9. **First operational item if Cal-spawning:** her S33+ close was clean (7-item queue + amendments + index). Surface-grade work: receive any Brunel/Hopper Protocol A submissions from the first Hopper-dispatch cycle; field any apex-research bidirectional cite-and-fold.
10. **If PO surfaces "design another team":** Celes-design-discipline n=3 holds. Same workflow shape: brainstorm → naming proposals + structural decisions (PO pause-point) → atomic-commit drafting at `designs/new/<team>/` → TL review → deploy + `mv` to `designs/deployed/`. The per-team opinion-as-intermediate-artifact (Comenius/Pérotin pattern) is now n=2 — usable when Celes is given a prompt to review without an immediate edit dispatch.
11. **If PO surfaces "manager-team / PO-team architecture":** PO floated this 2026-05-20 EOS with the framing *"I'm messing with too many teams in parallel; I feel I should soon create a dedicated team of PO's to manage all my teams."* Maps cleanly onto Monte's domain — governance architecture, separation of powers, manager-agent boundaries, delegation matrices, authority drift at scale. Spawn Monte for the design surface; Cal for accumulated wiki on team-taxonomy + service-team topology that this composes against. Brunel + Volta likely downstream once envelope shapes settle (substrate + lifecycle). This is the fatigue-as-observation design-pressure signal — when the PO role itself becomes the bottleneck, the framework needs to grow up.
12. **If PO surfaces "Volta evaluates mvox-dev's startup procedure":** PO observation 2026-05-20 EOS — last night's mvox-dev session "redesigned a startup procedure" worth comparing against FR's own. Spawn Volta to read `~/Documents/github/.mmp/mvox_v4e_web/teams/mvox-dev/startup.md` against `teams/framework-research/startup.md`, identify innovations, and propose any adoption candidates. Medici's S33+ audit already flagged mvox-dev's startup as "three-state probe is sound and mirrors FR's own discipline" — but innovations beyond mirroring are the surface PO wants evaluated. Output: comparison doc + adoption-recommendations, route to Aen for ratification.

(*FR:Aen*)

---

## SESSION 32 WRAP — 2026-05-13 (esl-legal team designed + deployed; Roman-jurist roster; long-lived per-domain archetype confirmed; brief-scope-conflation failure mode surfaced)

**Goal (PO-set 10:18):** Wake the team for "another exciting teambuilding effort" — design a new team to support ESL through an active EE/EU copyright dispute (Peterson / SP Muusikaprojekt, Lihula T0 = 2026-05-23). PO scope clarification at 11:04: *"I see this team as long-living support unit and Peterson is just the case nr.1"* — corrected initial misread of brief as 10-day one-shot.

**Outcome:** Team designed, reviewed, corrected, deployed. Commit `06b7699` to `mitselek/esl-legal` (private) — 16 files / 1761 insertions including `.claude/startup.md` bootstrap hook + workdir `README.md` + case-1 seed. PO can activate by opening Claude at `~/Documents/github/ESL/legal/`.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `mitselek/esl-legal` initial deploy | NEW (commit `06b7699`, 16 files / 1761 ins) | Aen | https://github.com/mitselek/esl-legal |
| 11-file team package (8 design + 3 scripts) | NEW | Celes | `designs/deployed/esl-legal/` (moved from `designs/new/` post-deploy) |
| `.claude/startup.md` bootstrap hook + workdir `README.md` + case-1 README seed | NEW | Aen | `~/Documents/github/ESL/legal/` |
| Inbox-persistence scripts adopted from FR (`persist-inboxes.sh` / `restore-inboxes.sh` / `restore-filter.jq`) | NEW | Celes (adapted from Volta) | `esl-legal/` repo root |

### Architecture decision

[DECISION — session 32] **esl-legal team architecture: 6-character Roman-jurist roster, Option B asymmetric workload, MUST-address adversary-flag protocol.**

- **Papinianus** ("Papi") — TL, coordinator + synthesis vote + flag-audit discipline-keeper
- **Paulus** — EE-jurist, hot path, 5/7 questions (Q1, Q3-EE, Q4, Q5, Q6, Q7)
- **Ulpianus** — EU/CJEU-jurist (Q2 + Q3-EU + cross-checks on Q5/Q7)
- **Modestinus** — Editor (memo + risk-matrix + jurist-Qs + bibliography + adversary-flag resolution)
- **Gaius** — Librarian + cross-case wiki sole writer
- **Cicero** — Adversary (independent reviewer, veto-weight, NOT TL-routed)

All `claude-opus-4-7[1m]`. Naming source: *Lex Citationis* of 426 CE for the five named jurists + Cicero (in-utramque-partem method) for adversary.

### Workflow shape (reusable, n=2 with S23)

PO intent → Aen brainstorm work-types → spawn Celes for opinion → Celes Brilliant query for substrate → architecture options + naming + PO 4 decisions → Celes drafts package staged at FR repo root (`designs/new/<team>/`) → Aen TL review → corrections → spot-check → PO approval → Aen deploys → mv to `designs/deployed/`.

This session's review surface: 2 blockers + 3 nice-to-haves (mcp__teamwork__ tool-prefix → bare tool names; Gaius's wiki-pulse needed Bash for git log; runtime-side inbox backup → FR Volta repo-side pattern; common-prompt case-bound brief path → case-agnostic; Q3 file-split alignment across design-spec + both prompts). Celes applied all 5 in one pass; spot-check confirmed.

### Mid-session correction — substrate-grade

[LEARNED — substrate, promotion-grade] **Brief-scope-conflation failure mode.** Initial reading of Tobi's brief framed the team as a 10-day one-shot dissolution archetype (memo delivery = team end). PO corrected at 11:04: *"long-living support unit, Peterson is just case nr.1."* Source of misread: brief §1+§3+§9 scope the *deliverable* around Peterson; my first-pass work-type sketch ("TL + 4 specialists + adversary for Q1-Q7 scan + memo") inherited that scoping and biased Celes's archetype call. **Lesson:** when a brief is task-scoped, distinguish "this case's scope spec" from "this team's scope spec" *before* assigning archetype. The deliverable's lifetime is not the team's lifetime.

Cal-queue candidate (n=1 watch).

### Substantive design innovations (first-of-its-kind in our corpus)

[LEARNED — substrate, promotion-grade] **Long-lived per-domain research support unit** — third archetype confirmed in our corpus. Differentiators: (a) NOT event-driven like operational (esl-suvekool); (b) NOT ongoing-build like methodology-research (FR/apex-research); (c) case-driven activation with domain-specific knowledge accumulation across cases. Repo structure with `cases/<slug>/` + `wiki/<category>/` from day 1. n=1 watch. Promotion trigger: a second similar team requesting same shape.

[LEARNED — substrate, promotion-grade] **Dedicated adversary role with veto-weight asymmetry** — first-of-its-kind. Cicero is structurally independent (NOT TL-routed); writes `[ADVERSARY-FLAG]` on settled-confidence claims; Modestinus MUST address each in writing before T-2 (fold or rebut, never silently dismiss). Papinianus runs flag audit at T-3 as discipline-keeper. Modestinus + Cicero share `adversary-flags.md` (controlled write-collision; Papi mediates first round). Cicero psychology framing in his prompt: *"You are NOT a member of the prosecution; you are the team's voice for what the prosecution would say if it had Cicero arguing for it."* n=1 watch.

[LEARNED — substrate] **Naming-heuristic inversion** (Celes's framing). When the team's domain has a directly-named tradition the team operates within (legal-research → Roman jurists), prefer that tradition over language-tiebreak naming. Inverse of esl-suvekool's "language-of-operational-context" rule. Two situational heuristics, not one universal.

[LEARNED — substrate] **Roman-jurist roster as structurally-legible naming choice.** *Lex Citationis* assigned each named jurist a distinguishable disposition: Papinianus = synthesis vote (deciding vote when others disagreed), Paulus = doctrinal trenches (most-cited in the Digest), Ulpianus = framework architecture (Edict commentary), Modestinus = distilled digest (*Pandectae*/*Regulae*), Gaius = institutional structure (*Institutiones*). The historical role-dispositions map onto team-role specializations almost 1:1. Naming with a structurally-named tradition compounds.

### Process learnings

[LEARNED — process] **2-blocker + 3-NTH TL review pattern is the right calibration.** Surfaced 2 critical bugs that would have broken first session (mcp__teamwork__ prefix; Gaius missing Bash for git log) AND 3 structural improvements (repo-side inbox persistence; common-prompt case-bound brief path; Q3 file-split alignment). Same shape as S23 review on esl-suvekool. Promotable as TL-review-pattern.

[LEARNED — process] **PO's "let Celes propose first" instruction on naming was correct.** Aen had a Roman-jurist fallback but PO wanted Celes's first cut. Celes converged on the same convention with deeper rationale (Lex Citationis structural fit, in-utramque-partem for adversary). When PO defers to a specialist for first-cut judgment, the specialist often improves on the fallback. Hold fallbacks in reserve; don't impose them preemptively.

[LEARNED — process] **Workflow pattern S23 → S32 holds verbatim** (esl-suvekool + esl-legal). n=2. Promotable as the team-design pattern.

### Cal queue additions from session 32 (5 new + 7 carried from S31)

Session 32 new (all n=1 watch):
1. **Long-lived per-domain research support unit** archetype
2. **Dedicated adversary role with veto-weight asymmetry** (in-utramque-partem dedicated specialist, MUST-address-in-writing protocol, structurally independent reviewer NOT TL-routed)
3. **Naming-heuristic inversion** — domain-named-tradition over language-tiebreak when domain has one
4. **Brief-scope-conflation failure mode** — deliverable-scope vs team-lifespan distinction
5. **Roman-jurist roster as structurally-legible naming choice** — historical role-disposition maps 1:1 onto team-role specialization
6. **Team-design workflow pattern S23→S32** — promotable at n=2 (sixth candidate, also from this session)

Carried from S31 (Brunel's parked queue, 7 items): SF-1, SF-2, SF-3, SF-4 (RFC #66 sub-findings), read-flag-replication external-CLI discipline, TaskGet-before-classify-as-noise procedural pattern, decorative-polling-interval anti-pattern.

### Standing watch items going into session 33

- **esl-legal session 1 outcomes** — did Papinianus bootstrap cleanly via `.claude/startup.md`? Did inbox-persist scripts work? Did Cicero's structural independence work in practice? Did Modestinus+Cicero shared-file first-round avoid write-collision? PO will tell us; do not poll.
- **MCP availability at esl-legal session start** — Gmail MCP + Brilliant MCP must be configured for the fresh Claude session at `~/Documents/github/ESL/legal/`. Gaius hard-fails without both. PO should confirm before Papi spawns Gaius.
- **Wiki growth-path watch** — Phase-2 gate at 15 statute-cards + 10 cross-case queries OR n=2 concurrent cases triggers Cal-style curator split proposal.
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed, action Stage-2 standard moves
- **Brunel's 7-item Cal Protocol A queue dispatch** (carried from S31) — parked at Brunel's side; lands on his next spawn
- **RFC #66 discussion author response** (carried from S31) — comment posted; watch for engagement
- **apex-research Eratosthenes contact** (carried from S31) — dormant from FR's view
- **`repo-as-durable-store-teamdelete-as-release-primitive.md` n=2 watch** (carried from S28)
- **`cross-document-prose-procedure-drift.md` n=2 watch** (carried)
- **Companion-Pair Submission n=3+ FR-instance watch** (carried from S30)
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **apex-research federation invocation** — first non-FR-non-apex team adopting federation-bootstrap-template
- **Library-team architecture design** (carried from S31) — major downstream surface from RFC #66 substrate validation; touches Cal + Herald + Monte; Brunel + Volta downstream

### NEXT-SESSION BOOT (re-orient instructions for S33)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek/ai-teams` repo** for any external scratchpad updates.
3. **Consider also pulling `mitselek/esl-legal`** if PO references session-1 work from there.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces esl-legal session-1 feedback loop:** absorb any Papinianus-side [LEARNED] worth promoting upstream (similar to esl-suvekool S23→S26 fold). Possibly spawn Celes to revise prompts if a structural issue surfaced.
6. **If PO surfaces library-team architecture design** (carried from S31 NEXT-SESSION BOOT §4): start with Cal first (master-librarian role + Protocol A/B/C generalization), then parallel Herald (envelope shapes) + Monte (service-team one-sided ACL + authority). Brunel/Volta downstream.
7. **If PO surfaces Brunel-respawn:** 7-item Cal Protocol A queue parked at Brunel's side (carried from S31).
8. **If PO surfaces apex-research follow-up:** Schliemann engaged via ghost-chat channel; user has direct comm.
9. **First operational item if Cal-spawning:** route the 6 new wiki candidates from S32 via Protocol A, alongside any Brunel-queue items if he's spawned same window.

(*FR:Aen*)

---

## SESSION 31 WRAP — 2026-05-12 (RFC #66 substrate gate cleared cross-host; architecture decision + reference implementation shipped; PO reframe on Windows-substrate findings)

**Goal (PO-set 13:48):** Evaluate RFC #66 (Ghost-Member Pattern, posted 2026-05-09 by PO) against existing FR artifacts. Mid-session pivoted to verify-on-substrate-before-design via cross-host PoC.

**Outcome:** RFC #66 substrate gate cleared empirically (Windows-local-dev ↔ apex-research-on-Linux). Architecture decision settled (Reading 1: per-team Callimachi stay; messenger-ghost mechanism; new central library team as future design surface). PoC reference implementation shipped to FR repo. Wiki 86 → 89. RFC #66 discussion commented with empirical results. 7-item Cal Protocol A queue parked at Brunel's side for next session dispatch.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `wiki/references/inbox-file-write-as-wake-mechanism.md` | NEW (86→87, architectural-fact) | Cal | substrate property RFC #66 Finding 2 articulates |
| `wiki/patterns/service-team-topology.md` | NEW (87→88) | Cal | library-as-service-team architectural pattern (per #47 OQ-fold) |
| `wiki/patterns/ghost-member-as-universal-integration-surface.md` | NEW (88→89) | Cal | ghost-member as universal integration seam |
| Amendments to `substrate-invariant-mismatch`, `worktree-spawn-asymmetry`, `inbox-drained-on-spawn-clear`, `wiki/index.md` | +N | Cal | cross-link maintenance |
| `teams/framework-research/poc/ghost-member-cli/{ghost-chat.py, ghost-chat.ps1.deprecated, README.md}` | NEW | user impl. / Brunel coord. / coding-subagent QoL | sketch-grade reference implementation |
| Commit `4f48973` + RFC #66 discussion comment | shipped | Aen | https://github.com/mitselek/ai-teams/discussions/66#discussioncomment-16893428 |
| Brunel scratchpad +102 lines (S31 + provenance corrections) | +102 | Brunel | `memory/brunel.md` |
| Cal scratchpad +46 lines (S31 block) | +46 | Cal | `memory/callimachus.md` |

### Architecture decision settled

[DECISION — session 31] **Reading 1 (per-team Callimachi stay) + messenger-ghost mechanism + new central library team as design surface.** PO direction 14:50: *"Per-team librarian stays, every team librarian has personal 'messenger ghost representative' at central library. We will design a specific library team for central library curation."* Library-as-service-team topology per Cal's new wiki entries — answers #47 OQ1/OQ2/OQ3/OQ5/OQ7/OQ8 with named structural moves. OQ4 (wiki/scratchpad boundary at within-team layer) and OQ6 (token cost tiering) remain open from #47.

### Substrate gate cleared — F1/F2/F3 + 4 sub-findings

Verified cross-host on Windows-local-dev ↔ apex-research-on-Linux-container via SSH (Cloudflare Tunnel). Two independent implementations (PowerShell sketch → Python rewrite) both confirm the substrate-properties. Outbound ssh-write latency 657-854ms; end-to-end dominated by recipient compose-time, not substrate cost. Substrate-property reference filed at `wiki/references/inbox-file-write-as-wake-mechanism.md`.

**Sub-findings** (beyond RFC's empirical claims):
- **SF-1:** Inbox-slot acceptance is decoupled from `members[]` validation (one-sided-ACL property)
- **SF-2:** `agentType` vs `backendType` separation is a richer registration shape than RFC's `agentType: ghost` example
- **SF-3:** Per-message `color` field overrides registered-member color (apex display contract)
- **SF-4:** Single-ssh + python + `fcntl.flock` is a clean cross-host atomic-write primitive

**External-CLI substrate contract** worth making explicit: external members must replicate harness-side `read: true` marking after processing inbox entries; otherwise BACKLOG-loops on every launch. Closed by-design in Python via `fetch-and-mark-read` primitive (single ssh round-trip that under flock fetches `read:false` entries AND flips their flag).

### LEARNED — session 31

- **Verify-on-substrate-before-design discipline validated empirically.** The PO-directed pivot at 15:05 ("verify RFC #66 substrate via cross-host PoC before designing library team") caught issues paper-design would have missed (SF-1 inbox/members[] asymmetry, SF-3 color-override, Windows-substrate quirks). Reusable: for any architecture decision resting on an empirical substrate claim, run a PoC first.
- **Cross-implementation verification strengthens substrate-claim generalization.** PowerShell + Python independently confirming SF-1 through SF-4 moves the finding from "single-client-shows-X" to "substrate-property-of-deployment-harness-is-X." Reusable discipline: when one PoC validates a remote-substrate claim, port to a second language to confirm.
- **Ship-substrate-research-outcome-before-debug-churn structural move** (Brunel's S31 16:48 [LEARNED]): substrate-research outcome locks in regardless of artifact-polish; ship report immediately, decouple from rewrite churn. Without it, polish-bug-debugging buries the substrate finding behind cycles of CLI iteration.
- **Team-lead Stage-1-fold-without-primary-artifact drift, n=2 same session.** Aen attempted "n=3 spawn-drain" then "mid-session SendMessage drain" framings without disk-check; Brunel retracted both correctly. Relay-to-primary-artifact-fidelity-discipline Stage-1 anti-pattern applies to team-lead too. n=4 in this session counting Brunel's parallel instance. Parked in Brunel's Cal queue (item 6).
- **PO directive on Windows-substrate framing (16:42):** Don't characterize Claude Code messaging/inbox failures observed on Windows as framework findings — Windows file-semantics aren't the deployment substrate; Linux/Ubuntu is. Saved to project auto-memory at `feedback_no_windows_substrate_findings.md`. Applied retroactively to drop several would-be Cal-queue items from S31.
- **User-implements-while-agent-coordinates pattern.** User shipped both PowerShell PoC artifact AND Python rewrite directly. Brunel's role-of-record corrected mid-session: containerization-substrate-coordinator + verification-discipline-keeper, NOT implementer. Pattern: when user wants code shipped fast, agents coordinate/diagnose/curate.
- **Coding subagent delegation pattern.** Iteration-2 QoL feature delegated to one-shot general-purpose coding subagent (non-team): ~108s for feature, ~35s for bug fix. Pattern: substrate-validation team work uses FR specialists; artifact-implementation polish uses one-shot coding agents.

### NEXT-SESSION BOOT (re-orient instructions for S32)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces library-team architecture design** (central library team is the downstream-of-PoC work surface, this is the major next move): start with **Cal** (master-librarian role + Protocol A/B/C generalization across ghost-pair + library's own internal wiki sovereignty); then parallel **Herald** (ghost-pair envelope shapes + transport-plugin contract; T03 §Protocol 4 reframe candidate) + **Monte** (service-team one-sided ACL + authority structure across N consumers). **Brunel** and **Volta** are downstream of envelope-shape settlement; do NOT pre-spawn them.
5. **If PO surfaces Brunel-respawn:** he carries a **7-item Cal Protocol A queue** ready to dispatch immediately (SF-1, SF-2, SF-3, SF-4, read-flag-replication external-CLI discipline, TaskGet-before-classify-as-noise procedural pattern, decorative-polling-interval anti-pattern). First operational item: dispatch queue to Cal. Also: Brunel-spawn now ALWAYS triggers Q "analyst/coordinator or implementer?" — default coordinator/analyst unless PO explicitly asks for code.
6. **If PO surfaces continued ghost-chat PoC iteration** (QoL features, MCP escalation per RFC #66 Step 2, or bug iteration): delegate to **coding subagent (general-purpose, non-team)**, NOT Brunel. Path established this session.
7. **If PO surfaces apex-research follow-up:** Schliemann (apex team-lead) is engaged via the ghost-chat channel; user has direct comm. Eratosthenes (apex's librarian) was idle this session — not yet contacted with the PoC story. Cross-team wiki cite-and-fold may surface if apex files their own version (Schliemann asked user 15:39 whether to file as apex wiki pattern; user-deferred).
8. **If PO surfaces RFC #66 discussion engagement:** comment posted (discussioncomment-16893428). If RFC author replies, action depends on shape — substrate findings reception, design feedback, or v2 invitation. Surface for routing.
9. **If PO surfaces n=4-in-one-session relay-fidelity observation:** parked in Brunel's Cal queue (item 6) — lands naturally via Brunel's dispatch; no separate action needed at session start.
10. **First operational item if Cal-spawning:** her S31 close is clean. Surface-grade work would be: (a) receiving Brunel's queued items if Brunel is spawned same window; (b) library-team master-librarian role drafting if PO surfaces architecture work.

### Standing watch items going into session 32

- **Library-team architecture design** — major downstream work surface from this session's substrate validation. Touches 4-5 specialists (Cal-led; Herald, Monte for protocols/governance; Brunel, Volta downstream).
- **Brunel's 7-item Cal Protocol A queue dispatch** — parked at Brunel's side; lands on his next spawn.
- **RFC #66 discussion author response** — comment posted; watch for engagement. PO has the live channel.
- **apex-research Eratosthenes contact** — apex's librarian dormant from FR's view; may surface when Schliemann decides on apex-side filing.
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed, action Stage-2 standard moves
- **`repo-as-durable-store-teamdelete-as-release-primitive.md` n=2 watch** (Volta-filed S28) — cross-platform generalization confirmation point
- **`cross-document-prose-procedure-drift.md` n=2 watch** — second incident triggers Volta's Protocol C consideration
- **Companion-Pair Submission n=3+ FR-instance watch** — third FR instance prompts Protocol C consideration
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **apex-research federation invocation** — per S30 re-characterization: convention re-test point shifts to first non-FR-non-apex team adopting federation-bootstrap-template

(*FR:Aen*)

---

## SESSION 30 WRAP — 2026-05-07 (Monte FLAG resolution + Cal AMENDMENT processing + apex-research Protocol C cross-pollination + n=2 substrate gotcha activation)

**Goal (PO-set):** Resume Monte FLAG resolution per S29 NEXT-SESSION-BOOT step 4; glance at apex-research progress per S29 standing watch on n=2 federation invocation.

**Outcome:** Three independent loops closed cleanly. Wiki 85 → 86 (+1 new entry, 4 amendments). n=2 substrate gotcha activated. apex-research standing watch re-characterized.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `recursive-citation-as-canonical-validation.md` FLAGs closed | +22/-3 (verified-as-written via Stage 2 author-scratchpad fold; confidence medium → high) | Cal (Monte-AMENDMENT) | `wiki/patterns/` |
| `relay-to-primary-artifact-fidelity-discipline.md` Instance 5 fold | +41/-7 (cross-class sibling to Instance 4: Cal Stage 1 honest-FLAG + Monte Stage 2 author-scratchpad fold; header-stale n=4 collateral catch on Instance 4 corrected) | Cal | `wiki/patterns/` |
| `inbox-drained-on-spawn-clear-without-deliver.md` n=2 amendment | +15/-1 (architectural-fact convention: append `instances:` list, no sub-shape claim, recovery primitive note) | Cal | `wiki/gotchas/` |
| `wiki/process/companion-pair-submission-protocol.md` (NEW) | NEW (85→86) | Cal (apex-research-sourced; cross-team `source-team: apex-research` attribution) | `wiki/process/` |
| `wiki/index.md` updated for both new and amended entries | +5/-2 | Cal | `wiki/` |
| Monte scratchpad +10 lines (S29-update for FLAG resolution outcome) | +10 | Monte | `memory/montesquieu.md` |
| Cal scratchpad +43 lines (S30 block) | +43 | Cal | `memory/callimachus.md` |

### LEARNED — session 30

- **Recovery primitive for drain-on-spawn-clear is now n=2-proven.** Aen spawn-prompt relay-fold + author-scratchpad Stage 2 fold worked cleanly across both observed instances (S29 Monte→Cal 12:30 dispatch; S30 Monte→Cal 17:37 dispatch). Stage 1+Stage 2 lifecycle holds across substrate-loss instances; the discipline is no longer just theoretical. Folded into gotcha entry as one-line workaround note.
- **Architectural-fact convention from S29 held under stress.** Cal initially proposed a sub-shape extension on the n=2 sighting ("drain-at-spawn-clear regardless of dispatch-timing-relative-to-recipient-lifecycle"). On evaluation: that's a *sharpening of the original framing's generality*, not a new sub-shape — both observed instances are pre-spawn-dispatch, post-spawn case is hypothetical. Architectural-fact convention prescribes minimal amendment (append `instances:`, no sub-shape claim) and Cal applied it cleanly. Discipline catches discipline drift.
- **Convention diffusion happens without federation infrastructure.** apex-research adopted FR's dual-hub-routing pattern (Eratosthenes mirrors Cal's role; Protocol A/B mirror FR's shapes; routing table line-for-line) as a *governance pattern* for single-team operation, separate from federation-bootstrap-template. Knowledge-hub-as-team-role is more general than knowledge-hub-as-federation-curator. Worth noting as framework finding — federation-only is too narrow a frame for the dual-hub convention.
- **Cross-team protocol cross-pollination at n=2 cumulative is filing-grade without promotion.** apex-research's Companion-Pair Submission protocol filed as `wiki/process/companion-pair-submission-protocol.md` with `source-team: apex-research` attribution. n=2 latent FR instances (status/companion-artifact axis: teamcreate-leadership-survives-clear ↔ repo-as-durable-store-teamdelete; mechanism/UI-trap axis: tmux-pane-border-format ↔ tmux-pane-labels-decoupled). Naming-collision resolution: descriptive name "Companion-Pair Submission" used to avoid Protocol-C letter-slot collision with FR's knowledge-promotion protocol — wiki-process placement is sufficient at n=2 cross-team discovery (no common-prompt promotion).
- **Skill-side substrate-invariant-mismatch sub-shape candidate (S30 self-spotted at shutdown).** `framework-research-next-session` skill's CWD-as-context-signal invariant assumes single-repo session navigation. Failed at Step 0 because session legitimately touched apex-migration-research repo (refresh + `cd`); CWD drifted. Recovery is one-command (`cd` back), but the skill prescribes "stop immediately" — substrate-invariant-mismatch sub-shape: *a procedural guard whose invariant is a *narrower* version of the actual session-context*. Worth Cal evaluation next session for whether this fold-able into existing `substrate-invariant-mismatch.md` n=6 (Instances 1+6 are path-as-substrate-invariant) or warrants a new instance.

### Standing watch update — apex-research n=2 invocation re-characterized

S29 standing watch line: "apex-research n=2 invocation — first deployment of #1 v0.7 federation-bootstrap-template beyond FR; convention re-test point."

S30 finding: **apex-research is NOT on a federation trajectory.** They run single-team with directory-ownership governance. Zero federation-bootstrap signals (no path-namespace, no CuratorAuthority, no WriteAccept/WriteRejection, no registry, no admission control). The convention re-test point would have to come from a different second team, OR apex-research re-scoping to federate.

Cross-team interface to FR is dormant (one thin reference: "Quality audits performed by framework-research Medici remotely" — Medici hasn't been spawned in any FR session per logs). Worth re-characterizing the standing watch.

### NEXT-SESSION BOOT (re-orient instructions for S31)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces apex-research follow-up** (e.g., "did anything else happen on their side?", or asks about Companion-Pair Submission protocol): consider spawning Cal for either (a) querying apex-research's wiki state for additional cross-pollination candidates, or (b) cross-evaluating FR's existing wiki against apex-research's exclusion sub-shapes (privilege-trap cluster, shared-infrastructure-pair) for additional latent matches. Apex-research source path: `C:/Users/mihkel.putrinsh/Documents/github/apex-migration-research/teams/apex-research/common-prompt.md`.
5. **If PO surfaces skill substrate-invariant-mismatch finding** (S30 LEARNED above): spawn Cal to evaluate whether the skill CWD-check failure-mode folds into existing `substrate-invariant-mismatch.md` n=6 (Instance 1 + Instance 6 are both path-as-substrate-invariant at different layers), or warrants a new instance. Decision matrix: if same-root-cause-different-layer holds, fold; if structurally distinct mechanism, file new instance.
6. **If PO surfaces Volta-related work** (T06 amendments, lifecycle scripts, harness substrate fixes): spawn Volta. Pending from S28: all NEXT-SESSION-CHOREs cleared, but n=2 watch on `cross-document-prose-procedure-drift.md` may still activate per his amendment-path note.
7. **If PO surfaces Brunel-related work** (federation expansion, container lifecycle, worktree-asymmetry review): spawn Brunel.
8. **If PO surfaces Monte-related work**: Monte's S30 close was clean (FLAG resolution complete; Instance 5 candidacy promoted to confirmed via Cal's fold). His next surface-grade work item is Volta-style — open queue.
9. **First operational item if Cal-spawning:** her S30 close was clean (86 wiki entries; substrate gotcha at n=2 with minimal-amendment posture; companion-pair protocol filed; no FLAG annotations; no TTL imminent). Surface-grade work would be receiving any new Protocol A submissions from spawned specialists, or evaluating the skill substrate-invariant-mismatch finding per item 5 above.

### Standing watch items going into session 31

- **Skill CWD-check substrate-invariant-mismatch sub-shape evaluation** (NEW S30) — fold-or-new decision deferred to Cal next session
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2 standard moves
- **apex-research n=2 invocation** — RE-CHARACTERIZED S30: not on federation trajectory; convention re-test point shifts to first non-FR-non-apex team that adopts federation-bootstrap-template, OR apex-research re-scoping (no signal of either)
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **`repo-as-durable-store-teamdelete-as-release-primitive.md` n=2 watch** (Volta-filed S28) — second team-lifecycle protocol on different platform = cross-platform generalization confirmation point
- **`cross-document-prose-procedure-drift.md` n=2 watch** — second incident triggers Volta's Protocol C consideration per his S28 amendment-path note
- **Companion-Pair Submission n=3+ FR instance watch** — third FR companion-pair instance would prompt Protocol C consideration (common-prompt promotion with naming-collision resolution); wiki-process placement is sufficient at n=2 cross-team discovery

(*FR:Aen*)

---

## SESSION 29 WRAP — 2026-05-07 (sequential queue-flush: Brunel + Monte + Cal; T06 stale-prose closed; new substrate sub-shape filed)

**Goal (PO-set):** "Just keep them busy" — sequential wake/work/shutdown for Brunel, Monte, Cal. No new feature direction; pure queue-flush.

**Outcome:** All three queues flushed end-to-end. Wiki 82 → 85. T06 stale-prose closed. New substrate failure mode surfaced and filed.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| T06 stale-prose fix (lines 1135 + 1182 "Phase 2.0a" → new anchors) | +2/-2 | Brunel | `topics/06-lifecycle.md` |
| Wiki accuracy review on `worktree-spawn-asymmetry-message-delivery.md` | confirmed accurate, no amendments | Brunel | `wiki/patterns/` |
| Wiki entry `single-channel-saturation-via-mode-partition.md` (B.1) | NEW (82→83) | Cal (Monte-source) | `wiki/patterns/` |
| Wiki entry `recursive-citation-as-canonical-validation.md` (B.2) | NEW (83→84, joint-source monte+callimachus) | Cal (Monte-source + Cal co-framing) | `wiki/patterns/` |
| Wiki entry `inbox-drained-on-spawn-clear-without-deliver.md` (substrate gotcha) | NEW (84→85) | Cal (team-lead+callimachus joint-source) | `wiki/gotchas/` |
| Cross-ref amendment on `worktree-spawn-asymmetry-message-delivery.md` (sibling sub-shape link) | +1 | Cal | `wiki/patterns/` |
| T04 §Row 2 awareness check | ACK-as-written, no refinement needed | Monte | `topics/04-hierarchy-governance.md` |
| Brunel scratchpad pruned 134 → 120 | -14 lines net (compressed S26 + S27 blocks) | Brunel | `memory/brunel.md` |
| Cal scratchpad pruned 130 → 46 | -84 lines net (consolidated S26-28 detail) | Cal | `memory/callimachus.md` |
| Monte scratchpad +18 lines (S29 block added) | +18 | Monte | `memory/montesquieu.md` |

### Substrate event — new sub-shape characterized

[DECISION — session 29] **New gotcha `inbox-drained-on-spawn-clear-without-deliver.md` filed n=1 architectural-fact** with TTL 2026-08-07 for harness-fix re-verify. Distinct sub-shape from `worktree-spawn-asymmetry-message-delivery.md`:

- **Sender + recipient both parent-process** (no isolation flag) — distinct from worktree-OUTBOUND mount-staleness mechanism
- **Failure timing: at spawn-handshake** (not mid-session)
- **Mechanism: drain ≠ deliver** — Cal's inbox file went 21400 bytes → 2 bytes (`[]`) at file-mtime = spawn-window; conversation channel injection did not run
- **Workaround: team-lead spawn-prompt relay-fold** (Stage 1 discipline per `relay-to-primary-artifact-fidelity-discipline.md`)
- **Detection asymmetry:** parent-process-side file-stat byte-count correlation at spawn-mtime is the ONLY detection path; recipient cannot self-diagnose

**Empirical sequence:** Monte dispatched both Protocol A submissions to Cal direct, harness reported `success: true` (12:30 UTC), inbox file confirmed at 21400 bytes from team-lead view. Cal spawned ~3hr later (15:34 UTC); her own view showed `callimachus.json = []`; my parallel view confirmed file dropped to 2 bytes at file-mtime = spawn-window. Cal recovered via Stage 1 relay-fold from spawn prompt + Monte's S29 scratchpad, then Stage 2 amended after my 15:38 primary-artifact-grade evidence-chain relay.

[DECISION — session 29] **Joint-source-at-filing-time for B.2 `recursive-citation-as-canonical-validation`** (monte + callimachus) — Cal's S27 11:36 framing fold (sibling-to-first-use, NOT instance-of-two-consumer) was load-bearing on categorization, not append-after-the-fact. Both halves required at filing → joint source-agents. Cal's [LEARNED] from S29.

[DECISION — session 29] **Stage 1 anti-pattern self-caught and Stage 2 superseded, in-session.** Cal's initial filing of B.2 cited her own curator-ACK Stage 2 self-correction (which is `relay-to-primary-artifact-fidelity-discipline.md` Instance 4 — a *separate* recursive moment) as the first-instance evidence. After my 15:38 primary-artifact-grade relay landed, she Stage 2 amended to the correct first-instance: Monte 10:50 Protocol B query → Monte 11:06 T04 §Recipient-and-authority-chain → Cal 11:18 response citing Monte's prose. **Recursive-validation moment candidate** for `relay-to-primary-artifact-fidelity-discipline.md` Instance 5 (sibling to Brunel's Instance 4 catch on Cal in S27); deferred until verbatim Monte text becomes available for unambiguous confirmation.

### LEARNED — session 29

- **Substrate failures compose in-session into productive wiki output.** A brand-new substrate failure (drain-on-spawn-clear-without-deliver) was characterized end-to-end, recovered around via Stage 1 relay-fold, and filed as a sibling gotcha within the same session it was discovered — without losing the queued submission content. Discipline-catches-discipline at substrate scale.
- **Spawn prompt as primary-artifact-grade relay channel.** When recipient inbox drain-without-deliver fails, the team-lead's spawn prompt is the only fully-controlled path to put structural framing into a fresh agent's context. Per `relay-to-primary-artifact-fidelity-discipline.md`, the spawn prompt counts as a relay (provenance-by-artifact-class), not as a primary artifact. Receiver applies Stage 1 fold; team-lead supersedes with Stage 2 mid-session if better evidence arrives.
- **Three-agent sequential queue-flush is feasible inside a single session window.** Total wall-clock ~25min from Brunel spawn to Cal terminate. Each agent's queue was small (1-2 items); sequential vs parallel is correct when items are agent-specific and don't compose. If queues had been parallel-friendly (no shared output target), parallel spawn with worktree-isolation would have been preferred — but worktree-OUTBOUND substrate cost would have applied.

### NEXT-SESSION BOOT (re-orient instructions for S30)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces Monte-respawn for Protocol A AMENDMENT on `recursive-citation-as-canonical-validation.md`:** spawn Monte. Cal flagged FLAG annotations on the family-distinction table + first-instance section pending verbatim text confirmation. If Monte's verbatim Protocol A text becomes recoverable (or he can re-state it), Stage 2 amendment closes the FLAGs and the entry promotes to `relay-to-primary-artifact-fidelity-discipline.md` Instance 5 candidate.
5. **If PO surfaces n=2 watch on `inbox-drained-on-spawn-clear-without-deliver.md`** (any new instance of harness-success-on-dispatch + recipient-side on-disk-absence at spawn-handshake): spawn Cal for amendment + cross-link to existing entry. Architectural-fact convention applies — n+1 sightings only update if substrate changes; same-mechanism re-encounters update `discovered` list, not confidence.
6. **If PO surfaces apex-research n=2 invocation** (first deployment of #1 v0.7 federation-bootstrap-template beyond FR): spawn Brunel for template execution + Cal for namespace allocation + likely Monte for drift-detector deployment. Convention re-test point per S27 close.
7. **If PO surfaces Volta-related work** (continued T06 amendments, lifecycle-script extension, harness substrate fixes): spawn Volta. Pending from his S28 NEXT-SESSION-CHOREs trio: all three cleared, but n=2 watch on `cross-document-prose-procedure-drift.md` may activate per his amendment-path note.
8. **First operational item if Cal-spawning:** her queue at S29 close is clean (85 entries, 1 active FLAG annotation on `recursive-citation-as-canonical-validation.md`, no disputes, no TTL expiries imminent). Surface-grade work would be receiving any new Protocol A submissions or wiki health summary.

### Standing watch items going into S30

- **Monte-verbatim recovery for Cal's FLAG resolution** — if Monte respawns for any reason, surface FLAG-resolution as a piggyback task
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2 standard moves
- **apex-research n=2 invocation** — first deployment of #1 v0.7 federation-bootstrap-template beyond FR; convention re-test point
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **`repo-as-durable-store-teamdelete-as-release-primitive.md` n=2 watch** (Volta-filed S28) — second team-lifecycle protocol on different platform = cross-platform generalization confirmation point
- **`cross-document-prose-procedure-drift.md` n=2 watch** — second incident triggers Volta's Protocol C consideration per his S28 amendment-path note

(*FR:Aen*)

---

## SESSION 28 WRAP — 2026-05-07 (Volta NEXT-SESSION-CHOREs cleared; 4 Protocol C promotions ratified; team-lead-override pattern established for non-owned topic edits)

**Goal (PO-set 15:32 on 2026-05-06):** T06 path-tree rewrite (Volta NEXT-SESSION-CHORE #1). Mid-session expanded to all three Volta chores + 4 Protocol C promotions Cal carried from S27.

**All three Volta NEXT-SESSION-CHOREs from S27 cleared end-to-end.** 4 Protocol C promotions ratified into common-prompt verbatim. Wiki 80 → 82.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| T06 path-tree rewrite | +122/-99, 12 edits | Volta (direct) | `topics/06-lifecycle.md` |
| T04 §Row 2 + Row 5 clarification | +4/-2 | Volta (proposed) → Aen (override-applied) | `topics/04-hierarchy-governance.md` |
| T09 source-team example | +1 | Volta (proposed) → Aen (override-applied) | `topics/09-development-methodology.md` |
| 4 Protocol C promotions | +25/-1 | Cal (proposed) → Aen (ratified+authored) | `common-prompt.md` |
| 2 wiki entries from Volta | NEW (80→82) | Cal (Volta-sourced) | `wiki/{patterns,gotchas}` |
| `framework-research-next-session` skill | NEW (137 lines) | Aen | `~/.claude/skills/` (user-private) |

### Protocol C promotions landed (all S27 carry-forward candidates)

1. `substrate-invariant-mismatch` n=6 → Structural Change Discipline gate 4 (3rd sub-bullet, sibling to dual-team-dir-ambiguity reference)
2. `worktree-isolation-for-parallel-agents` n=7 → Agent Spawning Rule extension (replaces single-line block)
3. `semver-strict-typed-contract-discipline` n=1 (corrected from claimed n=2 mid-session by Cal's grep-discipline) → new Versioning Discipline subsection in Structural Change Discipline
4. `relay-to-primary-artifact-fidelity-discipline` n=4 → new Relay Fidelity Discipline subsection in Dual-Hub Routing

[DECISION — session 28] **Team-lead-override pattern for non-owned topic-file edits established.** When a specialist proposes diffs to a topic file outside their write-scope AND the topic owner is not spawned, three options: (a) defer to next session, (b) spawn the owner, (c) PO-greenlit team-lead override. Option (c) used for both T04 (Volta-proposed → Monte-domain) and T09 (Volta-proposed → schema-domain). Pattern matches existing Protocol C → common-prompt authoring. Attribution preserved on T04 §Row 2 (`_FR:Volta_ — 2026-05-06`).

[DECISION — session 28] **Cal's [CAL-CANDIDATE] scratchpad notes pulled and filed via Protocol A** (option a, overriding Cal's option-b recommendation). PO direction was "pull now, don't defer." Both notes filed; Volta clean-acked Cal's framings (no amendments).

### LEARNED — session 28

- **Cal's grep-discipline catches memory drift in both directions.** S26 [LEARNED] noted memory underestimates (n+1 sightings under-recorded); S28 inverse (Cal's S27 wrap-note claimed n=2 SemVer, real n=1, caught up-front by Cal before proposal). Discipline ratifies as: *"grep before Protocol C, in either direction."* Folded into Cal's scratchpad as curatorial process; not promoted (n=2 cumulative is bracketing data, not pattern).
- **Volta's [STANDING-DATA] pushback on n=2 cross-document drift.** Strict reading of his [LEARNED] — n=2 is *progress toward* the trigger, not satisfaction. Holding for n=3 before any Protocol C extension. Correct discipline; team-lead's eager reading would have over-triggered.

### Skill amendments — session 28 (patched mid-close per S28 first-invocation feedback)

- **TOP → BOTTOM placement (self-spotted):** Original skill said NEXT-SESSION-BOOT block at TOP of session wrap; existing convention is BOTTOM (S27 NEXT-SESSION BOOT was at line 104 of a wrap that started at line 4). Patched 2026-05-07.
- **Push-confirmation gate removed (PO feedback):** Original skill required a separate user confirmation before push at S4. PO ratified that push is canonical part of S4 every session — gating it separately is friction, not safety. Step 1 prompt updated to "Ready to commit, push, and shut down" — single confirmation covers commit + push + shutdown. Patched 2026-05-07.

Both bugs fixed during the closing protocol of S28 (the skill's own first invocation). Lessons:

- **First-invocation skills surface latent assumptions.** This skill was tested by being run, not by being reviewed. Both bugs were invisible during authoring; both became obvious within ~10 minutes of the skill executing. Skills like procedures: write them, run them, fix them on first contact.
- **When authoring procedural skills for established workflows, default to fewer gates not more.** The push-confirmation gate was a defensive over-correction; the actual workflow had push as canonical session-end every time. The skill's job is to enforce discipline that is currently being skipped (NEXT-SESSION-BOOT block), not to add discipline that the user has already internalized (push at session-end).

### NEXT-SESSION BOOT (re-orient instructions for S29)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces Brunel-related work** (federation expansion, container lifecycle, worktree-asymmetry review): spawn Brunel. He has a queued accuracy review on `worktree-spawn-asymmetry-message-delivery` + a coordination flag from Volta on T06 Container Lifecycle "Phase 2.0a" stale prose (lines 1135, 1182).
5. **If PO surfaces Monte-related work** (governance prose, T04 wordsmithing, his two pending Cal submissions): spawn Monte. He has T04 §Row 2 review queued + 2 pending Protocol A submissions (`single-channel-saturation-via-mode-partition` + `recursive-citation-as-canonical-validation`) noted in his S27 scratchpad.
6. **If PO surfaces a third instance of cross-document drift** (any agent reports prose-procedure mismatch): n=3 reached, Protocol-C-extension trigger activates per Volta's [STANDING-DATA]. Spawn Cal for promotion drafting.
7. **First operational item if Cal-spawning:** her queue at S28 close was clean (82 entries, no disputes, no TTL expiries). Surface-grade work would be receiving any new Protocol A submissions from spawned specialists; or a wiki health-summary at PO request.

### Standing watch items going into S29

- **TPS-583 (apex-research)** — when PO signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2 standard moves
- **apex-research n=2 invocation** — first deployment of #1 v0.7 federation-bootstrap-template beyond FR; convention re-test point per S27 close
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions

(*FR:Aen*)

---

## SESSION 27 WRAP — 2026-05-06 (Phase B v1.0-final shipped end-to-end across 4 artifacts; substrate-failure landscape characterized)

**Goal (PO-set 10:42):** Activate Phase B; let Cal flush queue.

**Both objectives met substantially.** Phase B v1.0-final cluster shipped end-to-end across all four design artifacts; Cal queue flushed (14/15 effective + 4 inbound batch processed → 80 wiki entries net 77→80).

### Phase B v1.0-final cluster — fully closed across 4 artifacts

| Artifact | Final | Owner | Cross-citation |
|---|---|---|---|
| #1 federation-bootstrap-template v0.7 | EXECUTION-READY for n=2 (apex-research) | Brunel | Herald 04 + T04 §Authority-Drift |
| #2 authority-drift-substrate-instrumentation v0.2 | bidirectional cite-and-fold complete | Brunel | #1 + T04 + Herald 04 |
| Topic 04 §Authority-Drift Detection v1.2 | canonical detector-side surface | Monte | #2 + Herald 04 + Cal Protocol B |
| `mitselek/prism` PR #12 v0.1.1 (04-spec) + PR #13 v2.0.0 (R9-rule) | typed-contract canonical sources | Herald | #1 + #2 + T04 |

**Asymmetry framing anchor locked at T04 line 870:** *"admission needs to commit, observation needs to caution"* — both #2 design AND T04 detector-side surface use identical structural framing. Cite-and-fold cadence held end-to-end across all four artifacts.

**Cluster statistics:** 7 versions of #1 + 2 versions of #2 + 6 amendments to T04 + 2 PRs on Prism. **Zero abandoned drafts.** Clean acceptance-gate closure across all consumers (Aen, Brunel, Monte, Cal, Herald). ~80min cadence to v0.7 execution-ready; ~4hr full-cluster closure.

### Substrate-failure landscape — characterized end-to-end

[DECISION — session 27] **`substrate-invariant-mismatch.md` n=5 → n=6** with two named sub-shapes:
- **Sub-shape A:** read-cursor-skip on present-on-disk message (Monte→Cal 10:50 evidence chain by Monte 11:02)
- **Sub-shape B:** on-disk-absence (Brunel inbox JSON not updating; Monte's 11:08 + Brunel's 11:05 evidence)

**Same-root-cause-different-layer connection to Instance 1 (`dual-team-dir-ambiguity`)** — converts "n=6 unrelated instances" → "the defect class manifests at multiple layers of a single substrate." This is a stronger Protocol C argument than n-count alone.

[DECISION — session 27] **New wiki entry `worktree-spawn-asymmetry-message-delivery.md`** filed standalone (n=4 evidence). Hypothesis evolved through the session:
- Initial framing (n=2): worktree-OUTBOUND specifically broken
- Sharpened (n=4): non-parent-process → recipient unreliable across worktree boundary
- Final empirical (n=4 + Cal→Brunel intermittent at 12:54 BROKEN, 13:14 SUCCESS, 15:00 SUCCESS): **transient mount-staleness**, not persistent direction-asymmetry, not non-deterministic-race

**Operational workaround codified:** team-lead → recipient relay path (no-worktree → no-worktree consistently works). Used multiple times this session for Monte/Brunel/Herald → Cal Protocol A relays.

[DECISION — session 27] **Negative-evidence-as-positive-data folded into Sub-shape A prose** (Monte's diagnostic move): *"absence of Y (no eventual catch-up) is sharper diagnostic than observing X (the skip)"* — observed-absence-of-expected-recovery-signal rules out non-deterministic-iteration mechanism. Diagnostic-method articulation makes the entry useful beyond the specific failure-mode.

### Wiki productivity

- **11 new entries:** protocol-completeness-across-surfaces, lossless-independent-convergence, canonical-taxonomy-check-before-naming, timestamp-crossed-messages, semver-strict-typed-contract-discipline, substrate-shape-vs-authority-shape-orthogonality, field-level-overlap-one-truth-not-mirror, audit-trail-for-rejection-rationale, surfacing-cost-asymmetry-stale-context, snapshot-state-mis-names-path-to-end-state, api-gateway-error-vs-actual-server-state, worktree-spawn-asymmetry-message-delivery, discriminator-field-name-consistency-over-uniqueness, relay-to-primary-artifact-fidelity-discipline (renamed from initial `fold-only-what-is-verbatim.md`)
- **5 substantive amendments:** substrate-invariant-mismatch n=5→n=6 (with two-sub-shape framing + Monte enrichments + Brunel dual-witness), worktree-isolation n=2→n=7 (with dirty-main-worktree-bypass sub-shape + orthogonality cross-link), prompt-to-artifact-cross-verification (runtime-variants extension; n=2 cumulative on runtime-variant), worktree-spawn-asymmetry hypothesis-relaxation + INTERMITTENT data point, relay-to-primary-artifact-fidelity Stage 2 + recursive-validation Instance 4
- **2 sub-shape folds** into coordination-loop-self-correction (#32 + #3 as named variants)
- **4 Protocol B responses** (Monte 10:50; Brunel 11:05; Tier-0 substrate Qs; Brunel pushbacks at 12:54) citing 8+ wiki entries each
- **3 Protocol A acknowledgments** (Monte n=6 substrate amendment; Brunel consolidated relay-discipline; Herald two-instance amendment)
- **Filing-to-citation latency average ~25min** — Phase A discipline target hit at peak. Cal entries cited within ~25min by Monte design v1, Herald slot decision, Brunel v0.7 envelope shape

**Wiki count: 77 → 80** with substantive entry enrichment beyond raw count.

### Protocol C promotion candidates (4 surfaced for next-session cycle)

1. **`substrate-invariant-mismatch.md` n=6** with same-root-cause-different-layer connection to Instance 1 `dual-team-dir-ambiguity`
2. **`worktree-isolation-for-parallel-agents.md` n=7** with 5 work types + 4 specialists (Brunel + Monte + Herald + team-lead)
3. **`semver-strict-typed-contract-discipline.md` n=2** with PR #11 + PR #13 instances (both v→v2.0.0 SemVer-major bumps)
4. **`relay-to-primary-artifact-fidelity-discipline.md` n=4** with different-specialist criterion satisfied (Brunel two-stage lifecycle + Herald third-party + Cal recursive-validation Instance 4)

Cal will surface these on next scratchpad-prune cycle (S28).

### Eight discipline surfaces dogfooded through the cluster

1. Cross-read discipline (gate 2)
2. Cite-and-fold cadence (held end-to-end across 4 artifacts)
3. Production-rule application (Brunel's two self-corrections)
4. Worktree-isolation discipline (n=7 cumulative this session)
5. Strict-typed-contract-discipline (Cal n=2 promotion-grade)
6. Brief-frame gate-4 runtime-variant (Herald's two instances)
7. Discriminator-field-name consistency (Herald's §2.3 lock + Brunel's near-miss)
8. Primary-artifact-vs-relay-quote (Brunel's queue, Cal's recursive-validation Instance 4)

### LEARNED — session 27 meta-patterns

- **Cite-and-fold-discipline-absorbs-co-design** (when structurally sound). Brunel's 14:58 closing observation. Two retroactively-ratified co-design instances this run (10:54 Brunel-Monte registry handshake + 11:14 D5 reconciliation) — both produced structurally superior outcomes than two-independent-shipped designs would have. Compose-or-conflict gate is the structural test; discipline doesn't reject co-design, it rejects UNNECESSARY co-design.
- **Negative-evidence-as-positive-data** (Monte 11:36). Observed-absence-of-expected-recovery-signal is a sharper diagnostic than observing the symptom itself. Bayesian update via observed-not-Y. Folded into substrate-invariant-mismatch Instance 6 prose.
- **[CROSS-DETECTED] as session-pattern** (5+ instances). Cal's `timestamp-crossed-messages.md` filed at ~11:08 was dogfooded continuously for 2+ hours across all four agents. Operationally load-bearing.
- **Recursive-validation Instance 4** in `relay-to-primary-artifact-fidelity-discipline.md` — Cal's own ACK claimed a fold she hadn't yet executed; Brunel's cross-check caught the divergence; Cal applied Stage 2 supersession to her own ACK. Discipline catches its own authoring curator within minutes of filing — operational robustness by self-test.
- **Filing-to-citation latency <30min target hit recursively** as default. Phase A discipline target hit at peak.
- **Substrate-finding empirical rigor** — directional-asymmetry → INTERMITTENT-via-mount-staleness through three rounds of evidence-driven sharpening (n=2 → n=4 → n=4-with-mixed-outcomes).

### Tail-end items going into S28 (all non-urgent)

- **Brunel:** Topic 06 write-back (Volta-resume timing; Herald co-author offer); Cal worktree-asymmetry entry accuracy review (he's co-source-agent)
- **Monte:** Compound-signals v1.1 fold + Herald [COORDINATION]; single-channel-saturation-via-mode-partition Protocol A; recursive-citation-as-canonical-validation Protocol A
- **Cal:** 4 Protocol C promotion candidates (surface to me next prune); receiver-side amendment to substrate-invariant-mismatch n=6 if eventual self-iteration catches up
- **Tier-0 §3.4 questions** (PO escalation): (1) Brilliant pre-rejection attempt log existence; (2) append-only-additive contract on `WriteAccept`/`WriteRejection` envelopes — both PARTIAL per Cal's wiki Protocol B; PO escalation at session-tail
- **Topic-09 micro-fix** (deferred to Volta): line 761 `WikiProvenance` example needs `source-team` field added per S26 Protocol C #1 schema add
- **Volta NEXT-SESSION-CHOREs:** T06 path-tree rewrite + T04 path-tree audit (lines 528 + 1025 contradicting S5 #62 patch) + Topic-09 micro-fix

### Standing watch items going into session 28

- **TPS-583 watch** — when user signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2: page V2→ITOps `I`, banner removed, v1.0, intake-template assignee filled, close TPS-583, close RFC #2 review-status
- **apex-research n=2 invocation** — first deployment of #1 v0.7 template beyond FR; convention re-test point per template's load-bearing test
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **Ruth-team observability gap** — only on Ruth Q2/Q3 response
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions

### Meta-observations from session dynamics

- **Cite-and-fold cadence as default operational mode.** All four design artifacts cross-cite each other; co-design instances absorbed via fold-not-revert. Phase A established the discipline; Phase B operationalized it as the default cadence.
- **Worktree-isolation n=7 cumulative** with mixed work types (1 Brunel branch + 4 Herald PRs + 2 Monte preempts) demonstrates the discipline scales structurally.
- **Substrate-failure-mode characterization** turned an obstacle into a wiki contribution. n=6 substrate-invariant-mismatch + new worktree-spawn-asymmetry entry + relay path operationalized = three artifacts produced from what would otherwise have been a friction point.
- **Agent-self-organization at session-tail** — Cal-Brunel recursive-validation loop happened entirely without team-lead intervention. Discipline-catches-discipline emergent.
- **Five+ in-session timestamp-crossed events** all surface-not-bridge resolved cleanly. Wiki entry filed at 11:08 dogfooded continuously through session-tail.

### NEXT-SESSION BOOT (re-orient instructions for S28)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any Cal scratchpad updates.
3. **Pull `mitselek/prism` repo** if you want to read Phase A/B Prism artifacts (PR #12 + PR #13 + envelope contracts).
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces Phase C activation** (next federation expansion phase, e.g., new team joining via #1 v0.7 template at apex-research): spawn Brunel for federation-bootstrap-template invocation + Cal for namespace allocation + likely Monte for drift-detector deployment.
6. **If PO surfaces Volta-resume tasks:** spawn Volta for T06 path-tree rewrite + T04 path-tree audit + Topic-09 micro-fix. Three NEXT-SESSION-CHOREs queued.
7. **If PO surfaces TPS-583 progression** (Ruth signal): action Stage-2 standard moves.
8. **First operational item if Cal-spawning:** her queue is genuinely flushed; surface-grade work would be Protocol C draft authorizations on the 4 promotion candidates from S27 + receiver-side amendment to substrate-invariant-mismatch n=6 if eventual self-iteration catches up.

---

## SESSION 26 WRAP — 2026-05-05 (Phase A on Prism — federation substrate ratified end-to-end)

**Major outcomes:**

- **Codename "Prism" committed** (PO ratified mid-session). Optical lineage: Obsidian (volcanic glass) → Brilliant (cut diamond) → Prism (refractor — federation as one substrate, multiple per-team views).
- **`mitselek/prism` private repo bootstrapped.** Local clone at `~/Documents/github/.mmp/prism/`. Brunel handled bootstrap; root commit `2f26706`.
- **Phase A STRUCTURALLY FINAL** — 11 PRs merged on `mitselek/prism` main. Federation substrate primitives ratified into typed contracts. Envelope contract at v2.0.

**Architecture team activated this session** (Brunel, Monte, Herald) plus Cal + Finn carried.

### 11 PRs merged on `mitselek/prism` main

| PR | Author | Phase | Content |
|---|---|---|---|
| #1 | Brunel | A.1 | Topology + container posture + setup-blocked |
| #2 | Herald | A.1 | Deliverables A + B v1.0 (envelope + sync) |
| #3 | Brunel | A.1 | §3 namespace allocation (`fr/` + `Projects/fr/wiki/*`) |
| #4 | Monte | A.1 | Surface 2 v1.0 + v1.1 (write-block error semantics) |
| #5 | Herald | A.1 | v1.1 (Monte recovery shapes fold + R2 dispatch + Mod 2 retraction) |
| #6 | Monte | A.2 | Surface 1 M3 + Surface 3 DACI |
| #7 | Herald | A.1-fix | Stale table header |
| #8 | Monte | A.2-mod1 | sourceTeam dedup |
| #9 | Herald | A.3 | Deliverable C — two-pattern asymmetry decision matrix |
| #10 | Herald | A.3 | Envelope-v1.1 (CuratorAuthority required + integrated) |
| #11 | Herald | A.3 | SemVer bump 1.1.0 → 2.0.0 |

### Substrate primitives ratified into typed contracts

- **Hub-and-spoke topology** (FR-as-hub) + 4 documented growth triggers
- **Pull/poll sync mechanism** (Brilliant poll-only substrate, observed-fact)
- **`fr/` short-form namespace + `Projects/fr/wiki/*` placement** (Cal-curator sole-writer preserved)
- **Symmetric envelope, mode-by-content-category** (resolves two-pattern asymmetry structurally)
- **R2 sovereignty** (`producer.team === logicalPath.team`) as typed invariant
- **5-class WriteRejection enum** (closed) + sub-discriminator approach (`kind: "endpoint-unreachable" | "review-timeout"`)
- **CuratorAuthority discriminated union** required at v2.0 (`mode: "self" | "ratified-cross-team"`)
- **ProducerAction closed enum** (`wait-and-repoll | fix-and-resubmit | escalate-to-team-lead | escalate-to-governance | abandon`) — operationalizes no-fallback discipline as contract teeth
- **M3 federation-curators-as-class** (asymmetric DACI: methodology-target-decides + product-no-write-allowed + observation-target-decides)
- **§3.4 ratification protocol** preserves R2 by routing cross-team writes through target-curator's producer identity
- **Strict-SemVer for typed contracts** as precedent (migration mechanism makes bump SAFE; SemVer level reflects whether consumers must change code)

### Composite framing (Herald deliverable C §3-§5)

*"Substrate sees one substrate; asymmetry lives in interpretation, not in shape."* Three axes converge (envelope shape, sync mechanism, error-recovery family); two diverge (curation authority, reader cardinality). Composition produces federation that is simultaneously **open** (cross-team contribution allowed via ratification) + **sovereign** (R2 enforced for product) + **cheap** (substrate-level federation reads) + **auditable** (`CuratorAuthority` + `sourceTeam` make all attribution machine-checkable).

### Wiki contributions today (66 → 69)

- 66 `wiki/patterns/no-future-proofing.md` (n=many across sessions; promoted from user memory)
- 67 `wiki/patterns/dispatch-granularity-matches-recovery-handler.md` (n=1, watch)
- 68 `wiki/patterns/coordination-loop-self-correction.md` (n=2 promotion-grade)
- 69 `wiki/patterns/worktree-isolation-for-parallel-agents.md` (n=2 with Brunel first-person amendment; n=5 empirically by session-end)

[DECISION — session 26] **Phase A on Prism federation substrate complete at v2.0.** All design surfaces ratified. Substrate primitives become the typed contract foundation for the federation.

[DECISION — session 26] **Strict-SemVer-as-typed-contract-discipline ratified as precedent.** Migration mechanism (substrate-side backfill) is orthogonal to consumer's type-check work. Minor bump = strictly additive; major bump = type-checking changes for consumers. Source: Herald PR #11 §3.2.

[DECISION — session 26] **Branch+PR convention for Phase A+ design work.** Each agent ships a feature branch + PR; team-lead ratifies-and-merges per merge action. Reversible without history rewrite; supports composite review.

[DECISION — session 26] **Worktree-isolation as default for parallel agent work.** n=5 dogfooded today (Brunel + Monte preempt + Herald table-fix + deliverable C + envelope-v1.1 + SemVer bump). Memory rule `feedback_no_fallbacks.md`'s "use isolation: worktree" guidance is empirically validated. Apply from session 27 onwards by default for any parallel-specialist branch work.

### [LEARNED — session 26 cluster] (compress on next session-tail)

- **Cross-wires-in-flight is a structural reality at coordination tempo** (n=8 cumulative today: inbox-message crossings + git-state crossings + PR-merge-vs-cross-read crossings)
- **Surface-don't-bridge** ratified even with false-positive HOLD (Herald 16:38). Refinement: *"is this divergence likely to have been resolved by a message I haven't read yet?"* — re-process inbox first if surfacing-cost > re-read-cost
- **Cherry-pick is the recovery for committed-and-pushed-but-orphaned commits.** Stash applies only to uncommitted changes. Different recoveries for different states. (Herald correction of my 16:31 path-misnaming.)
- **Snapshot-state-at-ratification-time can mis-name the path-to-end-state** even when end-state is correct (my 16:38 stash-workflow misnaming)
- **Coordination-loop self-correction runs at coordination-tempo, not just session-tempo** (n=2 within-loop self-corrections in single 5-message exchange — Monte v1.0→v1.1 + Herald Mod 2 retraction)
- **Field-level overlap is a class-of-bug gate-2 catches reliably** — one field, one truth beats N fields with documented mirror invariant (Herald sourceTeam dedup catch)
- **Audit-trail-for-rejection-rationale paragraph** protects against future re-duplication (Monte §3.5 "Why sourceTeam is not duplicated here" cite-back)
- **Substrate-shape vs authority-shape orthogonality** (Monte M2 rejection) — *"topology design that conflates them imports the wrong failure mode"*
- **Asymmetries should live above the substrate, not in the substrate** (Herald deliverable C §3-§5 composition framing) — wiki-promotable, joint Herald-Monte
- **Pre-commit-to-extension shapes reviewer-vs-author dynamics favorably** (Herald's opening [COORDINATION] move) — even with retraction-strengthens-pattern irony
- **Protocol-completeness across surfaces** (Herald spotted, Monte named): every error-class escalation has a ratification path back to a legitimate write — n=1 promotion-grade
- **Dense correction clusters are a team-health signal** (Herald's session-tail observation: 5 within-loop self-corrections + 2 cross-team race-conditions + 1 false-alarm-with-recovery = working correctly)
- **504-then-success API-gateway-error-vs-actual-server-state** (Herald's gh pr create observation): *"API gateway errors are not necessarily request-failures; verify state before retrying"*
- **412w-scope-memo + 1300w-shipped-design cadence** (Brunel's discipline) is the right team-shape — tight scope, expansive design — held across all three architecture specialists
- **Eratosthenes-already-aligned** ([LEARNED] from this morning): cross-team consumer leading the team on schema. Inverse: when planning typed-contract change, if consumer NOT yet aligned, change is premature
- **n-axis discipline** for promotion: distinguish *instance count of pattern* from *cardinality of dimension you're claiming pattern across*
- **Meta-coordination has compounding-cost shape** (Monte's framing): paying it incurs setup; clearing it unlocks throughput multiplier — don't interleave
- **Filing-to-citation latency <30 min** today (Cal `poll-only-substrate-sidecar-derivation.md` filed and cited in alignment directive within minutes); *complete-enough-to-cite is the bar from minute one, not "we'll polish later"*

### [WIP — Cal Protocol A queue, ~13 patterns deferred to next session]

**Promotion-grade or n=2 cumulative:**
- #4 lossless-convergence Herald-Monte (joint, n=2 cumulative w/ session #59 — auto-promotes per Cal's schema-purity discretion: source-agents `[herald, monte]`, prose attribution to session-59 historical instance)
- #5 canonical-taxonomy-check before naming wrap targets (Monte, n=2 cumulative w/ session #59)
- #11 protocol-completeness-across-surfaces (Herald+Monte joint, promotion-grade by Herald's stated criterion)

**Watch (n=1):**
- #3 pre-commit-to-extension irony (Monte)
- #6b self-correction-via-prior-self-argument (Herald — currently parked as sub-shape of #68)
- #32 cross-specialist-argument self-correction trigger (Herald)
- #33 timestamp-crossed-messages (n=8+ cumulative today; split or merged at Cal's discretion — strong promotion candidate)
- #34 surfacing-with-stale-inbox + Monte's surface-bias-cost-asymmetry sibling
- #35 snapshot-state-mis-names-path-to-end-state (n=1, my path-misnaming)
- #40 504-then-success client-server temporal divergence
- #41 worktree-isolation amendment (Brunel + Herald n=5 today)
- #43 SemVer-strict-typed-contract discipline
- field-level-overlap one-truth-not-mirror (Herald, sibling to #67)
- audit-trail-for-rejection-rationale (Monte sub-shape, n=1)
- substrate-vs-authority-shape orthogonality (Monte M2 rejection, n=1) — promotable on next sighting
- asymmetries-live-above-substrate (Herald deliverable C composition)

Herald + Monte coordinated on submission split per 16:43 [COORDINATION]. Cal will dedup-merge per Protocol A step 5 if duplicates surface. Cal's scratchpad pruned to 73 lines with headroom for ~13 patterns; will likely re-prune mid-session 27.

### [WIP — Phase B (NOT STARTED)]

Wakes on PO direction. Three workstreams:

1. **Federation bootstrap protocol** (new team joining federation) — Brunel's domain. Likely shape per Brunel's preview: parameterize FR Brilliant MCP runbook over `<team>` + namespace claim; Cal-coordination per new team for namespace allocation. Convention re-test at n=2 (apex-research likely next).
2. **Authority-drift detection at federation scale** (n=20+) — Monte/Brunel joint. Substrate-side instrumentation; likely sidecar + cron-poll consistent with pull/poll sync.
3. **T04 topic-file amendment text** — post-Phase-A codification (Volta's chore from session 21).

### Standing watch items going into session 27

- **Trigger 1 (reverse spoke→spoke flow >2 teams within a quarter)** — empirical question that gates next topology decision (hub-and-spoke → hybrid trigger). FR session-tail responsibility, not Brunel's.
- **Topic-09 source-team example refresh** (Cal micro-fix, 5-line edit when convenient)
- **Source-team semantics extension watch** — needs n=2 *distinct deployments* producing observation-class entries before Protocol C extension justified (Cal's n-axis disambiguation)
- **TPS-583 watch** — Stage-2 actioning when Ruth signals (no change from session 22)
- **T06 path-tree rewrite** (Volta — pending from session 19/20)
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **Ruth-team observability gap** — only on Ruth Q2/Q3 response

### Meta-observations from session dynamics

- **Decision-cadence chain unblocked specialists fast:** 16:11 sync directive (mine) → 16:22 namespace ratification (mine) → §3 ship same-day (Brunel). Each downstream unblock arrived within ~10 min of upstream decision.
- **Cross-wires count ended n=8** across mostly inbox-message and git-state crossings. The pattern itself became a team-health observation rather than a coordination failure.
- **Team-shape "412w scope-memo + 1300w shipped-design"** (Brunel observation) held across all three architecture specialists — tight scope, expansive design.
- **Worktree-isolation surfaced organically from a near-miss, not postmortem.** Brunel hit it first; Monte caught preemptively; Herald dogfooded n=5. Pattern landed at n=2 by session-end.
- **Agent reuse rule held:** spawned each architecture agent once at 16:11/16:12; kept them alive across phases A.1→A.2→A.3. No name-2 duplicates today.

### NEXT-SESSION BOOT (re-orient instructions for session 27 me)

1. Read `startup.md` first (always) — its #62 patch keeps Step 2 collapsed to `TeamDelete + TeamCreate + verify`.
2. Pull `mitselek-ai-teams` repo for any Cal scratchpad updates from agent-side persists.
3. Pull `mitselek/prism` repo if you want to read the canonical Phase A artifacts on disk; otherwise you can read this scratchpad's PR table and the prism repo lives.
4. Don't pre-spawn any agent at session start. Wait for PO direction. Phase B activation is the most likely next direction.
5. **If PO surfaces Phase B activation:** spawn Brunel + Monte. Herald wakes on demand for protocol contract questions. Cal carries.
6. **If PO surfaces something else entirely:** ask which team is needed. The framework-research team's standing work (TPS-583 watch, T06 path-tree, etc.) is all NEXT-SESSION CHOREs not blocking.
7. **First operational item if Cal-spawning:** her queue has ~13 pattern submissions to file. She can file early-session in idle cycles before any new design work blocks her.

---

## SESSION 25 WRAP — 2026-05-05 (Postgres-backed library service C-phase + reframed phase A)

**Goal (PO-set):** Thinktank library concept; PO playing with thought of Postgres DB backend + dedicated 24/7 library team for org-wide KB services, learning from Brilliant.

**Shipped:**

- **Issue #64** filed and closed with verdict (proceed to phase A). C-phase deliverable: `docs/2026-05-05-postgres-library-discovery-brief.md` + 5 input memos in `docs/2026-05-05-postgres-library-discovery/` (cal-internal-perspective, finn-brilliant-deepread, finn-staging-review-deepread, finn-polyphony-dev-glance, finn-haapsalu-suvekool-glance).
- **Issue #65** filed with reframed phase A scope (scaling esl-suvekool path-namespace pattern, NOT designing federation from scratch).
- **Two commits pushed:** `2abb1ad` session-24 wiki batch (+7 entries, contracts/ opened), `9407966` C-phase discovery brief.
- **Cal substrate-invariant-mismatch amendment** n=3 → n=5 with two new instances (teamcreate-leadership + Brilliant write-path-sync) — applied this session.

**Mid-session reframe (load-bearing):**

- Initial framing: "design federation layer over per-team markdown wikis."
- Finn's Haapsalu-Suvekool glance (after submodule pin updated to HEAD) revealed: **Topology B is OPERATIONAL REALITY at esl-suvekool today**, implemented as `Projects/esl/*`, `Meetings/esl/<date>`, `Context/esl/*`, `Resources/esl/*` — path-namespace per team inside shared central Brilliant. Convention IS the federation contract; no separate layer needed.
- Phase A scope therefore dropped from "design from scratch" to "scale proven pattern + Cal-as-namespace-curator role evolution."

[DECISION — session 25] **Topology B confirmed.** Per-team libraries + central federation, where federation = path-namespace convention inside shared Brilliant.
[DECISION — session 25] **No fallbacks.** If no curator team alive, Tier 3+ writes refuse with retry-when-up error. `ai_reviewer.py` removed regardless of curator-team shape. Memory feedback `feedback_no_fallbacks.md` extended with this case.
[DECISION — session 25] **Independence posture.** No fork of `thejeremyhodge/xireactor-brilliant`; learn-from only.

[LEARNED — session 25, integration-not-relay validation] **Bio-memory mismatch is real and verification discipline matters.** PO cited polyphony-dev as battle-proof for Topology B; actual battle-proof was Haapsalu-Suvekool. Finn's polyphony glance returned a clean negative — caught the mismatch before phase A scoped against the wrong reference. Wiki #44 doing its job: verify substrate claims against the actual substrate before downstream design depends on them.

[LEARNED — session 25] **Submodule pin staleness silently misleads.** `.mmp/ESL/Haapsalu-Suvekool` was pinned to commit pre-dating the Brilliant integration. Quick grep on pinned content returned stale negative; updating to HEAD revealed 20+ refs. Always verify submodule pin freshness before trusting absence-of-evidence.

[WARNING — session 25] **Brilliant memory was wrong** (paertela6-only claim from prior session). Verified truth: per-team MCP config governs access, FR currently does NOT have it configured; esl-suvekool does. Memory file `reference_brilliant_mcp.md` rewritten with operational discipline (Brilliant pulse, quality floor, two-consumer pattern, source-of-truth principle).

**Wiki pattern candidates queued for next Cal Protocol A batch (six new from C-phase + two carried):**

1. OSS thin-integration anti-extension signal (Finn, n=1)
2. Poll-only-substrate + sidecar-derivation as event-driven shape (Finn, n=1)
3. Soft-verdict discipline on substrate-mapping briefs (Finn meta-process catch, n=1)
4. Cross-repo glance: confirm citation before assuming inheritance (Finn, n=1)
5. Path-namespace as federation primitive (Finn, n=1 esl-suvekool)
6. Two-consumer pattern: direct-MCP vs synthesized-snapshot (Finn, roadwarrior-sync skill, n=1)
7. (Carried from session 24) `source-team` frontmatter promotion to standard schema (n=2 — Cal Protocol C draft authorized but deferred)
8. (Carried from session 24) architectural-fact convention promotion to Cal's prompt (n=3 — Cal Protocol C draft authorized but deferred)

[DEFERRED — to next session] **Cal Protocol C drafts (2 items).** Bigger work, benefits from fresh context. Authorizations stand.

[DEFERRED — to next session] **Cal Protocol A batch on the 6 new candidates.** Should be batched together with the session-24 carry candidates.

## NEXT SESSION — phase A primary, plus deferred housekeeping

1. **Phase A on issue #65** — scale esl-suvekool path-namespace pattern. Setup (FR Brilliant MCP config, namespace allocation rules) + research (dedup census, cross-team query frequency) + design (Cal's role evolution, multi-reviewer schema, orchestration shape, signal derivation rules, write-block error semantics). Phase A team: Cal+Finn carry, add Brunel/Monte/Herald.
2. **Cal Protocol C drafts** — `source-team` to standard schema; architectural-fact convention to Cal's prompt.
3. **Cal Protocol A batch** — 8 candidates queued.
4. **TPS-583 watch** (no change) — Stage-2 actioning when Ruth signals progression.
5. **T06 path-tree rewrite** (Volta, no change).
6. **esl-suvekool feedback loop** (no change) — when PO returns from Tobi sessions.

If PO arrives with direction, that takes priority.

---

## SESSION 24 WRAP — 2026-05-04 (Cal wiki batch)

**Goal:** Route 7 wiki candidates parked from sessions 21-23 to Cal via Protocol A batch.

**Shipped (commit `2abb1ad`):**

- 7 wiki entries filed (52 → 59 entries).
- First `contracts/` subdir entry opened (speculative-marker-for-cross-team-drafts).
- 1 classification delta accepted: operational-team-archetype filed under `patterns/`, not `process/` (Cal's call — team-shape ≠ workflow; sibling precedent at multi-repo-xp-composition + cathedral-trigger).

**Promotion candidates surfaced and authorized:**

- `source-team` frontmatter → standard schema (n=2, Protocol C draft) — DEFERRED, carried.
- Architectural-fact convention → Cal's prompt (n=3, Protocol C draft) — DEFERRED, carried.
- `substrate-invariant-mismatch` n=3 → n=4 amendment — DEFERRED, eventually landed session 25 as n=5 (with Brilliant write-path-sync added).

[LEARNED — session 24] **Re-classify discipline accepted.** When pre-classifying submissions, default to suggestions-not-directives; let Cal use sibling precedent. My pattern/process/ disagreement on operational-team-archetype was where Cal's substrate knowledge beat my mental model.

---

## SESSION 23 WRAP — 2026-05-01/02 (esl-suvekool team designed + deployed)

**Goal (PO-set):** Design a new team to support PO in organising ESL Haapsalu Suvekool 2026 (concert 2026-08-16, Haapsalu Toomkirik). PO's role is gap-filler supporting Liisa Rahusoo (board lead).

**Shipped:**

- **8-file onboarding package** designed by Celes, deployed to `mitselek/Haapsalu-Suvekool` repo at `teams/esl-suvekool/`. Three commits: `d0526ee` (bootstrap), `f65fb2a` (startup amendment — TeamCreate + S5 added), `0e461be` (`.claude/startup.md` repo-root hook for fresh-session ergonomics).
- **Team architecture (Option C, Cathedral-lite-adapted, all opus-4-7):** Tobi (Rudolf Tobias, TL+timeline owner), Lyyd (Lydia Koidula, Estonian scribe + stakeholders.md gate), Saar (Mart Saar, logistician — Carus-Verlag tellimus is task-1 day-1), Tamp (Herbert Tampere, musicologist — singer-prep + kavaleht + listening guides for Zelenka/Hasse/Vivaldi).
- **Mission framing locked (PO confirmed):** "load-shed Liisa via Mihkel as liaison, succession-readiness baked in" — NOT "help Mihkel organise." Liisa announced board departure for Jan 2027 (or Apr 2027). Every artifact designed for the next Suvekool lead (not Liisa, not Mihkel).
- **First session of esl-suvekool started by PO same evening** (in separate Claude session, Haapsalu-Suvekool/ workdir; .claude/startup.md hook auto-bootstrapped Tobi). Confirmed engaged 2026-05-02.

**Workflow shape (reusable for future team designs):** PO intent → Aen brainstorming (work-types, architecture options) → spawn Celes for opinion → Celes Brilliant query for substrate → architecture + naming + workdir options → PO 4 decisions → Celes drafts package → Aen TL review → PO approval → Aen deploys (commit + push to target repo) → bootstrap hook → PO opens fresh session.

[LEARNED — substrate, promotion-grade]

- **Operational team archetype introduced** — first-of-its-kind in our corpus. Differentiators: no tdd-pipeline, succession-framing first-class, low-volume cadence (1-3x/week), persistent-roster-episodic-sessions. Wiki candidate (n=1, watch). Promotion trigger: a second similar team (non-code, multi-month, persistent roster) requesting same shape.
- **`.claude/startup.md` at repo root as fresh-session bootstrap hook** — novel pattern. Lets PO open Claude in a workdir and the assistant auto-identifies as the team-lead persona, reads team config, runs startup. Cleaner than expecting PO to type bootstrap incantations every session. Wiki candidate (n=1, watch).
- **Mutual exclusivity of team-leadership prevents in-session cross-team spawning** — confirmed empirically. Designing-team-Y from session-leading-team-X works; spawning agents into team-Y from team-X session does NOT (Agent tool with team_name=Y requires team-Y already TeamCreate'd, which conflicts). Solution: deploy team-Y artifacts + .claude/startup.md hook, hand to PO for fresh-session start.
- **API key in cleartext caught by Celes during toolkit read** — surfaced 5-file exposure (README + BACH-TOOLS-GUIDE) + `client_secret.json` filename in `mitselek/Haapsalu-Suvekool`. PO rotated same session: new key 35178654-…, old key e8cc9b68-… soft-deleted (30-day undelete window until 2026-05-31), 4 docs cleaned to `YOUR_API_KEY_HERE`, .env gitignored, .env.example added, history rewritten (HEAD c082fd9 → 0e461be), 67 files redacted (47 VSCode + 2 gcloud + 18 misc), local git GC pruned. Substrate finding: when reading any external repo as part of team design, do a credentials sweep early.

[LEARNED — process]

- **Celes wrote outside stated MAY-WRITE area** (designs/new/ at FR repo root, vs prompts/ in her permission block). Aen supported the call — staging at repo root is more discoverable than mixing into prompts/. Flagged in her scratchpad as [PATTERN]: when designing teams that LEAVE framework-research, staging area = FR repo root, not under FR's own teams/. Future-Celes shouldn't relitigate.
- **Celes's "lean startup" omitted TeamCreate bootstrap** — caught at deployment review. Lean is right principle, but TeamCreate is table stakes (not trauma history). Aen amended startup.md with FR's #62 patch pattern: `TeamDelete + TeamCreate + verify` at start, `TeamDelete()` at end. Lesson: when collapsing a checklist, distinguish "always-needed primitives" from "scar-tissue defensive steps." FR's S5 (#62 patch) is the right model — concise but complete.

**Wiki candidates held (Cal Protocol A on next Cal spawn) — 2 from session 23 + 5 carried from sessions 21/22:**

Session 23 new:

1. **Operational team archetype** (no tdd-pipeline, succession-first, low-volume cadence) — n=1, watch.
2. **`.claude/startup.md` repo-root bootstrap hook** for cross-team handoff — n=1, watch.

Carried from session 22 (4) + session 21 (1):
3. Two-stage adoption pattern (proposal-space → escalation → canonical-org-space) — substrate-relevant for future standards.
4. `[speculative]` marker convention for cross-team handoff — defines "this is inference, please confirm."
5. Confluence space create-perm-as-404 disguise — gotcha-shape.
6. EntraID-not-WSO2 — substrate-fact for EVR docs.
7. (Carried from session 21): "In-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team apex+FR. **Empirically reinforced this session** by esl-suvekool's session-1 not needing recovery (S5 worked here at end of session 22, then again at start of session 23).

[DEFERRED — pending Tobi's first-week activity]

- **Watch esl-suvekool session 1 outcomes** — did Saar produce Carus-Verlag draft? Did the bootstrap hook surface any issues? Did Tobi register session-1 [LEARNED] worth bringing up. PO will tell us; do not poll.

## NEXT SESSION — TPS-583 watch primary (no change from session 22)

1. **TPS-583 watch** — when user signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2: page moves V2→ITOps `I`, banner removed, v1.0, intake-template assignee filled, close TPS-583, close RFC #2 review-status.
2. **Cal spawn (when next needed for wiki work)** — route 7 wiki candidates: 2 from session 23 (operational-team-archetype, .claude-startup-hook) + 4 from session 22 (two-stage adoption, `[speculative]` marker convention, create-perm-404 disguise, EntraID-not-WSO2) + 1 carried from session 21 (in-memory-survives-`/clear`, now n=2-empirically-reinforced).
3. **T06 path-tree rewrite (Volta)** — also scoped to fix DO-NOT-TeamDelete contradictions on T06 lines 528 + 1025 that contradict S5 (#62 patch).
4. **esl-suvekool feedback loop** — when PO returns from Tobi's session(s), absorb any [LEARNED] worth promoting upstream.
5. **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event.
6. **Ruth-team observability gap** — only on Ruth Q2/Q3 response.

If PO arrives with direction, that takes priority.

## SESSION 22 WRAP — 2026-04-30 (EVR konteinerite standard shipped: Stage-0 + Stage-1)

**Goal (PO-set):** Push hello-world-container PoC through corporate pipeline; end with adopted "EVR sisene konteinerite standard" + Jira intake protocol for ad-hoc dockerised installations at EVR.

**Shipped:**

- **Stage 0:** Standard published as Confluence page id `1713864752` ("EVR sisene konteinerite standard") in **D365 space** (temporary — V2 has restrictive create-perm; only Ruth as space owner can move/create). Banner-marked "Ettepanek — ootab ITOps poolt vastu võtmist". URL: `https://eestiraudtee.atlassian.net/wiki/spaces/D365/pages/1713864752/EVR+sisene+konteinerite+standard`
- **Stage 1:** Tracking issue [TPS-583](https://eestiraudtee.atlassian.net/browse/TPS-583) posted, assigned **Ruth Türk**. 4-step Stage-1 ask: move D365→V2 → review → escalate → identify subteam. RFC #2 close-bridge embedded in acceptance criteria.
- **Drafts in `docs/`:** `evr-sisene-konteinerite-standard-v0.1.md`, `evr-konteinerite-intake-template-v0.1.md`, `evr-konteinerite-tracking-issue.md`, plus harvest doc (Finn pruned 240→92 lines), audit reports (Medici pass 1+2), proposed-diff doc (Brunel pass 2 review surface).

**Workflow shape (reusable for future ad-hoc standards):** Finn harvest (RFC ref + repo state + Confluence space landscape + mirror target) → PO 4 confirms (home / Jira project / title / placement) → Brunel drafts (3 artifacts mirroring chosen reference) → Medici audit → revisions → Medici re-audit → propose-diff review → apply → Stage-0 publish → Stage-1 post.

**`[speculative]` markers convention introduced** — flag Brunel inferences, container-adaptations of Linux-standard patterns, RFC #2-derived RACI as draft-state. 16 surviving markers in standard, 2 in intake, 2 in tracking. Stage-1 reviewers scan as confirm/adjust points.

[LEARNED — substrate-level findings, multiple promotion-grade]

- **V2 Confluence space create-permission restricted to space owner (Ruth)** — affects ALL future publish flows from non-owner team members. Workaround: publish in PO's permitted space (D365 here), Ruth moves to V2 as Stage-1 step. Wiki candidate.
- **TPS Jira project rejects Task issue type, accepts Story** — workflow quirk; Story has same hierarchy level (0) and works. Worth noting for future TPS posts.
- **EVR's actual SSO is EntraID (Microsoft Azure AD), NOT WSO2.** WSO2 is the integration platform (Micro Integrator for TAF/TAP message routing). Cited via FSM page `536248326` (UAM SSO) + INFOSEC page `851607559` (Delinea SSO). Brunel verified — corrected my hedge during the IAM/PAM ripple. Wiki candidate (substrate-fact for EVR docs).
- **`createConfluencePage` MCP returns 404 on V2** (likely permission-as-404 disguise; Atlassian obscures permission denial behind 404 for security best-practice). Wiki candidate (gotcha-shape).
- **Mirror target: Roland Kilusk's "EVR sisene Linux standard"** (page `1335984130`, ITOps space `I`). Title format `EVR sisene <X> standard`, ~700-1000w single-ET prose, EN product nouns inline, no parallel EN, Tier 0/1/2 classification, no frontmatter, exception-doc in preamble. Peer: BYOD standard. **Tier-numeral inversion vs intuitive (Brunel's call):** Tier 0 = highest sensitivity (production-adjacent), Tier 2 = lowest (≤4-week PoC). Matches Linux standard convention.

**Wiki candidates (Cal Protocol A on next spawn) — 4 from session 22 + 1 carried from 21:**

1. **Two-stage adoption pattern** (proposal in own/permitted space → escalation → canonical org space) — substrate-relevant for future standards.
2. **`[speculative]` marker convention for cross-team handoff** — defines "this is inference, please confirm" without breaking flow.
3. **Confluence space create-perm-as-404 disguise** — gotcha-shaped, useful pattern.
4. **EntraID-not-WSO2** — substrate-fact for EVR docs going forward.
5. **(Carried from session 21):** "In-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team apex+FR.

[DEFERRED — Stage 2 ahead] Pending Ruth's escalation outcome via TPS-583:

- Move D365 page to V2 (Ruth's Stage-1 step 1; she has space-owner perms)
- Standard v0.1 → v1.0: banner removed, receiving role baked in
- Page moves V2 → ITOps space `I` (peer to Linux + BYOD)
- Close TPS-583
- Close RFC #2 (`Eesti-Raudtee/hello-world-container` PR #2) review status (PR stays open with `do not merge` flag, just review-status closed)

**Auth note:** Atlassian plugin OAuth (claude.ai/Atlassian) authenticated this session — read+write scopes for Confluence + Jira at cloudId `2309a7c9-1d93-47a4-80ef-ab7f528cbb77`. Token persists session-level; re-auth needed at next session start.

## SESSION 21 WRAP — 2026-04-30 (#62 patch shipped, new shutdown S5 dogfooded)

**#62 from apex-research/Schliemann** filed AS REFERENCE for FR — proposed startup/shutdown collapse based on apex session 23 in-memory-survives-`/clear` failure. Volta assessed; adopted with one modification (kept R4-3 operational gate as Step 2b — verify-on-disk is independently load-bearing, not just retry-loop scaffolding).

**Empirical confirmation (n=2 cross-team):** This session's startup hit the exact failure mode. `rm -rf "$TEAM_DIR"` ran clean, then `TeamCreate` returned "Already leading team. Use TeamDelete to end..." Recovery required `TeamDelete + TeamCreate` anyway. Same pathology Schliemann reported.

**Patch committed (`426194d`):** `teams/framework-research/startup.md`

- Steps 2 (Diagnose) + 3 (rm -rf Clean) + 4 (Create + retry block) → single Step 2 (Reset team state): `TeamDelete + TeamCreate + verify`. Recovery primitive hoisted to top of every startup instead of branched into on failure.
- Step 4b (operational gate) → Step 2b. The verify-on-disk check IS the gate.
- Steps 5/6 → 3/4.
- New Step S5 (Release team leadership): `TeamDelete()` after final `git push`. Nulls in-memory state on graceful exit; next session's `/clear` startup needs no recovery.
- Gotcha #3 updated (now references Step 2 verify, was Step 4).
- New gotcha #4 documents "in-memory team-leadership state survives `/clear`".
- Old R7 Note "S5 removed because runtime is ephemeral" replaced with corrected explanation: runtime *dir* IS ephemeral; parent CLI's in-memory leadership state is NOT.

**Cross-team:** Comment posted on mitselek/ai-teams#62 (`issuecomment-4350394024`) with FR-side confirmation, commit link, evidence correction (FR retry block was n=1, not n=0 — Restart 4 hit it).

**Volta's [LEARNED] — wiki promotion criterion:** "Cross-team gotcha promotion: when one team observes a failure mode and fixes it, second-team confirmation (n=2) is the trigger to elevate from team-local doc to wiki-level pattern. Schliemann's #62 + this session's startup is the canonical pair."

**Wiki candidate held (Cal Protocol A on next spawn):** "In-memory team-leadership state survives `/clear` independently of disk" — substrate-relevant, gotcha-shaped, n=2 cross-team. Cal not spawned this session.

**This shutdown is first to use new S5** — dogfooding the patch. Next session's startup runs 5 logical steps not 8, with no in-memory recovery branch.

## NEXT SESSION — TPS-583 watch primary

1. **TPS-583 watch** — when user signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2: page moves V2→ITOps `I`, banner removed, v1.0, intake-template assignee filled, close TPS-583, close RFC #2 review-status.
2. **Cal spawn (when next needed for wiki work)** — route 5 wiki candidates: 4 from session 22 (two-stage adoption, `[speculative]` marker convention, create-perm-404 disguise, EntraID-not-WSO2) + carried session-21 in-memory-survives-`/clear`. All via Protocol A.
3. **T06 path-tree rewrite (Volta)** — also scoped to fix DO-NOT-TeamDelete contradictions on T06 lines 528 + 1025 that contradict new S5 (#62 patch).
4. **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event.
5. **Ruth-team observability gap** — only on Ruth Q2/Q3 response.

If PO arrives with direction, that takes priority.

## NEXT-SESSION-CHOREs (still active)

- [ ] **TPS-583 status check + Stage 2 actioning.** When Ruth has identified ITOps receiving subteam (or moved page), action: page V2→`I` move, banner removal, v1.0 promotion, intake assignee bake-in, close TPS-583 + RFC #2 review-status.
- [ ] **Cal session-22 wiki candidates (4) + session-21 carry (1).** 5 promotion-grade candidates: two-stage adoption pattern, `[speculative]` marker convention, Confluence create-perm-404 disguise, EntraID-not-WSO2 substrate-fact, in-memory-survives-`/clear`.
- [ ] **T06 Path-tree rewrite (Volta).** `topics/06-lifecycle.md` Path 1/2/2.5/3 decision tree needs rewrite for Agent-tool spawn (post-#60). Herald's `agent-spawn-protocol.md` defines the shapes each path uses; Volta's rewrite references them. T03/T06 boundary named clearly (Herald session-19 [LEARNED]): "protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when." **Session 21 addition:** also audit T06 lines 528 + 1025 for "DO NOT TeamDelete" assertions that contradict new shutdown S5 (#62 patch).
- [ ] **Cal: route in-memory-survives-`/clear` wiki candidate** (#62-derived, n=2 apex+FR) on next Cal spawn via Protocol A. Volta's session-21 [LEARNED] is the source — promotion-grade.
- [x] ~~Finn scratchpad prune (~190 lines → target 100)~~ — DONE this session, 129→98 lines, pointer block preserved.
- [ ] **Brunel: fix stale port 2224 in ruth-team container doc.** `docs/ruth-team-container-design-2026-04-15.md` has port 2224 but `deployments.md` already allocates entu-research:2224. 1-line fix, assign to Brunel on next ruth-team task.
- [ ] **Brunel: `tmux-spawn-guide.md` retirement decision** — currently banner-gated; Brunel's call on whether to delete outright. Parked DEFERRED per session 19.
- [ ] **Eratosthenes symmetric prompt edits — tmux-direct to Schliemann.** WITHDRAWN if Schliemann's apex shutdown persists. Preserved here only because the pattern (multi-mode-defenses + bootstrap-preamble-as-cross-tenant-channel wiki candidates) is substrate-independent — if revived under a new pilot, the structure carries forward.
- [ ] **Brunel n=2 watch.** Two RC-infra gotchas at n=1 watch posture: (a) `gh` not installed on RC host (only inside containers), (b) CRLF/LF reflow noise on apex-migration-research files (need `git diff -w` to evaluate "is diff substantive"). Promote to wiki on second sighting of either.

## META-LEARNINGS — carry forward

[LEARNED — session 20] **Path-depth transcription discipline on cross-pollination relays.** When relaying a structural example (path templates, code snippets, frontmatter schemas) from another team's wiki to ours, copy verbatim or include the on-disk path so the librarian can verify against source. Never paraphrase example bodies. Hit this turn: my relay of apex's `wiki-cross-link-convention` table compressed `../../../../decisions/...` (4 dots) to `../../../decisions/...` (3 dots). Cal caught it by using apex's actual on-disk values rather than trusting prose. Fix is mine, not Cal's: the protocol-A-relayer's responsibility is to transmit faithfully, not to shorten.

[LEARNED — session 20] **Multi-edit Read-before-Edit constraint requires per-message serialization.** Cal hit it 4 times today — queueing several Edits in parallel within one message only the first lands; each Edit invalidates the file's tracked-read-state. Librarian-side operational rule for now (Cal's scratchpad), n=1 librarian. If a future librarian replication or batch-wiki-edit agent hits the same shape, promotion-grade. Symmetric rule for me: when amending wiki entries via Cal, scope the request to one entry per message OR explicitly flag "serial edits expected."

[LEARNED — session 20] **`autossh -M 0` is necessary but not sufficient for Windows persistent bridges.** autossh treats child ssh exit code 127 as fatal and gives up — unrecoverable without external supervision. Pattern fix: wrap autossh itself in a retry loop (`while true; do autossh ... || true; sleep 10; done`) inside the wrapper script. Filed as wiki #46 amendment (5→6 components) same day.

[LEARNED — session 20] **Long-running Task Scheduler actions need wscript+VBS hidden launchers.** Direct invocation of bash.exe (or any console binary) under Win11 Task Scheduler with Windows Terminal as default console host opens a visible window that lingers for the action's lifetime. Filed as wiki #46 component #6.

[LEARNED — SEVERE, user-flagged, preserve verbatim] **§10 oscillation was substrate-speculation dressed as reasoning.** User's framing: *"the oscillation between you two was self-inflicted and you ran in circles, Brunel had couple of your self-corrections all the time enqueued and he again self-corrected against your self-corrections. so actually we don't have a clue about which result is correct."* The honest state: 7 revisions traded framings without either specialist doing the empirical check. Meta-discipline became a thing we performed INSTEAD of thinking. Fix: when the landing oscillates, ask *"what new evidence would settle this?"* — if the answer is "source-code read," it's outcome (c), not a reasoning problem. See wiki #44 meta-trap section.

[LEARNED] **integration-not-relay pattern (wiki #44)** — team-lead's job is integration, not relay. n=4 in one session (Tier 3 endorsement, schema-per-tenant snapshot-cite, Protocol D phantom-acceptance, §10 framing ask). Four-check discipline: walk-history-forward, pending-confirmation-vs-accepted, integration-not-relay, what-would-change-the-landing. Specialist-side complement: pre-fold consistency check (Brunel). Bidirectional integration checking.

[LEARNED] **Outcome (c) generalized definition** (Herald's sharpening): *"Outcome (c) is not 'we've thought about it enough,' it's 'we've exhausted what the current evidence can tell us and need new evidence.' The test is 'what new input would change the landing?'"* — applies across evidence types.

## STANDING DECISIONS

[DECISION — session 21] **#62 startup/shutdown patches adopted.** Steps 2/3/4 collapse to single `TeamDelete + TeamCreate + verify`; new Step S5 `TeamDelete()` after `git push`. Gotcha #3 updated, #4 added. Source: apex-research/Schliemann's #62, FR session-21 startup empirical confirmation (n=2 cross-team). T06 amendment (lines 528 + 1025 contradict new S5) batched with path-tree-rewrite chore, not new task.

[DECISION — session 20] **Cross-team wiki cross-references use GitHub URL form**, not repo-relative paths. Within our wiki, relative paths preserved (existing). For cross-team `related` frontmatter and prose links to apex/comms-dev/etc: default `https://github.com/<org>/<repo>/blob/main/<path>`; switch to `/blob/<sha>/<path>` when freezing a cross-cite is load-bearing (e.g., apex amends their entry and we want our cross-cite to remain literal to what we read). Path-depth assumptions (4-levels-deep math) hold within a team's wiki layout but break across teams' layouts. First applied on entry #50.

[DECISION — session 20] **Slow organic compliance for wiki-cross-link-convention** (entry #50), not a big-bang retrofit sweep. Apply on amendments going forward. Bare-text references in our existing 49 entries are suboptimal but not broken; Brunel's bandwidth stays on container-infra. Revisit only if a real query failure surfaces (reader can't find a referenced artifact) — that's the trigger to rethink, not aesthetics.

[DECISION — session 20] **Four single-entry frontmatter/structural experiments active under Cal's curation, all n=1, watch posture.** None promoted yet. If a second case requests the same shape, surface for hoist decision:

1. Amendment-log body section on #46 (windows-user-context-persistent-bridge)
2. `source-team` frontmatter field on #50 (wiki-cross-link-convention)
3. `provenance-closed` frontmatter field on #48 (live-inject-plus-dockerfile-bake-dual-track)
4. `amendments` frontmatter list on #50 (introduced incidentally during cross-team link form rewrite)

[DECISION] **xireactor-as-shared-KB (#59) parked standalone.** Counter-option preserved: Finn-style quarterly cross-team harvest passes (same info flow, markdown preserved). Pilot-eval proposal: 2 tenants (FR + apex-research) for 1 month cross-team traffic. Fits E-deployment pattern. Full team needed for ecosystem-integration session.

[DECISION] **E-deployment pattern** (CF Tunnel / hello-world-container) adopted as future target for ALL team deployments including migration. Near-term ruth-team = (B) co-located on `100.96.54.170`. Migration B→E is explicit future work — no dates. Ruth-team container MUST be portable.

[DECISION] **Sensitivity boundary** for ruth-team: `.gitignore` excludes `teams/*/sensitive/`. Patterns flow via Protocol A but generalize heavily — no direct quotes, no Jira tickets, Confluence titles, budget figures, or colleague names. Codename `ruth-team` acceptable inside FR only.

[DECISION] **Ruth-team: Brunel v1.0 accepted** at `docs/ruth-team-container-design-2026-04-15.md`. Build blocked on Monte §4.3 + Herald §5.3 open questions. Near-term channel = SSH + tmux pane.

[DECISION] **Protocol D naming ACCEPTED.** Herald v1.2.1 rename pass next session: (i) §2.2 introduce Protocol D, (ii) §5 mapping + §7 cross-refs, (iii) frontmatter note citing Monte Argument 1 (canonical taxonomy slot), (iv) `types/t09-protocols.ts` interface comments.

[DECISION] **Herald Q1/Q2 preconditions at outcome (c)/(c).** Both digest-silent, resolve via Finn source-code walkthrough only. Monte v3 §7.2 reclassification needs rework (built on retracted Herald v1.1 §A evidence). Compressed state: two design preconditions are empirical questions not yet answered; pilot-readiness honest-story = "two source-code walkthroughs + one deliverable."

## OPEN DESIGN QUESTIONS

- Cross-tenant URGENT-KNOWLEDGE routing authority (Monte/Herald future pass)
- MCP tool availability fallback: fail-closed (team-lead + Herald + Cal converged)
- §9.2 design probes: Tier 3 bounce-vs-escalate rejection format, structured-vs-free-text

## ACTIVE WIP

[WIP — session 21] **Cal wiki candidate held:** "in-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team (apex session 23 + FR session 21). Promotion-grade per Volta's n=2 criterion. Route on Cal's next spawn via Protocol A.

[WIP — session 20] **Three apex-research cross-pollination candidates from Finn's 2026-04-29 comparative analysis.** Status:

- ✅ `wiki-cross-link-convention` → filed as #50 with cross-team link form policy decision baked in.
- ⏸️ `adr-accepted-pending-prereqs-status` (three-state ADR flow) — parked, our ADR cadence is too light to bind on this. Revisit if we ever spin up an ADR practice.
- ⏸️ `silence-gap-helpdesk-vs-jira` (two-track prioritization) — parked, no helpdesk surface. Revisit if one materializes.

[WIP — session 20] **Brunel n=1 watch on two RC-infra gotchas.** `gh` not on RC host (only inside containers); CRLF/LF noise on apex-migration-research files (use `git diff -w` to evaluate diff substantiveness). Promote to wiki on second sighting of either. Carry forward into NEXT-SESSION-CHOREs.

[WIP] **Persist-coverage F/D split** (PO-approved 2026-04-14). Fix session: F1 jq filter extraction (Volta), F2 "memory"→"auto-memory" rename (Volta+Cal). Design session: D1-D7 full persist-coverage ship. Sources: `docs/persist-coverage-audit-2026-04-14.md` + `docs/uikit-dev-harvest-2026-04-14.md`.

[WIP] **Structural-discipline cluster Protocol C promotion.** 4 confirmed + 1 pending (Brunel's prompt-to-artifact cross-verification). Defer to session with Brunel spawned.

[WIP] **Cal wiki queue — 12 n=1 candidates held.** Full list in `memory/callimachus.md` session 14 [DECISION] block. Highest-watch: multi-mode-failure-multi-mechanism-defenses (possible n=2 with Volta's persist/restore), Bootstrap-preamble as cross-tenant channel (n=2 with existing #43, possible amendment not separate entry).

[WIP] **Cal post-freeze candidates from Finn harvest:** (1) Pane-labels gotcha addendum (root-cause confirmation, not n=2), (2) Memory-as-load-gated-surface pattern, (3) Wiki governance model split (project-handbook vs methodology-kb).

[WIP] **Aalto open questions** — 6 questions deferred (Finn Section D). Priority: Q1+Q4 highest (scaling evidence), Q6+Q3 medium, Q2+Q5 lower. Route subset via tmux-direct when next uikit-dev contact warranted.

[WIP] **Ruth-team observability gap.** Brunel's v1.0 is purely operational; dual-track (operational + research probe) needs Volta's §6.5 observability addendum. Gated on Ruth's Q2/Q3 answers — her answer reshapes telemetry surface ("weekly digest" ≠ "live interaction"). Do NOT wake Volta before Ruth responds.

[WIP] **Ruth-team: path (a) partial state.** Ruth received Teams relay, responded with one clarifier ("what is OKR?"), operator answered. Q1 (opt-in), Q2, Q3 still pending. Do NOT wake Celes/Volta speculatively — only after Q1 answer arrives.

## DEFERRED

- **Phase 2 Jira/GitFlow classification** — held pending PO reconciliation via dev-toolkit#43.
- **Discussion #56 actionable items:** Provider outage protocol (Monte, T04); Sidecar/peer framework (Brunel+Monte, T06); Contract enforcement (Herald); Platform/provider separation (Finn, T02).
- **Pass 2 filename rename** for `wiki/gotchas/persist-project-state-leaks-per-user-memory.md` — Cal inventoried 7 back-refs; ship as coordinated batch when warranted.
- **uikit-dev cross-team debt** — their `1deb90e` uses defective free-string jq pattern. Tmux-direct relay to Aalto deferred; bundle with Finn Section D questions.
- **MS Teams integration** (#57) + **Anthropic `/routines`** (#58) — ecosystem-integration bundle.
- **Timestamping convention** — promote to T03 + investigate cheaper implementation (auto-injection vs cached timestamp).
- **Team-lead prompt revision** — Celes design round (coordinator-only-by-conviction identity makes mechanical fix unsafe).
- **12-prompt broader scope-block audit** — Celes offered ~1h pass; not started.
- **Finn model inventory re-survey** (uikit-dev missing from baseline).
- **Celes assessment of Cal's first-day performance** (carried).

## CARRYOVERS

[DECISION] **Bioforge-dev team:** 4-character Cathedral-lite — Humboldt (TL/opus), Merian (RED/sonnet), Linnaeus (GREEN/sonnet), Cuvier (PURPLE/opus). Designed by Celes.
[DECISION] **"Cathedral-lite"** = Cathedral tier with ARCHITECT merged into team-lead. Valid for single-repo, single-language, single-pipeline projects.

## SESSION HISTORY (compressed)

**2026-04-30 (session 21):** #62 from apex-research/Schliemann assessed by Volta, patched, committed (`426194d`). startup.md Steps 2-4 collapse to single `TeamDelete + TeamCreate + verify`; new shutdown S5 `TeamDelete()` after `git push`. Gotcha #4 added (in-memory state survives `/clear`). Cross-team comment on #62 (`issuecomment-4350394024`) with FR-side n=2 confirmation. Wiki candidate held for Cal: "in-memory state survives `/clear`" (n=2 apex+FR). T06 amendment (lines 528 + 1025) batched with existing path-tree-rewrite chore. This shutdown is first to use new S5 — dogfooding the patch.

**2026-04-29 (session 20):** #61 validation passed empirically (Cal). Tunnel persistence work in apex-migration-research repo (3 commits + 1 PR-merge): supervisor-of-supervisor loop (`183de33`), wscript hidden launcher (`8edc230`), Chromium runtime deps Dockerfile bake (`9ddfb10`), operator env-var PR #115 merged (`049f766e`). RC clone fresh-cloned (Brunel triage). Apex-research comparative analysis (Finn) → `docs/apex-research-comparison-2026-04-29.md`. Wiki 45→50: #46 windows-bridge (5→6 amend), #47 cross-msys-argv, #48 dual-track, #49 ai-teams-sudo, #50 wiki-cross-link-convention (first cross-pollination filing). Cross-team link form policy adopted. 4 single-entry frontmatter experiments active under Cal.

**2026-04-24 (session 19):** #60 + #61 closed, xireactor dropped. #60 retired tmux-pane spawn (Herald `agent-spawn-protocol.md` v2.0.0 + Brunel cross-repo gating). #61 moved `.claude/teams/` → `teams/` (commit `7e72771`, 258 files). Wiki #45→#47: warp-dns-vs-routing-asymmetry-rc-host (#46), rc-host-db-tunnel-architecture (#47, first `references/` entry). Cross-team unblock: apex-research DB tunnel via reverse SSH from Windows operator (script `c79b838` in apex repo).

**2026-04-15 late-eve:** Xireactor pilot design pass. 4 agents (Brunel+Monte+Herald+Cal). 4 design docs shipped. Three-specialist convergence on asymmetric cross-tenant-only shape. Wiki 43→45 (#44 integration-not-relay at n=6+, #45 substrate-invariant-mismatch at n=3). Protocol D naming accepted. Frozen design state at `memory/xireactor-pilot-design-state-2026-04-15.md`.

**2026-04-15 afternoon:** Ruth-team genesis. Brunel v1.0 accepted. #57+#58 filed. Sensitivity boundary adopted. Ruth relay sent via Teams. Key LEARNEDs: thin-digital-footprint ≠ low-output, implicit-cross-team-contracts, sensitivity-boundary-via-gitignore.

**2026-04-14 eve + 2026-04-15 morning:** Jira/GitFlow assessment. Wiki 38→39 (#39 scope-block-drift). dev-toolkit#43 issue filed. Finn+Brunel prompts fixed by Celes. Team-lead prompt revision deferred.

**2026-04-14 midday:** Cleanup + Volta audit + Finn uikit-dev harvest. Wiki 37→38. Persist-coverage F/D split. [WARNING] team-lead coordinator-only discipline slipped pre-spawn — spawn-before-act even for cheap one-offs.

**2026-04-13 afternoon:** Oracle→Librarian Phase 1+2. Wiki 20→28. Commits `04522c7`+`ca0e56f`. Eratosthenes v2.7.1 live on apex-research. Phase 2 directive tmux-direct to Schliemann.

**Prior (2026-04-09 through 2026-04-10):** Cal bootstrap, raamatukoi-dev designed+deployed, bioforge-dev Cathedral-lite roster, Discussion #56 (wiki 4→20).

## SCRATCHPAD HYGIENE (adopted 2026-04-16 on Cal's advisory)

1. **Active vs frozen:** frozen design state → sibling archive files; scratchpad = active state only.
2. **Strike-through vN-1:** when specialist ships vN, strike prior vN-1 refs in-place rather than appending both.
3. **Wiki-candidate routing collapses sources:** when sending candidate to Cal at n=X, collapse source instances in scratchpad in same batch.
4. **[DECISION] vs [LEARNED] retention:** DECISIONs stay (standing rules). LEARNEDs collapse after wiki promotion.
5. **CHOREs top-of-file:** all NEXT-SESSION-CHOREs in dedicated block under NEXT SESSION, not buried inline.
6. **Tree-form tags, not session-log prose:** `[TAG] claim + why + applies-to-future`, not "and then we did X."
7. **2-session staleness check on n=1 wiki candidates:** if LEARNED hasn't reached promotion in 2 sessions, re-evaluate pattern reality.
