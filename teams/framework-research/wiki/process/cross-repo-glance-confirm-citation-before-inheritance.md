---
source-agents:
  - finn
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-05
status: active
confidence: medium
source-files:
  - docs/2026-05-05-postgres-library-discovery/finn-polyphony-dev-glance.md
  - docs/2026-05-05-postgres-library-discovery/finn-haapsalu-suvekool-glance.md
  - docs/2026-05-05-postgres-library-discovery-brief.md
source-commits: []
source-issues:
  - "#64"
related: []
---

# Cross-Repo Glance: Confirm Citation Before Assuming Inheritance

When a stakeholder (PO, team-lead, an external collaborator) cites a pattern as "battle-proof at repo X" and the team is about to design downstream work assuming inheritance from X, **the first work item is a read-only glance at repo X to confirm the citation matches the actual substrate**.

This is research-team discipline, not engineering paranoia. The verification step is cheap (clone, grep, skim a handful of canonical files) and has high asymmetric payoff: confirming the citation lets the team move forward confidently; disconfirming it reframes downstream work *before* the design accumulates assumptions that will need to be unwound.

## When this discipline applies

Three conditions:

1. **A specific repo is named** as the source of a pattern claim ("battle-proof at polyphony-dev," "we did this at apex-research," "look at xireactor for the staging shape").
2. **Downstream design is about to depend on the citation** — not just be informed by it. Design dependency means the cited pattern is part of the team's own architecture, not just a comparison point.
3. **The team has not previously verified the citation in the current session.** A citation verified two sessions ago counts as stale if the source repo has had commits since.

When all three hold, schedule a glance before continuing. The glance is read-only, sized to 30-60 minutes (clone + grep + skim canonical docs), and produces a memo with three top-line bullets + an unattributed-claims list.

## What a glance produces

The output of a glance is **not a deep-read**. The discipline is to surface enough evidence to confirm/disconfirm the citation, not to fully characterize the source. A glance memo has:

- **Top-line bullets (3 max):** the headline finding — does the citation match the substrate, partially match, or not match at all.
- **Source paths checked:** explicit list, file-by-file, so a future reader knows what was and was not read.
- **Quotes worth lifting (with file:line):** evidence inline. Direct quotes carry their own provenance; paraphrasing in a glance memo is risky.
- **Unattributed-claims list:** the citation's claims, decomposed, each marked confirmed / partially-confirmed / not-confirmed-in-this-repo / contradicted. This is the load-bearing artifact.

If the glance reveals partial-match, the unattributed-claims list is what tells the next step what to read more deeply. If it reveals no-match, the list reframes the citation: "we thought X was at repo A; A doesn't have X; where is the actual substrate, or was the citation imprecise?"

## When NOT to do a glance

- **The citation is informational, not load-bearing.** "Apex-research uses Brilliant" mentioned in passing, with no design dependency, does not justify a glance. Save the glance budget for citations the design rests on.
- **The team has authoritative second-hand knowledge.** If team-lead worked at the cited repo last session and the substrate hasn't changed, a fresh glance duplicates known knowledge.
- **The cited repo is unreachable** (private, off-network, unclonable). In this case, the discipline shifts to "ask the citing party for verification artifacts" rather than "do the glance ourselves."

## First instance — polyphony-dev + Haapsalu-Suvekool double-glance

Observed: Finn's two glances during 2026-05-05 #64 thinktank.

**PO citation:** "Topology B (per-team libraries + central federation) is battle-proof somewhere — possibly at polyphony-dev." Downstream work was about to be: "design federation layer over per-team markdown wikis, drawing on polyphony-dev's federation shape."

**Glance 1 — polyphony-dev (`finn-polyphony-dev-glance.md`):**
- Top-line: zero matches for `brilliant` or `xireactor`. Polyphony's "federation" is choral-music product-domain (Handshake protocol between choirs), NOT AI-team-KB federation. Phase 2 P2P federation explicitly DEFERRED.
- Verdict: **citation does not match substrate.** PO's "battle-proof" intuition is real but lives somewhere else.

**Glance 2 — Haapsalu-Suvekool (`finn-haapsalu-suvekool-glance.md`):**
- Top-line: 20+ refs to Brilliant across `teams/esl-suvekool/{startup,common-prompt,design-spec}.md`, scratchpads, docs. Active production use as cross-session knowledge layer.
- Verdict: **citation matches substrate.** The pattern PO meant by "Topology B" is implemented at esl-suvekool as path-namespace per team inside a shared central Brilliant.

**Mid-session reframe:** The discovery brief's verdict moved from "design a federation layer over per-team markdown wikis" (architecture from first principles) to "scale a proven operational pattern from esl-suvekool to additional teams" (operational scale-out). This reframe was directly enabled by the second glance — without it, the brief would have proposed the wrong phase A.

**Cost-benefit:** two glances at ~45 minutes each = ~90 minutes of Finn-time. Reframe avoided weeks of misdirected phase-A design. Asymmetric payoff is the whole point of the discipline.

## What this is NOT

- **Not deep-reading the cited repo cover-to-cover.** A glance is sized for citation-confirmation, not full characterization. Deep-read is a follow-up if the glance lands a confirm.
- **Not adversarial verification.** The discipline is "trust the citing party's intent, verify the substrate." The PO is not lying when a citation doesn't match — they may have conflated repos, generalized from a different context, or misremembered. The glance produces neutral substrate facts; the citing party reframes from there.
- **Not a substitute for asking.** When a glance comes back partial-match or no-match, the next step is to ask the citing party "did you mean repo X or repo Y?" — not to declare the citation wrong unilaterally.

## Promotion posture

n=1. The double-glance from this session is one event with two reads inside it. **Watch for second instance** in the form of: any future "PO/team-lead cited repo X as battle-proof" claim where a glance is performed before downstream design. Promote on second confirmed instance with the discipline producing a useful confirm/disconfirm signal.

The pattern overlaps with `integration-not-relay` discipline at the team-research layer — both insist on substrate-verification before downstream consumption. This entry is the *narrower research-team practice* of "always glance the cited repo first." Integration-not-relay is the *broader content discipline* of "every claim verified against substrate before propagation." The glance is the verification *step*; integration-not-relay is the *standard* it serves.

## Related

- [`integration-not-relay.md`](../patterns/integration-not-relay.md) — the broader discipline this glance supports. The glance is one specific verification step inside the broader integration-not-relay posture.
- [`soft-verdict-discipline-on-substrate-mapping-briefs.md`](soft-verdict-discipline-on-substrate-mapping-briefs.md) — sibling process pattern from the same session. Both are about *what shape of artifact serves which kind of mid-stream-PO-framing context.* Glances confirm citations; soft-verdict tables map substrates. Together they bracket the substrate-mapping brief's research surface.
- [`oss-thin-integration-anti-extension-signal.md`](../patterns/oss-thin-integration-anti-extension-signal.md) — content-finding from the deep-read that followed the confirmed glance (Brilliant deep-read after Haapsalu-Suvekool glance). Demonstrates the natural flow: glance confirms → deep-read characterizes → patterns get filed.

(*FR:Cal*)
