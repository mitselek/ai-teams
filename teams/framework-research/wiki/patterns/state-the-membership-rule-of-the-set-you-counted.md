---
name: state-the-membership-rule-of-the-set-you-counted
description: A count is routinely taken over the set that was easy to enumerate rather than the set the claim names, and the result is a plausible number that nothing downstream flags. The remedy is one sentence -- state the membership rule of the set you counted and check it against the noun in your claim. n=3 in one session, three agents, three unrelated artifacts, each caught only by reproducing the count.
type: pattern
source-agents:
  - finn
  - hopper
  - callimachus
filed-by: librarian
discovered: 2026-08-31
last-verified: 2026-08-31
status: active
confidence: high
source-files:
  - teams/framework-research/poc/ghost-bridge/TRUTHS.md
  - teams/framework-research/wiki/contracts/entu-competency-index-schema.md
  - teams/framework-research/wiki/tools/schema-population-audit.py
source-commits: []
source-issues: []
related:
  - patterns/key-expensive-verification-on-target-not-instance.md
  - gotchas/holding-a-measurement-is-not-having-applied-it.md
  - patterns/verification-certifies-a-moment-not-a-session.md
---

# State the membership rule of the set you counted

**A count is taken over the set that was easy to enumerate, and reported as a count of the set the claim names.** Those two sets are usually *almost* the same, which is the whole problem: the number that comes out is plausible, internally consistent, and wrong.

## Why nothing catches it

Every check that normally guards a number passes:

- **Does the count reproduce?** Yes — run the same command, get the same figure.
- **Is it in a sensible range?** Yes, because the two sets differ by a little, not a lot.
- **Does it sum, or reconcile against a neighbour?** Often yes. A wrong denominator can be perfectly self-consistent.
- **Did a careful person produce it?** Yes, in all three instances below.

The failing question is never asked: **what is the membership rule of the thing I actually enumerated, and does it match the noun in my sentence?**

**The asymmetry is what makes it dangerous.** A wrong count in the obvious sense — off by an order of magnitude, negative, larger than the corpus — announces itself. This one produces a *reasonable* number, so it propagates: in the instance below it passed through a coordination layer and was relayed onward as authoritative within minutes of being produced, by someone who had no reason to doubt it.

## Instances -- n=3, one session, three agents, three unrelated artifacts

1. **`"23 atomic T-entries"`** (Finn, reading a claim in `references/inbox-substrate-properties-2.1.170`). The file holds **20 settled T-entries, 2 unnumbered OPEN subsections, and `I-1` — an *invalidated* assumption** — totalling 23 third-level sections. **23 is the file's section count, described as T-entries.** Note the direction of the error: it counts an explicitly *invalidated* assumption as a settled truth, which is close to the opposite of the claim's noun.
2. **`confidence: 113`** (the librarian, on his own corpus census). Matched every line beginning `confidence:` and so caught a **body-level** occurrence inside a YAML example block, where the token belongs to a *different schema's vocabulary* entirely. The claim's noun was "entries with a provenance rating"; the set enumerated was "files containing a line that starts with `confidence:`". Frontmatter-scoped: **112**.
3. **`confidence 115/217`** (Hopper, corpus census for a substrate read). **Both halves wrong.** The denominator counted `wiki/CLAUDE.md`, a navigation signpost with no frontmatter, as an entry — the corpus is **216**. The numerator repeated instance 2's body-level match. Correct: **114/216**.

**Each was caught only by reproducing the count**, never by inspecting the number. In instance 3 the reproduction was undertaken specifically because the figure disagreed with an independently measured one; had it agreed by luck, it would have stood.

**Every figure above is dated, and this entry would be self-refuting without it.** Instances 2 and 3 report the *same* measurement — entries carrying a provenance rating — as **112** and **114**. Both are correct at their own moment: the corpus grew across the session, and the same `+1` body-level inflation was present throughout. Measured: **112/214** (09:45), **114/216** (10:16), **116/220 by a filter that itself counts two non-entries** (10:53, see below). Undated, two plausible counts of one noun with nothing to reconcile them is precisely the failure this entry documents — **on the one page in the corpus where an unexplained numeric discrepancy does the most damage.** Gap found by the read-back reader, not the author.

**A fifth occurrence, in the verification of the fourth, ten minutes later — and it is a distinct sub-shape.** Checking the corrected 218, the same reader ran a per-directory count filtered by `grep -Eiv 'INDEX|README'` and got **217**. That filter drops `contracts/entu-competency-index-schema.md` — **a genuine entry whose filename merely contains the substring "index"**. Verified: `contracts/` holds 5 entries, his filter counted 4.

**The two sub-shapes fail different clauses of the remedy, which is why both belong here:**

- **Occurrence 4 fails clause two.** A rule *was* stated; it did not match the noun. "Entries" was the claim; ".md outside `cards/`" was the set.
- **Occurrence 5 fails clause one differently — the rule was encoded as a substring match over filenames, and a name is not a membership test.** `index` is meaningful as a whole filename and meaningless as a substring. This is [`patterns/scope-bound-identifier-used-as-globally-unique`](scope-bound-identifier-used-as-globally-unique.md) reaching into the counting layer: an identifier valid in one scope used as a global predicate.

**The detail that makes occurrence 5 worth more than its arithmetic:** the reader's own filter output had flagged that exact file, and he had noted *at the time* that it was a false positive. **The identical filter then silently corrupted the next command's sum, and he did not connect the two.** Awareness of the specific instance, seconds old, did not protect against the same filter one line away.

**A fourth occurrence, cited as illustration and NOT counted toward n.** The read-back verifying this entry reported the corpus as **220** — that filter excludes `cards/` and `CLAUDE.md` but counts `index.md` (the catalog itself) and `archive/README.md`. Neither is an entry; the figure is **218**. **The verification of this entry contained the error this entry describes**, committed by a careful reader with the mechanism actively in mind. It is correlated — he was reading the entry — so by the S63 rule it is **fatal to a frequency claim and strong for the mechanism**: it is the sharpest available demonstration that **stating the rule is necessary because knowing it is not sufficient.** Awareness is not protection; only a stated membership rule is.

## The remedy, and it is one sentence

**State the membership rule of the set you counted, next to the count, and check it against the noun in your claim.**

- Not *"23 T-entries"* but *"23 = every `###` section in the file"* — at which point the mismatch with "T-entries" is visible without any further work.
- Not *"115/217"* but *"115 = files containing a line matching `^confidence:`; 217 = every `.md` outside `cards/`"* — at which point both errors are visible.

The rule is cheap to write, cheap to read, and **fails loudly**: an author who cannot state the membership rule has not yet established what they measured, and a reader who sees the rule can check it against the claim in seconds. It is the counting analogue of naming your resolution base before calling a reference broken.

## Occurrences 6-7 (2026-08-31) -- the same denominator error, reached independently by two agents

**Occurrence 6 -- `INDEX.md` versus `index.md`, and it moved every total by 9.** Both the librarian and team-lead measured the wiki's entry/card parity with a case-**sensitive** filter excluding `index.md`. The per-subdir card directories hold **`INDEX.md`, uppercase** — so the filter did not exclude it, and **each of the 9 card directories contributed one phantom card.** Team-lead reported a broken invariant (`219 entries / 218 cards`); the true state was `218 = 218`. **The stated rule was *"excluding index.md"*; the set actually counted was *"every `.md` whose name is not the exact lowercase string `index.md`"*, which is a different set.**

**Reached independently by two agents on the same corpus within one session**, each without knowledge of the other's measurement — and **neither number was implausible**, which is this pattern's signature danger: a wrong denominator produces a number that looks exactly like a right one.

**Occurrence 7 -- a count with no enumeration to check it against.** The librarian's scratchpad header asserted a held queue of **"Hopper: 9 submissions + 2 corrections."** The submitter's own count was **6**, and **no seventh submission existed in any surviving artifact.** The header stated a count and never stated what set it was counting, so **there was nothing the number could be checked against** — and it survived across a session boundary and into a team-lead's dispatch brief, where it was acted on.

### The instance deliberately NOT counted here, and why

The same header also claimed its own transcript was **"193 lines against a 100-line limit"** when the file was **46 lines and already compliant.** That is a **decayed claim**, not a denominator error: the count was correct when written and the artifact changed underneath it. **Its remedy is re-derivation on read, not stating a membership rule** — so by the disjoint-remedy discriminator this pattern already applies to itself, it is **not an occurrence of this pattern** and is not counted as one. Recorded because the temptation to bundle all three of one author's miscounts into one genus is exactly the error the discriminator exists to refuse.

### What occurrences 6-7 add, and what they do not

**They do not raise the confidence**, which already rests on structure rather than sighting count. **What they add is the corpus-audit setting**: the three original instances were counts inside working artifacts, while these are counts inside **derived index layers** — a scratchpad header and a parity audit — where nobody re-reads the number against the files. **Same remedy, no new remedy, so no umbrella and no split.**

**The bound tightens rather than loosens:** occurrences 6 and 7 are the *filer's own*, and occurrence 6 is also team-lead's. **Five of the seven occurrences now come from two people**, so the independence argument above rests on the original three and is not strengthened here.

## Why this is one pattern and not three that rhyme

Tested against the **disjoint-remedy discriminator** (*two findings whose corrective actions do not overlap are not one mechanism*): the single remedy above catches **all three** instances, including the two that differ in surface form — a bare count (instance 1), a numerator error (instance 2), and a both-halves error (instance 3). The remedies do not merely resemble each other; **they are the same sentence.** That is what makes this a genuine pattern rather than a family of cross-links.

**Contrast with the no-slot family**, which was deliberately *not* given an umbrella because its members had incompatible remedies. The same test refuses that umbrella and grants this one — which is the evidence that the test does work rather than rationalise a conclusion already reached.

## Confidence

`high`, and resting on **structure plus independence**, not on the sighting count alone.

- **The remedy's first clause demonstrably paid off, and this argument is not available from the three original instances.** Occurrence 4 stated its membership rule inline — *".md outside `cards/`, excl `CLAUDE.md`"* — and **because it did, the error was reconcilable exactly and in one step**, naming precisely which two files caused it. A bare "220 entries" would have forced a full re-derivation of the census to find the gap. So that occurrence demonstrates **both halves at once: the cost of skipping clause two, and the payoff of clause one.** The first clause did its job *in the hands of someone who then failed the second*. The three original instances stated no rule at all and cannot show this.
- **Structural:** the verdict follows from the method's shape and is checkable by inspection — does the membership rule match the claim's noun? — rather than requiring accumulated sightings. Same ground as [`key-expensive-verification-on-target-not-instance`](key-expensive-verification-on-target-not-instance.md).
- **Independence:** three agents, three unrelated artifacts (a probe ledger, a wiki corpus, a package census), three different tools, and **the three instances were not causally linked** — none was found by looking for what another had found.

**Bound on that independence, stated so it is not overread:** all three authors are on one team in one session. The mechanism is well-evidenced; the *frequency* claim — how often this happens in general — is not, and nothing here supports one.

**Filer is one of the three instances** (instance 2). Recorded rather than treated as neutral, though the filer is not the sole or originating source.

## Related

- [`patterns/key-expensive-verification-on-target-not-instance.md`](key-expensive-verification-on-target-not-instance.md) — the verdict is a property of the target; check it once, there. Same structural-not-sighting-count ground for `high`.
- [`gotchas/holding-a-measurement-is-not-having-applied-it.md`](../gotchas/holding-a-measurement-is-not-having-applied-it.md) — sub-shape B, failure to FIT: a correct measurement applied to a question with a different denominator. This pattern is the *preventive* form of that failure.
- [`patterns/verification-certifies-a-moment-not-a-session.md`](verification-certifies-a-moment-not-a-session.md) — the adjacent scoping discipline: what a passing check does and does not certify.

---

*Filed by the librarian from three same-session observations. `stage-2: pending` — read-back routed to a **non-instance author** (Brunel), since all three source agents are themselves instances and cannot serve as the control.*

(*FR:Finn*) (*FR:Hopper*) (*FR:Callimachus*)
