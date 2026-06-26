# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S59 2026-06-26 **CLOSED**. CLI auto-updated to **2.1.193** (autoupdater ON carried us past 2.1.181); full lifecycle (Step 1/0.5/2'/3/3.5) re-ran and PASSES identically -- 2.1.193 is the new known-good. apex comms link re-validated: round-trip ACK (SEQ=S59-RT-1). Delivered FR methodology review of apex Discussion #176 (contamination recovery) as a GH comment + hub ping. Eval cell (Finn/Medici/Cal) spawned, reported, idle.
- **S59 KEY RESULTS:** Step 2' resolved eager dir `session-30d2d7df` BARE via process-liveness ($PPID=1 still broken-but-moot). Step 3 = 44 inboxes. Step 3.5 courier CLEAN restart (wrapper auto-cleared dead prior courier + stale lock; no manual surgery, unlike S58). apex #176 review: Q1 sound-but-overclaimed / NO detection arm (Finn, 10 failure modes); Q2 playbook + thin pointing-ADR (Cal); Q3 ADAPT (Medici: wiki strong, topics exposed; provenance-coverage-% metric = the keeper).
- **WIKI:** ALL 3 #176 lessons FILED this session (Cal, wiki 157->160): L1 `detection-is-upstream-of-recovery` (stage-2 CONFIRMED, Finn read-back processed); L2 `provenance-coverage-percent-as-knowledge-health-metric`; L3 `authoring-time-prevention-vs-audit-time-detection` (distinction only, NO authoring-rule adoption -- that's a PO call). On-disk consistent (90 patterns==90 cards==index 160; gate 53/2/35). 2 open stage-2 gates carry forward (L2+L3, pending **Medici** read-back -- filed-on-behalf).
- **CARRY-FORWARD (top):** (1) **inbox-inject delivery GAP** -- Cal's live session initially never woke for 3 queued msgs (cleared on a re-nudge, but it's a real gap, not just self-healing friction). Local-Windows, NOT framework-grade, but now load-bearing. (2) inter-team-comms skill STILL stale (pre-S58 static paths). (3) FR PO-calls below. (4) L2+L3 stage-2 read-back pending Medici next session.
- **DEFERRED:** L2/L3 stage-2 read-back -- when Medici next spawns, have him read back the two filed-on-behalf entries to advance pending->confirmed. Bug-C at-scale (v2). Bug-B live-sweep test.

---

### DECIDED DIRECTIONS (S55 FINAL; #4 amended S58; do NOT re-decide -- full S58 text in git history)
1. Target = 2.1.181 floor; autoupdater ENABLED -> may boot above (**2.1.193 now validated S59**). Re-validate further bumps via `designs/new/migration-probe-harness/` only if something breaks.
2. Resolver liveness = PROCESS-based. Live-confirmed S58+S59.
3. Courier rotation = mode-(b) bare restart for v1; `-SessionPid` (mode-a) = v2 multi-team only.
4. Courier config = LAUNCH-OVERRIDE (explicit + `.auto.json`, wrapper default). 2.1.178+ = courier PER-SESSION, wrapper-restarted each session start.
5. V5b/P6 NON-BLOCKING (inbox-restore rides active-session P4 delivery).
6. Env override `FR_COURIER_TEAM_DIR_NAME` (2.1.177-bridge only).
7. Lifecycle (Volta) applied + corrected on main.
8. Constraints (not blockers): bare-liveness valid while FR sole live 2.1.178+ team; session-<id> rotates -> restart re-resolves; many-team host needs disambiguation; Windows $PPID best-effort -> degrades to liveness.

---

### S59 WRAP
- New session boot on 2.1.193 clean -- S58's 3 courier fixes held; no manual lock/orphan surgery this time.
- apex round-trip: registered `apex-research-courier` on the live `session-30d2d7df` config, sent SEQ=S59-RT-1, Schliemann ACK in ~1 min. Inbound auto-inject showed transient "contested inbox" contention (self-heals when session idles) AND a hard delivery gap (Cal never woke for 3 in-inbox msgs). Read apex mail via hub `collect` (non-destructive) when inject lagged -- good fallback to remember.
- #176 review posted: GH comment `discussioncomment-17444549` + hub ping to apex. 10-failure-mode critique left in #176 + Finn's report, NOT duplicated into wiki (PO scope decision).
- CLI 2.1.193 recorded in personal cross-session memory (`project_claude_cli_pinned_2177.md`).

### NEXT-SESSION BOOT (re-orient for S60)
1. Read `startup.md` first -- validated on 2.1.181 AND 2.1.193 (4-phase: Steps 1, 0.5, 2', 3, 3.5, 4).
2. Pull `mitselek-ai-teams`.
3. Boot likely >= 2.1.193 (autoupdater ON). If `claude --version` > 2.1.193, quick lifecycle re-confirm (Step 2'/3/3.5 all ran fine S59; full probe-harness only if something breaks).
4. Model: roster pins `claude-opus-4-8[1m]`. Step 0.5: resolve if parent differs.
5. Cold-start patience: Step 2' may see "no team dir" for ~10-25s after a cold boot (V4 window) -- AWAIT/RETRY, do NOT conclude failure (burned S57).
6. Don't pre-spawn. Wait for PO.
7. **If PO surfaces apex #176 follow-up / spawns Medici:** all 3 lessons are already FILED (S59). The only open thread is the 2 stage-2 read-back gates on L2 + L3 (filed-on-behalf, pending Medici). FIRST OP when Medici spawns: have him read back `provenance-coverage-percent-as-knowledge-health-metric` + `authoring-time-prevention-vs-audit-time-detection` to advance pending->confirmed. Nothing left to file.
8. **If PO surfaces the FR PO-calls (#176 Q3 spillover):** (a) adopt provenance-coverage-% as a knowledge-health dashboard metric? (b) add an authoring-time provenance rule to topic files (our exposed surface -- citation-sparse, no `related:` edges)? Both are genuine PO decisions, not team calls.
9. **If PO surfaces the inter-team-comms skill / cross-team comms:** the SKILL FILE is STILL stale (pre-S58 static `framework-research` paths + the disabled Scheduled Task). Spawn Volta (+ maybe Brunel) to update for 2.1.178+ (`session-<id>` auto-discovery + wrapper courier). TOP un-tasked follow-up.
10. **If PO surfaces inbox-inject reliability:** S59 hit a real delivery gap (Cal never woke for 3 messages that were physically in his inbox.json) plus transient contested-inbox contention. Local-Windows (NOT framework-grade per `feedback_no_windows_substrate_findings`), but now load-bearing enough that a Brunel/Volta look is warranted IF cross-team comms must be reliable on the Windows dev box. Fallback that works TODAY: hub `collect` (non-destructive) reads inbound regardless of inject state.

### Standing watch items going into S60
- **CUT THE CHURN** (`feedback_cut_coordination_churn`): S59 held it -- fast eval, clean filing, no reopening. Keep declaring DONE once the load-bearing thing ships.
- apex link proven (round-trip S59). #176 methodology review delivered; await apex's response to the playbook+ADR / detection-arm recommendations.
- Cal wiki = 160 (S59 +3: detection-is-upstream-of-recovery [confirmed], provenance-coverage-percent-as-knowledge-health-metric, authoring-time-prevention-vs-audit-time-detection). 2 open stage-2 gates (L2+L3, pending Medici read-back).
- Scheduled Task `FrameworkResearch-Courier` = DISABLED (rollback `Enable-ScheduledTask`). Courier is re-established each session by Step 3.5 wrapper restart.

(*FR:Aen*)

---
*Earlier sessions pruned per 100-line discipline. S58 = 2.1.181 validated + 3 courier bugs fixed + #86 closed. S57 = cold-start false-halt. S56 = lifecycle flip + autoupdater ENABLE. S55 = migration design. Full history in git; durable knowledge in `wiki/`.*
