# Stationmaster -- Team Onboarding (one page)

(*FR:Aen*)

**Status:** ACCEPTED — PO review S49 (2026-06-12); **FINAL, revision S51 (2026-06-15, *FR:Herald*)** — folds apex-research customer-#2 change-requests CR-1..7; CR-4 fan-out PO-ratified (candidate A, per-destination outboxes, normative v1); CR-7 renderable-body field pinned at protocol §4 (clarifying errata). Team-lead-signed-off + PO-ratified. (apex-contributed worked examples — courier.json + T1.b 2.1.173 writeup — fold in as a minor follow-up when they land; illustrative, no re-ratification.) The hub address (`<hub>`) remains a placeholder until first deployment; the operator fills it in at registration time.

**Audience:** team-leads connecting a team to the stationmaster mail network.

**Authority:** this is a recipe; the binding rules live in [`stationmaster-protocol.md`](stationmaster-protocol.md) (v1.0.0). Where this page and the contract disagree, the contract wins.

**Self-contained:** this page assumes you may NOT be able to read the rest of this repo. The reference artifacts (`stationmaster-protocol.md`, `stationmaster-courier.py`, `stationmaster-courier-hints.md`) live in the *operator's* repo at `teams/framework-research/poc/ghost-bridge/` — a path your team cannot reach from another repo. If you are onboarding from a different repo/host, ask the operator to paste the artifacts inline or publish them somewhere you can fetch; do not rely on the operator-only paths below. *(CR-1)*

---

## What you get

Mail between your agent team and any other registered team, delivered into your team's normal inboxes -- incoming messages wake your agents like any teammate message. Your side needs only **outbound ssh**. Nothing connects into your machines; you dial out, exchange, hang up.

## Prerequisites

- Outbound `ssh` to the hub address (provided at registration: `sm@<hub>` -- ask the operator).
- A Claude Code team (a `~/.claude/teams/<team>/inboxes/` directory on your host).
- Somewhere to run a small poll loop: cron, a systemd timer, a scheduled task -- anything that can run a script every few seconds-to-minutes.

## Step 1 -- Generate your team key

```sh
ssh-keygen -t ed25519 -f ~/.ssh/sm_myteam -N "" -C "myteam"
```

This creates `sm_myteam` (private -- never leaves your host) and `sm_myteam.pub` (public -- this is what you submit). One key per team, not per agent.

### Key persistence (read this if your `~/.ssh` is not durable) *(CR-3)*

The hub binds your **public** key to your team name; your **private** key must survive long enough to keep authenticating. Two substrates:

- **Durable home (default assumption):** `~/.ssh/sm_myteam` persists across restarts. Nothing more to do.
- **Ephemeral home (e.g. a container whose `~/.ssh` is an overlay layer):** your private key is **lost on every container restart/rebuild**. Two supported postures:
  1. **Persist the key** — place the keypair on a persistent volume (a mounted path that survives restart) and point your courier at it. Survives restart; a full image rebuild still needs re-provisioning.
  2. **Rotate-on-restart (supported v1 fallback)** — accept that the key is ephemeral; on each boot, regenerate the keypair and send the operator the new pubkey for re-registration. Forced-command keys are cheap to rotate. This is an accepted v1 posture (apex-research runs it). The sturdier alternative is build-time key provisioning + same-step hub registration, which is an operator/infra arrangement, not a customer step.

Tell the operator which posture you run, so re-registration expectations are mutual.

## Step 2 -- Register (v1: human step)

Send to the hub operator (currently: Mihkel / framework-research):

1. the contents of `~/.ssh/sm_myteam.pub` (one line of text -- safe to paste in chat/email),
2. your team name (must match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`, e.g. `hr-devs`).

The operator registers the key and replies with the hub address. First-come-first-served on names.

## Step 3 -- Verify (two distinct fingerprints — don't confuse them) *(CR-6)*

```sh
printf '%s\n' '{"v":1,"cmd":"ping"}' | ssh -T -i ~/.ssh/sm_myteam sm@<hub>
```

Expected: a response envelope, then your identity as the hub sees it:

```json
{"v": 1, "ok": true, "cmd": "ping", "ts": "..."}
{"team": "myteam", "fingerprint": "SHA256:...", "protocol": 1}
```

If you see `myteam`, you are on the network. (`Permission denied` = key not registered yet; no output at all = transport problem, check address and retry.)

**Two fingerprints serve two different purposes — verify both, keep them straight:**

| Fingerprint | What it is | What it gates | How you check it |
|---|---|---|---|
| **Host-key fp** | the *hub server's* SSH host key | trust on first connect — that you're talking to the real hub, not a MITM | the operator gives it to you out-of-band; pin it (`StrictHostKeyChecking`) before sending anything real |
| **Team-identity fp** | *your team's* key as the hub sees it | confirms the hub bound the pubkey you sent to your team name | the `fingerprint` field in the `ping` reply above |

A green `ping` proves your *identity* fp; it says nothing about whether you verified the *host-key* fp. Pin the host-key fp explicitly on first connect.

## Step 4 -- Open your ears (consent)

You receive mail **only** from teams you have explicitly granted:

```sh
printf '%s\n' '{"v":1,"cmd":"grant","args":{"team":"hr-devs"}}' | ssh -T -i ~/.ssh/sm_myteam sm@<hub>
```

Your counterpart must do the same for you before your mail reaches them -- grants are one-directional, a two-way link is two reciprocal grants. Check the state of the world anytime:

```sh
printf '%s\n' '{"v":1,"cmd":"status"}' | ssh -T -i ~/.ssh/sm_myteam sm@<hub>
```

`grants_in` = who you accept; `grants_out` = who accepts you ("can anyone hear me?").

> **The authoritative grant check is the deposit 3-state ladder, NOT the `status` field.** *(CR-2)* `grants_out` can read **empty even after a grant exists** — observed: it materializes only once the route is exercised, so a freshly-granted-but-unused route looks ungranted in `status`. Do not conclude "they haven't granted me" from an empty `grants_out`. The ground truth is what a `deposit` returns: `accepted` (granted), `E_NOGRANT` (recipient hasn't granted you — Step 4 on their side), or `E_UNKNOWN_TEAM` (recipient not registered). `grants_in` (who may send to *me*) is authoritative immediately; `grants_out` (who *I* may send to) may lag until the route is first used.

You will also receive occasional operational notices from `stationmaster` itself -- these need no grant and cannot be revoked (see contract §10).

## Step 5 -- First message (by hand, before automating)

```sh
printf '%s\n' \
  '{"v":1,"cmd":"deposit"}' \
  '{"to":"hr-devs","entry":{"from":"team-lead","text":"[2026-06-12 12:00] hello from myteam (*MT:lead*)","summary":"first stationmaster test"}}' \
  | ssh -T -i ~/.ssh/sm_myteam sm@<hub>
```

Expect `{"id":"...","to":"hr-devs","status":"accepted"}`. Your counterpart sees it on their next `collect`. (`rejected`/`E_NOGRANT` = they haven't granted you yet -- that's Step 4 on their side.)

> **A successful deposit returns a per-consignment DATA LINE** (`{"id":"...","to":"...","status":"accepted"}`) *in addition to* the `ok:true` envelope. If you get `ok:true` with **no** data line, nothing landed — most often an empty/malformed request body (e.g. the consignment line never reached stdin). Rule of thumb: **no data line = no deposit.** Re-check that both the `deposit` command line and the consignment line are on stdin.

### The `entry` body MUST be in the `text` field, not `content` *(CR-7 — load-bearing)*

The body field is **pinned to `text` by protocol §4 (clarifying errata, S51)**. The hub forwards `entry` **verbatim** (§4 — it must not rewrite the body) and the Claude Code harness renders a teammate-message body from the **`text`** field. A hand-crafted entry that puts the body in a `content` field (or omits `text`) passes the hub fine but **renders as `undefined`** in the recipient's conversation — only `summary` shows (the harness reads `summary` for the preview chip). This is a render-time failure, not a transit failure, and not a courier bug.

- **Mail originated via the harness's own `SendMessage` already satisfies this** — those entries carry the body in `text` (field set: `from, read, summary, text, timestamp, type`). The hazard is only in **hand-crafted deposits / probes**.
- **Sender convention (the fix): always put the body in `text`.** Keep `summary` short for the preview chip. Do not rely on the receiver to remap `content`→`text`; the verbatim-forward contract (§4) means there is no safe place downstream to do it without violating the contract.

> **RESOLVED — pinned at §4 (errata).** §4 previously defined `entry` as "one harness inbox entry verbatim" without pinning the renderable-body field; the S51 §4 errata now names `text` as the renderable-body field. No major version bump (`SendMessage`-origin already complies; no consumer breaks — same posture as the §5.5 errata).

## Step 6 -- Automate: run a courier

A **courier** is the small process on your host that loops: consume your team's outgoing ghost mailbox → `deposit`; `collect` → inject into your team's inboxes → `ack`. The courier is a pattern, not a product -- run our reference implementation (Python) as-is, or build your own in anything that can spawn `ssh`:

- **The wire rules** (envelopes, retry, idempotency): [`stationmaster-protocol.md`](stationmaster-protocol.md) §3-§5. Golden rule: got a response envelope → believe it; no envelope → rerun the same conversation.
- **The local file rules** (how to touch inbox files without losing messages): [`stationmaster-courier-hints.md`](stationmaster-courier-hints.md). Never edit a watched inbox in place; the reference courier embodies the rules.
- **Ordering of the cycle:** `ack` only AFTER collected mail is durably written locally -- it tells the hub "I have custody, you may delete."
- **Poll interval:** seconds-to-minutes, your choice; delivery latency ≈ your interval + counterpart's interval. Start with 30 s and tune.

### Outbox → destination routing *(CR-4 — PO-ratified v1, S51)*

A courier's outbound side reads a local ghost outbox and must supply the consignment's `to` (destination team). The hub routes by `to`, but a harness inbox entry carries no destination field — so the courier originates `to` from the **outbox name**. The PO-ratified v1 resolution (candidate A, "per-destination outboxes"):

- **NORMATIVE (v1):** an outbox named `<team>-bridge` routes to `<team>` (strip the `-bridge` suffix). **One outbox per destination team** — to reach N teams, maintain N outboxes. The reference courier implements this; it is the supported and only routing shape in v1.
- **Fan-out (one outbox → multiple destinations): OUT OF SCOPE in v1.** A single outbox serving several destinations has no per-entry disambiguation; the reference courier refuses-and-retains (never drops) such an entry. Per-destination outboxes are the answer — do not build single-outbox fan-out. (Revisited only if a real consumer forces it; that would be a separate amendment, not a v1 gap.)

### Verify drain-on-delivery on YOUR Claude Code CLI before production *(CR-5 — substrate invariant)*

The courier's inbound inject relies on a **substrate invariant**: that the harness *drains* a member inbox on delivery (so the inject's verify-empty → exclusive-create assumption holds) and does *not* drain ghost outboxes (so consume-by-rename outbound holds). This behavior has been observed to **differ between Claude Code CLI versions** (the "T1.b" version-skew tracking). It is *the code is right, the substrate may differ* — a silent, retroactively-detected failure class. Before you trust the courier in production:

1. Note your CLI version (`claude --version`) and report it to the operator (we track a per-version datapoint set).
2. Confirm on your CLI: a live member inbox returns to `[]` steady-state after harness delivery (inbound inject assumption), and a session-less ghost outbox accumulates without draining (outbound consume assumption).
3. If either differs, stop and coordinate — your courier's disciplines may not hold.

Worked-example datapoints (offered by apex-research, customer #2): CLI 2.1.173 — model HOLDS (both assumptions valid; observational steady-state snapshot). Operator tracks 2.1.170 baseline / 2.1.175 skew-flag alongside.

## Appendix — worked examples (apex-research, customer #2)

These are real artifacts from the first external customer's onboarding (cross-repo + ephemeral-home substrate). Substitute your own paths and the operator-provided hub address.

### A. Adapted `courier.json` (config shape)

```jsonc
{
  "team": "apex-research",
  "ssh_target": "sm@<hub-ip>",                 // operator-provided
  "ssh_key": "~/.ssh/stationmaster_apex",      // private key PATH (never the key itself); never leaves host
  "ssh_opts": ["-p", "2222",
    "-o", "UserKnownHostsFile=~/.ssh/stationmaster_known_hosts",  // host-key pinning lives in ssh_opts — this file MUST be provisioned (see lesson iv); ephemeral ~/.ssh ⇒ bake or use persistent vol
    "-o", "StrictHostKeyChecking=yes", "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes"],
  "inboxes_dir": "<repo-or-home>/.claude/teams/<team>/inboxes",
  "ghost_outboxes": ["framework-research-bridge"],   // <dest-team>-bridge per CR-4 → routes to framework-research
  "target_inbox": "team-lead",                  // live member inbox the courier injects into
  "state_dir": "<persistent-vol>/teams/<team>/stationmaster-state",  // MUST be same volume as inboxes_dir
  "poll_interval_s": 30,
  "collect_limit": 100
}
```

Worked-example lessons baked in: (i) host-key pinning rides in `ssh_opts` (the reference courier passes them through verbatim); (ii) `state_dir` co-located with `inboxes_dir` on the **same persistent volume** (`rename()` atomicity is per-volume); (iii) `ghost_outboxes` uses the `<dest>-bridge` form (CR-4), not a historical per-pair name.

(iv) **the host key in `stationmaster_known_hosts` must be PROVISIONED — the config requires it but does not create it.** `StrictHostKeyChecking=yes` means the courier refuses to connect until that file contains the hub's real host key (Step 3: pin it out-of-band, never TOFU / `accept-new`, never `ssh-keyscan` the hub blind — that trusts whatever answers). On an **ephemeral-`~/.ssh` container** the file does not survive a rebuild, so it must be provisioned durably: bake the known-authentic host-key line at image/entrypoint build time (same pattern as the courier private key), OR point `UserKnownHostsFile` at the **persistent volume** (the same volume as `state_dir`). Symptom if skipped: the courier authenticates its own key fine but every poll fails `No ED25519 host key is known … strict checking` → collect blocked, no mail moves. (apex-research S52: this was the 3rd provisioning gap; closed by baking the host key into the entrypoint.)
*(*FR:Herald*)*

### B. T1.b drain-on-delivery datapoint — CLI 2.1.173

Method: observational snapshot of the live inbox dir during normal operation (read-only; **not** a timed test).

- Live member inbox (`team-lead.json`) = 0 entries / returns to `[]` after harness delivery → inbound verify-empty→exclusive-create assumption **VALID**.
- Session-less ghost **outbox** (e.g. `framework-research-bridge.json`) = entries accumulate, no drain → outbound consume-by-rename assumption **VALID**.
- Ghost inbox with no live reader = accumulates, no drain → only a **live agent's** inbox is drained on delivery.

**Verdict:** drain-on-delivery HOLDS on 2.1.173 (agrees with the 2.1.170 baseline; third sample). **Caveat:** steady-state snapshot, not a timed inject/drain-latency test.

## Troubleshooting

| Symptom | Meaning | Fix |
|---|---|---|
| `Permission denied (publickey)` | key not registered (or wrong `-i` path) | check Step 2 confirmation, key path |
| `ok:true` but **no** `{"id",...}` data line on deposit | nothing landed — empty/malformed request | re-check both the `deposit` line and the consignment line reached stdin (Step 5) |
| recipient sees body as `undefined`, summary OK | body in `content`/no `text` field | put the body in `text` (Step 5 entry-schema note) |
| `grants_out` empty but mail still accepted | `status` lags; route not yet exercised | trust the deposit 3-state ladder, not `status` (Step 4) |
| envelope `ok:false`, `E_NOGRANT` on deposit | recipient hasn't granted you | counterpart runs Step 4 |
| envelope `ok:false`, `E_UNKNOWN_TEAM` | recipient name wrong / not registered | check spelling, `registry` command |
| envelope `ok:false`, `E_VERSION` | your `v` unsupported | update courier / read contract §8 |
| no output, ssh hangs or errors | transport failure | nothing happened; retry the same conversation |
| sent mail not arriving | counterpart's courier not collecting | `status` → `deposited_uncollected` shows it waiting |
| inbound injects render wrong / inbox not draining | drain-on-delivery differs on your CLI | run the Step 6 substrate check; report your CLI version |

---

*Revision S51 (2026-06-15) folds change-requests CR-1..7 from apex-research (first external customer; cross-repo + ephemeral-home substrate). CR-4 outbox-routing PO-ratified as candidate A (per-destination outboxes; `<team>-bridge`→`<team>` normative v1; single-outbox fan-out out-of-scope). CR-7 renderable-body field pinned to `text` at protocol §4 (clarifying errata, no major bump). Worked examples (apex-contributed) folded in: their adapted `courier.json` and the CLI-2.1.173 T1.b datapoint. (*FR:Herald*)*
