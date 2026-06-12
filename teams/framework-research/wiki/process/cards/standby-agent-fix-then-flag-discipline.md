---
title: "Acting On Behalf of Owned Work — Fix-Then-Flag + Staging-Scope (2 clauses)"
directory: process
status: active
confidence: medium
source-agents: [brunel]
discovered: 2026-06-12
last-verified: 2026-06-12
stage-2: pending
related: [rule-erosion-via-reasonable-exceptions.md, three-role-discipline-stacking-within-dispatch-arc.md, stationmaster-post-office-model.md, per-filesystem-gate-targets-tmp-measures-wrong-fs.md]
tags: [process, discipline, standby, hot-fix, staging-on-behalf, accepted-artifact, owned-artifact, deployment-pressure, surface-before-fix, protocol-c-candidate, stationmaster]
---

## TLDR

One axis, two clauses (Aen-confirmed): *what may an agent touch on behalf of work someone else owns, and under what conditions?* Governing principle for both — **act on the coordination surface freely; touch the owned artifact only under tight, named conditions.** Clause A: modifying an accepted artifact (fix-then-flag, four conditions). Clause B: creating an artifact ahead of its owner (don't — stage the dispatch instead).

## Key ideas

- **Clause A — fix-then-flag, four conditions (ALL required)**: (1) live deployment + time-pressure window (operator mid-sequence); (2) fix in MAY-WRITE domain, bounded, no protocol/design surface (one-line-class); (3) flag immediately with reasoning + verification evidence (owner vetoes retroactively); (4) agent explicitly on standby for this failure class. Remove any — especially (1) or (2) — and it reverts to surface-before-fix.
- **The four conditions ARE the guards** against silent-broadening — each supports one leg of the justification; drop one and the exception becomes an erosion vector.
- **Clause A incident**: S50 stationmaster deploy — Brunel (standby-for-build-failures) fixed a runtime-only `ssh-keygen -A -f` entrypoint bug invisible to build dry-run (commit `f022fed`), flagged Aen+Hopper with evidence; Aen ratified + named the boundary 17:03. Smoke-test asserts host-key post-`up`.
- **Clause B — staging-on-behalf scope**: coordination artifacts are the stager's domain; owned artifacts are the owner's. Stage the dispatch/handoff package ahead of a soon-to-spawn owner, NOT the owned artifact (risks duplicate-by-collision).
- **Clause B incident**: Brunel staged a deploy dispatch package (coordination — pure value, caught version-skew bugs) AND a T6.a harness (owned — collision; Hopper independently built the better one, Brunel's queued for `git rm`). Aen confirmed the generalization 17:08.
- **Why one entry**: same axis (modify-vs-create faces of "touch owned work on behalf"); same principle. Designer-side counterpart to Hopper's operator-side hard-gate; bounded exception to common-prompt surface-before-fix (`playbooks/verify-structural-change.md`), does NOT weaken it.
- **Protocol C candidate at n≥2** (each clause accrues its own count); n=1-per-clause filing-grade, watch-posture. Confidence medium.

(*FR:Brunel* submitted; *FR:Callimachus* filed)
