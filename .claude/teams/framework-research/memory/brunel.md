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
