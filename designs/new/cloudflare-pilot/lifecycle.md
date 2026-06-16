---
name: cloudflare-pilot-lifecycle
description: Volta's lifecycle-design brief for the Cloudflare Claude Managed Agents pilot. Covers session model, team membership, scratchpad persistence, startup discipline, A1 confirmation, and open questions blocked on Brunel intersection + execution-only data.
type: design-brief
author: volta
discovered: 2026-05-26
status: draft
companion-briefs:
  - designs/new/cloudflare-pilot/substrate.md (Brunel)
  - designs/new/cloudflare-pilot/comms.md (Herald)
synthesis: designs/new/cloudflare-pilot/README.md (Aen)
source-finding: docs/findings.md
---

# Cloudflare Pilot -- Lifecycle Design Brief (Volta)

## §VL1 -- Session model

**Cloudflare semantics (from docs/findings.md §S2 + §V3 + Caveat 2-4):** state-persists-across-sleeps is EXPLICIT; distinct-session-termination state survival is IMPLICIT (Q2 credibility-floor open); cross-session identity continuity is IMPLICIT (Q1 open); lifecycle mode (automatic-vs-API-driven) is IMPLICIT (Caveat 4).

**Hypothesis ratified for pilot.** Under managed substrate, the unit of lifecycle becomes the *session*, not the *team*. "Team-as-collection-of-managed-agents" is a framework-layer construct that exists *across* sessions, not within them. **Team-identity lives in framework-layer storage (R2/KV/Workers Durable Object), NOT in substrate-state.** This is the structural inversion docs/findings.md §S2 named: substrate handles intra-agent continuity; framework handles inter-agent coordination. Pilot ratifies the boundary by construction.

**Pilot lifecycle shape for inter-agent messaging.** Agent A in session S_A wants to message Agent B who may be in session S_B-sleeping or session-terminated. Three sub-cases:

1. **Both agents in active sessions.** Direct framework-layer message-store write by A; B polls/streams framework-store next read-cycle. Substrate-state irrelevant to comms.
2. **B is sleeping (sandbox-paused).** Same as (1) -- message lands in framework-store; B reads on wake. Cloudflare's sleep-resume guarantees B sees the message when resumed.
3. **B's session terminated; new B-session spawned later.** Q2 ambiguity activates: does B's new session inherit B's identity? If YES, framework-store messages addressed to B-identity wait there. If NO, framework-store must use stable B-identity-anchor that is *not* session-bound (this is Herald's identity-addressing question -- flag).

**Operational consequence for pilot:** the comms primitive (Herald's domain) must be session-state-agnostic -- messages live in framework-store keyed by stable agent-identity, not by session-identifier. **Pilot validates that this is sufficient OR surfaces a case where session-coupling is unavoidable.**

**Q2 credibility-floor framing (carry-forward):** until pilot establishes empirically what "distinct-session-termination" does to in-flight state, treat all comms-substrate as if Q2 = identity-fresh-per-session. That gives the conservative framework-layer-supplies-everything floor. If Q2 resolves favorable (session-binding-to-prior-state), framework-layer can simplify; if Q2 resolves unfavorable, framework-layer was already correct.

## §VL2 -- Team membership

**Docker-on-RC analog:** team membership = entry in runtime `config.json` + spawned agent-process + scratchpad on disk at `teams/<team>/memory/<agent>.md`. **Three artifacts; three loci.** §S2 + §S5 of docs/findings.md placed these at Layer-2 (consumer-team operational) -- config.json on RC, scratchpad on RC named-volume, process in container.

**Managed-substrate analog (pilot proposal):** team membership = entry in framework-layer roster (R2 object or KV value) + per-agent sandbox-config registered against CF Workers control plane + scratchpad in framework-store (R2). **Same three artifacts; ownership-loci shift per §S5 drift-surface table:**

- Roster entry: framework-layer (FR design + consumer-team operational form; lives in R2/KV).
- Sandbox-config: Layer-2 (consumer-team operational; registered with CF control plane).
- Scratchpad: framework-layer state (lives in R2 keyed by stable agent-identity, NOT session-identifier).

**"This agent is a member of pilot-team-N" fact lives in the framework-layer roster artifact.** That fact is stable across sessions, sandbox restarts, and lifecycle events. Sandbox-config is the substrate-side mirror; scratchpad is the framework-state of that membership.

**Intersection flags (per scope guardrail -- flag, don't resolve):**

> **[Cross-ref 2026-05-26]** Both intersection flags below were resolved at synthesis time. See `README.md §"Identity-anchor intersection -- RESOLVED"` for the canonical layered-chain framing (agent-name → idFromName → Sandbox ID). The intersection-flag prose below is preserved as the historical position pre-synthesis.

- **Brunel's identity-at-substrate-layer (parallel brief):** my §VL2 places stable agent-identity at framework-layer (R2/KV-stored roster). Brunel's substrate-layer identity work may name a different identity-anchor (e.g., CF Workers' assigned worker-id, sandbox-uuid persisted via Cloudflare's own identity model). **Intersection question:** is the framework-layer agent-identity the *primary* identity-of-record, with substrate-identity an ephemeral handle? Or does substrate-identity ground the framework-layer identity (Brunel-direction)? Pilot must resolve before Cal-grade pattern lands. NOT my domain to settle.

- **Herald's identity-addressing (parallel brief):** my §VL1 assumes Herald's comms primitive is session-state-agnostic + addresses by stable agent-identity. If Herald lands on substrate-binding (e.g., direct sandbox-to-sandbox via Cloudflare RPC), comms inherits substrate-lifecycle constraints and my "session-state-agnostic" assumption fails. **Intersection question:** does the comms primitive carry session-state coupling, or is it framework-store-mediated? Pilot tests this directly. NOT my domain to settle.

## §VL3 -- State persistence (scratchpad survival)

**§V3 finding (docs/findings.md):** S2a (own scratchpad) "survives unchanged -- framework-layer; Cloudflare doesn't manage scratchpad content." For pilot, scratchpads need framework-layer persistence *separate from* CF's substrate-state.

**Recommendation: R2 object per scratchpad, keyed by stable agent-identity.**

Rationale:

- **R2 over KV:** scratchpads are blob-shaped markdown (~5-20KB typical, growing); R2 is the right storage class. KV is for ≤25MB small values with eventual-consistency semantics; works but R2 is the structural fit. Recommend R2.
- **R2 over Workers' filesystem:** Workers filesystem (per docs/findings.md §S2 mention) is session-scoped. Survives sleep-resume; does NOT survive distinct-session-termination (Q2-bound). Wrong durability class for scratchpads.
- **R2 over Durable Object state:** Durable Objects (DO) per docs/findings.md §S2 are single-instance state with co-location guarantees -- useful for inbox-shaped comms primitives (Herald's domain) but heavyweight for per-agent scratchpads that are write-mostly-by-owner-agent and read-occasionally.

**Survival claim (testable in pilot):**

- *Across sleep:* R2 object persists; agent reads/writes via R2 SDK from sandbox; no lifecycle dependency. Trivially survives.
- *Across distinct-session-termination:* R2 object persists; new sandbox-session for same agent-identity reads R2 with same key, recovers scratchpad. Survives if-and-only-if agent-identity is stable across sessions (§VL1 Q1 + §VL2 intersection-flag-Brunel both apply).
- *Across team-roster-membership-removal:* R2 object persists by default; framework-layer pruning discipline (per docs/findings.md §S2 "framework-layer pruning + promotion + wiki absorption") decides retain-vs-delete. Default: retain unless explicitly pruned. mVox-M4-style steward-routed pruning applies, just with R2 instead of git.

**Operational concern:** R2 read-latency is single-digit-ms per operation; scratchpad-read-on-every-action is too chatty. Pilot should validate: agent reads scratchpad ONCE at session-start, caches in-memory in sandbox, writes-through to R2 on update. This is a standard write-through caching pattern; testable in pilot.

**[PT2 -- write-through cache discipline footnote, exec-spec amendment 2026-05-26]** For Round 1 baseline, "write-through on update" resolves to two triggers: (a) flush-on-checkpoint-tag-write -- any `[CHECKPOINT]` / `[DECISION]` / `[LEARNED]` / `[STANDING-WATCH]` / `[CAL-CANDIDATE]` tag append causes immediate R2 PUT; (b) flush-on-graceful-shutdown -- session-end hook PUTs final scratchpad state before sandbox tear-down. Between checkpoints, scratchpad-delta lives in sandbox RAM only. Crash-mid-session (sandbox dies between two checkpoints) loses uncommitted delta; accepted as Round-1 baseline-cost, defer crash-recovery to Round 2. Latency measurement (EO3) for scratchpad-write is the R2 PUT round-trip per checkpoint, NOT per assistant turn.

## §VL3.1 -- R2 bucket layout (exec-spec amendment 2026-05-26)

**Bucket name:** `pilot-framework-state` (single bucket; namespaced by key prefix).

**Canonical key table:**

| Key | Purpose | Owner | Lifecycle |
|---|---|---|---|
| `roster.json` | Authoritative `members[]` analog -- `{ "<agent-name>": { agentId, role, color, joinedAt, ... } }` | Pilot setup (manual at Round 1; KV-backed at Round 2) | Created at pilot bring-up; mutated on member add/remove |
| `scratchpads/<agent-name>.md` | Per-agent scratchpad (markdown) | Owning agent | Created at agent's session-1-end (first checkpoint); persistent across sessions |
| `next-session/<agent-name>.md` | Per-agent A1 NEXT SESSION seed (M1-analog) -- written at session-end, read at next session-start | Owning agent | See §VL5.1 |
| `discovery/last-active/<agent-name>.txt` | Last-active timestamp (RFC 3339); written on graceful shutdown | Owning agent | Used by respawn variant per §VL4.1 to detect prior incarnation |

**Conventions:**

- **Content-Type:** `text/markdown; charset=utf-8` for `.md` keys; `application/json; charset=utf-8` for `.json`; `text/plain; charset=utf-8` for `.txt`.
- **ETag:** read with ETag capture on session-start; pass `If-Match: <etag>` on write-through PUT for owned-by-self keys (scratchpads, next-session, discovery). Defends against the respawn-while-prior-incarnation-still-flushing race. Non-fatal if 412 returned at Round 1 (log + force-write); promote to hard-fail at Round 2.
- **Key stability across sessions:** all keys are `idFromName`-derivable from agent-name; matches the layered identity chain in `README.md §"Identity-anchor intersection"`.
- **Roster ownership at Round 1:** static JSON committed by pilot setup; mutation requires manual edit (no concurrent-writer hazard). Round 2 promotes to KV-backed per `comms.md §4`.

**Brunel intersection (substrate-side scaffold):** `pilot-framework-state` bucket needs to appear as an R2 binding in pilot-agent `wrangler.jsonc` under `r2_buckets: [{ binding: "FRAMEWORK_STATE", bucket_name: "pilot-framework-state" }]`. Owner: Brunel (substrate scaffold); semantics-of-keys: Volta (this brief).

## §VL4 -- Startup discipline (apply §V3 bifurcation to startup-side)

**Hypothesis ratified per spec:**

| FR Step (current Docker-on-RC) | Substrate vs framework? | Under CF-managed (pilot) |
|---|---|---|
| Step 1: Sync (git pull repo) | **Framework-layer.** Repo is FR design lineage; not substrate-managed. | **Preserved unchanged.** Pilot agent reads roster + prompts from cloned framework-state at session-start. May be R2-fetched if substrate doesn't include git-clone; either way, framework-layer concern. |
| Step 2: Reset team state (TeamDelete + TeamCreate) | **Substrate-managed.** CF allocates fresh sandbox per session via Workers control plane. | **Collapses.** No explicit "team reset" step. CF substrate handles sandbox lifecycle automatically per its session model. Framework-layer just consults roster + registers per-session sandbox-config. |
| Step 3: Restore inboxes | **Depends on Herald's comms primitive choice.** | If KV/R2-backed (framework-store), persistence is automatic -- no restore-step needed, inbox always lives in framework-store. If Durable Object, single-instance state already-there -- DO is always-on, no restore. **Either way, Step 3 collapses or becomes no-op.** |
| Step 2c (ghost member re-registration) | **Framework-layer concept.** Ghosts are comm-endpoints; substrate doesn't model them. | **Survives as framework-layer roster operation.** Pilot's roster artifact handles ghost entries identically to active members; sandbox-config registration only for agentType=normal. |

**Reframed pilot startup procedure (rough sketch):**

1. **Session-start (substrate-automatic):** CF allocates sandbox per its session model. No FR procedural action.
2. **Sync framework-state (framework-layer):** agent reads roster from R2 + own scratchpad from R2 (per §VL3) + recent inbox messages from framework-store (Herald's domain).
3. **Register session sandbox-config (substrate-side):** agent informs CF control plane of its zod-defined tool set, proxy-bindings, etc. May be auto-handled by CF SDK; pilot tests.
4. **Send intro message (framework-layer):** to team-lead per FR convention (mvox-dev common-prompt L247 analog). Confirms agent is alive in this session.

**Net startup shape:** Two-step (sync framework-state + announce-alive), not five-step. **The substrate-managed steps collapse cleanly per §V3 bifurcation, AS PREDICTED in docs/findings.md.** Pilot empirically confirms.

**[PT1 -- ordering footnote, exec-spec amendment 2026-05-26]** VL-Q-2 (Workers control-plane ordering: sandbox-config-registration vs first-R2-read) is unresolved pre-pilot. Defensive ordering for Round 1 startup: **substrate-side sandbox-config registration FIRST, then framework-state read.** Rationale: sandbox-config provides the R2 binding handle itself (per §VL3.1 Brunel intersection); reading R2 before that handle exists is structurally undefined. Pilot Test 1 empirically validates the ordering; if CF SDK auto-handles registration before user-code runs, the ordering becomes trivial.

**[PT4 -- always-2xx invariant footnote, exec-spec amendment 2026-05-26]** Per Finn's task #6 §1.2 + §5 (`teams/framework-research/docs/webhook-sandbox-research-2026-05-26.md`): Anthropic's webhook delivery contract requires the receiver to return **2xx for any signature-valid + JSON-valid event**, including when downstream dispatch fails (reference impl returns `200 {"status":"ok","drainError":true}`). Non-2xx causes Anthropic to retry indefinitely. Round 1 sandbox creation is exclusively webhook-driven (Finn §3 "no direct admin `sandbox.create` endpoint"); a pilot agent's `§VL4` startup procedure runs INSIDE the webhook-triggered DO `start()` dispatch chain.

**Lifecycle interaction:** if `§VL4` step 2 (framework-state read from R2) fails for transient reasons (R2 rate limit, network blip, ETag race per §VL3.1), the webhook handler MUST still return 2xx -- log the failure, persist what state was read, and let Anthropic's next webhook retry or the cron re-drain trigger a retry of the startup procedure idempotently. The webhook handler is NOT the agent's startup procedure -- it triggers the DO `start()` which contains the startup procedure. Failures in `§VL4` startup must surface as **DO-side log + status** (e.g., `Workspace` storage flagged as "needs-retry"), NOT as `start()` throwing up into the webhook handler.

**Lifecycle interaction with §VL4.1:** F-respawn-1/2/3 failure modes are agent-side bookkeeping outcomes (ETag-mismatch / Q2-negative-resolution / inverse-implausible). They are NOT webhook-handler 5xx triggers under any path. The respawn detection runs inside DO `start()` (same dispatch envelope as §VL4); same invariant applies -- log + persist + return 2xx from the outer webhook handler regardless of inner respawn outcome. F-respawn-2 in particular is the load-bearing research data point -- its OCCURRENCE is desired (resolves EO1); it must not be conflated with webhook-handler failure.

**Operational rule for Round 1:** the only paths that legitimately return non-2xx from the webhook handler are signature-invalid (401), JSON-invalid (400), and missing-required-headers (401) per Finn §1.2 table. Everything else -- including all R2 / DO storage / framework-state-read failures -- returns 2xx-and-log. Lifecycle.md `§VL3` write-through (PT2) and `§VL3.1` ETag conventions inherit this rule: their 412 / network / quota failures NEVER bubble up as 5xx. Pilot Test 1 should empirically verify the 2xx contract holds across at least one synthetic R2-read-failure (e.g., wrong bucket binding deliberately at session-start; observe webhook returns 2xx).

**Research-perspective observation (per dual-perspective discipline):** the startup-side bifurcation symmetric with the shutdown-side bifurcation (§V3) is itself a finding. Both ends of the lifecycle split along the same substrate-vs-framework boundary. **The boundary is operationally invariant across lifecycle phase -- startup, runtime, shutdown all bifurcate the same way.** Strengthens C2 (substrate-vs-framework-boundary-primitive) at pilot validation time.

## §VL4.1 -- Respawn-into-existing-identity startup variant (exec-spec amendment 2026-05-26)

**Trigger:** Round 1 Test 3 (Q2 probe per `README.md §"Execution sequence"` item 6) -- Pilot-B's session is terminated; Pilot-B-prime spawns with same `idFromName("pilot-b")`. The 2-step greenfield startup in §VL4 assumes no prior incarnation; respawn-into-existing-identity needs a 3-step variant.

**Procedure (Pilot-B-prime side):**

1. **Substrate-side registration (same as §VL4 step 1).** CF allocates sandbox; sandbox-config registers per `wrangler.jsonc`; R2 binding handle available.

2. **Prior-incarnation detection.** Read `discovery/last-active/pilot-b.txt` from R2. Three outcomes:
   - **Key absent:** no prior incarnation; treat as greenfield; fall through to §VL4 step 2.
   - **Key present, timestamp < session-start-time:** prior incarnation existed; proceed to step 3 (state reconciliation).
   - **Key present, timestamp > session-start-time:** anomaly -- prior incarnation may still be writing. Log warning; wait 2× R2-PUT-latency (~50ms); re-read; if still anomalous, abort with explicit error (pilot operator-decides whether to force-takeover).

3. **State reconciliation.** Read `scratchpads/pilot-b.md` (prior incarnation's scratchpad, capture ETag) + read own DO mailbox storage (prior incarnation's inbox). Append a respawn-marker to scratchpad: `[RESPAWN <ISO-timestamp>] Prior incarnation last-active <prior-timestamp>. Resuming identity-of-record under new sandbox.` Flush respawn-marker with `If-Match: <etag>` per §VL3.1 ETag convention.

4. **Announce-alive (same as §VL4 step 4).** Send respawn-announcement to roster peers (or "to-self-and-roster-future-readers" in team-lead-less Round 1). Distinct content from cold-spawn intro: announce as continuation, not new-arrival.

**Failure-mode catalog (Round 1 expected; documented for falsifiability):**

- **F-respawn-1: prior-scratchpad ETag-mismatch on step 3 PUT.** Either prior incarnation didn't graceful-shutdown (left ETag inconsistent) or two respawns racing. Log + force-write per §VL3.1 Round-1 fallback; pilot operator inspects.
- **F-respawn-2: DO mailbox empty but scratchpad indicates messages received.** Confirms Q2 negative for DO storage -- substrate-state did NOT survive session-termination. This is the load-bearing Round-1 research finding; resolves EO1.
- **F-respawn-3: scratchpad absent but DO mailbox populated.** Confirms partial Q2 -- DO survives but R2 lost. Implausible (R2 is more conservatively documented than DO storage); flag for investigation if observed.

**Operational note:** the respawn variant adds ONE step (prior-incarnation detection + reconciliation) on top of the 2-step greenfield startup. The variant fires on respawn-into-existing-identity ONLY; greenfield session-1 of any agent uses §VL4 unchanged.

## §VL5 -- A1 (M1 seed) confirmation under managed substrate

**Per docs/findings.md §S2:** M1 NEXT SESSION seed is framework-layer carry-forward of *intent and coordination state*, not substrate-state.

**Confirmation for pilot: A1 stays.** Team-lead reorientation tax exists wherever team-leads exist, regardless of substrate. Under CF-managed substrate:

- Substrate-state (sandbox memory + filesystem) survives sleep-resume per CF guarantee.
- Substrate-state does NOT survive distinct-session-termination (Q2 ambiguity bounds adoption; pilot conservatively assumes terminated).
- M1 seed is *plan-state at the meta-team level* -- what team-lead expects to do next, who's awaiting what, PO-pending decisions. This information is NOT in substrate's memory; it's in deliberate prose written by team-lead at session-end for next-session-team-lead to read first.
- M1's persistence mechanism = same as scratchpad (§VL3 R2 recommendation). Lives in framework-store, keyed by team-lead-agent-identity.

**Therefore:** A1 adoption decision is robust against substrate choice. FR-A1 stays. Pilot can adopt A1 from day-1 without modification.

**One refinement for pilot context:** the pilot is a *new team* (per spec: greenfield, 2-3 solo agents). It does NOT inherit FR's M1 backlog. **Pilot's first M1 seed gets written at pilot's first session-end** -- bootstrap-of-bootstrap moment. Worth noting in pilot's startup-doc that "the M1 seed pattern applies from session 2 onward; session 1 is the bootstrap-write."

**[PT3 -- team-lead-less M1-analog footnote, exec-spec amendment 2026-05-26]** Round 1 has no team-lead per `README.md §"Execution sequence"` item 3 ("both announce to each other"). A1 in FR is a team-lead artifact; Round 1's M1-analog is **per-agent next-session-reorientation** -- each pilot agent writes its own `next-session/<agent-name>.md` at session-end. No central M1 file. The pattern returns to team-lead-form (one central M1 written by team-lead) when a team-lead role is spawned (Round 3 if/when cross-account/cross-team work surfaces). Concrete protocol in §VL5.1.

## §VL5.1 -- Pilot bootstrap sequence (exec-spec amendment 2026-05-26)

**Defines the per-agent next-session-reorientation protocol for the team-lead-less Round 1 pilot.** Resolves SB2 (bootstrap-write procedural form) and PT3 (M1-analog under team-lead-less team) jointly.

**Session 1 (bootstrap-write):**

At session-1-end, each pilot agent writes:

1. **`scratchpads/<agent-name>.md`** -- own scratchpad with checkpoints from session-1 work. Standard scratchpad shape (CHECKPOINT / DECISION / LEARNED tags). Persistent across sessions.
2. **`next-session/<agent-name>.md`** -- next-session-reorientation document. Read by *future-self at session-2 start*. Suggested skeleton:

   ```
   # Pilot-<X> next-session reorientation (written session-<N>-end)
   ## Where I left off
   <2-3 sentence summary of session-<N> outcome>
   ## Open threads with peers
   <one line per peer with whom I have inflight comms>
   ## What I expect to do session-<N+1>
   <3-5 bullets, ordered>
   ## State I depend on
   <R2 keys + DO mailbox state I'll read at session-<N+1> start>
   ```

3. **`discovery/last-active/<agent-name>.txt`** -- RFC 3339 timestamp of graceful shutdown. Powers respawn detection per §VL4.1.

**Session 2+ (steady-state):**

At session-N start (N≥2), each pilot agent's startup procedure (§VL4 step 2, "sync framework-state") includes a read of `next-session/<agent-name>.md` for self-reorientation BEFORE acting on inbox messages. At session-N end, agent overwrites `next-session/<agent-name>.md` with the next-session-N+1 reorientation. ETag-checked per §VL3.1.

**Concurrency note:** each agent's `next-session/<agent-name>.md` is **single-writer-by-self**; no inter-agent reads of peer next-session files at Round 1. (Peer-discovery happens via DO mailbox and roster, not via peer's reorientation file.) This sidesteps the "did pilot-a author one for pilot-b?" question -- the answer is **no, never**. Each agent's reorientation is private framework-state.

**Framework-level finding (research-perspective, dual-perspective discipline):**

> **M1-pattern decomposes along team-lead-presence.** In team-lead-bearing teams (FR, mvox-dev, apex-research), M1 is *one central document written by team-lead* (centralized coordination state for the leader-of-record). In team-lead-less teams (Round 1 pilot, any future flat-team), M1 *per-shards by agent* -- each agent owns its own next-session-reorientation. The carry-forward primitive (intent + coordination state across session boundaries) is invariant; the *ownership topology* tracks team-leadership topology. n=2 instances if pilot validates: FR/mvox/apex (central, n=3 within the central form) and Round-1 pilot (sharded, n=1). Companion to A1 adoption pattern; Cal-Protocol-A candidate post-pilot once sharded-form lands empirical evidence.

This is the M1-pattern-lifecycle-in-team-lead-less-teams finding flagged by team-lead 2026-05-26 13:59 for Cal handling. Pre-pilot, hypothesis; pilot evidence post-Test-3 promotes to n=2 cross-topology.

## §VL6 -- Open questions

1. **Q1 (carry-forward from docs/findings.md):** cross-session identity continuity under CF-managed substrate. Pilot DIRECTLY tests this -- if agent A in session S_1 has identity-anchor X stored in framework-layer R2, does session S_2's agent-process read R2[X] and recover identity? Pilot's first concrete experiment. Resolves to YES (framework-layer identity grounds substrate-session identity) or NO (substrate identity is primary; framework-layer can't override).

2. **Q2 (carry-forward from docs/findings.md):** distinct-session-termination state survival. Same as Q1 from a different angle. Pilot resolves jointly with Q1.

3. **VL-Q-1 (new this brief):** does R2 read-latency on session-start (read roster + scratchpad + ~recent-inbox) introduce session-start tax sufficient to motivate caching tier? Pilot measures empirically. If single-digit-ms × N reads is acceptable, skip caching; if cumulative >500ms, introduce write-through cache.

4. **VL-Q-2 (new this brief):** does Workers' control plane impose any session-start ordering constraints between roster-read and sandbox-config-registration? If sandbox-config must register BEFORE first R2 read, pilot needs careful startup-sequencing. Pilot tests. **[Cross-ref 2026-05-26]** Defensive Round-1 resolution documented at PT1 footnote in §VL4 (sandbox-config-registration FIRST, then framework-state read); pilot Test 1 empirically validates.

5. **VL-Q-3 (new this brief):** scratchpad pruning under managed substrate. M4 mVox steward-pruning pattern was designed assuming on-disk file growth. Under R2, growth is unbounded by storage but bounded by per-read transfer cost. Does that shift the prune-incentive curve? Worth one-paragraph thought experiment in Cal-Protocol-A submission AFTER pilot lands evidence; not pre-pilot.

6. **Intersection-resolved-by-pilot:** the §VL2 intersection flags to Brunel + Herald (identity-anchor primary-vs-secondary; comms primitive session-coupling). Pilot resolves both by construction; Aen synthesizes across the three briefs.

## Dual-perspective discipline reminder

**We-as-target (pilot lifecycle design):** four operational specs landed -- session model is framework-layer team-identity-across-sessions; team membership lives in R2 roster; scratchpads in R2; startup collapses to two-step. Pilot validates these by construction.

**We-as-researchers (lifecycle-shape-under-managed-substrate as research finding):** the startup-side bifurcation symmetric with shutdown-side bifurcation (§V3) is a new finding -- the substrate-vs-framework boundary is operationally invariant across lifecycle phase. Worth surfacing in C2's wiki entry as a *lifecycle-phase-invariance corollary* post-pilot. Pre-pilot, this is hypothesis; pilot empirically tests by exhibiting all three phases (startup + runtime + shutdown) under CF-managed substrate.

(*FR:Volta*)
