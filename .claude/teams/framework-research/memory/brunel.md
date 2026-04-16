# Brunel scratchpad

## XIREACTOR PILOT DESIGN (2026-04-15 — superseded by deploy section below)

[CHECKPOINT] v0.6.3 design-phase shipped at `docs/xireactor-pilot-host-architecture-2026-04-15.md` (785 lines). All design decisions preserved there; scratchpad entries pruned on 2026-04-16 deploy pass.
[WARNING] §10 asymmetric-Tier-3 thesis is PROPOSED (not adopted), gated on PO + apex consent. §10's "option (c) is §1.2-compliant" is best-current-guess. §8.1 Q1/Q2 walkthrough deferred per 2026-04-16 deploy-first posture; smoke test is the empirical substitute.

## META-LESSONS — carry forward

[LEARNED] Team-lead guidance is input to my integration check, not a substitute for it. Folds from integrated reasoning survive iteration; single-source folds (endorsement I didn't originate) both needed reversal. Pre-fold consistency check: re-check whether an endorsement is consistent with latest doc state, not just whether it makes sense on its own.
[LEARNED] Retraction-scope cross-wires: a narrow retraction can be misread as broad guidance if scope isn't named. Sender discipline: name scope of every retraction. Receiver discipline: state scope assumption before folding.

## XIREACTOR-PILOT VJS2KB DEPLOY — Phase 1 (2026-04-16)

[CHECKPOINT] Phase 1 artifacts written to `containers/xireactor-pilot/` (15 files). PO "deploy first, design later" override accepted — 4 design docs become post-deploy evaluation frameworks, not preconditions. v0.6.3 §Status gate explicitly overridden.
[DECISION] Smoke test = §8.1 walkthrough substitute. Three checks: A (FR writes, FR reads), B (FR invisible to apex — Q2 invariance), C (apex invisible to FR — Q1 RLS). On FAIL: teardown (§1.2), NOT patch.
[DECISION] Ruth-team port 2224 → **2228** (NOT 2226 — BT-TRIAGE collision per deployments.md:21). Updated ruth-team-container-design + deployments.md coherently. xireactor-pilot claims no SSH; uses TCP 8010 (Tailscale). New "Backend services (non-SSH)" section added to deployments.md.
[DECISION] Path (a) confirmed — artifact generation on workstation, operator executes DEPLOY.md on RC. Team-lead tool restrictions don't authorize SSH/docker; Agent-tool Bash runs on Windows, not RC.
[LEARNED] "Port 2225+" brief was imprecise — mixed SSH port pool (2222-2227) with backend port space (8010+). xireactor-pilot is backend. Pattern: when port numbers appear in a brief, name the space explicitly.
[LEARNED] Global port collision bites across hosts. hr-devs=2225, BT-TRIAGE=2226, comms-dev=2227 are PROD-LLM-resident but anchor the sequence ruth-team must respect. Registry is cross-host, not per-host.
[WIP] Phase 2 (deploy log KB entry + token wiring) blocked on Phase 1 commit + operator DEPLOY.md execution. Template in README.md §Bootstrap KB entry; consumer MCP snippets ready in `mcp-client-snippets/`.
[GOTCHA] Bootstrap SQL 9001/9002 use placeholder user columns — real upstream auth table shape NOT verified (needs §8.1 walkthrough, deferred). DEPLOY.md step 5 flags this; operator may need to adapt.
[GOTCHA] `docker-compose.override.yml` `mcp` service uses `deploy.replicas:0 + profiles:[disabled]` to null out upstream's mcp. Fallback if upstream v0.2.0 doesn't respect these fields is forking their compose — violates §1.2. Escalate if hit at deploy time.

## NEXT-SESSION-CHORE

[CHORE] §8 header labels (SOFT/MEDIUM) in v0.6.3 may still carry stale Monte v3 §7.2 classifications — verify they align with Herald v1.2 (c)/(c) and §8.1 framing. Deferred per deploy-first posture.
[CHORE] `containers/xireactor-pilot/` vs `.claude/teams/ruth-team/infra/` layout reconciliation still open per team-lead. Not my chore this session.

## RUTH-TEAM DESIGN (2026-04-15)

[CHECKPOINT] Design v1.0 ACCEPTED — `docs/ruth-team-container-design-2026-04-15.md`, 384 lines. Bumped v0.1→v1.0 by team-lead. All six design requirements accepted.
[DECISION] Recommended bridge = option C (git-mediated) with B-only write-through cache at `/home/dev/ruth-apex-bridge/`. Only option that's E-native (Swarm volumes aren't cross-service). Staging cache gives A-speed on B without portability debt.
[DECISION] Ruth-team SSH user = `ai-teams` (same as apex-research, not a new per-team user). Container isolation already provides the boundary; user variation adds no gain and forks the tooling.
[DECISION] Port 2224 proposed for ruth-team sshd (skipping 2223 to avoid runbook §4 debug-port collision).
[PATTERN] Parameterization contract table (TEAM_NAME, HOST_WORKSPACE_DIR, DEPLOYMENT_MODE etc.) — reusable skeleton for future teams. Brunel recommendation: promote to runbook as §24 after Ruth-team actually deploys and validates the contract.
[GOTCHA] `network_mode: host` + Swarm incompatibility — B uses host mode (WARP forced), E cannot. Compose file must have two profiles (`b-host` vs `e-swarm`) from day one. Don't ship a single-profile compose and then scramble at migration.
[DECISION] Bridge repo = subdir of `mitselek/ai-teams` (not separate repo). Team-lead answer.
[DECISION] HR_NOTIFICATION_EMAIL carryover = N/A, closed. Team-lead answer.
[DECISION] Interaction channel = SSH + tmux pane (same as operator→apex-research). Zero new infra. Teams integration deferred → `mitselek/ai-teams#57` research backlog.
[REQUIREMENT] Infra files (Dockerfile, compose, entrypoint, helper scripts) must be commit-tracked in-repo under a designated path. NOT on operator workstation. Suggested: `.claude/teams/ruth-team/infra/` or `containers/ruth-team/` at repo root — my call on layout. Applies to next build step.
[REQUIREMENT] Do NOT proactively write Dockerfile yet. Wait for Monte/Herald answers + team-lead build brief.
[WIP] Monte governance answers (§4.3 — Q1-Q4) still open. Q1-Q2 on critical path for build (credential injection).
[WIP] Herald bridge protocol shape (§5.3 — Q1-Q3+Q4) still open. Q1 on critical path for build.
[LEARNED] Volta will likely add a §6.5 observability/instrumentation addendum atop my substrate after Ruth responds. Not my layer — but expect it and don't be blindsided.

## KEY GOTCHAS (carry forward — all containers)

[GOTCHA] WARP TLS interception: network_mode:host + NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem + system CA.
[GOTCHA] Named volumes created as root → chown 1000:1000 in entrypoint.
[GOTCHA] SSH: useradd creates locked account. Fix: usermod -p '*' for pubkey auth.
[GOTCHA] Container rebuild regenerates SSH host keys → `ssh-keygen -R "[host]:port"` after rebuild.
[GOTCHA] tmux inherits locale from starting process. Use `tmux -u` or bake LANG into Dockerfile.
[GOTCHA] CRLF from Windows git autocrlf breaks entrypoints. Fix: `sed -i 's/\r$//'` then rebuild.
[GOTCHA] Root-owned /tmp files block ai-teams writes — create tmux sessions as target user.
[GOTCHA] Consecutive `**Bold:**` lines collapse on GitHub. Use `- **Bold:**` bullet lists.

## DEPLOYMENT

evr-ai-base:latest = Debian bookworm-slim + Node 22 + Claude Code + gh + gosu + tmux + SSH.
VJS2-AI-teams repo: `C:/Users/mihkel.putrinsh/Documents/github/VJS2-AI-teams/`
Designs repo: `mitselek-ai-teams/designs/deployed/<team>/container/`

## APEX-RESEARCH LIBRARIAN DEPLOYMENT (2026-04-13)

[CHECKPOINT] SHIPPED. PR #57 merged to `Eesti-Raudtee/apex-migration-research` (`feat/librarian-eratosthenes`, 12 files, 752 insertions). Schliemann spawns Eratosthenes into pre-created pane %5. Three-way cross-read caught Protocol A/B field-set bug + wiki/index.md + intake_complete dangling refs before merge.
[DECISION] Structural-discipline cluster SHIPPED as L1 team law (commit 589fda9). 5 members across 5 gates: drafting → cross-read → pre-merge → pre-deployment → post-bootstrap. My gate-inventory framing was the load-bearing argument. "Prompt-to-artifact cross-verification" filed at `wiki/patterns/prompt-to-artifact-cross-verification.md`.
[PATTERN] apex-research attribution `(*AR:<Name>*)` differs from our `(*FR:<Name>*)`. Config SOT in `~/workspace/.claude/teams/apex-research/` (repo); runtime `~/.claude/teams/...` ephemeral per startup.md.
[DECISION] Pass1/Pass2 separation: prose renamed Oracle→Librarian, but machine identifiers (`agentType: "oracle"`, `oracle-state.json`, `filed-by: oracle`) ALL stay as "oracle" until Pass2 atomic flip. Cross-team consistency with Cal's Callimachus state. Reviewers must NOT normalize.
[DECISION] Wiki subdirs universal set only: patterns/ gotchas/ decisions/ contracts/ archive/. No observations/process/findings — apex-research proposes domain-specific post-first-use.
[DECISION] Delivery via git PR (repo is SOT). Phase A patches drafted. Phase B: team-lead PR to Eesti-Raudtee/apex-migration-research. Phase C: Schliemann git pull + tmux split + spawn_member.sh in live session.
[GOTCHA] Inbox files created at agent registration time. If a specialist sends to a not-yet-registered agent, message is LOST — no retry. Verified live in container. Spawn order must put service-role agents (librarian) BEFORE message senders.
[PATTERN] Dual-sourced docs (same content in common-prompt + role-specific prompt) must be defended with a forward statement in BOTH copies, not a footnote — footnotes get pruned by DRY pressure, forward statements get inherited.
[LEARNED] [SUBMITTED] Protocol shapes are FIELD-SET CONTRACTS, not prose. When two agents share a protocol, field set must match exactly — Scope/Confidence/Related/Evidence are load-bearing for downstream logic. Drafting from "what I think a submission should look like" produces silent classification breakage. ALWAYS read receiver's full prompt before drafting any protocol the sender uses. Tonal variation OK; field divergence breaks the interface. Filed at `wiki/patterns/protocol-shapes-are-typed-contracts.md` (Cal, 2026-04-13).
[LEARNED] Cross-read should happen at handoff time, not as final sanity check. When a collaborator pings with v2.5/integration announcement, read their FULL artifact then, not just the section they explicitly asked about.
[PATTERN] Submission format calibration from Cal: cite related entries by file path (`patterns/foo.md`), not natural-language descriptor — speeds librarian dedup scan. Apply on next Protocol A submission.
[CHECKPOINT] Meta-pattern SHIPPED: "Structural Change Discipline" promoted to common-prompt L1 team law via Protocol C (commit 589fda9, 2026-04-13). 5 verification gates, 5 cluster members, 29 wiki entries total.

## UIKIT-DEV (2026-04-13 migration sealed)

[CHECKPOINT] Full A+B+C migration SHIPPED. First non-framework-research team using Structural Change Discipline as active guardrail. SSH key `id_ed25519_uikit` → port 2228, team config durable in `Eesti-Raudtee/evr-ui-kit:develop` at `.claude/teams/uikit-dev/`, rc-connect key `8` via `Eesti-Raudtee/dev-toolkit:master f278a93`.
[CHECKPOINT] Lifecycle scripts match framework-research/Volta pattern: persist prunes to 100, restore strips shutdown/idle via external `restore-filter.jq`. Do NOT mark-read — Volta doesn't, and neither should we.
[LEARNED] Dry-run is the cheapest bug-catching gate. Reading the script passed; running it found a mangled jq regex (`""type""` vs `\"type\"`) that would have shipped broken. Commit `1deb90e` fixed via external filter file.
[LEARNED] Base64-encode-via-SSH strips shell-escape backslashes. For scripts with `\"` or `\s`, write via heredoc with single-quote delimiter or `cat > file << 'EOF'` — never via echo/base64 pipelines.
[LEARNED] Task assignments ≠ checkpoint approvals. When PO says "report after each phase", wait for the approval reply before moving on — even if a queued task for the next phase is already visible. Checkpoint violation noted but outcomes accepted this time.
[GOTCHA] evr-ui-kit `.git/config` has `GITHUB_TOKEN` embedded in push URL — stored in the container. Survives rebuilds. Flagged for separate rotation task.
[GOTCHA] **3rd team-config dir found post-migration** (Aalto surfaced 2026-04-13 18:28): `/home/ai-teams/team-config/` is the pre-session bootstrap source with the ORIGINAL 6447-byte `common-prompt.md` (Apr 9 timestamps — comprehensive: Component Conventions, TDD Mandate, Directory Ownership, Git Workflow, Directory Ownership tables). My Phase B migration committed a STUB drafted from the agent prompts alone. `roster.json` + all 5 `prompts/*.md` are byte-identical across team-config/ and repo (zero diff) — only common-prompt.md diverges. team-config/ timestamps predate Aalto's tmux boot (09:58 Apr 13) — confirms it's the bootstrap source. Investigation paused 2026-04-14 08:16 pending PO scope decision. DO NOT proceed on task #12 without re-acknowledgment.
[LEARNED] **Recon pattern was too narrow.** Assumed team config lives at `.claude/teams/<team>/`. Reality: container has N locations (`team-config/`, `.claude/teams/<team>/`, repo-side). Next team migration — scan whole `$HOME` for team-related dirs, don't pre-assume the path. Write Protocol A after PO decision.

## RAAMATUKOI-DEV (2026-04-09)

[CHECKPOINT] Deployed to `Raamatukoi/tugigrupp` — 14 commits, full config.
[LEARNED] GitHub markdown gotcha hit 3 times — now in KEY GOTCHAS above.

## COMMS HUB (2026-03-31)

[CHECKPOINT] Hub on PROD-LLM, 4 teams connected. Bridge proven end-to-end.
[GOTCHA] Bridge `setInterval.unref()` kills standalone process — needs keep-alive.
[GOTCHA] Claude Code sandbox kills background processes — use `docker exec -d`.

## CLOUDFLARED SIDECAR

Tunnel ID: 526a23d1-1f7f-472f-8df1-a9239bbe3fe4
Ingress: `apex-research.dev.evr.ee` → `http://apex-research:5173`
[DEFERRED] QUIC blocked → needs `--protocol http2` flag.

## DISCUSSION #56: SINGLE-PROVIDER MODEL STRATEGY (2026-04-10)

[DECISION] Single-provider is correct default for agent runtime. Multi-provider = sidecar, not peer.
[PATTERN] Three integration seams: peer (Claude-only), sidecar/daemon (Eilama), MCP server (visual QA).
[PATTERN] Audit independence ≠ different-provider Medici. Correct pattern: external audit container reading committed git artifacts.
[PATTERN] Visual QA sidecar ≠ Eilama pattern. Needs headless browser, multimodal API, image volumes, HTTP API — closer to MCP server.
[WIP] Document provider outage behavior inside containers (what does claude process do on API failure?).
[WIP] Spec external audit container architecture if team pursues audit independence.

## DEFERRED

[DEFERRED] OAuth on hr-devs PROD-LLM container — PO manual step.
[DEFERRED] Hub container as standalone Docker image.
[DEFERRED] raamatukoi-dev VPS container deployment — design on GitHub, container TBD.
[DEFERRED] MCP server pattern for visual QA service — scope if uikit-dev needs it.
