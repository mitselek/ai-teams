# Stationmaster -- Courier Implementation Hints

(*FR:Aen*)

**Status:** ACCEPTED -- PO review S49 (2026-06-12); expected to be revised against real-world courier implementations (acknowledged: field usage will expose unnoticed shortcomings)

**Audience:** whoever implements a courier -- the customer-side process that moves mail between local team inboxes and the stationmaster hub.

**Authority:** wire behaviour is governed by [`stationmaster-protocol.md`](stationmaster-protocol.md) (v1.0.0). This document governs the **local file discipline** -- the part the contract deliberately leaves to you. Substrate claims cite [`TRUTHS.md`](TRUTHS.md) (T-numbers; empirical, version-stamped at Claude Code CLI `2.1.170`).

**Read this even if you skip everything else:** never modify a harness-watched inbox file in place. Every rule below descends from that one.

---

## 1. What a courier does

Two independent loops against one hub:

```text
OUTBOUND:  local ghost outbox --rename--> local spool --deposit--> hub
INBOUND:   hub --collect--> inject into local target inbox --ack--> hub deletes
```

- The **ghost outbox** is an inbox file for a session-less name (e.g. `inboxes/hr-devs-bridge.json`): your agents `SendMessage` to that name, nothing drains it, entries accumulate (T3.a). It is your team's outgoing mail slot.
- The **target inbox** is a live member's inbox file (usually `team-lead`): a direct file write there is picked up ≲0.5 s, delivered as a teammate message, and **wakes an idle session** (T4.a).

## 2. The substrate you are standing on (CLI 2.1.170)

| # | Fact | Evidence |
|---|---|---|
| S1 | Ghost inbox entries persist indefinitely; harness never drains a session-less name | T3.a |
| S2 | Inbox files are auto-created on first dispatch; the path may legitimately be absent | T3.b, T2.c |
| S3 | A live inbox is a pending-only queue: delivered entries are REMOVED (drained ≲0.8 s), not flagged | T1.b, I-1 |
| S4 | `SendMessage` success ≠ file written -- sender-side enqueue lag is VARIABLE, 0.5-9 s | T2.a |
| S5 | mtime is unreliable for change detection; poll file content | T2.b |
| S6 | Harness writes are not lock-protected against concurrent writers | T4.e (OPEN) |
| S7 | Harness enqueues append and preserve foreign entries already in the file | T5.b |

S4 is the one that kills naive implementations: a new entry can land in the outbox **at any moment**, including between your read and your write-back. That is why in-place read-modify-write is banned -- the race is unfixable in-place (S6: no lock binds the harness).

**Version sensitivity:** S3 flipped between adjacent CLI versions, unannounced (TRUTHS.md I-1). When the local CLI version changes, re-validate before trusting the courier -- at minimum, confirm the ghost outbox still accumulates.

## 3. Outbound discipline (from SPEC-v3 D1 -- verified by Test #5)

1. **Poll the outbox path by content** (S5). Absent file = empty outbox, normal (S2).
2. **Parse before consuming.** Parse failure = likely mid-write; skip this cycle, retry next.
3. **Consume = atomic `rename()`** of the whole outbox file into your spool (`spool/<utc-ts>-<seq>.json`). Never write the watched path -- not even to truncate it. The harness recreates the path fresh on the next enqueue, no error, no resurrection (T5.a).
4. **Rename failure (Windows sharing violation) = safe no-op**: retry next poll.
5. **Spool is your crash journal.** Wrap each spooled entry as a consignment, `deposit`; delete the spool entry on `accepted` OR `duplicate` (contract §5.2 -- both mean the hub has it). The spool is courier-private: in-place shrinking is fine here; the in-place ban applies only to harness-contested files.
6. **FIFO duty:** process spool files oldest-first, preserve array order within a file, single-threaded per direction. Deposit order = delivery order (contract §7) only if you don't reorder.

**Outbox → `to` routing -- per-destination outboxes (PO-ratified v1, S51).** A consignment needs a `to` (destination team); a harness entry carries no destination field, so the courier derives `to` from the **outbox name**: an outbox named `<team>-bridge` routes to `<team>` (strip `-bridge`). **One outbox per destination team** -- to reach N teams, your agents `SendMessage` to N distinct `<team>-bridge` slots. Single-outbox multi-destination fan-out is **out of scope in v1**: a courier that cannot resolve a single, unambiguous `to` from the outbox name MUST refuse-and-retain (never drop, never guess -- no TTL, §7-spirit). This is the ratified resolution of the CR-4 / fan-out amendment; per-destination outboxes is the answer, not a per-entry routing field.

**Entry-body field -- the body MUST be in `text`, not `content` (CR-7, ratified S51; pinned at protocol §4 errata).** The Claude Code harness renders a teammate-message body from the **`text`** field; the canonical harness entry shape is `[from, read, summary, text, timestamp, type]`. A consignment whose `entry` carries the body in a `content` field (or omits `text`) deposits and forwards fine -- the hub only hashes + forwards verbatim (contract §4) -- but **renders as `undefined`** on the receiver (only `summary` shows, as the preview chip). The defect surfaces at render, not in transit; it is **not** a courier bug. Two consequences for a courier:
   - **Outbound:** mail your courier consumes from a `SendMessage`-originated outbox already satisfies this (`text` present). The hazard is only **hand-crafted** outbox entries / probes -- keep their body in `text`.
   - **Inbound:** do **not** add a receiver-side `content`→`text` remap. That would violate the verbatim-forward contract (§4 -- body stays verbatim, you rewrite only `from`). The fix is the sender convention "always `text`," applied at the source; a receiver-side fallback is explicitly declined.

**Deposit success has a DATA LINE -- `ok` alone is not enough.** A successful `deposit` returns a per-consignment data line (`{"id":"...","to":"...","status":"accepted"}`) after the `ok:true` envelope. `ok:true` with **no** data line = nothing landed (typically an empty/malformed request body -- the consignment line never reached stdin). Rule: **no data line = no deposit; re-send.** Don't delete the spool entry on a data-line-less `ok`.

Timing attacks against the rename were attempted and produced no loss and no duplication (T5.c); the residual unprovable race (harness read-modify-write straddling the rename) is absorbed by the hub's dedup-by-id.

**Spool placement:** same filesystem as the inboxes dir -- `rename()` atomicity is per-volume. Validate at startup; refuse to run otherwise.

## 4. Inbound discipline (from SPEC-v3 D11 -- verified by Test #6)

Injecting into a **live, contested** inbox. Blind overwrite can erase native entries; read-modify-write can resurrect drained ones or lose a concurrent native enqueue. The verified sequence:

1. **Poll until the target path is absent or `[]`** -- the steady state of a live inbox (S3).
2. **If an empty file exists, rename it aside first.** If it gained native entries in the race window, the rename captures them losslessly -- prepend them to your inject batch (ride-along delivery, T6.b).
3. **Exclusive-create** (`open(..., O_CREAT|O_EXCL)` / `'x'` mode) the path with the batch. Atomic; cannot clobber a file the harness recreated in the gap (T6.a, 50/50 race rounds clean). On failure: harness got there first -- loop to 1 and merge.
4. The loop terminates fast: harness writes per file are seconds-apart events; your window is sub-second.

A multi-entry batch delivers as separate messages, in batch order (T6.b). **Owed before production reliance:** T6.a's race harness was run on Windows; re-run on the deployment platform (SPEC-v3 D10 note).

**Attribution duty (contract §4):** derive the injected `from` from the hub envelope's `from_team` -- local convention: `<from_team>-ghost`. Never trust a team identity claimed inside `entry`. Rewrite only `from`; body stays verbatim.

## 5. The delivered-ledger

Inbound dedup is YOUR job (the hub redelivers anything uncollected or unacked -- at-least-once, by design):

- Append-only JSONL: `{"id": "<envelope id>", "ts": "..."}` per delivered entry. Keyed by the **hub envelope `id`** -- never recompute it locally (you rewrite `from`, so local content differs).
- Check before inject; append **after** inject.
- Compact at startup; retention 7 days or 10k IDs, whichever trims first [CONV] -- the redelivery window is only collect-to-ack, this is generous.

No outbound ledger is needed: `deposit` retry-safety is the hub's dedup, not yours.

## 6. Cycle choreography and crash points

```text
loop every INTERVAL:
  # outbound
  if outbox parses non-empty:  rename -> spool
  for spool files oldest-first: deposit; delete spool entry on accepted/duplicate
  # inbound
  collect
  for each entry: if id in ledger -> skip inject; else inject (D11) THEN ledger.append
  ack ALL collected ids (including the skipped ones -- a re-ack repays a lost ack)
  sleep
```

Crash anywhere; the design absorbs it:

| Crash between | On restart | Cost |
|---|---|---|
| rename and deposit | spool file still there; deposit it | none |
| deposit-accepted and spool-delete | redeposit -> `duplicate` -> delete | none |
| collect and inject | nothing acked; re-collect; inject | none |
| **inject and ledger-append** | re-collect; id not in ledger; re-inject | **one duplicate message to an agent** |
| ledger-append and ack | re-collect; in ledger; skip; re-ack | none |

The fourth row is the accepted at-least-once cost (SPEC-v3 D2), and dictates the write order: **inject first, ledger second.** Reversing it converts the rare duplicate into a rare *silent loss* (marked delivered, never injected) -- and loss costs more than duplication everywhere in this system.

## 7. What NOT to do

- ❌ Edit, truncate, or rewrite a harness-watched inbox in place (S4 + S6: unfixable lost-update race).
- ❌ Watch mtime (S5 -- it lies; poll content).
- ❌ Blind-overwrite the target inbox (erases native entries) or read-modify-write it (resurrects drained ones).
- ❌ `ack` before the entry is durably written locally (custody transfer -- contract §5.4).
- ❌ Drop or expire messages on your own initiative. No TTL anywhere in this system; staleness is reported, not deleted.
- ❌ Trust `entry.from` for team identity (spoofable -- T4.b; the envelope's `from_team` is authenticated).
- ❌ Run two courier instances against the same team dir (no substrate protection; use a lock file -- exclusive-create with PID + staleness check, the T6.a primitive again).

## 8. Platform notes

- **POSIX:** `os.rename()` within one volume is atomic; `open(path, 'x')` is the exclusive-create.
- **Windows:** rename onto an existing path fails instead of replacing -- which is exactly the semantics §4 step 3 wants; sharing violations on rename are routine, treat as retry-next-poll (§3.4).
- **Git Bash `$HOME` gotcha:** resolves empty in some setups -- derive paths from `Path.home()` / `%USERPROFILE%`, not `$HOME` (startup.md gotcha #2).
- **Poll interval:** 5-60 s [CONV]. End-to-end latency ≈ sender interval + receiver interval. The hub does not rate-limit polling in v1; be a good citizen.

## 9. Reference implementation

`stationmaster-courier.py` *(forthcoming)* -- single file, stdlib only, embodies every rule above. Run it as-is, or read it side-by-side with this document; section numbers appear as code comments.
