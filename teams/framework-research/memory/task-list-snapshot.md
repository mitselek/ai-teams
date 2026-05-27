# Task list snapshot — S36 close (2026-05-26 → 2026-05-27)

Snapshot at session-end per shutdown procedure S2b. Supersedes S35 snapshot.

| # | Status | Owner | Subject | Notes / next concrete action |
|---|---|---|---|---|
| 1 | in_progress | hopper | Round 1 op-step-1: Path-rule bypass on /webhooks + Round 0 verification | **TOKEN-PENDING — sole blocker.** Full 4-deliverable Hopper prep package on disk. PO 14:40 sanction verbatim valid for 14:34-with-`destinations[]` shape. On token: pre-flight verify → Tier-R L3 batch → STOP at surface-back gate → PO clearance via Aen → Tier-D bypass POST → 30-60s propagation → 3-probe verification → ops-log entry. ~5-10 min. |
| 2 | completed | brunel | Round 1 substrate.md exec-readiness review | Closed S36. Amendment queued post-Round-1 per Brunel. |
| 3 | completed | volta | Round 1 lifecycle.md exec-readiness review | Closed S36. §VL3.1+§VL4.1+§VL5.1+PT4 shipped. |
| 4 | completed | herald | Round 1 comms.md exec-readiness review | Closed S36. v1.0 → v1.4 shipped (~580 lines wire-ready). |
| 5 | in_progress | callimachus | Cal-Protocol-A queue absorption (S35 carry-over) | 8 entries shipped this session (Wiki 107 → 114) + 2 amendments. ~7 candidates fully framed for S37: Edit-tool-trap (promotion-grade joint Cal+Finn; Finn mechanism correction folded — Write invalidates Read-state); C2 substrate-vs-framework boundary primitive; S6 drafting-vs-read-back-phase narrowing; Stage-2-feedback typology Cal+Volta (5 shapes); cadence-crossing E4 Aen+Herald-n=6 + asymmetric-cross-3-vector Cal+Aen; routing-by-action pattern+failure-mode paired; Stage-0-contribution-from-filer. Plus 3 Stage-2 absorption residuals (Recursive-Narrowing, 2.7, Layer-0). |
| 6 | completed | finn | Webhook trigger + Sandboxes API research | Closed S36. 4 docs shipped at `teams/framework-research/docs/`. |
| 7 | pending | celes | Standby + Brunel-Amendment parallel-to-Hopper-4 queueing | S35 carry-over; dormant unless PO surfaces. |
| 8 | pending | medici | Standby for periodic health audit | Dormant; trigger on Cal-queue-absorbed-meaningful-surface OR PO direct. |
| 9 | in_progress | monte | Standby + manager-team architecture watch | Dormant since 2026-05-20; PO floated, not actioned. |
| 10 | pending | (PO-decision) | Round 1 op-step-2 prep: Anthropic credential shape (Finn Q1) | Load-bearing post-W4. `sessions.create` scope is the new required capability. Single-OAuth-token vs three-credential split (WEBHOOK_SECRET + ANTHROPIC_ENVIRONMENT_KEY + ANTHROPIC_API_KEY) per CMA reference impl. Finn brief `docs/webhook-sandbox-research-2026-05-26.md` §2 enumerates failure modes. |
| 11 | pending | hopper | Round 1 readiness gap: Step-5 wake mechanism (inverted Anthropic trigger) | **FUNCTIONALLY RESOLVED** by Finn W4 brief at `docs/wake-mechanism-w4-finding-2026-05-26.md`. Hopper flips status on absorb. W4 = W1-shape (sessions.create) ratified; W2/W3 falsified. |

## S37 first-action forecast

PO delivers token → spawn Hopper → Path D execution per `docs/cf-pilot-status-and-s37-plan-2026-05-26.md` (the canonical S37 brief). Round-1 op-step-1 closes. If PO bandwidth allows: op-step-2 (credential decision + Pilot-A dashboard creation) follows in same window.

(*FR:Aen*)
