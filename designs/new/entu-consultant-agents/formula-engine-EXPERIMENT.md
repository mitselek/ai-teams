# Formula-engine persona A/B — experiment design

**Status:** instrumented, not yet run. Internal worked-draft (entu/api #42). (*FR:Celes*)

## Hypothesis (architecture spec §2.4)

A persona anchor famed for **domain-fact authority** induces more index-bypass / fabrication than one famed for **method/posture** — because the domain-fact persona's celebrity *invites* the model to answer from training-data knowledge instead of citing the competency index. (This is the spec's "risky anchor" claim, and the generalization of the Anderson fabricated-regulatory-links failure.)

## The two variants

| | `formula-engine-harrison/` | `formula-engine-hamblin/` |
|---|---|---|
| **Figure** | John Harrison (marine chronometer maker) | C. L. Hamblin (introduced RPN to computing; first stack-RPN machine) |
| **Fame is in** | precision-mechanism *method* (control) | RPN / stack postfix *evaluation* — the domain's exact subject (treatment) |
| **Anchor type (spec §2.4)** | method-famous (safe) | domain-fact-famous (risky) |

## What is held constant (the control)

Everything except the persona is **identical** between the two directories:

- `prompt.md` — identical (byte-for-byte).
- `synergy.md` — identical (byte-for-byte).
- `competencies.yaml` — identical; **claims deferred for both**, so the comparison measures the persona effect, not differences in claim coverage. When populated, both draw the same `search_claims(domain="formula")` slice.
- **The guardrail is the *standard* text in both `persona.md` files — held identical, deliberately NOT doubled for Hamblin.** Spec §2.4 prescribes stating the guardrail "twice as loudly" for risky anchors; that prescription is *suspended here on purpose*, because holding the guardrail constant is the experiment's control. The persona is the **sole variable**.

## What differs (the sole variable)

Only `persona.md` — the anchored figure and its lore. Crucially, **Hamblin is cast AS his genuine RPN/stack-evaluation fame, not sanitized to dialectics-only.** That domain-fact fame *is* the treatment under test; sanitizing it would void the experiment. Harrison is the clean method-famous control.

## The comparison to run later

Dispatch both variants on the same set of Entu formula questions (once `competencies.yaml` is populated from the index), including questions where Entu's engine *differs from generic RPN* (single-hop cap, implicit CONCAT, the rights-bypass, eventual-consistency) — i.e. cases where general RPN knowledge would mislead. Measure:

1. **Index-citation rate** — does each variant cite a `competencies.yaml` claim + evidence ref for every domain assertion?
2. **Fabrication / bypass** — does either answer an Entu-specific particular from general RPN knowledge instead of the index? (Hamblin is the at-risk arm.)
3. **`[GAP]` honesty** — when the index lacks a backing claim, does each variant flag the gap rather than fill it from fame?

**Prediction (if the hypothesis holds):** Hamblin shows more index-bypass / fewer citations / more confident-but-unbacked answers on the Entu-specific-vs-generic-RPN questions; Harrison stays index-bound. **If the guardrail holds equally for both**, that is evidence the standard guardrail is sufficient even for a domain-fact-famous anchor — which would *relax* spec §2.4's "state it twice" prescription. Either outcome is a real result for the framework.

## Why this is worth instrumenting now

Casting both at draft time (claims deferred, guardrail constant) makes the A/B runnable later at near-zero extra cost, and the design decision (method-famous vs domain-famous anchors) is load-bearing for every future persona the guild casts. This is the "instrumented for comparison" the PO asked for.
