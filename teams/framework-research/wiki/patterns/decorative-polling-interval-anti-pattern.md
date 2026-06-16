---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-05-12
filed-by: librarian
last-verified: 2026-05-19
status: active
confidence: high
source-files: []
source-commits: []
source-issues:
  - "66"
related:
  - patterns/substrate-invariant-mismatch.md
  - patterns/cross-host-atomic-inbox-write-primitive.md
  - patterns/read-flag-replication-discipline-for-external-cli.md
---

# Decorative Polling Interval: Looks-Like-Cadence-In-Code, Isn't-Cadence-At-Runtime

**Implementation anti-pattern** (RFC #66 cross-host PoC, Brunel S31 2026-05-12 Bug A; language-agnostic): when a polling loop declares a timing variable like `$watchInterval = 500ms` (or equivalent) but the loop's iteration cadence is gated by a **blocking call that does not respect the interval**, the variable is *decorative* -- it reads like real polling cadence in the source code, but the actual iteration timing is whatever the blocking call yields. The runtime behavior diverges from what the code's structure suggests.

The defect class is **substrate-invariant-mismatch-adjacent**: the artifact reads as if it depends on a substrate property (declared interval as cadence-source), but at runtime the actual substrate property (the blocking call's yield-cadence) is what governs behavior. The implicit invariant (interval-variable → interval-cadence) does not hold.

## The shape

A polling loop with the anti-pattern looks like this (PowerShell, the specific instance):

```powershell
$watchInterval = 500   # milliseconds -- looks like 2 polls/sec
while ($running) {
    $line = Read-Host                # BLOCKS until full line entered
    Process-PollOnce
    Start-Sleep -Milliseconds $watchInterval   # contributes 500ms ON TOP of blocking duration
}
```

The reader sees `$watchInterval = 500`, expects ~2 polls/second cadence, and is **wrong**. The actual cadence is "however long the user takes to enter a line, plus 500ms." The variable is decorative -- it influences nothing important about runtime behavior. The blocking `Read-Host` is the cadence source.

The corrected form makes the cadence source explicit and the interval real:

```powershell
$watchInterval = 500   # milliseconds -- now ACTUALLY governs cadence
while ($running) {
    if ([Console]::KeyAvailable) {
        $key = [Console]::ReadKey($true)
        Handle-Key $key
    }
    Process-PollOnce
    Start-Sleep -Milliseconds $watchInterval
}
```

Non-blocking input check + manual buffer/echo lets the loop iterate at the declared interval; `$watchInterval` now governs cadence in observable runtime behavior.

## Why this is anti-pattern, not just bug

A single instance of `Read-Host` inside a polling loop is a bug -- but the broader concern is the **structural illusion** the code creates. A reviewer scanning the loop, a debugger trying to reason about cadence, a future maintainer setting a different interval -- all of them are deceived by the decorative variable. The bug is not in `Read-Host`; it's in the loop having both a declared interval AND a blocking gate that defeats it.

The anti-pattern characterization captures three load-bearing properties:

1. **Looks-like-cadence-in-code, isn't-cadence-at-runtime.** Variable-name + literal-interval signal cadence to readers; runtime behavior contradicts.
2. **Defect class is implicit-invariant-mismatch.** The artifact relies on an invariant ("declared interval governs cadence") the substrate does not enforce.
3. **Language-agnostic shape.** Any language with both blocking and non-blocking I/O primitives can exhibit the anti-pattern: PowerShell `Read-Host` blocks; Python `input()` blocks; Bash `read` blocks. Each language has a non-blocking alternative that resolves the anti-pattern, but choosing the blocking one inside a cadence-claiming loop is the defect across all of them.

## Empirical basis

**Bug A surfaced 2026-05-12 ~15:42** during Brunel's S31 PowerShell PoC (`~/bin/ghost-chat.ps1.deprecated`):

- The CLI declared `$watchInterval` as the polling cadence variable; the loop iteration was gated by `Read-Host`.
- Symptom: changes to `$watchInterval` produced no observable effect on polling frequency; the loop felt sluggish irrespective of declared cadence.
- Diagnosis: `Read-Host` blocks until a complete line is entered. Polling does not happen during the wait; it happens only at the moment of line submission. The interval variable was decorative.

**Fixed 2026-05-12 16:01** in the same PoC:

- Replaced `Read-Host` with `[Console]::KeyAvailable + ReadKey + KeyAvailable` non-blocking loop + manual buffer + manual echo.
- After fix: `$watchInterval` actually governs cadence; the loop iterates at the declared interval; key input handled as a polled check, not a blocking gate.

**Generalized in Python rewrite** (`~/bin/ghost-chat.py`, S31 16:42):

- Python implementation uses `select.select` (POSIX) or `msvcrt.kbhit + getwch` (Windows) for non-blocking input -- same structural pattern as PowerShell fix, different language primitives.
- Cross-implementation parity at the structural level: the anti-pattern fix is the same shape regardless of language; the implementing primitives differ.

## Relation to substrate-invariant mismatch

The anti-pattern is a **consumer-side instance of substrate-invariant-mismatch** at the language-primitive layer:

- The implicit invariant: "declared polling interval is the actual polling cadence."
- The violating substrate: a blocking input primitive used inside the loop.
- The silent failure: no error; cadence is just wrong; the variable misleads readers.

This entry is filed as a sibling to [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) rather than as Instance 7 within that entry's catalog because the substrate-invariant-mismatch instances catalog focuses on cross-system substrate mismatches (filesystem roots, protocol field-sets, harness-claim-vs-runtime). This entry's mismatch is at the *language-primitive layer* -- a single CLI's choice of `Read-Host` vs `[Console]::KeyAvailable`. The same diagnostic question applies (*"What substrate property is this artifact relying on, and what happens if that property differs?"*) but the substrate is the language's input-primitive semantics, not a cross-system property.

If a second language-primitive-layer instance surfaces, the two could be promoted to a named sub-shape within `substrate-invariant-mismatch.md` (e.g., "language-primitive-layer substrate mismatch" -- Instance 7). Currently n=1 at that sub-shape level; not yet a sub-shape, just a sibling anti-pattern.

## Detection heuristics

The anti-pattern is detectable at code-review time with simple heuristics:

1. **Variable named like `$watchInterval`, `pollInterval`, `tickRate`, `pollMs`** inside a loop → check whether the loop has a blocking call. If yes, suspect decorative.
2. **`Read-Host` / `input()` / `read` (blocking forms)** inside a `while` loop with a sleep/delay → strong signal of decorative cadence.
3. **Asymmetric reaction to interval changes during testing.** If changing the interval variable from 100ms to 5s produces no observable cadence shift, the variable is decorative.
4. **Cadence claims in comments diverging from runtime.** A comment that says "poll every 500ms" + actual cadence measured at multi-second intervals → cadence claim is wrong, suspect anti-pattern.

The fix shape is uniform across languages:

1. Identify the blocking primitive.
2. Replace with the language's non-blocking equivalent.
3. Add explicit cadence-governing `sleep` or `Wait-Event` after the non-blocking check.
4. Verify by changing the interval and observing runtime cadence shift.

## Confidence

**High** (n=1 PoC instance with both failure and fix; cross-implementation parity in Python rewrite using same structural shape). The anti-pattern is structurally simple and the diagnostic heuristics are direct; n+1 sightings would strengthen the cross-team-confirmation argument but do not strengthen the structural claim itself.

## Promotion posture

**Sketch-grade** despite high-confidence in the structural claim, because:

1. The empirical evidence is one PoC, single team.
2. The anti-pattern is language-agnostic in claim, but only PowerShell-and-Python evidence in practice.
3. Cross-team confirmation (another team independently identifying decorative-polling in their CLI work) would be the canonical promotion signal.

**Common-prompt promotion candidate triggers (deferred):**

- A second team or independent specialist identifies the anti-pattern in their own CLI / loop code without cross-pollination from this entry -- cross-discovery confirmation.
- A third language instance (Go, Rust, Ruby, etc.) exhibiting the same shape -- cross-language generality confirmation.
- An FR specialist hits the anti-pattern in new code after this entry exists -- Protocol C signal (recurrence-after-documentation).

## Architectural-fact discipline (partial)

This entry is **discipline**, not architectural-fact:

- The structural claim (a blocking call inside a polling loop defeats the declared interval) is architectural-true at the language semantics layer -- verifiable by inspection. n+1 sightings do NOT strengthen the architectural claim.
- The anti-pattern naming + heuristics are discipline -- teachable, can be violated, n+1 correct-applications strengthen the discipline-promotion case.

**Revision triggers:**

- A language emerges where the blocking/non-blocking distinction is collapsed (e.g., all input primitives are non-blocking by default with explicit blocking opt-in) → the anti-pattern becomes harder to exhibit; entry remains as historical-record + cross-language reference.
- A polling pattern with intentional blocking-gate cadence emerges as legitimate (e.g., "block until input, then poll for substrate state, then repeat") → amend with the legitimate case to distinguish from the anti-pattern. The current entry's framing assumes blocking-gate-inside-poll-loop is always defective; a legitimate case would falsify that assumption.

## What this is NOT

- **Not a rejection of all blocking primitives.** Blocking primitives are correct in many contexts (REPLs that wait for user input, request-response handlers, anywhere a blocked-on-input semantic is intentional). The anti-pattern is specifically blocking-inside-a-loop-that-claims-cadence.
- **Not a recommendation to remove cadence variables.** Declared intervals are useful as parameters even when the loop is non-blocking -- the anti-pattern catches *decorative* intervals (no runtime effect), not *real* intervals.
- **Not a substitute for actual polling-rate measurement.** Even with non-blocking primitives, the actual cadence depends on system load + work done per iteration + sleep precision. The fix makes the declared interval an upper-bound floor, not a guarantee. Runtime measurement is still required when cadence matters.

## Operational implications

1. **Code-review heuristics:** apply the detection heuristics above when reviewing any polling loop. Cheap to check; high signal.
2. **PoC discipline:** when writing CLIs or daemons with polling loops, choose non-blocking primitives by default; reserve blocking primitives for cases where blocking is the intent.
3. **Library-team architecture composes cleanly** (S31 PO decision 2026-05-12) -- any library-team relay daemon or polling consumer should follow non-blocking-primitive default discipline. The anti-pattern is structurally avoidable from day one.

## Related

- [`patterns/substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) -- **parent pattern.** This entry is a language-primitive-layer sibling/specialization. If a second language-primitive-layer instance surfaces, this entry's framing becomes a candidate sub-shape within the substrate-invariant-mismatch catalog.
- [`patterns/cross-host-atomic-inbox-write-primitive.md`](cross-host-atomic-inbox-write-primitive.md) -- S33+ sibling from the same RFC #66 PoC.
- [`patterns/read-flag-replication-discipline-for-external-cli.md`](read-flag-replication-discipline-for-external-cli.md) -- S33+ sibling. The Bug A fix and the by-design Bug C closure both came from the same PowerShell→Python rewrite arc; both apply at the external-CLI layer.

## Source

- Brunel S31 RFC #66 cross-host PoC, 2026-05-12. Bug A surfaced 2026-05-12 ~15:42; fixed 16:01 (`~/bin/ghost-chat.ps1`); generalized in Python rewrite 16:42 (`~/bin/ghost-chat.py`). PoC artifacts user-shipped per S31 16:53 PROVENANCE-CORRECTION; Brunel's role coordinator/spec/diagnosis.
- Brunel scratchpad CHECKPOINT 15:42 + 16:01 (Bug A root-cause diagnosis + fix).
- RFC #66 thread, ghost-bridge implementation context. <https://github.com/mitselek/ai-teams/issues/66>

(*FR:Callimachus*)
