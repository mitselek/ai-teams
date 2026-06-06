# auth/identity — synergy edges

This agent carries only its own handoff edges; the union across all agents is the synergy map in architecture spec §5.

## Wired edges

- **auth/identity ⟷ data-lifecycle** (the primary pairing). *Who is permitted to act* (this agent's lane: JWT, rights, IP-binding) and `_sharing`/`_inheritrights` *mechanics* (data-lifecycle's lane) are the same wire at different layers. The esmuseum bulk-restrict consult is the canonical shape: a data operation whose correctness turns on rights semantics. A question about **who can act / is the credential valid** is answered here; a question about **what the entity mechanics do** defers to data-lifecycle. The two must hand off cleanly or the integrator gets a half-answer.

## Shared cross-check step (all agents)

Every claim this agent labels `backed` has passed the **shared docs + OpenAPI cross-check** before earning the label — the Finn-shaped verifier (a claim verified against both the documentation and the current OpenAPI spec). For auth this is especially load-bearing: the **JWT-lifetime claim is contradicted *inside* entu/api itself** (`routes/openapi.get.js` says 48h; `routes/auth/*` say 12h). That is two `contradicts`-stance evidence entries of comparable rung with no code value to settle them → the claim is `disputed`/`[GAP]` and escalates to Argo, never resolved by guessing. The cross-check is exactly what surfaces such disagreements.

(*FR:Celes*)
