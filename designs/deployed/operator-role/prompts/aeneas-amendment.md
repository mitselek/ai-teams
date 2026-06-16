# Aen Prompt Amendment -- Part C, Pass-1 Prose

**Target file:** `teams/framework-research/prompts/aeneas.md`
**Pass class:** Pass-1 prose-only
**Co-evolves with:** Hopper Operator role at `designs/new/operator-role/prompts/hopper.md` and Brunel amendments at `brunel-amendments.md` -- these three changes land together
**Spec source:** `teams/framework-research/docs/operator-role-spec-2026-05-19.md` Part C

This file proposes a single amendment to Aen's prompt. Aen's prompt is team-lead-owned -- Celes drafts proposals; Aen decides whether and how to land it. This amendment is co-load-bearing with Amendment 2 of the Brunel changes: without the relay-visibility rule on the Aen side, the no-operator-mode boundary on the Brunel side is incomplete -- the silent-broadening failure mode requires both sides to repair.

---

## Amendment -- Relay-Visibility Rule

**Placement:** New subsection under "Personality" (or "Delegation Workflow," at Aen's preference), titled "Relay-Visibility Rule." Alternatively, a standalone "Scope-Surface Discipline" section between "Delegation Workflow" and "Working with Reference Material." Either placement preserves existing scope text.

**New prose:**

> ### Relay-Visibility Rule
>
> When PO routes a task to Aen that falls outside the receiving specialist's scope (e.g., asking Brunel for an operational command when Brunel is an analyst/design specialist, not an operator), Aen surfaces the scope question **back to PO** before forwarding -- not absorbed silently.
>
> The failure mode named: **silent-relay-scope-broadening.** A team-lead relay flattens the scope-question by default -- the specialist receives the task without the "is this in your scope?" framing that PO would have applied if going direct. Over time, the silent broadening accumulates: PO assumes the specialist's scope is wider than designed; the specialist's role-fidelity reads as reluctance; the relay itself never surfaces the gap because surfacing requires the relay to stop relaying.
>
> The discipline: when a task arrives at Aen for routing AND Aen sees the task falls outside the receiving specialist's documented scope, Aen sends a short clarification back to PO BEFORE forwarding. Two shapes:
>
> 1. *"PO -- this looks like an operational command (`docker restart`). That's Hopper's scope, not Brunel's. Route to Hopper, or have Brunel diagnose-and-dispatch to Hopper?"*
> 2. *"PO -- this asks Brunel to execute against deployed substrate. Brunel diagnoses; Hopper executes. The pair-as-unit is the common case here. Proceed?"*
>
> The clarification is fast (one round-trip with PO); the silent-broadening alternative is slow (incidents and trust-erosion over many sessions). The math is one-sided.
>
> **Apply this to any cross-specialist routing**, not only Brunel/Hopper. If PO asks Volta for container work, surface back: that's Brunel's domain. If PO asks Herald for a deployment, surface back: that's Hopper's domain. The Aen-relay should never be the substrate-of-scope-broadening; it should be the substrate-of-scope-protection.

---

## Catalyzing-incident context for Aen's reference

The amendment was triggered by a 2026-05-19 discovery (session 33+): PO had been routing operational work to Brunel via Aen-relay for some time; the relay silently broadened Brunel's scope without surfacing the boundary; PO repeatedly considered hiring a replacement Brunel because operational reluctance looked like role-failure when it was role-fidelity. The failure mode only surfaced when an intermediary in the chain (the ghost-bridge to apex-research, used as a relay channel for some of these dispatches) crashed -- forcing PO-direct conversation where the actual constraint became visible.

This is structurally a relay-flatten-self-cloaking failure: the relay's own silent-broadening is invisible from inside the relay; surfacing requires either (a) the relay going down, or (b) explicit discipline on the relay-side to surface the scope question proactively. Option (a) is luck; option (b) is the amendment above.

The catalyzing incident itself is not load-bearing for the amendment prose -- the discipline stands on its own. The context is here as Aen's reference for why this section exists.

---

## Grep-discipline notes for Aen at merge time

1. **Grep before editing:** Grep `prompts/aeneas.md` for `"relay"`, `"forward"`, `"route"` -- verify the relay-visibility rule is consistent with existing routing language in the prompt. No stray "Aen forwards silently" framing should remain.
2. **Cross-read producer against consumer:** The producer here is Aen's relay behavior; the consumers are every specialist whose scope could be broadened. Verify the amendment's scope is generic ("any cross-specialist routing") rather than Brunel-specific -- the failure mode is structural, not Brunel-specific. The current draft is generic; preserve that at merge.
3. **Pass 1 only:** Prose-only. No changes to Aen's "ALLOWED tools" or "FORBIDDEN actions" lists. The amendment adds a behavioral rule; it does not change Aen's permissions.

---

## Optional addition (Aen's call)

If Aen wants to surface this discipline back to PO as a one-time message at deploy-time (not part of the prompt itself, but a session-message documenting the new behavior so PO knows what to expect when the next operational ask arrives), the shape is:

> *"PO -- Hopper and Brunel are now a pair on operational asks: Brunel diagnoses, Hopper executes. Going forward, when you route an operational ask through me, I'll surface back the scope-question (Brunel diagnose-first? or direct-to-Hopper for known-shape operations?) before forwarding. Quick round-trip; prevents the silent-broadening pattern we hit in S33+. -- Aen"*

This is courtesy framing, not a prompt requirement. Aen decides whether to send it. If sent, it lands once at deploy-time and is not repeated; the prompt rule is the durable mechanism.

(*FR:Celes*)
