# Team-Lead Scratchpad (*FR:Aen*)

> ## ⚠ THIS FILE IS A CLAIM ABOUT SOURCES. IT IS NEVER A SOURCE.
>
> Written as one agent's aide-memoire; **read by every agent at startup as an authoritative record.** Nothing in it marks that change of status, which is why it is added here explicitly.
>
> **Before citing anything below as fact -- especially in another agent's artifact -- open the thing it describes.** Entries here can be **stale**, **incomplete-at-authoring**, or **pessimistic**; **line-number and file-path references have been wrong more often than right.** S71 instance: my 16:21 checkpoint carried a "recreate reverts to 2.1.217" warning that was already false. S72 instance: Cal's roster-drift claim I relayed was falsified by his own measurement an hour later (entry now `disputed`).

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S72 (2026-09-03, ~13:00-15:40) CLOSED clean on PO request to restart for the MS365 connector. Same CLI session as S71 (`session-1e8d8ae9`, pid 26376, Fable 5.1, CLI 2.1.258). Cell = Celes + Brunel + Hopper (as `hopper-2`, name clutter from S71's dead entry), all `model: "opus"`.
- **S72 DELIVERED:** (1) paunvere prompt health check (Celes, `docs/paunvere-prompt-health-2026-09-03.md`: healthy-with-fixes, 9 fix-now / 7 watch). (2) paunvere Tier R site visit + 3 liveness reads (Hopper). (3) **Amendment A1 transited to the live paunvere TEAM_ROOT** (PO's `929ba8a` + Celes's `AMENDMENTS.md` + startup.md stamp/read-order/version-line; committed to the package as `8424088`; applied 14:34, verified byte-exact, left UNCOMMITTED for Minot). (4) **PR #115 merged** `2fde59b`: entrypoint `dir_digest` `.git` prune. (5) Field guide artifact for Rein Kadastik https://claude.ai/code/artifact/3d784373-5879-4c66-85ef-37e044841538 (PO sent link via Teams; artifact must be SHARED from its menu or it is private).
- **apex-research:** on 2.1.258 since S71; source-data pull 403 = Eesti-Raudtee org enforces SAML SSO, container token `gho_2xo5…` not SSO-authorized (PO's local `gho_BDp3…` now is). PO's item.
- **PO DIRECTIVE, durable:** cut intra-team chatter (in every spawn brief).
- **Carry-forward:** see NEXT-SESSION BOOT.

---

### S73 CHECKPOINT (2026-09-04, 10:05, live)

- **Session:** `session-8bce3d41`, pid 14144, CLI **2.1.260** (startup.md stamp says 2.1.258 -- update at S4). Startup ran clean; courier restart pre-flight named my slug. Cell: Callimachus + Herald (both `opus`).
- **DELIVERED:** truth loop (apex S78 artifact + playbook `ec0fc76b`) filed in wiki by Cal, commit `487285c`, 235->239 entries. My two brief errors caught by Cal: MSYS argv path-conversion made `git cat-file origin/main:.claude/...` a false "missing"; and I cited apex's wiki entry as ours. Use `MSYS_NO_PATHCONV=1`.
- **[DECISION, PO] Codename "Lelle"** = gen-3 EVR-island comms method + its hub instance (over Tapa, Koidula). Ledger **#116**. Seed = Discussion **#107** (hubSignal workflow primitive, 2026-08-13) -- had ZERO comments/ZERO repo mentions until today; Discussion #111 (Passepartout->Volta, gauge-gated retirement) same fate. Both filed while #108 held the lane; no owner, no issue. Pointer comment left on #107.
- **[WIP]** Herald drafting `designs/new/lelle/spec.md` v0.1 (contract, #107's 4 questions, SemVer classification, island rule, fleet inventory via `registry`, truth-loop consumer check, PO gate list). Cal filing Lelle decision entry (Protocol A sent 09:58).
- **Comms clumsiness (PO's standing complaint):** today's specimens all Windows-substrate -- contested-inbox inject (50 rounds), hub replayed 3 stale June messages (ledger had 1 entry), Bash cwd drift broke the restart wrapper once, MSYS mangling. Not wiki-grade per policy. Lelle is the structural answer the PO wants.
- **Next after Herald reports:** route Protocol A candidates to Cal; post gate list on #116; PO decides gates; then Brunel/Hopper/Volta implementation brief. #111 still unowned -- offer Volta to PO.

### S72 WRAP (2026-09-03)

- **paunvere on site (Hopper, Tier R):** healthy, 3 of 6 agents ever spawned, memory accumulating well, zero NEED/BLOCKED. Container ran PRE-amendment text: PO's `929ba8a` (08-31 13:22) postdated image build (11:07) + seed (11:14) by 2 h; nothing failed in transit. Consequence on disk: Minot spent 09-03 morning enforcing the withdrawn Ruth gate, refused Joosep 3x, refused the PO's reply as probable social engineering (footer contradicted the claim), emailed Ruth, cleared 4 tests narrowly. Correct against the text it held. Joosep took broad `gh auth login` instead of the narrow PAT; Minot ran the negative control and logged his decision. Joosep uses the container as a WebStorm workbench; native claude 2.1.259 autoupdating on the `joosep_home` VOLUME (opposite of apex).
- **Paunvere shutdown observed 13:58-13:59:** commit `834d55e` BEFORE process exit; Minot rewrote its stale header itself; graceful exit reaped session json, socket, team dir. Header surfaced: elron rail cleared but target served the APEX app (Minot stopped); direct-to-main push on HES repo on Joosep's word (logged as override); **Minot asked the PO where a paunvere remote should live (recommends private), unanswered**; ~15 core dumps up to 321 MB, deletion offered.
- **Transit mechanics:** rebuild does NOT deliver (Step 9c re-seed unreachable once team memory lives in the seeded dir); live path is the only channel; sourced from RC checkout (Windows worktree line endings are accidental); staged in `/tmp`, md5-gated PRE/POST, `cat >` in place, uncommitted. Hopper aborted once on two instrument defects in Brunel's gates (tmux socket outlives server; `pgrep -f` matches its wrapper), Brunel re-issued. **Apply command was DENIED by the permission classifier in auto mode; PO switched to manual and authorized me directly; I ran Hopper's verbatim command once.** Recorded in ops-log as team-lead's execution.
- **Brunel's recreate analysis:** joosep recreate does NOT regress the CLI (volume, not overlay), destroys process state only + anything installed outside mounts (`docker diff` reveals it); would be the container's FIRST-ever restart. Not sanctioned; not needed.
- **Wiki (Cal, S71 tail, resumed post-termination):** 235 entries; `roster-drift…` `disputed` (config.json `model` field is NOT evidence); new `an-attribute-that-correlates-is-not-one-that-determines`; stage-2 gate has two blind axes (reads as truth claim; version-blind) -> Protocol C with two halves: referent per confirmation (cheap, now) + rename (235-card migration, later). Pronoun sweep queued: they/them default, 140 files / 771 occurrences, convention in `wiki/CLAUDE.md`.
- **My errors:** relayed sanction with the D8 command but not the package (S71 lesson, repeated in shape at 14:20 when Brunel's Tier D text went to me not Hopper); told Hopper "D2-D7" while D7 must run last; my scratchpad checkpoint carried a falsified warning; drafted a Gmail draft after the PO had asked for MS365 (rejected, correctly).
- **[LEARNED, lifecycle]** A terminated agent is RESUMED by any SendMessage to it (S71 close: Cal+Brunel ran 40 min post-termination). `teammate_terminated` is not final. Shutdown requests must carry "send no further messages"; S4 persist follows the LAST termination. Also: a dead member entry in config.json makes the next spawn `name-2` (hopper -> hopper-2 today).

### NEXT-SESSION BOOT (re-orient instructions for S73)

1. Read `startup.md` first (13.7 KB, cat-able): Step 0 Host check -> 0.5 Model -> 1 Sync -> 2' Discover -> 3 Restore -> 3.5 Courier -> 4 Spawn (wait for PO). Pass the Claude session pid / discovered slug on every resolver, script and courier call. Courier was STOPPED at S4.
2. **Pull `mitselek-ai-teams`.** RC checkout `/home/dev/github/mitselek-ai-teams` is at `2fde59b` (Hopper pulled it 14:24). `/home/dev/joosep` deploy copy is a STAGED COPY at the pre-#115 entrypoint; the next rebuild must re-stage `entrypoint.sh` first.
3. **Don't pre-spawn.** Ask the PO. Every brief carries the chatter rule AND, for shutdown requests, "send no further messages to anyone".
4. **PO's stated reason for restart: MS365 connector.** Connectors bind at session start. First thing: `ToolSearch "+outlook"` / `"+365"`; if a mail tool appears, the pending use was a note to Rein Kadastik (already sent via Teams, so probably nothing to send). Check whether the field-guide artifact is shared (private by default).
5. **paunvere follow-ups (PO/Joosep-gated):** (a) **Post-transit health read** -- once Joosep runs a session on A1, Hopper Tier R: did Minot read `AMENDMENTS.md`, record A1 in its header, add the rail-register revision row, commit the 4+1 files? Rebuild `joosep:latest` (D1-D4, Tier M, recreate-free, re-stage entrypoint first) only AFTER that read is healthy -- PO's sequencing. (b) Celes's other 8 fix-now items ride as A2 the same way (note + stamp `A2`), NOT before the A1 health read. (c) Minot's remote-location question and the core-dump deletion await the PO. (d) PO's concern: the team may refuse upgrades; today's evidence says it verifies claims against artifacts, so announce every change to Minot via Joosep first.
6. **apex follow-ups:** (a) `Dockerfile.apex` two pipe-masked layers, subtractive fix, apex repo PR + rebuild + recreate (Brunel/Hopper, Tier D). (b) L1->L2 entrypoint transit incl. entrypoint-owned `.claude.json` restore with absent-only guard. (c) 403 = SSO authorization of the container token; PO decides: authorize `gho_2xo5…` for Eesti-Raudtee in GitHub settings, or rotate (token by file on RC, never via message). (d) Node 18 base vs package wanting 22.
7. **Protocol C, three candidates (Celes owns prompts; none decided):** tier taxonomy in `prompts/hopper.md` (orthogonal "represented in source of truth" flag preferred by Cal); `resolved` enum (G3, mine); wiki `stage-2` gate = referent-per-confirmation now + rename later.
8. **If Cal spawned:** re-derive the read-back backlog from HIS scratchpad (counts withdrawn); Volta's 3 S67 candidates + 3 read-backs; pronoun sweep (cannot be pattern-replaced); freshness-sweep defect (`last-verified` stamps fresh over non-discriminating re-checks); courier `inboxes_dir`-never-logged defect.
9. **If Volta spawned:** courier must log its bound `inboxes_dir`; the resume-on-send / dead-member `name-2` findings above; `sanitize-inboxes` skill `configs[0]` (team-lead can fix the user-level skill file directly); manifest-seed design for Step 9c (Brunel's fix (c)) as a design paper.
10. **Deferred, unchanged:** card `related:` base HOLD; contract-change queue A/B/C PO-gated; Celes owes Finn 2 items; Medici 2 read-backs; Herald untouched since S66. Older detail: `git show 9b224d1:teams/framework-research/memory/team-lead.md`.

### Standing watch items going into S73

- **Crossed-message watch at SEVEN** (S72 added: my 14:26 vs Brunel 14:12 manifest ask; Brunel 14:24 correction vs Hopper's run). Agent clocks drift up to 15 min vs wall clock; the ops-log logs against RC's clock. Still needs an instrument.
- **Instrument-defect genus (Brunel 12 in S71, 3 more in S72; Hopper 1):** the checker reports on itself, and every one fails CLOSED, reading as diligence. Remedies filed in wiki; watch for the first fail-OPEN instance.
- **PO's own open items:** apex source-data SSO/token; paunvere remote location; `joosep_sshd` backup; note to Lerko; Entu #42; exec-bit normalization; Step 12 items 2/3/5.

---
## Older sessions -- pruned to pointers

- **S71 (2026-09-02 p.m.):** apex CLI 2.1.258 end to end; startup.md heal PR #114; wiki 229->234. `git show 9b224d1:teams/framework-research/memory/team-lead.md`.
- **S70 and earlier:** `git show e7ab474:...` and `git show 2f0b9c8:...`; durable lessons live in the wiki, not here.

(*FR:Aen*)
