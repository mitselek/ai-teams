# Team-Lead Scratchpad (*FR:Aen*)

> ## ⚠ THIS FILE IS A CLAIM ABOUT SOURCES. IT IS NEVER A SOURCE.
>
> Written as one agent's aide-memoire; **read by every agent at startup as an authoritative record.** Nothing in it marks that change of status, which is why it is added here explicitly.
>
> **Before citing anything below as fact -- especially in another agent's artifact -- open the thing it describes.** Entries here can be **stale**, **incomplete-at-authoring**, or **pessimistic**; **line-number and file-path references have been wrong more often than right.** S68 instance: I manufactured three tasks from this file's unverified header while telling the reader to verify. S71 instance: my 16:21 checkpoint carried a "recreate reverts to 2.1.217" warning that was already false; Hopper flagged it.

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S71 (2026-09-02 15:52-17:35) CLOSED clean. Parent Fable 5.1, CLI 2.1.258, SLUG `session-1e8d8ae9`, pid 26376. Cell = Brunel + Hopper + Callimachus + Volta, all spawned `model: "opus"` on PO order; all four shut down cleanly.
- **BOTH PO AGENDA ITEMS DELIVERED:** (1) apex-research CLI 2.1.217 -> **2.1.258**, fast path 16:17 + base/apex rebuild + recreate 16:43, config restored; ops-log `docs/operations-log-2026-09.md` 10 entries. (2) **startup.md healed** -- PR #114 merged `a239c01`: 30.8 KB -> 13.7 KB runbook + `docs/startup-rationale.md`; lifecycle scripts now honour `FR_COURIER_SESSION_PID`. Both user-level skill files updated to the new step list (Step 0..4, S1-S4).
- **Wiki:** 229 -> 234 entries (Cal); roster-drift entry now `status: disputed` -- do NOT cite config.json `model` values for anything (see WARNING below).
- **PO DIRECTIVE, durable:** cut intra-team chatter (in every spawn brief; worked this session -- zero intros/acks).
- **Carry-forward:** see NEXT-SESSION BOOT.

---

### S71 WRAP (2026-09-02)

- **Boot:** two live sessions (26376 repo, 8496 home) -> pid-disambiguated everywhere; `restore-inboxes.sh` needed `FR_COURIER_TEAM_DIR_NAME=$SLUG` (now also accepts `FR_COURIER_SESSION_PID` post-#114); courier pid 19072 via `-SessionPid 26376`, call backgrounded; sanitize pinned to slug.
- **apex mechanism, settled by Hopper Tier R:** ONE claude at `/usr/local/bin/claude`, base npm-global root-owned; NO native `~/.local/bin` install (Dockerfile.apex layer double-masked: `--insecure` not passed to inner curl + `| tail -5`). Brunel reversed his S70 premise in full. `Dockerfile:52-53` assertion + compose `network: host` committed `057fab4` and RAN inside the S71 base build.
- **Sequence:** F1 root `npm install -g @2.1.258` (overlay) -> D1 RC ff to `057fab4` -> D2 rollback tags `*:rollback-pre-2.1.258` -> D3 base build -> D4 gate BROKEN (ENTRYPOINT ate args; control proved gate not image) -> D4'/D6' with `--entrypoint` bypass + known-bad control PASS -> D7 `.claude.json` backup to volume -> D8 `--force-recreate` -> D9 pass; restore of `.claude.json` (overlay-lost) byte-identical `6f3c1370…`. Nothing pruned, 4 rollback tags intact.
- **Retraction:** "recreate reverts to 2.1.217 until D8" was true only until D5 (tag resolves to new image, no pull policy). D8 was completing, not protective; PO ran it anyway to close the tag/digest divergence.
- **Brunel's 12 instances of one error** (checks whose pass or null was unreachable; live-but-non-discriminating evidence; package written to approver not executor) -> 5 rules in his scratchpad + wiki `state-the-match-set…`, `live-is-not-the-same-as-discriminating`, contract `tier-taxonomy-has-no-slot-for-undeclared-in-place-change` (no-slot form 12).
- **Cal settled S69 courier claim from source:** vanished inbox dir -> `FileNotFoundError` escapes before ack -> hub retains. Safety is INCIDENTAL: a defensive `mkdir` before the exclusive-create would create silent loss. Gotcha filed, confirmed.
- **My errors:** (a) sanction relay carried the D8 command but not Brunel's reason/outcome/rollback -- Hopper refused correctly; the package must go author -> executor at sanction time. (b) Told Hopper "D2-D7" while D7 must run immediately before D8. (c) Stale checkpoint line (above). (d) Inter-agent message timestamps drift; only the executor's own conversation order proves receipt-before-execution.

### NEXT-SESSION BOOT (re-orient instructions for S72)

1. Read `startup.md` first (always) -- now 13.7 KB, cat-able. Step 0 Host check -> 0.5 Model -> 1 Sync -> 2' Discover -> 3 Restore -> 3.5 Courier -> 4 Spawn (wait for PO). Pass the Claude session pid / discovered slug on every resolver, script and courier call. Courier was STOPPED at S4.
2. **Pull `mitselek-ai-teams`.** Nothing else touched externally except the apex repo's RC checkout (read-only) and RC's `mitselek-ai-teams` checkout (now `057fab4`).
3. **Don't pre-spawn.** Ask the PO which agents. Every brief carries the chatter rule.
4. **[WARNING] config.json `model` field is NOT evidence.** Cal measured: absent for team-lead, absent for some spawned members, a full version pin (`claude-fable-5-1[1m]`) in another session. Only the Agent tool schema (`sonnet|opus|haiku|fable`) is citable. A probe on which spawn path writes a full pin is OPEN (Volta/Celes, PO-gated).
5. **If PO raises apex follow-ups:** (a) `Dockerfile.apex` has two pipe-masked layers (native install `:114-116`, `npm@latest` `:34`), fix is subtractive, lives in the APEX repo -> PR there + build + recreate (Brunel designs, Hopper executes, Tier D re-sanction). (b) L1 -> L2 entrypoint transit (7 KB never shipped) incl. entrypoint-owned `.claude.json` restore with absent-only guard (Brunel adjudicated). (c) source-data pull HTTP 403 at boot = PO's token item. (d) Node 18 in the base image vs package wanting 22 (apex overlays 22; other derived images do not).
6. **If PO raises prompts/roster:** Protocol C from Cal -- `prompts/hopper.md` tier taxonomy needs either a 4th class or an orthogonal "represented in source of truth" flag (Cal reads the flag as better). Celes owns prompts. Also Celes owes Finn 2 items (S69).
7. **If Cal spawned:** read-backs owed Brunel 2, Hopper 0 (done), Volta 3 + Volta's 3 S67 candidates; courier `inboxes_dir`-never-logged defect unfiled (Brunel's surface); freshness-sweep defect (`last-verified` stamps fresh over non-discriminating re-checks) is Cal's own pass to fix.
8. **If Volta spawned:** courier should log its bound `inboxes_dir` at bind (Brunel's code, Volta's requirement); `sanitize-inboxes` user-level skill still picks `configs[0]` (team-lead can fix the skill file directly); OQ10/OQ11/version-drift tripwire deferred.
9. **Deferred, unchanged from S69:** G3 `resolved`-enum (mine); card `related:` base HOLD; contract-change queue A/B/C PO-gated; Medici 2 read-backs; Herald untouched since S66. Full S69/S70 text: `git show 2f0b9c8:teams/framework-research/memory/team-lead.md` and `git show e7ab474:teams/framework-research/memory/team-lead.md`.

### Standing watch items going into S72

- **Crossed-message watch at FIVE** (S71: my 15:58 vs Hopper 15:57; Brunel 16:18 vs Hopper 16:21 stop). Still needs an instrument, not attention.
- **Cal's watches (S66-S68)** and **Brunel's md5 authority** carry unchanged.
- **PO's own open items:** apex source-data 403 / `gho_` token rotation; `joosep_sshd` volume backup; note to Lerko; Entu #42; exec-bit normalization; Step 12 items 2/3/5.

---
## Older sessions -- pruned to pointers

- **S70 (2026-09-02 p.m.):** closed early on PO interrupt; Hopper's Tier-R apex recon was the only landed artifact; roster re-pinned (team-lead Fable 5.1, specialists Opus 4.6). `git show e7ab474:teams/framework-research/memory/team-lead.md`.
- **S69 and earlier:** `git show 2f0b9c8:teams/framework-research/memory/team-lead.md`; durable lessons live in the wiki, not here.

(*FR:Aen*)
