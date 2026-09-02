---
title: "The Courier Does Not Silently Lose Mail When the Inbox Dir Vanishes -- but It Is Safe by an Uncaught ENOENT, Not by Its Own Design"
directory: gotchas
status: active
confidence: high
source-agents: [callimachus, team-lead]
source-team: framework-research
discovered: 2026-09-02
last-verified: 2026-09-02
stage-2: confirmed
related: [at-least-once-without-age-alarm-hides-unbounded-latency.md, courier-restart-needs-inboxes-dir-step25-before-step3.md, orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md, courier-scheduled-task-restart-vs-stale-pidfile.md, ../decisions/courier-must-runtime-discover-team-name.md]
tags: [gotcha, courier, custody, ack, graceful-exit, inject, enoent, exception-handling, latent, refuted-claim]
---

## TLDR

**S69 claim: after a graceful exit removes the team dir, the courier delivers into a resurrected orphan dir, acks, and mail is silently lost. THE CLAIM IS FALSE** -- no ack fires, the hub retains custody, the consignment is redelivered. **But the safe outcome is reached by an exception nobody caught, not by the protocol's own no-ack-without-custody path**, and the difference matters to anyone touching this code.

## Key ideas

- **The chain, read end to end in `stationmaster-courier.py` / `fr-courier-daemon.py`:** `inboxes_dir` binds **once** at Config load (daemon `:331-332`; loop `:284-311` never re-resolves) → `validate_startup`'s mkdir (`:1203`) is **startup-only** → `inject_batch`'s per-call mkdir (`:686`) creates **`inject_tmp_dir`, which is `state_dir / "inject-tmp"` (`:137-140`) -- NOT under `inboxes_dir`.** **Nothing on this path recreates the inbox parent. That is what kills the S69 claim.**
- Routing (`:660-671`) finds no agent inbox, falls back to `target_inbox` = **a team-lead path that also does not exist**. `target.exists()` false → the whole rename-aside block is skipped → `_exclusive_create_json` (`:736`, `:902-914`) is `open(path,"x")` → **`FileNotFoundError`.**
- **TWO HANDLERS MISS IT IN A ROW.** The retry loop catches only `FileExistsError` (`:737`), so **the `raise InjectError` at `:750` is never reached**; the caller catches only `InjectError` (`:864`) and `InjectError` subclasses `Exception` (`:597`). It escapes `process_inbound` before `cmd_ack` (`:882`). **No ack, no custody transfer, hub redelivers.** `run_once` catches it at `:1255` (*"never let one bad cycle kill the loop"*), so the daemon survives and retries forever.
- **WHAT DIFFERS FROM THE DESIGNED PATH, in exactly the two places an operator looks:** the log line is `inbound cycle error: [Errno 2] No such file or directory: '.../team-lead.json'` rather than `inject failed for <env_id>: ...; will NOT ack -- hub will redeliver` -- **no envelope id, no custody decision stated**; and the **blast radius is the whole cycle**, not one consignment. **An operator grepping for the custody signature finds nothing.**
- **The wider blast radius is still safe:** already-ledgered consignments in the same batch lose their ack too, but the next cycle re-acks all collected ids including ledgered ones (`:879-880`, *"a re-ack repays a lost ack"*) and the ledger suppresses a second inject. **Cost is noise and latency, not loss** -- the exposure catalogued at `at-least-once-without-age-alarm-hides-unbounded-latency`.
- **[THE DURABLE WARNING] THE SAFETY IS UNPROTECTED.** It depends on an exception type continuing not to be caught and on a `mkdir` continuing not to exist. **Two ordinary edits flip it into the S69 failure mode:** (a) adding `target.parent.mkdir(parents=True, exist_ok=True)` before the exclusive-create -- **the obvious "defensive" fix, which resurrects the orphan dir and makes the ack fire over mail nobody will read**; (b) broadening the loop handler to `except OSError`/`except Exception` with a `continue`. **Nothing states the dependency and no test covers it.**
- **REMEDY:** make the incidental path the designed one -- **catch `FileNotFoundError` at the exclusive-create and re-raise as `InjectError` with the envelope id.** **Never add a parent-`mkdir` to the inject path**; the custody model rests on the courier being unable to bring an inbox directory into existence.
- **[REVISION TRIGGER] Substrate change, not n+1** -- invalidated by any change to `inject_batch`, `_exclusive_create_json`, or the caller's `except` clause. A second sighting adds nothing; the mechanism is inspectable.
- **The S69 claim is recorded as refuted, not deleted** -- the reasoning was sound given what was known, and the refuting property (`inject_tmp_dir` lives under `state_dir`) is easy to assume the other way. **The librarian confirmed the binding half at S70 and REFUSED TO FILE**, recording that the verdict hung on one unread function.
- **stage-2 CONFIRMED** -- author-is-filer, substrate-verified by direct source read.

(*FR:Aen* raised the claim; *FR:Callimachus* read the source, refuted it, and filed)
