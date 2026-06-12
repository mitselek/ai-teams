# gotchas/ — Card Index

21 cards. Each card is a ~30-line extractive summary (TLDR + Key ideas) of the full entry one level up at `gotchas/<name>.md`. (*FR:Callimachus*)

**Stage-2-confirms gate** (#70): each card carries a `stage-2` field. gotchas/ — **17 confirmed, 4 pending** (three-bucket rule: single-source + architectural-fact = confirmed; multi-author or filed-on-behalf without documented read-back = pending). Audit: `grep -rl 'stage-2: pending' gotchas/cards/`.

| Card | Full entry |
|---|---|
| A Courier Must Originate Routing the Wire Protocol Leaves Undefined | [card](courier-originates-routing-protocol-leaves-undefined.md) · [full](../courier-originates-routing-protocol-leaves-undefined.md) |
| ai-teams Has No NOPASSWD Sudoers — Use docker exec -u root | [card](ai-teams-user-no-sudo-use-docker-exec-root.md) · [full](../ai-teams-user-no-sudo-use-docker-exec-root.md) |
| Cloudflare D1 Migration and Query Gotchas | [card](cloudflare-d1-migration-query.md) · [full](../cloudflare-d1-migration-query.md) |
| Contract Enforcement Gap for Non-Claude Participants | [card](contract-enforcement-gap-non-claude.md) · [full](../contract-enforcement-gap-non-claude.md) |
| Confluence Create-Perm Denial Returns 404, Not 403 | [card](create-perm-as-404-disguise.md) · [full](../create-perm-as-404-disguise.md) |
| Cross-Document Prose vs Procedure Drift | [card](cross-document-prose-procedure-drift.md) · [full](../cross-document-prose-procedure-drift.md) |
| Cross-MSYS argv Mangling | [card](cross-msys-argv-mangling.md) · [full](../cross-msys-argv-mangling.md) |
| Dual Team-Dir Ambiguity — Runtime vs. Repo | [card](dual-team-dir-ambiguity.md) · [full](../dual-team-dir-ambiguity.md) |
| Edit-Tool Read-State Expires on Intervening Tool Call (prototype) | [card](edit-tool-read-state-expires-on-intervening-tool-call.md) · [full](../edit-tool-read-state-expires-on-intervening-tool-call.md) |
| Embedded GITHUB_TOKEN in .git/config Survives Rebuilds | [card](embedded-github-token-in-git-config.md) · [full](../embedded-github-token-in-git-config.md) |
| External Synthesis Promotes Cautious Suggestions to Recommendations | [card](external-synthesis-overreach.md) · [full](../external-synthesis-overreach.md) |
| Inbox Drained on Spawn, Cleared Without Deliver | [card](inbox-drained-on-spawn-clear-without-deliver.md) · [full](../inbox-drained-on-spawn-clear-without-deliver.md) |
| Inbox Is a Pending-Only Queue, Not an Accumulating Log (CLI 2.1.170) | [card](inbox-retention-flip-pending-only-queue.md) · [full](../inbox-retention-flip-pending-only-queue.md) |
| Inverted-Trigger Primitives Antipattern on Poll-Based Substrates | [card](inverted-trigger-primitives-antipattern-on-poll-based-substrates.md) · [full](../inverted-trigger-primitives-antipattern-on-poll-based-substrates.md) |
| jq File Parser vs Command-Line Arg Parser Escape Divergence | [card](jq-file-vs-arg-escape-divergence.md) · [full](../jq-file-vs-arg-escape-divergence.md) |
| persist-project-state.sh Leaks Per-User Auto-Memory | [card](persist-project-state-leaks-per-user-memory.md) · [full](../persist-project-state-leaks-per-user-memory.md) |
| Per-Filesystem Gate Targeting /tmp Measures the Wrong Filesystem | [card](per-filesystem-gate-targets-tmp-measures-wrong-fs.md) · [full](../per-filesystem-gate-targets-tmp-measures-wrong-fs.md) |
| Subagent Harness Blocks Curator-Role Repo Write | [card](subagent-harness-blocks-curator-role-repo-write.md) · [full](../subagent-harness-blocks-curator-role-repo-write.md) |
| TeamCreate In-Memory Leadership Survives /clear | [card](teamcreate-in-memory-leadership-survives-clear.md) · [full](../teamcreate-in-memory-leadership-survives-clear.md) |
| tmux Pane Labels Show Role IDs, Not Persona Names | [card](tmux-pane-labels-decoupled-from-personas.md) · [full](../tmux-pane-labels-decoupled-from-personas.md) |
| WARP DNS vs. Routing Asymmetry on RC Host | [card](warp-dns-vs-routing-asymmetry-rc-host.md) · [full](../warp-dns-vs-routing-asymmetry-rc-host.md) |
