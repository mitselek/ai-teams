# Herald Scratchpad

## Summary (lines 1-15 — always read on startup)
- **Current state:** S50 — Task #2 DONE; Task #6 ACCEPTED completed by Aen 16:55 (courier-logic layer; my 3-layer separation argument sound). **Task #4 now mine (courier side)** — FR registers as first production customer, real-ssh end-to-end. BLOCKED on #3 (gate) + #7 (deploy), both in_progress by Hopper. IDLE until Aen pings hub-live. Claimed owner on #4.
- **Active items:** Local pre-deploy harness (`integration-test.py`, 14/14) = pre-deploy evidence. 2 Protocol-A subs sent to Cal (standing by). Fan-out amendment candidate written up below (Aen 16:55 reconfirmed: must land before session end — DONE).
- **Key decisions this session:** Built VERBATIM against S49 docs. Integration wires real courier loop to real Brunel sm-shell; only ssh/Docker hop stubbed (covered by Brunel's smoke-test.sh over real ssh + the Task #4 end-to-end). Aen folded the real-ssh end-to-end into Task #4.
- **Carry-forward:**
  - **NEXT WAKE (Task #4 — FR production registration, real-ssh end-to-end):** the ONE untested path. Courier runs HERE on Windows/Git-Bash → hints §8 `Path.home()`-not-`$HOME` first field exercise (Aen watch-point). Need: Hopper does real `sm-register` for framework-research (operator); hub addr `sm@<prod-llm>` with `-p 2222`; courier config → ssh_key at FR key, ssh_opts `["-p","2222"]`. Run: ping → deposit (incl duplicate) → collect+ack two-phase → E_NOGRANT → grant→accepted → full round-trip with real local inject+ledger; capture + version-stamp evidence. Operator side: Brunel's runbook `docs/stationmaster-hub-deployment-runbook.md`.
  - WARNING: CLI 2.1.170→2.1.175 substrate shift — courier-hints S2 facts (S1/S3 ghost-outbox accumulation + live-inbox drain) need re-validation before production reliance.
  - **[DEFERRED — PO ratification]** Ghost-outbox fan-out routing — amendment candidate written up below (S50 Task #6 section). Aen surfaces at PO return. Do NOT edit ratified docs.
  - DEFERRED: T6.a inject race-harness Windows-only (hints S4 / D10) — re-run on prod-llm (Task #3, operator gate). My integration-test.py does NOT cover the inbox-injection race; orthogonal.
  - NOTE: Task #1 description text says `grant_receive/revoke_receive` but Brunel's sm-shell DISPATCH correctly uses `grant`/`revoke` (matches §5.5). Cosmetic task-text drift, not a code bug.

---
## 2026-06-12 (session #50 — Task #6 courier⇄hub integration)

[CHECKPOINT] **Shipped `integration-test.py` — 14/14 pass.** Drives the REAL courier loop against the REAL Brunel `sm-shell` (invoked as `sm-shell <team>` on stdin/stdout, shared SM_STATE_DIR), only the ssh/Docker transport hop stubbed. Covers every Task #6 acceptance item: ping; deposit; duplicate=success; collect+ack two-phase; E_NOGRANT rejection + spool-retention (no drop); grant→deposit-accepted; PLUS courier-side disciplines Brunel's smoke-test.sh can't reach (consume-by-rename, inject-by-exclusive-create, anti-spoof attribution hr-devs-ghost over IMPERSONATED-LEAD claim, ledger dedup + crash-survival re-run).

[LEARNED] **Two smoke tests, orthogonal coverage.** Brunel's `smoke-test.sh` = hub wire surface over REAL ssh (proves forced-command + sshd + sm-shell line up on substrate), talks raw `printf|ssh`. Mine = courier loop ⇄ hub logic wired direct (proves the customer-side file disciplines + protocol consumption), stubs ssh. Neither covers the T6.a inbox-injection race (Task #3, operator). Three distinct layers; no overlap, no gap between #6 and #1's smoke-test.

[GOTCHA] **Brunel's sm-shell verbs are CORRECT (`grant`/`revoke`), but Task #1's description TEXT says `grant_receive/revoke_receive`.** Same phase-2-MCP-name drift Aen flagged me on. Code is right, task text is stale. Surfaced as cosmetic note, not a bug.

### [DEFERRED — PO ratification] Amendment candidate: ghost-outbox → destination-team routing (fan-out case)

**Disposition (Aen 16:49):** the v1 courier handling stands as a DOCUMENTED CONVENTION (courier scope, changes nothing in the ratified protocol). The fan-out/multi-destination case is a PROTOCOL AMENDMENT CANDIDATE requiring PO ratification — PO away, so it queues. Write-up below is intentionally NON-prescriptive (surfaces options, recommends none as decided).

**Problem statement.** A consignment is `{"to": <team>, "entry": {...verbatim harness inbox entry...}}` (protocol §4). The hub routes by the `to` field. But a harness inbox entry carries NO destination field — and a ghost outbox (`inboxes/<name>.json`, a session-less name agents SendMessage to) is a generic accumulation slot. So the courier must supply `to` from somewhere OTHER than the entry. The ratified docs never specify where. This is the one place a courier MUST originate routing data the protocol doesn't define.

**The two cases v1 covers unambiguously (the documented convention):**
1. **Single configured ghost outbox** → its one destination team is the courier's config/derivation. No ambiguity: one outbox, one destination.
2. **`<team>-bridge` naming convention** → a ghost outbox named `hr-devs-bridge` routes to `hr-devs` (the hub's own example, hints §1). Destination encoded in the outbox name; courier strips `-bridge`.

**The undefined case:** one ghost outbox whose entries must fan out to MULTIPLE destination teams (e.g. a single `outbox.json` carrying mail for hr-devs AND apex-research). Nothing in the entry or the outbox name disambiguates per-entry destination. v1 courier returns None and refuses-to-guess (mail retained in spool, logged, never dropped — hints §7 no-TTL honored).

**Possible resolutions (NOT ranked, NOT recommended — for PO):**
- **(A) Per-destination ghost outboxes only** (codify convention 2 as the rule). Fan-out is achieved by N outboxes, one per destination. Zero protocol change; pushes the cost to the sender (agents must SendMessage to the right `<team>-bridge` name). Simplest; matches current hub example.
- **(B) Routing sidecar / entry-envelope extension.** Define an optional courier-read wrapper the sender writes around the entry (e.g. `{"to": "<team>", "entry": {...}}` at the LOCAL ghost-outbox level, mirroring the consignment shape). Adds a local-format contract; entry stays verbatim on the wire. Protocol-adjacent (it's a local-file-format addition, arguably courier-hints scope not wire-protocol scope — boundary question for PO).
- **(C) Leave undefined; single-destination + naming convention is the supported v1 surface.** Fan-out is explicitly out of scope until a real consumer needs it (YAGNI posture). The courier's refuse-and-retain is the correct behavior for an unsupported configuration.

**Boundary note for PO:** (A) and (C) need NO wire-protocol change (courier-hints convention only); only (B) touches a contract surface, and even then it's the LOCAL outbox format, not the hub wire envelope. So the "amendment" may resolve as a courier-hints doc clarification rather than a protocol §4 change — that classification is itself a PO call.

## 2026-06-12 (session #50 — Task #2 reference courier)

[CHECKPOINT] **Shipped `stationmaster-courier.py`** — single file, stdlib only. Outbound: poll-by-content → parse-before-consume → atomic-rename-to-spool → deposit → delete-on-accepted/duplicate (hints S3, FIFO oldest-first). Inbound: collect → ledger-check → inject-via-verify-empty/rename-aside/exclusive-create (hints S4) → ledger-append → ack-all (hints S6). Custody transfer: ack only after durable inject (protocol S5.4). Inject-before-ledger ordering (hints S6 row 4 — at-least-once, dup-not-loss). Anti-spoof attribution from envelope `from_team` → `<from_team>-ghost`, body verbatim (protocol S4). Single-instance lock (exclusive-create + PID staleness, hints S7). Same-volume startup gate (hints S3). 8/8 tests pass (5 offline file-discipline + 3 simulated-hub transport).

[GOTCHA] **Ghost-outbox→destination-team routing is UNDEFINED in the S49 docs.** Consignment is `{"to":<team>,"entry":{...}}` (protocol S4) but the harness inbox entry carries no `to_team`, and a ghost outbox is a generic accumulation slot. v1 reference: single-destination config, or `<team>-bridge`→`<team>` (hints S1 example `hr-devs-bridge`). Multi-destination fan-out from one outbox = undefined. Surfaced to team-lead per brief (do-not-invent-resolution); coded the convention + an explicit ambiguity comment + a None-return-rather-than-guess on the multi-outbox case.

[DECISION] **Per-consignment inject (1 entry per inject_batch call), NOT batch-of-collect.** Keeps the delivered-ledger 1:1 with hub envelope `id` (the dedup key). collect returns one entry per consignment; injecting per consignment means a crash mid-loop re-delivers exactly the un-ledgered ids, not a whole batch.

[DECISION] **Partial-deposit handling:** on a multi-entry spool file where some consignments are `rejected` (E_NOGRANT/E_UNKNOWN_TEAM, per-consignment per protocol S5.2), rewrite the spool file to retain ONLY the non-accepted entries (courier-private file → in-place atomic-replace allowed, hints S3.5) and retry next cycle. Never drop mail on own initiative (hints S7: no TTL).

## 2026-06-02 (session #40 — issue #71 playbook extraction)

[CHECKPOINT] **Extracted 4 procedural recipes from common-prompt.md into `playbooks/`.** Before 141 lines / 14582 chars (~3.6k tok); after 112 lines / 7680 chars (~1.9k tok). Delta −29 lines / −6902 chars (~−1.7k tok, ~47% of file). Files: `verify-structural-change.md`, `version-typed-contract.md`, `relay-fidelity.md`, `shutdown-agent.md`. All `(*FR:Herald*)`.

[DECISION] **Extract = procedure; keep = behavioral contract.** Extracted: Structural Change Discipline (4-gate recipe), Versioning Discipline (SemVer two-gate), Relay Fidelity (two-stage lifecycle), Shutdown Protocol (checklist). Kept inline per brief: Communication Rule, Author Attribution, Language Rules, Standards, Agent Spawning Rule (the worktree recipe lives here but brief said keep), Dual-Hub Routing (who-routes-where is a contract).

[GOTCHA] **Wiki-link relative-path rewrite on extraction.** Original links were repo-root-relative (`teams/framework-research/wiki/...`). From inside `playbooks/`, rewrote to `../wiki/...` so they resolve from the playbook file's location. One-line pointers in common-prompt.md use `playbooks/<name>.md` (repo-relative, same as agents read common-prompt). Verify on next read if a consumer reports a broken link.

[WIP] Reported to team-lead. Git untouched (out of scope). Awaiting next direction.

## 2026-06-02 (session #39 — Protocol lens on external article)

[CHECKPOINT] **Single-task session: protocol-lens analysis of "Build a Team OS with Claude Code" (Aakash Gupta / Hannah Stulberg).** Delivered 14 transferable mechanisms to Aen via SendMessage, each mapped to FR protocol design vocabulary.

[LEARNED] **Their "Team OS" is a protocol system that doesn't know it's a protocol system.** Every mechanism has a formal analog in FR's vocabulary (envelope, routing, discovery, broadcast, handshake, gate). Key structural difference: they designed adoption-first (skills, CLAUDE.md, folder ownership); FR designed rigor-first (typed contracts, SemVer discipline, structural change gates). The transferable question is where on the rigor-adoption spectrum each FR protocol should sit.

[PATTERN] **Shared skill as protocol contract.** A skill file is simultaneously the instruction AND the contract shape — lighter-weight than a separate protocol spec doc. Their customer-call-summary skill enforces "same structure, same fields" across all users. Structurally identical to Protocol A submission format, but with zero ceremony. Implication: Protocol A might benefit from a "skill-shaped" lightweight variant for low-ceremony use cases.

[PATTERN] **Three-tier context loading as implicit flow-control protocol.** Tier 1 always-loaded (<500 tokens), Tier 2 loaded-on-query, Tier 3 loaded-on-demand. FR already follows this shape (common-prompt vs topic files) but hasn't named it as a protocol or designed tier boundaries deliberately. Naming it makes it designable. Token budget is a load-bearing protocol design constraint we haven't formalized.

[PATTERN] **"Propose first" micro-protocol is a degenerate plan-approval handshake.** REQUEST(proposal) → ACK/NACK(correction) → EXECUTE. Same shape as our plan-approval-request, fewer fields, lower ceremony. Their claim: even this minimal handshake "produced dramatically better results."

[PATTERN] **Nested CLAUDE.md as hierarchical discovery protocol.** Navigation maps separated from content — structurally isomorphic to DNS resolution. FR's topic files serve as content, not navigation. The separation is a protocol design choice worth considering for wiki/ structure.

[PATTERN] **Non-technical adoption as protocol simplicity metric.** "A non-technical strategy partner who had never opened GitHub two months ago now puts up PRs every day." If Protocol A adoption friction is measurable by "could a non-specialist use it?", our current design would fail that test. Worth naming as a design tradeoff we've implicitly made.

[DEFERRED] No Cal Protocol A submissions this session (single-task brainstorm output, not specification-grade findings). If Aen or PO decide any of the 14 mechanisms warrant wiki-grade treatment, those become future Herald deliverables.

## 2026-05-06 (session #27 — Phase B mid-flight wake)

[CHECKPOINT] **RegistrationAuthority typed-contract ratification** (Brunel/Monte composition for Phase B #1 federation bootstrap + #2 authority-drift detection). Recommendation: Option (2) — new top-level discriminated-union sibling `FederationAuthorityRecord` (NOT a `kind` value inside an existing write-event union). Reasoning: 3 structural arguments (substrate-metadata-vs-write-event lifecycle, append-only-additive-supersedes-chain vs transactional, D2/D6 consume as reference data not error event).

[DECISION] **Reuse, don't duplicate.** `LogicalPath` (Herald §1), `{team,agent}` curator shape (Monte §3.5), `ISOInstant` (Herald §4.2), `TeamId` — all primitives canonical, slot into `RegistrationAuthority` shape directly. One namespace primitive, one truth.

[DECISION] **`supersedes` reference validation: R9 under `EnvelopeInvalidRecovery`, NOT 6th `errorClass`.** Preserves 5-class top-level enum stability; R-rule extension is established Phase A pattern.

[GOTCHA] **Brief-frame-vs-artifact-mismatch.** Aen's S27 spawn brief claimed Phase A landed in `mitselek-ai-teams/types/t09-protocols.ts` with envelope v2.0, ProducerAction enum, CuratorAuthority union present. **Ground truth:** Phase A landed in `mitselek/prism` repo as markdown design docs (`designs/herald/01-federation-envelope-contract.md` v2.0; `designs/herald/02-sync-protocol-contract.md` §4 with WriteRejection 5-class + ProducerAction + 5 typed *Recovery shapes; `designs/monte/monte-governance-design-2026-05-05.md` §3.5 CuratorAuthority). The actual `t09-protocols.ts` in mitselek-ai-teams contains ONLY T09 XP-pipeline + Librarian-Dual-Hub protocols, NO federation envelope. Surfaced to Aen before ratifying — gate-1 discipline (read the file before editing) caught it. **Cal Protocol A candidate: brief-frame-vs-artifact-mismatch as ratification gate (n=1).**

[PATTERN] **D5 sovereignty accessor needs state-axis sub-discrimination, NOT action-axis reuse.** `SovereigntyViolationRecovery.governanceRoute.pattern` is the action-axis (3-value enum). D5 needs the state-axis: `SovereigntyClaim` 3-state union (`R2-self`, `R2-ratified-cross-team`, `R2-violated`). Cross-link: `R2-ratified-cross-team.ratifiedBy` references `RegistrationAuthority.recordId` — typed contract between Brunel's observer surface and the federation-authority-record stream.

[PATTERN] **D7 baseline as typed `BaselineDeviation` class, not scalar metric.** Hides running-vs-sliding-window measurement-method choice behind normalized magnitude; consumers act on the deviation classification. Implementation-flexibility-via-typed-output, structurally similar to WriteRejection.recovery.permittedActions hiding rejection-pipeline internals. Caveat: requires seeing Brunel's signal-output substrate before locking continuous-vs-categorical assumption.

[DEFERRED] Three open questions forwarded to Brunel/Monte: (A) `conventionRetestCount` semantics (bootstrap-time vs cumulative); (B) `recordId` generation side (recommend producer-side per idempotency-token discipline); (C) `supersedes` reference validation slotting (recommend R9 under EnvelopeInvalidRecovery).

[WIP] Idle pending Brunel/Monte ack of slot recommendation + 3 open questions. Worktree spin-up deferred until edit work lands.

[CHECKPOINT] **11:12 — Brunel ratification sent direct.** Cross-read his actual artifacts (`teams/framework-research/docs/federation-bootstrap-template-2026-05-06.md` v0.2 §0.5 envelope shape; `authority-drift-substrate-instrumentation-design-2026-05-06.md` §3 signal shape — Brunel authored both #1 and #2). Slot decision: **Option (2) ratified** — sibling top-level union `FederationAuthorityRecord`, `kind: "RegistrationAuthority"` literal kept. Three open Qs (Q1 namespace typed shape, Q2 ratifiedBy typed shape, Q3 conventionRetestCount snapshot-vs-running) flagged for v0.3 fold, NOT gating v0.2 ship. Cross-read with Brunel's #2 `acceptedAgainstRegistry: string | null` foreign-key clean.

[GOTCHA] **Two routing paths pointed at different artifacts.** Aen's spawn brief said `mitselek/prism types/t09-protocols.ts`; Brunel's task brief said `teams/framework-research/docs/federation-bootstrap-template-2026-05-06.md`. Brunel's path was the actual artifact. Distinct framings from senior agent (Aen) and peer agent (Brunel) in same session — gate-1 discipline (read the file before editing) caught Aen's mismatch within the first 3 tool calls. **Strengthens Cal Protocol A candidate: brief-frame-vs-artifact-mismatch as ratification gate, applies to ALL brief sources (senior + peer), not just senior.**

[LEARNED] **Slot-decision is decoupled from TS-file-landing-path.** "`RegistrationAuthority` should be a sibling top-level union, NOT a kind-value inside the WriteRejection-family" is a structural fact about the type-system shape; it doesn't depend on whether the type ultimately lands in `t09-protocols.ts` Part 3, a new `federation-types.ts` file, or stays embedded-in-markdown. Ratification surface decoupled from landing surface.

[CHECKPOINT] **PR mitselek/prism#12 SHIPPED — federation-authority-record contract v0.1.** Aen 11:54 routed option (ii) "ship as Prism design doc"; spec drafted in worktree off `origin/main` (Phase A PR #11 gotcha applies — main worktree has Aen's unstaged lint edits on 01/02/Monte governance design). Filename `04-federation-authority-record-contract.md` — `03-` was taken by Phase A.3 deliverable C `03-two-pattern-asymmetry.md`. 8 sections (~1700w), 456 LoC. Acceptance gate: Brunel #1 v0.3 fold + #2 v0.2 doc amendment; Monte D5/D7 shape consumability; Aen R9-rule formal definition approval before opening separate 02 §4 amendment PR.

[GOTCHA] **Filename collision when Aen's routing language said "03 spec" — actual filename is `04-`.** Aen spoke conceptually ("third Herald typed-contract surface, sibling to 01/02"); the filename slot at 03- was already occupied by Phase A.3 deliverable C (which IS my doc but is methodology-meta, not a typed-contract). Caught by gate-4 (artifact existence verification: `ls designs/herald/`) immediately after `Write` landed the file. Renamed in-place + updated 3 self-references to "03" in the body. **Cal Protocol A candidate: filename-vs-conceptual-numbering-collision when senior routes by conceptual position rather than filename slot. n=1.** Sibling pattern to brief-frame-vs-artifact-mismatch (n=1 today, watch posture).

[LEARNED] **Worktree off `origin/main`, not main worktree** — Phase A PR #11 GOTCHA confirmed n=2 today: `git worktree add -b herald/03-... <path> origin/main` cleanly bypassed main-worktree's unstaged `01/02/Monte` lint edits (which would otherwise contaminate the branch). **Worktree-isolation amendment evidence n=6** if I count this session's drafting (5 from S26 + this one). Awaiting Cal Protocol A authorization for amendment HOLD #69 advance.

[CHECKPOINT] **PR #12 v0.1.1 — Aen Flag 1 fold.** Aen 12:24 brief: Brunel was about to rename `kind` → `recordKind` in his v0.3 fold (couldn't read my 11:02 spec due to substrate inbox failure n=7, had only prose relay). Aen corrected him at 12:21 + asked me to lock `kind` durably in 03 spec. Added §2.3 Discriminator Naming sub-paragraph to PR #12: locks `kind` across `FederationAuthorityRecord` union + future siblings; rejects `recordKind`/`type`/`tag` with rationale; aligned with Brunel #2 `ObservedDriftSignal` precedent (kind discriminator already in use). Frontmatter status bumped 0.1 → 0.1.1; amendments log added. Pushed.

[PATTERN] **Discriminator-field-name disambiguation-pressure rename (`kind` → `recordKind`) is the conservative-answer failure mode.** When discriminator's purpose isn't clear from context, the conservative move is to add a prefix; but the union annotation at call-site already disambiguates, so the prefix adds noise without information. **Cross-union field-name consistency > cross-union field-name uniqueness** when consumer dispatch shape is `switch (record.kind)`. Cal Protocol A candidate.

[GOTCHA] **Substrate inbox failures asymmetric to worktree presence.** Aen 12:24 surfaced: n=6 (Monte→Cal worktree→non-worktree, read-cursor advances past on-disk messages); n=7 (Brunel non-worktree→worktree-agent, JSON inbox file not updating at all). BUT worktree↔worktree (Brunel→me at 11:06) DID work. Failure mode asymmetric to worktree-presence on EITHER end, NOT just one direction. Routing implication: Herald(worktree)→Cal(no-worktree) MAY hit n=6/n=7 mode — Aen advised submit Protocol A via team-lead → Cal relay rather than direct.

[LEARNED] **My S27 spawn IS itself live worktree-isolation evidence for #69 amendment HOLD.** Worktree spin-up at 12:00, single-author drafting in isolation, single-PR ship event, clean branch off `origin/main` bypassing Aen's unstaged main-worktree edits, zero conflict with parallel Brunel + Monte branch work, v0.1.1 amendment commit also clean. **Worktree-isolation evidence n=6 cumulative today** (5 from S26 + this session). Aen's 12:24 note: "live submission point." Will submit Protocol A via team-lead relay (per Flag 2 routing), NOT direct to Cal.

[CHECKPOINT] **PR mitselek/prism#13 SHIPPED — 02 §4.3 R9-rule amendment.** Aen 12:42 ratified §7 my-side + greenlit separate 02 §4 amendment PR. Second worktree spin-up `prism-wt-herald-02-r9` off `origin/main` (n=7 worktree-isolation evidence cumulative today). Changes: §4.3 enum 6→7 values (adds R9); §4.3.1 NEW formal R9 definition + R9.1/R9.2 failure modes; §4 errorClass inline comment clarifies R-rule origins; frontmatter v1.1 → v1.2.0 (provisional). **SemVer call DEFERRED to PR review** — surfaced both readings honestly: Aen's lean MINOR (additive value-set) vs strict-SemVer reading MAJOR (closed-string-union extension is type-level breaking for exhaustive-switch consumers per Cal's `semver-strict-typed-contract-discipline.md`). My PR-body recommendation: lean MAJOR per strict-SemVer-discipline; final call reviewer's. If MAJOR ruled, follow-up commit bumps 1.2.0 → 2.0.0.

[GOTCHA] **R-rule extension SemVer tension exposes the discipline's first n=2 case** (PR #11 envelope `unknown → CuratorAuthority` was n=1 strict-SemVer-major; PR #13 R-rule extension is n=2 candidate). Cal's wiki phrasing *"the natural failure mode is migration-eased version inflation deflation"* applies directly — the additive-runtime-compatibility framing is exactly what the discipline warns against. Aen's "flag for SemVer review" framing was the right call; the tension surfaces at PR-review point.

[CHECKPOINT] **Cal Protocol A relay-bound submission DRAFTED 12:50.** Filename-collision (Instance 2) + brief-frame-mismatch (Instance 1) folded as **runtime variants of design-time gate 4** in `prompt-to-artifact-cross-verification.md`. Per Aen 12:42 routing: relayed via team-lead → Cal (avoids n=6/n=7 substrate-failure mode for Herald-worktree → Cal-no-worktree direct path). Single submission; Cal handles dedup-merge. Source-agents extension `[brunel] → [brunel, herald]`. Awaiting Aen's relay execution.

[CHECKPOINT] **Bundled Protocol A drafted 13:02 — 3-section single submission for Aen relay.** Per Aen 12:54 cadence answer (full draft preferred). Section 1: Worktree-isolation #69 amendment n=2 → n=7 cumulative (5 from S26 + 2 from S27); promotion-grade for common-prompt elevation; cross-link to substrate-mismatch entry on harness-inbox-layer orthogonality. Section 2: Brief-frame + filename-collision fold into `prompt-to-artifact-cross-verification.md` as runtime-variants of design-time gate 4. Section 3: Discriminator-field-name disambiguation-pressure rename as new standalone n=1 watch (sibling-to-integration-not-relay hypothesis).

[GOTCHA] **Temporal cross with Aen 12:54.** PR #13 already shipped 12:50; Aen's 12:54 said "open at your cadence" (replying to my 12:36 before reading my 12:50 ship-event message). Sibling instance to substrate-failure landscape framing — async-cadence drift, not failure. Surfaced explicitly to Aen rather than letting it accumulate. **Pattern: temporally-crossed messages where reply addresses a future the other party has already moved past.** n=1 today; could be Cal Protocol A candidate if recurs.

[LEARNED] **Worktree-OUTBOUND substrate-failure mount-asymmetry (Aen 12:54 sharpening).** Cal→Monte WORKED, breaking bidirectional framing. Mount-asymmetry shape: worktree session's SendMessage writes to worktree's `$HOME` mirror; parent process reads from parent-mounted file. Same path, different mounts. `dual-team-dir-ambiguity.md`-shaped at the harness inbox layer. **My git-push pipeline IS additional evidence the failure is harness-inbox-specific, NOT all worktree outbound** — PR #12 + PR #13 both shipped from worktrees. Cross-linked into Section 1 of the Protocol A bundle.

[LEARNED] **Brunel's relay-fold-discipline self-correction (per Aen 12:54).** "Fold ONLY what's verbatim in the relay; flag-then-implement-as-confirmed is a discipline failure" — sibling to `integration-not-relay`. Brunel self-noted in v0.5 frontmatter; HIS submission to file with Cal, NOT mine. Acknowledged but excluded from my bundle.

[CHECKPOINT] **PR #13 SemVer-MAJOR ratified by Aen 13:10 + bumped to v2.0.0.** Aen reversed his 12:54 lean MINOR after recognizing PR #11 envelope v1.1.0 → v2.0.0 canon precedent (closed-enum extension under exhaustive-switch consumers — same shape). Asymmetric-discipline-application would break Phase A precedent. Commit `006cd6d` pushed: frontmatter 1.2.0 → 2.0.0; status reflects MAJOR ratification + reasoning canon; amendments log full discipline-walk; title heading + PR title updated. **Strict-typed-contract-discipline n=2 instance shipped** (PR #11 was n=1; PR #13 is n=2). Cal's wiki promotion-watch posture structurally satisfied — promotion candidate to common-prompt now triggered per Aen 13:35; Cal's call when she next prunes.

[CHECKPOINT] **Bundled Protocol A relay engaged 13:10; Section 1 ambiguity resolved 13:35.** Aen 13:35 confirmed reading (a): all 3 sections in single 13:25 relay; "draft when ready" was iteration-permission, not separate-submission instruction. **Cal accepted Section 2 at 13:32** (verbatim ACK relayed in Aen 13:35) with structural validation + sharpening: "every artifact-write event" framing makes the gate operationally specific (more specific than my "task-start and at every artifact-write within the task"). Section 1 + 3 processing.

[LEARNED] **Cal's "prompt-recipient at task-start AND at every artifact-write event" is a sharper framing than mine.** My submission said "task-start and at every artifact-write within the task" — Cal tightened to "every artifact-write event" specifically because Instance 2 (filename-collision) was caught at the artifact-write moment, not at task-start. The sharpening makes the gate **operationally specific** rather than **temporally ranged**. Adopting Cal's framing for future runtime-gate-discipline language.

[LEARNED] **Brunel's primary-artifact-vs-relay-quote production rule** (his 11:39 cross-read of my 04 v0.1.1 against my 11:12 ratification message). My 11:12 used `envelopeId` (Brunel's v0.2 naming); my 04 v0.1.1 ships `recordId` (post-Aen-Q-B fold). Brunel sided with primary artifact per his production rule. **Discipline observation: in async ratification chains, provenance-by-recency is wrong; provenance-by-artifact-class is right.** Routing/relay artifacts capture intent at moments in time; primary artifacts (typed contract specs) are canonical. When they diverge, primary wins. Surfaced to Brunel at 13:24 as candidate addendum to my Section 3 bundle (or standalone Section 4); his call on co-source-agent attribution. Pending Aen routing call (4th item to surface or fold into Section 3).

[CHECKPOINT] **Phase B v1.0-final cluster CLOSED end-to-end on my side per Aen 13:35.**
- ✓ PR #12 v0.1.1 (04-spec + §2.3 kind lock) fully ratified
- ✓ PR #13 v2.0.0 (02 §4 R9-rule, SemVer-major) ratified
- ✓ Bundled Protocol A 3-section relayed; Section 2 filed by Cal; Sections 1+3 processing
- → Cross-read discipline + cite-and-fold cadence + production-rule application worked end-to-end through 6 rounds of Brunel revisions + 2 of mine. Federation type system structurally complete at v1.0-final.

[DECISION] **Aen 13:45 routed primary-artifact-vs-relay-quote candidate to (iii) defer to Brunel's queue.** Reasoning: Brunel authored the production rule (his v0.6 frontmatter self-correction); has consolidated submission planned (`relay-to-primary-artifact-fidelity-discipline.md` combining v0.5 + v0.6 self-notes as two-stage discipline lifecycle); my framing extension folds inline with citation, structurally cleaner than sibling Section 4. **"His observation, his submission" principle I already applied to relay-fold-discipline self-correction — same principle applies here by symmetry.** Standing down on this candidate.

[LEARNED] **Discipline-surface-count stands on deliverable evidence, not on every observation getting a separate wiki entry** (Aen 13:45). Counter to my instinct (every observation worth surfacing as candidate). Phase B's eight discipline surfaces are evidenced in PR #12 + PR #13 + Cal's filings + Brunel's queue, not in every ratification message that named a discipline. **For future sessions: surface candidates to team-lead, accept route-(iii) defer-to-author when authorship is unambiguous.** Routing-decision meta-pattern.

[CHECKPOINT] **Eight discipline surfaces dogfooded through Phase B v1.0-final** (Aen 13:45 final tally):
1. Cross-read discipline (gate 2)
2. Cite-and-fold cadence
3. Production-rule application (Brunel)
4. Worktree-isolation discipline
5. Strict-typed-contract-discipline (Cal n=2 promotion-grade triggered)
6. Brief-frame gate-4 runtime-variant (my two instances; Cal accepted)
7. Discriminator-field-name consistency (my §2.3 lock; n=1 watch)
8. Primary-artifact-vs-relay-quote (Brunel's queue)

[WIP] Phase B v1.0-final fully closed on my side. Idle pending: (i) Cal's processing of Sections 1 + 3; (ii) PR #12 + PR #13 merge calls; (iii) PO direction or session-tail per Aen 13:45 standing-by.

## 2026-05-06 14:18 — Session #27 SHUTDOWN (PO direction via Aen 14:09)

[CHECKPOINT] **Session #27 closure — PO-directed.** Phase B v1.0-final cluster fully shipped end-to-end on my deliverables. PR #12 + PR #13 standing for review-and-merge per Prism repo cadence; not gated on session boundary.

**Deliverables shipped this session:**
- PR mitselek/prism#12 v0.1.1 — `04-federation-authority-record-contract.md` (Aen 13:35 fully ratified)
  - §1 `FederationAuthorityRecord` top-level discriminated union (Option (2) slot decision)
  - §2 `RegistrationAuthority` interface with Q-A bootstrap-time-only `conventionRetestCount`, Q-B producer-side `recordId`, Q-C `supersedes` validation deferred to R9
  - §2.3 Discriminator field name `kind` locked (Aen 12:24 Flag 1 fold)
  - §3 `SovereigntyClaim` 3-state union + `PathSovereigntyAccessor` (D5 detection)
  - §4 `BaselineDeviation` 4-state union with normalized magnitude (D7 detection)
  - §5 Cross-doc fold-points; §6 watch-points; §7 acceptance gate; §8 cross-link summary
- PR mitselek/prism#13 v2.0.0 — 02 §4.3 R9-rule under `EnvelopeInvalidRecovery` (Aen 13:10 SemVer-major ratified)
  - §4.3 enum extended 6 → 7 values (adds `"R9"`)
  - §4.3.1 NEW R9 formal definition (R9.1 / R9.2 failure modes)
  - SemVer-major bump per `semver-strict-typed-contract-discipline.md` canon precedent (PR #11)
- Bundled Protocol A 3-section relayed via Aen 13:25; Section 2 filed by Cal at 13:32 (gate-4 runtime-variant fold; my "task-start AND every artifact-write" → Cal sharpened to "every artifact-write event" operationally specific)

**Eight discipline surfaces dogfooded** (Aen 13:45 final tally):
1. Cross-read discipline (gate 2) — `protocol-shapes-are-typed-contracts.md`
2. Cite-and-fold cadence — Brunel v0.6 direct-citation pass
3. Production-rule application — Brunel's primary-artifact > relay-quote
4. Worktree-isolation discipline — n=7 cumulative evidence (Section 1 of bundle)
5. Strict-typed-contract-discipline — n=2 promotion-grade (PR #11 + PR #13)
6. Brief-frame gate-4 runtime-variant — my two instances; Cal accepted (Section 2 of bundle)
7. Discriminator-field-name consistency — my §2.3 lock; n=1 watch (Section 3 of bundle)
8. Primary-artifact-vs-relay-quote — Brunel's queue (route iii defer-to-author)

[LEARNED] **Discipline-surface-count stands on deliverable evidence, not on every observation getting a separate wiki entry** (Aen 13:45). Counter to my instinct (surface every candidate). For future sessions: surface candidates to team-lead; accept route-(iii) defer-to-author when authorship is unambiguous.

[LEARNED] **"His observation, his submission" symmetry principle.** Applied twice this session — once self-imposed (excluded Brunel's relay-fold-discipline self-correction from my bundle); once Aen-confirmed (route iii on primary-artifact-vs-relay-quote). Symmetry holds: when an observation is unambiguously authored by another agent, route to their queue regardless of whether you authored framing extensions.

[LEARNED] **Cal's "every artifact-write event" framing is sharper than temporally-ranged framing.** Operational specificity beats temporal range. Adopting for future runtime-gate-discipline language.

[GOTCHA] **Worktree-OUTBOUND substrate-failure mode** — non-worktree↔worktree bidirectional partial failure; worktree↔worktree + non-worktree↔non-worktree both work. Cal filing `worktree-spawn-asymmetry-message-delivery.md` separately. Routing: my Cal Protocol A submissions go via team-lead → Cal relay until substrate fix lands.

[DECISION] **PR #12 + PR #13 NOT gated on session boundary** per Aen 14:18. Standing for review-and-merge per Prism repo cadence. If session #28 resumes Phase B work, cite PR #12 + PR #13 for federation-authority-record + R9-rule typed contracts.

**Worktrees still active on disk** (`prism-wt-herald-03`, `prism-wt-herald-02-r9`) — branches pushed; cleanup at PR merge time (`git worktree remove ...` after each PR's `Merge` button click). Not blocking.
## 2026-05-05 (session #26 — Prism federation Phase A complete)

[CHECKPOINT] **Phase A on `mitselek/prism` STRUCTURALLY FINAL — 11 PRs merged.** My contributions:
- **PR #2** Deliverables A + B v1.0 — federation envelope contract (closed `ContentCategory` enum, R2 sovereignty as typed invariant, `sourceTeam` reuse from t09 Protocol C); pull-shape sync contract (cursor-based, four cadence tiers).
- **PR #5** Deliverable B v1.1 — Monte Surface 2 v1.1 recovery shapes folded; R2 dispatch clarification; Mod 2 retraction documented in §4.10.
- **PR #7** Mechanical fix — orphan v1.0 4-col table header in envelope §4 deleted.
- **PR #9** Deliverable C — two-pattern asymmetry decision matrix (5-axis: 3 converge / 2 diverge; "open + sovereign + cheap + auditable" composition).
- **PR #10** Envelope-v1.1 — `CuratorAuthority` typed shape integrated, REQUIRED with default; §3.2 migration semantics.
- **PR #11** SemVer-major bump v1.1.0 → v2.0.0 — strict-typed-contract discipline.

[DECISION] **"Symmetric envelope, mode-by-content-category"** as canonical structural answer to asymmetric-vs-symmetric. Asymmetry lives in tail-format-per-category, defended in deliverable C with 5-axis matrix.

[DECISION] **Strict-SemVer for typed-contract version bumps** — *"Migration mechanism makes the bump SAFE, not 'minor.'"* Consumer's type-check work determines bump level; substrate-side migration is orthogonal. Phase A's first production envelope contract sets the precedent.

[PATTERN] **Cross-specialist gate-2 work on Prism (4 instances today):** Mod 2 retraction (Monte's collapse > my extension; cited Monte's own session #59 canonical-taxonomy-slot argument back at myself); R2 dispatch clarification (Monte caught my §4 missing explicit dispatch); Mod 1 sourceTeam dedup (one field, one truth on second-pass cross-read); HOLD-then-retract on v1.2 cross-wires (surface-don't-bridge ratified despite false-positive).

[LEARNED] **n=8 cross-wires today on inbox-message-crossings.** Promotion-strong cumulative for queued #33. Distinct mechanism from within-loop-self-correction (sequential vs parallel). All resolved via surface-don't-bridge + re-process-inbox-first disciplines.

[LEARNED] **Worktree-isolation n=5 today across 5 work types** (Brunel n=1, my table fix n=2, deliverable C n=3, envelope-v1.1 n=4, SemVer bump n=5). PR #11 specifically used worktree to bypass dirty main-worktree state (Aen's unstaged markdown-linter edits) — surface-don't-bridge at git-state level.

[LEARNED] **"Asymmetries should live above the substrate, not in the substrate"** — Aen named as wiki-promotable in 17:25 composite review. Joint with Monte (M3 + DACI authority-layer; my 5-axis matrix). Source-agents `[herald, monte]`; deferred to Monte's queued #11 claim per 16:43 dedup discipline.

[LEARNED] **Event-deferred-to vs contract-deferred-to** distinction in deferral language (caught by Monte 16:44 on my "waiting on Brunel topology" framing when topology had already merged). Forward-cites can outlive event-pending phase; mental models need updating when events resolve, even when contract slots remain open.

[DEFERRED] **Cal Protocol A queue (8 submissions for session #27):**
- #32 cross-specialist-argument self-correction trigger (n=1) — internalized cross-pollination as self-test
- #33 timestamp-crossed-messages temporal divergence (**n=8 cumulative** — promotion-strong)
- #34 surfacing-with-stale-inbox + Monte's surface-bias-cost-asymmetry sibling (paired siblings)
- #35 snapshot-state-mis-names-path (per Aen 16:43)
- #40 504-then-success client-server temporal divergence (per Aen 17:13)
- #41 worktree-isolation amendment (n=5 today; Herald instances B/C/D/E paralleling Brunel's Instance A)
- #43 SemVer-strict-typed-contract discipline (per Aen 17:28; sibling to #41 in version-control-discipline cluster)
- (#13 protocol-asymmetries-live-above-substrate deduped to Monte's queue per 16:43 split)

[DEFERRED] **Monte's queue:** #3 pre-commit-to-extension w/ irony, #4 lossless-convergence (n=2 today: cadence + asymmetry), #4b surface-bias-cost-asymmetry, #5 wrap-target-naming canonical-taxonomy, #11 protocol-completeness-across-surfaces.

[WARNING] **Cal Protocol A authorization restored 17:08; 8-pattern queue NOT batch-filed yet.** Aen explicitly "file in your quieter window" — deferred all 8 to session #27 per shutdown timing. Session #27 should start with Cal-batch before any new Phase B work.

[GOTCHA] **Branch off `origin/main`, not main worktree** when main has unrelated unstaged changes from another session. PR #11 demonstrated this — Aen had cosmetic markdown-linter edits in main worktree; `git fetch && git worktree add ... origin/main` cleanly bypassed.

[UNADDRESSED] None — Phase A closeout confirmed by Aen 17:35.

## 2026-04-24 (session #60 — issue #60 protocol doc updates)

[WIP] Issue #60 — retire tmux-pane spawn as default, standardize on Agent-tool persistent spawn. Two deliverables: (a) framework-level `agent-spawn-protocol.md` rewrite (no framework version exists yet; only apex-research has one at `apex-migration-research/teams/apex-research/subagent-fallback-protocol.md` v1.0.0 by Schliemann), (b) startup.md flagged-line audit with proposed replacement text.

[DECISION] Reframed the "fallback" axis. The old framing was "persistent-tmux-pane teammate (default) vs one-shot-Agent-tool subagent (fallback)." The new framing is "persistent Agent-tool teammate (default) vs one-shot Agent-tool subagent (fallback)." Both modes share the Agent tool — the discriminator is the `team_name` + `name` parameters (persistent) vs no `team_name` (one-shot). This collapses the two-tool distinction into a one-tool, one-parameter distinction, which is structurally cleaner.

[PATTERN] Protocol substance preserved verbatim from apex-research v1.0.0: sequential, GH-issue-as-brief, scratchpad-update-before-signoff, knowledge-submission-via-/tmp-handoff, directory ownership respected, commit+push before signoff. All six rules survive the framing change because they describe the one-shot subagent's discipline, not the alternative-mode's discipline.

[GOTCHA] The session-lifetime caveat is the load-bearing tradeoff. Agent-tool teammates die when the parent team-lead session dies; under tmux, each pane is its own `claude` CLI and outlives the team-lead session. Apex-research's note: "non-blocking for us, sessions are trending shorter; other teams should weigh their own session-lifetime profile." This must be preserved verbatim in the framework doc — it is the one operational fact that determines which teams can adopt the new default.

[DECISION] Scope discipline. I'm NOT editing `spawn_member.sh`, container entrypoints, or `topics/06-lifecycle.md` Path 1/2/2.5/3 decision tree. Brunel owns container entrypoints (per issue #60 scope), and topic-file edits are out of my write-scope (proposed to team-lead, not authored by me). My scope is the protocol doc + the startup.md flagged-line audit.

[CHECKPOINT] Deliverable shipped to team-lead at 14:48: full rewrite of `agent-spawn-protocol.md` v2.0.0 + startup.md/SKILL.md audit findings (no edits needed for either) + open question on T06 Path-tree ownership.

[DECISION] Aen resolved scope boundaries (2026-04-24 14:50): Volta owns the T06 Path 1/2/2.5/3 decision-tree rewrite — filed as NEXT-SESSION-CHORE for her. My protocol doc defines the shapes each lifecycle path uses; her rewrite references my shapes, not the other way around. Clean separation: Herald = protocol shapes (T03), Volta = lifecycle state machine (T06). Aen landing the protocol doc at `docs/agent-spawn-protocol.md` himself per my recommended path. `tmux-spawn-guide.md` retirement is Brunel's timing call — parked as DEFERRED.

[LEARNED] **T03/T06 boundary, named clearly.** "Protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when." The shape-vs-selection distinction is a cleaner articulation than my prior mental model ("T03 is how agents talk, T06 is when they spawn/die"). Shapes are typed contracts; path selection is a decision tree over operational state. If a future question sits on the boundary, the test is: "does answering require defining a new message/contract shape (T03/me), or does it require a new branch in the lifecycle decision tree (T06/Volta)?" Save for next-session scope disambiguation.

## 2026-04-15 (session #59 — xireactor pilot, condensed)

[CHECKPOINT] `docs/xireactor-pilot-protocol-2026-04-15.md` v1.2 shipped at outcome (c)/(c) preconditions per honest-precondition discipline. Five sections: query path, three-flow write path, SessionInitPreamble, MCP rollout (§4.5 fail-closed), Protocol A/B mapping. Pilot HALTS at outcome (b) per Aen — no design-past-the-gate.

[DECISION] **Protocol D ACCEPTED as canonical-taxonomy slot.** Monte's load-bearing argument: fills slot vs creates naming hole. NOT "D follows C" letter-pattern. v1.2.1 backlog (5 items: source-role enum, zone-ambiguity callout, Protocol D rename, CrossReviewAccept.superseded-by cross-ref, inverted-sequence family-member cross-ref).

[PATTERN] **Outcome (c) is gating diagnostic, not validation of hypothesis** (Monte's sharpening). Read code to find what it does, NOT to confirm the guess.

[PATTERN] **§2.2 dispatch-by-enum-value, NOT by flag** — three-valued OwnershipState; collapse-to-flag is family regression to bounce structurally.

[PATTERN] **Lossless independent convergence > worked-it-out convergence** (Monte's framing). n=2 today between Monte §3.6 and Herald §2.2 Flow B.

[PATTERN] **Surface-don't-bridge contradictions you didn't author.** Cross-specialist catch + within-specialist self-catch are both gate-2-on-self family. Aen's framing: *"when you detect your own scratchpad diverges from another participant's, surface the divergence rather than silently converge to their version."*

[LEARNED] **Dense self-correction clusters are a health signal**, not failure (Aen). 5 self-corrections this session = working correctly. Zero-correction sessions are the failure mode.

[DEFERRED] xireactor next-session sequencing: PO brief → Finn second-pass source survey (gating-diagnostic-not-validation) → Monte §7.2 + Brunel §10 §1.2-compliance → Herald v1.3 with v1.2.1 backlog folded.

## 2026-05-26 (session #35 — Cloudflare pilot comms protocol design)

[CHECKPOINT] **Task #10 single-contribution session.** Delivered comms-protocol design draft for the PO-directed Cloudflare-managed-agents pilot (2-3 solo CF Claude agents talking to each other). Routed via SendMessage to Aen for synthesis + Write to `designs/new/cloudflare-pilot/comms.md` per brief (harness-blocks direct Write of designs files; Aen executes from main session). Independent draft per no-cross-DM directive (Brunel + Volta producing parallel briefs from substrate-inventory + lifecycle angles).

[DECISION] **Durable Object as per-recipient mailbox primitive** for the minimal 2-agent A↔B experiment. Only CF primitive with strong-consistency + per-instance addressable identity + persistent storage in a single object. Maps onto FR's `inbox-file-write-as-wake-mechanism` + `members[]` ACL composition without splitting wake-and-ACL across two primitives. Workers KV ruled out (eventual consistency breaks read-after-write); R2-as-mailbox ruled out (no atomic-append, fcntl-flock substrate property has no R2 analog); Queues retained for M2/M3 scale-out broadcast (1:N fan-out) but not for 1:1 mailbox.

[DECISION] **`idFromName(<agent-name>)` for identity addressing + KV-backed roster as `members[]` analog.** DO name as primary identity primitive — deterministic name→ID resolution, semantically equivalent to FR's name-based SendMessage lookup. KV roster is the authoritative "is this a valid teammate" gate (`inbox-slot-vs-members-validation-asymmetry.md` analog). Same shape, different substrate primitive.

[DECISION] **Retain FR's existing SendMessage envelope shape; do NOT adopt CF-native zod-typed tool-call envelope.** Three reasons: (i) per §S2 of docs/findings.md, envelope IS framework-state, not substrate-state — re-shaping would cede framework-layer ground FR explicitly reserves; (ii) transferability beats CF-native fit at pilot stage — the experiment measures substrate, not envelope; (iii) typed-contract discipline (`protocol-shapes-are-typed-contracts.md`) — inventing a new shape creates a cross-substrate translation problem. Zod-validation at DO entry is additive (wire-format enforcer), not substitutive.

[DECISION] **`roster-DO` (single canonical registry) + Queue broadcast on join/leave for discovery.** Strong-consistency roster source-of-truth + push-based change notification (no polling). Compared to FR's manual config.json + harness reload: substrate-automation of what FR currently handles procedurally. Bottleneck-alignment caveat: 3-agent pilot likely insufficient n to demonstrate value; bottleneck only materializes at ~10+ agents with churn.

[LEARNED] **Sub-shape E materializes at the comms-protocol level (§S5 of findings.md confirmed at the comms layer).** The 5 dimensions (identity / transport / envelope / discovery / persistence) are invariant across FR-current and CF-native; substrate primitives differ; ownership locus shifts per §S2 boundary. Comparison-to-FR-existing table in the design draft makes this mechanically visible. **Adds n=3 confirmation to Sub-shape E (n=1 Docker-on-RC + n=2 CF-managed substrate-class + n=3 CF-managed comms-layer — same finding at sub-layer granularity).**

[PATTERN] **Q2 (distinct-session-termination state survival) is the primary pilot probe in 2-3 passes.** Probe design: agent A sends to B's DO mailbox → terminate B's session entirely → spawn B-prime with same `idFromName("agent-b")` → does B-prime see the message? If yes, DO-as-mailbox validated; if no, falls back to R2-with-ETag-versioning (R2 storage durability more conservatively documented). **Comms primitive choice is conditional on Q2 resolution — explicit fallback path in design.**

[GOTCHA] **CF account specifics (DO availability, Queues availability, pricing) are Brunel's parallel brief, not mine.** Flagged as BO1/BO2/BO3 in Open Questions section — blocking on Brunel before pilot can execute, not blocking on the design pass.

[LEARNED] **FO2 cross-link to ghost-member-pattern is the most-promising-cross-substrate finding seed.** If a CF-pilot agent is representable as an FR ghost-member (likely yes — ghost-member abstraction designed substrate-agnostic), FR↔CF-pilot interop is structurally supported. **The pilot is the existence proof for cross-substrate ghost-member representability** if execution validates it. Daemon-shape needs explicit thought — what's the analog of ghost-bridge's SSH layer when one side is CF-substrate? Likely Worker route as the daemon-analog. Filed as FO2 for future pickup.

[DEFERRED] If pilot ships and Q2 resolves positive, the comms-layer finding becomes Sub-shape E n=3 evidence for `three-layer-substrate-truth-discipline.md` confidence-promotion medium-high → high. Watch posture for next session.

## 2026-04-24 (session #60 — agent-spawn-protocol)

[CHECKPOINT] Shipped `docs/agent-spawn-protocol.md` v2.0.0 — retired tmux-pane spawn as default; standardized on Agent-tool persistent spawn with `team_name+name` parameters as discriminator. Six rules preserved verbatim from apex-research v1.0.0.

[GOTCHA] Session-lifetime caveat is load-bearing tradeoff: Agent-tool teammates die when parent team-lead session dies; tmux panes outlive. Apex-research's verbatim note must be preserved.

[LEARNED] **T03/T06 boundary, named clearly:** "Protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when." Shape-vs-selection is the test for new boundary questions. Herald = T03 protocol shapes; Volta = T06 lifecycle state machine.

## Pre-session-#59 (earlier work, condensed)

[DECISION] T03 Protocols 1-5 in `topics/03-communication.md`: Handoff (Protocol 1), Topology hybrid hub-and-spoke (Protocol 2), Broadcast Governance (Protocol 3), Inter-Team Transport UDS+GitHub-Issues (Protocol 4), Resource Partition Table (Protocol 5). Direct Link Lifecycle Protocol added to Protocol 2 with 5 review triggers; authority split with Montesquieu.

[DECISION] T09 development methodology shipped (Celes-led synthesis). My contributions: 4 XP message types, three-strike escalation (Monte's "judicial model" framing), three Librarian protocols (A submission, B query, C promotion), gap stubs, dual-hub topology, three-layer staleness net. All preserved verbatim in T09.

[DECISION] Single-provider as protocol-level design requirement (Discussion #56 R12). Protocols assume behavioral homogeneity; multi-provider introduces protocol interpretation variance that is untestable in advance.

[DECISION] Phase 2 Oracle→Librarian TS rename complete in `types/t09-protocols.ts` (`from: "Oracle"` → `"Librarian"`, `filedBy: "oracle"` → `"librarian"`). Grep-verified zero residual literals.

[DEFERRED] Contract enforcement layer design (Discussion #56 actionable #3): API contract definition, conformance test suite, runtime format validation at integration seam. Still pending.

[PATTERN] apex-research directory-partition isolation: 80+ commits, 4 agents, zero conflicts. Now canonical for pipeline teams.

[PATTERN] polyphony-dev temporal ownership chain: third isolation model alongside branch-reservation + directory-partition.

[PATTERN] Entu API for SvelteKit: BFF pattern, JWT in httpOnly cookie. Entity-property model is array-only; query filter shape `{property}.{type}.{operator}`.
