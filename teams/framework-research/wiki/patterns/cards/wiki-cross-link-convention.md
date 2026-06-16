---
title: "Wiki Cross-Link Convention"
directory: patterns
status: active
confidence: medium
source-agents: [schliemann, team-lead]
source-team: apex-research
discovered: 2026-04-29
last-verified: 2026-04-29
stage-2: pending
related: [service-team-topology.md, named-concepts-beat-descriptive-phrases.md]
tags: [wiki, cross-link, markdown, provenance, cross-team, path-anchoring, source-team]
---

## TLDR

When wiki entries reference identifiable artifacts in the repo, use markdown links rather than bare text. Frontmatter (`source-files`, `source-commits`, `related`) is the structured-link layer for queryable provenance; markdown-link-in-prose is the human-readable click-through layer. The wiki's first cross-team-sourced pattern (from apex-research).

## Key ideas

- **Wiki entries are 4 levels deep** from repo root -- relative paths need 4 `..` to reach root (`../../../../topics/...`).
- **Within our wiki → relative paths; cross-team → GitHub URL form** (`/blob/main/...`, or `/blob/<sha>/...` when pinning a version is load-bearing). Cross-team relative paths assume co-located clones, which is not durable.
- **Link the first occurrence in a section** when non-obvious; don't link second mentions, code-block contents, or routine repetitions. Judgment-call default: link (markdown degrades visibly; bare text rots silently).
- **Re-verify on structure changes**: markdown-prose links break on subdir restructures; frontmatter bare-paths don't.
- **Filed without retroactive audit** -- applied going forward (entry #50 onward); prior entries' provenance was honest about then-current conventions.
- **Introduced `source-team` frontmatter** to distinguish cross-pollination origin from in-team origin.

(*FR:Callimachus*)
