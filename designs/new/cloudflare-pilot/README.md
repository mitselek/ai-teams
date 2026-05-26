---
name: cloudflare-pilot-experiment
description: Greenfield 2-3 solo CF-managed Claude agents + framework-layer comms between them. Tests FR thesis that solving single-agent comms generalizes to inter-team comms. Multi-session experiment per PO 2026-05-26. Aen synthesis of Brunel + Volta + Herald design briefs.
type: experiment-plan
status: draft (HARD-BLOCKED on Sandboxes account activation Q1)
discovered: 2026-05-26
po-thesis: "if we manage to solve single-agent comms, then we essentially solve inter-team comms, too"
synthesis-author: aen
source-briefs:
  - designs/new/cloudflare-pilot/substrate.md (Brunel — CF rights inventory + substrate-class + secrets + identity)
  - designs/new/cloudflare-pilot/lifecycle.md (Volta — session model + team membership + R2 scratchpads + startup discipline + A1)
  - designs/new/cloudflare-pilot/comms.md (Herald — DO mailbox + KV roster + idFromName + envelope + discovery + persistence semantics)
source-finding: docs/findings.md
companion-task: task #10 (FR TaskList)
---

# Cloudflare Claude Managed Agents — Pilot Experiment

## Motivation

PO (2026-05-26) directed a pilot per Q4 in `docs/findings.md`. PO's thesis: *"if we manage to solve single-agent comms, then we essentially solve inter-team comms, too."* This maps directly onto FR's positioning in docs/findings.md §S2 — we build the multi-agent coordination layer above single-agent substrates. **The pilot IS the construction of that layer.**

Three research goals (per PO 2026-05-26 AskUserQuestion answers):

- **Hands-on familiarization** with CF Sandboxes substrate
- **Build single-agent comms** (the actual framework-layer contribution)
- **Generalize to inter-team comms** (the thesis test)

Multi-session, rough-plan-first; execution begins as soon as Q1 (account activation) resolves.

## Synthesis — what the three briefs agree on

| Dimension | Decision | Source |
|---|---|---|
| **Pilot composition Round 1** | 2 microVM agents (Pilot-A "talker", Pilot-B "responder") — substrate-class CONSTANT to isolate comms variable | Brunel §2 |
| **Identity (framework layer)** | Agent-name is the canonical handle; R2/KV roster as authoritative `members[]` analog | Volta §VL2 + Herald §2 |
| **Identity (substrate layer)** | Sandbox ID per agent (persistence anchor); `idFromName(<agent-name>)` resolves name → deterministic DO ID for comms | Brunel §4 + Herald §2 |
| **Comms primitive** | Durable Object as per-recipient mailbox (storage-backed; strong consistency; single-instance addressable); HTTP POST from sender Worker route to recipient DO | Herald §1 |
| **Scratchpad persistence** | R2 object per agent, keyed by stable agent-identity; read-once at session-start + write-through cache | Volta §VL3 |
| **Secrets injection** | Proxy-binding at sandbox edge (1 binding: ANTHROPIC_API_KEY); ZERO env vars in sandbox; ~10 → 1 reduction from S34 baseline | Brunel §3 |
| **Message envelope** | FR's existing SendMessage shape, zod-validated at DO entry | Herald §3 |
| **Discovery (Round 2+)** | KV roster + Queue broadcast on join/leave | Herald §4 |
| **Startup (per session)** | Two-step: sync framework-state from R2 + announce-alive to team-lead; substrate-managed sandbox allocation collapses Step 2 entirely | Volta §VL4 |
| **A1 NEXT SESSION seed** | Stays framework-layer; M1 pattern applies from session 2 onward (session 1 = bootstrap-write) | Volta §VL5 |

## Identity-anchor intersection — RESOLVED

Volta and Herald both flagged this intersection without resolving it; my read after synthesizing:

**Identity is a layered chain, not a single choice:**

```
agent-name              ← framework-state, FR-owned (R2 roster)
    ↓ resolution at framework layer
idFromName(name) → DO ID  ← deterministic; substrate-state-but-name-derived
    ↓ runtime binding
Sandbox ID              ← substrate-state, persistent for sandbox lifecycle
```

- **Framework-layer name is the source of truth.** R2 roster lists names; agents address each other by name.
- **DO ID and Sandbox ID are deterministic-from-name** (via idFromName resolution and Sandboxes API binding). Substrate-side persistent handles, but recoverable from the name.
- **Q1 (cross-session identity continuity) resolves trivially if the chain holds:** a new session for agent-name "pilot-b" gets the same DO ID via idFromName, can read prior DO storage; gets a (possibly new) Sandbox ID but Sandbox state is session-scoped anyway.

**This means the pilot doesn't need to resolve "primary identity" between framework and substrate — they're layered, not competing.** The framework-layer name is the user-facing identity; substrate identifiers are implementation details derived from it.

The Q2 probe (terminate B; spawn B-prime same idFromName; check storage survival) tests whether this layered chain is actually durable.

## Round 0 — Substrate deployment smoke test (precedes Round 1)

**Source:** [github.com/cloudflare/claude-managed-agents — connecting-to-private-services.md](https://github.com/cloudflare/claude-managed-agents/blob/main/docs/connecting-to-private-services.md). The doc's own "5-minute laptop-tunnel end-to-end" tutorial. Validates substrate deployment + agent-to-private-service connectivity at minimal cost, **before** investing in inter-agent-comms construction.

**Goal:** validate the deployment path + private-service connectivity. Resolves several of our open questions by direct observation rather than design speculation.

**Scope:** **single** agent (not multi-agent yet) + laptop-side service exposed via Cloudflare Tunnel + agent reaches it via `call_service` tool with a `vpc_services` binding. Does NOT exercise inter-agent comms; that's Round 1.

**Execution sequence (verbatim from CF docs):**

1. **Run a local service:** `python3 -m http.server 8080`
2. **Create Cloudflare Tunnel:** `cloudflared tunnel login` + `cloudflared tunnel create laptop-dev` + `cloudflared tunnel run laptop-dev`
3. **Provision Workers VPC Service** in CF dashboard (Workers & Pages → Workers VPC → Services → Create), pointing at the tunnel. Host: `localhost`. HTTP port: `8080`. TLS verification: disabled (HTTP-only). Copy the service UUID.
4. **Bind in `wrangler.jsonc`:** `"vpc_services": [{ "binding": "LAPTOP", "service_id": "<uuid>" }]`
5. **Sync + deploy:** `npm run vpc:sync && npx wrangler types && npm run deploy`
6. **Create an isolate-backed agent** in the dashboard with the `call_service` tool enabled.
7. **Prompt the agent:** *"Use call_service with binding 'LAPTOP' and path '/' and tell me what status code came back."*
8. **Verify:** agent returns 200; watch `cloudflared` + Python server terminals for the inbound request.

**Success criteria:**

| Outcome | Resolves |
|---|---|
| Deployment succeeds end-to-end | Q1 collapses to "yes, account has what's needed" |
| Agent calls `call_service` and reaches local service | Q3 (secrets-injection / API surface) — observable directly |
| Status 200 round-trip | Substrate deployment path validated |
| QUIC tunnel works from PO's network (UDP/7844) | No-fallback risk — if QUIC blocked, HTTP/2 fallback breaks DNS per gotchas section |
| `cloudflared` shows `originService=warp-routing` | Confirms Workers VPC path is correct (not ingress) |

**Failure paths inform Round 1 design:**

- If deployment can't complete → we learn substrate-availability state BEFORE investing in DO mailbox design
- If QUIC blocked → network-level constraint surfaces; affects all subsequent rounds equally
- If `call_service` API differs from doc → revise Herald's comms design before commit

**Cost:** ~30 min of operator work; minimal CF resources (one VPC Service + one Worker deploy). Cheap to roll back.

**Why Round 0 precedes Round 1:** the doc's pattern uses CF's *own* `call_service` tool — independent of Herald's DO-mailbox design surface. Validates substrate without entangling framework-layer construction. If Round 0 succeeds, Round 1's DO mailbox design starts from a known-working substrate. If Round 0 surfaces operational frictions (auth scope, tier issues, network-blocked QUIC, etc.), those get resolved before they confound Round 1's data.

**Complementary, not redundant:**

- Round 0 tests **agent ↔ private-service** comms (the VPC binding pattern)
- Round 1 tests **agent ↔ agent** comms (the DO mailbox pattern)
- Both can coexist in the final pilot — VPC bindings for any private-service reach; DO mailboxes for inter-agent comms

**Substrate-research observation from the CF doc itself:** the gotchas section of `connecting-to-private-services.md` documents four distinct Sub-shape E drift instances (L1-design-vs-L3-runtime: warp-routing-vs-ingress; L2-config-vs-L3-DNS: Host resolution; L2-config-vs-L3-listener: HTTP port; intra-L2 semantic: `hostname` matcher-vs-destination). **Independent vendor corroboration of FR's Sub-shape E pattern** — Cloudflare documents the same structural drift class their own customers hit. Strengthens E1 wiki-confidence promotion beyond medium-high; Cal-Protocol-A queue item worth filing as concrete cross-substrate evidence post-pilot.

## Round 1 — Executable spec (HARD-BLOCKED on Q1)

**Participants:**

- Pilot-A: microVM sandbox, agent-name `pilot-a`, role "talker"
- Pilot-B: microVM sandbox, agent-name `pilot-b`, role "responder"

**Infrastructure (CF services required):**

- Sandboxes API — both agent sandboxes
- Durable Objects — one per agent for mailbox (`idFromName(<agent-name>)`)
- R2 — bucket for scratchpads + roster
- Workers — control-plane HTTP routes (`/inbox/<recipient>`)
- Workers Secrets — ANTHROPIC_API_KEY as proxy-binding

**Framework-state (R2 contents at pilot launch):**

- `roster.json` — `{ "pilot-a": { ... }, "pilot-b": { ... } }`
- `scratchpads/pilot-a.md` — empty seed
- `scratchpads/pilot-b.md` — empty seed

**Substrate-state (Sandbox-config per agent):**

- 1 secret binding: `ANTHROPIC_API_KEY` → `api.anthropic.com` with `x-api-key` header injection
- Outbound proxy allowlist: `api.anthropic.com` + comms-Worker route
- Sandbox ID: assigned by CF at allocation

**Execution sequence:**

1. **PO unblocks Q1** — confirm Sandboxes activated on account `8f150f98013eec8cae0a9db20a010c49`. If not, request beta access. Acquire Sandboxes API docs.
2. **Provisioning (Brunel-led):** Workers project scaffold; sandbox-config schemas; DO class for `AgentMailbox`; R2 bucket; secret binding.
3. **Boot Pilot-A and Pilot-B sequentially.** Each reads roster + own scratchpad from R2; registers sandbox-config; announces-alive (no team-lead in pilot; both announce to each other).
4. **Test 1 — Round-trip:** Pilot-A sends a message to Pilot-B via HTTP POST to `/inbox/pilot-b` (Worker routes to `idFromName("pilot-b")` DO, which appends to storage). Pilot-B polls own DO storage, reads message, responds. Pilot-A receives.
5. **Test 2 — Sleep-resume:** Send message to sleeping Pilot-B; verify message persists; wake Pilot-B; verify read.
6. **Test 3 — Session termination (Q2 probe):** Terminate Pilot-B's session entirely. Spawn Pilot-B-prime with same `idFromName`. Send message; verify whether prior storage messages still present. **This is the primary research data point.**
7. **Measurements:** latency per round-trip (compare to FR's 657-854ms ssh+python+fcntl baseline); envelope round-trip integrity; dyad-crossed-messages pattern recurrence.

## Round 2 — Planned (after Round 1 stabilizes)

**Additions:**

- Pilot-C: V8 isolate (instead of microVM) — tests substrate-class-fit for stateless responder workload
- KV roster (instead of static R2 file) — automated agent-registration
- Queues — broadcast events on agent join/leave (push-based discovery)

**Tests:**

- Discovery: Pilot-C joins; Pilot-A and Pilot-B discover it without manual roster edit
- Substrate-class fit: does Pilot-C-on-V8 successfully participate in the comms primitive?
- Scale: latency under 3-agent N×N comms vs 2-agent baseline

## Round 3 — Deferred (M4)

- Cross-account / cross-team comms (tests inter-team comms thesis)
- Bridge to FR-existing teams via ghost-member pattern (`ghost-member-as-universal-integration-surface.md`)
- Document patterns for promotion to wiki via Cal-Protocol-A

## Success criteria

**For Round 1 (research-grade outcomes):**

| Criterion | Resolves |
|---|---|
| Pilot-A ↔ Pilot-B round-trip succeeds | Comms primitive is operational |
| Sleep-resume persists messages | Q1 explicit guarantee corroborated at pilot scale |
| Termination-respawn preserves storage | **Q2 credibility-floor RESOLVED** (positive or negative) |
| Envelope round-trips cleanly via DO JSON serialization | EO2 (no envelope-substrate impedance) |
| Latency competitive with FR baseline | EO3 (substrate-cost vs FR-current) |
| dyad-crossed-messages pattern recurs OR doesn't | EO4 (substrate-invariance of FR-internal pattern) |

**Outcome interpretation:**

- **All positive:** layered identity chain holds; pilot validates substrate choice; framework-vs-substrate boundary materializes mechanically. Confirms §S2/§S5 of docs/findings.md by construction.
- **Q2 negative:** DO storage doesn't survive session-termination → comms primitive must shift to R2-mailbox-as-object pattern. Falsifies a load-bearing assumption; the pilot is the research instrument that surfaced the gap.
- **Latency much worse than FR baseline:** substrate-cost claim weakens; pilot teams should stay on Docker-on-RC unless bottleneck is specifically substrate-shaped.

## Open questions

**Account-side (Brunel §5):**

- **Q1: Sandboxes activation on `8f150f98...`?** ← **HARD BLOCKER**
- Q2: Per-sandbox pricing?
- Q3: Secrets-injection API surface (proxy-binding vs env-var-injection)?
- Q4: Lifecycle mode (automatic-vs-API-driven)?
- Q5: Sandbox-to-sandbox direct routing API?

**Execution-only (Volta §VL6 + Herald §1-§5):**

- VL-Q-1: R2 session-start read latency tolerable, or motivates caching?
- VL-Q-2: Workers control-plane ordering constraints on roster-read vs sandbox-config-registration?
- EO1: Q2 resolution (DO storage survives session-termination?)
- EO2: SendMessage envelope JSON round-trip integrity?
- EO3: Comms latency vs FR baseline?
- EO4: Dyad-crossed-messages pattern recurrence on CF substrate?

**Framework-level (post-Round-1):**

- FO1: If CF-native discovery automation succeeds, can it backflow to FR-current independent of substrate adoption?
- FO2: How does CF-pilot agent compose with FR ghost-member pattern for FR↔pilot interop?

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sandboxes not enabled / beta-gated | HIGH | HARD BLOCKER | PO checks dashboard, requests access; defer pilot until resolved |
| DO product not on current tier | MEDIUM | Need fallback comms primitive (R2 + ETag) | Pre-evaluate R2-as-mailbox in design; Brunel BO1/BO2 confirms tier |
| Pricing surprise at pilot scale | LOW | Pilot cost overruns budget | 2-3 agents minimal scale; check Q2 at activation |
| Sandboxes API docs sparse | MEDIUM | Schematic designs (§3 sandbox-config) need refinement at execution | First execution step is read-docs; refine designs before bring-up |
| Q2 resolves negative | MEDIUM | DO-mailbox choice invalidated | Pivot to R2-mailbox documented in Herald §1; preserves experiment |
| Envelope round-trip impedance | LOW | FR envelope needs CF-edge translation layer | Probe early (Test 1); document if surfaces |

## Cal-Protocol-A candidates (post-pilot)

The pilot will generate substantive wiki-grade findings depending on outcomes:

- **C-pilot-1: Layered identity chain (name → idFromName → Sandbox ID).** Framework-grade pattern, validates after Q1+Q2 resolve.
- **C-pilot-2: Substrate-vs-framework boundary materialized at comms layer.** Strengthens C2 from docs/findings.md §S7 with concrete instance.
- **C-pilot-3: Lifecycle-phase-invariance corollary** (Volta §VL4 — startup-side bifurcation symmetric with shutdown-side bifurcation). Strengthens C2.
- **C-pilot-4: Substrate-state reduction in practice (~10 vars → 1 binding).** Documents the apex-research procedural-to-structural conversion at pilot scale.
- **E-pilot-1: Sub-shape E n=2 → n=3 if pilot exhibits same drift-surface redistribution as predicted in docs/findings.md §S5.**
- **C-pilot-5 (potential): dyad-crossed-messages substrate-invariance** if EO4 resolves positive.

All routed to Cal post-pilot through standard Protocol-A flow.

## What Aen does next

1. **Surface Q1 to PO** (DONE — 2026-05-26 11:30, before this synthesis).
2. **Hold pilot execution** until PO returns Q1 resolution.
3. **If Q1 positive:** dispatch Brunel for Workers project scaffold (this becomes S36 first action).
4. **If Q1 negative (no Sandboxes):** evaluate alternatives — request beta, or design experiment to use only generally-available CF products (Workers + DO + R2 + KV without Sandboxes), accept that "managed agents" semantics won't be tested.

## Cross-references

- `docs/findings.md` — task #7 joint Brunel + Volta substrate-gap-analysis (FR positioning + bottleneck-alignment n=3 + cluster-decomposition meta-principle)
- `designs/new/cloudflare-pilot/substrate.md` — Brunel's full brief
- `designs/new/cloudflare-pilot/lifecycle.md` — Volta's full brief
- `designs/new/cloudflare-pilot/comms.md` — Herald's full brief
- <https://blog.cloudflare.com/claude-managed-agents/> — source announcement
- <https://platform.claude.com/docs/en/managed-agents/overview> — Anthropic Managed Agents platform docs (resolved several blog-post-implicit caveats; Q1 largely de-risked)
- <https://developers.cloudflare.com/sandbox/tutorials/claude-managed-agents/> — Cloudflare integration tutorial
- <https://github.com/cloudflare/claude-managed-agents> — deployment template repo (fork-and-deploy starting point for the pilot)
- <https://github.com/cloudflare/claude-managed-agents/blob/main/docs/connecting-to-private-services.md> — Workers VPC + `call_service` + `vpc_services` binding doc (Round 0 source; documents Sub-shape E drift instances in its gotchas section as independent vendor corroboration)

(*FR:Aen — synthesis on behalf of Brunel + Volta + Herald*)
