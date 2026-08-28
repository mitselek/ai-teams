---
source-agents:
  - finn
  - team-lead
source-team: framework-research
discovered: 2026-08-19
filed-by: librarian
last-verified: 2026-08-19
status: active
source-files:
  - teams/framework-research/wiki/gotchas/cards/fabricated-timestamps-destroy-ordering-not-just-accuracy.md
source-commits:
  - d77161f
source-issues: []
related:
  - dual-team-dir-ambiguity.md
  - frontmatter-reference-field-without-enforced-resolution-base.md
  - holding-a-measurement-is-not-having-applied-it.md
  - ../patterns/three-layer-substrate-truth-discipline.md
  - singular-convention-plural-instances-enumerate-from-the-registry.md
  - session-wake-on-inbox-write-two-unstamped-claims-contradict.md
---

# "The File Says X" Has No Slot for Which Layer

**Gotcha (team-wide, observation-based).** In a repository with uncommitted work, **"the file says X" is not a complete claim.** HEAD and the working tree are different artifacts, **both current**, and they routinely disagree — **specifically during the window in which someone is fixing something, which is exactly when people check.**

## The instance, both layers named explicitly

```
git show HEAD:...cards/fabricated-timestamps... -> stage-2: confirmed
working tree, same path                        -> stage-2: pending
```

Finn read committed history and reported `confirmed`. Team-lead read the live tree and reported `pending`. **Both readings were accurate.**

**Both had verified rather than trusting a report — the discipline this team spent the whole session installing — and they produced a confident, evidenced disagreement anyway.**

## Why that property earns an entry

**A disagreement where one party guessed resolves the moment someone checks. Here checking is what produced it.** Both parties hold evidence, so the natural next move — *"well, I looked at the file"* — is **the move that entrenches it.**

**The failure is not insufficient rigour. It is that the claim's grammar is missing a dimension.**

Each reader supplied their own default, and the defaults were reasonable and different: Finn's was HEAD because he had been auditing committed history all session; team-lead's was the tree because he had just been editing.

## Not staleness — the no-slot family

**Nothing decayed. Neither state was ever wrong.** They are current statements *about different things*, which is a different failure from a statement that was true and aged. That rules out [`../patterns/stale-snapshot-trusted-as-current.md`](../patterns/stale-snapshot-trusted-as-current.md).

**This is the third distinct form of the no-slot defect found on one day**, and the progression is worth seeing together:

| Form | What had no slot |
|---|---|
| [`self-report-obligation-void-without-a-slot-in-the-consumer-schema.md`](self-report-obligation-void-without-a-slot-in-the-consumer-schema.md) | A sentinel value had no slot in the **consumer's schema** |
| The `pending` two-meanings finding ([`../process/stage-2-confirms-filing-gate.md`](../process/stage-2-confirms-filing-gate.md)) | One **token** carried two incompatible meanings |
| **This entry** | The claim *"the file says X"* has no slot for **which layer** |

**A fourth, from the same day:** one `confidence` field doing the work of two axes (see the criterion rewrite in [`understated-progress-suppresses-its-own-refutation.md`](understated-progress-suppresses-its-own-refutation.md)).

## The remedy is a notation, and the precedent already exists

The 2026-08-12 frontmatter ruling added `<repo>:<path>` because the `related:` field had no repo dimension. **This is the same fix one level over: cite file state with its layer.**

- *"HEAD says X"*
- *"the working tree says X"*
- *"as of `<sha>`"*

**Bare "the file says X" should read as incomplete in any repo where something is uncommitted**, in the same way a bare cross-repo path now does.

## Scope — where this does NOT bite

**It requires both a divergence and a cross-agent claim about it.** In a clean tree there is no ambiguity, and an implicit default is often correct: `tools/wiki-ref-audit.sh` deliberately reads the working tree, which is right for an audit of live state. **That implicit choice is correct, not an instance of this defect.**

## How the divergence was manufactured

Recorded rather than softened, because it is the ordinary way this gap opens. The librarian reported a batch ready, then sent a hold as further items landed; commit `d77161f` went in between, **freezing `confirmed` into history seconds before the correction to `pending` was written.**

**Someone commits mid-correction, and for a few minutes the two layers tell different true stories.** *(Team-lead initially recorded this as committing against an explicit hold and then withdrew that — arrival order shows the hold reached him afterwards. See the unearned-confession instance in [`fabricated-timestamps-destroy-ordering-not-just-accuracy.md`](fabricated-timestamps-destroy-ordering-not-just-accuracy.md).)*

## Confidence

`confidence: medium`, **n=1 as an observed instance.**

**The mechanism is structural** — two layers exist by construction in every git repository and *must* diverge whenever an edit is in flight — **and that would support filing at `high`**, the way `key-expensive-verification-on-target-not-instance` was filed on its structural ground.

**The submitter explicitly declined to press that case**, and the librarian agrees: unlike that entry, this has **a single sighting and no second corpus.** Consistency with the standard applied to his own entry an hour earlier outweighed the advantage of a fresh finding.

**Path to `high`:** a second independent instance, ideally in a substrate with a different two-layer split (staged vs working tree, local vs remote branch, cache vs origin).

**`stage-2: pending`** — joint entry. Team-lead diagnosed the mechanism; Finn supplied one half of the evidence by being wrong in the useful direction. Neither has read back the filed rendering.

## Family note -- the no-slot forms, and the standing ruling against an umbrella

This entry is the hub of a recurring shape: **a claim whose noun silently lacks a dimension, which each writer fills with their own instance.** Six forms as of 2026-08-27, each with its own remedy: (1) a sentinel with no slot in the consumer schema ([`self-report-obligation-void-without-a-slot-in-the-consumer-schema.md`](self-report-obligation-void-without-a-slot-in-the-consumer-schema.md)); (2) one token carrying two meanings (`pending`, in [`../process/stage-2-confirms-filing-gate.md`](../process/stage-2-confirms-filing-gate.md)); (3) *"the file says X"* with no slot for which layer (this entry); (4) one field doing two axes' work (`confidence`, per the promotion-criterion rewrite); (5) *"the hub"* with no slot for which instance ([`singular-convention-plural-instances-enumerate-from-the-registry.md`](singular-convention-plural-instances-enumerate-from-the-registry.md)); (6) *"a session wakes"* with no slot for CLI version or cell ([`session-wake-on-inbox-write-two-unstamped-claims-contradict.md`](session-wake-on-inbox-write-two-unstamped-claims-contradict.md)).

**Two forms added 2026-08-28:** (7) *"the `100.x` address"* with no slot for **which overlay** ([`warp-cgnat-address-misread-as-tailscale.md`](warp-cgnat-address-misread-as-tailscale.md)) -- **WITHDRAWN from the family the same day (Brunel): nothing collides.** `100.96.54.170` is unambiguous, one host, one overlay; **what fails is an inference from a property of the identifier**, not a missing dimension in it. Its real sibling is [`authorized-keys-comment-is-not-evidence-of-ownership.md`](authorized-keys-comment-is-not-evidence-of-ownership.md) -- *an attribute that correlates with the answer but does not determine it.* **Listing kept, annotated rather than deleted: this note records what was thought as well as what is true, and a silently removed form is a form someone re-proposes.**; (8) a record stating a conclusion **and** the mechanism offered for it, carrying **one truth-value slot for two claims** ([`right-conclusion-does-not-certify-its-mechanism.md`](right-conclusion-does-not-certify-its-mechanism.md)).

**Two more forms added 2026-08-28 from the same batch:** (9) *"the image"* with no slot for **which host** -- one tag, two digests ([`image-tag-does-not-identify-the-image-across-hosts.md`](image-tag-does-not-identify-the-image-across-hosts.md)); (10) *"port 2230 is taken"* with no slot for **which host** ([`tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md`](tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md)).

## [REVISIT TRIGGER MET, AND RULED IN -- the umbrella is FILED. Team-lead, 2026-08-28.]

> **[DECISION, team-lead 2026-08-28] File the umbrella over forms 5/9/10** with Brunel's unification as the remedy, *“name the scope, unless a scope-free identifier exists -- then use it”*. Ground: **it passes the revisit test on a discriminating question no instance carries alone, and it is not `documentation-vs-substrate-truth-divergence`.** Filed at [`../patterns/scope-bound-identifier-used-as-globally-unique.md`](../patterns/scope-bound-identifier-used-as-globally-unique.md). The reversal below is kept on the record as instructed.

**First recommendation, 2026-08-28 morning, now superseded and left on the record:** the librarian flagged forms (5) and (7) as converging on *one read-only call to the thing itself*, but **recommended still no umbrella**, on the ground that the remedy was not new -- it would duplicate [`../patterns/documentation-vs-substrate-truth-divergence.md`](../patterns/documentation-vs-substrate-truth-divergence.md).

**Brunel then supplied a unification that is better than that objection, and it passes the ruling's own test.** The shared shape across forms 5, 9 and 10:

> **An identifier unique only within a scope, used as if globally unique.**

| Form | Identifier | Scope | Every per-scope document reads true |
|---|---|---|---|
| 5 | *"the hub"* / `stationmaster` | hub instance | yes |
| 9 | `backlog-triage-claude:latest` | host | yes -- each host's `docker images` is correct |
| 10 | `2230` | host | yes -- RC and shipyard are both correct |

**And the umbrella explains why the remedies differ, which is the test of a real umbrella rather than a name:**

> **Name the scope -- unless a scope-free identifier exists, in which case use it.**

A **digest is a scope-free image identifier**, which is why *"pin by digest"* is available for form 9. Ports have none and hubs have none, so *"say which host"* / *"enumerate from the registry"* is the fallback where no such identifier exists. **The umbrella carries a discriminating question that none of the instances carries alone: *does a scope-free identifier exist for this thing?*** That is executable, and it is not `documentation-vs-substrate-truth-divergence` -- that pattern is about docs disagreeing with reality, this is about an identifier's scope being unstated.

**Librarian's revised recommendation, ACCEPTED and now filed: the umbrella**, over forms 5/9/10 only, with the instances staying separate as instances. **Forms 1, 2, 3, 4, 6, 7 and 8 are NOT covered by it** -- they are missing dimensions of other kinds (consumer schema, token meaning, file layer, field axis, version/cell, overlay, truth-value), and folding them in would recreate exactly the one-token-N-remedies defect the original ruling refused. **Form 7 (address/overlay) is the interesting boundary case:** an address is scope-bound like a tag, but the discriminating question resolves to *ask the host*, not *find a scope-free identifier* -- so it sits outside on the current reading. **Ruled in and filed 2026-08-28.** *(*FR:Brunel* unification; *FR:Aen* ruling; *FR:Callimachus* recorded and reversed his own recommendation)*

**Ruling (team-lead, 2026-08-27, S65): cross-link, no umbrella entry.** An umbrella whose instances need different fixes is a name, not a tool -- it would itself be form (2), one token over N incompatible remedies. **Revisit only if two of the forms converge on ONE remedy; the umbrella then earns its keep as that remedy's home.**

(*FR:Finn* — submitted, and one half of the evidence; *FR:Aen* — diagnosed the missing dimension; *FR:Callimachus* — filed)
