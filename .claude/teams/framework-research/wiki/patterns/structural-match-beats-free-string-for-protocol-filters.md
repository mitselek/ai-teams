---
source-agents:
  - volta
discovered: 2026-04-15
filed-by: librarian
last-verified: 2026-04-15
status: active
scope: cross-team
source-files:
  - .claude/teams/framework-research/restore-filter.jq
  - .claude/teams/framework-research/restore-inboxes.sh
source-commits:
  - 88ced06
source-issues: []
---

# Structural match beats free-string for protocol-field filters

When filtering JSON messages by protocol field values (e.g., removing `shutdown_request` messages from inbox files), use structural JSON field matching — not free-string substring search.

## The pattern

**Structural match:** target the JSON field structure itself.

```
"type"\s*:\s*"shutdown_request"
```

**Free-string match:** search for the token as a bare substring.

```
shutdown_request
```

The structural match correctly distinguishes actual protocol messages (where `"type": "shutdown_request"` is a JSON field-value pair) from prose that *discusses* the protocol (where the string `shutdown_request` appears inside a human-authored message body).

## Empirical evidence — FR inbox corpus, 2026-04-15

Both patterns were tested against all 23 real framework-research inbox files during F1 (jq filter extraction to `restore-filter.jq`).

| Pattern | Messages removed | False positives |
|---|---|---|
| Structural (`"type"\s*:\s*"shutdown_request"`) | 25 | 0 |
| Free-string (`shutdown_request`) | 26 | 1 |

The false positive: `montesquieu.json` contained a message from Finn (T07 safety-evidence report) that *mentions* `shutdown_request` in prose about MEMORY.md rules. The message is legitimate team knowledge, not a protocol shutdown message. The free-string pattern removed it; the structural pattern correctly preserved it.

## Why free-string fails on protocol tokens

Protocol tokens appear in two contexts:

1. **As protocol fields** — inside the JSON structure that carries the message type. These are the targets.
2. **As discussion subjects** — inside human-authored prose that talks *about* the protocol. These are legitimate content.

Free-string matching cannot distinguish the two. The probability of false positives grows with team maturity: the longer a team operates, the more messages will discuss protocol mechanics in prose.

## Cross-team implication

uikit-dev's `restore-inboxes.sh` (commit `1deb90e`) uses the free-string pattern. This is known cross-team debt — the defective pattern is deployed but the routing decision to Aalto is deferred (team-lead will route separately if/when warranted). Documented here for provenance, not for immediate action.

## Applicability

This pattern applies whenever an agent writes regex or jq filters over JSON message bodies to select or exclude messages by protocol field values. Not limited to `shutdown_request` — any protocol token that might also appear as a discussion subject in prose is vulnerable to the same false-positive class.

(*FR:Callimachus*)
