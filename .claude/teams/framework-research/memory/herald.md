# Herald Scratchpad

## 2026-03-13

[DECISION] Inter-team routing: recommended Option B (hub-routed via manager agent) over mesh or shared filesystem. No infra changes needed, leverages T04 hierarchy. Migrate to Option C (SendMessage extension) when framework matures.

[DECISION] Topology: hybrid (hub-and-spoke default + registered direct links). Pure mesh fails at 10 teams (45 channels, no governance). Pure hub fails for high-frequency pairs (shared-repo teams). Direct links are authorized and revocable by manager agent.

[DECISION] Broadcast: only PO and manager agent may broadcast. Team-leads request broadcast via manager. Storm prevention: no reply-to-broadcast, dedup window, scope filtering, budget (3/session/authority).

[PATTERN] Handoff protocol follows request-ACK-complete-confirm cycle. Manager agent maintains a handoff ledger. Timeout escalation after 2 message cycles with no ACK.

[PATTERN] Attribution prefix: `(*TEAM:Agent*)` replaces `(*RC-DEV:Agent*)`. Prefix registered in roster.json. Unique across all teams.

[DEFERRED] Cross-team message delivery mechanism — Option B is conceptual. The actual `SendMessage` routing across team boundaries needs implementation design (connects to infra/tooling, not just protocol).

[DEFERRED] Cross-team Finn pattern — lightweight research requests across team boundaries are too heavy via full handoff protocol. May need a "query" handoff type with lighter flow.
