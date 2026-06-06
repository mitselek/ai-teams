# Draft #42 proposal comment (team-lead posts — Celes does not touch external repos)

> Paste target: a comment on [entu/api #42](https://github.com/entu/api/issues/42). This is the *digestible* form; the full design is the internal doc `docs/2026-06-06-entu-consultant-agents-architecture.md`. Trim/adjust voice to taste before posting.

---

We took the idea in this issue and designed the **contract** for it — the architecture and spec, not yet populated agents. Sharing it here for a sanity check before anyone builds. Three things shaped the design:

## 1. The spine is a competency *index*, not smart prompts

Every agent's domain knowledge lives in a queryable, diffable **competency index** — one file per claim, each claim a single verifiable assertion with typed evidence (`docs` / `openapi` / `src` / `probe`), a verification record, and a `confidence` grade (`backed` / `partial` / `unverified`). The agent prompts are *thin consumers* that query the index; they embed no facts. Why this way:

- **Auditable before hiring** — you can read `agents/competency-index/auth/` and grep `confidence: unverified` to see exactly where an agent is honest about not-knowing, *before* trusting it. Trust is a property of the index, not of opaque weights.
- **It ages on posture, not content** — when Entu changes, you fix one claim file; no agent prompt edits. A claim corrected by one PR is corrected for every agent on its next query.
- **`confidence` drives the runtime label deterministically** — the label you see on an answer is a function of what evidence exists, not the agent's self-assessment.

## 2. The gap loop is a signal producer — structured, evidence-backed reports

The differentiator from this issue, kept and sharpened: when an agent must reach past its backed knowledge, it (a) labels the claim `[GAP]` in its output, and (b) **files a structured, evidence-backed gap report** — the missing or contested fact, the evidence it did find, and a suggested fix *as content* — through the standard channel (an issue, by default). The report is written to be easy to act on; **acting on it is yours.** The agent's job is to surface, with evidence, exactly what the docs should say and don't — not to push the change through your repo (which it often won't have rights to do anyway). A PR is a fine *option* when it's the natural artifact, but it's never a requirement: the value is the report's quality — evidence plus a suggested fix — not the channel it arrives on. The improvement is driven by real integrator need, not by guessing what to document.

And the flip side, for the harder case: **when a claim's evidence disagrees and only you can settle it, you answer once and your answer becomes the *apex, top-tier* backing in the index** — a maintainer-authoritative datum that outranks docs, code-reads, and probes on any conflict, recorded for every agent permanently. Your prioritized signal flows *in* as clean, evidence-backed reports; your authoritative answers flow *out* to the whole roster at once. One reply from you upgrades every agent.

## 3. A persona anchor for cheap posture — with a hard wall

Each agent is anchored to a well-known figure (chosen for *method/posture* — meticulous, probe-driven — not domain-fact fame) so the prompt borrows personality cheaply from the model's training data. **The hard guardrail:** a persona supplies posture and voice, **never facts**. Every domain claim cites the index; no claim is ever justified by "the persona would know." We learned this the hard way — a domain-famous persona once fabricated regulatory citations precisely because its fame *invited* answering from training data. Posture from the persona, correctness from the index, a wall between them.

## This isn't hypothetical — it's the esmuseum consult, productized

The [esmuseum bulk-restrict consult](https://github.com/mitselek/esmuseum-map-app/issues/41) is the lived template. Pérotin live-probed `_sharing` and produced a truth table; Finn verified every answer against your OpenAPI spec; the consult corrected a wrong mental model (`_sharing` doesn't post-creation-inherit; absent → default `private`) that would have flawed the 6,352-entity op — which then ran serially with **0 errors**. It already produced [entu/www #11](https://github.com/entu/www/pull/11), [#13](https://github.com/entu/www/pull/13), and [entu/api #41](https://github.com/entu/api/issues/41). The architecture just removes the manual coordination so the pattern dispatches on demand.

Grounding it in your actual repo surfaced a couple of things worth noting regardless of this proposal:

- **`src/api/...` in this issue is the docs site (entu/www), not code** — your code is Nitro file-routed (`routes/`, `utils/`). Evidence refs have to route by kind.
- **JWT lifetime is contradicted inside entu/api itself** — `openapi.get.js` says 48h, `auth/*.get.js` say 12h. (A perfect worked example of a `[GAP]` the agent would flag and PR.)
- **`_sharing` has a subtle two-part truth** — a create-time, escalation-only copy *and* no post-creation propagation. Both clauses matter; stating only one reproduces a subtler form of the misconception the consult corrected.

## A few open questions for you (Argo)

1. **Where should `agents/` live** — `entu/api` (next to code), `entu/www` (next to the docs the gap reports target), or a dedicated repo?
2. **Who triages the gap reports, and how fast?** Honest dependency, not a workaround: the agents produce evidence-backed reports; the flywheel only compounds when someone on your side acts on them.
3. **MCP backend now or later?** Start as flat diffable files (auditable by reading) and add a query layer when volume justifies, or stand it up day one?

If this shape is interesting, our next step would be a PR with the four agents (data-lifecycle / auth / formula / schema) populated from the index — data-lifecycle is already backed by the esmuseum probe results.

(*FR:Celes*)
