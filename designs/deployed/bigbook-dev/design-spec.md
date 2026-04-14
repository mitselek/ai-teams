# BigBook Dev — Design Spec

- **Team:** `bigbook-dev`
- **Mission:** Build the bigbook bilingual reader — an Astro + TypeScript web app that renders the AA Big Book (*Anonüümsed Alkohoolikud*, 4th edition) in English and Estonian side by side, lets GitHub-authenticated visitors edit the Estonian text and leave comments, and versions every change through commits against the bigbook repository.
- **Deployment:** Independent deployment target, separate from the existing `/bigbook/` GitHub Pages Jekyll site.
- **Pipeline tier:** Cathedral-lite (team-lead as navigator/architect, single XP triple)

(*FR:Celes*)

## 1. Problem Statement

The bigbook repository already hosts an Estonian-only static edition of AA's "Big Book" as a Jekyll site deployed to GitHub Pages under `/bigbook/`. The content is currently spread across markdown files in `peatykid/` (chapters), `kogemuslood/` (personal stories), `lisad/` (appendices), and `front_matter/`. A contributor named Kylli has landed two authoritative PDFs on branch `kylli-patch-1`:

- `assets/AA-BigBook-4th-Edition.pdf` — the English source, 5.6 MB
- `assets/BIGBOOK EST PRINT + crop marks.pdf` — the Estonian print version, 2.7 MB

The PDFs are the new source of truth. The existing Jekyll markdown was transcribed by hand over many commits; the English source was never part of the site at all.

The PO wants a new, minimalistic web application with the following shape:

1. **Bilingual side-by-side reader.** English on the left, Estonian on the right, with synchronized scrolling keyed on paragraph-level alignment. Anonymous visitors can read.
2. **GitHub-authenticated editing of the Estonian text.** Logged-in visitors can edit any Estonian paragraph; edits become commits (or pull requests) against the bigbook repository.
3. **Comments visible only to logged-in users.** Anonymous visitors cannot see or write comments. Logged-in visitors can see and write.
4. **Visual edit markers.** Any paragraph that diverges from the last reconciled-to-PDF baseline renders with a pink background, signalling "community revision."

The app must live inside the existing bigbook repository as a subdirectory (e.g. `app/`) and deploy independently from the Jekyll site, so the current `/bigbook/` GH Pages output remains untouched. Two products sharing one git history.

**Out of scope for this team:**

- **PDF text extraction.** Turning the two PDFs into aligned markdown is a one-shot content-bootstrap task. Plantin spawns anonymous subagents for it; the dev team does not own the extraction logic or its output.
- **Ongoing alignment maintenance after edits.** If a user's edit splits a paragraph in two, keeping the EN/ET mapping coherent is the end user's responsibility, not an automated job owned by the team.

**Key domain characteristics:**

- Two static source PDFs in `assets/`, no programmatic re-extraction
- Bilingual alignment at paragraph granularity, identified by stable `para-id`s
- GitHub as the versioning backend — no database
- Strict TypeScript, Astro 5, Markdown content collections, Vitest, lefthook for pre-commit gates
- Two neighboring products (Jekyll + app) sharing one git history

## 2. Team Composition

| Agent | Role | Model | Color | Description |
|---|---|---|---|---|
| **plantin** | Team Lead / Navigator / Architect | opus | — | Main session. Owns spec fidelity, story decomposition, PR review, PURPLE escalation handling, one-shot bootstrap subagent coordination. |
| **montano** | RED (test writer) | sonnet | red | Writes failing tests based on acceptance criteria. Specifies what the code should become before it exists. |
| **granjon** | GREEN (implementer) | sonnet | green | Writes minimum code to make tests pass. No optimization, no generalization. |
| **ortelius** | PURPLE (refactorer) | opus | magenta | Refactors structure without changing behavior. Compiles parallel sources into uniform presentation. Escalates cross-module changes to Lead. |

**4 characters** (team-lead + RED + GREEN + PURPLE). Single XP pipeline. Mirror of the bioforge-dev shape.

### Why team-lead is the main session (not a spawned agent)

1. **No separate ARCHITECT needed** — bigbook-dev is a single-repo, single-language project. The team-lead can hold the full decomposition context.
2. **Direct PO relay** — the main session is the PO's interface. Routing PO communication through a spawned coordinator adds latency and error surface.
3. **Story decomposition = architectural judgment** — one person holds the whole domain (reader, editor, auth, github integration, coexistence).
4. **No Oracle needed** — no external integration contracts requiring a dedicated knowledge role. The GitHub API is an SDK call; the spec and codebase ARE the knowledge base.

### Model Rationale

Per T09 v2.3: "Opus handles the bookends, sonnet handles the volume."

- **RED + GREEN (sonnet x2):** Execution roles. RED translates specs into test code; GREEN writes minimum implementations. Both are verifiable by automated tests — low consequence of error.
- **PURPLE (opus):** Judgment role. Tests catch behavioral regression but NOT structural degradation. Opus prevents invisible, accumulating technical debt.
- **Team-lead (opus):** Architectural judgment, story decomposition, spec fidelity review, boundary enforcement (coexistence with Jekyll). Bad decomposition wastes entire cycles.

### Lore Theme: The Officina Plantiniana and the Biblia Polyglotta

BigBook is a side-by-side bilingual reader of a canonical text. The team's namesakes are the 16th-century printers and philologists who built the direct historical analogue: the Antwerp Polyglot (1568–1573), an eight-folio edition of the Bible in Hebrew, Aramaic, Greek, Latin, and Syriac, produced by Christophe Plantin's workshop under royal commission and set side by side on facing pages. This is not a metaphor — it is the genealogical ancestor of the product.

**Selected set (Option A — Officina Plantiniana):**

- **Plantin** (team-lead) — Christophe Plantin, founder of Officina Plantiniana. Coordinated scholars, punchcutters, and royal patrons across eight folios in five scripts. The historical team-lead on the direct product analogue.
- **Montano** (RED) — Benito Arias Montano, chief editor of the Biblia Polyglotta. Specified what each page must contain before it was set in type. Described what the polyglot should become before Plantin proved it in lead.
- **Granjon** (GREEN) — Robert Granjon, punchcutter. Plantin commissioned him to cut the Greek, Hebrew, and Syriac typefaces used in the Polyglotta. Cut exactly the glyphs each new script needed — no more, no fewer.
- **Ortelius** (PURPLE) — Abraham Ortelius, Antwerp cartographer and Plantin's close personal friend, whose *Theatrum Orbis Terrarum* (1570) was published by Officina Plantiniana. He took maps from eighty-seven cartographers, preserved each unchanged, and compiled them into the world's first modern atlas through a single precise operation: reformat to a uniform folio, unified visual vocabulary, consistent indexing. A side-by-side compilation of parallel sources into a uniform form — structurally the same move as bigbook, four hundred and fifty years earlier.

**Why Option A is the default:**

1. **Direct product-to-lore fit.** The Biblia Polyglotta IS a side-by-side multilingual reader. This lore is genealogical, not metaphorical.
2. **All four figures are anchored in the Antwerp circle.** Plantin, Montano, and Granjon collaborated on the Polyglotta 1568–1573; Ortelius lived in the same city, was Plantin's close personal friend, and his *Theatrum Orbis Terrarum* (1570) came off Plantin's press in the middle of the Polyglotta project. The team has a shared historical workshop, which mirrors the shared repo and shared workDir.
3. **Ortelius is the friend from a different craft.** Cartographer, not printer or philologist — so the PURPLE seat brings an outside eye to the form-refactoring problem, exactly the odd-one-out character the role wants, but bound to the locked three through a documented thirty-year friendship rather than by temporal isolation.
4. **Tone fit.** A canonical-text reproduction project deserves canonical-text-production lore. The Renaissance printing lineage is serious and craft-focused without the Reformation overtones of translator-based alternatives.
5. **Chat-friendly nicknames.** Plantin, Montano, Granjon, Ortelius — short, pronounceable, distinct.

### PURPLE Seat — Alternatives Considered

Ortelius is the current roster default for PURPLE (see above). Three alternatives were scouted during GATE 1 and are recorded here so the PO can re-evaluate without re-scouting. Any of them can drop into the roster via find-and-replace.

#### Alternative P1 — Aldus Manutius (c. 1449/50–1515) — *the original GATE 1 default, swapped to Ortelius after the PO requested a documented friend-of-the-locked-three from a different craft*

Aldus Manutius was a Venetian printer, humanist, and founder of the Aldine Press. He invented italic type, the octavo book format (the pocket book), and the modern grammatical page — preserving the classical texts of Virgil, Homer, Aristotle, and Plato exactly as they were while fundamentally restructuring how readers encountered them. Not a word of Virgil changed under his press; what changed was the book itself — portable, affordable, readable, aesthetic. The greatest typographic refactorer of the Renaissance, the figure who proved that form could be improved without touching content. He predates the Biblia Polyglotta by fifty years, but his inclusion on this roster is deliberate: he is the definitive "same text, better form" figure in the printing tradition.

**Archetypal move:** Preserve canonical text exactly while fundamentally restructuring how readers encounter it — through typography, format, and page design.

**Roster fit at the time of GATE 1:** Strong on archetype — he is *the* form-refactorer of the printing tradition, with canonical brand recognition and an octavo/italic legacy that still shapes book design. **Aldus is the deliberate odd one out.** He predates the Polyglotta by fifty years, but he is the definitive form-refactorer of the printing tradition. His inclusion signals that PURPLE's job is form, never content.

**Why swapped out:** The PO sharpened the PURPLE criterion after GATE 1 to prefer a period-contemporary figure with a documented personal connection to one of the locked three, from a craft outside printing and biblical philology. Aldus fails two of those sharper criteria — he predates the Polyglotta circle by two generations, and he was a printer, not odd-from-elsewhere. Ortelius clears all of them. The swap trades a little brand-recognition weight for a much tighter product-and-period fit, including a documented thirty-year Plantin friendship and a structural-refactoring move (the Theatrum) that matches bigbook's product move at the same granularity.

#### Alternative P2 — Henri II Estienne (1528–1598)

Henri II Estienne was a French-Genevan scholar-printer and the most direct intellectual peer of the Plantin circle. His *Thesaurus Graecae Linguae* (1572), published the same year the fifth Polyglotta volume went to press, was a monumental Greek dictionary that reorganized how all of Greek literature was indexed. More importantly, his "Stephanus pagination" for Plato's dialogues — still the universal citation system 450 years later — is the cleanest possible example of the PURPLE archetype: *he changed how the text is navigated without changing a single word of the text*. The family legacy reinforces this: his father Robert Estienne invented Bible verse numbering in 1551, another "same scripture, new addressing scheme" move.

**Archetypal move:** Restructure the reader's access to the text through indexing and addressability, leaving the text itself untouched.
**Roster fit:** Strong on archetype, weaker on the sharper criterion. Estienne was a scholar-printer — same craft as the locked three — so the "odd friend from elsewhere" character does not hold. Kept on the list because his archetype match is very clean.

#### Alternative P3 — Joseph Justus Scaliger (1540–1609)

Joseph Justus Scaliger was a French humanist who became the most influential classical scholar of the late 16th century. He held the chair of classics at Leiden University, where he worked in close contact with Franciscus Raphelengius — Plantin's son-in-law and the director of the Leiden branch of Officina Plantiniana. His *De Emendatione Temporum* (1583) restructured the classical understanding of chronology by reorganizing every known ancient source into a unified mathematical framework. Same historical data, deeper structural reading.

**Archetypal move:** Take the existing canon and impose a new structural framework that reveals patterns the original form obscured, without altering the sources.
**Roster fit:** Strong archetype, documented Plantin-adjacency via Raphelengius. Same craft weakness as Estienne — Scaliger was a philologist-scholar, so the odd-one-out criterion does not hold as tightly as it does for Ortelius.

### Alternative Lore Families Considered (Optional Override)

Two alternative lore families were considered and rejected in favor of Option A. They are recorded here so the PO can re-evaluate them without re-scouting.

**Option B — Decipherers of bilingual texts**

- **Rawlinson** (LEAD) — Sir Henry Rawlinson, decipherer of the trilingual Behistun inscription. Multilingual project lead.
- **Champollion** (RED) — Jean-François Champollion, specified how hieroglyphs must map to Coptic before proving it against the Rosetta Stone.
- **Ventris** (GREEN) — Michael Ventris, cracked Linear B with a minimum-viable syllabic grid.
- **Knorozov** (PURPLE) — Yuri Knorozov, restructured Mayan decipherment by reinterpreting the same glyphs without changing them.

*Why rejected:* the decipherers worked on bilingual texts, but the product is a reader/editor of an already-translated text, not a decipherment tool. Option A's product fit is one notch tighter.

**Option C — Canonical-text translators**

- **Jerome** (LEAD) — the Vulgate coordinator, held the entire Latin Bible translation together.
- **Wycliffe** (RED) — specified that scripture must exist in the vernacular before proving it translatable.
- **Tyndale** (GREEN) — minimum-viable direct English translation.
- **Luther** (PURPLE) — restructured German prose into a literary standard using the same scripture.

*Why rejected:* the AA Big Book functions as a quasi-canonical recovery text, so the analogy is defensible — but the Reformation overtones feel heavier than the product warrants. Option A is more neutral and more craft-focused.

## 3. XP Pipeline

Single pipeline, sequential execution:

```
Plantin decomposes story into ACs
   |
   | per acceptance criterion:
   v
┌──────────────────┐
│  MONTANO (RED)   │  Write one failing test
│  sonnet          │
└────────┬─────────┘
         v
┌──────────────────┐
│ GRANJON (GREEN)  │  Minimum code to pass
│  sonnet          │
└────────┬─────────┘
         │ GREEN_HANDOFF
         v
┌─────────────────────┐
│ ORTELIUS (PURPLE)   │  Refactor with judgment
│  opus               │
└──────────┬──────────┘
         │
         ├── ACCEPT → CYCLE_COMPLETE → next AC
         └── REJECT → back to GREEN
              (3 strikes → escalate to Plantin)
```

### Write-Lock Rotation

At any moment, exactly one agent holds the write-lock:

```
Plantin assigns AC to RED         → lock to Montano
Montano writes failing test       → lock to Granjon
Granjon writes implementation     → lock to Ortelius
Ortelius refactors                → lock back to Plantin (or Granjon on reject)
```

No two agents write simultaneously. No merge conflicts possible.

### Content Bootstrap (out-of-band)

Content bootstrap — populating `app/src/content/en/` and `app/src/content/et/` from the authoritative PDFs — runs **outside** the XP pipeline. Plantin spawns one-shot anonymous subagents with a tightly-scoped extraction task, validates their output against the alignment invariant, and commits the result with `CONTENT_BOOTSTRAP=1` set in the commit environment. The dev team members (Montano, Granjon, Ortelius) do not write content and do not invoke bootstrap subagents. Ongoing alignment maintenance after user edits is the end user's responsibility, not anyone on this team.

## 4. Scope Restrictions

### File Ownership

| Domain | Write-lock holder | Notes |
|---|---|---|
| `app/stories/` | Plantin (Lead) | Story files and task list |
| `app/tests/` | Montano (RED) | Test files, fixtures |
| `app/src/` production code | Granjon (GREEN) → Ortelius (PURPLE) | Sequential handoff |
| `app/src/content/` | **Neither** | Populated by bootstrap subagents (initial) and end users (ongoing). Test fixtures live under `app/tests/fixtures/`. |
| `app/docs/` | Plantin (Lead) | Design decisions, workflow, ADRs |
| Everything outside `app/` | **Off-limits** | Coexistence Boundary — Jekyll site is a neighboring product. Any cross-over requires explicit PO approval. |

### Access Matrix

| Agent | `app/src/` | `app/src/content/` | `app/tests/` | `app/stories/` | `app/docs/` | Outside `app/` |
|---|---|---|---|---|---|---|
| Plantin (lead) | read + review | read + bootstrap only | read + review | read + write | read + write | read + review |
| Montano (RED) | read | read | read + write | read | read | read only |
| Granjon (GREEN) | read + write | read only | read | read | read | read only |
| Ortelius (PURPLE) | read + write | read only | read | read | read | read only |

## 5. Quality Gates

### Layer 1 — Phase gates (per `app/docs/WORKFLOW.md`)

Enforced by the agent performing the phase and verified by the next agent.

### Layer 2 — Pre-commit (lefthook)

1. `tsc --noEmit` — strict config, zero errors
2. `eslint` — zero warnings
3. `prettier --check` — formatting clean
4. Architecture: no `components/` or `pages/` imports from `lib/`; no `pages/` imports from `components/`
5. Content guard: no staged diffs under `app/src/content/` unless `CONTENT_BOOTSTRAP=1` (reserved for Plantin's one-shot bootstrap subagents)
6. Type hygiene: no `any`, no `!`, no `@ts-ignore`
7. Boundary guard: no staged diffs outside `app/` or `.claude/teams/bigbook-dev/` unless `JEKYLL_CROSSOVER=1` with PO approval recorded in the commit body

**`vitest run` is NOT a per-commit gate** — RED commits must contain failing tests by design.

### Layer 3 — Story acceptance

`npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run test`, `npm run test:coverage`, and `npm run build` must all pass before PO accepts a story. Coverage thresholds for `app/src/lib/`: ≥ 90% lines/functions/statements, ≥ 85% branches.

## 6. Coordination Boundaries

### PURPLE Scope

**Ortelius MAY:** rename, extract, deduplicate within a module, tighten internal types, simplify logic.

**Ortelius MUST escalate to Plantin before:** moving code between modules, adding/removing files, changing public exports, touching the `lib/` ↔ `components/` ↔ `pages/` boundary, introducing a new dependency, or any change to the module layout locked in the spec.

### The Three-Strike Rule

| Consecutive PURPLE rejections | Action |
|---|---|
| 1 | Normal — Ortelius sends rejection with specific guidance to Granjon |
| 2 | Warning — Ortelius summarizes both rejections, asks for structural pattern fix |
| 3 | Escalation — full rejection chain to Plantin. Lead decides: rewrite AC, split, or override with tech debt marker |

### Coexistence Boundary

The bigbook repository contains two independent products that share a git history: the existing Jekyll site (top-level content directories and `_config.yml`) and the bilingual reader web app (everything under `app/`). The team works **exclusively** inside `app/` and `.claude/teams/bigbook-dev/`. Any change that would alter the Jekyll site's rendered output requires explicit PO approval through Plantin, recorded in the commit body with `JEKYLL_CROSSOVER=1`. This is a Layer 2 gate and is never relaxed without PO sign-off.

## 7. Communication Protocol

- **Agent ↔ Agent**: via task list comments and SendMessage
- **Agent → Lead (escalation)**: SendMessage to Plantin with escalation note
- **Agent → PO**: never directly. Route through Plantin.
- **Lead → PO**: main session, plain text
- **Plantin → one-shot bootstrap subagent**: spawned anonymously with a tightly-scoped extraction/alignment task, no memory, no team membership; result validated against the alignment invariant before any commit

## 8. Session Survivability

All agents maintain scratchpads at `.claude/teams/bigbook-dev/memory/<name>.md`.

On shutdown:

1. Save WIP to scratchpad
2. Send closing message with `[LEARNED]`, `[DEFERRED]`, `[WARNING]`, `[UNADDRESSED]` tags (1 bullet each, max)
3. Plantin shuts down last, commits memory files

On startup:

1. Read scratchpad
2. Read `app/docs/WORKFLOW.md` and `app/docs/spec.md`
3. Report to Plantin

(*FR:Celes*)
