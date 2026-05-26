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

# Cloudflare Pilot — Lifecycle Design Brief (Volta)

## §VL1 — Session model

**Cloudflare semantics (from docs/findings.md §S2 + §V3 + Caveat 2-4):** state-persists-across-sleeps is EXPLICIT; distinct-session-termination state survival is IMPLICIT (Q2 credibility-floor open); cross-session identity continuity is IMPLICIT (Q1 open); lifecycle mode (automatic-vs-API-driven) is IMPLICIT (Caveat 4).

**Hypothesis ratified for pilot.** Under managed substrate, the unit of lifecycle becomes the *session*, not the *team*. "Team-as-collection-of-managed-agents" is a framework-layer construct that exists *across* sessions, not within them. **Team-identity lives in framework-layer storage (R2/KV/Workers Durable Object), NOT in substrate-state.** This is the structural inversion docs/findings.md §S2 named: substrate handles intra-agent continuity; framework handles inter-agent coordination. Pilot ratifies the boundary by construction.

**Pilot lifecycle shape for inter-agent messaging.** Agent A in session S_A wants to message Agent B who may be in session S_B-sleeping or session-terminated. Three sub-cases:

1. **Both agents in active sessions.** Direct framework-layer message-store write by A; B polls/streams framework-store next read-cycle. Substrate-state irrelevant to comms.
2. **B is sleeping (sandbox-paused).** Same as (1) — message lands in framework-store; B reads on wake. Cloudflare's sleep-resume guarantees B sees the message when resumed.
3. **B's session terminated; new B-session spawned later.** Q2 ambiguity activates: does B's new session inherit B's identity? If YES, framework-store messages addressed to B-identity wait there. If NO, framework-store must use stable B-identity-anchor that is *not* session-bound (this is Herald's identity-addressing question — flag).

**Operational consequence for pilot:** the comms primitive (Herald's domain) must be session-state-agnostic — messages live in framework-store keyed by stable agent-identity, not by session-identifier. **Pilot validates that this is sufficient OR surfaces a case where session-coupling is unavoidable.**

**Q2 credibility-floor framing (carry-forward):** until pilot establishes empirically what "distinct-session-termination" does to in-flight state, treat all comms-substrate as if Q2 = identity-fresh-per-session. That gives the conservative framework-layer-supplies-everything floor. If Q2 resolves favorable (session-binding-to-prior-state), framework-layer can simplify; if Q2 resolves unfavorable, framework-layer was already correct.

## §VL2 — Team membership

**Docker-on-RC analog:** team membership = entry in runtime `config.json` + spawned agent-process + scratchpad on disk at `teams/<team>/memory/<agent>.md`. **Three artifacts; three loci.** §S2 + §S5 of docs/findings.md placed these at Layer-2 (consumer-team operational) — config.json on RC, scratchpad on RC named-volume, process in container.

**Managed-substrate analog (pilot proposal):** team membership = entry in framework-layer roster (R2 object or KV value) + per-agent sandbox-config registered against CF Workers control plane + scratchpad in framework-store (R2). **Same three artifacts; ownership-loci shift per §S5 drift-surface table:**
- Roster entry: framework-layer (FR design + consumer-team operational form; lives in R2/KV).
- Sandbox-config: Layer-2 (consumer-team operational; registered with CF control plane).
- Scratchpad: framework-layer state (lives in R2 keyed by stable agent-identity, NOT session-identifier).

**"This agent is a member of pilot-team-N" fact lives in the framework-layer roster artifact.** That fact is stable across sessions, sandbox restarts, and lifecycle events. Sandbox-config is the substrate-side mirror; scratchpad is the framework-state of that membership.

**Intersection flags (per scope guardrail — flag, don't resolve):**

- **Brunel's identity-at-substrate-layer (parallel brief):** my §VL2 places stable agent-identity at framework-layer (R2/KV-stored roster). Brunel's substrate-layer identity work may name a different identity-anchor (e.g., CF Workers' assigned worker-id, sandbox-uuid persisted via Cloudflare's own identity model). **Intersection question:** is the framework-layer agent-identity the *primary* identity-of-record, with substrate-identity an ephemeral handle? Or does substrate-identity ground the framework-layer identity (Brunel-direction)? Pilot must resolve before Cal-grade pattern lands. NOT my domain to settle.

- **Herald's identity-addressing (parallel brief):** my §VL1 assumes Herald's comms primitive is session-state-agnostic + addresses by stable agent-identity. If Herald lands on substrate-binding (e.g., direct sandbox-to-sandbox via Cloudflare RPC), comms inherits substrate-lifecycle constraints and my "session-state-agnostic" assumption fails. **Intersection question:** does the comms primitive carry session-state coupling, or is it framework-store-mediated? Pilot tests this directly. NOT my domain to settle.

## §VL3 — State persistence (scratchpad survival)

**§V3 finding (docs/findings.md):** S2a (own scratchpad) "survives unchanged — framework-layer; Cloudflare doesn't manage scratchpad content." For pilot, scratchpads need framework-layer persistence *separate from* CF's substrate-state.

**Recommendation: R2 object per scratchpad, keyed by stable agent-identity.**

Rationale:
- **R2 over KV:** scratchpads are blob-shaped markdown (~5-20KB typical, growing); R2 is the right storage class. KV is for ≤25MB small values with eventual-consistency semantics; works but R2 is the structural fit. Recommend R2.
- **R2 over Workers' filesystem:** Workers filesystem (per docs/findings.md §S2 mention) is session-scoped. Survives sleep-resume; does NOT survive distinct-session-termination (Q2-bound). Wrong durability class for scratchpads.
- **R2 over Durable Object state:** Durable Objects (DO) per docs/findings.md §S2 are single-instance state with co-location guarantees — useful for inbox-shaped comms primitives (Herald's domain) but heavyweight for per-agent scratchpads that are write-mostly-by-owner-agent and read-occasionally.

**Survival claim (testable in pilot):**
- *Across sleep:* R2 object persists; agent reads/writes via R2 SDK from sandbox; no lifecycle dependency. Trivially survives.
- *Across distinct-session-termination:* R2 object persists; new sandbox-session for same agent-identity reads R2 with same key, recovers scratchpad. Survives if-and-only-if agent-identity is stable across sessions (§VL1 Q1 + §VL2 intersection-flag-Brunel both apply).
- *Across team-roster-membership-removal:* R2 object persists by default; framework-layer pruning discipline (per docs/findings.md §S2 "framework-layer pruning + promotion + wiki absorption") decides retain-vs-delete. Default: retain unless explicitly pruned. mVox-M4-style steward-routed pruning applies, just with R2 instead of git.

**Operational concern:** R2 read-latency is single-digit-ms per operation; scratchpad-read-on-every-action is too chatty. Pilot should validate: agent reads scratchpad ONCE at session-start, caches in-memory in sandbox, writes-through to R2 on update. This is a standard write-through caching pattern; testable in pilot.

## §VL4 — Startup discipline (apply §V3 bifurcation to startup-side)

**Hypothesis ratified per spec:**

| FR Step (current Docker-on-RC) | Substrate vs framework? | Under CF-managed (pilot) |
|---|---|---|
| Step 1: Sync (git pull repo) | **Framework-layer.** Repo is FR design lineage; not substrate-managed. | **Preserved unchanged.** Pilot agent reads roster + prompts from cloned framework-state at session-start. May be R2-fetched if substrate doesn't include git-clone; either way, framework-layer concern. |
| Step 2: Reset team state (TeamDelete + TeamCreate) | **Substrate-managed.** CF allocates fresh sandbox per session via Workers control plane. | **Collapses.** No explicit "team reset" step. CF substrate handles sandbox lifecycle automatically per its session model. Framework-layer just consults roster + registers per-session sandbox-config. |
| Step 3: Restore inboxes | **Depends on Herald's comms primitive choice.** | If KV/R2-backed (framework-store), persistence is automatic — no restore-step needed, inbox always lives in framework-store. If Durable Object, single-instance state already-there — DO is always-on, no restore. **Either way, Step 3 collapses or becomes no-op.** |
| Step 2c (ghost member re-registration) | **Framework-layer concept.** Ghosts are comm-endpoints; substrate doesn't model them. | **Survives as framework-layer roster operation.** Pilot's roster artifact handles ghost entries identically to active members; sandbox-config registration only for agentType=normal. |

**Reframed pilot startup procedure (rough sketch):**

1. **Session-start (substrate-automatic):** CF allocates sandbox per its session model. No FR procedural action.
2. **Sync framework-state (framework-layer):** agent reads roster from R2 + own scratchpad from R2 (per §VL3) + recent inbox messages from framework-store (Herald's domain).
3. **Register session sandbox-config (substrate-side):** agent informs CF control plane of its zod-defined tool set, proxy-bindings, etc. May be auto-handled by CF SDK; pilot tests.
4. **Send intro message (framework-layer):** to team-lead per FR convention (mvox-dev common-prompt L247 analog). Confirms agent is alive in this session.

**Net startup shape:** Two-step (sync framework-state + announce-alive), not five-step. **The substrate-managed steps collapse cleanly per §V3 bifurcation, AS PREDICTED in docs/findings.md.** Pilot empirically confirms.

**Research-perspective observation (per dual-perspective discipline):** the startup-side bifurcation symmetric with the shutdown-side bifurcation (§V3) is itself a finding. Both ends of the lifecycle split along the same substrate-vs-framework boundary. **The boundary is operationally invariant across lifecycle phase — startup, runtime, shutdown all bifurcate the same way.** Strengthens C2 (substrate-vs-framework-boundary-primitive) at pilot validation time.

## §VL5 — A1 (M1 seed) confirmation under managed substrate

**Per docs/findings.md §S2:** M1 NEXT SESSION seed is framework-layer carry-forward of *intent and coordination state*, not substrate-state.

**Confirmation for pilot: A1 stays.** Team-lead reorientation tax exists wherever team-leads exist, regardless of substrate. Under CF-managed substrate:
- Substrate-state (sandbox memory + filesystem) survives sleep-resume per CF guarantee.
- Substrate-state does NOT survive distinct-session-termination (Q2 ambiguity bounds adoption; pilot conservatively assumes terminated).
- M1 seed is *plan-state at the meta-team level* — what team-lead expects to do next, who's awaiting what, PO-pending decisions. This information is NOT in substrate's memory; it's in deliberate prose written by team-lead at session-end for next-session-team-lead to read first.
- M1's persistence mechanism = same as scratchpad (§VL3 R2 recommendation). Lives in framework-store, keyed by team-lead-agent-identity.

**Therefore:** A1 adoption decision is robust against substrate choice. FR-A1 stays. Pilot can adopt A1 from day-1 without modification.

**One refinement for pilot context:** the pilot is a *new team* (per spec: greenfield, 2-3 solo agents). It does NOT inherit FR's M1 backlog. **Pilot's first M1 seed gets written at pilot's first session-end** — bootstrap-of-bootstrap moment. Worth noting in pilot's startup-doc that "the M1 seed pattern applies from session 2 onward; session 1 is the bootstrap-write."

## §VL6 — Open questions

1. **Q1 (carry-forward from docs/findings.md):** cross-session identity continuity under CF-managed substrate. Pilot DIRECTLY tests this — if agent A in session S_1 has identity-anchor X stored in framework-layer R2, does session S_2's agent-process read R2[X] and recover identity? Pilot's first concrete experiment. Resolves to YES (framework-layer identity grounds substrate-session identity) or NO (substrate identity is primary; framework-layer can't override).

2. **Q2 (carry-forward from docs/findings.md):** distinct-session-termination state survival. Same as Q1 from a different angle. Pilot resolves jointly with Q1.

3. **VL-Q-1 (new this brief):** does R2 read-latency on session-start (read roster + scratchpad + ~recent-inbox) introduce session-start tax sufficient to motivate caching tier? Pilot measures empirically. If single-digit-ms × N reads is acceptable, skip caching; if cumulative >500ms, introduce write-through cache.

4. **VL-Q-2 (new this brief):** does Workers' control plane impose any session-start ordering constraints between roster-read and sandbox-config-registration? If sandbox-config must register BEFORE first R2 read, pilot needs careful startup-sequencing. Pilot tests.

5. **VL-Q-3 (new this brief):** scratchpad pruning under managed substrate. M4 mVox steward-pruning pattern was designed assuming on-disk file growth. Under R2, growth is unbounded by storage but bounded by per-read transfer cost. Does that shift the prune-incentive curve? Worth one-paragraph thought experiment in Cal-Protocol-A submission AFTER pilot lands evidence; not pre-pilot.

6. **Intersection-resolved-by-pilot:** the §VL2 intersection flags to Brunel + Herald (identity-anchor primary-vs-secondary; comms primitive session-coupling). Pilot resolves both by construction; Aen synthesizes across the three briefs.

## Dual-perspective discipline reminder

**We-as-target (pilot lifecycle design):** four operational specs landed — session model is framework-layer team-identity-across-sessions; team membership lives in R2 roster; scratchpads in R2; startup collapses to two-step. Pilot validates these by construction.

**We-as-researchers (lifecycle-shape-under-managed-substrate as research finding):** the startup-side bifurcation symmetric with shutdown-side bifurcation (§V3) is a new finding — the substrate-vs-framework boundary is operationally invariant across lifecycle phase. Worth surfacing in C2's wiki entry as a *lifecycle-phase-invariance corollary* post-pilot. Pre-pilot, this is hypothesis; pilot empirically tests by exhibiting all three phases (startup + runtime + shutdown) under CF-managed substrate.

(*FR:Volta*)
