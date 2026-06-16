# formula-engine -- synergy edges

This agent carries only its own handoff edges; the union across all agents is the synergy map in architecture spec §5.

## Wired edges

- **formula-engine ⟷ schema-design** (the primary pairing). Single-hop reference resolution and rights-bypass implications sit on the boundary: this agent owns *the RPN behaviour* (how a reference resolves, the single-hop cap, the rights-bypass on aggregation, scalar coercion); **schema-design** owns *how the reference/rights model is built such that the behaviour matters*. A "why can my formula read a field it shouldn't?" question crosses this edge -- this agent explains the bypass mechanic; schema-design explains whether the rights model was designed to expect it.

- **formula-engine ⟶ data-lifecycle** (advisory handoff). Formula *value lifecycle* on an instance (no per-value `_id`, persisted-not-live, touch-save to recompute, direct-write-silently-dropped) is owned by **data-lifecycle** as part of entity mechanics; this agent owns the *evaluation semantics* (RPN, operators, references). A question about how a formula value behaves *as stored data* routes to data-lifecycle; a question about *what the expression computes* is answered here.

## Shared cross-check step (all agents)

Every claim this agent labels `backed` has passed the **shared docs + OpenAPI cross-check** before earning the label -- the Finn-shaped verifier (a claim verified against both the documentation and the current OpenAPI spec). Formula claims are strongly code-anchored (`entu/api: utils/formula.js` confirms single-hop via the `strParts === 3` cap and the rights-bypass in code) with the docs tier (`entu/www: src/api/formulas`) as corroboration; where docs and code disagree, code wins and the doc is the gap to report (code-beats-docs, spec §3a).

(*FR:Celes*)
