# uikit-dev Harvest — 15 commits on `develop` since last cross-read

**Source:** `Eesti-Raudtee/evr-ui-kit:develop` at `teams/uikit-dev/` (15 commits surveyed)
**Harvest date / author:** 2026-04-14 (*FR:Finn*)
**Summary:** Cross-team harvest — per-innovation verdicts, data points for Cal and Volta WIP, 6 open questions queued for Aalto routing.

---

## Section A — Per-innovation assessment

### A1. `b47544b refactor(team): unify agent names — use codenames everywhere` → **cross-pollinate (high priority) + diagnostic data for Cal**

**What changed:** Replaced role-based identifiers (`team-lead`, `component-dev-1`, `component-dev-2`, `qa-a11y`, `docs-gallery`) with persona codenames (`aalto`, `eames`, `rams`, `braille`, `tschichold`) in ONE coordinated sweep across: `roster.json`, `common-prompt.md`, `apply-layout.sh`, `spawn_member.sh`, prompt filenames (`team-lead.md → aalto.md`, etc.), inbox filenames (both runtime and backup), and the ephemeral-snapshot manifest. 23 files changed, 76/76 insert/delete — pure rename, zero semantic content changes.

**Problem it solves:** BEFORE b47544b, uikit-dev had THREE identifier systems running in parallel: (1) role IDs in the roster+layout (`component-dev-1`), (2) persona names in lore blocks (`Eames`), (3) pane labels showing role IDs to the operator. Cal's gotcha `tmux-pane-labels-decoupled-from-personas.md` caught the presentation-layer symptom. uikit-dev's fix is at the identifier layer — they collapsed from 3 identifier systems to 1. SendMessage addresses, inbox files, prompt files, roster members, AND pane labels now all use the same name.

**Framework-research posture:** We do NOT have role-ID/persona drift at the identifier layer — our roster uses names like `finn`, `volta`, `callimachus`, `herald`, `celes`, `brunel` that already double as agent addresses. Our common-prompt already references these names directly. We're already at the target state uikit-dev refactored toward.

**Disposition:** `already have it` (for FR's own state), BUT this is **important diagnostic data for Cal's n=1 gotcha** — see Section C1.

### A2. `e543109 chore(team): move agent scratchpads into repo as single source of truth` + `42df893 test(team): verify agent scratchpad write to repo path` → **cross-pollinate (architectural validation)**

**What changed:** Before: `memory/.gitkeep` only — scratchpads lived somewhere undocumented (likely runtime `~/.claude/` or per-user-memory). After: 4 agent scratchpads (`braille.md`, `eames.md`, `rams.md`, `tschichold.md`) committed directly to `teams/uikit-dev/memory/` as new files at commit time. Common-prompt edited to say "committed to git" and shutdown protocol edited to make Aalto responsible for committing scratchpads. The follow-up 42df893 is literally a one-line write-test: Braille appends `[LEARNED] - Scratchpads now live in the repo, not runtime ~/.claude/`.

**Problem it solves:** scratchpad durability and single source of truth. The prior implicit state where scratchpads lived in per-user-memory meant cross-operator visibility was impossible and state survived only as long as the container did.

**Framework-research posture:** Our scratchpads ARE already in `memory/` in the repo (`memory/finn.md`, `memory/volta.md`, `memory/callimachus.md`, etc.) — I'm reading mine from there right now. We already have this.

**Disposition:** `already have it` — BUT see Section B2: uikit-dev's path is a DIFFERENT solve shape from what Volta is designing. The 42df893 one-line verification test is also a neat discipline point — explicit write-path verification as its own commit is a cheap sanity gate worth noting.

### A3. `2970bd6 chore(team): clean up memory — drop 9 completed-work files, consolidate EvrIcon` → **cross-pollinate (pruning discipline)**

**What changed:** Deleted 9 `project_*.md` files from `memory/` corresponding to closed issues (#24, #21/#37, #69, #77, #92/#99, #93 duplicate, #94, SVG export). MEMORY.md reorganized into sections. Line delta: 38→29 files, -283 lines.

**Problem it solves:** Memory staleness. Per-issue memory files accumulated during the sprint, outlived their usefulness once issues closed.

**Framework-research posture:** FR's `memory/` has the same staleness risk. Callimachus's scratchpad is 22K, Celes is 70K (!), team-lead is 16K. Volta's is 10K. Finn's (mine) is 5K. We do not run periodic pruning passes as discipline.

**Disposition:** `cross-pollinate` — the discipline itself (periodic explicit-commit pruning of closed-work memory) is worth adopting. Not as a script, as a ritual. Cal's delivery-window freeze means this is not actionable this session, but worth flagging for post-freeze Medici health-report work.

### A4. `e4a5c86 refactor(team): consolidate memory into wiki knowledge base` → **diverge intentionally (architectural divergence — needs explicit decision)**

**What changed:** 25 scattered memory files → 1 `feedback.md` + 12 wiki pages. Specifically:
- **10 `feedback_*.md` files** (branch-naming, delegate-everything, figma-approach, etc.) → merged into ONE `memory/feedback.md` (27 lines, 4 sections, `tags: [feedback, rules]` frontmatter).
- **11 `project_*.md` files** (figma-extractors, figma-pipeline, design-tokens-issue67, etc.) → moved to `wiki/figma-pipeline.md`, `wiki/design-tokens.md`, `wiki/comparison-scripts.md`, `wiki/variable-collection.md`, etc.
- **1 `reference_figma_pat_scopes.md`** → `wiki/figma-api-scopes.md`.
- **2 `user_*.md` (user_mihkel, user_framework_research_team)** → `wiki/people.md`.

The new `memory/MEMORY.md` is 17 lines, pointing to `feedback.md` (auto-loaded behavioral rules) and 4 scratchpads, plus a one-line link to `../wiki/index.md` for read-on-demand knowledge. **Memory is now only two things: (1) behavioral rules auto-loaded, (2) per-agent scratchpads.** Everything else moved to wiki.

**Problem it solves:** the auto-memory system (root CLAUDE.md's memory rules: user/feedback/project/reference types with `MEMORY.md` index) was accumulating scattered files that nobody could navigate cleanly. They collapsed it into two distinct surfaces with different load semantics.

**Framework-research posture:** Our memory is **different in shape**. FR's `memory/` holds per-agent scratchpads only (no `feedback_*.md`, no `project_*.md`, no `user_*.md`, no `reference_*.md`). Our wiki is subdir-taxonomy (`patterns/`, `gotchas/`, `decisions/`, `contracts/`, `findings/`, `observations/`, `process/`, `archive/`) curated by Cal. **uikit-dev's wiki is flat** — 12 pages at one level, project-centric (figma-pipeline, design-tokens, environment, people, backlog, etc.), written by any agent, not curated by a librarian role.

**Disposition:** `diverge intentionally` — the two wiki shapes solve different problems:
- **uikit-dev's flat wiki** = project knowledge base. Frames: "what do I need to know to work on this codebase." Stakeholder: any agent. Entries are project-domain (figma, design-tokens, environment gotchas). Write access is distributed.
- **FR's Cal-curated taxonomic wiki** = meta-process knowledge base. Frames: "what do we know about running teams." Stakeholder: any team. Entries are process-domain (patterns, contracts, decisions, gotchas). Write access is centralized through Protocol A.

These are **not convergent** — they serve different purposes. But Section B4 below has the nuance for Cal's architecture question.

### A5. `8aa0883 docs(team): add wiki section to common-prompt.md` + `c3ee150 docs(team): add wiki contribution guidelines` → **divergent intake model — worth knowing for Cal**

**What changed:** Two common-prompt patches. 8aa0883 adds a 15-line "Wiki (Knowledge Base)" section: index location, 5 key pages by name, "read relevant pages before starting work." c3ee150 adds a 24-line "Adding wiki articles" subsection: frontmatter format, `[[wikilinks]]`, one-concept-per-page rule, filename convention, update index, "don't duplicate what's in code/git/figma/README," "update or remove stale pages."

**Problem it solves:** agents were now writing scratchpad content that belonged in wiki, and not looking up wiki content that was relevant to their task.

**Framework-research posture:** Our common-prompt has a dual-hub section (Callimachus for knowledge, team-lead for work) and defines Protocol A (submission) and Protocol B (query) for wiki intake. **Writes go THROUGH Cal** — specialists do NOT write to wiki directly. uikit-dev's model is the opposite: wiki writes are distributed, any agent can add a page.

**Disposition:** `diverge intentionally` — see Section B3 for the Cal ownership comparison. This is a genuine architectural split on wiki governance, not a naming variation.

### A6. `f1c6971 fix: align lifecycle scripts with framework-research pattern` → **reciprocal cross-pollination evidence**

**What changed:** uikit-dev's persist-inboxes.sh and restore-inboxes.sh were rewritten to match FR's pattern. Specifically: (1) added pruning to last 100 on persist (previously raw copy), (2) added shutdown-message filtering on restore, (3) switched to `SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"` for path resolution (previously hardcoded), (4) adopted the count-verification pattern, (5) adopted `set -euo pipefail`. Commit message explicitly cites `framework-research/persist-inboxes.sh` and `restore-inboxes.sh` as the model.

**Problem it solves:** their scripts were diverging from what we'd converged on.

**Framework-research posture:** we sent this to them — nothing to take back. BUT see A7 below: they subsequently improved on what they received.

**Disposition:** `already have it` (at the level they copied from us) — evidence of healthy cross-pollination.

### A7. `1deb90e fix: restore-inboxes.sh uses external jq filter file` → **steal-back (hard bug latent in our copy)**

**What changed:** uikit-dev extracted the inline jq filter from `restore-inboxes.sh` into a separate `restore-filter.jq` file, loaded with `jq -f "$FILTER_FILE"`. Commit message says: "Previous version had mangled shell-escaped jq regex. Extracted filter to restore-filter.jq and use jq -f. Verified via lifecycle dry-run."

**Problem it solves:** shell-escaped jq regex is famously fragile. The old uikit-dev version had patterns like `test(""type"\s*:\s*"shutdown_request"")` — escape chaos. They empirically broke it, fixed it by extraction.

**Framework-research posture:** **OUR CURRENT `framework-research/restore-inboxes.sh` has the same inline-jq shape** (lines 40-45): `jq '[.[] | select((.text | test("\"type\"\\s*:\\s*\"shutdown_request\"") | not) ...`. AND there's a second observation: uikit-dev's extracted filter uses SIMPLER patterns: `test("shutdown_request")` (matches the string anywhere in `.text`). OUR inline patterns are stricter: `test("\"type\"\\s*:\\s*\"shutdown_request\"")` (requires proper JSON key-value structure). That's a **semantic divergence**, not just a formatting one. Which is correct depends on whether shutdown-protocol messages embed the type as a stringified JSON field vs. a free-text phrase. Without a live inbox sample on both sides, I can't say which matches production message shapes, but the two scripts will NOT behave identically on the same input.

**Disposition:** `steal-back` — extract the filter to a sibling `restore-filter.jq`, add the `FILTER_FILE` existence check uikit-dev has (`if [ ! -f "$FILTER_FILE" ]; then echo ERROR; exit 1; fi`), but **decide the pattern semantics separately** (it's not a pure steal — it's a steal plus a design choice). Recommend routing the pattern-semantics decision to Volta for her persist/restore ship session.

### A8. `c6046e7 fix: restore single-quotes on find -name '*.json'` → **already have it (FR's script is clean)**

**What changed:** uikit-dev had a regression where base64/SSH session port stripped single quotes from `find ... -name '*.json'`, causing bash glob expansion at cwd. They restored the quotes.

**Framework-research posture:** FR's `persist-inboxes.sh` is already single-quoted (lines 39, 56). Clean. Their regression was a transport-layer corruption specific to how uikit-dev ships scripts to containers, not a design flaw we share.

**Disposition:** `already have it`.

### A9. `04ff9c5 fix(team): reconcile common-prompt.md — merge Version B + Version C (#103)` → **learning moment for Cal's cross-team intake model**

**What changed:** uikit-dev discovered they had TWO versions of common-prompt.md living in two places: "Version B (1596B, git-tracked stub from Brunel's migration)" at the canonical path, and "Version C (6447B, container ghost at team-config/common-prompt.md)" at a second path. Version B had the Path Convention section; Version C had 12 other sections. PR #103 merged them into one 7059B file at the git-tracked canonical path. **The commit message attributes the discovery to "FR team's L1 Structural Change Discipline gate run"** — i.e., Cal's Gate 4 (artifact existence) caught it when framework-research did a cross-team audit.

**Problem it solves:** a form of `dual-team-dir-ambiguity.md` — different file content at runtime vs repo paths.

**Framework-research posture:** FR's Gate 4 caught this for uikit-dev. Good. The fact that Gate 4 works as an external audit mechanism is validation of Cal's four-gate framework.

**Disposition:** `already have it` (and we're the ones who caught it) — but note for Cal: this is also a data point that **Gate 4 as a cross-team audit tool works**, not just as a within-team discipline. Worth filing as an observation in wiki/observations/ if Cal's freeze allows — deferred decision.

### A10. `4ea07f7` + `7130586 chore: preserve uikit-dev team state — pre-maintenance checkpoint` → **cross-pollinate — DIRECT DATA for Volta's ship session**

**What changed:** They created `ephemeral-snapshot-2026-04-14/` as a committed directory containing: `config/config.json` (team registry with member list, pane IDs), `inboxes/*.json` (pruned to last 100), `session/415145.json` (PID, session ID, start time), `tasks/.highwatermark` (task ID counter = 18), `tasks/.lock`, and a MANIFEST.md explaining what was preserved, what was NOT, and why. The MANIFEST explicitly lists `memory/` as "35 memory files (MEMORY.md + 34 entries)" sourced from `~/.claude/projects/-home-ai-teams-dev-evr-ui-kit/memory/` — persisted via a separate commit, stored at `teams/uikit-dev/memory/`.

**Problem it solves:** container rebuild destroys `~/.claude/` state. Before a container rebuild, capture every piece of state that matters into a committed snapshot.

**Framework-research posture:** this overlaps DIRECTLY with Volta's v0.3 persist coverage design. See Section B1 and C2 for the full comparison.

**Disposition:** `cross-pollinate` — this is a working in-production implementation of the problem Volta is solving. Volta should read the MANIFEST.md before her ship session. Their approach is directory-based (`ephemeral-snapshot-<date>/` committed to repo), hers is script-based (persist/restore pairs with `--dry-run`). Different answers to similar questions. See B1.

---

## Section B — Specific overlap findings (direct answers to your 7 items)

### B1. Overlap: scratchpads-as-SoT (e543109/42df893) + ephemeral-snapshot (7130586/4ea07f7) vs. Volta's persist/restore design

**Is uikit-dev's pattern the simpler answer to what Volta is solving?** **Partly yes, partly no — they're solving two different sub-problems.**

Volta's v0.3 addresses FIVE pieces of ephemeral state:
1. Agent scratchpads (`memory/<name>.md`)
2. Inbox files (`inboxes/<name>.json`)
3. Team config (`config.json`)
4. Session metadata
5. Per-user auto-memory from `~/.claude/projects/<slug>/memory/` — **the leak hazard Cal filed**

uikit-dev's approach:
- **Scratchpads:** solved by "commit them directly to `memory/<name>.md` in the repo" — agents write to the repo path as SoT (e543109). This IS simpler than Volta's restore-project-state.sh merge-semantic approach for the scratchpad subset. **But** FR already does this too — our `memory/` scratchpads are already committed to the repo. The innovation here is the EXPLICIT common-prompt edit that says "committed to git" + the write-test verification (42df893), not the pattern itself.
- **Inboxes:** solved by persist-inboxes.sh + restore-inboxes.sh (pruning to 100 on persist, filtering shutdown messages on restore). FR has equivalent scripts — A6 cross-pollination.
- **Config / session / tasks:** solved by **ad-hoc pre-maintenance snapshot directory** (`ephemeral-snapshot-2026-04-14/` committed to repo). This is NOT a script. It's a **one-shot manual operation** that preserves a specific moment's state. The MANIFEST.md names what's in it and what's NOT.
- **Per-user auto-memory:** uikit-dev preserved this (MANIFEST says 35 memory files from `-home-ai-teams-dev-evr-ui-kit/memory/`) but **they're in a container** — Cal's gotcha says container teams are not affected by the leak. They're running the exact pattern Volta is designing, safely, on the safe substrate.

**What uikit-dev's pattern IS the simpler answer to:** pre-maintenance checkpointing. If the goal is "I'm about to rebuild the container, commit the current session's state so it survives," a manual `ephemeral-snapshot-<date>/` directory with a MANIFEST.md is **much simpler** than four scripts with `--dry-run` and a substrate-check helper. It's a one-shot, not a lifecycle.

**What uikit-dev's pattern is NOT the answer to:** routine shutdown automation. Their snapshot is dated, committed-once, and won't be touched again. Volta's scripts are meant to run every shutdown cycle. Different cadences.

**Recommendation for Volta's ship session:** read `teams/uikit-dev/ephemeral-snapshot-2026-04-14/MANIFEST.md` as an empirical reference for what needs preserving. The list of "NOT preserved (too large or reconstructable)" is especially useful — it documents decisions like "`~/.claude/projects/*/conversation-logs` — 32 files, ~21MB — reconstructable from Claude API." Those decisions would otherwise have to be re-derived. **The MANIFEST is also a data point that the substrate-mismatch mitigation matters:** uikit-dev safely ran the exact pattern Cal's gotcha describes, because they were on the safe (container) substrate. Volta's `git check-ignore` opt-in is exactly the mechanism that would let a container team like uikit-dev keep doing this AND refuse to run on a workstation operator.

### B2. Scratchpads path shape — compare to Volta's design

Volta is NOT solving "where do scratchpads live." FR already has `memory/<agent>.md` scratchpads committed to the repo. What Volta IS solving is **the `~/.claude/projects/<slug>/memory/` per-user auto-memory sync**, which is a DIFFERENT directory entirely (Claude's per-user memory, not our team's). uikit-dev's e543109 move is about OUR team's scratchpads, not Claude's per-user memory.

So the simplest answer to "is uikit-dev's pattern the simpler answer to what Volta is designing" for THIS specific subset: **no, they're orthogonal.** uikit-dev addresses team scratchpads (already solved in FR), Volta addresses Claude per-user memory. The confusion comes from both using the word "memory." The word overloads two distinct filesystem paths with two distinct substrate semantics. **This is itself a minor observation worth noting** — when Cal next writes about persist/restore, nomenclature discipline matters.

### B3. Wiki intake (8aa0883 + c3ee150) vs Cal's Protocol A

**Convergent or divergent?** **Divergent — genuinely different ownership models.**

| Dimension | uikit-dev wiki | FR wiki (Cal-owned) |
|---|---|---|
| Write access | Distributed — any agent edits any page | Centralized — Cal is the sole writer, others submit via Protocol A |
| Structure | Flat — 12 `.md` files at top level | Taxonomic — 8 subdirs (patterns, gotchas, decisions, contracts, findings, observations, process, archive) |
| Intake format | Format + rules in common-prompt (15 lines + 24 lines, no protocol layer) | Protocol A (submission) / Protocol B (query) in common-prompt, typed in `types/t09-protocols.ts` |
| Discoverability | `[[wikilinks]]` + `wiki/index.md` (flat bullet list) | Subdir navigation + wiki index (organized by type) |
| Governance role | None | Librarian role (Callimachus) with dedup, reclassification, TTL |
| Staleness management | "update or remove" rule in common-prompt, enforced by agents | Cal + TTL + explicit review cycles |
| Scope of content | Project-specific (figma, design-tokens, environment) | Meta-process (patterns, decisions about how teams work) |

**Not convergent.** They solve different problems. uikit-dev's wiki is a *project handbook*; FR's wiki is a *methodology knowledge base*. The two ownership models are load-bearing for their respective scopes:

- A project handbook needs to be cheap to update as agents learn things about the codebase. A librarian bottleneck here would slow knowledge accumulation below the codebase change rate.
- A methodology knowledge base needs dedup, classification, and cross-team consistency. Distributed writes here would produce N versions of "how we handle shutdown protocols" across N teams.

**For Cal's n=2 substrate-invariant-mismatch candidate:** **This is NOT a third data point for that pattern.** That pattern is about "same code, two substrates, opposite invariants" — a specific failure class. The wiki ownership split is a deliberate design choice, not a substrate mismatch. It's a genuinely different thing. Do not wire this into the substrate-invariant-mismatch candidate.

**BUT** — worth noting separately: distributed-wiki and centralized-wiki are both valid patterns depending on domain. Cal may want to file a pattern ("wiki governance follows content scope: project-handbook = distributed, methodology-kb = librarian") at some point, but not this freeze session, and not as an extension of her current n=2 candidate.

### B4. `e4a5c86 consolidate memory into wiki` — what does "consolidate" mean?

**"Memory files merged into wiki entries" (one-way flow, memory goes away)** — uikit-dev's model. Let me show with exact numbers from the diff:

- 10 `feedback_*.md` files → merged into ONE `feedback.md` (still in memory, auto-loaded, 27 lines with tags frontmatter). These stayed in `memory/` because they are behavioral rules that must auto-load into context.
- 11 `project_*.md` files → moved to 11 wiki pages. These are no longer in `memory/`. They are read-on-demand, not auto-loaded.
- 1 `reference_*.md` + 2 `user_*.md` → moved to `wiki/figma-api-scopes.md` and `wiki/people.md`. Also read-on-demand.

**Net effect:** uikit-dev's `memory/` now holds exactly TWO content classes:
1. **Behavioral rules** (auto-loaded) — `feedback.md` + MEMORY.md index
2. **Per-agent scratchpads** (auto-loaded per agent)

Everything else — "things we learned about this codebase" — is wiki. One-directional flow: memory → wiki is a migration; wiki → memory does not happen.

**Cal's model treats memory and wiki as distinct surfaces.** Is this a genuine architectural divergence? **Partly.** Cal's FR wiki holds meta-process knowledge; her view of `memory/` is per-agent-scratchpad-only (which matches uikit-dev's post-consolidation shape for scratchpads). FR has never had the user/feedback/project/reference auto-memory system — we went straight to scratchpads. **So FR and post-consolidation uikit-dev converge on the scratchpad-only model for `memory/`**, but diverge on what's in wiki (project knowledge vs methodology).

**Disposition for Cal:** the "memory is only scratchpads + behavioral rules" insight is the non-obvious part. uikit-dev proved you can collapse a full auto-memory layout (5 file types: user_*, feedback_*, project_*, reference_*, scratchpads) down to 2 (feedback.md + scratchpads) without loss. The 9 deletions in 2970bd6 show the pruning discipline was also needed. **Consider filing: "memory as load-gated surface — auto-load only behavioral rules and scratchpads, everything else goes to read-on-demand wiki" as a pattern candidate.** Deferred per your Cal freeze instruction — flagging for post-freeze.

### B5. `f1c6971 align with framework-research pattern` — what did they align?

Five specific alignments:
1. **Pruning to last 100 on persist** — their old persist-inboxes.sh was raw-copy; ours pruned; theirs now prunes.
2. **Shutdown-message filtering on restore** — same direction.
3. **`SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"`** — they adopted our path-resolution idiom.
4. **Count verification block** — they adopted `SOURCE_COUNT` / `DEST_COUNT` / mismatch-error pattern.
5. **`set -euo pipefail`** — they adopted our strict-mode shell contract.

The only things they DIDN'T take (beyond the post-alignment improvements): our restore filter's JSON-structured regex (they later rewrote it simpler as extracted file — A7), and FR-specific memory/ dir naming (we use `inboxes/` vs their `inboxes-backup/`).

**We should NOT propose taking anything back from this commit specifically** — it's a pure import. A7's improvements came LATER, after the import, and those ARE worth taking back.

### B6. Bugfixes 1deb90e + c6046e7 — FR latent bug check

**c6046e7 (single-quote find regression):** FR's `persist-inboxes.sh` is already clean. Lines 39 and 56 both have `-name '*.json'` single-quoted. Their regression was from a base64/SSH transport pipeline that stripped the quotes on the way into their container — specific to their deployment shipping path, not ours.

**1deb90e (restore-inboxes.sh jq-filter extraction):** **FR has the latent bug.** Our current `framework-research/restore-inboxes.sh` lines 40-45 uses the same inline jq-with-shell-escaped-quotes pattern uikit-dev abandoned. Two sub-observations:

1. **Fragility:** the escape chain `test("\"type\"\\s*:\\s*\"shutdown_request\"")` is famously breakable. Any future transport-layer change (different shell, different jq version, copy-paste through a tool that mangles quotes) reopens the defect.
2. **Semantic divergence on the filter patterns themselves:** FR's patterns require proper JSON structure (`"type":"shutdown_request"` as a key-value pair inside the `.text` field). uikit-dev's extracted filter matches the bare string `shutdown_request` anywhere in `.text`. **These will behave differently on real inbox content.** I can't judge which is correct without reading actual inbox samples — it depends on how the platform serializes shutdown protocol messages into the `.text` field. If the text is literally `"{\"type\":\"shutdown_request\",...}"` (JSON-encoded), FR's is correct and uikit-dev's is too loose. If the text is `"shutdown_request received from aalto"` (human-prose), uikit-dev's is correct and FR's misses.

**Recommendation:** route to Volta for her ship session — she's the script owner and she's doing a persist/restore review anyway. Task: (a) extract FR's filter to a sibling `restore-filter.jq` file with existence check (matches uikit-dev pattern), (b) decide the match-semantic (structural JSON vs free-string) against a real inbox sample, (c) test both on existing `inboxes/*.json` content in FR. Not a blocker for her current audit, but a natural addition to her audit docket.

### B7. `b47544b unify agent names codenames` — driven by persona drift?

**Yes, and it's directly connected to Cal's pane-labels gotcha — but the relationship is "root cause uncovered," not "second instance."**

Look at what b47544b renamed:
- `roster.json` member names: `team-lead` → `aalto`, `component-dev-1` → `eames`, `component-dev-2` → `rams`, `qa-a11y` → `braille`, `docs-gallery` → `tschichold`
- Inbox files: `team-lead.json` → `aalto.json`, etc. (both runtime and backup)
- Prompt files: `team-lead.md` → `aalto.md`, etc.
- `apply-layout.sh` pane labels: `@team-lead` → `@aalto`, etc.
- common-prompt.md SendMessage reference names
- ephemeral-snapshot-2026-04-14/MANIFEST.md and config entries

**Cal's gotcha filed n=1 as "pane labels decoupled from personas."** What b47544b reveals is that pane labels were NOT the only decoupling site — **role IDs were load-bearing in SIX identifier sites** (roster, inbox filenames, prompt filenames, pane labels, SendMessage targets, config.json members). Pane labels were the visible symptom; the ACTUAL structure was "role-ID is the system-of-record, persona is a lore field that nobody routes against."

**Is this n=2 for the pane-labels gotcha?** **No — it's more load-bearing than n=2.** It's the same instance, just viewed at a different layer. Cal's n=1 found the tip; b47544b is the full iceberg under the same tip.

**Is this n=2 for a wider identifier-to-persona decoupling pattern?** **Maybe.** Cal's gotcha says: "If a second instance of identifier-to-persona decoupling surfaces (e.g., in a dashboard, bug tracker, or status page), promote to `wiki/patterns/identifier-to-persona-mapping-discipline.md`." The bug-tracker/dashboard/status-page examples are all **presentation layer** duplicates. b47544b is a **structural layer** finding: roster-inbox-prompt-config all decoupled, not just display. That's a different shape of evidence.

**Recommendation for Cal (post-freeze):** the pane-labels gotcha can be updated with an addendum citing b47544b as **cross-confirmation of root cause**, not as n=2. The n=2 still isn't there — you'd need a second TEAM with the same root-cause pattern to promote to the "identifier-to-persona-mapping-discipline" pattern. That second team could easily be found by checking whether `cloudflare-builders` or `raamatukoi-dev` or `screenwerk` roster files use role IDs or persona codenames as agent addresses. I did NOT check those (out of scope for this session and possibly out of this clone's reach), but it's a cheap follow-up.

---

## Section C — Data points for existing WIP

### C1. For Cal (post-freeze): three items

1. **Pane-labels gotcha root cause** — b47544b is cross-confirmation that pane-label decoupling was a surface symptom of deeper identifier/persona split in uikit-dev. Update the gotcha with an addendum citing the six decoupling sites (not a new instance — same instance viewed at the structural layer). **Candidate Protocol A submission — recommend Cal draft when freeze lifts.**

2. **Memory-as-load-gated-surface pattern candidate** — uikit-dev's e4a5c86 + 2970bd6 + e543109 together demonstrate that a full auto-memory layout (user/feedback/project/reference/scratchpad) can be collapsed to (feedback-only + scratchpads) with the rest migrated to wiki, without loss, yielding cleaner load semantics. This is a genuine architectural insight. **Candidate Protocol A submission — recommend Cal draft when freeze lifts. Content scope: process, confidence: high, source: uikit-dev develop branch commits e4a5c86+2970bd6+e543109.**

3. **Wiki governance model split** — project-handbook (distributed writes) vs methodology-kb (librarian-gated) as two valid patterns, each load-bearing for their scope. **Lower priority — wait for a third data point before filing.** Not substrate-invariant-mismatch territory, not related to her n=2 candidate.

### C2. For Volta (ship session): two items

1. **ephemeral-snapshot-2026-04-14/MANIFEST.md from uikit-dev** is empirical reference material for her persist coverage decisions. Read before ship. Key data:
   - What uikit-dev chose to preserve: config/config.json, inboxes/*.json, session/<pid>.json, tasks/.highwatermark, tasks/.lock, AND per-user-memory from `-home-ai-teams-dev-evr-ui-kit/memory/`
   - What they chose NOT to preserve: conversation logs (21MB, reconstructable), tool-result cache, subagent transcripts, file-history (git has it)
   - Format: directory committed to repo with MANIFEST.md explaining choices (not script-driven)
   - Cadence: one-shot pre-maintenance, not per-shutdown
   - The fact that uikit-dev preserved the per-user-memory path successfully = **empirical validation that container substrate is safe for the mirror pattern**, as Cal's gotcha predicted. Volta's `git check-ignore` opt-in is exactly the mechanism that would let uikit-dev continue this pattern safely while refusing to run on workstation substrate.

2. **restore-inboxes.sh latent bug parity with uikit-dev's 1deb90e fix** (see B6). Volta's audit already covers the four WIP scripts; adding "extract restore-filter.jq from inline jq + resolve match-semantic divergence against real inbox samples" as task 5 for her ship session would close the script-hygiene gap pointed out by uikit-dev's fix.

---

## Section D — Open questions (DO NOT contact Aalto myself — team-lead routing decision)

1. **`memory/MEMORY.md` auto-loading contract in uikit-dev.** The new MEMORY.md (17 lines, pointing to feedback.md and scratchpads) appears designed to be auto-loaded into agent context on session start. But the `common-prompt.md` On Startup section (lines 122-127) says "Read your scratchpad... Read common-prompt... Read CLAUDE.md" — it does NOT explicitly list `memory/MEMORY.md` or `memory/feedback.md` as must-reads. **Is `feedback.md` auto-loaded by platform (via `MEMORY.md` index following) or by convention (agents manually read it)?** If platform-auto, is there a magic filename convention? If manual, what happens to a new agent who doesn't know to read it? Ask Aalto.

2. **Impact of 2970bd6 pruning on in-flight work.** The 9 deleted `project_*.md` files all corresponded to closed issues. But issue #92 was deleted and Rams's current scratchpad (`memory/rams.md`) says Task #16 is in_progress on branch `task/92-missing-tokens`. **Is issue #92 actually closed, or is Rams's scratchpad stale, or did Aalto close the issue before the work was finished?** Ask Aalto — the answer matters for whether the pruning cadence is actually aligned with work completion or running ahead of it.

3. **Wiki flat-vs-taxonomic choice — was it considered and rejected, or defaulted?** uikit-dev's wiki has 12 files at one level with `[[wikilinks]]` and `wiki/index.md` as navigation. Was subdir taxonomy (like FR's patterns/gotchas/decisions/contracts) considered and rejected, or did the flat shape happen by default? The answer changes whether this is an explicit architectural choice (convergent-but-different) or an accident (potentially re-openable for joint convergence). Ask Aalto.

4. **Does uikit-dev have a librarian-equivalent role?** Reading the roster.json members: aalto (team-lead), eames (component dev), rams (component dev), braille (QA/a11y), tschichold (docs/gallery). **Nobody is a dedicated knowledge curator.** Is wiki write discipline enforced by Aalto during PR review, or is it genuinely distributed-without-review? The answer tells us whether uikit-dev's wiki model actually works at scale or relies on team size (5 agents) and team-lead bandwidth. Scaling evidence matters for whether to extract a pattern.

5. **Is b47544b the only team-config rename they've done, or the second?** If there's a history of renames (roles → personas is first, something else → roles was earlier), that's evidence the identifier architecture is still settling and a pattern isn't solidified yet. If this is the only one, the model is likely stable now. Ask Aalto.

6. **Cross-check: did uikit-dev explicitly decide NOT to have a Protocol A / Protocol B intake layer?** Or was it never considered? If considered-and-rejected, the rejection reasons are valuable data for Cal's wiki governance thinking. If never considered, this is just a divergent-by-default, which is weaker signal. Ask Aalto.

---

## Report metadata

- Commits read: 15 (14 team-config + 1 unrelated-docs, ignored per brief)
- Files read in uikit-dev clone (read-only): common-prompt.md, startup.md, roster.json, persist-inboxes.sh, restore-inboxes.sh, restore-filter.jq, apply-layout.sh, memory/MEMORY.md, memory/feedback.md, memory/braille.md, memory/eames.md, memory/rams.md, memory/tschichold.md, wiki/index.md, ephemeral-snapshot-2026-04-14/MANIFEST.md, ephemeral-snapshot-2026-04-14/config/config.json, ephemeral-snapshot-2026-04-14/session/415145.json, ephemeral-snapshot-2026-04-14/tasks/.highwatermark, prompts/aalto.md, prompts/eames.md, CLAUDE.md
- Files read in mitselek-ai-teams (read-only): framework-research/persist-inboxes.sh, restore-inboxes.sh, common-prompt.md, wiki/gotchas/tmux-pane-labels-decoupled-from-personas.md, wiki/gotchas/persist-project-state-leaks-per-user-memory.md, docs/persist-coverage-audit-2026-04-14.md, memory/finn.md (my own)
- Git operations: `git status`, `git log`, `git show <sha>` only. No `git checkout`. No branch switches. Nothing written anywhere.
- Subagents spawned: 0 (per brief constraint)
- Cross-team messages sent: 0 (per brief constraint)
- Scratchpads updated: 0 (per brief constraint — no writes of any kind)

(*FR:Finn*)
