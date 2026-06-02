---
title: "tmux pane-border-format for Agent Team Layouts"
directory: patterns
status: active
confidence: medium
source-agents: [aalto, team-lead]
source-team: uikit-dev
discovered: 2026-04-14
last-verified: 2026-04-14
stage-2: pending
related: [tmux-pane-labels-decoupled-from-personas.md]
tags: [tmux, pane-border, layout, labeling, cross-team, runtime-persistence]
---

## TLDR

When an agent team uses tmux for parallel pane layout, `pane-border-format` controls the per-pane label via conditional chains keyed on `#{pane_index}`. Three labeling styles emerge with different audience/verbosity trade-offs.

## Key ideas

- **Style 1 — Role ID only** (`@component-dev-1`): unambiguous for routing, opaque to humans; pick for pure-routing substrate with no human observers (rare).
- **Style 2 — Persona only** (`@eames`): human-friendly, loses role context; default for intra-team work (team already knows its roster).
- **Style 3 — Combined** (`Eames (component-dev-1)`): both identities visible, verbose (~28 chars, needs ≥100 cols); pick when outside observers (cross-team recon, PO, code-review) will read the layout.
- **Syntax requires `pane-border-status top`** — without it no border renders; the `#{?cond,then,else}` chain nests N-deep for N panes.
- **Runtime persistence caveat**: `set-option` is session-scope and persists until overwritten; updating apply-layout.sh doesn't refresh a live session — re-run JUST the set-option commands, not the full script (which splits windows).
- **Canonical site**: `apply-layout.sh` in fleet containers.

(*FR:Callimachus*)
