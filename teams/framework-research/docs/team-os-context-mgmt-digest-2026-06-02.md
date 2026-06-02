# Team OS Context Management — External Article Digest

**Source:** Aakash Gupta & Hannah Stulberg, "Build a Team OS with Claude Code" (2026-04-07)
**URL:** https://www.news.aakashg.com/p/claude-code-team-os
**Digest date:** 2026-06-02
**Digest author:** (*FR:Finn*)

---

## 1. What It Is

A production Team OS pattern for a cross-functional product team (PM, eng, data, strategy) at DoorDash scale. Shared GitHub repo where every function checks in documents; nested CLAUDE.md files serve as tiered navigation maps; parallel agents write to temp files to avoid parent-context overflow. Audience: individual contributors using Claude Code as daily operating system, not multi-agent framework designers.

## 2. Context Management Theory — Mapping to FR

### Their model: 4 pillars + 3 tiers

**4 pillars:** context (what the model can access), context window (~1M tokens), compaction (lossy compression when window fills), thinking room (gap between loaded info and window size = reasoning capacity).

**3-tier loading:** Tier 1 always-loaded (root CLAUDE.md, <500 tokens); Tier 2 on-query (folder CLAUDE.md, 200-500 tokens each, loaded when Claude navigates to folder); Tier 3 on-demand (actual content files, hundreds-to-thousands of tokens, loaded when specifically needed).

### FR mapping

Our startup.md read-order (`common-prompt.md` → `prompts/<agent>.md` → `memory/<agent>.md`) IS a tiered loading discipline — but **structurally different in two ways**:

1. **Their tiers are navigation-triggered; ours are agent-identity-triggered.** Their Tier 2 loads when Claude enters a folder (filesystem-walk-driven). Our Tier 2 loads at spawn time based on which agent you are (role-driven). Their model has no concept of agent identity; everything is one session navigating a folder tree. Our model has strong agent identity with per-agent context sets. The loading trigger is different even though the tiered shape is the same.

2. **Their compaction concern is single-session; ours is multi-agent coordination.** They worry about one session filling its window. We worry about N agents each needing enough context to coordinate via SendMessage without re-reading shared knowledge. Their "thinking room" concept maps to our common-prompt token budget — but our coordination overhead (message routing, protocol envelopes, scratchpad state) is a context cost they don't have.

**Structural similarity:** Both patterns recognize that flat-loading-everything is the failure mode, and tiered loading is the mitigation. The 3% context window claim (a customer query navigated to the right file consuming only 3% of window) is achievable in our topology IF each agent's startup context is kept lean — our common-prompt + agent-prompt + scratchpad at ~5-10K tokens is comparable to their Tier 1 + one Tier 2 load.

**Structural difference:** Their model is single-agent-navigates-tree; ours is multi-agent-with-pre-loaded-context-per-role. These are different solutions to the same problem (prevent compaction, preserve thinking room). Neither subsumes the other.

## 3. Nested CLAUDE.md as Navigation vs Our Prompt Architecture

Their nested CLAUDE.md files are **doc-index pointers**, not behavioral instructions. Each folder's CLAUDE.md says "here's what's in this folder and what each file is for" — a filesystem-level README pattern. Claude discovers content by walking the tree, reading each CLAUDE.md as a signpost.

Our `prompts/<agent>.md` files are **behavioral contracts** — they define what the agent does, what it's allowed to write, how it communicates, what its role boundaries are. Our `common-prompt.md` is a protocol spec, not a doc index.

**Same pattern?** No. Same shape (hierarchical markdown files that guide Claude's behavior), different function (navigation map vs behavioral contract). Their pattern could compose with ours: we could add doc-index CLAUDE.md files to our `docs/`, `wiki/`, `topics/` directories to reduce grep-and-navigate token burn when agents search for existing content. Currently our agents grep or glob to find files; a folder-level index would provide the same Tier 2 navigation benefit they describe.

**Is "3% context window" achievable in our topology?** For single-file lookup tasks, yes — an agent with lean startup context (~5K tokens) looking up one wiki entry (~1-2K tokens) would consume ~0.7% of a 1M window. For coordination-heavy tasks (Stage 2 read-backs across 4 entries, like today's task), no — the multi-entry read + multi-message send pattern inherently consumes more. The 3% claim is structurally about lookup efficiency, not coordination efficiency.

## 4. Parallel Agents + Temp Files vs Our SendMessage Coordination

Their parallel agent pattern: orchestrator spawns N agents, each reads specific context files and writes output to a temp file, orchestrator compiles. **Problem they solve:** multiple agents returning simultaneously overflow the parent's context window.

Our pattern: team-lead spawns N agents via `run_in_background: true`, each sends results via SendMessage, team-lead synthesizes.

**Key difference: where output lands.** Their temp-file pattern keeps agent output OUT of the parent context until the orchestrator explicitly reads it. Our SendMessage pattern delivers output INTO the recipient's inbox immediately. Their pattern is pull-based (orchestrator reads temp files when ready); ours is push-based (agents send messages when done).

**Their failure mode (context overflow from simultaneous returns) does NOT apply to our substrate.** SendMessage delivers to inbox; the recipient processes messages sequentially from inbox. The Claude Code Agent-tool substrate handles this — messages queue, they don't overflow. Their temp-file pattern is a workaround for a substrate limitation (parent Agent-tool context overflow) that our mailbox-based substrate doesn't have.

**However:** their temp-file pattern IS relevant for a different FR concern — **artifact handoff between agents.** When Agent A produces a large artifact (research digest, design doc) for Agent B, writing to a file and sending a pointer via SendMessage is more context-efficient than embedding the full content in the message body. We already do this implicitly (Finn writes to `docs/`, sends pointer to team-lead), but haven't named it as a discipline.

## 5. Context Rot vs Our Staleness Mitigations

Their "context rot" failure mode: repo becomes outdated, Claude uses stale competitive intel, outdated metrics. Their mitigation: feature launch gate (repo must be updated before feature ships), daily learning prompts, shared automations that surface drift.

Our analogs:
- **Scratchpad staleness:** 100-line cap + prune discipline (I just pruned from 352 to ~80 lines this session)
- **Wiki TTL:** Cal's entries carry TTL dates (e.g., Edit-tool-trap TTL 2026-11-27); re-verification is cheap
- **Medici health audits:** periodic scratchpad + docs freshness checks

**Same problem, different mitigation shape.** Their mitigation is process-gate (can't ship without updating); ours is TTL-and-audit (periodic verification). Their shape works better for high-churn product content (metrics change with every release). Our shape works better for framework knowledge (patterns don't change with every session, but do need periodic re-verification against substrate).

**Their "clear between tasks" discipline** (type `clear` when switching) maps to our per-agent-session-boundary — each agent spawn is a clean context. We don't have the "leftover context pollutes results" problem because each agent starts fresh. This is a structural advantage of multi-agent over single-session patterns.

## 6. Cal Candidates

### Candidate 1 — Pattern-class (scratchpad-grade): File-pointer-over-message-body for large artifacts

When an agent produces a large artifact for another agent, write to file + send pointer via SendMessage is more context-efficient than embedding content in message body. We already do this; naming it would make it explicit. **Assessment: scratchpad-grade.** The practice is obvious and already in use; naming it adds marginal value. Promote to Cal only if a failure instance surfaces (agent embeds 2K+ tokens in a message when a file-pointer would suffice).

### Candidate 2 — Pattern-class (scratchpad-grade): Navigation-index CLAUDE.md for non-prompt directories

Adding doc-index CLAUDE.md files to `docs/`, `wiki/`, `topics/` would provide Tier 2 navigation benefit, reducing grep token burn. **Assessment: scratchpad-grade.** Straightforward application of their pattern to our topology. Not wiki-grade because it's a configuration choice, not a discovered invariant or gotcha. Worth considering operationally.

### Candidate 3 — Observation (no submission): Single-agent-navigates-tree vs multi-agent-with-roles

The article's entire architecture assumes one Claude session navigating a shared repo. Our architecture assumes N specialized agents each with role-scoped context. These are **genuinely different design families**, not variants of one pattern. The article validates that tiered context loading matters; it does NOT validate (or invalidate) our multi-agent approach. No Cal submission — this is a framing observation, not a pattern or gotcha.

## 7. Open Questions

1. Their 1,500-hours claim (Hannah Stulberg still iterating daily) — is this the maturation curve for single-user Team OS? If so, our multi-agent framework's maturation curve is structurally longer (more moving parts). No action needed; just calibration.
2. Their feature-launch-gate pattern could transfer to our wiki: "wiki entry not filed until source-agent Stage 2 read-back confirms." We already do this via the Stage 2 read-back discipline — but haven't named it as a gate. Consider whether naming adds value.

(*FR:Finn*)
