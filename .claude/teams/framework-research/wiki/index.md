# Wiki Index

Knowledge base for the framework-research team. Curated by Callimachus (Librarian).

## Directories

| Directory | Contents |
|---|---|
| `patterns/` | Reusable patterns extracted from submissions |
| `gotchas/` | Cross-agent pitfalls |
| `decisions/` | Architecture decisions with rationale |
| `contracts/` | API shapes, type definitions |
| `process/` | Emerging process patterns (research team) |
| `observations/` | Cross-cutting insights citing topic files (research team, never authoritative) |
| `findings/` | Pre-topic-file findings (research team) |
| `archive/` | Stale or superseded pages |

## Entries

### patterns/

- [`in-process-respawn.md`](patterns/in-process-respawn.md) — Three-step fix for respawning agents after a crash without tmux (jq cleanup of dormant config.json entries)
- [`cathedral-trigger-quality-teams.md`](patterns/cathedral-trigger-quality-teams.md) — Cathedral tier is deterministic when the team's mission IS eliminating structural debt
- [`multi-repo-xp-composition.md`](patterns/multi-repo-xp-composition.md) — Shared ARCHITECT + separate PURPLEs + shared Librarian for multi-repo teams with different stacks
- [`xp-cycle-for-infrastructure.md`](patterns/xp-cycle-for-infrastructure.md) — XP pipeline applies to infrastructure stories (test setup, CI), not just features
- [`model-tiering-by-consequence.md`](patterns/model-tiering-by-consequence.md) — Opus for invisible/accumulating errors, sonnet for test-gated output; cost excluded per PO directive #49
- [`claude-infrastructure-dependencies.md`](patterns/claude-infrastructure-dependencies.md) — Three layers of Claude-specific dependencies: infrastructure (hardest), protocol conventions (medium), model naming (easiest)
- [`multi-provider-integration-seams.md`](patterns/multi-provider-integration-seams.md) — Peer (Claude-only), daemon/sidecar (Eilama), MCP server (proposed) — seam choice by interface complexity
- [`protocol-interpretation-variance.md`](patterns/protocol-interpretation-variance.md) — Four dimensions of multi-provider protocol risk: format compliance, authority boundaries, relay fidelity, structured ACKs
- [`platform-vs-provider-lock-in.md`](patterns/platform-vs-provider-lock-in.md) — Claude Code (platform) and Anthropic (provider) are distinct lock-in risks; migration planning must separate them
- [`correlated-failure-single-provider.md`](patterns/correlated-failure-single-provider.md) — All 5 enforcement layers (E0-E4) collapse simultaneously on provider outage; T04 gap identified, multi-provider mitigation has 7 governance prerequisites
- [`integration-seam-governance-impact.md`](patterns/integration-seam-governance-impact.md) — Sidecar = minimal governance (below governance layer); peer = non-linear governance (inside governance layer); classify before analyzing
- [`model-inventory-baseline.md`](patterns/model-inventory-baseline.md) — 68 slots across 9 teams: 63% opus, 35% sonnet, 1.5% local LLM; point-in-time snapshot (TTL: 2026-07-10)
- [`five-layer-provider-lock-in.md`](patterns/five-layer-provider-lock-in.md) — Infrastructure, protocol, knowledge, prompt, governance: five lock-in layers with different switching costs; execution layer is the exception
- [`framework-participating-vs-service-roles.md`](patterns/framework-participating-vs-service-roles.md) — Roles using SendMessage/Librarian/authority = Claude-only; roles with test-gated I/O = provider-agnostic; tools (MCP) are not agents
- [`pass1-pass2-rename-separation.md`](patterns/pass1-pass2-rename-separation.md) — Framework-wide identifier renames separate into Pass 1 (prose, ship now) and Pass 2 (machine identifiers, batch later); schema changes ship in Pass 1 because they enable new behavior
- [`within-document-rename-grep-discipline.md`](patterns/within-document-rename-grep-discipline.md) — Grep the whole document before editing the declaration site; references live in the body, not the schema block. Sibling to pass1-pass2-rename-separation at file scope
- [`protocol-shapes-are-typed-contracts.md`](patterns/protocol-shapes-are-typed-contracts.md) — Field-set divergence between independently-drafted producer/consumer specs breaks protocols silently; cross-read both ends, lift consumer's field set verbatim. Cross-team scope

### gotchas/

- [`contract-enforcement-gap-non-claude.md`](gotchas/contract-enforcement-gap-non-claude.md) — No mechanism to define, test, or enforce protocol compliance for non-Claude participants; prerequisite gap for multi-provider expansion
- [`external-synthesis-overreach.md`](gotchas/external-synthesis-overreach.md) — External reviewers promote conditionals to recommendations, treat hypotheticals as confirmed, and flatten specialist nuance; verify after any outsider synthesis
- [`cloudflare-d1-migration-query.md`](gotchas/cloudflare-d1-migration-query.md) — 10 D1 gotchas from hr-devs: CASCADE ignores PRAGMA, safe `_new` rename pattern, BLOB traps, silent row drops, MCP write access ($5K incident)
- [`dual-team-dir-ambiguity.md`](gotchas/dual-team-dir-ambiguity.md) — Bare `.claude/teams/<team>/` resolves to two distinct dirs (Repo team config dir at `$REPO`, durable; Runtime team dir at `$HOME`, ephemeral). Wrong-root writes vanish silently on container rebuild. Fix: leading Path Convention section anchors all bare paths to `$REPO`. Production: Eratosthenes first boot, 2026-04-13

### decisions/

- [`cost-tracking-out-of-scope.md`](decisions/cost-tracking-out-of-scope.md) — Token/cost tracking is an organizational concern, not a team concern; no quantitative data exists by design
- [`audit-independence-architecture.md`](decisions/audit-independence-architecture.md) — Audit independence requires a separate read-only container, not a Medici provider swap; Medici's tool deps make in-place swap infeasible

### observations/

- [`knowledge-coherence-as-provider-constraint.md`](observations/knowledge-coherence-as-provider-constraint.md) — The binding multi-provider constraint is knowledge coherence (semantic compatibility of agent artifacts), not infrastructure lock-in

(*FR:Callimachus*)
