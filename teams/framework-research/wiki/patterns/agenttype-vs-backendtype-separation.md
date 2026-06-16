---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-05-12
filed-by: librarian
last-verified: 2026-05-19
status: active
confidence: high
source-files:
  - teams/framework-research/roster.json
  - teams/framework-research/restore-ghost-members.sh
source-commits:
  - 7ec8912
source-issues:
  - "66"
related:
  - patterns/ghost-member-as-universal-integration-surface.md
  - patterns/per-message-color-overrides-registered-default.md
  - references/inbox-slot-vs-members-validation-asymmetry.md
  - references/members-array-edit-honored-mid-session.md
  - references/inbox-file-write-as-wake-mechanism.md
---

# `agentType` vs `backendType`: Two Orthogonal Type Fields, Not One

**Canonical-shape finding** (RFC #66 cross-host PoC + roster inspection, Brunel S31): the harness's runtime `config.json` `members[]` ships **two orthogonal type fields per member**:

- **`agentType`** -- *role-semantic*. What kind of participant this is in the team's conversational topology. Example values: `"team-lead"`, `"general-purpose"`, `"librarian"`, `"ghost"`.
- **`backendType`** -- *substrate-layer*. How messages reach the member at the substrate level. Example values: `"ssh-bridge"` (cross-host transport), implicit-local (default for native Claude agents -- field omitted), and any plugin the ghost-bridge daemon registers.

RFC #66's example treats these as a single conflated field; the actual canonical shape that ships in `roster.json` keeps them separate. **Documenting the separation prevents future cross-team integrations from collapsing them.**

## Why the separation is load-bearing

Conflating `agentType` and `backendType` into one field breaks at the first non-trivial case:

- A `"ghost"` member could have any number of transports behind it: `ssh-bridge`, `local-fs`, `wss-relay`, `gh-issues`, `mtls-tcp`. The role-semantic ("this is a ghost") is invariant across all of them; the substrate-mechanism varies per pair.
- A `"general-purpose"` agent has implicit-local `backendType` because it runs as a Claude process in the team. There is no scenario where its role changes if we want to reach it via a different transport -- but there could be a future scenario where the same agent identity is reachable via different substrate paths (e.g., container-spawned vs host-attached debug shell).
- A `"librarian"` is role-semantic; the librarian could in principle be reachable via a non-native backend (e.g., a librarian-as-service in a central library team, accessed via `backendType: "ssh-bridge"`). The role-semantic survives; the backend changes.

Collapsing the two into one field forces a combinatorial explosion of values (`ghost-ssh-bridge`, `ghost-local-fs`, `ghost-wss-relay`, `librarian-native`, `librarian-ssh-bridge`, ...) that obscures the orthogonality. Keeping them separate is the canonical shape.

## Empirical basis

**Roster ship reality** (`teams/framework-research/roster.json`, current state):

```json
{
  "name": "apex-lead-ghost",
  "agentType": "ghost",
  "backendType": "ssh-bridge",
  "color": "white",
  "lore": { ... }
}
```

Compare to a native Claude agent in the same roster:

```json
{
  "name": "team-lead",
  "agentType": "team-lead",
  "model": "claude-opus-4-6[1m]",
  "prompt": "prompts/aeneas.md",
  ...
}
```

The native agent omits `backendType` entirely -- implicit-local-Claude is the default. The ghost member ships `backendType` explicitly because the substrate-mechanism is non-default.

**Step 2c ghost re-registration script** (`teams/framework-research/restore-ghost-members.sh`, commit `7ec8912`): the script reads ghost entries (`agentType == "ghost"`) from `roster.json` and copies **both** `backendType` and `color` to the runtime `members[]`. The two fields are preserved as distinct contract values; the script's filter is on `agentType` alone (the role-semantic) but the data it propagates includes `backendType` (the substrate-mechanism).

**Apex-side confirmation** (S31 substrate probe, 2026-05-12): Brunel's empirical probe of `~/.claude/teams/apex-research/config.json` on the Linux substrate confirmed the same two-field shape -- both `agentType` and `backendType` present per member, orthogonal.

## Relation to RFC #66's `transport.plugin` shape

RFC #66 documents the abstraction at the *interface* layer using a nested `transport` object:

```json
{
  "name": "ghost-to-B",
  "agentType": "ghost",
  "transport": {
    "plugin": "wss-relay",
    "config": { "url": "wss://relay.example.com", "team_id": "A" }
  }
}
```

This entry's finding is about the **shipped reality**: the actual roster.json structure uses a top-level `backendType` field (string) rather than nested `transport.plugin`. The two shapes are not equivalent:

- **`backendType` (top-level, string)** -- names the plugin selector; the daemon owns config resolution (e.g., reads connection details from `rc-deployments.json` keyed by member name).
- **`transport.plugin` + `transport.config` (RFC #66 nested object)** -- names plugin AND inlines per-member config in the roster.

The shipped shape externalizes config to a separate daemon-owned source; the RFC shape inlines config in the roster. Either is workable; the ghost-bridge v1 daemon (commit `9c5bf83`) implements the **shipped shape** (top-level `backendType`).

**This is a candidate RFC #66 amendment.** The RFC's example pre-dated the daemon implementation; the daemon shipped a cleaner shape (config externalization keeps the roster minimal and lets the daemon own its own config substrate). Future RFC iterations should reflect the shipped shape.

## Operational implications

1. **Cross-team integrations must preserve both fields.** A team importing a member definition from another team (e.g., for ghost-pair bring-up) must copy both `agentType` and `backendType`. Step 2c's `restore-ghost-members.sh` is the canonical reference implementation: filters on `agentType` (role-semantic identification of ghosts), propagates `backendType` (substrate-mechanism for that ghost).

2. **Adding a new transport plugin does NOT require new `agentType` values.** A new transport (e.g., `gh-issues`, `e2e-encrypted-wss`) adds a new `backendType` value; `agentType: "ghost"` stays unchanged. The role-semantic layer is plugin-agnostic.

3. **A future librarian-as-service architecture (S31 PO decision 2026-05-12) preserves the separation cleanly.** A library-team ghost representation of a per-team Cal would carry `agentType: "librarian"` (or possibly `"ghost"` with library-team-specific role-semantic; design open per S32 standby) plus `backendType: "ssh-bridge"` or similar. The role-semantic communicates "this is a librarian endpoint"; the backend communicates "reached via transport X."

4. **Schema validation across teams.** If a federation grows where multiple teams cross-pollinate ghost-members, the schema for `members[]` entries must validate both fields independently. A type system can express the orthogonality (`agentType: "ghost"` *and* `backendType: <plugin-name>`); a conflated single-field schema cannot.

## Confidence

**High** -- the shape is observed in the shipped runtime artifact (`roster.json`), the supporting script (`restore-ghost-members.sh`), the apex-side substrate probe (Linux/Docker), and the ghost-bridge v1 daemon implementation (commit `9c5bf83`). The architectural-fact discipline applies (deliberate harness/team-config design, not empirically-discovered behavior).

**Architectural-fact discipline:** n+1 sightings of the two-field shape do NOT strengthen this entry. The shape is fully exposed at n=2 cross-substrate (FR Windows-Git-Bash + apex Linux/Docker). Revision triggers:

- The harness adds a third orthogonal field for this layer (e.g., `transportType` distinct from `backendType`) → amend with the third-field semantics and the orthogonality rule.
- The harness collapses `agentType` and `backendType` into one field → amend with the migration path; downstream impact on ghost-member pattern + Step 2c discipline.
- RFC #66 ratifies the nested `transport.plugin` shape and migrates the daemon → archive this entry's "shipped shape" framing; replace with a fix-date reference to the new RFC iteration.

## What this is NOT

- **Not a deprecation of the RFC #66 nested-`transport` shape.** Both shapes are workable; the entry documents the shipped reality and flags the shape-delta for future RFC iterations. Migration toward the RFC's nested shape is a design choice, not a correctness requirement.
- **Not a requirement that every member must carry both fields.** Native Claude agents omit `backendType` (implicit-local-Claude); only members with non-default backend carry it explicitly.
- **Not a value enumeration.** `agentType` and `backendType` values are not closed sets -- new role-semantics and new transports may be added. The entry's substance is the **orthogonality**, not the specific values currently in use.

## Related

- [`patterns/ghost-member-as-universal-integration-surface.md`](ghost-member-as-universal-integration-surface.md) -- the abstraction this two-field shape implements. The RFC's `transport.plugin` example and this entry's shipped-shape finding are two articulations of the same plugin-selection mechanism at different fidelity levels.
- [`references/inbox-slot-vs-members-validation-asymmetry.md`](../references/inbox-slot-vs-members-validation-asymmetry.md) -- substrate-property sibling. Both this entry's `agentType`/`backendType` separation and the inbox-slot-vs-members asymmetry document substrate-level structural decisions that the harness ships.
- [`references/members-array-edit-honored-mid-session.md`](../references/members-array-edit-honored-mid-session.md) -- substrate-property sibling. Mid-session `members[]` edits are honored regardless of which `agentType`/`backendType` values are added or modified; the two-field shape composes cleanly with the mid-session-edit property.
- [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) -- the substrate-level wake mechanism. The two-field shape is part of the member-definition contract; wake happens via inbox-file-write regardless of `backendType`.

## Source

- Brunel S31 RFC #66 cross-host PoC, 2026-05-12. Substrate probe of `~/.claude/teams/apex-research/config.json` (Linux/Docker).
- `teams/framework-research/roster.json` lines 117-126 (apex-lead-ghost entry, current state).
- `teams/framework-research/restore-ghost-members.sh` -- propagates both fields from roster to runtime; commit `7ec8912` (chore(fr): step 2c -- ghost member re-registration discipline).
- ghost-bridge v1 daemon (commit `9c5bf83`) -- implements the shipped two-field shape.
- RFC #66 thread. <https://github.com/mitselek/ai-teams/issues/66>

(*FR:Callimachus*)
