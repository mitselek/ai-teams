# esl-legal -- Design Spec

## Why this team exists

ESL is involved in an active EE/EU copyright dispute with Sven Peterson (SP Muusikaprojekt OÜ) over alleged unauthorized sharing of three Veljo Tormis works in the Lihula laulupäev 2026 shared Drive folder. The dispute escalated 2026-05-12 when Kaie Tanner (Eesti Kooriühing tegevjuht -- ESL's umbrella body) intervened taking SP's legal side categorically, naming Mihkel's personal initiative ¡lusa Noodi Instituut (¡NI) directly. PO is holding-silent on the Peterson/Kaie Gmail thread while a defensive legal scan establishes ESL's (and PO's personal) legal footing.

The brief at `~/Documents/ESL-research/peterson-sp-muusika-2026-05/2026-05-13-legal-scan-brief.md` (compiled by Tobi, team-lead of `esl-suvekool` operational team) scopes the first deliverable: a defensive memorandum (~10–20 p English markdown, verbatim Estonian quotes) covering 7 legal questions (Q1–Q7), informing a future EE-licensed jurist conversation. Lihula laulupäev is 2026-05-23.

**But the team's identity is not the Peterson case.** Per PO: *"I see this team as long-living support unit and Peterson is just the case nr.1."* This team is ESL's standing legal-affairs research support unit -- domain-specific (EE+EU copyright + adjacent Estonian regulations), case-driven, dormant between cases, persistent roster carrying accumulated wiki across sessions.

## Mission framing -- locked decision

**ESL legal-affairs research support.** Peterson is the first worked example; the team's identity is the support function. Every artifact is designed to inform a future EE-licensed jurist conversation -- never to substitute for one. Hard constraint: AI-generated analysis ≠ legal advice; every deliverable carries that disclaimer.

## Archetype

**Long-lived per-domain research support unit.** Distinct from existing archetypes:

- **Operational team** (esl-suvekool): event-driven, persistent low-volume around one event, drafts-for-PO-to-send.
- **Methodology research team** (FR, apex-research): ongoing build, no case structure.
- **Per-domain support unit** (esl-legal): case-driven activation, domain-specific knowledge accumulation across cases, dormant between cases, persistent roster.

Promotion-to-wiki trigger: n=2 instance of this archetype from a different domain.

## Architecture (Option B confirmed by PO, 6 characters)

| Character | Role | Primary deliverable | First-case (Peterson) responsibility |
|---|---|---|---|
| **Papinianus / Papi** | Team lead | Case coordination, timeline, delegation | Q1–Q7 scan orchestration, T-counter to Lihula |
| **Paulus** | EE-jurist | Q1, Q3-EE, Q4, Q5, Q6, Q7 analyses (5/7 questions) | Hot path; Editor cross-reads T-7/T-5/T-3 |
| **Ulpianus** | EU/CJEU-jurist | Q2, Q3-EU, cross-jurisdictional checks (1.5/7 + reviews) | InfoSoc + DSM + CJEU jurisprudence; Q5/Q7 EU framing |
| **Modestinus** | Editor | `memo.md`, risk matrix, jurist-questions, bibliography | Synthesizes Paulus + Ulpianus; addresses every `[ADVERSARY-FLAG]` before T-2 |
| **Gaius** | Librarian + Wiki Curator | Case corpus + cross-case wiki | Gmail thread ingestion, verbatim-quote register, Brilliant snapshots, source index. Long-term: institutional memory across cases. |
| **Cicero** | Adversary (independent reviewer) | `adversary-flags.md` -- running ledger | Argues Peterson + Kaie's strongest case; flags weak `settled` claims |

### Architecture rationale

- **TL owns substantive work** (case coordination + timeline). Avoids router-only Cathedral-lite bottleneck.
- **EE/EU asymmetric workload** (5/7 vs 1.5/7) is correct -- most questions are EE-statute-rooted; EU is the framework layer.
- **Editor merges F+G** per PO lock -- memo assembly + risk matrix + jurist-question recommendations + bibliography normalization in one role.
- **Adversary as independent reviewer with veto-weight** (not normal TL-routed specialist). Cicero writes `[ADVERSARY-FLAG]` annotations against any claim with `settled` confidence label; Editor MUST address each flag before T-2 (either fold the critique or document why the claim survives). Asymmetric: adversary doesn't have to be agreed-with, but the flag has to be addressed in writing.
- **Librarian elevated to wiki curator.** Gaius is not a service role -- he is the team's institutional memory. Cross-case knowledge accumulation IS the long-term value differentiator. Wiki sovereignty discipline (sole writer of `wiki/*`) borrowed lite from Cal pattern.

### Curator-role question (PO discretionary, resolved)

PO returned the call: separate Cal-style curator role, or Gaius owns wiki? **Decision: Gaius owns wiki at 6 chars.** Reasoning:

- Cathedral-lite gate: sole-writer wiki sovereignty becomes structurally warranted at ~8+ specialists. At 6 chars with case-driven activation, write-volume is low; one Gaius manages discipline without protocol-mediation overhead.
- Case-corpus and cross-case wiki share the same source-of-truth axis. Splitting the single intellectual asset across two roles creates handoff drift exactly where coherence matters most.
- **Growth path**: if a second case lands while Peterson is still active, OR wiki write-volume crosses an adapted Phase-2 gate (15 statute-cards + 10 cross-case queries, Cal's heuristic), THEN propose a Cal-style curator split.

## Naming convention

**Roman jurists from the Digest's Law of Citations (426 CE)** -- Papinianus, Paulus, Ulpianus, Modestinus, Gaius -- plus **Cicero** as adversary (the master orator who literally invented "in utramque partem"). Domain-perfect: EE law is civil-law tradition rooted in Roman jurisprudence; the very confidence-labeling "settled/probable/open" is Romanist in spirit. Career jurists, not one-trial advocates -- fits the long-lived per-domain archetype.

Naming-convention selection criterion: when the team's domain has a directly-named tradition the team operates within, prefer that tradition over language-tiebreak naming. Inverse of the esl-suvekool rule (language-tiebreak when domain match is incidental).

## Workdir & runtime

- **Repo:** `mitselek/esl-legal` (private, https://github.com/mitselek/esl-legal)
- **Local workdir:** `~/Documents/github/ESL/legal/` (does not yet exist; PO clones)
- **Runtime team:** `~/.claude/teams/esl-legal/`
- **Cross-team READ-ONLY context:** `~/Documents/github/ESL/Haapsalu-Suvekool/` (esl-suvekool team workdir -- selected scratchpads + stakeholders.md for context; never modify)

## Persistence model

- **Persistent roster, episodic sessions, case-driven activation.** Roster lives across cases. Sessions spawned when a case is active (~1–3x/week during Peterson window 2026-05-13 → 2026-05-23); dormant between cases.
- Per-session shutdown = `TeamDelete` on graceful exit (S23-style), NOT team dissolution. Persistent roster between sessions.
- Bootstrap hook `.claude/startup.md` at repo root (S23 pattern; auto-bootstraps fresh sessions).

## Repo layout

```
esl-legal/
├── .claude/
│   └── startup.md                 # Bootstrap hook for fresh Claude sessions
├── README.md                      # PO-facing: what this team is, how to start a session
├── roster.json                    # Team registry
├── common-prompt.md               # Team-wide standards
├── startup.md                     # Per-session checklist (Papi runs at session start)
├── persist-inboxes.sh             # FR Volta pattern -- runtime → repo at session end
├── restore-inboxes.sh             # FR Volta pattern -- repo → runtime at session start
├── restore-filter.jq              # jq filter for shutdown/idle message pruning
├── inboxes/                       # Repo-side inbox persistence (committed to git)
├── prompts/
│   ├── papinianus.md              # TL
│   ├── paulus.md                  # EE-jurist
│   ├── ulpianus.md                # EU/CJEU-jurist
│   ├── modestinus.md              # Editor
│   ├── gaius.md                   # Librarian + Wiki Curator
│   └── cicero.md                  # Adversary (independent reviewer)
├── memory/
│   ├── papinianus.md              # Agent scratchpads
│   ├── paulus.md
│   ├── ulpianus.md
│   ├── modestinus.md
│   ├── gaius.md
│   └── cicero.md
├── cases/
│   └── 2026-05-peterson/          # Case #1
│       ├── README.md              # Case index + status
│       ├── memo.md                # Editor's primary deliverable
│       ├── analyses/              # One file per question
│       │   ├── Q1-uldsus-isiklik-kasutus.md           # Paulus
│       │   ├── Q2-eu-infosoc-dsm.md                   # Ulpianus
│       │   ├── Q3-EE-music-carveouts.md               # Paulus (EE AutÕS side)
│       │   ├── Q3-EU-music-carveouts.md               # Ulpianus (InfoSoc + Directive side)
│       │   ├── Q4-peterson-juridica.md                # Paulus
│       │   ├── Q5-mtu-personal-liability.md           # Paulus (Ulpianus cross-check)
│       │   ├── Q6-ee-procedure.md                     # Paulus
│       │   └── Q7-damages.md                          # Paulus (Ulpianus cross-check)
│       ├── risk-matrix.md         # Editor
│       ├── jurist-questions.md    # Editor
│       ├── bibliography.md        # Editor (final)
│       ├── adversary-flags.md     # Cicero -- running ledger
│       ├── verbatim-quotes.md     # Gaius -- load-bearing Estonian passages
│       ├── sources.md             # Gaius -- source index
│       └── corpus/                # Gaius -- digested source material
│           ├── gmail-thread-19df7c8d.md
│           ├── brilliant-snapshots/
│           └── pdfs/              # Read-only refs to local PDFs
└── wiki/                          # Cross-case institutional memory (Gaius sole writer)
    ├── index.md                   # Cal-style catalog
    ├── statutes/                  # AutÕS §13/§17/§18, MTÜS, VÕS, TsMS cards
    ├── cjeu/                      # CJEU case-cards
    ├── opposing-parties/          # Argument templates (Peterson, Kaie, etc.)
    ├── precedents/                # EE case law
    └── jurists/                   # EE-licensed jurists worth contacting
```

**Q3 file-split rationale:** Q3 (music-score carve-outs) has two distinct substrate layers -- the EE AutÕS §17 doctrine (Paulus's surface) and the EU InfoSoc Art 5(2)(a) Directive carve-out + CJEU jurisprudence (Ulpianus's surface). Single-file write-coordinated would create handoff drift exactly where the cross-jurisdictional analysis must be precise. Two files with parallel structure + Modestinus synthesizing both in the memo Q3 section is the cleaner write boundary.

## Hard constraints (codified in common-prompt.md)

1. **AI ≠ legal advice.** Every deliverable artifact carries the disclaimer block. Memo, analyses, risk-matrix, jurist-questions -- all of them.
2. **Confidence labeling on every claim:** `settled` (citation + EE case law) / `probable` (citation + inference) / `open` (jurist-confirmation-required).
3. **Estonian quote handling -- hard rule.** Load-bearing source passages (Kaie §6.1, Peterson Juridica §6.2, Peterson demand §6.4 -- see brief) MUST stay verbatim in the memo. Back-translating changes the analytical object. Librarian extracts; analyst analyses; Editor preserves verbatim in memo with English gloss bracket immediately after.
4. **Holding-silent rule.** Team produces analysis; PO does NOT engage Peterson/Kaie thread until memo lands AND PO has the jurist-conversation. No agent drafts external mail; no agent sends external mail.
5. **Haapsalu-Suvekool repo cross-team READ-ONLY.** Read selected scratchpads for context; never write.
6. **PO sends. Always.** No agent sends mail or messages to external parties. Drafts route via Papinianus → PO → external (when applicable post-jurist-conversation).
7. **¡NI vs ESL liability split** is load-bearing on Q5. Every claim about personal vs organizational liability must be explicit which entity it covers.

## Coordination boundaries (the seams)

The three riskiest handoffs:

1. **Paulus → Modestinus (EE-jurist → Editor).** Hot path. EE-jurist owns 5/7 questions; if Paulus stalls, memo stalls. Mitigation: Modestinus cross-reads Paulus's drafts at T-7, T-5, T-3 as risk-cheap quality gate. `[CONTRACT]` entries in both scratchpads at case kickoff.
2. **Gaius → Paulus/Ulpianus (Librarian → analysts).** Verbatim-quote register is the single source of truth for the load-bearing Estonian passages. If Paulus reads from Gmail thread directly instead of Gaius's register, quote provenance fragments. Hard rule: analysts cite from `cases/<slug>/verbatim-quotes.md`, never from raw Gmail.
3. **Cicero → Modestinus (Adversary → Editor).** Asymmetric. Cicero writes flags; Modestinus addresses (folds or rebuts in writing) before T-2. Flag-state ledger in `adversary-flags.md` is single source of truth. No flag may be silently ignored.

A fourth seam (Paulus ↔ Ulpianus on cross-jurisdictional Q5/Q7 claims) is lower-risk but documented in both prompts as a `[CROSS-CHECK]` discipline.

## Out-of-scope

- Strategic/tactical reply to Peterson -- PO + esl-suvekool's Tobi work that after this scan delivers.
- Specific advice on whether to settle/pay/refuse -- PO + EE-licensed jurist call.
- ¡NI/Polyphony platform-level legal posture (operating license, terms of service, GDPR/PD compliance) -- separate workstream PO handles independently.
- Suvekool 2026 vendor operations -- separate stream (`esl-suvekool` team).
- Touching `~/Documents/github/ESL/Haapsalu-Suvekool/` files (READ-ONLY context only).

## Open items at design time

- **Case #2 trigger.** If a second case lands while Peterson is still active, OR wiki write-volume crosses Phase-2 gate (15 statute-cards + 10 cross-case queries), propose Cal-style curator split. Note in Gaius's prompt for next-coordinator visibility.
- **GitHub jurist contact list.** `wiki/jurists/` starts empty. Gaius seeds it as research surfaces EE-licensed jurists worth contacting. PO maintains personal relationships separately.

(*FR:Celes*)
