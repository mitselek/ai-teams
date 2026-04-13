# Callimachus Scratchpad (*FR:Callimachus*)

## Session 5 — 2026-04-13

[WIP] **Steal-back inventory authored.** `memory/callimachus-stealback-inventory.md` — 10 distinct patches (12 patterns, 3 subsumed into patch #10). Celes to execute. Path Convention (Celes's 14:28 v2.7.1-aligned draft) is patch #1. Application order specified.

## Session 4 — 2026-04-13 (Complete)

[CHECKPOINT] First end-to-end Librarian replication exercise: framework-research → apex-research (Eratosthenes). Wiki grew 20 → 24 entries this session. Phase 1 complete per PO; Phase 2 deferred.
[CHECKPOINT] Structural-discipline cluster: 4 confirmed members + 1 pending (Brunel/Celes prompt-to-artifact). Members are within-document grep, Pass 1/Pass 2 separation, protocol-shapes-typed-contracts, dual-team-dir-ambiguity. Brunel's wait-for-≥2-sessions calibration is the gate on Protocol C promotion.
[CHECKPOINT] **Gate-mapping observation** (Protocol C proposal justification material): the cluster's 5 members map to verification gates, not discrete bugs. Drafting → cross-read → pre-merge audit → post-bootstrap audit. Each gate catches a different failure mode in the family because each gate has different visibility. A team that institutes all four gates catches all five members; a team with only some catches only the corresponding members in production. **This is the load-bearing argument for promotion** per team-lead's 12:30 endorsement.
[LEARNED] **Prudent pause beats permission grant.** Permission to proceed unblocks the action; it does not approve the content or override in-flight direction. Even after permission, check whether direction is in flight before acting. **Promotion criteria for this lesson**: ≥3 positive instances across ≥2 sessions, no negative instances in same window. Negative instance #1 today: retried wiki Write after "denial was a mistake, please retry" without checking whether team-lead's direction was in flight (it was). Positive instance #1 today: held the prompt patch at 14:31 even though Celes's terminology answer arrived, because my 14:30 micro-decision question hadn't been resolved. Tracking deliberately.
[LEARNED] **Identity-layer conflation discipline.** The human operator and team-lead-the-agent operate on different authority layers. Human's "please retry" is tool-level unblocking; team-lead's direction is content/direction-level approval. Conflating them produces eager retries that bypass content review. Sister lesson to prudent-pause; both reinforce identity-explicit framing in batch-acks. Capturing as `[SENDER]` prefix in directive lists going forward.
[LEARNED] **Submitter ≠ wiki author.** Wiki sovereignty governs *who writes entries* (me), not *who owns knowledge* (whoever observed it). Future submitters (especially Celes) should not self-throttle on submission volume. Captured after correcting Celes's "two patterns feels like a lot" framing.
[LEARNED] **Cross-references describe relationships, not positions.** Cluster cross-references should never say "the 4th member" or "the second sibling"; they should say "the declaration-to-reality variant" or "the cross-team rename version." Position changes are noise; relationship descriptions are signal. Saved me redundant cross-reference work this session when team-lead said ordinal doesn't matter (cluster members do).
[LEARNED] **Evidence-weighted ordering beats chronological filing order.** When classifying entries within a cluster, ordering should reflect strength-of-evidence not order-of-arrival. Production-evidence entries take precedence over theoretical/cross-read-discovered entries.
[PATTERN] **Default-no-reply convention** (adopted from Celes 14:28). Notification-of-fact messages without a request component don't need acknowledgment unless there's a specific reason. Lowers ambient ack noise without losing necessary coordination. Applies in both directions.
[PATTERN] **Execute + coordinate, not execute + silent** (Celes's framing, 14:15). When team-lead overrides a scope restriction, execute the override on the urgent path immediately and route coordination through the normal channel on the non-urgent path. The override removes the authority barrier but not the epistemic value of the second pair of eyes. Asymmetric urgency drives asymmetric coordination.
[GOTCHA] **My own Callimachus prompt has the dual-team-dir latent bug** — bare `.claude/teams/framework-research/...` references in YOU MAY READ (line 260-265) and YOU MAY WRITE (lines 269-271). Celes is patching this in parallel with Eratosthenes per team-lead's directive; my role is reviewer not author. Held the self-patch on her draft pending micro-decision resolution. Do NOT self-fix outside her patch flow.
[DEFERRED] Cross-pollination meta-pattern wiki entry (`role-replication-as-re-justification-audit.md`): I committed to drafting this in my 11:15 message, source-agents `[callimachus, celes]`. Synthesis observation about why the second deployment improves the first. Still pending — draft when this session quiets.
[DEFERRED] Protocol C promotion proposal for "Structural Change Discipline" cluster. Gated on Brunel's wait-for-≥2-sessions calibration (≥4 entries, ≥3 specialists, ≥2 sessions, consistent guidance). Currently 4 confirmed entries from 3 specialists in 1 session — temporal criterion is the missing one. Wait at least one more session before drafting.
[DEFERRED] Steal-back inventory for next Callimachus patch window: 11+ patterns from Eratosthenes/Celes/Brunel work. Includes "gate is one-way" Phase 2 rule, dedicated Scratchpad Recency Filter subsection, pre-Lore Routing Rule placement, comparison-table parallelism, dual-sourcing defense paragraph, "submitter-trust contract" framing, "Either way..." unifying third sentence, dual-dir Path Convention section (per team-lead 12:35: don't self-apply, Celes is patching). Batch all in one coordinated patch.
[DEFERRED] Consider filing scope evolution for `wiki/contracts/`, `findings/`, `process/` — three subdirectories from research-team additions are still empty after 4 sessions. May indicate the research-team additions were over-engineered, OR the team simply hasn't generated content there yet. Watch for ≥1 more session before retiring.
[WIP] **Vocabulary-alignment-across-artifacts pattern.** Two instances observed today: (1) Brunel's dual-sourcing defense paragraph (routing table in both Eratosthenes prompt + apex-research common-prompt with explicit cross-reference); (2) my 5 named terminology concepts adopted by Eratosthenes v2.7.1 + the wiki gotcha entry + the pending Cal-prompt Path Convention section. Sibling-adjacent to structural-discipline cluster but a *positive* operational pattern, not failure mode — would file in `wiki/patterns/`. Trigger for third-instance Protocol A submission: any cross-artifact vocabulary alignment where 2+ specialists independently used the same named convention with explicit cross-references between artifacts. Watch for the third instance.
[CHECKPOINT] **Prudent-pause discipline tracked from both sides** (Cal inside-view + team-lead outside-view per 12:40). Inside view captures temptation-and-refusal; outside view calibrates against self-evaluation bias. Promotion threshold (≥3 positive across ≥2 sessions, no negatives in window) becomes more credible with two independent observers. Dual-tracking methodology is part of the eventual Protocol C proposal's evidence base.
[LEARNED] **Disciplined execution produces metrics as a byproduct.** Today's session metrics list (cluster growth, lessons captured, ack-in-window count, crossed-message resolution rate) wasn't intentionally tracked — it fell out of in-window acks creating a breadcrumb trail. Generalization of Celes's "convention before Phase 2 = retroactive telemetry": *any consistently-enforced discipline produces retroactive telemetry as a byproduct, with zero intentional instrumentation cost*. The discipline IS the instrumentation. Worth promoting alongside the prudent-pause lesson when both mature.
[CHECKPOINT] **Session 4 end — prudent-pause velocity.** Lesson captured at 13:25 same day as first negative instance (eager retry at 13:19, retroactive recognition). Two positive instances within hours of articulation (holding prompt patch at 14:31; holding again at stand-down 12:40). Three data points within one session from initial naming. Unusual rate of self-application — worth flagging in eventual common-prompt proposal as "lesson maturity velocity" signal: when a lesson is actively applied the same session it's named, the evidence base is stronger than equivalent spread-across-sessions instances.
[CHECKPOINT] **Session 4 shutdown approved 2026-04-13.** Phase 1 complete per PO. Wiki: 20 → 24 entries. Cluster: 0 → 5 members (4 confirmed + 1 pending). Cal-prompt Path Convention patch deferred to next session per team-lead 12:50. Steal-back inventory (12+ patterns) waiting for next patch window. Next session bootstrap: read this scratchpad, check `wiki/index.md`, verify Celes's Cal-prompt patch has landed, resume from there.

## Session 3 — 2026-04-10 (Final State)

[CHECKPOINT] Discussion #56 complete. Concluding synthesis posted. Wiki grew 4 → 20 entries.
[PATTERN] Knowledge-flow boundary is the real multi-provider constraint — not roles, not infrastructure.
[PATTERN] Five-layer provider lock-in model (Celes): infrastructure, protocol, knowledge, prompt, governance. Execution layer is the exception.
[PATTERN] Framework-participating vs service roles (Celes): the binary classification for provider strategy. Tool vs agent corollary prevents scope creep.
[DECISION] Multi-provider safe zone = roles that do not submit to or read from the knowledge layer.
[LEARNED] Batch submission processing works well — 16 submissions from 6 agents in one window, all classified, filed, cross-referenced, acknowledged.
[LEARNED] Duplicate resends are common when agents don't receive acknowledgments promptly — handled 8 duplicates this session.
[LEARNED] External synthesis (Gemini) overreaches in predictable ways: premature escalation, hypothetical-as-confirmed, nuance flattening. Filed as gotcha.
[GOTCHA] uikit-dev exists (deployed, RC container, Eesti-Raudtee/evr-ui-kit). Finn's R2 claim it doesn't exist was wrong. Corrected in 2 wiki entries.

### Session 3 Summary

- Knowledge audit: 9 topic files + wiki for model selection, Claude deps, token/cost
- Protocol B queries answered: 3 (model tiering, provider deps, token data)
- Protocol A submissions filed: 16 (3 team-lead, 2 brunel, 2 herald, 3 finn, 2 monte, 2 celes, 1 self, 1 D1 gotchas)
- Duplicates handled: 8
- Discussion #56: Round 1 posted, Round 2 posted, concluding synthesis posted (with authority)
- Corrections applied: 2 (uikit-dev existence in gotcha + inventory entries)
- Wiki entries created: 16 new (total: 20)
- Wiki directories created: 3 (decisions/, observations/, gotchas/)
- TTL entries: 2 (model inventory 2026-07-10, D1 gotchas 2026-10-10)

### Wiki State at Session End

- 14 patterns/ (4 pre-session + 10 new)
- 3 gotchas/ (new directory)
- 2 decisions/ (new directory)
- 1 observation/ (new directory)

[DEFERRED] Phase 2 activation (Gap Tracking + Health Sensing) — after 5 sessions (this is session 3).
[DEFERRED] Protocol C promotion candidate: D1 gotcha #10 (MCP write access to production) for any D1 team's common-prompt.
[DEFERRED] Synthesis review feedback from Celes + Herald not yet received.

## Session 2 — 2026-04-09

[CHECKPOINT] Wiki grew from 1 to 4 entries (all patterns/).
[LEARNED] Celes is primary knowledge submitter during design sessions.

## Session 1 — 2026-04-09

[CHECKPOINT] First Oracle deployment. Incremental Bootstrap complete.
[DECISION] Phase 1 active: Curation + Query Gateway. Phase 2 deferred after 5 sessions.
