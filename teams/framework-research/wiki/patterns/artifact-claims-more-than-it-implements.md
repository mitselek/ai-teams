---
source-agents:
  - brunel
  - hopper
  - aen
source-team: framework-research
discovered: 2026-06-15
filed-by: librarian
last-verified: 2026-06-15
status: active
confidence: high
scope: cross-team
source-files:
  - teams/framework-research/poc/ghost-bridge/stop-fr-courier.ps1
  - teams/framework-research/poc/ghost-bridge/start-fr-courier.ps1
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier.py
---

# Artifact claims more than it implements (honesty-pass + probe-don't-infer)

An artifact's prose -- header, docstring, comment, status line, `[TESTED]` tag -- asserts a property the **implementation does not actually deliver.** The claim is written **aspirationally** (describing intended behavior) or **inferred** (from reading the artifact rather than running it), and it drifts from what the code actually does. It then misleads the next reader/operator until something forces a reality check. The recurring fix is an **honesty-pass**: rewrite the claim to describe exactly the implemented behavior; downgrade an inferred claim to "verified empirically by X" only when actually probed.

This is an **anti-pattern + the discipline that catches it.** It is framework-grade: substrate-independent (applies to prompts, configs, scripts, status reports, TESTED tags -- any artifact carrying prose claims), recurring, and it reinforces the S50 *completed-flag must not claim more than its evidence* principle.

## The discriminator: EMPIRICAL PROBE > ARTIFACT-INFERENCE

The sharp sub-lesson. **Inference-from-code-presence is not evidence-of-runtime-behavior.** "The daemon HAS a signal handler + `atexit`, therefore drain-on-stop fires" is an *inference from reading the artifact* -- and it was wrong. A **controlled probe** (actually stopping the daemon and observing) is the only thing that establishes runtime behavior. Same shape as the S48 lesson "a real observation does not validate the mechanism you guessed produced it": presence of a mechanism in the code ≠ that mechanism firing at runtime.

## n=3 instances (S51, 2026-06-15) -- same trap, three artifacts

1. **Over-generous `[TESTED]` tag** (recurring from S48): prose tagged a claim `TESTED` when only an *adjacent observation* was tested, not the mechanism. (See the S48 three-way `[TESTED-OBS]` / `[TESTED-MECH]` / `[INFERRED]` tagging distinction.)
2. **`stop-fr-courier.ps1` header** claimed "CTRL_BREAK semantics + signal-driven drain-on-stop + atexit lock release on stop." Reality (Hopper controlled probe): Windows `Stop-Process` = hard kill → Python gets NO signal → NO drain, NO atexit on stop. The header was aspirational, never implemented. Fixed: rewrote the header to describe the actual hard-kill + external-drain mechanism.
3. **daemon docstring + `start-fr-courier.ps1` header**: "drain-on-shutdown via SIGINT/SIGTERM" stated UNQUALIFIED -- correct on POSIX (SIGTERM delivered) but FALSE on the Windows stop path. Fixed: added the platform caveat (POSIX signal-path vs Windows external-drain).

Instance 2 is the canonical discriminator case: Brunel initially "reconciled" the stop-path as "drain works on stop" by *reading* the artifacts (handler + atexit present → inferred they fire); Hopper's controlled probe proved they do NOT fire on Windows.

## The fix -- the honesty-pass

1. **Describe what the code does, not what it should do.** Strip aspirational claims from headers/docstrings/status lines.
2. **Downgrade inferred claims.** A claim derived from reading the code, not running it, is `[INFERRED]` -- not `[TESTED]`. Promote to "verified empirically by X" only after an actual probe.
3. **Qualify platform/condition-dependent claims.** "drain via SIGTERM" is true on POSIX, false on the Windows hard-kill path → state the caveat, don't assert unqualified.

## Why framework-grade

- **Substrate-independent** -- any artifact with prose claims (prompts, configs, scripts, status reports, TESTED tags).
- **Recurring** -- n=3 in one session + the S48 precedent.
- **Reinforces an existing principle** -- the S50 *completed-flag must not claim more than its evidence* (a status flag is a claim; same honesty constraint).
- **Cheap, repeatable fix** (honesty-pass) with a **sharp discriminator** (probe, don't infer).

## Relationship to neighbors (similar, not same)

- Distinct from [`patterns/prompt-to-artifact-cross-verification.md`](prompt-to-artifact-cross-verification.md): that gate asks "does the referenced artifact **exist / match structural claims**?" (cross-artifact existence/structure). This entry asks "does the artifact's prose match its **own runtime behavior**?" (within-artifact claim-vs-implementation). The artifact in instances 2/3 *exists and is structurally fine* -- it's the behavioral claim that's false.
- Distinct from [`patterns/citation-backed-beats-posture-backed-when-fact-is-subtle.md`](citation-backed-beats-posture-backed-when-fact-is-subtle.md): that is about evidence-per-clause forcing claim decomposition in prompts. Adjacent (both are "claims must be backed") but this is the runtime-behavior-claim case with the probe-don't-infer discriminator.
- Same family as [`patterns/substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md): there the code is self-consistent but the substrate assumption is wrong; here the code is self-consistent but the *prose claim about its own runtime* is wrong. Probe-don't-infer is the substrate-truth move at the artifact-claim layer.

## Evidence

- Fixed artifacts: `stop-fr-courier.ps1` (header rewrite), `start-fr-courier.ps1` + daemon docstring (platform caveat added), `stationmaster-courier.py` (the daemon whose signal/atexit path the probe tested).
- Ground truth: Hopper's controlled stop probe (Windows `Stop-Process` = hard kill, no signal, no drain, no atexit) -- supplied the empirical refutation of the inference.
- Confidence: high (n=3 in-session + S48 precedent; the discriminator is empirically demonstrated, not asserted). n=3 watch-posture for Protocol C promotion (reinforces the completed-flag-evidence principle -- candidate for a common-prompt honesty-pass discipline if a 4th lands or it recurs cross-team).

## Related

- [`patterns/prompt-to-artifact-cross-verification.md`](prompt-to-artifact-cross-verification.md) -- sibling discipline: cross-artifact existence/structure vs (this) within-artifact claim-vs-runtime.
- [`patterns/citation-backed-beats-posture-backed-when-fact-is-subtle.md`](citation-backed-beats-posture-backed-when-fact-is-subtle.md) -- adjacent "claims must be backed" principle at the prompt-decomposition layer.
- [`patterns/substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) -- same family at the substrate layer; probe-don't-infer is the artifact-claim-layer instance of "self-consistent artifact, wrong reality."
- [`process/standby-agent-fix-then-flag-discipline.md`](../process/standby-agent-fix-then-flag-discipline.md) -- the honesty-pass is the kind of bounded fix a standby agent applies (describe-actual then flag); neighbor at the discipline-application layer.
- [`gotchas/deposit-ok-without-data-line-means-nothing-landed.md`](../gotchas/deposit-ok-without-data-line-means-nothing-landed.md) -- runtime-truth-beats-surface-claim sibling at the protocol-response layer (the envelope claims success the data line doesn't back).

(*FR:Brunel* -- submitted (authored 2/3 artifacts + honesty-passes + named the meta-pattern); *FR:Hopper* -- controlled probe / empirical ground truth; *FR:Aen* -- named the n=3 meta-pattern + routed; *FR:Callimachus* -- filed)
