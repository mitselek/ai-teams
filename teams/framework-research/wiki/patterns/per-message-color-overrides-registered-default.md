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
  - patterns/ghost-member-as-universal-integration-surface.md
  - patterns/agenttype-vs-backendtype-separation.md
  - references/inbox-file-write-as-wake-mechanism.md
---

# Per-Message `color` Field Overrides Registered-Member Color

**Display-precedence finding** (RFC #66 cross-host PoC, Brunel S31 2026-05-12, apex Linux substrate): when a `SendMessage` envelope carries a `color` field at the message level, the harness display layer uses that value **in preference to** the sender's registered-member color stored in `config.json` `members[]`. The precedence rule is **message-level metadata beats member-level metadata** for presentational fields.

This is the generalizable form. The instance that surfaced it: a ghost member registered with one color emits messages displayed in a different color when the message envelope carries `color`. The precedence rule lets ghost-bridge identity preservation work across team boundaries -- a ghost can show the *sender's home-team color* even though the ghost itself is registered with a substrate-chosen color in the receiving team.

## The shape

Inbox-message canonical schema (empirical, from apex `team-lead.json` + `berners-lee.json` substrate probe, 2026-05-12):

```json
{
  "from": "<sender>",
  "text": "<body>",
  "summary": "<short>",
  "timestamp": "ISO-8601-Z",
  "color": "<name>",
  "read": false
}
```

The `from`, `text`, `timestamp`, and `read` fields are **required**. The `summary` and `color` fields are **optional** -- the harness writes them when present at the sender side and accepts their absence.

**Display precedence:**

1. If the inbox-message JSON includes `color`, the harness display uses that value.
2. If the inbox-message JSON omits `color`, the harness display falls back to the sender's registered-member color from `config.json` `members[]`.

The precedence is per-message, not per-conversation: a given sender may emit some messages with `color` and others without; each message is resolved independently.

## Generalizable rule

**Presentational metadata at the message level overrides presentational metadata at the member level.**

The display layer reads message-level fields first and falls back to member-level only on absence. This generalizes beyond `color`:

- Future presentational fields (e.g., per-message font weight, per-message badge) would likely follow the same precedence -- message-level wins when present.
- The rule does NOT apply to **identity** fields. The `from` field is canonical for sender-identity; there is no message-level override that re-identifies a message as coming from a different `members[]` entry. The harness validates `from` against `members[]` membership for ACL purposes.
- The rule does NOT apply to **delivery** fields. The wake mechanism (`inbox-file-write-as-wake-mechanism.md`) fires on file-write regardless of which color the message carries; presentation is downstream of delivery.

The distinction is **presentational** (visual/display, no semantic consequence) vs **identity-or-delivery** (load-bearing on routing, ACL, or wake). Message-level override is the precedence rule for the former; member-level is authoritative for the latter.

## Operational implications

1. **Ghost-bridge identity preservation across team boundaries.** A ghost member registered as `apex-lead-ghost` (color `white` per FR's roster.json line 120) can emit messages displayed in apex's team-lead color (`red` per apex's roster) by writing `color: "red"` into each outbound message. The receiving team's display reflects the *home-team color of the original sender*, not the local-team registration color. This is the load-bearing case from RFC #66's cross-team comms work.

2. **Per-message color choice is a daemon-design decision, not a harness configuration.** The ghost-bridge daemon (`9c5bf83` and follow-ups) is the canonical writer of the `color` field on relayed messages. It must explicitly carry the home-team color forward; absence falls back to the local-ghost color. Either behavior is valid; the daemon's design choice determines which appears in the receiving team's display.

3. **Display consistency across two-way conversations requires symmetric daemon behavior.** If team A's daemon writes home-team colors and team B's daemon does not, agents in team A see consistent home-team colors on inbound but agents in team B see local-ghost colors on inbound (the daemons are asymmetric on this field). Cross-team daemon contracts should specify whether `color` is per-message-set-by-sender or left-to-receiver-default.

4. **Color is not a security or trust boundary.** The display layer's per-message override is not a trust signal -- any sender with write access to the inbox can write any color value. Identity verification belongs to `members[]` validation (`from` field), not to `color` choice.

## Substrate scope

**Verified on:** apex-research Linux/Docker substrate (Brunel S31, 2026-05-12 substrate probe of `team-lead.json` and `berners-lee.json` empirical samples). The display-precedence rule is harness-level -- the same harness on FR's Windows-Git-Bash should behave identically (architectural-fact discipline applies; the precedence is a harness design choice, not a substrate quirk).

## Architectural-fact discipline

This entry documents a **deliberate harness design choice** -- the display layer reads per-message fields first by intent, not by accident. Per the FR architectural-fact convention:

**n+1 sightings of the override behavior do NOT strengthen this entry.** The precedence rule is fully exposed by inspection of any inbox-message JSON file plus any rendered display. Additional reproductions add no new substrate information.

**Revision triggers:**

- The harness changes the precedence rule (e.g., member-level becomes authoritative; per-message `color` is dropped or treated as advisory) → archive this entry; replace with fix-date reference.
- A new presentational field is added at the message level (e.g., `icon`, `badge`) → amend this entry with the new field and its precedence behavior, OR file a sibling if the new field's precedence rule differs.
- The harness adds a security policy that rejects messages with `color` not matching the registered-member color → archive the generalizable-rule framing; the precedence rule no longer holds.

## What this is NOT

- **Not a recommendation to vary `color` arbitrarily.** Per-message override is a precision tool -- useful for cross-team identity preservation in ghost-bridge contexts; not a general license to color-randomize messages. Random per-message colors degrade the visual-grouping affordance for human readers without adding signal.
- **Not a substitute for `from`-field validation.** ACL and identity rely on `from` matching a valid `members[]` entry; `color` plays no role in identity validation.
- **Not a guarantee of cross-team visual consistency.** Symmetric daemon behavior is required (Operational implication 3); the precedence rule alone does not enforce symmetry.

## Related

- [`patterns/ghost-member-as-universal-integration-surface.md`](ghost-member-as-universal-integration-surface.md) -- the abstraction this precedence rule serves: cross-team ghost-bridge identity preservation via per-message color choice.
- [`patterns/agenttype-vs-backendtype-separation.md`](agenttype-vs-backendtype-separation.md) -- adjacent canonical-shape finding. Both this entry and the `agentType`/`backendType` separation entry document RFC #66 reality vs RFC #66 example deltas; both are candidate RFC amendment surfaces.
- [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) -- substrate substrate-property foundation. Wake fires on file-write regardless of color; presentation is downstream of delivery.

## Source

- Brunel S31 RFC #66 cross-host PoC, 2026-05-12. Empirical samples drawn from apex's `~/.claude/teams/apex-research/inboxes/team-lead.json` and `berners-lee.json` during substrate probe; canonical schema documented in `teams/framework-research/memory/brunel.md` lines 53-58 (DECISION block on inbox message canonical schema).
- RFC #66 thread, message envelope discussion. <https://github.com/mitselek/ai-teams/issues/66>

(*FR:Callimachus*)
