# Brunel scratchpad

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
[DEFERRED] Awaiting Cal's eval of candidate 4th structural-discipline instance I flagged on Celes's behalf (13:25 msg): "prompt-to-artifact cross-verification". Either distinct entry (cluster → 4) or dedup of #3 protocol-shapes-are-typed-contracts. Both outcomes fine.
[PATTERN] apex-research attribution `(*AR:<Name>*)` differs from our `(*FR:<Name>*)`. Config SOT in `~/workspace/.claude/teams/apex-research/` (repo); runtime `~/.claude/teams/...` ephemeral per startup.md.
[DECISION] Pass1/Pass2 separation: prose renamed Oracle→Librarian, but machine identifiers (`agentType: "oracle"`, `oracle-state.json`, `filed-by: oracle`) ALL stay as "oracle" until Pass2 atomic flip. Cross-team consistency with Cal's Callimachus state. Reviewers must NOT normalize.
[DECISION] Wiki subdirs universal set only: patterns/ gotchas/ decisions/ contracts/ archive/. No observations/process/findings — apex-research proposes domain-specific post-first-use.
[DECISION] Delivery via git PR (repo is SOT). Phase A patches drafted. Phase B: team-lead PR to Eesti-Raudtee/apex-migration-research. Phase C: Schliemann git pull + tmux split + spawn_member.sh in live session.
[GOTCHA] Inbox files created at agent registration time. If a specialist sends to a not-yet-registered agent, message is LOST — no retry. Verified live in container. Spawn order must put service-role agents (librarian) BEFORE message senders.
[PATTERN] Dual-sourced docs (same content in common-prompt + role-specific prompt) must be defended with a forward statement in BOTH copies, not a footnote — footnotes get pruned by DRY pressure, forward statements get inherited.
[LEARNED] [SUBMITTED] Protocol shapes are FIELD-SET CONTRACTS, not prose. When two agents share a protocol, field set must match exactly — Scope/Confidence/Related/Evidence are load-bearing for downstream logic. Drafting from "what I think a submission should look like" produces silent classification breakage. ALWAYS read receiver's full prompt before drafting any protocol the sender uses. Tonal variation OK; field divergence breaks the interface. Filed at `wiki/patterns/protocol-shapes-are-typed-contracts.md` (Cal, 2026-04-13).
[LEARNED] Cross-read should happen at handoff time, not as final sanity check. When a collaborator pings with v2.5/integration announcement, read their FULL artifact then, not just the section they explicitly asked about.
[PATTERN] Submission format calibration from Cal: cite related entries by file path (`patterns/foo.md`), not natural-language descriptor — speeds librarian dedup scan. Apply on next Protocol A submission.
[WIP] Meta-pattern (Cal's observation, worth chewing on): silent failure modes need explicit structural gates because no automated check catches them. The discipline IS the gate. Triplet so far: Pass1/Pass2 separation, within-document grep, consumer-as-source-of-truth cross-read. If I observe a 4th instance (ADR amendments, roster.json migrations, common-prompt rule additions), submit to Cal and propose Protocol C promotion to "Structural Change Discipline" common-prompt section.

## UIKIT-DEV (2026-04-10)

[CHECKPOINT] 82MB Figma JSON transferred to `uikit-dev` container: scp→host→docker cp→chown.
[CHECKPOINT] Container: `uikit-dev` on `dev@100.96.54.170`, image `uikit-dev-claude:latest`, repo `Eesti-Raudtee/evr-ui-kit`.
[LEARNED] No deployed teams register exists. Proposed README.md table — outside write scope, awaiting team-lead.

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
