# Finn's Scratchpad -- framework-research

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S60 closed. PO-team precedent research shipped + tmux-drive second pass shipped; coordinated with Herald; Aen confirmed nothing outstanding.
- **Active items:** none blocking. Possible synthesis review pending Celes's PO-team prompt files.
- **Key decisions this session:** PO chose LITERAL tmux driving (I retracted my first-pass "no precedent" claim -- prior art IS strong, Hopper WS3b probe = proof). tmux>screen. Herald folded all 3 reinforcements into protocols.md.
- **Carry-forward:** DEFERRED -- capture-pane DIALOG sentinel token = acceptance-test deliverable (needs live session, not repo-derivable); hand to Herald §1.3 when a probe runs. Older DEFERRED queue below (line ~40). WATCHPOINT auto-restoration n=2.

---
## Session transcript (prune beyond line 100)

## [INDEX] Reference material
- `reference/rc-team/cloudflare-builders/` -- original RC team (11 agents); `reference/hr-devs/` -- evolved project team (9 agents)
- `topics/` -- 8 design topic files + T09 dev methodology + T10 guild + T11 deploy-lifecycle
- `designs/` -- deployed: apex-research, bigbook-dev, esl-legal, mvox, operator-role; new: penrose, screenwerk, raamatukoi, backlog-triage, po-team
- `designs/new/po-team/` -- research-precedent.md (mine, §1-6), protocols.md (Herald)

## [PATTERN] Compact -- retained from earlier sessions
- rc-team vs hr-devs: spawning (Agent tool vs spawn_member.sh), memory (flat vs +docs/), startup (hr-devs canonical), Medici (hr-devs more detailed)
- Team sizing: size = number of distinct abstraction boundaries, not deliverables
- Multi-Round Consensus: Seed → R1 binary → R2-3 refinement → R4 PO → R5 synthesis → R6 ACK (T09)
- docs/ vs topics/: `topics/*.md` = framework design (T01-T11); `docs/*.md` = external assessments, harvests, one-shot research
- Cal reclassifies: gotchas = traps to avoid; patterns = techniques to apply
- Cross-team harvest envelope: narrow brief + strict read-only; quarterly + on-demand cadence
- OSS-repo structural-survey: 6-section digest template; read top-level docs first, stop early, never source files unless dir listing insufficient
- Role-boundary discipline: when brief ambiguous on AGENCY, default to role-boundary constraint and flag
- Soft-verdict discipline: substrate-mapping brief → table of N options x {accommodates/additive/replacement}, not "recommended" verdict
- Cross-repo glance: confirm the citation before assuming inheritance (domain-language collisions common)
- Pre-scaling baseline: structurally near-zero at n=1 team; push back, measure post-scaling

## [LEARNED] Operational rules -- active
- **Read-before-Edit:** Read in same or immediately-prior tool-call batch as Edit. Don't trust Read-state across rounds. (wiki 116)
- **Layer-0 library-first PRE-DRAFT:** load canonical-library skill BEFORE design-content write about external substrate. (wiki 119)
- **Inverted-trigger antipattern:** on poll-based substrates, design state-write-as-wake not push-as-wake. (wiki 120)
- **Co-source-agent role:** research coordinator substantively shapes design output + co-authors wiki entries with Cal.
- **Stage-2 author-side correction chaining:** post-submission data broadening mechanism -> surface pre-filing even if Cal accepted prior correction.
- **Retract-with-correction:** when a prior finding is falsified by new evidence (S60 "no precedent" → strong precedent), explicitly RETRACT + correct in the doc, don't silently overwrite. Aen flagged this as exactly right.

## [WATCHPOINT] auto-restoration-silently-overrides-explicit-state -- n=2, watching for n=3
Instance 1: Edit-tool harness auto-restores file-state over Read-state. Instance 2: Anthropic SDK auto-restores ANTHROPIC_API_KEY from process.env over explicit authToken. Candidates: W3a (CF Worker env auto-binding), W3b (AWS/GCP SDK auto-creds), W3c (git config --system vs --local). Ping me if a member surfaces a match.

## [DEFERRED] Open questions (consolidated)
- Polyphony roster redesign -- awaiting PO approval
- #56: cost data + unavailability protocol (paused at R2)
- 6 Aalto questions from uikit-dev harvest -- wait for next natural contact (Q1+Q4 > Q6+Q3 > Q2+Q5)
- Jira/GitFlow Phase 2 classification -- HELD pending PO reconciliation
- `prompts/finn.md` co-source-agent role-expansion -- pending Celes review cycle

## [CHECKPOINT S39] Team OS digest -- SHIPPED (pruned; durable content in docs/)
`docs/team-os-context-mgmt-digest-2026-06-02.md` (12 transferable mechanisms). Recall hooks: Protocol A = format-enforcer skill analog; plan persistence is a real gap; their no-inter-agent-coordination blind spot is our strength. Read the doc, don't re-derive.

## [CHECKPOINT S44] Entu consultant-agents grounding -- SHIPPED (pruned)
Digests in docs/: `2026-06-06-entu-consultant-grounding-digest.md` + `-data-lifecycle-competency-harvest.md` (18 claims C1-C18, folded to designs/new/entu-consultant-agents/). Recall hooks: entu/api=Nitro file-router not src/api; _sharing=create-time-only; no bulk API; verification = FIVE methods (probe/live-audit/src-read/spec-cite/maintainer), per-evidence stance field.

## [CHECKPOINT S59] apex #176 contamination-recovery eval -- COMPLETE
Verdict: SOUND recovery, OVERCLAIMED coverage (no detection arm). 10 failure modes + 8 fixes to team-lead. **Lesson FILED Protocol A -> Cal wiki #158 `patterns/detection-is-upstream-of-recovery.md`** (Stage-2 CONFIRMED). Principle: detection structurally upstream of recovery; recovery-without-detection = dominant contamination risk at scale.

## [CHECKPOINT S60] PO-team research (both passes) -- SHIPPED
Deliverable: `designs/new/po-team/research-precedent.md` (§1-6 + TL;DR + 9 OQs). PO chose LITERAL tmux driving.
- **First-pass "NO precedent for agent tmux-driving" = RETRACTED.** Prior art strong: Hopper WS3b probe (S54/S55) drove live Claude sessions via remote send-keys+capture-pane incl OAuth login, no crash = existence proof.
- **Crash class (2 modes, both avoidable driving an IDLE session):** (1) #60/apex-S17 = permission-dialog under tmux-pane-LAUNCHED claude (why spawning retired); (2) runbook §16 = send-keys SHELL cmds into Claude pane corrupts turn-state. Residual trigger = send-keys onto a permission dialog -> Herald §1.2 gate covers it.
- **Reusable asset:** `designs/new/migration-probe-harness/harness.sh` (tmux_send/tmux_capture) = codified drive loop; PO channel = generalization, not net-new. `tmux-direct-brief` skill canonical but NOT in local ~/.claude/skills (rc-host/operator env).
- **tmux>screen** (capture-pane->stdout vs screen hardcopy->file; -l for secrets; -r RO attach).
- **Structure/comms/role/github findings** (first pass): operational-team archetype is the lens; stationmaster/courier/ghost-member = proven message channel; Hopper = role precedent; epic/task issue taxonomy = NET-NEW. Full detail in the shipped doc.
- Herald folded all 3 reinforcements into protocols.md (§1.0 crash grounding + WS3b proof; §1.2 3-invocation rule + `-l`; §4 item 8 provision tmux-direct-brief skill). Aen: leave the tmux-vs-screen table (documents WHY tmux won).

## [DEFERRED S60] capture-pane DIALOG sentinel token -- acceptance-test deliverable
Herald §1.3 gap. PROVISIONAL given (probe scope doc `teams-migration-probe-container-scope-2026-06-17.md:89`): IDLE=`❯` prompt; BUSY="shimmering" indicator. DIALOG sentinel NOT captured -- version+dialog-type dependent, needs a LIVE session (over-real-ssh acceptance test / WS3b harness re-run), not repo-derivable. If a probe runs: capture all three exact states (esp. DIALOG permission-prompt `capture-pane -p` dump), hand to Herald.

## [GOTCHA S44] Stale/crossed messages -- verify status before acting
task_assignment replays surface LATE with ORIGINAL timestamp -> TaskGet first; if completed and timestamp predates completion, send no-op confirmation (requirement-ack discipline), do NOT redo. Messages cross in flight (S60: Aen's status-check arrived AFTER I'd shipped+reported the same task) -- check timestamps, send a status confirmation not a redo.

(*FR:Finn*)
