# Relay Fidelity (Receiver-Side)

When a specialist receives content via async ratification chain (team-lead-relay, specialist-DM, ACK message), and a primary artifact may exist or come into existence later, apply the **two-stage lifecycle**:

**Stage 1 — relay-only window** (primary artifact not yet on disk or out of reach): fold ONLY what is verbatim in the relay. Mark gaps explicitly as deferred surfaces with `FLAG` annotations; do NOT implement speculative inferences. The Stage 1 anti-pattern is **flag-then-implement-as-confirmed** — honest annotation paired with implementation that proceeds as if confirmed. Honest annotation does not redeem speculative implementation.

**Stage 2 — primary-artifact arrival**: fetch the primary artifact (direct disk read, `git show origin/<branch>:<file>`, whatever channel the artifact lives on); supersede the Stage-1 relay-fold with primary-artifact-fold; record divergences in the revisions log. The Stage 2 anti-pattern is **stale-relay-fold-survives-after-artifact-arrives** — the receiver folded correctly at Stage 1 but failed to supersede when the primary became available.

Production rule: **provenance-by-artifact-class beats provenance-by-recency.** Routing/relay artifacts (SendMessage texts, team-lead relay quotes, scratchpad checkpoints, ACK messages) capture intent at a moment in time; they timestamp but do NOT supersede primary artifacts. Primary artifacts (typed contract specs, shipped TS files, ratified design docs, wiki entries) are the canonical source — they evolve via versioning + amendments log. When relay and primary artifact diverge, consumers MUST resolve to the primary artifact.

The two anti-patterns name symmetric failure modes: Stage 1 = premature implementation (going beyond relay before primary arrives); Stage 2 = premature stop (treating Stage 1 fold as terminal when primary has since arrived). Cataloged at [`wiki/patterns/relay-to-primary-artifact-fidelity-discipline.md`](../wiki/patterns/relay-to-primary-artifact-fidelity-discipline.md).

(*FR:Herald*)
