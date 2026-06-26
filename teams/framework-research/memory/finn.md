# Finn's Scratchpad -- framework-research

## [INDEX] Reference material

- `reference/rc-team/cloudflare-builders/` -- original RC team (11 agents)
- `reference/hr-devs/` -- evolved project team (9 agents)
- `topics/` -- 8 design topic files + T09 development methodology
- `designs/` -- deployed: apex-research; new: penrose-dev, screenwerk, raamatukoi-dev, backlog-triage

## [PATTERN] Compact -- retained from earlier sessions

- rc-team vs hr-devs: spawning (Agent tool vs spawn_member.sh), memory (flat vs +docs/), startup (hr-devs canonical), Medici (hr-devs more detailed)
- Team sizing: size = number of distinct abstraction boundaries, not deliverables
- Multi-Round Consensus: Seed → R1 binary → R2-3 refinement → R4 PO → R5 synthesis → R6 ACK (T09)
- docs/ vs topics/: `topics/*.md` = framework design (T01-T09); `docs/*.md` = external assessments, harvests, one-shot research
- Cal reclassifies: gotchas = traps to avoid; patterns = techniques to apply
- Cross-team harvest envelope: narrow brief + strict read-only; quarterly + on-demand cadence
- OSS-repo structural-survey: 6-section digest template; read top-level docs first, stop early, never source files unless dir listing insufficient
- Role-boundary discipline: when brief is ambiguous on AGENCY, default to role-boundary constraint and flag
- Soft-verdict discipline: substrate-mapping brief → table of N options x {accommodates/additive/replacement}, not "recommended" verdict
- Cross-repo glance: confirm the citation before assuming inheritance (domain-language collisions common)
- Pre-scaling baseline: structurally near-zero at n=1 team; push back, measure post-scaling

## [LEARNED] Operational rules -- active

- **Read-before-Edit:** Read in same or immediately-prior tool-call batch as Edit. Don't trust Read-state to survive across rounds. (n=5 personal, wiki entry 116 filed)
- **Layer-0 library-first PRE-DRAFT:** When generating design content about external substrate, load canonical-library skill BEFORE the design-content write. (wiki entry 119 filed)
- **Inverted-trigger antipattern:** On poll-based substrates, design state-write-as-wake, not push-as-wake. Discriminator: does substrate dial into worker's network across network boundary? (wiki entry 120 filed)
- **Co-source-agent role:** Research coordinator role substantively shapes design output + co-authors wiki entries with Cal. Track for prompt-update at next Celes review.
- **Stage-2 author-side correction chaining:** When post-submission data broadens the mechanism, surface pre-filing -- even if Cal accepted prior correction. Direct-DM channel for high-iteration-density chains.
- **Cadence-cross posture:** File my framing cleanly, let Cal reconcile parallel-routed overlapping framings from other agents.

## [CHECKPOINT] Discussion #56 -- single-provider -- PAUSED at R2

Three open items: unavailability protocol, platform-vs-provider, cost data.

## [CHECKPOINT] Shipped-archive (S26/S36) -- all in docs/, do not re-surface unprompted

S26 Phase A: `docs/2026-05-05-phase-a/` (dedup-census, cross-team-query-frequency, handoff-brief; 3 optional tasks parked). S36: webhook-sandbox-research, herald-g2-cross-agent-comms-brief, wake-mechanism-w4-finding, round-1-anthropic-platform-checklist (all dated 2026-05-26 in docs/).

## [WATCHPOINT] auto-restoration-silently-overrides-explicit-state -- n=2, watching for n=3

Instance 1: Edit-tool harness Write auto-restores file-state, overrides Read-state. Instance 2: Anthropic SDK auto-restores ANTHROPIC_API_KEY from process.env, overrides explicit authToken. Candidates: W3a (CF Worker env auto-binding), W3b (AWS/GCP SDK auto-credentials), W3c (git config --system vs --local). Ping me if any team member surfaces a match.

## [DEFERRED] Open questions (consolidated)

- Polyphony roster redesign -- awaiting PO approval
- #56: cost data + unavailability protocol (paused at R2)
- 6 Aalto questions from uikit-dev harvest -- wait for next natural contact (Q1+Q4 > Q6+Q3 > Q2+Q5)
- Jira/GitFlow Phase 2 classification -- HELD pending PO reconciliation
- Cal Protocol A on `wiki-cross-link-convention` from apex -- team-lead's call
- `prompts/finn.md` co-source-agent role-expansion -- pending Celes review cycle

## [CHECKPOINT S39 2026-06-02] Session complete

**Task 1 -- Stage 2 read-backs (4/4 complete, 0 corrections):**
Cal ACK'd all four. Wiki 112, 116, 119, 120 confirmed production-grade from joint-author vantage.

**Task 2 -- Team OS article digest:**
- Assessment digest: `docs/team-os-context-mgmt-digest-2026-06-02.md` (~1400 words, 7 sections)
- Extraction pass: 12 transferable mechanisms sent to Aen as brainstorm (not persisted as doc)
- Key findings: Protocol A already serves as format-enforcer skill analog; plan persistence is a real gap; wiki three-tier split premature at n=30; playbook-vs-pattern is a genuine category distinction; their biggest blind spot (no inter-agent coordination) is our biggest strength
- 3 Cal candidates assessed (all scratchpad-grade, none wiki-grade): file-pointer-over-message-body, navigation-index CLAUDE.md, single-vs-multi-agent design families
- Article caveat: thinner on implementation specifics than it appears -- conceptual architecture guide, not implementation cookbook

**Carry-forward for next session:**
- PRE-DRAFT/POST-DRAFT sibling pair filing when HOLD releases
- W3a/W3b/W3c auto-restoration meta-pattern n=3 watchpoint
- Role-evolution prompt-update queued for Celes
- `prompts/finn.md` co-source-agent role-expansion still pending
- Aen's response on Team OS extraction mechanisms (which to pursue / Cal candidates to file) -- may have landed before next spawn

## [CHECKPOINT S44 2026-06-06] Entu consultant-agents grounding -- SHIPPED (pruned)

Digests in docs/: `2026-06-06-entu-consultant-grounding-digest.md` + `2026-06-06-data-lifecycle-competency-harvest.md` (18 filed claims C1-C18, 16 backed/2 partial; folded to designs/new/entu-consultant-agents/). Durable grounding facts live IN those docs -- read there, don't re-derive. Key recall hooks: entu/api=Nitro file-router not src/api; _sharing=create-time-only no post-creation propagation; no bulk API; verification methods = FIVE (probe/live-audit/src-read/spec-cite/maintainer), mix per claim + can disagree -> per-evidence stance field.

## [CHECKPOINT S59 2026-06-26] apex #176 contamination-recovery eval -- COMPLETE

Evaluated apex-research two-mode (A grep-sweep / B truth-tree) contamination-recovery procedure for their Q1. Artifacts (GitHub main = truth): playbook `teams/apex-research/playbooks/contamination-recovery.md`, `inventory/dokosign-battle-test-report.md`, Discussion #176.
- **Verdict:** SOUND recovery mechanism, OVERCLAIMED coverage. A+B covers only keyword-anchored + provenance-linked inference; preconditions unstated; empty quadrant = keywordless-AND-orphan; NO detection arm.
- **10 failure modes F1-F10 + 8 fixes** delivered to team-lead. Killer evidence: apex's own S60 found 5 residuals AFTER S59 ran the "thorough" procedure -> can't self-certify; Rein (human) caught the original, not the procedure.
- **Lesson 1 FILED Protocol A** -> Cal wiki #158 `wiki/patterns/detection-is-upstream-of-recovery.md`. pattern, observation-based (n+1 raises confidence), cross-team, high. Stage-2 CONFIRMED (read-back faithful, 0 corrections). Principle: detection structurally upstream of recovery; recovery-without-detection = dominant contamination risk at scale; belongs in observability/knowledge-health. Mechanisms: re-grounding sweeps, claim-aging audits, provenance-coverage tracking.

## [GOTCHA S44] Stale task_assignment replays -- verify status before acting

Twice this session a `task_assignment` for an already-completed task (#1, #5) arrived as a structured message with the ORIGINAL assign-timestamp (12:34 / 14:17), surfacing LATE -- not new scope. Pattern: on any task_assignment, TaskGet first; if status=completed and the timestamp predates your completion, it's a replay → send a no-op confirmation (per requirement-ack discipline, so it's not read as silent absorption), do NOT redo. Also: messages cross in flight (Cal's asks, team-lead's line-10 fix both arrived after I'd already answered) -- check timestamps before assuming a request is new.

(*FR:Finn*)
