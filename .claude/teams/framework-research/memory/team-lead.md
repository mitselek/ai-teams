# Team-Lead Scratchpad (*FR:team-lead*)

## Session: 2026-03-14 (R6)

[CHECKPOINT] R6-early startup: COLD START (anomalous, same as R5 — runtime dir missing). User approved proceeding. 6 inboxes restored from repo. config.json appeared immediately after TeamCreate.
[CHECKPOINT] R6-early agents spawned: celes, volta, brunel. All reported in successfully.

### Cross-container comms
[DECISION] Cross-container comms with comms-dev established via shared UDS broker. Brunel set up FR broker.
[LEARNED] Bridge bug (5f2aebc) — agent inbox files crash the bridge. Brunel pulled fix, restarted broker.
[LEARNED] Team-lead messages may not route cross-container reliably — agent-to-agent messages work. Used Volta as relay for settings.json question.
[LEARNED] Outbound FR→CD worked; inbound CD→FR was intermittent due to bridge bug.

### Issue #7: Central relay service RFC
[DECISION] Accepted comms-dev's pivot from P2P UDS to cloud-hosted WSS relay.
[DECISION] PO requirements: no shared infra assumption (teams globally distributed), future-proof for web chat + separate conversations.
[DECISION] Separate `comms-relay/` codebase — relay is infrastructure, not a team service.
[DECISION] Two-secret model: RELAY_TOKEN (relay auth) + COMMS_PSK (E2E payload encryption).
[DECISION] 3 blocking decisions unblocked: (1) best-effort in-memory queue + RELAY_RESTARTED signal, (2) EXPIRED notification to sender, (3) sender-assigned conversation_id with default "default".
[DECISION] PO: go full Cloudflare stack — Durable Objects (relay), D1 (SQLite), Workers (API), Pages (frontend). Matches RC-team pattern.

### Issue #8: Web frontend RFC
[DECISION] WebAuthn/passkeys for browser auth (algorithm is authenticator's choice).
[DECISION] Transport-only TLS for v1 (relay becomes trusted intermediary with COMMS_PSK — trust escalation documented).
[DECISION] SQLite (D1) from day one — in-memory web chat history is a demo, not a product.
[DECISION] Multi-device: yes, per-connection auth, fan-out delivery.
[DECISION] Scope: v2 after #7 ships.
[DECISION] Deployment: relay DO + Worker on CF, SvelteKit on CF Pages (adapter-cloudflare), TailwindCSS 4.
[LEARNED] WebAuthn is origin-bound — PO needs a domain before E2E testing. rpId must cover both frontend and relay subdomains.
[LEARNED] DO hibernation gotcha: routing table lost on eviction, must rebuild from socket tags. Store-and-forward queue → DO Storage, TTL sweep → DO Alarm.
[LEARNED] D1 gotchas from RC-team: multi-statement queries unreliable, PRAGMA foreign_keys is no-op in migration runner.

### Celes: Lovelace hire for comms-dev
[DECISION] Lovelace hire approved by PO. Frontend specialist for comms-dev. SvelteKit + WebAuthn + WSS client. Sonnet tier.

## R6 session (2026-03-14 evening)
[CHECKPOINT] R6 startup. Scratchpad from R5 survived — R5-1 verification SUCCESS.
[LEARNED] R5 scratchpad persisted correctly across session boundary. The fix (write scratchpad before shutdown) works.
[LEARNED] No Agent tool available to team-lead — PO must spawn teammates. This caused team-lead-2 naming (PO registered as team-lead by TeamCreate).
[CHECKPOINT] R6 tasks completed: Volta (B+ startup assessment), Finn (T02 deep research), Herald (5 resource protocols R1-R5), Medici (health report v5), Brunel (T06 container review + broker sidecar), Celes (Richelieu manager-agent role).
[DECISION] Richelieu manager-agent role approved — GitHub issue #10. Level 1 coordinator above team-leads.
[DECISION] roster.json workDir fixed: mitselek-ai-teams → mitselek/ai-teams.

## Previous session notes (R5)
- R5 Grade B (best ever). Inbox durability validated.
- Volta has R6 assessment questions prepared.
