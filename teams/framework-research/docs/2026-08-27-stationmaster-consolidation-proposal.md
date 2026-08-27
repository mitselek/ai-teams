# Stationmaster Consolidation — Proposal to the Framework-Research Team

**Authors:** Mihkel Putrinš (operator) · Passepartout (scribe) — (*Passepartout*)
**Date:** 2026-08-27
**Status:** **v1.0 — FILED for FR assessment.** Reviewed pre-filing by Henry (PO team-lead, co-designer of the ratified architecture; source-verified review of 2026-08-27, all points folded, marked *[H]*) and signed off by Mihkel 2026-08-27.

---

## 1. Purpose & the ask

Two generations of inter-team mail have now run in production long enough to compare: the ghost-bridge daemons and the stationmaster post-office. The operator's firsthand verdict (§2) is that the stationmaster approach is markedly stabler, and the fleet has quietly voted the same way — every live route today runs over the hub (§3).

What has *not* kept up is the paperwork: the ratified contract still lives in a `poc/` directory, the deployment runbook still says "NOT deployed" about a hub that has been live for months, and usage rules are documented per-team rather than as a common convention (§6). The ask, in three steps:

1. **FR-team assesses this consolidation** — the practices and field results below, with Henry's design-side nuances folded in.
2. **On adoption, FR-team hosts the convention:** the typed contract, onboarding, and courier discipline move to a canonical home in the FR tree, out of `poc/ghost-bridge/`.
3. **FR-team owns further development and documentation** — SemVer stewardship of the contract, the erratum backlog (§5), and the rewritten runbook. Teams keep their own deployment instances and configs (§7).

## 2. Operator verdict: ghost-bridge vs. stationmaster

Mihkel has operated both systems firsthand. The ghost-bridge v2 daemon's signature failure is on record ([`wiki/gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md`](../wiki/gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md)): it forwarded by flipping `read` flags without deleting, so every unsupervised restart re-scanned and re-forwarded — multiply-delivering mail. The experience of running it matched the record: fragile, noisy, needing hand-tending.

The stationmaster, by contrast, has been boring in the best sense. Its stability is not luck; it is three design properties doing their job, each a direct antidote to a ghost-bridge wound:

- **Delete-on-ack + delivered-ledger dedup** kill the restart-redelivery class entirely (at-least-once end-to-end; the rare duplicate is the accepted cost, never silent loss).
- **Synchronous verdicts** (`accepted | duplicate | rejected + code`) mean every failure is loud, in-hand, and retry-safe — no fire-and-forget, no queue to wonder about.
- **Channel-is-identity** (forced-command ssh keys; `from_team` stamped by the hub, never trusted from content) removes the whole app-level auth surface.

*[H]* The underlying reason these properties work deserves naming: the stationmaster has a **deliberately minimal state model**. Ghost-bridge tried to be smart with read-flag accounting; the stationmaster's state is just files on disk, transacted by rename. The three properties succeed because the foundation they stand on is simple enough to reason about completely. That is architecture, not luck.

Verdict: stationmaster is the convention worth standardizing on. Ghost-bridge remains history worth keeping — as the recorded motivation for these exact properties.

## 3. Deployed reality, 2026-08-27

What is actually running today — none of it yet reflected in the FR-tree ops docs:

| Node | Role | Detail |
|---|---|---|
| sagres | Hub + PO team | Stationmaster live at `sm@100.102.133.125:2222`, protocol v1.0.0, spool + grants on persistent volume; PO-team courier on the same box |
| shipyard | Product containers | Per-team courier daemons in each product container (mvox et al.) |
| p2rtela6 | Household box | **Passepartout — first solo-session participant** (no team, no auto-surfacing): courier as a systemd user unit, 12 s poll, comms MCP registered in-session; bidirectional route with po-team proven 2026-08-26 |

The Passepartout deployment matters beyond the household: it is the first instance of the convention running *outside a team container*, on a personal machine, driven by a solo session. It exercised exactly the corners the container deployments never hit — and §5 is the result.

## 4. The convention as practiced

The convention is already fully specified across two documents; this section only names its load-bearing parts so the proposal is self-standing. The wire shape is [`stationmaster-protocol.md`](../poc/ghost-bridge/stationmaster-protocol.md) v1.0.0 (RATIFIED S49); the usage rules are [`protocols.md`](../../../designs/deployed/po-team/protocols.md) rev 5 §1 (ratified #90).

- **Four layers:** GitHub is the work of record; inboxes carry attention ("pick up epic #47" — mail points, the issue specifies); per-team couriers are transport (collect+ack in, outbox `to:`-line drop out); tmux is demoted to persistence only.
- **Verbs:** `ping · deposit · collect · ack · grant/revoke · status · registry` — one ssh conversation per exchange, NDJSON envelope + body lines, every command idempotent or retry-safe. No envelope = transport failure = retry blindly, safely.
- **Consent:** unilateral receive-grants over the authenticated channel; the route table is compiled from grants, enforced at deposit (`E_NOGRANT`).
- **Failure semantics:** nothing silent, ever — rejected in-hand, bounced to sender, countably parked (`deposited_uncollected`), or delivered. Past delivery, the work-of-record layer makes non-response visible.
- **Solo rule (§1.3):** a session without an active team never auto-surfaces its inbox — `read_mail()` must be a habit. This rule graduates from footnote to first-class citizen in §5.

*[H]* **Consolidation task — verb inventory reconciliation:** `registry` is a contract verb (§5.7) but appears in the onboarding doc only in its troubleshooting table, not the six-step flow. The consolidated onboarding should carry the full verb inventory consistently across contract, onboarding, and this proposal. Field corroboration of the contract's precision, from the PO side of the 2026-08-27 tests: two `grant` attempts without the `args` wrapper drew `E_MALFORMED`; the third, per contract §5.5, succeeded immediately — the document is exact, which is precisely the quality FR would be stewarding.

## 5. Field notes from the newest deployment

Five findings from bringing Passepartout onto the hub. Each is a proposed erratum or onboarding addition for the FR-owned convention. 5.2 and 5.4 were proven in a live end-to-end test with Henry on 2026-08-27: two pings initially jammed and were delivered after the fix, a third unannounced ping then flowed through the repaired pipeline untouched (send→session-wake ≈ 17 s), and a ten-message burst delivered 10/10 in strict order with zero errors.

### 5.1 The `text`-field erratum is real — promote it

Passepartout's first three hand-crafted raw-wire deposits were accepted by the hub (`ok:true`, verdicts clean) and rendered **empty** at the recipient — envelope-only, body lost to the reader. This is precisely the S51 erratum in protocol §4: the harness renders the body only from the entry's `text` field, and the hub forwards verbatim, so compliance sits entirely with the sender. Two lessons for onboarding:

- `ok:true` alone proves transport, not delivery-as-readable. The per-consignment verdict line plus a correctly shaped entry is the real success test.
- The MCP `send` tool composes entries correctly; hand-crafted deposits are where this bites. *[H]* The [onboarding doc](../poc/ghost-bridge/stationmaster-onboarding.md)'s Step 5 already carries an entry-schema note for exactly this — credit where due; the proposal is to **promote that existing warning to a bold onboarding gate** with the canonical entry shape (`{from, read, summary, text, timestamp, type}`) inline, not to add a new one.

### 5.2 The solo-session wake gap needs a named pattern

The courier injects into the inbox file within its 12 s poll — but a solo session is never woken by a file changing on disk. Mail can sit unread beside a live conversation. The pull-rule habit covers work rhythms; for live responsiveness Passepartout arms a **persistent watcher at session start**, announcing each new entry into the conversation. One detection lesson from the live test: a count-diff watcher *missed* a drain-and-refill that happened inside one 5 s poll window (same entry count, different content). The only unfoolable discriminator turned out to be the drain itself — see 5.4: once the watcher empties the inbox on every read, *presence in the file* means *new*, and no sampling race exists. Independent substrate corroboration for content-polling over file-watching: FR's own [inbox-substrate reference](../wiki/references/inbox-substrate-properties-2.1.170.md) records (T2.b) that inbox mtime does not reliably change on enqueue — "watchers must poll content, not stat." One more announce-leg nuance, found when a ~3 KB review arrived: the session harness caps a watcher's notification size and truncates mid-word. The watcher therefore announces long bodies as a deliberate preview + archive pointer — *announce is attention, archive is record*, the channel's own doctrine applied one layer down.

> **Decision record · 2026-08-27 — polling beat `inotify` deliberately:** the courier's 12 s hub poll dominates end-to-end latency (event-driven watching saves ≤5 s of a ~17 s worst case); the courier writes inboxes by rename-aside, which kills file-level watches (a directory watch + name filter would be needed); read-flag flips fire watch events too, so new-entry detection logic is required either way; and `inotify-tools` was an avoidable install. Revisit only if courier intervals drop to ~1 s.

### 5.3 Boot coverage on personal machines: linger

A courier as a systemd *user* unit starts at login, not at boot. Without `loginctl enable-linger`, a rebooted-but-unattended box collects nothing until someone logs in (mail waits safely at the hub — `deposited_uncollected` makes the gap visible from the far side, exactly as designed). Onboarding for non-container participants should name the linger step explicitly.

### 5.4 Solo participants must drain — or inject starves **[CRITICAL]**

The S4 inject discipline waits for the target inbox to be *empty or absent* before writing — correct for team sessions, where the harness drains delivered entries within ~a second. A solo session **never drains**: `read_mail` is deliberately non-destructive, and nothing else touches the file. Consequence, observed live twice: the *first-ever* delivery succeeds into the empty inbox; every subsequent one finds it occupied and loops `inject failed … contested inbox … will NOT ack — hub will redeliver` forever. The failure is beautifully loud and lossless (custody discipline at its best) — but delivery is dead after message one.

**Proposed pattern — the watcher is the drainer:** the solo session's persistent watcher, on finding entries, atomically `mv`s the inbox aside (rename can't clobber a concurrent inject; the courier already handles an absent path by exclusive-create and a half-written one by parse-retry), announces the entries into the conversation, appends them to a local archive, and leaves the path free. This makes the solo session behave, from the courier's perspective, exactly like a draining harness. Session-start `read_mail` still covers mail accumulated between sessions, before the watcher arms. Onboarding for solo participants should carry this pattern next to the §1.3 pull rule.

*[H]* **Lifecycle honesty — the watcher is session-bound.** The courier (a systemd user unit) outlives sessions; the drain-watcher does not — it is spawned by the session and dies with it. Independent corroboration, verified in the PO team wiki (Codeberg, `mitselek/po-team`, private — `wiki/gotchas/background-watcher-dies-on-session-idle.md`, discovered 2026-07-19): the harness *silently kills* background watchers on multi-day session idle — a 60-minute poll loop died unnoticed across ~2 days, its committed re-ring never firing — which drove PO team law *refresh-on-resume, not live watchers* (`wiki/decisions/refresh-on-resume-not-live-watchers.md`). The solo pattern here embodies the same law: each session start re-reads the inbox and re-arms the watcher; the watcher is a live-window bonus, never load-bearing. Consequence: *between* sessions the drain gap returns — the first hub message delivers into the empty inbox, subsequent ones queue at the hub (losslessly, redelivered) until the next session's start-of-day `read_mail` + watcher arm. For a coordination channel this is acceptable and self-healing; a solo participant wanting between-session delivery would need the drain outside the session lifecycle (e.g. in the courier itself — a candidate courier-discipline extension for FR to weigh). For tmux-resident solo sessions there is a concrete mitigation (operator design input, Mihkel): the courier — a systemd unit no idle-kill touches — detects an inbox undrained past a threshold and injects one machine-prefixed nudge line into the session's pane via `tmux send-keys`: a local self-wake inside the box's own trust boundary (distinct from the retired cross-team pane driving), throttled by a stall latch, target-checked before typing, and carrying doorbell authority only — never instruction.

**The one invariant:** the drain interval must stay under the inject's patience window (`max_rounds × delay` — 10 s in the reference courier; the drain runs at 5 s). Burst-verified 2026-08-27: ten consecutive messages from po-team delivered 10/10 in strict order, zero inject errors, ~47 s total — the courier injected serially at the drain cadence and acked each batch only after its last member landed. Throughput floors at ~one message per drain tick; excess queues loudly and losslessly at the hub.

### 5.5 The same-volume guard earns its keep

The reference courier refuses to run if its state dir and inbox dir sit on different volumes — rename() atomicity is per-volume. On a personal machine with mixed mounts this is a live hazard, not paranoia. Keep the guard mandatory in the courier discipline.

## 6. Doc inventory — what exists, where, and what's stale

| Document | Location | Status |
|---|---|---|
| Typed contract v1.0.0 | [`teams/framework-research/poc/ghost-bridge/stationmaster-protocol.md`](../poc/ghost-bridge/stationmaster-protocol.md) | RATIFIED, current — but homed in a POC directory |
| Onboarding + courier hints | [`stationmaster-onboarding.md`](../poc/ghost-bridge/stationmaster-onboarding.md), [`stationmaster-courier-hints.md`](../poc/ghost-bridge/stationmaster-courier-hints.md) | ACCEPTED — missing §5's field lessons |
| Usage rules (rev 5 §1) | [`designs/deployed/po-team/protocols.md`](../../../designs/deployed/po-team/protocols.md) | Current — but scoped as a PO-team document, not a common convention |
| Decision card | [`wiki/decisions/stationmaster-post-office-model.md`](../wiki/decisions/stationmaster-post-office-model.md) | Good — rationale + rejected alternatives, verified |
| Deployment runbook | [`docs/stationmaster-hub-deployment-runbook.md`](stationmaster-hub-deployment-runbook.md) | **STALE — needs rewrite, not a status flip** *[H]*: its Open Questions (§8) hold items since resolved in production (T6.a Debian re-run, firewall scope, CLI version drift); a refresh must close them |
| Deployed artifacts | [`designs/deployed/po-team/container/`](../../../designs/deployed/po-team/container/) `{sagres,shipyard}/…`, `passepartout/comms/` (household box, not on GitHub) | Live — per-instance configs, correctly team-owned |

The pattern: everything ratified is sound; everything *locational* or *statused* has drifted. Classic London-time — precise documents, confidently consulted, wrong by a growing offset.

## 7. Proposed ownership split

**FR-team owns — the convention:**

- Typed contract + SemVer stewardship, moved to a canonical home (suggested: `teams/framework-research/docs/stationmaster/` or a `designs/deployed/stationmaster/` package)
- Onboarding + courier discipline, extended with §5 (entry shape in bold, solo-wake pattern, linger step, drain discipline, same-volume guard)
- Runbook, rewritten to deployed reality (§6)
- Erratum backlog + work already deferred in the contract (MCP/REST bindings, agent-level grants, self-service registration)

**Each team owns — its instance:**

- Its courier deployment: unit files, poll interval, keys, boxes
- Its grants and routes
- Its usage norms above the convention (e.g. PO control-message semantics §1.6, Passepartout's egress gates)

*[H]* **Specification is not operation.** FR would own the *specification* — contract, onboarding, runbook text. The hub *instance* has an operator, and today that is Mihkel: he runs `sm-register` on sagres by hand (self-service registration is explicitly deferred, contract §9), registers teams, watches hub disk. Taking the runbook means FR writes instructions *for the operator to execute* — it does not make FR the operator. The two roles stay distinct in the split above, and any future operator handover is its own decision, not a rider on this one.

**Adoption path:** ~~Henry's review folds design-side nuances into this draft → Mihkel signs off~~ (both done 2026-08-27) → **filed here** → FR-team assesses in its own workflow and, on adoption, executes the moves above. If FR declines or amends, this document is still the honest inventory the next attempt starts from.

---

*Sources: [`stationmaster-protocol.md`](../poc/ghost-bridge/stationmaster-protocol.md) v1.0.0 · [`protocols.md`](../../../designs/deployed/po-team/protocols.md) rev 5 · [`stationmaster-post-office-model.md`](../wiki/decisions/stationmaster-post-office-model.md) (wiki decision) · [hub deployment runbook](stationmaster-hub-deployment-runbook.md) · Passepartout comms deployment + live tests with Henry, 2026-08-25…27.*

*Review provenance: Henry (PO) source-verified review 2026-08-27, folded as [H]; Mihkel sign-off 2026-08-27.*

*p.p. Mihkel Putrinš — (\*Passepartout\*)*
