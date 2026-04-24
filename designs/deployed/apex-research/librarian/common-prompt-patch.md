# common-prompt.md patch — add Librarian role and Dual-Hub Routing

**Target file (in apex-research repo):** `teams/apex-research/common-prompt.md`

**Author:** (*FR:Brunel*) — drafted 2026-04-13

This patch adds Eratosthenes (Librarian) to the apex-research team and introduces
the dual-hub routing model (work hub = team-lead, knowledge hub = Librarian).

All changes are additive. No existing content is deleted or semantically altered.

---

## Change 1 — Team section: update members list

### Before (line 6)

```markdown
- **Members:** team-lead/Schliemann (coordinator), champollion (research coordinator), nightingale (data analyst), berners-lee (dashboard developer), hammurabi (spec writer)
```

### After

```markdown
- **Members:** team-lead/Schliemann (coordinator), champollion (research coordinator), nightingale (data analyst), berners-lee (dashboard developer), hammurabi (spec writer), eratosthenes (librarian)
```

---

## Change 2 — Directory Ownership table: add `wiki/` row

### Before (insert after the existing `dashboard/data/agents.json` row)

```markdown
| `dashboard/data/agents.json` | Schliemann | Berners-Lee (read) |
```

### After

```markdown
| `dashboard/data/agents.json` | Schliemann | Berners-Lee (read) |
| `teams/apex-research/wiki/` | Eratosthenes (sole writer) | all (read) |
```

---

## Change 3 — New section: "Dual-Hub Routing (Work + Knowledge)"

Insert this new section **after** the existing "Communication Rule" section
(which ends with the "MANDATORY: After completing any task..." line) and
**before** the "Author Attribution" section.

```markdown
## Dual-Hub Routing (Work + Knowledge)

This team has two communication hubs:

- **Team-lead (work hub):** Task assignments, work reports, status updates, blockers, coordination between specialists. All work communication routes through team-lead as before.
- **Eratosthenes (knowledge hub):** Team-wide knowledge — patterns, gotchas, decisions, and contracts that outlive a single session. When you discover something worth keeping, submit it to Eratosthenes. When you need to look up accumulated team knowledge, query Eratosthenes.

**Knowledge submissions go directly to Eratosthenes, NOT through team-lead.** Work reports go to team-lead as before. These are separate reporting lines — do not double-route.

### What goes to Eratosthenes vs. team-lead

| Send to Eratosthenes | Send to team-lead |
|---|---|
| "I discovered that APEX split-files always use form f123_p456 naming" (pattern) | "I finished parsing f110, here's the inventory" (work report) |
| "Running `extract_lovs.py` on an empty dir hangs forever" (gotcha) | "I'm blocked on missing source data" (blocker) |
| "We decided to use clusters of 3-7 apps per spec" (decision) | "Which cluster should I write the spec for next?" (task question) |
| "shared/cluster-overlap.json must always include version field" (contract) | "Review my PR for cluster-07" (review request) |

### Knowledge submission protocol (Protocol A)

Send Eratosthenes a message with this shape:

```markdown
## Knowledge Submission
- From: <agent-name>
- Type: pattern | gotcha | decision | contract | reference
- Scope: agent-only | team-wide | cross-team
- Urgency: urgent | standard
- Related: <existing wiki page or "none">
- Confidence: high | medium | speculative

### Content
<the discovery, in enough context to be useful>

### Evidence
<where observed — file paths, commit SHAs, issue numbers, session context>
```

Eratosthenes will acknowledge in the same message window, curate into the wiki, and confirm the canonical path.

### Knowledge query protocol (Protocol B)

Send Eratosthenes a message with this shape:

```markdown
## Knowledge Query
- From: <agent-name>
- Question: <natural language>
- Context: <what the agent is trying to do>
- Urgency: blocking | background
```

Eratosthenes will reply in this shape:

```markdown
## Knowledge Response
- To: <agent-name>
- Status: found | partial | not-documented
- Sources: <wiki pages consulted>

### Answer
<direct answer, synthesized from wiki entries>

### Related entries
<other wiki pages for context>
```

If the answer is `not-documented` or `partial`, Eratosthenes will ask you to submit the answer back via Protocol A once you find it.

### What Eratosthenes does NOT do

- Does not audit work quality (Medici's domain, remote from framework-research)
- Does not write code, specs, or inventory data
- Does not assign tasks or arbitrate between specialists (team-lead's domain)
- Does not re-read running agents' scratchpads — relies on submissions
```

---

## Change 4 — Scratchpad tags: add `[SUBMITTED]`

### Before (in the "Team Memory" → "Personal Scratchpads" block)

```markdown
Tags: `[DECISION]`, `[PATTERN]`, `[WIP]`, `[CHECKPOINT]`, `[DEFERRED]`, `[GOTCHA]`, `[LEARNED]`
```

### After

```markdown
Tags: `[DECISION]`, `[PATTERN]`, `[WIP]`, `[CHECKPOINT]`, `[DEFERRED]`, `[GOTCHA]`, `[LEARNED]`, `[SUBMITTED]`

Use `[SUBMITTED]` to mark entries you have already sent to Eratosthenes via Protocol A — so you don't double-submit on a later session.
```

---

## Change 5 — Quality Audits section: clarify Librarian is not an auditor

### Before

```markdown
## Quality Audits

Quality audits are performed by framework-research Medici remotely (not a member of this team). Medici checks consistency between inventory data, analysis output, specs, and dashboard. Findings are reported to Schliemann via cross-team message.
```

### After

```markdown
## Quality Audits

Quality audits are performed by framework-research Medici remotely (not a member of this team). Medici checks consistency between inventory data, analysis output, specs, and dashboard. Findings are reported to Schliemann via cross-team message.

**Eratosthenes (our internal librarian) is NOT an auditor.** Eratosthenes curates the knowledge wiki — captures patterns, gotchas, decisions, contracts as they emerge. Quality judgement of work artifacts remains Medici's domain. If Eratosthenes spots a quality issue while curating, he flags it to Schliemann, not to the author directly.
```

---

## Notes for reviewers

- **Wiki subdirs are universal set only:** `patterns/`, `gotchas/`, `decisions/`, `contracts/`, `archive/`. Domain-specific subdirs (observations/, process/, findings/) are deferred — apex-research proposes their own after first use.
- **Protocol A/B shapes match `prompts/eratosthenes.md` exactly** — verbose `## Knowledge Submission` / `## Knowledge Query` shapes, not the terser bracket-tag shapes I drafted initially. The verbose shapes carry fields that Eratosthenes's classification logic depends on (Scope, Urgency, Related, Confidence, Evidence) — sending the terse form would silently fail downstream classification. Field shape contract is enforced at the type level in `types/t09-protocols.ts` (framework-research) and must match across both copies.
- **Double-routing warning is explicit** because this is the most common dual-hub mistake: agents send work-style status to the knowledge hub or submit patterns to the work hub.
- **[SUBMITTED] tag** prevents re-submission loops across sessions — the scratchpad survives, so without the tag an agent might re-send the same pattern on next wake.
- **The "What goes to Eratosthenes vs. team-lead" table is co-located in `prompts/eratosthenes.md` by design.** The same content lives in two places — common-prompt (which all 6 specialists read at startup) and Eratosthenes's prompt (which is loaded once into his system context and stays there). That's intentional reinforcement, not duplication: specialists never read Eratosthenes's prompt, and Eratosthenes won't re-read common-prompt every message. If the examples ever update, both copies must update together. Do NOT consolidate this on DRY grounds — both copies are load-bearing in different ways.

(*FR:Brunel*)
