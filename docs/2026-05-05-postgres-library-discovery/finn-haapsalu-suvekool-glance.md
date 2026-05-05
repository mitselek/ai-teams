# Haapsalu-Suvekool glance — Brilliant / xireactor / KB-federation references

Light read-only glance at `mitselek/Haapsalu-Suvekool` for KB-federation references that could short-circuit phase A's re-derivation. Cloned to `_external/Haapsalu-Suvekool`. **Inverted result vs polyphony glance.**

(*FR:Finn*)

## Top-line (3 bullets)

- **Strong positive finding: Brilliant is in active production use as the team's cross-session knowledge layer.** Twenty-plus references across `teams/esl-suvekool/{startup,common-prompt,design-spec}.md`, `prompts/koidula.md`, scratchpads (`memory/{team-lead,koidula}.md`), and `docs/{stakeholders,timeline}.md`. Integration is via `mcp__brilliant__*` tools (search_entries, update_entry) and uses Brilliant's logical-path namespacing (`Projects/esl`, `Meetings/esl/2026-08-14-suvekool-haapsalu`, `Context/esl/*`, `Resources/esl/*`).
- **Zero matches for `xireactor` or `xireactor-brilliant`** — they call it "Brilliant" only. Zero matches for `federation` or `federated`. The pattern PO calls "Topology B (per-team libraries + central federation)" is **not labeled federation in the repo**; it's labeled **Brilliant routing** with a routing convention that distinguishes scratchpad-local trivia from Brilliant-promoted stable-non-obvious facts.
- **Roadwarrior-sync skill is the load-bearing artifact for "central federation, multi-consumer".** `.claude/skills/roadwarrior-sync/SKILL.md` documents a *manual copy-paste handshake* between two Brilliant consumers — the local 4-agent team (queries Brilliant directly via MCP) and a claude.ai Project (cannot query Brilliant; receives synthesized snapshots via `[SYNC BRIEF]` ↔ `[SYNC: YYYY-MM-DD]` handshake). This is the operational pattern PO likely meant by "battle-proof".

## Source paths checked

- Top-level: `README.md`, `GEMINI.md`, `.claude/startup.md`, `.claude/skills/roadwarrior-sync/SKILL.md`
- `teams/esl-suvekool/startup.md` — has Brilliant pulse as Step 5 of session start
- `teams/esl-suvekool/common-prompt.md` — has dedicated `## Brilliant Routing` section
- `teams/esl-suvekool/design-spec.md` — Brilliant referenced as scribe's source for stakeholder map
- `teams/esl-suvekool/prompts/{koidula,palestrina-equiv}.md` — Brilliant as sourcing-style and language-rule authority
- `teams/esl-suvekool/memory/team-lead.md`, `memory/koidula.md` — operational use, version stamps, gotchas
- `teams/esl-suvekool/docs/stakeholders.md`, `docs/timeline.md` — explicit Brilliant cross-references
- `teams/esl-suvekool/canonical/` — not checked beyond directory listing (canonical plan stays static)
- `F001-youtube-mcp-server/` — not checked (out-of-scope per design-spec)

## Quotes worth lifting (with file:line)

**On Brilliant as canonical cross-session knowledge layer:**
> "**Brilliant entries:** `Projects/esl`, `Meetings/esl/2026-08-14-suvekool-haapsalu`, `Context/esl/liisa-rahusoo-lahkumine-2027` — primary external-context source. Query before forming opinions on stakeholder topics." (`teams/esl-suvekool/common-prompt.md:14`)

**On Brilliant routing rule (the "what goes where" decision):**
> "When you discover a stable, non-obvious fact about ESL governance, stakeholders, or cross-project context that a future session would also need, submit it to Brilliant via staging. Apply the same 'stable, non-obvious, would save future-me >5 min' bar as scratchpad entries. Trivia and per-task state stay in scratchpads." (`common-prompt.md:127`)

**On Brilliant pulse as session-start ritual:**
> "Brilliant pulse. Run a tight `mcp__brilliant__search_entries` with `logical_path='Meetings/esl/2026-08-14-suvekool-haapsalu'` and `logical_path='Projects/esl'`. Skim `updated_at` and `domain_meta.status`. Anything new since last session?" (`teams/esl-suvekool/startup.md:11`)

**On staging-routed writes from agents (matches Brilliant's documented governance):**
> "If PO greenlights, stage via `mcp__brilliant__update_entry` (which routes to staging per repo governance)." (`teams/esl-suvekool/memory/team-lead.md:308`)

**On Brilliant-as-truth-source asymmetry with the team's local docs:**
> "Brilliant'is paralleelseid muudatusi ... **käsitsi sünkroniseerida ei pea**: Brilliant on tõe-allikas, see fail on käsiraamat." [Estonian: parallel updates in Brilliant don't need to be hand-synced; Brilliant is the source of truth, this file is the manual.] (`teams/esl-suvekool/docs/stakeholders.md:166`)

**On staleness-vs-authority calibration (LEARNED):**
> "Brilliant `Projects/esl` v5 (S2 source for §1) was staler than I realized... Lesson for succession docs: if a stakeholder fact is registry-controlled, prefer e-Äriregister snapshot over Brilliant snapshot — and version-stamp the source-row when copying." (`memory/koidula.md:15`)

**On the multi-consumer / road-warrior gap (the closest thing to federation):**
> "Project Claude **cannot query Brilliant** — knowledge is whatever you've uploaded. If a question genuinely needs Brilliant context, escalate to the local team." (`.claude/skills/roadwarrior-sync/SKILL.md:140`)

## Unattributed-claims list

1. **PO claim "battle-proof for Topology B"** — substantively confirmed for one-team-uses-central-Brilliant pattern. Not yet confirmed for *cross-team* federation: only one team (esl-suvekool) is shown using this Brilliant deployment in the repo. Cross-team-federation would require two+ teams in two+ repos sharing one Brilliant; whether other teams (e.g., framework-research itself, or other Eesti-Raudtee teams) hit the same Brilliant is not visible from this repo alone. **Likely true that Brilliant deployment is shared org-wide given the integration shape, but the repo evidence is single-team.**
2. **Topology B per se — "per-team libraries + central federation":** the repo shows *one team's* integration with one central Brilliant. The "per-team library" half (each team owning a subset path-namespace) is implied by the path conventions (`Projects/esl/*` is owned by this team) but not formally documented as a federation contract.
3. **Roadwarrior-sync as second-consumer pattern**: real, documented, operational. The handshake protocol (`[SYNC BRIEF]` from local team → claude.ai Project, `[SYNC: YYYY-MM-DD]` echo back, `.last-sync` anchor) is a useful precedent for any consumer that can't directly query the canonical store. Cleaner shape than I'd have guessed at design time.
4. **Patterns transferable past the domain match (4):**
   (a) `mcp__brilliant__update_entry` writes always route through staging per repo governance — confirms Brilliant's agent-write-via-staging contract works in production.
   (b) Path-namespace per logical concern (`Projects/esl`, `Meetings/esl/<date>`, `Context/esl/*`, `Resources/esl/*`) is the actual federation primitive — namespace is the team-shard.
   (c) `Brilliant pulse` ritual at session-start = lightweight session_init density-manifest pattern, applied operationally.
   (d) "Submit to Brilliant only if stable/non-obvious/saves-future-me-5min" = quality-floor heuristic that prevents trivia from saturating the canonical store. Reproducible.

(*FR:Finn*)
