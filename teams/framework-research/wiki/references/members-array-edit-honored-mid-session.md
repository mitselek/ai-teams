---
source-agents:
  - aeneas
  - callimachus
source-team: framework-research + apex-research
discovered: 2026-05-14
filed-by: librarian
last-verified: 2026-05-14
status: active
confidence: high
source-files: []
source-commits: []
source-issues:
  - "66"
ttl: 2026-11-14
related:
  - references/inbox-file-write-as-wake-mechanism.md
  - references/inbox-slot-vs-members-validation-asymmetry.md
  - patterns/ghost-member-as-universal-integration-surface.md
  - patterns/service-team-topology.md
  - patterns/substrate-invariant-mismatch.md
amendments:
  - date: 2026-05-19
    note: "Third-leg sibling filed (`references/inbox-slot-vs-members-validation-asymmetry.md`, Brunel S31 PoC). Companion-pair becomes three-way substrate-property family: registration (this entry) + wake + lifecycle-asymmetry."
---

# `members[]` Edits Are Honored Mid-Session

**Substrate fact** (verified n=2 cross-substrate, 2026-05-14): the Claude Code multi-agent harness honors plain JSON file edits to `~/.claude/teams/<team>/config.json` `members[]` on the next `SendMessage` validation -- without restart, without `TeamCreate`/`TeamDelete` dance, without any special "runtime-write API." Mid-session ghost-member registration is genuinely **O(file-edit)**: append an entry, then `SendMessage(to="<new-name>", ...)` succeeds on the very next call.

This entry is the **companion-pair sibling** to [`inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md). The wake-mechanism entry names what triggers a recipient to read a message; this entry names what makes a name addressable for dispatch in the first place. Together they cover the two substrate-level lifecycle stages a ghost member depends on: **registration** (this entry) and **wake** (sibling).

## Empirical basis -- n=2 cross-substrate

Both instances observed on 2026-05-14 within a six-minute window, independently:

**Instance 1 -- framework-research, Windows-Git-Bash substrate** (Aen, ~09:42):

- Added `apex-lead-ghost` entry via plain `Edit` tool to `~/.claude/teams/framework-research/config.json` `members[]`.
- Immediately issued `SendMessage(to="apex-lead-ghost", ...)`.
- Validation succeeded on first attempt; daemon forwarded to apex's team-lead inbox. Round-trip validated.

**Instance 2 -- apex-research, Linux/Docker substrate** (Schliemann, ~09:48):

- Added `fr-lead-ghost` entry via plain Python file edit + `json.dump` to `~/.claude/teams/apex-research/config.json` `members[]`.
- Immediately issued `SendMessage(to="fr-lead-ghost", ...)`.
- Validation succeeded on first attempt; ghost-bridge (FR side) picked up the forward.

In both instances: zero special harness API call, zero `TeamDelete`/`TeamCreate` cycle, zero session restart. The harness re-reads `members[]` from disk on each `SendMessage` validation, so a fresh edit becomes effective on the next call.

This **closes** OQ #2 in [`patterns/ghost-member-as-universal-integration-surface.md`](../patterns/ghost-member-as-universal-integration-surface.md) ("member-list cache window -- small write-vs-validate race theoretically possible") from theoretical-race-concern to verified-honored at n=2 across two substrates with no race observed.

## Substrate scope

**Verified on:** Windows-Git-Bash (framework-research host) and Linux/Docker (apex-research host).

**Deployment-target match:** Linux/Ubuntu is the production substrate (per PO clarification 2026-05-12, see [`inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md) §Substrate scope). Instance 2 verifies the property on the deployment substrate directly. Instance 1 on Windows-Git-Bash is curatorial-grade information; Windows is not a deployment target.

**Expected to behave identically on:** macOS (POSIX `read()` semantics, atomic-rename or O_TRUNC-write both honored on next file-read). Not yet directly observed.

## Operational implication

Mid-session ghost-pair bring-up is **O(file-edit)**, not **O(session-restart)**.

- Adding a new ghost member to a running team requires only an `Edit` (or equivalent) to `config.json` `members[]`. No team teardown, no agent respawn, no harness restart.
- The reverse-direction pair (the matching ghost in the partner team's `config.json`) can be set up in parallel by the partner team without coordinating restart windows.
- A central-messaging-hub design (carried as standing watch from S31 per [`patterns/service-team-topology.md`](../patterns/service-team-topology.md)) can add hub-side ghost representations of new consumer teams on-demand. Library-team architecture per S31 PO decision benefits directly: when a new team comes online, the library team adds a ghost for it via a single file edit.

## Amendment lineage of Finding #8 (RFC #66 discussion)

The substrate property documented here passed through three distinct claims in the RFC #66 thread before reaching the form in this entry:

| Version | Date | Claim | Status after v3 |
|---|---|---|---|
| v1 | S31 (~2026-05-12) | "`TeamCreate` snapshots `members[]` at startup; mid-session `config.json` edits don't propagate." | **Substantively wrong.** No snapshot semantics. |
| v2 | 2026-05-14 ~09:42 (Schliemann) | "A runtime-write API exists, distinct from plain file edit." | **Substantively wrong.** No such API; plain file edit suffices. |
| v3 | 2026-05-14 ~09:46 (Aen), accepted by Schliemann 09:48 | "Plain file edits to `members[]` are honored on demand; no runtime-write API required." | **Verified n=2 cross-substrate.** |

**Lineage axis: [DISPUTE], not refinement-not-contradiction** (Schliemann's framing, 2026-05-14 09:48). Each step finds the prior claim **substantively wrong** about the substrate's behavior, not narrower-scope-wrong or context-conditional. The reader of v1 or v2 would form a load-bearing wrong model of the substrate; v3 is not "v1 with caveats added," it is "v1 was incorrect."

This lineage is preserved in the entry because the wrong intermediate claims may still surface in the historical RFC #66 thread, in S31-era scratchpads, or in PR/issue comments authored under v1 or v2. A reader landing on those older texts needs a single canonical entry that explicitly marks them as superseded. The lineage table is the supersession record.

**Note on dispute-lineage representation in the corpus.** This is the first wiki entry in FR's corpus to carry an explicit dispute-axis amendment lineage (each step contradicting the prior). The closest existing patterns are:

- `relay-to-primary-artifact-fidelity-discipline.md` -- Stage 1 → Stage 2 supersession is **refinement**, not dispute (Stage 1 is correct-as-far-as-it-goes; Stage 2 supersedes with primary evidence).
- `architectural-fact entries: confidence and revision triggers` (in `prompts/callimachus.md`) -- names n+1 sightings as non-strengthening; doesn't address the case where the original claim was substantively wrong.

The lineage table above is the proposed representation. If a second dispute-lineage entry surfaces, that's the trigger to consider whether this representation should be promoted to a wiki-process convention (an explicit "Amendment lineage" section header for entries whose corrections were substantive-disputes rather than refinements). At n=1, this is sketch-grade; the table here is descriptive of this entry's history, not yet prescriptive across the wiki.

## Architectural-fact discipline

This is an **architectural-fact entry** (per FR's `architectural-fact entries: confidence and revision triggers` convention). The substrate is deliberate harness design -- file-system `members[]` validation is intentional, not an empirically discovered accident.

**n+1 sightings of mid-session edits being honored do NOT strengthen this entry.** The mechanism is fully exposed at n=2 cross-substrate; additional reproductions add no new substrate information.

**Revision triggers:**

- Anthropic adds caching to the `members[]` read path with a non-trivial TTL → amend with the cache-window measurement and any race conditions.
- Anthropic introduces a runtime-write API (e.g., `TeamMembers.add`) -- at that point, v3's "plain file edit suffices" claim still holds, but the API may become the preferred path; cross-reference both, do not archive this entry.
- Anthropic changes `members[]` to in-memory authoritative (file edits ignored) → archive this entry; replace with a fix-date reference; immediately impacts ghost-member pattern and service-team topology.

## TTL

**TTL: 2026-11-14** (6 months from filing). Re-verify at expiry: do plain file edits to `members[]` still validate on the next `SendMessage` call? Re-verification is cheap (one edit + one send + one observe).

## What this is NOT

- **Not a recommendation to bypass `TeamCreate`/`TeamDelete` for normal team lifecycle.** Adding/removing ghost members via file edit is the well-trodden mid-session path; tearing down a whole team or starting a fresh one still goes through the harness primitives (per `repo-as-durable-store-teamdelete-as-release-primitive.md` and `teamcreate-in-memory-leadership-survives-clear.md`).
- **Not a substitute for the ghost-pair daemon.** Adding the `members[]` entry makes the name addressable for `SendMessage` validation; the daemon behind the ghost is what carries messages onward. Both halves are required for a working ghost-pair.
- **Not a guarantee of immediate validation under load.** n=2 saw single-edit-then-single-send sequences. Very-fast write-then-send sequences (sub-millisecond) were not stress-tested. The race-window-concern from OQ#2 narrows but does not formally vanish at this confidence level -- it is below the threshold of any observed-or-plausible operational case.

## Related

- [`references/inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md) -- **companion-pair sibling.** The wake-mechanism property covers the recipient-wake stage of message delivery; this entry covers the dispatch-validation stage. Together they articulate the two substrate properties a ghost-pair depends on. Bidirectional cross-link is load-bearing: registration without wake is a dead-letter address; wake without registration has no addressable target.
- [`patterns/ghost-member-as-universal-integration-surface.md`](../patterns/ghost-member-as-universal-integration-surface.md) -- the abstraction this substrate property enables operationally. OQ#2 of that entry closed by the n=2 findings here; confidence upgrade trigger satisfied (first implementation on Linux/Ubuntu deployment substrate).
- [`patterns/service-team-topology.md`](../patterns/service-team-topology.md) -- service-team designs that add per-consumer ghosts on-demand depend directly on this property holding. Library-team architecture (S31 PO decision 2026-05-12) benefits operationally: per-team-Cal ghosts can be added to the central library team at zero-restart cost.
- [`patterns/substrate-invariant-mismatch.md`](../patterns/substrate-invariant-mismatch.md) -- **watch candidate.** If on a future substrate (Anthropic harness change, alternative LLM provider, sandboxed-restricted deployment) `members[]` edits do NOT honor on demand, that becomes a new instance of substrate-invariant mismatch -- the artifact (ghost-pair bring-up script, library-team on-demand provisioning) is self-consistent but the implicit invariant fails. n=2 currently invariant; carry the watch note, not a filing.

## Source

- Joint observation: framework-research (Aeneas, FR team-lead) + apex-research (Schliemann, apex team-lead), 2026-05-14 ~09:42-09:48.
- RFC #66 thread, comment ID 16893428 (S31 substrate-validation discussion that surfaced v1 of Finding #8). <https://github.com/mitselek/ai-teams/issues/66>
- Cross-substrate verification corpus: FR on Windows-Git-Bash + apex on Linux/Docker, parallel-execution within one six-minute window.

(*FR:Callimachus*)
