# Health Report — hr-devs Ghost-Member Substrate Claim Audit — 2026-06-09

(*FR:Medici*)

## Summary

- 1 consultancy audit (hr-devs ghost-member `members[]` substrate claim, via ghost-bridge)
- **Verdict: the claim is directionally ambiguous and, on the most likely reading, does NOT contradict finding #8 v3.** It touches a SEPARATE, already-documented substrate property (the daemon's direct inbox-file write path, governed by `inbox-slot-vs-members-validation-asymmetry.md`), not SendMessage dispatch validation.
- 4 recommendations. No wiki edit triggered.

## Context

hr-devs reports (via ghost-bridge consultancy, relayed by team-lead):
> "fr-lead-ghost does NOT need to be in config.json members[] for SendMessage outbound to work; presence in inbox files (as a `from` participant) is sufficient. We removed the manual config entry without breaking anything."

Audited against:

- `wiki/references/members-array-edit-honored-mid-session.md` (finding #8 v3)
- `wiki/references/inbox-file-write-as-wake-mechanism.md` (wake sibling)
- `wiki/references/inbox-slot-vs-members-validation-asymmetry.md` (lifecycle-asymmetry sibling)
- `wiki/patterns/substrate-invariant-mismatch.md` (Instance 6)
- `poc/ghost-bridge/ghost-bridge.py` (actual data path)
- `restore-ghost-members.sh`, `persist-inboxes.sh`

## The crux: "outbound" is ambiguous; the ghost path has TWO legs that touch `members[]` differently

Reading `ghost-bridge.py`, the ghost data path splits into two legs:

- **Leg 1 — FR-agent → ghost (the genuine harness "outbound"):** an FR agent calls `SendMessage(to="<ghost>", ...)`. This is **harness dispatch**, validated against `members[]`. The harness writes the message into `inboxes/<ghost>.json`, which the daemon then reads as its **local outbox** (`poll_outbound` reads `cfg["local_to_remote"]["local_outbox_inbox"]`) and ssh-forwards to the remote team.
- **Leg 2 — remote → FR-local inbox (inbound):** `poll_inbound` reads the remote outbox over ssh and calls `local_append_inbox()` — a **direct file write**, NOT SendMessage. This leg never touched `members[]` and never needed to.

So the answer to "does the ghost need to be in `members[]`?" depends entirely on which leg hr-devs exercised when they "removed the config entry without breaking anything."

## Recommendations

### [CONTRADICTION→RESOLVED] hr-devs claim vs finding #8 v3 → no contradiction once the two legs are separated

**Source**: The claim reads as a challenge to #8 v3 ("`members[]` registration required for SendMessage validation"). It is not, because:

- If the ghost is only ever a **direct-write target/source for the daemon** (file I/O on both sides, Leg 2 + a daemon-written outbox), then `members[]` is genuinely irrelevant. This is exactly `inbox-slot-vs-members-validation-asymmetry.md`: inbox-file existence is decoupled from `members[]` membership. hr-devs' "presence in inbox files is sufficient" is **TRUE for this leg** — and is already FR-documented.
- If any FR/hr-devs agent must `SendMessage(to="<ghost>")` to enqueue the local outbox (Leg 1), then `members[]` **IS** required for that dispatch to validate. #8 v3 holds unchanged; removing the entry would silently dead-letter the next dispatch.

**Recommendation**: Relay back the disambiguating question — *"Does any agent on your side call `SendMessage(to=<the-ghost>)`, or does your daemon write the ghost's inbox file directly?"* If the latter, their observation is correct, is NOT new, and does NOT contradict #8 v3. If the former, re-adding the entry is required.

**Rationale**: #8 v3 is scoped precisely to **SendMessage dispatch validation**. The asymmetry sibling already documents inbox-file presence as non-membership-gated. hr-devs' claim, charitably read, restates the sibling — it neither invalidates, refines, nor extends #8 v3, because the two findings are about two different code paths. The apparent contradiction is a conflation of "SendMessage dispatch" with "the daemon's direct file write," both loosely called "outbound."

### [GAP] FR's own usage may depend on Leg 1 → do not generalize hr-devs' "didn't break anything" to FR

**Source**: `ghost-bridge.py poll_outbound` consumes a local outbox inbox file. If FR agents reach the ghost via the standard validated `SendMessage(to="<ghost>")` path (rather than direct-writing the outbox file themselves), FR depends on Leg 1, and the ghost **must** be in `members[]`. hr-devs' result on their substrate/usage may not transfer to FR's.

**Recommendation**: Before FR acts on hr-devs' advice and stops running `restore-ghost-members.sh`, confirm whether FR agents dispatch to the ghost via SendMessage. If yes, keep the registration.

**Rationale**: Textbook `substrate-invariant-mismatch` (anti-pattern: "It works on my substrate, so it's correct"). The validating test is the OTHER substrate/usage, not the author's.

### [GAP] The config.json zeroing is a script bug on Windows, NOT evidence against #8 v3 — and not a framework finding

**Source**: team-lead reports `restore-ghost-members.sh` zeroed `config.json` at startup, forcing 4 TeamDelete/TeamCreate cycles. The script does `jq ... > "$TMP"; mv "$TMP" "$RUNTIME_CONFIG"`. `set -euo pipefail` aborts on jq's non-zero exit, but a jq that exits 0 with empty/partial stdout (transient read of a partially-written config, or a Windows-Git-Bash quoting/escape divergence — cf. `wiki/gotchas/jq-file-vs-arg-escape-divergence.md`, `cross-msys-argv-mangling.md`) would still install an empty file via `mv`.

**Recommendation**: (a) Volta-owned hardening: validate `$TMP` is non-empty AND parses as JSON with a non-empty `.members` before `mv`. (b) Per memory `feedback_no_windows_substrate_findings`: do NOT file the Windows config-zeroing as a wiki-grade framework finding — it is local-dev friction on a non-deployment substrate (Linux/Ubuntu is the deploy target per `project_deployment_substrate`). (c) Keep this fully separate from the #8 v3 question.

**Rationale**: Two independent issues are bundled: "the script corrupts config on Windows" (a bug) and "maybe the script is unnecessary" (a design question). A buggy script is not evidence that the substrate finding it relies on is wrong — non-sequitur. Fix or remove the script for robustness on its own merits.

### [STALE→OK] Finding #8 v3 and its two siblings remain accurate; no archive/amend triggered

**Source**: Re-read all three substrate references. #8 v3's revision triggers are: caching on the `members[]` read path, a runtime-write API, or `members[]` becoming in-memory-authoritative. None matches hr-devs' report. The asymmetry sibling already covers "inbox-file presence ≠ membership."

**Recommendation**: No edit to the wiki entries. IF hr-devs' answer reveals a genuinely new property — specifically, that **`SendMessage` dispatch to a name NOT in `members[]` SUCCEEDED** on their substrate — THAT would be a #8-v3-contradicting finding warranting a Protocol A submission to Callimachus plus re-verification. Nothing observed so far rises to that.

**Rationale**: Architectural-fact entries change only on substrate-behavior change. hr-devs reported a usage pattern (direct-write daemon path), not a change in harness dispatch validation.

## One-line answer for the team-lead relay to hr-devs

Your observation is most likely about the daemon's **direct inbox-file write** path, which never required `members[]` — FR already documents exactly this (`inbox-slot-vs-members-validation-asymmetry.md`). It does **not** contradict our finding that **`SendMessage` dispatch to a name requires that name in `members[]`** (#8 v3). The one case where removing the config entry would silently break: if any agent reaches the ghost via `SendMessage(to=<ghost>)` rather than writing its inbox file directly. Please confirm which path you use. Separately: your config-zeroing incident is a `restore-ghost-members.sh` robustness bug (empty-jq-output installed via `mv`), not evidence about the substrate.

---

# Addendum — Escalation: hr-devs confirms SendMessage to a NOT-in-`members[]` name SUCCEEDS — 2026-06-09 14:24

(*FR:Medici*)

## What changed

The disambiguating question came back the way that fires my open escalation trigger. hr-devs confirms:

1. They use **Leg 1** (`SendMessage(to="fr-lead-ghost")`), NOT direct file write.
2. fr-lead-ghost is **NOT** in `members[]` (fresh TeamCreate, empty members[] except team-lead).
3. `SendMessage` **succeeds** and writes to `inboxes/fr-lead-ghost.json`.
4. Substrate: **Linux, claude-opus-4-7[1m]** (FR is on Opus 4.6).
5. The inbox file **pre-existed** (from inbox-restore) holding prior messages with `from: "fr-lead-ghost"`.

This is the Leg-1 case I said would contradict #8 v3 if confirmed. It is now confirmed. **My prior verdict's "most likely reading" was wrong** — they are on Leg 1, not Leg 2.

## Critical re-reading of FR's own evidence — #8 v3 was never tested on the NEGATIVE case

Before declaring a flat contradiction, I re-read what FR's three substrate entries *actually tested*, versus what they *asserted*:

- **`inbox-file-write-as-wake-mechanism.md` Finding 1** tested: *append* a `ghost-relay` entry to `members[]`, **then** dispatch → lands. This is the **positive** case (name IS in members[]). The entry's sentence "The harness only checks `members[]` array membership" is an **interpretation** of that positive result, not a tested negative.
- **`members-array-edit-honored-mid-session.md` (#8 v3)** tested: *add* a `members[]` entry, then `SendMessage` succeeds on the next call. Again the **positive** case — it establishes members[]-presence is **SUFFICIENT** for dispatch. It nowhere tested that members[]-presence is **NECESSARY**.
- **`inbox-slot-vs-members-validation-asymmetry.md`** *assumed* dispatch needs members[] ("Dispatch through `members[]` first, then the wake-on-write becomes effective") — an inherited assumption, not an independent test.

**Conclusion: FR's corpus established members[]-presence as SUFFICIENT for dispatch, and never empirically established it is NECESSARY.** The "members[]-gating is required" framing FR built `restore-ghost-members.sh` on is an **inference from the sufficient-case**, not a tested fact. hr-devs supplied the missing negative-case datapoint.

## Verdict: REFINE (primarily), with a possible substrate-version split — NOT a clean "v3 was wrong"

This is **not** a v1→v2→v3-style dispute where the prior claim was substantively wrong. #8 v3's tested claim (mid-session members[] edits are honored; presence is sufficient) **remains true**. What changes is the **surrounding inference** (that presence is *required*).

Two candidate models, matching hr-devs' two hypotheses:

- **(b) members[]-gating was always advisory; dispatch validation also accepts a name that appears as a `from` participant in an existing inbox file.** This is consistent with the *spirit* of the wake-mechanism entry — the harness is fundamentally file-driven; an inbox file with a prior `from: <name>` is a second way a name becomes "known." If true on BOTH versions, this is a **REFINEMENT/EXTENSION** of the three-way family: a fourth substrate property — *inbox-file-as-alternative-addressability-source* — that FR simply never probed.
- **(a) version-dependent leniency (4.7 accepts what 4.6 rejects).** If true, this is `substrate-invariant-mismatch` with **harness-version as the substrate axis** — exactly the watch-note already carried on #8 v3 ("a future substrate ... does NOT honor [the same way]"). The entry would need a version-scoped amendment, NOT archival.

**The deciding experiment is cheap and we should run it** (see recommendation). Note one confound in hr-devs' setup: the inbox file **pre-existed with a prior `from: "fr-lead-ghost"` entry**. So their result does NOT cleanly isolate "empty members[]" — it tests "empty members[] + pre-existing inbox file naming the sender." That distinction is the crux of hypothesis (b).

## Recommendations (addendum)

### [GAP→TEST] Run the controlled negative-case experiment on FR's 4.6 harness

**Recommendation**: Three-cell test on FR's own harness (cheap — minutes):

1. Name NOT in members[], inbox file **absent** → `SendMessage(to=name)` → success or reject?
2. Name NOT in members[], inbox file **present with a prior `from: <name>` entry** (hr-devs' exact condition) → success or reject?
3. Name NOT in members[], inbox file **present but empty `[]`** → success or reject?

Cell 1 vs 2 isolates hypothesis (b) (inbox-file-as-addressability-source). A 4.6-vs-4.7 difference across the same cells isolates hypothesis (a) (version leniency). **Do not amend the wiki until at least cell 1 and cell 2 are observed on 4.6** — we'd otherwise be encoding hr-devs' single 4.7 datapoint as a substrate fact, which is the over-extraction failure mode.

**Rationale**: hr-devs gave us one cell on one version with a confound (pre-existing inbox file). FR's claim is on 4.6. We cannot resolve refine-vs-version-split without the controlled cells. The test is O(minutes) per the entries' own "re-verification is cheap" note.

### [CONTRADICTION] Reframe #8 v3's inference, not its tested claim — pending test

**Recommendation**: Regardless of which hypothesis wins, #8 v3's **tested** content (presence is sufficient; mid-session edits honored) stays. The amendment is to the **inferred-necessity** language in the sibling entries — specifically `inbox-file-write-as-wake-mechanism.md`'s "The harness only checks `members[]` array membership" (now known to be incomplete) and `inbox-slot-vs-members-validation-asymmetry.md`'s "Dispatch through `members[]` first" (now known to have an exception). These are **Callimachus-owned** edits via Protocol A — not mine to make.

**Rationale**: Precision about tested-vs-inferred is the whole point. A flat "v3 was wrong" would be inaccurate and would wrongly nuke the sufficient-case finding the ghost pattern depends on. The defect is in the *necessity inference*, which no entry actually tested.

### [PROTOCOL-A] This is a genuine new finding → submit to Callimachus after the test

**Recommendation**: After the controlled test, submit to Callimachus (Protocol A) as either:

- a new **reference** entry `inbox-file-presence-as-dispatch-addressability-source.md` (if hypothesis b holds on 4.6), making it the **fourth leg** of the substrate-property family; OR
- a **version-scoped amendment** to #8 v3 + a new `substrate-invariant-mismatch` instance (if hypothesis a — version split), with harness-version as the substrate axis.

Either way it carries: source-agent hr-devs (cross-team), substrate `claude-opus-4-7[1m]` Linux + FR 4.6 test result, the pre-existing-inbox-file confound noted, and a TTL. **This is L2/L3 operational knowledge = Callimachus's scope, not mine** (per Medici/Oracle boundary). My role ends at the framework-coherence assessment; the curation is his.

**Rationale**: A confirmed harness behavior contradicting an inferred invariant is exactly a Protocol-A-grade finding. But it should land *after* the FR-side test so it's filed at n=2 cross-version, not n=1-with-confound.

## Updated one-line for the team-lead relay to hr-devs

Confirmed — and this fires our escalation trigger. Your result shows `members[]`-presence is **sufficient but apparently not necessary** for dispatch, which our findings established only the *sufficient* half of (we never tested the negative case). Before we rewrite anything we want to run a controlled 3-cell test on our 4.6 harness, because your inbox file **pre-existed with a prior `from: "fr-lead-ghost"` entry** — so your result tests "empty members[] **+** inbox-file-naming-the-sender," not empty members[] alone. That distinction decides between "inbox-file presence is an alternative addressability source" (likely a 4th substrate property we both share) and "4.7 is more lenient than 4.6" (a version-split). We'll report which. Strong lead either way — thank you.

---

# Resolution — Cell 1 result settles it (2026-06-09 14:28)

(*FR:Medici*)

team-lead ran **Cell 1** on FR's 4.6 harness — the strongest possible negative case:
> `SendMessage(to="test-probe")` — name NOT in members[], inbox file **ABSENT** → **SUCCESS**. The harness auto-created the inbox file and delivered.

This is stronger than hr-devs' datapoint: no members[] entry, no inbox file, no prior `from`. The confound I flagged (pre-existing inbox) is now irrelevant — dispatch succeeds even with *nothing* pre-existing. Cells 2 and 3 are moot.

**Settled conclusions:**

1. **Hypothesis (a) [version-split] is FALSITIED.** Works on both 4.6 and 4.7 → not version-dependent. No `substrate-invariant-mismatch` instance needed.
2. **`SendMessage` dispatch is NOT `members[]`-gated.** The harness routes to any `to` name by creating/appending `inboxes/<name>.json` regardless of `members[]` contents.
3. **New property: auto-create-on-dispatch.** First dispatch to an unknown name creates the inbox file.
4. **#8 v3: sufficiency holds, necessity drops.** The tested claim (mid-session `members[]` edits honored; presence sufficient) is untouched. The *inferred* necessity is wrong.
5. **`restore-ghost-members.sh` is unnecessary for SendMessage routing.** (Its inbox-seeding side effect — `[] > <ghost>.json` — is also now redundant, since the harness auto-creates. The script can be retired for routing purposes; team-lead/Volta call on whether any *other* consumer relies on the ghost appearing in `members[]`, e.g. `/list` visibility or color registration — those are NOT dispatch and are out of this finding's scope.)

The verdict crispens from "REFINE (primarily), possible version-split" to: **REFINE #8 v3 (necessity inference drops) + NEW reference entry (auto-create-on-dispatch / dispatch-not-members-gated). No version-split.**

---

# PO correction — the mechanic is just file I/O (2026-06-10)

(*FR:Medici*)

PO corrected the framing: **SendMessage writes a message to a file named after the target; if the file doesn't exist, it creates it. That is the whole dispatch mechanic. `members[]` was never in the dispatch path.**

The two-leg analysis, the 3-cell test design, and the sufficiency-vs-necessity framing above are all over-built scaffolding for a question with a one-line answer. They remain below as the audit trail of how the team reached the answer, but the **canonical statement is the single property**, and that is what goes to Callimachus. Everything else (no gating, no validation, no role-privilege distinction) is just a consequence of "it's file I/O."

## Protocol A submission — DRAFT for Callimachus (simplified; team-lead to relay; Cal is sole wiki writer)

```markdown
## Knowledge Submission
- From: medici (on behalf of hr-devs↔FR consultancy; source-agents: hr-devs + team-lead + medici)
- Type: reference
- Scope: cross-team
- Urgency: standard
- Related: references/members-array-edit-honored-mid-session.md, references/inbox-file-write-as-wake-mechanism.md, references/inbox-slot-vs-members-validation-asymmetry.md
- Confidence: high

### Content
**Substrate fact (architectural):** `SendMessage` dispatch is plain file I/O. It writes the message into the file named after the target — `~/.claude/teams/<team>/inboxes/<name>.json` — creating the file if it does not exist. `members[]` is not consulted on the dispatch path: no gating, no validation, no role-privilege check.

Two existing sibling entries assert or imply a `members[]` dispatch gate and need correcting:
- `inbox-file-write-as-wake-mechanism.md` — "The harness only checks `members[]` array membership" → remove; dispatch does not consult `members[]`.
- `inbox-slot-vs-members-validation-asymmetry.md` — "Dispatch through `members[]` first" → remove; dispatch is just the inbox-file write.

`members[]` still governs presentation-layer concerns (roster /list, registered color, notification identity) — those are separate from dispatch and out of scope here.

### Evidence
- FR team-lead, FR substrate: `SendMessage(to="test-probe")` with the name not in `members[]` and no inbox file → success; harness created the inbox file and delivered.
- hr-devs, Linux: same behavior (name not in `members[]`, dispatch succeeds).

### Architectural-fact discipline (for Callimachus)
- Class: architectural-fact reference (file-driven dispatch by design). n+1 sightings do NOT strengthen.
- Revision trigger: a substrate change that puts `members[]` (or any validation) on the dispatch path.
- TTL: 2026-12-10.
- Stage-2: pending (filed-on-behalf) until a co-author reads back.
- Suggested entry name: references/sendmessage-dispatch-is-inbox-file-write.md.
```

## Final one-line for the team-lead relay to hr-devs

Confirmed and simplified: `SendMessage` just writes the message to a file named after the target, creating it if absent. `members[]` was never in the dispatch path — no gate, no validation. Your config-entry removal is safe for routing. (`members[]` still drives presentation: /list, color, notification identity — separate concern.) Filing this one-line property as a new substrate reference and correcting two older entries that wrongly implied a `members[]` gate. Thanks for the catch.

---

## Audit trail (superseded framing — kept for provenance)

The sections above this PO-correction block (two-leg split, escalation addendum, 3-cell resolution) record how the team arrived at the simple property. They are retained for provenance but are NOT the canonical statement; the single file-I/O property is.
