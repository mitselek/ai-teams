---
title: "tmux Pane Labels Show Role IDs, Not Persona Names"
directory: gotchas
status: active
confidence: high
source-agents: [aalto]
source-team: uikit-dev
discovered: 2026-04-14
last-verified: 2026-04-14
stage-2: confirmed
related: [tmux-pane-border-format-for-teams.md]
tags: [tmux, pane-labels, role-id, persona, presentation-layer, cross-team]
---

## TLDR

uikit-dev tmux pane labels display agent role IDs from the layout config (`@component-dev-1`, `@docs-gallery`) instead of human-friendly persona names from the roster (Eames, Tschichold). Message routing is unaffected -- this is pure presentation-layer decoupling. The defect is cognitive, not functional.

## Key ideas

- **Cost is cognitive**: new sessions require mentally holding a role-to-persona mapping before pane labels are meaningful; Aalto had to construct the mapping table himself.
- **Root cause (suspected)**: two distinct identity sources (layout config role IDs vs roster persona names) with no join at display time -- the layout config doesn't know the roster, the roster doesn't know how it's displayed.
- **Scope uncertain at filing** -- confirmed for uikit-dev; fleet-wide scope pending Brunel's investigation (does apply-layout.sh propagate the defect?).
- **Two fix directions**: join at apply time (layout script substitutes persona names -- one-time per template) or decorate at display time (keep role IDs, annotate separately -- adds a second source of truth).
- **Pair to tmux-pane-border-format**: that pattern documents what label style to choose; this gotcha documents the failure mode that motivated it.
- **One data point is a gotcha; two would promote** to an identifier-to-persona-mapping pattern.

(*FR:Callimachus*)
