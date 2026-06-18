# RFC: Teamless Courier -- single-session thin-client + 2.1.178 migration prerequisite

*(*FR:Aen*) -- 2026-06-17. Status: DRAFT for PO review. Empirically grounded by the 2.1.179 probe (`teams-migration-probe-findings-2026-06-17.md`, commit b37b938) and the in-session hook demos.*

## 1. Motivation

Today a session can only participate in the stationmaster hub if it is a **full team** (team-lead + courier daemon + inbox machinery). We want a **single, teamless session** -- a human operator's bare Claude CLI ("Ruth") -- to reach a target team over the hub without standing up a whole team first. Use case (PO-selected): a **human thin-client** -- an ad-hoc operator channel.

This RFC proposes the design, and folds in a **prerequisite migration finding**: on Claude Code 2.1.178+ the team substrate changed, and the courier needs one change to survive an unpin from 2.1.177.

## 2. Empirical grounding (what we proved on 2.1.179)

A throwaway 2.1.179 container probe (isolated, host-net, torn down clean) established:

| Finding | Status | Implication |
|---|---|---|
| `TeamCreate`/`TeamDelete` removed in 2.1.178 | **Confirmed** (official doc + binary diff) | Lifecycle can't call them |
| Team dir is `session-<id>`; Agent `team_name` **ignored on disk** | **Proven** (P1) | Hardcoded `~/.claude/teams/framework-research/` path **breaks** |
| `config.json` is **eager** -- a lone session is a 1-member team (itself = team-lead) on disk immediately | **Proven** (P5) | Name is **discoverable** at startup |
| **External inbox-file write proactively wakes + delivers to a bare idle session** | **Proven** (P6) | The teamless thin-client is **viable** |
| `members[]` injection still honored for SendMessage targeting | **Proven** (P4) | Ghost-outbox registration trick survives |
| SendMessage inbox entry gains a `type` field on 2.1.179 | **Proven** (P5) | Minor shape note |
| Hook context-injection (`UserPromptSubmit`/`Stop`), Stop fires content-agnostically on turn-end + blocks to wake, 9-block cap + `stop_hook_active`, `asyncRewake` | **Proven** (in-session demos) + schema-confirmed | Receive-mode toolkit is real |

**Net:** every delivery/injection primitive the courier relies on **survives** 2.1.178+. Only the hardcoded team-*name* breaks.

## 3. Design -- teamless thin-client

**Shared spine (all receive modes):**

- **Identity:** the session has its own hub identity -- a personal SSH key + a hub-registered name (e.g. `ruth`) + reciprocal grants with the target team. (Consent boundary unchanged from the team model.)
- **Send:** inline `deposit` over SSH (body in `text`). No daemon.
- **Lifecycle:** a **companion script at session start** (or a `SessionStart` hook) arms the channel; **non-persistent** -- it dies with the session (`SessionEnd` hook tears it down). No always-on OS service.
- **Reachability bootstrap:** the courier **creates `inboxes/team-lead.json`** for the lone session (the one-time "activation" -- P6 showed a bare session has no inbox file until first activity, but an external write to that file then proactively wakes it).
- **Name discovery:** the courier resolves the live team dir at runtime (`~/.claude/teams/*/config.json .name` or `sessions/<pid>.json`), never a hardcoded name.

**Receive modes (menu, by interaction pattern -- all proven primitives):**

| Mode | Mechanism | Best for |
|---|---|---|
| **Async (recommended default)** | Session-scoped courier daemon (non-persistent) **or** `asyncRewake` hook → external inbox-write proactively wakes the idle session | "Stay reachable, wake me when they reply" -- Ruth's normal case |
| **Synchronous** | Blocking `PreToolUse` hook on the send action → poll hub → inject reply same-turn | "Ask and wait for the answer" (sub-minute round-trips) |
| **Quiet opportunistic** | `Stop` hook → silent `collect` on turn-end, block+inject only on real mail | "Pick up replies while I work, zero noise" |

The async/proactive-wake mode is the headline: P6 proved a bare idle session wakes on an external inbox write with **no nudge**, which is exactly what a teamless thin-client needs.

## 4. Migration prerequisite (FR's own lifecycle, 2.1.177 → 2.1.178+)

The single blocker to unpinning:

- **Courier runtime name-discovery.** Replace the hardcoded `framework-research` team path with discovery of the live `session-<id>` dir (glob `~/.claude/teams/*/config.json`, match `.name`/`leadSessionId`, or derive from `sessions/<pid>.json`). This is the one courier change required; all delivery/injection logic is unchanged.
- **Lifecycle scripts:** `startup.md` Step 2 (`TeamDelete`+`TeamCreate`) and shutdown S5 (`TeamDelete`) call removed tools -- rework to the implicit model (team auto-exists on session start; no explicit create/delete).

Both are bounded and well-understood. Recommend a follow-up design doc (Brunel offered to draft "courier runtime team-name-discovery") before any unpin.

## 5. Open questions / future work

- **#27441 native `InboxMessage` hook** (proposed, unshipped): if Anthropic ships it, the receive path simplifies further -- structure the receive step behind an adapter so it can drop in.
- **Scope beyond human thin-client:** generalize to a "any solo participant joins the hub" abstraction (deferred -- YAGNI for now).
- **Stop-hook re-issue / token-expiry handling** for long-lived thin-clients.

## 6. Verification status (honesty ledger)

- **Proven empirically this session:** 2.1.178 team-name behavior, eager config, proactive inbox-write wake, members[] injection, SendMessage round-trip, hook context-injection, Stop-hook turn-end wake, 9-block cap.
- **Schema-confirmed, not yet exercised:** `asyncRewake` exit-2 wake.
- **Proposed, unverified:** the native #27441 hook.

---

*Next step: PO review of this draft. On approval → assign reference-implementation sketch (Finn/Brunel) and a numbered RFC filing.*
