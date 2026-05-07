# Brunel scratchpad

## PHASE A CLOSED — Prism (2026-05-05, session 26) — compressed

Three designs shipped via PR #1+#3 on `mitselek/prism`: topology (hub-and-spoke, asymmetric), container-deployment-posture (co-located on Brilliant), brilliant-mcp-fr-setup (`fr/` + `Projects/fr/wiki/*` namespace). 4 growth triggers; Trigger 1 (reverse spoke→spoke) on FR live-watch. Workspace-collision near-miss codified by Cal as `wiki/patterns/worktree-isolation-for-parallel-agents.md` with my AMENDMENT (creation/cleanup/recovery triad).

[DECISION] Sync = pull/poll (Cal wiki `poll-only-substrate-sidecar-derivation.md`). Container resource-shape: cron/scheduled-poll or long-running tick-loop, NOT push.
[DECISION] Federation topology = hub-and-spoke + selective peer-edges as growth response.
[DECISION] Container posture = co-located. Prism rides along on E-deployment migration; symmetric decoupling.
[DECISION] Branch+PR convention RATIFIED as team standard Phase A.1+ (Aen 16:18).
[LEARNED] FR design cadence: ~400w scope + ~1300w design body. Held end-to-end through Phase B.

## SESSION 29 CLOSED — Wiki review + T06 stale-prose cleanup (2026-05-07)

[CHECKPOINT] **S29 closed 2026-05-07.** Two queued tail-end items from S28 close knocked out cleanly:
- Task A: `wiki/patterns/worktree-spawn-asymmetry-message-delivery.md` accuracy review — confirmed entry accurately represents substrate failure as I observed it. Intermittent/mount-staleness framing (NOT deterministic-broken) preserved at line 28 + line 38 Cal→Brunel row. Team-lead-relay workaround correctly identified as only reliable cross-boundary path. Instance 3 names me directly with right shape (worktree → no-worktree, Sub-shape B). No amendments needed; no Protocol A traffic to Cal needed (Aen ratified as-is).
- Task B: T06 stale "Phase 2.0a" references at lines 1135 + 1182 updated. L1135 anchors to the moved-from heading "$HOME reliability and runtime-path notes (above)". L1182 reframes the bullet as "$HOME validation in lifecycle scripts" — drops the stale phase-name dependency entirely (Phase 2.0a is no longer a separate numbered phase post-Volta-T06-rewrite). Volta's intentional historical anchors at L118+L120 left untouched (his domain, past-tense "moved from R4 Phase 2.0a" is correct).

[LEARNED] **Two-axis stale-prose scan beats single-grep.** When a section is moved-not-deleted, a same-document grep returns BOTH the new structural anchor's reference-back AND the consumer-side stale references. Distinguishing them requires reading the heading-line context (is the hit *naming* the historical anchor in past-tense in a moved-from heading, or is it *depending on* the historical name as if it still exists?). Past-tense in an owner's section = leave alone. Present-tense or implicit-present in a consumer section = stale, fix. The 4-hit grep on T06 had 2 of each shape; treating all 4 as "to fix" would have over-edited Volta's section.

[LEARNED] **Re-anchor strategy choice: heading-name-pointer vs concept-rephrase.** Two stale references, two different fixes: L1135 used heading-name-pointer ("documented in `$HOME` reliability and runtime-path notes (above)") because the surrounding sentence already names a specific bug and just needs a working anchor. L1182 used concept-rephrase ("`$HOME` validation in lifecycle scripts") because the bullet was structurally dependent on a phase that no longer exists — pointing to the new heading would read awkwardly inside an enumerated list of phases. Heuristic: when the stale name appears as a passing reference, point to new anchor; when it appears as a structural element (list header, identified phase), rephrase to drop the dependency.

[GOTCHA] **Phase 2.0a remains in-document at lines 118+120 (Volta's section) by design.** Future stale-prose scans for "Phase 2.0a" in T06 should expect those 2 hits as residual noise. They are intentional past-tense historical anchors in the moved-from heading and will not be removed unless Volta retires the moved-from notation.

## SESSION 27 CLOSED — Phase B v1.0-final cluster shipped (2026-05-06 15:18)

[CHECKPOINT] **Session 27 closed by PO direction (Aen 14:09 his-clock).** Phase B v1.0-final cluster fully shipped end-to-end:
- ✓ #1 federation-bootstrap-template v0.7 (in-place; ~4.3kw; 7 versions, 3 async ratifications closed; execution-ready for n=2 apex-research)
- ✓ #2 authority-drift-substrate-instrumentation v0.2 (in-place; ~2.9kw; cite-and-fold to T04 §Authority-Drift Detection complete)
- ✓ Cross-design ratification clean across 4 consumers (Aen, Monte, Cal, Herald)
- ✓ Wiki: `relay-to-primary-artifact-fidelity-discipline.md` filed (Cal 14:08 + 15:04 self-correction; Herald co-source; n=3 instances)
- ✓ Wiki: `worktree-spawn-asymmetry-message-delivery.md` filed (n=4 promotion-grade; I'm co-source-agent)

**Tail-end carry-forward (queued, non-urgent — item 1 closed S29):**
~~1. wiki accuracy review~~ — DONE S29 (no amendments).
2. Topic 06 write-back — Volta-resume timing; Herald co-author offer at 13:24 stands.
3. Cal output-substrate namespace ratification (Aen routing).
4. Tier-0 §3.4 questions on pre-rejection attempt log + append-only-additive guarantee (Aen routing per 11:46).
~~T06 Phase 2.0a stale-prose~~ — DONE S29 Task B (lines 1135 + 1182, container-side only).

## PHASE B CLOSED — Session 27 — compressed

#1 Federation bootstrap protocol v0.7 SHIPPED + execution-ready for n=2 (apex-research). Path: `teams/framework-research/docs/federation-bootstrap-template-2026-05-06.md`. ~4.3kw, 7 versions in-place, all 4 consumers ratified (Aen, Monte, Cal, Herald). Cite-and-fold cadence held end-to-end.

#2 Authority-drift design v0.2 SHIPPED with bidirectional cite-and-fold to T04 §Authority-Drift Detection (Monte's canonical surface, no separate Monte v1 file). Path: `teams/framework-research/docs/authority-drift-substrate-instrumentation-design-2026-05-06.md`. Asymmetry framing locked: "admission commits, observation cautions."

[DECISION] Phase B cadence: scope-first then design-after, ~400w scope + ~1300w design body.
[LEARNED] Monte S26 framing: "asymmetries live above substrate, not in substrate" is the #2 seam decomposition. I surface FROM substrate; he ACTS above substrate.
[LEARNED] Cite-and-fold-absorbs-co-design (when structurally sound). Aen 11:36 production rule: "when shipped artifacts compose structurally, fold; when they conflict, surface to him first." Cal-filed self-corrections (relay-fold + primary-artifact-over-relay) as `relay-to-primary-artifact-fidelity-discipline.md` with Herald co-source.
[REQUIREMENT] #3 T04 topic-file amendment text — held; container/infra-side amendments only on Aen signal.
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
