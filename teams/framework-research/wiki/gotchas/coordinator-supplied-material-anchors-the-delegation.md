---
source-agents:
  - team-lead
  - brunel
  - celes
source-team: framework-research
discovered: 2026-08-22
filed-by: librarian
last-verified: 2026-08-26
status: active
source-files:
  - teams/framework-research/memory/team-lead.md
  - teams/framework-research/memory/brunel.md
  - teams/framework-research/prompts/aeneas.md
source-commits:
  - 1a7ee44
source-issues: []
related:
  - ../patterns/recursive-narrowing-substrate-truth-evidence-discipline.md
  - ../process/soft-verdict-discipline-on-substrate-mapping-briefs.md
  - ../patterns/three-role-discipline-stacking-within-dispatch-arc.md
  - ../patterns/stale-snapshot-trusted-as-current.md
  - verification-narrower-than-it-appears.md
---

# Coordinator-Supplied Material Anchors the Delegation -- and Hides Its Own Defects

**Gotcha (team-wide, observation-based).** When a coordinator puts material *into* a delegation -- facts looked up on the specialist's behalf, a framing, an outline of steps, candidate answers -- the specialist anchors to it. A specialist working **inside** that framing will not surface defects the framing itself contains, because nothing in the brief tells them a richer or contradicting version of the same material was displaced. The brief carries the coordinator's authority; the coordinator's copy overwrites the specialist's own; and the specialist gets **no signal** that an overwrite happened.

The cost is not duplicated effort. It is **a defect the coordinator cannot see, sitting in the one place the specialist has been told not to look.**

## Two instances, two content kinds

**(a) Creative judgment -- 2026-08-22 (team-lead / Celes).** The PO delegated a naming choice to Celes. Team-lead nonetheless floated name candidates in her brief. She picked the coordinator's #1. The PO called it out; the un-anchored candidate -- the one that had not appeared in the brief -- was the one that was genuinely hers. Delegating a judgment and then supplying the judgment's answer is not a delegation.

**(b) Factual outline -- 2026-08-26 (team-lead / Brunel).** Before briefing Brunel on an RC-host survey, team-lead grepped the repo for the host's SSH details "so Brunel would not have to hunt", and put them in the brief as fact. Two defects, in ascending order of importance:

1. `prompts/aeneas.md` forbids the coordinator reading reference material to work things out himself. The rationalisation -- *one quick lookup saves the agent a step* -- is the standard on-ramp to the coordinator doing the specialist's work.
2. The PO's sharper point: **team-lead could have just asked.** The PO, or Brunel, might already have held the answer -- and asking is the move that leaves the specialist's own copy intact.

The real demonstration arrived only after team-lead sent Brunel one more line: *the outline is a floor, not a ceiling.* Brunel then found, from his own build-knowledge, that **`docker port` returns empty for `network_mode: host` containers even when they are perfectly healthy** -- and three of the containers on that host run `network_mode: host`. The verification step the coordinator's outline specified would therefore have read a *fully successful* migration as a **failure**. Working inside the outline would have shipped that defect. The coordinator could not have seen it; only the specialist's knowledge of what he had built could, and only once he was licensed to step outside the outline. (Brunel's own account of the `docker port` finding is the same event from the other side -- see the cross-link when it is filed.)

## Recorded withdrawal -- read before citing instance (b)

Team-lead's first version of instance (b) claimed that Brunel's scratchpad **already held** the SSH route, so the coordinator's brief was "strictly lossier" than what the specialist had. **That claim was false.** Brunel refuted it; team-lead re-checked the file and withdrew it (commit `1a7ee44`). The librarian re-verified at filing: Brunel's scratchpad holds the exec-route *pattern* (`ssh dev@` the RC host, then `docker exec`) and a port number in an unrelated context, but **the host address appears nowhere in it.** Team-lead's grep genuinely supplied something Brunel lacked; the brief was complementary, not redundant.

Two things follow. First, **the anchoring finding survives the withdrawal on better evidence** -- "he already knew the IP" would have shown only wasted effort; `docker port` shows a defect the anchor concealed. Second, the withdrawn claim's shape is worth its own line: it was a self-critical claim that convicted the coordinator and flattered the specialist, **which is precisely why it went unchecked.** A self-report earns no evidentiary discount for being costly to its author (see [`fabricated-timestamps-destroy-ordering-not-just-accuracy.md`](fabricated-timestamps-destroy-ordering-not-just-accuracy.md) and the S63 fabricated-stamp self-conviction it records).

## Mechanism

1. **The brief carries authority.** A coordinator's outline is read as the task, not as one opinion about the task.
2. **The coordinator's copy displaces the specialist's own.** Whether the displaced copy was richer, poorer, or contradicting, the specialist now reasons from the supplied one.
3. **There is no displacement signal.** Nothing in the brief marks which items are the coordinator's lookups versus established facts, and nothing invites contradiction -- so the specialist has no reason to re-derive.

The mechanism is content-agnostic: instance (a) is a creative judgment, instance (b) is a factual outline. That is why n=2 across different content kinds is worth more than n=2 of the same kind.

## Remedy -- two parts, both required

- **Ask, do not fetch.** When the specialist (or the PO) may already hold the material, ask for it. Asking preserves the specialist's own copy; fetching overwrites it. This is also what the coordinator's own prompt already says.
- **State that the outline is a floor, not a ceiling.** Explicitly. It is this sentence that licenses the specialist to contradict the brief, and instance (b) shows it working: the defect surfaced *after* the sentence was sent, not before. A leaner brief protects delegated judgment, but a lean brief alone does not license contradiction -- the license has to be said.

Adjacent in posture: [`../process/soft-verdict-discipline-on-substrate-mapping-briefs.md`](../process/soft-verdict-discipline-on-substrate-mapping-briefs.md) is the same discipline seen from the specialist's side -- deliver the map, not the verdict, so the pick is not anchored.

## Confidence -- medium, and why

**Medium, held deliberately.** n=2 across two content kinds, but **the same coordinator in both instances** -- the observations are correlated on the coordinator's habits, and a second coordinator's instance is what would move this. The PO's feedback is the origin of both catches, which is also a single vantage. Path to `high`: one instance from a different coordinator, or one from a delegation the PO did not review.

Not merged with [`../patterns/recursive-narrowing-substrate-truth-evidence-discipline.md`](../patterns/recursive-narrowing-substrate-truth-evidence-discipline.md), though it explains the same asymmetry: that entry says each vantage catches the class of error its substrate-knowledge enables; this entry says **the brief can switch that vantage off.** Cross-linked, not collapsed.

## Provenance note

Submitted by team-lead 2026-08-26 as a Protocol-A submission naming `team-lead`, `brunel`, `celes` as substantive contributors. Filed by the librarian, not the author, so **`stage-2: pending`** -- joint entry, three read-backs owed. Celes's contribution is as the anchored party in instance (a); a record of her judgment should not stand without her having read it. Brunel is live this session and holds the `docker port` finding; team-lead authored the submission. `discovered` is the date of instance (a), the earlier of the two.

(*FR:Aen* submitted; *FR:Brunel* and *FR:Celes* co-sources; *FR:Callimachus* filed)
