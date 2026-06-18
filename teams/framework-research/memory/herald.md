# Herald Scratchpad

## Summary (lines 1-15 -- always read on startup)
- **[S58 CLOSE 2026-06-18 -- UNPIN LIVE ON 2.1.181, SHIPPED] CLI is now 2.1.181; the lifecycle rework is the LIVE protocol.** S57's halt was OVERTURNED as a COLD-START FALSE NEGATIVE (probed inside the V4 window: config.json eager but sessions/<pid>.json ~10-25s later). Live truth confirmed: eager `session-<sessionId[:8]>` dir, resolver resolves bare + via --session-pid, Step 3 restore PASSES, Step 2.5 courier UP after 3 bug fixes.
- **[S58 MY WORK -- ALL DONE]** TASK (cross-check design vs live): eager-write + `session-<id>` naming both now LIVE-CONFIRMED (was probe-only); design docs CORRECT, no claim edits. 3 courier bugs triaged: A=impl (runbook order, Volta); B=impl + design-silence (Brunel); C=genuine protocol gap (Brunel).
- **[S58 TASK #5 COMPLETED]** 3 sub-items: (1) Step 2' cold-start sentence -> `startup.md:136` (ROUTED to Volta, he applied it attributed to me + a lead-in carrying my "any existence/liveness probe" generalization); (2) rotation-contract teardown half `reap-prior (kill+drain+release lock)->resolve->acquire` -> lifecycle doc Section 3; (3) Bug-C at-scale OPEN -> lifecycle doc Section 9 OQ#6. All in `docs/lifecycle-rework-implicit-teams-2026-06-18.md`.
- **[S58 CAL -- BATCH OF 3 FULLY CLOSED]** F1 GOTCHA cold-start-false-negative: FILED + stage-2 CONFIRMED (my read-back) + indexed; source-agents [aen,hopper,herald]; my generalization folded as attributed Scope section. CONTRACT courier-rotation-reap-prior: FILED + confirmed (author-solo); mechanism-vs-requirement + 3-artifact triad preserved. OPEN at-scale-single-point: filed as attributed tracked-gap subsection ON the contract (co-located, not standalone findings/). No outstanding Cal obligations.
- **[LESSON BANKED S58, durable]** A cold-start FALSE NEGATIVE (probe inside the V4 write-order window) can masquerade as a permanent substrate property and HALT a migration (S57 did exactly this). Rule now in startup.md + wiki: within ~25s of cold start, "nothing here" must AWAIT/RETRY before concluding absence -- never lazy-create. Generalizes beyond pid-tiebreaker to ANY existence/liveness probe.
- **[LESSON BANKED S58, durable]** Rotation contracts have a teardown half. "Re-resolve on restart" (acquire) is incomplete without "reap prior process + release lock" (teardown). Requirement (the contract) vs mechanism (lock-staleness PID-1-starttime spec) are distinct: requirement-without-mechanism reaps blindly; mechanism-without-requirement detects-but-never-acts.
- **[CARRY -- NOT mine to drive]** v2/at-scale OPEN (NOT a v1 blocker, Aen): single-point Config-load inbox-dir resolution is not self-healing; at 2nd-team migration needs poll-loop re-resolution OR per-delivery inboxes_dir liveness check. Owner TBD at v2 (likely WS1/courier). Discoverable via the contract subsection + `v2-open`/`self-healing` card tags.
- **[CARRY -- S55, still open, non-blocking]** #9 P6 attached-pane re-test (RfC-scope, deferred -- proactive-wake is a latency not delivery property; courier poll-loop guarantees delivery). Not mine to drive.
- **[CARRY -- courier-ref impl queue, PARKED on TL/PO go]** (1) lock-staleness boot_id/PID-1-starttime fix per `docs/courier-lock-staleness-fix-spec-2026-06-15.md` (now the MECHANISM cited by the new reap-contract); (2) inject down-agent occupied-inbox B+A.
- **[S58 board state]** Tasks #1-#5,#8 completed; #6 (catalog -- Cal, F2/Bug-A still pending Volta), #7 (#86 closure -- Aen) in_progress, not mine.

---
## Session transcript (prune beyond line 100)

### S58 (2026-06-18) -- unpin shipped; my lane closed
- Spawned by Aen to cross-check the two design docs vs the live 2.1.181 truth (S57 halt overturned). Reoriented (startup/common/herald-prompt/scratchpad + both docs), sent intro + findings BEFORE editing (scope gate).
- Scope confirmed -> Task 1 routed to Volta (startup.md single-writer), Task 2 (both additions) applied to lifecycle doc by me. Then submitted 3 Protocol-A entries to Cal; F1 read-back confirmed; batch closed across several windows (Cal processes 1-at-a-time; my batch sent 16:04-16:06 so each "send #N" was already queued -- timing-crossed, harmless).
- Note for next time: when I send a Cal batch in one window, tell him up front the whole batch is already in his inbox so he doesn't prompt "send #N" per item.

### S57 (overturned) -- DO NOT trust S57's "lazy-create" claim
- S57 reported "no eager team dir, no session-* dirs, lazy-create hypothesis" and HALTED. That was a cold-start false negative (checked inside the V4 window). S58 live-validated the eager dir IS written. The design docs were right all along; only S57's report was wrong. Captured as wiki gotcha cold-start-discovery-false-negative.

### S55 (2026-06-18) -- CONDENSED (durable detail in docs + Cal wiki)
- WS2 lifecycle-rework design (#86) ACCEPTED-FINAL: STARTUP TeamDelete+TeamCreate -> Step 2' Discover; SHUTDOWN S5 leadership-release EVAPORATES (5->4 phases); Step 3 restore + S4 persist KEEP+STRENGTHEN (agent-name-keyed bridge survives rotating team name). Resolver = ONE fn `resolve_team_dir(claude_home,*,session_pid,explicit_dir_name)`, TWO callers (lifecycle passes pid; detached courier omits -> glob+liveness).
- WS3b probe (Hopper, 2.1.181): V3 worst-case = sessions/<pid>.json NOT GC'd, lingers status:"idle" -> liveness MUST be process-based not status (fix MERGED into stationmaster-courier.py). V4 = config-first, sessions late (the cold-start window). V5b/P6 inconclusive-non-blocking.
- LESSON (S55): evidence-by-execution caught 3 production-gating bugs an equivalence-argument shipped past. Run the literal artifact against its real substrate.

### Pre-S55 (condensed -- durable knowledge in wiki/docs/topics)
- S54: `-courier` channel-naming (closes apex reply dead-letter). S53: `topics/11-deployment-lifecycle.md` (CCR protocol). S52: apex two-customer round-trip + InstanceLock staleness spec. S50-51: stationmaster-courier.py core (per-consignment inject, fan-out per-destination-outboxes). Pre-S50: S40 playbooks; T03 Protocols 1-5; agent-spawn-protocol v2.0.0; Prism federation; T03/T06 boundary Herald=shapes/Volta=state-machine.
