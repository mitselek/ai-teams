# Finn's Scratchpad — framework-research

## [INDEX] 2026-03-13 — Reference material

- `reference/rc-team/cloudflare-builders/` — original RC team (11 agents, rc-oriented, tmux/SSH based)
  - common-prompt.md, eilama-concept.md, 11 agent prompts, 10 memory files
- `reference/hr-devs/` — evolved project team (9 agents, local + RC hybrid)
  - common-prompt.md, eilama-concept.md, 9 agent prompts, 7 memory files
  - docs/: startup-shutdown.md, tmux-layouts.md, api-contracts.md, architecture-decisions.md, health-report.md, test-gaps.md
  - spawn_member.sh (shell-based spawning, reads roster)
- `topics/` — 8 design topic files, all populated with patterns
- `README.md` — mission overview, topic table, context

## [PATTERN] Key differences between rc-team and hr-devs

1. **Spawning:** rc-team uses Agent tool; hr-devs uses `spawn_member.sh` (shell, reads roster)
2. **Memory layout:** rc-team: flat `memory/`; hr-devs: `memory/` + `docs/` — cleaner separation
3. **Startup:** hr-devs has canonical `docs/startup-shutdown.md`; rc-team inlines in common-prompt.md
4. **Medici:** hr-devs has more detailed audit checklist (6 categories vs implied)
5. **Attribution:** rc-team `(*RC-DEV:Name*)`; hr-devs same (not yet updated)

## [CHECKPOINT] 2026-03-23 — Penrose dev team design — COMPLETE

Research report delivered, then reviewed Celes's final design at `designs/new/penrose-dev/`.
Final team: 6 agents, ALL opus (team-lead, shechtman/test, ammann/geometry, bruijn/simulation, escher/renderer, penrose/reviewer).
Celes chose math-historian names and added a code reviewer role (penrose).

Review found 14 issues, all HIGH/MEDIUM resolved in final pass. Package approved for deployment.

## [LEARNED] Team-lead self-check pattern

penrose-dev team-lead.md introduced a "SELF-CHECK: Am I Doing The Work Myself?" section with explicit FORBIDDEN/ALLOWED tool lists. Strong pattern for preventing team-lead scope creep — worth adopting in future team designs.

## [GOTCHA] TAU constant in Penrose project

TAU = 1/PHI ≈ 0.618 (golden ratio reciprocal), NOT 2π. This is project-specific naming that conflicts with the common math convention.

## [PATTERN] Team sizing heuristic

- comms-dev: 4+lead for crypto+transport+QA — domain split by security boundary
- backlog-triage: 3+lead for pipeline — one agent per pipeline stage
- penrose-dev (proposed): 4+lead for math+sim+render+test — domain split by abstraction layer
- Pattern: team size = number of distinct abstraction boundaries, not number of deliverables

## [LEARNED] 2026-04-09 — Round 1 tone-setting for multi-round RFCs

Celes's closing note on the T09 cluster: "Your round 1 response on #46 set the tone by making binary claims and defending them — 'PURPLE is a distinct role, not a reviewer variant.' That gave everyone else permission to push back instead of synthesizing prematurely. If round 1 had been cautious, rounds 2-5 would have produced a weaker document."

**Pattern:** When seeding a multi-round RFC, round 1 should make *binary, defensible claims* rather than cautious, hedged analyses. Cautious round 1 → cautious round 2 → weak synthesis. Sharp round 1 → agents feel safe to push back → genuine convergence emerges in rounds 3-4.

Apply this to: any future RFC seed or round 1 participation on contested framework questions.

## [PATTERN] 2026-04-09 — Multi-Round Consensus Protocol exists

Celes documented the protocol used in #46/#47 as a reusable T09 section (commit c59bc76). Process: seed → round 1 binary claims → round 2-3 refinement → round 4 PO refinements/corrections/head-scratchers → round 5 synthesis-then-ACK-request → round 6 binary ACK options (accurate / diverges+issue / accurate+forward-issue). Works for framework questions where multiple specialists have valid-but-divergent positions.

## [CHECKPOINT] 2026-04-09 — T09 cluster closed (6 of 6 ACKs)

Final cluster stats: 5× Option 1, 1× Option 3 (Volta filed #48 Oracle tier downgrade path). Zero position divergences. T09 v2 committed at c59bc76. My 10 contributions all rendered correctly. L2.5 dropped per my resolution request. Standard-tier adoption cost data (304/35/12/30) cited verbatim as reference-team evidence.

## [CHECKPOINT] 2026-04-09 — Round 4 state + T09 synthesis reactions

**Round 4 state:** PO posted round 4 on both #46 and #47 with head-scratchers. All agents responded. Celes then synthesized everything into `topics/09-development-methodology.md` (795 lines) and seeded round 5 on both discussions, asking me specific questions.

**Reading the synthesis — what's faithful to my RFC:**

- "Knowledge loss happens at propagation, not discovery" quoted verbatim (Part 2 opening)
- Three-tier axis (consequence of structural debt, not longevity) adopted with credit
- Knowledge velocity metric preserved in Part 3 cross-system section
- TTL for external systems (my round 3 contribution) in Part 2
- "Don't migrate — index" spirit captured in Bootstrapping
- My "single-pipeline = same-agent ARCHITECT+PURPLE" position preserved as valid alternative (line 129)

**Celes's three specific questions to me:**

1. **ARCHITECT idle time model.** Herald's batched-feedback model is in Part 1 (ARCHITECT goes idle during cycles, reactivates at CYCLE_COMPLETE). My read: this DOES match my intent. My original RFC never gave ARCHITECT a per-PURPLE_VERDICT review role — that would make ARCHITECT a second reviewer, defeating the point. ARCHITECT should reactivate only on 3-strike escalation (Monte's judicial model) or CYCLE_COMPLETE quality notes. Otherwise idle. **Endorse as-is.**

2. **Sprint-tier floor.** Her question: is there a simpler tier than RED+GREEN? My answer: **NO.** TDD pair IS the floor. Below a pair is "just a developer writing tests and code simultaneously" — which is the exact mode we invented TDD to escape. Sprint-tier disposable code still benefits from RED→GREEN discipline because the pair forces explicit thinking-before-coding. What Sprint DROPS is structural quality (PURPLE) and architectural decomposition (ARCHITECT). But the basic failing-test-before-code loop is non-negotiable.

3. **My three-tier axis + knowledge velocity metric** — both captured. Verify she got the spirit right. **She did.**

**Drift to flag:**

- Part 1 line 68 calls ARCHITECT "L2.5 new governance level" (Monte's framing). My RFC had ARCHITECT as Spec Writer specialization. Celes reconciles both on line 78 ("specialization of Spec Writer"). Subtle tension — either it's a new canonical level or it's a specialization, not both. I'll let Monte defend L2.5; the ROLE is captured correctly.
- Part 2 Standard tier adoption cost ("minutes, not hours" for team-lead-as-Librarian curation at shutdown) — Celes asks me for reference data. I have it: counted ~35 team-wide entries across 6 reference scratchpads = ~12 wiki pages. Shutdown curation for that volume IS minutes, not hours. Endorse.

**Open questions Part 4:**

- Research team wiki domain (#14) — I weigh in: Celes's compromise (common-prompt for stable process, wiki/process/ for emerging) is the right answer. Add my support.
- Mid-cycle PURPLE shutdown — not my domain, defer to Volta.
- Oracle evolution path — my answer: intake interview is correct, and the cost is a feature not a bug. Teams that can't justify 10 minutes of intake per agent don't need the Oracle.

## [CHECKPOINT] 2026-04-09 — Discussion #47 Round 3 Response — POSTED

<https://github.com/mitselek/ai-teams/discussions/47#discussioncomment-16500125>
Synthesized all 6 agents' positions across 3 rounds. Key contributions:

- Convergence table (8 settled decisions) + divergence table (2 open questions)
- Bootstrap: 3-phase (inventory→approve→build), Librarian proposes, lead approves. "Don't migrate — index."
- Expiry: 3 mechanisms (source linking, TTL for experience-grounded, access tracking). PURPLE + Librarian complementary.
- Health sensor: knowledge velocity metric (discovery-to-warning ratio across sessions)
- New: TTL on experience-grounded entries (external APIs have no source files to diff)
- Connected #46 XP pipeline to #47 knowledge base (ARCHITECT/PURPLE as knowledge-generating roles)

## [CHECKPOINT] 2026-04-08 — Knowledge Base RFC Discussion — POSTED

GitHub Discussion #47: <https://github.com/mitselek/ai-teams/discussions/47>
"RFC: Shared Knowledge Base and Librarian Agent for Team Memory" — Ideas category
Inspired by Karpathy's LLM Wiki pattern. Covers: 4-tier knowledge architecture analysis, knowledge loss evidence table,
Librarian concept (ingest/cross-ref/dedup/promote/prune/index/query), wiki/ directory structure, knowledge flow diagram.
8 open questions. Tagged Herald + Celes. Key insight: knowledge loss happens at propagation, not discovery.

## [CHECKPOINT] 2026-04-08 — XP Pipeline RFC Discussion — POSTED

GitHub Discussion #46: <https://github.com/mitselek/ai-teams/discussions/46>
"RFC: XP Development Pipeline for AI Agent Teams" — Ideas category
Covers: background (weak REFACTOR phase), 3 research options (A/B/C), PO's pipeline model (Architect→RED→GREEN→PURPLE), open questions (6).
Tagged for Herald + Celes input. No topic file changes.

## [CHECKPOINT] 2026-04-06 — XP Triples Research — COMPLETE

Research report delivered to team-lead. Key findings:

- REFACTOR is the weakest phase across all current teams (vague ownership)
- Three options analyzed: Refactorer (A), Reviewer (B), Rotating (C)
- Recommended Option B: Tester + Developer(+REFACTOR) + Reviewer
- penrose-dev (Shechtman→Implementers→Penrose) is the closest existing pattern
- Reviewer should be formalized as 7th canonical role in T01
- Reviewer can be shared across 2-3 TDD pairs (Marcus pattern)
- Communication: RED→GREEN→REVIEW with [COORDINATION] and [REVIEW] tags

## [DEFERRED] Open questions

- Polyphony team roster redesign — Celes delivered package, awaiting PO approval
- Entu: no server-side code repo studied (only API spec + client code)

(*FR:Finn*)
