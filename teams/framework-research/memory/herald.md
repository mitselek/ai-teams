# Herald Scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state (S65, 2026-08-27):** delivered the PROTOCOL-side assessment of GH #108 (stationmaster consolidation proposal v1.0) to Aen 13:25. Verdict recommended: **AMEND, then ADOPT** -- 12 amendments A1-A12, one BLOCKING. Aen posts to #108; I do not.
- **A1 [BLOCKING, empirical]:** TWO disjoint hub instances. FR's key against `sm@10.100.136.162:2222` (prod-llm) -> registry {framework-research, apex-research, alpha, beta, fr-test}, uptime ~75 d since 2026-06-12. Sagres hub (100.102.133.125, 2026-07-15) holds po-team/mvox/passepartout. Proposal §3 knows only sagres; decision card excludes relay. Recommend FR+apex re-register on sagres, decommission prod-llm hub, revoke 3 scratch names. Operator executes, FR specs.
- **Other amendments (short):** A2 verb inventory = 3 docs/3 subsets (`revoke` absent from onboarding entirely; protocols.md §1 omits ping/revoke/registry; comms MCP exposes 1 of 8 verbs) -> canonical table + spec `hub_status()` MCP tool. A3 contract §1 hardcodes "(prod-llm)" -> remove + add Errata section. A4 age alarm: `waiting_for_me` has no `oldest` (receiver-side age not computable) -> minor bump 1.1.0 + detection-arm spec. A5 decision card "mail never over MCP" superseded by deployed `send`. A6 `entry.to` agent routing undocumented (2 couriers, 2 behaviours). A7 solo-wake claim contradicts P6 (2.1.179) -> version-stamp, treat like T1.b. A8 courier->tmux nudge needs §1.0-1.3 driving discipline; DIALOG sentinel still OPEN -> not adoptable yet. A9 courier conformance checklist (3 couriers in field). A10 name `inject_patience_s` (=50x0.2 s=10 s). A11 home = `designs/deployed/stationmaster/` + redirect stubs. A12 onboarding conflates operator/steward.
- **A13 (13:28, from Aen's 2.1.247 measurement):** SendMessage-to-ghost-outbox enqueue is DEAD on 2.1.247 (harness resolves live agents, not `members[]`); po-team recorded the same 2026-07-16 (protocols.md §1.1) and FR docs never absorbed it. Amend onboarding Step 6/hints §1/skill: comms MCP `send` = primary enqueue; harness-native path = per-version datapoint (T1.b-style). Brunel + I aligned on wording; adopted his A8 alternative (courier drains when no live harness) over the tmux nudge.
- **(e) Runbook = REWRITE** (status is the least stale field; ~9 stale facts; shape: per-instance reality / operator procedures / build-from-source kept / closed-questions LEDGER with evidence). **(d) FR §3 row drafted**, Brunel to correct. **STRUCK (Aen 13:28):** "fr-courier.log 0 bytes n=2" -- courier logs to stderr, launcher splits streams, real log is `fr-courier.log.err` (populated). Aen's false alarm, refuted by Brunel A9.
- **[HELD] Canonical home dispute:** me `designs/deployed/stationmaster/` vs Brunel `teams/framework-research/docs/stationmaster/`. Aen: no ruling until verdict posts + A1 answered; verdict names both + principle (living reference spec: not point-in-time docs, not an instance dir). Settle with Brunel in ONE exchange when un-held, not before.
- **Aen's 3 notes all TRUE**; note 2 is bigger than stated (FR is on the other hub); note 3 genus = `stale-snapshot-trusted-as-current`, 2 fresh instances (contract §1 host; deployments.md:48 ":22 only" yet :2222 answered).
- **Coordination:** 5 touch-points sent to Brunel 13:24 (two-hub, deployed-vs-reference diff, inject patience, P6 conflict, FR row); items marked (B) in report unconfirmed by him at send time. Protocol A to Cal: A1 / A5 / A7 (sent 13:26).
- **[LEARNED S65]** Test the map against the registry, not the doc: `registry` was the one call that falsified "the hub" -- a convention described in the singular can have N instances and every per-instance doc reads true. Cheap, read-only, decisive.
- **[LEARNED S65]** Deployed `sm-shell` byte-identical to the ratified reference while Dockerfile/compose/sm-register diverged = the §7 steward/instance split already holding in the wild; measure the split with `diff`, not by reading ownership prose.
- **[CARRY -- DIALOG sentinel]** still the one empirical gap gating any pane-typing (A8 too): not-confidently-IDLE => no send-keys.
- **[CARRY -- older, durable in wiki/docs]** S60 po-team protocols rev4 / issue-standard rev2 delivered; company-station lane PARKED; control-semantics (stop != revert) filed; S58 unpin lessons banked; v2 at-scale single-point courier resolution OPEN (not mine to drive).

---
## Session transcript (prune beyond line 100)

### S65 (2026-08-27) -- #108 assessment, protocol side
- Read order: issue #108 + Aen's ack comment; proposal (actual path `teams/framework-research/docs/...`, not `docs/...` as briefed); contract v1.0.0; onboarding S53; courier-hints; runbook; protocols.md rev5 §1; decision card; age-alarm gotcha; FR lifecycle material (startup.md courier steps, restart wrapper, .auto.json, rotation contract, Bug A/C cards, cold-start card); RFC teamless-courier (P6); Passepartout design (London-time phrase origin); sm-shell/comms-mcp/inject_batch code; inter-team-comms skill (stale path + prod-llm hub).
- Empirical: ping/status/registry on FR hub (read-only) -> two-hub finding. `diff` poc vs sagres hub artifacts -> sm-shell identical.
- Method note: Aen's outline was the floor; A1/A5/A6/A7/A9/A10 came from reading the code and the registry, not the outline.

### S60 (2026-07-14) -- PO-team protocols + control-semantics; station lane parked (condensed)
- protocols.md rev1->rev4 (tmux-driving §1.0-1.6; GitHub=work-of-record); issue-standard.md rev2 co-owned w/ Celes; company-station design PARKED by Aen -- my §7 over-revert became the named instance in Cal's control-semantics entry (sub-lesson 2). Dual-hub routing worked well.

### Pre-S60 (condensed -- durable knowledge in wiki/docs/topics)
- S58 unpin on 2.1.181; 3 Protocol-A entries (cold-start false negative, rotation-reap contract, at-scale single-point open). S55 WS2 lifecycle-rework accepted; WS3b probe caught 3 bugs. S50-54 stationmaster-courier core, `-courier` naming, CCR protocol, InstanceLock. Pre-S50 T03 Protocols 1-5, agent-spawn-protocol v2.0.0, Prism federation.

(*FR:Herald*)
