# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 — always read on startup)
- **Current state:** S51 closed 2026-06-15 — **FR courier daemon went LIVE** (full FR-side inbox↔hub automation, the milestone). Stationmaster doc set FINAL, ghost-bridge v2 decommissioned, wiki 132→141. Daemon was drained+stopped at shutdown (it is SESSION-SCOPED — does NOT survive across sessions; restart it next session).
- **Active items:** **apex-team container hardening (Task #5) = S52 LEAD ITEM** — designed, PO-approved, HARD-GATED. apex standing-watch (Task #2) open.
- **Key decisions S51:** shipped session-scoped FR courier daemon; routing CR-4-compliant (`apex-research-bridge`); fan-out candidate A ratified normative v1; §4 `text`-field clarifying errata; stop-script hardened (stop→drain-once→verify).
- **Carry-forward:** [DEFERRED] apex hardening EXEC (needs PO go + confirmed route + window + apex online); GitHub retention-flip issue (PO go pending); A1 audit overdue (since S44); hr-devs as possible 3rd stationmaster customer.

---

### [NEXT SESSION] 2026-06-15 — S51 → S52

**M1 seed (5 bullets; downgrade tag to `[PROCESSED YYYY-MM-DD]` on first S52 read):**
- **State of play:** S51 was the FR-courier-daemon build+go-live day. Daemon LIVE at close (pid 3300, but that pid is dead now — session-scoped, stopped at shutdown). Artifacts in `poc/ghost-bridge/`: `fr-courier-daemon.py` (wraps Herald's `stationmaster-courier.py` verbatim; per-agent inbox routing via `entry.to` + 3 guards; ledger dedup = v2 leak designed out; drain-on-shutdown), `start-fr-courier.ps1` / `stop-fr-courier.ps1` (stop = hard-kill→wait→`--drain-once`→verify; verified clean), `fr-courier.config.example.json` (real `fr-courier.config.json` is gitignored, host-specific). Hub: `sm@10.100.136.162 -p 2222`, key `~/.ssh/sm_framework-research`.
- **APEX (S52 LEAD ITEM):** PO directed S52 to focus on apex-team container hardening (Task #5) right at start. Plan: `docs/apex-container-hardening-plan-2026-06-15.md` (supervisor in entrypoint + build-time courier key, approach b). apex state at S51 close: **agent session DOWN, container UP** (quiescent = the right state for the rebuild). Hard-gated — do NOT restart apex's container without all gates (see BOOT item 4).
- **Substrate:** CLI **2.1.177** at S51 (was 2.1.175). TRUTHS.md stamped 2.1.170 — version-coupled inbox/courier facts need re-validation if version changes again. Hub survived the bump (state on volume).
- **Routing fix learned:** outbox name must equal `<registered-team>-bridge` → strips to the registered team. `apex-bridge`→`apex` was an E_UNKNOWN_TEAM trap (registered team is `apex-research`); fixed to `apex-research-bridge`. Spool re-resolves routing at deposit-time from current config → a config-fix+restart self-heals stuck mail (filed as wiki pattern).
- **Carry:** GitHub retention-flip issue (PO go pending); A1 audit overdue; hr-devs 3rd-customer invite; phantom-brunel; ELEX human ask; fan-out B/C kept as fallbacks if a real consumer needs single-outbox fan-out.

### NEXT-SESSION BOOT (re-orient instructions for S52)

1. Read `startup.md` first (always). Steps 1–5 (Sync → Reset team state → Restore inboxes → wait for PO before spawning). Pull `mitselek-ai-teams`.
2. **Don't pre-spawn at session start** — BUT the PO pre-declared S52's FIRST focus = apex-team hardening, so expect to spawn Brunel + Hopper early on PO confirmation.
3. **Restart the FR courier daemon early** (it is session-scoped; it died at S51 shutdown). After sync: `cd poc/ghost-bridge && ./start-fr-courier.ps1`; confirm live pid + clean banner + NO "reclaiming stale lock" WARN. It will collect any inbound queued on the hub (incl. anything apex sent). Re-zero spawn-target inboxes per I-1 before spawning agents.
4. **APEX HARDENING (Task #5) — the lead.** Spawn Brunel (design owner) + Hopper (operator). Plan = `docs/apex-container-hardening-plan-2026-06-15.md`. Execution HARD GATES, ALL required: (a) **host-side docker-exec route confirmed** — Hopper read-only probe FIRST (ssh to `rc` host → `docker ps`, NO container touch) since apex tailnet is logged out (100.96.54.170 stale; container 10.200.13.114); (b) **PO explicit restart go** (above team-lead go — Mihkel set this hard gate S51); (c) coordinated window; (d) apex session can stay DOWN during rebuild (quiescent), bring up AFTER to re-verify round-trip.
5. **If the route probe FAILS** (no host-side path, tailnet down): surface to PO — apex must re-login tailscale OR provide host access before hardening can run. Don't proceed without a confirmed route.
6. **If apex comes back online** and sends traffic: the restarted FR daemon auto-collects within ~30s; spawn Herald to handle + relay any drain-on-delivery datapoint (their CLI 2.1.173) to Cal for TRUTHS.md.
7. **If PO gives go on GitHub retention-flip:** draft from TRUTHS.md I-1 + probe-1b + version bracket; PO reviews before filing.

### Standing watch items going into session 52

- **apex hardening preconditions** (route / PO go / window / apex-online) — the lead; nothing executes until all hold.
- **FR daemon is session-scoped** — must be restarted every session start; dies at shutdown. Not a persistent service (FR has no always-on host; Windows dev box).
- **Hub health on prod-llm** (`restart: unless-stopped`) — ping-check via `ssh -i ~/.ssh/sm_framework-research -T -p 2222 sm@10.100.136.162` if relying on it.
- **CLI 2.1.177** — re-validate inbox-substrate claims if version changes (courier S2/S3 facts are version-coupled).
- **2 wiki entries stage-2-pending** — `artifact-claims-more-than-it-implements` + `spool-stores-raw-entry-reresolve-on-deposit` need Herald/Hopper co-author read-backs next session to fully advance the gate (Cal carries). Also `artifact-claims...` is an n=3 Protocol-C watch-candidate (common-prompt honesty-pass discipline if it recurs/4th lands).
- **Open design-review seam (n=1):** `contracts/registered-two-meanings` — registry populate-at-register-vs-first-connect, "v1-defensible, decide in v2".
- **Unchanged carries:** GitHub retention-flip (PO go), A1 audit overdue, hr-devs 3rd-customer invite, phantom-brunel, ELEX, Entu #42.

(*FR:Aen*)

---

## SESSION 51 WRAP — 2026-06-15 (FR courier daemon LIVE; stationmaster docs FINAL; v2 decommissioned)

- [MILESTONE] **FR-side inbox↔hub automation LIVE** — built session-scoped courier daemon (Brunel), routing fixed (Hopper restart), v2 leak designed out + verified (ledger dedup; no 4x/8x bursts). Closes the "no daemon reading/writing our inboxes" gap the PO opened the session with.
- [DECISION — Aen] Stay on Opus 4.8 this session (roster pins fable-5; accepted deviation; specialists inherited opus-4-8).
- [DECISION — Aen] Fan-out CR-4 → **candidate A ratified normative v1** (per-destination outboxes, `<team>-bridge`→`<team>`; single-outbox multi-dest out-of-scope/refuse-and-retain until a real consumer forces B). PO-ratified.
- [DECISION — Aen] CR-7 → `text` is the renderable-body field, **pinned at protocol §4 as clarifying errata** (no major bump; SendMessage-origin already complies). Sender-side fix; couriers must not remap (verbatim-forward §4). PO-ratified.
- [DECISION — Aen] Routing fix = **rename** (option A) not alias-map (option B) — CR-4 convention purity over speculative indirection (same YAGNI as fan-out). `apex-bridge`→`apex-research-bridge`.
- [DECISION — Aen] apex container hardening: approach **(b) build-time key only** (interim relocate declined), **FR executes**, HARD-GATED on PO go + route + window + apex-online. Plan written + approved (design-only).
- [DECISION — Aen] Stop-script hardened: declined fragile Windows CTRL_BREAK; adopted portable **stop→drain-once→verify** composition. Hopper empirically proved Stop-Process=hard-kill doesn't drain → his controlled-probe correction superseded Brunel's artifact-inference (substrate-truth wins).
- [LEARNED] **Empirical-probe-beats-artifact-inference** + **artifact-claims-more-than-it-implements** (n=3 this session: over-generous TESTED tag, CTRL_BREAK header, unqualified drain claim) — both filed to wiki (patterns). Reinforces S50 completed-flag=evidence.
- [LEARNED] **Single-decider-for-mechanism pins the invariant** — the migrate-vs-drop thrash (me↔Herald flip-flop) was the only real risk; resolved by naming Brunel sole decider + fixing the invariant (one clean copy). apex-Q self-healed via spool re-resolve (moot debate).
- [WIP→done] Wiki 132→141 (Cal filed 8–9 S51 entries: CR-7 contract, deposit-no-data-line gotcha, drain-2.1.173 ref, cf-access-sso gotcha, fan-out-A + §4-errata decisions, v2-dupe gotcha, spool-reresolve + artifact-claims patterns).
- [WIP→carry] apex-Q (FR-S51-WINDOWPREP) shipped exactly once, queued on hub for apex-research (waits for apex's next session to collect).
- Commits: e9207b2→... 9982ff2 (daemon+docs+decommission), 0d3fcb1 (routing+wiki+plan), 0a64a1f (state), 10e60a3 (stop-script+honesty+batch), + S51-close commit.

---
*Earlier sessions (S50 and prior): pruned 2026-06-15 per the 100-line discipline. Full history in git; durable knowledge promoted to `wiki/`.*
