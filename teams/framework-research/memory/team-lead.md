# Team-Lead Scratchpad (*FR:team-lead*)

## SESSION 50 — 2026-06-12 (stationmaster BUILD; PO delegated autonomous coordination)

- [DECISION — S50, PO 16:4x] **Full build-order authorization, PO absent:** deploy hub container to prod-llm (michelek@10.100.136.162), run T6.a gate there, on pass register FR as first customer. No further PO gate inside the build order.
- [DECISION — S50, PO 16:4x] **Session-end:** full S1–S5 shutdown incl. commit + push when work wraps or stalls.
- [DECISION — S50, Aen] Protocol §5 verbs `grant`/`revoke` are the contract; `grant_receive`/`revoke_receive` were phase-2 MCP tool names only (Brunel caught the discrepancy in my brief; ratified doc wins).
- [WIP] Spawned: brunel (T#1 hub container), herald (T#2 courier), callimachus (T#5 Protocol A batch, not yet checked in). T#3 (T6.a gate) unowned — plan: spawn Hopper (deployment operator) at staging time, per Brunel's operator-domain scoping. T#4 blocked by 1–3.
- [GOTCHA] CLI 2.1.175 now (TRUTHS.md stamped 2.1.170) — substrate claims carry re-validation flag; baked into briefs + T#3.
- [GOTCHA] I-1 mitigation applied at startup: zeroed runtime inboxes of all three spawn targets before spawn (were already empty). Hopper's inbox had 15.6KB stale restored entries at her later spawn — zeroing was LOAD-BEARING; datapoint for lifecycle-scripts revision.
- [DECISION — S50, Aen 16:49] Herald's ghost-outbox routing gap: v1 handling = documented convention (single-outbox config + `<team>-bridge`→`<team>`; refuse-and-retain on fan-out). Fan-out routing = PROTOCOL AMENDMENT CANDIDATE, queued `[DEFERRED — PO ratification]` in Herald's scratchpad. Ratified docs untouched.
- [DECISION — S50, Aen 16:49] T6.a gate-of-record definition (Hopper's per-filesystem catch): host-fs baseline ≠ gate; gate runs against the EXACT inbox+spool filesystem layout of Brunel's artifact (volume/bind-mount explicit in compose). Task #3 closes only on that run.
- [WIP] T#2 COMPLETE (courier shipped, 8/8 tests). T#6 created: local courier⇄hub integration smoke (Herald, blocked by #1) before deploy.
- [DECISION — S50, Aen 16:52] T6.a gate ADJUDICATED (amends 16:49 criterion): hub does NOT depend on exclusive-create (Brunel: flock + tmp/fsync/rename, exclusive spool ownership) — T6.a gates CUSTOMER-side courier injection. Gate-of-record = Hopper's prod-llm host-fs run (customer substrate for prod-llm-hosted teams) + cheap supplementary inside sm-state volume. Windows customer substrate already S48-verified.
- [WIP 16:52] T#1 COMPLETE+ACCEPTED (hub artifact set + runbook; image assembly UNVERIFIED — no Docker on dev box). T#7 created (Hopper): compose build dry-run on prod-llm → up -d → smoke-test.sh acceptance; Brunel standby for build failures. T#6 RE-SCOPED: integration vs DEPLOYED hub (no local Docker), blocked by #3+#7. T#5 COMPLETE (wiki 120→123); stage-2 read-back on post-office decision entry sent CONFIRMED w/ 1 correction (onboarding=ACCEPTED not DRAFT); wiki commit pending Cal's fix.
- [LEARNED] Spawn-brief path discipline: always full repo-relative paths (`teams/framework-research/poc/...`) — three agents independently caught the missing prefix.
- [DECISION — S50, Aen 16:58] Hopper's deploy gap + sanction: artifact transfer to prod-llm APPROVED (~40KB, no secrets, repo HEAD 62bba75 = source of truth); Tier-D sanction ISSUED verbatim for `docker compose up -d` (reason: S50 build order per PO authorization; expected: healthy <10s, sshd :2222, sm-state volume). Greenfield hard-gates stand.
- [DECISION — S50, Aen 16:58] Task #6 record corrected per Herald's integrity flag (his option B): retitled to "Pre-deploy integration smoke (local, transport stubbed)" — completed flag now claims exactly what 14/14 evidence supports; deployed-hub-over-real-ssh = Task #4 acceptance. Principle: completed flag must never claim more than its evidence.
- [WIP 16:58] Committed+pushed b745bd1..e614916 (build artifacts, wiki→125, scratchpads). Hopper executing: transfer → build → REPORT → up -d → smoke → in-container T6.a. Herald's fan-out amendment candidate in his scratchpad [DEFERRED — PO ratification]. Both his Protocol-A subs filed by Cal.
- [GOTCHA — S50 17:02] TWO version skews during live deploy, both from specialists editing the artifact after my "source of truth = <commit>" pointer to Hopper: (1) bfe3060 entrypoint same-fs assertion; (2) f022fed host-key DEPLOY-BLOCKER fix (`ssh-keygen -A -f <prefix>` never lands keys → sshd can't start; runtime-only, invisible to build dry-run; Brunel pre-up audit caught it). Mitigation pattern used: commit immediately, alert operator with per-stage branch instructions + pre-extended remediation sanction. LESSON: freeze artifact edits (or re-point source-of-truth atomically) once an operator is mid-transfer.
- [DECISION — S50, Aen 17:03] Standby-agent hot-fix discipline ruled for Brunel's fix-then-flag: correct when ALL FOUR hold — live-deploy urgency, MAY-WRITE one-line bounded scope, immediate flag w/ evidence, explicitly on standby for that failure class. Any missing → surface-before-fix on accepted artifacts. Suggested as Protocol-A pattern. Build verified clean on prod-llm (image 1.0.0, exit 0).

### [PROCESSED 2026-06-12] 2026-06-12 — session-49 → session-50

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S50 read):**

- **State of play:** S49 closed 2026-06-12 — solo stationmaster design day (zero spawns). Host DECIDED: containerized hub on **prod-llm** (10.100.136.162, michelek = passwordless sudo + docker). Architecture PIVOTED hub-pull → **post-office model** (customers dial out, hub holds only pubkeys). **Doc set complete & accepted:** `stationmaster-protocol.md` v1.0.0 RATIFIED, `stationmaster-onboarding.md` ACCEPTED, `stationmaster-courier-hints.md` ACCEPTED (all in `poc/ghost-bridge/`). **S50 task (PO-stated): BUILD.**
- **Key probe results (2026-06-11):** reachability strictly one-way rc→prod-llm; prod-llm cannot reach rc on ANY address — moot under post-office. **rc 100.96.54.170 = Cloudflare WARP, NOT Tailscale** (memory corrected); rc LAN = 10.200.13.114. Jira: zero movement (TPS-601 epic + subtasks Open; ITSD-38884 Analysis).
- **Architecture essence:** ssh-only customers; `restrict,command="sm-shell <team>"` forced-command identity; symmetric NDJSON conversation (request envelope `{v,cmd,args}` + body ⇄ response envelope + data); `deposit` / `collect`+`ack` two-phase, all idempotent; unilateral team-level receive-grants; stationmaster's own grant silent/unmodeled; REST+MCP = phase-2 bindings, non-breaking.
- **Build order S50:** (1) hub container + `sm-shell` (Brunel-shaped) → (2) reference courier, single file stdlib (Herald/Brunel) → (3) **T6.a race re-run on prod-llm = FIRST GATE** → (4) FR self-registration as first customer (dogfood). Specialists work from the three docs VERBATIM.
- **Carry:** GitHub issue retention-flip (PO go pending); Protocol A batch to Cal (S48 truths + S49 decisions); A1 audit OVERDUE; D10 amendments fold-in (Debian/Docker/in-container sshd); phantom-brunel; ELEX human ask; hr-devs relay; ghost-bridge v2 daemon = SUPERSEDED by stationmaster, decommission after cutover.

---

## SESSION 49 WRAP — 2026-06-11/12 (stationmaster: host hunt → post-office pivot → doc set ratified)

**Host findings (probed 2026-06-11):**
- rc = 100.96.54.170 is **Cloudflare WARP, NOT Tailscale** (memory correction); real LAN addr 10.200.13.114/23; hostname `paarisprogemis-fyysiline`; Debian 13, systemd 257, no sudo for dev, Linger=no, 9 users — somebody's physical machine.
- prod-llm = 10.100.136.162 `ai-agenditiimide-tookeskkond`; Debian 13, **michelek has passwordless sudo + docker**, hosts hr-devs/comms-dev/backlog-triage, own ports 2225-7 open on localhost. **PO choice: stationmaster = container on prod-llm.**
- Reachability strictly one-way: rc→prod-llm:22 OK; prod-llm→rc unreachable (both WARP addr and LAN addr, all ports). Post-office pivot makes this moot.
- Jira 2026-06-11: TPS-601 epic + all subtasks Open, ITSD-38884 still Analysis. No movement.

**[DECISION — S49] Post-office model replaces hub-pull (SPEC-v4 delta over v3):**
- Customers dial OUT to hub (only outbound ssh assumed). Hub holds NO customer credentials, only registered public keys. Registration = pubkey + team name; key lands in hub sshd authorized_keys with forced command (`restrict,command=`).
- Courier = customer-side component, **pattern not product**: does D1 consume-by-rename + D11 inject locally (atomicity is per-filesystem — forced), pushes/pulls hub over plain ssh exec. D1/D2/D11 disciplines transfer intact from v3.
- Hub protocol (layer-2, typed contract, version it): `deposit` (stdin entries → accepted IDs), `collect` + `ack` two-phase (hub deletes only after ack — at-least-once end-to-end). Clean JSON out everywhere so MCP wrapper is trivial.
- **Permits = unilateral receive-grants** (PO's reframing, kills co-sign ceremony): "I agree to receive from team X", submitted over own authenticated channel — channel auth IS the signature. One grant = one direction live; two reciprocal = full route. Revoke unilaterally. timetable.json becomes COMPILED from grants.
- **MCP = control plane only, mail NEVER over MCP** (wake semantics C3 + durability live on inbox path). v1 tools: grant_receive/revoke_receive, who_is_on, health, who_accepts_me. MCP can ride ssh stdio (`ssh hub mcp`) — same key auth, no new port. MCP itself ships phase 2; protocol designed for it now.
- **[DECISION — S49] Team-level grants for v1** (not user@team); agent identity rides in message signatures per D9.
- Doc set: ALL THREE SHIPPED S49 — (1) `stationmaster-onboarding.md` (DRAFT, PO-reviewed informally), (2) `stationmaster-protocol.md` v1.0.0 RATIFIED (+§5.5 errata, no bump — no consumers yet), (3) `stationmaster-courier-hints.md` ACCEPTED (PO: field usage will expose shortcomings). Reference courier (Python) still owed.
- D10 amendments pending ratification: Debian not Ubuntu; Docker `restart: unless-stopped` not systemd; hub sshd in-container on dedicated port.

**[DECISION — S49] `stationmaster-protocol.md` v1.0.0 RATIFIED** (PO read section-by-section, 2026-06-12). Key calls locked during review:
- **Symmetric envelope pivot (PO):** protocol = transport-agnostic NDJSON *conversation* (request envelope `{v,cmd,args}` + body lines ⇄ response envelope + data lines). ssh binding = pure authenticated byte pipe (`ssh -T`, stdin/stdout); SSH_ORIGINAL_COMMAND no longer parsed. Client declares major in request envelope → real version negotiation. REST + MCP = phase-2 bindings, non-breaking by construction. Relaying = YAGNI, left out.
- Registration v1 = human step (operator edits authorized_keys; `restrict,command="sm-shell <team>"`, linked to sshd(8) upstream doc).
- **Stationmaster silent grant (PO):** hub mail needs no grant — not modeled, not revocable, only documented (§10); unenforceable since hub runs the consent checks itself.
- Transport-failure rule: response envelope authoritative; no envelope = retry whole conversation; safety bought by per-command idempotency (deposit dedup-by-id, collect non-destructive, ack idempotent).
- ack = custody transfer: only after durable local write; partial ack legitimate; re-ack after crash via ledger.
- All seven embedded calls ratified: deposit-time consent enforcement, accepted=fsync-durable, duplicate=success, revoke-keeps-queued, status-covers-health, hub-alerts-as-mail, size caps [CONV].

### NEXT-SESSION BOOT (re-orient instructions for S50)

1. Read `startup.md` first (always). Steps 1–5 — BUT before any spawn, see item 4 (I-1 inbox hazard).
2. **Pull `mitselek-ai-teams` repo** for external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **Pre-spawn safety (I-1, still unverified):** restored inbox entries for a SPAWNED agent may re-deliver on 2.1.x (drain ignores read flags). Before first spawn: test with a scratch entry OR restore that agent's inbox as `[]`. Check CLI version vs 2.1.170 — if changed, re-validate ghost-outbox accumulation (TRUTHS.md I-1 precedent) before trusting any stationmaster doc claim.
5. **PO-stated S50 task: BUILD stationmaster.** Delegate against the three accepted docs VERBATIM (`poc/ghost-bridge/stationmaster-{protocol,onboarding,courier-hints}.md`). Build order: hub container + `sm-shell` (Brunel: Dockerfile, compose, in-container sshd on dedicated port, forced-command shell; target michelek@10.100.136.162 — passwordless sudo + docker confirmed) → reference courier `stationmaster-courier.py` (Herald or Brunel: single file, stdlib only, section-numbered comments against hints doc) → **FIRST GATE: T6.a race harness re-run on prod-llm** (only Windows-verified so far) → FR registers as first customer.
6. **If Cal spawns:** Protocol A batch — S48 substrate truths (T-entries) + S49 decision set (post-office pivot, channel-is-identity, consent-as-grants, transport-failure rule, inject-before-ledger ordering).
7. **If PO gives the go on the GitHub issue** (undocumented retention flip): draft from TRUTHS.md I-1 + probe-1b evidence + 2.1.166–170 bracket; PO reviews before filing.
8. **If PO asks about D10:** fold S49 amendments into SPEC-v3 D10 text (Debian-not-Ubuntu, Docker-restart-not-systemd, in-container sshd) — small edit, PO already ratified in dialogue.

### Standing watch items going into session 50

- **Stationmaster build** — S50 primary (PO-stated).
- **ghost-bridge v2 daemon** (Windows dev machine) — superseded by stationmaster; keep alive until cutover, then decommission; pairs fr-apex + fr-hr-devs migrate to grants.
- **TPS-601 Epic / ITSD-38884** — checked 2026-06-11, zero movement; re-check before any CF-Access-dependent plan.
- **Lifecycle-scripts revision** (persist/restore/sanitize vs I-1) — Volta-grade, still blocks confident spawning.
- **A1 evidence-cycle audit OVERDUE** (since S44) — surface if no higher-priority work.
- **Phantom-brunel anomaly** — candidate probe when Volta/Cal active.
- **Unchanged:** ELEX human ask, hr-devs return-path test + relay, Entu #42, formula A/B, #8 prompt-edits, article/Schliemann, Arhitecture #9–#13, round-3 candidate.

(*FR:Aen*)

### [PROCESSED 2026-06-11] 2026-06-10 — session-48 → session-49

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S49 read):**

- **State of play:** S48 closed 2026-06-11 00:xx — ghost-bridge v3 full-redesign day, solo (no spawns). CLI `2.1.170` (released day after S47) flipped inbox semantics UNANNOUNCED: delivered messages now REMOVED from inbox files, not retained with `read:true`. PO directive: trust no baked-in history → 6 empirical probes → `poc/ghost-bridge/TRUTHS.md` (23 entries, version-stamped). `SPEC-v3.md` "stationmaster" design COMPLETE — all D1–D11 ⬛ (D1/D11 substrate-verified by Tests #5/#6). **Tomorrow's task (PO-stated): find an always-on host for stationmaster.**
- **Key substrate truths (2.1.170):** inbox = pending-only queue, drained ≲0.8s; ghost outboxes persist (no consumer); direct file write into live inbox → delivered + WAKES idle session ≲0.5s; arbitrary `from` passes verbatim; enqueue lag VARIABLE 0.5–9s; mtime lies; rename-aside + exclusive-create verified atomic (50/50 race rounds). `members[]` never on dispatch path.
- **Stationmaster (SPEC-v3):** hub daemon — Ubuntu+systemd, hot-reloaded `timetable.json`, four-inbox bidirectional routes with DERIVED attribution (ghost name = address AND identity), per-endpoint executors (local/ssh → any-to-any team bridging), consume-by-rename, inject-by-exclusive-create, at-least-once spool+ledger. **Owed before prod: T6.a race re-run on Ubuntu.**
- **CASUALTIES (I-1) — own lifecycle scripts now suspect:** persist-inboxes.sh captures only undelivered residue; restore+sanitize semantics undermined — restored inbox files for SPAWNED agents may RE-DELIVER stale entries on the new harness (drain-on-pickup ignores read flags — unverified, test before first spawn!). Startup/shutdown procedure revision is Volta-grade work.
- **Carry:** GitHub issue on undocumented retention flip (evidence ready, PO go pending); Protocol A batch to Cal (dispatch finding + S48 T-entries); phantom-brunel anomaly (idle_notification from non-member during sanitize rewrite, 10:31Z); A1 audit OVERDUE; TPS-601/ITSD-38884 watch; ELEX human ask; hr-devs relay update.

---

## SESSION 48 WRAP — 2026-06-10/11 (ghost-bridge v3 redesign: empirical truths + complete SPEC)

**Spans:** 2026-06-10 → 2026-06-11 00:xx, single session, solo (zero spawns). Parent on `claude-fable-5[1m]` (PO decision; roster pins updated from opus-4-6).

**Outcome:** PO called the redesign at morning standup after S47's ghost-bridge assumptions proved stale: CLI 2.1.170 changed inbox retention semantics unannounced (caught via empty-inbox observation; changelog research confirms NOTHING published). Built `TRUTHS.md` ledger from scratch — 6 probes (self-dispatch, drain timing, ghost persistence, direct-write injection, rename-aside, exclusive-create race), 23 atomic entries, evidence logs committed. Designed SPEC-v3 "stationmaster" interactively with PO: mirror-vs-relay dialectic (PO's one-way-flow axiom §3.1 + PO's own true-mirror refutation §3.2), four-inbox route model with derived attribution, hub topology. All 11 design concerns DECIDED — two substrate-verified in-session (Tests #5/#6), nine PO-ratified.

### Outcomes shipped

| Artifact | Δ | Notes |
|---|---|---|
| `poc/ghost-bridge/TRUTHS.md` | NEW | 23 version-stamped entries; Invalidated section opened (I-1) |
| `poc/ghost-bridge/SPEC-v3.md` | NEW | Design complete, D1–D11 ⬛ |
| `poc/ghost-bridge/evidence-*` | NEW | 6 watcher logs / summaries |
| `docs/health-report-hr-devs-ghost-members-claim-2026-06-09.md` | committed | Medici's dispatch-finding audit chain (S47/48 boundary) |
| `roster.json` | M | fable-5 pins; ghosts removed (dispatch finding) |

### Decisions (PO-ratified)

[DECISION — S48] Proceed on `claude-fable-5[1m]`; roster pins follow runtime.
[DECISION — S48] Redesign ghost-bridge from scratch; empirical tests first, atomic truths saved; prior history untrusted.
[DECISION — S48] SPEC-v3 §3.1 one-way-flow axiom; §3.2 true-mirror REJECTED (drain-back wipe race + contested-target ambiguity); replication unit = entry, never file state.
[DECISION — S48] D1 consume-by-atomic-rename (Test #5); D11 inject via verify-empty→rename-aside→exclusive-create (Test #6); D2 at-least-once; D3 hub topology w/ per-endpoint executors; D4–D10 per SPEC-v3.

### NEXT-SESSION BOOT (re-orient instructions for S49)

1. Read `startup.md` first (always). Steps 1–5 — BUT see item 5 before restoring/sanitizing inboxes for any team you'll spawn agents into.
2. **Pull `mitselek-ai-teams` repo** for external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **PO's stated S49 task: find an always-on host for stationmaster.** Prep: D10 requirements (Ubuntu, systemd, outbound ssh to team hosts, `~/.claude` on one filesystem). Candidates to evaluate: hr-devs bare metal (100.96.54.170), apex container host, TPS-601 pipeline boxes (ITSD-38884 still gates CF-admin tasks; Tõnu owns TPS-604 tunnel+DNS). Cross-check Jira movement first.
5. **Inbox restore/sanitize is now HAZARDOUS-UNVERIFIED** on 2.1.170 (I-1): restored entries in a spawned agent's inbox may re-deliver (drain ignores read flags — untested). Before first spawn: either test with a scratch entry, or restore that agent's inbox as `[]`. Volta-grade procedure revision pending.
6. **If PO greenlights implementation:** delegate `stationmaster.py` to a specialist (Herald = protocol fit, Brunel = containment fit) against SPEC-v3 verbatim; first implementation gate = T6.a race harness on Ubuntu.
7. **If PO gives the go on the GitHub issue** (undocumented retention flip): draft from TRUTHS.md I-1 + probe-1b evidence + 2.1.166–170 bracket; PO reviews before filing (outward-facing).
8. **If Cal spawns:** Protocol A batch — Medici's dispatch-finding draft (in health report) + S48 substrate truths (T-entries are wiki-grain).

### Standing watch items going into session 49

- **Stationmaster host hunt** — S49 primary (PO-stated).
- **TPS-601 Epic / ITSD-38884** — check Jira; gate for any TPS-hosted stationmaster option.
- **Lifecycle-scripts revision** (persist/restore/sanitize vs I-1) — Volta-grade, blocks confident agent spawning.
- **Phantom-brunel anomaly** — file-driven notification path suspicion; candidate probe when Volta/Cal active.
- **A1 evidence-cycle audit OVERDUE** (since S44) — surface if no higher-priority work.
- **hr-devs:** relay Medici's final one-liner if not yet sent; return-path test pending their TeamCreate session; ask their CLI version (T1.b replication datapoint).
- **Unchanged:** ELEX human ask (Denis Labunets / Anna Voronina), Entu #42 wait-on-Argo, formula A/B experiment, #8 prompt-edits batch, article/Schliemann, Arhitecture #9–#13, round-3 candidate parked.

(*FR:Aen*)

---

### [PROCESSED 2026-06-10] 2026-06-09 — session-47 → session-48

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S48 read):**

- **State of play:** S47 closed 2026-06-09 — two tracks: (1) Cross-team intel for apex — VEO-56 AC-7 Infoset confirmed out-of-DB via 3 Confluence sources, hint relayed to apex-lead-ghost; ELEX zero Confluence hits, needs human ask. (2) Ghost-bridge v2 — daemon upgraded from single-pair to multi-pair, hr-devs comms bridge established. FR→hr-devs confirmed working (ping delivered+read). Return path untested — hr-devs wasn't in team harness (plain CLI session). Will work when they run a proper TeamCreate session.
- **Ghost-bridge v2 shipped.** `ghost-bridge.py` iterates all `pairs[]` each cycle; `ssh_exec` handles keyless connections (bare metal). `hr-devs-lead-ghost` added to roster + runtime. Live config has both pairs (fr-apex + fr-hr-devs). Gist with hr-devs setup instructions: `https://gist.github.com/mitselek/7360d87c8060b3fc9a5212598fc6c839`.
- **VEO-56 AC-7 hint sent to apex.** Infoset = infrastructure layer (ssp/llp/piilur servers, IBM MQ, FTP/SFTP scripts by Roland Kilusk). DB relationship is one-way inbound ("Info tuleb sisse läbi INFOSET"). ELEX = zero signal anywhere. Three Confluence pages cited: 1041727537, 1459716113, 615448619.
- **hr-devs ghost-bridge gotcha:** Their team-lead confirmed `fr-lead-ghost` is in runtime config.json, but SendMessage fails from plain CLI (not TeamCreate-managed). The bridge will work in their normal team sessions. No code fix needed — architecture constraint.
- **Lifecycle scripts hardened.** `persist-inboxes.sh`: per-file error handling, skips corrupt filenames (was killed by `\r`-in-filename artifact + `set -e`). `restore-ghost-members.sh`: EXISTS defaults to 0 on empty jq output (was `[: : integer expression expected]`). Corrupt `apex-lead-ghost\r.json` cleaned from repo.
- **All prior S46 watch items carry forward unchanged** — TPS-601 Epic (7 tasks), Entu #42 wait-on-Argo, formula A/B experiment, #8 prompt-edits batch, A1 evidence-cycle audit OVERDUE, substrate anomalies, ITSD-38884, article/Schliemann, ghost-bridge auto-restart (now v2), Arhitecture #9-#13, round-3 candidate parked.

---

## SESSION 47 WRAP — 2026-06-09 (VEO-56 AC-7 cross-team intel + ghost-bridge v2 multi-pair + hr-devs comms bridge)

**Spans:** 2026-06-08 → 2026-06-09, single session. Parent on Opus 4.6 (roster intent).

**Outcome:** Two tracks, no agents spawned. (1) **Cross-team intel** — PO asked if S46's EVR ticket/doc skim could help apex team on VEO-56 AC-7 (Infoset/ELEX). Searched Confluence, found 3 pages proving Infoset is infrastructure-level (not DB). Relayed to apex-lead-ghost with sources. ELEX = zero hits anywhere, flagged for human ask. (2) **Ghost-bridge v2** — extended daemon from single-pair to multi-pair (iterates all `pairs[]`), fixed `ssh_exec` for keyless SSH (bare metal), added `remote_team_name` config field for deployment-alias/team-dir decoupling. Added `hr-devs-lead-ghost` to roster. Created gist with setup instructions for hr-devs side. PO mediated brief. hr-devs confirmed prereqs, registered ghost in runtime. FR→hr-devs ping delivered+read. Return path blocked by hr-devs running plain CLI (not team harness) — will work in their normal sessions.

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `poc/ghost-bridge/ghost-bridge.py` | M | Aen | v1→v2: multi-pair poll loop, keyless SSH, remote_team_name override |
| `poc/ghost-bridge/ghost-bridge.config.example.json` | M | Aen | Added fr-hr-devs pair template |
| `roster.json` | M | Aen | Added hr-devs-lead-ghost (ghost, ssh-bridge) |
| Gist: hr-devs setup instructions | NEW | Aen | https://gist.github.com/mitselek/7360d87c8060b3fc9a5212598fc6c839 |
| VEO-56 AC-7 cross-team message | NEW | Aen | Sent to apex-lead-ghost with 3 Confluence source citations |

### Decisions (PO-ratified)

[DECISION — S47] **Extend ghost-bridge daemon to multi-pair (v2) rather than running separate instances.** Single process polls all pairs each cycle. Simpler ops.

[DECISION — S47] **VEO-56 AC-7 Infoset = confirmed out-of-DB.** Three Confluence sources (ITOps 1041727537, WSO2 1459716113, VJS 615448619). ELEX = zero signal, needs human confirmation.

[DECISION — S47] **hr-devs ghost: skip lore block.** hr-devs roster doesn't use lore on any member. Functional fields only (name, agentType, backendType, color). Roster PR as standalone branch (atomic PRs on collaborator repos).

### NEXT-SESSION BOOT (re-orient instructions for S48)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO asks about hr-devs bridge status:** FR→hr-devs confirmed. Return path untested — next test when hr-devs runs a TeamCreate session. Daemon is v2, live config has both pairs.
5. **If PO asks about VEO-56 / apex progress:** AC-7 hint sent S47. Check apex-lead-ghost inbox for reply. ELEX still needs human ask (Denis Labunets or Anna Voronina).
6. **If PO asks about TPS-601 / container pipeline:** check Jira for movement. ITSD-38884 (Ain) is still the gate. Tõnu owns TPS-604 tunnel+DNS.
7. **If PO wants Celes for guild/persona work:** spawn her. Open carry: formula A/B experiment, persona-deploy-on-Argo (#42), #8 prompt-edits batch.
8. **A1 evidence-cycle audit is OVERDUE** — carried since S44. Surface to PO if no higher-priority work.

### Standing watch items going into session 48

- **TPS-601 Epic (7 tasks)** — check Jira for movement. ITSD-38884 (Ain, "Analysis" since May 27) is the gate.
- **Entu #42 wait-on-Argo** — no change S47.
- **#8 prompt-edits batch** — Celes has diffs, team-lead applies. LOW priority.
- **A1 evidence-cycle audit OVERDUE** — carried forward unchanged since S44.
- **Substrate anomalies** — task-state stale-replay (S42-S44) + peer-DM lag. Not investigated S47.
- **Ghost-bridge v2 running** — daemon PID on Windows dev machine. Auto-restart watch still applies (no systemd on Windows; daemon dies on reboot/sleep).
- **hr-devs return-path test** — pending their next TeamCreate session.
- **ELEX human ask** — Denis Labunets or Anna Voronina. No Confluence signal at all.
- **Remaining unchanged:** article/Schliemann, Arhitecture #9-#13, round-3 candidate parked.

(*FR:Aen*)

---

### [PROCESSED 2026-06-09] 2026-06-08 — session-46 → session-47

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S47 read):**

- **State of play:** S46 closed 2026-06-08 — two tracks: (1) Celes reviewed topic 10 "Persona anchor selection" section, approved with 4 adjustments (all applied); (2) PO-driven container pipeline mapping — TPS-601 converted to Epic with 7 RACI-based child tasks (TPS-604→610), blocking links set, ITSD-38884 linked as blocker, ITSD-37672 linked as predecessor. ITOps space scanned (250 pages), RACI filled with real names: Tõnu Tammer (CF admin), Roland Kilusk (Sysops), Ruth Türk (Tech lead), Mihkel (Developer).
- **Topic 10 adjustments landed (Celes S46 review):** (1) case-2 "Always design both" softened to "by default when results-accumulation channel exists"; (2) n-inflation caveat on evidence table (4 Anderson rows = within-persona, not independent); (3) claims-need-backing bridged to three-way taxonomy (genus/species); (4) wording fix §178 — experiment relaxes "state guardrail twice", not anchor preference.
- **Container pipeline fully mapped in Jira.** Epic TPS-601 → 7 tasks with assignees + blocking chain. Critical path: TPS-604 (tunnel+DNS) → TPS-607 (compose) → TPS-608 (swarm) → TPS-609 (decommission). ITSD-38884 (CF token permission, Ain Simsalu, "Analysis" since May 27) blocks the CF admin tasks. Konteinerid page (1114800137) in ITOps Confluence is EMPTY placeholder — future landing spot.
- **Celes item (0) DONE.** Her scratchpad updated. Remaining carry: formula A/B experiment (runnable, not run), persona-deploy-on-Argo-response, #8 prompt-edits batch.
- **All prior watch items carry forward** — Entu #42 wait-on-Argo, #8 prompt-edits batch (Celes has diffs), A1 evidence-cycle audit OVERDUE, substrate anomalies (task-state stale-replay S42-S44 + peer-DM lag), ITSD-38884 (now linked to TPS-601), article/Schliemann, ghost-bridge auto-restart, Arhitecture #9-#13, round-3 candidate parked. TPS-601 upgraded from watch to active Epic.

---

## SESSION 46 WRAP — 2026-06-08 (Topic 10 Celes review + container pipeline RACI mapping)

**Spans:** 2026-06-08, single session. Parent on Opus 4.6 (roster intent).

**Outcome:** Two tracks. (1) **Topic 10 design-lead review** — Celes reviewed the S45 "Persona anchor selection" section, approved with 4 non-blocking adjustments (case-2 softening, n-inflation caveat, genus/species bridge, wording fix). All 4 applied to `topics/10-guild-specialists.md`. (2) **Container pipeline RACI mapping** — PO-driven. Scanned ITOps Confluence space (250 pages). Found ITSD-37672 (original container request, Roland Kilusk, Closed). Mapped RACI to real people. Converted TPS-601 to Epic, created 7 child tasks with assignees and blocking links. Linked ITSD-38884 as blocker, ITSD-37672 as predecessor.

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `topics/10-guild-specialists.md` | M | Aen (Celes diffs) | 4 adjustments from design-lead review |
| TPS-601 Epic + 7 child tasks | NEW | Aen | TPS-604→610, RACI-based, blocking links |
| ITSD-37672 → TPS-601 link | NEW | Aen | Predecessor container request |
| ITSD-38884 → TPS-601 blocker link | NEW | Aen | CF token permission blocks CF admin tasks |

### Decisions (PO-ratified)

[DECISION — S46] **Celes's 4 topic-10 adjustments approved and applied.** Case-2 softened ("by default when results-accumulation channel exists"), n-inflation caveat added, genus/species bridge sentence added, §178 wording corrected to match EXPERIMENT.md. No Cal wiki duplicate needed — topic 10 is canonical home.

[DECISION — S46] **TPS-601 RACI filled with real names.** IT/CF admin = Tõnu Tammer (TPS-577 assignee, CF super-admin); Sysops/Infra = Roland Kilusk (built original container ITSD-37672); Tech lead = Ruth Türk (VJS 2 lead, VEO-4 assignee); Developer = Mihkel Putrinš.

[DECISION — S46] **Skip story points on TPS-601 sub-tasks.** One-off ops tasks across 4 people/3 teams — value is assignee + acceptance criteria + dependency chain, not velocity tracking.

### NEXT-SESSION BOOT (re-orient instructions for S47)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO asks about container/TPS-601 progress:** check Jira status of TPS-604→610 + ITSD-38884. Critical path starts with Tõnu (TPS-604 tunnel+DNS) and Ain (ITSD-38884 token permission). Report what moved.
5. **If PO wants Celes for guild/persona work:** spawn her. Open carry: formula A/B experiment (Hamblin∥Harrison, runnable but not run), persona-deploy-on-Argo (#42), #8 prompt-edits batch (she has diffs, team-lead applies).
6. **If PO wants Entu #42 progress check:** check GitHub issue status. Argo response still pending as of S46. 3 deferred persona domains (auth/schema/formula) gated on his buy-in.
7. **First operational item if research-spawning:** A1 evidence-cycle audit is OVERDUE (carried since S44). Surface to PO if no higher-priority work.

### Standing watch items going into session 47

- **TPS-601 Epic (7 tasks)** — check Jira for movement. ITSD-38884 (Ain, "Analysis" since May 27) is the gate for CF admin tasks. Tõnu owns TPS-577 + TPS-604/605/606.
- **Entu #42 wait-on-Argo** — no change S46. Whole persona tree is worked-draft until Argo buys in.
- **#8 prompt-edits batch** — Celes has diffs, team-lead applies. LOW priority, none blocking.
- **A1 evidence-cycle audit OVERDUE** — carried forward unchanged since S44.
- **Substrate anomalies** — task-state stale-replay (S42-S44) + peer-DM lag. Not investigated S46.
- **Konteinerid Confluence page (1114800137)** — empty placeholder in ITOps space "Serverite sandard". Future landing spot for VEO-4 container standard.
- **Remaining unchanged:** article/Schliemann, ghost-bridge auto-restart, Arhitecture #9-#13, round-3 candidate parked.

---

## [PROCESSED 2026-06-08] SESSION 45 WRAP — 2026-06-08 (AC4 passed — Anderson + MCP validated end-to-end; topic 10 evolved with A/B instrumentation pattern + claims-need-backing meta-pattern)

**Spans:** 2026-06-08, single session. Parent on Opus 4.6 (roster intent).

**Outcome:** Two work tracks in one session. (1) **AC4 live MCP test** — spawned Anderson as fresh-context agent against PR #46 with arch-docs MCP connected (528 docs). All three AC4 criteria passed: real MCP sources cited, competency gates fired (UNVERIFIED caveats + Proposed-status discipline + GAP flags), zero fabricated links. Review + assessment posted to PR #46; VEO-51 Jira cross-reference posted. (2) **Framework design principle evolution** — PO-led discussion generalised the persona anchor choice from a binary rule to a three-case spectrum with a reusable A/B twin-design pattern. Named the "claims-need-backing" meta-pattern connecting nfr.yaml (system declarations) and competency gates (agent assertions). Landed in topic 10.

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| [PR #46 Anderson review](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46#issuecomment-4646001165) | NEW | Anderson (Aen posted) | AC4 live MCP test — 7 findings, 9 MCP sources, 2 GAP flags, zero fabrication |
| [PR #46 AC4 assessment](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46#issuecomment-4646003424) | NEW | Aen | Scorecard + observations on competency-gate pattern |
| VEO-51 Jira comment | NEW | Aen | Claims-need-backing cross-reference with backlinks to PR #46 |
| `topics/10-guild-specialists.md` | M | Aen | New section: persona anchor selection — A/B instrumentation pattern + claims-need-backing meta-pattern + evidence table |
| `memory/celes.md` | M | Aen | Carry-forward item (0): brief on topic-10 evolution |

### Decisions (PO-ratified)

[DECISION — S45] **Persona anchor selection is a three-case spectrum, not a binary.** (1) Obviously method-only roles → Pattern A, no A/B. (2) Field-expert personas where both anchors viable → always design both as twins (identical scaffold, persona sole variable). (3) Domain-fact roles with full gates → Pattern B + full gate stack. Replaces the flat "always method-famous" rule from §2.4.

[DECISION — S45] **A/B twin-design pattern adopted as standard for field-expert personas.** Four parts: twin design (identical everything except persona.md), contamination isolation (twins don't reference each other), opt-in dispatch (dispatch layer surfaces twin to clients), results accumulation (comparisons flow back to framework team).

[DECISION — S45] **"Claims-need-backing" named as a meta-pattern.** nfr.yaml declarations pending evidence and agent assertions pending competency-index grounding are the same epistemic shape at different substrates. Cross-referenced on VEO-51 Jira.

### Substantive learnings

[LEARNED — framework, promotion-grade] **The verification layer is what separates a claims register from an assurance system.** Both nfr.yaml and competency-gated personas are "shape-valid claims pending truth-check." The gap between declaration and verification is where failures live — whether the declarer is a repo's nfr.yaml or an AI persona's domain claim. Naming this as a meta-pattern makes it transferable beyond the guild context.

[LEARNED — framework] **AC4 validates gates, not anchor choice.** Anderson (domain-fact-famous) + full gates = clean output. But this does NOT tell us whether persona fame independently causes bypass at standard guardrail levels. The Hamblin ∥ Harrison experiment (standard guardrail, persona sole variable) is the separable, not-yet-run test.

[LEARNED — process] **The opt-in research ask is the accumulation strategy.** Instead of running one A/B experiment and deciding, every field-expert persona design becomes an instrumented experiment. Clients with budget run both twins; results flow back. Cross-domain evidence accumulates incrementally.

### Standing watch items going into session 46

- **All S44 watch items carry forward unchanged** — Entu #42 wait-on-Argo, #8 prompt-edits (Celes has diffs), A1 evidence-cycle audit OVERDUE, substrate anomalies (task-state stale-replay S42-S44 + peer-DM lag), TPS-601, ITSD-38884, article/Schliemann, ghost-bridge auto-restart, Arhitecture #9-#13, round-3 candidate parked.
- **NEW — Topic 10 A/B section needs Celes review.** She's the design lead for §2.4 / guild work. Her scratchpad has carry-forward item (0).
- **Hamblin ∥ Harrison experiment** — designed, not run. Referenced from topic 10 evidence table. Trigger: competency index populated + PO direction.

### NEXT-SESSION BOOT (re-orient instructions for S46)

1. Read `startup.md` first (always). Steps 1-5. **Step 0.5 model gate:** roster pins 4.6; S45 ran 4.6 — verify before TeamCreate.
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S46 read.
3. **Pull `mitselek-ai-teams`.** Don't pre-spawn; wait for PO direction.
4. **If PO wants Celes review of topic-10 evolution:** spawn Celes. Her scratchpad item (0) orients her. She may adjust the A/B section, challenge the three-case spectrum, or propose refinements to the twin-design pattern.
5. **If Argo responded on #42:** trigger to deploy personas. Spawn Celes. Mind: ai-teams is private; submit via comment/PR/gist.
6. **If PO wants Hamblin ∥ Harrison run:** populate formula competencies.yaml first, then dispatch both variants on shared formula probes. See `formula-engine-EXPERIMENT.md`.
7. **If PO surfaces #8 prompt-edits:** Celes has diffs ready (~10 min, one pass).
8. **A1 evidence-cycle audit is OVERDUE** — raise if not surfaced.
9. **If Cal spawns:** substrate queue includes task-state stale-replay (S42-44) + peer-DM lag (S44).
10. **If PO surfaces Arhitecture #1 AC4 follow-up:** AC4 passed S45. Issue already closed. Anderson's F1 (CI schema fetch integrity) and F5 (security_level omission) are genuine catches worth raising with valerikevr if PO wants.
11. **Unchanged externals/dormant** — TPS-601, ITSD-38884, article/Schliemann, ghost-bridge auto-restart, Arhitecture #9-#13, round-3 candidate, TPS-583/mVox-dev/Manager-team dormant.

(*FR:Aen*)

---

### [PROCESSED 2026-06-08] 2026-06-06 — session-44 → session-45

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S45 read):**

- **State of play:** S44 closed 2026-06-06 — long, productive **extra/home-PC session**, ran on **Opus 4.8** (PO call: this Entu task is outside the S35–S43 4.6-comparability line; roster intent still 4.6 → **re-run Step 0.5 model gate at S45**). Productized the topic-10 guild pattern for the **Entu platform** ([entu/api #42](https://github.com/entu/api/issues/42)) end-to-end: (1) **architecture spec** `docs/2026-06-06-entu-consultant-agents-architecture.md` — competency-index spine, 5-element container w/ persona anchor + posture-not-facts guardrail — committed + **posted to #42** ([live comment](https://github.com/entu/api/issues/42#issuecomment-4638828820)); (2) **gap-loop revised to the signal-producer model** (PO correction: don't engineer around Entu's broken triage; the loop produces signal, Entu owns remediation; issue-default, PR channel-neutral); (3) **cast 4 personas** in `designs/new/entu-consultant-agents/` — data-lifecycle **fully populated** (18 evidence-backed claims + known-gaps block). Cal schema at `wiki/contracts/entu-competency-index-schema.md`. Commits: c6d09d9, c99776a, eea17d6, 5ca637f, 1d28d2c.
- **#42 — WAIT ON ARGO (PO decision):** the architecture proposal is posted but **unanswered (it was fresh, ~16:20)**. Trigger for next move = **Argo's response** → then deploy/PR the personas (committed + ready) + offer the full populated set. Do NOT push unsolicited. `agents/`-location is Argo's open Q (spec §7.1); `mitselek/ai-teams` is **private** so personas aren't linkable — submitting later = comment/PR/gist (public).
- **NEW research artifact — formula A/B experiment (ready to run, not yet run):** `designs/new/entu-consultant-agents/formula-engine-EXPERIMENT.md`. **Hamblin** (domain-fact-famous = treatment) ∥ **Harrison** (method-famous = control), BYTE-IDENTICAL scaffold + guardrail, **persona the sole variable** (guardrail deliberately NOT doubled for Hamblin — that's the control). Tests spec §2.4: does a domain-fact-famous anchor induce more index-bypass/fabrication? Run later (field use or follow-up trial); either outcome is a real result.
- **Substrate anomalies climbing (Cal filing candidates):** **task-state stale-replay reproduced TWICE more in S44** (Finn correctly rejected late re-deliveries of the Task #1 and Task #5 assignments). **Peer-DM lag** again (Cal never received Finn's 15:47 DM; worked from the on-disk digest instead). n now spans S42–S44 for both.
- **All prior watch items carry forward** — **#8 prompt-edits batch** (Celes has diffs: `kind:external` + G1 brunel + C2 aeneas), **A1 evidence-cycle audit OVERDUE** (S40-42 window long closed — raise with PO), **Arhitecture #1 AC4 still NOT done** (needs org-sub arch-docs MCP; S44 ran on personal sub), TPS-601, ITSD-38884, article/Schliemann, ghost-bridge auto-restart, Arhitecture #9-#13 external, round-3 candidate parked.

---

## SESSION 44 WRAP — 2026-06-06 (Entu product-native consultant agents productized: spec posted to #42, gap-loop revised to signal-producer, 4 personas cast incl. a Hamblin∥Harrison A/B experiment)

**Spans:** 2026-06-06, one long session (extra/home-PC). Parent on **Opus 4.8** (PO call — outside the 4.6 comparability line; roster intent stays 4.6).

**Outcome:** Took the PO's fresh entu/api #42 idea ("ship product-native AI consultant agents alongside Entu") and executed it end-to-end as topic-10 guild work. Brainstormed the architecture (competency-index spine, approach B), built it via Celes (design lead) + Finn (grounding) + Cal (schema), posted the proposal to #42, then **revised the whole gap-loop** when the PO correctly rejected the PR-over-issue bias as "engineering around Argo's broken triage." Then cast the 4 personas, with the formula-engine deliberately built as a **controlled A/B experiment** (Hamblin vs Harrison) to test the §2.4 selection rule. Everything committed + pushed; the live #42 comment kept in sync through two revisions. Personas held internally pending Argo's response (PO decision).

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `docs/2026-06-06-entu-consultant-agents-architecture.md` | NEW | Celes | Full architecture/spec; competency-index spine; 5-element container + persona-anchor guardrail; signal-producer gap-loop |
| `docs/2026-06-06-entu-42-proposal-comment.md` + **posted to [#42](https://github.com/entu/api/issues/42#issuecomment-4638828820)** | NEW | Celes (Aen posted) | Digestible proposal; revised to channel-neutral; live comment in sync |
| `teams/framework-research/docs/2026-06-06-entu-consultant-grounding-digest.md` | NEW | Finn | Real entu/api Nitro routes (corrected #42's `src/api` path sketch); PoC trail; mvox notes |
| `teams/framework-research/docs/2026-06-06-data-lifecycle-competency-harvest.md` | NEW | Finn | 18 artifact-backed claims (16 backed / 2 partial) + 4 flagged gaps |
| `wiki/contracts/entu-competency-index-schema.md` (+card) | NEW | Cal | Claim→evidence index; 5-rung method ladder w/ maintainer-authoritative apex; stance field |
| `wiki/patterns/citation-backed-beats-posture-backed-when-fact-is-subtle.md` (+card) | NEW | Celes/Cal | Protocol-A pattern; stage-2 **confirmed** (Finn+Celes read-backs) |
| `designs/new/entu-consultant-agents/` (21 files + EXPERIMENT.md) | NEW | Celes | 4 personas; data-lifecycle populated; formula A/B pair |

### Decisions (PO-ratified)

[DECISION — S44] **Run S44 on Opus 4.8** — Entu task is outside the 4.6 review-experiment comparability line; roster intent unchanged (4.6).
[DECISION — S44] **Architecture spine = the competency index (approach B)** — auditable claim→evidence store; prompts are thin consumers; persona anchors posture/voice never facts.
[DECISION — S44] **Gap-loop is a signal producer, NOT a remediation service.** Issue-default, PR channel-neutral. Acting on gaps is Entu's pipeline; we do NOT engineer around Argo's triage (the PR-over-issue bias was removed). The surviving kernel is report *quality* (evidence + suggested fix), channel-agnostic.
[DECISION — S44] **Persona selection rule: figures famed for method/posture, never domain-fact authority** (avoids the Anderson fabrication trap). Cast: Pérotin (data-lifecycle, reused), Phileas Fogg (auth), Linnaeus (schema), Hamblin∥Harrison (formula A/B).
[DECISION — S44] **Formula-engine = a deliberate A/B experiment** ("design both now, compare later"), guardrail held constant as the control.
[DECISION — S44] **Hold personas internally; wait for Argo's #42 response** before any submission. No unsolicited push.
[DECISION — S44] **Source competency claims by harvesting mvox's repo, not consulting the dormant team** — the repo notes are mvox's experience in artifact-backed (higher-provenance) form. Consult only on flagged gaps. **PO: leave all 4 flagged gaps documented, no consult.**

### Substantive learnings

[LEARNED — framework] **"Don't design your architecture to remediate another party's broken pipeline."** The PR-over-issue bias (born of #42's own "issues get ignored at Entu" observation) was a category error: it burdened our agents, assumed PR permissions we lack, and entrenched the maintainer's bad habit by absorbing its cost. Correct shape: the loop *emits* evidence-backed signal; the platform owns acting on it; a stalled pipeline is itself a surfaced signal.
[LEARNED — process] **Multi-layer verification caught a real slip:** Finn's harvest *prose summary* (13/3) disagreed with his actual *claim blocks* (16/2); Celes caught it folding the bodies (ground truth), flagged it; Cal + team-lead reconciled. Documentation-vs-ground-truth divergence in miniature — caught downstream, no over-claiming reached the artifact.
[LEARNED — process] **Honest gap-flagging is the differentiator made concrete.** Finn left G3 (handbook-vs-code `_inheritrights` contradiction) + G4 (rate-limiting absence) **unfiled** rather than assert them; surfaced as a machine-readable `known-gaps` block in the agent artifact (audit-before-hiring). Filing G4 "no rate limits" would have been the exact over-claim the gap-loop guards against.

### Standing watch items going into session 45

- **Entu #42 — wait on Argo** (trigger to deploy personas + populated PR). Personas committed + ready.
- **Formula A/B experiment** — designed + instrumented, pending a comparison run.
- **#8 prompt-edits batch** (Celes has diffs) — unactioned, carries forward.
- **A1 evidence-cycle audit — OVERDUE.** Raise with PO at S45 start.
- **Arhitecture #1 AC4 — still pending** (needs org-sub arch-docs MCP; S44 was personal sub).
- **Substrate anomalies** — task-state stale-replay (n up again, S44 ×2) + peer-DM lag → Cal queue.
- **Unchanged externals/dormant** — TPS-601, ITSD-38884, article/Schliemann, ghost-bridge auto-restart, Arhitecture #9-#13, round-3 candidate, TPS-583/mVox-dev/Manager-team dormant.

### NEXT-SESSION BOOT (re-orient instructions for S45)

1. Read `startup.md` first (always). Steps 1-5. **Step 0.5 model gate:** roster pins 4.6; S44 ran 4.8 (one-off for the Entu task) — verify what the PO wants for S45 before `TeamCreate`.
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S45 read.
3. **Pull `mitselek-ai-teams`.** Don't pre-spawn; wait for PO direction.
4. **If Argo responded on #42:** that's the trigger — spawn Celes, deploy/PR the personas (committed in `designs/new/entu-consultant-agents/`), offer the full populated set. Mind: `agents/`-location is Argo's call (spec §7.1); ai-teams is private (submit via comment/PR/gist).
5. **If PO wants the formula A/B run:** spawn fresh-context probe agents (S42 Option-A style) against both variants on shared formula probes; populate a minimal formula index first; score fabrication / index-citation / [GAP]-flagging. See `formula-engine-EXPERIMENT.md`.
6. **If PO surfaces #8 prompt-edits:** Celes has the diffs ready (~10 min, one pass).
7. **A1 evidence-cycle audit is OVERDUE** — raise if not surfaced.
8. **If Cal spawns:** substrate queue now includes task-state stale-replay (S42-44) + peer-DM lag (S44).
9. **If PO surfaces Arhitecture #1 AC4 / #9-#13 / TPS-601 / ITSD-38884 / article / ghost-bridge:** unchanged procedures per prior boot items.

(*FR:Aen*)

---

### [PROCESSED 2026-06-06] 2026-06-05 — session-43 → session-44

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S44 read):**

- **State of play:** S43 closed 2026-06-05 (~14:22–15:03, single session, ran on Opus 4.6 per roster intent). **#74 reflexive competency gap analysis COMPLETE and RATIFIED (D1–D6 approved).** Headline framework finding: "the competency gate is two mechanisms wearing one name" — claim→backing mapping (generalizes) + runtime gap-reaction (citation-only). Three-way taxonomy (citation/substrate/posture-backed) landed in topic 10. Medici's audit found 0/10 FR roles cite external authority → whole-roster YAGNI + one `[ORPHAN-CLAIM]` scan (landed as Medici's 6th audit category in `prompts/medici.md`). No prompt edits required by the design.
- **One deferred task (#8):** bundled post-#74 prompt-edits batch — `kind:external` tags (1b) + G1 (brunel.md missing-artifact surface-back) + C2 (aeneas.md work-hub bilateral wiring). All LOW, Celes proposes diffs / team-lead applies. One review pass.
- **Substrate anomalies now n≥2 across S42/S43 (Cal filing candidates):** peer-DM delivery lag/stall ("disk inbox ≠ delivery truth") + task-state-loss with stale replays. Both reproduced this session.
- **All S42 watch items carry forward unchanged** — TPS-601 (no assignee), ITSD-38884, article draft awaiting Schliemann, ghost-bridge auto-restart gap, A1 evidence-cycle audit S40-42 (DUE!), S35 standing watch, TPS-583/mVox-dev/Manager-team dormant. Arhitecture #9-#13 external. Round-3 candidate parked.
- **NEW — Arhitecture #1 AC4 (live MCP test) ready for S44:** arch-docs MCP was unreachable from personal sub (404 on `/mcp`); S44 runs on org sub where MCP is available. Spawn Anderson against PR #46 (NFR convention, strong regulatory surface). AC3 is fully resolved (all 6 sources catalogued/held per #1 comments). Anderson persona prompt fetched and verified (competency gates + MCP repoints all in place). PR #46 still open.

---

## SESSION 43 WRAP — 2026-06-05 (#74 reflexive competency gap analysis: designed, audited, ratified D1–D6; topic 10 updated; [ORPHAN-CLAIM] landed)

**Spans:** 2026-06-05 ~14:22 → ~15:03. Single session, ~40 min active. Parent on Opus 4.6 (roster intent).

**Outcome:** #74 executed end-to-end in one session. Celes (lead) + Medici (second lens) converged on a clean design: the guild competency gate is two separable mechanisms; FR's standing roster needs only the audit half (Medici's existing coherence pass + one new orphan-claim scan). 0/10 FR roles cite external authority → whole-roster YAGNI. Three-way taxonomy (citation/substrate/posture-backed) promoted to topic 10. One prompt edit landed (`[ORPHAN-CLAIM]` in medici.md). PO ratified D1–D6. Three LOW optional prompt edits deferred as one bundled task (#8).

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `docs/2026-06-05-competency-gap-analysis.md` | NEW | Celes | Design doc answering PO's 3 questions + D1–D6 decision list |
| `docs/health-report-competency-gap-2026-06-05.md` | NEW | Medici | Per-prompt claim→backing audit, 10/10 backed, 4 LOW gaps |
| `prompts/medici.md` | M | Medici | `[ORPHAN-CLAIM]` 6th audit category (§6, lines 53-57) |
| `topics/10-guild-specialists.md` | M | Celes | Three-way taxonomy subsection + resolved "retainer QA" open question |
| memory/celes.md | M | Celes | S43 checkpoint, carry-forward for #8 |
| memory/medici.md | M | Medici | S43 checkpoint |

### Decisions (PO-ratified)

[DECISION — S43] **D1: Competency-gap detection = profile of Medici's existing audit + one orphan-claim sub-check.** "The audit is the gate." Not runtime gates in standing prompts.

[DECISION — S43] **D2: No new per-agent artifact class.** Single Medici-owned baseline table. Not wiki, not competencies/ tree, not frontmatter.

[DECISION — S43] **D3: Single policy — proactive ONCE (baseline audit, done), YAGNI thereafter.** 0 external-citing FR roles → proactive arm has no target. Orphan-claim scan = 1 checklist line + `kind: external` tags.

[DECISION — S43] **D4: No prompt edits required.** Two LOW optional mirrors (G1/C2) offered separately.

[DECISION — S43] **D5: Auditor owns the competency map (Medici, not Celes).** Closes topic-10 "marking your own homework" open question.

[DECISION — S43] **D6: Standalone until ratified; promote to topic 10 post-ratification.** (Promoted this session.)

### Substantive learnings

[LEARNED — framework, promotion-grade] **The competency gate is two mechanisms wearing one name.** Claim→backing mapping generalizes to any roster (cheap audit). Runtime gap-reaction loop does NOT generalize beyond citation-bearing dispatch roles. Three-way taxonomy: citation-backed → runtime gate; substrate-backed → substrate-truth-read; posture-backed → periodic audit only. FR independently re-derived mechanism #2 as three-layer-substrate-truth — convergence proves taxonomy is discovered, not invented.

[LEARNED — process] **Don't bucket roles on assumed properties.** Celes's first-draft 5/5 split assumed external-citation; Medici's audit showed 0/10. Wait for audit data before taxonomy.

[LEARNED — process] **Orphan-claim scan is genuinely new vs coherence audit.** A claim backed by an external body-of-knowledge with no in-repo artifact has nothing to be inconsistent WITH — invisible to artifact-vs-artifact coherence. The `[ORPHAN-CLAIM]` category fills this gap.

[LEARNED — substrate] **Peer-DM lag + task-state-loss both reproduced S42→S43 (n≥2).** Cal filing candidates when he next spawns.

### Standing watch items going into session 44

- **All S42 watch items carry forward unchanged** — TPS-601, ITSD-38884, article/Schliemann, ghost-bridge auto-restart, A1 evidence-cycle audit (DUE!), S35 standing watch, Aen amendment Part C, TPS-583/mVox-dev/Manager-team dormant.
- **NEW — Task #8 (bundled post-#74 prompt-edits):** 1b `kind:external` tags + G1 brunel.md + C2 aeneas.md. Celes proposes, team-lead applies. One pass.
- **#74 CLOSED** on GitHub (S43).
- **NEW — Arhitecture #1 AC4:** live MCP test ready. Anderson + PR #46. Needs org sub (arch-docs MCP).
- **NEW — Substrate anomalies n≥2 for Cal:** peer-DM lag, task-state-loss. Sources: S42 wrap + S43 closing reports.
- **Arhitecture #9-#13** external — unchanged.
- **Round-3 candidate parked** — panel expansion hypothesis.

### NEXT-SESSION BOOT (re-orient instructions for S44)

1. Read `startup.md` first (always). Steps 1-5. **Step 0.5 model gate:** roster pins 4.6; S43 ran 4.6 — verify before TeamCreate. **S44 runs on org subscription** — arch-docs MCP will be available.
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S44 read.
3. **Pull `mitselek-ai-teams` repo.**
4. **Don't pre-spawn any agent at session start** — wait for PO direction.
5. **Arhitecture #1 AC4 — LIKELY FIRST ASK.** Spawn Anderson (persona prompt at `Eesti-Raudtee/Arhitecture/.claude/agents/ross-anderson.md` on `master`) against dev-toolkit PR #46 (NFR convention). Verify arch-docs MCP is connected (`search_docs` for "NIS2" should return results). AC3 fully resolved — all 6 external sources catalogued/held (EN 50716, ISO 27001 Annex A, NIS2, KüTS, GDPR, OWASP Top 10). The test proves: (a) Anderson cites real MCP-grounded sources, (b) competency gates fire on missing backing, (c) zero fabricated links. If AC4 passes → close Arhitecture #1.
6. **If PO surfaces task #8 (post-#74 prompt-edits):** spawn Celes. She has the diffs ready (1b + G1 + C2). One review pass. ~10 min.
7. **If Cal spawns:** his queue has 2 substrate anomalies at n≥2 (peer-DM lag + task-state-loss; sources: S42 wrap, S43 closing reports, celes.md carry-forward). Plus S42 carryover (idle wake-churn, Wiki-115 v2/v3 instance).
8. **A1 evidence-cycle audit is DUE** (S40-42 window closed) — raise with PO if not surfaced.
9. **If PO surfaces Arhitecture #9-#13 movement / round-3 / TPS-601 / ITSD-38884 / article / ghost-bridge:** unchanged procedures per S42 boot items.

(*FR:Aen*)

---

### [PROCESSED 2026-06-05] 2026-06-05 — session-42 → session-43

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S43 read):**

- **State of play:** S42 closed 2026-06-05 (~12:10–13:45, single session, ran on Opus 4.8 one-off — roster intent stays 4.6, re-run Step 0.5 gate at S43 start). **#73 re-review experiment executed end-to-end and CONFIRMED:** prompt-encoded gates + synergy wiring produce equivalent-or-better reviews than ad-hoc Celes briefing — guild-specialist consultancy is SETUP-ONLY. 5 independent fresh-context reviewers (Option A), 5/5 zero fabrication, both wired consensus pairs reproduced independently, PLUS emergent unwired Booch⟷Leveson cross (FINDING-6 schema bypass, verified real). D7 Action-2 fired 4/4 live → [Arhitecture #10–#13](https://github.com/Eesti-Raudtee/Arhitecture/issues/10). Posted: [PR #45 comment](https://github.com/Eesti-Raudtee/dev-toolkit/pull/45#issuecomment-4630259710) + [PR #46 comment](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46#issuecomment-4630260113) + gist a20d0be updated + topic 10 evidence section. Phase-1 assessment found Action-2 silently dropped from all 5 merged prompts → [Arhitecture #9](https://github.com/Eesti-Raudtee/Arhitecture/issues/9) filed.
- **3 substrate anomalies in one run (Cal filing candidates, details in S42 wrap + celes.md carry-forward):** (1) peer-DM delivery lag/stall, high variance, + "inbox JSON file ≠ delivery truth"; (2) task-list full state loss mid-session (tasks #1/#2 vanished for both lead and specialist); (3) idle wake-churn loop (7+ empty wakes/min on celes post-flush; resolved by graceful shutdown). Plus a live Wiki-115 instance: v2/v3 dispatch-doc treatment divergence (SPAWNED-VERSION NOTE in round2-dispatch-briefs doc).
- **S43 AGENDA IS PRE-DIRECTED (PO, at S42 close): introspection session on [#74](https://github.com/mitselek/ai-teams/issues/74)** — reflexive competency gap analysis on FR's own roster. PO's three framing questions (full elaboration in [#74 comment](https://github.com/mitselek/ai-teams/issues/74#issuecomment-4631002855)): (1) HOW to evaluate our competence gaps — does claim→backing-doc mapping transfer from review personas to standing roles? (2) WHERE do competences live — per-agent COMPETENCIES.md / competencies/ tree / wiki cards / prompt frontmatter (mind Cal's single-writer wiki rule); (3) proactive mapping or YAGNI — middle path: proactive for claim-heavy roles, YAGNI for process roles. Owner suggestion: Celes + Medici second lens; Cal relevant for question 2.
- **Open external dependencies:** Arhitecture #9 (Action-2 prompt patch, uniform across 12 gate-bearing personas) + #10–#13 (procurement gaps). Round-3 candidate hypothesis parked: panel expansion with bonus-8 personas (deliberate run, not bolt-on).
- **All S41 watch items carry forward unchanged** — TPS-601 (no assignee), ITSD-38884, article draft awaiting Schliemann, ghost-bridge auto-restart gap, A1 evidence-cycle audit S40-42 (due!), S35 standing watch, TPS-583/mVox-dev/Manager-team dormant. **Retro rubric watch item RESOLVED** — filled at `docs/2026-06-05-round2-retro-rubric.md`.

---

## SESSION 42 WRAP — 2026-06-05 (#73 re-review experiment end-to-end: guild-specialist pattern CONFIRMED; consultancy = setup-only; 3 substrate anomalies)

**Spans:** 2026-06-05 ~12:10 → ~13:45. Single session, ~1.5h active. Parent on Opus 4.8 (one-off exception, PO-sanctioned; roster intent stays 4.6).

**Outcome:** #73 executed in full. Phase 1: Celes assessed Arhitecture #4-#8 merges — all 5 personas substantially adopted, zero divergence, ONE systematic omission (gap-reaction Action 2 dropped from all 5; root cause: protocol was last-comment on each issue, implementer worked from bodies) → Arhitecture #9 filed with per-persona patch text. Phase 2: Option-A mechanism (5 fresh-context background agents, verbatim-auditable briefs, contamination guard) — Celes caught the embodiment confound herself and surfaced it instead of guessing. Result: **HYPOTHESIS CONFIRMED** — 5/5 correct dispositions, 5/5 zero fabrication (incl. Anderson, the round-1 fabricator), both wired consensus pairs (Beck⟷Bach bug-pinning, Leveson⟷Anderson conflation) reproduced from independent contexts, 3 reviewers went DEEPER than round 1 (booch FINDING-6 scope-omission schema bypass — verified real; leveson ran validator on 7 edge cases; anderson caught documented-vs-enforced enum). D7 Action-2 via dispatch: 4/4 filed live at hit-time (#10-#13, all verified open). PO mid-run override: arch-docs MCP whitelisted → uniform post-submission Phase-2b re-verification (all GAPs survived; bach honestly refined his). Published: PR #45/#46 panel comments, gist updated, topic 10 evidence section + emergent-unwired-pairing subsection.

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `docs/2026-06-05-persona-improvement-assessment.md` | NEW | Celes | 5×substantially-adopted verdict table; Action-2 omission root-cause |
| [Arhitecture #9](https://github.com/Eesti-Raudtee/Arhitecture/issues/9) | NEW | Aen (Celes patch text) | Action-2 one-line append, uniform across 12 gate-bearing personas |
| `docs/2026-06-05-round2-dispatch-briefs.md` | NEW | Celes | Verbatim spawn text + SPAWNED-VERSION NOTE (live Wiki-115 instance) |
| 5 round-2 reviews | NEW | beck/bach/booch/leveson/anderson | Fresh-context agents; ~3 min each; D4 held at speed |
| [Arhitecture #10-#13](https://github.com/Eesti-Raudtee/Arhitecture/issues/10) | NEW | reviewers (live Action-2) | kata / Workers-failure-modes / regulatory sources / EN 50716 |
| `docs/2026-06-05-round2-reviews-collected.md` | NEW | Celes | Verbatim bodies + per-review scoring + FINDING-6 synthesis |
| `docs/2026-06-05-round2-retro-rubric.md` | NEW | Celes | D1-D8 filled, round 1 vs round 2 side-by-side, CONFIRMED verdict |
| [PR #45](https://github.com/Eesti-Raudtee/dev-toolkit/pull/45#issuecomment-4630259710) + [PR #46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46#issuecomment-4630260113) panel comments | NEW | Celes (assembler) | FINDING-6⟷Leveson-HIGH cross visible, assembler-judgment attribution |
| topics/10-guild-specialists.md | M | Celes section in Aen doc | Round-2 evidence + consultancy=setup-only + unwired-pairing subsection |
| [mitselek/ai-teams #74](https://github.com/mitselek/ai-teams/issues/74) | NEW | Aen | Reflexive competency gap analysis on FR roster (PO directive) |
| memory/celes.md | M | Celes | Trimmed ≤100 lines; 3 substrate anomalies in carry-forward FOR CAL |

### Decisions (PO-ratified)

[DECISION — S42] **Run round 2 as-is + Action-2 via dispatch.** PO: "we personally inform every hire to file GAP issues as soon as they hit them." Rescued the Action-2 behavioral signal (scored as dispatch-layer, not prompt-encoded). Same-5 composition (PO pre-sanctioned; A/B comparability decisive).

[DECISION — S42] **Option A mechanism.** 5 independent fresh-context agents — Celes embodying would re-inject the designer-memory variable the experiment removes. Mechanism delta vs round 1 IS the treatment definition.

[DECISION — S42] **arch-docs MCP whitelisted mid-run (PO override).** Landed post-submission → uniform Phase-2b verification layer; avoided split-instrument. All GAP claims survived MCP cross-check.

[DECISION — S42] **Guild-specialist verdict: prompt-encoded gates + synergy sufficient; consultancy = one-time setup, not per-engagement.** Directional only — 4.8-vs-4.6 substrate uncontrolled, no precise quality-delta claim.

### Substantive learnings

[LEARNED — framework, promotion-grade] **The pattern survives transfer to independent instruments.** Gates+synergy held in fresh contexts with no designer memory; emergent UNWIRED cross (Booch⟷Leveson: structural lens caught a safety-axis hole booch defers on content) is stronger evidence than reproduced wired pairs — cross-lens coverage appeared without anyone designing it.

[LEARNED — process] **Two-action protocols die in comment threads.** Action-2 was dropped from all 5 merges because it arrived as the last issue comment; implementers work from bodies. Put protocol-complete text in the issue body or expect silent partial adoption.

[LEARNED — substrate, Cal-grade ×3] **(1) Peer-DM delivery lag, high variance** (minutes→hours on spawned-agent→spawned-agent vector; spawner↔agent fine) + **inbox JSON file ≠ delivery truth** (delivered msg never appeared in file; undelivered sat flagged unread). **(2) Task-list full state loss** mid-session (both tasks vanished, lead + specialist views). **(3) Idle wake-churn loop** post-backlog-flush (7+ empty wakes/min; graceful shutdown resolves). All n=1, same session, three subsystems.

### Standing watch items going into session 43

- **All S41 watch items carry forward** — TPS-601, ITSD-38884, article/Schliemann, ghost-bridge auto-restart, A1 evidence-cycle audit (S40-42 window — now DUE), S35 standing watch, Aen amendment Part C, TPS-583/mVox-dev/Manager-team dormant.
- **RESOLVED:** retro rubric (filled); #73 (closed by this session — close the GitHub issue if not yet done).
- **NEW — #74 reflexive gap analysis** — future session, Celes+Medici.
- **NEW — Arhitecture #9 patch adoption + #10-#13 procurement** — external; round-2 follow-ups ride on them.
- **NEW — Round-3 candidate:** panel expansion (bonus-8 personas) as deliberate separate run.
- **NEW — 3 substrate anomalies → Cal queue** (sources: this wrap, celes.md carry-forward, briefs-doc SPAWNED-VERSION NOTE).

### NEXT-SESSION BOOT (re-orient instructions for S43)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Re-register ghosts → Restore inboxes → Spawn — wait for PO direction). **Step 0.5 model gate:** roster pins 4.6; S42 ran 4.8 as one-off — verify what PO wants for S43 before TeamCreate.
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S43 read.
3. **Pull `mitselek-ai-teams` repo** for external scratchpad updates.
4. **Don't pre-spawn any agent at session start** — but note: **S43's agenda is already PO-directed (introspection / #74)**, so after startup confirm with PO and proceed to item 5-agenda; don't wait passively for a topic.
5. **S43 MAIN TRACK — #74 introspection.** Spawn Celes (lead, ARM/Marcela function) + consider Medici (health-audit lens) and Cal (question 2 is artifact-architecture in his domain). Work the PO's three questions in order: evaluation methodology → competence-artifact location (directory vs wiki) → proactive-vs-YAGNI policy. Full framing: [#74 + comment](https://github.com/mitselek/ai-teams/issues/74#issuecomment-4631002855). Deliverable shape suggestion: a design doc in docs/ answering all three + a PO-decision list, before any prompt edits.
6. **If Cal spawns (likely, per item 5):** his queue also has 3 substrate anomalies (peer-DM lag + inbox-file-not-truth; task-list state loss; idle wake-churn) + the live Wiki-115 instance (v2/v3 treatment divergence). Sources: S42 wrap [LEARNED], celes.md carry-forward, round2-dispatch-briefs SPAWNED-VERSION NOTE.
7. **If PO surfaces Arhitecture #9-#13 movement:** #9 merged → personas carry Action-2 prompt-encoded (round-3 could score it as prompt-layer); #10-#13 procurement → re-run affected persona's [GAP] verification.
8. **If PO surfaces round-3 (panel expansion):** deliberate separate hypothesis — does a larger panel find more? Bonus-8 are gate-wired (commit 16dfcdc8 + #9 patch when merged). New baseline needed; round-2 comparability doesn't extend to new lenses.
9. **If PO surfaces TPS-601 / ITSD-38884 / article feedback / ghost-bridge watchdog:** unchanged procedures per S41 boot items 6-10.
10. **A1 evidence-cycle audit is DUE** (S40-42 window closed) — raise with PO if not surfaced.

(*FR:Aen*)

---

### [PROCESSED 2026-06-05] 2026-06-05 — session-41 → session-42

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S42 read):**

- **State of play:** S41 closed 2026-06-05. Multi-day session (2026-06-03→05). Major output: guild-specialist pattern designed + validated via controlled trial. Celes audited 13 Arhitecture personas → synergy map filed ([Arhitecture #3](https://github.com/Eesti-Raudtee/Arhitecture/issues/3)). 5 personas re-engineered with competency gates + synergy wiring → reviewed [dev-toolkit PR #45](https://github.com/Eesti-Raudtee/dev-toolkit/pull/45) + [PR #46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46) → all 5 reviews posted on PRs ([gist](https://gist.github.com/mitselek/a20d0be7ae193c8266725880005aa4a6)). 5 persona improvement issues filed ([Arhitecture #4-#8](https://github.com/Eesti-Raudtee/Arhitecture/issues/4)). New topic seeded: [10-guild-specialists.md](https://github.com/mitselek/ai-teams/blob/main/topics/10-guild-specialists.md). Container intake request filed ([TPS-601](https://eestiraudtee.atlassian.net/browse/TPS-601)). DB tunnels confirmed working but flapping (83 restarts/day). Apex card system feedback received (175 entries, filing-time > batch).
- **Open dispatches/dependencies:** (a) Arhitecture #4-#8 (persona prompt updates — BLOCKS [#73](https://github.com/mitselek/ai-teams/issues/73) re-review experiment). (b) TPS-601 container intake (no assignee yet — org routing question). (c) ITSD-38884 admin grant unchanged. (d) Article draft awaiting Schliemann feedback (sent S40, no review back yet). (e) Ghost-bridge auto-restart gap (noted S40, not actioned).
- **Re-review experiment ready:** [#73](https://github.com/mitselek/ai-teams/issues/73) has detailed 9-step plan. Precondition: Arhitecture #4-#8 merged. Check at session start: `gh issue list --repo Eesti-Raudtee/Arhitecture --state open --json number | jq '[.[].number] | map(select(. >= 4 and . <= 8))'` → empty = unblocked.
- **Retro rubric unfilled:** Celes drafted the scoring template (in her S41 message). Fill after round 2 with side-by-side comparison.
- **All S40 watch items carry forward unchanged** — ITSD-38884, Stage 2 read-back surfaces, Hopper bundled-shred n=1, routing-by-action + Stage-0-contribution n=1, A1 evidence-cycle audit S40-42, S35 carry-forward standing watch, Aen amendment Part C, TPS-583 dormant, mVox-dev dormant, Manager-team dormant.

---

## SESSION 41 WRAP — 2026-06-03→05 (Guild-specialist pattern designed + validated; 5 persona reviews delivered; topic 10 seeded; container intake filed; DB tunnels diagnosed)

**Spans:** 2026-06-03 ~12:25 → 2026-06-05 ~09:00. Multi-day session.

**Outcome:** Guild-specialist framework pattern designed end-to-end and validated via controlled trial. Celes produced synergy map for 13 Arhitecture personas, re-engineered 5 for PR review with competency gates + synergy wiring. All 5 reviews delivered on dev-toolkit PRs #45 and #46 — zero fabrications, all gaps correctly flagged, consensus findings emerged from designed pairings. Pattern abstracted to topic 10 (guild-specialists.md) as fourth team archetype. Container intake request (TPS-601) filed for apex team. DB tunnels confirmed working but flapping. Apex team card system feedback received (175 entries, real adoption data).

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| [Arhitecture #3](https://github.com/Eesti-Raudtee/Arhitecture/issues/3) (synergy map) | NEW | Celes | 13-persona audit: 6 clusters, 3 overlaps, 3 gaps |
| 5 PR reviews on [dev-toolkit #45](https://github.com/Eesti-Raudtee/dev-toolkit/pull/45) + [#46](https://github.com/Eesti-Raudtee/dev-toolkit/pull/46) | NEW | Beck+Bach+Booch+Leveson+Anderson | Posted as PR comments + [gist](https://gist.github.com/mitselek/a20d0be7ae193c8266725880005aa4a6) |
| [Arhitecture #4-#8](https://github.com/Eesti-Raudtee/Arhitecture/issues/4) | NEW | Aen | Atomic persona improvement issues with gap-reaction protocol |
| [topics/10-guild-specialists.md](https://github.com/mitselek/ai-teams/blob/main/topics/10-guild-specialists.md) | NEW | Aen | Fourth team archetype: shared expert pool with competency backend |
| topics/01-team-taxonomy.md | M | Aen | Added Consultancy/Guild section pointing to topic 10 |
| [mitselek/ai-teams #73](https://github.com/mitselek/ai-teams/issues/73) | NEW | Aen | Re-review experiment plan (9 steps, blocked on #4-#8) |
| [TPS-601](https://eestiraudtee.atlassian.net/browse/TPS-601) | NEW | Aen | Apex container intake request (linked to VEO-4 + TPS-577) |
| Retro rubric | NEW (message) | Celes | Fillable scoring template for round 1 vs round 2 comparison |

### Decisions (PO-ratified)

[DECISION — S41] **Guild-specialist pattern adopted as fourth team archetype.** Shared expert pool with competency backend, dispatched on demand. Seeded as topic 10. Evidence: S41 controlled trial with 5 Arhitecture personas.

[DECISION — S41] **Competency gap-detection is a two-action protocol.** (1) Flag `[GAP]` in output artifact, (2) file issue at retainer repository about the missing backing. Both actions must be prompt-encoded. Added to Arhitecture #4-#8.

[DECISION — S41] **Container intake filed directly rather than waiting for standard adoption.** TPS-601 forces org to react to a concrete request (VEO-4 stalled 20 days on routing question).

### Substantive learnings

[LEARNED — framework, promotion-grade] **Competency gates + synergy wiring produce measurably better reviews than generic single-lens prompts.** 5/5 personas flagged gaps correctly, zero fabrications, designed pairings (Beck⟷Bach, Leveson⟷Anderson) produced consensus findings neither lens would reach alone. The `security_level`/`safety_related` conflation check and the "characterization tests pin bugs" finding are the marquee evidence.

[LEARNED — framework] **Synergy must be prompt-encoded, not just in the work product.** Celes's #3 headline finding: the Arhitecture team shipped coordinated multi-lens reviews while only 1 of 13 prompts (Anderson) encoded the coordination. The cluster is fragile until prompt-encoded. Round 2 will test whether prompt-encoding eliminates the need for per-engagement Celes intervention.

[LEARNED — process] **Filing-time card generation >> batch backfill.** Apex team (175 entries) confirmed: batch backfill of 87 cards was expensive (~7 commits); filing-time generation is near-free. Start with filing-time from day 1.

[LEARNED — substrate] **DB tunnels work end-to-end but flap heavily.** 83 SSH restarts/day (~17min MTBF). Oracle responds through tunnel (ORA-01017 = auth challenge = protocol works). Autossh + wrapper loop + Task Scheduler = persistent but unreliable for sustained work.

### Standing watch items going into session 42

- **All S40 watch items carry forward unchanged** — ITSD-38884, Stage 2 read-back surfaces, Hopper bundled-shred n=1, routing-by-action + Stage-0-contribution n=1, A1 evidence-cycle audit S40-42, S35 carry-forward standing watch, Aen amendment Part C, TPS-583 dormant, mVox-dev dormant, Manager-team dormant.
- **NEW — Re-review experiment [#73](https://github.com/mitselek/ai-teams/issues/73)** blocked on Arhitecture #4-#8 (persona prompt merges). Check at session start.
- **NEW — TPS-601 container intake** — no assignee, org routing question open. Dmitri Buloitšik's VEO-4 comment (2026-05-13) suggested ITOps. No response to PO's May 14 follow-up.
- **NEW — Retro rubric unfilled.** Score after round 2 with side-by-side comparison.
- **NEW — Article draft still awaiting Schliemann feedback.** Asked again S41 (low-priority). No response yet.
- **NEW — Dev-toolkit PRs #45/#46 have "address review" commits.** Authors acted on round-1 findings. Re-review is the next action once #4-#8 land.

### NEXT-SESSION BOOT (re-orient instructions for S42)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — 5-bullet reorientation per A1. Downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S42 read.
3. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **Check re-review precondition:** `gh issue list --repo Eesti-Raudtee/Arhitecture --state open --json number | jq '[.[].number] | map(select(. >= 4 and . <= 8))'`. If empty → [#73](https://github.com/mitselek/ai-teams/issues/73) unblocks. Execute the 9-step re-review plan.
6. **If PO surfaces TPS-601 follow-up:** check Jira for assignee/comments. The intake request forces org routing.
7. **If PO surfaces ITSD-38884 admin grant:** spawn Hopper, Path D execution per S37 procedures.
8. **If PO surfaces article feedback from Schliemann:** read apex-lead-ghost inbox. Incorporate into article draft.
9. **If PO surfaces retro scoring (round 1 only):** Celes has the rubric in her S41 message. Can fill round 1 standalone, but full value is round 1 vs round 2 side-by-side.
10. **If PO surfaces ghost-bridge auto-restart:** design Task Scheduler watchdog (noted S40, not actioned).
11. **If PO surfaces new guild-specialist work:** topic 10 has open questions (competency backend ownership at scale, retainer quality assurance, priority model, federation).

(*FR:Aen*)

---

### [PROCESSED 2026-06-03] 2026-06-03 — session-40 → session-41

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S41 read):**

- **State of play:** S40 closed 2026-06-03. Epic #67 all 5 Tier-1 issues closed (#68-#72): 118 wiki cards + 8 INDEX files, scratchpad summary headers in common-prompt + 11 prompts, Stage-2-confirms gate defined + 119 cards tagged (79 confirmed / 40 pending), 4 playbooks extracted (~47% common-prompt reduction), 4 CLAUDE.md signposts. Article draft at gist (https://gist.github.com/mitselek/a24c168d7046a6190f417dc005008592) — sent to apex for review. Anderson persona tested against real PR (rumba_sso_login) — analysis solid, fabricated regulatory links → scrapped review → competency-backed-personas pattern discovered + validated. Arhitecture repo issues #1 + #2 filed. MCP server (arch-docs.dev.evr.ee) tested end-to-end from Claude Code — 498 indexed docs, works.
- **Open dispatches/dependencies (carried from S38):** ITSD-38884 admin grant (sole Round-1 op-step-1 blocker). Hopper Path D execution when grant lands. Pilot-A creation (PO dashboard). All unchanged — S40 was context-management + consultancy focused.
- **Article draft status:** Gist shared with apex-lead-ghost for review. Awaiting Schliemann's feedback. Once feedback incorporated, promote to GitHub Discussions on wiki. Article includes competency-backed-personas section (Anderson failure story) and "where this goes next" (wiki MCP + routing playbook).
- **Anderson persona updated:** Gist https://gist.github.com/mitselek/88e513513da09c423c1b26e3bf26eb0c now includes competency library hard rule + gap-detection. Validated: re-run flagged missing COMPETENCIES.md, zero fabricated links. Arhitecture issues: #1 (Anderson competency library + MCP integration), #2 (full 13-persona audit with live repo links). MCP server solves the access pattern — personas query `search_docs` instead of needing local knowledge dirs for repo-internal docs.
- **Ghost-bridge was down 4 days** (since 2026-05-29). Restarted S40. No auto-restart mechanism — consider adding Task Scheduler watchdog like the DB tunnels have.

---

## SESSION 40 WRAP — 2026-06-02/03 (Epic #67 all Tier-1 closed; article draft; Anderson real-case test → competency-backed-personas pattern; MCP server validated)

**Spans:** 2026-06-02 ~12:20 → 2026-06-03 ~10:00. Multi-day session.

**Outcome:** All 5 Tier-1 issues from epic #67 closed in one session. Three agents ran in parallel (Cal, Finn, Herald). Article draft written and shared with apex for review. Anderson persona tested against real PR — analysis quality high but fabricated regulatory links destroyed deliverable credibility → discovered competency-backed-personas pattern → validated gap-detection rule. Two issues filed on Eesti-Raudtee/Arhitecture (#1 Anderson-specific, #2 full 13-persona audit). MCP server (arch-docs.dev.evr.ee) tested end-to-end from Claude Code — 498 docs indexed, NIS2 search returns exactly what Anderson needs.

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| GitHub #68-#72 | CLOSED | Cal+Finn+Herald+Aen | Epic #67 all Tier-1 complete |
| 118 wiki cards + 8 INDEX files + root index | NEW | Cal | #68 — three-tier wiki context system |
| common-prompt + 11 prompts scratchpad header | M | Cal design + Aen apply | #69 — summary header convention |
| wiki/process/stage-2-confirms-filing-gate.md + card | NEW | Cal | #70 — gate defined, 119 cards tagged |
| 4 playbooks/ files | NEW | Herald | #71 — ~47% common-prompt reduction |
| 4 CLAUDE.md signposts (docs/, topics/, designs/, wiki/) | NEW | Finn | #72 — navigation maps |
| Article draft gist | NEW | Aen | https://gist.github.com/mitselek/a24c168d7046a6190f417dc005008592 |
| Anderson persona gist updated | M | Aen | Competency library hard rule + gap-detection |
| Eesti-Raudtee/Arhitecture#1 | NEW | Aen | Anderson competency library + MCP integration |
| Eesti-Raudtee/Arhitecture#2 | NEW | Aen | Full 13-persona audit with live repo links |
| Ghost-bridge restarted | Ops | Aen | Was down since 2026-05-29 |

### Decisions (PO-ratified)

[DECISION — S40] **Three-bucket NUANCE rule for Stage-2 backfill.** Solo-author-is-filer = confirmed; documented S36+ read-backs = confirmed/partial; no documented read-back = pending. Cal initially went STRICT (fail-closed) when approval messages crossed; re-ran under NUANCE. Final: 79 confirmed, 40 pending.

[DECISION — S40] **Playbooks are harness-agnostic on-demand procedures.** Behavioral contracts stay inline in common-prompt; step-by-step procedures extract to playbooks/ files. Skills are the platform-optimized version if committed to one harness.

[DECISION — S40] **Competency-backed personas: gap-detection is a hard rule.** Missing backing docs → flag before proceeding, never fabricate links, never silently proceed. Validated on Anderson re-run.

### Substantive learnings

[LEARNED — process, promotion-grade] **Competency-backed personas.** A persona that claims domain expertise must have source documents backing each competency. Without them, the agent cites from training knowledge (analysis correct) but fabricates verifiable references (links broken). The fix: COMPETENCIES.md mapping claims to backing docs (MCP queries for repo-internal, local paths for external), with gap-detection hard rule. Validated: re-run produced loud caveat, zero fabricated links, unchanged analysis quality.

[LEARNED — process] **Inbox delivery lag causes authorization-crossing storms.** Cal asked the same question 4 times because earlier approvals sat unread in her inbox while she composed. Design protocols to tolerate message-crossing: make decisions idempotent, expect re-asks.

[LEARNED — substrate] **MCP server (arch-docs.dev.evr.ee) solves persona competency access.** 498 docs indexed. Personas can `search_docs` instead of needing local knowledge dirs for repo-internal content. External regulatory sources (NIS2, KüTS, ISO 27001) still need to be obtained and placed in repo (auto-indexed by MCP build).

[LEARNED — process] **Ghost-bridge has no auto-restart.** Died 2026-05-29, wasn't restarted until S40. DB tunnels have autossh wrapper loop + Task Scheduler; ghost-bridge has neither. Gap.

### Standing watch items going into session 41

- **All S39 watch items carry forward unchanged** — ITSD-38884, Stage 2 read-back surfaces, Hopper bundled-shred n=1, routing-by-action + Stage-0-contribution n=1, A1 evidence-cycle audit S40-42, S35 carry-forward standing watch, Aen amendment Part C, TPS-583 dormant, mVox-dev dormant, Manager-team dormant.
- **NEW — Article draft awaiting apex review.** Schliemann's feedback will arrive via ghost-bridge. Incorporate feedback → promote gist to GitHub Discussions on wiki.
- **NEW — Arhitecture issues #1 + #2.** Filed but not actioned by Arhitecture team yet. External dependency.
- **NEW — Ghost-bridge auto-restart gap.** Consider adding Task Scheduler watchdog.
- **NEW — MCP server for FR wiki cards.** Pattern validated via arch-docs.dev.evr.ee. Same shape: `search_cards`, `get_card`, `list_wiki`. Design item for future session.

### NEXT-SESSION BOOT (re-orient instructions for S41)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — 5-bullet reorientation per A1. Downgrade tag to `[PROCESSED YYYY-MM-DD]` once processed.
3. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces article feedback from Schliemann:** read apex-lead-ghost inbox for review comments. Incorporate into article draft. Promote gist to GitHub Discussions when PO approves.
6. **If PO surfaces ITSD-38884 admin grant:** spawn Hopper, Path D execution per S37 procedures.
7. **If PO surfaces Pilot-A creation:** PO 5-click in CF dashboard per S36 procedures.
8. **If PO surfaces competency library population for Anderson:** obtain NIS2 directive text + KüTS + ISO 27001 Annex A, place in Arhitecture repo. MCP build auto-indexes. Then re-run Anderson against rumba_sso_login PR with MCP connected — verified citations expected.
9. **If PO surfaces ghost-bridge auto-restart:** design a Task Scheduler watchdog similar to DB tunnels' `ApexResearch-DBTunnels` task — VBS launcher + wrapper loop.
10. **If PO surfaces wiki MCP server for FR:** design `search_cards` / `get_card` / `list_wiki` following arch-docs.dev.evr.ee pattern. Cal's cards are already structured YAML + markdown.
11. **If PO surfaces Cal-Protocol-A queue continuation:** Cal queue carries forward unchanged (routing-by-action, Stage-0-contribution, Candidate-B all n=1; C3/E2/E3/A.3/Companion-Pair/Producer-staleness).
12. **Epic #67 Tier 2/3 items** — forward-watch. Skill-as-format-contract investigation is the natural next if PO wants to continue context-management work.

(*FR:Aen*)

---

## SESSION 39 WRAP — 2026-06-02 (Research + design session; Wiki 115 amended; Team OS article 3-agent extraction → epic #67 with 5 sub-issues; card prototype validated)

**Spans:** 2026-06-02 ~11:00 → ~12:00. One session; ~1 hour active.

**Outcome:** Four work streams completed: (1) consultancy — Anderson security reviewer persona for Arhitecture review team; (2) Finn Stage 2 read-backs 4/4 absorbed 0 corrections; (3) Cal filed substrate-finding as Wiki 115 Instance 4 + confirmed queue watch items at n=1; (4) Team OS article multi-lens extraction — Finn (12 mechanisms) + Cal (13 knowledge-mgmt ideas) + Herald (14 protocol observations) → synthesized to epic #67 with 15 work items across 3 tiers → 5 Tier-1 sub-issues (#68-#72). Card prototype validated on 3 entries (~5x compression). PO directed next session for the 5 Tier-1 issues.

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `wiki/patterns/documentation-vs-substrate-truth-divergence.md` (Wiki 115) | M (Instance 4) | Cal | roster.model non-load-bearing; 4th disambiguator-class: architecture-enforcement-mechanism |
| `docs/team-os-context-mgmt-digest-2026-06-02.md` | NEW | Finn | ~1400 words; 5-angle assessment of Team OS article |
| `wiki/patterns/cards/substrate-invariant-mismatch.md` | NEW (prototype) | Cal | Card prototype: 188→33 lines (5.7x) |
| `wiki/gotchas/cards/edit-tool-read-state-expires-on-intervening-tool-call.md` | NEW (prototype) | Cal | Card prototype: 124→31 lines (4.0x) |
| `wiki/process/cards/stage-2-feedback-typology.md` | NEW (prototype) | Cal | Card prototype: 158→31 lines (5.1x) |
| GitHub issue #67 | NEW | Aen | Epic: Context Management Improvements — 15 work items, 3 tiers |
| GitHub issues #68-#72 | NEW | Aen | 5 Tier-1 sub-issues from epic #67 |
| Gist: Anderson persona | NEW (external) | Celes | Security reviewer for Arhitecture review team; consultancy deliverable |

### Decisions (PO-ratified)

[DECISION — S39] **Three-tier wiki context system adopted** (index/card/full). Prototype validated on 3 entries. Cards generated at filing time by Cal. `id` field dropped (filename is key). `tags` card-tier only. Structure: `wiki/<subdir>/cards/<name>.md`.

[DECISION — S39] **`[THREAT-MODEL]` tag over `[SPECULATIVE]`** for Anderson persona. Celes pushed back on "speculative" — connotes guesswork, clashes with "operationally specific" personality. `[THREAT-MODEL]` is recognized methodology term in security domain.

[DECISION — S39] **Tier-1 issues filed for next clean session.** PO directed S40 dedicated to #68-#72.

### Substantive learnings

[LEARNED — process, promotion-grade] **"Queryable vs evidentiary" distinction in card curation.** Cal's self-reflection: card format forces curator to distinguish ideas that answer questions (queryable → card) from ideas that support claims (evidentiary → full entry only). The card tier is extractive, not transformative — existing mega-biblion discipline already produces card-friendly entries. Potential wiki-grade finding if cross-team validation surfaces.

[LEARNED — framework] **Rigor-adoption spectrum as protocol design dimension.** Herald's meta-observation: Team OS is a protocol system that doesn't know it's a protocol system. They designed adoption-first; we designed rigor-first. The transferable question: where on the spectrum should each protocol sit? Some FR protocols (Protocol A) might benefit from skill-shaped lightweight variants.

[LEARNED — process] **Multi-lens extraction produces higher-quality synthesis than single-agent assessment.** Finn's first-pass digest was assessment-shaped ("how does this compare"). Three-agent extraction was mechanism-shaped ("what can we steal"). The cross-agent convergences (items hit by 2+ agents independently) were the strongest signals — per-directory indexes, skill-as-format-contract, Stage-2-confirms gate all surfaced from all three lenses.

### Standing watch items going into session 40

- **All S38 watch items carry forward unchanged** — ITSD-38884, Stage 2 read-back surfaces (Hopper #2-4 + Volta multi-entry still pending from S37), Hopper bundled-shred at n=1, routing-by-action + Stage-0-contribution at n=1, A1 evidence-cycle audit at S40-42, S35 carry-forward standing watch, Aen amendment Part C, TPS-583 dormant, mVox-dev dormant, Manager-team dormant.
- **NEW — Epic #67 Tier-1 execution** — 5 issues (#68-#72) targeted for S40.
- **NEW — Card backfill scale question** — ~120 entries to backfill. Cal can batch-process but will consume significant session time. PO may want to phase (e.g., patterns/ first, then gotchas/, etc.).
- **NEW — Anderson gist** — consultancy delivered; PO may want to commit to Arhitecture repo or leave as gist.

### NEXT-SESSION BOOT (re-orient instructions for S40)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — 5-bullet reorientation per A1. Downgrade tag to `[PROCESSED YYYY-MM-DD]` once processed.
3. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **PO directed S40 for the 5 Tier-1 issues (#68-#72).** Read each issue on GitHub before spawning. Recommended agent assignments:
   - **#68 (three-tier wiki):** Cal — backfill cards for remaining ~120 entries + create per-dir INDEX.md files + thin root INDEX.md. Batch-processable. Largest item.
   - **#69 (scratchpad headers):** Aen direct or Celes — define format, update common-prompt + agent prompts.
   - **#70 (Stage-2-confirms gate):** Cal — update filing protocol, add `stage-2:` field to card frontmatter.
   - **#71 (playbook extraction):** Aen + any agent — audit common-prompt, extract recipes to playbooks/ files.
   - **#72 (hierarchical CLAUDE.md):** Finn — write doc-index CLAUDE.md for docs/, topics/, designs/.
6. **If PO surfaces ITSD-38884 admin grant:** spawn Hopper, Path D execution per S37 procedures. Takes priority over epic work.
7. **If PO surfaces Anderson persona follow-up:** gist is at https://gist.github.com/mitselek/88e513513da09c423c1b26e3bf26eb0c — commit to Arhitecture repo if PO directs.
8. **Card backfill phasing question:** ~120 entries is a significant batch. Suggest patterns/ first (highest entry count, most queried), then gotchas/, then process/. PO may want to phase across sessions rather than one-shot.

(*FR:Aen*)

---

### [PROCESSED 2026-05-28] 2026-05-28 — session-38 → session-39

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S39 read):**

- **State of play:** S38 closed 2026-05-28 (very short session ~15 min active; spawn → substrate-finding → wrap). **No agents spawned.** No work-track progress; pure substrate-discovery session. Single durable artifact: substrate-truth-evidence catch about Agent-tool team model-pinning + corresponding startup.md Step 0.5 guard + roster.json `_substrate_note`. Apex tunnels morning: both UP (11521 + 11522); no apex action this session. ITSD-38884 grant status unchanged from S37 close.
- **CRITICAL FIRST ACTION S39 — model verification BEFORE TeamCreate:** Roster pins team-lead to `claude-opus-4-6[1m]`. The CLI parent session model is what `TeamCreate` stamps into runtime `config.json`, NOT the roster value. If parent is on `claude-opus-4-7[1m]` (current Opus default), team-lead AND all spawned specialists land on 4.7 — ~40% context-cost differential per agent (per S38 apex-side experiment data PO shared: 67.3k vs 48.1k post-startup; uniform across categories). **Run `/model claude-opus-4-6[1m]` before Step 1**, OR restart CLI with `--model claude-opus-4-6[1m]`. Step 0.5 in startup.md gates this — read it.
- **Open dispatches/dependencies (unchanged from S37):** ITSD-38884 admin grant (sole Round-1 op-step-1 blocker; admin = Kristofer Taling at EVR IT). Stage 2 read-back surfaces queued for Finn (8 surfaces across 5 wiki entries). Hopper #2-4 on Candidate A. Volta on multiple entries. Cal Stage-0-contribution + routing-by-action n=1 watch (await n=2). Hopper bundled-shred n=1 in her scratchpad.
- **Expected first action S39:** PO direction. Most likely scenarios unchanged from S37→S38 — ITSD-38884 admin grant landed → Hopper Path D; OR Stage 2 read-back → Finn; OR Pilot-A creation; OR Cal queue continuation.
- **Substrate-finding for Cal candidacy:** "roster.json model field is non-load-bearing on Agent-tool team architecture; TeamCreate inherits parent session model." Empirical evidence in this session (config.json:11 stamped 4.7 despite roster=4.6). Documentation-vs-substrate-truth-divergence territory (Wiki 115 cluster). n=1 in-session. If Cal spawns S39, this is a candidate worth her queue.

---

## SESSION 38 WRAP — 2026-05-28 (Short session ~15 min; spawn → substrate finding → wrap; one durable artifact + two guard rails)

**Spans:** 2026-05-28 morning startup → wrap on PO direction after substrate-finding surfaced. ~15 min active. No agents spawned.

**Outcome:** Pure substrate-discovery session. Identified that `roster.json` model field is non-load-bearing on Agent-tool team architecture — `TeamCreate` stamps parent CLI session model into runtime `config.json`, and Agent-tool spawn machinery inherits that, ignoring roster intent. Shipped two guard rails (startup.md Step 0.5 + roster.json `_substrate_note`) so future sessions catch this at the substrate-truth layer rather than discovering it mid-spawn. PO direction: switch to 4.6, wrap, respawn fresh on 4.6.

### How the finding surfaced

PO shared a /context snapshot from an apex-research startup-ceremony experiment: same ceremony, fresh team, both 4.6 and 4.7 — **40% context-cost differential across every category** (system prompt +37%, system tools +41%, memory files +42%, skills +32%, messages +40%, total 48.1k vs 67.3k). Uniform inflation suggests broader model-substrate change, not localized regression.

PO followed up: *"what model will you spawn Cal on?"*

Substrate check:

1. **Config.json line 11** for fresh S38 team-lead: `"model": "claude-opus-4-7[1m]"` despite **roster.json line 10** for team-lead: `"model": "claude-opus-4-6[1m]"`. `TeamCreate` ignored roster, stamped parent.
2. **Agent tool spec** (per ToolSearch fetch): `model` param accepts only family-level overrides (`opus`/`sonnet`/`haiku`); no specific-version pin (e.g., `claude-opus-4-6`) is accepted. `opus` resolves to current default = 4.7.
3. **Spawn inheritance default** = parent model when no explicit override.

So Cal spawned via Agent tool would inherit my parent (4.7), and there is **no path through the Agent tool to pin Cal to 4.6 specifically.** Only path: switch parent session model before spawn.

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `teams/framework-research/startup.md` Step 0.5 | NEW | Aen | Parent-model verification gate before Step 1; explicit recovery (`/model claude-opus-4-6[1m]` or `--model` flag); substrate-truth catch quoted inline |
| `teams/framework-research/roster.json` `_substrate_note` | NEW (top-level field) | Aen | One-line note documenting roster.model is documentation-only on Agent-tool teams; points to Step 0.5; cites S38 catch date |
| `teams/framework-research/memory/team-lead.md` | M (S39 M1 seed + S38 WRAP) | Aen | This entry; S37 [PROCESSED 2026-05-28] tag also applied |

No specialist work; no wiki entries; no operational actions; no decisions deferred or unblocked. ITSD-38884 status: unchanged.

### Decisions (PO-ratified)

[DECISION — S38] **Switch parent CLI session to `claude-opus-4-6[1m]` before next TeamCreate.** PO direction after substrate finding surfaced: *"lets switch to 4.6 — you update roster and wrap the session, i will make sure we respawn on 4.6"*. The 40% context-cost differential vs. continuing on 4.7 is not justified by any observed quality differential for this team's research workload (no comparative evidence either way). Restore continuity with the 4.6 substrate that drafted S35-S37 wiki entries.

[DECISION — S38] **Roster.json model field stays documentation, not enforcement.** No code change is available to make Agent-tool spawn machinery consume roster.model. The discipline-side mitigation (Step 0.5 verify-before-TeamCreate) is the only available enforcement. Roster intent stays 4.6; substrate enforcement is procedural.

### Substantive learnings (Cal-grade candidate)

[LEARNED — substrate, candidate-grade] **roster.json model field is non-load-bearing on Agent-tool team architecture.** TeamCreate stamps parent CLI session model into runtime config.json regardless of roster intent. Agent-tool spawn machinery inherits that. Contrast with tmux-pane-based teams (apex-research): the roster.model field IS consumed by the launcher script (`claude --model claude-opus-4-6[1m]`) at pane-spawn time. Same data field, two substrates, two different enforcement semantics. **Documentation-vs-substrate-truth-divergence sub-instance** (Wiki 115 cluster member): the roster artifact describes what model team members run on; the substrate (Agent-tool spawn machinery) implements something different (parent inheritance). Reader of roster.json would infer 4.6 enforcement; substrate truth is 4.7 (parent-determined). n=1 in-session; promotion-grade if cross-team observation surfaces in tmux-pane substrates as a separate-but-related instance.

[LEARNED — cross-model substrate] **Opus 4.7 carries ~40% more context overhead than 4.6 at post-startup parity** (apex-research n=1 per model; uniform across all five categories — system prompt +37%, system tools +41%, memory files +42%, skills +32%, messages +40%). Messages category dominates absolute delta (+10.7k of 19.2k total). Watch-grade; needs n=2 per model to factor out across-day drift before Wiki candidacy. Cross-model cost is structural property worth tracking if FR continues across model transitions.

### Standing watch items going into session 39

- **All S37 watch items carry forward unchanged.** ITSD-38884 admin grant; Stage 2 read-back surfaces (Finn 8 + Hopper #2-4 + Volta multi-entry); Hopper bundled-shred Cal candidate (n=1 in her scratchpad); routing-by-action + Stage-0-contribution at n=1 (await n=2); A1 evidence-cycle audit at S40-42; S35-carry-forward standing watch (Brunel-Amendment, Hopper-Amendment-5, "PO"→"Mihkel/you" naming); Aen amendment Part C; TPS-583 dormant; mVox-dev S8+ carry-forward dormant; Manager-team / PO-team architecture dormant.
- **NEW — Cross-model context-cost watch.** If FR continues across model transitions, track per-startup context cost (run /context after Step 4 each session) and note the model from config.json:11. n=2 per model promotes to Wiki candidacy.
- **NEW — Substrate-truth-evidence catch S38 (roster.model non-load-bearing).** n=1 in-session; promote on cross-team observation OR explicit PO sanction to file at n=1.

### NEXT-SESSION BOOT (re-orient instructions for S39)

1. **READ THIS BLOCK FIRST.** Step 0.5 in startup.md is new and load-bearing. Read it before Step 1.
2. **Verify parent CLI session model matches `claude-opus-4-6[1m]`.** Check `/context` header OR `claude --version`. If parent shows 4.7 (or anything ≠ 4.6) → STOP and run `/model claude-opus-4-6[1m]`. Substrate gap: roster.json says 4.6, but TeamCreate stamps parent — see startup.md Step 0.5 inline note.
3. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Re-register ghost members → Restore inboxes → Spawn — wait for PO direction).
4. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — that's the 5-bullet reorientation seed per A1 adoption. Read it FIRST, then downgrade the tag to `[PROCESSED YYYY-MM-DD]` once processed.
5. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
6. **Don't pre-spawn any agent at session start.** Wait for PO direction.
7. **Most-likely first asks remain S37 set** (ITSD-38884 / Stage 2 read-back / Pilot-A creation / Cal queue) — see S37 wrap NEXT-SESSION BOOT entries 5-15 for full procedures. S38 added no new operational items.
8. **Confirm post-TeamCreate substrate state.** After Step 2, read `~/.claude/teams/framework-research/config.json:11` and verify `"model": "claude-opus-4-6[1m]"`. If anything else → /model + TeamDelete + TeamCreate retry. This is the empirical close-out of Step 0.5.
9. **If PO surfaces the substrate-finding for Cal candidacy:** spawn Cal with brief. Material is in this scratchpad's [LEARNED] section + S38 wrap section. Candidate filing target: `wiki/patterns/roster-model-field-non-load-bearing-on-agent-tool-teams.md` OR a sub-instance entry under existing `documentation-vs-substrate-truth-divergence.md` (Wiki 115). Co-source PO + Aen.

(*FR:Aen*)

---

### [PROCESSED 2026-05-28] 2026-05-27 — session-37 → session-38

**M1 seed (A1 pattern; 5 bullets max; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S38 read):**

- **State of play:** S37 closed 2026-05-27 (one-day session ~5hr active; ~10:55-17:30). **Op-step-2 SUBSTRATE-COMPLETE** — three Anthropic credentials per CMA reference-impl shape now live on `fr-cma-pilot` Worker secret_text bindings (OAuth-everywhere shortcut from S35 overwritten). **Op-step-1 STILL gated on ITSD-38884** (EVR IT ticket; admin grant pending on Access:Apps and Policies — Read + Edit). Substantial wiki output: 9 Cal entries shipped Wiki 114→123 + 4 substrate-truth catches reshape authoring discipline + Upraise-OKR skill extended (`--action checkin` + utf-8 fix + KR field extraction) + 8 OKR check-ins fired across OBJ-2989/2990/2993.
- **Open dispatches/dependencies:** ITSD-38884 admin grant (sole Round-1 op-step-1 blocker; admin = Kristofer Taling at EVR IT). Stage 2 read-back surfaces queued for Finn (8 surfaces across 5 wiki entries: Edit-tool-trap ×4 + Layer-0 PRE-DRAFT ×3 + Inverted-trigger ×3 + Cadence-crossing ×3 + Stage-2-feedback typology ×3) + Aen/Hopper on Candidate A surfaces #2-4 + Volta on multiple entries. Routing-by-action + Stage-0-contribution at n=1 watch (deferred this batch; await n=2). Hopper bundled-shred Cal candidate held at n=1 in her scratchpad.
- **Expected first action S38:** PO direction. **Most likely:** ITSD-38884 admin grant landed → spawn Hopper → Path D execution (pre-flight check 5 first per Edit-scope-arrival path she defined; then Tier-D bypass POST per 14:34-with-`destinations[]` shape; PO 12:11 sanction verbatim valid). ~5-10 min total. Admin response time unknown — could be hours, days, or longer.
- **PO-pending decisions:** (a) ITSD-38884 admin grant on Access:Read+Edit (only Round-1 op-step-1 blocker); (b) Pilot-A creation via CF dashboard (op-step-3 PO 5-click; click-path: Agents → New Agent → Backend: Isolate → name `pilot-a` → model `claude-sonnet-4-6` → tools []); (c) Anthropic session trigger (op-step-5 PO action); (d) Stage 2 read-back disposition (Finn relay timing — 8 surfaces consolidated).
- **Concrete pointers:** Status report at `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` is still THE canonical CF pilot brief for op-step-1+ context. ITSD-38884 at `https://eestiraudtee.atlassian.net/browse/ITSD-38884`. Wiki 114→123 — see `wiki/index.md`; substrate-truth-evidence cluster now n=8 entries. Upraise-OKR skill at `~/.claude/skills/upraise-okr/scripts/upraise-api.py` now has `--action checkin` + utf-8 stdin/stdout fix + KR field extraction (children-array shape; KR title at `kr.title` not `kr.objective.title`). Cred-handoff temp-file-as-context-firewall pattern validated in-vivo (Wiki 123). All 9 agents idle at S37 shutdown.

---

## SESSION 37 WRAP — 2026-05-27 (One-day session ~5hr active; Op-step-2 substrate-complete; Wiki 114→123 9 entries; 4 substrate-truth catches reshape authoring discipline; 8 OKR check-ins fired across 3 OBJs; Upraise-OKR skill extended)

**Spans:** 2026-05-27 ~10:55 (fresh team spawn) → ~17:30 (PO session-end signal). One day; ~5 hours active work; bandwidth-positive throughout though contextToken 15-min TTL friction (n=4+ token-expired errors during OKR work).

**Outcome:** Op-step-2 substrate-complete (Round-1 Option A three-credential split per CMA reference impl now live on Worker secret_text bindings). Op-step-1 still gated on ITSD-38884 admin grant. Cal-side: 9 entries shipped (Wiki 114→123) + 4 substrate-truth catches authoring-layer (Candidate A documentation-vs-substrate-truth-divergence promotion-grade with n=3 single-session evidence; Edit-tool-trap deterministic mechanism naming; modified_on doesn't bump on secret rotation; bundled-shred temporal vs conditional gap). OKR-side: 8 KR check-ins fired across OBJ-2989/2990/2993 with proper Estonian Cal+Hopper drafts. Skill-side: Upraise-OKR script extended with checkin action + utf-8 fix + KR extraction; ITSD-38884 ticket body amended (Read+Edit scopes via Atlassian MCP edit).

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `wiki/patterns/documentation-vs-substrate-truth-divergence.md` (Wiki 115) | NEW | Cal (joint Aen+Hopper+Cal-filer) | Promotion-grade, n=3 single-session, AUTHORING-LAYER complement to operator-layer cluster |
| `wiki/gotchas/edit-tool-read-state-expires-on-intervening-tool-call.md` (Wiki 116) | NEW | Cal (joint Cal+Finn) | Finn broader-mechanism correction canonical; n=11+ Cal + n=3+ Finn; recovery primitive with 4 thresholds |
| `wiki/patterns/substrate-vs-framework-boundary-primitive.md` (Wiki 117) | NEW | Cal (joint Volta+Brunel+Cal) | C2 cluster-primitive; 4 axes; brain-hands bounded extension |
| `wiki/process/stage-2-feedback-typology.md` (Wiki 118) | NEW | Cal (joint Cal+Volta) | 5 shapes A/B/C/D/E; two-epistemic-layer distinction |
| `wiki/patterns/layer-0-library-first-pre-draft-discipline.md` (Wiki 119) | NEW | Cal (joint Finn+Cal) | Pre-draft vs post-draft temporal complement to recurrence entry |
| `wiki/gotchas/inverted-trigger-primitives-antipattern-on-poll-based-substrates.md` (Wiki 120) | NEW | Cal (joint Finn+Cal) | n=4 cross-substrate; "does substrate dial into worker?" discriminator |
| `wiki/process/stage-2-cycle-yield-narrowing-to-read-back-phase.md` (Wiki 121) | NEW | Cal (joint Cal+Aen) | n=5 cumulative confirmation; source-commit-state discriminator |
| `wiki/patterns/cadence-crossing-dyad-variant-with-asymmetric-cross-vector-framework.md` (Wiki 122) | NEW | Cal (joint Aen+Herald+Cal) | n=11+ today; 3-vector asymmetric-cross framework with latency-and-cross-rate per vector |
| `wiki/patterns/credential-handoff-via-temp-file-context-firewall.md` (Wiki 123) | NEW | Cal (joint Aen+Hopper+Cal) | S37 in-vivo validation; failure-recovery cycle catalogued |
| Op-step-2 substrate executed — 2× wrangler secret put on fr-cma-pilot | Operator action | Hopper (PO 12:11 sanction; 12:58 retry with `CLOUDFLARE_ACCOUNT_ID` disambiguation + guarded shred fixes) | Both bindings updated; WEBHOOK_SECRET + ENVIRONMENT_ID untouched; substrate-truth catch: modified_on does NOT bump on secret rotation |
| 8 OKR check-ins fired (OBJ-2989 ×3 + OBJ-2990 ×2 + OBJ-2993 ×3) | Operator action | Aen-direct via upraise-api.py with Cal+Hopper drafts | OBJ-2991/2992 left unfired ("nothing yet" per PO) |
| `upraise-api.py` skill script extended | M | Aen | Added `--action checkin`, subprocess `encoding="utf-8"`, KR field extraction (children-array with `kr.title` at top level not `kr.objective.title`); also fixed appVersion 4.7.0→4.11.0 |
| ITSD-38884 (EVR IT ticket) body amended | M | Aen via Atlassian MCP editJiraIssue | Original single-scope (Edit) → dual-scope (Read + Edit) after Hopper pre-flight surfaced 403 on `GET /access/apps` |
| `docs/operations-log-2026-05.md` | M (+211 lines) | Hopper | Two ops-log entries covering KV inventory + S37 Tier-M arc + retry-after-failure |
| Scratchpads | M | callimachus +89 lines; hopper +6 lines | S37 carry-forward; Hopper bundled-shred [LEARNED] at n=1 |
| Misc | + | — | Cal queue drained to 2-item watch (routing-by-action + Stage-0-contribution at n=1 await n=2) |

### Decisions (PO-ratified)

[DECISION — S37] **Option A three-credential split per CMA reference impl ratified** for Round 1 (12:11). PO sanction verbatim: "sanction approved" against `wrangler secret put ANTHROPIC_API_KEY/ENVIRONMENT_KEY` with new sk-ant-api03 + sk-ant-oat01 values. Retry sanctioned in-scope at 12:58 with two fixes (CLOUDFLARE_ACCOUNT_ID env disambiguation + guarded conditional shred). Overrides S35 OAuth-everywhere shortcut.

[DECISION — S37] **Per-entry sanction cadence for Cal wiki entries** (13:10) due to PO budget signal. Released at 14:51 ("let now cal to go through all remaining postings non-stop") allowing batch-fire of items #4-#12.

[DECISION — S37] **Cred-handoff temp-file-as-context-firewall is the validated pattern** for credential plumbing in this team. Wiki 123 entry codifies it; failure modes (operator shred discipline; substrate config; coordinator-session-context) enumerated.

[DECISION — S37] **OBJ-2991/2992 (VJS2) deferred** per "nothing yet" — no FR team evidence base; punch-in deferred until concrete progress.

### Substantive learnings (Cal-grade or promotion-grade)

[LEARNED — process, promotion-grade] **Documentation-vs-substrate-truth-divergence** (Candidate A, Wiki 115): authoring-tier discipline gap where documentation/dispatch captures inferred substrate-property that is plausible-but-substrate-wrong. n=3 single-session evidence: (1) cf-pilot-status doc said "wired into KV SECRETS namespace" → actual mechanism Worker secret_text bindings; (2) Aen dispatch's "Worker auto-redeploys via modified_on" → wrangler secret put uses separate control-plane endpoint that doesn't bump script `modified_on`; (3) Aen bundled-shred dispatch language → temporal-position vs exit-code-conditional gap. **AUTHORING-LAYER complement to existing operator-layer substrate-truth cluster** (three-layer + recursive-narrowing + sub-shape-E + three-role-stacking + layer-0-library-first-recurrence + this entry + layer-0-PRE-DRAFT + substrate-vs-framework-boundary = n=8 cluster entries).

[LEARNED — process, promotion-grade] **Edit-tool-trap deterministic mechanism** (Wiki 116): harness maintains per-file Read-state slot invalidated by next tool call (any tool call, not just file-mutating ones). Recovery primitive: re-Read before Edit when prior Read >5 tool calls / >5 min real-time / SendMessage round-trip crossed / uncertainty. Applied throughout Cal's batch drafting; zero failure-recovery cycles after first instance (which became Candidate A evidence).

[LEARNED — process] **Cred-handoff temp-file pattern validated in-vivo**: PO pastes credential → Aen writes ephemeral file outside repo → Hopper reads + uses + shreds (guarded conditional). Failure modes: (a) operator shred discipline (must conjoin on exit codes not temporal position); (b) substrate config (e.g., wrangler account ambiguity); (c) coordinator session-context (credentials live in Aen context unless explicitly discarded). All three encountered S37; all three recoverable with proven patterns.

[LEARNED — substrate] **modified_on field reflects last script bundle deploy timestamp, not secret-rotation timestamp.** `wrangler secret put` updates Worker secret bindings via separate control-plane endpoint that does NOT bump `modified_on`. Positive control for "secret is live" is wrangler success output + CF API binding inventory, not `modified_on` delta.

[LEARNED — substrate] **KV namespaces and Worker secret_text bindings are distinct substrate mechanisms with confusingly-similar names.** Round 0 deploy via `wrangler secret put` stored 4 secrets as Worker secret_text bindings; KV `SECRETS` namespace is a separate substrate for runtime-readable secret material (egress-policy header-injection per Brunel S36 Gate B3 finding). cf-pilot-status doc had mechanism-misattributed this; corrected post-Cal-A.

[LEARNED — process] **contextToken 15-min TTL × chat-turn-eating-time pattern**: Forge JWT contextToken expires in 15 min from iat; multi-turn chat conversations routinely burn this window before write completes. n=4+ token-expired errors during S37 OKR work. Workaround: keep Python wrapper script pre-prepared; only token-paste turnaround is variable; fire IMMEDIATELY on receipt of fresh token. Skill-grade pattern; possibly Wiki-grade if n=2 across sessions (currently n=1 cumulative within this skill domain).

### Standing watch items going into session 38

- **ITSD-38884 admin grant** (sole Round-1 op-step-1 blocker; EVR IT processing)
- **Stage 2 read-back surfaces from S37 entries** — 8 surfaces total awaiting Finn relay; plus Hopper #2-4 on Candidate A; plus Volta on C2/typology/Layer-0/etc.
- **Hopper bundled-shred Cal candidate** held at n=1 in Hopper scratchpad; promotes to filing if n=2 surfaces
- **Routing-by-action + Stage-0-contribution-from-filer** deferred from S37 batch; n=1 watch posture; await n=2
- **Cal Stage 2 absorption async on prior S36 entries** (Recursive-Narrowing, 2.7, Layer-0-library-first-recurrence) — natural resolution as Finn/Brunel direct-DMs arrive
- **A1 evidence-cycle audit at S40-42** (originally S35 plan; ~3-5 sessions out)
- **S35-carry-forward standing watch (unchanged)**: Brunel-Amendment parallel-to-Hopper-4 (Layer-1-only Diagnostic Discipline gap); Hopper-Amendment-5 candidate (Layer-0 library-first n=3 in-session today S37 strengthens); "PO" → "Mihkel/you" naming convention
- **Aen amendment Part C (relay-visibility rule)** — HELD at `designs/deployed/operator-role/prompts/aeneas-amendment.md`
- **TPS-583 (apex-research)** — Stage-2 standard moves when PO signals; dormant
- **mVox-dev session 8+ carry-forward** (Palestrina 3 deferred items) — dormant
- **Manager-team / PO-team architecture** (Monte domain) — dormant; PO floated 2026-05-20

### NEXT-SESSION BOOT (re-orient instructions for S38)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — that's the 5-bullet reorientation seed per A1 adoption. Read it FIRST, then downgrade the tag to `[PROCESSED YYYY-MM-DD]` once processed.
3. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces ITSD-38884 admin grant landed (MOST LIKELY first ask if grant arrives):** spawn Hopper. Her S37 pre-flight identified the Edit-scope-arrival path: repeat check 5 (`GET /access/apps` with Brunel jq refinement `'.result[] | {id, name, domain, type, destinations}'`) to confirm no existing `fr-cma-pilot` Access app collision; if clean → execute Deliverable 2 Tier-D POST per PO 12:11 sanction shape (`NEW Access App with destinations:[{type:"public", uri:"fr-cma-pilot.evree.workers.dev/webhooks"}]` + inline bypass policy). ~5-10 min total. Verbatim sanction quote in `docs/cf-pilot-status-and-s37-plan-2026-05-26.md` §2.4.
6. **If PO surfaces Pilot-A creation (op-step-3):** PO 5-click in CF dashboard: Agents → New Agent → Backend: Isolate → name `pilot-a` → model `claude-sonnet-4-6` → tools `[]`. Hopper verifies post-creation via `wrangler d1 execute fr-cma-pilot-db --remote --command "SELECT agent_id, backend, created_at FROM agent_backends ORDER BY created_at DESC LIMIT 5"`.
7. **If PO surfaces Anthropic session trigger (op-step-5):** PO action; observe webhook delivery → sandbox creation in CF → response.
8. **If PO surfaces Stage 2 read-back continuation:** spawn Finn for absorption on 8 surfaces (Edit-tool-trap ×4 / Layer-0 PRE-DRAFT ×3 / Inverted-trigger ×3 / Cadence-crossing ×3 / Stage-2-feedback typology ×3 — Finn-side and Volta-side overlap). Surfaces named in respective wiki entries' filing reports.
9. **If PO surfaces Cal queue continuation:** Cal queue is largely drained post-S37. Only routing-by-action + Stage-0-contribution at n=1 watch; await n=2 OR explicit PO direction to file at n=1.
10. **If PO surfaces routing-by-action or Stage-0-contribution promotion at n=1:** spawn Cal with explicit "file at n=1" sanction; otherwise defer per Cal's discipline.
11. **If PO surfaces credential-handoff pattern application** (any new credential into team substrate): Wiki 123 `credential-handoff-via-temp-file-context-firewall.md` documents the validated pattern; Aen writes ephemeral file outside repo (`~/.cf-pilot-creds-ephemeral.env` or similar); Hopper reads-uses-shreds with `[ "$EXIT" -eq 0 ] && rm -f` conditional gate OR decompose into two Bash-tool invocations.
12. **If PO surfaces apex-research cross-team work** (bidirectional cite-back, [CONTINUITY] adoption follow-up): spawn Cal for Companion-Pair Submission protocol filing.
13. **If PO surfaces Hopper-Amendment-5** (Layer-0 library-first discipline; n=3 strengthens with S37 in-session evidence): spawn Celes + Hopper + Brunel per S35 amendment-cycle pattern.
14. **If PO surfaces apex DB tunnel issues:** check `docs/operations-log-2026-05.md` for latest tunnel status; spawn Hopper for substrate diagnosis if tunnels degraded.
15. **Edit-tool-trap recovery primitive** (Wiki 116) applies to all agents doing scratchpad/index Edits during long-running batches; pre-load in spawn briefs if expecting >5 sequential Edits.
16. **contextToken 15-min friction note:** if S38 surfaces OKR or other Forge-app work requiring contextTokens, use Python wrapper script pattern (pre-written script + fast token-paste turnaround); each interim chat turn burns ~30s-2min of token life.

(*FR:Aen*)

---

## SESSION 36 WRAP — 2026-05-26 (One-day session ~2.5hr active; Round-1 op-step-1 prep complete + token-pending; 8 Cal entries shipped Wiki 107→114; comms.md v1.0→v1.4 wire-ready; 5 substrate-truth-evidence catches reshape Round-1 design)

**Spans:** 2026-05-26 ~10:55 (fresh team spawn) → ~13:24 (PO session-end signal). One day; ~2.5 hours active work; bandwidth-positive throughout.

**Outcome:** Round-1 op-step-1 EXECUTION-READY but token-pending. Hopper 4-deliverable prep complete with Tier-D sanction verbatim valid. Cal-side: 8 entries shipped + 2 amendments; substrate-design-truth-evidence cluster (2.5 + Recursive-Narrowing + 2.7 + Layer-0-library-first-recurrence) fully filed at four distinct coupling-dimensions. Herald comms.md v1.0→v1.4 wire-ready with AgentMailbox-as-separate-DO-class + ctx.waitUntil + Path-(a)-RPC + W4 connectivity-direction correction. Volta lifecycle.md amendments §VL3.1+§VL4.1+§VL5.1+PT4. Five substrate-truth-evidence catches reshape Round 1: (1) CF Access bypass canonical = NEW Access App with destinations[]; (2) Anthropic outbound-only connectivity; (3) wake = sessions.create() from mailbox handler; (4) three-layer identity chain (DO ID per-session not per-agent; AgentMailbox separate class); (5) secrets = egress-policy-header-injection-from-KV.

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `wiki/patterns/cluster-decomposition-meta-principle.md` (C1) | NEW | Cal (joint [brunel, volta]) | Meta-principle; n=3 coupling-dimensions × 3 domains |
| `wiki/gotchas/subagent-harness-blocks-curator-role-repo-write.md` | NEW | Cal solo | S35 carry-over filing |
| `wiki/patterns/bottleneck-determines-adoption.md` (C4) | NEW | Cal (joint [brunel, volta]) | n=3 across 2 domains; bidirectional YES+NO match; C1↔C4 methodology pair |
| `wiki/patterns/sub-shape-e-at-design-domain.md` (2.5) | NEW | Cal (joint [volta, herald, brunel, hopper]) | 4 sub-instances cross-author cross-document axis; full Stage 2 absorbed (4/4 direct-DM) |
| `wiki/patterns/three-layer-substrate-truth-discipline.md` | M (2.6 amendment) | Cal | n-count 3→6; design-domain sub-section; cross-link to 2.5 |
| `wiki/patterns/cluster-decomposition-meta-principle.md` | M (cross-link) | Cal | C1↔C4 methodology-corollary cross-link |
| `wiki/patterns/recursive-narrowing-substrate-truth-evidence-discipline.md` | NEW | Cal (joint [herald, brunel, finn]) | Within-author n=5 + cross-author n=4; sufficient × necessary logical decomposition |
| `wiki/patterns/three-role-discipline-stacking-within-dispatch-arc.md` (2.7) | NEW | Cal (joint [hopper, brunel, aen]) | Operator+designer+coordinator vantages; layer × role family-completion |
| `wiki/patterns/layer-0-library-first-recurrence.md` | NEW | Cal (joint [hopper, brunel, finn]) | 3-instance in-session catalog (S35 task #6 + S36 bypass-arc + S36 W4 skill-load) |
| `designs/new/cloudflare-pilot/comms.md` v1.0→v1.4 | M (+468 lines) | Herald (co-source [brunel, finn]) | AgentMailbox-as-separate-DO-class + waitUntil + RPC + W4; wire-ready |
| `designs/new/cloudflare-pilot/lifecycle.md` | M (+106 lines) | Volta | §VL3.1 R2 bucket layout + §VL4.1 respawn variant + §VL5.1 bootstrap + PT4 always-2xx |
| `docs/cf-pilot-status-and-s37-plan-2026-05-26.md` | NEW | Aen | Comprehensive PO-facing status report + S37 plan |
| `docs/webhook-sandbox-research-2026-05-26.md` | NEW | Finn | Task #6; ~600 lines; comprehensive surface map |
| `docs/herald-g2-cross-agent-comms-brief-2026-05-26.md` | NEW | Finn | G2 brief; ~330 lines; six-step cross-agent path |
| `docs/wake-mechanism-w4-finding-2026-05-26.md` | NEW | Finn | W4 brief; ~120 lines; resolves task #11 |
| `docs/round-1-anthropic-platform-checklist-2026-05-26.md` | NEW | Finn | Surface-1 checklist; ~210 lines; 6 sections |
| 6 scratchpads updated | M | brunel, callimachus, finn, hopper, team-lead, volta | + 1 untracked `docs/uikit-dev-harvest-2026-04-14.md` carry-forward |

### Decisions (PO-ratified)

[DECISION — S36] **Path 1 Isolate-only Round 1 ratified** (14:36). MicroVM defers to Round 2. Substrate-class held CONSTANT per substrate.md experimental-isolation discipline at Isolate class. Brunel-recommended. Already-deployed substrate exec-ready; no Docker / no v2 migration / no Workers Builds.

[DECISION — S36] **EVR Access bypass approach = path-rule on `/webhooks`** (14:00). Minimum-scope exception; rest of Worker remains Access-gated.

[DECISION — S36] **Hopper sanctioned to execute bypass + acquire CF auth** (14:36). Hopper becomes CF substrate operator; extends S35 Aen-direct precedent.

[DECISION — S36] **CF API Token provisioning committed but PENDING DELIVERY** (14:40 committed). 5 scopes (Workers Scripts Read, Access Apps and Policies Edit, KV Read, D1 Read, R2 Read), EVR-account-bounded, 24h TTL. **Sole Round-1 op-step-1 blocker.**

[DECISION — S36] **Tier-D sanction "Approve as drafted"** on Hopper Deliverable 2 (14:40 verbatim). Bypass command: NEW Access App with `destinations:[{type:"public", uri:"fr-cma-pilot.evree.workers.dev/webhooks"}]` + inline bypass policy. Brunel canonical-CF-API cross-read at 14:42 confirmed this shape is API-canonical (CF Access Policies API has no path-scope fields; path-scope lives on Application's destinations[]). 14:43 re-sanction against wrong-correction (policy-on-existing-app) moot/revoked per substrate-truth.

[DECISION — S36] **Pilot-A creation path = PO via CF dashboard** (14:43). Not service token. Path post-bypass: Agents → New Agent → Backend: Isolate → name: `pilot-a` → model: `claude-sonnet-4-6` → tools: [].

[DECISION — S36] **Finn-Q1 credential shape DEFERRED to S37** (14:43). Tracked as task #10. Load-bearing post-W4 (sessions.create scope on mailbox-handler credential is now required).

### Substantive learnings (Cal-grade or promotion-grade)

[LEARNED — substrate, promotion-grade] **CF Access bypass canonical pattern** (Brunel substrate-truth-evidence catch). Template docs phrasing ("Add Bypass policy under same application") is dashboard-UX-focused; CF API ref documents path-scope on `destinations[]` of Access Application, not on policies. Policy-on-existing-app would over-broaden auth across App's full destinations. **Layer-0 library-first must recursively descend through doc-provenance layers when consumer-team docs framing is mechanism-ambiguous.** Joint Brunel+Hopper Cal candidacy (filed as Layer-0-library-first-recurrence).

[LEARNED — substrate, promotion-grade] **Anthropic Managed Agents connectivity is outbound-only** (Finn `claude-api` skill catch). Worker long-polls Anthropic; Anthropic never dials our network. Reshapes wake-mechanism design from inverted-trigger framing to **`client.beta.sessions.create()` from mailbox handler** post-write + long-poll worker pickup. Resolves task #11.

[LEARNED — substrate, promotion-grade] **Identity is three-layer chain**: agent-name → agent_id → session_id → DO ID. DO ID is per-session not per-agent. **AgentMailbox must be separate DO class** (per-agent durable via `idFromName(agent_id)`) distinct from existing Sandbox/IsolateRunner classes (per-session ephemeral).

[LEARNED — substrate, promotion-grade] **Secrets injection mechanism**: egress-policy header-injection from KV `SECRETS` namespace, NOT secret_bindings[] on sandbox. Round 1 needs zero agent-side secrets; 4 Worker-level secrets are control-plane.

[LEARNED — process, promotion-grade] **Recursive-narrowing substrate-truth-evidence discipline** (Cal entry; joint Herald+Brunel+Finn): each substrate-truth pass on a single document catches blind-spots at progressively deeper architectural layers. Within-author n=5 on comms.md trajectory (v1.0→v1.4) + cross-author n=4 catalog. **Each pass narrows but doesn't eliminate — asymptotic, not terminal.** Architectural-depth as second axis (Brunel sharpening): rows 1-4 substrate-primitive-shape catches; row 5 connectivity-direction-model catch — qualitatively deeper layer.

[LEARNED — process, promotion-grade] **Expertise-routing as constitutive of recursive-narrowing**: discipline = iteration-tightens-framing × reviewer-substrate-knowledge-matches-current-layer. Each catcher in v1.0→v1.4 chain had substrate-expertise matched to version's depth (Herald protocol-shape / Brunel identity+DO-semantics / Brunel waitUntil / Finn RPC-vs-HTTP / Finn skill-load Anthropic-canonical). Cross-team test of pattern is whether expertise-routing happens naturally OR requires conscious management.

[LEARNED — process, promotion-grade] **Three-role discipline-stacking across dispatch arcs** (Cal entry; joint Hopper+Brunel+Aen): operator hard-gate + designer substrate-truth-cross-read + coordinator relay-fidelity-correction catches what each role alone misses. n=3 instances S34/S35/S36. Family-completion claim: layer-decomposition × role-decomposition = full operational shape of substrate-truth-evidence discipline.

[LEARNED — process] **Stage-2-feedback typology has 5 empirical shapes this session**: Shape-A pure-renaming + Shape-B forward-claim-extension + Shape-C mechanism-sharpening-within-claim-base + Shape-D factual-correction-on-inferred-content (FLAG-invited) + Shape-E axis-distinction-discipline-check. Author-stylistic-tendency hypothesis: Brunel→Shape-B; Volta→Shape-A+C. Cal+Volta cross-role topology n=2 trigger for typology entry candidate. n=2 of S6-narrowing observation now n=5 cumulative confirmation (C4+2.5+2.6+RN+2.7+Layer-0 all drafted clean Stage 1 solo-author despite joint-source).

[LEARNED — process] **Asymmetric-cross-in-flight is routing-mode-dependent** (Cal+Aen co-articulated). Empirically confirmed n=4: ALL 4 author 2.5 Stage 2 replies arrived via direct-DM channel; ZERO via Aen-coordinator-routed burst. 3-vector framework (i Aen→others / ii Aen←others / iii Cal↔peers). Hypothesis: routing-mode (direct DM vs coordinator-relay) is latency-determining property. Wiki-process candidate joint-authorship-topology-broadening promotes from watch-grade to candidate.

[LEARNED — process] **Cadence-cross density during bandwidth-positive sessions**: Cal-Aen n=10+, Herald-Aen n=6, Finn-Aen-Cal triangle n=1. Pattern structural at sub-100-second crossing window. E4 entry promotion-grade-at-first-filing per evidence density.

### Standing watch items going into session 37

- **CF API Token delivery** (the only Round-1 op-step-1 blocker)
- **Anthropic credential shape decision** (task #10; Finn brief enumerates options; sessions.create scope is the load-bearing requirement)
- **Pilot-A creation via CF dashboard** (PO 5-click action post-bypass; status report has the exact path)
- **Cal-queue carry-forward** — ~7 fully-framed candidates: Edit-tool-trap (promotion-grade Cal+Finn; Finn mechanism correction folded — Write invalidates Read-state, deterministic not statistical); C2 substrate-vs-framework boundary primitive (Volta-axes-enumeration ready: lifecycle-phase + failure-semantics + Brunel substrate-class-fit); S6 drafting-vs-read-back-phase yield narrowing (n=5 cumulative confirmation); Stage-2-feedback typology entry (Cal+Volta 5-shapes-this-session); cadence-crossing E4 (Aen+Herald n=6 + asymmetric-cross 3-vector sub-section Cal+Aen); routing-by-action pattern+failure-mode paired (Herald-origin); Stage-0-contribution-from-filer (sketch-grade; n=1 in-vivo)
- **Cal Stage 2 absorption still in-flight async**: Recursive-Narrowing (Herald-acked; Brunel + Finn pending direct-DM); 2.7 (Hopper-acked; Brunel pending); Layer-0-library-first-recurrence (Hopper + Brunel + Finn all pending) — natural resolution as direct-DMs arrive next session
- **Brunel substrate.md amendment** queued post-Round-1: §2 Isolate-pivot, §3 egress-policy schema, §4 layered-chain rewrite, §5 Q3/Q4/Q5 answered
- **Herald axis-distinction sharpening to Brunel** in-flight (recursion-locus hypothesis; Brunel will respond direct)
- **S35-carry-forward standing watch (unchanged):** Brunel-Amendment parallel-to-Hopper-4 (Layer-1-only Diagnostic Discipline gap); Hopper-Amendment-5 candidate (Layer-0 library-first; n=3 in-session today strengthens to n=2 across sessions); "PO" → "Mihkel/you" naming convention
- **Aen amendment Part C (relay-visibility rule)** — HELD at `designs/deployed/operator-role/prompts/aeneas-amendment.md`; potentially revisited per session
- **TPS-583 (apex-research)** — Stage-2 standard moves when PO signals; dormant
- **mVox-dev session 8+ carry-forward** (Palestrina 3 deferred items) — dormant
- **Manager-team / PO-team architecture** (Monte domain) — dormant; PO floated 2026-05-20, not actioned

### NEXT-SESSION BOOT (re-orient instructions for S37)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — that's the 5-bullet reorientation seed per A1 adoption. Read it FIRST, then downgrade the tag to `[PROCESSED YYYY-MM-DD]` once processed.
3. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **READ THE STATUS REPORT FIRST IF PO ASKS ABOUT CF PILOT:** `teams/framework-research/docs/cf-pilot-status-and-s37-plan-2026-05-26.md` is THE canonical S37 brief — has everything: S35 substrate state + S36 decisions + token specification + S37 critical-path sequence + risk register. Don't re-derive context that's already in this doc.
6. **If PO delivers CF API token (MOST LIKELY first ask):** spawn Hopper. His 4-deliverable prep is in his scratchpad; execution path locked at Path D — pre-flight verify → Tier-R L3 batch → STOP at surface-back gate → PO clearance via me → Tier-D bypass POST per 14:34-with-destinations[] shape (PO 14:40 sanction valid; 14:43 re-sanction moot per substrate-truth) → 30-60s propagation → 3-probe verification → ops-log entry. ~5-10 min total. Verbatim sanction quote: "**PO 2026-05-26 14:40 — 'Approve as drafted'** against Hopper's Deliverable 2 curl POST to `https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/access/apps`..." (full quote in cf-pilot-status-and-s37-plan §2.4 Deliverable 2 + Hopper scratchpad).
7. **If PO surfaces credential shape decision (task #10):** Finn brief at `docs/webhook-sandbox-research-2026-05-26.md` §2 has three failure modes documented. Single-OAuth vs three-credential split (WEBHOOK_SECRET + ANTHROPIC_ENVIRONMENT_KEY + ANTHROPIC_API_KEY) per CMA reference impl. Affects which credential mailbox-handler uses for `client.beta.sessions.create()`.
8. **If PO surfaces Pilot-A creation:** dashboard click-path is Agents → New Agent → Backend: Isolate → name: `pilot-a` → model: `claude-sonnet-4-6` → tools: `[]`. Hopper verifies via `wrangler d1 execute fr-cma-pilot-db --remote --command "SELECT agent_id, backend, created_at FROM agent_backends ORDER BY created_at DESC LIMIT 5"` post-creation.
9. **If PO surfaces Cal-queue continuation:** spawn Cal. ~7 entry candidates fully framed in her scratchpad. Edit-tool-trap (joint Cal+Finn; promotion-grade at first-filing per Finn mechanism correction — Write invalidates Read-state deterministic, not statistical) is the natural first entry. Then C2 substrate-vs-framework boundary primitive (joint with Volta; her axes-of-bifurcation enumeration ready). Pre-specified §1-§6 frames locked for all candidates. Also: Stage 2 absorption still in-flight on Recursive-Narrowing + 2.7 + Layer-0 — natural resolution as direct-DMs arrive.
10. **If PO surfaces Herald v1.4 close-out / Brunel substrate.md amendment / S35-carry-forward standing watch items (Brunel-Amendment / Hopper-Amendment-5 / naming convention):** spawn relevant agent. S35-carry-forward items unchanged from S35 standing watch.
11. **If PO surfaces apex-research cross-team work** (bidirectional cite-back, [CONTINUITY] adoption follow-up): spawn Cal for Companion-Pair Submission protocol filing.
12. **Cross-in-flight pattern awareness for me as team-lead:** asymmetric-cross is empirically confirmed routing-mode-dependent — Aen-coordinator-routed messages have structurally-elevated arrival latency vs direct-DM. When routing Stage 2 surfaces, recommend agents use direct-DM rather than team-lead-relay; reserve team-lead-routing for genuinely needs-coordination cases.
13. **Brevity discipline acknowledged:** consolidation-phase ratifications can be brief acks; substantive co-articulation warrants full contribution. Both compose. Document this distinction in scratchpad as discipline norm.

(*FR:Aen*)

---

## SESSION 35 WRAP — 2026-05-21 → 2026-05-26 (Six-day session; 10 tasks closed; Cloudflare research-and-execution arc landed in-session; A1 NEXT SESSION seed bootstrap above is part of this session's lasting structural artifact)

**Spans:** 2026-05-21 09:33 → 2026-05-26 ~13:30. Six calendar days. Longest session in FR history by wide margin.

**Outcome:** Substantial cross-track progress on (a) S34 carry-forward Cal-Protocol-A submissions (Phase A complete; Phase B Hopper-Amendment-4 landed); (b) mVox-dev investigation + research-perspective companion (catalyzed PO dual-perspective discipline correction); (c) **Cloudflare Claude Managed Agents pilot — designed AND Round 0 substrate validated end-to-end on EVR account**, dashboard live, ready for Round 1 sandbox creation; (d) apex DB tunnel operational incident resolved via Aen-direct Path B execution (PO authorization extension); (e) A1 mVox-M1-seed adoption (this session's seed above is the first instance — discipline self-application).

### Outcomes shipped

| Artifact | Δ | Owner | Notes |
|---|---|---|---|
| `wiki/patterns/discriminator-anchored-on-sub-canonical-source.md` | NEW | Cal (Brunel + Hopper joint source) | Phase A task #1 |
| `wiki/patterns/three-layer-substrate-truth-discipline.md` | NEW + E1 staleness refresh | Cal (Brunel + Hopper joint source) | Phase A task #2 + Cal Priority 3 (S35 docs/findings.md fold) |
| `prompts/hopper.md` lines 130-211 (Hopper-Amendment-4) | NEW | Celes-drafted + Hopper author-of-record + Brunel architectural co-author | Phase B task #3 — three-layer Diagnostic Discipline section |
| `docs/findings.md` | NEW (cross-cutting) | Brunel + Volta joint (Cal filed) | Task #7 — substrate gap analysis vs Cloudflare; FR-as-multi-agent-coordination-layer-above-single-agent-substrates positioning + bottleneck-alignment n=3 + cluster-decomposition meta-principle (strongest finding) |
| `designs/new/cloudflare-pilot/` (README + substrate.md + lifecycle.md + comms.md) | NEW | Aen-synthesis of Brunel + Volta + Herald briefs | Task #10 — pilot experiment design |
| `docs/operations-log-2026-05.md` (entries #7, #8, #9) | +204 lines | Hopper | Task #6 apex DB tunnel diagnostic + verification |
| Apex DB tunnels recovered via Path B | Operator-side action | Aen (PO-authorized direct execution) | Killed Windows-side orphan tunnel tree + restarted Task Scheduler; substrate-truth-anchored discovery: TNS-bytes probe was flawed fingerprint; substrate-probe-design itself can be sub-canonical source |
| `auto-memory/feedback_dual_perspective_remote_team_observation.md` | NEW | Aen (PO 2026-05-22 correction) | We-as-target AND we-as-researchers discipline; saved durably |
| Cloudflare `fr-cma-pilot` Worker deployment | Operational substrate on EVR | Aen direct | KV (2) + D1 + R2 + 4 secrets + Anthropic Self-managed env wired |
| Cross-team consultation with Schliemann (apex-research) | Cross-team comms | Aen + Volta findings relayed | Apex adopted [CONTINUITY] tag (2 design hooks Aen-articulated); FR adopted M1 seed (this artifact instantiates) — decomposition pattern n=2 cross-team |

10 tasks closed (#1-#8, #10); 1 in_progress (#9 Cal queue absorption, carries to S36).

### Decisions (PO-ratified)

[DECISION — S35] **A1 (mVox M1 NEXT SESSION seed) adopted for FR.** PO ratified 2026-05-22 ~13:15 after Volta task #4 investigation. Evidence-first approach: A1 only (not A2/A3); audit at S40-42 per Volta thread-2 procedural-vs-structural framing. **This session's [NEXT SESSION] seed (above the wrap) is the bootstrap-write — discipline self-applies from session-1.**

[DECISION — S35] **Cloudflare pilot proceeds on EVR account with experimental `fr-cma-pilot` naming.** PO ratified 2026-05-26 after Workers-Paid tier check on EVR + individual-account-Probably-free inference. Naming discipline keeps experimental artifacts visually distinct from production (`conversations`, `vestlused`, `apex-research`).

[DECISION — S35] **Round 0 (substrate smoke test) is the closure point this session.** Round 1+ (sandbox creation + actual session-running) defers to S36+ in fresh-session form. Multi-session experiment per PO 2026-05-26 AskUserQuestion answer.

[DECISION — S35] **Anthropic OAuth token (subscription-based, sk-ant-oat...) used as ANTHROPIC_API_KEY** for pilot Round 0 per PO direction "use same key we are using right here." Three caveats noted (token expiration, header-format compatibility, audit attribution); tolerable for experimental pilot, would matter for production.

[DECISION — S35] **Aen-direct execution sanctioned by PO for substrate operations** that Hopper couldn't reach via SSH paths. Two instances: (a) apex DB tunnel Windows-side teardown + restart (Path B); (b) Cloudflare pilot deployment + secrets-upload. Coordinator-only restriction overridden for operational obstacles per explicit PO direction "perform all actions yourself, dont depend on me."

[DECISION — S35] **Dual-perspective discipline enshrined via feedback auto-memory.** PO 2026-05-22 correction: when assessing remote-team practices (or any cross-team observation), apply BOTH we-as-target (adoption decision) AND we-as-researchers (framework finding) explicitly + foregrounded. Saved as `feedback_dual_perspective_remote_team_observation.md`. Applied retroactively to Volta thread-5 research-perspective companion (task #5).

### Substantive learnings (Cal-grade candidates)

[LEARNED — promotion-grade, framework] **Cluster-decomposition meta-principle** (docs/findings.md §S4 — strongest single finding from task #7). Clusters decompose along their coupling-dimension; coupling-dimension is the load-bearing property to identify when observing any cluster. n=3 origin observations (mVox M1-M5 team-property coupling / Cloudflare 7-mechanism cluster team-property coupling / Sub-shape E 3 layers ownership-locus coupling). Methodology corollary: decompositions invisible at n=1, emerge at n=2 with second instance providing variation along the coupling-dimension. Cal-Protocol-A queue item C1 — highest sequencing priority.

[LEARNED — promotion-grade, framework] **Bottleneck-determines-adoption is cross-domain.** Volta thread-3 generalizes from discipline-domain (S35 mVox M1+M3 vs FR vs apex bottleneck-shapes) to substrate-domain (Cloudflare adoption per FR-shipped-team bottleneck). n=3 corroboration across two domains. Two-condition rule: bottleneck matches substrate strength AND workload fits substrate constraints. Cal-Protocol-A queue item C4.

[LEARNED — promotion-grade, framework] **Sub-shape E substrate-class-invariant at n=2** (docs/findings.md §S5). Three-layer substrate-truth model (S34 Docker-on-RC n=1) now confirmed at n=2 under Cloudflare-managed substrate. Drift surfaces redistribute predictably when ownership locus shifts; surfaces themselves persist. Wiki confidence promoted medium → medium-high. Independent vendor corroboration via Cloudflare's own gotchas section in `connecting-to-private-services.md` (4 distinct drift instances vendor-documented). Cal-Protocol-A queue item E1.

[LEARNED — promotion-grade, framework] **Substrate-vs-framework boundary primitive.** docs/findings.md §S1 + §S2 — Cloudflare's brain-hands decoupling IS the substrate primitive; FR's multi-agent coordination is the framework layer above it. "We stack, not compete." Bounded extension: "brain-hands decoupling" (Cloudflare vocabulary) and substrate-vs-framework-boundary (FR vocabulary) are the same boundary named from two sides. Cal-Protocol-A queue item C2.

[LEARNED — process, promotion-grade] **Dual-perspective discipline** (PO 2026-05-22 correction). Cross-team observation requires we-as-target AND we-as-researchers framings explicit + foregrounded — not woven in. Saved to auto-memory + applied to Volta task #5 (Aen re-dispatched after correction). Generalizable beyond cross-team contexts: applies whenever FR observes any external pattern (substrate, vendor, sibling team, framework primitive).

[LEARNED — promotion-grade, process] **Dyad-cross-pattern has TWO failure modes** (Volta phrasing at task #7 polish-pass): (a) drift-loop — genuine miscommunication, content diverges, reconciliation cost grows; (b) affirmation-loop — content converged early, subsequent passes only re-affirm closure without adding content. Discriminator: substantive-content-added vs only-affirmation. Recovery mechanisms: team-lead intervention at ~5+ passes (Aen 13:14 deliver-NOW); dyad-side fast-forward maps at ~3+ passes (Volta 17:25 consolidates state in single read). Both empirically demonstrated in task #7 polish-pass execution. Cal-Protocol-A queue item E4.

[LEARNED — process] **Lifecycle-phase-invariance corollary.** Volta §VL4 in cloudflare-pilot/lifecycle.md: startup-side bifurcation symmetric with shutdown-side bifurcation (docs/findings.md §V3). Substrate-vs-framework boundary is operationally invariant across lifecycle phase (startup + runtime + shutdown all bifurcate the same way). Round 1 pilot will exhibit all three phases under CF substrate — empirical confirmation by construction.

[LEARNED — promotion-grade, process] **Credibility-floor preamble for cross-team observation** (Volta thread-4 obs-2, materialized in docs/findings.md Preamble). Four load-bearing-implicit Cloudflare claims explicitly enumerated; downstream conclusions bounded against them. Independent vendor's own gotchas section corroborates. Cal-Protocol-A queue item — generalizes beyond Cloudflare context to all announcement-grade source interpretation.

[LEARNED — promotion-grade, substrate] **Substrate-probe-design CAN be sub-canonical source itself.** Aen-surfaced (apex DB tunnel post-restart): TNS-bytes probe was anchored on assumed Oracle protocol behavior (responds to any input), but Oracle TNS doesn't respond to malformed input. Extends discriminator-anchored-on-sub-canonical-source.md from "discriminator anchors on inferred-grammar" to "probe semantics anchor on assumed-protocol-behavior" — same defect class. Hopper folded into her scratchpad. Cal-Protocol-A queue item (potentially A.3 sub-shape; Brunel-question on naming).

[LEARNED — process] **Library-first-before-investigating** is a Tier R primitive that precedes substrate probes (Layer-0 before Layer 1/2/3). Aen-surfaced during apex DB tunnel arc — should have queried wiki BEFORE dispatching Hopper to substrate-probe. Carry-forward as Hopper-Amendment-5 candidate; not surfaced this session per batched-iterate compact with Celes.

[LEARNED — substrate, Cloudflare integration] **Anthropic supports TWO self-hosted patterns for Claude Managed Agents.** Console default (low-code flow) is CLI-polling via `ant` CLI; CF template uses webhook-driven. Different positions on substrate-vs-framework boundary, both available from same platform. Worth Cal-Protocol-A note as cross-pattern observation.

[LEARNED — substrate, Cloudflare integration] **EVR Cloudflare Access org-wide policy auto-secures the deployed Worker.** README §8 warned default state is insecure; EVR's policy makes it secure-by-default. But blocks Anthropic webhook delivery on `/webhooks` until path-bypass added. Worth Cal note as substrate-environment-defaults-matter pattern.

[LEARNED — process] **Harness-restriction blocks subagent from writing report-pattern files.** Cal (subagent) couldn't write `docs/findings.md` — error `"Subagents should return findings as text, not write report files."` Workaround: Cal ships content via SendMessage; Aen writes from main session. Sub-shape-E-type structural gap between team-design (Cal has wiki writer authority by convention) and substrate-implementation (subagent harness pattern-matches and blocks). Cal-Protocol-A queue item.

### Standing watch items going into session 36

- **Cloudflare pilot Round 1** — substrate ready; needs `/webhooks` Access bypass + first sandbox creation + trigger session via Anthropic. Round 1 spec at `designs/new/cloudflare-pilot/README.md`. **Most likely first dispatch surface for S36.**
- **Cal-Protocol-A queue ~10 items** — Cal in_progress on task #9. After Phase-A (Priority 1+3+E1) landed; remaining: C1+C4+C2+C3+E2/E3/E4 + harness-restriction Sub-shape-E + orphan-leaf-detector for windows-bridge + Sub-shape A.3 probe-design + Pass-1-prose-only-batched-iterate + mVox-thread-1/3/4 + Companion-Pair filing for [CONTINUITY]/A1. Cal sequences per bandwidth.
- **Brunel-side parallel amendment to `prompts/brunel.md`** §Diagnostic Discipline (Layer-1-only gap; same shape as Hopper-Amendment-4). Celes-routed when scheduled.
- **Hopper-Amendment-5 candidate** (Layer-0 library-first discipline). Hopper batched-iterate compact with Celes: deferred to future amendment-pass.
- **Apex-research bidirectional cite-back** — if Eratosthenes files apex-side wiki entry for [CONTINUITY] adoption or related cross-pollination, Cal handles via Companion-Pair protocol.
- **A1 evidence-cycle audit at S40-42** — measure whether the M1 seed pattern actually reduces team-lead reorientation tax. If yes, A2/A3 expand. If no, learn what shape didn't fit.
- **Manager-team / PO-team architecture** (Monte domain; carried since 2026-05-20) — PO floated; not actioned. Surface if PO returns to it.
- **Aen amendment Part C (relay-visibility rule)** — HELD at `designs/deployed/operator-role/prompts/aeneas-amendment.md`. PO may revisit.
- **mVox-dev session 8 carry-forward** (Palestrina 3 deferred items: path convention, CLAUDE.md drift, polyphony-isms). Dormant unless PO surfaces.
- **Volta evaluates mVox-dev startup procedure** — partially-done via task #4; could revisit for additional comparison if PO surfaces.
- **TPS-583 (apex-research)** — Stage-2 standard moves when PO signals Ruth progressed. Dormant.
- **"PO" → "Mihkel/you" naming convention question** (PO surfaced 2026-05-22 13:15 ish). Not resolved beyond conversation; common-prompt + agent prompts still use "PO". PO may direct a renaming pass.

### NEXT-SESSION BOOT (re-orient instructions for S36)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Read the [NEXT SESSION] M1 seed at the TOP of this scratchpad** — that's the 5-bullet reorientation seed per A1 adoption. Read it FIRST, then downgrade the tag to `[PROCESSED 2026-05-XX]` once processed.
3. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces Cloudflare pilot Round 1 (MOST LIKELY first ask):** read `designs/new/cloudflare-pilot/README.md` Round 1 spec + sub-briefs. Spawn Brunel + Volta + Herald for the design-side; possibly Hopper for substrate-operational verification. First operational step: address EVR Cloudflare Access wall on `/webhooks` — needs PO dashboard action OR sanction for me to add path-bypass via `wrangler` if API allows. Then PO creates first Isolate-backed sandbox in `https://fr-cma-pilot.evree.workers.dev/` dashboard. Then trigger session via Anthropic platform → observe webhook delivery → sandbox creation in CF → response.
6. **If PO surfaces Cal-Protocol-A queue continuation:** spawn Cal. Her task #9 stays in_progress; she sequences per bandwidth. Top of queue: C1 cluster-decomposition (strongest), then E1 amendments (already partially done — Sub-shape E n=2 + staleness refresh), then C4 bottleneck-determines-X cross-domain, then C2 substrate-vs-framework boundary primitive. ~10 items total in queue.
7. **If PO surfaces Brunel-side parallel amendment** to `prompts/brunel.md` (Layer-1-only gap same as Hopper-Amendment-4): spawn Celes + Brunel (as author-of-record) + Hopper (cross-reviewer for symmetry). Same joint-review pattern as task #3.
8. **If PO surfaces Hopper-Amendment-5 candidate** (Layer-0 library-first discipline): spawn Celes + Hopper + Brunel. Hopper has the candidate prose in her scratchpad; honor batched-iterate compact (Layer-0 sub-pattern is one-amendment-cycle separate from Amendment-4).
9. **If PO surfaces "PO" → "Mihkel/you" naming convention question:** this affects common-prompt + all agent prompts + roster. Coordinate Celes (prompt-side curation) + Cal (wiki cross-references) for the rename pass.
10. **If PO surfaces A1 evidence-cycle audit** (planned S40-42): measure whether M1 seed reduced team-lead reorientation tax this session. Compare S36 startup-time to S34/S35 startup-times (subjective; PO will say). If subjective improvement is real, A2/A3 expand; if not, learn what shape didn't fit.
11. **If PO surfaces apex-research cross-team work** (bidirectional cite-back, [CONTINUITY] adoption follow-up, Companion-Pair filing for FR-M1 + apex-M3): spawn Cal for Companion-Pair Submission protocol filing.
12. **First operational item if Cal-spawning at S36 start:** route any pending Protocol A submissions from S35 carry-forward queue. Cal had ~10 items queued at S35 close. Surface-grade work present regardless of PO direction.
13. **Apex DB tunnels** — operational substrate verified stable at S35 close (third-generation inodes confirmed evolving normally per Hopper task #6). No watch action needed unless PO reports apex team re-flags.

(*FR:Aen*)

---

## SESSION 34 WRAP — 2026-05-20 → 2026-05-21 (Hopper's first dispatch — apex-research authorized_keys multi-key persistence; original PO ask ACHIEVED; degraded-substrate diagnostic prevented multi-system credential cascade; Sub-shape A-E pattern catalog + 3-layer substrate-truth discipline crystallized)

**Spans:** Multi-day session 2026-05-20 → 2026-05-21 (apex team's voluntary maintenance window enabled the recreate). Single dispatch arc, but the diagnostic depth made it the richest dispatch in FR history.

**Outcome:** Original PO ask — "Aleksandr's SSH key persists across apex container rebuilds" — fully ACHIEVED at 09:18 on 2026-05-21. Apex container now has canonical `.env` at `$COMPOSE_DIR` (PO/Aleksandr/rc-connect in SLOTS 1/2/3) + amended operational compose-yml (declares GH_TOKEN per PO direction) + recreated container Config.Env (all declared tokens propagated). Future recreates reproduce the state.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `teams/framework-research/docs/operations-log-2026-05.md` | NEW (6 append-only entries spanning the full arc) | Hopper | committed across `b802c31`, `62a0e2a`, `3f74987`, `0e7fe8f` |
| `teams/framework-research/memory/hopper.md` | NEW (first-dispatch carry-forward; apex substrate-facts; n=4 Sub-shape A catalog; revert-on-invalidated-premise discipline) | Hopper | `b802c31`, `296bc83`, `0e7fe8f` |
| `teams/framework-research/memory/brunel.md` | S34 entry added (sub-shape A-F→A-E catalog, 3-layer model, recovery-pattern articulation); pruned to 94 lines | Brunel | `296bc83` |
| `teams/framework-research/docs/apex-keys-dispatch-2026-05-20-findings.md` | NEW (PO-facing memo; full arc + open questions) | Aen | `b802c31`, then cleanup at `296bc83` |
| `teams/framework-research/docs/apex-keys-diff-2026-05-20.md` | NEW (P2 substrate-state diff: backup `.env` vs container Config.Env, redacted) | Hopper | `3f74987` |
| `designs/new/apex-keys-phase1-redux-dispatch.md` | NEW (executable dispatch design; Tier R + Tier M `.env` write) | Aen | `690457b` |
| `designs/new/apex-keys-phase2-recreate-dispatch.md` | NEW (executable dispatch design; Tier D recreate + PO sanction package) | Aen | `abfb026` |
| `teams/framework-research/restore-inboxes.sh` | M (count-check fix: tolerate `dest > source` per Step 2c ghost pre-create; matches persist-inboxes.sh `-lt` pattern) | Aen | `b802c31` |
| Apex production container | RECREATED via PO-sanctioned Tier D | Hopper P4.2 | substrate-side; ops-log entry at 09:18 |

8 commits shipped this session: `b802c31`, `296bc83`, `62a0e2a`, `3f74987`, `690457b`, `abfb026`, `0e7fe8f` (plus one prior session-end commit `e12e810` from S33+ that bridges).

### Decisions (PO-ratified)

[DECISION — session 34] **Phase 2 r3 recreate RESCINDED mid-execution** after P1.2c three-probe batch revealed degraded substrate state (no `.env` at `$COMPOSE_DIR`; container surviving on pre-2026-04-29-fresh-clone Config.Env; recreate would have wiped SSH + GitHub + Atlassian + Cloudflare credentials simultaneously). Multi-system failure prevented by Hopper's hard-gate discipline.

[DECISION — session 34] **Two-phase plan: Phase-1-Redux (Tier M `.env` write) + Phase 2 (Tier D recreate).** Phase-1-Redux executable when apex team in maintenance window. Phase 2 PO-sanctioned verbatim 2026-05-20 19:01 ("Approve as drafted") against the recreate command + reason + expected outcome.

[DECISION — session 34] **GH_TOKEN preserved across recreate via P4.05 compose-yml amendment.** PO objection at 19:35 reversed my 19:34 Option A sanction ("substrate-correction normalization" — drop GH_TOKEN). PO direction: "if they have it right now, then why would we take away from them." P4.05 Tier M added `- GH_TOKEN=${GH_TOKEN:-}` to operational compose-yml's apex-research env block before P4.2 recreate.

[DECISION — session 34] **Apex maintenance window IS the recreate window** (not "wait until they're back"). PO clarification 2026-05-20: apex team voluntarily took agents offline SPECIFICALLY to enable our Phase 2 recreate without disrupting their sessions. Reframed Phase-1-Redux preconditions; both phases executed in the same window.

### Substantive learnings (Cal-grade candidates; pre-drafted in scratchpads)

[LEARNED — substrate, promotion-grade] **Sub-shape A: discriminator-anchored-on-sub-canonical-source.** Four self-instances within one dispatch arc, all in Brunel's dispatch-authoring text, all caught by Hopper's hard-gate discipline:
- A.1 (identifier-grammar): P1.1 `michelek` regex (template-stub vs live), P1.2a label-key typo (inferred underscore vs canonical dot), P3.6 pass-criterion `[A-Z_]+` (digit-exclusion)
- A.2 (multi-layer-transit): P4.05 awk script (PowerShell→bash→awk escape chain failed at innermost layer's grammar)
- **Recovery pattern:** substrate-live-state-as-discriminator-source + JSON-dump-on-empty for within-dispatch-agency disambiguation
- **Sub-discipline:** "stress-test multi-layer transit against the innermost layer's grammar before relying on layered-escape correctness" (Brunel session-end articulation)

[LEARNED — substrate, promotion-grade] **Sub-shape E: substrate-ownership-vs-design-ownership.** Headline of the joint wiki entry. FR ships design templates (Layer 1); consumer team operationalizes by forking/copying into their own repo (Layer 2); running container state diverges further (Layer 3). Three drift instances materialized in this single arc: SLOT 3 added in apex's compose-yml (Layer 1↔2), env-block size drift (Layer 1↔2), GH_TOKEN in Config.Env not declared in operational compose-yml (Layer 2↔3). **FR's read-deployed-artifacts discipline reads Layer 1 only — insufficient for FR-shipped substrates consumer teams operationalize.**

[LEARNED — process, promotion-grade] **Three-layer substrate-truth discipline** (joint Brunel architectural + Hopper operator-defense). Required reads: FR design + operational copy + runtime container state. Cheap when Tier R; conclusive when authoritative; substrate-live-state beats offline inference at every layer. Companion Hopper-Amendment-4 candidate (three-layer Diagnostic Discipline added to her existing read-deployed-artifacts-before-executing section) for Celes routing next session.

[LEARNED — process, promotion-grade] **Discipline-catches-discipline-drift across THREE roles in one dispatch arc.** Operator layer (Hopper's hard-gates caught Brunel's regex/script defects at P1.1, P1.2a, P3.6, P4.05); tasker layer (Brunel's own self-corrections + recovery-pattern articulation); design layer (PO's GH_TOKEN preservation objection against Aen+Brunel's "normalization" framing). Layered discipline catches single-layer drift across all three roles in the same dispatch arc. Strengthens existing pattern beyond two-role variants.

[LEARNED — process] **Relay-fidelity-mid-conversation gap** = Stage-2 extension of `relay-to-primary-artifact-fidelity-discipline.md`. When tasker introduces a framing that contradicts prior dispatch text (or relays mid-conversation PO framing), primary-artifact check the registry/source-of-truth BEFORE propagating to downstream operator. Instances this arc: my 17:47 wrong-host propagation (PO mis-read retracted at 18:08); my 19:34 substrate-correction-normalization ratification (PO objected at 19:35). Both caught by PO at design layer; the discipline applies to tasker layer too.

[LEARNED — process] **Append-only ops-log vs working-memory scratchpad have different revert semantics by design** (Hopper's session-end articulation). Ops-log: revert via NEW entry referencing the entry to supersede; never in-place. Scratchpad: revert via direct edits to pre-amendment state + clean-up `[LEARNED]` capturing the lesson. The point of working memory is to be operationally correct NOW, not to preserve every intermediate state on disk.

[LEARNED — process] **Amendment authoring is itself a substrate-truth-anchored operation.** The substrate-of-truth is the verbatim error output. Discipline: "don't compose amendment without the actual error" (Aen 09:18 articulation; Brunel ratification). Recovery-discipline companion to Sub-shape A failure-mode catalog.

### Standing watch items going into session 35

- **Cal-Protocol-A submissions pending** — Hopper + Brunel pre-drafted two joint wiki entries in their scratchpads + Hopper-Amendment-4 candidate. Need Celes online next session for prompt-amendment ratification, Cal online for wiki authoring. Three artifacts: (a) `wiki/patterns/discriminator-anchored-on-sub-canonical-source.md` (Brunel-authored, n=4 catalog with A.1/A.2 sub-distinction); (b) `wiki/patterns/three-layer-substrate-truth-discipline.md` (joint Brunel + Hopper); (c) Hopper-Amendment-4 (three-layer Diagnostic Discipline prompt amendment, Celes-routed).
- **apex team back online post-rebuild** — they returned at ~09:30 on 2026-05-21 (PO observation). Substrate is canonical-recreate-safe; they should notice no disruption. Bidirectional cite-back from Eratosthenes still possible if apex files their own version of any of our learnings.
- **Aen amendment Part C (relay-visibility rule) — HELD** at `designs/deployed/operator-role/prompts/aeneas-amendment.md`. PO may revisit if a future incident surfaces silent-relay-scope-broadening; not actioned this session.
- **mvox-dev session 8 carry-forward** (from S33+) — Palestrina had 3 deferred items. Still dormant; surfaces if PO references mvox outcomes.
- **Manager-team / PO-team architecture** (from S33+) — Monte design surface; PO floated 2026-05-20 EOS. Not actioned this session.
- **Volta evaluates mvox-dev startup procedure** (from S33+) — Volta-routed comparison work. Not actioned this session.
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed, action Stage-2 standard moves.
- **Brunel-as-spec-author pattern n=1** (from S33+) — watch for n=2 confirmation.
- **Sub-shape F catalog candidate WITHDRAWN** — was filed mid-session as "registry-entry-choice-from-first-match" against a wrong-host claim that PO retracted at 18:08. Not a valid instance from this dispatch.

### NEXT-SESSION BOOT (re-orient instructions for S35)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces Cal-Protocol-A submission work** for the S34 learnings (most likely first ask if PO surfaces FR work next session): spawn Cal for wiki authoring + Brunel + Hopper for joint-authorship review of the three pre-drafted artifacts (see Standing watch item #1). Their scratchpads have the substantive drafts; Cal authors the canonical wiki entries from those + cross-link to ops-log-2026-05.md catalyzing-incident entries.
5. **If PO surfaces Hopper-Amendment-4 prompt amendment** (three-layer Diagnostic Discipline): spawn Celes for prompt-amendment work + Hopper + Brunel for joint-authorship review. Amendment text body is in Hopper's 19:35 message + Brunel's 19:37 elaboration from this session (cross-reference ops-log-2026-05.md for transcript).
6. **If PO surfaces apex-research bidirectional cite-back** (Eratosthenes Protocol A filing referencing our wiki post-rebuild): spawn Cal for cross-team cite-and-fold via Protocol A.
7. **If PO surfaces Aen amendment Part C revisit:** `designs/deployed/operator-role/prompts/aeneas-amendment.md` is the starting artifact. Decide land-now vs further-deliberate.
8. **If PO surfaces "design another team"** (Celes-design-discipline at n=3 from S33+): same workflow shape — brainstorm → naming proposals + structural decisions (PO pause-point) → atomic-commit drafting at `designs/new/<team>/` → TL review → deploy + mv to `designs/deployed/`.
9. **If PO surfaces manager-team / PO-team architecture** (from S33+ standing watch): Monte's domain; spawn Monte + Cal.
10. **If PO surfaces Volta evaluates mvox-dev startup** (from S33+ standing watch): spawn Volta against `~/Documents/github/.mmp/mvox_v4e_web/teams/mvox-dev/startup.md`.
11. **First operational item if Cal-spawning:** route the three S34 pre-drafted Cal-Protocol-A submissions (see Standing watch item #1). Hopper + Brunel scratchpads have the drafts; Cal authors canonical entries with cross-links.
12. **Apex team is back online as of 2026-05-21 ~09:30.** Do NOT push substrate work against apex without explicit PO sanction; the maintenance window closed at session-end of this session.

(*FR:Aen*)

---

## SESSION 33+ WRAP — 2026-05-19 → 2026-05-20 (Hopper Deployment Operator deployed; mvox-dev team registered + Pérotin promotion realized; cross-team substrate-knowledge handoff to apex unblocked S37 carry-over; agent-lifecycle no-autonomous-continuation pattern observed n=4 but framed as Windows-substrate friction per PO direction)

**Spans:** Multi-day session 2026-05-19 → 2026-05-20 (PO-driven re-engagement after Aen crash mid-window 2026-05-19). Two distinct work surfaces in one continuous session: (A) Hopper Operator role design + deploy; (B) mvox-dev clone-and-refactor health audit + Pérotin promotion finalization.

**Outcome:** Both surfaces shipped end-to-end. Hopper joined the FR roster as a navy-blue opus-4-6 Deployment Operator paired with Brunel. mvox-dev team indexed in `designs/deployed/`, audited GREEN by Medici, and Pérotin's permanent-promotion structurally realized via Celes's 5-commit fine-tune + Aen's roster-side edit. 17 commits across two repos (FR: 4 deploy-stack commits; mvox: 15 commits pushed to origin).

### Outcomes shipped — Hopper Deployment Operator

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `teams/framework-research/prompts/hopper.md` | NEW (26K, 11-slot full prompt) | Celes | committed in deploy `25094d1` (moved from staging) |
| `teams/framework-research/prompts/brunel.md` | +3 amendments | Celes designed / Aen applied | `25094d1` |
| `teams/framework-research/roster.json` | +1 member (hopper, navy, opus-4-6) | Aen | `25094d1` |
| `designs/deployed/operator-role/` | NEW deployed-reference (design-spec, first-spawn-protocol, brunel-amendments, roster-entry, aeneas-amendment HELD) | Celes / Aen | `25094d1` (moved from `designs/new/`) |
| `teams/framework-research/docs/operator-role-spec-2026-05-19.md` | NEW spec (Brunel-authored) | Brunel | committed earlier in `4a5dece` |

### Outcomes shipped — mvox-dev team registration + Pérotin promotion

| Artifact | Δ | Owner | Path / commit |
|---|---|---|---|
| `designs/deployed/mvox_v4e_web/README.md` | NEW deployment index | Aen | FR commit `300d2df` |
| Medici health audit (218 lines, GREEN) | NEW | Medici | mvox commit `d9ecdde` |
| Comenius scratchpad stub | NEW (resolved only RED finding — new member had no memory file) | Medici | mvox commit `d52cac7` |
| Finn scratchpad prune (-24 lines) | M | Medici | mvox commit `e49ced8` |
| Victoria + Comenius prompt fine-tunes (Paraglide/TBD/TDD Partners) | M (3 atomic commits) | Celes | mvox `60936ec`+`246fd06`+`1a531e2` |
| Pérotin prompt — 5-commit pass (always-on framing + standing concerns + Léonin lore reframe + 3 coordination adds + first-spawn-as-permanent reorientation) | M (5 atomic commits) | Celes | mvox `6c7b4bb`..`ed15eee` |
| Pérotin roster.json (drop spawn field + update lore.significance) | M | Aen | mvox commit `9ab6542` |
| Palestrina memory append — 3 FR-flagged deferrals (path convention, CLAUDE.md drift, polyphony-isms) | M | Aen | mvox commit `4ca000b` |
| Cosmetic markdownlint MD032 fix on perotin.md | M | (auto-formatter) | mvox commit `516e476` |

mvox-dev pushed: 16 commits to `mvox-dev/mvox_v4e_web` origin/main (range `81f7d9c..516e476`).

### Decisions (PO-ratified)

[DECISION — session 33+] **Hopper deployment operator role finalized.** Naming via Celes-first-cut S32 pattern (PO chose Hopper over Kranz / Casey Jones); structural decisions all 4 accepted (no curator companion, generic-with-examples substrate scope, no first-spawn dry-run, monthly ops-log with REQUIRED deployed-artifacts-read declaration); 5 interpretive deltas locked via Celes↔Brunel DM exchange. TL-review Q4 (Tier D vs shape-mode contract surface) ratified per Celes's option 1 (clarify on producer side).

[DECISION — session 33+] **Aen amendment (Part C, relay-visibility rule) HELD.** The `aeneas-amendment.md` file stays in the deployed package as a future-session candidate but NOT applied to `prompts/aeneas.md` this pass. PO direction.

[DECISION — session 33+] **Pérotin permanent always-on interpretation.** Convention discovered empirically: every other permanent mvox-dev member has no `"spawn"` field in roster.json; only Pérotin had `"spawn": "on-demand"`. Promotion = delete the field. Aligned roster + prompt L109 to make the promotion structurally real (not just a label).

[DECISION — session 33+] **mvox-dev is NOT FR-shipped substrate.** Indexed in `designs/deployed/mvox_v4e_web/` for visibility but flagged out-of-scope for Hopper's MAY-DO list — substrate-design ownership rule excludes clones+refactors on non-EVR github orgs. Re-evaluate only if PO migrates to an EVR-org deployment with FR substrate ownership.

[DECISION — session 33+] **vjs_apex_apps RO mechanics handed off to Schliemann.** PO reversed initial "we don't owe Schliemann, that's sorted" framing after recognizing the substrate-knowledge handoff value (apex was carrying it as a pending fix). The handoff resolved apex's S37 carry-over.

### Substantive learnings (promotion-grade candidates)

[LEARNED — substrate, promotion-grade] **Read-your-own-deployed-artifacts diagnostic discipline.** Codified in Brunel-Amendment-1. Generalizable rule: when an FR-deployed substrate shows a failure, the first action is to read `designs/deployed/<team>/container/*` — the substrate's design intent is on disk in our repo, not opaque. Treating FR-shipped substrates as opaque is the first-pass error. Catalyzed by Brunel's S33+ apex-blocker diagnosis (first-pass plausible-but-wrong; PO surfaced; re-diagnose correct via reading own entrypoint).

[LEARNED — substrate, promotion-grade] **Substrate-knowledge handoff value (cross-team).** Substrate-mechanics summary from FR to apex unblocked a pending carry-over on apex's side (S37 "Mount fix pending FR-team" → reframed as "structurally-enforced policy with canonical refresh path"). PO observation: "your reversal on 'we don't owe Schliemann' was load-bearing." Generalizable: when one team owns substrate-design and another team operates against it, periodic substrate-knowledge handoffs (even without a triggering incident) prevent the consuming team from accumulating "pending fix" entries for things that are actually deliberate policy. Promotion candidate after n=2.

[LEARNED — process, promotion-grade] **Celes design discipline n=3.** Three teams designed via the same workflow shape: esl-suvekool (S23, summer school) → esl-legal (S32, Roman jurists) → operator-role (S33+, Hopper). Workflow: PO brief → Celes brainstorm → naming proposals + structural decisions (PO pause-point) → atomic-commit drafting at `designs/new/` → TL review → deploy + `mv` to `designs/deployed/`. Promotable as the canonical team-design pattern. The 4-step "checkpoint with naming proposals + structural decisions + interpretive deltas BEFORE drafting" cadence is the load-bearing discipline; it prevents the drafting-without-alignment failure mode.

[LEARNED — process] **Per-domain opinion review n=2.** Celes-design-opinion-on-a-single-prompt is a useful intermediate artifact between audit and edit. Applied to Comenius (under-modeled, lore-to-role-fit gap surfaced) and Pérotin (promotion not folded into prompt body surfaced). The opinion shape — prose, not checklist; "strong recommendation explicit if differs from on-disk"; "what I'd change if asked to redesign" framing — produced actionable items that the surgical-edit pass alone would have missed. Promotable to a Celes-tool: "prompt-design-opinion as separate artifact from prompt-fine-tune."

[LEARNED — protocol-design] **Agent-lifecycle no-autonomous-continuation observed n=4-ish across the session.** Pattern: agent sends intro / reply / closing report → idle → does NOT process inbox until next inbound message wakes them. Specific instances this session: all 3 spawn intros (Brunel/Cal/Celes) sat unread in my inbox marked `read: true` until PO prompted "check inbox"; Celes wrote initial intro then idled without starting (a)+(b) until I sent the wake; Medici closed his work before processing Celes's scope-overlap DM; Celes idled multiple times before each turn-driven action. Workaround that worked: producer→consumer paired loops (Brunel feeding Cal one item at a time; Cal's ACKs woke Brunel for next) self-sustain; open-loop dispatches stall. PO framing 2026-05-13 (saved auto-memory `feedback_no_windows_substrate_findings.md`): "Don't characterize Claude Code messaging/inbox failures observed on Windows as framework findings — Linux is the deployment substrate." NOT pursued as a wiki finding per PO direction. Noted for protocol-design context only.

[LEARNED — substrate] **Operator-role spec authored mid-session by a substrate-engineer is a Brunel-shaped artifact.** Brunel's S33+ spec authorship (Part A operator role + Part B Brunel amendments + Part C Aen amendment) is the first instance of a non-Aen specialist authoring a multi-role spec across team-membership boundaries. Worked because Brunel was the diagnostic-discipline-keeper at the moment the gap surfaced; the spec encoded the gap's resolution from the diagnostic-keeper's vantage. Generalizable: substrate-engineers authoring cross-team specs is a viable pattern when the gap is substrate-shaped.

[LEARNED — process] **Promotion-as-label vs promotion-as-structural-change.** Pérotin's case made this concrete: the L134 footer added the "permanent data-manager" label without folding the implications into the prompt body. L109 still said "spawned on-demand; may not be spawned at all"; roster.json still had `spawn: on-demand`. Without Celes's design-opinion catching this, the promotion would have stayed cosmetic — a label without behavior. Generalizable: when promoting an agent's role, run a "promotion fit" pass on prompt body + roster + lore.significance + any cross-references in other prompts. The fold-the-implications pass is what makes the promotion real.

[LEARNED — process] **Race condition between dispatch and correction — agents respect retroactive correction.** Celes started writing the Comenius opinion at 13:23, my "actually Pérotin" correction reached her inbox at 13:24, she sent the Comenius opinion at 13:25 and idled. On next wake she processed the correction and wrote the Pérotin opinion at 13:29. Both artifacts shipped clean. The Comenius opinion was substantive enough to be its own surface (PO acted on it). Workaround: when correcting a dispatch, don't assume the wrong-target work is lost — it may complete in parallel and remain useful.

### Cal queue additions from session 33+ (Cal already filed during her batch close)

Cal closed her 7-item Brunel queue cleanly. Wiki entries filed (untracked → tracked during S4 commit):

- `wiki/patterns/agenttype-vs-backendtype-separation.md`
- `wiki/patterns/cross-host-atomic-inbox-write-primitive.md`
- `wiki/patterns/decorative-polling-interval-anti-pattern.md`
- `wiki/patterns/per-message-color-overrides-registered-default.md`
- `wiki/patterns/read-flag-replication-discipline-for-external-cli.md`
- `wiki/patterns/taskget-before-classify-as-noise.md`
- `wiki/references/inbox-slot-vs-members-validation-asymmetry.md`

Plus amendments to existing entries: `ghost-member-as-universal-integration-surface.md`, `inbox-file-write-as-wake-mechanism.md`, `members-array-edit-honored-mid-session.md`, `wiki/index.md`.

Wiki count: 93 → 100 (7 new) + 3 amended + 1 index update.

### Standing watch items going into session 34+

- **Hopper's first dispatch** — will create `teams/framework-research/docs/operations-log-2026-05.md`. Watch for the first deployed-artifacts-read declaration in the log; it's the audit surface for repeat-of-Discovery-2 anti-pattern.
- **mvox-dev session 8 handoff** — Palestrina has 3 deferred items in his NEXT-SESSION carry-forward (path convention, CLAUDE.md drift, polyphony-isms). PO may surface mvox outcomes from session 8 next time we engage; absorb learnings.
- **Aen amendment Part C (relay-visibility rule) — HELD, candidate for future session.** Staged at `designs/deployed/operator-role/prompts/aeneas-amendment.md`. PO may revisit if a future incident surfaces silent-relay-scope-broadening.
- **apex-research bidirectional cite-back** — Schliemann routed the vjs_apex_apps substrate-knowledge to Champollion → likely Eratosthenes Protocol A submission with bidirectional cite-link back to our `wiki/patterns/substrate-invariant-mismatch.md`. If apex files, Cal may need to add a cite-back amendment on our side.
- **Comenius prompt overhaul (mvox)** — Celes's opinion surfaced load-bearing recommendations (escalation subsection, *Didactica Magna* lore reframe, Sonnet-vs-Opus tier question, active-pushback framing). Not actioned this session (Pérotin was the priority). Possible mvox-side surface for a future session if PO wants the Comenius investment.
- **Brunel-as-spec-author pattern n=1** — first instance of a non-Aen specialist authoring a multi-role spec. Watch for n=2 to confirm this is a viable cross-team pattern.
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed, action Stage-2 standard moves (carry-forward from S32).

### NEXT-SESSION BOOT (re-orient instructions for S34+)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Consider also pulling `mitselek/esl-legal` and/or `mvox-dev/mvox_v4e_web`** if PO references session-N work from those repos.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces Hopper's first dispatch:** spawn Brunel (diagnostic step) + Hopper (execution) per the Brunel-amendment-3 dispatch-package shape. If the ask is simple (e.g., "restart apex"), Aen can route Hopper solo per the "pair-as-unit is the common case, not the only case" framing. Watch for the first `operations-log-2026-05.md` entry to land.
6. **If PO surfaces mvox-dev session 8 outcomes:** Palestrina has 3 deferred items + likely his own learnings. Receive via PO; possibly spawn Celes for any prompt-side fold (Comenius overhaul candidate) or Medici for any memory-audit fold.
7. **If PO surfaces apex-research bidirectional cite-back** (Eratosthenes filing references our wiki): spawn Cal for cross-team cite-and-fold via Protocol A. Brunel-side substrate-engineer involvement only if substrate-claim needs verification.
8. **If PO surfaces Aen amendment (Part C relay-visibility) revisit:** `designs/deployed/operator-role/prompts/aeneas-amendment.md` is the starting artifact. Decide land-now vs further-deliberate.
9. **First operational item if Cal-spawning:** her S33+ close was clean (7-item queue + amendments + index). Surface-grade work: receive any Brunel/Hopper Protocol A submissions from the first Hopper-dispatch cycle; field any apex-research bidirectional cite-and-fold.
10. **If PO surfaces "design another team":** Celes-design-discipline n=3 holds. Same workflow shape: brainstorm → naming proposals + structural decisions (PO pause-point) → atomic-commit drafting at `designs/new/<team>/` → TL review → deploy + `mv` to `designs/deployed/`. The per-team opinion-as-intermediate-artifact (Comenius/Pérotin pattern) is now n=2 — usable when Celes is given a prompt to review without an immediate edit dispatch.
11. **If PO surfaces "manager-team / PO-team architecture":** PO floated this 2026-05-20 EOS with the framing *"I'm messing with too many teams in parallel; I feel I should soon create a dedicated team of PO's to manage all my teams."* Maps cleanly onto Monte's domain — governance architecture, separation of powers, manager-agent boundaries, delegation matrices, authority drift at scale. Spawn Monte for the design surface; Cal for accumulated wiki on team-taxonomy + service-team topology that this composes against. Brunel + Volta likely downstream once envelope shapes settle (substrate + lifecycle). This is the fatigue-as-observation design-pressure signal — when the PO role itself becomes the bottleneck, the framework needs to grow up.
12. **If PO surfaces "Volta evaluates mvox-dev's startup procedure":** PO observation 2026-05-20 EOS — last night's mvox-dev session "redesigned a startup procedure" worth comparing against FR's own. Spawn Volta to read `~/Documents/github/.mmp/mvox_v4e_web/teams/mvox-dev/startup.md` against `teams/framework-research/startup.md`, identify innovations, and propose any adoption candidates. Medici's S33+ audit already flagged mvox-dev's startup as "three-state probe is sound and mirrors FR's own discipline" — but innovations beyond mirroring are the surface PO wants evaluated. Output: comparison doc + adoption-recommendations, route to Aen for ratification.

(*FR:Aen*)

---

## SESSION 32 WRAP — 2026-05-13 (esl-legal team designed + deployed; Roman-jurist roster; long-lived per-domain archetype confirmed; brief-scope-conflation failure mode surfaced)

**Goal (PO-set 10:18):** Wake the team for "another exciting teambuilding effort" — design a new team to support ESL through an active EE/EU copyright dispute (Peterson / SP Muusikaprojekt, Lihula T0 = 2026-05-23). PO scope clarification at 11:04: *"I see this team as long-living support unit and Peterson is just the case nr.1"* — corrected initial misread of brief as 10-day one-shot.

**Outcome:** Team designed, reviewed, corrected, deployed. Commit `06b7699` to `mitselek/esl-legal` (private) — 16 files / 1761 insertions including `.claude/startup.md` bootstrap hook + workdir `README.md` + case-1 seed. PO can activate by opening Claude at `~/Documents/github/ESL/legal/`.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `mitselek/esl-legal` initial deploy | NEW (commit `06b7699`, 16 files / 1761 ins) | Aen | https://github.com/mitselek/esl-legal |
| 11-file team package (8 design + 3 scripts) | NEW | Celes | `designs/deployed/esl-legal/` (moved from `designs/new/` post-deploy) |
| `.claude/startup.md` bootstrap hook + workdir `README.md` + case-1 README seed | NEW | Aen | `~/Documents/github/ESL/legal/` |
| Inbox-persistence scripts adopted from FR (`persist-inboxes.sh` / `restore-inboxes.sh` / `restore-filter.jq`) | NEW | Celes (adapted from Volta) | `esl-legal/` repo root |

### Architecture decision

[DECISION — session 32] **esl-legal team architecture: 6-character Roman-jurist roster, Option B asymmetric workload, MUST-address adversary-flag protocol.**

- **Papinianus** ("Papi") — TL, coordinator + synthesis vote + flag-audit discipline-keeper
- **Paulus** — EE-jurist, hot path, 5/7 questions (Q1, Q3-EE, Q4, Q5, Q6, Q7)
- **Ulpianus** — EU/CJEU-jurist (Q2 + Q3-EU + cross-checks on Q5/Q7)
- **Modestinus** — Editor (memo + risk-matrix + jurist-Qs + bibliography + adversary-flag resolution)
- **Gaius** — Librarian + cross-case wiki sole writer
- **Cicero** — Adversary (independent reviewer, veto-weight, NOT TL-routed)

All `claude-opus-4-7[1m]`. Naming source: *Lex Citationis* of 426 CE for the five named jurists + Cicero (in-utramque-partem method) for adversary.

### Workflow shape (reusable, n=2 with S23)

PO intent → Aen brainstorm work-types → spawn Celes for opinion → Celes Brilliant query for substrate → architecture options + naming + PO 4 decisions → Celes drafts package staged at FR repo root (`designs/new/<team>/`) → Aen TL review → corrections → spot-check → PO approval → Aen deploys → mv to `designs/deployed/`.

This session's review surface: 2 blockers + 3 nice-to-haves (mcp__teamwork__ tool-prefix → bare tool names; Gaius's wiki-pulse needed Bash for git log; runtime-side inbox backup → FR Volta repo-side pattern; common-prompt case-bound brief path → case-agnostic; Q3 file-split alignment across design-spec + both prompts). Celes applied all 5 in one pass; spot-check confirmed.

### Mid-session correction — substrate-grade

[LEARNED — substrate, promotion-grade] **Brief-scope-conflation failure mode.** Initial reading of Tobi's brief framed the team as a 10-day one-shot dissolution archetype (memo delivery = team end). PO corrected at 11:04: *"long-living support unit, Peterson is just case nr.1."* Source of misread: brief §1+§3+§9 scope the *deliverable* around Peterson; my first-pass work-type sketch ("TL + 4 specialists + adversary for Q1-Q7 scan + memo") inherited that scoping and biased Celes's archetype call. **Lesson:** when a brief is task-scoped, distinguish "this case's scope spec" from "this team's scope spec" *before* assigning archetype. The deliverable's lifetime is not the team's lifetime.

Cal-queue candidate (n=1 watch).

### Substantive design innovations (first-of-its-kind in our corpus)

[LEARNED — substrate, promotion-grade] **Long-lived per-domain research support unit** — third archetype confirmed in our corpus. Differentiators: (a) NOT event-driven like operational (esl-suvekool); (b) NOT ongoing-build like methodology-research (FR/apex-research); (c) case-driven activation with domain-specific knowledge accumulation across cases. Repo structure with `cases/<slug>/` + `wiki/<category>/` from day 1. n=1 watch. Promotion trigger: a second similar team requesting same shape.

[LEARNED — substrate, promotion-grade] **Dedicated adversary role with veto-weight asymmetry** — first-of-its-kind. Cicero is structurally independent (NOT TL-routed); writes `[ADVERSARY-FLAG]` on settled-confidence claims; Modestinus MUST address each in writing before T-2 (fold or rebut, never silently dismiss). Papinianus runs flag audit at T-3 as discipline-keeper. Modestinus + Cicero share `adversary-flags.md` (controlled write-collision; Papi mediates first round). Cicero psychology framing in his prompt: *"You are NOT a member of the prosecution; you are the team's voice for what the prosecution would say if it had Cicero arguing for it."* n=1 watch.

[LEARNED — substrate] **Naming-heuristic inversion** (Celes's framing). When the team's domain has a directly-named tradition the team operates within (legal-research → Roman jurists), prefer that tradition over language-tiebreak naming. Inverse of esl-suvekool's "language-of-operational-context" rule. Two situational heuristics, not one universal.

[LEARNED — substrate] **Roman-jurist roster as structurally-legible naming choice.** *Lex Citationis* assigned each named jurist a distinguishable disposition: Papinianus = synthesis vote (deciding vote when others disagreed), Paulus = doctrinal trenches (most-cited in the Digest), Ulpianus = framework architecture (Edict commentary), Modestinus = distilled digest (*Pandectae*/*Regulae*), Gaius = institutional structure (*Institutiones*). The historical role-dispositions map onto team-role specializations almost 1:1. Naming with a structurally-named tradition compounds.

### Process learnings

[LEARNED — process] **2-blocker + 3-NTH TL review pattern is the right calibration.** Surfaced 2 critical bugs that would have broken first session (mcp__teamwork__ prefix; Gaius missing Bash for git log) AND 3 structural improvements (repo-side inbox persistence; common-prompt case-bound brief path; Q3 file-split alignment). Same shape as S23 review on esl-suvekool. Promotable as TL-review-pattern.

[LEARNED — process] **PO's "let Celes propose first" instruction on naming was correct.** Aen had a Roman-jurist fallback but PO wanted Celes's first cut. Celes converged on the same convention with deeper rationale (Lex Citationis structural fit, in-utramque-partem for adversary). When PO defers to a specialist for first-cut judgment, the specialist often improves on the fallback. Hold fallbacks in reserve; don't impose them preemptively.

[LEARNED — process] **Workflow pattern S23 → S32 holds verbatim** (esl-suvekool + esl-legal). n=2. Promotable as the team-design pattern.

### Cal queue additions from session 32 (5 new + 7 carried from S31)

Session 32 new (all n=1 watch):
1. **Long-lived per-domain research support unit** archetype
2. **Dedicated adversary role with veto-weight asymmetry** (in-utramque-partem dedicated specialist, MUST-address-in-writing protocol, structurally independent reviewer NOT TL-routed)
3. **Naming-heuristic inversion** — domain-named-tradition over language-tiebreak when domain has one
4. **Brief-scope-conflation failure mode** — deliverable-scope vs team-lifespan distinction
5. **Roman-jurist roster as structurally-legible naming choice** — historical role-disposition maps 1:1 onto team-role specialization
6. **Team-design workflow pattern S23→S32** — promotable at n=2 (sixth candidate, also from this session)

Carried from S31 (Brunel's parked queue, 7 items): SF-1, SF-2, SF-3, SF-4 (RFC #66 sub-findings), read-flag-replication external-CLI discipline, TaskGet-before-classify-as-noise procedural pattern, decorative-polling-interval anti-pattern.

### Standing watch items going into session 33

- **esl-legal session 1 outcomes** — did Papinianus bootstrap cleanly via `.claude/startup.md`? Did inbox-persist scripts work? Did Cicero's structural independence work in practice? Did Modestinus+Cicero shared-file first-round avoid write-collision? PO will tell us; do not poll.
- **MCP availability at esl-legal session start** — Gmail MCP + Brilliant MCP must be configured for the fresh Claude session at `~/Documents/github/ESL/legal/`. Gaius hard-fails without both. PO should confirm before Papi spawns Gaius.
- **Wiki growth-path watch** — Phase-2 gate at 15 statute-cards + 10 cross-case queries OR n=2 concurrent cases triggers Cal-style curator split proposal.
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed, action Stage-2 standard moves
- **Brunel's 7-item Cal Protocol A queue dispatch** (carried from S31) — parked at Brunel's side; lands on his next spawn
- **RFC #66 discussion author response** (carried from S31) — comment posted; watch for engagement
- **apex-research Eratosthenes contact** (carried from S31) — dormant from FR's view
- **`repo-as-durable-store-teamdelete-as-release-primitive.md` n=2 watch** (carried from S28)
- **`cross-document-prose-procedure-drift.md` n=2 watch** (carried)
- **Companion-Pair Submission n=3+ FR-instance watch** (carried from S30)
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **apex-research federation invocation** — first non-FR-non-apex team adopting federation-bootstrap-template
- **Library-team architecture design** (carried from S31) — major downstream surface from RFC #66 substrate validation; touches Cal + Herald + Monte; Brunel + Volta downstream

### NEXT-SESSION BOOT (re-orient instructions for S33)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek/ai-teams` repo** for any external scratchpad updates.
3. **Consider also pulling `mitselek/esl-legal`** if PO references session-1 work from there.
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces esl-legal session-1 feedback loop:** absorb any Papinianus-side [LEARNED] worth promoting upstream (similar to esl-suvekool S23→S26 fold). Possibly spawn Celes to revise prompts if a structural issue surfaced.
6. **If PO surfaces library-team architecture design** (carried from S31 NEXT-SESSION BOOT §4): start with Cal first (master-librarian role + Protocol A/B/C generalization), then parallel Herald (envelope shapes) + Monte (service-team one-sided ACL + authority). Brunel/Volta downstream.
7. **If PO surfaces Brunel-respawn:** 7-item Cal Protocol A queue parked at Brunel's side (carried from S31).
8. **If PO surfaces apex-research follow-up:** Schliemann engaged via ghost-chat channel; user has direct comm.
9. **First operational item if Cal-spawning:** route the 6 new wiki candidates from S32 via Protocol A, alongside any Brunel-queue items if he's spawned same window.

(*FR:Aen*)

---

## SESSION 31 WRAP — 2026-05-12 (RFC #66 substrate gate cleared cross-host; architecture decision + reference implementation shipped; PO reframe on Windows-substrate findings)

**Goal (PO-set 13:48):** Evaluate RFC #66 (Ghost-Member Pattern, posted 2026-05-09 by PO) against existing FR artifacts. Mid-session pivoted to verify-on-substrate-before-design via cross-host PoC.

**Outcome:** RFC #66 substrate gate cleared empirically (Windows-local-dev ↔ apex-research-on-Linux). Architecture decision settled (Reading 1: per-team Callimachi stay; messenger-ghost mechanism; new central library team as future design surface). PoC reference implementation shipped to FR repo. Wiki 86 → 89. RFC #66 discussion commented with empirical results. 7-item Cal Protocol A queue parked at Brunel's side for next session dispatch.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `wiki/references/inbox-file-write-as-wake-mechanism.md` | NEW (86→87, architectural-fact) | Cal | substrate property RFC #66 Finding 2 articulates |
| `wiki/patterns/service-team-topology.md` | NEW (87→88) | Cal | library-as-service-team architectural pattern (per #47 OQ-fold) |
| `wiki/patterns/ghost-member-as-universal-integration-surface.md` | NEW (88→89) | Cal | ghost-member as universal integration seam |
| Amendments to `substrate-invariant-mismatch`, `worktree-spawn-asymmetry`, `inbox-drained-on-spawn-clear`, `wiki/index.md` | +N | Cal | cross-link maintenance |
| `teams/framework-research/poc/ghost-member-cli/{ghost-chat.py, ghost-chat.ps1.deprecated, README.md}` | NEW | user impl. / Brunel coord. / coding-subagent QoL | sketch-grade reference implementation |
| Commit `4f48973` + RFC #66 discussion comment | shipped | Aen | https://github.com/mitselek/ai-teams/discussions/66#discussioncomment-16893428 |
| Brunel scratchpad +102 lines (S31 + provenance corrections) | +102 | Brunel | `memory/brunel.md` |
| Cal scratchpad +46 lines (S31 block) | +46 | Cal | `memory/callimachus.md` |

### Architecture decision settled

[DECISION — session 31] **Reading 1 (per-team Callimachi stay) + messenger-ghost mechanism + new central library team as design surface.** PO direction 14:50: *"Per-team librarian stays, every team librarian has personal 'messenger ghost representative' at central library. We will design a specific library team for central library curation."* Library-as-service-team topology per Cal's new wiki entries — answers #47 OQ1/OQ2/OQ3/OQ5/OQ7/OQ8 with named structural moves. OQ4 (wiki/scratchpad boundary at within-team layer) and OQ6 (token cost tiering) remain open from #47.

### Substrate gate cleared — F1/F2/F3 + 4 sub-findings

Verified cross-host on Windows-local-dev ↔ apex-research-on-Linux-container via SSH (Cloudflare Tunnel). Two independent implementations (PowerShell sketch → Python rewrite) both confirm the substrate-properties. Outbound ssh-write latency 657-854ms; end-to-end dominated by recipient compose-time, not substrate cost. Substrate-property reference filed at `wiki/references/inbox-file-write-as-wake-mechanism.md`.

**Sub-findings** (beyond RFC's empirical claims):
- **SF-1:** Inbox-slot acceptance is decoupled from `members[]` validation (one-sided-ACL property)
- **SF-2:** `agentType` vs `backendType` separation is a richer registration shape than RFC's `agentType: ghost` example
- **SF-3:** Per-message `color` field overrides registered-member color (apex display contract)
- **SF-4:** Single-ssh + python + `fcntl.flock` is a clean cross-host atomic-write primitive

**External-CLI substrate contract** worth making explicit: external members must replicate harness-side `read: true` marking after processing inbox entries; otherwise BACKLOG-loops on every launch. Closed by-design in Python via `fetch-and-mark-read` primitive (single ssh round-trip that under flock fetches `read:false` entries AND flips their flag).

### LEARNED — session 31

- **Verify-on-substrate-before-design discipline validated empirically.** The PO-directed pivot at 15:05 ("verify RFC #66 substrate via cross-host PoC before designing library team") caught issues paper-design would have missed (SF-1 inbox/members[] asymmetry, SF-3 color-override, Windows-substrate quirks). Reusable: for any architecture decision resting on an empirical substrate claim, run a PoC first.
- **Cross-implementation verification strengthens substrate-claim generalization.** PowerShell + Python independently confirming SF-1 through SF-4 moves the finding from "single-client-shows-X" to "substrate-property-of-deployment-harness-is-X." Reusable discipline: when one PoC validates a remote-substrate claim, port to a second language to confirm.
- **Ship-substrate-research-outcome-before-debug-churn structural move** (Brunel's S31 16:48 [LEARNED]): substrate-research outcome locks in regardless of artifact-polish; ship report immediately, decouple from rewrite churn. Without it, polish-bug-debugging buries the substrate finding behind cycles of CLI iteration.
- **Team-lead Stage-1-fold-without-primary-artifact drift, n=2 same session.** Aen attempted "n=3 spawn-drain" then "mid-session SendMessage drain" framings without disk-check; Brunel retracted both correctly. Relay-to-primary-artifact-fidelity-discipline Stage-1 anti-pattern applies to team-lead too. n=4 in this session counting Brunel's parallel instance. Parked in Brunel's Cal queue (item 6).
- **PO directive on Windows-substrate framing (16:42):** Don't characterize Claude Code messaging/inbox failures observed on Windows as framework findings — Windows file-semantics aren't the deployment substrate; Linux/Ubuntu is. Saved to project auto-memory at `feedback_no_windows_substrate_findings.md`. Applied retroactively to drop several would-be Cal-queue items from S31.
- **User-implements-while-agent-coordinates pattern.** User shipped both PowerShell PoC artifact AND Python rewrite directly. Brunel's role-of-record corrected mid-session: containerization-substrate-coordinator + verification-discipline-keeper, NOT implementer. Pattern: when user wants code shipped fast, agents coordinate/diagnose/curate.
- **Coding subagent delegation pattern.** Iteration-2 QoL feature delegated to one-shot general-purpose coding subagent (non-team): ~108s for feature, ~35s for bug fix. Pattern: substrate-validation team work uses FR specialists; artifact-implementation polish uses one-shot coding agents.

### NEXT-SESSION BOOT (re-orient instructions for S32)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces library-team architecture design** (central library team is the downstream-of-PoC work surface, this is the major next move): start with **Cal** (master-librarian role + Protocol A/B/C generalization across ghost-pair + library's own internal wiki sovereignty); then parallel **Herald** (ghost-pair envelope shapes + transport-plugin contract; T03 §Protocol 4 reframe candidate) + **Monte** (service-team one-sided ACL + authority structure across N consumers). **Brunel** and **Volta** are downstream of envelope-shape settlement; do NOT pre-spawn them.
5. **If PO surfaces Brunel-respawn:** he carries a **7-item Cal Protocol A queue** ready to dispatch immediately (SF-1, SF-2, SF-3, SF-4, read-flag-replication external-CLI discipline, TaskGet-before-classify-as-noise procedural pattern, decorative-polling-interval anti-pattern). First operational item: dispatch queue to Cal. Also: Brunel-spawn now ALWAYS triggers Q "analyst/coordinator or implementer?" — default coordinator/analyst unless PO explicitly asks for code.
6. **If PO surfaces continued ghost-chat PoC iteration** (QoL features, MCP escalation per RFC #66 Step 2, or bug iteration): delegate to **coding subagent (general-purpose, non-team)**, NOT Brunel. Path established this session.
7. **If PO surfaces apex-research follow-up:** Schliemann (apex team-lead) is engaged via the ghost-chat channel; user has direct comm. Eratosthenes (apex's librarian) was idle this session — not yet contacted with the PoC story. Cross-team wiki cite-and-fold may surface if apex files their own version (Schliemann asked user 15:39 whether to file as apex wiki pattern; user-deferred).
8. **If PO surfaces RFC #66 discussion engagement:** comment posted (discussioncomment-16893428). If RFC author replies, action depends on shape — substrate findings reception, design feedback, or v2 invitation. Surface for routing.
9. **If PO surfaces n=4-in-one-session relay-fidelity observation:** parked in Brunel's Cal queue (item 6) — lands naturally via Brunel's dispatch; no separate action needed at session start.
10. **First operational item if Cal-spawning:** her S31 close is clean. Surface-grade work would be: (a) receiving Brunel's queued items if Brunel is spawned same window; (b) library-team master-librarian role drafting if PO surfaces architecture work.

### Standing watch items going into session 32

- **Library-team architecture design** — major downstream work surface from this session's substrate validation. Touches 4-5 specialists (Cal-led; Herald, Monte for protocols/governance; Brunel, Volta downstream).
- **Brunel's 7-item Cal Protocol A queue dispatch** — parked at Brunel's side; lands on his next spawn.
- **RFC #66 discussion author response** — comment posted; watch for engagement. PO has the live channel.
- **apex-research Eratosthenes contact** — apex's librarian dormant from FR's view; may surface when Schliemann decides on apex-side filing.
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed, action Stage-2 standard moves
- **`repo-as-durable-store-teamdelete-as-release-primitive.md` n=2 watch** (Volta-filed S28) — cross-platform generalization confirmation point
- **`cross-document-prose-procedure-drift.md` n=2 watch** — second incident triggers Volta's Protocol C consideration
- **Companion-Pair Submission n=3+ FR-instance watch** — third FR instance prompts Protocol C consideration
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **apex-research federation invocation** — per S30 re-characterization: convention re-test point shifts to first non-FR-non-apex team adopting federation-bootstrap-template

(*FR:Aen*)

---

## SESSION 30 WRAP — 2026-05-07 (Monte FLAG resolution + Cal AMENDMENT processing + apex-research Protocol C cross-pollination + n=2 substrate gotcha activation)

**Goal (PO-set):** Resume Monte FLAG resolution per S29 NEXT-SESSION-BOOT step 4; glance at apex-research progress per S29 standing watch on n=2 federation invocation.

**Outcome:** Three independent loops closed cleanly. Wiki 85 → 86 (+1 new entry, 4 amendments). n=2 substrate gotcha activated. apex-research standing watch re-characterized.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| `recursive-citation-as-canonical-validation.md` FLAGs closed | +22/-3 (verified-as-written via Stage 2 author-scratchpad fold; confidence medium → high) | Cal (Monte-AMENDMENT) | `wiki/patterns/` |
| `relay-to-primary-artifact-fidelity-discipline.md` Instance 5 fold | +41/-7 (cross-class sibling to Instance 4: Cal Stage 1 honest-FLAG + Monte Stage 2 author-scratchpad fold; header-stale n=4 collateral catch on Instance 4 corrected) | Cal | `wiki/patterns/` |
| `inbox-drained-on-spawn-clear-without-deliver.md` n=2 amendment | +15/-1 (architectural-fact convention: append `instances:` list, no sub-shape claim, recovery primitive note) | Cal | `wiki/gotchas/` |
| `wiki/process/companion-pair-submission-protocol.md` (NEW) | NEW (85→86) | Cal (apex-research-sourced; cross-team `source-team: apex-research` attribution) | `wiki/process/` |
| `wiki/index.md` updated for both new and amended entries | +5/-2 | Cal | `wiki/` |
| Monte scratchpad +10 lines (S29-update for FLAG resolution outcome) | +10 | Monte | `memory/montesquieu.md` |
| Cal scratchpad +43 lines (S30 block) | +43 | Cal | `memory/callimachus.md` |

### LEARNED — session 30

- **Recovery primitive for drain-on-spawn-clear is now n=2-proven.** Aen spawn-prompt relay-fold + author-scratchpad Stage 2 fold worked cleanly across both observed instances (S29 Monte→Cal 12:30 dispatch; S30 Monte→Cal 17:37 dispatch). Stage 1+Stage 2 lifecycle holds across substrate-loss instances; the discipline is no longer just theoretical. Folded into gotcha entry as one-line workaround note.
- **Architectural-fact convention from S29 held under stress.** Cal initially proposed a sub-shape extension on the n=2 sighting ("drain-at-spawn-clear regardless of dispatch-timing-relative-to-recipient-lifecycle"). On evaluation: that's a *sharpening of the original framing's generality*, not a new sub-shape — both observed instances are pre-spawn-dispatch, post-spawn case is hypothetical. Architectural-fact convention prescribes minimal amendment (append `instances:`, no sub-shape claim) and Cal applied it cleanly. Discipline catches discipline drift.
- **Convention diffusion happens without federation infrastructure.** apex-research adopted FR's dual-hub-routing pattern (Eratosthenes mirrors Cal's role; Protocol A/B mirror FR's shapes; routing table line-for-line) as a *governance pattern* for single-team operation, separate from federation-bootstrap-template. Knowledge-hub-as-team-role is more general than knowledge-hub-as-federation-curator. Worth noting as framework finding — federation-only is too narrow a frame for the dual-hub convention.
- **Cross-team protocol cross-pollination at n=2 cumulative is filing-grade without promotion.** apex-research's Companion-Pair Submission protocol filed as `wiki/process/companion-pair-submission-protocol.md` with `source-team: apex-research` attribution. n=2 latent FR instances (status/companion-artifact axis: teamcreate-leadership-survives-clear ↔ repo-as-durable-store-teamdelete; mechanism/UI-trap axis: tmux-pane-border-format ↔ tmux-pane-labels-decoupled). Naming-collision resolution: descriptive name "Companion-Pair Submission" used to avoid Protocol-C letter-slot collision with FR's knowledge-promotion protocol — wiki-process placement is sufficient at n=2 cross-team discovery (no common-prompt promotion).
- **Skill-side substrate-invariant-mismatch sub-shape candidate (S30 self-spotted at shutdown).** `framework-research-next-session` skill's CWD-as-context-signal invariant assumes single-repo session navigation. Failed at Step 0 because session legitimately touched apex-migration-research repo (refresh + `cd`); CWD drifted. Recovery is one-command (`cd` back), but the skill prescribes "stop immediately" — substrate-invariant-mismatch sub-shape: *a procedural guard whose invariant is a *narrower* version of the actual session-context*. Worth Cal evaluation next session for whether this fold-able into existing `substrate-invariant-mismatch.md` n=6 (Instances 1+6 are path-as-substrate-invariant) or warrants a new instance.

### Standing watch update — apex-research n=2 invocation re-characterized

S29 standing watch line: "apex-research n=2 invocation — first deployment of #1 v0.7 federation-bootstrap-template beyond FR; convention re-test point."

S30 finding: **apex-research is NOT on a federation trajectory.** They run single-team with directory-ownership governance. Zero federation-bootstrap signals (no path-namespace, no CuratorAuthority, no WriteAccept/WriteRejection, no registry, no admission control). The convention re-test point would have to come from a different second team, OR apex-research re-scoping to federate.

Cross-team interface to FR is dormant (one thin reference: "Quality audits performed by framework-research Medici remotely" — Medici hasn't been spawned in any FR session per logs). Worth re-characterizing the standing watch.

### NEXT-SESSION BOOT (re-orient instructions for S31)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces apex-research follow-up** (e.g., "did anything else happen on their side?", or asks about Companion-Pair Submission protocol): consider spawning Cal for either (a) querying apex-research's wiki state for additional cross-pollination candidates, or (b) cross-evaluating FR's existing wiki against apex-research's exclusion sub-shapes (privilege-trap cluster, shared-infrastructure-pair) for additional latent matches. Apex-research source path: `C:/Users/mihkel.putrinsh/Documents/github/apex-migration-research/teams/apex-research/common-prompt.md`.
5. **If PO surfaces skill substrate-invariant-mismatch finding** (S30 LEARNED above): spawn Cal to evaluate whether the skill CWD-check failure-mode folds into existing `substrate-invariant-mismatch.md` n=6 (Instance 1 + Instance 6 are both path-as-substrate-invariant at different layers), or warrants a new instance. Decision matrix: if same-root-cause-different-layer holds, fold; if structurally distinct mechanism, file new instance.
6. **If PO surfaces Volta-related work** (T06 amendments, lifecycle scripts, harness substrate fixes): spawn Volta. Pending from S28: all NEXT-SESSION-CHOREs cleared, but n=2 watch on `cross-document-prose-procedure-drift.md` may still activate per his amendment-path note.
7. **If PO surfaces Brunel-related work** (federation expansion, container lifecycle, worktree-asymmetry review): spawn Brunel.
8. **If PO surfaces Monte-related work**: Monte's S30 close was clean (FLAG resolution complete; Instance 5 candidacy promoted to confirmed via Cal's fold). His next surface-grade work item is Volta-style — open queue.
9. **First operational item if Cal-spawning:** her S30 close was clean (86 wiki entries; substrate gotcha at n=2 with minimal-amendment posture; companion-pair protocol filed; no FLAG annotations; no TTL imminent). Surface-grade work would be receiving any new Protocol A submissions from spawned specialists, or evaluating the skill substrate-invariant-mismatch finding per item 5 above.

### Standing watch items going into session 31

- **Skill CWD-check substrate-invariant-mismatch sub-shape evaluation** (NEW S30) — fold-or-new decision deferred to Cal next session
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2 standard moves
- **apex-research n=2 invocation** — RE-CHARACTERIZED S30: not on federation trajectory; convention re-test point shifts to first non-FR-non-apex team that adopts federation-bootstrap-template, OR apex-research re-scoping (no signal of either)
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **`repo-as-durable-store-teamdelete-as-release-primitive.md` n=2 watch** (Volta-filed S28) — second team-lifecycle protocol on different platform = cross-platform generalization confirmation point
- **`cross-document-prose-procedure-drift.md` n=2 watch** — second incident triggers Volta's Protocol C consideration per his S28 amendment-path note
- **Companion-Pair Submission n=3+ FR instance watch** — third FR companion-pair instance would prompt Protocol C consideration (common-prompt promotion with naming-collision resolution); wiki-process placement is sufficient at n=2 cross-team discovery

(*FR:Aen*)

---

## SESSION 29 WRAP — 2026-05-07 (sequential queue-flush: Brunel + Monte + Cal; T06 stale-prose closed; new substrate sub-shape filed)

**Goal (PO-set):** "Just keep them busy" — sequential wake/work/shutdown for Brunel, Monte, Cal. No new feature direction; pure queue-flush.

**Outcome:** All three queues flushed end-to-end. Wiki 82 → 85. T06 stale-prose closed. New substrate failure mode surfaced and filed.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| T06 stale-prose fix (lines 1135 + 1182 "Phase 2.0a" → new anchors) | +2/-2 | Brunel | `topics/06-lifecycle.md` |
| Wiki accuracy review on `worktree-spawn-asymmetry-message-delivery.md` | confirmed accurate, no amendments | Brunel | `wiki/patterns/` |
| Wiki entry `single-channel-saturation-via-mode-partition.md` (B.1) | NEW (82→83) | Cal (Monte-source) | `wiki/patterns/` |
| Wiki entry `recursive-citation-as-canonical-validation.md` (B.2) | NEW (83→84, joint-source monte+callimachus) | Cal (Monte-source + Cal co-framing) | `wiki/patterns/` |
| Wiki entry `inbox-drained-on-spawn-clear-without-deliver.md` (substrate gotcha) | NEW (84→85) | Cal (team-lead+callimachus joint-source) | `wiki/gotchas/` |
| Cross-ref amendment on `worktree-spawn-asymmetry-message-delivery.md` (sibling sub-shape link) | +1 | Cal | `wiki/patterns/` |
| T04 §Row 2 awareness check | ACK-as-written, no refinement needed | Monte | `topics/04-hierarchy-governance.md` |
| Brunel scratchpad pruned 134 → 120 | -14 lines net (compressed S26 + S27 blocks) | Brunel | `memory/brunel.md` |
| Cal scratchpad pruned 130 → 46 | -84 lines net (consolidated S26-28 detail) | Cal | `memory/callimachus.md` |
| Monte scratchpad +18 lines (S29 block added) | +18 | Monte | `memory/montesquieu.md` |

### Substrate event — new sub-shape characterized

[DECISION — session 29] **New gotcha `inbox-drained-on-spawn-clear-without-deliver.md` filed n=1 architectural-fact** with TTL 2026-08-07 for harness-fix re-verify. Distinct sub-shape from `worktree-spawn-asymmetry-message-delivery.md`:

- **Sender + recipient both parent-process** (no isolation flag) — distinct from worktree-OUTBOUND mount-staleness mechanism
- **Failure timing: at spawn-handshake** (not mid-session)
- **Mechanism: drain ≠ deliver** — Cal's inbox file went 21400 bytes → 2 bytes (`[]`) at file-mtime = spawn-window; conversation channel injection did not run
- **Workaround: team-lead spawn-prompt relay-fold** (Stage 1 discipline per `relay-to-primary-artifact-fidelity-discipline.md`)
- **Detection asymmetry:** parent-process-side file-stat byte-count correlation at spawn-mtime is the ONLY detection path; recipient cannot self-diagnose

**Empirical sequence:** Monte dispatched both Protocol A submissions to Cal direct, harness reported `success: true` (12:30 UTC), inbox file confirmed at 21400 bytes from team-lead view. Cal spawned ~3hr later (15:34 UTC); her own view showed `callimachus.json = []`; my parallel view confirmed file dropped to 2 bytes at file-mtime = spawn-window. Cal recovered via Stage 1 relay-fold from spawn prompt + Monte's S29 scratchpad, then Stage 2 amended after my 15:38 primary-artifact-grade evidence-chain relay.

[DECISION — session 29] **Joint-source-at-filing-time for B.2 `recursive-citation-as-canonical-validation`** (monte + callimachus) — Cal's S27 11:36 framing fold (sibling-to-first-use, NOT instance-of-two-consumer) was load-bearing on categorization, not append-after-the-fact. Both halves required at filing → joint source-agents. Cal's [LEARNED] from S29.

[DECISION — session 29] **Stage 1 anti-pattern self-caught and Stage 2 superseded, in-session.** Cal's initial filing of B.2 cited her own curator-ACK Stage 2 self-correction (which is `relay-to-primary-artifact-fidelity-discipline.md` Instance 4 — a *separate* recursive moment) as the first-instance evidence. After my 15:38 primary-artifact-grade relay landed, she Stage 2 amended to the correct first-instance: Monte 10:50 Protocol B query → Monte 11:06 T04 §Recipient-and-authority-chain → Cal 11:18 response citing Monte's prose. **Recursive-validation moment candidate** for `relay-to-primary-artifact-fidelity-discipline.md` Instance 5 (sibling to Brunel's Instance 4 catch on Cal in S27); deferred until verbatim Monte text becomes available for unambiguous confirmation.

### LEARNED — session 29

- **Substrate failures compose in-session into productive wiki output.** A brand-new substrate failure (drain-on-spawn-clear-without-deliver) was characterized end-to-end, recovered around via Stage 1 relay-fold, and filed as a sibling gotcha within the same session it was discovered — without losing the queued submission content. Discipline-catches-discipline at substrate scale.
- **Spawn prompt as primary-artifact-grade relay channel.** When recipient inbox drain-without-deliver fails, the team-lead's spawn prompt is the only fully-controlled path to put structural framing into a fresh agent's context. Per `relay-to-primary-artifact-fidelity-discipline.md`, the spawn prompt counts as a relay (provenance-by-artifact-class), not as a primary artifact. Receiver applies Stage 1 fold; team-lead supersedes with Stage 2 mid-session if better evidence arrives.
- **Three-agent sequential queue-flush is feasible inside a single session window.** Total wall-clock ~25min from Brunel spawn to Cal terminate. Each agent's queue was small (1-2 items); sequential vs parallel is correct when items are agent-specific and don't compose. If queues had been parallel-friendly (no shared output target), parallel spawn with worktree-isolation would have been preferred — but worktree-OUTBOUND substrate cost would have applied.

### NEXT-SESSION BOOT (re-orient instructions for S30)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces Monte-respawn for Protocol A AMENDMENT on `recursive-citation-as-canonical-validation.md`:** spawn Monte. Cal flagged FLAG annotations on the family-distinction table + first-instance section pending verbatim text confirmation. If Monte's verbatim Protocol A text becomes recoverable (or he can re-state it), Stage 2 amendment closes the FLAGs and the entry promotes to `relay-to-primary-artifact-fidelity-discipline.md` Instance 5 candidate.
5. **If PO surfaces n=2 watch on `inbox-drained-on-spawn-clear-without-deliver.md`** (any new instance of harness-success-on-dispatch + recipient-side on-disk-absence at spawn-handshake): spawn Cal for amendment + cross-link to existing entry. Architectural-fact convention applies — n+1 sightings only update if substrate changes; same-mechanism re-encounters update `discovered` list, not confidence.
6. **If PO surfaces apex-research n=2 invocation** (first deployment of #1 v0.7 federation-bootstrap-template beyond FR): spawn Brunel for template execution + Cal for namespace allocation + likely Monte for drift-detector deployment. Convention re-test point per S27 close.
7. **If PO surfaces Volta-related work** (continued T06 amendments, lifecycle-script extension, harness substrate fixes): spawn Volta. Pending from his S28 NEXT-SESSION-CHOREs trio: all three cleared, but n=2 watch on `cross-document-prose-procedure-drift.md` may activate per his amendment-path note.
8. **First operational item if Cal-spawning:** her queue at S29 close is clean (85 entries, 1 active FLAG annotation on `recursive-citation-as-canonical-validation.md`, no disputes, no TTL expiries imminent). Surface-grade work would be receiving any new Protocol A submissions or wiki health summary.

### Standing watch items going into S30

- **Monte-verbatim recovery for Cal's FLAG resolution** — if Monte respawns for any reason, surface FLAG-resolution as a piggyback task
- **TPS-583 (apex-research)** — when PO signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2 standard moves
- **apex-research n=2 invocation** — first deployment of #1 v0.7 federation-bootstrap-template beyond FR; convention re-test point
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **`repo-as-durable-store-teamdelete-as-release-primitive.md` n=2 watch** (Volta-filed S28) — second team-lifecycle protocol on different platform = cross-platform generalization confirmation point
- **`cross-document-prose-procedure-drift.md` n=2 watch** — second incident triggers Volta's Protocol C consideration per his S28 amendment-path note

(*FR:Aen*)

---

## SESSION 28 WRAP — 2026-05-07 (Volta NEXT-SESSION-CHOREs cleared; 4 Protocol C promotions ratified; team-lead-override pattern established for non-owned topic edits)

**Goal (PO-set 15:32 on 2026-05-06):** T06 path-tree rewrite (Volta NEXT-SESSION-CHORE #1). Mid-session expanded to all three Volta chores + 4 Protocol C promotions Cal carried from S27.

**All three Volta NEXT-SESSION-CHOREs from S27 cleared end-to-end.** 4 Protocol C promotions ratified into common-prompt verbatim. Wiki 80 → 82.

### Outcomes shipped

| Artifact | Δ | Owner | Path |
|---|---|---|---|
| T06 path-tree rewrite | +122/-99, 12 edits | Volta (direct) | `topics/06-lifecycle.md` |
| T04 §Row 2 + Row 5 clarification | +4/-2 | Volta (proposed) → Aen (override-applied) | `topics/04-hierarchy-governance.md` |
| T09 source-team example | +1 | Volta (proposed) → Aen (override-applied) | `topics/09-development-methodology.md` |
| 4 Protocol C promotions | +25/-1 | Cal (proposed) → Aen (ratified+authored) | `common-prompt.md` |
| 2 wiki entries from Volta | NEW (80→82) | Cal (Volta-sourced) | `wiki/{patterns,gotchas}` |
| `framework-research-next-session` skill | NEW (137 lines) | Aen | `~/.claude/skills/` (user-private) |

### Protocol C promotions landed (all S27 carry-forward candidates)

1. `substrate-invariant-mismatch` n=6 → Structural Change Discipline gate 4 (3rd sub-bullet, sibling to dual-team-dir-ambiguity reference)
2. `worktree-isolation-for-parallel-agents` n=7 → Agent Spawning Rule extension (replaces single-line block)
3. `semver-strict-typed-contract-discipline` n=1 (corrected from claimed n=2 mid-session by Cal's grep-discipline) → new Versioning Discipline subsection in Structural Change Discipline
4. `relay-to-primary-artifact-fidelity-discipline` n=4 → new Relay Fidelity Discipline subsection in Dual-Hub Routing

[DECISION — session 28] **Team-lead-override pattern for non-owned topic-file edits established.** When a specialist proposes diffs to a topic file outside their write-scope AND the topic owner is not spawned, three options: (a) defer to next session, (b) spawn the owner, (c) PO-greenlit team-lead override. Option (c) used for both T04 (Volta-proposed → Monte-domain) and T09 (Volta-proposed → schema-domain). Pattern matches existing Protocol C → common-prompt authoring. Attribution preserved on T04 §Row 2 (`_FR:Volta_ — 2026-05-06`).

[DECISION — session 28] **Cal's [CAL-CANDIDATE] scratchpad notes pulled and filed via Protocol A** (option a, overriding Cal's option-b recommendation). PO direction was "pull now, don't defer." Both notes filed; Volta clean-acked Cal's framings (no amendments).

### LEARNED — session 28

- **Cal's grep-discipline catches memory drift in both directions.** S26 [LEARNED] noted memory underestimates (n+1 sightings under-recorded); S28 inverse (Cal's S27 wrap-note claimed n=2 SemVer, real n=1, caught up-front by Cal before proposal). Discipline ratifies as: *"grep before Protocol C, in either direction."* Folded into Cal's scratchpad as curatorial process; not promoted (n=2 cumulative is bracketing data, not pattern).
- **Volta's [STANDING-DATA] pushback on n=2 cross-document drift.** Strict reading of his [LEARNED] — n=2 is *progress toward* the trigger, not satisfaction. Holding for n=3 before any Protocol C extension. Correct discipline; team-lead's eager reading would have over-triggered.

### Skill amendments — session 28 (patched mid-close per S28 first-invocation feedback)

- **TOP → BOTTOM placement (self-spotted):** Original skill said NEXT-SESSION-BOOT block at TOP of session wrap; existing convention is BOTTOM (S27 NEXT-SESSION BOOT was at line 104 of a wrap that started at line 4). Patched 2026-05-07.
- **Push-confirmation gate removed (PO feedback):** Original skill required a separate user confirmation before push at S4. PO ratified that push is canonical part of S4 every session — gating it separately is friction, not safety. Step 1 prompt updated to "Ready to commit, push, and shut down" — single confirmation covers commit + push + shutdown. Patched 2026-05-07.

Both bugs fixed during the closing protocol of S28 (the skill's own first invocation). Lessons:

- **First-invocation skills surface latent assumptions.** This skill was tested by being run, not by being reviewed. Both bugs were invisible during authoring; both became obvious within ~10 minutes of the skill executing. Skills like procedures: write them, run them, fix them on first contact.
- **When authoring procedural skills for established workflows, default to fewer gates not more.** The push-confirmation gate was a defensive over-correction; the actual workflow had push as canonical session-end every time. The skill's job is to enforce discipline that is currently being skipped (NEXT-SESSION-BOOT block), not to add discipline that the user has already internalized (push at session-end).

### NEXT-SESSION BOOT (re-orient instructions for S29)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any external scratchpad updates.
3. **Don't pre-spawn any agent at session start.** Wait for PO direction.
4. **If PO surfaces Brunel-related work** (federation expansion, container lifecycle, worktree-asymmetry review): spawn Brunel. He has a queued accuracy review on `worktree-spawn-asymmetry-message-delivery` + a coordination flag from Volta on T06 Container Lifecycle "Phase 2.0a" stale prose (lines 1135, 1182).
5. **If PO surfaces Monte-related work** (governance prose, T04 wordsmithing, his two pending Cal submissions): spawn Monte. He has T04 §Row 2 review queued + 2 pending Protocol A submissions (`single-channel-saturation-via-mode-partition` + `recursive-citation-as-canonical-validation`) noted in his S27 scratchpad.
6. **If PO surfaces a third instance of cross-document drift** (any agent reports prose-procedure mismatch): n=3 reached, Protocol-C-extension trigger activates per Volta's [STANDING-DATA]. Spawn Cal for promotion drafting.
7. **First operational item if Cal-spawning:** her queue at S28 close was clean (82 entries, no disputes, no TTL expiries). Surface-grade work would be receiving any new Protocol A submissions from spawned specialists; or a wiki health-summary at PO request.

### Standing watch items going into S29

- **TPS-583 (apex-research)** — when PO signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2 standard moves
- **apex-research n=2 invocation** — first deployment of #1 v0.7 federation-bootstrap-template beyond FR; convention re-test point per S27 close
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions

(*FR:Aen*)

---

## SESSION 27 WRAP — 2026-05-06 (Phase B v1.0-final shipped end-to-end across 4 artifacts; substrate-failure landscape characterized)

**Goal (PO-set 10:42):** Activate Phase B; let Cal flush queue.

**Both objectives met substantially.** Phase B v1.0-final cluster shipped end-to-end across all four design artifacts; Cal queue flushed (14/15 effective + 4 inbound batch processed → 80 wiki entries net 77→80).

### Phase B v1.0-final cluster — fully closed across 4 artifacts

| Artifact | Final | Owner | Cross-citation |
|---|---|---|---|
| #1 federation-bootstrap-template v0.7 | EXECUTION-READY for n=2 (apex-research) | Brunel | Herald 04 + T04 §Authority-Drift |
| #2 authority-drift-substrate-instrumentation v0.2 | bidirectional cite-and-fold complete | Brunel | #1 + T04 + Herald 04 |
| Topic 04 §Authority-Drift Detection v1.2 | canonical detector-side surface | Monte | #2 + Herald 04 + Cal Protocol B |
| `mitselek/prism` PR #12 v0.1.1 (04-spec) + PR #13 v2.0.0 (R9-rule) | typed-contract canonical sources | Herald | #1 + #2 + T04 |

**Asymmetry framing anchor locked at T04 line 870:** *"admission needs to commit, observation needs to caution"* — both #2 design AND T04 detector-side surface use identical structural framing. Cite-and-fold cadence held end-to-end across all four artifacts.

**Cluster statistics:** 7 versions of #1 + 2 versions of #2 + 6 amendments to T04 + 2 PRs on Prism. **Zero abandoned drafts.** Clean acceptance-gate closure across all consumers (Aen, Brunel, Monte, Cal, Herald). ~80min cadence to v0.7 execution-ready; ~4hr full-cluster closure.

### Substrate-failure landscape — characterized end-to-end

[DECISION — session 27] **`substrate-invariant-mismatch.md` n=5 → n=6** with two named sub-shapes:
- **Sub-shape A:** read-cursor-skip on present-on-disk message (Monte→Cal 10:50 evidence chain by Monte 11:02)
- **Sub-shape B:** on-disk-absence (Brunel inbox JSON not updating; Monte's 11:08 + Brunel's 11:05 evidence)

**Same-root-cause-different-layer connection to Instance 1 (`dual-team-dir-ambiguity`)** — converts "n=6 unrelated instances" → "the defect class manifests at multiple layers of a single substrate." This is a stronger Protocol C argument than n-count alone.

[DECISION — session 27] **New wiki entry `worktree-spawn-asymmetry-message-delivery.md`** filed standalone (n=4 evidence). Hypothesis evolved through the session:
- Initial framing (n=2): worktree-OUTBOUND specifically broken
- Sharpened (n=4): non-parent-process → recipient unreliable across worktree boundary
- Final empirical (n=4 + Cal→Brunel intermittent at 12:54 BROKEN, 13:14 SUCCESS, 15:00 SUCCESS): **transient mount-staleness**, not persistent direction-asymmetry, not non-deterministic-race

**Operational workaround codified:** team-lead → recipient relay path (no-worktree → no-worktree consistently works). Used multiple times this session for Monte/Brunel/Herald → Cal Protocol A relays.

[DECISION — session 27] **Negative-evidence-as-positive-data folded into Sub-shape A prose** (Monte's diagnostic move): *"absence of Y (no eventual catch-up) is sharper diagnostic than observing X (the skip)"* — observed-absence-of-expected-recovery-signal rules out non-deterministic-iteration mechanism. Diagnostic-method articulation makes the entry useful beyond the specific failure-mode.

### Wiki productivity

- **11 new entries:** protocol-completeness-across-surfaces, lossless-independent-convergence, canonical-taxonomy-check-before-naming, timestamp-crossed-messages, semver-strict-typed-contract-discipline, substrate-shape-vs-authority-shape-orthogonality, field-level-overlap-one-truth-not-mirror, audit-trail-for-rejection-rationale, surfacing-cost-asymmetry-stale-context, snapshot-state-mis-names-path-to-end-state, api-gateway-error-vs-actual-server-state, worktree-spawn-asymmetry-message-delivery, discriminator-field-name-consistency-over-uniqueness, relay-to-primary-artifact-fidelity-discipline (renamed from initial `fold-only-what-is-verbatim.md`)
- **5 substantive amendments:** substrate-invariant-mismatch n=5→n=6 (with two-sub-shape framing + Monte enrichments + Brunel dual-witness), worktree-isolation n=2→n=7 (with dirty-main-worktree-bypass sub-shape + orthogonality cross-link), prompt-to-artifact-cross-verification (runtime-variants extension; n=2 cumulative on runtime-variant), worktree-spawn-asymmetry hypothesis-relaxation + INTERMITTENT data point, relay-to-primary-artifact-fidelity Stage 2 + recursive-validation Instance 4
- **2 sub-shape folds** into coordination-loop-self-correction (#32 + #3 as named variants)
- **4 Protocol B responses** (Monte 10:50; Brunel 11:05; Tier-0 substrate Qs; Brunel pushbacks at 12:54) citing 8+ wiki entries each
- **3 Protocol A acknowledgments** (Monte n=6 substrate amendment; Brunel consolidated relay-discipline; Herald two-instance amendment)
- **Filing-to-citation latency average ~25min** — Phase A discipline target hit at peak. Cal entries cited within ~25min by Monte design v1, Herald slot decision, Brunel v0.7 envelope shape

**Wiki count: 77 → 80** with substantive entry enrichment beyond raw count.

### Protocol C promotion candidates (4 surfaced for next-session cycle)

1. **`substrate-invariant-mismatch.md` n=6** with same-root-cause-different-layer connection to Instance 1 `dual-team-dir-ambiguity`
2. **`worktree-isolation-for-parallel-agents.md` n=7** with 5 work types + 4 specialists (Brunel + Monte + Herald + team-lead)
3. **`semver-strict-typed-contract-discipline.md` n=2** with PR #11 + PR #13 instances (both v→v2.0.0 SemVer-major bumps)
4. **`relay-to-primary-artifact-fidelity-discipline.md` n=4** with different-specialist criterion satisfied (Brunel two-stage lifecycle + Herald third-party + Cal recursive-validation Instance 4)

Cal will surface these on next scratchpad-prune cycle (S28).

### Eight discipline surfaces dogfooded through the cluster

1. Cross-read discipline (gate 2)
2. Cite-and-fold cadence (held end-to-end across 4 artifacts)
3. Production-rule application (Brunel's two self-corrections)
4. Worktree-isolation discipline (n=7 cumulative this session)
5. Strict-typed-contract-discipline (Cal n=2 promotion-grade)
6. Brief-frame gate-4 runtime-variant (Herald's two instances)
7. Discriminator-field-name consistency (Herald's §2.3 lock + Brunel's near-miss)
8. Primary-artifact-vs-relay-quote (Brunel's queue, Cal's recursive-validation Instance 4)

### LEARNED — session 27 meta-patterns

- **Cite-and-fold-discipline-absorbs-co-design** (when structurally sound). Brunel's 14:58 closing observation. Two retroactively-ratified co-design instances this run (10:54 Brunel-Monte registry handshake + 11:14 D5 reconciliation) — both produced structurally superior outcomes than two-independent-shipped designs would have. Compose-or-conflict gate is the structural test; discipline doesn't reject co-design, it rejects UNNECESSARY co-design.
- **Negative-evidence-as-positive-data** (Monte 11:36). Observed-absence-of-expected-recovery-signal is a sharper diagnostic than observing the symptom itself. Bayesian update via observed-not-Y. Folded into substrate-invariant-mismatch Instance 6 prose.
- **[CROSS-DETECTED] as session-pattern** (5+ instances). Cal's `timestamp-crossed-messages.md` filed at ~11:08 was dogfooded continuously for 2+ hours across all four agents. Operationally load-bearing.
- **Recursive-validation Instance 4** in `relay-to-primary-artifact-fidelity-discipline.md` — Cal's own ACK claimed a fold she hadn't yet executed; Brunel's cross-check caught the divergence; Cal applied Stage 2 supersession to her own ACK. Discipline catches its own authoring curator within minutes of filing — operational robustness by self-test.
- **Filing-to-citation latency <30min target hit recursively** as default. Phase A discipline target hit at peak.
- **Substrate-finding empirical rigor** — directional-asymmetry → INTERMITTENT-via-mount-staleness through three rounds of evidence-driven sharpening (n=2 → n=4 → n=4-with-mixed-outcomes).

### Tail-end items going into S28 (all non-urgent)

- **Brunel:** Topic 06 write-back (Volta-resume timing; Herald co-author offer); Cal worktree-asymmetry entry accuracy review (he's co-source-agent)
- **Monte:** Compound-signals v1.1 fold + Herald [COORDINATION]; single-channel-saturation-via-mode-partition Protocol A; recursive-citation-as-canonical-validation Protocol A
- **Cal:** 4 Protocol C promotion candidates (surface to me next prune); receiver-side amendment to substrate-invariant-mismatch n=6 if eventual self-iteration catches up
- **Tier-0 §3.4 questions** (PO escalation): (1) Brilliant pre-rejection attempt log existence; (2) append-only-additive contract on `WriteAccept`/`WriteRejection` envelopes — both PARTIAL per Cal's wiki Protocol B; PO escalation at session-tail
- **Topic-09 micro-fix** (deferred to Volta): line 761 `WikiProvenance` example needs `source-team` field added per S26 Protocol C #1 schema add
- **Volta NEXT-SESSION-CHOREs:** T06 path-tree rewrite + T04 path-tree audit (lines 528 + 1025 contradicting S5 #62 patch) + Topic-09 micro-fix

### Standing watch items going into session 28

- **TPS-583 watch** — when user signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2: page V2→ITOps `I`, banner removed, v1.0, intake-template assignee filled, close TPS-583, close RFC #2 review-status
- **apex-research n=2 invocation** — first deployment of #1 v0.7 template beyond FR; convention re-test point per template's load-bearing test
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **Ruth-team observability gap** — only on Ruth Q2/Q3 response
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions

### Meta-observations from session dynamics

- **Cite-and-fold cadence as default operational mode.** All four design artifacts cross-cite each other; co-design instances absorbed via fold-not-revert. Phase A established the discipline; Phase B operationalized it as the default cadence.
- **Worktree-isolation n=7 cumulative** with mixed work types (1 Brunel branch + 4 Herald PRs + 2 Monte preempts) demonstrates the discipline scales structurally.
- **Substrate-failure-mode characterization** turned an obstacle into a wiki contribution. n=6 substrate-invariant-mismatch + new worktree-spawn-asymmetry entry + relay path operationalized = three artifacts produced from what would otherwise have been a friction point.
- **Agent-self-organization at session-tail** — Cal-Brunel recursive-validation loop happened entirely without team-lead intervention. Discipline-catches-discipline emergent.
- **Five+ in-session timestamp-crossed events** all surface-not-bridge resolved cleanly. Wiki entry filed at 11:08 dogfooded continuously through session-tail.

### NEXT-SESSION BOOT (re-orient instructions for S28)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any Cal scratchpad updates.
3. **Pull `mitselek/prism` repo** if you want to read Phase A/B Prism artifacts (PR #12 + PR #13 + envelope contracts).
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces Phase C activation** (next federation expansion phase, e.g., new team joining via #1 v0.7 template at apex-research): spawn Brunel for federation-bootstrap-template invocation + Cal for namespace allocation + likely Monte for drift-detector deployment.
6. **If PO surfaces Volta-resume tasks:** spawn Volta for T06 path-tree rewrite + T04 path-tree audit + Topic-09 micro-fix. Three NEXT-SESSION-CHOREs queued.
7. **If PO surfaces TPS-583 progression** (Ruth signal): action Stage-2 standard moves.
8. **First operational item if Cal-spawning:** her queue is genuinely flushed; surface-grade work would be Protocol C draft authorizations on the 4 promotion candidates from S27 + receiver-side amendment to substrate-invariant-mismatch n=6 if eventual self-iteration catches up.

---

## SESSION 26 WRAP — 2026-05-05 (Phase A on Prism — federation substrate ratified end-to-end)

**Major outcomes:**

- **Codename "Prism" committed** (PO ratified mid-session). Optical lineage: Obsidian (volcanic glass) → Brilliant (cut diamond) → Prism (refractor — federation as one substrate, multiple per-team views).
- **`mitselek/prism` private repo bootstrapped.** Local clone at `~/Documents/github/.mmp/prism/`. Brunel handled bootstrap; root commit `2f26706`.
- **Phase A STRUCTURALLY FINAL** — 11 PRs merged on `mitselek/prism` main. Federation substrate primitives ratified into typed contracts. Envelope contract at v2.0.

**Architecture team activated this session** (Brunel, Monte, Herald) plus Cal + Finn carried.

### 11 PRs merged on `mitselek/prism` main

| PR | Author | Phase | Content |
|---|---|---|---|
| #1 | Brunel | A.1 | Topology + container posture + setup-blocked |
| #2 | Herald | A.1 | Deliverables A + B v1.0 (envelope + sync) |
| #3 | Brunel | A.1 | §3 namespace allocation (`fr/` + `Projects/fr/wiki/*`) |
| #4 | Monte | A.1 | Surface 2 v1.0 + v1.1 (write-block error semantics) |
| #5 | Herald | A.1 | v1.1 (Monte recovery shapes fold + R2 dispatch + Mod 2 retraction) |
| #6 | Monte | A.2 | Surface 1 M3 + Surface 3 DACI |
| #7 | Herald | A.1-fix | Stale table header |
| #8 | Monte | A.2-mod1 | sourceTeam dedup |
| #9 | Herald | A.3 | Deliverable C — two-pattern asymmetry decision matrix |
| #10 | Herald | A.3 | Envelope-v1.1 (CuratorAuthority required + integrated) |
| #11 | Herald | A.3 | SemVer bump 1.1.0 → 2.0.0 |

### Substrate primitives ratified into typed contracts

- **Hub-and-spoke topology** (FR-as-hub) + 4 documented growth triggers
- **Pull/poll sync mechanism** (Brilliant poll-only substrate, observed-fact)
- **`fr/` short-form namespace + `Projects/fr/wiki/*` placement** (Cal-curator sole-writer preserved)
- **Symmetric envelope, mode-by-content-category** (resolves two-pattern asymmetry structurally)
- **R2 sovereignty** (`producer.team === logicalPath.team`) as typed invariant
- **5-class WriteRejection enum** (closed) + sub-discriminator approach (`kind: "endpoint-unreachable" | "review-timeout"`)
- **CuratorAuthority discriminated union** required at v2.0 (`mode: "self" | "ratified-cross-team"`)
- **ProducerAction closed enum** (`wait-and-repoll | fix-and-resubmit | escalate-to-team-lead | escalate-to-governance | abandon`) — operationalizes no-fallback discipline as contract teeth
- **M3 federation-curators-as-class** (asymmetric DACI: methodology-target-decides + product-no-write-allowed + observation-target-decides)
- **§3.4 ratification protocol** preserves R2 by routing cross-team writes through target-curator's producer identity
- **Strict-SemVer for typed contracts** as precedent (migration mechanism makes bump SAFE; SemVer level reflects whether consumers must change code)

### Composite framing (Herald deliverable C §3-§5)

*"Substrate sees one substrate; asymmetry lives in interpretation, not in shape."* Three axes converge (envelope shape, sync mechanism, error-recovery family); two diverge (curation authority, reader cardinality). Composition produces federation that is simultaneously **open** (cross-team contribution allowed via ratification) + **sovereign** (R2 enforced for product) + **cheap** (substrate-level federation reads) + **auditable** (`CuratorAuthority` + `sourceTeam` make all attribution machine-checkable).

### Wiki contributions today (66 → 69)

- 66 `wiki/patterns/no-future-proofing.md` (n=many across sessions; promoted from user memory)
- 67 `wiki/patterns/dispatch-granularity-matches-recovery-handler.md` (n=1, watch)
- 68 `wiki/patterns/coordination-loop-self-correction.md` (n=2 promotion-grade)
- 69 `wiki/patterns/worktree-isolation-for-parallel-agents.md` (n=2 with Brunel first-person amendment; n=5 empirically by session-end)

[DECISION — session 26] **Phase A on Prism federation substrate complete at v2.0.** All design surfaces ratified. Substrate primitives become the typed contract foundation for the federation.

[DECISION — session 26] **Strict-SemVer-as-typed-contract-discipline ratified as precedent.** Migration mechanism (substrate-side backfill) is orthogonal to consumer's type-check work. Minor bump = strictly additive; major bump = type-checking changes for consumers. Source: Herald PR #11 §3.2.

[DECISION — session 26] **Branch+PR convention for Phase A+ design work.** Each agent ships a feature branch + PR; team-lead ratifies-and-merges per merge action. Reversible without history rewrite; supports composite review.

[DECISION — session 26] **Worktree-isolation as default for parallel agent work.** n=5 dogfooded today (Brunel + Monte preempt + Herald table-fix + deliverable C + envelope-v1.1 + SemVer bump). Memory rule `feedback_no_fallbacks.md`'s "use isolation: worktree" guidance is empirically validated. Apply from session 27 onwards by default for any parallel-specialist branch work.

### [LEARNED — session 26 cluster] (compress on next session-tail)

- **Cross-wires-in-flight is a structural reality at coordination tempo** (n=8 cumulative today: inbox-message crossings + git-state crossings + PR-merge-vs-cross-read crossings)
- **Surface-don't-bridge** ratified even with false-positive HOLD (Herald 16:38). Refinement: *"is this divergence likely to have been resolved by a message I haven't read yet?"* — re-process inbox first if surfacing-cost > re-read-cost
- **Cherry-pick is the recovery for committed-and-pushed-but-orphaned commits.** Stash applies only to uncommitted changes. Different recoveries for different states. (Herald correction of my 16:31 path-misnaming.)
- **Snapshot-state-at-ratification-time can mis-name the path-to-end-state** even when end-state is correct (my 16:38 stash-workflow misnaming)
- **Coordination-loop self-correction runs at coordination-tempo, not just session-tempo** (n=2 within-loop self-corrections in single 5-message exchange — Monte v1.0→v1.1 + Herald Mod 2 retraction)
- **Field-level overlap is a class-of-bug gate-2 catches reliably** — one field, one truth beats N fields with documented mirror invariant (Herald sourceTeam dedup catch)
- **Audit-trail-for-rejection-rationale paragraph** protects against future re-duplication (Monte §3.5 "Why sourceTeam is not duplicated here" cite-back)
- **Substrate-shape vs authority-shape orthogonality** (Monte M2 rejection) — *"topology design that conflates them imports the wrong failure mode"*
- **Asymmetries should live above the substrate, not in the substrate** (Herald deliverable C §3-§5 composition framing) — wiki-promotable, joint Herald-Monte
- **Pre-commit-to-extension shapes reviewer-vs-author dynamics favorably** (Herald's opening [COORDINATION] move) — even with retraction-strengthens-pattern irony
- **Protocol-completeness across surfaces** (Herald spotted, Monte named): every error-class escalation has a ratification path back to a legitimate write — n=1 promotion-grade
- **Dense correction clusters are a team-health signal** (Herald's session-tail observation: 5 within-loop self-corrections + 2 cross-team race-conditions + 1 false-alarm-with-recovery = working correctly)
- **504-then-success API-gateway-error-vs-actual-server-state** (Herald's gh pr create observation): *"API gateway errors are not necessarily request-failures; verify state before retrying"*
- **412w-scope-memo + 1300w-shipped-design cadence** (Brunel's discipline) is the right team-shape — tight scope, expansive design — held across all three architecture specialists
- **Eratosthenes-already-aligned** ([LEARNED] from this morning): cross-team consumer leading the team on schema. Inverse: when planning typed-contract change, if consumer NOT yet aligned, change is premature
- **n-axis discipline** for promotion: distinguish *instance count of pattern* from *cardinality of dimension you're claiming pattern across*
- **Meta-coordination has compounding-cost shape** (Monte's framing): paying it incurs setup; clearing it unlocks throughput multiplier — don't interleave
- **Filing-to-citation latency <30 min** today (Cal `poll-only-substrate-sidecar-derivation.md` filed and cited in alignment directive within minutes); *complete-enough-to-cite is the bar from minute one, not "we'll polish later"*

### [WIP — Cal Protocol A queue, ~13 patterns deferred to next session]

**Promotion-grade or n=2 cumulative:**
- #4 lossless-convergence Herald-Monte (joint, n=2 cumulative w/ session #59 — auto-promotes per Cal's schema-purity discretion: source-agents `[herald, monte]`, prose attribution to session-59 historical instance)
- #5 canonical-taxonomy-check before naming wrap targets (Monte, n=2 cumulative w/ session #59)
- #11 protocol-completeness-across-surfaces (Herald+Monte joint, promotion-grade by Herald's stated criterion)

**Watch (n=1):**
- #3 pre-commit-to-extension irony (Monte)
- #6b self-correction-via-prior-self-argument (Herald — currently parked as sub-shape of #68)
- #32 cross-specialist-argument self-correction trigger (Herald)
- #33 timestamp-crossed-messages (n=8+ cumulative today; split or merged at Cal's discretion — strong promotion candidate)
- #34 surfacing-with-stale-inbox + Monte's surface-bias-cost-asymmetry sibling
- #35 snapshot-state-mis-names-path-to-end-state (n=1, my path-misnaming)
- #40 504-then-success client-server temporal divergence
- #41 worktree-isolation amendment (Brunel + Herald n=5 today)
- #43 SemVer-strict-typed-contract discipline
- field-level-overlap one-truth-not-mirror (Herald, sibling to #67)
- audit-trail-for-rejection-rationale (Monte sub-shape, n=1)
- substrate-vs-authority-shape orthogonality (Monte M2 rejection, n=1) — promotable on next sighting
- asymmetries-live-above-substrate (Herald deliverable C composition)

Herald + Monte coordinated on submission split per 16:43 [COORDINATION]. Cal will dedup-merge per Protocol A step 5 if duplicates surface. Cal's scratchpad pruned to 73 lines with headroom for ~13 patterns; will likely re-prune mid-session 27.

### [WIP — Phase B (NOT STARTED)]

Wakes on PO direction. Three workstreams:

1. **Federation bootstrap protocol** (new team joining federation) — Brunel's domain. Likely shape per Brunel's preview: parameterize FR Brilliant MCP runbook over `<team>` + namespace claim; Cal-coordination per new team for namespace allocation. Convention re-test at n=2 (apex-research likely next).
2. **Authority-drift detection at federation scale** (n=20+) — Monte/Brunel joint. Substrate-side instrumentation; likely sidecar + cron-poll consistent with pull/poll sync.
3. **T04 topic-file amendment text** — post-Phase-A codification (Volta's chore from session 21).

### Standing watch items going into session 27

- **Trigger 1 (reverse spoke→spoke flow >2 teams within a quarter)** — empirical question that gates next topology decision (hub-and-spoke → hybrid trigger). FR session-tail responsibility, not Brunel's.
- **Topic-09 source-team example refresh** (Cal micro-fix, 5-line edit when convenient)
- **Source-team semantics extension watch** — needs n=2 *distinct deployments* producing observation-class entries before Protocol C extension justified (Cal's n-axis disambiguation)
- **TPS-583 watch** — Stage-2 actioning when Ruth signals (no change from session 22)
- **T06 path-tree rewrite** (Volta — pending from session 19/20)
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **Ruth-team observability gap** — only on Ruth Q2/Q3 response

### Meta-observations from session dynamics

- **Decision-cadence chain unblocked specialists fast:** 16:11 sync directive (mine) → 16:22 namespace ratification (mine) → §3 ship same-day (Brunel). Each downstream unblock arrived within ~10 min of upstream decision.
- **Cross-wires count ended n=8** across mostly inbox-message and git-state crossings. The pattern itself became a team-health observation rather than a coordination failure.
- **Team-shape "412w scope-memo + 1300w shipped-design"** (Brunel observation) held across all three architecture specialists — tight scope, expansive design.
- **Worktree-isolation surfaced organically from a near-miss, not postmortem.** Brunel hit it first; Monte caught preemptively; Herald dogfooded n=5. Pattern landed at n=2 by session-end.
- **Agent reuse rule held:** spawned each architecture agent once at 16:11/16:12; kept them alive across phases A.1→A.2→A.3. No name-2 duplicates today.

### NEXT-SESSION BOOT (re-orient instructions for session 27 me)

1. Read `startup.md` first (always) — its #62 patch keeps Step 2 collapsed to `TeamDelete + TeamCreate + verify`.
2. Pull `mitselek-ai-teams` repo for any Cal scratchpad updates from agent-side persists.
3. Pull `mitselek/prism` repo if you want to read the canonical Phase A artifacts on disk; otherwise you can read this scratchpad's PR table and the prism repo lives.
4. Don't pre-spawn any agent at session start. Wait for PO direction. Phase B activation is the most likely next direction.
5. **If PO surfaces Phase B activation:** spawn Brunel + Monte. Herald wakes on demand for protocol contract questions. Cal carries.
6. **If PO surfaces something else entirely:** ask which team is needed. The framework-research team's standing work (TPS-583 watch, T06 path-tree, etc.) is all NEXT-SESSION CHOREs not blocking.
7. **First operational item if Cal-spawning:** her queue has ~13 pattern submissions to file. She can file early-session in idle cycles before any new design work blocks her.

---

## SESSION 25 WRAP — 2026-05-05 (Postgres-backed library service C-phase + reframed phase A)

**Goal (PO-set):** Thinktank library concept; PO playing with thought of Postgres DB backend + dedicated 24/7 library team for org-wide KB services, learning from Brilliant.

**Shipped:**

- **Issue #64** filed and closed with verdict (proceed to phase A). C-phase deliverable: `docs/2026-05-05-postgres-library-discovery-brief.md` + 5 input memos in `docs/2026-05-05-postgres-library-discovery/` (cal-internal-perspective, finn-brilliant-deepread, finn-staging-review-deepread, finn-polyphony-dev-glance, finn-haapsalu-suvekool-glance).
- **Issue #65** filed with reframed phase A scope (scaling esl-suvekool path-namespace pattern, NOT designing federation from scratch).
- **Two commits pushed:** `2abb1ad` session-24 wiki batch (+7 entries, contracts/ opened), `9407966` C-phase discovery brief.
- **Cal substrate-invariant-mismatch amendment** n=3 → n=5 with two new instances (teamcreate-leadership + Brilliant write-path-sync) — applied this session.

**Mid-session reframe (load-bearing):**

- Initial framing: "design federation layer over per-team markdown wikis."
- Finn's Haapsalu-Suvekool glance (after submodule pin updated to HEAD) revealed: **Topology B is OPERATIONAL REALITY at esl-suvekool today**, implemented as `Projects/esl/*`, `Meetings/esl/<date>`, `Context/esl/*`, `Resources/esl/*` — path-namespace per team inside shared central Brilliant. Convention IS the federation contract; no separate layer needed.
- Phase A scope therefore dropped from "design from scratch" to "scale proven pattern + Cal-as-namespace-curator role evolution."

[DECISION — session 25] **Topology B confirmed.** Per-team libraries + central federation, where federation = path-namespace convention inside shared Brilliant.
[DECISION — session 25] **No fallbacks.** If no curator team alive, Tier 3+ writes refuse with retry-when-up error. `ai_reviewer.py` removed regardless of curator-team shape. Memory feedback `feedback_no_fallbacks.md` extended with this case.
[DECISION — session 25] **Independence posture.** No fork of `thejeremyhodge/xireactor-brilliant`; learn-from only.

[LEARNED — session 25, integration-not-relay validation] **Bio-memory mismatch is real and verification discipline matters.** PO cited polyphony-dev as battle-proof for Topology B; actual battle-proof was Haapsalu-Suvekool. Finn's polyphony glance returned a clean negative — caught the mismatch before phase A scoped against the wrong reference. Wiki #44 doing its job: verify substrate claims against the actual substrate before downstream design depends on them.

[LEARNED — session 25] **Submodule pin staleness silently misleads.** `.mmp/ESL/Haapsalu-Suvekool` was pinned to commit pre-dating the Brilliant integration. Quick grep on pinned content returned stale negative; updating to HEAD revealed 20+ refs. Always verify submodule pin freshness before trusting absence-of-evidence.

[WARNING — session 25] **Brilliant memory was wrong** (paertela6-only claim from prior session). Verified truth: per-team MCP config governs access, FR currently does NOT have it configured; esl-suvekool does. Memory file `reference_brilliant_mcp.md` rewritten with operational discipline (Brilliant pulse, quality floor, two-consumer pattern, source-of-truth principle).

**Wiki pattern candidates queued for next Cal Protocol A batch (six new from C-phase + two carried):**

1. OSS thin-integration anti-extension signal (Finn, n=1)
2. Poll-only-substrate + sidecar-derivation as event-driven shape (Finn, n=1)
3. Soft-verdict discipline on substrate-mapping briefs (Finn meta-process catch, n=1)
4. Cross-repo glance: confirm citation before assuming inheritance (Finn, n=1)
5. Path-namespace as federation primitive (Finn, n=1 esl-suvekool)
6. Two-consumer pattern: direct-MCP vs synthesized-snapshot (Finn, roadwarrior-sync skill, n=1)
7. (Carried from session 24) `source-team` frontmatter promotion to standard schema (n=2 — Cal Protocol C draft authorized but deferred)
8. (Carried from session 24) architectural-fact convention promotion to Cal's prompt (n=3 — Cal Protocol C draft authorized but deferred)

[DEFERRED — to next session] **Cal Protocol C drafts (2 items).** Bigger work, benefits from fresh context. Authorizations stand.

[DEFERRED — to next session] **Cal Protocol A batch on the 6 new candidates.** Should be batched together with the session-24 carry candidates.

## NEXT SESSION — phase A primary, plus deferred housekeeping

1. **Phase A on issue #65** — scale esl-suvekool path-namespace pattern. Setup (FR Brilliant MCP config, namespace allocation rules) + research (dedup census, cross-team query frequency) + design (Cal's role evolution, multi-reviewer schema, orchestration shape, signal derivation rules, write-block error semantics). Phase A team: Cal+Finn carry, add Brunel/Monte/Herald.
2. **Cal Protocol C drafts** — `source-team` to standard schema; architectural-fact convention to Cal's prompt.
3. **Cal Protocol A batch** — 8 candidates queued.
4. **TPS-583 watch** (no change) — Stage-2 actioning when Ruth signals progression.
5. **T06 path-tree rewrite** (Volta, no change).
6. **esl-suvekool feedback loop** (no change) — when PO returns from Tobi sessions.

If PO arrives with direction, that takes priority.

---

## SESSION 24 WRAP — 2026-05-04 (Cal wiki batch)

**Goal:** Route 7 wiki candidates parked from sessions 21-23 to Cal via Protocol A batch.

**Shipped (commit `2abb1ad`):**

- 7 wiki entries filed (52 → 59 entries).
- First `contracts/` subdir entry opened (speculative-marker-for-cross-team-drafts).
- 1 classification delta accepted: operational-team-archetype filed under `patterns/`, not `process/` (Cal's call — team-shape ≠ workflow; sibling precedent at multi-repo-xp-composition + cathedral-trigger).

**Promotion candidates surfaced and authorized:**

- `source-team` frontmatter → standard schema (n=2, Protocol C draft) — DEFERRED, carried.
- Architectural-fact convention → Cal's prompt (n=3, Protocol C draft) — DEFERRED, carried.
- `substrate-invariant-mismatch` n=3 → n=4 amendment — DEFERRED, eventually landed session 25 as n=5 (with Brilliant write-path-sync added).

[LEARNED — session 24] **Re-classify discipline accepted.** When pre-classifying submissions, default to suggestions-not-directives; let Cal use sibling precedent. My pattern/process/ disagreement on operational-team-archetype was where Cal's substrate knowledge beat my mental model.

---

## SESSION 23 WRAP — 2026-05-01/02 (esl-suvekool team designed + deployed)

**Goal (PO-set):** Design a new team to support PO in organising ESL Haapsalu Suvekool 2026 (concert 2026-08-16, Haapsalu Toomkirik). PO's role is gap-filler supporting Liisa Rahusoo (board lead).

**Shipped:**

- **8-file onboarding package** designed by Celes, deployed to `mitselek/Haapsalu-Suvekool` repo at `teams/esl-suvekool/`. Three commits: `d0526ee` (bootstrap), `f65fb2a` (startup amendment — TeamCreate + S5 added), `0e461be` (`.claude/startup.md` repo-root hook for fresh-session ergonomics).
- **Team architecture (Option C, Cathedral-lite-adapted, all opus-4-7):** Tobi (Rudolf Tobias, TL+timeline owner), Lyyd (Lydia Koidula, Estonian scribe + stakeholders.md gate), Saar (Mart Saar, logistician — Carus-Verlag tellimus is task-1 day-1), Tamp (Herbert Tampere, musicologist — singer-prep + kavaleht + listening guides for Zelenka/Hasse/Vivaldi).
- **Mission framing locked (PO confirmed):** "load-shed Liisa via Mihkel as liaison, succession-readiness baked in" — NOT "help Mihkel organise." Liisa announced board departure for Jan 2027 (or Apr 2027). Every artifact designed for the next Suvekool lead (not Liisa, not Mihkel).
- **First session of esl-suvekool started by PO same evening** (in separate Claude session, Haapsalu-Suvekool/ workdir; .claude/startup.md hook auto-bootstrapped Tobi). Confirmed engaged 2026-05-02.

**Workflow shape (reusable for future team designs):** PO intent → Aen brainstorming (work-types, architecture options) → spawn Celes for opinion → Celes Brilliant query for substrate → architecture + naming + workdir options → PO 4 decisions → Celes drafts package → Aen TL review → PO approval → Aen deploys (commit + push to target repo) → bootstrap hook → PO opens fresh session.

[LEARNED — substrate, promotion-grade]

- **Operational team archetype introduced** — first-of-its-kind in our corpus. Differentiators: no tdd-pipeline, succession-framing first-class, low-volume cadence (1-3x/week), persistent-roster-episodic-sessions. Wiki candidate (n=1, watch). Promotion trigger: a second similar team (non-code, multi-month, persistent roster) requesting same shape.
- **`.claude/startup.md` at repo root as fresh-session bootstrap hook** — novel pattern. Lets PO open Claude in a workdir and the assistant auto-identifies as the team-lead persona, reads team config, runs startup. Cleaner than expecting PO to type bootstrap incantations every session. Wiki candidate (n=1, watch).
- **Mutual exclusivity of team-leadership prevents in-session cross-team spawning** — confirmed empirically. Designing-team-Y from session-leading-team-X works; spawning agents into team-Y from team-X session does NOT (Agent tool with team_name=Y requires team-Y already TeamCreate'd, which conflicts). Solution: deploy team-Y artifacts + .claude/startup.md hook, hand to PO for fresh-session start.
- **API key in cleartext caught by Celes during toolkit read** — surfaced 5-file exposure (README + BACH-TOOLS-GUIDE) + `client_secret.json` filename in `mitselek/Haapsalu-Suvekool`. PO rotated same session: new key 35178654-…, old key e8cc9b68-… soft-deleted (30-day undelete window until 2026-05-31), 4 docs cleaned to `YOUR_API_KEY_HERE`, .env gitignored, .env.example added, history rewritten (HEAD c082fd9 → 0e461be), 67 files redacted (47 VSCode + 2 gcloud + 18 misc), local git GC pruned. Substrate finding: when reading any external repo as part of team design, do a credentials sweep early.

[LEARNED — process]

- **Celes wrote outside stated MAY-WRITE area** (designs/new/ at FR repo root, vs prompts/ in her permission block). Aen supported the call — staging at repo root is more discoverable than mixing into prompts/. Flagged in her scratchpad as [PATTERN]: when designing teams that LEAVE framework-research, staging area = FR repo root, not under FR's own teams/. Future-Celes shouldn't relitigate.
- **Celes's "lean startup" omitted TeamCreate bootstrap** — caught at deployment review. Lean is right principle, but TeamCreate is table stakes (not trauma history). Aen amended startup.md with FR's #62 patch pattern: `TeamDelete + TeamCreate + verify` at start, `TeamDelete()` at end. Lesson: when collapsing a checklist, distinguish "always-needed primitives" from "scar-tissue defensive steps." FR's S5 (#62 patch) is the right model — concise but complete.

**Wiki candidates held (Cal Protocol A on next Cal spawn) — 2 from session 23 + 5 carried from sessions 21/22:**

Session 23 new:

1. **Operational team archetype** (no tdd-pipeline, succession-first, low-volume cadence) — n=1, watch.
2. **`.claude/startup.md` repo-root bootstrap hook** for cross-team handoff — n=1, watch.

Carried from session 22 (4) + session 21 (1):
3. Two-stage adoption pattern (proposal-space → escalation → canonical-org-space) — substrate-relevant for future standards.
4. `[speculative]` marker convention for cross-team handoff — defines "this is inference, please confirm."
5. Confluence space create-perm-as-404 disguise — gotcha-shape.
6. EntraID-not-WSO2 — substrate-fact for EVR docs.
7. (Carried from session 21): "In-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team apex+FR. **Empirically reinforced this session** by esl-suvekool's session-1 not needing recovery (S5 worked here at end of session 22, then again at start of session 23).

[DEFERRED — pending Tobi's first-week activity]

- **Watch esl-suvekool session 1 outcomes** — did Saar produce Carus-Verlag draft? Did the bootstrap hook surface any issues? Did Tobi register session-1 [LEARNED] worth bringing up. PO will tell us; do not poll.

## NEXT SESSION — TPS-583 watch primary (no change from session 22)

1. **TPS-583 watch** — when user signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2: page moves V2→ITOps `I`, banner removed, v1.0, intake-template assignee filled, close TPS-583, close RFC #2 review-status.
2. **Cal spawn (when next needed for wiki work)** — route 7 wiki candidates: 2 from session 23 (operational-team-archetype, .claude-startup-hook) + 4 from session 22 (two-stage adoption, `[speculative]` marker convention, create-perm-404 disguise, EntraID-not-WSO2) + 1 carried from session 21 (in-memory-survives-`/clear`, now n=2-empirically-reinforced).
3. **T06 path-tree rewrite (Volta)** — also scoped to fix DO-NOT-TeamDelete contradictions on T06 lines 528 + 1025 that contradict S5 (#62 patch).
4. **esl-suvekool feedback loop** — when PO returns from Tobi's session(s), absorb any [LEARNED] worth promoting upstream.
5. **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event.
6. **Ruth-team observability gap** — only on Ruth Q2/Q3 response.

If PO arrives with direction, that takes priority.

## SESSION 22 WRAP — 2026-04-30 (EVR konteinerite standard shipped: Stage-0 + Stage-1)

**Goal (PO-set):** Push hello-world-container PoC through corporate pipeline; end with adopted "EVR sisene konteinerite standard" + Jira intake protocol for ad-hoc dockerised installations at EVR.

**Shipped:**

- **Stage 0:** Standard published as Confluence page id `1713864752` ("EVR sisene konteinerite standard") in **D365 space** (temporary — V2 has restrictive create-perm; only Ruth as space owner can move/create). Banner-marked "Ettepanek — ootab ITOps poolt vastu võtmist". URL: `https://eestiraudtee.atlassian.net/wiki/spaces/D365/pages/1713864752/EVR+sisene+konteinerite+standard`
- **Stage 1:** Tracking issue [TPS-583](https://eestiraudtee.atlassian.net/browse/TPS-583) posted, assigned **Ruth Türk**. 4-step Stage-1 ask: move D365→V2 → review → escalate → identify subteam. RFC #2 close-bridge embedded in acceptance criteria.
- **Drafts in `docs/`:** `evr-sisene-konteinerite-standard-v0.1.md`, `evr-konteinerite-intake-template-v0.1.md`, `evr-konteinerite-tracking-issue.md`, plus harvest doc (Finn pruned 240→92 lines), audit reports (Medici pass 1+2), proposed-diff doc (Brunel pass 2 review surface).

**Workflow shape (reusable for future ad-hoc standards):** Finn harvest (RFC ref + repo state + Confluence space landscape + mirror target) → PO 4 confirms (home / Jira project / title / placement) → Brunel drafts (3 artifacts mirroring chosen reference) → Medici audit → revisions → Medici re-audit → propose-diff review → apply → Stage-0 publish → Stage-1 post.

**`[speculative]` markers convention introduced** — flag Brunel inferences, container-adaptations of Linux-standard patterns, RFC #2-derived RACI as draft-state. 16 surviving markers in standard, 2 in intake, 2 in tracking. Stage-1 reviewers scan as confirm/adjust points.

[LEARNED — substrate-level findings, multiple promotion-grade]

- **V2 Confluence space create-permission restricted to space owner (Ruth)** — affects ALL future publish flows from non-owner team members. Workaround: publish in PO's permitted space (D365 here), Ruth moves to V2 as Stage-1 step. Wiki candidate.
- **TPS Jira project rejects Task issue type, accepts Story** — workflow quirk; Story has same hierarchy level (0) and works. Worth noting for future TPS posts.
- **EVR's actual SSO is EntraID (Microsoft Azure AD), NOT WSO2.** WSO2 is the integration platform (Micro Integrator for TAF/TAP message routing). Cited via FSM page `536248326` (UAM SSO) + INFOSEC page `851607559` (Delinea SSO). Brunel verified — corrected my hedge during the IAM/PAM ripple. Wiki candidate (substrate-fact for EVR docs).
- **`createConfluencePage` MCP returns 404 on V2** (likely permission-as-404 disguise; Atlassian obscures permission denial behind 404 for security best-practice). Wiki candidate (gotcha-shape).
- **Mirror target: Roland Kilusk's "EVR sisene Linux standard"** (page `1335984130`, ITOps space `I`). Title format `EVR sisene <X> standard`, ~700-1000w single-ET prose, EN product nouns inline, no parallel EN, Tier 0/1/2 classification, no frontmatter, exception-doc in preamble. Peer: BYOD standard. **Tier-numeral inversion vs intuitive (Brunel's call):** Tier 0 = highest sensitivity (production-adjacent), Tier 2 = lowest (≤4-week PoC). Matches Linux standard convention.

**Wiki candidates (Cal Protocol A on next spawn) — 4 from session 22 + 1 carried from 21:**

1. **Two-stage adoption pattern** (proposal in own/permitted space → escalation → canonical org space) — substrate-relevant for future standards.
2. **`[speculative]` marker convention for cross-team handoff** — defines "this is inference, please confirm" without breaking flow.
3. **Confluence space create-perm-as-404 disguise** — gotcha-shaped, useful pattern.
4. **EntraID-not-WSO2** — substrate-fact for EVR docs going forward.
5. **(Carried from session 21):** "In-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team apex+FR.

[DEFERRED — Stage 2 ahead] Pending Ruth's escalation outcome via TPS-583:

- Move D365 page to V2 (Ruth's Stage-1 step 1; she has space-owner perms)
- Standard v0.1 → v1.0: banner removed, receiving role baked in
- Page moves V2 → ITOps space `I` (peer to Linux + BYOD)
- Close TPS-583
- Close RFC #2 (`Eesti-Raudtee/hello-world-container` PR #2) review status (PR stays open with `do not merge` flag, just review-status closed)

**Auth note:** Atlassian plugin OAuth (claude.ai/Atlassian) authenticated this session — read+write scopes for Confluence + Jira at cloudId `2309a7c9-1d93-47a4-80ef-ab7f528cbb77`. Token persists session-level; re-auth needed at next session start.

## SESSION 21 WRAP — 2026-04-30 (#62 patch shipped, new shutdown S5 dogfooded)

**#62 from apex-research/Schliemann** filed AS REFERENCE for FR — proposed startup/shutdown collapse based on apex session 23 in-memory-survives-`/clear` failure. Volta assessed; adopted with one modification (kept R4-3 operational gate as Step 2b — verify-on-disk is independently load-bearing, not just retry-loop scaffolding).

**Empirical confirmation (n=2 cross-team):** This session's startup hit the exact failure mode. `rm -rf "$TEAM_DIR"` ran clean, then `TeamCreate` returned "Already leading team. Use TeamDelete to end..." Recovery required `TeamDelete + TeamCreate` anyway. Same pathology Schliemann reported.

**Patch committed (`426194d`):** `teams/framework-research/startup.md`

- Steps 2 (Diagnose) + 3 (rm -rf Clean) + 4 (Create + retry block) → single Step 2 (Reset team state): `TeamDelete + TeamCreate + verify`. Recovery primitive hoisted to top of every startup instead of branched into on failure.
- Step 4b (operational gate) → Step 2b. The verify-on-disk check IS the gate.
- Steps 5/6 → 3/4.
- New Step S5 (Release team leadership): `TeamDelete()` after final `git push`. Nulls in-memory state on graceful exit; next session's `/clear` startup needs no recovery.
- Gotcha #3 updated (now references Step 2 verify, was Step 4).
- New gotcha #4 documents "in-memory team-leadership state survives `/clear`".
- Old R7 Note "S5 removed because runtime is ephemeral" replaced with corrected explanation: runtime *dir* IS ephemeral; parent CLI's in-memory leadership state is NOT.

**Cross-team:** Comment posted on mitselek/ai-teams#62 (`issuecomment-4350394024`) with FR-side confirmation, commit link, evidence correction (FR retry block was n=1, not n=0 — Restart 4 hit it).

**Volta's [LEARNED] — wiki promotion criterion:** "Cross-team gotcha promotion: when one team observes a failure mode and fixes it, second-team confirmation (n=2) is the trigger to elevate from team-local doc to wiki-level pattern. Schliemann's #62 + this session's startup is the canonical pair."

**Wiki candidate held (Cal Protocol A on next spawn):** "In-memory team-leadership state survives `/clear` independently of disk" — substrate-relevant, gotcha-shaped, n=2 cross-team. Cal not spawned this session.

**This shutdown is first to use new S5** — dogfooding the patch. Next session's startup runs 5 logical steps not 8, with no in-memory recovery branch.

## NEXT SESSION — TPS-583 watch primary

1. **TPS-583 watch** — when user signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2: page moves V2→ITOps `I`, banner removed, v1.0, intake-template assignee filled, close TPS-583, close RFC #2 review-status.
2. **Cal spawn (when next needed for wiki work)** — route 5 wiki candidates: 4 from session 22 (two-stage adoption, `[speculative]` marker convention, create-perm-404 disguise, EntraID-not-WSO2) + carried session-21 in-memory-survives-`/clear`. All via Protocol A.
3. **T06 path-tree rewrite (Volta)** — also scoped to fix DO-NOT-TeamDelete contradictions on T06 lines 528 + 1025 that contradict new S5 (#62 patch).
4. **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event.
5. **Ruth-team observability gap** — only on Ruth Q2/Q3 response.

If PO arrives with direction, that takes priority.

## NEXT-SESSION-CHOREs (still active)

- [ ] **TPS-583 status check + Stage 2 actioning.** When Ruth has identified ITOps receiving subteam (or moved page), action: page V2→`I` move, banner removal, v1.0 promotion, intake assignee bake-in, close TPS-583 + RFC #2 review-status.
- [ ] **Cal session-22 wiki candidates (4) + session-21 carry (1).** 5 promotion-grade candidates: two-stage adoption pattern, `[speculative]` marker convention, Confluence create-perm-404 disguise, EntraID-not-WSO2 substrate-fact, in-memory-survives-`/clear`.
- [ ] **T06 Path-tree rewrite (Volta).** `topics/06-lifecycle.md` Path 1/2/2.5/3 decision tree needs rewrite for Agent-tool spawn (post-#60). Herald's `agent-spawn-protocol.md` defines the shapes each path uses; Volta's rewrite references them. T03/T06 boundary named clearly (Herald session-19 [LEARNED]): "protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when." **Session 21 addition:** also audit T06 lines 528 + 1025 for "DO NOT TeamDelete" assertions that contradict new shutdown S5 (#62 patch).
- [ ] **Cal: route in-memory-survives-`/clear` wiki candidate** (#62-derived, n=2 apex+FR) on next Cal spawn via Protocol A. Volta's session-21 [LEARNED] is the source — promotion-grade.
- [x] ~~Finn scratchpad prune (~190 lines → target 100)~~ — DONE this session, 129→98 lines, pointer block preserved.
- [ ] **Brunel: fix stale port 2224 in ruth-team container doc.** `docs/ruth-team-container-design-2026-04-15.md` has port 2224 but `deployments.md` already allocates entu-research:2224. 1-line fix, assign to Brunel on next ruth-team task.
- [ ] **Brunel: `tmux-spawn-guide.md` retirement decision** — currently banner-gated; Brunel's call on whether to delete outright. Parked DEFERRED per session 19.
- [ ] **Eratosthenes symmetric prompt edits — tmux-direct to Schliemann.** WITHDRAWN if Schliemann's apex shutdown persists. Preserved here only because the pattern (multi-mode-defenses + bootstrap-preamble-as-cross-tenant-channel wiki candidates) is substrate-independent — if revived under a new pilot, the structure carries forward.
- [ ] **Brunel n=2 watch.** Two RC-infra gotchas at n=1 watch posture: (a) `gh` not installed on RC host (only inside containers), (b) CRLF/LF reflow noise on apex-migration-research files (need `git diff -w` to evaluate "is diff substantive"). Promote to wiki on second sighting of either.

## META-LEARNINGS — carry forward

[LEARNED — session 20] **Path-depth transcription discipline on cross-pollination relays.** When relaying a structural example (path templates, code snippets, frontmatter schemas) from another team's wiki to ours, copy verbatim or include the on-disk path so the librarian can verify against source. Never paraphrase example bodies. Hit this turn: my relay of apex's `wiki-cross-link-convention` table compressed `../../../../decisions/...` (4 dots) to `../../../decisions/...` (3 dots). Cal caught it by using apex's actual on-disk values rather than trusting prose. Fix is mine, not Cal's: the protocol-A-relayer's responsibility is to transmit faithfully, not to shorten.

[LEARNED — session 20] **Multi-edit Read-before-Edit constraint requires per-message serialization.** Cal hit it 4 times today — queueing several Edits in parallel within one message only the first lands; each Edit invalidates the file's tracked-read-state. Librarian-side operational rule for now (Cal's scratchpad), n=1 librarian. If a future librarian replication or batch-wiki-edit agent hits the same shape, promotion-grade. Symmetric rule for me: when amending wiki entries via Cal, scope the request to one entry per message OR explicitly flag "serial edits expected."

[LEARNED — session 20] **`autossh -M 0` is necessary but not sufficient for Windows persistent bridges.** autossh treats child ssh exit code 127 as fatal and gives up — unrecoverable without external supervision. Pattern fix: wrap autossh itself in a retry loop (`while true; do autossh ... || true; sleep 10; done`) inside the wrapper script. Filed as wiki #46 amendment (5→6 components) same day.

[LEARNED — session 20] **Long-running Task Scheduler actions need wscript+VBS hidden launchers.** Direct invocation of bash.exe (or any console binary) under Win11 Task Scheduler with Windows Terminal as default console host opens a visible window that lingers for the action's lifetime. Filed as wiki #46 component #6.

[LEARNED — SEVERE, user-flagged, preserve verbatim] **§10 oscillation was substrate-speculation dressed as reasoning.** User's framing: *"the oscillation between you two was self-inflicted and you ran in circles, Brunel had couple of your self-corrections all the time enqueued and he again self-corrected against your self-corrections. so actually we don't have a clue about which result is correct."* The honest state: 7 revisions traded framings without either specialist doing the empirical check. Meta-discipline became a thing we performed INSTEAD of thinking. Fix: when the landing oscillates, ask *"what new evidence would settle this?"* — if the answer is "source-code read," it's outcome (c), not a reasoning problem. See wiki #44 meta-trap section.

[LEARNED] **integration-not-relay pattern (wiki #44)** — team-lead's job is integration, not relay. n=4 in one session (Tier 3 endorsement, schema-per-tenant snapshot-cite, Protocol D phantom-acceptance, §10 framing ask). Four-check discipline: walk-history-forward, pending-confirmation-vs-accepted, integration-not-relay, what-would-change-the-landing. Specialist-side complement: pre-fold consistency check (Brunel). Bidirectional integration checking.

[LEARNED] **Outcome (c) generalized definition** (Herald's sharpening): *"Outcome (c) is not 'we've thought about it enough,' it's 'we've exhausted what the current evidence can tell us and need new evidence.' The test is 'what new input would change the landing?'"* — applies across evidence types.

## STANDING DECISIONS

[DECISION — session 21] **#62 startup/shutdown patches adopted.** Steps 2/3/4 collapse to single `TeamDelete + TeamCreate + verify`; new Step S5 `TeamDelete()` after `git push`. Gotcha #3 updated, #4 added. Source: apex-research/Schliemann's #62, FR session-21 startup empirical confirmation (n=2 cross-team). T06 amendment (lines 528 + 1025 contradict new S5) batched with path-tree-rewrite chore, not new task.

[DECISION — session 20] **Cross-team wiki cross-references use GitHub URL form**, not repo-relative paths. Within our wiki, relative paths preserved (existing). For cross-team `related` frontmatter and prose links to apex/comms-dev/etc: default `https://github.com/<org>/<repo>/blob/main/<path>`; switch to `/blob/<sha>/<path>` when freezing a cross-cite is load-bearing (e.g., apex amends their entry and we want our cross-cite to remain literal to what we read). Path-depth assumptions (4-levels-deep math) hold within a team's wiki layout but break across teams' layouts. First applied on entry #50.

[DECISION — session 20] **Slow organic compliance for wiki-cross-link-convention** (entry #50), not a big-bang retrofit sweep. Apply on amendments going forward. Bare-text references in our existing 49 entries are suboptimal but not broken; Brunel's bandwidth stays on container-infra. Revisit only if a real query failure surfaces (reader can't find a referenced artifact) — that's the trigger to rethink, not aesthetics.

[DECISION — session 20] **Four single-entry frontmatter/structural experiments active under Cal's curation, all n=1, watch posture.** None promoted yet. If a second case requests the same shape, surface for hoist decision:

1. Amendment-log body section on #46 (windows-user-context-persistent-bridge)
2. `source-team` frontmatter field on #50 (wiki-cross-link-convention)
3. `provenance-closed` frontmatter field on #48 (live-inject-plus-dockerfile-bake-dual-track)
4. `amendments` frontmatter list on #50 (introduced incidentally during cross-team link form rewrite)

[DECISION] **xireactor-as-shared-KB (#59) parked standalone.** Counter-option preserved: Finn-style quarterly cross-team harvest passes (same info flow, markdown preserved). Pilot-eval proposal: 2 tenants (FR + apex-research) for 1 month cross-team traffic. Fits E-deployment pattern. Full team needed for ecosystem-integration session.

[DECISION] **E-deployment pattern** (CF Tunnel / hello-world-container) adopted as future target for ALL team deployments including migration. Near-term ruth-team = (B) co-located on `100.96.54.170`. Migration B→E is explicit future work — no dates. Ruth-team container MUST be portable.

[DECISION] **Sensitivity boundary** for ruth-team: `.gitignore` excludes `teams/*/sensitive/`. Patterns flow via Protocol A but generalize heavily — no direct quotes, no Jira tickets, Confluence titles, budget figures, or colleague names. Codename `ruth-team` acceptable inside FR only.

[DECISION] **Ruth-team: Brunel v1.0 accepted** at `docs/ruth-team-container-design-2026-04-15.md`. Build blocked on Monte §4.3 + Herald §5.3 open questions. Near-term channel = SSH + tmux pane.

[DECISION] **Protocol D naming ACCEPTED.** Herald v1.2.1 rename pass next session: (i) §2.2 introduce Protocol D, (ii) §5 mapping + §7 cross-refs, (iii) frontmatter note citing Monte Argument 1 (canonical taxonomy slot), (iv) `types/t09-protocols.ts` interface comments.

[DECISION] **Herald Q1/Q2 preconditions at outcome (c)/(c).** Both digest-silent, resolve via Finn source-code walkthrough only. Monte v3 §7.2 reclassification needs rework (built on retracted Herald v1.1 §A evidence). Compressed state: two design preconditions are empirical questions not yet answered; pilot-readiness honest-story = "two source-code walkthroughs + one deliverable."

## OPEN DESIGN QUESTIONS

- Cross-tenant URGENT-KNOWLEDGE routing authority (Monte/Herald future pass)
- MCP tool availability fallback: fail-closed (team-lead + Herald + Cal converged)
- §9.2 design probes: Tier 3 bounce-vs-escalate rejection format, structured-vs-free-text

## ACTIVE WIP

[WIP — session 21] **Cal wiki candidate held:** "in-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team (apex session 23 + FR session 21). Promotion-grade per Volta's n=2 criterion. Route on Cal's next spawn via Protocol A.

[WIP — session 20] **Three apex-research cross-pollination candidates from Finn's 2026-04-29 comparative analysis.** Status:

- ✅ `wiki-cross-link-convention` → filed as #50 with cross-team link form policy decision baked in.
- ⏸️ `adr-accepted-pending-prereqs-status` (three-state ADR flow) — parked, our ADR cadence is too light to bind on this. Revisit if we ever spin up an ADR practice.
- ⏸️ `silence-gap-helpdesk-vs-jira` (two-track prioritization) — parked, no helpdesk surface. Revisit if one materializes.

[WIP — session 20] **Brunel n=1 watch on two RC-infra gotchas.** `gh` not on RC host (only inside containers); CRLF/LF noise on apex-migration-research files (use `git diff -w` to evaluate diff substantiveness). Promote to wiki on second sighting of either. Carry forward into NEXT-SESSION-CHOREs.

[WIP] **Persist-coverage F/D split** (PO-approved 2026-04-14). Fix session: F1 jq filter extraction (Volta), F2 "memory"→"auto-memory" rename (Volta+Cal). Design session: D1-D7 full persist-coverage ship. Sources: `docs/persist-coverage-audit-2026-04-14.md` + `docs/uikit-dev-harvest-2026-04-14.md`.

[WIP] **Structural-discipline cluster Protocol C promotion.** 4 confirmed + 1 pending (Brunel's prompt-to-artifact cross-verification). Defer to session with Brunel spawned.

[WIP] **Cal wiki queue — 12 n=1 candidates held.** Full list in `memory/callimachus.md` session 14 [DECISION] block. Highest-watch: multi-mode-failure-multi-mechanism-defenses (possible n=2 with Volta's persist/restore), Bootstrap-preamble as cross-tenant channel (n=2 with existing #43, possible amendment not separate entry).

[WIP] **Cal post-freeze candidates from Finn harvest:** (1) Pane-labels gotcha addendum (root-cause confirmation, not n=2), (2) Memory-as-load-gated-surface pattern, (3) Wiki governance model split (project-handbook vs methodology-kb).

[WIP] **Aalto open questions** — 6 questions deferred (Finn Section D). Priority: Q1+Q4 highest (scaling evidence), Q6+Q3 medium, Q2+Q5 lower. Route subset via tmux-direct when next uikit-dev contact warranted.

[WIP] **Ruth-team observability gap.** Brunel's v1.0 is purely operational; dual-track (operational + research probe) needs Volta's §6.5 observability addendum. Gated on Ruth's Q2/Q3 answers — her answer reshapes telemetry surface ("weekly digest" ≠ "live interaction"). Do NOT wake Volta before Ruth responds.

[WIP] **Ruth-team: path (a) partial state.** Ruth received Teams relay, responded with one clarifier ("what is OKR?"), operator answered. Q1 (opt-in), Q2, Q3 still pending. Do NOT wake Celes/Volta speculatively — only after Q1 answer arrives.

## DEFERRED

- **Phase 2 Jira/GitFlow classification** — held pending PO reconciliation via dev-toolkit#43.
- **Discussion #56 actionable items:** Provider outage protocol (Monte, T04); Sidecar/peer framework (Brunel+Monte, T06); Contract enforcement (Herald); Platform/provider separation (Finn, T02).
- **Pass 2 filename rename** for `wiki/gotchas/persist-project-state-leaks-per-user-memory.md` — Cal inventoried 7 back-refs; ship as coordinated batch when warranted.
- **uikit-dev cross-team debt** — their `1deb90e` uses defective free-string jq pattern. Tmux-direct relay to Aalto deferred; bundle with Finn Section D questions.
- **MS Teams integration** (#57) + **Anthropic `/routines`** (#58) — ecosystem-integration bundle.
- **Timestamping convention** — promote to T03 + investigate cheaper implementation (auto-injection vs cached timestamp).
- **Team-lead prompt revision** — Celes design round (coordinator-only-by-conviction identity makes mechanical fix unsafe).
- **12-prompt broader scope-block audit** — Celes offered ~1h pass; not started.
- **Finn model inventory re-survey** (uikit-dev missing from baseline).
- **Celes assessment of Cal's first-day performance** (carried).

## CARRYOVERS

[DECISION] **Bioforge-dev team:** 4-character Cathedral-lite — Humboldt (TL/opus), Merian (RED/sonnet), Linnaeus (GREEN/sonnet), Cuvier (PURPLE/opus). Designed by Celes.
[DECISION] **"Cathedral-lite"** = Cathedral tier with ARCHITECT merged into team-lead. Valid for single-repo, single-language, single-pipeline projects.

## SESSION HISTORY (compressed)

**2026-04-30 (session 21):** #62 from apex-research/Schliemann assessed by Volta, patched, committed (`426194d`). startup.md Steps 2-4 collapse to single `TeamDelete + TeamCreate + verify`; new shutdown S5 `TeamDelete()` after `git push`. Gotcha #4 added (in-memory state survives `/clear`). Cross-team comment on #62 (`issuecomment-4350394024`) with FR-side n=2 confirmation. Wiki candidate held for Cal: "in-memory state survives `/clear`" (n=2 apex+FR). T06 amendment (lines 528 + 1025) batched with existing path-tree-rewrite chore. This shutdown is first to use new S5 — dogfooding the patch.

**2026-04-29 (session 20):** #61 validation passed empirically (Cal). Tunnel persistence work in apex-migration-research repo (3 commits + 1 PR-merge): supervisor-of-supervisor loop (`183de33`), wscript hidden launcher (`8edc230`), Chromium runtime deps Dockerfile bake (`9ddfb10`), operator env-var PR #115 merged (`049f766e`). RC clone fresh-cloned (Brunel triage). Apex-research comparative analysis (Finn) → `docs/apex-research-comparison-2026-04-29.md`. Wiki 45→50: #46 windows-bridge (5→6 amend), #47 cross-msys-argv, #48 dual-track, #49 ai-teams-sudo, #50 wiki-cross-link-convention (first cross-pollination filing). Cross-team link form policy adopted. 4 single-entry frontmatter experiments active under Cal.

**2026-04-24 (session 19):** #60 + #61 closed, xireactor dropped. #60 retired tmux-pane spawn (Herald `agent-spawn-protocol.md` v2.0.0 + Brunel cross-repo gating). #61 moved `.claude/teams/` → `teams/` (commit `7e72771`, 258 files). Wiki #45→#47: warp-dns-vs-routing-asymmetry-rc-host (#46), rc-host-db-tunnel-architecture (#47, first `references/` entry). Cross-team unblock: apex-research DB tunnel via reverse SSH from Windows operator (script `c79b838` in apex repo).

**2026-04-15 late-eve:** Xireactor pilot design pass. 4 agents (Brunel+Monte+Herald+Cal). 4 design docs shipped. Three-specialist convergence on asymmetric cross-tenant-only shape. Wiki 43→45 (#44 integration-not-relay at n=6+, #45 substrate-invariant-mismatch at n=3). Protocol D naming accepted. Frozen design state at `memory/xireactor-pilot-design-state-2026-04-15.md`.

**2026-04-15 afternoon:** Ruth-team genesis. Brunel v1.0 accepted. #57+#58 filed. Sensitivity boundary adopted. Ruth relay sent via Teams. Key LEARNEDs: thin-digital-footprint ≠ low-output, implicit-cross-team-contracts, sensitivity-boundary-via-gitignore.

**2026-04-14 eve + 2026-04-15 morning:** Jira/GitFlow assessment. Wiki 38→39 (#39 scope-block-drift). dev-toolkit#43 issue filed. Finn+Brunel prompts fixed by Celes. Team-lead prompt revision deferred.

**2026-04-14 midday:** Cleanup + Volta audit + Finn uikit-dev harvest. Wiki 37→38. Persist-coverage F/D split. [WARNING] team-lead coordinator-only discipline slipped pre-spawn — spawn-before-act even for cheap one-offs.

**2026-04-13 afternoon:** Oracle→Librarian Phase 1+2. Wiki 20→28. Commits `04522c7`+`ca0e56f`. Eratosthenes v2.7.1 live on apex-research. Phase 2 directive tmux-direct to Schliemann.

**Prior (2026-04-09 through 2026-04-10):** Cal bootstrap, raamatukoi-dev designed+deployed, bioforge-dev Cathedral-lite roster, Discussion #56 (wiki 4→20).

## SCRATCHPAD HYGIENE (adopted 2026-04-16 on Cal's advisory)

1. **Active vs frozen:** frozen design state → sibling archive files; scratchpad = active state only.
2. **Strike-through vN-1:** when specialist ships vN, strike prior vN-1 refs in-place rather than appending both.
3. **Wiki-candidate routing collapses sources:** when sending candidate to Cal at n=X, collapse source instances in scratchpad in same batch.
4. **[DECISION] vs [LEARNED] retention:** DECISIONs stay (standing rules). LEARNEDs collapse after wiki promotion.
5. **CHOREs top-of-file:** all NEXT-SESSION-CHOREs in dedicated block under NEXT SESSION, not buried inline.
6. **Tree-form tags, not session-log prose:** `[TAG] claim + why + applies-to-future`, not "and then we did X."
7. **2-session staleness check on n=1 wiki candidates:** if LEARNED hasn't reached promotion in 2 sessions, re-evaluate pattern reality.
