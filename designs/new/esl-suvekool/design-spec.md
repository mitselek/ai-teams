# esl-suvekool — Design Spec

## Why this team exists

Mihkel Putrinš is on the ESL board (2025/2026 term). The Suvekool 2026 lead, Liisa Rahusoo, has announced she's leaving the board in January 2027 (possibly extended to April 2027 volikogu). Mihkel privately offered her on 2026-04-23: *"spetsialiseerume kasvõi suvekoolile, aga see on vähemalt teiste laualt maas."* This team is the operational arm of that offer — it channels Mihkel's gap-filler capacity through specialist agents (Estonian drafting, procurement, musicology) so Liisa can load-shed without the event suffering, and so the next Suvekool lead inherits readable artifacts rather than tribal knowledge.

The concert is locked: Zelenka *Magnificat in C* + Hasse *Miserere in c-moll* + Vivaldi *Gloria in D* on 16 August 2026 in Haapsalu Toomkirik. The team's job is everything around that.

## Architecture (Option C, 4 characters)

| Character | Role | Primary deliverable | First task |
|---|---|---|---|
| **Tobias / Tobi** | Team lead | T-counter timeline (`docs/timeline.md`) | Bootstrap timeline from canonical plan |
| **Koidula / Lyyd** | Scribe | Estonian drafts; stakeholders map (`docs/stakeholders.md`) | Build stakeholder map from Brilliant |
| **Saar** | Logistician | Procurement → vendors → on-site | Carus-Verlag tellimus (Liisa-assigned to Mihkel 2026-04-24) |
| **Tampere / Tamp** | Musicologist | Singer-prep, kavaleht, listening guides | Singer-prep packets for the three works |

Architecture rationale:

- **TL owns substantive work** (timeline) — avoids the "router-only TL" anti-pattern. Aen flagged this risk; Tobi's role definition keeps timeline as primary deliverable, integration as wrapper.
- **Scope (b) explicitly excluded.** Audio rendering / S/A/T/B file production is owned by Õppekoordinaator (a human role). This team picked up scopes (a)/(c)/(d)/(e)/(f) only.
- **No dev/test pipeline.** This team ships text and coordination, not software. The `tdd-pipeline.md` artifact present in development teams is intentionally omitted.

## Mission framing — locked decision

PO confirmed: "load-shed Liisa via Mihkel as liaison, succession-readiness baked in" — NOT "help Mihkel organise." This is structurally different from the simpler framing because it forces every artifact to be readable by someone who is neither Liisa nor Mihkel.

Implementation:
- Tobi's prompt makes succession framing first-class.
- Every doc artifact lives in `docs/` (team-shared) rather than agent-local memory.
- T+1n debrief is named *succession brief*, not retrospective.

## Naming convention

Estonian musical figures: **Tobias / Koidula / Saar / Tampere**. Rationale:

- Working language with PO is Estonian; foreign-name conventions (Baroque-contemporaries, Hellenistic muses, mixed pantheon) read as cosplay.
- Choir-music domain match strengthens identity but is secondary to language match.
- Iconic figures (Tormis, Kreek) deliberately avoided — too reverential, overpromise.
- All four figures are recognizable cultural anchors without being performative.

## Workdir & runtime

- **Code workdir:** `~/Documents/github/ESL/Haapsalu-Suvekool/teams/esl-suvekool/` (joining the existing `mitselek/Haapsalu-Suvekool` git repo, which already contains the Bach research toolkit).
- **Runtime workdir:** `~/.claude/teams/esl-suvekool/`.
- **Cross-dir read:** `../Haapsalu 2026/2026 plaan.md` — canonical plan lives in a sibling directory (the spaced-path one).

The team SHARES a repo with the existing toolkit but does NOT own it. The toolkit is methodology consult only; modifications belong to PO.

## Persistence model

- **Persistent roster, episodic sessions.** Roster lives 4 months (May–Aug 2026 + T+1n debrief). Sessions are spawned ~1–3x/week, not daily.
- This is a *long-running but low-volume* team. Different shape from the framework-research daily-cadence team.

## Coordination boundaries (the seams)

The two riskiest handoffs:

1. **Tampere → Koidula for kavaleht.** Tampere ships English research notes; Koidula ships Estonian audience prose. Confirmed in both prompts as a `[CONTRACT]` requirement at start of each kavaleht cycle.
2. **Saar → Tampere for music-procurement edge cases** (e.g., bassoon parts gap, Hasse rental form fields). Tampere clarifies musicological constraints; Saar makes procurement decisions. Asymmetric — info flows from Tampere to Saar, not the other way.

A third potential seam (Koidula ↔ Saar for vendor mail in Estonian) is documented in both prompts but lower-risk: Saar drafts substance, Koidula polishes Estonian phrasing.

## Toolkit relationship

The hosting repo `Haapsalu-Suvekool` contains a Bach research toolkit (Gemini-based repertoire-selection scripts). The toolkit's primary task — *help us pick what to perform* — has zero remaining 2026 application (Lodewijk picked the program, ordering is live). Tampere may consult the toolkit's active prompt as a methodology reference (clarification protocol, [VERIFY] discipline, validation rules) but builds parallel deliverables, not extensions.

## Out-of-scope

- Touching `../F001-youtube-mcp-server/` (separate side-project).
- Touching files containing API keys (`../README.md`, `../docs/BACH-TOOLS-GUIDE.md` — PO is rotating directly).
- Audio rendering / S/A/T/B helifailid (owned by Õppekoordinaator, a human role).
- Sending mail to anyone outside the team (PO sends, always).
- 2027+ planning (out-of-scope unless next-year coordinator is hired into this team).

## Open items at design time

- **Tampere's first kavaleht-cycle contract with Koidula** — to be confirmed in scratchpads at first session, not pre-baked.
- **Vendor list completeness** — Saar will surface gaps as the procurement work proceeds. Initial focus: Carus-Verlag (English/German). Local catering, organist (Ene Salumäe), portatiivorel source (Lodewijk researching) come later.

(*FR:Celes*)
