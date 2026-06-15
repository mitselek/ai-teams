# Task List Snapshot — S52 close (2026-06-15) (*FR:Aen*)

Snapshot at session-end per shutdown procedure S2b. Supersedes S51 snapshot. (TaskList tool itself was empty this session — S52 work coordinated via SendMessage + per-agent scratchpads + ops-log.)

| # | Status | Task | Note |
|---|--------|------|------|
| 5 | ✅ **COMPLETE + PROVEN** | Harden apex container: supervisor + build-time key (FR-executed) | **S52 LEAD ITEM DONE.** PR #165 (6 commits) on `Eesti-Raudtee/apex-migration-research`, branch `fr/apex-container-hardening-s52`, awaiting apex review/merge. Round-trip proven live (apex woke, courier delivered). ASK-1 (both halves) + ASK-2 (private+host key) + inbox-dir + GH_TOKEN + dashboard + lock-pre-clean + sshd-host-key-persist all GREEN. |
| 2 | 🔄 standing watch | apex standing watch | apex now UP; round-trip live. Standing, not closable. |

**Carry-forward into S53** (see team-lead.md NEXT-SESSION BOOT for triggers/actions):
1. Implement queued courier-ref/persist fixes — boot_id lock-staleness / inject down-agent occupied-inbox / .claude.json persist (preserve-not-reset). HOLD until PO go; land via PR.
2. apex merges PR #165 → return rc build-source from FR branch to `main` (ORDERING: persist .claude.json before that rebuild or it re-wipes).
3. Spawn Cal → file the 7 parked knowledge items + the "inventory-every-ephemeral-home-path" framework finding.
4. Unchanged carries: GitHub retention-flip (PO go), A1 audit overdue (S44), hr-devs 3rd customer.
