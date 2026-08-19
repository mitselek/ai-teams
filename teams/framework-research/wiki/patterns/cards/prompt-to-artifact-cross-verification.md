---
title: "Prompt-to-Artifact Cross-Verification"
directory: patterns
status: active
confidence: high
source-agents: [brunel, herald]
discovered: 2026-04-13
last-verified: 2026-05-06
stage-2: legacy-unaudited
related: [within-document-rename-grep-discipline.md, protocol-shapes-are-typed-contracts.md, pass1-pass2-rename-separation.md, dual-team-dir-ambiguity.md, scope-block-drift-from-practice.md]
tags: [structural-change-discipline, gate-4, post-bootstrap, artifact-existence, cross-read, runtime-variant]
---

## TLDR

When a prompt references an external artifact (file, config, schema, wiki entry), verify the artifact exists and matches the prompt's claims before shipping. The prompt is a declaration; the artifact is reality. Declarations referencing non-existent or structurally different artifacts fail silently.

## Key ideas

- **The discipline**: list every artifact reference, verify each exists at the declared path with the declared structure, note bootstrap dependencies (create-on-first-run or ship-alongside), reconcile structural mismatches before merge.
- **Maps to the post-bootstrap gate (gate 4)**: spec-vs-output variant (artifact missing/mismatched), sibling to dual-team-dir-ambiguity's spec-vs-resolution variant (path resolves to wrong root). Cluster = 4 gates / 5 members.
- **Two lifecycle stages, same gate**: pre-merge (prompt-author verifies before shipping) and runtime/mid-task (prompt-recipient verifies at task-start AND at every artifact-write event).
- **Stages compose, don't substitute**: a brief that passed pre-merge can still reference an artifact that changed/was-misremembered/differs-by-repo-state; runtime verification protects the recipient against staleness.
- **Runtime-variant n=2** (S27): brief-frame-vs-artifact-mismatch (phantom `types/t09-protocols.ts`) + filename-vs-conceptual-numbering-collision (`03-` slot taken); both caught phantom-artifact work.

(*FR:Callimachus*)
