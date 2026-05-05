---
source-agents:
  - team-lead
discovered: 2026-05-02
filed-by: librarian
last-verified: 2026-05-04
status: active
source-files:
  - mitselek/Haapsalu-Suvekool (esl-suvekool team)
source-commits:
  - d0526ee
  - f65fb2a
  - 0e461be
source-issues: []
---

# Operational team archetype

A new team archetype distinct from research, development, and XP-pipeline teams. Recognized by four co-occurring characteristics — any one alone does not constitute the archetype, but the cluster does.

## The four characteristics

1. **No TDD pipeline.** No RED / GREEN / PURPLE roles. The team does not produce code that needs test-gated landing.
2. **Succession-framing as first-class concern.** Every artifact is designed for *the next holder of the role*, not the current one. Documentation, processes, decisions are all written with role-handoff in mind from day one — not retrofitted at handoff time.
3. **Low-volume cadence.** 1-3 sessions per week, not daily. The team accumulates work in punctuated bursts, with quiescent periods between.
4. **Persistent roster, episodic sessions.** The team is long-running (multi-month, potentially multi-year) but session activity is sparse. Roster stability is the load-bearing property; session frequency is not.

The archetype is recognized as a cluster: the four together describe a coherent operational mode that the existing research / development / XP-pipeline taxonomy did not cover.

## Mission framing pattern

Operational teams characteristically frame their mission as **"load-shed [primary stakeholder] via [PO] as liaison, succession-readiness baked in"** — not as "help [PO] organise." The shift from supporting-the-current-holder to preparing-for-the-next-holder is the defining mission orientation.

This framing has two practical consequences:

- Artifacts are written for an audience that does not yet exist (the future role-holder). Current-holder needs are met as a side effect, not as the primary design target.
- Decisions are evaluated against transferability, not against current-task efficiency. A faster path that produces non-transferable artifacts is the wrong choice for an operational team even when it is the right choice for a research or development team.

## First instance

`mitselek/Haapsalu-Suvekool` esl-suvekool team — Tobi, Lyyd, Saar, Tamp. Four-character roster, all opus-4-7. Designed by Celes, deployed 2026-05-01 to 2026-05-02.

PO-locked mission framing: load-shed primary stakeholder (announced board departure ~Jan-Apr 2027) via PO as liaison; every artifact designed for the next holder of the role. The four-characteristic cluster surfaced empirically during Celes's design pass — the team does not fit research, does not fit development, does not fit XP-pipeline, and the differences are not "missing parts" of those archetypes but a different shape entirely.

## Why the archetype matters

The taxonomy gap was invisible until a concrete instance forced it. With three archetypes and a fourth team that fit none, the choice was either:

- (a) Force-fit the team into the closest existing archetype (research, given the absence of TDD), accepting that several team properties are documented as "exceptions" rather than as positive features.
- (b) Recognize the new archetype, name its characteristics, and let future operational teams instantiate against the cluster directly.

Option (b) was taken. Force-fitting under (a) would have produced confused tooling expectations (e.g., research-team Librarian assumptions don't apply cleanly to a team with succession as first-class).

## Promotion trigger

n=1, watch posture. The promotion trigger is a **second similar team** (non-code, multi-month, persistent roster, succession-framed) requesting the same shape. When that happens:

- If the second team's design converges on the same four characteristics independently, the archetype is confirmed and may earn topic-file space (currently the archetype is documented only in this wiki entry and Celes's design notes).
- If the second team's design diverges in one or more characteristics, the divergence localizes which characteristic is load-bearing for the archetype and which is contingent on Haapsalu-Suvekool specifics.

Until n=2, the archetype is a candidate, not a confirmed addition to the taxonomy.

## Confidence

Speculative — single-instance archetype claim. The team-shape cluster is internally coherent but has not been independently rediscovered.

## Related

- [`multi-repo-xp-composition.md`](multi-repo-xp-composition.md) — sibling pattern at team-shape level (XP archetype with composition variation)
- [`cathedral-trigger-quality-teams.md`](cathedral-trigger-quality-teams.md) — sibling pattern for a different archetype-trigger condition
- [`model-tiering-by-consequence.md`](model-tiering-by-consequence.md) — references team archetypes; operational-team archetype is not yet listed in its archetype-cost table (would require model-tier review on n=2)

(*FR:Callimachus*)
