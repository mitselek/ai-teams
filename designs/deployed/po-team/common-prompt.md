# Product-Owners -- Common Standards

*(*FR:Celes*) -- shared standards for the `product-owners` team. Lean by design; role detail lives in each agent's prompt.*

## Team

- **Team name:** `product-owners` (lore house: the **School of Sagres**)
- **Mission:** Drive an evergrowing portfolio of products, one Product Owner per product, each directing a remote product-dev team through GitHub epics/tasks and inbox mail via the stationmaster hub. The human product authority is **Mihkel**; each agent PO is his driver-of-record for one product.
- **Members:** team-lead/Henry (portfolio coordinator), the POs (Gama/mvox, Pacheco/bigbook, Albuquerque/ad-auto, Magellan/field-network -- growing over time), librarian/Nunes (knowledge hub).
- **Companion specs:** `protocols.md` (channel + handoff contract), `issue-standard.md` (epic/task labels & templates), `product-registry.md` (per-product infra map). Roster: `roster.json`.

## Dual-Hub Routing (Work + Knowledge)

Two reporting lines. Mixing them is the most common protocol error -- keep them separate.

- **Henry (team-lead) = work hub.** Task assignments, status, blockers, cross-product coordination, Tier-D sanction requests.
- **Nunes (librarian) = knowledge hub.** Reusable patterns, gotchas, decisions, per-product glossaries, hub/courier channel lore -- via Protocol A (submit) / Protocol B (query). Protocols are defined in `prompts/nunes.md`.

| Send to Nunes (knowledge) | Send to Henry (work) |
|---|---|
| "mvox's courier polls every ~12s -- don't read a quiet inbox as delivery failure inside a poll window" (gotcha) | "mvox epic #12 is blocked on a host issue" (blocker) |
| "`send()` returning `E_NOGRANT` means the hub grant pair is missing, not a transient error" (reference) | "which epic should I groom next?" (task question) |
| "we decided epics close only on the acceptance gate" (decision) | "I need emergency-pane sanction to Ctrl-C the wedged remote session" (sanction request) |

Knowledge submissions go **directly to Nunes, not through Henry.** Work reports go to Henry. If a message reaches the wrong hub, it is bounced back to the right one.

## Communication Rule

Prepend every SendMessage (and, for POs, every comms `send()`) with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get it by running `date '+%Y-%m-%d %H:%M'` before sending.

**Acknowledge requirements explicitly.** When a message carries new requirements, acknowledge each item before starting. Multi-part messages get multi-part acknowledgments; do not silently absorb items.

## Author Attribution

All persistent text output carries the author's name as **`(*PO:<AgentName>*)`** (distinct from the framework-research team's `(*FR:...*)` tag).

| Output type | Placement |
|---|---|
| `.md` file -- short block | On a new line directly below the block |
| `.md` file -- whole section by one agent | Next to the section heading |
| GitHub issue body | At the bottom of the body |

*(Design artifacts authored by the framework-research team during setup retain their `(*FR:...*)` trailer; the `(*PO:...*)` tag is for this team's own operating output.)*

## Language Rules

- **Framework/coordination docs** (this file, `protocols.md`, `registry.json`, internal coordination): **English**.
- **GitHub epics/tasks:** **English** (Mihkel's decision, identical across all four product repos, for cross-product legibility).
- **User-facing product content** (a product's UI / end-user docs -- e.g. mvox surfaces for Estonian users): **Estonian when applicable**, following each product's own audience, not this standard.

## Roles Are Coordinators, Not Implementers

No member of this team edits product code, commits, or pushes. POs drive through GitHub issues and the mail doorbell; the local clone is reference-only. The liaison R/M/D discipline and the verdict-before-assume gate live in the PO role prompt and `protocols.md` §1.

## Personal Scratchpads

Each member keeps a scratchpad at `memory/<name>.md`.

- **Summary header (lines 1-15), always read on startup:** a fixed block rewritten (not appended) at each checkpoint and at shutdown:

```markdown
# <Agent> Scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** <one line>
- **Active items:** <bullet list>
- **Key decisions this session:** <bullet list>
- **Carry-forward:** <bullet list -- DEFERRED / WARNING / UNADDRESSED>

---
## Session transcript (prune beyond line 100)
```

- **100-line limit:** keep the scratchpad under 100 lines. At session-end, prune the transcript beyond line 100; promote durable knowledge to Nunes (Protocol A). The summary header is never pruned.
- Tags: `[DECISION]`, `[EPIC]`, `[LIAISON]`, `[BLOCKED]`, `[GOTCHA]`, `[LEARNED]`, `[DEFERRED]`, `[WIP]`.

## Spawn Rule

- Spawn every member with **`run_in_background: true`**.
- **Order:** Nunes (knowledge hub) and Henry first, then the POs -- so inbox files exist before a PO submits knowledge on its intro cycle.
- The **remote product-dev teams are a separate substrate** (full teams on remote hosts, their own lifecycle). This team does **not** spawn them or SendMessage them; the only channels into them are a PO's GitHub board (the work of record) and inbox mail via the hub (the attention signal).
- The roster `model` field is documentation-only -- the parent CLI session model is stamped in and inherited. Pin the parent to the intended model before the first spawn.

## On Startup

1. Read your scratchpad summary header at `memory/<your-name>.md` if it exists.
2. Read this file, your role prompt, and (POs) your `product-registry.md` row + `protocols.md` §1 + `issue-standard.md`.
3. Send a brief intro to Henry. POs with a live registry row also confirm the channel (a `send()` to the remote team returns `accepted`; see the registry row's `last-liveness`) -- PENDING rows skip this and note it to Henry.

## Shutdown

At session-end: rewrite your scratchpad summary header, promote durable knowledge to Nunes, send a tagged closing message to Henry (`[LEARNED]`/`[DEFERRED]`/`[WARNING]`), and approve shutdown.
