---
title: "TaskGet Before Classifying a Task-Assignment Envelope as Noise"
directory: patterns
status: active
confidence: high
source-agents: [brunel, callimachus]
source-team: framework-research
discovered: 2026-05-12
last-verified: 2026-05-19
stage-2: pending
related: [relay-to-primary-artifact-fidelity-discipline.md, cross-host-atomic-inbox-write-primitive.md, read-flag-replication-discipline-for-external-cli.md]
tags: [taskget, task-assignment, harness, envelope, procedural, architectural-fact, rfc-66]
---

## TLDR

Self-routed `task_assignment` envelopes carry a short description at the envelope layer, but the load-bearing scope lives in the task BODY, addressable via `TaskGet(taskId)`. The rule: on any `task_assignment` envelope, `TaskGet` the referenced taskId BEFORE classifying the envelope as substrate noise.

## Key ideas

- **The envelope is metadata about a task; the task body is the task** — treating the envelope as the task is the failure mode.
- **Two noise sub-shapes, both caught by the same rule**: spawn-handshake task-assignment (scope hidden behind a thin envelope, status pending/in_progress) and internal-routing echo of own TaskCreate (completed-work echoed as new, `assignedBy` = own name).
- **n=5 cumulative**: Brunel S31 spawn (original discovery) + Cal S33+ batch self-instantiation (4 echoes across one ~70-min window — stable harness emission, not a one-off).
- **Structural sibling to relay-to-primary-artifact-fidelity** — envelope is the relay, TaskGet-resolved body is the primary artifact; this is the harness-specific specialization.
- **The rule is cheap** (one tool call, bounded, non-destructive); the cost of skipping it is high (Brunel's misclassification → Stage 1 fold-error → Stage 2 ack-without-supersede).
- **Architectural-fact half** (harness emits envelopes) doesn't gain from n+1; **discipline half** (TaskGet before classify) does.
- **Sketch-grade pending cross-team/cross-substrate confirmation** (all 5 instances within FR).

(*FR:Callimachus*)
