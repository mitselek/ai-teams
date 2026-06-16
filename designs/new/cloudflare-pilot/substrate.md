---
name: cloudflare-pilot-substrate
description: Brunel's substrate-design brief for the Cloudflare Claude Managed Agents pilot. Includes CF account rights inventory, substrate-class recommendation per agent, secrets-injection-at-proxy concrete config, identity-at-substrate-layer, and account-side open questions blocking pilot bring-up.
type: design-brief
author: brunel
discovered: 2026-05-26
status: draft
companion-briefs:
  - designs/new/cloudflare-pilot/lifecycle.md (Volta)
  - designs/new/cloudflare-pilot/comms.md (Herald)
synthesis: designs/new/cloudflare-pilot/README.md (Aen)
source-finding: docs/findings.md
---

# Cloudflare Pilot -- Substrate Design Brief (Brunel)

## §1 Rights Inventory (Part 1, Tier R probes)

**Account in scope:** `8f150f98013eec8cae0a9db20a010c49` (from `hr-platform/conversations/node_modules/.cache/wrangler/wrangler-account.json` -- wrangler-cached account ID from prior `wrangler login` session on this host).

**Tier R probe outcomes (Windows-local host):**

| Probe | Result |
|---|---|
| `which wrangler` / `where wrangler` (system PATH) | NOT FOUND -- wrangler installed only as hr-platform devDep at `hr-platform/conversations/node_modules/wrangler/bin/wrangler.js`, not globally |
| `wrangler whoami` | NOT RUN -- no global wrangler; running via `npx wrangler` in hr-platform dir would risk side-effects + isn't Tier-R-pure |
| `~/.wrangler/config.toml` / `~/.config/.wrangler/` | NOT PRESENT -- no per-user wrangler global config on this host |
| `hr-platform/conversations/wrangler.jsonc` | READ; full config inventoried below |
| `apex-migration-research/.claude/bin/` Sandboxes refs | NONE -- no `@cloudflare/sandbox` SDK references anywhere in workspace; no Cloudflare-Sandboxes-API local docs |
| `~/.cloudflared/` | `eestiraudtee.cloudflareaccess.com-org-token` PRESENT -- Cloudflare Access SSO session token from PO's tenant; confirms Cloudflare Access provisioned |
| Cloudflare WARP install | PRESENT in PATH (`/c/Program Files/Cloudflare/Cloudflare WARP`) |

**Inferred CF account capabilities (YES / UNKNOWN / NO):**

| Service | Status | Evidence |
|---|---|---|
| **Workers** | YES | `hr-platform/conversations` deployed; production + dev environments with custom domains; observability enabled |
| **Pages** | YES (implied) | SvelteKit deploys to Pages via `_worker.js` pattern |
| **D1** | YES | `conversations-dev` (cee516d1-...) + `conversations` (2b5b7a6a-...) databases active |
| **Workers Secrets** | YES | `wrangler secret put` pattern in use (AZURE_AUTH_*, CRON_SECRET, etc.) |
| **Cloudflare Access** (Zero Trust) | YES | JWT_ISSUER `https://eestiraudtee.cloudflareaccess.com`; org token present locally |
| **Custom domains** | YES | `vestlused.evr.ee`, `vestlused.dev.evr.ee`, `apex-research.dev.evr.ee` (S34) |
| **Cloudflared tunnels** | YES | S34: tunnel `526a23d1-1f7f-472f-8df1-a9239bbe3fe4` for apex-research |
| **Scheduled crons (Workers)** | YES | `triggers: { crons: ["0 23 * * *"] }` in conversations production |
| **R2 (object storage)** | UNKNOWN | No bindings in any inventoried wrangler.jsonc; not in current scope |
| **KV** | UNKNOWN | No bindings in any inventoried wrangler.jsonc |
| **Durable Objects** | UNKNOWN | No bindings inventoried; CF DO is on Workers Paid + DO requires SQLite-DO or standard-DO product enablement |
| **Queues** | UNKNOWN | No bindings inventoried |
| **Browser Rendering** | UNKNOWN | No bindings inventoried; relevant if pilot needs the article's `browser_search` / `browser_execute` tools |
| **Workflows** (long-running) | UNKNOWN | Not inventoried; relevant if pilot needs sandbox-state persistence-across-sleeps semantics |
| **Vectorize / AI Gateway / Workers AI** | UNKNOWN | Not inventoried |
| **🔴 Cloudflare Sandboxes API (Claude Managed Agents)** | **UNKNOWN -- almost certainly NOT provisioned** | Zero local references anywhere. The 2026-05-25 announcement is recent; this is a separate product (`@cloudflare/sandbox` Worker SDK + Sandboxes service) requiring explicit account-side enablement. PO would need to activate / accept terms in the dashboard. |
| **Workers Paid plan tier** | LIKELY YES | Custom domains + scheduled crons + multi-env D1 imply Workers Paid ($5/mo); Sandboxes pricing/availability tier UNKNOWN -- almost certainly requires Workers Paid baseline |

**Blocking unknowns (surface to PO before pilot kicks off):**

1. **Is Cloudflare Sandboxes / Claude Managed Agents enabled on the `8f150f98...` account?** Likely not -- needs dashboard activation. PO check: log into CF dashboard → Workers & Pages → look for "Sandboxes" or "Managed Agents" sidebar entry; if absent, may need beta/early-access request.
2. **Pricing/tier for Sandboxes.** Article doesn't enumerate; check pricing page at activation time.
3. **Existing Workers/D1 quotas under Workers Paid.** Pilot uses 2-3 sandboxes; should fit baseline but confirm if Sandboxes have separate quota.
4. **Account-token scopes for wrangler.** Current cached token may need scope expansion for new product (`Sandbox:Edit` or equivalent).

## §2 Substrate-Class Recommendation Per Pilot Agent

**Recommendation: ALL 2-3 pilot agents on microVM substrate-class for Round 1.** Isolates the comms-primitive variable; V8 vs microVM split deferred to Round 2.

**Reasoning (per S35 §S3 matrix logic + two-condition rule):**

Agent workload-fit (could-we): each pilot agent is a Claude Code-style agent talking to other agents via Herald's comms primitive. Plausibly running: Anthropic SDK (Node/Python) + per-agent scratchpad + per-agent inbox state + Herald's comms-substrate client (HTTPS or DO-based or whatever Herald lands on). **V8 isolate fit is plausible** for stateless-request-handler agents (MCP-like pattern), but the pilot's whole point is to MEASURE the comms primitive -- adding substrate-class variance on top doubles the variables. **microVM fit is universal** -- anything that works on V8 also works on microVM (just with more provisioning latency).

Bottleneck-fit (should-we): the pilot's bottleneck IS the comms primitive Herald is designing, NOT the substrate-class choice. V8-vs-microVM substrate-class fit is independent of comms-primitive design at this stage. Holding substrate-class CONSTANT across pilot agents isolates the comms variable per experimental-discipline.

**Round-2 expansion (after Round-1 establishes baseline):**

| Agent | Substrate-class | Role | Rationale |
|---|---|---|---|
| Pilot-A | microVM | "talker" agent (initiates messages) | baseline; broad workload fit |
| Pilot-B | microVM | "responder" agent (receives + replies) | baseline; broad workload fit |
| Pilot-C (optional Round-1; Round-2 if surfacing) | V8 isolate | "minimal-state" stateless responder | hypothesis-test for V8 fit IF comms primitive doesn't require persistent per-agent state |

**Round-2 substrate-class-split experiment:** if Pilot-C-on-V8 works for the comms primitive, that's evidence the comms-primitive does NOT require microVM substrate-state -- strong reduction signal for cost-of-substrate at scale. If Pilot-C-on-V8 fails, the failure-mode is informative (which substrate-feature the comms primitive depends on).

**Researcher-perspective (per dual-perspective discipline):** this two-round structure operationalizes the §S3 matrix's two-condition rule cleanly -- Round 1 measures bottleneck-fit (the comms primitive); Round 2 measures workload-fit (which substrate-class actually runs the agent's full workload). Sequential experiments, not parallel; controls one variable at a time.

## §3 Secrets Injection at Proxy -- Concrete Config

**What goes in sandbox-config (proxy-bound, agent never sees the value):**

```jsonc
// pilot-agent sandbox-config (schematic; exact CF Sandboxes API surface unknown)
{
  "secret_bindings": [
    {
      "name": "ANTHROPIC_API_KEY",
      "outbound_route": "api.anthropic.com",
      "auth_header": "x-api-key"
    }
    // pilot Round-1 has just one -- minimal credential surface
  ],
  "outbound_proxy_allowlist": [
    "api.anthropic.com"
    // Round-2: add comms-primitive endpoint here when Herald lands on transport choice
  ]
}
```

**What is EXPLICITLY OMITTED (vs current Docker-on-RC pattern):**

- ❌ `ANTHROPIC_API_KEY` as env var inside sandbox. Sandbox process never reads it; the CF proxy rewrites outbound HTTPS to api.anthropic.com with auth header injected at the boundary. **Agent code makes naked Anthropic SDK calls; sandbox-network-layer adds auth.**
- ❌ `GITHUB_TOKEN` / `ATLASSIAN_API_TOKEN` / `TUNNEL_TOKEN` -- pilot agents don't talk to GitHub or Atlassian in Round-1 scope (deferred to Round-3 if pilot expands).
- ❌ `SSH_PUBLIC_KEY*` -- operator-reach is via CF Sandbox observability surface (SSH access, session recordings, audit trail per article), not via per-sandbox authorized_keys. **Eliminates the entire S34 catalyzing-arc class** at the substrate layer.
- ❌ `.env` file in sandbox filesystem at boot. State that survives session sleeps is sandbox-filesystem persisted, NOT credential-cluster persisted.

**Concrete comparison to apex-research Docker-on-RC pattern (S34 substrate-truth):**

| Credential-class state | apex-research current | Pilot under CF Sandboxes |
|---|---|---|
| GITHUB_TOKEN | env var in `.env` + Config.Env; recreate-wipes if not declared in compose-yml | proxy-binding; never in sandbox |
| ANTHROPIC_API_KEY | env var in `.env` | proxy-binding; never in sandbox |
| ATLASSIAN_API_TOKEN | env var in `.env` | proxy-binding (deferred Round-3) |
| TUNNEL_TOKEN | env var in `.env` + cloudflared sidecar | DOES NOT EXIST -- sandbox-as-substrate-provider IS Cloudflare |
| SSH_PUBLIC_KEY/_2/_3 | env vars in `.env`; entrypoint installs to authorized_keys | DOES NOT EXIST -- operator-reach via Sandbox observability |
| Total substrate-state env vars | ~10 | **0** for pilot Round-1 (1 proxy-binding, not env var) |

**§S3 thought-experiment validation:** the ~10 vars → 0-3 sandbox-config bindings prediction holds at pilot scope. Pilot Round-1 needs ZERO env vars + ONE proxy-binding. **L2↔L3 credential-class drift surface collapses entirely** for the pilot (per E1 wiki upgrade trigger). The S34 multi-system-failure surface cannot recur on this substrate.

**Operational implication for pilot bring-up:** sandbox-config provisioning is `add_secret_binding(ANTHROPIC_API_KEY)` ONCE at account level + bind per-pilot-agent. No `.env` reconstruction discipline; no chown-on-cold-start; no entrypoint-installs-keys ceremony. The S34 catalyzing-arc's entire procedural-cost class disappears.

## §4 Identity at Substrate Layer -- Recommend Sandbox ID for Pilot

**Three candidates** (per Aen's framing):

| Candidate | Granularity | Persistence | Routing model | Recommend? |
|---|---|---|---|---|
| **Sandbox ID** | per-agent | survives session sleeps (per article) | direct sandbox-to-sandbox via Sandboxes API | **YES (recommended for pilot)** |
| **Worker route** | per-deployment | route-stable across deploys | URL-routing via Workers HTTP boundary | NO for agent-identity; YES for external-reach if needed |
| **Durable Object ID** | per-DO-instance | strongly-consistent + persistent | DO addressing via Workers binding | DEFER -- adds DO product dependency without payoff at pilot scope |

**Recommendation: Sandbox ID is the "agent identity" for the pilot.**

**Rationale:**

1. **Granularity matches.** Sandbox = one agent. One-to-one mapping; no synthetic identity layer needed on top.
2. **Persistence semantics are what we need.** State survives sleeps per article -- pilot agents need scratchpad + inbox continuity across pause/resume; Sandbox ID is the persistence anchor.
3. **Lowest substrate-cost.** Doesn't require additional CF product enablement beyond Sandboxes itself; DO would add a product surface that's not load-bearing for the pilot.
4. **Direct addressing.** Sandbox-to-sandbox API (the Sandboxes-control-plane manages routing); aligns with Herald's "agent-to-agent comms primitive" framing without a comms-layer indirection.

**Intersection-with-Herald flag (don't resolve here per scope):** the comms primitive Herald is designing likely needs an ADDRESSING/DISCOVERY mechanism between agents. *"How does pilot-A know pilot-B's Sandbox ID?"* is an open question at the comms-layer, not the substrate-layer. Three sketch-level options for Herald to evaluate:

- (a) **Static directory** -- small JSON at account-scope mapping `agent-name → sandbox-id`; pilot agents read at boot. Simplest; doesn't scale.
- (b) **DO-as-registry** -- single Durable Object holds the live agent-roster; agents query/update on join/leave. Scales; adds DO product dependency.
- (c) **CF Service-Binding-style** -- leverage Workers Service Bindings to expose each sandbox as a service; addressing via binding-name. CF-native; depends on whether Sandboxes API supports this.

**My recommendation:** Sandbox ID at substrate layer (this brief's call); discovery layer = Herald's call. Flag for Aen synthesis: substrate-layer identity is settled; comms-layer addressing is open.

## §5 Open Questions + CF Support Requests

**Open questions (need PO/account-side answers):**

Q1. **Is CF Sandboxes / Claude Managed Agents enabled on account `8f150f98...`?** Almost certainly NO; PO needs to activate / accept terms / request beta access in dashboard. **HARD BLOCKER for pilot bring-up.**

Q2. **What's the per-sandbox pricing for Sandboxes (microVM tier)?** Affects 2-3-agent pilot cost-vs-experiment-value tradeoff. Check CF dashboard pricing page at activation time.

Q3. **Does Sandboxes provide "outbound proxy allowlist + secret binding" API surface as described in §3 schematic?** Or is it different shape (e.g., env vars injected into sandbox process at boot rather than network-layer rewriting)? **Affects §3 design correctness.** Need access to actual Sandboxes API docs (not just the announcement blog post).

Q4. **Sandbox lifecycle API mode -- automatic-vs-explicit?** Per task-#7 fourth credibility-floor caveat (Preamble): article ambiguous on whether sandbox-end is implicit-and-automatic or explicit-API-driven. **Affects §V3 shutdown-bifurcation lessons + Volta's lifecycle brief directly.** Need direct Sandboxes API docs read.

Q5. **Sandbox-to-sandbox direct routing API.** Does CF Sandboxes expose intra-account sandbox addressing primitives? Or does inter-sandbox comms route through Workers HTTP boundary externally? **Affects identity-at-substrate-layer §4 + Herald's comms primitive directly.**

**What we'd need to request from CF support / activate / upgrade-tier-for:**

- **Activation:** Cloudflare Sandboxes / Claude Managed Agents product enablement on account `8f150f98013eec8cae0a9db20a010c49`.
- **Tier check:** confirm Workers Paid baseline is sufficient OR identify Sandboxes-specific tier.
- **Token scopes:** wrangler account-token may need `Sandbox:Edit` or equivalent scope; refresh from dashboard at activation time.
- **Beta access (if applicable):** if Sandboxes is gated, request beta enrollment for `mihkel.putrinsh@evr.ee` / Eesti Raudtee organization.
- **Docs access:** confirm full Sandboxes API docs are available (beyond the announcement blog) -- request via dashboard or developer-docs URL.

**Cross-reference to Volta's lifecycle brief (one sentence per scope guardrail):** §3 secrets-injection-at-proxy design + §4 Sandbox-ID-as-identity inherit the lifecycle-mode caveat (Q4 above); Volta's brief is the canonical source for lifecycle semantics in this pilot.

## Dual-perspective summary

- **We-as-target (pilot design):** Round-1 = 2 microVM agents + 1 proxy-binding (ANTHROPIC_API_KEY) + Sandbox-ID as agent-identity; HARD-BLOCKED until PO confirms account-side Sandboxes activation per Q1.
- **We-as-researchers (framework finding):** the pilot operationalizes S35 §S3's two-condition rule mechanically -- Round-1 isolates bottleneck (the comms primitive); Round-2 isolates workload (V8-vs-microVM substrate-class split). The substrate-state reduction (~10 vars → 0-3 bindings) materializes the L2↔L3 credential-class drift collapse predicted in task-#7 §S5 / E1 wiki upgrade trigger. This pilot is the empirical test of the §S3 thought-experiment at concrete scale; outcome falsifies-or-corroborates substrate-class-fit-vs-bottleneck-alignment as the right primary decomposition lens.

(*FR:Brunel*)
