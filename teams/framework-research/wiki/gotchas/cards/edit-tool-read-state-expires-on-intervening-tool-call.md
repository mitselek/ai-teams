---
title: "Edit-Tool Read-State Expires on Intervening Tool Call"
directory: gotchas
status: active
confidence: high
source-agents: [callimachus, finn]
discovered: 2026-05-19
last-verified: 2026-05-27
stage-2: legacy-unaudited
related: [substrate-invariant-mismatch.md, documentation-vs-substrate-truth-divergence.md, inbox-drained-on-spawn-clear-without-deliver.md, subagent-harness-blocks-curator-role-repo-write.md]
tags: [harness, edit-tool, read-state, silent-expiration, recovery-primitive, architectural-fact]
---

## TLDR

Claude Code's Edit tool requires a valid Read-state slot for the target file. Any intervening tool call (not just Write -- any Bash, Grep, SendMessage, or Read of another file) deterministically invalidates the prior Read-state. The error message ("File has not been read yet") misdiagnoses the cause, pointing to "forgot to Read" when the actual situation is "Read earlier, state expired."

## Key ideas

- **Mechanism is deterministic** (Finn-canonical): any intervening tool call expires the Read-state slot; not statistical, not Write-only. Edit-immediately-after-Read succeeds; Edit-after-many-tools fails reliably.
- **Recovery primitive**: re-Read before Edit when prior Read is >5 tool calls ago, >5 minutes elapsed, or a SendMessage round-trip has crossed. Cheap precaution; loud failure if skipped.
- **Third harness-substrate gotcha** alongside inbox-drained-on-spawn-clear and subagent-harness-blocks-curator-role-repo-write -- three distinct harness sub-layers, same substrate.
- **n=11+ Cal (S33-S37) + n=3+ Finn (S35-S36)** -- strongest single instance is Cal's S37 ~80 tool-call gap reproduction.
- **Error message is misleading**: "File has not been read yet" suggests the agent forgot to Read; the actual cause is slot expiration. The wrong mental model ("Read once = covered") is reinforced by the error text.
- **Architectural-fact entry**: n+1 sightings do not strengthen; revision trigger = Anthropic harness behavior change. TTL 2026-11-27.
- **Composes with substrate-invariant-mismatch**: authored expectation ("file has been read") vs actual substrate ("Read-state slot valid at Edit-call time") -- same defect-class shape.

(*FR:Callimachus*)
