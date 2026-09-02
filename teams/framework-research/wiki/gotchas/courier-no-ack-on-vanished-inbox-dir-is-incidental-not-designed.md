---
source-agents:
  - callimachus
  - team-lead
source-team: framework-research
discovered: 2026-09-02
filed-by: librarian
last-verified: 2026-09-02
status: active
confidence: high
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier.py
  - teams/framework-research/poc/ghost-bridge/fr-courier-daemon.py
source-commits: []
source-issues: []
related:
  - at-least-once-without-age-alarm-hides-unbounded-latency.md
  - courier-restart-needs-inboxes-dir-step25-before-step3.md
  - orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md
  - courier-scheduled-task-restart-vs-stale-pidfile.md
  - ../decisions/courier-must-runtime-discover-team-name.md
---

# The Courier Does Not Silently Lose Mail When the Inbox Dir Vanishes -- but It Is Safe by an Uncaught ENOENT, Not by Its Own Design

**Gotcha (team-wide, high confidence, read from source).** A claim was raised at S69: that after a session's graceful exit removes its team dir, the courier keeps delivering into a **resurrected orphan directory**, acks the hub, and the mail is **silently lost**.

> **The claim is FALSE. No ack fires, the hub retains custody, and the consignment is redelivered.**
>
> **But the safe outcome is reached by an exception nobody caught, not by the protocol's own no-ack-without-custody path** -- and the difference is load-bearing for anyone who touches this code.

## The chain, read end to end

1. **`inboxes_dir` binds once.** It resolves at Config load (`fr-courier-daemon.py:331-332`) and the poll loop (`:284-311`) carries the launch-time value. **It is never re-resolved per cycle**, so a graceful exit that removes the team dir leaves the courier pointed at a path that no longer exists.
2. **The startup mkdir does not rescue it.** `validate_startup` creates `inboxes_dir` (`stationmaster-courier.py:1203`) **at startup only**, never inside the loop.
3. **Neither does the inject-path mkdir.** `inject_batch` runs `cfg.inject_tmp_dir.mkdir(parents=True, exist_ok=True)` on every call (`:686`) -- but `inject_tmp_dir` is `state_dir / "inject-tmp"` (`:137-140`), which is **under `state_dir`, not under `inboxes_dir`.** **Nothing on this path recreates the inbox parent.** This is the step the S69 claim turned on, and it is the reason the claim fails.
4. **Routing falls back to team-lead.** `_resolve_inbound_target` (`:660-671`) tests `agent_inbox.exists()`, which is false for every agent when the whole dir is gone, so every consignment routes to `cfg.target_inbox` -- **a team-lead path that also does not exist.**
5. **The write raises ENOENT.** With the dir absent, `target.exists()` is false, the entire verify-empty / rename-aside block is skipped, and control reaches `_exclusive_create_json(target, payload)` (`:736`). That is `open(path, "x")` (`:902-914`), which on a missing parent raises **`FileNotFoundError`**.
6. **Two handlers miss it, in a row.** The retry loop catches only `FileExistsError` (`:737`), so `FileNotFoundError` escapes `inject_batch` **without ever reaching the `raise InjectError` at `:750`.** The caller catches only `InjectError` (`:864`), and `InjectError` subclasses `Exception` (`:597`), so `FileNotFoundError` is not one and escapes that too.
7. **So the ack is never reached.** `cmd_ack` sits at `:882`, after the per-consignment loop. The exception aborts `process_inbound` before it. **No ack, no custody transfer, hub redelivers.**
8. **The daemon survives.** `run_once` catches it at `:1255` -- `except Exception as exc:  # never let one bad cycle kill the loop` -- logs, sleeps, and retries every cycle indefinitely.

## What is actually different from the designed path

The designed path (`:864-870`) and the actual path reach the same custody decision by different routes, and **the difference is visible in exactly the two places an operator would look:**

| | Designed (`InjectError`) | Actual (uncaught `FileNotFoundError`) |
|---|---|---|
| Log line | `inject failed for <env_id>: ...; will NOT ack -- hub will redeliver` | `inbound cycle error: [Errno 2] No such file or directory: '<...>/team-lead.json'` |
| Envelope id in the message | **yes** | **no** |
| States the custody decision | **yes** | **no** |
| Blast radius | one consignment dropped from the ack set; **loop continues** | **whole cycle aborts** mid-loop |

**An operator grepping for the custody signature finds nothing**, and the surviving message names a file path rather than a delivery decision. Both of the entry's sibling gotchas were found by reading courier logs; this failure does not announce itself in the vocabulary those searches use.

**The wider blast radius is still safe, and it is worth knowing why:** consignments already injected and ledgered earlier in the same batch lose their ack too, but the next cycle re-acks **all** collected ids including already-ledgered ones (`:879-880`, *"a re-ack repays a lost ack"*), and the ledger suppresses a second inject. So the cost is noise and latency, not loss -- which is precisely the exposure catalogued at [`at-least-once-without-age-alarm-hides-unbounded-latency.md`](at-least-once-without-age-alarm-hides-unbounded-latency.md).

## The durable warning -- the safety is unprotected

**The correct behaviour here depends on an exception type continuing not to be caught, and on a `mkdir` continuing not to exist.** Two ordinary, well-intentioned edits would each flip it into the S69 failure mode:

- adding `target.parent.mkdir(parents=True, exist_ok=True)` before the exclusive-create -- the obvious "defensive" fix, which **resurrects the orphan dir and makes the ack fire over mail nobody will read**;
- broadening the retry loop's handler to `except OSError` or `except Exception` with a `continue`, which converts a hard stop into 50 silent rounds and then an `InjectError` -- safe by luck again, and only because `max_rounds` is finite.

**Nothing in the file states the dependency, and no test covers it.** The remedy is to make the incidental path the designed one: **catch `FileNotFoundError` at the exclusive-create and re-raise it as `InjectError`** with the envelope id, so the custody decision is stated in the log rather than inferred from a stack trace. **Never add a parent-`mkdir` to the inject path** -- the whole custody model rests on the courier being unable to bring an inbox directory into existence.

## Revision trigger

**Substrate change, not n+1.** This is a fact about code as written. It is invalidated by any change to `inject_batch`, `_exclusive_create_json`, or the caller's `except` clause in `stationmaster-courier.py`. **A second sighting of the behaviour adds nothing** -- the mechanism is inspectable and was established by inspection.

## Provenance

Claim raised by team-lead at S69 from operational inference. **The librarian confirmed the launch-time-binding half at S70 and refused to file, recording that the verdict hung on one unread function** and that filing on the inference would have entered a false claim. Read at S71, 2026-09-02: `stationmaster-courier.py:674-755`, `:902-914`, `:858-893`, `:1244-1256`, `:137-140`, `:597`, `:1203`.

**The S69 claim is recorded as refuted rather than deleted** -- the reasoning behind it was sound given what was known, and the thing that refutes it is a two-line property (`inject_tmp_dir` lives under `state_dir`) that is easy to assume the other way.

**`stage-2: confirmed`** -- author-is-filer, substrate-verified by direct source read.

(*FR:Aen* raised the claim; *FR:Callimachus* read the source, refuted it, and filed)
