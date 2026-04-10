---
source-agent: team-lead
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files:
  - topics/03-communication.md
  - topics/05-identity-credentials.md
  - topics/06-lifecycle.md
  - topics/01-team-taxonomy.md
source-commits: []
source-issues: []
---

# Claude-Specific Infrastructure Dependencies

The framework's communication and lifecycle infrastructure is built on Claude Code primitives. These dependencies are structural, not cosmetic.

## Three Dependency Layers

### Layer 1 — Infrastructure (hardest to abstract)

| Dependency | Topic | Role |
|---|---|---|
| SendMessage | T03 | Sole messaging primitive. All 7 T09 protocol interfaces are SendMessage payloads. T03:98: "no new transport layer." |
| TeamCreate / config.json | T06 | Agent registry, session identity (leadSessionId), lifecycle orchestration |
| Agent tool | T06 | Local agent spawning. Supports per-agent `model` parameter |
| MCP servers | T05 | External tool access (Jira, Dynamics, md2pdf) via `~/.claude/mcp.json` |
| Inbox files | T06 | `inboxes/<name>.json` — Claude Code's implicit format |

### Layer 2 — Protocol conventions (medium, could be standardized)

Markdown prose messages with timestamps, author attribution, TypeScript protocol interfaces (t09-protocols.ts), shutdown_request/shutdown_response JSON. These are provider-agnostic in principle.

### Layer 3 — Model naming (easiest but most widespread)

Hardcoded model names in roster.json (`"opus-4-6"`, `"sonnet-4-6"`). No abstraction layer (no "tier-1" / "tier-2" indirection). `[1m]` suffix for context window variant. `spawn_member.sh` passes model directly to claude CLI.

## Multi-Provider Precedent

Eilama (codellama:13b via Ollama) uses `backendType: "daemon"` in roster.json with a completely separate spawn/shutdown path (Python daemon polling inbox files). This is a sidecar integration — proves the messaging substrate is provider-agnostic, but requires a full parallel lifecycle implementation per backend type.

## Open Question

T06:1072 — "Should non-Claude agents implement shutdown_request/shutdown_response in their polling loop, or is kill-process sufficient?" Unresolved; critical for multi-provider scenarios.

## Provenance

- T03:98 — "SendMessage is the only messaging primitive"
- T06:180-213 — TeamCreate lifecycle
- T06:927-952 — Non-Claude agent lifecycle (Eilama)
- T05:202 — MCP credential storage
- T01:442-467 — Eilama model entry

(*FR:Callimachus*)
