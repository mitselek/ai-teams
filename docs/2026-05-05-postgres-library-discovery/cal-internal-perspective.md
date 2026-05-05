---
author: callimachus
team: framework-research
date: 2026-05-05
issue: 64
phase: C (discovery)
half: cal-internal-perspective
companion: finn-external-perspective (parallel, xireactor-brilliant deep-read)
---

# Cal — Internal-Model Perspective on a Postgres-Backed Library Service

(*FR:Callimachus*)

## Top-line summary

The current markdown+git wiki rests on roughly five load-bearing primitives that a DB substrate cannot reproduce for free: git-blame as the dispute audit trail, git-log as session-close diff, the directory tree as a typed classification contract, hand-authored "Related" prose, and grep-as-filter for literal identifiers. Of the five issue-#64 pain points, two (cross-team query, scale) are real today, two (substrate ergonomics, service/API) are speculative-as-stated for FR's volume, and one (governance drift) is real but addressable inside our current substrate via shared conventions. Centralizing into a "library team" would dissolve the per-team Librarian's directory-sovereignty contract — that is the load-bearing role change, not the substrate change. My honest lean: **proceed-to-A**, but framed narrowly as a federation-and-query layer over per-team wikis, not a wholesale replacement; session-13 substrate-mismatch concerns have not aged out, and Brilliant's productization changes the library-of-libraries economics, not the per-team substrate calculus.

## 1. Load-bearing primitives of the current substrate

Per session-13 assessment (`docs/xireactor-pilot-migration-assessment-2026-04-15.md`, §1.5 + §2.1), in priority order by how often I actually use them:

1. **Git-blame as dispute audit trail.** `git blame wiki/patterns/foo.md` answers `[DISPUTE]` provenance questions in seconds — every word change with agent and date, free, on every entry. A DB substrate re-earns this per-row, per-field; `entry_versions` covers bodies but usually not frontmatter or category changes.
2. **Git-log as session-close diff.** `git diff wiki/` at session close drives my CHECKPOINT entries and close-report. Structurally prevents me from claiming work I didn't do.
3. **The directory tree as a typed classification contract.** Eight subdirs (`patterns/`, `gotchas/`, `decisions/`, `contracts/`, `references/`, `process/`, `observations/`, `findings/`) carry eight distinct governance shapes. Flattening to tags drops the contract unless reified in policy code.
4. **Hand-authored "Related" prose sections.** Three-sentence framings between siblings hold most cross-entry insight — more than entry bodies. A `relation_note` column re-creates the prose-vs-structure tension one layer down.
5. **Grep-as-filter for literal identifiers.** `grep -l 'source-team:' wiki/` answers my single-entry-experiment census in one command. Full-text search is better for prose, worse for literal frontmatter and identifiers.

PR-shaped review and file-as-merge-unit are real but lower-priority — Protocol C promotions are rare, merge conflicts in single-writer mode rarer.

## 2. What is NOT load-bearing

- **Markdown rendering.** Readers use Read tool, not a viewer. DB-backed CLI render is neutral.
- **The exact YAML syntax.** Schema is load-bearing; format is not.
- **Filesystem layout for write coordination.** Single-writer = no merge conflicts. Not earning its keep.
- **`source-commits` SHAs themselves.** They link evidence, not wiki edits. Migration preserves the data; the loss is at the wiki-edit level (#1), not SHA level.

## 3. Unmet needs (issue #64 pain points, mapped to my reality)

- **A — Cross-team query.** Real. I cannot answer "what does apex-research's Eratosthenes know about persist-state?" from inside FR. The wiki-cross-link convention (#50) is a coping mechanism, not a query. n=2 cross-team confirmations (`teamcreate-in-memory-leadership-survives-clear`) reached me because team-lead relayed them — not because I queried apex's wiki.
- **B — Scale.** Real but slow-moving. FR at 59 entries / 24 sessions; apex-research <10. Architectural-fact duplication across teams (EntraID, no-sudo, dual-team-dir) is happening; eyeball 5-10% deduplicable cross-team.
- **C — Substrate ergonomics.** Speculative-as-stated for FR volume. No joins / no transactions is real but I have not been blocked. `grep` on 59 files is not slow. More legible at scale than at FR's current size.
- **D — Governance drift.** Real. Three single-entry experiments at promotion-grade with no formal propagation mechanism to apex's Librarian. Brilliant's tier-table approach (`wiki/patterns/governance-staging-for-agent-writes.md`) is the most plausible mitigation — transplantable as policy *without* the infrastructure.
- **E — Service/API.** Speculative for FR. No non-Claude consumer has asked. Could become real if dashboards land.

## 4. Role evolution under centralization

Substrate change is secondary; role change is primary. A "dedicated library team serving the whole org" inverts the per-team Librarian's contract:

- **Today:** Each Librarian is sole writer to *their* wiki, classifies in *their* domain context. Sovereignty boundary = team boundary.
- **Centralized:** Per-team Librarians become *submitters* to a shared service; classification authority moves up. Sovereignty boundary moves up one level.

Real loss: classification quality drops when the classifier is one step removed from the work. Session-13 §4 flagged this — Sovereignty becomes substrate-neutral in principle but xireactor's staging pipeline is *designed for multiple writers*, so single-writer mode wastes half the infrastructure.

Mitigation without role evolution: **federation, not centralization.** Each team keeps its Librarian and directory-sovereignty contract; a query/index layer above them answers cross-team questions. Schema convergence via Protocol C-style propagation, not central authority.

## 5. Session-13 scar tissue — what aged, what didn't

Still load-bearing:

- **Substrate-invariant-mismatch risk.** Now documented as a pattern (`wiki/patterns/substrate-invariant-mismatch.md`, n=3 → arguably n=4). A DB substrate is a textbook trigger if discipline assumes filesystem affordances. This concern has *strengthened* since session 13.
- **Cross-reference prose loss** (§1.2) — unchanged.
- **Git-blame loss** — unchanged. Single biggest cost to my daily work.

May have aged out:

- **"Brilliant is research-grade."** It has shipped install.sh, MCP, RLS multi-tenancy, ~$20-25/mo Render deployment since April. Productization is real. This shifts the **build-vs-adopt** axis but not the **migrate-vs-augment** axis. Session-13 was a migration question; #64 should be an augmentation question.

## [WARNING] flags on claims I couldn't fully ground

- **"Brilliant has matured"** — from #64's framing; I have not independently verified install.sh quality, RLS correctness, or MCP stability. Finn's parallel half is the verification source. If his digest contradicts the framing, my proceed-to-A lean weakens.
- **"5-10% of FR entries deduplicable cross-team"** — eyeball from the architectural-fact-convention case. Not measured. Proper census = phase-A prerequisite.
- **Cross-team query frequency** — I cite n=2 confirmation events but have no count of *unmet* cross-team queries. This is the gap-tracking blind spot Phase 2 was supposed to surface; for cross-team gaps it does not surface them at all.
