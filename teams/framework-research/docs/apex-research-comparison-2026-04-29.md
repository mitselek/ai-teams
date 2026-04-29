# Apex-Research Comparison — Path Migration & Wiki State

(*FR:Finn*)

Date: 2026-04-29
Scope: comparative analysis of how the apex-research team adapted to the path migration (mitselek/ai-teams#61) and the current state of their wiki/library, against framework-research as baseline.

Sources: `~/Documents/github/apex-migration-research/teams/apex-research/` (their config + wiki), `~/Documents/github/mitselek-ai-teams/teams/framework-research/` (ours).

---

## Q1 — Path Migration Adaptation

### Migration shape: single-commit, downstream-style

| Dimension | Apex-research | Framework-research (ours, #61) |
|---|---|---|
| Number of commits | **1** (`239e35e` on 2026-04-27) | 1 main move (`7e72771`) + later prompt fix (`876c212`/`027205b` v2.7.1) |
| Strategy | `git mv .claude/teams/apex-research → teams/apex-research` (history preserved) + path rewrite across 20 files | Same shape — apex commit message explicitly says "Migration matches the framework move shipped in mitselek/ai-teams@7e72771" |
| Lag between framework and apex move | — | apex moved **15 days after** ours (#61 framework: 2026-04-12 vintage; apex: 2026-04-27) |
| Rewritten file count | 20 files (`prompts/`, scratchpads, ADRs, `startup.md`, `common-prompt.md`, `subagent-fallback-protocol.md`, `evidence.md`, `entrypoint-apex.sh`, `.claude/spawn_member.sh`, `.claude/skills/apex-team-startup/SKILL.md`) | 168 file content references |

**Reading:** apex-research treated #61 as a downstream pattern adoption, not a parallel discovery. The commit message names our SHA explicitly. They got the whole change in one commit because they had less surface (one team's worth of files vs. our 168-reference fan-out).

### Path-resolution bugs: theirs predates ours

**Apex hit the path bug FIRST and fed back upstream:**

- 2026-04-13 — Eratosthenes' first boot writes `oracle-state.json` and `memory/eratosthenes.md` to `$HOME/.claude/teams/apex-research/` (ephemeral) instead of `$REPO/.claude/teams/apex-research/` (durable).
- Same day, two commits: `876c212`/`027205b` add a "Path Convention" section to `prompts/eratosthenes.md`.
- **Co-filed wiki gotcha:** `mitselek/ai-teams wiki/gotchas/dual-team-dir-ambiguity.md` — that's our `gotchas/dual-team-dir-ambiguity.md`. The provenance note in our gotcha cites this incident.

**Bidirectional flow:** their incident produced our framework-level gotcha; our #61 move produced their later relocation commit. Path discipline is a two-way trade.

### Stale `.claude/teams/` references — none load-bearing

Grep for `.claude/teams/apex-research` in their repo returns 8 files. All reviewed:

| File | Reference type | Status |
|---|---|---|
| `.claude/skills/apex-team-startup/SKILL.md:27-29` | Runtime path `$HOME/.claude/teams/apex-research` | **Legitimate** — that's the platform-controlled ephemeral runtime dir |
| `teams/apex-research/startup.md:14, 62, 71, 84, 96, 225` | Same — runtime `$TEAM_DIR` references | **Legitimate** — preserves the cleanup/restore mechanic |
| `teams/apex-research/tmux-spawn-guide.md:29-84` | Runtime config.json paths | **Legitimate** — runtime references |
| `teams/apex-research/aliases.sh:7` | `TEAM_CONFIG="$HOME/.claude/teams/apex-research/config.json"` | **Legitimate** — runtime |
| `teams/apex-research/subagent-fallback-protocol.md:105` | `$HOME/.claude/teams/apex-research/` | **Legitimate** — explains ephemerality |
| `teams/apex-research/prompts/eratosthenes.md:45-54` | Path Convention section explaining dual roots | **Legitimate** — the v2.7.1 fix itself |
| `teams/apex-research/memory/schliemann.md:171` | Historical narrative ("This session: applied .claude/teams/ → teams/ patch") | Historical, not a directive |
| `teams/apex-research/inboxes/team-lead.json:2615` | Long matching line (likely message content) | Inbox content, not config |

**Verdict:** zero stale path-resolution bugs. Their distinction `$REPO/teams/` (durable) vs `$HOME/.claude/teams/` (runtime) is properly anchored — the same anchor we use after the v2.7.1 fix.

### Patterns/gotchas they wrote up about the migration

Searched `wiki/patterns/`, `wiki/gotchas/` for migration/path/grep-discipline content:

| Topic | Apex | Ours |
|---|---|---|
| Path-anchoring / dual-team-dir trap | **Not in wiki** (handled in `prompts/eratosthenes.md` Path Convention section) | `gotchas/dual-team-dir-ambiguity.md` (incident-driven, cites apex 2026-04-13) |
| Wiki cross-link convention | `patterns/wiki-cross-link-convention.md` (2026-04-29, brand new) | **No analog** — opportunity flagged below |
| Within-document grep-discipline / rename | Not present | `patterns/within-document-rename-grep-discipline.md` |
| Pass1/Pass2 rename separation | Not present | `patterns/pass1-pass2-rename-separation.md` |

**Asymmetry:** they kept the migration learnings inside the operational prompt (Eratosthenes' Path Convention block) rather than promoting to wiki. We kept ours in the framework-level wiki. Both are coherent — apex wiki is domain-specific (Oracle/APEX/rail), ours is meta/process-shaped.

### Lifecycle scripts: different architecture, same semantics

They did NOT need rewrites because their lifecycle code lives in **inline shell blocks inside `startup.md`**, not separate scripts:

| Lifecycle phase | Apex (inline in startup.md) | Ours (separate .sh files) |
|---|---|---|
| Diagnose stale runtime | Step 2 inline | (ad-hoc) |
| Clean | Step 3: `rm -rf "$TEAM_DIR"` inline | (ad-hoc) |
| TeamCreate | Step 4 | (manual) |
| Restore inboxes | Step 5 inline (15-line block) | `restore-inboxes.sh` |
| Persist inboxes (shutdown) | Step S4 inline (10-line block) | `persist-inboxes.sh` |
| Persist project state | — (apex commits via inline Step S4 git block) | `persist-project-state.sh` |
| Shell aliases | `aliases.sh` (just `ar-remove-member` jq helper) | — |

Their migration only had to update `aliases.sh` (1 path: `TEAM_CONFIG` env var). Our migration touched 4 separate scripts. **Apex's choice has lower drift surface** at the cost of a longer `startup.md`. Worth flagging — see Q2 cross-pollination.

---

## Q2 — Wiki/Library State

### Topology: domain-flat vs research-elaborated

```
Apex (64 entries)             Framework-research (52 entries)
└── patterns/    37            └── patterns/    33
└── gotchas/     24            └── gotchas/     11
└── decisions/    2            └── decisions/    2
└── contracts/    1            └── contracts/    0
└── archive/      0 (empty)    └── archive/      1
                               └── observations/ 3
                               └── process/      1
                               └── references/   1
                               └── findings/     0 (empty)
```

**Findings:**

- **Apex uses only the 4 canonical Cal subdirs** (patterns, gotchas, decisions, contracts) plus an empty archive/. Eratosthenes did NOT evolve research-team-specific dirs (`process/`, `observations/`, `findings/`) that we have.
- Their patterns/ + gotchas/ are 95% of total (61/64). Heavy reverse-engineering output: domain knowledge about VJS/Oracle/APEX surface, not process discipline.
- **Their decisions/ and contracts/ stay slim** — same shape as ours.
- **Empty archive/** — no entries have been superseded yet (wiki is ~12 days old, 2026-04-17 first entry).

### Co-discoveries — entries on topics we both have

Cross-checking topic overlap:

| Topic | Apex entry | Our entry | Note |
|---|---|---|---|
| ADR three-state status flow | `patterns/adr-accepted-pending-prereqs-status.md` | (no analog — we don't run ADR-style decisions yet) | Apex-original; could surface as framework pattern if other teams adopt ADR-vs-issue split |
| Bootstrap/path discipline | (handled in Eratosthenes' Path Convention prompt block) | `gotchas/dual-team-dir-ambiguity.md` | **Same incident, two artifacts** — already cross-cited. n=2 confirmed. |

**Reading:** *minimal direct topic overlap.* Their wiki sits in a different layer of the stack (project-domain knowledge: rail ops, Oracle schemas, APEX idioms) while ours is at framework/process layer (multi-team coordination, model tiering, governance). The dual-team-dir co-discovery is the only true cross-team confirmation.

This is itself a finding: **wiki layers don't naturally co-discover when the missions are at different abstraction levels.** A cross-pollination question for Cal: should we expect more co-discoveries with cathedral-tier teams (e.g. raamatukoi-dev, screenwerk) than with project-research teams?

### Apex-only entries (domain-specific, won't generalize)

Examples of entries that are clearly tied to VJS/Oracle/APEX/rail-ops domain:

- `patterns/oracle-schema-landscape-48.md` — 48 Oracle app-layer schemas
- `patterns/vjs-grant-centrality-78pct.md` — VJS grant model
- `patterns/iftmin-contrl-aperak-smgs-handshake.md` — SMGS waybill protocol
- `patterns/three-networks-vjs-positioning.md` — Estonia rail networks
- `patterns/vlms-vlmn-two-phase-dispatch.md` — wagon dispatch protocol
- `gotchas/all-triggers-filtered-under-ro-access.md` — Oracle ALL_TRIGGERS quirk
- `gotchas/legacy-apex-utl-prefix-resolution.md` — APEX UTL package resolution
- `gotchas/operail-off-label-branch-line-tracking.md` — carrier track ownership

**Count estimate:** ~55 of 64 entries (~86%) are domain-specific. This is expected for a research team studying a specific legacy stack.

### Cross-pollination opportunities — entries worth surfacing to Cal

Three apex entries look transplantable to our framework-research domain:

1. **`patterns/wiki-cross-link-convention.md`** (2026-04-29, fresh)
   - Says: in wiki prose, link load-bearing references via markdown links rather than bare text; frontmatter `source-*` arrays are the structured-link layer, prose is the human-readable layer.
   - **Why transferable:** generic wiki/library hygiene rule. We have no analog. Our wiki could adopt this; would also surface broken cross-team references on subdir restructures.
   - **Recommend:** Protocol A submission to Cal, audit our wiki for compliance.

2. **`patterns/adr-accepted-pending-prereqs-status.md`** (2026-04-29)
   - Says: three-state ADR flow (proposed → accepted-pending-prereqs → accepted) lets architectural core land while measurement/audit prereqs track as separate issues with `owner:<agent>` labels.
   - **Why transferable:** our `decisions/` dir is sparse (2 entries) precisely because we don't have a "graceful pending" status — most of our decisions stay implicit. Adopting could unblock our discussion-#56 style multi-round outputs.
   - **Recommend:** parking-lot for next time we file a non-trivial decision; mention to Cal as candidate framework pattern.

3. **`patterns/silence-gap-helpdesk-vs-jira.md`** (2026-04-20)
   - Says: cross-reference helpdesk volume vs active development to find "stable pain" (high helpdesk, no active dev = migrate first) vs "moving targets" (active dev = defer).
   - **Why transferable:** generic two-track prioritization heuristic. Could apply to our framework-research backlog — "discussions where the issue body has been stable for N weeks but no specialist replied" vs "actively-debated open items."
   - **Recommend:** lower priority; surface to team-lead if backlog triage becomes a concern.

### Maturity signals

| Signal | Apex | Ours |
|---|---|---|
| Total entries | 64 | 52 (51 with source-agents + 1 archived) |
| Multi-agent (n≥2) entries | **18** (28%) | **8** (15%) |
| n=3+ entries | 2 (`jira-vjs1-live-development-tracker`, `legacy-apex-utl-prefix-resolution`) | 2 (`substrate-invariant-mismatch` n=5, `integration-not-relay` n=5) |
| `status: disputed` | 0 | 0 |
| `status: active` | 64 (100%) | (no `status:` field — uses other schema) |
| Frontmatter `confidence:` field | Not used | Not used |
| Archived/superseded | 0 | 1 (`archive/` has 1 entry) |
| Wiki age | ~12 days (since 2026-04-17) | ~26 days (older — gradual fill) |

**Frontmatter schema divergence:** apex uses `source-agents`, `discovered`, `filed-by`, `last-verified`, `status`, `source-files`, `source-commits`, `source-issues`, `source-adrs`, `source-apps`, `related`. Ours uses a different schema (no `discovered`/`last-verified`, no `source-apps`, narrative provenance in body).

**Key reading:** apex's wiki has a higher cross-agent-corroboration rate (28% vs 15%). Two reasons:
- Their pipeline is intrinsically multi-agent (Champollion parses → Nightingale analyzes → Schliemann curates), so the same finding naturally passes through 2-3 hands.
- Their domain (rail ops) has more directly observable data, easier to triangulate.

Our higher-n outliers (n=5 each on `substrate-invariant-mismatch` and `integration-not-relay`) suggest our team's high-value patterns are the **process-discipline-with-incident-trail** ones — heavily multi-author because they emerge through cross-agent debate, not parallel observation.

**Disputed/superseded discipline:** neither team has used `disputed`/`archive` yet. That's a young-wiki signal in both cases; expect first uses in Q2 2026.

---

## Summary Findings

1. **Path migration: framework→apex flow.** Apex adopted #61 cleanly in one commit on 2026-04-27, citing our SHA. Their #61-equivalent fix had less surface (20 files vs our 168 references). No stale references; runtime `$HOME/.claude/teams/` paths are legitimate platform-controlled ephemerality.

2. **The path-anchoring bug originated apex-side.** 2026-04-13 Eratosthenes incident → v2.7.1 Path Convention fix → our `gotchas/dual-team-dir-ambiguity.md`. Already cross-cited. Bidirectional knowledge flow works.

3. **Apex lifecycle scripts in inline `startup.md` blocks** (no separate `.sh` files like ours). Their #61 only touched one `aliases.sh` line. Lower migration drift surface, longer startup.md.

4. **Wiki topology divergence: apex stayed canonical (4 dirs).** Eratosthenes did NOT evolve `process/`/`observations/`/`findings/` like Cal did — apex's domain doesn't need them. Both choices are coherent for their respective missions.

5. **Topic overlap is minimal** because abstraction layers differ. Only one true co-discovery: `dual-team-dir-ambiguity` (already cross-cited). Cross-team co-discovery may need cathedral-tier siblings, not project-research peers.

6. **Three apex patterns flagged for possible Protocol A:** `wiki-cross-link-convention` (highest ROI), `adr-accepted-pending-prereqs-status`, `silence-gap-helpdesk-vs-jira`.

7. **Maturity:** apex has 28% multi-agent corroboration vs our 15% (pipeline structure drives this). Our outliers (n=5) are higher single-pattern density. No team has used `disputed`/`archive` yet — expected for young wikis.

---

## Suggested next-step (team-lead's call)

Decide whether to send Cal a Protocol A heads-up on the `wiki-cross-link-convention` pattern as the highest-ROI cross-pollination candidate. Audit-followup if Cal accepts — our wiki currently mixes bare-text and markdown-link references inconsistently.
