# Callimachus Scratchpad (*FR:Callimachus*)

## Session 8 — 2026-04-14 (Active)

[CHECKPOINT] **project-memory/ leak gotcha filed.** `wiki/gotchas/persist-project-state-leaks-per-user-memory.md` (#38). Team-lead-sourced. Session 8 found 36 files / ~175KB untracked in `mitselek/ai-teams` (per-user MEMORY.md + feedback_*/project_*/reference_*) — caught + deleted before commit. Root cause: `persist-project-state.sh` (Volta WIP, v0.3) mirror semantics correct for container-scoped team repos, wrong for multi-workstation shared team repos. Three mitigations cited for Volta (container-only guard / `.gitignore` / target-dir check) — cited, not prescribed, Volta owns the fix per team-lead scope. Filed as sibling to `dual-team-dir-ambiguity` under a new "Wrong-Substrate Variant" section added reciprocally to that entry. Both are "syntactically correct code, invariants don't hold on this substrate" — different failure surfaces, same family. Wiki 37 → 38. Second team-lead-originated entry this session (first was librarian-growth-curves #35). Delivery-window freeze rule note: caught-leak janitorial filings count as safety submissions, not routine intake — did not violate the freeze.
[LEARNED] **Two sibling entries through mirror cross-references, not one entry.** Considered merging `persist-project-state-leaks-per-user-memory` into `dual-team-dir-ambiguity` as a variant but they describe different failure classes (path-ambiguity vs substrate-mismatch) with different fixes. Filed separately with reciprocal "Wrong-Substrate Variant" / "Related" cross-reference sections. Rule: sibling entries beat one-entry-with-two-variants when the failure surfaces diverge enough that a reader of one might not recognize the other. Dedup outcome #3 (similar but not the same) from my own protocol.
[CHECKPOINT] **Mid-window exception filed — tmux pane-border-format pattern.** `wiki/patterns/tmux-pane-border-format-for-teams.md` (#37). PO-authorized single entry during delivery-window freeze. Aalto's experimental Style 3 (combined persona+role) on uikit-dev, with full syntax for the conditional chain, runtime persistence caveat, decision-summary table, sibling cross-reference to pane-labels gotcha. Dedup outcome #3 (similar-not-same vs #36 — pane-labels documents the failure mode, this documents the chosen format; different defect class, cross-referenced not merged). Wiki 36 → 37. Freeze rules otherwise still hold: no other Protocol A intake, no promotions, no Protocol B beyond basic acks.
[CHECKPOINT] **Aalto #3 filed — tmux pane-labels gotcha.** `wiki/gotchas/tmux-pane-labels-decoupled-from-personas.md` (#36). Presentation-layer decoupling between layout config (role IDs) and roster (persona names). Cognitive cost, routing unaffected. Scope pending Brunel investigation. Third externally-sourced entry from Aalto in 2 days — external intake via team-lead tmux-direct is now a repeatable channel.
[CHECKPOINT] **Librarian growth-curves observation filed.** `wiki/observations/librarian-growth-curves-by-team-type.md` (#35). Cross-Librarian comparison framework-research=34 vs apex-research=0. Three non-exclusive hypotheses (team-type ceiling, Phase 2 accelerator, submitter floor) with composition note per team-lead's 09:13 extension. Intake provenance note captures team-lead traffic-control approval (no direct Eratosthenes/Schliemann consult). Revisit flag 2026-04-28.
[LEARNED] **Verify current artifact state before proposing housekeeping.** Session-start miscount of wiki/index.md (said 28, actual 34). Rule: re-read the artifact fresh before flagging a mismatch, not from startup-reading context — files may have been updated mid-prior-session after my initial scan. Irony tax on "Librarian miscounts own index" duly paid.
[LEARNED] **Hypothesis composition > hypothesis selection** (team-lead 09:13). Three disjoint-looking explanations can compose rather than compete — ceiling + accelerator + floor. Note as explicit framing when filing multi-hypothesis observations; future me will reach for "which one is right" when "how do they blend" is the better question.
[LEARNED] **One data point is a gotcha; two is a pattern.** Resisted team-lead's offered pattern abstraction (`identifier-to-persona-mapping-discipline`) because tmux pane-labels is still n=1. Filed as gotcha with explicit "watch for second instance" note. Rule: don't promote a single instance to a pattern just because the generalization is cleanly describable. Wait for a second independent observation.
[WIP] **External-vs-internal source ratio.** Now 3/36 ≈ 8.3% external-sourced wiki entries (all three Aalto via tmux-direct). Trending toward the 10-20% target band. Track as Phase 2 Health Sensing metric.
[WIP] **Watch for identifier-to-persona mapping discipline second instance.** Pattern candidate: dashboard agent cards, bug tracker labels, status pages, any config layer sitting between roster and presentation could surface the same defect. Promote to pattern when n=2.
[WIP] **Pending Brunel addendum to pane-labels gotcha.** When Brunel's investigation reports scope (fleet-wide by inheritance vs uikit-dev-only), update the entry with findings. Do not re-file; append as addendum.
[CHECKPOINT] **Protocol B served — team-config reconciliation.** Full 5-sub-question search against 36 entries. Partial on 4, not-documented on sub-Q2 (path `/home/ai-teams/team-config/` not in wiki), tangential on sub-Q5. Derived 6-step execution checklist from Structural Change Discipline cluster for Brunel's Phase 2.5; team-lead forwarded to Brunel as mandatory (not advisory). First first-use of full cluster as operational checklist outside its home team — if Brunel runs all 6 and nothing trips → generalizability signal; if anything trips → recursive-validation instance.
[DEFERRED] **Dual-sourcing defense as wiki pattern (ripe for NEXT session promotion).** Currently in team-lead scratchpad as "Dual-sourcing defends against DRY erosion" (2026-04-13 morning). Brunel's use in Phase 2.5 step 6 = first field instance outside its origin context. Promotion-via-Protocol-C is naturally ripe after uikit-dev batch ships. **Condition:** field-validated after uikit-dev batch. **Action:** draft Protocol C proposal at next session start if Brunel's step-6 execution confirms the pattern holds.
[DEFERRED] **Container bootstrap sync-directionality gotcha (post-execution Protocol A target).** Sub-Q2 gap from Protocol B response. Specific path `/home/ai-teams/team-config/` has no wiki coverage. Will fill when Brunel's Phase 2.5 execution surfaces the ownership/sync semantics. Brunel owns the submission per team-lead's framing; I just file when it arrives.
[DEFERRED] Session-7 items still pending: silent-state-drift meta-pattern (3 observations, name pending Volta), cross-pollination `role-replication-as-re-justification-audit.md` (3 sessions deferred).
[DEFERRED] Empty subdir review: `wiki/contracts/` and `wiki/findings/` still zero after 8 sessions. Watch for retirement signal.

## Session 7 — 2026-04-14 (Complete)

[CHECKPOINT] **First externally-sourced Protocol A intake** (task #13). Aalto (uikit-dev team-lead) reported 5 compaction incidents + ranked wishlist via tmux-direct relay. Filed as `wiki/observations/compaction-stale-state-deployed-teams.md` (#32) + derived pattern `wiki/patterns/world-state-on-wake.md` (#33). Seed material for Volta's persist/restore extension.
[CHECKPOINT] **Brunel's embedded-token gotcha filed.** `wiki/gotchas/embedded-github-token-in-git-config.md` (#34). Fleet-wide defect: `clone_or_pull()` persists GITHUB_TOKEN to `.git/config` via sed-injected auth URL. Fix: transient `http.extraheader`. Runtime-confirmed on uikit-dev, static-confirmed on 4 entrypoints, inheritance-suspected on 3 more teams. `evr-ai-base` image clean.
[LEARNED] **External intake requires explicit provenance frontmatter.** Added `source-team`, `intake-method`, `wiki-entry-type: external` fields to distinguish from internal submissions. First use: Aalto entries (#32, #33).
[WIP] **Phase 2 metric proposal:** external-vs-internal source ratio = 2/34 (~5.9%) for session 7. Target 10-20% for mature team. Include in Knowledge Health Summary at shutdown.
[DEFERRED] **Meta-pattern:** silent state drift between producer and consumers after producer changes. Three independent observations in 2 days (Gate 2 violation at 589fda9, restore-inboxes.sh shell-escape bug, Aalto compaction stale state). Name and file when Volta's available.

## Session 6 — 2026-04-13 (Complete)

[CHECKPOINT] **Protocol C APPROVED + LIVE.** "Structural Change Discipline" in common-prompt.md. Initial `589fda9` (v2) corrected to `48ac09e` (v3, 4-gate/5-member). First successful Protocol C cycle.
[CHECKPOINT] **Phase 2 formally activated** per team-lead approval. Wiki 31 entries. Gap Tracking + Health Sensing active. Gate is one-way.
[CHECKPOINT] **Wiki entries #29-31 filed this session:** #29 prompt-to-artifact-cross-verification (patterns/), #30 protocol-c-graduation-path (process/), #31 first-use-recursive-validation (patterns/).
[CHECKPOINT] **Recursive validation filed.** Team-lead's Protocol A submission: commit `589fda9` violated Gate 2 of the rule being promoted. Corrected at `48ac09e`. First-use validates the rule. Filed as `wiki/patterns/first-use-recursive-validation.md`.
[LEARNED] **Gate inventory ≠ entry count.** Cluster = 4 gates / 5 members. Two entries can share a gate.
[LEARNED] **Cluster is the natural unit of promotion.** Lifecycle coverage provides the gate-mapping justification.
[DEFERRED] Cross-pollination meta-pattern wiki entry (`role-replication-as-re-justification-audit.md`) — still pending from session 4.
[DEFERRED] Empty wiki subdirectory review: `contracts/` and `findings/` still empty.

## Session 5 — 2026-04-13 (Complete)

[CHECKPOINT] **Steal-back inventory authored + all 10 patches applied by Celes.** `memory/callimachus-stealback-inventory.md` is the spec. Cross-read gate: PASS with 2 fixes (Protocol A step 3/4 ordering swap, Batch Intake heading level). Celes applied fixes.
[CHECKPOINT] **4 Protocol A submissions filed from Celes.** Wiki: 24 → 28 entries. New entries: convention-as-retroactive-telemetry, rule-erosion-via-reasonable-exceptions, named-concepts-beat-descriptive-phrases, why-this-section-exists-incident-docs. All in `wiki/patterns/`.
[CHECKPOINT] **Phase 2 wiki batch: `filed-by: oracle` → `filed-by: librarian`** across all 28 wiki frontmatters. Grep-verified: 0 frontmatter `oracle` remaining, 3 body-text historical references in pass1-pass2-rename-separation.md correctly preserved.
[CHECKPOINT] **Phase 2 cross-read gate for Celes's prompt/roster edits: PASS.** Cal prompt zero `oracle`, roster `agentType: "librarian"`, Eratosthenes design snapshot 2 intentional Oracle refs (platform disambiguation + APEX Decision Matrix).
[CHECKPOINT] **Phase 2 gate counts met.** Wiki has 28 entries (>=15) and >=10 queries served across sessions 1-5. Phase 2 activation (Gap Tracking + Health Sensing) is now eligible. Announce on next session startup.
[LEARNED] **Line-start-anchored sed for frontmatter-only edits.** `sed -i 's/^filed-by: oracle$/filed-by: librarian/'` avoids body-text false positives. Same-content strings in prose paragraphs are preserved when the regex anchors to line-start + line-end.

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
