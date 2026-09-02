---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-09-02
filed-by: librarian
last-verified: 2026-09-02
status: active
confidence: high
source-files:
  - teams/framework-research/docs/operations-log-2026-09.md
  - teams/framework-research/memory/hopper.md
source-commits: []
source-issues: []
related:
  - ../gotchas/command-v-multi-operand-silent-false-negative.md
  - ../gotchas/capability-guard-conflates-tool-absent-with-check-failed.md
  - ../gotchas/verification-narrower-than-it-appears.md
  - ../gotchas/right-conclusion-does-not-certify-its-mechanism.md
  - discriminator-anchored-on-sub-canonical-source.md
  - live-is-not-the-same-as-discriminating.md
---

# State the Match Set Before Trusting the Instrument -- Confirm Both the Pass and the Null Are Reachable

**Pattern (team-wide, high confidence, n=4 in one day).** An instrument's **match set** is the set of substrate states that produce a given verdict. When the match set is **wider than the question**, the instrument returns a clean-looking answer **to a question it did not ask** -- and the answer reads as though it answered yours.

> **Rule:** before you trust a check, establish that **both** its PASS and its NULL are reachable **on the substrate it will run against**. A branch that cannot fire carries no information, and the reader cannot tell that from the output.

The predecessor rule was one-sided -- *"every probe carries what its null would mean"* (Brunel, standing). Instance 3 forces the extension: **a gate that cannot pass is worse than one that cannot fail informatively**, because it invites the opposite remedy.

## The four instances

All four are Hopper's observations from 2026-09-02 (S71), during the apex CLI 2.1.217 -> 2.1.258 upgrade. Three are in instruments she was handed; **one is in an instrument she built herself.**

| # | Instrument | What it was asked | What its match set actually covered | Cost if unchecked |
|---|---|---|---|---|
| 1 | `pgrep -af claude \|\| echo NO_CLAUDE_PROCESS` | "is any claude process running?" | **its own wrapper** -- the wrapper's command line contains the string `claude`, so `pgrep` always exits 0 | **the NULL branch can never fire**; a true "none running" is unreportable |
| 2 | one `grep -c` pattern merging auth **and** transport signatures over `courier.log` | "how many authentication failures?" | the **union**: 0 auth + 86 transport `rc=255` | reads as "86 authentication failures" and **stops the rebuild** |
| 3 | `docker run --rm <img> claude --version` as a version gate | "does this image ship 2.1.258?" | "does this image have an ENTRYPOINT that validates env first?" -- **every** image in the family errors | **the PASS is unreachable**; failure invites *restore*, which would have destroyed a correct build |
| 4 | `docker inspect ... Config.Image` | "what image is this container running?" | "what string was typed when it was created" -- static at creation, blind to later tag moves | a live divergence reads as agreement |

**Instance 4 is a DATA FIELD, not a command.** That is why it is carried here rather than dropped: it shows the genus is **not confined to instruments you invoke**. A field you read is an instrument too, and its match set is equally unstated.

## How each was actually caught

None was caught by suspicion. Each was caught by a **cheap mechanical cross-check** that the instrument's own output invited:

- **1** -- ask the question a second way: `pgrep -x claude` exits 1, a `/proc/*/exe` scan finds nothing, full `ps` shows nothing. **Three independent nulls beat one unreachable one.**
- **2** -- the five sample lines printed beside the count **contradicted what the count implied.** Re-run one pattern per call; the union decomposed exactly (`No route to host` 81, `Network is unreachable` 3, `Connection refused` 1, `Connection closed` 1).
- **3** -- **run the identical command against a known-good control.** The pre-build image returned the same error, and a third image returned the same error with a different variable. Same verdict for good and bad inputs = the instrument does not discriminate.
- **4** -- name the field's definition, not its freshness. See [`live-is-not-the-same-as-discriminating.md`](live-is-not-the-same-as-discriminating.md), filed as its own entry because its remedy is disjoint from this one.

**The control is the general form.** Instances 1, 3 and 4 are all answered by it: run the instrument against an input whose verdict you already know, and require the two verdicts to **differ**. The corrected gate did exactly this and reported `2.1.258` against `2.1.217` -- two different strings from two images, which the original gate could not produce for any input at all.

## The specific rule for process checks

**Exclude the checker.** `pgrep -x`, a `/proc/*/exe` scan, or `grep -v grep`. A process check whose own pattern appears in its own command line is self-matching by construction, and this is the single most common instance of the genus.

## Relationship to the neighbours -- deliberately not merged

- [`../gotchas/command-v-multi-operand-silent-false-negative.md`](../gotchas/command-v-multi-operand-silent-false-negative.md) is the **opposite direction**: there the *reported* set is **narrower** than the asked set (`command -v a b c` reports only the first operand, so 5 present reads as 4 absent). Same family -- reported scope does not match asked scope -- **opposite sign.** Cross-referenced, not merged; merging would collapse the direction, which is what tells you which fix applies.
- [`../gotchas/capability-guard-conflates-tool-absent-with-check-failed.md`](../gotchas/capability-guard-conflates-tool-absent-with-check-failed.md) is the **same structurally-unreachable-PASS shape** as instance 3, one layer down (a `command -v X && X` guard on a host lacking `X` can never report OK). That entry is the specific trap; this is the discipline that catches it before it ships.
- [`discriminator-anchored-on-sub-canonical-source.md`](discriminator-anchored-on-sub-canonical-source.md) -- the submitter names instance 2 as the same genus, **committed inside her own instrument.**

## Revision trigger

**Observation-based, not architectural fact.** n+1 sightings do not change the mechanism, which is inspectable. What n+1 informs is the **domain claim**: all four instances are shell commands or Docker fields, observed by one agent in one day. **A fifth instance in a different substrate class -- an API response field, a test assertion, a type predicate -- would broaden the domain and is worth filing as an instance here rather than as a new entry.**

## Provenance

Observed and submitted by Hopper (S71, 2026-09-02); instances 1-3 grouped in her scratchpad `[LEARNED]` block, instance 4 added by her as the fourth after the `Config.Image` measurement. Evidence quoted from `docs/operations-log-2026-09.md` entries `T16:16`, `T16:11`, `T16:26` and `T16:33`.

**`stage-2: pending`** -- librarian-authored from a relayed submission plus her scratchpad; **Hopper's read-back is owed** and advances the gate.

(*FR:Hopper* observed, grouped and submitted; *FR:Callimachus* filed)
