# hr-devs Knowledge Migration Report — 2026-03-24

(*FR:Medici*)

## Scope

Assessment of bare-metal hr-devs team knowledge artifacts for migration to PROD-LLM container.

**Source:** RC at `dev@100.96.54.170`, path `/home/dev/github/hr-platform/.claude/teams/hr-devs/`
**Target:** Fresh container, `designs/new/hr-devs/.claude/teams/hr-devs/`

---

## Overall Health Grade: **B+**

The team leaves RC in excellent operational state. Scratchpads are clean, session-end checkpoints are thorough, and the shared docs are current. The main concern is a moderate volume of technical knowledge that exists only in scratchpads and should be promoted to prompts or shared docs before it's lost on first container start.

---

## 1. Team State Summary (from lead.md)

The bare-metal team shut down cleanly after a productive 2026-03-24 session:

- **16 issues closed** this session (under @allerk), all merged to develop, deployed to dev
- **Test suite:** 1255 tests passing
- **Latest migration:** 0048
- **Develop branch:** clean, all deployed
- **3 open issues (not actionable by team):** #437 (@allerk deferred), #416 (PO decision), #420 (designer)

The handoff is orderly. No in-progress WIP. No stale branches.

---

## 2. Scratchpad-by-Scratchpad Assessment

### lead.md — MIGRATE ALL, PROMOTE 4 ITEMS

State is clean and well-structured. Four `[LEARNED]` items from 2026-03-24 deserve promotion to team-lead prompt:

| Entry | Content | Destination |
|---|---|---|
| PR base must be develop | Accidentally merged to main, had to force-push revert | team-lead.md prompt |
| Build before deploy | `deploy:dev` has no build step — must `build:dev` first | common-prompt Known Pitfalls |
| Always route through Marcus | Skipped Marcus review once, corrected | team-lead.md prompt Anti-Patterns |
| Always delegate to agents | Implemented a story directly after agent failures, corrected | team-lead.md prompt Anti-Patterns |

These are behavioral corrections from real incidents. They belong in the prompt, not just in memory.

**Migrate as-is.** Prune the old per-session checkpoint blocks (only keep latest) before migration.

---

### sven.md — MIGRATE, PROMOTE 5 ITEMS

Sven has the richest scratchpad (14 GOTCHAs, 3 PATTERNs, 3 DECISIONs). Several items are container-specific gotchas that belong in common-prompt or his prompt directly.

**Promote to common-prompt Known Pitfalls:**

| Entry | Source | Why |
|---|---|---|
| `gh` binary at `/home/dev/local/bin/gh` | [GOTCHA] 2026-03-24 | **CONTAINER-SPECIFIC** — on bare-metal. Container uses system `gh`. Mark as bare-metal-only or omit. |
| Edit tool tab matching workaround | [GOTCHA] 2026-03-24 | Agent tool behavior — keep in sven.md, not common-prompt |
| `npm run deploy:dev` has no build step | [GOTCHA] 2026-03-24 | Duplicates lead.md finding — PROMOTE to common-prompt |
| `answers.answer` is NOT NULL | [GOTCHA] 2026-03-24 | D1 schema fact — useful for Dag too, promote to shared |
| D1 failed migration still recorded | [GOTCHA] 2026-03-24 | Dag's domain — crosspoll to dag.md or architecture-decisions.md |
| Cloudflare deploy credentials export pattern | [GOTCHA] 2026-03-24 | Promote to common-prompt |

**Note on `gh` path gotcha:** `/home/dev/local/bin/gh` is the bare-metal path. On the container, `gh` is installed to system PATH. This gotcha is STALE for the container and should be dropped.

**Old/stale entries to prune:**
- [GOTCHA] Windows Scoop Shims + Node child_process — bare-metal/Windows gotcha, irrelevant to container
- [GOTCHA] Pandoc + XeLaTeX speed — md2pdf-server context, not hr-devs
- [GOTCHA] Local Branch Name != Remote — generic git, already known

**Migrate** the rest. 3 old entries safe to prune.

---

### marcus.md — MIGRATE, PROMOTE 2 ITEMS

Marcus has a well-maintained scratchpad. The large review table (2026-03-24 checkpoint, 12 PRs) captures valuable patterns.

**Promote to common-prompt Known Pitfalls:**

| Entry | Content |
|---|---|
| `binary_choice` answers are `'yes'`/`'no'` | After migration 0047. Relevant to Tess (test seeds), Sven (template), Dag (queries) |
| `flex` on `<td>` breaks table layout | Use `text-right` instead. Cross-cutting CSS gotcha. |

**`sendInternshipNotifications` safety gap:** Marcus documents that `sendInternshipNotifications` bypasses `resolveRecipientEmail` — emails go to real recipients on ALL environments. This is a live security/safety concern. It was documented in #445 but the fix was docs only (issue #445). The underlying code risk persists. This should be in `test-gaps.md` if no issue exists for the actual fix.

**Old entries safe to prune:** The route restructuring patterns (2026-03-12) are for routes that have since been renamed. The review table from 2026-03-12 (PR #247 etc.) is all merged, >2 weeks old — prune. Previous audit (Audit v4) already recommended this.

**Migrate** the 2026-03-24 entries. Prune the 2026-03-12 entries.

---

### dag.md — MIGRATE, PROMOTE 3 ITEMS

Dag's scratchpad is focused and high-quality. The schema and query patterns are invaluable for container start.

**Promote to architecture-decisions.md:**

| Entry | Content |
|---|---|
| D1 BLOB handling | `unhex()` pattern for BLOB inserts — relevant cross-team |
| `hr_question_comments` lacks repository | Inline SQL in every route — documented as "top candidate" |
| D1 failed migration recovery | INSERT OR REPLACE into d1_migrations — needed by all agents |

**CHECKPOINT block:** Contains the full session summary (16 issues, migration tracker, test IDs). Keep as-is — it's the canonical handoff note.

**Prune:** [LEARNED] 2026-03-10 misc patterns entry for `fix/73-no-explicit-any` branch branching — this is stale (historical branch, all merged).

**Migrate** essentially everything. It's under 100 lines and all relevant.

---

### tess.md — MIGRATE, PROMOTE 1 ITEM, TRIM CHECKPOINTS

Tess has the largest scratchpad (~130 lines estimated from RC output). Contains extensive test ID range tables that are factually current and irreplaceable.

**High-value content to keep:**
- Complete test ID range table (IDs 600–1255+) — CRITICAL for continuity
- All [PATTERN] entries — stable, well-documented, non-obvious
- All [GOTCHA] entries — hard-won discoveries

**Promote to common-prompt Known Pitfalls or shared doc:**
- `?raw import for .ts server files` — already in Sven's domain, but Tess independently confirmed. Worth noting in common-prompt testing section.

**Prune from scratchpad:**
- The large CHECKPOINT block (end-of-session 2026-03-24) duplicates dag.md checkpoint info. Keep test IDs section, prune the "16 issues closed" narrative.
- "Open RED branches" note at end of checkpoint — these are all merged now (per lead.md). STALE.

**Action needed before migration:** Verify the "Open RED branches" section (#404, #410, #414, #417) — lead.md confirms all issues are closed. Those branches are done. Remove from scratchpad.

**Migrate** core content. Prune checkpoint narrative and stale branch list.

---

### finn.md — MIGRATE, SOME ENTRIES STALE

Finn has detailed domain knowledge accumulated over weeks. Most is still highly relevant.

**Stale entries to prune:**
- [LEARNED] 2026-03-11 — PR #208 migration 0040 — this is ancient history, migration applied months ago. The `SOOVITAB_QUESTION_TEXT` risk note is obsolete (fixed in Q138 ID-based approach).
- [LEARNED] 2026-03-11 — #132 perioodifilter — planning notes for a story that may now be closed or restructured. Verify.
- [LEARNED] MCP server stdio patterns — generic, belongs in dev-toolkit documentation, not hr-devs finn scratchpad.
- [LEARNED] Figma REST API is read-only — generic Figma fact, already in finn's prompt.

**Keep:**
- All 2026-03-24 entries — fresh, actionable internship domain knowledge
- `sendInternshipNotifications` bypass safety gap — CRITICAL, documented in #445 but code unfixed
- SENDING stuck bug (#331) — still open as backlog
- Figma rate limit operational detail — not in prompt, valuable
- Q138 type history — migration context worth keeping

**Promote to common-prompt Known Pitfalls:**
- `SOOVITAB_QUESTION_ID = 138` replaces text matching — relevant to Dag and Sven too

**Trim to ~80 lines.** Currently over 100 lines by a significant margin.

---

### arvo.md — MIGRATE, MOSTLY SESSION NOTES

Arvo's scratchpad is primarily a session log rather than persisted knowledge. The Figma gap analysis status table and reference docs location are valuable.

**High-value content:**
- Figma reference docs location (`conversations/docs/figma/lahkumisvestlus/`) — needed by all agents doing exit work
- Gap analysis status table — current state of which gaps are resolved/open/keeper
- `#416 GAP-2.6` — open issue, dashboard graphical bars needed

**Prune:**
- The "Issues closed this session" list — duplicates lead.md, dag.md, tess.md
- "Key process learnings" — same 4 items as lead.md [LEARNED] entries
- "Test ID ranges" section — Tess owns this

**Migrate** the Figma reference and gap analysis sections. Prune the session log.

---

### medici.md — MIGRATE, ALL CURRENT

Medici's scratchpad contains three patterns from previous audits and a log of the v7 audit findings. All content is valid and non-stale.

**Notable:** Medici documents that `unblockExitConversation` bug was FIXED in source but test-gaps.md still says UNFILED. This is an actionable discrepancy — test-gaps.md needs updating.

**Migrate as-is.**

---

## 3. Shared Docs Assessment

### common-prompt.md (designs/new version)

**Two unfixed issues from my container readiness audit (still present):**

1. **Agent Spawning Rule** (line 52): Still says `run_in_background: true` (Agent tool pattern). Container uses tmux + spawn_member.sh. This will confuse team-lead on first session.

2. **Dashboard docs path** (line 183): Still `~/github/dev-toolkit/...`. Container path is `~/workspace/dev-toolkit/...`. Will fail on every dashboard push.

**New additions since reference/ version (positive):**
- D1 multi-statement prepare() gotcha (line 200) — promoted from marcus.md ✓
- SvelteKit +page.server.ts exports gotcha (line 201) — promoted from sven.md ✓
- Vite ?raw imports gotcha (line 202) — promoted from tess.md ✓

**Items to add from RC scratchpads (identified above):**
- `npm run deploy:dev` has no build step — must `build:dev` first
- `binary_choice` answers are `'yes'`/`'no'` after migration 0047
- `flex` on `<td>` breaks table layout — use `text-right`
- Cloudflare deploy credentials export pattern

### architecture-decisions.md (designs/new)

Same content as reference/ version. All 4 decisions still valid.

**Add from RC scratchpads:**
- D1 failed migration recovery pattern (from dag.md)

### test-gaps.md (designs/new)

Same as reference/ version. Contains 13 items. Two status updates needed:
- `1900-01-01 sentinel` — marked RESOLVED ✓
- `unblockExitConversation deleted_at` — still marked UNFILED but medici.md says it's FIXED in source. Needs verification and update to RESOLVED if confirmed.

### api-contracts.md

Still empty. This is expected — the team uses direct repository imports, not REST between frontend/backend. The file structure is correct.

---

## 4. Prompt Coherence (designs/new versions)

All 9 agent prompts are internally consistent. No contradictions between prompts.

**Gaps identified — items from RC scratchpads not yet in prompts:**

| Agent | Missing from prompt | Source |
|---|---|---|
| team-lead | PR must target develop | lead.md |
| team-lead | `build:dev` before `deploy:dev` | lead.md / sven.md |
| team-lead | Always route through Marcus | lead.md |
| team-lead | Always delegate even after failures | lead.md |
| sven | `gh` at `/home/dev/local/bin/gh` is BARE-METAL only — drop for container | sven.md |
| sven | D1 answers.answer NOT NULL — use DELETE not UPDATE NULL | sven.md |
| dag | D1 failed migration recovery (INSERT OR REPLACE into d1_migrations) | dag.md |
| dag | `hr_question_comments` has no repo, inline SQL everywhere | dag.md |
| finn | `SOOVITAB_QUESTION_ID = 138` replaces text matching | finn.md |
| marcus | `sendInternshipNotifications` bypasses safety guard | marcus.md |

---

## 5. What Needs Doing Before Container First Session

### Blockers (must fix before spawning agents)

1. **common-prompt spawn rule** — change `run_in_background: true` to describe tmux + spawn_member.sh pattern. H2 from container audit, still unfixed.

2. **common-prompt dashboard path** — `~/github/dev-toolkit/` → `~/workspace/dev-toolkit/`. M3 from container audit, still unfixed.

### High priority (team-lead will hit these in session 1)

3. **Promote 4 team-lead learnings to team-lead.md prompt** — PR base, build+deploy order, Marcus mandatory, always delegate.

4. **Update test-gaps.md** — verify `unblockExitConversation` fix in source, update from UNFILED to RESOLVED.

5. **`sendInternshipNotifications` safety gap** — ensure a GitHub issue exists for the actual code fix (not just docs). Check #445.

### Medium priority (before sprint work begins)

6. **Migrate RC scratchpads** — copy current versions to container hr-platform repo, with pruning as described above.

7. **Add to common-prompt Known Pitfalls:** deploy workflow, binary_choice answer values, flex-on-td, Cloudflare creds export.

8. **Sven.md: drop `gh` path gotcha** — bare-metal specific, stale for container.

9. **Finn.md trim** — prune 4 stale entries, bring under 100 lines.

10. **Arvo.md trim** — prune session log, keep Figma references and gap analysis.

---

## 6. Knowledge Migration Checklist

```
SCRATCHPADS (copy from RC → container hr-platform repo memory/)
[ ] lead.md   — migrate, prune old checkpoints, keep latest
[ ] sven.md   — migrate, prune 3 old entries, drop gh-path gotcha
[ ] marcus.md — migrate, prune 2026-03-12 reviews
[ ] dag.md    — migrate as-is (under 100 lines, all relevant)
[ ] tess.md   — migrate, prune checkpoint narrative, remove stale branches
[ ] finn.md   — migrate, prune 4 stale entries
[ ] arvo.md   — migrate, prune session log, keep Figma + gap analysis
[ ] medici.md — migrate as-is

SHARED DOCS (update in container hr-platform repo)
[ ] common-prompt.md — fix spawn rule (line 52), fix dashboard path (line 183), add 4 new pitfalls
[ ] test-gaps.md — verify + mark unblockExitConversation RESOLVED
[ ] architecture-decisions.md — add D1 failed migration recovery pattern

PROMPTS (update in container hr-platform repo)
[ ] team-lead.md — add 4 behavioral learnings from lead.md
[ ] marcus.md    — add sendInternshipNotifications warning
[ ] dag.md       — add failed migration recovery, hr_question_comments note
```

(*FR:Medici*)
