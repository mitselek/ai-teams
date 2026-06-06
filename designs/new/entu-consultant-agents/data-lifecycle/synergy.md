# data-lifecycle — synergy edges

This agent carries only its own handoff edges; the union across all agents is the synergy map in architecture spec §5.

## Wired edges

- **data-lifecycle ⟷ auth/identity** (the primary pairing). `_sharing`/`_inheritrights` mechanics (this agent's lane) and *who is permitted to act* (auth's lane, via JWT / rights) are the same wire at different layers. A bulk-restrict operation that turns on rights semantics — the exact shape of the esmuseum consult — must hand off cleanly: this agent owns the *entity mechanics* (what `_sharing`/`_inheritrights` do, how values append, what re-aggregation occurs); auth owns *the identity/permission gate* (whose token, what rights, IP-binding). A question that turns on **who can act** routes to auth; auth defers entity-mechanics back here.

- **data-lifecycle ⟶ schema-design** (advisory handoff). When a question is really about *how the entity-type / reference model is built* — `reference_query`, `add_from`/`default_parent`, the rights-model design — it routes to schema-design. This agent answers what the runtime mechanics *do*; schema-design answers how the structure that produces them *should be designed*.

## Shared cross-check step (all agents)

Every claim this agent labels `backed` has passed the **shared docs + OpenAPI cross-check** before earning the label — the Finn-shaped verifier from the PoC (a claim is verified against both the documentation and the current OpenAPI spec). Docs and OpenAPI can disagree (the date-format and S3-cleanup discrepancies are live examples); a disagreement is itself a gap to report, and where code settles it, the `src` evidence wins (code-beats-docs, spec §3a).

(*FR:Celes*)
