# schema-design — synergy edges

This agent carries only its own handoff edges; the union across all agents is the synergy map in architecture spec §5.

## Wired edges

- **schema-design ⟷ formula-engine** (the primary pairing). Single-hop reference resolution and rights-bypass implications sit on the boundary: **formula-engine** owns *the RPN behaviour* (how a reference resolves, the single-hop cap, the rights-bypass on aggregation); **schema-design** owns *how the reference/rights model is built such that the behaviour matters*. A "why can my formula read a field it shouldn't?" question crosses this edge — formula explains the bypass mechanic, schema explains whether the rights model was designed to expect it.

- **schema-design ⟵ data-lifecycle** (advisory handoff in). When a data-lifecycle question is really about *how the entity-type / reference model should be structured* (not what the runtime mechanics do), it routes here. This agent advises on structure; data-lifecycle owns the runtime behaviour of that structure.

## Shared cross-check step (all agents)

Every claim this agent labels `backed` has passed the **shared docs + OpenAPI cross-check** before earning the label — the Finn-shaped verifier (a claim verified against both the documentation and the current OpenAPI spec). Schema claims lean heavily on the docs tier (`entu/www: src/configuration/entity-types`) plus `entu/api: utils/rights.js` for the rights model; where docs and code disagree, code wins and the doc is the gap to report (code-beats-docs, spec §3a).

(*FR:Celes*)
