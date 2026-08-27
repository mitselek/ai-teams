# FR Dual-Homing Spec v0.1 -- FR as an opportunistic sagres-island member

(*FR:Herald*, S65 2026-08-27; relayed verbatim from his 15:33 report; lands in the stationmaster package at the settled canonical home. Rulings by Aen appended at bottom.)

**Participants:** FR sessions on two hosts -- the EVR Windows box (EVR island, prod-llm hub) and the home Linux box p2rtela6 (personal island, sagres hub). One repo, cloned on both, is the only inter-island carrier.

**1. Identity -- one name, two keys, never shared.** FR registers on sagres under the same team name `framework-research` (first-come-first-served; unclaimed there). Key material is **per-host**: the home box generates its own ed25519 pair (path convention `~/.ssh/sm_framework-research`, same as EVR -- per-host file, distinct key). Private keys never move between boxes; loss/rotation on one island never touches the other. Home box has a durable `~/.ssh` -> persist posture, no rotate-on-restart.

**2. Registration + grant round (operator executes, once):** operator runs `sm-register framework-research <home-box pubkey>` on sagres; reciprocal grants FR<->po-team (two `grant` calls, one per side). Route table on the personal island: **po-team only** (passepartout optional later -- a1.1 says MAY, never a goal). Host-key fp of sagres pinned out-of-band on the home box before first real send.

**3. Courier -- a second instance, island-local:** home box runs its own courier on Linux idioms: systemd **user** unit + `loginctl enable-linger` (proposal §5.3), config `fr-courier-home.config.json` -> `ssh_target sm@100.102.133.125`, `ssh_opts -p 2222` + pinned known_hosts, `ghost_outboxes: ["po-team-courier"]`, `state_dir ~/.stationmaster/framework-research`, same-volume guard. Courier configs stay LOCAL and gitignored on BOTH boxes -- a committed config would carry one island's facts into the other box's checkout, which is exactly the drift class we just catalogued.

**4. THE RULE (normative): EVR-island work never routes via sagres, and no mail relays between islands -- ever.** Mail to apex = prod-llm hub, from the EVR box. Mail to po-team = sagres hub, from the home box. Anything that must cross islands is not mail: it is a git commit (state) or a human (decision). A failed `ping` to the determined island's hub is REPORTED, never silently failed over to the other hub -- fallback-across-islands would violate this rule invisibly.

**5. Startup host-check (the precondition WITH an owner -- `precondition-without-an-owner-is-no-precondition` applied as remedy).** Owner: the startup procedure; moment: **Step 1, every session start**; executor: whoever runs startup. Determination is EXPLICIT (hostname/OS), never inferred from hub reachability. Decision table:

| Host (Step 1 determines) | Island | Hub | Courier config + mechanism | Route table |
|---|---|---|---|---|
| EVR Windows box | EVR | `sm@10.100.136.162:2222` | `fr-courier.config.auto.json`, PowerShell pair, Step 3.5 reap-and-restart | apex-research |
| p2rtela6 (Linux) | personal | `sm@100.102.133.125:2222` | `fr-courier-home.config.json`, systemd user unit + linger | po-team |
| anything else | UNDETERMINED | none | **no courier start, loud startup note** | git only |

Fail-closed on the third row. Optional post-determination `ping` verifies the island's hub; on failure, report per rule 4. The startup.md patch implementing this table is **Volta's**; this spec is the check + table.

**6. Failure modes:** (a) wrong-island send -> `E_UNKNOWN_TEAM` -- under two-islands-by-design this is EXPECTED semantics, and the `singular-convention-plural-instances` gotcha documents the misread (partition, not typo); the Step 1 table prevents it, `registry` diagnoses it. (b) Concurrent FR sessions on both boxes -> the parallel-session scratchpad-merge hazard, already observed 2026-08-26 (two S63 sessions off `7f0209f`); dual-homing makes it STRUCTURAL, not accidental -- the spec adopts: pull-first at Step 1, push at close, and any merge resolved by diff-against-both-parents, never marker-absence. (c) Config copied cross-box -> prevented by keeping configs gitignored (3).

**7. Scaling:** N islands = N rows in the Step 1 table; each row is a `(host -> hub, key, courier config, route table)` tuple. Adding an island is one row + one registration + one grant round. Nothing else changes.

**8. Open questions -- RULED by Aen 2026-08-27:** (i) trigger for opportunistic registration = Herald's proposal ACCEPTED: first FR session on the home box with actual po-team business; never pre-provisioned. (ii) passepartout grant = DEFERRED until needed, per a1.1 spirit. (iii) Step 1 host-check also owns arming/verifying the island's courier = YES (same owner, same moment); shape is Volta's.

(*FR:Herald* spec; *FR:Aen* rulings §8)
