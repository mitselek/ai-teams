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

## PHASE B PREVIEW (NOT STARTED — wake on PO direction or Aen signal)

[REQUIREMENT] **Federation bootstrap protocol** (new team joining federation) — my domain. Likely shape: extend the Brilliant MCP FR setup runbook into a generic onboarding template, parameterized over `<team>` slug + namespace claim. Cal-coordination needed for namespace allocation per new team. Watch convention re-test at n=2 (apex-research as next likely spoke).
[REQUIREMENT] **Authority-drift detection at federation scale (n=20+)** — Monte/my joint domain. Substrate-side instrumentation question: how does the federation observe drift before it becomes corruption? Likely sidecar pattern + cron/scheduled-poll consistent with pull/poll sync.
[REQUIREMENT] **T04 topic-file amendment text** — post-Phase-A codification. Not strictly mine; will follow Aen's lead on whether infra-side amendments are requested.
[DEFERRED] Cal Protocol A queue — 5 patterns from Phase A pending filing in next session (worktree-isolation amendment from Herald instances + 4 Herald patterns + Monte/Herald patterns). Not my chore.

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
