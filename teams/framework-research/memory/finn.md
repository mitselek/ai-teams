# Finn's Scratchpad — framework-research

## [INDEX] Reference material

- `reference/rc-team/cloudflare-builders/` — original RC team (11 agents)
- `reference/hr-devs/` — evolved project team (9 agents)
- `topics/` — 8 design topic files + T09 development methodology
- `designs/` — deployed: apex-research; new: penrose-dev, screenwerk, raamatukoi-dev, backlog-triage

## [PATTERN] Compact — retained from earlier sessions

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

## [LEARNED] Operational rules — active

- **Read-before-Edit:** Read in same or immediately-prior tool-call batch as Edit. Don't trust Read-state to survive across rounds. (n=5 personal, wiki entry 116 filed)
- **Layer-0 library-first PRE-DRAFT:** When generating design content about external substrate, load canonical-library skill BEFORE the design-content write. (wiki entry 119 filed)
- **Inverted-trigger antipattern:** On poll-based substrates, design state-write-as-wake, not push-as-wake. Discriminator: does substrate dial into worker's network across network boundary? (wiki entry 120 filed)
- **Co-source-agent role:** Research coordinator role substantively shapes design output + co-authors wiki entries with Cal. Track for prompt-update at next Celes review.
- **Stage-2 author-side correction chaining:** When post-submission data broadens the mechanism, surface pre-filing — even if Cal accepted prior correction. Direct-DM channel for high-iteration-density chains.
- **Cadence-cross posture:** File my framing cleanly, let Cal reconcile parallel-routed overlapping framings from other agents.

## [CHECKPOINT] Discussion #56 — single-provider — PAUSED at R2

Three open items: unavailability protocol, platform-vs-provider, cost data.

## [CHECKPOINT] Phase A research (S26) — shipped, architecture team pending

Deliverables in `docs/2026-05-05-phase-a/`: dedup-census, cross-team-query-frequency, handoff-brief. Three optional tasks parked (do not re-surface unprompted).

## [CHECKPOINT] S36 deliverables — shipped

- `docs/webhook-sandbox-research-2026-05-26.md` (Task #6)
- `docs/herald-g2-cross-agent-comms-brief-2026-05-26.md`
- `docs/wake-mechanism-w4-finding-2026-05-26.md` (Hopper Task #11)
- `docs/round-1-anthropic-platform-checklist-2026-05-26.md` (Surface-1)

## [WATCHPOINT] auto-restoration-silently-overrides-explicit-state — n=2, watching for n=3

Instance 1: Edit-tool harness Write auto-restores file-state, overrides Read-state. Instance 2: Anthropic SDK auto-restores ANTHROPIC_API_KEY from process.env, overrides explicit authToken. Candidates: W3a (CF Worker env auto-binding), W3b (AWS/GCP SDK auto-credentials), W3c (git config --system vs --local). Ping me if any team member surfaces a match.

## [DEFERRED] Open questions (consolidated)

- Polyphony roster redesign — awaiting PO approval
- #56: cost data + unavailability protocol (paused at R2)
- 6 Aalto questions from uikit-dev harvest — wait for next natural contact (Q1+Q4 > Q6+Q3 > Q2+Q5)
- Jira/GitFlow Phase 2 classification — HELD pending PO reconciliation
- Cal Protocol A on `wiki-cross-link-convention` from apex — team-lead's call
- `prompts/finn.md` co-source-agent role-expansion — pending Celes review cycle

## [CHECKPOINT S39 2026-06-02] Session complete

**Task 1 — Stage 2 read-backs (4/4 complete, 0 corrections):**
Cal ACK'd all four. Wiki 112, 116, 119, 120 confirmed production-grade from joint-author vantage.

**Task 2 — Team OS article digest:**
- Assessment digest: `docs/team-os-context-mgmt-digest-2026-06-02.md` (~1400 words, 7 sections)
- Extraction pass: 12 transferable mechanisms sent to Aen as brainstorm (not persisted as doc)
- Key findings: Protocol A already serves as format-enforcer skill analog; plan persistence is a real gap; wiki three-tier split premature at n=30; playbook-vs-pattern is a genuine category distinction; their biggest blind spot (no inter-agent coordination) is our biggest strength
- 3 Cal candidates assessed (all scratchpad-grade, none wiki-grade): file-pointer-over-message-body, navigation-index CLAUDE.md, single-vs-multi-agent design families
- Article caveat: thinner on implementation specifics than it appears — conceptual architecture guide, not implementation cookbook

**Carry-forward for next session:**
- PRE-DRAFT/POST-DRAFT sibling pair filing when HOLD releases
- W3a/W3b/W3c auto-restoration meta-pattern n=3 watchpoint
- Role-evolution prompt-update queued for Celes
- `prompts/finn.md` co-source-agent role-expansion still pending
- Aen's response on Team OS extraction mechanisms (which to pursue / Cal candidates to file) — may have landed before next spawn

## [CHECKPOINT S44 2026-06-06] Entu consultant-agents grounding — Task #1 SHIPPED

Digest: `docs/2026-06-06-entu-consultant-grounding-digest.md` (5 sections + cross-cutting).
Key grounding facts (don't re-derive):
- entu/api = Nitro file-router (`routes/`, `utils/`), NOT `src/api/*`. `src/api/*` = entu/www docs paths. main branch.
- `_sharing` truth: create-time `inheritParentProperties` copies parent public/domain to child (escalate-only); ZERO post-creation propagation. Handbook §1.5 slightly over-absolute vs code — both clauses needed.
- No bulk API (single-{id} routes only). POST appends; DELETE soft-deletes. JWT IP-bound, 12h-vs-48h in-repo discrepancy.
- Formula: single-hop confirmed in code (strParts===3); rights-bypass confirmed (direct private.* projection, no access filter).
- mvox behaviour notes location: `mvox-dev/mvox_v4e_web` repo, `docs/migration/findings/*.md` + `entu-schema-mutation-handbook.md` (§1.5 = canonical mental model, mirrored to Brilliant `Resources/mvox/entu-schema-mutation-handbook`). NOT under teams/mvox-dev/.
- Evidence FORMAT: Title+date / Probe-script / Result-artifact-json / Architecture-decisions-commit / Question / Setup / STEP|OP|RESULT table / Conclusions / Gotchas / (*MVOX:author*). Three strength tiers: live-probe / live-audit / handbook-asserted.
- PoC: Finn=API/docs-verify, Pérotin=live-probes. Client=esmuseum #41. Backflow=www PR#11(9 issues)+#13(_sharing)+api#41(date wire). All 3 still OPEN.
- Live discrepancies for gap-loop examples: JWT 12h/48h; date YYYY-MM-DD vs ISO; **DELETE/property "removes from S3" — FALSE, code has no S3 call (file-property-wire-shape note, UNFILED = a live gap-loop output)**. Three confirmed doc↔code discrepancies.
- **Verification methods = FIVE, not 3** (answered Cal ask-2): live-probe+artifact, LIVE-AUDIT (probe over real prod data), src-read (can OVERRIDE openapi), spec-cite (weakest/can be wrong), MAINTAINER-AUTHORITATIVE (Argo + source file:line = apex). Methods MIX per claim + can DISAGREE → told Cal: per-evidence stance field (confirms|contradicts|supersedes) + claim-level derived confidence (lattice not enum). Dist ~50% probe, ~25% live-audit, rest spec/src, maintainer on auth/keys.

## [CHECKPOINT S44 2026-06-06] Task #5 — data-lifecycle harvest SHIPPED

Digest: `docs/2026-06-06-data-lifecycle-competency-harvest.md`. 18 FILED claims (**16 backed / 2 partial** — C12, C16), schema-conformant to Cal's entu-competency-index-schema.md. (Header originally miscounted as 13/3/2 — Celes caught it via YAML parse; fixed 18:13. The 2 unverified G3/G4 are unfiled gaps, NOT among the 18.)
- C1-C18 cover: POST-appends, soft-delete, no-bulk, _sharing 2-clause (C4/C5), _sharing enum, rights-cascade (live-audit), type-vs-instance inheritrights, formula-values-no-id (C9)+persisted (C10), formula-not-writable, touch-save, .string= exact/NFC, q= substring, pagination offset+count, limit default 100, multi-value-append-trap, prop-DEF-deleted-via-entity-endpoint (C18, /property 404s on defs).
- 4 FLAGGED GAPS (consult-on-gaps candidates): G1 touch-save-recompute (unobserved), G2 limit-cap-at-scale (only to 1000), G3 inheritrights-create-default-source (code reads PARENT not TYPE — unresolved), G4 rate-limiting (absence-of-evidence only). G3/G4 deliberately NOT filed as claims (would be over-claim).
- Routed cross-domain: api-key-expiry→auth (JWT 12/48h disputed/apex example); file-property S3-orphan→files/data-lifecycle author (src>docs precedence example).
- Excluded 8 project-specific migration logs (member IDs, type names, ISBN) as non-generalizable. Honesty gate held.
- Celes folds into designs/new/entu-consultant-agents/data-lifecycle/competencies.yaml; Cal schema-checks.

(*FR:Finn*)
