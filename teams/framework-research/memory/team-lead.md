# Team-Lead Scratchpad (*FR:Aen*)

> ## ⚠ THIS FILE IS A CLAIM ABOUT SOURCES. IT IS NEVER A SOURCE.
>
> Written as one agent's aide-memoire; **read by every agent at startup as an authoritative record.** Nothing in it marks that change of status, which is why it is added here explicitly.
>
> **Before citing anything below as fact -- especially in another agent's artifact -- open the thing it describes.** Entries here can be **stale**, **incomplete-at-authoring**, or **pessimistic**; **line-number and file-path references have been wrong more often than right.** S68 instance: I manufactured three tasks from this file's unverified header while telling the reader to verify (`coordinator-supplied-material-anchors-the-delegation`, instance c).

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S70 (2026-09-02) CLOSED early by PO interrupt, 15 min after spawn. Parent = **Fable 5.1**. CLI **2.1.258**. SLUG `session-97b61440`, pid 30620. Cell = Volta + Brunel + Hopper + Callimachus, all spawned on Fable 5.1 by inheritance -- **PO objected; roster now pins team-lead `claude-fable-5-1[1m]`, everyone else `claude-opus-4-6[1m]`.**
- **S70 DELIVERABLES:** Hopper's Tier-R apex recon (below) is the only landed artifact. Volta's startup.md heal: branch `fr/s70-startup-heal` created, ZERO commits, worktree removed at close -- **task NOT started, re-issue**. Brunel's apex plan: not delivered. Cal's revision-trigger pass: not delivered.
- **PO AGENDA (both still open, S71 first order of business):** (1) upgrade apex-research's Claude CLI (2.1.217 -> 2.1.258); (2) heal startup.md (30771 B / 279 lines exceeds the Bash tool 30 KB output cap -- team-lead cannot even cat it).
- **PO DIRECTIVE, durable:** cut intra-team chatter. No intros, no item-by-item acks, no progress notes; agents message team-lead only for a finished deliverable or a blocker. Put it in every spawn brief (overrides common-prompt's intro/ack rules). Saved to auto-memory too.
- **Carry-forward:** see NEXT-SESSION BOOT.

---

### S71 CHECKPOINT (2026-09-02 16:21) -- apex CLI upgrade in execution

- Boot clean: SLUG `session-1e8d8ae9`, pid 26376, second live session pid 8496 still present -> pid-disambiguated everywhere. restore-inboxes needed `FR_COURIER_TEAM_DIR_NAME=<slug>` (script hardcodes `$PPID`). Courier pid 19072 bound via `-SessionPid 26376`, call backgrounded. Sanitize run pinned to slug (skill `configs[0]` bug unchanged).
- Spawned Brunel + Hopper with `model: "opus"` on PO order; config.json stamps the literal `opus`, not a version. Roster 4.6 pin unenforceable from Agent tool -- substrate limitation, Volta/Celes to record.
- PO decisions: apex tmux client is PO's, window ours; RC ff SANCTIONED (Hopper ran it 16:02, HEAD `e7ab474`, ops-log 2026-09 opened); fast path AND rebuild today; D8 HELD until I return with D4/D6/R-C.
- Mechanism settled by Hopper Tier R: ONE claude, base npm-global root-owned 2.1.217; no `~/.local/bin/claude`. Brunel reversed S70 in full. Committed Brunel's Dockerfile assertion + compose `network: host` as `057fab4`.
- Brunel's Tier D package final (F0-F2, D1-D9); gates: lock pre-clean present in L2 (:513), env diff = PATH only, D7 backup REQUIRED (L2 has no 9d2). Outstanding: R-C courier key fingerprint.
- [WARNING] until D8 lands, any apex recreate silently reverts CLI to 2.1.217.
- Uncommitted: ops-log 2026-09, brunel.md, hopper.md.

### S70 WRAP (2026-09-02, 15:07-15:30) -- closed on PO interrupt

- **Startup ran clean on the new facts:** two live Claude sessions on this box (pid 30620 = FR, pid 8496 = a home-dir session), so bare auto+liveness is **ambiguous**; resolver and courier both needed `--session-pid 30620` / `-SessionPid 30620`. The "v2 multi-team" path is now the default here. `$PPID`=1 under Bash confirmed again; slug derived from `~/.claude/sessions/<pid>.json` `sessionId`. `config.json` stamps `model: null` for team-lead but the **spawned members' model IS stamped** (`claude-fable-5-1[1m]` on all four) -- Step 0.5's premise is half-gone: the gate must read `members[1..].model` after first spawn, not `members[0]`.
- **Courier restart wrapper hands stdout to the daemon**, so a Bash-tool call of `restart-fr-courier-with-pid.ps1` hangs 120 s and backgrounds. Courier came up fine (pid 29816, bound `session-97b61440`, verified via dry-run resolve). Redirect or background the call. Courier STOPPED at S4 again (S69 discipline).
- **sanitize-inboxes skill `configs[0]` bug hit live:** with 23 team dirs it would have picked `bigbook-dev`. Ran its logic pinned to the discovered slug. 45 inboxes restored, all clean. Volta item, still untasked.
- **Spawn model fact (new):** Agent-tool `model` param enum is `sonnet|opus|haiku|fable` -- family only, resolves to the *current default* of that family. **The roster's `claude-opus-4-6[1m]` pin cannot be enforced from the Agent tool**; `model: "opus"` will resolve to Opus 5. Verify what `config.json` stamps after the first spawn and tell the PO before spawning the rest.
- **Hopper's apex recon (Tier R, verified by nobody else yet -- a claim):** container `apex-research`, image `apex-research-claude:latest` `fb99aee1887c` built 2026-07-22 FROM `ai-teams-claude:latest` `a983e663b44b`; CLI **2.1.217**, Node 22.14.0; up since 08-27, zero restarts; 3 named volumes + `/opt/warp-ca.pem` bind; route `ssh -T dev@100.96.54.170` + `docker exec`. **No claude process running; one human tmux client attached at ~14:30 after a FAILED in-container `claude update`** (npm cache root-owned; claude is the root-owned npm-global install from the base image; Dockerfile.apex:114-116 "native install" layer produced NO binary, exit masked by `| tail -5`). **In-place update is not the mechanism; rebuild is.** Gates: (1) RC checkout `/home/dev/github/mitselek-ai-teams` at `5336c2e` still says 2.1.217 -- must fast-forward to `446251f` first or the rebuild is green-but-identical; (2) L1 `designs/deployed/apex-research/container/entrypoint-apex.sh` (32823 B, Jul 23) vs running/L2 copy (25805 B, Jun 16): 7 KB never transited, Brunel adjudicates; (3) rollback precedent tags `*:rollback-pre-2.1.217` exist -- retag before build; (4) Config.Env vs `.env` diff immediately before recreate. Hopper forwarded this to Brunel and the "submission 6" identification (`command-v-multi-operand-silent-false-negative`, by content not number; her ops-log timing clause is wrong) to Cal -- **Cal was interrupted; treat as unprocessed.**
- **My own error this session:** relayed two agent intros to the PO before being told to stop. The chatter rule is now memory-backed.

### NEXT-SESSION BOOT (re-orient instructions for S71)

1. Read `startup.md` first (always) -- but it is 30 KB: read it with the Read tool in two chunks, NOT cat. Steps 1 -> 2' -> 3 -> 3.5 -> spawn. Pass `--session-pid <claude pid>` everywhere; get the pid from `~/.claude/sessions/*.json` (match `cwd`). Background the courier restart call.
2. **Step 0.5 as now written will trip and is half-obsolete** -- parent Fable 5.1 vs roster `claude-fable-5-1[1m]` now MATCH for team-lead; the open question is the specialists (see item 4).
3. **Don't pre-spawn.** Ask the PO which agents. Every spawn brief carries the chatter rule.
4. **Model enforcement, first thing to settle with the PO:** roster says specialists on `claude-opus-4-6[1m]`; the Agent tool can only say `model: "opus"` (-> Opus 5). Spawn ONE agent with `model: "opus"`, read its stamped `model` in `config.json`, report the string to the PO, then spawn the rest. If the PO needs 4.6 specifically, that is a substrate limitation to record (Volta/Celes), not something to work around silently.
5. **If PO resumes agenda (1) apex CLI upgrade:** spawn Brunel + Hopper. **FIRST resolve a direct CONTRADICTION between them, on RC, with a command:** Hopper (Tier R, live) found NO `~/.local/bin/claude` and `claude --version`=2.1.217 from the base's root-owned npm-global install; Brunel's [WIP] plan (his scratchpad header L4-10, written from the Dockerfile, not the container) says the team runs the NATIVE unpinned `~/.local/bin` claude (Dockerfile.apex:116) with a stalled autoupdater, so #113 / base line 53 are NOT the lever, fast path = `claude install 2.1.258` in-container (survives restart, not recreate), durable path = Dockerfile.apex PR in the APEX repo (pin + pipefail + assert + drop the failing npm@latest line + WARP CA for inner curl) then rebuild + `--force-recreate`. `docker exec apex-research sh -lc 'which -a claude; ls -l ~ai-teams/.local/bin/claude; readlink -f $(which claude)'` settles it. Do not let either plan proceed on the other's premise. Otherwise: Brunel builds the plan on Hopper's recon above (Hopper's scratchpad has the primary). Two PO decisions were pending when we closed: (a) is the attached tmux client the PO's and is the window ours; (b) sanction the RC checkout fast-forward (`git pull` on RC, Tier M). Brunel's line-53 Dockerfile fix is sanctioned to write if on the path. FR cannot build (no docker here); build/recreate = Hopper on RC under Tier D.
6. **If PO resumes agenda (2) startup.md heal:** spawn Volta. Brief in S70 spawn prompt shape: lean executable file + `docs/startup-rationale.md`, fold in substrate truths (a) `$PPID`=1, (b) two live sessions -> always pid-disambiguate, (c) wrapper stdout inheritance hangs caller, (d) `model: null` for team-lead / stamped for members, (e) courier stopped at S4, (f) sanitize `configs[0]` bug. Branch + PR. `fr/s70-startup-heal` was deleted empty; start fresh.
7. **If Cal spawned:** revision trigger 2.1.251 -> 2.1.258: Cal's plan is ONE compact version-pointer datapoint for the implicit-teams lineage, rest left under TTL (seat observations in his scratchpad). Hopper's submission-6 identification NEVER REACHED Cal -- re-send from Hopper's scratchpad. S69 courier-past-graceful-exit claim: Cal confirmed `inboxes_dir` binds once at launch; verdict hinges on one unread function, `stationmaster-courier.py` `inject_batch` (~L674-755): missing parent dir -> InjectError = no ack = safe, or mkdir'd = silent loss. Read it before filing. Brunel's 5 read-backs still owed; 16 cards at stage-2 pending.
8. **Courier bound-dir is UNLOGGED (Cal's warning):** pid 29816 started on auto config with two live sessions; I passed `-SessionPid 30620` and the dry-run resolved `session-97b61440`, but the daemon never logs its bound dir, so the inject target was unverified all session. Volta: make the courier log `inboxes_dir` at bind. Stopped at S4 regardless.
9. **Deferred from S69, unchanged:** G3 `resolved`-enum (mine); card `related:` base HOLD (normalise on touch, no sweep); apex onset discrepancy 2.1.247 vs 2.1.217 unreconciled by design; contract-change queue A/B/C PO-gated (A needs Celes); Volta's 6 untasked items + lifecycle-script half of durable-store finding; Celes owes Finn 2 items; Medici 2 read-backs; Herald untouched since S66. Full text: `git show 2f0b9c8:teams/framework-research/memory/team-lead.md`.

### Standing watch items going into S71

- **Crossed-message watch at FOUR, unupgraded.** Decayed-vs-false needs an instrument, not attention.
- **Chatter budget:** if any agent sends an intro or ack after the brief, that is a prompt defect (common-prompt "On Startup" 3 and REQUIREMENT ACKNOWLEDGMENT), Celes's to fix -- one instance is enough to task it.
- **Cal's watches (S66-S68)** and **Brunel's md5 authority** carry unchanged.
- **PO's own open items:** Step 12 items 2/3/5; `joosep_sshd` volume backup; note to Lerko; `gho_` token rotation; Entu #42; exec-bit normalization.

---
## Older sessions -- pruned to pointers

- **S69 (2026-09-02 a.m.):** courier found dead, 2 apex messages recovered + archived (`0b8633e`); PR #113 merged (`446251f`, base CLI -> 2.1.258); Brunel's Node-18 engine finding + `Dockerfile:53` pipe swallow. `git show 2f0b9c8:teams/framework-research/memory/team-lead.md`.
- **S68 / S67 / S66-S63:** see the same pointer; durable lessons live in the wiki, not here.

(*FR:Aen*)
