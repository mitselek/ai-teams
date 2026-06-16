# Managing Context in Designed Specialist Teams with Claude Code

*How a 10-agent research team keeps its own knowledge from becoming the bottleneck.*

---

We run a multi-agent research team using Claude Code's Agent tool and team primitives. Ten specialists -- a librarian, protocol designer, lifecycle engineer, deployment operator, and others -- each with their own prompt, scratchpad, and role boundaries. They communicate through mailboxes, file wiki entries through a centralized knowledge curator, and coordinate through a team lead.

It works well. The problem is what happens after 40 sessions: 119 wiki entries, scratchpads that grow to 780 lines, an always-loaded common-prompt stuffed with step-by-step procedures every agent carries in context whether they need them or not. At some point your team's accumulated knowledge becomes the bottleneck, not the enabler.

We spent one session fixing this. Five improvements, three agents working in parallel, 151 files changed. Here's what we did and why.

## 1. Three-tier wiki: index, card, full entry

**The problem:** Our librarian (Callimachus) curates a wiki of team patterns, gotchas, and process notes. When another agent queries the wiki, Cal loads the full entry to answer -- often 150+ lines of evidence chains, provenance, and amendment logs, when the agent just needed a 3-sentence answer.

**The fix:** Three tiers of the same knowledge, at different compression levels.

```
wiki/
├── index.md                     ← "what exists?" (~1 line per entry)
├── patterns/
│   ├── cards/INDEX.md           ← per-directory table with links
│   ├── cards/
│   │   └── substrate-invariant-mismatch.md   ← ~30 lines, queryable
│   └── substrate-invariant-mismatch.md       ← full entry, unbounded
```

| Tier | Artifact | Size | Answers |
|---|---|---|---|
| Index | `cards/INDEX.md` | ~1 line/entry | "What exists? Where is it?" |
| Card | `cards/<name>.md` | ~30 lines | "What does this say?" -- resolves most queries |
| Full | `<name>.md` | unbounded | "Show me the evidence and provenance" |

A card is a YAML-frontmatter file with a TLDR (2-3 sentences) and key ideas (5-8 bullets). The librarian generates them at filing time -- extractive, not transformative. The TLDR writes itself from the entry's opening paragraph; key ideas are the load-bearing bullets stripped of evidence chains.

The insight that made this work: **queryable vs evidentiary**. Only ideas that answer questions belong on the card. Ideas that support claims stay in the full entry. The card tier is a sieve, not a summary.

**Why a librarian, not self-service?** Our wiki is consumed through a dedicated librarian agent, not by agents browsing directly. When an agent queries "do we have a pattern for X?", the librarian doesn't just find one entry -- she cross-references related entries, flags disputes, and knows whether the entry has been confirmed by its co-authors. A direct grep might find 3 of 5 relevant entries; the librarian knows all 5 because she filed them and maintains the cross-links.

In practice, the access pattern is mixed: the team lead reads entries directly for coordination context; specialists query the librarian for discovery ("I don't know if this exists"). The tiers serve both -- the librarian answers from cards instead of loading full entries, and direct readers use cards and indexes to navigate without grep. But the librarian-mediated path is where the tiers pay off most: they're what make a curator-based model scale to 119+ entries without the curator drowning in her own corpus.

**Result:** 118 cards across 8 directories. Average ~5x compression.

## 2. Scratchpad summary headers

**The problem:** Agent scratchpads are working memory -- decisions, work-in-progress, carry-forward items. They grow during a session and get pruned at the end. But "pruned" is a discipline that agents follow inconsistently. Our librarian's scratchpad hit 780 lines. On startup, the team lead reads every active agent's scratchpad to orient -- at 780 lines each, that's a context budget problem.

**The fix:** First 15 lines of every scratchpad are a fixed-format summary header:

```markdown
# Agent Scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** one line
- **Active items:** bullet list
- **Key decisions this session:** bullet list
- **Carry-forward:** bullet list -- DEFERRED / WARNING / UNADDRESSED

---
## Session transcript (prune beyond line 100)
```

The header is a **derived view**, not an append target. Agents rewrite it at each checkpoint and at shutdown -- it summarizes the transcript below. This distinction matters: if agents start appending to the header, it grows past 15 lines and defeats the purpose.

**The 100-line structural limit** has teeth now. The header is never pruned; the transcript is. Durable knowledge gets promoted to the wiki (via the librarian) or docs before pruning. The scratchpad is working memory, not a journal.

**Result:** Team lead reads 15-line headers for all agents on startup (~150 lines for 10 agents), then loads full scratchpads only for agents relevant to the current session's work.

## 3. Playbook extraction

**The problem:** Our `common-prompt.md` loads into every agent on every session. It contained behavioral contracts (communication rules, attribution, routing) alongside step-by-step procedures (structural change verification, shutdown checklist, relay fidelity protocol). Procedures that apply to <20% of agent-sessions were consuming context budget on 100% of them.

**The fix:** Extract procedures into on-demand `playbooks/` files. Keep behavioral contracts inline.

The discriminator: **"Who communicates what to whom"** stays inline -- every agent needs it always. **"Do X then Y then Z when performing action A"** extracts to a playbook -- agents load it only when performing that action.

```
# In common-prompt.md (before)
## Structural Change Discipline
When editing prompts, protocols, wiki entries, or cross-team artifacts,
apply these four verification gates in order...
[40 lines of step-by-step procedure]

# In common-prompt.md (after)
## Structural Change Discipline
When editing prompts, protocols, wiki entries, or cross-team artifacts,
apply the four verification gates before merging.
See `playbooks/verify-structural-change.md`.
```

Four playbooks extracted: structural-change verification, typed-contract versioning, relay fidelity, agent shutdown.

**Gotcha:** Some recipes live inside behavioral contracts. Our agent-spawning rule (behavioral: "spawn with `run_in_background: true`") contains a worktree-isolation recipe (procedural: "when two agents share a clone, run `git worktree add`..."). We left it inline and flagged it as a future extraction candidate. The boundary isn't always clean.

**Note on skills:** If your harness supports on-demand skill loading (e.g., Claude Code's `/skills`), evaluate whether skills are a better fit than plain files for your topology. Playbooks are harness-agnostic -- they're just markdown files an agent reads, portable across any orchestrator. Skills add automatic triggering and discoverability but tie you to a specific platform.

**Result:** ~47% common-prompt size reduction (141 to 112 lines, ~3,650 to ~1,920 tokens). Every agent session starts leaner.

## 4. Stage-2-confirms gate

**The problem:** Our wiki entries are filed by the librarian from specialist submissions. Joint entries (multiple source agents) go through a Stage 2 read-back -- each co-author reviews the filed entry and confirms or corrects. This practice existed but was unnamed, uncitable, and untrackable.

**The fix:** Name it. Add a `stage-2` field to every card's frontmatter:

```yaml
stage-2: pending    # or: partial, confirmed
```

Three states: `pending` (no read-back recorded), `partial` (some co-authors confirmed), `confirmed` (all co-authors read back). The gate is orthogonal to `confidence` -- a speculative entry can be confirmed (co-authors agree it's speculative), and a high-confidence entry can be pending (nobody's read it back yet).

The librarian sets the field at filing time and advances it when read-backs arrive. The field is greppable: `grep -rl 'stage-2: pending'` audits the entire wiki for unconfirmed entries.

**Design decision:** "Confirmed" means ALL named co-authors read back, not majority. Each author catches the error class their vantage enables -- a substrate engineer catches different defects than a protocol designer. A missing read-back is a missing class of catch, not a missing vote.

**Result:** 119 cards tagged. 79 confirmed (solo-authored or documented read-backs), 40 pending (joint entries awaiting formal read-back). The gate entry itself is `pending` -- its co-conveners haven't read it back yet, which is fitting.

## 5. Directory navigation signposts

**The problem:** Agents grep or glob to find files in `docs/`, `wiki/`, `topics/`, `designs/`. Each search costs tokens and may return noisy results.

**The fix:** A `CLAUDE.md` file in each directory -- a navigation map, not instructions.

```markdown
# docs/

## Contents
- team-os-context-mgmt-digest-2026-06-02.md -- External article analysis
- cf-pilot-status-and-s37-plan-2026-05-26.md -- Cloudflare pilot status report
- operations-log-2026-05.md -- Hopper's deployment ops log
...

## Key context
Research digests and operational docs. Finn writes most digests;
Hopper writes ops logs.
```

Under 50 lines each. Claude Code loads these automatically when navigating to the directory -- the agent discovers what exists without spending tokens on grep.

**Result:** Four signposts (docs, topics, designs, wiki). The wiki signpost complements rather than duplicates the librarian's index -- it describes what each subdirectory *is*, not what each entry *says*.

---

## The principle underneath

All five improvements are instances of the same idea: **tiered loading**. Don't give agents everything; give them the tier they need for the task they're doing.

| What | Always loaded | On query | On demand |
|---|---|---|---|
| Team rules | common-prompt (behavioral contracts) | -- | playbooks (procedures) |
| Agent state | scratchpad header (15 lines) | full scratchpad (100 lines) | wiki/docs (promoted knowledge) |
| Wiki knowledge | directory index (1 line/entry) | card (~30 lines) | full entry (unbounded) |
| Directory contents | CLAUDE.md signpost | -- | actual files |

The source article that inspired this work (Gupta & Stulberg's "Build a Team OS with Claude Code") describes the same principle for single-session navigation: nested CLAUDE.md files that load at ~3% of context window. Our topology is different -- multiple specialized agents with pre-loaded role context rather than one session navigating a folder tree -- but the principle transfers exactly.

The difference is where the tiers live. In a single-session Team OS, tiers are filesystem-triggered (enter a folder, load its CLAUDE.md). In a designed specialist team, tiers are role-and-task-triggered (spawn an agent, load its prompt + the tier of shared knowledge it needs). Same compression discipline, different loading mechanism.

## What it cost

One session. Three agents in parallel (librarian on cards + headers + gate, protocol designer on playbook extraction, research coordinator on signposts). Team lead coordinated and applied cross-cutting edits. ~45 minutes wall clock.

151 files changed, 3,706 lines added. Most of it is the 118 cards -- mechanical extraction, not creative writing.

## What we'd do differently

**Inbox delivery lag is real.** Our librarian's authorization messages kept crossing with her design reports -- she asked the same question four times because earlier approvals sat unread in her inbox while she composed. Multi-agent coordination has a structural latency that single-session work doesn't. Design your protocols to tolerate message-crossing: make decisions idempotent, expect re-asks, don't block on acknowledgments when the agent can safely proceed on the brief's explicit instructions.

**The behavioral/procedural boundary is blurry.** Our protocol designer made good judgment calls about what to extract vs keep inline, but two cases were genuinely ambiguous. When a procedure is embedded inside a behavioral contract, you can't cleanly extract it without splitting the section. We left those inline and flagged them -- better to have a known impurity than a broken extraction.

**Fail-closed beats nuance for new gates.** Our librarian initially proposed a nuanced three-bucket rule for backfilling the Stage-2 gate across existing entries (solo-authored = confirmed, joint = pending). This was the right call for the corpus. But for a *new* gate, fail-closed (everything starts pending) is simpler to reason about and impossible to game. Apply nuance to the backfill; apply strictness to the going-forward rule.

## Where this goes next

The librarian currently mediates all wiki writes (dedup, cross-referencing, Stage 2 tracking) and most discovery reads. Simple lookups -- "show me the card for substrate-invariant-mismatch" -- still route through her, which is overhead for a known-path query.

The next step is splitting reads from writes:

- **An MCP tool server for wiki cards** -- agents call `wiki_search(query)` mid-task and get matching cards back without context-switching to the librarian. The cards are already structured YAML + markdown -- a natural tool-serving shape. The librarian stays as the write gate (filing, dedup, Stage 2) but simple reads become self-service.
- **A routing playbook** -- documents when to use which access path. Know the file path? Read directly. Discovery query on a complex topic? Protocol B to the librarian. Quick lookup of a known concept? Use the wiki tool. The routing decision itself is the value.

The pattern: as the knowledge base grows, the curator's role shifts from answering every query to maintaining quality on writes and serving complex cross-referencing on reads. Self-service handles the simple cases; the curator handles the hard ones.

### Competency-backed personas

We learned this one the hard way. We have a security reviewer persona that claims expertise in NIS2, ISO 27001, GDPR, incident response, and five other domains. We ran it against a real PR -- a Cloudflare Access → Oracle APEX authentication bridge at a NIS2 essential-entity rail operator. The analysis was good: three independent runs converged on the same findings, correctly identified the JWT validation gap as blocking, and grounded every finding in specific regulatory articles.

Then we added source links. The agent couldn't reach the regulatory pages (JS-rendered, auth-gated), so it fabricated URL anchors that looked plausible but were broken. A security review with unverifiable regulatory citations has zero credibility. The entire deliverable was scrapped.

The root cause: the persona *claimed* regulatory expertise but had no backing documents on disk. Nine competency domains, zero source materials. The agent's only option was to cite from training data -- which is fine for analysis but not for verifiable links.

The fix is structural:

```
prompts/anderson.md              ← persona (behavioral contract)
knowledge/anderson/
├── COMPETENCIES.md              ← map: claimed competency → backing docs
├── nis2/
│   ├── directive-2022-2555.md   ← key articles, verified
│   └── küts-consolidated.md     ← Estonian transposition
├── gdpr/
│   └── regulation-2016-679.md
└── ...
```

Every persona that claims domain expertise gets a `knowledge/<agent>/COMPETENCIES.md` that maps each claimed competency to the documents backing it. The agent reads this lightweight map on spawn and loads specific docs on demand when a task touches that domain.

The critical rule: **if an agent's task requires a competency whose backing doc is missing, the agent must flag the gap before proceeding.** "My persona claims NIS2 expertise but I have no source documents for Art. 21. I cannot produce verified citations. Proceeding with analysis only, no regulatory references." Never silently infer what you can't source.

This composes with the three-tier pattern: COMPETENCIES.md is the card tier (what expertise exists and where it's backed), the source documents are the full tier (load on demand), and the gap-detection rule is the equivalent of the Stage-2-confirms gate for competency claims -- fail-closed on unverified authority.

---

*Built with Claude Code teams on the [mitselek/ai-teams](https://github.com/mitselek/ai-teams) framework-research team. The five improvements are tracked under [epic #67](https://github.com/mitselek/ai-teams/issues/67).*
