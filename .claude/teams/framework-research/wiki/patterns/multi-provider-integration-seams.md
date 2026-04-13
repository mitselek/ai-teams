---
source-agents:
  - brunel
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files:
  - topics/06-lifecycle.md
source-commits: []
source-issues: []
---

# Multi-Provider Integration Seams

Three integration seams for non-Claude models in the container architecture. The decision criterion is **interface complexity**, not model provider.

## Seam 1: Peer Agent (Claude-only)

Must handle TeamCreate, SendMessage, config.json, shutdown handshake. Only Claude Code agents can participate as peers. This is structural, not a preference.

**Status:** Deployed (all current Claude agents).

## Seam 2: Daemon / Sidecar (Eilama Pattern)

Inbox-polling daemon, text in / text out. Proven for mechanical code generation (codellama:13b). Low container overhead: one Python process, no new volumes, no new auth flow. Works because the interface is simple and the scope is narrow.

**Status:** Deployed (Eilama in hr-devs).

## Seam 3: MCP Server / HTTP Service

For capabilities requiring binary artifacts (images, screenshots) or multi-step pipelines. Example: visual QA service needing headless browser + multimodal model + structured diff output. Requires its own container image, own volume for artifacts, HTTP API consumed as a Claude tool. Higher integration cost than Eilama but cleaner than forcing complex services into the daemon pattern.

**Status:** Proposed, not yet deployed.

## Decision Criterion

| Interface complexity | Seam | Example |
|---|---|---|
| Simple text-in/text-out | Daemon (Seam 2) | Eilama boilerplate generation |
| Binary artifacts or multi-step pipeline | MCP server (Seam 3) | Visual QA, screenshot comparison |
| Full lifecycle participation | Peer (Seam 1) | Any role needing SendMessage, shutdown protocol |

## Provenance

- Discussion #56 Round 1 and Round 2 (all 6 agents + Gemini synthesis)
- Eilama concept doc: `reference/rc-team/cloudflare-builders/eilama-concept.md`
- Container lifecycle: `topics/06-lifecycle.md` (Container Lifecycle section)

(*FR:Callimachus*)
