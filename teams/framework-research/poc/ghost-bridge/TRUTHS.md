# Ghost-Bridge Redesign — Empirical Truths Ledger

(*FR:Aen*)

**Discipline:** This file holds ONLY empirically observed, atomic substrate truths for the ghost-bridge redesign. One truth per entry. No inference bundling — hypotheses and inferences live in the OPEN section until a test settles them. Prior history (SPEC.md v1/v2, wiki entries, scratchpads) is NOT trusted as input here; every load-bearing claim gets re-tested.

**Substrate for all entries unless noted:** Windows 11 (Git Bash), Claude Code harness, parent model `claude-fable-5[1m]`, team `framework-research`, Agent-tool team architecture (TeamCreate, runtime `members[]` = `["team-lead"]` only, no spawned agents).

---

## Settled truths

### T1.a — SendMessage accepts self-addressing

`SendMessage(to="team-lead")` called BY team-lead succeeds. No self-addressing guard.
**Evidence:** 3/3 calls returned `success:true`, routing `sender:"team-lead" → target:"@team-lead"`. S48, 2026-06-10 13:42.

### T1.c — Self-dispatched messages are delivered back to the sender as conversation turns, at the next turn boundary

Messages sent mid-turn did NOT interrupt the turn; all three arrived as `teammate-message` turns after the sender's turn ended.
**Evidence:** sends at 13:42:19/:31/:44 (mid-turn); delivery as 3 turns immediately after turn end. S48, 2026-06-10.

### T1.d — Delivery order matches send order (n=1)

Messages 1, 2, 3 delivered in send order.
**Evidence:** single run, 3 messages. S48, 2026-06-10. Low-n caveat: one run, one sender; no concurrency.

### T1.e — Message content survives round-trip intact

Prepended system timestamps and full body text arrived byte-identical (as rendered).
**Evidence:** visual compare of sent vs delivered content, 3/3. S48, 2026-06-10.

### T1.b — SETTLED (probe-1b, 2026-06-10): inbox file is a pending-only queue — messages transiently written with `read: false`, then REMOVED on harness pickup

Probe-1b (clean session, scratch team `probe-1b`, 0.1s content-polling watcher, CLI 2.1.170): 3 self-sends; watcher caught messages 2 and 3 sitting in the file as single-element arrays with `read: false`, each rewritten to `[]` within **<0.7s** of appearing. Message 1 was enqueued+drained inside a polling gap (file first observed already `[]`) — consistent, not independently confirmed.
**Pickup is eager (mid-turn):** drains happened while the sender/recipient session was still mid-turn; presentation to the agent happened later, at the turn boundary, all 3 messages batched into one incoming turn, in send order, content intact.
**Evidence:** `evidence-probe-1b-watch.log` (this directory). Hypothesis B (PO) confirmed; Hypothesis A's mechanism (append-then-drain) is the same observable — the distinction that mattered (retained-with-read:true vs removed) resolved as REMOVED.
**Replication (2026-06-10, apex-research team, PO-relayed):** after a healthy team-lead↔berners-lee ping round-trip ("single delivery both ways"), BOTH inbox files = 2 bytes (`[]`). Confirms drained-end-state for live-teammate messaging (not just self-send) on a second team/host. Caveats: endpoint observation only (no watcher); apex CLI version not captured — get it before treating this as a version datapoint.

### T2.a — SendMessage success ≠ file written: enqueue lag VARIABLE, ~0.5s–9s (n=4; revised by Test #5)

File write lag after `success:true`: ~9s, ~7s (probe-1b), ~8s (Test #3), **<0.5s** (Test #5 msg 6). No fixed flush cadence — the earlier "~7–9s" was a small-n artifact. The `timestamp` field inside the queued JSON matches file-write time, not tool-call time.
**Consequence:** a bridge must tolerate the full ~0–10s range; it can neither rely on a quick write NOR on a guaranteed delay window for cleanup tricks.

### T2.b — mtime does NOT reliably change on enqueue (n=1)

Msg 3's enqueue write left mtime unchanged (stayed at the previous drain's mtime); only the subsequent drain updated it. **Consequence:** mtime-based change detection MISSES enqueues — watchers must poll content, not stat.

### T2.c — Inbox file is created lazily

`inboxes/team-lead.json` did not exist after TeamCreate; it appeared on the first message cycle (created during the first enqueue/drain, observed first as `[]`).

### T4.a — Direct file writes into a live member's inbox ARE delivered — and WAKE an idle session

Probe-4 (clean session, scratch team `probe-4`, CLI 2.1.170): a hand-crafted JSON entry written into `inboxes/team-lead.json` via plain `cat >` was picked up by the harness in **≲0.5s** (drained to `[]`), held, and delivered as a `teammate-message` turn — INJECTED-A arrived with NO nudge while the session sat idle (file write → wake → delivery). Mid-turn injection (INJECTED-B) was drained mid-turn and delivered batched with a harness message at turn end.
**Evidence:** `evidence-probe-4-watch.log` (this directory). Re-confirms the wake-on-write property on 2.1.170.

### T4.b — Sender name needs NO registration: arbitrary `from` is passed through verbatim

INJECTED-A/B carried `from: "ghost-probe"` — not a member, no spawn, no inbox of its own. Delivered as `teammate-message teammate_id="ghost-probe"`. Dispatch AND presentation are both unregistered-name-tolerant. (Extends the 2026-06-09 dispatch finding to the sender axis, re-verified on 2.1.170.)

### T4.c — TeamCreate creates NO inboxes/ dir; harness adopts hand-made files

`~/.claude/teams/probe-4/` held only `config.json` after TeamCreate. `mkdir -p inboxes/` + a hand-written file were adopted without complaint. (Refines T2.c.)

### T4.d — Pickup latency asymmetry: external writes drain in ≲0.5s; SendMessage takes ~7–9s to even reach the file

The ~7–9s lag (T2.a) is on the SENDER-side write path, not the poller — the poller is sub-second. A bridge daemon writing directly is FASTER than native SendMessage dispatch.

### T4.e — Injected entries tolerate format slack (n=1)

Compact single-line JSON, no `type` field → accepted. Harness-written entries are pretty-printed with `"type":"message"`. Don't lean on this; one run, one version.

### T3.a — Ghost outbox survives on 2.1.170: a message to a session-less name persists, undrained

Test #3 (this session, live team-lead, CLI 2.1.170): `SendMessage(to="test-ghost-s48")` — name not in `members[]`, no session, no prior inbox file. Message enqueued and then persisted **≥10 minutes**, `read: false`, across multiple live-session turn boundaries. Watcher (0.2s content polling) logged exactly two states: ABSENT → content. No drain, no mutation.
**Scope discipline:** the settled fact is "this non-session name's inbox was not drained while the team-lead session ran." The drains observed in probes 1b/4 were all of the live session's OWN inbox. "Harness drains only own-inbox" is the natural model but remains inference.
**Evidence:** `evidence-probe-3-watch.log` (this directory).

### T3.b — Auto-create-on-dispatch re-verified on 2.1.170

The harness created `inboxes/test-ghost-s48.json` itself on dispatch to an unknown name (~8s lag, consistent with T2.a). The 2026-06-09 finding holds on this version.

### T5.a — Harness recreates a ghost outbox normally after it is renamed away (consume-by-rename is viable)

Test #5 cell A (this session, CLI 2.1.170): msg 1 enqueued → file renamed aside (`mv` to a spool dir, same volume) → msg 2 sent → harness recreated the path fresh with msg 2 ONLY. No error, no resurrection of msg 1, no residue.
**Evidence:** `evidence-probe-5-watch.log`, `evidence-probe-5-spool-summary.txt` (this directory).

### T5.b — Harness enqueue APPENDS, preserving pre-existing foreign entries (n=2)

Externally planted entries (alien `from`-names `t5-old`/`t5-old2`, hand-written compact JSON) present in the file before a send were PRESERVED by the harness's subsequent enqueue — new message appended after them, nothing stripped or validated away.
**Evidence:** Test #5 cells (17:01:47 write → `[OLD, MSG-5]`; 17:04:18 write → `[OLD2, MSG-6]`).

### T5.c — Three deliberate attempts to wedge into the consume race all failed to lose anything

Escalating timing attacks (manual rename ~11s; armed background rename ~13s startup; sentinel-triggered rename firing 0.45s after send): in every interleaving, every message ended up intact in exactly one place — the spool capture or the recreated path. No loss, no duplication, no resurrection observed.
**Scope:** absence of evidence at three attempts, not proof of impossibility — the read-point question (snapshot-at-send vs read-at-write) remains undiscriminated because the harness write beat even a 0.45s trigger. Dedup stays in the design as the unprovable-negative backstop.

### T6.a — Exclusive-create is atomic on this substrate (Git Bash/MSYS + Python on NTFS)

Bash noclobber (`set -C`) and Python `open(mode="x")` both hard-fail on an existing path and succeed on an absent one; existing content survives the failed attempt. Race harness: 50 rounds of two concurrent processes exclusive-creating the same path — **exactly one winner every round, zero anomalies, zero mixed content**.
**Evidence:** Test #6 cell A, 2026-06-10. Linux re-run still owed before deploy (D10 substrate).

### T6.b — A multi-entry externally-injected batch delivers as separate messages, in batch order, distinct sender identities

Two-entry batch (simulated ride-along native entry + daemon entry) written via the full D11 algorithm (verify-empty → rename-aside → exclusive-create) into the live team-lead inbox: drained in **0.78s**, both entries delivered as separate `teammate-message` turns in batch order, `from` names (`t6-native-ridealong`, `stationmaster-probe`) presented verbatim, content intact — including JSON unicode escapes (`—` rendered correctly).
**Evidence:** `evidence-probe-6-watch.log` (this directory). Also: the rename→create gap (~1s, python startup) showed as ABSENT to the watcher — a harness enqueue in that gap would make exclusive-create fail safe (retry), confirming the algorithm's failure path is the designed one.

## OPEN — observed but NOT settled

### Drain-rewrite clobber window (sub-second) — UNTESTED

The Cell-B race never materialized: INJECTED-B drained ~2s before HARNESS-B's file write landed; the two writes never coexisted. The harness's drain rewrite to `[]` is not advisory-locked — an external append landing inside the ≲0.5s drain window could plausibly be lost. No clobber observed, but the window was not exercised. **Bridge consequence:** external writers must treat the inbox as read-modify-write-contended — append-with-retry-and-verify, never blind write. Exercising the race deliberately would need tight write loops; decide if worth it vs. just designing defensively.

### Changelog/version axis for the retention flip

Local CLI = `2.1.170` (released 2026-06-09, day after S47). NO published changelog/docs entry on inbox retention semantics (checked 2026-06-10: CHANGELOG.md through 2.1.170, code.claude.com agent-teams docs, GitHub releases/issues, web). Nearest candidate vehicles: 2.1.166/2.1.169 "hardened cross-session messaging" — plausible but unevidenced. Exact version of the S47 substrate (old behavior) unknown — so the flip is bracketed, not pinned. **Action candidate:** GitHub issue on anthropics/claude-code asking for inbox-file lifecycle documentation (evidence package ready: probe-1b log). Outward-facing — PO go required.

## Invalidated assumptions from prior history

### I-1 — "Delivered messages are retained in the inbox file with `read: true`" — DEAD on CLI ≥2.1.170

The entire S30–S47 inbox infrastructure assumed inbox-as-accumulating-log: `persist-inboxes.sh` (last-100 pruning), `sanitize-inboxes` (mark-read), inbox restore as context-carrier, and ghost-bridge v1/v2's read-flag-based dedup. On 2.1.170, delivered messages are REMOVED (T1.b) — the file holds only undelivered backlog.
**Casualties to re-evaluate:** persist/restore/sanitize scripts (capture only residue now), ghost-bridge v2 `read`-flag handling, any wiki entry asserting retention. Ghost inboxes still accumulate (no live consumer drains them) — the ghost leg survives by accident, not by design.

## Anomaly log (uncategorized observations)

- 2026-06-10 10:31Z: phantom `idle_notification` from "brunel" while `members[]` = `["team-lead"]` and no agent spawned this session; followed inbox restore + sanitize rewrite of 43 inbox files. Suggests notification path may also be file-driven. Not yet tested.
