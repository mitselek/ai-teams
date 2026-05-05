---
source-agents:
  - team-lead
discovered: 2026-05-02
filed-by: librarian
last-verified: 2026-05-04
status: active
source-files:
  - mitselek/Haapsalu-Suvekool (.claude/startup.md at repo root)
source-commits:
  - 0e461be
source-issues: []
---

# `.claude/startup.md` as cross-team handoff bootstrap

A novel cross-team handoff pattern: place a `.claude/startup.md` at the repo root of a target team. When the PO opens Claude Code in that workdir on a fresh session, the assistant auto-identifies as the team-lead persona of the target team, reads the team config, and runs the standard startup protocol — without the PO having to type bootstrap incantations every session.

## The constraint this resolves

Cross-team team-creation has a mutual-exclusivity problem at the platform level:

- **Designing** a target team's artifacts (roster, prompts, common-prompt, startup) from a session that is already leading some other team — works fine. No leadership conflict because no `TeamCreate` is involved on the target side yet.
- **Spawning agents** into the target team from a session leading another team — does NOT work. The platform's `TeamCreate` cannot be issued from a session that is already leading a team, and the target team must be `TeamCreate`'d before any agent can be spawned into it.

Result: the designing team can author all the target team's files, but cannot bring the target team online. The target team needs its own first session, with its own team-lead, calling its own `TeamCreate` from a fresh CLI process.

The PO becomes the bridge — but expecting the PO to type a multi-step bootstrap on every session opening is brittle.

## The pattern

`.claude/startup.md` at the target team's repo root carries instructions to:

1. Identify the assistant as team-lead of the target team.
2. Read the team config (roster, common-prompt, prompts/, the team-lead's prompt, scratchpad if present).
3. Call `TeamCreate` (after best-effort `TeamDelete` — see [`teamcreate-in-memory-leadership-survives-clear.md`](../gotchas/teamcreate-in-memory-leadership-survives-clear.md)).
4. Run the standard team-startup protocol (verify-on-disk, read inboxes, etc.).

When the PO does `cd <target-repo> && claude`, Claude Code reads `.claude/startup.md` automatically as part of its repo-root convention scan, and the team auto-bootstraps. The PO sees a team-lead introducing themselves; no incantation typed.

## Why this works

The pattern leverages two facts about the platform:

- Claude Code reads repo-root `.claude/` config automatically. Anything placed there influences the very first turn of a new session.
- `TeamCreate` from a fresh session has no leadership conflict. The target team comes online cleanly.

The designing team's work (artifacts at the target's repo root) is *static*; the target team's first-session work (`TeamCreate`, agent spawns) is *dynamic* and must originate from inside the target's session. `.claude/startup.md` is the static-to-dynamic handoff.

## First instance

`mitselek/Haapsalu-Suvekool` esl-suvekool team — the operational team archetype's first instance. Commit `0e461be` added `.claude/startup.md` at the repo root. PO confirmed Tobi (esl-suvekool team-lead) auto-bootstrapped on first session same evening 2026-05-02. No friction reported.

## Confidence and promotion trigger

n=1, watch posture. Promotion trigger: a second cross-team handoff using the same `.claude/startup.md` pattern. When that happens, the pattern earns enough independence-of-instance evidence to consider hoisting into common-prompt as the recommended cross-team handoff form.

If a second cross-team deployment instead chooses a different bridge (PO-typed bootstrap, scripted launcher), the divergence is informative — the trigger then becomes "what made the second team's situation different?" before promoting.

## Related

- [`bootstrap-preamble-as-in-band-signal-channel.md`](bootstrap-preamble-as-in-band-signal-channel.md) — sibling on bootstrap mechanics. That entry is about *what* gets delivered via bootstrap reads (durable state → runtime context within a single team's lifecycle); this entry is about *placement* of the bootstrap entry-point itself across team boundaries. Co-dependent: this pattern's `.claude/startup.md` becomes the bootstrap-preamble surface for the target team's first session.
- [`teamcreate-in-memory-leadership-survives-clear.md`](../gotchas/teamcreate-in-memory-leadership-survives-clear.md) — necessary upstream prerequisite for the target team's first-session `TeamCreate` to succeed cleanly. Filed in this same batch (submission 7/7).
- [`operational-team-archetype.md`](operational-team-archetype.md) — first instance of this pattern emerged from the first instance of the operational-team archetype; the two are not load-bearing-coupled (the handoff pattern would apply to any cross-team deployment regardless of archetype) but they did co-emerge.

(*FR:Callimachus*)
