# Herald Scratchpad

## Summary (lines 1-15 — always read on startup)
- **Current state:** S50 STILL ACTIVE (Aen 17:28 REVERSED the 17:22 deferral — session-limit interrupt passed, tokens refreshed). Tasks #2 + #6 DONE; #3 (T6.a gate) PASSED. **Task #4 BACK ON this session** — FR production registration + real-ssh round-trip. Sequence: Hopper finishes #7 (final cycle w/ shell fix) → registers FR production key → pings us both → I run the round-trip. HOLDING for hub-live + key-registered ping.
- **Active items:** Hold for Hopper's ping, then execute Task #4 per NEXT-WAKE checklist below.
- **Done S50:** `stationmaster-courier.py` (8/8 unit) + `integration-test.py` (14/14 pre-deploy, transport stubbed). Both Protocol-A subs FILED + stage-2 CONFIRMED via my read-back (Cal 17:08); S50 stationmaster knowledge intake CLOSED on Cal's side.
- **Carry-forward:**
  - **NEXT WAKE (Task #4 — FR production registration, real-ssh end-to-end):** the ONE untested path. Courier runs HERE on Windows/Git-Bash → hints §8 `Path.home()`-not-`$HOME` first field exercise (Aen watch-point). Need: Hopper does real `sm-register` for framework-research (operator, per onboarding doc — pubkey + `restrict,command="sm-shell framework-research"`); hub addr `sm@<prod-llm>` with `-p 2222`; courier config → ssh_key at FR key, ssh_opts `["-p","2222"]`. Run: ping → deposit (incl duplicate) → collect+ack two-phase → E_NOGRANT → grant→accepted → full round-trip w/ real local inject+ledger; capture + version-stamp evidence. Operator side: Brunel's runbook `docs/stationmaster-hub-deployment-runbook.md`.
  - **[DEFERRED — PO ratification]** Ghost-outbox fan-out routing amendment candidate — full write-up below (do NOT prune). Aen surfaces at PO return; also tracked in Cal's scratchpad. Do NOT edit ratified docs.
  - WARNING: CLI 2.1.170→2.1.175 substrate shift — courier-hints S2 facts (S1/S3 ghost-outbox accumulation + live-inbox drain) need re-validation before production reliance.
  - NOTE: Task #1 description text says `grant_receive/revoke_receive`; Brunel's sm-shell correctly uses `grant`/`revoke` (§5.5). Cosmetic dead-task-text drift only.

---
## 2026-06-12 (session #50 — stationmaster courier + integration; Tasks #2, #6)

[CHECKPOINT] **Task #2 — `stationmaster-courier.py` shipped** (single file, stdlib only, 8/8 tests). Outbound: poll-by-content → parse-before-consume → atomic-rename-to-spool → deposit → delete-on-accepted/duplicate (hints S3, FIFO). Inbound: collect → ledger-check → inject-via-verify-empty/rename-aside/exclusive-create (hints S4) → ledger-append → ack-all (hints S6). Custody transfer: ack only after durable inject (protocol S5.4). Inject-before-ledger ordering (hints S6 row 4 — at-least-once, dup-not-loss). Anti-spoof attribution from envelope `from_team` → `<from_team>-ghost`, body verbatim (protocol S4). Single-instance lock (exclusive-create + PID staleness, hints S7). Same-volume startup gate (hints S3).

[CHECKPOINT] **Task #6 — `integration-test.py`, 14/14 pass.** Real courier loop ⇄ real Brunel `sm-shell` (`sm-shell <team>` on stdin/stdout, shared SM_STATE_DIR), only ssh/Docker hop stubbed. Covers all #6 items + courier-side disciplines Brunel's smoke-test.sh can't reach (consume-by-rename, inject-by-exclusive-create, anti-spoof, ledger dedup + crash-survival). Aen ACCEPTED as the courier-logic layer; deployed-hub-over-real-ssh verify lives in Task #4 (the honest record-fix, option B, #6 retitled "Pre-deploy ... transport stubbed").

[LEARNED] **Three orthogonal test layers, no overlap/gap:** (1) courier-logic = my integration-test.py (stubs ssh); (2) ssh-transport = Brunel's smoke-test.sh over real ssh; (3) inbox-injection race = T6.a harness (Task #3, operator). A `completed` flag must never claim more than its evidence (Aen: same discipline as the wiki stage-2 gate).

[DECISION] **Per-consignment inject (1 entry per inject_batch), NOT batch-of-collect** — keeps delivered-ledger 1:1 with hub envelope `id` (the dedup key); crash mid-loop re-delivers exactly the un-ledgered ids.

[DECISION] **Partial-deposit handling:** on a multi-entry spool file where some consignments are `rejected` (per-consignment, protocol S5.2), rewrite spool to retain ONLY non-accepted entries (courier-private → in-place atomic-replace OK, hints S3.5); retry. Never drop on own initiative (hints S7: no TTL).

[LEARNED] **Two Protocol-A patterns filed + stage-2 confirmed (Cal 17:08):** `patterns/same-volume-startup-gate-for-rename-atomicity.md` (operation-side; sibling to Hopper's verification-side `per-filesystem-gate-targets-tmp-measures-wrong-fs`) and `gotchas/courier-originates-routing-protocol-leaves-undefined.md` (Cal's sharpening: `from_team` is hub-sourced from the authenticated channel, but `to` has NO hub-side source → why the routing gap is asymmetric).

### [DEFERRED — PO ratification] Amendment candidate: ghost-outbox → destination-team routing (fan-out case)

**Disposition (Aen 16:49):** v1 courier handling stands as a DOCUMENTED CONVENTION (courier scope, no protocol change). Fan-out/multi-destination is a PROTOCOL AMENDMENT CANDIDATE requiring PO ratification — PO away, queues. Write-up is intentionally NON-prescriptive (options, none recommended-as-decided).

**Problem.** Consignment is `{"to": <team>, "entry": {...verbatim harness inbox entry...}}` (protocol §4); hub routes by `to`. But a harness inbox entry carries NO destination field, and a ghost outbox (`inboxes/<name>.json`, session-less slot agents SendMessage to) is generic. So the courier must supply `to` from somewhere OTHER than the entry — the ratified docs never say where. The one place a courier MUST originate routing the protocol doesn't define. (§4 verbatim-forward actively prevents routing-in-payload while the hub requires `to`.)

**Two cases v1 covers (the documented convention):** (1) single configured ghost outbox → its one destination; (2) `<team>-bridge` name → strip `-bridge` → `<team>` (hub's §1 example `hr-devs-bridge`).

**Undefined case:** one outbox fanning out to MULTIPLE teams — nothing disambiguates per-entry destination. v1 courier returns None, refuses-to-guess (retained in spool, logged, never dropped — hints §7 no-TTL).

**Possible resolutions (NOT ranked, for PO):**
- (A) **Per-destination outboxes only** (codify convention 2). Fan-out = N outboxes. Zero protocol change; cost to sender. Simplest.
- (B) **Routing sidecar / local entry-envelope** — sender wraps `{"to","entry"}` at the local ghost-outbox level, mirroring the consignment shape; entry stays verbatim on the wire. Adds a local-format contract; arguably courier-hints scope, not wire-protocol.
- (C) **Leave undefined** — single-destination + naming convention is the supported v1 surface; fan-out out of scope until a real consumer needs it (YAGNI). Refuse-and-retain is correct for an unsupported config.

**Boundary note for PO:** (A) and (C) need NO wire-protocol change (courier-hints convention only); only (B) touches a contract surface, and even then it's the LOCAL outbox format, not the hub wire envelope. The "amendment" may resolve as a courier-hints clarification rather than a protocol §4 change — that classification is itself a PO call.

---
## Pre-S50 (condensed — durable knowledge promoted to wiki / docs / topic files)

- **S40 (issue #71):** extracted 4 procedural recipes from common-prompt into `playbooks/` (verify-structural-change, version-typed-contract, relay-fidelity, shutdown-agent). Extract=procedure, keep=behavioral-contract.
- **S39 (Team OS protocol-lens):** 14 transferable mechanisms delivered to Aen. Their adoption-first design vs FR's rigor-first; "skill-as-protocol-contract" + three-tier-context-loading-as-flow-control as named candidates.
- **S35 (Cloudflare pilot comms):** DO-as-per-recipient-mailbox primitive; `idFromName` identity + KV roster; retain FR SendMessage envelope (envelope IS framework-state, not substrate); Sub-shape E n=3 at comms layer. Design at `designs/new/cloudflare-pilot/comms.md`.
- **S26-27 (Prism federation Phase A+B):** 11 PRs merged (Phase A) + PR #12 (federation-authority-record v0.1.1) + PR #13 (02 §4 R9-rule, SemVer-MAJOR v2.0.0). Symmetric-envelope-mode-by-content-category; strict-SemVer-for-typed-contracts (migration makes the bump SAFE, not minor); discriminator `kind` locked; 8 discipline surfaces dogfooded. Worktree-isolation n=7 cumulative. Substrate inbox-failure asymmetric to worktree presence (Cal filed `worktree-spawn-asymmetry-message-delivery.md`).
- **S59-60 (xireactor + agent-spawn):** xireactor pilot protocol v1.2 (`docs/xireactor-pilot-protocol-2026-04-15.md`); Protocol D canonical-taxonomy slot. `agent-spawn-protocol.md` v2.0.0 — Agent-tool persistent spawn as default, `team_name+name` discriminator; session-lifetime caveat load-bearing. **T03/T06 boundary:** protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when (Herald=shapes, Volta=state machine).
- **Pre-S59:** T03 Protocols 1-5 in `topics/03-communication.md`; T09 dev-methodology (XP message types, three-strike escalation, three Librarian protocols A/B/C); single-provider as protocol-level requirement; Entu API BFF pattern for SvelteKit.
