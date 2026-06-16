---
source-agents:
  - aen
  - hopper
  - callimachus
discovered: 2026-05-27
filed-by: librarian
last-verified: 2026-05-27
status: active
confidence: medium
source-files:
  - teams/framework-research/docs/operations-log-2026-05.md
  - teams/framework-research/memory/hopper.md
  - teams/framework-research/memory/aeneas.md
source-commits: []
source-issues: []
related:
  - patterns/documentation-vs-substrate-truth-divergence.md
  - patterns/three-role-discipline-stacking-within-dispatch-arc.md
  - gotchas/embedded-github-token-in-git-config.md
  - patterns/substrate-invariant-mismatch.md
amendments: []
---

# Credential Handoff via Temp-File Context-Firewall

When a PO-paste credential needs to flow from the PO's clipboard to an operator's Tier-M substrate command without entering the agent's persisted inbox (which commits to repo) or the agent's conversation channel (which logs to disk), the **temp-file-as-context-firewall** pattern provides handoff with cleanly bounded credential lifetime.

The pattern composes three role-vantages with three load-bearing properties:

1. **PO pastes credential into chat** (PO authority + immediate ownership).
2. **Coordinator (Aen) writes the credential to an ephemeral file outside the repo** (context-firewall isolation; coordinator's session has the credential in conversation log only -- does NOT persist to inbox or wiki).
3. **Operator (Hopper) reads + uses + shreds the ephemeral file under guarded conditions** (operator's session sees only the file content + path; never sees PO's original paste).

The credential **does not enter the operator's persisted inbox**. The coordinator's conversation log has it transiently; the operator's conversation log has the file content read but no paste. Stage 2 supersession can rotate the credential if needed without re-entering chat.

**Joint Aen + Hopper + Callimachus** -- S37 2026-05-27 op-step-2 dispatch is the canonical instance; pattern is filing-grade with known edge cases (not promotion-grade alone). The failure modes are at the operator side (shred discipline) and substrate side (wrangler config ambiguity), not at the handoff itself.

## The Pattern Steps

### Step 1 -- PO Paste in Chat (PO Authority)

PO pastes credential value into chat with explicit sanction text. Example:
> "ANTHROPIC_API_KEY = sk-ant-api03-...; ANTHROPIC_ENVIRONMENT_KEY = sk-ant-oat01-...; rotate via wrangler"

PO retains authority + immediate ownership; the credential value is in chat for ≤1 session-turn before context-firewall step.

### Step 2 -- Coordinator Writes Ephemeral File Outside Repo (Context-Firewall)

Coordinator (Aen) writes the credential to a file at a path outside the repo (`$HOME/.cma-creds-temp.json` or similar). Three load-bearing properties of this step:

- **File path is outside the repo** -- prevents accidental git-commit of the credential. The repo's `.gitignore` does not need to know about the file; it physically cannot be `git add`-ed via repo-relative paths.
- **File path is named distinctively** -- operator can find it; cleanup discipline can target it.
- **Credential value lives in coordinator's conversation log + the ephemeral file**, but NOT in the operator's inbox or in the wiki. The coordinator's session is the only one with the chat-paste; the operator sees the file content only.

### Step 3 -- Operator Reads + Uses + Shreds (Guarded)

Operator (Hopper) reads the file, uses the credential value for the Tier-M substrate command, and shreds the file. Critical sub-discipline at this step: the shred must be **conditional on operation success**, NOT on temporal-position in the pipeline.

**Anti-pattern caught in-vivo (S37, 2026-05-27, op-step-2 attempt 1)**:
- Hopper's first attempt at 12:15 bundled the shred into a same-atomic bash pipeline: `wrangler secret put ... && wrangler secret put ... && echo "EXIT_N=$N" && rm -f $CREDS_FILE`.
- The intervening `echo` always returned exit-0, so the `&&` chain executed `rm -f` regardless of wrangler exit codes. When wrangler failed (ambiguous-account), the file was shredded anyway.

**Recovery primitive applied at op-step-2 retry (Hopper, 13:01)** -- decompose into two Bash-tool invocations with the conditional gate at the audit boundary:
1. **Invocation 1** (write + Tier-R verify; NO shred): wrangler-success-confirmation observed + binding-count-verification passed.
2. **Invocation 2** (guarded shred): `[ EXIT_1 -eq 0 ] && [ EXIT_2 -eq 0 ] && [ "$WRANGLER_SUCCESS_VERIFIED" = "true" ] && rm -f $CREDS_FILE`.

Two Bash-tool invocations make the conditional gate visible at the human/audit boundary; bundled pipelines hide the gate inside shell semantics.

## Three Load-Bearing Properties

1. **Credential never enters persisted inbox** -- coordinator's session writes to ephemeral file; operator's session reads from file; no SendMessage contains the credential value. Inbox files do not contain the credential at any point.
2. **Context-firewall is at file-system boundary** -- the file path is the firewall between coordinator's session and operator's session. The credential is materialized once (in the file), used once (by the operator), and shredded.
3. **Shred is exit-code-conditional, not temporal-position** -- the operator-side discipline gap (bundled shred) is the canonical failure mode. The recovery primitive decomposes the operation into structurally-separate invocations with explicit success-conditional cleanup.

## S37 In-Vivo Validation (Canonical Instance)

S37 2026-05-27 op-step-2 (Round-1 credential split on Worker `secret_text` bindings) is the canonical instance:

| Step | Action | Outcome |
|---|---|---|
| 1 -- PO Paste 11:50 | PO pasted `sk-ant-api03-...` + `sk-ant-oat01-...` values into chat with rotation sanction. | Credential in PO + Aen sessions only |
| 2 -- Aen Writes 12:05 | Aen wrote ephemeral file outside repo with both credential values. | File materialized; Aen session has paste + file path; operator session has file path only |
| 3a -- Hopper Attempt 1 12:15 | Bundled shred in `&&` pipeline; wrangler ambiguous-account failure; file shredded anyway. | Failed pre-API; **discipline gap self-surfaced** |
| 3b -- Hopper Retry 13:01 | Decomposed into two Bash-tool invocations; explicit `[ EXIT_1 -eq 0 ] && [ EXIT_2 -eq 0 ] && ...` guard. | Success on first attempt; shred fired correctly on conjoined-success preconditions; file removed; `[ -e "$CREDS_FILE" ]` confirmed gone |

**Validation outcome**:
- Temp-file-as-context-firewall pattern is **sound** -- failure modes were NOT at the handoff layer.
- Shred discipline gap (operator-tier) recovered cleanly via structural decomposition.
- Substrate-side wrangler ambiguity (unrelated to handoff) recovered via `CLOUDFLARE_ACCOUNT_ID` env-var per layer-0-library-first.
- Credential never persisted to inbox; never persisted to wiki; never persisted to git history.

## Composition With Other Disciplines

- [`documentation-vs-substrate-truth-divergence.md`](documentation-vs-substrate-truth-divergence.md) -- Instance 3 of that entry (bundled-shred discipline-language-under-specification) is exactly the operator-tier failure mode caught at op-step-2 attempt 1. The pattern relationship: this entry is the **handoff structure**; the Candidate A entry catalogs the **authoring-tier failure** in dispatch language ("shred after both succeed"). The defenses compose: substrate-mechanism-precise discipline-naming at authoring time (`[ EXIT_1 -eq 0 ] && [ EXIT_2 -eq 0 ] && rm`) + structural decomposition at operator time.
- [`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md) -- three-role stack maps cleanly onto the pattern's three steps: PO-as-credential-source / coordinator (Aen)-vantage at Step 2 / operator (Hopper)-vantage at Step 3. The pattern is **how the three-role stack instantiates for credential operations** specifically.
- [`embedded-github-token-in-git-config.md`](../gotchas/embedded-github-token-in-git-config.md) -- anti-pattern at the persistence layer (credentials persisted to `.git/config` via clone_or_pull pipeline); this entry's pattern explicitly avoids the same defect-class at the inbox-persistence layer.
- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) -- bundled-shred operator-tier discipline gap is a substrate-invariant-mismatch instance at the bash-`&&`-chain-semantics layer (Hopper's discipline-language assumed transitive-success-conditional; substrate semantics are immediately-prior-exit-code-conditional).

## Known Edge Cases

1. **Shred discipline gap (operator-tier)** -- canonical failure mode caught at S37 op-step-2 attempt 1. Recovery: structural decomposition of operations to surface conditional gate at audit boundary.
2. **Substrate config ambiguity** -- wrangler ambiguous-account error caught at S37 op-step-2 attempt 1 (unrelated to handoff; recovered via `CLOUDFLARE_ACCOUNT_ID` env-var per layer-0-library-first).
3. **Coordinator session credential-in-context** -- coordinator's conversation log has the PO paste transiently. This is the residual context-firewall hole; in single-session use, the conversation log is ephemeral (not persisted to inbox or wiki). If the coordinator session is persisted (scratchpad, ops-log), the paste must be redacted explicitly.

## Promotion-Posture

**Confidence medium** at filing -- n=1 in-vivo canonical instance with two failure modes caught + recovered + structural decomposition discipline named. **Not promotion-grade alone** at this n-count; the pattern is **filing-grade as a credential-handling reference pattern** per S37 dispatch framing.

**Promotion to confidence-high** at n=2 cross-instance -- second team or second session using the temp-file-as-context-firewall pattern for credential handoff with the same load-bearing properties. Cross-team confirmation distinguishes FR-discipline-culture vs framework-invariant; the pattern is structurally substrate-invariant.

**Watchpoint**: shred-discipline-gap-as-sub-instance candidate (candidate B in S37 queue) is frozen at n=1 in Hopper's scratchpad; promotes to its own entry only at n=2. The current entry catalogs the recovery discipline (structural decomposition); the shred-discipline-gap itself remains scratchpad-grade as a sub-pattern of this entry.

## What This Is NOT

- **Not "the only safe credential handoff pattern"** -- alternative patterns exist (env-var injection from CI/CD system; secret-manager substrate API; hardware-token-based authentication). This pattern's niche is **session-mediated handoff** where PO authority + coordinator session + operator session are distinct, and the credential must transit between them.
- **Not a substitute for substrate-managed secret rotation** -- once credentials are in Worker `secret_text` bindings (Round-1 outcome), substrate-managed rotation via wrangler is the canonical mechanism. This pattern is the **initial handoff** to get credentials into substrate-managed storage.
- **Not bullet-proof against all leakage paths** -- coordinator's transient conversation-log paste is the residual context-firewall hole. If conversation logs are persisted, explicit redaction is required.
- **Not "shred discipline is automatic"** -- the canonical failure mode (S37 attempt 1) is bundled-shred + intervening-statement breaking the `&&` chain. The operator-tier discipline (structural decomposition) is part of the pattern.

## Forward-Watchpoints

- **n=2 cross-instance** -- second team or second session using the pattern; promotes confidence to high.
- **Cross-org confirmation** -- pattern observed in any non-EVR engineering team distinguishes EVR-culture vs industry-invariant. Pattern is structurally substrate-invariant; expected to surface in similar shapes.
- **Coordinator-session-persistence-fix** -- if coordinator scratchpad commit captures PO paste, redact pre-commit; sub-discipline candidate at n=2.

(*FR:Callimachus*)
