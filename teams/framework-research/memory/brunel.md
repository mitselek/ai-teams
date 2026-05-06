# Brunel scratchpad

## PHASE A CLOSED — Prism (2026-05-05, session 26)

[CHECKPOINT] **Phase A STRUCTURALLY CLOSED 2026-05-05 17:24.** PR #10 (Herald envelope-v1.1) merged as last in sequence. 10 PRs total on `mitselek/prism` main: #1 + #3 (mine), #2 + #5 + #7 + #9 + #10 (Herald), #4 + #6 + #8 (Monte). My closeout confirmed by Aen 17:25; no outstanding work.

[CHECKPOINT] Phase A.1 SHIPPED + RATIFIED. Three designs merged to main via PR #1 (`daf97f4`). §3 fill-in shipped via PR #3 on branch `phase-a-1-brunel-s3`, commit `07abf35`. Aen ratified Q1 (`fr/`) + Q2 (`Projects/fr/wiki/*`) at 2026-05-05 16:22.
  - `designs/brunel/topology-2026-05-05.md` (622w) — hub-and-spoke, asymmetric, FR-as-hub. Mesh rejected as designed-from-aspiration. 4 growth triggers; Trigger 1 (reverse flow non-trivial spoke→spoke) is the live-watch (FR-team responsibility, not personal).
  - `designs/brunel/container-deployment-posture-2026-05-05.md` (682w) — co-located on existing Brilliant infra. Prism is a pattern, not a container. Tier 0 inherited from EVR Konteinerite Standard v0.1.
  - `designs/brunel/brilliant-mcp-fr-setup-2026-05-05.md` (1095w post-§3 fill) — execution-ready. Namespace allocation: `fr/` prefix + `Projects/fr/{wiki/*, meetings/, context/, resources/}`. Cal sole-writer per existing wiki sovereignty rule.
[DECISION] Sync mechanism = pull/poll (Aen directive 16:11, sourced from Cal wiki `wiki/patterns/poll-only-substrate-sidecar-derivation.md`). Push-shape parity-but-parked. Container resource-shape: cron/scheduled-poll or long-running tick-loop, NOT push listener.
[DECISION] Federation topology = hub-and-spoke + selective peer-edges as growth response (NOT mesh-from-scratch). Defend distinction at A.3 audit if challenged.
[DECISION] Container posture = co-located. Prism rides along when ITOps eventually migrates Brilliant to E-deployment. Symmetric decoupling: ITOps timeline doesn't gate Prism, AND Prism doesn't add to ITOps's plate.
[DECISION] Branch+PR convention RATIFIED as team standard for Phase A.1+ (Aen 16:18). Feature branch + PR + merge-on-ratification. Reversible without rewriting history.
[LEARNED] Pass-1 prose-only Prism rename on scope memo: gate-1 (re-grep after edit) confirmed 3 hits where there were 0 before. NO machine-identifier changes.
[LEARNED] Cadence pattern for FR design work (Aen-noted): 412w scope memo (tight) + 1300w shipped designs (expansive). Mark for Phase A.2 — same discipline, different surfaces.
[LEARNED] Stage-0 EVR Konteinerite Standard cite-back from Prism posture memo is first downstream use of the standard's Tier 0 by another design. Validation that the standard is doing its job.
[GOTCHA] **Workspace-collision in shared local clone.** Brunel + Herald both work on `~/Documents/github/.mmp/prism` simultaneously. After Brunel pushed `phase-a-1-brunel-s3` (commit `07abf35`), Herald checked out his own branch `phase-a-1-herald` on top — Brunel's working-tree view showed pre-§3-fill content. Origin unaffected. Pattern: verify current branch + check `git show origin/<my-branch>:<file>` to confirm pushed commit, NOT working-tree state, before re-Editing. **Now codified:** Cal filed as wiki entry `wiki/patterns/worktree-isolation-for-parallel-agents.md` (entry #69, n=2 with Monte's preemptive worktree-add); my AMENDMENT folded the first-person near-miss + `git show origin/<branch>:<file>` recovery primitive into §How to apply (creation/cleanup/recovery triad). Adopted as default for Phase A.2+ specialist work per Aen 16:33.

## SESSION 27 CLOSED — Phase B v1.0-final cluster shipped (2026-05-06 15:18)

[CHECKPOINT] **Session 27 closed by PO direction (Aen 14:09 his-clock).** Phase B v1.0-final cluster fully shipped end-to-end:
- ✓ #1 federation-bootstrap-template v0.7 (in-place; ~4.3kw; 7 versions, 3 async ratifications closed; execution-ready for n=2 apex-research)
- ✓ #2 authority-drift-substrate-instrumentation v0.2 (in-place; ~2.9kw; cite-and-fold to T04 §Authority-Drift Detection complete)
- ✓ Cross-design ratification clean across 4 consumers (Aen, Monte, Cal, Herald)
- ✓ Wiki: `relay-to-primary-artifact-fidelity-discipline.md` filed (Cal 14:08 + 15:04 self-correction; Herald co-source; n=3 instances)
- ✓ Wiki: `worktree-spawn-asymmetry-message-delivery.md` filed (n=4 promotion-grade; I'm co-source-agent)

**S28 tail-end carry-forward (all queued, non-urgent):**
1. `worktree-spawn-asymmetry-message-delivery.md` accuracy review — I'm co-source per Cal's filing; will read on first cycle and confirm/correct via Cal direct or relay
2. Topic 06 write-back — Volta-resume timing; Herald co-author offer at 13:24 stands
3. Cal output-substrate namespace ratification (Aen routing)
4. Tier-0 §3.4 questions on pre-rejection attempt log + append-only-additive guarantee (Aen routing per 11:46)
5. n=7 substrate-mismatch Protocol A — CLOSED at S27 (Cal 15:04 confirmed already absorbed by `worktree-spawn-asymmetry-message-delivery.md` + `substrate-invariant-mismatch.md` Instance 6 amendment); no S28 action

**Substrate-failure note for S28 wake:** worktree-OUTBOUND messages from me to non-worktree-recipients (Cal, team-lead JSON inbox) are INTERMITTENT not deterministic-broken (Cal→Brunel: 2/3 success ratio in S27). Conversation channel works reliably for inbound. team-lead → Cal relay path-b is the established workaround for outbound. Inbox JSON file may not be updated post-S26 shutdown_request — verify on S28 wake before assuming inbox currency.

## PHASE B — IN PROGRESS (session 27, started 2026-05-06)

[CHECKPOINT] **#1 Federation bootstrap protocol — DRAFT v0.7 SHIPPED — EXECUTION-READY** 2026-05-06 14:48 (in-place, ~4.3kw). Path: `teams/framework-research/docs/federation-bootstrap-template-2026-05-06.md`. **All three async ratifications CLOSED:** Herald 04 (v0.6 direct-citation), Monte (11:14 + 11:40), Cal (12:54 via Aen relay 13:38). v0.7 combined fold: (1) §6.5 D5 typed-contract reconciliation per Monte 11:14; (2) §0.5 `recordId` audit-trail inline rationale per Cal Pushback #2; (3) §6.5 D6 advisory-emit pointer per Cal Pushback #3; (4) §6.5 D8 cross-link per Monte 10:55 catalog addition. Cal Pushback #1 (substrate-derived `conventionRetestCount`) already absorbed in v0.6 via Herald 04 §2 verbatim wording. Versions v0.1→v0.7, all in-place; revisions log preserves all seven. **Execution-ready for n=2 (apex-research).** Pre-flight check: three parameters mutually consistent across consumers.
[LEARNED] **Discipline failure self-noted in v0.5 frontmatter:** when relaying-relayed material (Herald content via Aen relay), I folded `kind → recordKind` rename as if confirmed even though my own provenance said FLAG-pending-Herald-confirmation. Production rule: fold ONLY what's verbatim in the relay; flag-then-implement-as-confirmed is a discipline failure. v0.5 reverts.
[WIP] **Cal Protocol B re-sent 11:21** as substrate-test per Aen 12:21 path (a). My 11:05 query may not have landed (worktree-→-no-worktree direction). If re-send fails too → Aen relays via team-lead → Cal.
[WARNING] **Substrate-invariant-mismatch n=7 SURFACED to Aen 11:10** — my inbox JSON last entry is shutdown_request from 2026-05-06 07:05; NONE of session 27 messages are in the file. Harness IS delivering as teammate-message conversation entries. Per `integration-not-relay`: Herald + Monte content folded as RELAYED via Aen, not from primary artifact; cite-and-fold pass needed when on disk. Aen invited the surface; n=7 follows Monte's earlier n=6 detection.
[CHECKPOINT] **#2 Authority-drift — SCOPE RATIFIED + DESIGN DRAFT v0.2 SHIPPED** 2026-05-06 14:58. Scope: `teams/framework-research/docs/authority-drift-substrate-instrumentation-scope-2026-05-06.md` (~950w; Aen RATIFIED 11:18). Design: `teams/framework-research/docs/authority-drift-substrate-instrumentation-design-2026-05-06.md` (~2.9kw v0.2, ~1k more than v0.1). v0.2 cite-and-fold pass to T04 §Authority-Drift Detection (canonical detector-side surface per Monte 11:42; no separate Monte design v1 file exists — substantive content lives in T04 amendment chain v1.0→v1.2). v0.2 folds: (1) §3.1 typed-accessor commitments — `pathSovereignty(logicalPath) → SovereigntyClaim` per Herald 04 §3.1, statistical `BaselineDeviation` per Herald 04 §4, severity mapping per T04 §Signal classes; (2) §3.3 partial Cal-gate update (output-substrate namespace ratification still open but structurally same-substrate); (3) §6 max-specificity citation table (8 rows) to T04 sub-sections; (4) §8 acceptance check at v0.2 status (Aen ratified, Monte end-to-end verified, Cal §6 closed §3.3 partial, Tier-0 routing-deferred); (5) §9 cross-link refreshed to #1 v0.7. Asymmetry "admission needs to commit, observation needs to caution" framing locked.
[DECISION] Phase B cadence: scope-first then design-after, ~400w scope + ~1300w design body. Both #2 surfaces shipped on cadence 2026-05-06.
[LEARNED] **Cal answered Monte's 10:50 Protocol B at 12:24** (relayed by Aen 12:30): per-namespace curator = write-authority only, NOT corrective-authority recipient. L1 router → team-lead-of-accused-team is recipient. Monte's #2 design §6 LOCKED. **#2 v0.2 fold can proceed without §6 gate** — when Monte's content lands on disk, his §6 will be final.
[LEARNED session 27 — cite-and-fold-discipline-absorbs-co-design (when structurally sound).** Phase B ran on cite-and-fold cadence (Aen 11:18 course-correction); two co-design instances surfaced anyway: (a) Monte 10:54 [COORDINATION] handshake on registry-shared composition, (b) Monte 11:14 D5 framing reconciliation. Both went BEYOND cite-and-fold (we co-designed shared structures), but Aen ratified BOTH retroactively because the resulting shapes were structurally better than two-independent-shipped designs would have been. **The discipline doesn't reject co-design; it rejects unnecessary co-design.** When co-design produces a structurally superior outcome, retroactive ratification absorbs it. When co-design produces churn, course-correction reverts it. Compose-or-conflict gate is the structural test: composes → fold; conflicts → surface to team-lead first. Production rule from Aen 11:36: "when shipped artifacts compose structurally, fold; when they conflict, surface to him first."
[CHECKPOINT session 27 final synthesis] Seven versions of #1 (v0.1→v0.7) + two versions of #2 (v0.1→v0.2) + zero abandoned drafts + clean acceptance-gate closure across all four consumers (Aen, Monte, Cal, Herald) + production-rule lessons from two self-corrections (relay-fold-discipline + primary-artifact-over-relay-quote, now Cal-filed as `relay-to-primary-artifact-fidelity-discipline.md` with Herald co-source) + cite-and-fold cadence held end-to-end. Phase B v1.0-final cluster genuinely closed: #1 v0.7 execution-ready for n=2 (apex-research); #2 v0.2 bidirectional cite-and-fold complete; T04 §Authority-Drift Detection v1.2 ratified; Herald 04 federation-authority-record contract v0.1.1 ratified. ~80min spawn-to-#1-v0.7-ready cadence sustained through 7 revisions; ~4hr full-cluster closure including #2 v0.2 + Cal/Herald wiki entries.
[LEARNED] Monte's S26 framing — "asymmetries should live above the substrate, not in the substrate" — is the load-bearing decomposition for the #2 seam. I surface FROM substrate; he ACTS above substrate. Clean, not contested.
[LEARNED] Monte [COORDINATION] handshake closed 10:54 — bootstrap-writes-registry / drift-reads-registry composition over same poll stream. Registry envelope `RegistrationAuthority` + append-only-additive `supersedes:` chain. Aen course-corrected at 11:18: cite-and-fold > co-design at this stage. Have dialed back; #2 design §6 is cite-only, no further proactive co-design.
[LEARNED] Aen 11:36 confirmed registry-upgrade greenlight — combined v0.2 fold (4 revisions + Monte registry composition) was the right call. Cited "lossless-independent-convergence discipline" (avoid two-pass churn). Compose-or-conflict gate: the 10:54 [COORDINATION] response to Monte was MORE than cite-and-fold but Aen ratified retroactively because the registry shape was structurally better than two-independent-shipped designs would have been. Going-forward rule per Aen 11:36: when shipped artifacts compose structurally, fold; when they conflict, surface to him first.
[REQUIREMENT] **#3 T04 topic-file amendment text** — held; container/infra-side amendments only on Aen signal.
[DEFERRED] Cal Protocol A queue — 5 patterns from Phase A. Not my chore.

## PHASE A — MY CONTRIBUTIONS (composite per Aen 17:25)

1. Topology recommendation establishing hub-and-spoke as empirical baseline (mesh rejected as designed-from-aspiration). 4 growth triggers documented. Aen-named load-bearing framing: "designed-from-aspiration not from-observation" as the discipline statement.
2. Container deployment posture: "Prism is a pattern, not a container" (Aen-named load-bearing). Minimum-blast-radius framing. Symmetric decoupling from E-deployment migration.
3. Brilliant MCP FR setup runbook with namespace allocation. Execution-ready post-Cal+Aen ratification.
4. §3 namespace ratification: `fr/` short-form + `Projects/fr/wiki/*` placement. Convention locked at n=1; convention re-test at n=2.
5. Trigger 1 (reverse spoke→spoke flow) on FR session-tail watch list — empirical question that gates next topology decision. FR-team responsibility, NOT personal.
6. Workspace-collision near-miss observation triggered Cal's worktree-isolation pattern entry (#69). My AMENDMENT folded first-person + recovery primitive.

[LEARNED] Phase A discipline-cadence (Aen-noted): 412w scope memo (tight) + 1300w shipped designs (expansive) is the right shape for this team. Carry pattern into Phase B.

## STANDING DECISIONS (carry forward)

[DECISION] Single-provider is correct default for agent runtime. Multi-provider = sidecar, not peer. Three integration seams: peer (Claude-only), sidecar/daemon, MCP server. Audit independence = external container reading committed git artifacts, NOT different-provider Medici.
[DECISION] `GatewayPorts yes` on RC NOT recommended even long-term — would expose ports to every bridge-networked container. Loopback-only binding is the default; host-networking is the consent mechanism.
[PATTERN] `network_mode: host` simplification window: tunnels, sockets, local listeners are free for the container. Tradeoff: breaks E-deployment portability (Swarm cannot host-network). Plan `b-host` vs `e-swarm` profiles in compose from day one.
[PATTERN] Author attribution: bold `(*FR:Brunel*)` per common-prompt. Never italic.

## CARRY-FORWARD GOTCHAS (all containers)

[GOTCHA] PO edits live files in parallel during a Brunel pass. ALWAYS re-read before each Edit batch — Edit tool's "File modified since read" catches it. If read >1 message ago, re-read.
[GOTCHA] WARP TLS interception: `network_mode:host` + `NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem` + system CA.
[GOTCHA] Named volumes created as root → `chown 1000:1000` in entrypoint.
[GOTCHA] SSH: useradd creates locked account. Fix: `usermod -p '*'` for pubkey auth.
[GOTCHA] Container rebuild regenerates SSH host keys → `ssh-keygen -R "[host]:port"` after rebuild.
[GOTCHA] CRLF from Windows git autocrlf breaks entrypoints. Fix: `sed -i 's/\r$//'` then rebuild.
[GOTCHA] tmux inherits locale from starting process. Use `tmux -u` or bake LANG into Dockerfile.
[GOTCHA] Root-owned /tmp files block ai-teams writes — create tmux sessions as target user.
[GOTCHA] Inbox files created at agent registration time. Specialist → unregistered agent = message LOST. Spawn order: service-role agents BEFORE message senders.
[GOTCHA] Base64-encode-via-SSH strips shell-escape backslashes. Use heredoc with single-quote delimiter for scripts with `\"` or `\s`.
[GOTCHA] Consecutive `**Bold:**` lines collapse on GitHub. Use `- **Bold:**` bullet lists.
[GOTCHA] Container reference-memory path: `~/.claude/projects/-home-ai-teams/memory/` (Claude-project namespacing where `-home-ai-teams` is $HOME-dir-encoded), NOT `~/.claude/memory/`. Verify path before citing.

## META-LESSONS — carry forward

[LEARNED] Team-lead guidance is input to my integration check, not a substitute for it. Folds from integrated reasoning survive iteration; single-source folds (endorsement I didn't originate) need reversal. Pre-fold consistency check: re-check whether endorsement is consistent with latest doc state.
[LEARNED] Retraction-scope cross-wires: a narrow retraction can be misread as broad guidance if scope isn't named. Sender discipline: name scope of every retraction. Receiver discipline: state scope assumption before folding.
[LEARNED] When a brief states a count or fact, **verify independently before quoting** — pre-flight arithmetic check is cheap. Multiple session-22 instances of mis-quoted counts caught only by post-edit grep.
[LEARNED] When investigating "X commits ahead, Y commits behind" divergence, message-match search on origin detects rebased history cheaply. `git branch -r --contains <sha>` returning empty for ahead-commits + matching messages on origin under different SHAs = rebase signature, not local-only commits.
[LEARNED] CRLF/LF line-ending divergence inflates raw diff line counts. Always run `git diff -w --stat` alongside `git diff --stat`. Windows-committed entries have CR; LF re-saves on RC = git sees whole file changed.

## DEFERRED (future surfaces)

- OAuth on hr-devs PROD-LLM container (PO manual step)
- Hub container as standalone Docker image
- raamatukoi-dev VPS container deployment
- MCP server pattern for visual QA service
- Provider outage behavior in containers (what does Claude process do on API failure?)
- External audit container architecture spec

## SHIPPED PROJECTS (compressed — full content in commits + design docs)

- **EVR Konteinerite Standard v0.1** (2026-04-30, V2 Confluence id 1715798017) — Tier 0/1/2 system, EntraID auth, intake-vorm. Cited by Prism posture memo.
- **apex container Chromium/Playwright** (2026-04-29) — dual-track shipped. PR #115 merged.
- **Issue #60 tmux-spawn retirement infra side** (2026-04-24) — Task A delivered, Task B no-op. Task C (DB tunnels, R1 reverse-forward) still active under apex-migration-research#109.
- **xireactor-pilot** (2026-04-15/16) — design + Phase 1 deploy artifacts shipped. PO dropping direction; orphaned but not removed.
- **ruth-team design v1.0** (2026-04-15) — bridge option C, port 2228, Monte/Herald answers still open per their schedule.
- **apex-research Eratosthenes** (2026-04-13) — PR #57 merged. Structural-discipline cluster.
- **uikit-dev migration** (2026-04-13) — Full A+B+C, port 2228.
- **raamatukoi-dev** (2026-04-09) — `Raamatukoi/tugigrupp`, 14 commits.
- **comms-hub** (2026-03-31) — Hub on PROD-LLM, 4 teams connected.

## INFRA REFERENCE

- Cloudflared tunnel: `526a23d1-1f7f-472f-8df1-a9239bbe3fe4` → `apex-research.dev.evr.ee` → `http://apex-research:5173`. QUIC blocked → `--protocol http2`.
- evr-ai-base:latest = Debian bookworm-slim + Node 22 + Claude Code + gh + gosu + tmux + SSH.
- Designs repo: `mitselek-ai-teams/designs/deployed/<team>/container/`
- Prism repo (active): `~/Documents/github/.mmp/prism` ↔ `mitselek/prism` (PRIVATE).
