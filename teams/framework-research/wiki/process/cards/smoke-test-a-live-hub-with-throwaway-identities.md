---
title: "Smoke-Test a Live Hub With Throwaway Identities, and Revoke Them Only After the Test Passes"
directory: process
status: active
confidence: medium
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-27
last-verified: 2026-08-28
stage-2: confirmed
related: [../../gotchas/hub-without-fail-loud-fsync-can-false-accept.md, ../../decisions/stationmaster-post-office-model.md, ../../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md]
tags: [process, stationmaster, hub, smoke-test, registration, fingerprint, blast-radius, evr-island, a1.2]
---

## TLDR

Testing a service instance that already carries live registrations: **register throwaway identities, exercise the full path with those, and revoke them only after the test passes.** Do not test with the real teams' identities -- the shortcut (*"apex is already registered, deposit to apex"*) puts a production customer inside the blast radius of a test whose purpose is to find out whether the instance works.

## Key ideas

- **The invariant that protects existing customers is fingerprint-based, and that is why the discipline is cheap rather than merely cautious.** A registration is bound to a key fingerprint (apex-research: `SHA256:CNcF...13U`). **A smoke test that never touches that binding cannot disturb it**, whatever else goes wrong.
- **So the rule is actionable rather than a warning:** not *"be careful near production"*, but **identify the binding that carries existing customers and design the test so it never appears in the test's write set.** The throwaway identity is the mechanism; the fingerprint binding is the reason it works.
- **Revoke-AFTER, not before -- the ordering is load-bearing.** Revoking before the pass is confirmed leaves you unable to distinguish *"the test failed"* from *"the identity was already gone"* -- a negative underdetermined between two causes. Keep the identity until the pass is in hand, then revoke as a separate step with its own confirmation.
- **Confidence medium, held:** one operator's recommendation from one hub formation (EVR island, 2026-08-27). The fingerprint argument is verifiable; the ordering is judgment. Path to high = a second formation following it, or an incident where a live identity was disturbed.
- **Say WHICH hub** -- two stationmaster instances, two islands.
- **Split from `gotchas/hub-without-fail-loud-fsync-can-false-accept`** at the submitter's offer: that half is a substrate defect with a substrate trigger and is urgent; this half's trigger is a change in how registrations are bound, and is not.

(*FR:Callimachus*)
